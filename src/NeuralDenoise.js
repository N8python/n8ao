import generalModel from './NeuralDenoiseModel.json';
import lowEndModel from './NeuralDenoiseLowEndModel.json';
import halfResModel from './NeuralDenoiseHalfResModel.json';
import halfResLowEndModel from './NeuralDenoiseHalfResLowEndModel.json';

// Attention residual denoiser applied in the second denoise pass. Each geometry tap is
// encoded from five frame-invariant features (in-plane distance, signed height, normal
// agreement, tap AO and tangent-plane distance) by one Linear+ReLU layer. Four queries
// come from the center pixel's first-pass AO, radius, falloff and view direction before
// the tap loop; a center token built from the final bilateral AO is attended to last, and
// a small head turns the four attention summaries into an AO residual.
//
// Everything is fully unrolled with the weights baked in as constants, and feature
// normalization is folded into the first layers. A shader is generated per configuration,
// so a model's log2(aoSamples) center input is a constant folded into the center bias.
//
// Models are tried in order and the first trained for the configuration's resolution whose
// supported ranges cover it is used: a specialist trained on 4-8 AO samples and 2-8 denoise
// taps, then a general model trained at 16 AO samples and tested across 4-64 AO samples and
// 2-16 taps. Each pair exists twice: trained at full resolution (denoise radius 12) and on
// half-resolution data (denoise radius 12 in half-res pixels, i.e. 24 screen pixels), which
// moves less in motion than the full-resolution pair at half resolution.
const MODELS = [lowEndModel, generalModel, halfResLowEndModel, halfResModel];

const TAP_FEATURES = 5;
// AO, log radius, log falloff and the view direction in the tangent frame.
const CENTER_FEATURES = 6;

const layouts = (model) => {
    const tokenWidth = model.tokenWidth;
    const queryWidth = model.queryCount * tokenWidth;
    const centerInputs = CENTER_FEATURES + (model.aoCountFeature ? 1 : 0);
    return [
        ['tapInputWeights', tokenWidth * TAP_FEATURES],
        ['tapInputBias', tokenWidth],
        ['tapFeatureMean', TAP_FEATURES],
        ['tapFeatureInverseStandardDeviation', TAP_FEATURES],
        ['globalWeights', tokenWidth * centerInputs],
        ['globalBias', tokenWidth],
        ['globalFeatureMean', centerInputs],
        ['globalFeatureInverseStandardDeviation', centerInputs],
        ['summaryQueries', queryWidth],
        ['queryProjectionWeights', queryWidth * tokenWidth],
        ['keyProjectionWeights', tokenWidth * tokenWidth],
        ['valueProjectionWeights', tokenWidth * tokenWidth],
        ['headWeights', model.headWidth * queryWidth],
        ['headBias', model.headWidth],
        ['outputWeights', model.headWidth]
    ];
};

const isRange = (value) => (
    value?.length === 2 && value.every(Number.isInteger) && value[0] >= 1 && value[0] <= value[1]
);

for (const model of MODELS) {
    if (
        model.architecture !== 'attention-v3-pilot'
        || model.formatVersion !== 5
        || (model.halfResolution !== undefined && typeof model.halfResolution !== 'boolean')
        || !isRange(model.supportedAOSamples)
        || !isRange(model.supportedDenoiseSamples)
        || model.supportedDenoiseSamples[1] > 16
        || !model.dynamicQueries
        || !model.queryFromFirstPassAO
        || !model.viewFeatures
        || model.tapCountFeature
        || model.tapFeatureVersion !== 5
        || model.tapEncoder !== 'linear-relu'
        || model.attention !== 'softmax'
        || ![model.tokenWidth, model.queryCount, model.headWidth]
            .every((value) => Number.isInteger(value) && value > 0)
        || !Number.isFinite(model.outputBias)
        || layouts(model).some(([field, length]) => (
            model[field]?.length !== length || model[field].some((value) => !Number.isFinite(value))
        ))
    ) {
        throw new Error(`The bundled N8AO neural denoise model ${model.name} has an unsupported layout.`);
    }
}

const inRange = ([low, high], value) => value >= low && value <= high;

// The model for a configuration, or null when no bundled model supports it.
const neuralModelFor = (aoSamples, denoiseSamples, halfResolution = false) => MODELS.find((model) => (
    Boolean(model.halfResolution) === Boolean(halfResolution)
    && inRange(model.supportedAOSamples, aoSamples) && inRange(model.supportedDenoiseSamples, denoiseSamples)
)) ?? null;

