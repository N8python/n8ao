import model from './NeuralUpsampleModel.json';

// Learned depth-aware upsampling for half-resolution AO, used in place of the compositor's fixed
// 3x3 bilateral blend when neural denoising runs at half resolution. Each of the 9 half-res
// neighbours is described by six features (its AO, its signed height above the pixel's tangent
// plane and its in-plane distance, both in half-res pixel widths, normal agreement, and its
// screen offset), encoded by one Linear+ReLU layer into a token. A blend weight comes from each
// token; the softmax-weighted AO plus a small head's residual on the blended tokens is the result.
//
// The model was trained on N8AO's Metal port, so this follows its conventions where WebGL's
// own loop differs: neighbours are clamped to the half-res texture, positions are taken at
// half-res pixel centers, and screen y points down the image. The half-res AO target keeps only
// the normal's x and y (its alpha is the accumulation weight), so z is rebuilt facing the camera,
// as it was in training. Weights are baked in as constants and feature normalization is folded
// into the token layer.

const FEATURES = 6;
const TOKEN_WIDTH = model.tokenWidth;
const HEAD_WIDTH = model.headWidth;

const LAYOUTS = [
    ['featureMean', FEATURES],
    ['featureInverseStandardDeviation', FEATURES],
    ['tokenWeights', TOKEN_WIDTH * FEATURES],
    ['tokenBias', TOKEN_WIDTH],
    ['logitWeights', TOKEN_WIDTH],
    ['headWeights', HEAD_WIDTH * TOKEN_WIDTH],
    ['headBias', HEAD_WIDTH],
    ['outputWeights', HEAD_WIDTH]
];

if (
    model.architecture !== 'upsample-attention'
    || model.formatVersion !== 1
    || ![TOKEN_WIDTH, HEAD_WIDTH].every((value) => Number.isInteger(value) && value > 0)
    || !Number.isFinite(model.logitBias)
    || !Number.isFinite(model.outputBias)
    || LAYOUTS.some(([field, length]) => (
        model[field]?.length !== length || model[field].some((value) => !Number.isFinite(value))
    ))
) {
    throw new Error('The bundled N8AO neural upsample model has an unsupported layout.');
}

const glslFloat = (value) => {
    if (value === 0) {
        return '0.0';
    }
    const text = Math.fround(value).toPrecision(9).replace(/\.?0+(e|$)/, '$1');
    return /[.eE]/.test(text) ? text : `${text}.0`;
};
const weightedTerm = (coefficient, input) => (
    coefficient === 0 ? null : `${glslFloat(coefficient)} * ${input}`
);
const sumTerms = (terms) => terms.filter(Boolean).join(' + ') || '0.0';
const range = (length) => Array.from({ length }, (_, index) => index);

// Token layer with normalization folded in: t_j = b_j + sum_i w_ji * (f_i - mean_i) * inv_i.
const tokenLayer = range(TOKEN_WIDTH).map((row) => {
    let offset = model.tokenBias[row];
    const coefficients = range(FEATURES).map((column) => {
        const weight = model.tokenWeights[row * FEATURES + column]
            * model.featureInverseStandardDeviation[column];
        offset -= weight * model.featureMean[column];
        return weight;
    });
    return { offset, coefficients };
});

const zeros = (length) => `float[${length}](${new Array(length).fill('0.0').join(', ')})`;

// Expects worldPos (view space) and normal at the full-resolution pixel, and the compositor's
// tDiffuse (half-res AO, normal in .gba), downsampledDepth, resolution, projectionMatrixInv,
// getWorldPos and vUv.
const neuralUpsampleShader = `
    float neuralUpsample(vec3 worldPos, vec3 normal) {
        ivec2 halfSize = textureSize(tDiffuse, 0);
        vec2 pixelCenter = vUv * resolution * 0.5;
        ivec2 base = min(ivec2(pixelCenter), halfSize - 1);
        // View-space width of one half-res pixel at this depth.
        float footprint = max(2.0 * abs(worldPos.z) * projectionMatrixInv[1][1] / float(halfSize.y), 1e-6);
        float total = 0.0;
        float blendedAO = 0.0;
        float summary[${TOKEN_WIDTH}] = ${zeros(TOKEN_WIDTH)};
        for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
                ivec2 p = clamp(base + ivec2(x, y), ivec2(0), halfSize - 1);
                vec4 sampleInfo = texelFetch(tDiffuse, p, 0);
                vec3 delta = getWorldPos(texelFetch(downsampledDepth, p, 0).x, (vec2(p) + 0.5) / vec2(halfSize))
                    - worldPos;
                float height = dot(delta, normal) / footprint;
                float inPlane = sqrt(max(dot(delta, delta) / (footprint * footprint) - height * height, 0.0));
                vec2 screen = vec2(p) + 0.5 - pixelCenter;
                vec2 normalXY = sampleInfo.gb * 2.0 - 1.0;
                vec3 sampleNormal = vec3(normalXY, sqrt(max(1.0 - dot(normalXY, normalXY), 0.0)));
                float f[${FEATURES}] = float[${FEATURES}](
                    sampleInfo.r,
                    sign(height) * log(1.0 + abs(height)),
                    log(1.0 + inPlane),
                    dot(normal, sampleNormal),
                    screen.x,
                    -screen.y
                );
${tokenLayer.map(({ offset, coefficients }, row) => `                float token${row} = max(${sumTerms([
        glslFloat(offset),
        ...coefficients.map((coefficient, column) => weightedTerm(coefficient, `f[${column}]`))
    ])}, 0.0);`).join('\n')}
                // Logits stay small, so the softmax needs no running maximum; the clamp only
                // guards against overflow.
                float weight = exp(clamp(${sumTerms([
        glslFloat(model.logitBias),
        ...range(TOKEN_WIDTH).map((column) => weightedTerm(model.logitWeights[column], `token${column}`))
    ])}, -60.0, 60.0));
                total += weight;
                blendedAO += weight * sampleInfo.r;
${range(TOKEN_WIDTH).map((column) => `                summary[${column}] += weight * token${column};`).join('\n')}
            }
        }
        float inverseTotal = 1.0 / total;
${range(HEAD_WIDTH).map((row) => `        float head${row} = max(${sumTerms([
        glslFloat(model.headBias[row]),
        ...range(TOKEN_WIDTH).map((column) => weightedTerm(
            model.headWeights[row * TOKEN_WIDTH + column], `summary[${column}] * inverseTotal`
        ))
    ])}, 0.0);`).join('\n')}
        return clamp(blendedAO * inverseTotal + ${sumTerms([
        glslFloat(model.outputBias),
        ...range(HEAD_WIDTH).map((row) => weightedTerm(model.outputWeights[row], `head${row}`))
    ])}, 0.0, 1.0);
    }
`;

export { model as neuralUpsampleModel, neuralUpsampleShader };
