import * as THREE from 'three';
import { FullScreenTriangle } from './FullScreenTriangle.js';

// Coarser copies of the AO pass's depth, read by its far samples so that they stay in the
// texture cache (as in McGuire et al.'s Scalable Ambient Obscurance). Each texel keeps one
// real depth from the level below, picked on a rotated grid, never an average, so coarse
// levels invent no surfaces. Levels 1 to DEPTH_MIP_LEVELS are packed in one float texture:
// level 1 at the top left, the smaller levels side by side below it. Every level is built
// straight from the full depth in a single pass by following the picks down.
const DEPTH_MIP_LEVELS = 6;
// Samples closer than 2^(DEPTH_MIP_BIAS + 1) pixels read the full depth; each doubling of the
// distance after that reads one level coarser.
const DEPTH_MIP_BIAS = 4;

const DepthMipAtlasShader = {
    uniforms: {
        sceneDepth: { value: null },
        // xy: the level's origin in the atlas, zw: its size, for levels 1 to DEPTH_MIP_LEVELS.
        levels: { value: [] },
        baseSize: { value: /* @__PURE__ */ new THREE.Vector2() }
    },
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
    void main() {
        gl_Position = vec4(position, 1.0);
    }`,
    fragmentShader: /* glsl */ `
    #define DEPTH_MIP_LEVELS ${DEPTH_MIP_LEVELS}
    uniform highp sampler2D sceneDepth;
    uniform vec4 levels[DEPTH_MIP_LEVELS];
    uniform vec2 baseSize;
    void main() {
        ivec2 atlasTexel = ivec2(gl_FragCoord.xy);
        float depth = 0.0;
        for (int level = DEPTH_MIP_LEVELS - 1; level >= 0; level--) {
            ivec2 texel = atlasTexel - ivec2(levels[level].xy);
            if (any(lessThan(texel, ivec2(0))) || any(greaterThanEqual(texel, ivec2(levels[level].zw)))) {
                continue;
            }
            // Level k + 1 texel (x, y) keeps level k texel (2x + (y & 1 ^ 1), 2y + (x & 1 ^ 1)).
            for (int below = level - 1; below >= -1; below--) {
                ivec2 belowSize = below < 0 ? ivec2(baseSize) : ivec2(levels[max(below, 0)].zw);
                texel = min(2 * texel + ivec2((texel.y & 1) ^ 1, (texel.x & 1) ^ 1), belowSize - 1);
            }
            depth = texelFetch(sceneDepth, texel, 0).x;
            break;
        }
        gl_FragColor = vec4(depth, 0.0, 0.0, 1.0);
    }`
};

class DepthMipAtlas {
    constructor() {
        this.levels = Array.from({ length: DEPTH_MIP_LEVELS }, () => new THREE.Vector4());
        this.baseSize = new THREE.Vector2();
        this.target = null;
        this.quad = new FullScreenTriangle(new THREE.ShaderMaterial(DepthMipAtlasShader));
    }

    resize(width, height) {
        width = Math.max(1, Math.floor(width));
        height = Math.max(1, Math.floor(height));
        if (this.target && this.baseSize.x === width && this.baseSize.y === height) {
            return;
        }
        this.baseSize.set(width, height);
        let levelWidth = width;
        let levelHeight = height;
        let x = 0;
        for (let level = 0; level < DEPTH_MIP_LEVELS; level++) {
            levelWidth = Math.max(1, levelWidth >> 1);
            levelHeight = Math.max(1, levelHeight >> 1);
            if (level === 0) {
                this.levels[level].set(0, 0, levelWidth, levelHeight);
            } else {
                this.levels[level].set(x, this.levels[0].w, levelWidth, levelHeight);
                x += levelWidth;
            }
        }
        const atlasWidth = Math.max(this.levels[0].z, x);
        const atlasHeight = this.levels[0].w + (DEPTH_MIP_LEVELS > 1 ? this.levels[1].w : 0);
        this.target?.dispose();
        this.target = new THREE.WebGLRenderTarget(atlasWidth, atlasHeight, {
            type: THREE.FloatType,
            format: THREE.RedFormat,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            depthBuffer: false,
            generateMipmaps: false
        });
    }

    // Builds the atlas from the AO pass's depth texture of the given size.
    update(renderer, depthTexture, width, height) {
        this.resize(width, height);
        const uniforms = this.quad.material.uniforms;
        uniforms.sceneDepth.value = depthTexture;
        uniforms.levels.value = this.levels;
        uniforms.baseSize.value = this.baseSize;
        renderer.setRenderTarget(this.target);
        this.quad.render(renderer);
    }

    dispose() {
        this.target?.dispose();
        this.target = null;
        this.quad.dispose();
    }
}

export { DepthMipAtlas, DEPTH_MIP_LEVELS, DEPTH_MIP_BIAS };