const glslFloat = (value) => {
    if (!Number.isFinite(value)) {
        throw new Error('The bundled N8AO neural model contains a non-finite value.');
    }
    if (value === 0) {
        return '0.0';
    }
    const text = Math.fround(value).toPrecision(9).replace(/\.?0+(e|$)/, '$1');
    return /[.eE]/.test(text) ? text : `${text}.0`;
};

const weightedTerm = (coefficient, input) => (
    coefficient === 0 ? null : `${glslFloat(coefficient)} * ${input}`
);
const constantTerm = (value) => (value === 0 ? null : glslFloat(value));
const sumTerms = (terms) => terms.filter(Boolean).join(' + ') || '0.0';
const range = (length) => Array.from({ length }, (_, index) => index);

// Linear layer with normalization folded in: y_j = b_j + sum_i w_ji * (x_i - mean_i) * inv_i.
// Inputs past the shader's own (`constants`) are known when the shader is generated and are
// folded into the offset.
const foldedLinear = (weights, bias, means, inverseStandardDeviations, rows, columns, constants = []) => {
    const totalColumns = columns + constants.length;
    return range(rows).map((row) => {
        let offset = bias[row];
        const coefficients = range(totalColumns).map((column) => {
            const weight = weights[row * totalColumns + column] * inverseStandardDeviations[column];
            offset -= weight * means[column];
            return weight;
        });
        constants.forEach((value, index) => {
            offset += coefficients[columns + index] * value;
        });
        return { offset, coefficients: coefficients.slice(0, columns) };
    });
};

const encoderShader = (functionName, layer, inputs) => `
    void ${functionName}(float raw[${inputs}], out float token[NEURAL_TOKEN_WIDTH]) {
${layer.map(({ offset, coefficients }, row) => `        token[${row}] = max(${sumTerms([
        constantTerm(offset),
        ...coefficients.map((coefficient, column) => weightedTerm(coefficient, `raw[${column}]`))
    ])}, 0.0);`).join('\n')}
    }
`;

const zeros = (length) => `float[${length}](${new Array(length).fill('0.0').join(', ')})`;

