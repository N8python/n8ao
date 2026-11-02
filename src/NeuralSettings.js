import { neuralModelFor, neuralSupportedAOSamples, neuralSupportedDenoiseSamples } from './NeuralDenoise.js';

// While neural denoising is on, the settings its models depend on are held to what the models
// cover: the denoise radius and iterations they were trained with, and the sample counts they
// support. Writes outside these ranges are refused, so neural denoising never turns itself off.
const NEURAL_LIMITS = {
    aoSamples: { range: neuralSupportedAOSamples, fallback: 16 },
    denoiseSamples: { range: neuralSupportedDenoiseSamples, fallback: 8 },
    denoiseRadius: { range: [12, 12], fallback: 12 },
    denoiseIterations: { range: [2, 2], fallback: 2 }
};

const withinNeuralLimits = (name, value) => {
    const [low, high] = NEURAL_LIMITS[name].range;
    return value >= low && value <= high;
};

// The error for writing value to the named setting while neural denoising is on, or null if it is allowed.
const neuralRefusal = (name, value) => {
    if (!(name in NEURAL_LIMITS) || withinNeuralLimits(name, value)) {
        return null;
    }
    const [low, high] = NEURAL_LIMITS[name].range;
    const allowed = low === high ? `stays ${low}` : `is ${low}-${high}`;
    return `[N8AO] ${name} ${allowed} while neuralDenoise is on, so ${value} was ignored. `
        + `Turn neuralDenoise off to change it.`;
};

// Moves the settings into the neural limits. Returns the values it replaced, to put back later.
const lockForNeural = (settings) => {
    const replaced = {};
    for (const [name, { fallback }] of Object.entries(NEURAL_LIMITS)) {
        if (!withinNeuralLimits(name, settings[name])) {
            replaced[name] = { from: settings[name], to: fallback };
            settings[name] = fallback;
        }
    }
    return replaced;
};

// Puts back what lockForNeural replaced, except settings changed since.
const unlockFromNeural = (settings, replaced) => {
    for (const [name, { from, to }] of Object.entries(replaced)) {
        if (settings[name] === to) {
            settings[name] = from;
        }
    }
};

let warnedDepthAwareUpsampling = false;
// depthAwareUpsampling is always on now; the setting is kept so existing code keeps working.
const warnDepthAwareUpsampling = (value) => {
    if (!value && !warnedDepthAwareUpsampling) {
        console.warn('[N8AO] depthAwareUpsampling is always on; setting it to false does nothing.');
        warnedDepthAwareUpsampling = true;
    }
};

// What a pass actually runs with its current configuration.
const effectiveConfigurationOf = (pass) => {
    const configuration = pass.configuration;
    const neural = pass.shouldUseNeuralDenoise();
    const iterations = configuration.denoiseIterations;
    return Object.freeze({
        aoSamples: configuration.aoSamples,
        resolution: configuration.halfRes ? 'half' : 'full',
        denoiser: iterations <= 0 ? 'none' : neural ? 'neural' : 'bilateral',
        neuralModel: neural
            ? neuralModelFor(configuration.aoSamples, configuration.denoiseSamples, configuration.halfRes).name
            : null,
        denoiseSamples: configuration.denoiseSamples,
        denoiseIterations: iterations,
        // In screen pixels. Bilateral denoising keeps its screen size at half resolution; the
        // half-resolution neural models were trained on twice that.
        denoiseRadius: configuration.denoiseRadius * (configuration.halfRes && neural ? 2 : 1),
        upsampling: !configuration.halfRes ? 'none' : neural ? 'learned' : 'depth-aware',
        depthMips: pass.depthMipsSupported
    });
};

export { neuralRefusal, lockForNeural, unlockFromNeural, warnDepthAwareUpsampling, effectiveConfigurationOf };
