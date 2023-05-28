import * as THREE from 'three';
import { Pass } from "three/examples/jsm/postprocessing/Pass.js";
import { FullScreenTriangle } from './FullScreenTriangle.js';
import { EffectShader } from './EffectShader.js';
import { EffectCompositer } from './EffectCompositer.js';
import { PoissionBlur } from './PoissionBlur.js';
import { N8AOPostPass } from './N8AOPostPass.js';
import BlueNoise from './BlueNoise.js';
const bluenoiseBits = Uint8Array.from(atob(BlueNoise), c => c.charCodeAt(0));

/**
 * 
 * @param {*} timerQuery 
 * @param {THREE.WebGLRenderer} gl 
 * @param {N8AOPass} pass 
 */
function checkTimerQuery(timerQuery, gl, pass) {
    const available = gl.getQueryParameter(timerQuery, gl.QUERY_RESULT_AVAILABLE);
    if (available) {
        const elapsedTimeInNs = gl.getQueryParameter(timerQuery, gl.QUERY_RESULT);
        const elapsedTimeInMs = elapsedTimeInNs / 1000000;
        pass.lastTime = elapsedTimeInMs;
    } else {
        // If the result is not available yet, check again after a delay
        setTimeout(() => {
            checkTimerQuery(timerQuery, gl, pass);
        }, 1);
    }
}
class N8AOPass extends Pass {
    /**
     * 
     * @param {THREE.Scene} scene
     * @param {THREE.Camera} camera 
     * @param {number} width 
     * @param {number} height
     *  
     * @property {THREE.Scene} scene
     * @property {THREE.Camera} camera
     * @property {number} width
     * @property {number} height
     */
    constructor(scene, camera, width = 512, height = 512) {
        super();
        this.width = width;
        this.height = height;

        this.clear = true;

        this.camera = camera;
        this.scene = scene;
        /**
         * @type {Proxy & {
         * aoSamples: number,
         * aoRadius: number,
         * denoiseSamples: number,
         * denoiseRadius: number,
         * distanceFalloff: number,
         * intensity: number,
         * denoiseIterations: number,
         * renderMode: 0 | 1 | 2 | 3 | 4,
         * color: THREE.Color,
         * gammaCorrection: Boolean,
         * logarithmicDepthBuffer: Boolean
         * }
         */
        this.configuration = new Proxy({
            aoSamples: 16,
            aoRadius: 5.0,
            denoiseSamples: 8,
            denoiseRadius: 12,
            distanceFalloff: 1.0,
            intensity: 5,
            denoiseIterations: 2.0,
            renderMode: 0,
            color: new THREE.Color(0, 0, 0),
            gammaCorrection: true,
            logarithmicDepthBuffer: false,
            screenSpaceRadius: false
        }, {
            set: (target, propName, value) => {
                const oldProp = target[propName];
                target[propName] = value;
                if (propName === 'aoSamples' && oldProp !== value) {
                    this.configureAOPass(this.configuration.logarithmicDepthBuffer);
                }
                if (propName === 'denoiseSamples' && oldProp !== value) {
                    this.configureDenoisePass(this.configuration.logarithmicDepthBuffer);
                }
                return true;
            }
        });
        /** @type {THREE.Vector3[]} */
        this.samples = [];
        /** @type {number[]} */
        this.samplesR = [];
        /** @type {THREE.Vector2[]} */
        this.samplesDenoise = [];
        this.configureSampleDependentPasses();
        this.effectCompisterQuad = new FullScreenTriangle(new THREE.ShaderMaterial(EffectCompositer));
        this.beautyRenderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.NearestFilter
        });
        this.beautyRenderTarget.depthTexture = new THREE.DepthTexture(this.width, this.height, THREE.UnsignedIntType);
        this.beautyRenderTarget.depthTexture.format = THREE.DepthFormat;

        this.writeTargetInternal = new THREE.WebGLRenderTarget(this.width, this.height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            depthBuffer: false
        });
        this.readTargetInternal = new THREE.WebGLRenderTarget(this.width, this.height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            depthBuffer: false
        });

        /** @type {THREE.DataTexture} */
        this.bluenoise = //bluenoise;
            new THREE.DataTexture(
                bluenoiseBits,
                128,
                128
            );
        this.bluenoise.colorSpace = THREE.NoColorSpace;
        this.bluenoise.wrapS = THREE.RepeatWrapping;
        this.bluenoise.wrapT = THREE.RepeatWrapping;
        this.bluenoise.minFilter = THREE.NearestFilter;
        this.bluenoise.magFilter = THREE.NearestFilter;
        this.bluenoise.needsUpdate = true;
        this.lastTime = 0;
        this._r = new THREE.Vector2();
        this._c = new THREE.Color();

    }
    configureSampleDependentPasses() {
        this.configureAOPass(this.configuration.logarithmicDepthBuffer);
        this.configureDenoisePass(this.configuration.logarithmicDepthBuffer);
    }
    configureAOPass(logarithmicDepthBuffer = false) {
        this.samples = this.generateHemisphereSamples(this.configuration.aoSamples);
        this.samplesR = this.generateHemisphereSamplesR(this.configuration.aoSamples);
        const e = {...EffectShader };
        e.fragmentShader = e.fragmentShader.replace("16", this.configuration.aoSamples).replace("16.0", this.configuration.aoSamples + ".0");
        if (logarithmicDepthBuffer) {
            e.fragmentShader = "#define LOGDEPTH\n" + e.fragmentShader;
        }
        if (this.effectShaderQuad) {
            this.effectShaderQuad.material.dispose();
            this.effectShaderQuad.material = new THREE.ShaderMaterial(e);
        } else {
            this.effectShaderQuad = new FullScreenTriangle(new THREE.ShaderMaterial(e));
        }
    }
    configureDenoisePass(logarithmicDepthBuffer = false) {
            this.samplesDenoise = this.generateDenoiseSamples(this.configuration.denoiseSamples, 11);
            const p = {...PoissionBlur };
            p.fragmentShader = p.fragmentShader.replace("16", this.configuration.denoiseSamples);
            if (logarithmicDepthBuffer) {
                p.fragmentShader = "#define LOGDEPTH\n" + p.fragmentShader;
            }
            if (this.poissonBlurQuad) {
                this.poissonBlurQuad.material.dispose();
                this.poissonBlurQuad.material = new THREE.ShaderMaterial(p);
            } else {
                this.poissonBlurQuad = new FullScreenTriangle(new THREE.ShaderMaterial(p));
            }
        }
        /**
         * 
         * @param {Number} n 
         * @returns {THREE.Vector3[]}
         */
    generateHemisphereSamples(n) {
            const points = [];
            for (let k = 0; k < n; k++) {
                const theta = 2.399963 * k;
                const r = (Math.sqrt(k + 0.5) / Math.sqrt(n));
                const x = r * Math.cos(theta);
                const y = r * Math.sin(theta);
                // Project to hemisphere
                const z = Math.sqrt(1 - (x * x + y * y));
                points.push(new THREE.Vector3(x, y, z));

            }
            return points;
        }
        /**
         * 
         * @param {number} n 
         * @returns {number[]}
         */
    generateHemisphereSamplesR(n) {
            let samplesR = [];
            for (let i = 0; i < n; i++) {
                samplesR.push((i + 1) / n);
            }
            return samplesR;
        }
        /**
         * 
         * @param {number} numSamples 
         * @param {number} numRings 
         * @returns {THREE.Vector2[]}
         */
    generateDenoiseSamples(numSamples, numRings) {
        const angleStep = 2 * Math.PI * numRings / numSamples;
        const invNumSamples = 1.0 / numSamples;
        const radiusStep = invNumSamples;
        const samples = [];
        let radius = invNumSamples;
        let angle = 0;
        for (let i = 0; i < numSamples; i++) {
            samples.push(new THREE.Vector2(Math.cos(angle), Math.sin(angle)).multiplyScalar(Math.pow(radius, 0.75)));
            radius += radiusStep;
            angle += angleStep;
        }
        return samples;
    }
    setSize(width, height) {
        this.width = width;
        this.height = height;
        this.beautyRenderTarget.setSize(width, height);
        this.writeTargetInternal.setSize(width, height);
        this.readTargetInternal.setSize(width, height);
    }
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
            if (renderer.capabilities.logarithmicDepthBuffer !== this.configuration.logarithmicDepthBuffer) {
                this.configuration.logarithmicDepthBuffer = renderer.capabilities.logarithmicDepthBuffer;
                this.configureAOPass(this.configuration.logarithmicDepthBuffer);
                this.configureDenoisePass(this.configuration.logarithmicDepthBuffer);
            }
            let gl;
            let ext;
            let timerQuery;
            if (this.debugMode) {
                gl = renderer.getContext();
                ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
                if (ext === null) {
                    console.error("EXT_disjoint_timer_query_webgl2 not available, disabling debug mode.");
                    this.debugMode = false;
                }
            }
            if (this.debugMode) {
                timerQuery = gl.createQuery();
                gl.beginQuery(ext.TIME_ELAPSED_EXT, timerQuery);
            }
            renderer.setRenderTarget(this.beautyRenderTarget);
            renderer.render(this.scene, this.camera);

            const xrEnabled = renderer.xr.enabled;
            renderer.xr.enabled = false;

            this.camera.updateMatrixWorld();
            this.effectShaderQuad.material.uniforms["sceneDiffuse"].value = this.beautyRenderTarget.texture;
            this.effectShaderQuad.material.uniforms["sceneDepth"].value = this.beautyRenderTarget.depthTexture;
            this.effectShaderQuad.material.uniforms["projMat"].value = this.camera.projectionMatrix;
            this.effectShaderQuad.material.uniforms["viewMat"].value = this.camera.matrixWorldInverse;
            this.effectShaderQuad.material.uniforms["projViewMat"].value = this.camera.projectionMatrix.clone().multiply(this.camera.matrixWorldInverse.clone());
            this.effectShaderQuad.material.uniforms["projectionMatrixInv"].value = this.camera.projectionMatrixInverse;
            this.effectShaderQuad.material.uniforms["viewMatrixInv"].value = this.camera.matrixWorld;
            this.effectShaderQuad.material.uniforms["cameraPos"].value = this.camera.position;
            this._r.set(this.width, this.height);
            this.effectShaderQuad.material.uniforms['resolution'].value = this._r;
            this.effectShaderQuad.material.uniforms['time'].value = performance.now() / 1000;
            this.effectShaderQuad.material.uniforms['samples'].value = this.samples;
            this.effectShaderQuad.material.uniforms['samplesR'].value = this.samplesR;
            this.effectShaderQuad.material.uniforms['bluenoise'].value = this.bluenoise;
            this.effectShaderQuad.material.uniforms['radius'].value = this.configuration.aoRadius;
            this.effectShaderQuad.material.uniforms['distanceFalloff'].value = this.configuration.distanceFalloff;
            this.effectShaderQuad.material.uniforms["near"].value = this.camera.near;
            this.effectShaderQuad.material.uniforms["far"].value = this.camera.far;
            this.effectShaderQuad.material.uniforms["logDepth"].value = renderer.capabilities.logarithmicDepthBuffer;
            this.effectShaderQuad.material.uniforms["ortho"].value = this.camera.isOrthographicCamera;
            this.effectShaderQuad.material.uniforms["screenSpaceRadius"].value = this.configuration.screenSpaceRadius;
            // Start the AO
            renderer.setRenderTarget(this.writeTargetInternal);
            this.effectShaderQuad.render(renderer);
            // End the AO
            // Start the blur
            for (let i = 0; i < this.configuration.denoiseIterations; i++) {
                [this.writeTargetInternal, this.readTargetInternal] = [this.readTargetInternal, this.writeTargetInternal];
                this.poissonBlurQuad.material.uniforms["tDiffuse"].value = this.readTargetInternal.texture;
                this.poissonBlurQuad.material.uniforms["sceneDepth"].value = this.beautyRenderTarget.depthTexture;
                this.poissonBlurQuad.material.uniforms["projMat"].value = this.camera.projectionMatrix;
                this.poissonBlurQuad.material.uniforms["viewMat"].value = this.camera.matrixWorldInverse;
                this.poissonBlurQuad.material.uniforms["projectionMatrixInv"].value = this.camera.projectionMatrixInverse;
                this.poissonBlurQuad.material.uniforms["viewMatrixInv"].value = this.camera.matrixWorld;
                this.poissonBlurQuad.material.uniforms["cameraPos"].value = this.camera.position;
                this.poissonBlurQuad.material.uniforms['resolution'].value = this._r;
                this.poissonBlurQuad.material.uniforms['time'].value = performance.now() / 1000;
                this.poissonBlurQuad.material.uniforms['blueNoise'].value = this.bluenoise;
                this.poissonBlurQuad.material.uniforms['radius'].value = this.configuration.denoiseRadius;
                this.poissonBlurQuad.material.uniforms['distanceFalloff'].value = this.configuration.distanceFalloff;
                this.poissonBlurQuad.material.uniforms['index'].value = i;
                this.poissonBlurQuad.material.uniforms['poissonDisk'].value = this.samplesDenoise;
                this.poissonBlurQuad.material.uniforms["near"].value = this.camera.near;
                this.poissonBlurQuad.material.uniforms["far"].value = this.camera.far;
                this.poissonBlurQuad.material.uniforms["logDepth"].value = renderer.capabilities.logarithmicDepthBuffer;
                this.poissonBlurQuad.material.uniforms["screenSpaceRadius"].value = this.configuration.screenSpaceRadius;
                renderer.setRenderTarget(this.writeTargetInternal);
                this.poissonBlurQuad.render(renderer);

            }
            // Now, we have the blurred AO in writeTargetInternal
            // End the blur
            // Start the composition
            this.effectCompisterQuad.material.uniforms["sceneDiffuse"].value = this.beautyRenderTarget.texture;
            this.effectCompisterQuad.material.uniforms["sceneDepth"].value = this.beautyRenderTarget.depthTexture;
            this.effectCompisterQuad.material.uniforms["resolution"].value = this._r;
            this.effectCompisterQuad.material.uniforms["blueNoise"].value = this.bluenoise;
            this.effectCompisterQuad.material.uniforms["intensity"].value = this.configuration.intensity;
            this.effectCompisterQuad.material.uniforms["renderMode"].value = this.configuration.renderMode;
            this.effectCompisterQuad.material.uniforms["gammaCorrection"].value = this.configuration.gammaCorrection;
            this.effectCompisterQuad.material.uniforms["tDiffuse"].value = this.writeTargetInternal.texture;
            this.effectCompisterQuad.material.uniforms["color"].value = this._c.copy(
                this.configuration.color
            ).convertSRGBToLinear();
            renderer.setRenderTarget(
                this.renderToScreen ? null :
                writeBuffer
            );
            this.effectCompisterQuad.render(renderer);
            if (this.debugMode) {
                gl.endQuery(ext.TIME_ELAPSED_EXT);
                checkTimerQuery(timerQuery, gl, this);
            }

            renderer.xr.enabled = xrEnabled;
        }
        /**
         * Enables the debug mode of the AO, meaning the lastTime value will be updated.
         */
    enableDebugMode() {
            this.debugMode = true;
        }
        /**
         * Disables the debug mode of the AO, meaning the lastTime value will not be updated.
         */
    disableDebugMode() {
            this.debugMode = false;
        }
        /**
         * Sets the display mode of the AO
         * @param {"Combined" | "AO" | "No AO" | "Split" | "Split AO"} mode - The display mode. 
         */
    setDisplayMode(mode) {
            this.configuration.renderMode = ["Combined", "AO", "No AO", "Split", "Split AO"].indexOf(mode);
        }
        /**
         * 
         * @param {"Performance" | "Low" | "Medium" | "High" | "Ultra"} mode 
         */
    setQualityMode(mode) {
        if (mode === "Performance") {
            this.configuration.aoSamples = 8;
            this.configuration.denoiseSamples = 4;
            this.configuration.denoiseRadius = 12;
        } else if (mode === "Low") {
            this.configuration.aoSamples = 16;
            this.configuration.denoiseSamples = 4;
            this.configuration.denoiseRadius = 12;
        } else if (mode === "Medium") {
            this.configuration.aoSamples = 16;
            this.configuration.denoiseSamples = 8;
            this.configuration.denoiseRadius = 12;
        } else if (mode === "High") {
            this.configuration.aoSamples = 64;
            this.configuration.denoiseSamples = 8;
            this.configuration.denoiseRadius = 6;
        } else if (mode === "Ultra") {
            this.configuration.aoSamples = 64;
            this.configuration.denoiseSamples = 16;
            this.configuration.denoiseRadius = 6;
        }

    }
}
export { N8AOPass, N8AOPostPass };