const generateShader = (model, aoSamples) => {
    const tokenWidth = model.tokenWidth;
    const queryCount = model.queryCount;
    const headWidth = model.headWidth;
    const queryWidth = queryCount * tokenWidth;

    const tapEncoderShader = encoderShader('neuralEncodeTap', foldedLinear(
        model.tapInputWeights,
        model.tapInputBias,
        model.tapFeatureMean,
        model.tapFeatureInverseStandardDeviation,
        tokenWidth,
        TAP_FEATURES
    ), TAP_FEATURES);

    const centerEncoderShader = encoderShader('neuralEncodeCenter', foldedLinear(
        model.globalWeights,
        model.globalBias,
        model.globalFeatureMean,
        model.globalFeatureInverseStandardDeviation,
        tokenWidth,
        CENTER_FEATURES,
        model.aoCountFeature ? [Math.log2(aoSamples)] : []
    ), CENTER_FEATURES);

    // The key projection is folded into the queries and the value projection into the head, so
    // a tap costs one dot product per query instead of two 6x6 projections plus the dot products:
    //   score_q = s * q_q . (K t) = (s K^T q_q) . t, and summing V t over taps equals V (sum of t).
    // neuralMakeQueries therefore returns s K^T q (still width x queries), neuralAttend sums
    // weighted tokens rather than values, and neuralHead applies V through its folded weights.
    const scale = 1 / Math.sqrt(tokenWidth);
    const key = (row, column) => model.keyProjectionWeights[row * tokenWidth + column];
    const value = (row, column) => model.valueProjectionWeights[row * tokenWidth + column];
    const foldedQueryWeight = (index, column) => {
        const query = Math.floor(index / tokenWidth);
        const input = index % tokenWidth;
        return scale * range(tokenWidth).reduce((sum, row) => sum + key(row, input)
            * model.queryProjectionWeights[(query * tokenWidth + row) * tokenWidth + column], 0);
    };
    const foldedQueryBias = (index) => {
        const query = Math.floor(index / tokenWidth);
        const input = index % tokenWidth;
        return scale * range(tokenWidth).reduce((sum, row) => sum + key(row, input)
            * model.summaryQueries[query * tokenWidth + row], 0);
    };
    const foldedHeadWeight = (row, index) => {
        const query = Math.floor(index / tokenWidth);
        const input = index % tokenWidth;
        return range(tokenWidth).reduce((sum, output) => sum
            + model.headWeights[row * queryWidth + query * tokenWidth + output] * value(output, input), 0);
    };

    const queryShader = `
    void neuralMakeQueries(float token[NEURAL_TOKEN_WIDTH], out float queries[NEURAL_QUERY_WIDTH]) {
${range(queryWidth).map((index) => `        queries[${index}] = ${sumTerms([
        constantTerm(foldedQueryBias(index)),
        ...range(tokenWidth).map((column) => weightedTerm(foldedQueryWeight(index, column), `token[${column}]`))
    ])};`).join('\n')}
    }
`;

    // Scores stay small, so softmax (shift-invariant) needs no running maximum; the clamp only
    // guards against overflow.
    const attendShader = `
    void neuralAttend(
        float token[NEURAL_TOKEN_WIDTH],
        float queries[NEURAL_QUERY_WIDTH],
        inout float summary[NEURAL_QUERY_WIDTH],
        inout float denominator[NEURAL_QUERY_COUNT]
    ) {
        float weight;
${range(queryCount).map((query) => [
        `        weight = exp(min(${range(tokenWidth)
            .map((column) => `queries[${query * tokenWidth + column}] * token[${column}]`)
            .join(' + ')}, 60.0));`,
        `        denominator[${query}] += weight;`,
        ...range(tokenWidth).map((column) => (
            `        summary[${query * tokenWidth + column}] += weight * token[${column}];`
        ))
    ].join('\n')).join('\n')}
    }
`;

    const headShader = `
    float neuralHead(float summary[NEURAL_QUERY_WIDTH], float denominator[NEURAL_QUERY_COUNT]) {
${range(queryCount).map((query) => (
        `        float inverseDenominator${query} = 1.0 / max(denominator[${query}], 1e-12);`
    )).join('\n')}
${range(headWidth).map((row) => `        float head${row} = max(${sumTerms([
        constantTerm(model.headBias[row]),
        ...range(queryWidth).map((index) => weightedTerm(
            foldedHeadWeight(row, index),
            `summary[${index}] * inverseDenominator${Math.floor(index / tokenWidth)}`
        ))
    ])}, 0.0);`).join('\n')}
        return ${sumTerms([
        constantTerm(model.outputBias),
        ...range(headWidth).map((row) => weightedTerm(model.outputWeights[row], `head${row}`))
    ])};
    }
`;

    return [
        `
    #define NEURAL_TOKEN_WIDTH ${tokenWidth}
    #define NEURAL_QUERY_COUNT ${queryCount}
    #define NEURAL_QUERY_WIDTH ${queryWidth}
    #define NEURAL_ZERO_SUMMARY ${zeros(queryWidth)}
    #define NEURAL_ZERO_DENOMINATOR ${zeros(queryCount)}
`,
        tapEncoderShader,
        centerEncoderShader,
        queryShader,
        attendShader,
        headShader
    ].join('\n');
};

const shaderCache = new Map();

// GLSL for the model that covers this configuration, or null when none does.
const neuralDenoiseShaderFor = (aoSamples, denoiseSamples, halfResolution = false) => {
    const model = neuralModelFor(aoSamples, denoiseSamples, halfResolution);
    if (!model) {
        return null;
    }
    const key = `${model.name}:${model.aoCountFeature ? aoSamples : ''}`;
    if (!shaderCache.has(key)) {
        shaderCache.set(key, generateShader(model, aoSamples));
    }
    return shaderCache.get(key);
};

const neuralParameterCount = (model) => layouts(model)
    .filter(([field]) => !/Mean|InverseStandardDeviation/.test(field))
    .reduce((sum, [, length]) => sum + length, 1);

// The AO and denoise sample ranges some bundled model covers.
const neuralSupportedAOSamples = [
    Math.min(...MODELS.map((model) => model.supportedAOSamples[0])),
    Math.max(...MODELS.map((model) => model.supportedAOSamples[1]))
];
const neuralSupportedDenoiseSamples = [
    Math.min(...MODELS.map((model) => model.supportedDenoiseSamples[0])),
    Math.max(...MODELS.map((model) => model.supportedDenoiseSamples[1]))
];

export {
    MODELS as neuralDenoiseModels,
    neuralModelFor,
    neuralDenoiseShaderFor,
    neuralParameterCount,
    neuralSupportedAOSamples,
    neuralSupportedDenoiseSamples
};
