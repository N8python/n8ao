import {Color as $5Whe3$Color, WebGLRenderTarget as $5Whe3$WebGLRenderTarget, LinearFilter as $5Whe3$LinearFilter, NearestFilter as $5Whe3$NearestFilter, HalfFloatType as $5Whe3$HalfFloatType, RGBAFormat as $5Whe3$RGBAFormat, DepthTexture as $5Whe3$DepthTexture, UnsignedInt248Type as $5Whe3$UnsignedInt248Type, UnsignedIntType as $5Whe3$UnsignedIntType, DepthStencilFormat as $5Whe3$DepthStencilFormat, DepthFormat as $5Whe3$DepthFormat, Matrix4 as $5Whe3$Matrix4, DataTexture as $5Whe3$DataTexture, ShaderMaterial as $5Whe3$ShaderMaterial, NoColorSpace as $5Whe3$NoColorSpace, RepeatWrapping as $5Whe3$RepeatWrapping, Vector2 as $5Whe3$Vector2, REVISION as $5Whe3$REVISION, RedFormat as $5Whe3$RedFormat, FloatType as $5Whe3$FloatType, GLSL3 as $5Whe3$GLSL3, Vector3 as $5Whe3$Vector3, Sphere as $5Whe3$Sphere, BufferAttribute as $5Whe3$BufferAttribute, BufferGeometry as $5Whe3$BufferGeometry, OrthographicCamera as $5Whe3$OrthographicCamera, Mesh as $5Whe3$Mesh, Vector4 as $5Whe3$Vector4} from "three";
import {Pass as $5Whe3$Pass} from "three/examples/jsm/postprocessing/Pass.js";
import {Pass as $5Whe3$Pass1} from "postprocessing";

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}



class $e4ca8dcb0218f846$var$FullScreenTriangleGeometry extends $5Whe3$BufferGeometry {
    boundingSphere = new $5Whe3$Sphere();
    constructor(){
        super();
        this.setAttribute("position", new $5Whe3$BufferAttribute(new Float32Array([
            -1,
            -1,
            3,
            -1,
            -1,
            3
        ]), 2));
        this.setAttribute("uv", new $5Whe3$BufferAttribute(new Float32Array([
            0,
            0,
            2,
            0,
            0,
            2
        ]), 2));
    }
    computeBoundingSphere() {}
}
const $e4ca8dcb0218f846$var$_geometry = /* @__PURE__ */ new $e4ca8dcb0218f846$var$FullScreenTriangleGeometry();
const $e4ca8dcb0218f846$var$_camera = /* @__PURE__ */ new $5Whe3$OrthographicCamera();
class $e4ca8dcb0218f846$export$dcd670d73db751f5 {
    constructor(material){
        this._mesh = new $5Whe3$Mesh($e4ca8dcb0218f846$var$_geometry, material);
        this._mesh.frustumCulled = false;
    }
    render(renderer) {
        renderer.render(this._mesh, $e4ca8dcb0218f846$var$_camera);
    }
    get material() {
        return this._mesh.material;
    }
    set material(value) {
        this._mesh.material = value;
    }
    dispose() {
        this._mesh.material.dispose();
        this._mesh.geometry.dispose();
    }
}





// Coarser copies of the AO pass's depth, read by its far samples so that they stay in the
// texture cache (as in McGuire et al.'s Scalable Ambient Obscurance). Each texel keeps one
// real depth from the level below, picked on a rotated grid, never an average, so coarse
// levels invent no surfaces. Levels 1 to DEPTH_MIP_LEVELS are packed in one float texture:
// level 1 at the top left, the smaller levels side by side below it. Every level is built
// straight from the full depth in a single pass by following the picks down.
const $92ca7181966e8293$export$a5758b9e664c79d = 6;
// Samples closer than 2^(DEPTH_MIP_BIAS + 1) pixels read the full depth; each doubling of the
// distance after that reads one level coarser.
const $92ca7181966e8293$export$1a9dc8dbaa976129 = 4;
const $92ca7181966e8293$var$DepthMipAtlasShader = {
    uniforms: {
        sceneDepth: {
            value: null
        },
        // xy: the level's origin in the atlas, zw: its size, for levels 1 to DEPTH_MIP_LEVELS.
        levels: {
            value: []
        },
        baseSize: {
            value: /* @__PURE__ */ new $5Whe3$Vector2()
        }
    },
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
    void main() {
        gl_Position = vec4(position, 1.0);
    }`,
    fragmentShader: /* glsl */ `
    #define DEPTH_MIP_LEVELS ${$92ca7181966e8293$export$a5758b9e664c79d}
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
class $92ca7181966e8293$export$1758a4e1ca12274d {
    constructor(){
        this.levels = Array.from({
            length: $92ca7181966e8293$export$a5758b9e664c79d
        }, ()=>new $5Whe3$Vector4());
        this.baseSize = new $5Whe3$Vector2();
        this.target = null;
        this.quad = new (0, $e4ca8dcb0218f846$export$dcd670d73db751f5)(new $5Whe3$ShaderMaterial($92ca7181966e8293$var$DepthMipAtlasShader));
    }
    resize(width, height) {
        width = Math.max(1, Math.floor(width));
        height = Math.max(1, Math.floor(height));
        if (this.target && this.baseSize.x === width && this.baseSize.y === height) return;
        this.baseSize.set(width, height);
        let levelWidth = width;
        let levelHeight = height;
        let x = 0;
        for(let level = 0; level < $92ca7181966e8293$export$a5758b9e664c79d; level++){
            levelWidth = Math.max(1, levelWidth >> 1);
            levelHeight = Math.max(1, levelHeight >> 1);
            if (level === 0) this.levels[level].set(0, 0, levelWidth, levelHeight);
            else {
                this.levels[level].set(x, this.levels[0].w, levelWidth, levelHeight);
                x += levelWidth;
            }
        }
        const atlasWidth = Math.max(this.levels[0].z, x);
        const atlasHeight = this.levels[0].w + ($92ca7181966e8293$export$a5758b9e664c79d > 1 ? this.levels[1].w : 0);
        this.target?.dispose();
        this.target = new $5Whe3$WebGLRenderTarget(atlasWidth, atlasHeight, {
            type: $5Whe3$FloatType,
            format: $5Whe3$RedFormat,
            minFilter: $5Whe3$NearestFilter,
            magFilter: $5Whe3$NearestFilter,
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


const $1ed45968c1160c3c$export$c9b263b9a17dffd7 = {
    uniforms: {
        "sceneDiffuse": {
            value: null
        },
        "sceneDepth": {
            value: null
        },
        "sceneNormal": {
            value: null
        },
        "projMat": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "viewMat": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "projViewMat": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "projectionMatrixInv": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "viewMatrixInv": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "cameraPos": {
            value: /* @__PURE__ */ new $5Whe3$Vector3()
        },
        "resolution": {
            value: /* @__PURE__ */ new $5Whe3$Vector2()
        },
        "biasAdjustment": {
            value: /* @__PURE__ */ new $5Whe3$Vector2()
        },
        "time": {
            value: 0.0
        },
        "samples": {
            value: []
        },
        "bluenoise": {
            value: null
        },
        "distanceFalloff": {
            value: 1.0
        },
        "radius": {
            value: 5.0
        },
        "near": {
            value: 0.1
        },
        "far": {
            value: 1000.0
        },
        "ortho": {
            value: false
        },
        "screenSpaceRadius": {
            value: false
        },
        "frame": {
            value: 0.0
        },
        "depthMipAtlas": {
            value: null
        },
        "depthMipLevels": {
            value: []
        }
    },
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1);
}`,
    fragmentShader: /* glsl */ `
    #define SAMPLES 16
    #define FSAMPLES 16.0
uniform sampler2D sceneDiffuse;
uniform highp sampler2D sceneNormal;
uniform highp sampler2D sceneDepth;
uniform mat4 projectionMatrixInv;
uniform mat4 viewMatrixInv;
uniform mat4 projMat;
uniform mat4 viewMat;
uniform mat4 projViewMat;
uniform vec3 cameraPos;
uniform vec2 resolution;
uniform vec2 biasAdjustment;
uniform float time;
uniform vec3[SAMPLES] samples;
uniform float radius;
uniform float distanceFalloff;
uniform float near;
uniform float far;
uniform float frame;
uniform bool ortho;
uniform bool screenSpaceRadius;
uniform sampler2D bluenoise;
#ifdef DEPTH_MIP
uniform highp sampler2D depthMipAtlas;
uniform vec4 depthMipLevels[${(0, $92ca7181966e8293$export$a5758b9e664c79d)}];
#endif
    varying vec2 vUv;
    highp float linearize_depth(highp float d, highp float zNear,highp float zFar)
    {
        return (zFar * zNear) / (zFar - d * (zFar - zNear));
    }
    highp float linearize_depth_ortho(highp float d, highp float nearZ, highp float farZ) {
      return nearZ + (farZ - nearZ) * d;
    }
    highp float linearize_depth_log(highp float d, highp float nearZ,highp float farZ) {
      float depth = pow(2.0, d * log2(farZ + 1.0)) - 1.0;
      float a = farZ / (farZ - nearZ);
      float b = farZ * nearZ / (nearZ - farZ);
      float linDepth = a + b / depth;
      /*return ortho ? linearize_depth_ortho(
        linDepth,
        nearZ,
        farZ
      ) :linearize_depth(linDepth, nearZ, farZ);*/
       #ifdef ORTHO

       return linearize_depth_ortho(d, nearZ, farZ);

        #else
        return linearize_depth(linDepth, nearZ, farZ);
        #endif
    }

    vec3 getWorldPosLog(vec3 posS) {
      vec2 uv = posS.xy;
      float z = posS.z;
      float nearZ =near;
      float farZ = far;
      float depth = pow(2.0, z * log2(farZ + 1.0)) - 1.0;
      float a = farZ / (farZ - nearZ);
      float b = farZ * nearZ / (nearZ - farZ);
      float linDepth = a + b / depth;
      vec4 clipVec = vec4(uv, linDepth, 1.0) * 2.0 - 1.0;
      vec4 wpos = projectionMatrixInv * clipVec;
      return wpos.xyz / wpos.w;
    }
    float depthToClipZ(float depth) {
      #ifdef REVERSEDEPTH
        return depth;
      #else
        return depth * 2.0 - 1.0;
      #endif
    }
    bool isBackgroundDepth(float depth) {
      #ifdef REVERSEDEPTH
        return depth == 0.0;
      #else
        return depth == 1.0;
      #endif
    }
    vec3 getWorldPos(float depth, vec2 coord) {
      #ifdef LOGDEPTH
        #ifndef ORTHO
          return getWorldPosLog(vec3(coord, depth));
        #endif
      #endif
      #ifdef ORTHO
        float z = depthToClipZ(depth);
        vec4 clipSpacePosition = vec4(coord * 2. - 1., z, 1.);
        vec4 viewSpacePosition = projectionMatrixInv * clipSpacePosition;
        viewSpacePosition.xyz /= viewSpacePosition.w;
        return viewSpacePosition.xyz;
      #else
        vec2 ndc = coord * 2. - 1.;
        float ndcZ = depthToClipZ(depth);
        mat4 Q = projectionMatrixInv;
        vec3 view = vec3(Q[0][0] * ndc.x + Q[3][0], Q[1][1] * ndc.y + Q[3][1], Q[3][2]);
        float invW = 1. / (Q[2][3] * ndcZ + Q[3][3]);
        return view * invW;
      #endif
  }

  vec3 computeNormal(vec3 worldPos, vec2 vUv) {
    ivec2 p = ivec2(vUv * resolution);
    float c0 = texelFetch(sceneDepth, p, 0).x;
    float l2 = texelFetch(sceneDepth, p - ivec2(2, 0), 0).x;
    float l1 = texelFetch(sceneDepth, p - ivec2(1, 0), 0).x;
    float r1 = texelFetch(sceneDepth, p + ivec2(1, 0), 0).x;
    float r2 = texelFetch(sceneDepth, p + ivec2(2, 0), 0).x;
    float b2 = texelFetch(sceneDepth, p - ivec2(0, 2), 0).x;
    float b1 = texelFetch(sceneDepth, p - ivec2(0, 1), 0).x;
    float t1 = texelFetch(sceneDepth, p + ivec2(0, 1), 0).x;
    float t2 = texelFetch(sceneDepth, p + ivec2(0, 2), 0).x;

    float dl = abs((2.0 * l1 - l2) - c0);
    float dr = abs((2.0 * r1 - r2) - c0);
    float db = abs((2.0 * b1 - b2) - c0);
    float dt = abs((2.0 * t1 - t2) - c0);

    vec3 ce = getWorldPos(c0, vUv).xyz;

    vec3 dpdx = (dl < dr) ? ce - getWorldPos(l1, (vUv - vec2(1.0 / resolution.x, 0.0))).xyz
                          : -ce + getWorldPos(r1, (vUv + vec2(1.0 / resolution.x, 0.0))).xyz;
    vec3 dpdy = (db < dt) ? ce - getWorldPos(b1, (vUv - vec2(0.0, 1.0 / resolution.y))).xyz
                          : -ce + getWorldPos(t1, (vUv + vec2(0.0, 1.0 / resolution.y))).xyz;

    return normalize(cross(dpdx, dpdy));
}

mat3 makeRotationZ(float theta) {
	float c = cos(theta);
	float s = sin(theta);
	return mat3(c, - s, 0,
			s,  c, 0,
			0,  0, 1);
  }

void main() {
      vec4 diffuse = texture2D(sceneDiffuse, vUv);
      float depth = texture2D(sceneDepth, vUv).x;
      if (isBackgroundDepth(depth)) {
        gl_FragColor = vec4(vec3(1.0), 1.0);
        return;
      }
      vec3 worldPos = getWorldPos(depth, vUv);
      #ifdef HALFRES
        vec3 normal = texture2D(sceneNormal, vUv).rgb;
      #else
        vec3 normal = computeNormal(worldPos, vUv);
      #endif
      vec4 noise = texture2D(bluenoise, gl_FragCoord.xy / 128.0);
      vec2 harmoniousNumbers = vec2(
        1.618033988749895,
        1.324717957244746
      );
      noise.rg += harmoniousNumbers * frame;
      noise.rg = fract(noise.rg);
        vec3 helperVec = vec3(0.0, 1.0, 0.0);
        if (dot(helperVec, normal) > 0.99) {
          helperVec = vec3(1.0, 0.0, 0.0);
        }
        vec3 tangent = normalize(cross(helperVec, normal));
        vec3 bitangent = cross(normal, tangent);
        mediump mat3 tbn = mat3(tangent, bitangent, normal) *  makeRotationZ( noise.r * 3.1415962 * 2.0) ;

      mediump float occluded = 0.0;
      mediump float totalWeight = 0.0;
      float radiusToUse = screenSpaceRadius ? distance(
        worldPos,
        getWorldPos(depth, vUv +
          vec2(radius, 0.0) / resolution)
      ) : radius;
      float distanceFalloffToUse =screenSpaceRadius ?
          radiusToUse * distanceFalloff
      : radiusToUse * distanceFalloff * 0.2;
      float bias = (min(
        0.1,
        distanceFalloffToUse * 0.1
      ) / near) * fwidth(length(worldPos)) / radiusToUse;
      bias = biasAdjustment.x + biasAdjustment.y * bias;
      mediump float offsetMove = noise.g;
      mediump float offsetMoveInv = 1.0 / FSAMPLES;
      float farTimesNear = far * near;
      float farMinusNear = far - near;
      
      for(int i = 0; i < SAMPLES; i++) {
        mediump vec3 sampleDirection = tbn * samples[i];

        float moveAmt = fract(offsetMove);
        offsetMove += offsetMoveInv;
        vec3 samplePos = worldPos + radiusToUse * moveAmt * sampleDirection;
        vec4 offset = projMat * vec4(samplePos, 1.0);
        offset.xyz /= offset.w;
        offset.xy = offset.xy * 0.5 + 0.5;
        #ifndef REVERSEDEPTH
        offset.z = offset.z * 0.5 + 0.5;
        #endif
        
        // Every sample reads depth (clamped on screen) and off-screen ones are dropped with a
        // select, not a branch, so the compiler can issue all depth reads up front.
        bool insideScreen = all(greaterThan(offset.xyz * (1.0 - offset.xyz), vec3(0.0)));
        {
          vec2 sampleUv = clamp(offset.xy, 0.0, 1.0);
          #ifdef DEPTH_MIP
          // Far samples read a coarser depth level (see DepthMipAtlas.js) to stay in cache.
          vec2 screenDelta = (offset.xy - vUv) * resolution;
          int mipLevel = int(clamp(
            floor(0.5 * log2(max(dot(screenDelta, screenDelta), 1.0))) - ${(0, $92ca7181966e8293$export$1a9dc8dbaa976129)}.0,
            0.0,
            ${(0, $92ca7181966e8293$export$a5758b9e664c79d)}.0
          ));
          float sampleDepth;
          if (mipLevel == 0) {
            sampleDepth = textureLod(sceneDepth, sampleUv, 0.0).x;
          } else {
            vec4 level = depthMipLevels[mipLevel - 1];
            ivec2 texel = min(ivec2(sampleUv * level.zw), ivec2(level.zw) - 1);
            sampleDepth = texelFetch(depthMipAtlas, ivec2(level.xy) + texel, 0).x;
          }
          #else
          float sampleDepth = textureLod(sceneDepth, sampleUv, 0.0).x;
          #endif

          /*#ifdef LOGDEPTH
          float distSample = linearize_depth_log(sampleDepth, near, far);
      #else
          #ifdef ORTHO
              float distSample = near + farMinusNear * sampleDepth;
          #else
              float distSample = (farTimesNear) / (far - sampleDepth * farMinusNear);
          #endif
      #endif*/
      #ifdef REVERSEDEPTH
          float distSample = -getWorldPos(sampleDepth, offset.xy).z;
      #else
        #ifdef ORTHO
          float distSample = near + sampleDepth * farMinusNear;
        #else
          #ifdef LOGDEPTH
              float distSample = linearize_depth_log(sampleDepth, near, far);
          #else
              float distSample = (farTimesNear) / (far - sampleDepth * farMinusNear);
          #endif
        #endif
      #endif
      
      #ifdef REVERSEDEPTH
          float distWorld = -samplePos.z;
      #else
        #ifdef ORTHO
          float distWorld = near + offset.z * farMinusNear;
        #else
          float distWorld = (farTimesNear) / (far - offset.z * farMinusNear);
        #endif
      #endif
          
          mediump float rangeCheck = smoothstep(0.0, 1.0, distanceFalloffToUse / (abs(distSample - distWorld)));
          vec2 diff = gl_FragCoord.xy - floor(offset.xy * resolution);
          occluded += insideScreen ? rangeCheck * float(distSample != distWorld) * float(sampleDepth != depth) * step(distSample + bias, distWorld) * step(
            1.0,
            dot(diff, diff)
          ) : 0.0;
          
          totalWeight += insideScreen ? 1.0 : 0.0;
        }
      }
      float occ = clamp(1.0 - occluded / (totalWeight == 0.0 ? 1.0 : totalWeight), 0.0, 1.0);
      gl_FragColor = vec4(occ, 0.5 + 0.5 * normal);
}`
};



const $12b21d24d1192a04$export$a815acccbd2c9a49 = {
    uniforms: {
        "sceneDiffuse": {
            value: null
        },
        "sceneDepth": {
            value: null
        },
        "tDiffuse": {
            value: null
        },
        "transparencyDWFalse": {
            value: null
        },
        "transparencyDWTrue": {
            value: null
        },
        "transparencyDWTrueDepth": {
            value: null
        },
        "transparencyAware": {
            value: false
        },
        "projMat": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "viewMat": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "projectionMatrixInv": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "resolution": {
            value: /* @__PURE__ */ new $5Whe3$Vector2()
        },
        "color": {
            value: /* @__PURE__ */ new $5Whe3$Vector3(0, 0, 0)
        },
        "blueNoise": {
            value: null
        },
        "downsampledDepth": {
            value: null
        },
        "time": {
            value: 0.0
        },
        "intensity": {
            value: 5.0
        },
        "renderMode": {
            value: 0.0
        },
        "gammaCorrection": {
            value: false
        },
        "ortho": {
            value: false
        },
        "near": {
            value: 0.1
        },
        "far": {
            value: 1000.0
        },
        "screenSpaceRadius": {
            value: false
        },
        "radius": {
            value: 0.0
        },
        "distanceFalloff": {
            value: 1.0
        },
        "fog": {
            value: false
        },
        "fogExp": {
            value: false
        },
        "fogDensity": {
            value: 0.0
        },
        "fogNear": {
            value: Infinity
        },
        "fogFar": {
            value: Infinity
        },
        "colorMultiply": {
            value: true
        },
        "aoTones": {
            value: 0.0
        }
    },
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = vec4(position, 1);
		}`,
    fragmentShader: /* glsl */ `
		uniform sampler2D sceneDiffuse;
    uniform highp sampler2D sceneDepth;
    uniform highp sampler2D downsampledDepth;
    uniform highp sampler2D transparencyDWFalse;
    uniform highp sampler2D transparencyDWTrue;
    uniform highp sampler2D transparencyDWTrueDepth;
    uniform sampler2D tDiffuse;
    uniform sampler2D blueNoise;
    uniform vec2 resolution;
    uniform vec3 color;
    uniform mat4 projectionMatrixInv;
    uniform float intensity;
    uniform float renderMode;
    uniform float near;
    uniform float far;
    uniform float aoTones;
    uniform bool gammaCorrection;
    uniform bool ortho;
    uniform bool screenSpaceRadius;
    uniform bool fog;
    uniform bool fogExp;
    uniform bool colorMultiply;
    uniform bool transparencyAware;
    uniform float fogDensity;
    uniform float fogNear;
    uniform float fogFar;
    uniform float radius;
    uniform float distanceFalloff;
    varying vec2 vUv;
    highp float linearize_depth(highp float d, highp float zNear,highp float zFar)
    {
        return (zFar * zNear) / (zFar - d * (zFar - zNear));
    }
    highp float linearize_depth_ortho(highp float d, highp float nearZ, highp float farZ) {
      return nearZ + (farZ - nearZ) * d;
    }
    highp float linearize_depth_log(highp float d, highp float nearZ,highp float farZ) {
      float depth = pow(2.0, d * log2(farZ + 1.0)) - 1.0;
      float a = farZ / (farZ - nearZ);
      float b = farZ * nearZ / (nearZ - farZ);
      float linDepth = a + b / depth;
      return ortho ? linearize_depth_ortho(
        linDepth,
        nearZ,
        farZ
      ) :linearize_depth(linDepth, nearZ, farZ);
    }
    vec3 getWorldPosLog(vec3 posS) {
        vec2 uv = posS.xy;
        float z = posS.z;
        float nearZ =near;
        float farZ = far;
        float depth = pow(2.0, z * log2(farZ + 1.0)) - 1.0;
        float a = farZ / (farZ - nearZ);
        float b = farZ * nearZ / (nearZ - farZ);
        float linDepth = a + b / depth;
        vec4 clipVec = vec4(uv, linDepth, 1.0) * 2.0 - 1.0;
        vec4 wpos = projectionMatrixInv * clipVec;
        return wpos.xyz / wpos.w;
      }
      float depthToClipZ(float depth) {
        #ifdef REVERSEDEPTH
          return depth;
        #else
          return depth * 2.0 - 1.0;
        #endif
      }
      bool isBackgroundDepth(float depth) {
        #ifdef REVERSEDEPTH
          return depth == 0.0;
        #else
          return depth == 1.0;
        #endif
      }
      vec3 getWorldPos(float depth, vec2 coord) {
        #ifdef LOGDEPTH
          #ifndef ORTHO
            return getWorldPosLog(vec3(coord, depth));
          #endif
        #endif
      //  }
        #ifdef ORTHO
          float z = depthToClipZ(depth);
          vec4 clipSpacePosition = vec4(coord * 2. - 1., z, 1.);
          vec4 viewSpacePosition = projectionMatrixInv * clipSpacePosition;
          viewSpacePosition.xyz /= viewSpacePosition.w;
          return viewSpacePosition.xyz;
        #else
          vec2 ndc = coord * 2. - 1.;
          float ndcZ = depthToClipZ(depth);
          mat4 Q = projectionMatrixInv;
          vec3 view = vec3(Q[0][0] * ndc.x + Q[3][0], Q[1][1] * ndc.y + Q[3][1], Q[3][2]);
          float invW = 1. / (Q[2][3] * ndcZ + Q[3][3]);
          return view * invW;
        #endif
    }
  
    vec3 computeNormal(vec3 worldPos, vec2 vUv) {
      ivec2 p = ivec2(vUv * resolution);
      float c0 = texelFetch(sceneDepth, p, 0).x;
      float l2 = texelFetch(sceneDepth, p - ivec2(2, 0), 0).x;
      float l1 = texelFetch(sceneDepth, p - ivec2(1, 0), 0).x;
      float r1 = texelFetch(sceneDepth, p + ivec2(1, 0), 0).x;
      float r2 = texelFetch(sceneDepth, p + ivec2(2, 0), 0).x;
      float b2 = texelFetch(sceneDepth, p - ivec2(0, 2), 0).x;
      float b1 = texelFetch(sceneDepth, p - ivec2(0, 1), 0).x;
      float t1 = texelFetch(sceneDepth, p + ivec2(0, 1), 0).x;
      float t2 = texelFetch(sceneDepth, p + ivec2(0, 2), 0).x;
  
      float dl = abs((2.0 * l1 - l2) - c0);
      float dr = abs((2.0 * r1 - r2) - c0);
      float db = abs((2.0 * b1 - b2) - c0);
      float dt = abs((2.0 * t1 - t2) - c0);
  
      vec3 ce = getWorldPos(c0, vUv).xyz;
  
      vec3 dpdx = (dl < dr) ? ce - getWorldPos(l1, (vUv - vec2(1.0 / resolution.x, 0.0))).xyz
                            : -ce + getWorldPos(r1, (vUv + vec2(1.0 / resolution.x, 0.0))).xyz;
      vec3 dpdy = (db < dt) ? ce - getWorldPos(b1, (vUv - vec2(0.0, 1.0 / resolution.y))).xyz
                            : -ce + getWorldPos(t1, (vUv + vec2(0.0, 1.0 / resolution.y))).xyz;
  
      return normalize(cross(dpdx, dpdy));
  }

#ifdef NEURAL_UPSAMPLE
    __N8AO_NEURAL_UPSAMPLE__
#endif
    #include <common>
    #include <dithering_pars_fragment>
    void main() {
        //vec4 texel = texture2D(tDiffuse, vUv);//vec3(0.0);
        vec4 sceneTexel = texture2D(sceneDiffuse, vUv);
        float depth = texture2D(sceneDepth, vUv).x;
        #ifdef HALFRES 
        vec4 texel = vec4(0.0);
        if (isBackgroundDepth(depth)) {
            texel = vec4(1.0, 0.0, 0.0, 1.0);
        } else {
        vec3 worldPos = getWorldPos(depth, vUv);
        vec3 normal = computeNormal(getWorldPos(depth, vUv), vUv);
       // vec4 texel = texture2D(tDiffuse, vUv);
       // Find closest depth;
       float totalWeight = 0.0;
       float radiusToUse = screenSpaceRadius ? distance(
        worldPos,
        getWorldPos(depth, vUv +
          vec2(radius, 0.0) / resolution)
      ) : radius;
      float distanceFalloffToUse =screenSpaceRadius ?
          radiusToUse * distanceFalloff
      : distanceFalloff;
#ifdef NEURAL_UPSAMPLE
        texel = vec4(neuralUpsample(worldPos, normal), 0.0, 0.0, 1.0);
#else
        ivec2 halfSize = textureSize(tDiffuse, 0);
        ivec2 base = min(ivec2(vUv * resolution * 0.5), halfSize - 1);
        for(int x = -1; x <= 1; x++) {
            for(int y = -1; y <= 1; y++) {
                ivec2 p = clamp(base + ivec2(x, y), ivec2(0), halfSize - 1);
                // Half-res depth and normals describe the half-res pixel's center.
                vec2 pUv = (vec2(p) + 0.5) / vec2(halfSize);
                float sampleDepth = texelFetch(downsampledDepth,p, 0).x;
                vec4 sampleInfo = texelFetch(tDiffuse, p, 0);
                // The AO target keeps only the normal's x and y (its alpha is the accumulation
                // weight), so z is rebuilt facing the camera.
                vec2 normalXY = sampleInfo.gb * 2.0 - 1.0;
                vec3 normalSample = vec3(normalXY, sqrt(max(1.0 - dot(normalXY, normalXY), 0.0)));
                vec3 worldPosSample = getWorldPos(sampleDepth, pUv);
                float tangentPlaneDist = abs(dot(worldPosSample - worldPos, normal));
                float rangeCheck = exp(-1.0 * tangentPlaneDist * (1.0 / distanceFalloffToUse)) * max(dot(normal, normalSample), 0.0);
                float weight = rangeCheck;
                totalWeight += weight;
                texel += sampleInfo * weight;
            }
        }
        if (totalWeight == 0.0) {
            texel = texture2D(tDiffuse, vUv);
        } else {
            texel /= totalWeight;
        }
#endif
    }
        #else
        vec4 texel = texture2D(tDiffuse, vUv);
        #endif

        #ifdef LOGDEPTH
        texel.r = clamp(texel.r, 0.0, 1.0);
        if (texel.r == 0.0) {
          texel.r = 1.0;
        }
        #endif
     
        float finalAo = pow(texel.r, intensity);
        if (aoTones > 0.0) {
            finalAo = ceil(finalAo * aoTones) / aoTones;
        }
        float fogFactor = 0.0;
        if (fog) {
            float fogDepth = -getWorldPos(depth, vUv).z;
            if (fogExp) {
                fogFactor = 1.0 - exp( - fogDensity * fogDensity * fogDepth * fogDepth );
            } else {
                fogFactor = smoothstep( fogNear, fogFar, fogDepth );
            }
        }
        if (transparencyAware) {
            float transparencyDWOff = texture2D(transparencyDWFalse, vUv).a;
            float transparencyDWOn = texture2D(transparencyDWTrue, vUv).a;
            float adjustmentFactorOff = transparencyDWOff;
            float depthSample = texture2D(sceneDepth, vUv).r;
            float trueDepthSample = texture2D(transparencyDWTrueDepth, vUv).r;
            float adjustmentFactorOn = (1.0 - transparencyDWOn) * (
                trueDepthSample == depthSample ? 1.0 : 0.0
            );
            float adjustmentFactor = max(adjustmentFactorOff, adjustmentFactorOn);
            finalAo = mix(finalAo, 1.0, adjustmentFactor);
        }
        finalAo = mix(finalAo, 1.0, fogFactor);
        vec3 aoApplied = color * mix(vec3(1.0), sceneTexel.rgb, float(colorMultiply));
        if (renderMode == 0.0) {
            gl_FragColor = vec4( mix(sceneTexel.rgb, aoApplied, 1.0 - finalAo), sceneTexel.a);
        } else if (renderMode == 1.0) {
            gl_FragColor = vec4( mix(vec3(1.0), aoApplied, 1.0 - finalAo), sceneTexel.a);
        } else if (renderMode == 2.0) {
            gl_FragColor = vec4( sceneTexel.rgb, sceneTexel.a);
        } else if (renderMode == 3.0) {
            if (vUv.x < 0.5) {
                gl_FragColor = vec4( sceneTexel.rgb, sceneTexel.a);
            } else if (abs(vUv.x - 0.5) < 1.0 / resolution.x) {
                gl_FragColor = vec4(1.0);
            } else {
                gl_FragColor = vec4( mix(sceneTexel.rgb, aoApplied, 1.0 - finalAo), sceneTexel.a);
            }
        } else if (renderMode == 4.0) {
            if (vUv.x < 0.5) {
                gl_FragColor = vec4( sceneTexel.rgb, sceneTexel.a);
            } else if (abs(vUv.x - 0.5) < 1.0 / resolution.x) {
                gl_FragColor = vec4(1.0);
            } else {
                gl_FragColor = vec4( mix(vec3(1.0), aoApplied, 1.0 - finalAo), sceneTexel.a);
            }
        }
        #include <dithering_fragment>
        if (gammaCorrection) {
            gl_FragColor = sRGBTransferOETF(gl_FragColor);
        }
    }
    `
};



const $e52378cd0f5a973d$export$57856b59f317262e = {
    uniforms: {
        "sceneDiffuse": {
            value: null
        },
        "sceneDepth": {
            value: null
        },
        "tDiffuse": {
            value: null
        },
        "projMat": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "viewMat": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "projectionMatrixInv": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "viewMatrixInv": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "cameraPos": {
            value: /* @__PURE__ */ new $5Whe3$Vector3()
        },
        "resolution": {
            value: /* @__PURE__ */ new $5Whe3$Vector2()
        },
        "time": {
            value: 0.0
        },
        "r": {
            value: 5.0
        },
        "blueNoise": {
            value: null
        },
        "radius": {
            value: 12.0
        },
        "worldRadius": {
            value: 5.0
        },
        "index": {
            value: 0.0
        },
        "poissonDisk": {
            value: []
        },
        "distanceFalloff": {
            value: 1.0
        },
        "near": {
            value: 0.1
        },
        "far": {
            value: 1000.0
        },
        "screenSpaceRadius": {
            value: false
        }
    },
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = vec4(position, 1.0);
		}`,
    fragmentShader: /* glsl */ `
		uniform sampler2D sceneDiffuse;
    uniform highp sampler2D sceneDepth;
    uniform sampler2D tDiffuse;
    uniform sampler2D blueNoise;
    uniform mat4 projectionMatrixInv;
    uniform mat4 viewMatrixInv;
    uniform vec2 resolution;
    uniform float r;
    uniform float radius;
     uniform float worldRadius;
    uniform float index;
     uniform float near;
     uniform float far;
     uniform float distanceFalloff;
    uniform bool screenSpaceRadius;
    varying vec2 vUv;

    highp float linearize_depth(highp float d, highp float zNear,highp float zFar)
    {
        highp float z_n = 2.0 * d - 1.0;
        return 2.0 * zNear * zFar / (zFar + zNear - z_n * (zFar - zNear));
    }
    highp float linearize_depth_log(highp float d, highp float nearZ,highp float farZ) {
     float depth = pow(2.0, d * log2(farZ + 1.0)) - 1.0;
     float a = farZ / (farZ - nearZ);
     float b = farZ * nearZ / (nearZ - farZ);
     float linDepth = a + b / depth;
     return linearize_depth(linDepth, nearZ, farZ);
   }
   highp float linearize_depth_ortho(highp float d, highp float nearZ, highp float farZ) {
     return nearZ + (farZ - nearZ) * d;
   }
   float depthToClipZ(float depth) {
     #ifdef REVERSEDEPTH
       return depth;
     #else
       return depth * 2.0 - 1.0;
     #endif
   }
   bool isBackgroundDepth(float depth) {
     #ifdef REVERSEDEPTH
       return depth == 0.0;
     #else
       return depth == 1.0;
     #endif
   }
   vec3 getWorldPosLog(vec3 posS) {
     vec2 uv = posS.xy;
     float z = posS.z;
     float nearZ =near;
     float farZ = far;
     float depth = pow(2.0, z * log2(farZ + 1.0)) - 1.0;
     float a = farZ / (farZ - nearZ);
     float b = farZ * nearZ / (nearZ - farZ);
     float linDepth = a + b / depth;
     vec4 clipVec = vec4(uv, linDepth, 1.0) * 2.0 - 1.0;
     vec4 wpos = projectionMatrixInv * clipVec;
     return wpos.xyz / wpos.w;
   }
    vec3 getWorldPos(float depth, vec2 coord) {
     #ifdef LOGDEPTH
      #ifndef ORTHO
          return getWorldPosLog(vec3(coord, depth));
      #endif
     #endif
        
        #ifdef ORTHO
          float z = depthToClipZ(depth);
          vec4 clipSpacePosition = vec4(coord * 2. - 1., z, 1.);
          vec4 viewSpacePosition = projectionMatrixInv * clipSpacePosition;
          viewSpacePosition.xyz /= viewSpacePosition.w;
          return viewSpacePosition.xyz;
        #else
          vec2 ndc = coord * 2. - 1.;
          float ndcZ = depthToClipZ(depth);
          mat4 Q = projectionMatrixInv;
          vec3 view = vec3(Q[0][0] * ndc.x + Q[3][0], Q[1][1] * ndc.y + Q[3][1], Q[3][2]);
          float invW = 1.0 / (Q[2][3] * ndcZ + Q[3][3]);
          return view * invW;
        #endif
    }

#ifdef NEURAL_DENOISE
    __N8AO_NEURAL_DENOISE__

    vec3 neuralSafeNormalize(vec3 value, vec3 fallback) {
        float lengthSquared = dot(value, value);
        return lengthSquared > 1e-12 ? value * inversesqrt(lengthSquared) : fallback;
    }

    mat3 neuralLocalFrame(vec3 inputNormal) {
        vec3 frameNormal = neuralSafeNormalize(inputNormal, vec3(0.0, 0.0, 1.0));
        vec3 helper = abs(frameNormal.z) < 0.999
            ? vec3(0.0, 0.0, 1.0)
            : vec3(0.0, 1.0, 0.0);
        vec3 tangent = neuralSafeNormalize(
            cross(helper, frameNormal),
            vec3(1.0, 0.0, 0.0)
        );
        vec3 bitangent = cross(frameNormal, tangent);
        return transpose(mat3(tangent, bitangent, frameNormal));
    }
#endif

    #include <common>
    #define NUM_SAMPLES __N8AO_DENOISE_SAMPLES__
    uniform vec2 poissonDisk[NUM_SAMPLES];
    void main() {
        const float pi = 3.14159;
        vec2 texelSize = vec2(1.0 / resolution.x, 1.0 / resolution.y);
        vec2 uv = vUv;
        vec4 data = texture2D(tDiffuse, vUv);
        float occlusion = data.r;
        float baseOcc = data.r;
        vec3 normal = data.gba * 2.0 - 1.0;
        float count = 1.0;
        float d = texture2D(sceneDepth, vUv).x;
        if (isBackgroundDepth(d)) {
          gl_FragColor = data;
          return;
        }
        vec3 worldPos = getWorldPos(d, vUv);
        float size = radius;
        float angle;
#ifdef NEURAL_DENOISE
        // The neural material is only bound for denoise iteration two.
        angle = texture2D(blueNoise, gl_FragCoord.xy / 128.0).z * PI2;
#else
        if (index == 0.0) {
             angle = texture2D(blueNoise, gl_FragCoord.xy / 128.0).w * PI2;
        } else if (index == 1.0) {
             angle = texture2D(blueNoise, gl_FragCoord.xy / 128.0).z * PI2;
        } else if (index == 2.0) {
             angle = texture2D(blueNoise, gl_FragCoord.xy / 128.0).y * PI2;
        } else {
             angle = texture2D(blueNoise, gl_FragCoord.xy / 128.0).x * PI2;
        }
#endif

        mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        float radiusToUse = screenSpaceRadius ? distance(
          worldPos,
          getWorldPos(d, vUv +
            vec2(worldRadius, 0.0) / resolution)
        ) : worldRadius;
        float distanceFalloffToUse =screenSpaceRadius ?
        radiusToUse * distanceFalloff
    : radiusToUse * distanceFalloff * 0.2;

        float invDistance = (1.0 / distanceFalloffToUse);
#ifdef NEURAL_DENOISE
        vec3 neuralNormal = neuralSafeNormalize(normal, vec3(0.0, 0.0, 1.0));
        float neuralInverseRadius = 1.0 / max(radiusToUse, 1e-6);
        float neuralInverseDistance = 1.0 / max(distanceFalloffToUse, 1e-6);
        // View direction in the center's tangent frame, as in training.
        vec3 neuralView = neuralLocalFrame(normal)
            * neuralSafeNormalize(-worldPos, vec3(0.0, 0.0, 1.0));
        float neuralLogRadius = log(max(worldRadius, 1e-6));
        float neuralLogFalloff = log(max(distanceFalloff, 1e-6));
        // Queries come from the center's first-pass AO, which is known before the tap loop.
        float neuralToken[NEURAL_TOKEN_WIDTH];
        neuralEncodeCenter(float[6](
            baseOcc,
            neuralLogRadius,
            neuralLogFalloff,
            neuralView.x,
            neuralView.y,
            neuralView.z
        ), neuralToken);
        float neuralQueries[NEURAL_QUERY_WIDTH];
        neuralMakeQueries(neuralToken, neuralQueries);
        float neuralSummary[NEURAL_QUERY_WIDTH] = NEURAL_ZERO_SUMMARY;
        float neuralDenominator[NEURAL_QUERY_COUNT] = NEURAL_ZERO_DENOMINATOR;
#endif
        for(int i = 0; i < NUM_SAMPLES; i++) {
            vec2 offset = (rotationMatrix * poissonDisk[i]) * texelSize * size;
            vec4 dataSample = texture2D(tDiffuse, uv + offset);
            float occSample = dataSample.r;
            vec3 normalSample = dataSample.gba * 2.0 - 1.0;
            float dSample = texture2D(sceneDepth, uv + offset).x;
            vec3 worldPosSample = getWorldPos(dSample, uv + offset);
            float tangentPlaneDist = abs(dot(worldPosSample - worldPos, normal));
            float rangeCheck = float(!isBackgroundDepth(dSample)) * exp(-1.0 * tangentPlaneDist * invDistance ) * max(dot(normal, normalSample), 0.0);
            occlusion += occSample * rangeCheck;
            count += rangeCheck;
#ifdef NEURAL_DENOISE
            if (!isBackgroundDepth(dSample)) {
                vec3 neuralDelta = worldPosSample - worldPos;
                float neuralHeight = dot(neuralDelta, neuralNormal);
                neuralEncodeTap(float[5](
                    sqrt(max(dot(neuralDelta, neuralDelta) - neuralHeight * neuralHeight, 0.0))
                        * neuralInverseRadius,
                    neuralHeight * neuralInverseRadius,
                    dot(neuralSafeNormalize(normalSample, vec3(0.0, 0.0, 1.0)), neuralNormal),
                    occSample,
                    tangentPlaneDist * neuralInverseDistance
                ), neuralToken);
                neuralAttend(neuralToken, neuralQueries, neuralSummary, neuralDenominator);
            }
#endif
        }
        if (count > 0.0) {
          occlusion /= count;
        }
        occlusion = clamp(occlusion, 0.0, 1.0);
        if (occlusion == 0.0) {
          occlusion = 1.0;
        }
#ifdef NEURAL_DENOISE
        // The center token sees the final bilateral AO and is attended to last.
        neuralEncodeCenter(float[6](
            occlusion,
            neuralLogRadius,
            neuralLogFalloff,
            neuralView.x,
            neuralView.y,
            neuralView.z
        ), neuralToken);
        neuralAttend(neuralToken, neuralQueries, neuralSummary, neuralDenominator);
        occlusion = clamp(occlusion + neuralHead(neuralSummary, neuralDenominator), 0.0, 1.0);
#endif
        gl_FragColor = vec4(occlusion, 0.5 + 0.5 * normal);
    }
    `
};


var $62561e92e160ec9a$exports = {};
$62561e92e160ec9a$exports = JSON.parse('{"architecture":"attention-v3-pilot","attention":"softmax","dynamicQueries":true,"formatVersion":5,"globalBias":[0.43783164,0.390473098,-0.366750836,0.457545847,1.24783957,0.00699784793],"globalFeatureInverseStandardDeviation":[10.7762499,1.88629949,1.64968634,3.29934478,3.21772695,4.03633451],"globalFeatureMean":[0.919787943,-0.511195958,0.0420053862,-0.00501916651,0.605369925,0.619415224],"globalWeights":[-0.498237908,0.00670673652,0.00152060343,0.00128561188,0.00402788538,0.00678816251,-0.0771772712,-0.0279826578,0.0977897272,0.00205942709,-0.0353725255,-0.182206243,0.190576792,-0.0336237699,-0.00070780341,0.0742666349,0.173491925,0.145801112,-0.329374939,-0.0119222291,-0.0662056282,0.0013825919,0.00677041663,0.0263287611,0.0992663652,0.0201859679,0.0383115783,-0.000026359543,-0.00154593715,-0.0176638458,0.0704428256,0.0043666712,0.0124633005,-0.0001957161,0.0172951035,0.0125593673],"headBias":[-0.18811132,0.0948965773,-0.150786236,-0.428572297,-0.00361282472,-0.0960760415],"headWeights":[-0.349779695,-0.677614272,-3.78093934,1.48417652,1.78316295,0.60994488,-0.288706988,0.444337457,-3.04828668,0.999919236,0.297454536,2.67425728,1.08167505,-0.211544037,1.94777036,-2.04720473,-1.61533034,-1.81531906,-0.268871456,-1.20682883,0.586696744,0.227941558,1.23713028,-0.84190625,0.180674821,0.381884187,0.599859357,0.418890119,-0.745973527,0.140275851,0.912337899,-0.469980091,-1.29117024,-0.33387661,-0.44176051,-0.569980681,-0.0321310423,-0.940412164,1.12141001,0.311931401,-0.0938786566,-0.372619629,-0.846192956,1.06840897,0.411292642,-0.28959462,0.549422562,0.665704966,-1.43473649,-0.926213086,-3.85320234,2.13647246,4.16946936,2.28430319,0.588012576,0.62458235,0.94133085,-0.169601411,0.492336214,-0.474020123,1.69022059,-0.638055801,-1.68348992,-1.15128028,-2.47793055,-1.34734607,0.529119134,-1.73358035,0.523224115,-0.403759301,3.13058639,0.303418279,-0.56067276,-1.78167748,-2.9246037,1.78488731,2.90296459,0.368824869,0.331644475,0.83219707,-0.573884368,-0.00551610626,-0.354529232,1.12002647,0.302889019,0.321854949,-2.37430382,-0.667644799,-1.48869014,-0.385823399,0.0377837978,-1.04985082,1.54539227,0.000523873721,2.00845528,-0.349108458,-0.870733619,-0.272413194,-1.36521316,1.2990303,1.95638001,-0.188038722,2.37597728,-0.85083878,4.10536909,-2.24729896,-2.61444163,-2.2991221,0.985709906,-0.822150469,1.76610732,0.471102774,-0.672168076,2.13004088,-2.19398046,1.77379632,-2.80547023,0.770871639,0.179960966,0.744262457,-0.174077839,-2.23472333,-0.768576086,1.2851423,0.0923231766,3.01212621,-3.76283717,0.036338076,-1.36663747,1.42400813,-0.524636805,1.24904919,3.52172256,0.470047891,4.02753925,-2.8899672,-0.43113178,-1.76285839,1.62054408,0.93694371,-0.310192972,-0.37270534,-0.217828333,-1.79468119],"headWidth":6,"keyProjectionWeights":[-3.33902812,-0.536267698,2.01714158,1.52569818,0.234675318,-0.0199190751,-0.522996366,0.777009666,-2.96427703,-1.68269777,-1.74668443,-1.21742725,-0.149665803,-0.253768742,-0.130375057,-2.44589424,2.78267646,0.564957738,-0.106041111,1.34391129,2.39121079,-1.09815037,-0.0162310768,-0.94102025,0.592346966,-0.877611339,0.822100461,-0.396209598,1.37087905,0.662701786,-0.33238855,1.07927334,1.17617404,2.15566349,0.447210789,-1.01478684],"name":"frame-invariant-w6-10m","outputBias":-0.000645435241,"outputWeights":[-0.372818261,-0.117125496,-0.0229131225,0.205260545,0.0575807579,0.0352538787],"queryCount":4,"queryFromFirstPassAO":true,"queryProjectionWeights":[0.975692391,-0.855476856,-2.6112597,-1.33616245,0.3828471,3.75650811,-3.08311939,-0.183637097,0.799926639,5.05472469,-0.380684286,1.42757761,-0.550761044,-0.420882851,-2.77289224,0.530017316,0.332260936,6.08533239,-0.96134764,-0.0830586925,-3.43319321,1.98897922,0.527699769,10.3556395,3.0345726,-3.55960488,-1.13525546,-3.76720428,1.21770573,12.4426403,-2.60355425,-2.64093018,0.656545401,4.99599934,1.86864853,-6.22469091,-1.83889711,-0.437748134,0.187218606,4.74110746,2.51226878,8.91660213,-3.11046505,-0.588799357,-0.207253695,2.83699632,0.271253496,18.6212864,1.72839391,-1.38337183,1.96843684,-2.33901262,2.90269828,-1.4839524,-1.8591361,2.04251933,1.77161074,5.4193306,-1.36599183,-3.14757466,-0.182765603,1.29674315,-1.05521429,2.25401402,-0.206811205,-0.963144422,5.71507502,-5.14344263,-0.273849398,-4.3076787,6.69000673,3.99203897,0.315123528,-1.32465971,-3.10114861,-0.0378758125,1.19637573,4.44451952,-3.18032098,1.86546385,-2.12358069,4.2800293,-0.502741039,2.31843925,-6.06618166,2.66684651,4.63418913,9.45241642,-1.13186729,-1.45928359,4.54390574,-3.34962153,4.75198603,-6.77375507,2.47302985,12.7788935,3.34261918,-0.862356305,-1.74229538,-4.1722517,1.20036793,11.4210844,-0.552534938,0.389627963,3.99119306,2.24200583,-0.331534415,-5.28202963,0.189935967,0.173227698,2.12633395,0.24529539,-0.0643746853,3.959975,2.03217721,-1.84745824,0.705346525,-1.83792317,0.959801376,-2.78693771,1.99272621,-1.12983501,1.57759488,-5.68606377,0.390426129,1.56775129,-4.77044725,1.86877048,-1.27339029,8.22656536,-2.00721741,4.65022182,-0.240057006,-1.57647789,0.402640164,1.49630237,1.89653265,-2.45852304,1.37989998,-3.74320769,2.44625449,-2.83335567,6.08127356,-1.23896909],"summaryQueries":[0.105387516,0.454028875,-0.430081159,-0.00702179037,0.264354616,-0.228132203,-0.205108106,-0.776229739,-0.466881812,-0.23857826,0.0964843929,-0.13933751,-0.360518366,-0.146551028,0.245282218,0.021966394,0.156582892,-0.213874325,-0.596480668,-0.122390099,0.559692681,-0.455402851,-0.391503394,0.411942124],"supportedAOSamples":[4,64],"supportedDenoiseSamples":[2,16],"tapCountFeature":false,"tapEncoder":"linear-relu","tapFeatureInverseStandardDeviation":[0.804488063,0.790003598,2.48642254,10.2363062,0.122284018],"tapFeatureMean":[0.467297286,0.156966567,0.804100096,0.919606507,1.74726188],"tapFeatureVersion":5,"tapInputBias":[0.0971546993,-0.196101248,-0.284570098,-0.523338139,0.00586045114,0.0224223025],"tapInputWeights":[0.00661610765,-0.472614795,-0.0546437837,-0.533988655,-1.52223134,-3.41688681,10.5672903,-0.0541227944,0.0142248608,-3.16285706,-0.262887836,-0.757909834,0.036780443,-0.0345010608,-2.91157413,-0.578761101,0.264023542,0.585413754,-0.157820433,-1.02857625,0.0244998131,0.0972569212,0.384179115,0.0317516029,-1.87528634,-2.34754252,11.6873474,-0.0754929557,-0.0365382731,-3.03491616],"tokenWidth":6,"valueProjectionWeights":[1.72991586,0.549711049,-3.3594563,-2.85523748,0.253419191,-1.82095242,1.27579415,0.107942834,-2.52012038,-1.24624097,-0.0739918947,1.59550142,0.0109700505,-0.268934995,0.866448998,0.158989862,0.0336840302,1.64906037,0.925075948,0.61349386,-3.0673039,-2.29413342,0.776243091,-0.186843738,0.648555934,-0.561347127,0.0298922714,-0.641319573,0.356067508,1.07836664,-0.447507739,-0.293157369,0.91070205,0.472602487,-1.01833785,0.504232585],"viewFeatures":true}');


var $104732b38c190886$exports = {};
$104732b38c190886$exports = JSON.parse('{"aoCountFeature":true,"architecture":"attention-v3-pilot","attention":"softmax","dynamicQueries":true,"formatVersion":5,"globalBias":[-0.23487520217895508,0.48950883746147156,-0.30546849966049194,0.3173615634441376,0.40140286087989807,0.13670527935028076],"globalFeatureInverseStandardDeviation":[10.773446083068848,1.9641679525375366,1.6521402597427368,3.2980902194976807,3.2336764335632324,4.083446502685547,2.738823413848877],"globalFeatureMean":[0.9217362403869629,-0.4923144578933716,0.025043003261089325,-0.005237828008830547,0.6033159494400024,0.6232529282569885,2.4497241973876953],"globalWeights":[0.0254850871860981,-0.005317260976880789,-0.007180850952863693,-0.011134599335491657,0.16255147755146027,0.09508438408374786,-0.03838718682527542,-0.3525480031967163,-0.0013057778123766184,-0.16403229534626007,-0.0007288795313797891,0.037009816616773605,-0.009373570792376995,-0.01332339271903038,0.014168626628816128,-0.017612656578421593,-0.03153218328952789,-0.06766011565923691,0.0719003677368164,0.15814851224422455,0.0037323313299566507,-0.07866669446229935,0.06905446946620941,0.19048629701137543,0.02467098832130432,0.16497652232646942,-0.14165738224983215,0.09195740520954132,-0.35943859815597534,0.008146993815898895,0.0015961445169523358,0.0015487642958760262,0.01159310806542635,0.06655143946409225,0.005057391710579395,0.018260549753904343,0.033460550010204315,0.02979891747236252,0.0037130878772586584,0.04297925531864166,0.17526447772979736,0.009302761405706406],"headBias":[-0.49185827374458313,0.01934732310473919,0.0871024876832962,-0.21218806505203247,-0.602699875831604,-0.12136935442686081],"headWeights":[1.1111266613006592,-0.22586572170257568,0.7198730707168579,-1.0440499782562256,0.6581113338470459,-0.5818682909011841,-0.6787620186805725,-0.23400487005710602,1.6469072103500366,0.49851536750793457,-0.30568569898605347,-0.9663941264152527,0.5640100836753845,0.6568309664726257,-1.4944493770599365,-0.6121277809143066,0.026223815977573395,1.0962004661560059,-0.2954123020172119,-0.7416629195213318,-1.0015654563903809,0.1011672243475914,-0.2750880718231201,0.18900208175182343,1.8824331760406494,-0.26637592911720276,1.5055253505706787,-1.4948325157165527,0.7318506240844727,0.6958283185958862,-2.680665969848633,0.649141788482666,-0.4300307631492615,2.736664295196533,-2.1459434032440186,-0.18622294068336487,-0.15705765783786774,0.1756553202867508,-0.8836584687232971,-1.3167157173156738,0.48064854741096497,0.24636563658714294,0.8171942830085754,-0.96866375207901,-0.12311527878046036,0.08907859772443771,1.195731520652771,-0.6010469794273376,-0.31442177295684814,0.06256319582462311,-1.1403552293777466,1.0083950757980347,-0.576816201210022,-0.25378674268722534,0.6654301285743713,0.16491831839084625,-0.6477665305137634,-0.08394690603017807,-1.187951922416687,2.8633618354797363,-1.0537290573120117,-0.6821820735931396,-0.27677592635154724,-0.4933861494064331,0.21415925025939941,-0.6251292824745178,1.0035784244537354,0.8126304745674133,1.3597149848937988,-0.7649092674255371,1.516508936882019,-1.4109125137329102,-0.7758139967918396,-0.0921848714351654,-0.44705119729042053,0.5487695932388306,-0.3681693375110626,-0.3481566309928894,-3.7185323238372803,1.2142832279205322,-0.9279266595840454,2.0219886302948,0.7140060663223267,2.4866034984588623,2.372790575027466,-0.6958968639373779,0.3724961578845978,-0.9226368069648743,-1.1621181964874268,-1.0456132888793945,-0.3726767897605896,-0.6010353565216064,-0.5882084369659424,0.04617524892091751,-1.1128591299057007,-0.7252252697944641,0.13949793577194214,0.21132798492908478,-0.0711992084980011,-0.9696488380432129,0.810234785079956,-0.2613503932952881,-1.744551420211792,-1.3586777448654175,0.23254269361495972,2.1415467262268066,-1.0351390838623047,1.022532343864441,1.313363790512085,0.4526016414165497,-0.748141348361969,-1.034693956375122,0.25396692752838135,-0.07268429547548294,0.5651341676712036,0.349802166223526,0.82906174659729,-0.6540957689285278,1.0928452014923096,-0.6196309924125671,-2.2302732467651367,0.3302135467529297,-2.3436026573181152,2.132598876953125,-0.9235839247703552,-0.6759827136993408,2.1004369258880615,-1.3787437677383423,1.6141383647918701,-3.3350090980529785,3.1086294651031494,0.2884121239185333,0.6482406854629517,-0.13405828177928925,0.6876323819160461,1.7825440168380737,-0.6432068943977356,-0.7366701364517212,0.15928620100021362,1.4169843196868896,0.14321061968803406,-0.9000707268714905,-1.8254214525222778,0.9403988122940063],"headWidth":6,"keyProjectionWeights":[1.968758225440979,0.06029555946588516,1.6496589183807373,0.1969003528356552,0.5812652707099915,-0.49263983964920044,-1.4162286520004272,0.6467267870903015,0.9389017820358276,-0.5666568279266357,0.09210626035928726,0.0154453469440341,1.9790271520614624,-0.6524197459220886,0.3852829337120056,-1.0139862298965454,1.4543485641479492,-1.4742259979248047,0.8402373790740967,-1.6299901008605957,0.5867784023284912,0.180627703666687,0.055871233344078064,-0.4523128867149353,-0.5280774235725403,1.2441636323928833,-1.3873804807662964,0.446940541267395,-1.6125956773757935,0.6829583644866943,-0.19958287477493286,0.5077139139175415,1.8004628419876099,-1.0888164043426514,-2.082960844039917,1.764892339706421],"name":"low-end-ao4-8-taps2-8-w6-10m","outputBias":-0.00394976744428277,"outputWeights":[0.09832457453012466,-0.1482764333486557,-0.08873635530471802,-0.403469443321228,-0.07190576940774918,0.09040576219558716],"queryCount":4,"queryFromFirstPassAO":true,"queryProjectionWeights":[-0.7426049709320068,-0.5719303488731384,-3.193450927734375,-0.9577654600143433,0.40415704250335693,-6.56830358505249,-1.1922619342803955,2.4809250831604004,1.2940878868103027,3.264608383178711,-3.5458452701568604,1.3190993070602417,0.7067117691040039,0.32265281677246094,3.1459200382232666,-2.2284884452819824,1.82660710811615,-2.1711184978485107,-2.0983083248138428,-1.545684814453125,-0.24569042026996613,0.03336392343044281,-0.7557753324508667,-4.336874008178711,0.7772427201271057,1.1340705156326294,0.39808061718940735,-0.6557901501655579,-0.717821478843689,0.36376991868019104,-4.532812595367432,2.2300631999969482,-2.299959421157837,-0.1159333810210228,-1.139514684677124,2.038274049758911,-2.1567769050598145,-1.2255606651306152,-2.2613525390625,-0.06955213844776154,0.686713695526123,-2.4105632305145264,1.5480830669403076,0.08907312154769897,2.8444554805755615,0.7416970729827881,-0.2882023751735687,-0.07773427665233612,1.5392664670944214,1.045050024986267,1.26668119430542,-0.4849325120449066,0.35273799300193787,-0.03617783635854721,-0.13010932505130768,-1.1637448072433472,0.429253488779068,0.06385817378759384,0.2689800560474396,-1.339846134185791,-0.4639604985713959,1.805208683013916,0.8485044836997986,0.4042709171772003,-2.134558916091919,0.14060381054878235,0.7928856015205383,-0.014814537018537521,-0.7591497898101807,-0.09340336173772812,0.33959105610847473,0.3742930293083191,-1.9727059602737427,-0.8598183393478394,-1.752785086631775,0.2700415551662445,1.018426537513733,-2.5465080738067627,0.39994364976882935,-0.2866238057613373,1.853872537612915,-0.18617753684520721,0.3271365165710449,-0.4264972507953644,0.15499892830848694,0.7698414325714111,-2.9017550945281982,-0.3716241717338562,-0.46667245030403137,0.051073987036943436,0.25917312502861023,-0.4696865975856781,-1.3365131616592407,0.13455919921398163,0.09333230555057526,-0.7994267344474792,-1.4478063583374023,1.7429078817367554,0.47980016469955444,0.34636157751083374,-1.822554588317871,-1.5870182514190674,-0.9792371988296509,-0.2771056294441223,-3.4887828826904297,0.16184262931346893,0.11151053011417389,0.016441740095615387,0.4298795163631439,-0.012944431975483894,-2.3875114917755127,0.1880328208208084,-0.6474562883377075,-2.384657621383667,0.10586823523044586,0.09706966578960419,2.174907922744751,0.2628093659877777,-0.39121437072753906,0.8147315382957458,-0.21277876198291779,-0.3848346173763275,2.1808743476867676,-0.6166099309921265,1.595718502998352,0.0595792680978775,-0.6556687951087952,-1.1998558044433594,-1.393308401107788,0.17007943987846375,0.4996064305305481,0.14873987436294556,0.3305904269218445,0.3763549327850342,2.4247405529022217,-0.1099848523736,-0.4249989688396454,-1.2989078760147095,-0.6244494318962097,-0.6966514587402344,-3.378746509552002,-0.09526723623275757,0.9617002606391907,0.18756191432476044],"summaryQueries":[-1.3059139251708984,0.4513107240200043,-2.322615385055542,-0.4083015024662018,0.5291218757629395,-0.4556257128715515,-1.1942349672317505,0.32890892028808594,-0.21246710419654846,0.02615520730614662,0.20038092136383057,-0.6428561210632324,-0.34424054622650146,-0.26338937878608704,-0.0962071642279625,-0.018075427040457726,1.3589818477630615,-0.06518024206161499,-0.22449712455272675,0.1584227979183197,-0.4284190237522125,-0.6464412808418274,-0.17804966866970062,-0.6673154830932617],"supportedAOSamples":[4,8],"supportedDenoiseSamples":[2,8],"tapCountFeature":false,"tapEncoder":"linear-relu","tapFeatureInverseStandardDeviation":[0.8376936316490173,0.8167747855186462,2.484034538269043,10.07677173614502,0.11785588413476944],"tapFeatureMean":[0.46911320090293884,0.15568889677524567,0.8032788038253784,0.9206308126449585,1.809395432472229],"tapFeatureVersion":5,"tapInputBias":[0.5654292702674866,0.7262413501739502,-1.026995301246643,-0.14545153081417084,0.08620049804449081,-0.32537832856178284],"tapInputWeights":[0.017292853444814682,0.769314169883728,-0.2591651678085327,-0.15575125813484192,0.7818280458450317,-0.8210893869400024,0.4458440840244293,-0.06454126536846161,0.030049528926610947,-0.8847028017044067,-0.10588371008634567,-7.126821517944336,0.036367520689964294,0.034571573138237,-1.8666346073150635,-2.680792808532715,2.527808666229248,0.06735005229711533,-0.004615016747266054,1.3495070934295654,-0.0020523848943412304,-2.1540005207061768,-0.04858970269560814,-0.7296149730682373,-1.3557016849517822,-1.03042733669281,-0.8479847311973572,-0.07003267109394073,-0.9329867959022522,-2.451733350753784],"tokenWidth":6,"valueProjectionWeights":[0.8635621070861816,-0.3634067177772522,1.4282466173171997,-0.16784507036209106,0.8722880482673645,-0.7474117279052734,-1.572554349899292,0.011807848699390888,0.14296934008598328,0.8244637250900269,-0.1024855449795723,0.3010793924331665,0.21295760571956635,-0.36780381202697754,1.778749942779541,0.27103766798973083,-0.1235288754105568,0.37399497628211975,1.1257693767547607,-0.9169410467147827,3.380439043045044,0.12439541518688202,-0.1989397555589676,-0.15462400019168854,1.5927190780639648,0.41355714201927185,-0.569654643535614,0.8420050144195557,-0.8163355588912964,0.333870530128479,1.0588184595108032,-1.1987265348434448,0.4775378108024597,-0.05230499058961868,1.1195310354232788,-0.7227171063423157],"viewFeatures":true}');


var $475f4e1ec0a881da$exports = {};
$475f4e1ec0a881da$exports = JSON.parse('{"aoCountFeature":false,"architecture":"attention-v3-pilot","attention":"softmax","dynamicQueries":true,"formatVersion":5,"globalBias":[0.3415367603302002,0.4082188010215759,-0.16684558987617493,-0.09623096138238907,0.40162110328674316,0.6870759725570679],"globalFeatureInverseStandardDeviation":[14.32778263092041,1.884121298789978,1.652080774307251,3.365184783935547,3.1075286865234375,4.699100494384766],"globalFeatureMean":[0.9555400013923645,-0.5114423036575317,0.04568067193031311,0.001569038606248796,0.5547776818275452,0.6745914220809937],"globalWeights":[-0.22830034792423248,-0.051094744354486465,-0.344512015581131,0.007089327555149794,-0.043348051607608795,-0.09276396036148071,-0.05486375093460083,0.18106424808502197,0.1694583147764206,-0.023197153583168983,0.09547806531190872,0.05922706425189972,-0.15566955506801605,0.0845736637711525,0.11941134184598923,-0.01296475250273943,-0.09078185260295868,-0.4673057794570923,-0.07078322023153305,0.03164277970790863,0.02300436422228813,0.007936311885714531,0.031124748289585114,0.6225715279579163,0.1750756949186325,0.10866374522447586,0.08524356782436371,0.00658439751714468,-0.0668456107378006,-0.13015305995941162,0.3342185914516449,0.1907544583082199,0.20439626276493073,-0.018428325653076172,0.18159537017345428,0.22900885343551636],"halfResolution":true,"headBias":[-0.11416810005903244,0.07964055985212326,-0.06806863099336624,0.0038501343224197626,0.040354009717702866,0.06674038618803024],"headWeights":[-0.4640994369983673,0.018926702439785004,-0.13533449172973633,-0.22938643395900726,0.009525771252810955,-0.3001689016819,0.02202548086643219,0.2453767955303192,0.2933403551578522,0.24952922761440277,-0.7516289949417114,-0.01392917800694704,0.9657450914382935,1.0238590240478516,-0.36432692408561707,-0.06545613706111908,-0.16991490125656128,-0.4894498586654663,-0.3495199680328369,-0.6644460558891296,0.053451452404260635,-0.14739912748336792,0.14740459620952606,1.1581701040267944,-0.9495205879211426,0.30856919288635254,-0.8731852769851685,-0.5671781897544861,0.13287201523780823,-0.2512269616127014,1.2776426076889038,-0.07583127170801163,0.8658038973808289,0.6850570440292358,-0.47873616218566895,0.5940101146697998,-0.3332737684249878,0.5447549819946289,-0.559345543384552,-0.4433456063270569,-0.08191245049238205,-0.4857386350631714,0.235487699508667,-0.7909494042396545,0.661185622215271,-0.09463835507631302,0.4860266149044037,0.06314943730831146,-0.9830819964408875,0.06097106263041496,-0.3883771300315857,-1.0524128675460815,-0.0041238171979784966,-0.5205481052398682,-0.12415190041065216,0.1452372521162033,0.023789944127202034,1.2265452146530151,-0.43104827404022217,-0.2516288161277771,0.15755632519721985,0.11786606907844543,0.20667603611946106,-1.383582353591919,-0.1548992246389389,-0.26000967621803284,0.9690282940864563,-0.5563746094703674,0.43293341994285583,0.9071518778800964,0.69586580991745,0.49070027470588684,0.7428987622261047,-0.08652815222740173,0.7734517455101013,0.4622238278388977,-0.40358197689056396,-0.156002014875412,-0.7825685739517212,-0.23884020745754242,-0.5168832540512085,-0.5263991355895996,0.47761040925979614,0.6888848543167114,1.8525972366333008,0.40238267183303833,-0.10582409799098969,-1.480552315711975,1.047361135482788,-0.19110719859600067,-1.2935211658477783,0.14398373663425446,-0.24178177118301392,0.9450215101242065,-1.0469677448272705,-0.36496612429618835,0.15291893482208252,-0.23055820167064667,0.32076141238212585,-0.0033461370039731264,0.08584912866353989,-0.028479479253292084,-0.7471737265586853,-0.05064994469285011,0.3379823863506317,-0.25828948616981506,-0.6537284851074219,-0.694736123085022,0.4832485318183899,0.840389609336853,-0.45775526762008667,0.10633621364831924,-0.06729532778263092,-0.48524561524391174,0.08653950691223145,-0.44572219252586365,-0.10908707976341248,-0.03414439037442207,0.4199244976043701,1.0342738628387451,0.7314791679382324,-0.13269861042499542,0.4169081747531891,0.5329394340515137,0.0542592778801918,0.1498338282108307,-1.1465983390808105,0.09329517930746078,-0.9296138286590576,-1.5018470287322998,0.35964053869247437,-0.13306088745594025,0.21683169901371002,0.001978742890059948,-0.003005517413839698,0.08595708012580872,0.10927268117666245,0.14567796885967255,0.4596860706806183,-0.017128631472587585,0.4522404074668884,0.40431687235832214,-0.2267376035451889,-0.15480786561965942],"headWidth":6,"keyProjectionWeights":[1.0743968486785889,-0.31522753834724426,-0.13789422810077667,-0.6588653326034546,-0.07561295479536057,-0.9335454702377319,-0.01487213745713234,-1.3802809715270996,0.8195410370826721,1.102952241897583,-0.8498378396034241,0.706190288066864,-1.966288447380066,1.1210136413574219,-0.5516120791435242,-1.0897433757781982,1.0223802328109741,-1.3140889406204224,0.20167534053325653,0.9976780414581299,0.4491519331932068,-0.40820834040641785,0.8151915669441223,-0.7031775116920471,-0.23721280694007874,0.008917578496038914,-1.076572060585022,0.03306635841727257,-0.2085762768983841,-0.43795111775398254,0.09096845239400864,0.8193746209144592,0.09645097702741623,-0.5284878015518188,-0.6070249676704407,0.952181339263916],"name":"halfres-r24-w6-10m","outputBias":-0.001141887973062694,"outputWeights":[-0.08033348619937897,-0.11312445253133774,0.05444560572504997,0.05276890844106674,-0.06606808304786682,0.07891061902046204],"queryCount":4,"queryFromFirstPassAO":true,"queryProjectionWeights":[-0.8364990949630737,-3.0233566761016846,-0.3442854583263397,-1.083615779876709,1.6908210515975952,-0.9886903166770935,1.1950870752334595,0.6742460131645203,-0.6858260035514832,1.6143404245376587,3.0980851650238037,4.898868560791016,0.5032519102096558,-2.0328736305236816,0.0007768122013658285,-0.1973840743303299,2.993817090988159,-0.18793244659900665,-0.6154602766036987,-1.5944818258285522,0.3907843828201294,2.5655364990234375,-1.063948631286621,1.5036771297454834,-1.1844741106033325,-1.8838146924972534,0.6615119576454163,0.5850620269775391,-3.0083751678466797,0.9452061057090759,1.6498812437057495,-0.04793442785739899,-0.6147639155387878,-4.572556018829346,5.464226722717285,1.0062377452850342,0.6215742826461792,-0.7856212854385376,0.41761279106140137,0.1742991805076599,-1.1416757106781006,0.5232507586479187,1.8533458709716797,-0.46134254336357117,-0.436107337474823,0.508152186870575,2.248513698577881,1.1985458135604858,0.44868004322052,-0.4089008867740631,0.447164386510849,0.03767639771103859,0.8541422486305237,0.5278031826019287,0.561639130115509,-1.3058439493179321,0.24192160367965698,0.24033910036087036,0.5725159645080566,1.3959643840789795,-1.3122018575668335,0.684934675693512,0.3693007230758667,-0.02337006852030754,-0.002009764313697815,0.2245292216539383,1.8006508350372314,-0.9181729555130005,0.7256668210029602,-0.5521589517593384,-0.770067572593689,0.5162780284881592,-0.0628119558095932,-0.3567149341106415,0.4567009210586548,-0.09375373274087906,-1.1909592151641846,0.2829681932926178,0.3646962642669678,-0.35244184732437134,-0.7048134803771973,0.274361789226532,1.7396624088287354,0.9223706126213074,-0.07499420642852783,-0.06437613070011139,0.07612618058919907,-0.35587361454963684,-0.9122102856636047,0.38134026527404785,0.00507856672629714,-0.47192129492759705,-0.17764882743358612,-0.5668477416038513,1.3999978303909302,0.4975797235965729,-0.2864972651004791,0.28085026144981384,0.1488514244556427,-0.5350532531738281,-0.4610328674316406,0.3033447265625,1.2363266944885254,-0.5562520027160645,-0.666741132736206,-0.12524576485157013,0.530405580997467,0.3076270520687103,-0.25928106904029846,0.20386068522930145,0.11411076039075851,0.356564998626709,-1.474789023399353,-0.0022542462684214115,0.769967794418335,-0.21853111684322357,-0.16907602548599243,1.2655582427978516,2.348046064376831,0.9514631628990173,-0.002333088079467416,0.2552780508995056,0.07524729520082474,0.3060106039047241,-1.007356882095337,0.39073076844215393,-0.3431692123413086,-0.7208309769630432,-0.07652191072702408,0.8514524698257446,1.5842790603637695,0.7932853102684021,-0.49217814207077026,0.11068519949913025,0.4871797263622284,0.05158176273107529,1.0105245113372803,0.7907965779304504,-0.16744866967201233,0.20696884393692017,-1.7004191875457764,0.5724795460700989,-0.28956687450408936,-0.38299575448036194],"summaryQueries":[-0.6831215620040894,0.6311867833137512,-0.8240194320678711,-0.21020881831645966,0.37452322244644165,0.7811359763145447,-0.8128119111061096,-0.037001919001340866,0.6393308043479919,-0.30988550186157227,-0.293872594833374,-0.6090259552001953,-0.42756932973861694,0.12270799279212952,0.09413067996501923,0.13644303381443024,0.6673937439918518,-0.06420466303825378,-0.04550953954458237,0.7849200963973999,0.11615078151226044,-0.8335475325584412,-0.18970483541488647,-0.8479589223861694],"supportedAOSamples":[4,64],"supportedDenoiseSamples":[2,16],"tapCountFeature":false,"tapEncoder":"linear-relu","tapFeatureInverseStandardDeviation":[1.129726529121399,1.0906636714935303,3.25871205329895,13.365403175354004,0.169048473238945],"tapFeatureMean":[0.393989235162735,0.02706373855471611,0.8846182823181152,0.9539855718612671,0.9779379367828369],"tapFeatureVersion":5,"tapInputBias":[-0.05968135967850685,0.40128645300865173,0.3676106631755829,0.43632081151008606,0.2667112648487091,-0.28360697627067566],"tapInputWeights":[0.1367875188589096,-0.11661709100008011,-0.3707384467124939,-0.08733858168125153,1.951775312423706,-2.295248031616211,3.7642486095428467,-0.14622488617897034,0.2124585211277008,-1.09938383102417,0.27411553263664246,-0.9121370315551758,0.2122669517993927,0.15696923434734344,-4.478344917297363,-3.043544054031372,1.72374427318573,-0.17449459433555603,0.22755563259124756,-1.3451639413833618,0.16430269181728363,-0.37391841411590576,-0.014916449785232544,-0.625052809715271,-1.0245423316955566,-0.9597188234329224,1.5213099718093872,0.1632615476846695,-0.42775213718414307,-0.5722843408584595],"tokenWidth":6,"valueProjectionWeights":[-0.5791106224060059,-0.5383517742156982,-0.42644476890563965,0.8547752499580383,0.13658058643341064,-0.6452930569648743,-0.34030798077583313,0.16021066904067993,-1.0805267095565796,0.5308062434196472,0.2891160547733307,-0.295070081949234,-0.30386441946029663,0.5528252124786377,0.3455732464790344,-0.6142981648445129,-0.011208402924239635,-0.3313365876674652,1.2750017642974854,-0.15464529395103455,0.45798465609550476,0.015851326286792755,-1.2394341230392456,1.51675283908844,0.7760326862335205,-1.568787693977356,0.698053240776062,0.8221307992935181,-0.3420703709125519,0.5127549171447754,-0.6207800507545471,0.027017507702112198,0.4534338414669037,-0.22769692540168762,-0.43250134587287903,0.6465526223182678],"viewFeatures":true}');


var $216237dfe34660ff$exports = {};
$216237dfe34660ff$exports = JSON.parse('{"aoCountFeature":true,"architecture":"attention-v3-pilot","attention":"softmax","dynamicQueries":true,"formatVersion":5,"globalBias":[-0.3198130428791046,0.4621964693069458,0.11979507654905319,-0.3362836241722107,-0.03246693313121796,0.36117494106292725],"globalFeatureInverseStandardDeviation":[13.75318431854248,1.9015464782714844,1.5972281694412231,3.3482253551483154,3.1128716468811035,4.714102745056152,2.82527494430542],"globalFeatureMean":[0.9555054903030396,-0.5014526844024658,0.02391631156206131,0.002844449831172824,0.5547052025794983,0.6744586825370789,2.4688093662261963],"globalWeights":[-0.011659174226224422,0.03575826436281204,0.0659068375825882,-0.005945529788732529,0.09485199302434921,0.7067717909812927,-0.013656503520905972,0.10924661159515381,-0.0021182671189308167,0.0011400303337723017,-0.0005970761412754655,-0.014494558796286583,-0.05558965355157852,-0.009519142098724842,0.13093283772468567,-0.0008799858624115586,-0.06892896443605423,0.006082552019506693,-0.021069327369332314,-0.008815400302410126,-0.031907256692647934,1.0449752807617188,-0.06077992171049118,0.018840966746211052,-0.0030590512324124575,-0.02545272558927536,-0.06604462116956711,-0.01738095097243786,-0.3082149922847748,-0.12470187246799469,-0.3938072621822357,-0.006867499090731144,-0.0894615650177002,-0.1576204150915146,-0.06304008513689041,-0.02727997489273548,-0.09531105309724808,0.16344937682151794,-0.0011814470635727048,-0.11285676062107086,-0.20248013734817505,0.007925343699753284],"halfResolution":true,"headBias":[-0.005491150077432394,0.09067370742559433,0.38472336530685425,0.3219999670982361,-0.3463800251483917,0.1648607850074768],"headWeights":[0.12697002291679382,1.486151933670044,-0.6321180462837219,1.0358647108078003,0.19681382179260254,1.0987634658813477,-2.400468349456787,2.185788869857788,0.3948235809803009,-0.07627931237220764,1.1911675930023193,2.200221300125122,0.6626771092414856,-0.37286797165870667,-1.6102510690689087,0.040450505912303925,-0.7545972466468811,-2.2289867401123047,1.1527806520462036,-0.26928940415382385,0.6136049032211304,-1.1754579544067383,-0.4376399517059326,-0.5459316372871399,0.0010903991060331464,0.6588382124900818,-0.34718120098114014,-0.37239518761634827,0.024124285206198692,0.6609070301055908,-0.710561990737915,0.21747325360774994,0.6900713443756104,0.4795707166194916,0.3859097361564636,0.06570284813642502,0.3022500276565552,0.011044642888009548,-0.07519306242465973,-0.217575803399086,-0.7890531420707703,-0.7999507188796997,0.5893385410308838,-0.840714693069458,-0.12399818748235703,0.07027088850736618,0.12362434715032578,0.1724563091993332,-0.16638433933258057,0.479497492313385,-0.1266680806875229,0.07807710021734238,0.19778770208358765,0.9826390147209167,0.0045632487162947655,-0.9945358037948608,0.4166831076145172,-0.6617562174797058,0.435362845659256,-0.4251214265823364,0.042026881128549576,1.0004266500473022,-0.42482319474220276,0.10521756112575531,-0.6241959929466248,-0.08027149736881256,-0.029701415449380875,-0.001538985874503851,-0.032443657517433167,0.20462368428707123,0.01400839164853096,-0.07756165415048599,-0.35733434557914734,-0.07182656973600388,-0.03510478883981705,-0.03367917984724045,-0.6418298482894897,-0.16706225275993347,0.009849101305007935,0.7374500632286072,-1.7371770143508911,-0.9573900103569031,-1.595025897026062,-0.32510197162628174,0.21796202659606934,-0.061913639307022095,-0.04327717050909996,0.4143458902835846,1.2904736995697021,0.38356146216392517,-0.568250834941864,0.1093679741024971,0.6875637173652649,-0.020610814914107323,0.5238576531410217,0.7289501428604126,-0.09038779139518738,0.7243658900260925,-0.5790347456932068,-0.05818081647157669,-0.21121671795845032,0.2240002304315567,-0.5271614193916321,-0.6503554582595825,0.13784991204738617,0.083452507853508,0.20016145706176758,0.17993955314159393,0.08826418966054916,0.4003436863422394,-0.104472815990448,-0.17553770542144775,-0.38760995864868164,0.03262068331241608,0.8973648548126221,-0.4956895112991333,0.23113630712032318,0.2059357762336731,0.16896586120128632,-0.4677483141422272,0.21322685480117798,-0.19283628463745117,0.4886004626750946,0.2877121567726135,0.229716956615448,-0.4374759793281555,0.43165263533592224,-0.14368227124214172,-0.8074246048927307,0.03832073509693146,0.8028852343559265,-0.4065983295440674,-0.9018722772598267,0.5889996290206909,1.1141420602798462,-0.8406279683113098,-0.581637442111969,1.268032431602478,0.21262231469154358,-0.0448884479701519,-0.5887182354927063,0.20177946984767914,-0.4357456862926483,-0.7045614123344421],"headWidth":6,"keyProjectionWeights":[0.3196025788784027,0.41115787625312805,0.5520728826522827,1.5160213708877563,-0.1650206744670868,-0.6802523136138916,-0.6249227523803711,-0.8044249415397644,0.8723970651626587,-0.1537444293498993,0.978257954120636,0.5356707572937012,0.38293805718421936,-0.7429642081260681,-0.14657729864120483,-0.8046625256538391,0.5713147521018982,-1.272758960723877,-0.8102282881736755,0.2579136788845062,1.8006619215011597,-3.361179828643799,-0.12005804479122162,-0.5009894967079163,-1.1810256242752075,-0.3583584427833557,-0.0739733874797821,0.15955999493598938,0.40309274196624756,-0.37445375323295593,0.3187107741832733,0.6644556522369385,-0.07355386018753052,-1.1062809228897095,0.08947483450174332,0.08639319241046906],"name":"halfres-lowend-ao4-8-taps2-8-r24-w6-10m","outputBias":-0.008064254187047482,"outputWeights":[0.05921441689133644,-0.11912118643522263,0.12144560366868973,0.07663485407829285,-0.15401549637317657,0.08530080318450928],"queryCount":4,"queryFromFirstPassAO":true,"queryProjectionWeights":[0.9439855813980103,0.2634672522544861,-2.798868179321289,1.28986394405365,0.015298767015337944,-1.0957112312316895,0.22253455221652985,-0.9855132102966309,-0.11677511036396027,-0.7050121426582336,-0.5463969111442566,0.36258527636528015,0.404987096786499,0.8095003366470337,-0.3161497712135315,1.5516482591629028,0.3189839720726013,-0.519627571105957,-0.43169212341308594,-2.062901020050049,2.0220491886138916,-2.6193349361419678,-0.5738628506660461,-0.007839156314730644,0.20730368793010712,0.3266517221927643,1.0123913288116455,1.2757887840270996,0.7285013794898987,-1.5216072797775269,-0.18242749571800232,-0.1601787954568863,-0.3352344334125519,1.1276977062225342,0.22801077365875244,-0.19539566338062286,-0.14803293347358704,-2.357962131500244,-2.9891157150268555,0.5116599202156067,-0.505539059638977,-0.28880056738853455,0.14494404196739197,-0.9457935690879822,-2.6363792419433594,-0.03499924764037132,-0.20277877151966095,-0.40832045674324036,0.7324828505516052,0.5909420251846313,0.05086839199066162,0.7301332354545593,0.4303695857524872,0.016722282394766808,-0.8610791563987732,-1.8339946269989014,1.310667634010315,-1.5207628011703491,-0.009985758922994137,0.4485096335411072,-0.04359700158238411,-0.6340705156326294,2.8351168632507324,-0.012090243399143219,0.48313698172569275,-0.5672005414962769,0.2623421251773834,-1.9412641525268555,-4.415369033813477,1.308350920677185,0.34898725152015686,-1.304937720298767,-0.7426295876502991,0.9071046113967896,1.6402188539505005,-0.8991245031356812,-0.5255399346351624,0.2967768609523773,0.17994362115859985,1.6290701627731323,-1.4749226570129395,-0.3682224154472351,0.053420890122652054,-0.5845384001731873,0.8563029170036316,-1.2358616590499878,-0.5046566724777222,0.7880385518074036,0.25138530135154724,0.05738065391778946,-0.46602511405944824,-0.43377381563186646,0.24630382657051086,-0.9830443859100342,0.1665915995836258,0.6318179965019226,-0.5698667168617249,-1.0392647981643677,1.8079851865768433,0.24400252103805542,0.3969854414463043,0.0694936141371727,-0.2979617416858673,-0.1347111314535141,0.014600541442632675,0.20383712649345398,0.4279293417930603,-0.056503064930438995,-0.12996114790439606,-1.782130241394043,-0.10443630814552307,1.2110345363616943,-0.0820847675204277,-0.36476296186447144,0.39254459738731384,0.09328363090753555,-2.6527786254882812,0.05625227466225624,0.027634616941213608,-1.1020320653915405,0.29280638694763184,0.6204910278320312,-1.8372011184692383,0.5345343947410583,0.11145419627428055,0.40972527861595154,0.26381367444992065,0.40174195170402527,0.5196073651313782,-1.3149847984313965,0.133244127035141,-0.14544466137886047,0.18221737444400787,-0.2907179594039917,2.59808611869812,1.2028559446334839,0.16173136234283447,-0.04112636297941208,-0.577499508857727,-0.349185585975647,0.9895521998405457,0.07286140322685242,0.13262540102005005,0.728203296661377],"summaryQueries":[-0.6004841923713684,0.4441118538379669,-0.5248870849609375,-0.4831331670284271,0.3529265820980072,0.4784294664859772,-0.26624274253845215,0.47364991903305054,0.20335544645786285,-0.34292635321617126,0.2609531283378601,-0.9677605628967285,-0.5737055540084839,0.28534114360809326,0.161922886967659,0.3595702052116394,0.8298744559288025,-0.25901392102241516,-0.26474785804748535,0.6882280111312866,0.2539561688899994,-0.7672181725502014,-0.335147887468338,-0.7452542185783386],"supportedAOSamples":[4,8],"supportedDenoiseSamples":[2,8],"tapCountFeature":false,"tapEncoder":"linear-relu","tapFeatureInverseStandardDeviation":[1.1515717506408691,1.0871944427490234,3.143930435180664,12.819302558898926,0.16889989376068115],"tapFeatureMean":[0.4169483482837677,0.027962181717157364,0.8749999403953552,0.9536586403846741,1.0255751609802246],"tapFeatureVersion":5,"tapInputBias":[0.19159507751464844,0.6269030570983887,0.6338620781898499,0.5564900636672974,0.35316258668899536,-0.2602163851261139],"tapInputWeights":[0.896274209022522,-6.723811626434326,-0.5586385726928711,0.18324045836925507,1.0927767753601074,0.07140769809484482,5.00568151473999,-0.27998945116996765,-0.13933396339416504,1.2269103527069092,0.6970008611679077,-5.501674175262451,0.18685966730117798,0.044365085661411285,-1.9498289823532104,0.12290377169847488,-0.9575690627098083,0.41391539573669434,0.32891175150871277,-1.7544350624084473,-3.2326886653900146,5.646435737609863,-0.16970933973789215,-0.040028393268585205,-1.3030297756195068,-5.924145221710205,-0.22688867151737213,-0.05720207467675209,0.27684393525123596,-2.4887847900390625],"tokenWidth":6,"valueProjectionWeights":[-0.17890113592147827,0.035887137055397034,-0.6631529331207275,0.7090420126914978,0.5978066325187683,-0.21369442343711853,-0.248879536986351,-0.4442882537841797,-0.3240104913711548,-0.08670275658369064,0.12696222960948944,0.08949488401412964,-0.6833963990211487,0.1935519278049469,1.2395929098129272,-0.8060399889945984,-0.37402594089508057,-0.0259151142090559,-0.17773492634296417,0.5507774949073792,-0.18875859677791595,0.38419610261917114,-0.5286281704902649,0.39932018518447876,0.47954198718070984,-0.21882106363773346,-0.3402658998966217,0.9642471075057983,-0.10009662806987762,-0.1036665216088295,-0.06740610301494598,0.10254493355751038,-0.5368606448173523,0.5164257884025574,-0.0014515522634610534,-0.30093300342559814],"viewFeatures":true}');


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
const $1193f60a44983e43$export$baaf2c3f0847a921 = [
    (0, (/*@__PURE__*/$parcel$interopDefault($104732b38c190886$exports))),
    (0, (/*@__PURE__*/$parcel$interopDefault($62561e92e160ec9a$exports))),
    (0, (/*@__PURE__*/$parcel$interopDefault($216237dfe34660ff$exports))),
    (0, (/*@__PURE__*/$parcel$interopDefault($475f4e1ec0a881da$exports)))
];
const $1193f60a44983e43$var$TAP_FEATURES = 5;
// AO, log radius, log falloff and the view direction in the tangent frame.
const $1193f60a44983e43$var$CENTER_FEATURES = 6;
const $1193f60a44983e43$var$layouts = (model)=>{
    const tokenWidth = model.tokenWidth;
    const queryWidth = model.queryCount * tokenWidth;
    const centerInputs = $1193f60a44983e43$var$CENTER_FEATURES + (model.aoCountFeature ? 1 : 0);
    return [
        [
            "tapInputWeights",
            tokenWidth * $1193f60a44983e43$var$TAP_FEATURES
        ],
        [
            "tapInputBias",
            tokenWidth
        ],
        [
            "tapFeatureMean",
            $1193f60a44983e43$var$TAP_FEATURES
        ],
        [
            "tapFeatureInverseStandardDeviation",
            $1193f60a44983e43$var$TAP_FEATURES
        ],
        [
            "globalWeights",
            tokenWidth * centerInputs
        ],
        [
            "globalBias",
            tokenWidth
        ],
        [
            "globalFeatureMean",
            centerInputs
        ],
        [
            "globalFeatureInverseStandardDeviation",
            centerInputs
        ],
        [
            "summaryQueries",
            queryWidth
        ],
        [
            "queryProjectionWeights",
            queryWidth * tokenWidth
        ],
        [
            "keyProjectionWeights",
            tokenWidth * tokenWidth
        ],
        [
            "valueProjectionWeights",
            tokenWidth * tokenWidth
        ],
        [
            "headWeights",
            model.headWidth * queryWidth
        ],
        [
            "headBias",
            model.headWidth
        ],
        [
            "outputWeights",
            model.headWidth
        ]
    ];
};
const $1193f60a44983e43$var$isRange = (value)=>value?.length === 2 && value.every(Number.isInteger) && value[0] >= 1 && value[0] <= value[1];
for (const model of $1193f60a44983e43$export$baaf2c3f0847a921){
    if (model.architecture !== "attention-v3-pilot" || model.formatVersion !== 5 || model.halfResolution !== undefined && typeof model.halfResolution !== "boolean" || !$1193f60a44983e43$var$isRange(model.supportedAOSamples) || !$1193f60a44983e43$var$isRange(model.supportedDenoiseSamples) || model.supportedDenoiseSamples[1] > 16 || !model.dynamicQueries || !model.queryFromFirstPassAO || !model.viewFeatures || model.tapCountFeature || model.tapFeatureVersion !== 5 || model.tapEncoder !== "linear-relu" || model.attention !== "softmax" || ![
        model.tokenWidth,
        model.queryCount,
        model.headWidth
    ].every((value)=>Number.isInteger(value) && value > 0) || !Number.isFinite(model.outputBias) || $1193f60a44983e43$var$layouts(model).some(([field, length])=>model[field]?.length !== length || model[field].some((value)=>!Number.isFinite(value)))) throw new Error(`The bundled N8AO neural denoise model ${model.name} has an unsupported layout.`);
}
const $1193f60a44983e43$var$inRange = ([low, high], value)=>value >= low && value <= high;
// The model for a configuration, or null when no bundled model supports it.
const $1193f60a44983e43$export$3f770962e32f9473 = (aoSamples, denoiseSamples, halfResolution = false)=>$1193f60a44983e43$export$baaf2c3f0847a921.find((model)=>Boolean(model.halfResolution) === Boolean(halfResolution) && $1193f60a44983e43$var$inRange(model.supportedAOSamples, aoSamples) && $1193f60a44983e43$var$inRange(model.supportedDenoiseSamples, denoiseSamples)) ?? null;
const $1193f60a44983e43$var$glslFloat = (value)=>{
    if (!Number.isFinite(value)) throw new Error("The bundled N8AO neural model contains a non-finite value.");
    if (value === 0) return "0.0";
    const text = Math.fround(value).toPrecision(9).replace(/\.?0+(e|$)/, "$1");
    return /[.eE]/.test(text) ? text : `${text}.0`;
};
const $1193f60a44983e43$var$weightedTerm = (coefficient, input)=>coefficient === 0 ? null : `${$1193f60a44983e43$var$glslFloat(coefficient)} * ${input}`;
const $1193f60a44983e43$var$constantTerm = (value)=>value === 0 ? null : $1193f60a44983e43$var$glslFloat(value);
const $1193f60a44983e43$var$sumTerms = (terms)=>terms.filter(Boolean).join(" + ") || "0.0";
const $1193f60a44983e43$var$range = (length)=>Array.from({
        length: length
    }, (_, index)=>index);
// Linear layer with normalization folded in: y_j = b_j + sum_i w_ji * (x_i - mean_i) * inv_i.
// Inputs past the shader's own (`constants`) are known when the shader is generated and are
// folded into the offset.
const $1193f60a44983e43$var$foldedLinear = (weights, bias, means, inverseStandardDeviations, rows, columns, constants = [])=>{
    const totalColumns = columns + constants.length;
    return $1193f60a44983e43$var$range(rows).map((row)=>{
        let offset = bias[row];
        const coefficients = $1193f60a44983e43$var$range(totalColumns).map((column)=>{
            const weight = weights[row * totalColumns + column] * inverseStandardDeviations[column];
            offset -= weight * means[column];
            return weight;
        });
        constants.forEach((value, index)=>{
            offset += coefficients[columns + index] * value;
        });
        return {
            offset: offset,
            coefficients: coefficients.slice(0, columns)
        };
    });
};
const $1193f60a44983e43$var$encoderShader = (functionName, layer, inputs)=>`
    void ${functionName}(float raw[${inputs}], out float token[NEURAL_TOKEN_WIDTH]) {
${layer.map(({ offset: offset , coefficients: coefficients  }, row)=>`        token[${row}] = max(${$1193f60a44983e43$var$sumTerms([
            $1193f60a44983e43$var$constantTerm(offset),
            ...coefficients.map((coefficient, column)=>$1193f60a44983e43$var$weightedTerm(coefficient, `raw[${column}]`))
        ])}, 0.0);`).join("\n")}
    }
`;
const $1193f60a44983e43$var$zeros = (length)=>`float[${length}](${new Array(length).fill("0.0").join(", ")})`;
const $1193f60a44983e43$var$generateShader = (model, aoSamples)=>{
    const tokenWidth = model.tokenWidth;
    const queryCount = model.queryCount;
    const headWidth = model.headWidth;
    const queryWidth = queryCount * tokenWidth;
    const tapEncoderShader = $1193f60a44983e43$var$encoderShader("neuralEncodeTap", $1193f60a44983e43$var$foldedLinear(model.tapInputWeights, model.tapInputBias, model.tapFeatureMean, model.tapFeatureInverseStandardDeviation, tokenWidth, $1193f60a44983e43$var$TAP_FEATURES), $1193f60a44983e43$var$TAP_FEATURES);
    const centerEncoderShader = $1193f60a44983e43$var$encoderShader("neuralEncodeCenter", $1193f60a44983e43$var$foldedLinear(model.globalWeights, model.globalBias, model.globalFeatureMean, model.globalFeatureInverseStandardDeviation, tokenWidth, $1193f60a44983e43$var$CENTER_FEATURES, model.aoCountFeature ? [
        Math.log2(aoSamples)
    ] : []), $1193f60a44983e43$var$CENTER_FEATURES);
    // The key projection is folded into the queries and the value projection into the head, so
    // a tap costs one dot product per query instead of two 6x6 projections plus the dot products:
    //   score_q = s * q_q . (K t) = (s K^T q_q) . t, and summing V t over taps equals V (sum of t).
    // neuralMakeQueries therefore returns s K^T q (still width x queries), neuralAttend sums
    // weighted tokens rather than values, and neuralHead applies V through its folded weights.
    const scale = 1 / Math.sqrt(tokenWidth);
    const key = (row, column)=>model.keyProjectionWeights[row * tokenWidth + column];
    const value = (row, column)=>model.valueProjectionWeights[row * tokenWidth + column];
    const foldedQueryWeight = (index, column)=>{
        const query = Math.floor(index / tokenWidth);
        const input = index % tokenWidth;
        return scale * $1193f60a44983e43$var$range(tokenWidth).reduce((sum, row)=>sum + key(row, input) * model.queryProjectionWeights[(query * tokenWidth + row) * tokenWidth + column], 0);
    };
    const foldedQueryBias = (index)=>{
        const query = Math.floor(index / tokenWidth);
        const input = index % tokenWidth;
        return scale * $1193f60a44983e43$var$range(tokenWidth).reduce((sum, row)=>sum + key(row, input) * model.summaryQueries[query * tokenWidth + row], 0);
    };
    const foldedHeadWeight = (row, index)=>{
        const query = Math.floor(index / tokenWidth);
        const input = index % tokenWidth;
        return $1193f60a44983e43$var$range(tokenWidth).reduce((sum, output)=>sum + model.headWeights[row * queryWidth + query * tokenWidth + output] * value(output, input), 0);
    };
    const queryShader = `
    void neuralMakeQueries(float token[NEURAL_TOKEN_WIDTH], out float queries[NEURAL_QUERY_WIDTH]) {
${$1193f60a44983e43$var$range(queryWidth).map((index)=>`        queries[${index}] = ${$1193f60a44983e43$var$sumTerms([
            $1193f60a44983e43$var$constantTerm(foldedQueryBias(index)),
            ...$1193f60a44983e43$var$range(tokenWidth).map((column)=>$1193f60a44983e43$var$weightedTerm(foldedQueryWeight(index, column), `token[${column}]`))
        ])};`).join("\n")}
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
${$1193f60a44983e43$var$range(queryCount).map((query)=>[
            `        weight = exp(min(${$1193f60a44983e43$var$range(tokenWidth).map((column)=>`queries[${query * tokenWidth + column}] * token[${column}]`).join(" + ")}, 60.0));`,
            `        denominator[${query}] += weight;`,
            ...$1193f60a44983e43$var$range(tokenWidth).map((column)=>`        summary[${query * tokenWidth + column}] += weight * token[${column}];`)
        ].join("\n")).join("\n")}
    }
`;
    const headShader = `
    float neuralHead(float summary[NEURAL_QUERY_WIDTH], float denominator[NEURAL_QUERY_COUNT]) {
${$1193f60a44983e43$var$range(queryCount).map((query)=>`        float inverseDenominator${query} = 1.0 / max(denominator[${query}], 1e-12);`).join("\n")}
${$1193f60a44983e43$var$range(headWidth).map((row)=>`        float head${row} = max(${$1193f60a44983e43$var$sumTerms([
            $1193f60a44983e43$var$constantTerm(model.headBias[row]),
            ...$1193f60a44983e43$var$range(queryWidth).map((index)=>$1193f60a44983e43$var$weightedTerm(foldedHeadWeight(row, index), `summary[${index}] * inverseDenominator${Math.floor(index / tokenWidth)}`))
        ])}, 0.0);`).join("\n")}
        return ${$1193f60a44983e43$var$sumTerms([
        $1193f60a44983e43$var$constantTerm(model.outputBias),
        ...$1193f60a44983e43$var$range(headWidth).map((row)=>$1193f60a44983e43$var$weightedTerm(model.outputWeights[row], `head${row}`))
    ])};
    }
`;
    return [
        `
    #define NEURAL_TOKEN_WIDTH ${tokenWidth}
    #define NEURAL_QUERY_COUNT ${queryCount}
    #define NEURAL_QUERY_WIDTH ${queryWidth}
    #define NEURAL_ZERO_SUMMARY ${$1193f60a44983e43$var$zeros(queryWidth)}
    #define NEURAL_ZERO_DENOMINATOR ${$1193f60a44983e43$var$zeros(queryCount)}
`,
        tapEncoderShader,
        centerEncoderShader,
        queryShader,
        attendShader,
        headShader
    ].join("\n");
};
const $1193f60a44983e43$var$shaderCache = new Map();
// GLSL for the model that covers this configuration, or null when none does.
const $1193f60a44983e43$export$ae948da21d595099 = (aoSamples, denoiseSamples, halfResolution = false)=>{
    const model = $1193f60a44983e43$export$3f770962e32f9473(aoSamples, denoiseSamples, halfResolution);
    if (!model) return null;
    const key = `${model.name}:${model.aoCountFeature ? aoSamples : ""}`;
    if (!$1193f60a44983e43$var$shaderCache.has(key)) $1193f60a44983e43$var$shaderCache.set(key, $1193f60a44983e43$var$generateShader(model, aoSamples));
    return $1193f60a44983e43$var$shaderCache.get(key);
};
const $1193f60a44983e43$export$89894d9cc6a8c1a = (model)=>$1193f60a44983e43$var$layouts(model).filter(([field])=>!/Mean|InverseStandardDeviation/.test(field)).reduce((sum, [, length])=>sum + length, 1);
// The AO and denoise sample ranges some bundled model covers.
const $1193f60a44983e43$export$6605e6adeefeae39 = [
    Math.min(...$1193f60a44983e43$export$baaf2c3f0847a921.map((model)=>model.supportedAOSamples[0])),
    Math.max(...$1193f60a44983e43$export$baaf2c3f0847a921.map((model)=>model.supportedAOSamples[1]))
];
const $1193f60a44983e43$export$979feb7d92dee6eb = [
    Math.min(...$1193f60a44983e43$export$baaf2c3f0847a921.map((model)=>model.supportedDenoiseSamples[0])),
    Math.max(...$1193f60a44983e43$export$baaf2c3f0847a921.map((model)=>model.supportedDenoiseSamples[1]))
];



// While neural denoising is on, the settings its models depend on are held to what the models
// cover: the denoise radius and iterations they were trained with, and the sample counts they
// support. Writes outside these ranges are refused, so neural denoising never turns itself off.
const $68771f61eadf8273$var$NEURAL_LIMITS = {
    aoSamples: {
        range: (0, $1193f60a44983e43$export$6605e6adeefeae39),
        fallback: 16
    },
    denoiseSamples: {
        range: (0, $1193f60a44983e43$export$979feb7d92dee6eb),
        fallback: 8
    },
    denoiseRadius: {
        range: [
            12,
            12
        ],
        fallback: 12
    },
    denoiseIterations: {
        range: [
            2,
            2
        ],
        fallback: 2
    }
};
const $68771f61eadf8273$var$withinNeuralLimits = (name, value)=>{
    const [low, high] = $68771f61eadf8273$var$NEURAL_LIMITS[name].range;
    return value >= low && value <= high;
};
// The error for writing value to the named setting while neural denoising is on, or null if it is allowed.
const $68771f61eadf8273$export$58695d39018e1e0 = (name, value)=>{
    if (!(name in $68771f61eadf8273$var$NEURAL_LIMITS) || $68771f61eadf8273$var$withinNeuralLimits(name, value)) return null;
    const [low, high] = $68771f61eadf8273$var$NEURAL_LIMITS[name].range;
    const allowed = low === high ? `stays ${low}` : `is ${low}-${high}`;
    return `[N8AO] ${name} ${allowed} while neuralDenoise is on, so ${value} was ignored. ` + `Turn neuralDenoise off to change it.`;
};
// Moves the settings into the neural limits. Returns the values it replaced, to put back later.
const $68771f61eadf8273$export$6a46389d92aff323 = (settings)=>{
    const replaced = {};
    for (const [name, { fallback: fallback  }] of Object.entries($68771f61eadf8273$var$NEURAL_LIMITS))if (!$68771f61eadf8273$var$withinNeuralLimits(name, settings[name])) {
        replaced[name] = {
            from: settings[name],
            to: fallback
        };
        settings[name] = fallback;
    }
    return replaced;
};
// Puts back what lockForNeural replaced, except settings changed since.
const $68771f61eadf8273$export$8c5a804edc87aa6c = (settings, replaced)=>{
    for (const [name, { from: from , to: to  }] of Object.entries(replaced))if (settings[name] === to) settings[name] = from;
};
let $68771f61eadf8273$var$warnedDepthAwareUpsampling = false;
// depthAwareUpsampling is always on now; the setting is kept so existing code keeps working.
const $68771f61eadf8273$export$4b3edb4f30cb8c0e = (value)=>{
    if (!value && !$68771f61eadf8273$var$warnedDepthAwareUpsampling) {
        console.warn("[N8AO] depthAwareUpsampling is always on; setting it to false does nothing.");
        $68771f61eadf8273$var$warnedDepthAwareUpsampling = true;
    }
};
// What a pass actually runs with its current configuration.
const $68771f61eadf8273$export$897f7e680386bfa8 = (pass)=>{
    const configuration = pass.configuration;
    const neural = pass.shouldUseNeuralDenoise();
    const iterations = configuration.denoiseIterations;
    return Object.freeze({
        aoSamples: configuration.aoSamples,
        resolution: configuration.halfRes ? "half" : "full",
        denoiser: iterations <= 0 ? "none" : neural ? "neural" : "bilateral",
        neuralModel: neural ? (0, $1193f60a44983e43$export$3f770962e32f9473)(configuration.aoSamples, configuration.denoiseSamples, configuration.halfRes).name : null,
        denoiseSamples: configuration.denoiseSamples,
        denoiseIterations: iterations,
        // In screen pixels. Bilateral denoising keeps its screen size at half resolution; the
        // half-resolution neural models were trained on twice that.
        denoiseRadius: configuration.denoiseRadius * (configuration.halfRes && neural ? 2 : 1),
        upsampling: !configuration.halfRes ? "none" : neural ? "learned" : "depth-aware",
        depthMips: pass.depthMipsSupported
    });
};


var $56b76cb998b211db$exports = {};
$56b76cb998b211db$exports = JSON.parse('{"architecture":"upsample-attention","featureInverseStandardDeviation":[2.15287184715271,2.1782360076904297,1.764146089553833,2.1500561237335205,1.5223102569580078,1.5223102569580078],"featureMean":[0.2157563716173172,-0.009060523472726345,0.4620492160320282,0.2185668796300888,-0.00004641203850042075,-0.00017390046559739858],"features":["neighbour AO","signed log1p height / half-res pixel","log1p in-plane distance / half-res pixel","normal agreement (neighbour z rebuilt from x, y)","screen offset x (half-res pixels)","screen offset y (half-res pixels, image-down)"],"formatVersion":1,"headBias":[-0.49836212396621704,-0.43638864159584045,-0.3448403477668762,0.0033751260489225388],"headWeights":[-0.23859690129756927,-0.2528063654899597,0.22717684507369995,0.08138161152601242,-0.062013860791921616,-0.01890455186367035,0.2710539996623993,-0.27808088064193726,0.3076658844947815,-1.5691200494766235,0.026774078607559204,0.38608577847480774,-0.5885924100875854,-0.40551555156707764,-0.17834876477718353,-0.5946246981620789],"headWidth":4,"logitBias":0.08565108478069305,"logitWeights":[-3.3090972900390625,-1.2691282033920288,-1.1384304761886597,-1.8641293048858643],"name":"upsample-attn-4-4-rebuilt-z-9.6m","outputBias":0.0016174089396372437,"outputWeights":[0.04738158732652664,-0.06951392441987991,-0.3849789500236511,-0.11321425437927246],"tokenBias":[2.5444843769073486,1.410379409790039,0.4129602015018463,-0.38071635365486145],"tokenWeights":[0.3278087079524994,0.14286136627197266,0.2755000591278076,-1.5989429950714111,-0.02162809856235981,0.01151680201292038,-0.4501010775566101,-0.6712762117385864,0.30405083298683167,-0.4180987775325775,0.05493999272584915,-0.054325446486473083,0.28790152072906494,0.27217385172843933,-0.9258096814155579,-0.31214186549186707,0.06527978926897049,0.08434554189443588,0.8333116769790649,-0.9605820178985596,-0.5541027188301086,-0.638063371181488,-0.0674639567732811,0.020165318623185158],"tokenWidth":4,"trainedOn":"600 scenes at half resolution, 4-64 AO samples, 2-16 denoise samples, shipped neural denoisers"}');


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
const $aa15e1bac241784c$var$FEATURES = 6;
const $aa15e1bac241784c$var$TOKEN_WIDTH = (0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).tokenWidth;
const $aa15e1bac241784c$var$HEAD_WIDTH = (0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).headWidth;
const $aa15e1bac241784c$var$LAYOUTS = [
    [
        "featureMean",
        $aa15e1bac241784c$var$FEATURES
    ],
    [
        "featureInverseStandardDeviation",
        $aa15e1bac241784c$var$FEATURES
    ],
    [
        "tokenWeights",
        $aa15e1bac241784c$var$TOKEN_WIDTH * $aa15e1bac241784c$var$FEATURES
    ],
    [
        "tokenBias",
        $aa15e1bac241784c$var$TOKEN_WIDTH
    ],
    [
        "logitWeights",
        $aa15e1bac241784c$var$TOKEN_WIDTH
    ],
    [
        "headWeights",
        $aa15e1bac241784c$var$HEAD_WIDTH * $aa15e1bac241784c$var$TOKEN_WIDTH
    ],
    [
        "headBias",
        $aa15e1bac241784c$var$HEAD_WIDTH
    ],
    [
        "outputWeights",
        $aa15e1bac241784c$var$HEAD_WIDTH
    ]
];
if ((0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).architecture !== "upsample-attention" || (0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).formatVersion !== 1 || ![
    $aa15e1bac241784c$var$TOKEN_WIDTH,
    $aa15e1bac241784c$var$HEAD_WIDTH
].every((value)=>Number.isInteger(value) && value > 0) || !Number.isFinite((0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).logitBias) || !Number.isFinite((0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).outputBias) || $aa15e1bac241784c$var$LAYOUTS.some(([field, length])=>(0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports)))[field]?.length !== length || (0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports)))[field].some((value)=>!Number.isFinite(value)))) throw new Error("The bundled N8AO neural upsample model has an unsupported layout.");
const $aa15e1bac241784c$var$glslFloat = (value)=>{
    if (value === 0) return "0.0";
    const text = Math.fround(value).toPrecision(9).replace(/\.?0+(e|$)/, "$1");
    return /[.eE]/.test(text) ? text : `${text}.0`;
};
const $aa15e1bac241784c$var$weightedTerm = (coefficient, input)=>coefficient === 0 ? null : `${$aa15e1bac241784c$var$glslFloat(coefficient)} * ${input}`;
const $aa15e1bac241784c$var$sumTerms = (terms)=>terms.filter(Boolean).join(" + ") || "0.0";
const $aa15e1bac241784c$var$range = (length)=>Array.from({
        length: length
    }, (_, index)=>index);
// Token layer with normalization folded in: t_j = b_j + sum_i w_ji * (f_i - mean_i) * inv_i.
const $aa15e1bac241784c$var$tokenLayer = $aa15e1bac241784c$var$range($aa15e1bac241784c$var$TOKEN_WIDTH).map((row)=>{
    let offset = (0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).tokenBias[row];
    const coefficients = $aa15e1bac241784c$var$range($aa15e1bac241784c$var$FEATURES).map((column)=>{
        const weight = (0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).tokenWeights[row * $aa15e1bac241784c$var$FEATURES + column] * (0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).featureInverseStandardDeviation[column];
        offset -= weight * (0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).featureMean[column];
        return weight;
    });
    return {
        offset: offset,
        coefficients: coefficients
    };
});
const $aa15e1bac241784c$var$zeros = (length)=>`float[${length}](${new Array(length).fill("0.0").join(", ")})`;
// Expects worldPos (view space) and normal at the full-resolution pixel, and the compositor's
// tDiffuse (half-res AO, normal in .gba), downsampledDepth, resolution, projectionMatrixInv,
// getWorldPos and vUv.
const $aa15e1bac241784c$export$fcb3ada4d2e35185 = `
    float neuralUpsample(vec3 worldPos, vec3 normal) {
        ivec2 halfSize = textureSize(tDiffuse, 0);
        vec2 pixelCenter = vUv * resolution * 0.5;
        ivec2 base = min(ivec2(pixelCenter), halfSize - 1);
        // View-space width of one half-res pixel at this depth.
        float footprint = max(2.0 * abs(worldPos.z) * projectionMatrixInv[1][1] / float(halfSize.y), 1e-6);
        float total = 0.0;
        float blendedAO = 0.0;
        float summary[${$aa15e1bac241784c$var$TOKEN_WIDTH}] = ${$aa15e1bac241784c$var$zeros($aa15e1bac241784c$var$TOKEN_WIDTH)};
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
                float f[${$aa15e1bac241784c$var$FEATURES}] = float[${$aa15e1bac241784c$var$FEATURES}](
                    sampleInfo.r,
                    sign(height) * log(1.0 + abs(height)),
                    log(1.0 + inPlane),
                    dot(normal, sampleNormal),
                    screen.x,
                    -screen.y
                );
${$aa15e1bac241784c$var$tokenLayer.map(({ offset: offset , coefficients: coefficients  }, row)=>`                float token${row} = max(${$aa15e1bac241784c$var$sumTerms([
        $aa15e1bac241784c$var$glslFloat(offset),
        ...coefficients.map((coefficient, column)=>$aa15e1bac241784c$var$weightedTerm(coefficient, `f[${column}]`))
    ])}, 0.0);`).join("\n")}
                // Logits stay small, so the softmax needs no running maximum; the clamp only
                // guards against overflow.
                float weight = exp(clamp(${$aa15e1bac241784c$var$sumTerms([
    $aa15e1bac241784c$var$glslFloat((0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).logitBias),
    ...$aa15e1bac241784c$var$range($aa15e1bac241784c$var$TOKEN_WIDTH).map((column)=>$aa15e1bac241784c$var$weightedTerm((0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).logitWeights[column], `token${column}`))
])}, -60.0, 60.0));
                total += weight;
                blendedAO += weight * sampleInfo.r;
${$aa15e1bac241784c$var$range($aa15e1bac241784c$var$TOKEN_WIDTH).map((column)=>`                summary[${column}] += weight * token${column};`).join("\n")}
            }
        }
        float inverseTotal = 1.0 / total;
${$aa15e1bac241784c$var$range($aa15e1bac241784c$var$HEAD_WIDTH).map((row)=>`        float head${row} = max(${$aa15e1bac241784c$var$sumTerms([
        $aa15e1bac241784c$var$glslFloat((0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).headBias[row]),
        ...$aa15e1bac241784c$var$range($aa15e1bac241784c$var$TOKEN_WIDTH).map((column)=>$aa15e1bac241784c$var$weightedTerm((0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).headWeights[row * $aa15e1bac241784c$var$TOKEN_WIDTH + column], `summary[${column}] * inverseTotal`))
    ])}, 0.0);`).join("\n")}
        return clamp(blendedAO * inverseTotal + ${$aa15e1bac241784c$var$sumTerms([
    $aa15e1bac241784c$var$glslFloat((0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).outputBias),
    ...$aa15e1bac241784c$var$range($aa15e1bac241784c$var$HEAD_WIDTH).map((row)=>$aa15e1bac241784c$var$weightedTerm((0, (/*@__PURE__*/$parcel$interopDefault($56b76cb998b211db$exports))).outputWeights[row], `head${row}`))
])}, 0.0, 1.0);
    }
`;



const $26aca173e0984d99$export$1efdf491687cd442 = {
    uniforms: {
        "sceneDepth": {
            value: null
        },
        "resolution": {
            value: /* @__PURE__ */ new $5Whe3$Vector2()
        },
        "near": {
            value: 0.1
        },
        "far": {
            value: 1000.0
        },
        "viewMatrixInv": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "projectionMatrixInv": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "projMat": {
            value: /* @__PURE__ */ new $5Whe3$Matrix4()
        },
        "logDepth": {
            value: false
        },
        "ortho": {
            value: false
        }
    },
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1);
    }`,
    fragmentShader: /* glsl */ `
    uniform highp sampler2D sceneDepth;
    uniform vec2 resolution;
    uniform float near;
    uniform float far;
    uniform bool logDepth;
    uniform bool ortho;
    uniform mat4 viewMatrixInv;
    uniform mat4 projectionMatrixInv;
    uniform mat4 projMat;
    varying vec2 vUv;
    layout(location = 1) out vec4 gNormal;
    vec3 getWorldPosLog(vec3 posS) {
        vec2 uv = posS.xy;
        float z = posS.z;
        float nearZ =near;
        float farZ = far;
        float depth = pow(2.0, z * log2(farZ + 1.0)) - 1.0;
        float a = farZ / (farZ - nearZ);
        float b = farZ * nearZ / (nearZ - farZ);
        float linDepth = a + b / depth;
        vec4 clipVec = vec4(uv, linDepth, 1.0) * 2.0 - 1.0;
        vec4 wpos = projectionMatrixInv * clipVec;
        return wpos.xyz / wpos.w;
      }
      vec3 getWorldPos(float depth, vec2 coord) {
        if (logDepth && !ortho) {
          return getWorldPosLog(vec3(coord, depth));
        }
        if (ortho) {
          #ifdef REVERSEDEPTH
          float z = depth;
          #else
          float z = depth * 2. - 1.;
          #endif
          vec4 clipSpacePosition = vec4(coord * 2. - 1., z, 1.);
          vec4 viewSpacePosition = projectionMatrixInv * clipSpacePosition;
          viewSpacePosition.xyz /= viewSpacePosition.w;
          return viewSpacePosition.xyz;
        }
        vec2 ndc = coord * 2. - 1.;
        #ifdef REVERSEDEPTH
        float ndcZ = depth;
        #else
        float ndcZ = depth * 2. - 1.;
        #endif
        mat4 Q = projectionMatrixInv;
        vec3 view = vec3(Q[0][0] * ndc.x + Q[3][0], Q[1][1] * ndc.y + Q[3][1], Q[3][2]);
        float invW = 1. / (Q[2][3] * ndcZ + Q[3][3]);
        return view * invW;
    }
  
    vec3 computeNormal(vec3 worldPos, vec2 vUv) {
      ivec2 p = ivec2(vUv * resolution);
      float c0 = texelFetch(sceneDepth, p, 0).x;
      float l2 = texelFetch(sceneDepth, p - ivec2(2, 0), 0).x;
      float l1 = texelFetch(sceneDepth, p - ivec2(1, 0), 0).x;
      float r1 = texelFetch(sceneDepth, p + ivec2(1, 0), 0).x;
      float r2 = texelFetch(sceneDepth, p + ivec2(2, 0), 0).x;
      float b2 = texelFetch(sceneDepth, p - ivec2(0, 2), 0).x;
      float b1 = texelFetch(sceneDepth, p - ivec2(0, 1), 0).x;
      float t1 = texelFetch(sceneDepth, p + ivec2(0, 1), 0).x;
      float t2 = texelFetch(sceneDepth, p + ivec2(0, 2), 0).x;
  
      float dl = abs((2.0 * l1 - l2) - c0);
      float dr = abs((2.0 * r1 - r2) - c0);
      float db = abs((2.0 * b1 - b2) - c0);
      float dt = abs((2.0 * t1 - t2) - c0);
  
      vec3 ce = getWorldPos(c0, vUv).xyz;
  
      vec3 dpdx = (dl < dr) ? ce - getWorldPos(l1, (vUv - vec2(1.0 / resolution.x, 0.0))).xyz
                            : -ce + getWorldPos(r1, (vUv + vec2(1.0 / resolution.x, 0.0))).xyz;
      vec3 dpdy = (db < dt) ? ce - getWorldPos(b1, (vUv - vec2(0.0, 1.0 / resolution.y))).xyz
                            : -ce + getWorldPos(t1, (vUv + vec2(0.0, 1.0 / resolution.y))).xyz;
  
      return normalize(cross(dpdx, dpdy));
  }
    bool isBackgroundDepth(float depth) {
      #ifdef REVERSEDEPTH
        return depth == 0.0;
      #else
        return depth == 1.0;
      #endif
    }
    // Later passes rebuild each half-res pixel's position at the pixel's center, but the chosen
    // depth belongs to one of its four full-res samples. On sloped surfaces that puts the position
    // in front of or behind the surface, so the depth is moved along the sample's tangent plane to
    // the center.
    float depthAtCenter(float depth, vec3 position, vec3 normal) {
        if (isBackgroundDepth(depth)) {
            return depth;
        }
        // The center's view ray, through the point at the same depth.
        vec3 center = getWorldPos(depth, vUv);
        vec3 origin = ortho ? center : vec3(0.0);
        vec3 direction = ortho ? vec3(0.0, 0.0, -1.0) : center;
        float facing = dot(direction, normal);
        if (abs(facing) < 1e-6 * length(direction)) {
            return depth;
        }
        vec3 onPlane = origin + direction * (dot(position - origin, normal) / facing);
        // Near grazing angles the plane runs almost along the ray; keep the sample there.
        if (distance(onPlane, center) > 4.0 * distance(position, center)) {
            return depth;
        }
        float centerDepth;
        if (logDepth && !ortho) {
            centerDepth = log2(1.0 - onPlane.z) / log2(far + 1.0);
        } else {
            vec4 clip = projMat * vec4(onPlane, 1.0);
            #ifdef REVERSEDEPTH
            centerDepth = clip.z / clip.w;
            #else
            centerDepth = clip.z / clip.w * 0.5 + 0.5;
            #endif
        }
        // Never move a surface onto or past the near and far planes.
        return centerDepth > 0.0 && centerDepth < 1.0 ? centerDepth : depth;
    }
    void main() {
        vec2 uv = vUv - vec2(0.5) / resolution;
        vec2 pixelSize = vec2(1.0) / resolution;
        highp vec2[4] uvSamples;
        uvSamples[0] = uv;
        uvSamples[1] = uv + vec2(pixelSize.x, 0.0);
        uvSamples[2] = uv + vec2(0.0, pixelSize.y);
        uvSamples[3] = uv + pixelSize;
        float depth00 = texture2D(sceneDepth, uvSamples[0]).r;
        float depth10 = texture2D(sceneDepth, uvSamples[1]).r;
        float depth01 = texture2D(sceneDepth, uvSamples[2]).r;
        float depth11 = texture2D(sceneDepth, uvSamples[3]).r;
        float minDepth = min(min(depth00, depth10), min(depth01, depth11));
        float maxDepth = max(max(depth00, depth10), max(depth01, depth11));
        float targetDepth = minDepth;
        // Checkerboard pattern to avoid artifacts
        if (mod(gl_FragCoord.x + gl_FragCoord.y, 2.0) > 0.5) { 
            targetDepth = maxDepth;
        }
        int chosenIndex = 0;
        float[4] samples;
        samples[0] = depth00;
        samples[1] = depth10;
        samples[2] = depth01;
        samples[3] = depth11;
        for(int i = 0; i < 4; ++i) {
            if (samples[i] == targetDepth) {
                chosenIndex = i;
                break;
            }
        }
        vec3 chosenPos = getWorldPos(samples[chosenIndex], uvSamples[chosenIndex]);
        vec3 chosenNormal = computeNormal(chosenPos, uvSamples[chosenIndex]);
        gl_FragColor = vec4(depthAtCenter(samples[chosenIndex], chosenPos, chosenNormal), 0.0, 0.0, 1.0);
        gNormal = vec4(chosenNormal, 0.0);
    }`
};












const $06269ad78f3c5fdf$var$BlueNoise = `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`;
const $06269ad78f3c5fdf$var$bluenoiseBits = /* @__PURE__ */ (()=>Uint8Array.from(atob($06269ad78f3c5fdf$var$BlueNoise), (c)=>c.charCodeAt(0)))();
var $06269ad78f3c5fdf$export$2e2bcd8739ae039 = $06269ad78f3c5fdf$var$bluenoiseBits;




const $ff9437d9c7577f11$var$version = /* @__PURE__ */ (()=>parseInt($5Whe3$REVISION.replace(/\D+/g, "")))();
const $ff9437d9c7577f11$export$156f6a58f569aa09 = $ff9437d9c7577f11$var$version >= 162 ? class extends $5Whe3$WebGLRenderTarget {
    constructor(width = 1, height = 1, count = 1, options = {}){
        super(width, height, {
            ...options,
            count: count
        });
        this.isWebGLMultipleRenderTargets = true;
    }
} : class extends $5Whe3$WebGLRenderTarget {
    constructor(width = 1, height = 1, count = 1, options = {}){
        super(width, height, options);
        this.isWebGLMultipleRenderTargets = true;
        const texture = this.texture;
        this.texture = [];
        for(let i = 0; i < count; i++){
            this.texture[i] = texture.clone();
            this.texture[i].isRenderTargetTexture = true;
        }
    }
    setSize(width, height, depth = 1) {
        if (this.width !== width || this.height !== height || this.depth !== depth) {
            this.width = width;
            this.height = height;
            this.depth = depth;
            for(let i = 0, il = this.texture.length; i < il; i++){
                this.texture[i].image.width = width;
                this.texture[i].image.height = height;
                this.texture[i].image.depth = depth;
            }
            this.dispose();
        }
        this.viewport.set(0, 0, width, height);
        this.scissor.set(0, 0, width, height);
    }
    copy(source) {
        this.dispose();
        this.width = source.width;
        this.height = source.height;
        this.depth = source.depth;
        this.scissor.copy(source.scissor);
        this.scissorTest = source.scissorTest;
        this.viewport.copy(source.viewport);
        this.depthBuffer = source.depthBuffer;
        this.stencilBuffer = source.stencilBuffer;
        if (source.depthTexture !== null) this.depthTexture = source.depthTexture.clone();
        this.texture.length = 0;
        for(let i = 0, il = source.texture.length; i < il; i++){
            this.texture[i] = source.texture[i].clone();
            this.texture[i].isRenderTargetTexture = true;
        }
        return this;
    }
};



/**
 * 
 * @param {*} timerQuery 
 * @param {THREE.WebGLRenderer} gl 
 * @param {N8AOPostPass | N8AOPass} pass 
 */ function $87431ee93b037844$var$checkTimerQuery(timerQuery, gl, pass) {
    const available = gl.getQueryParameter(timerQuery, gl.QUERY_RESULT_AVAILABLE);
    if (available) {
        const elapsedTimeInNs = gl.getQueryParameter(timerQuery, gl.QUERY_RESULT);
        const elapsedTimeInMs = elapsedTimeInNs / 1000000;
        pass.lastTime = pass.lastTime === 0 ? elapsedTimeInMs : pass.timeRollingAverage * pass.lastTime + (1 - pass.timeRollingAverage) * elapsedTimeInMs;
    } else // If the result is not available yet, check again after a delay
    setTimeout(()=>{
        $87431ee93b037844$var$checkTimerQuery(timerQuery, gl, pass);
    }, 1);
}
class $87431ee93b037844$export$2489f9981ab0fa82 extends (0, $5Whe3$Pass1) {
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
     */ constructor(scene, camera, width = 512, height = 512){
        super();
        this.width = Math.floor(width);
        this.height = Math.floor(height);
        this.clear = true;
        // Values neural denoising replaced when it was turned on, put back when it is turned off.
        this._neuralReplaced = {};
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
         * gammaCorrection: boolean,
         * depthBufferType: 1 | 2 | 3,
         * screenSpaceRadius: boolean,
         * halfRes: boolean,
         * depthAwareUpsampling: boolean, // always on; kept for compatibility
         * colorMultiply: boolean,
         * neuralDenoise: boolean
         * }
         */ this.autosetGamma = true;
        this.configuration = new Proxy({
            aoSamples: 16,
            aoRadius: 5.0,
            aoTones: 0.0,
            denoiseSamples: 8,
            denoiseRadius: 12,
            distanceFalloff: 1.0,
            intensity: 5,
            denoiseIterations: 2.0,
            renderMode: 0,
            biasOffset: 0.0,
            biasMultiplier: 0.0,
            color: new $5Whe3$Color(0, 0, 0),
            gammaCorrection: true,
            depthBufferType: (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Default,
            screenSpaceRadius: false,
            halfRes: false,
            depthAwareUpsampling: true,
            colorMultiply: true,
            transparencyAware: false,
            accumulate: false,
            neuralDenoise: false
        }, {
            set: (target, propName, value)=>{
                if (propName === "depthAwareUpsampling") {
                    (0, $68771f61eadf8273$export$4b3edb4f30cb8c0e)(value);
                    return true;
                }
                const refusal = target.neuralDenoise ? (0, $68771f61eadf8273$export$58695d39018e1e0)(propName, value) : null;
                if (refusal) {
                    console.error(refusal);
                    return true;
                }
                const oldProp = target[propName];
                target[propName] = value;
                if (value.equals) {
                    if (!value.equals(oldProp)) this.firstFrame();
                } else if (oldProp !== value) this.firstFrame();
                if (propName === "aoSamples" && oldProp !== value) {
                    this.configureAOPass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                    if (target.neuralDenoise) // The neural model and its AO-count input depend on aoSamples.
                    this.configureDenoisePass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                }
                if (propName === "denoiseSamples" && oldProp !== value) this.configureDenoisePass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                if (propName === "neuralDenoise" && oldProp !== value) {
                    const oldAOSamples = target.aoSamples;
                    if (value) this._neuralReplaced = (0, $68771f61eadf8273$export$6a46389d92aff323)(target);
                    else {
                        (0, $68771f61eadf8273$export$8c5a804edc87aa6c)(target, this._neuralReplaced);
                        this._neuralReplaced = {};
                    }
                    if (target.aoSamples !== oldAOSamples) this.configureAOPass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                    this.configureDenoisePass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                }
                if (propName === "halfRes" && oldProp !== value) {
                    this.configureAOPass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                    if (target.neuralDenoise) // Half resolution has its own neural models.
                    this.configureDenoisePass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                    this.configureHalfResTargets();
                    this.configureEffectCompositer(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                    this.setSize(this.width, this.height);
                }
                if (propName === "gammaCorrection") this.autosetGamma = false;
                if (propName === "transparencyAware" && oldProp !== value) {
                    this.autoDetectTransparency = false;
                    this.configureTransparencyTarget();
                }
                return true;
            }
        });
        // Far AO samples read coarser depth when float render targets are available.
        this.depthMipsSupported = true;
        this.depthMipAtlas = new (0, $92ca7181966e8293$export$1758a4e1ca12274d)();
        /** @type {THREE.Vector3[]} */ this.samples = [];
        /** @type {THREE.Vector2[]} */ this.samplesDenoise = [];
        this.autoDetectTransparency = true;
        this.frames = 0;
        this.lastViewMatrix = new $5Whe3$Matrix4();
        this.lastProjectionMatrix = new $5Whe3$Matrix4();
        this.configureEffectCompositer(this.configuration.depthBufferType);
        this.configureSampleDependentPasses();
        this.configureHalfResTargets();
        this.detectTransparency();
        this.configureTransparencyTarget();
        //   this.effectCompisterQuad = new FullScreenTriangle(new THREE.ShaderMaterial(EffectCompositer));
        this.copyQuad = new (0, $e4ca8dcb0218f846$export$dcd670d73db751f5)(new $5Whe3$ShaderMaterial({
            uniforms: {
                tDiffuse: {
                    value: null
                }
            },
            depthWrite: false,
            vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1);
            }
            `,
            fragmentShader: `
            uniform sampler2D tDiffuse;
            varying vec2 vUv;
            void main() {
                gl_FragColor = texture2D(tDiffuse, vUv);
            }
            `
        }));
        this.writeTargetInternal = new $5Whe3$WebGLRenderTarget(this.width, this.height, {
            minFilter: $5Whe3$LinearFilter,
            magFilter: $5Whe3$LinearFilter,
            depthBuffer: false,
            format: $5Whe3$RGBAFormat
        });
        this.readTargetInternal = new $5Whe3$WebGLRenderTarget(this.width, this.height, {
            minFilter: $5Whe3$LinearFilter,
            magFilter: $5Whe3$LinearFilter,
            depthBuffer: false,
            format: $5Whe3$RGBAFormat
        });
        this.outputTargetInternal = new $5Whe3$WebGLRenderTarget(this.width, this.height, {
            minFilter: $5Whe3$LinearFilter,
            magFilter: $5Whe3$LinearFilter,
            depthBuffer: false
        });
        this.accumulationRenderTarget = new $5Whe3$WebGLRenderTarget(this.width, this.height, {
            minFilter: $5Whe3$LinearFilter,
            magFilter: $5Whe3$LinearFilter,
            depthBuffer: false,
            format: $5Whe3$RGBAFormat,
            type: $5Whe3$HalfFloatType,
            stencilBuffer: false,
            depthBuffer: false,
            alpha: true
        });
        this.accumulationQuad = new (0, $e4ca8dcb0218f846$export$dcd670d73db751f5)(new $5Whe3$ShaderMaterial({
            uniforms: {
                frame: {
                    value: 0
                },
                tDiffuse: {
                    value: null
                }
            },
            transparent: true,
            opacity: 1,
            vertexShader: `
             varying vec2 vUv;
             void main() {
                 vUv = uv;
                 gl_Position = vec4(position, 1);
             }`,
            fragmentShader: `
             uniform sampler2D tDiffuse;
             uniform float frame;
                varying vec2 vUv;
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    gl_FragColor = vec4(color.rgb, 1.0 / (frame + 1.0));
                }
                `
        }));
        /** @type {THREE.DataTexture} */ this.bluenoise = new $5Whe3$DataTexture((0, $06269ad78f3c5fdf$export$2e2bcd8739ae039), 128, 128);
        this.bluenoise.colorSpace = $5Whe3$NoColorSpace;
        this.bluenoise.wrapS = $5Whe3$RepeatWrapping;
        this.bluenoise.wrapT = $5Whe3$RepeatWrapping;
        this.bluenoise.minFilter = $5Whe3$NearestFilter;
        this.bluenoise.magFilter = $5Whe3$NearestFilter;
        this.bluenoise.needsUpdate = true;
        this.lastTime = 0;
        this.timeRollingAverage = 0.99;
        this.needsDepthTexture = true;
        this.needsSwap = true;
        this._r = new $5Whe3$Vector2();
        this._c = new $5Whe3$Color();
    }
    // The half-res depth downsample, which needs to know whether depth is reversed.
    configureDepthDownsample() {
        const e = {
            ...(0, $26aca173e0984d99$export$1efdf491687cd442)
        };
        if (this.configuration.depthBufferType === (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Reverse) e.fragmentShader = "#define REVERSEDEPTH\n" + e.fragmentShader;
        this.depthDownsampleQuad?.dispose();
        this.depthDownsampleQuad = new (0, $e4ca8dcb0218f846$export$dcd670d73db751f5)(new $5Whe3$ShaderMaterial(e));
    }
    configureHalfResTargets() {
        this.firstFrame();
        if (this.configuration.halfRes) {
            this.depthDownsampleTarget = new (0, $ff9437d9c7577f11$export$156f6a58f569aa09)(Math.floor(this.width / 2), Math.floor(this.height / 2), 2);
            if ($5Whe3$REVISION <= 161) this.depthDownsampleTarget.textures = this.depthDownsampleTarget.texture;
            this.depthDownsampleTarget.textures[0].format = $5Whe3$RedFormat;
            this.depthDownsampleTarget.textures[0].type = $5Whe3$FloatType;
            this.depthDownsampleTarget.textures[0].minFilter = $5Whe3$NearestFilter;
            this.depthDownsampleTarget.textures[0].magFilter = $5Whe3$NearestFilter;
            this.depthDownsampleTarget.textures[0].depthBuffer = false;
            this.depthDownsampleTarget.textures[1].format = $5Whe3$RGBAFormat;
            this.depthDownsampleTarget.textures[1].type = $5Whe3$HalfFloatType;
            this.depthDownsampleTarget.textures[1].minFilter = $5Whe3$NearestFilter;
            this.depthDownsampleTarget.textures[1].magFilter = $5Whe3$NearestFilter;
            this.depthDownsampleTarget.textures[1].depthBuffer = false;
            this.configureDepthDownsample();
        } else {
            if (this.depthDownsampleTarget) {
                this.depthDownsampleTarget.dispose();
                this.depthDownsampleTarget = null;
            }
            if (this.depthDownsampleQuad) {
                this.depthDownsampleQuad.dispose();
                this.depthDownsampleQuad = null;
            }
        }
    }
    detectTransparency() {
        if (this.autoDetectTransparency) {
            let isTransparency = false;
            this.scene.traverse((obj)=>{
                if (obj.material && obj.material.transparent) isTransparency = true;
            });
            if (isTransparency) this.configuration.transparencyAware = true;
        }
    }
    configureTransparencyTarget() {
        if (this.configuration.transparencyAware) {
            this.transparencyRenderTargetDWFalse = new $5Whe3$WebGLRenderTarget(this.width, this.height, {
                minFilter: $5Whe3$LinearFilter,
                magFilter: $5Whe3$NearestFilter,
                type: $5Whe3$HalfFloatType,
                format: $5Whe3$RGBAFormat
            });
            this.transparencyRenderTargetDWTrue = new $5Whe3$WebGLRenderTarget(this.width, this.height, {
                minFilter: $5Whe3$LinearFilter,
                magFilter: $5Whe3$NearestFilter,
                type: $5Whe3$HalfFloatType,
                format: $5Whe3$RGBAFormat
            });
            this.transparencyRenderTargetDWTrue.depthTexture = new $5Whe3$DepthTexture(this.width, this.height, $5Whe3$UnsignedIntType);
            this.depthCopyPass = new (0, $e4ca8dcb0218f846$export$dcd670d73db751f5)(new $5Whe3$ShaderMaterial({
                uniforms: {
                    depthTexture: {
                        value: this.depthTexture
                    },
                    reverseDepthBuffer: {
                        value: this.configuration.depthBufferType === (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Reverse
                    }
                },
                vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1);
            }`,
                fragmentShader: /* glsl */ `
            uniform sampler2D depthTexture;
            uniform bool reverseDepthBuffer;
            varying vec2 vUv;
            void main() {
                if (reverseDepthBuffer) {
               float d = 1.0 - texture2D(depthTexture, vUv).r;
           
               d += 0.00001;
               gl_FragDepth = 1.0 - d;
            } else {
                float d = texture2D(depthTexture, vUv).r;
                d += 0.00001;
                gl_FragDepth = d;
            }
               gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            }
            `
            }));
        } else {
            if (this.transparencyRenderTargetDWFalse) {
                this.transparencyRenderTargetDWFalse.dispose();
                this.transparencyRenderTargetDWFalse = null;
            }
            if (this.transparencyRenderTargetDWTrue) {
                this.transparencyRenderTargetDWTrue.dispose();
                this.transparencyRenderTargetDWTrue = null;
            }
            if (this.depthCopyPass) {
                this.depthCopyPass.dispose();
                this.depthCopyPass = null;
            }
        }
    }
    renderTransparency(renderer) {
        const oldBackground = this.scene.background;
        const oldClearColor = renderer.getClearColor(new $5Whe3$Color());
        const oldClearAlpha = renderer.getClearAlpha();
        const oldVisibility = new Map();
        const oldAutoClearDepth = renderer.autoClearDepth;
        this.scene.traverse((obj)=>{
            oldVisibility.set(obj, obj.visible);
        });
        // Override the state
        this.scene.background = null;
        renderer.autoClearDepth = false;
        renderer.setClearColor(new $5Whe3$Color(0, 0, 0), 0);
        this.depthCopyPass.material.uniforms.depthTexture.value = this.depthTexture;
        this.depthCopyPass.material.uniforms.reverseDepthBuffer.value = this.configuration.depthBufferType === (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Reverse;
        // Render out transparent objects WITHOUT depth write
        renderer.setRenderTarget(this.transparencyRenderTargetDWFalse);
        this.scene.traverse((obj)=>{
            if (obj.material) obj.visible = oldVisibility.get(obj) && (obj.material.transparent && !obj.material.depthWrite && !obj.userData.treatAsOpaque || !!obj.userData.cannotReceiveAO);
        });
        renderer.clear(true, true, true);
        this.depthCopyPass.render(renderer);
        renderer.render(this.scene, this.camera);
        // Render out transparent objects WITH depth write
        renderer.setRenderTarget(this.transparencyRenderTargetDWTrue);
        this.scene.traverse((obj)=>{
            if (obj.material) obj.visible = oldVisibility.get(obj) && obj.material.transparent && obj.material.depthWrite && !obj.userData.treatAsOpaque;
        });
        renderer.clear(true, true, true);
        this.depthCopyPass.render(renderer);
        renderer.render(this.scene, this.camera);
        // Restore
        this.scene.traverse((obj)=>{
            obj.visible = oldVisibility.get(obj);
        });
        renderer.setClearColor(oldClearColor, oldClearAlpha);
        this.scene.background = oldBackground;
        renderer.autoClearDepth = oldAutoClearDepth;
    }
    configureSampleDependentPasses() {
        this.configureAOPass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
        this.configureDenoisePass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
    }
    configureAOPass(depthBufferType = (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Default, ortho = false) {
        this.firstFrame();
        this.samples = this.generateHemisphereSamples(this.configuration.aoSamples);
        const e = {
            ...(0, $1ed45968c1160c3c$export$c9b263b9a17dffd7)
        };
        e.fragmentShader = e.fragmentShader.replace("16", this.configuration.aoSamples).replace("16.0", this.configuration.aoSamples + ".0");
        if (depthBufferType === (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Log) e.fragmentShader = "#define LOGDEPTH\n" + e.fragmentShader;
        else if (depthBufferType === (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Reverse) e.fragmentShader = "#define REVERSEDEPTH\n" + e.fragmentShader;
        if (ortho) e.fragmentShader = "#define ORTHO\n" + e.fragmentShader;
        if (this.configuration.halfRes) e.fragmentShader = "#define HALFRES\n" + e.fragmentShader;
        if (this.depthMipsSupported) e.fragmentShader = "#define DEPTH_MIP\n" + e.fragmentShader;
        if (this.effectShaderQuad) {
            this.effectShaderQuad.material.dispose();
            this.effectShaderQuad.material = new $5Whe3$ShaderMaterial(e);
        } else this.effectShaderQuad = new (0, $e4ca8dcb0218f846$export$dcd670d73db751f5)(new $5Whe3$ShaderMaterial(e));
    }
    configureDenoisePass(depthBufferType = (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Default, ortho = false) {
        this.firstFrame();
        this.samplesDenoise = this.generateDenoiseSamples(this.configuration.denoiseSamples, 11);
        const p = {
            ...(0, $e52378cd0f5a973d$export$57856b59f317262e)
        };
        p.fragmentShader = p.fragmentShader.replace("__N8AO_DENOISE_SAMPLES__", this.configuration.denoiseSamples);
        const neuralShader = this.configuration.neuralDenoise ? (0, $1193f60a44983e43$export$ae948da21d595099)(this.configuration.aoSamples, this.configuration.denoiseSamples, this.configuration.halfRes) : null;
        if (depthBufferType === (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Log) p.fragmentShader = "#define LOGDEPTH\n" + p.fragmentShader;
        else if (depthBufferType === (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Reverse) p.fragmentShader = "#define REVERSEDEPTH\n" + p.fragmentShader;
        if (ortho) p.fragmentShader = "#define ORTHO\n" + p.fragmentShader;
        if (this.standardDenoiseMaterial) this.standardDenoiseMaterial.dispose();
        if (this.neuralDenoiseMaterial) this.neuralDenoiseMaterial.dispose();
        this.standardDenoiseMaterial = new $5Whe3$ShaderMaterial({
            ...p,
            fragmentShader: p.fragmentShader.replace("__N8AO_NEURAL_DENOISE__", "")
        });
        this.neuralDenoiseMaterial = neuralShader ? new $5Whe3$ShaderMaterial({
            ...p,
            glslVersion: $5Whe3$GLSL3,
            fragmentShader: "#define NEURAL_DENOISE\nlayout(location = 0) out highp vec4 neuralFragColor;\n#define gl_FragColor neuralFragColor\n" + p.fragmentShader.replace("__N8AO_NEURAL_DENOISE__", neuralShader)
        }) : null;
        if (this.poissonBlurQuad) this.poissonBlurQuad.material = this.standardDenoiseMaterial;
        else this.poissonBlurQuad = new (0, $e4ca8dcb0218f846$export$dcd670d73db751f5)(this.standardDenoiseMaterial);
    }
    // The neural material exists whenever neuralDenoise is on, since the settings it needs are locked.
    shouldUseNeuralDenoise() {
        return Boolean(this.configuration.neuralDenoise) && this.neuralDenoiseMaterial !== null;
    }
    /**
     * What the pass actually runs with: the denoiser and neural model in use, the denoise radius in
     * screen pixels, and how half-resolution AO is upsampled.
     */ get effectiveConfiguration() {
        return (0, $68771f61eadf8273$export$897f7e680386bfa8)(this);
    }
    configureEffectCompositer(depthBufferType = (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Default, ortho = false) {
        this.firstFrame();
        const e = {
            ...(0, $12b21d24d1192a04$export$a815acccbd2c9a49)
        };
        if (depthBufferType === (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Log) e.fragmentShader = "#define LOGDEPTH\n" + e.fragmentShader;
        else if (depthBufferType === (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Reverse) e.fragmentShader = "#define REVERSEDEPTH\n" + e.fragmentShader;
        if (ortho) e.fragmentShader = "#define ORTHO\n" + e.fragmentShader;
        if (this.configuration.halfRes) e.fragmentShader = "#define HALFRES\n" + e.fragmentShader;
        this.standardCompositerMaterial?.dispose();
        this.neuralCompositerMaterial?.dispose();
        this.standardCompositerMaterial = new $5Whe3$ShaderMaterial({
            ...e,
            fragmentShader: e.fragmentShader.replace("__N8AO_NEURAL_UPSAMPLE__", "")
        });
        // Learned upsampling for half-resolution neural denoising, picked per frame.
        this.neuralCompositerMaterial = this.configuration.halfRes ? new $5Whe3$ShaderMaterial({
            ...e,
            fragmentShader: "#define NEURAL_UPSAMPLE\n" + e.fragmentShader.replace("__N8AO_NEURAL_UPSAMPLE__", (0, $aa15e1bac241784c$export$fcb3ada4d2e35185))
        }) : null;
        if (this.effectCompositerQuad) this.effectCompositerQuad.material = this.standardCompositerMaterial;
        else this.effectCompositerQuad = new (0, $e4ca8dcb0218f846$export$dcd670d73db751f5)(this.standardCompositerMaterial);
    }
    /**
         * 
         * @param {Number} n 
         * @returns {THREE.Vector3[]}
         */ generateHemisphereSamples(n) {
        const points = [];
        for(let k = 0; k < n; k++){
            const theta = 2.399963 * k;
            const r = Math.sqrt(k + 0.5) / Math.sqrt(n);
            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);
            // Project to hemisphere
            const z = Math.sqrt(1 - (x * x + y * y));
            points.push(new $5Whe3$Vector3(x, y, z));
        }
        return points;
    }
    /**
         * 
         * @param {number} numSamples 
         * @param {number} numRings 
         * @returns {THREE.Vector2[]}
         */ generateDenoiseSamples(numSamples, numRings) {
        const angleStep = 2 * Math.PI * numRings / numSamples;
        const invNumSamples = 1.0 / numSamples;
        const radiusStep = invNumSamples;
        const samples = [];
        let radius = invNumSamples;
        let angle = 0;
        for(let i = 0; i < numSamples; i++){
            samples.push(new $5Whe3$Vector2(Math.cos(angle), Math.sin(angle)).multiplyScalar(Math.pow(radius, 0.75)));
            radius += radiusStep;
            angle += angleStep;
        }
        return samples;
    }
    setSize(width, height) {
        this.firstFrame();
        this.width = Math.floor(width);
        this.height = Math.floor(height);
        const internalWidth = this.configuration.halfRes ? Math.floor(this.width / 2) : this.width;
        const internalHeight = this.configuration.halfRes ? Math.floor(this.height / 2) : this.height;
        this.writeTargetInternal.setSize(internalWidth, internalHeight);
        this.readTargetInternal.setSize(internalWidth, internalHeight);
        this.accumulationRenderTarget.setSize(internalWidth, internalHeight);
        if (this.configuration.halfRes) this.depthDownsampleTarget.setSize(internalWidth, internalHeight);
        if (this.configuration.transparencyAware) {
            this.transparencyRenderTargetDWFalse.setSize(this.width, this.height);
            this.transparencyRenderTargetDWTrue.setSize(this.width, this.height);
        }
        this.outputTargetInternal.setSize(this.width, this.height);
    }
    setDepthTexture(depthTexture) {
        this.depthTexture = depthTexture;
    }
    firstFrame() {
        this.needsFrame = true;
    }
    render(renderer, inputBuffer, outputBuffer) {
        const xrEnabled = renderer.xr.enabled;
        renderer.xr.enabled = false;
        // Copy inputBuffer to outputBuffer
        //renderer.setRenderTarget(outputBuffer);
        //  this.copyQuad.material.uniforms.tDiffuse.value = inputBuffer.texture;
        //   this.copyQuad.render(renderer);
        const rendererUsesReverseDepth = renderer.capabilities.reversedDepthBuffer === true || renderer.capabilities.reverseDepthBuffer === true;
        const rendererDepthType = rendererUsesReverseDepth ? (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Reverse : renderer.capabilities.logarithmicDepthBuffer ? (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Log : (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Default;
        if (this.configuration.depthBufferType !== rendererDepthType) {
            this.configuration.depthBufferType = rendererDepthType;
            this.configureAOPass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
            this.configureDenoisePass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
            this.configureEffectCompositer(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
            if (this.configuration.halfRes) this.configureDepthDownsample();
        }
        const depthMipsSupported = renderer.extensions.has("EXT_color_buffer_float");
        if (this.depthMipsSupported !== depthMipsSupported) {
            this.depthMipsSupported = depthMipsSupported;
            this.configureAOPass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
        }
        this.detectTransparency();
        if (inputBuffer.texture.type !== this.outputTargetInternal.texture.type || inputBuffer.texture.format !== this.outputTargetInternal.texture.format) {
            this.outputTargetInternal.texture.type = inputBuffer.texture.type;
            this.outputTargetInternal.texture.format = inputBuffer.texture.format;
            this.outputTargetInternal.texture.needsUpdate = true;
        }
        this.camera.updateMatrixWorld();
        if (this.lastViewMatrix.equals(this.camera.matrixWorldInverse) && this.lastProjectionMatrix.equals(this.camera.projectionMatrix) && this.configuration.accumulate && !this.needsFrame) this.frame++;
        else {
            if (this.configuration.accumulate) {
                renderer.setRenderTarget(this.accumulationRenderTarget);
                renderer.clear(true, true, true);
            }
            this.frame = 0;
            this.needsFrame = false;
        }
        this.lastViewMatrix.copy(this.camera.matrixWorldInverse);
        this.lastProjectionMatrix.copy(this.camera.projectionMatrix);
        let gl;
        let ext;
        let timerQuery;
        if (this.debugMode) {
            gl = renderer.getContext();
            ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
            if (ext === null) {
                console.error("EXT_disjoint_timer_query_webgl2 not available, disabling debug mode.");
                this.debugMode = false;
            }
        }
        if (this.debugMode) {
            timerQuery = gl.createQuery();
            gl.beginQuery(ext.TIME_ELAPSED_EXT, timerQuery);
        }
        if (this.configuration.transparencyAware) this.renderTransparency(renderer);
        this._r.set(this.width, this.height);
        let trueRadius = this.configuration.aoRadius;
        if (this.configuration.halfRes && this.configuration.screenSpaceRadius) trueRadius *= 0.5;
        if (this.frame < 1024 / this.configuration.aoSamples) {
            if (this.configuration.halfRes) {
                renderer.setRenderTarget(this.depthDownsampleTarget);
                this.depthDownsampleQuad.material.uniforms.sceneDepth.value = this.depthTexture;
                this.depthDownsampleQuad.material.uniforms.resolution.value = this._r;
                this.depthDownsampleQuad.material.uniforms["near"].value = this.camera.near;
                this.depthDownsampleQuad.material.uniforms["far"].value = this.camera.far;
                this.depthDownsampleQuad.material.uniforms["projectionMatrixInv"].value = this.camera.projectionMatrixInverse;
                this.depthDownsampleQuad.material.uniforms["projMat"].value = this.camera.projectionMatrix;
                this.depthDownsampleQuad.material.uniforms["viewMatrixInv"].value = this.camera.matrixWorld;
                this.depthDownsampleQuad.material.uniforms["logDepth"].value = this.configuration.depthBufferType === (0, $05f6997e4b65da14$export$ed4ee5d1e55474a5).Log;
                this.depthDownsampleQuad.material.uniforms["ortho"].value = this.camera.isOrthographicCamera;
                this.depthDownsampleQuad.render(renderer);
            }
            if (this.depthMipsSupported) {
                const aoDepth = this.configuration.halfRes ? this.depthDownsampleTarget.textures[0] : this.depthTexture;
                const aoWidth = this.configuration.halfRes ? Math.floor(this._r.x / 2) : this._r.x;
                const aoHeight = this.configuration.halfRes ? Math.floor(this._r.y / 2) : this._r.y;
                this.depthMipAtlas.update(renderer, aoDepth, aoWidth, aoHeight);
                this.effectShaderQuad.material.uniforms["depthMipAtlas"].value = this.depthMipAtlas.target.texture;
                this.effectShaderQuad.material.uniforms["depthMipLevels"].value = this.depthMipAtlas.levels;
            }
            this.effectShaderQuad.material.uniforms["sceneDiffuse"].value = inputBuffer.texture;
            this.effectShaderQuad.material.uniforms["sceneDepth"].value = this.configuration.halfRes ? this.depthDownsampleTarget.textures[0] : this.depthTexture;
            this.effectShaderQuad.material.uniforms["sceneNormal"].value = this.configuration.halfRes ? this.depthDownsampleTarget.textures[1] : null;
            this.effectShaderQuad.material.uniforms["projMat"].value = this.camera.projectionMatrix;
            this.effectShaderQuad.material.uniforms["viewMat"].value = this.camera.matrixWorldInverse;
            this.effectShaderQuad.material.uniforms["projViewMat"].value = this.camera.projectionMatrix.clone().multiply(this.camera.matrixWorldInverse.clone());
            this.effectShaderQuad.material.uniforms["projectionMatrixInv"].value = this.camera.projectionMatrixInverse;
            this.effectShaderQuad.material.uniforms["viewMatrixInv"].value = this.camera.matrixWorld;
            this.effectShaderQuad.material.uniforms["cameraPos"].value = this.camera.getWorldPosition(new $5Whe3$Vector3());
            this.effectShaderQuad.material.uniforms["biasAdjustment"].value = new $5Whe3$Vector2(this.configuration.biasOffset, this.configuration.biasMultiplier);
            this.effectShaderQuad.material.uniforms["resolution"].value = this.configuration.halfRes ? this._r.clone().multiplyScalar(0.5).floor() : this._r;
            this.effectShaderQuad.material.uniforms["time"].value = performance.now() / 1000;
            this.effectShaderQuad.material.uniforms["samples"].value = this.samples;
            this.effectShaderQuad.material.uniforms["bluenoise"].value = this.bluenoise;
            this.effectShaderQuad.material.uniforms["radius"].value = trueRadius;
            this.effectShaderQuad.material.uniforms["distanceFalloff"].value = this.configuration.distanceFalloff;
            this.effectShaderQuad.material.uniforms["near"].value = this.camera.near;
            this.effectShaderQuad.material.uniforms["far"].value = this.camera.far;
            this.effectShaderQuad.material.uniforms["ortho"].value = this.camera.isOrthographicCamera;
            this.effectShaderQuad.material.uniforms["screenSpaceRadius"].value = this.configuration.screenSpaceRadius;
            this.effectShaderQuad.material.uniforms["frame"].value = this.frame;
            // Start the AO
            renderer.setRenderTarget(this.writeTargetInternal);
            this.effectShaderQuad.render(renderer);
            // End the AO
            // Start the blur
            const useNeuralDenoise = this.shouldUseNeuralDenoise();
            for(let i = 0; i < this.configuration.denoiseIterations; i++){
                [this.writeTargetInternal, this.readTargetInternal] = [
                    this.readTargetInternal,
                    this.writeTargetInternal
                ];
                this.poissonBlurQuad.material = useNeuralDenoise && i === 1 ? this.neuralDenoiseMaterial : this.standardDenoiseMaterial;
                this.poissonBlurQuad.material.uniforms["tDiffuse"].value = this.readTargetInternal.texture;
                this.poissonBlurQuad.material.uniforms["sceneDepth"].value = this.configuration.halfRes ? this.depthDownsampleTarget.textures[0] : this.depthTexture;
                this.poissonBlurQuad.material.uniforms["projMat"].value = this.camera.projectionMatrix;
                this.poissonBlurQuad.material.uniforms["viewMat"].value = this.camera.matrixWorldInverse;
                this.poissonBlurQuad.material.uniforms["projectionMatrixInv"].value = this.camera.projectionMatrixInverse;
                this.poissonBlurQuad.material.uniforms["viewMatrixInv"].value = this.camera.matrixWorld;
                this.poissonBlurQuad.material.uniforms["cameraPos"].value = this.camera.getWorldPosition(new $5Whe3$Vector3());
                this.poissonBlurQuad.material.uniforms["resolution"].value = this.configuration.halfRes ? this._r.clone().multiplyScalar(0.5).floor() : this._r;
                this.poissonBlurQuad.material.uniforms["time"].value = performance.now() / 1000;
                this.poissonBlurQuad.material.uniforms["blueNoise"].value = this.bluenoise;
                // At half resolution the radius is halved to keep its screen size, except with
                // neural denoising, whose half-resolution models are trained at the full radius
                // in half-resolution pixels (moving splotches are much weaker that way).
                this.poissonBlurQuad.material.uniforms["radius"].value = this.configuration.denoiseRadius * (this.configuration.halfRes && !useNeuralDenoise ? 0.5 : 1);
                this.poissonBlurQuad.material.uniforms["worldRadius"].value = trueRadius;
                this.poissonBlurQuad.material.uniforms["distanceFalloff"].value = this.configuration.distanceFalloff;
                this.poissonBlurQuad.material.uniforms["index"].value = i;
                this.poissonBlurQuad.material.uniforms["poissonDisk"].value = this.samplesDenoise;
                this.poissonBlurQuad.material.uniforms["near"].value = this.camera.near;
                this.poissonBlurQuad.material.uniforms["far"].value = this.camera.far;
                this.poissonBlurQuad.material.uniforms["screenSpaceRadius"].value = this.configuration.screenSpaceRadius;
                renderer.setRenderTarget(this.writeTargetInternal);
                this.poissonBlurQuad.render(renderer);
            }
            // Without accumulation the compositor reads the denoised AO directly, saving a copy.
            if (this.configuration.accumulate) {
                renderer.setRenderTarget(this.accumulationRenderTarget);
                const oldAutoClear = renderer.autoClear;
                renderer.autoClear = false;
                this.accumulationQuad.material.uniforms["tDiffuse"].value = this.writeTargetInternal.texture;
                this.accumulationQuad.material.uniforms["frame"].value = this.frame;
                this.accumulationQuad.render(renderer);
                renderer.autoClear = oldAutoClear;
            }
        }
        // Now, we have the blurred AO in writeTargetInternal
        // End the blur
        // Start the composition
        // The learned upsampler was trained on neural-denoised AO, so it runs only with it.
        this.effectCompositerQuad.material = this.neuralCompositerMaterial && this.shouldUseNeuralDenoise() ? this.neuralCompositerMaterial : this.standardCompositerMaterial;
        if (this.configuration.transparencyAware) {
            this.effectCompositerQuad.material.uniforms["transparencyDWFalse"].value = this.transparencyRenderTargetDWFalse.texture;
            this.effectCompositerQuad.material.uniforms["transparencyDWTrue"].value = this.transparencyRenderTargetDWTrue.texture;
            this.effectCompositerQuad.material.uniforms["transparencyDWTrueDepth"].value = this.transparencyRenderTargetDWTrue.depthTexture;
            this.effectCompositerQuad.material.uniforms["transparencyAware"].value = true;
        }
        this.effectCompositerQuad.material.uniforms["sceneDiffuse"].value = inputBuffer.texture;
        this.effectCompositerQuad.material.uniforms["sceneDepth"].value = this.depthTexture;
        this.effectCompositerQuad.material.uniforms["aoTones"].value = this.configuration.aoTones;
        this.effectCompositerQuad.material.uniforms["near"].value = this.camera.near;
        this.effectCompositerQuad.material.uniforms["far"].value = this.camera.far;
        this.effectCompositerQuad.material.uniforms["projectionMatrixInv"].value = this.camera.projectionMatrixInverse;
        this.effectCompositerQuad.material.uniforms["ortho"].value = this.camera.isOrthographicCamera;
        this.effectCompositerQuad.material.uniforms["downsampledDepth"].value = this.configuration.halfRes ? this.depthDownsampleTarget.textures[0] : this.depthTexture;
        this.effectCompositerQuad.material.uniforms["resolution"].value = this._r;
        this.effectCompositerQuad.material.uniforms["blueNoise"].value = this.bluenoise;
        this.effectCompositerQuad.material.uniforms["intensity"].value = this.configuration.intensity;
        this.effectCompositerQuad.material.uniforms["renderMode"].value = this.configuration.renderMode;
        this.effectCompositerQuad.material.uniforms["screenSpaceRadius"].value = this.configuration.screenSpaceRadius;
        this.effectCompositerQuad.material.uniforms["radius"].value = trueRadius;
        this.effectCompositerQuad.material.uniforms["distanceFalloff"].value = this.configuration.distanceFalloff;
        this.effectCompositerQuad.material.uniforms["gammaCorrection"].value = this.autosetGamma ? this.renderToScreen : this.configuration.gammaCorrection;
        this.effectCompositerQuad.material.uniforms["tDiffuse"].value = this.configuration.accumulate ? this.accumulationRenderTarget.texture : this.writeTargetInternal.texture;
        this.effectCompositerQuad.material.uniforms["color"].value = this._c.copy(this.configuration.color).convertSRGBToLinear();
        this.effectCompositerQuad.material.uniforms["colorMultiply"].value = this.configuration.colorMultiply;
        this.effectCompositerQuad.material.uniforms["fog"].value = !!this.scene.fog;
        if (this.scene.fog) {
            if (this.scene.fog.isFog) {
                this.effectCompositerQuad.material.uniforms["fogExp"].value = false;
                this.effectCompositerQuad.material.uniforms["fogNear"].value = this.scene.fog.near;
                this.effectCompositerQuad.material.uniforms["fogFar"].value = this.scene.fog.far;
            } else if (this.scene.fog.isFogExp2) {
                this.effectCompositerQuad.material.uniforms["fogExp"].value = true;
                this.effectCompositerQuad.material.uniforms["fogDensity"].value = this.scene.fog.density;
            } else console.error(`Unsupported fog type ${this.scene.fog.constructor.name} in SSAOPass.`);
        }
        renderer.setRenderTarget(/* this.renderToScreen ? null :
                 outputBuffer*/ this.outputTargetInternal);
        this.effectCompositerQuad.render(renderer);
        renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer);
        this.copyQuad.material.uniforms["tDiffuse"].value = this.outputTargetInternal.texture;
        this.copyQuad.render(renderer);
        if (this.debugMode) {
            gl.endQuery(ext.TIME_ELAPSED_EXT);
            $87431ee93b037844$var$checkTimerQuery(timerQuery, gl, this);
        }
        renderer.xr.enabled = xrEnabled;
    }
    /**
         * Enables the debug mode of the AO, meaning the lastTime value will be updated.
         */ enableDebugMode() {
        this.debugMode = true;
    }
    /**
         * Disables the debug mode of the AO, meaning the lastTime value will not be updated.
         */ disableDebugMode() {
        this.debugMode = false;
    }
    /**
         * Sets the display mode of the AO
         * @param {"Combined" | "AO" | "No AO" | "Split" | "Split AO"} mode - The display mode. 
         */ setDisplayMode(mode) {
        this.configuration.renderMode = [
            "Combined",
            "AO",
            "No AO",
            "Split",
            "Split AO"
        ].indexOf(mode);
    }
    /**
         * 
         * @param {"Performance" | "Low" | "Medium" | "High" | "Ultra" | "Neural-Performance" | "Neural-Low" | "Neural-Medium" | "Neural-High"} mode
         */ setQualityMode(mode) {
        if (mode === "Performance") {
            this.configuration.neuralDenoise = false;
            this.configuration.aoSamples = 8;
            this.configuration.denoiseSamples = 4;
            this.configuration.denoiseRadius = 12;
            this.configuration.denoiseIterations = 2;
        } else if (mode === "Low") {
            this.configuration.neuralDenoise = false;
            this.configuration.aoSamples = 16;
            this.configuration.denoiseSamples = 4;
            this.configuration.denoiseRadius = 12;
            this.configuration.denoiseIterations = 2;
        } else if (mode === "Medium") {
            this.configuration.neuralDenoise = false;
            this.configuration.aoSamples = 16;
            this.configuration.denoiseSamples = 8;
            this.configuration.denoiseRadius = 12;
            this.configuration.denoiseIterations = 2;
        } else if (mode === "High") {
            this.configuration.neuralDenoise = false;
            this.configuration.aoSamples = 64;
            this.configuration.denoiseSamples = 8;
            this.configuration.denoiseRadius = 6;
            this.configuration.denoiseIterations = 2;
        } else if (mode === "Ultra") {
            this.configuration.neuralDenoise = false;
            this.configuration.aoSamples = 64;
            this.configuration.denoiseSamples = 16;
            this.configuration.denoiseRadius = 6;
            this.configuration.denoiseIterations = 2;
        } else if ([
            "Neural-Performance",
            "Neural-Low",
            "Neural-Medium",
            "Neural-High"
        ].includes(mode)) {
            // Turned on first, so that turning it off later restores the settings from before.
            this.configuration.neuralDenoise = true;
            // [aoSamples, denoiseSamples]; Neural-Performance runs the low-end specialist model.
            [this.configuration.aoSamples, this.configuration.denoiseSamples] = ({
                "Neural-Performance": [
                    8,
                    4
                ],
                "Neural-Low": [
                    16,
                    4
                ],
                "Neural-Medium": [
                    16,
                    8
                ],
                "Neural-High": [
                    16,
                    16
                ]
            })[mode];
        }
    }
}





/**
 * 
 * @param {*} timerQuery 
 * @param {THREE.WebGLRenderer} gl 
 * @param {N8AOPass} pass 
 */ function $05f6997e4b65da14$var$checkTimerQuery(timerQuery, gl, pass) {
    const available = gl.getQueryParameter(timerQuery, gl.QUERY_RESULT_AVAILABLE);
    if (available) {
        const elapsedTimeInNs = gl.getQueryParameter(timerQuery, gl.QUERY_RESULT);
        const elapsedTimeInMs = elapsedTimeInNs / 1000000;
        pass.lastTime = pass.lastTime === 0 ? elapsedTimeInMs : pass.timeRollingAverage * pass.lastTime + (1 - pass.timeRollingAverage) * elapsedTimeInMs;
    } else // If the result is not available yet, check again after a delay
    setTimeout(()=>{
        $05f6997e4b65da14$var$checkTimerQuery(timerQuery, gl, pass);
    }, 1);
}
const $05f6997e4b65da14$export$ed4ee5d1e55474a5 = {
    Default: 1,
    Log: 2,
    Reverse: 3
};
class $05f6997e4b65da14$export$2d57db20b5eb5e0a extends (0, $5Whe3$Pass) {
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
     */ constructor(scene, camera, width = 512, height = 512){
        super();
        this.width = Math.floor(width);
        this.height = Math.floor(height);
        this.clear = true;
        // Values neural denoising replaced when it was turned on, put back when it is turned off.
        this._neuralReplaced = {};
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
         * gammaCorrection: boolean,
         * depthBufferType: 1 | 2 | 3,
         * screenSpaceRadius: boolean,
         * halfRes: boolean,
         * depthAwareUpsampling: boolean, // always on; kept for compatibility
         * autoRenderBeauty: boolean
         * colorMultiply: boolean,
         * neuralDenoise: boolean
         * }
         */ this.configuration = new Proxy({
            aoSamples: 16,
            aoRadius: 5.0,
            aoTones: 0.0,
            denoiseSamples: 8,
            denoiseRadius: 12,
            distanceFalloff: 1.0,
            intensity: 5,
            denoiseIterations: 2.0,
            renderMode: 0,
            biasOffset: 0.0,
            biasMultiplier: 0.0,
            color: new $5Whe3$Color(0, 0, 0),
            gammaCorrection: true,
            depthBufferType: $05f6997e4b65da14$export$ed4ee5d1e55474a5.Default,
            screenSpaceRadius: false,
            halfRes: false,
            depthAwareUpsampling: true,
            autoRenderBeauty: true,
            colorMultiply: true,
            transparencyAware: false,
            stencil: false,
            accumulate: false,
            neuralDenoise: false
        }, {
            set: (target, propName, value)=>{
                if (propName === "depthAwareUpsampling") {
                    (0, $68771f61eadf8273$export$4b3edb4f30cb8c0e)(value);
                    return true;
                }
                const refusal = target.neuralDenoise ? (0, $68771f61eadf8273$export$58695d39018e1e0)(propName, value) : null;
                if (refusal) {
                    console.error(refusal);
                    return true;
                }
                const oldProp = target[propName];
                target[propName] = value;
                if (value.equals) {
                    if (!value.equals(oldProp)) this.firstFrame();
                } else if (oldProp !== value) this.firstFrame();
                if (propName === "aoSamples" && oldProp !== value) {
                    this.configureAOPass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                    if (target.neuralDenoise) // The neural model and its AO-count input depend on aoSamples.
                    this.configureDenoisePass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                }
                if (propName === "denoiseSamples" && oldProp !== value) this.configureDenoisePass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                if (propName === "neuralDenoise" && oldProp !== value) {
                    const oldAOSamples = target.aoSamples;
                    if (value) this._neuralReplaced = (0, $68771f61eadf8273$export$6a46389d92aff323)(target);
                    else {
                        (0, $68771f61eadf8273$export$8c5a804edc87aa6c)(target, this._neuralReplaced);
                        this._neuralReplaced = {};
                    }
                    if (target.aoSamples !== oldAOSamples) this.configureAOPass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                    this.configureDenoisePass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                }
                if (propName === "halfRes" && oldProp !== value) {
                    this.configureAOPass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                    if (target.neuralDenoise) // Half resolution has its own neural models.
                    this.configureDenoisePass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                    this.configureHalfResTargets();
                    this.configureEffectCompositer(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
                    this.setSize(this.width, this.height);
                }
                if (propName === "transparencyAware" && oldProp !== value) {
                    this.autoDetectTransparency = false;
                    this.configureTransparencyTarget();
                }
                if (propName === "stencil" && oldProp !== value) {
                    /*  this.beautyRenderTarget.stencilBuffer = value;
                      this.beautyRenderTarget.depthTexture.format = value ? THREE.DepthStencilFormat : THREE.DepthFormat;
                      this.beautyRenderTarget.depthTexture.type = value ? THREE.UnsignedInt248Type : THREE.UnsignedIntType;
                      this.beautyRenderTarget.depthTexture.needsUpdate = true;
                      this.beautyRenderTarget.needsUpdate = true;*/ this.beautyRenderTarget.dispose();
                    this.beautyRenderTarget = new $5Whe3$WebGLRenderTarget(this.width, this.height, {
                        minFilter: $5Whe3$LinearFilter,
                        magFilter: $5Whe3$NearestFilter,
                        type: $5Whe3$HalfFloatType,
                        format: $5Whe3$RGBAFormat,
                        stencilBuffer: value
                    });
                    this.beautyRenderTarget.depthTexture = new $5Whe3$DepthTexture(this.width, this.height, value ? $5Whe3$UnsignedInt248Type : $5Whe3$UnsignedIntType);
                    this.beautyRenderTarget.depthTexture.format = value ? $5Whe3$DepthStencilFormat : $5Whe3$DepthFormat;
                }
                return true;
            }
        });
        // Far AO samples read coarser depth when float render targets are available.
        this.depthMipsSupported = true;
        this.depthMipAtlas = new (0, $92ca7181966e8293$export$1758a4e1ca12274d)();
        /** @type {THREE.Vector3[]} */ this.samples = [];
        /** @type {THREE.Vector2[]} */ this.samplesDenoise = [];
        this.autoDetectTransparency = true;
        this.frame = 0;
        this.lastViewMatrix = new $5Whe3$Matrix4();
        this.lastProjectionMatrix = new $5Whe3$Matrix4();
        this.beautyRenderTarget = new $5Whe3$WebGLRenderTarget(this.width, this.height, {
            minFilter: $5Whe3$LinearFilter,
            magFilter: $5Whe3$NearestFilter,
            type: $5Whe3$HalfFloatType,
            format: $5Whe3$RGBAFormat,
            stencilBuffer: false
        });
        this.beautyRenderTarget.depthTexture = new $5Whe3$DepthTexture(this.width, this.height, $5Whe3$UnsignedIntType);
        this.beautyRenderTarget.depthTexture.format = $5Whe3$DepthFormat;
        this.configureEffectCompositer(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
        this.configureSampleDependentPasses();
        this.configureHalfResTargets();
        this.detectTransparency();
        this.configureTransparencyTarget();
        this.writeTargetInternal = new $5Whe3$WebGLRenderTarget(this.width, this.height, {
            minFilter: $5Whe3$LinearFilter,
            magFilter: $5Whe3$LinearFilter,
            depthBuffer: false,
            format: $5Whe3$RGBAFormat
        });
        this.readTargetInternal = new $5Whe3$WebGLRenderTarget(this.width, this.height, {
            minFilter: $5Whe3$LinearFilter,
            magFilter: $5Whe3$LinearFilter,
            depthBuffer: false,
            format: $5Whe3$RGBAFormat
        });
        this.accumulationRenderTarget = new $5Whe3$WebGLRenderTarget(this.width, this.height, {
            minFilter: $5Whe3$LinearFilter,
            magFilter: $5Whe3$LinearFilter,
            depthBuffer: false,
            format: $5Whe3$RGBAFormat,
            type: $5Whe3$HalfFloatType,
            stencilBuffer: false,
            depthBuffer: false,
            alpha: true
        });
        /** @type {THREE.DataTexture} */ this.bluenoise = new $5Whe3$DataTexture((0, $06269ad78f3c5fdf$export$2e2bcd8739ae039), 128, 128);
        this.accumulationQuad = new (0, $e4ca8dcb0218f846$export$dcd670d73db751f5)(new $5Whe3$ShaderMaterial({
            uniforms: {
                frame: {
                    value: 0
                },
                tDiffuse: {
                    value: null
                }
            },
            transparent: true,
            opacity: 1,
            vertexShader: `
             varying vec2 vUv;
             void main() {
                 vUv = uv;
                 gl_Position = vec4(position, 1);
             }`,
            fragmentShader: `
             uniform sampler2D tDiffuse;
             uniform float frame;
                varying vec2 vUv;
                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);
                    gl_FragColor = vec4(color.rgb, 1.0 / (frame + 1.0));
                }
                `
        }));
        this.bluenoise.colorSpace = $5Whe3$NoColorSpace;
        this.bluenoise.wrapS = $5Whe3$RepeatWrapping;
        this.bluenoise.wrapT = $5Whe3$RepeatWrapping;
        this.bluenoise.minFilter = $5Whe3$NearestFilter;
        this.bluenoise.magFilter = $5Whe3$NearestFilter;
        this.bluenoise.needsUpdate = true;
        this.lastTime = 0;
        this.timeRollingAverage = 0.99;
        this._r = new $5Whe3$Vector2();
        this._c = new $5Whe3$Color();
    }
    // The half-res depth downsample, which needs to know whether depth is reversed.
    configureDepthDownsample() {
        const e = {
            ...(0, $26aca173e0984d99$export$1efdf491687cd442)
        };
        if (this.configuration.depthBufferType === $05f6997e4b65da14$export$ed4ee5d1e55474a5.Reverse) e.fragmentShader = "#define REVERSEDEPTH\n" + e.fragmentShader;
        this.depthDownsampleQuad?.dispose();
        this.depthDownsampleQuad = new (0, $e4ca8dcb0218f846$export$dcd670d73db751f5)(new $5Whe3$ShaderMaterial(e));
    }
    configureHalfResTargets() {
        this.firstFrame();
        if (this.configuration.halfRes) {
            this.depthDownsampleTarget = new (0, $ff9437d9c7577f11$export$156f6a58f569aa09)(Math.floor(this.width / 2), Math.floor(this.height / 2), 2);
            if ($5Whe3$REVISION <= 161) this.depthDownsampleTarget.textures = this.depthDownsampleTarget.texture;
            this.depthDownsampleTarget.textures[0].format = $5Whe3$RedFormat;
            this.depthDownsampleTarget.textures[0].type = $5Whe3$FloatType;
            this.depthDownsampleTarget.textures[0].minFilter = $5Whe3$NearestFilter;
            this.depthDownsampleTarget.textures[0].magFilter = $5Whe3$NearestFilter;
            this.depthDownsampleTarget.textures[0].depthBuffer = false;
            this.depthDownsampleTarget.textures[1].format = $5Whe3$RGBAFormat;
            this.depthDownsampleTarget.textures[1].type = $5Whe3$HalfFloatType;
            this.depthDownsampleTarget.textures[1].minFilter = $5Whe3$NearestFilter;
            this.depthDownsampleTarget.textures[1].magFilter = $5Whe3$NearestFilter;
            this.depthDownsampleTarget.textures[1].depthBuffer = false;
            this.configureDepthDownsample();
        } else {
            if (this.depthDownsampleTarget) {
                this.depthDownsampleTarget.dispose();
                this.depthDownsampleTarget = null;
            }
            if (this.depthDownsampleQuad) {
                this.depthDownsampleQuad.dispose();
                this.depthDownsampleQuad = null;
            }
        }
    }
    detectTransparency() {
        if (this.autoDetectTransparency) {
            let isTransparency = false;
            this.scene.traverse((obj)=>{
                if (obj.material && obj.material.transparent) isTransparency = true;
            });
            this.configuration.transparencyAware = isTransparency;
        }
    }
    configureTransparencyTarget() {
        if (this.configuration.transparencyAware) {
            this.transparencyRenderTargetDWFalse = new $5Whe3$WebGLRenderTarget(this.width, this.height, {
                minFilter: $5Whe3$LinearFilter,
                magFilter: $5Whe3$NearestFilter,
                type: $5Whe3$HalfFloatType,
                format: $5Whe3$RGBAFormat
            });
            this.transparencyRenderTargetDWTrue = new $5Whe3$WebGLRenderTarget(this.width, this.height, {
                minFilter: $5Whe3$LinearFilter,
                magFilter: $5Whe3$NearestFilter,
                type: $5Whe3$HalfFloatType,
                format: $5Whe3$RGBAFormat
            });
            this.transparencyRenderTargetDWTrue.depthTexture = new $5Whe3$DepthTexture(this.width, this.height, $5Whe3$UnsignedIntType);
            this.depthCopyPass = new (0, $e4ca8dcb0218f846$export$dcd670d73db751f5)(new $5Whe3$ShaderMaterial({
                uniforms: {
                    depthTexture: {
                        value: this.depthTexture
                    },
                    reverseDepthBuffer: {
                        value: this.configuration.depthBufferType === $05f6997e4b65da14$export$ed4ee5d1e55474a5.Reverse
                    }
                },
                vertexShader: /* glsl */ `
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = vec4(position, 1);
                        }`,
                fragmentShader: /* glsl */ `
                        uniform sampler2D depthTexture;
                        uniform bool reverseDepthBuffer;
                        varying vec2 vUv;
                        void main() {
                            if (reverseDepthBuffer) {
                           float d = 1.0 - texture2D(depthTexture, vUv).r;
                       
                           d += 0.00001;
                           gl_FragDepth = 1.0 - d;
                        } else {
                            float d = texture2D(depthTexture, vUv).r;
                            d += 0.00001;
                            gl_FragDepth = d;
                        }
                           gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
                        }
                        `
            }));
        } else {
            if (this.transparencyRenderTargetDWFalse) {
                this.transparencyRenderTargetDWFalse.dispose();
                this.transparencyRenderTargetDWFalse = null;
            }
            if (this.transparencyRenderTargetDWTrue) {
                this.transparencyRenderTargetDWTrue.dispose();
                this.transparencyRenderTargetDWTrue = null;
            }
            if (this.depthCopyPass) {
                this.depthCopyPass.dispose();
                this.depthCopyPass = null;
            }
        }
    }
    renderTransparency(renderer) {
        const oldBackground = this.scene.background;
        const oldClearColor = renderer.getClearColor(new $5Whe3$Color());
        const oldClearAlpha = renderer.getClearAlpha();
        const oldVisibility = new Map();
        const oldAutoClearDepth = renderer.autoClearDepth;
        this.scene.traverse((obj)=>{
            oldVisibility.set(obj, obj.visible);
        });
        // Override the state
        this.scene.background = null;
        renderer.autoClearDepth = false;
        renderer.setClearColor(new $5Whe3$Color(0, 0, 0), 0);
        this.depthCopyPass.material.uniforms.depthTexture.value = this.beautyRenderTarget.depthTexture;
        this.depthCopyPass.material.uniforms.reverseDepthBuffer.value = this.configuration.depthBufferType === $05f6997e4b65da14$export$ed4ee5d1e55474a5.Reverse;
        // Render out transparent objects WITHOUT depth write
        renderer.setRenderTarget(this.transparencyRenderTargetDWFalse);
        this.scene.traverse((obj)=>{
            if (obj.material) obj.visible = oldVisibility.get(obj) && (obj.material.transparent && !obj.material.depthWrite && !obj.userData.treatAsOpaque || !!obj.userData.cannotReceiveAO);
        });
        renderer.clear(true, true, true);
        this.depthCopyPass.render(renderer);
        renderer.render(this.scene, this.camera);
        // Render out transparent objects WITH depth write
        renderer.setRenderTarget(this.transparencyRenderTargetDWTrue);
        this.scene.traverse((obj)=>{
            if (obj.material) obj.visible = oldVisibility.get(obj) && obj.material.transparent && obj.material.depthWrite && !obj.userData.treatAsOpaque;
        });
        renderer.clear(true, true, true);
        this.depthCopyPass.render(renderer);
        renderer.render(this.scene, this.camera);
        // Restore
        this.scene.traverse((obj)=>{
            obj.visible = oldVisibility.get(obj);
        });
        renderer.setClearColor(oldClearColor, oldClearAlpha);
        this.scene.background = oldBackground;
        renderer.autoClearDepth = oldAutoClearDepth;
    }
    configureSampleDependentPasses() {
        this.firstFrame();
        this.configureAOPass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
        this.configureDenoisePass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
    }
    configureAOPass(depthBufferType = $05f6997e4b65da14$export$ed4ee5d1e55474a5.Default, ortho = false) {
        this.firstFrame();
        this.samples = this.generateHemisphereSamples(this.configuration.aoSamples);
        const e = {
            ...(0, $1ed45968c1160c3c$export$c9b263b9a17dffd7)
        };
        e.fragmentShader = e.fragmentShader.replace("16", this.configuration.aoSamples).replace("16.0", this.configuration.aoSamples + ".0");
        if (depthBufferType === $05f6997e4b65da14$export$ed4ee5d1e55474a5.Log) e.fragmentShader = "#define LOGDEPTH\n" + e.fragmentShader;
        else if (depthBufferType === $05f6997e4b65da14$export$ed4ee5d1e55474a5.Reverse) e.fragmentShader = "#define REVERSEDEPTH\n" + e.fragmentShader;
        if (ortho) e.fragmentShader = "#define ORTHO\n" + e.fragmentShader;
        if (this.configuration.halfRes) e.fragmentShader = "#define HALFRES\n" + e.fragmentShader;
        if (this.depthMipsSupported) e.fragmentShader = "#define DEPTH_MIP\n" + e.fragmentShader;
        if (this.effectShaderQuad) {
            this.effectShaderQuad.material.dispose();
            this.effectShaderQuad.material = new $5Whe3$ShaderMaterial(e);
        } else this.effectShaderQuad = new (0, $e4ca8dcb0218f846$export$dcd670d73db751f5)(new $5Whe3$ShaderMaterial(e));
    }
    configureDenoisePass(depthBufferType = $05f6997e4b65da14$export$ed4ee5d1e55474a5.Default, ortho = false) {
        this.firstFrame();
        this.samplesDenoise = this.generateDenoiseSamples(this.configuration.denoiseSamples, 11);
        const p = {
            ...(0, $e52378cd0f5a973d$export$57856b59f317262e)
        };
        p.fragmentShader = p.fragmentShader.replace("__N8AO_DENOISE_SAMPLES__", this.configuration.denoiseSamples);
        const neuralShader = this.configuration.neuralDenoise ? (0, $1193f60a44983e43$export$ae948da21d595099)(this.configuration.aoSamples, this.configuration.denoiseSamples, this.configuration.halfRes) : null;
        if (depthBufferType === $05f6997e4b65da14$export$ed4ee5d1e55474a5.Log) p.fragmentShader = "#define LOGDEPTH\n" + p.fragmentShader;
        else if (depthBufferType === $05f6997e4b65da14$export$ed4ee5d1e55474a5.Reverse) p.fragmentShader = "#define REVERSEDEPTH\n" + p.fragmentShader;
        if (ortho) p.fragmentShader = "#define ORTHO\n" + p.fragmentShader;
        if (this.standardDenoiseMaterial) this.standardDenoiseMaterial.dispose();
        if (this.neuralDenoiseMaterial) this.neuralDenoiseMaterial.dispose();
        this.standardDenoiseMaterial = new $5Whe3$ShaderMaterial({
            ...p,
            fragmentShader: p.fragmentShader.replace("__N8AO_NEURAL_DENOISE__", "")
        });
        this.neuralDenoiseMaterial = neuralShader ? new $5Whe3$ShaderMaterial({
            ...p,
            glslVersion: $5Whe3$GLSL3,
            fragmentShader: "#define NEURAL_DENOISE\nlayout(location = 0) out highp vec4 neuralFragColor;\n#define gl_FragColor neuralFragColor\n" + p.fragmentShader.replace("__N8AO_NEURAL_DENOISE__", neuralShader)
        }) : null;
        if (this.poissonBlurQuad) this.poissonBlurQuad.material = this.standardDenoiseMaterial;
        else this.poissonBlurQuad = new (0, $e4ca8dcb0218f846$export$dcd670d73db751f5)(this.standardDenoiseMaterial);
    }
    // The neural material exists whenever neuralDenoise is on, since the settings it needs are locked.
    shouldUseNeuralDenoise() {
        return Boolean(this.configuration.neuralDenoise) && this.neuralDenoiseMaterial !== null;
    }
    /**
     * What the pass actually runs with: the denoiser and neural model in use, the denoise radius in
     * screen pixels, and how half-resolution AO is upsampled.
     */ get effectiveConfiguration() {
        return (0, $68771f61eadf8273$export$897f7e680386bfa8)(this);
    }
    configureEffectCompositer(depthBufferType = $05f6997e4b65da14$export$ed4ee5d1e55474a5.Default, ortho = false) {
        this.firstFrame();
        const e = {
            ...(0, $12b21d24d1192a04$export$a815acccbd2c9a49)
        };
        if (depthBufferType === $05f6997e4b65da14$export$ed4ee5d1e55474a5.Log) e.fragmentShader = "#define LOGDEPTH\n" + e.fragmentShader;
        else if (depthBufferType === $05f6997e4b65da14$export$ed4ee5d1e55474a5.Reverse) e.fragmentShader = "#define REVERSEDEPTH\n" + e.fragmentShader;
        if (ortho) e.fragmentShader = "#define ORTHO\n" + e.fragmentShader;
        if (this.configuration.halfRes) e.fragmentShader = "#define HALFRES\n" + e.fragmentShader;
        this.standardCompositerMaterial?.dispose();
        this.neuralCompositerMaterial?.dispose();
        this.standardCompositerMaterial = new $5Whe3$ShaderMaterial({
            ...e,
            fragmentShader: e.fragmentShader.replace("__N8AO_NEURAL_UPSAMPLE__", "")
        });
        // Learned upsampling for half-resolution neural denoising, picked per frame.
        this.neuralCompositerMaterial = this.configuration.halfRes ? new $5Whe3$ShaderMaterial({
            ...e,
            fragmentShader: "#define NEURAL_UPSAMPLE\n" + e.fragmentShader.replace("__N8AO_NEURAL_UPSAMPLE__", (0, $aa15e1bac241784c$export$fcb3ada4d2e35185))
        }) : null;
        if (this.effectCompositerQuad) this.effectCompositerQuad.material = this.standardCompositerMaterial;
        else this.effectCompositerQuad = new (0, $e4ca8dcb0218f846$export$dcd670d73db751f5)(this.standardCompositerMaterial);
    }
    /**
         * 
         * @param {Number} n 
         * @returns {THREE.Vector3[]}
         */ generateHemisphereSamples(n) {
        const points = [];
        for(let k = 0; k < n; k++){
            const theta = 2.399963 * k;
            let r = Math.sqrt(k + 0.5) / Math.sqrt(n);
            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);
            // Project to hemisphere
            const z = Math.sqrt(1 - (x * x + y * y));
            points.push(new $5Whe3$Vector3(x, y, z));
        }
        return points;
    }
    /**
         * 
         * @param {number} numSamples 
         * @param {number} numRings 
         * @returns {THREE.Vector2[]}
         */ generateDenoiseSamples(numSamples, numRings) {
        const angleStep = 2 * Math.PI * numRings / numSamples;
        const invNumSamples = 1.0 / numSamples;
        const radiusStep = invNumSamples;
        const samples = [];
        let radius = invNumSamples;
        let angle = 0;
        for(let i = 0; i < numSamples; i++){
            samples.push(new $5Whe3$Vector2(Math.cos(angle), Math.sin(angle)).multiplyScalar(Math.pow(radius, 0.75)));
            radius += radiusStep;
            angle += angleStep;
        }
        return samples;
    }
    setSize(width, height) {
        this.firstFrame();
        this.width = Math.floor(width);
        this.height = Math.floor(height);
        const internalWidth = this.configuration.halfRes ? Math.floor(this.width / 2) : this.width;
        const internalHeight = this.configuration.halfRes ? Math.floor(this.height / 2) : this.height;
        this.beautyRenderTarget.setSize(this.width, this.height);
        this.writeTargetInternal.setSize(internalWidth, internalHeight);
        this.readTargetInternal.setSize(internalWidth, internalHeight);
        this.accumulationRenderTarget.setSize(internalWidth, internalHeight);
        if (this.configuration.halfRes) this.depthDownsampleTarget.setSize(internalWidth, internalHeight);
        if (this.configuration.transparencyAware) {
            this.transparencyRenderTargetDWFalse.setSize(this.width, this.height);
            this.transparencyRenderTargetDWTrue.setSize(this.width, this.height);
        }
    }
    firstFrame() {
        this.needsFrame = true;
    }
    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        const rendererUsesReverseDepth = renderer.capabilities.reversedDepthBuffer === true || renderer.capabilities.reverseDepthBuffer === true;
        const rendererDepthType = rendererUsesReverseDepth ? $05f6997e4b65da14$export$ed4ee5d1e55474a5.Reverse : renderer.capabilities.logarithmicDepthBuffer ? $05f6997e4b65da14$export$ed4ee5d1e55474a5.Log : $05f6997e4b65da14$export$ed4ee5d1e55474a5.Default;
        if (this.configuration.depthBufferType !== rendererDepthType) {
            this.configuration.depthBufferType = rendererDepthType;
            this.configureAOPass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
            this.configureDenoisePass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
            this.configureEffectCompositer(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
            if (this.configuration.halfRes) this.configureDepthDownsample();
        }
        const depthMipsSupported = renderer.extensions.has("EXT_color_buffer_float");
        if (this.depthMipsSupported !== depthMipsSupported) {
            this.depthMipsSupported = depthMipsSupported;
            this.configureAOPass(this.configuration.depthBufferType, this.camera.isOrthographicCamera);
        }
        this.detectTransparency();
        this.camera.updateMatrixWorld();
        if (this.lastViewMatrix.equals(this.camera.matrixWorldInverse) && this.lastProjectionMatrix.equals(this.camera.projectionMatrix) && this.configuration.accumulate && !this.needsFrame) this.frame++;
        else {
            if (this.configuration.accumulate) {
                renderer.setRenderTarget(this.accumulationRenderTarget);
                renderer.clear(true, true, true);
            }
            this.frame = 0;
            this.needsFrame = false;
        }
        this.lastViewMatrix.copy(this.camera.matrixWorldInverse);
        this.lastProjectionMatrix.copy(this.camera.projectionMatrix);
        let gl;
        let ext;
        let timerQuery;
        if (this.debugMode) {
            gl = renderer.getContext();
            ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
            if (ext === null) {
                console.error("EXT_disjoint_timer_query_webgl2 not available, disabling debug mode.");
                this.debugMode = false;
            }
        }
        if (this.configuration.autoRenderBeauty) {
            renderer.setRenderTarget(this.beautyRenderTarget);
            renderer.render(this.scene, this.camera);
            if (this.configuration.transparencyAware) this.renderTransparency(renderer);
        }
        if (this.debugMode) {
            timerQuery = gl.createQuery();
            gl.beginQuery(ext.TIME_ELAPSED_EXT, timerQuery);
        }
        const xrEnabled = renderer.xr.enabled;
        renderer.xr.enabled = false;
        this._r.set(this.width, this.height);
        let trueRadius = this.configuration.aoRadius;
        if (this.configuration.halfRes && this.configuration.screenSpaceRadius) trueRadius *= 0.5;
        if (this.frame < 1024 / this.configuration.aoSamples) {
            if (this.configuration.halfRes) {
                renderer.setRenderTarget(this.depthDownsampleTarget);
                this.depthDownsampleQuad.material.uniforms.sceneDepth.value = this.beautyRenderTarget.depthTexture;
                this.depthDownsampleQuad.material.uniforms.resolution.value = this._r;
                this.depthDownsampleQuad.material.uniforms["near"].value = this.camera.near;
                this.depthDownsampleQuad.material.uniforms["far"].value = this.camera.far;
                this.depthDownsampleQuad.material.uniforms["projectionMatrixInv"].value = this.camera.projectionMatrixInverse;
                this.depthDownsampleQuad.material.uniforms["projMat"].value = this.camera.projectionMatrix;
                this.depthDownsampleQuad.material.uniforms["viewMatrixInv"].value = this.camera.matrixWorld;
                this.depthDownsampleQuad.material.uniforms["logDepth"].value = this.configuration.depthBufferType === $05f6997e4b65da14$export$ed4ee5d1e55474a5.Log;
                this.depthDownsampleQuad.material.uniforms["ortho"].value = this.camera.isOrthographicCamera;
                this.depthDownsampleQuad.render(renderer);
            }
            if (this.depthMipsSupported) {
                const aoDepth = this.configuration.halfRes ? this.depthDownsampleTarget.textures[0] : this.beautyRenderTarget.depthTexture;
                const aoWidth = this.configuration.halfRes ? Math.floor(this._r.x / 2) : this._r.x;
                const aoHeight = this.configuration.halfRes ? Math.floor(this._r.y / 2) : this._r.y;
                this.depthMipAtlas.update(renderer, aoDepth, aoWidth, aoHeight);
                this.effectShaderQuad.material.uniforms["depthMipAtlas"].value = this.depthMipAtlas.target.texture;
                this.effectShaderQuad.material.uniforms["depthMipLevels"].value = this.depthMipAtlas.levels;
            }
            this.effectShaderQuad.material.uniforms["sceneDiffuse"].value = this.beautyRenderTarget.texture;
            this.effectShaderQuad.material.uniforms["sceneDepth"].value = this.configuration.halfRes ? this.depthDownsampleTarget.textures[0] : this.beautyRenderTarget.depthTexture;
            this.effectShaderQuad.material.uniforms["sceneNormal"].value = this.configuration.halfRes ? this.depthDownsampleTarget.textures[1] : null;
            this.effectShaderQuad.material.uniforms["projMat"].value = this.camera.projectionMatrix;
            this.effectShaderQuad.material.uniforms["viewMat"].value = this.camera.matrixWorldInverse;
            this.effectShaderQuad.material.uniforms["projViewMat"].value = this.camera.projectionMatrix.clone().multiply(this.camera.matrixWorldInverse.clone());
            this.effectShaderQuad.material.uniforms["projectionMatrixInv"].value = this.camera.projectionMatrixInverse;
            this.effectShaderQuad.material.uniforms["viewMatrixInv"].value = this.camera.matrixWorld;
            this.effectShaderQuad.material.uniforms["cameraPos"].value = this.camera.getWorldPosition(new $5Whe3$Vector3());
            this.effectShaderQuad.material.uniforms["biasAdjustment"].value = new $5Whe3$Vector2(this.configuration.biasOffset, this.configuration.biasMultiplier);
            this.effectShaderQuad.material.uniforms["resolution"].value = this.configuration.halfRes ? this._r.clone().multiplyScalar(0.5).floor() : this._r;
            this.effectShaderQuad.material.uniforms["time"].value = performance.now() / 1000;
            this.effectShaderQuad.material.uniforms["samples"].value = this.samples;
            this.effectShaderQuad.material.uniforms["bluenoise"].value = this.bluenoise;
            this.effectShaderQuad.material.uniforms["radius"].value = trueRadius;
            this.effectShaderQuad.material.uniforms["distanceFalloff"].value = this.configuration.distanceFalloff;
            this.effectShaderQuad.material.uniforms["near"].value = this.camera.near;
            this.effectShaderQuad.material.uniforms["far"].value = this.camera.far;
            this.effectShaderQuad.material.uniforms["ortho"].value = this.camera.isOrthographicCamera;
            this.effectShaderQuad.material.uniforms["screenSpaceRadius"].value = this.configuration.screenSpaceRadius;
            this.effectShaderQuad.material.uniforms["frame"].value = this.frame;
            // Start the AO
            renderer.setRenderTarget(this.writeTargetInternal);
            this.effectShaderQuad.render(renderer);
            // End the AO
            // Start the blur
            const useNeuralDenoise = this.shouldUseNeuralDenoise();
            for(let i = 0; i < this.configuration.denoiseIterations; i++){
                [this.writeTargetInternal, this.readTargetInternal] = [
                    this.readTargetInternal,
                    this.writeTargetInternal
                ];
                this.poissonBlurQuad.material = useNeuralDenoise && i === 1 ? this.neuralDenoiseMaterial : this.standardDenoiseMaterial;
                this.poissonBlurQuad.material.uniforms["tDiffuse"].value = this.readTargetInternal.texture;
                this.poissonBlurQuad.material.uniforms["sceneDepth"].value = this.configuration.halfRes ? this.depthDownsampleTarget.textures[0] : this.beautyRenderTarget.depthTexture;
                this.poissonBlurQuad.material.uniforms["projMat"].value = this.camera.projectionMatrix;
                this.poissonBlurQuad.material.uniforms["viewMat"].value = this.camera.matrixWorldInverse;
                this.poissonBlurQuad.material.uniforms["projectionMatrixInv"].value = this.camera.projectionMatrixInverse;
                this.poissonBlurQuad.material.uniforms["viewMatrixInv"].value = this.camera.matrixWorld;
                this.poissonBlurQuad.material.uniforms["cameraPos"].value = this.camera.getWorldPosition(new $5Whe3$Vector3());
                this.poissonBlurQuad.material.uniforms["resolution"].value = this.configuration.halfRes ? this._r.clone().multiplyScalar(0.5).floor() : this._r;
                this.poissonBlurQuad.material.uniforms["time"].value = performance.now() / 1000;
                this.poissonBlurQuad.material.uniforms["blueNoise"].value = this.bluenoise;
                // At half resolution the radius is halved to keep its screen size, except with
                // neural denoising, whose half-resolution models are trained at the full radius
                // in half-resolution pixels (moving splotches are much weaker that way).
                this.poissonBlurQuad.material.uniforms["radius"].value = this.configuration.denoiseRadius * (this.configuration.halfRes && !useNeuralDenoise ? 0.5 : 1);
                this.poissonBlurQuad.material.uniforms["worldRadius"].value = trueRadius;
                this.poissonBlurQuad.material.uniforms["distanceFalloff"].value = this.configuration.distanceFalloff;
                this.poissonBlurQuad.material.uniforms["index"].value = i;
                this.poissonBlurQuad.material.uniforms["poissonDisk"].value = this.samplesDenoise;
                this.poissonBlurQuad.material.uniforms["near"].value = this.camera.near;
                this.poissonBlurQuad.material.uniforms["far"].value = this.camera.far;
                this.poissonBlurQuad.material.uniforms["screenSpaceRadius"].value = this.configuration.screenSpaceRadius;
                renderer.setRenderTarget(this.writeTargetInternal);
                this.poissonBlurQuad.render(renderer);
            }
            // Without accumulation the compositor reads the denoised AO directly, saving a copy.
            if (this.configuration.accumulate) {
                renderer.setRenderTarget(this.accumulationRenderTarget);
                const oldAutoClear = renderer.autoClear;
                renderer.autoClear = false;
                this.accumulationQuad.material.uniforms["tDiffuse"].value = this.writeTargetInternal.texture;
                this.accumulationQuad.material.uniforms["frame"].value = this.frame;
                this.accumulationQuad.render(renderer);
                renderer.autoClear = oldAutoClear;
            }
        }
        // Now, we have the blurred AO in writeTargetInternal
        // End the blur
        // Start the composition
        // The learned upsampler was trained on neural-denoised AO, so it runs only with it.
        this.effectCompositerQuad.material = this.neuralCompositerMaterial && this.shouldUseNeuralDenoise() ? this.neuralCompositerMaterial : this.standardCompositerMaterial;
        if (this.configuration.transparencyAware) {
            this.effectCompositerQuad.material.uniforms["transparencyDWFalse"].value = this.transparencyRenderTargetDWFalse.texture;
            this.effectCompositerQuad.material.uniforms["transparencyDWTrue"].value = this.transparencyRenderTargetDWTrue.texture;
            this.effectCompositerQuad.material.uniforms["transparencyDWTrueDepth"].value = this.transparencyRenderTargetDWTrue.depthTexture;
            this.effectCompositerQuad.material.uniforms["transparencyAware"].value = true;
        }
        this.effectCompositerQuad.material.uniforms["sceneDiffuse"].value = this.beautyRenderTarget.texture;
        this.effectCompositerQuad.material.uniforms["sceneDepth"].value = this.beautyRenderTarget.depthTexture;
        this.effectCompositerQuad.material.uniforms["aoTones"].value = this.configuration.aoTones;
        this.effectCompositerQuad.material.uniforms["near"].value = this.camera.near;
        this.effectCompositerQuad.material.uniforms["far"].value = this.camera.far;
        this.effectCompositerQuad.material.uniforms["projectionMatrixInv"].value = this.camera.projectionMatrixInverse;
        this.effectCompositerQuad.material.uniforms["ortho"].value = this.camera.isOrthographicCamera;
        this.effectCompositerQuad.material.uniforms["downsampledDepth"].value = this.configuration.halfRes ? this.depthDownsampleTarget.textures[0] : this.beautyRenderTarget.depthTexture;
        this.effectCompositerQuad.material.uniforms["resolution"].value = this._r;
        this.effectCompositerQuad.material.uniforms["blueNoise"].value = this.bluenoise;
        this.effectCompositerQuad.material.uniforms["intensity"].value = this.configuration.intensity;
        this.effectCompositerQuad.material.uniforms["renderMode"].value = this.configuration.renderMode;
        this.effectCompositerQuad.material.uniforms["screenSpaceRadius"].value = this.configuration.screenSpaceRadius;
        this.effectCompositerQuad.material.uniforms["radius"].value = trueRadius;
        this.effectCompositerQuad.material.uniforms["distanceFalloff"].value = this.configuration.distanceFalloff;
        this.effectCompositerQuad.material.uniforms["gammaCorrection"].value = this.configuration.gammaCorrection;
        this.effectCompositerQuad.material.uniforms["tDiffuse"].value = this.configuration.accumulate ? this.accumulationRenderTarget.texture : this.writeTargetInternal.texture;
        this.effectCompositerQuad.material.uniforms["color"].value = this._c.copy(this.configuration.color).convertSRGBToLinear();
        this.effectCompositerQuad.material.uniforms["colorMultiply"].value = this.configuration.colorMultiply;
        this.effectCompositerQuad.material.uniforms["fog"].value = !!this.scene.fog;
        if (this.scene.fog) {
            if (this.scene.fog.isFog) {
                this.effectCompositerQuad.material.uniforms["fogExp"].value = false;
                this.effectCompositerQuad.material.uniforms["fogNear"].value = this.scene.fog.near;
                this.effectCompositerQuad.material.uniforms["fogFar"].value = this.scene.fog.far;
            } else if (this.scene.fog.isFogExp2) {
                this.effectCompositerQuad.material.uniforms["fogExp"].value = true;
                this.effectCompositerQuad.material.uniforms["fogDensity"].value = this.scene.fog.density;
            } else console.error(`Unsupported fog type ${this.scene.fog.constructor.name} in SSAOPass.`);
        }
        renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
        this.effectCompositerQuad.render(renderer);
        if (this.debugMode) {
            gl.endQuery(ext.TIME_ELAPSED_EXT);
            $05f6997e4b65da14$var$checkTimerQuery(timerQuery, gl, this);
        }
        renderer.xr.enabled = xrEnabled;
    }
    /**
         * Enables the debug mode of the AO, meaning the lastTime value will be updated.
         */ enableDebugMode() {
        this.debugMode = true;
    }
    /**
         * Disables the debug mode of the AO, meaning the lastTime value will not be updated.
         */ disableDebugMode() {
        this.debugMode = false;
    }
    /**
         * Sets the display mode of the AO
         * @param {"Combined" | "AO" | "No AO" | "Split" | "Split AO"} mode - The display mode. 
         */ setDisplayMode(mode) {
        this.configuration.renderMode = [
            "Combined",
            "AO",
            "No AO",
            "Split",
            "Split AO"
        ].indexOf(mode);
    }
    /**
         * 
         * @param {"Performance" | "Low" | "Medium" | "High" | "Ultra" | "Neural-Performance" | "Neural-Low" | "Neural-Medium" | "Neural-High"} mode
         */ setQualityMode(mode) {
        if (mode === "Performance") {
            this.configuration.neuralDenoise = false;
            this.configuration.aoSamples = 8;
            this.configuration.denoiseSamples = 4;
            this.configuration.denoiseRadius = 12;
            this.configuration.denoiseIterations = 2;
        } else if (mode === "Low") {
            this.configuration.neuralDenoise = false;
            this.configuration.aoSamples = 16;
            this.configuration.denoiseSamples = 4;
            this.configuration.denoiseRadius = 12;
            this.configuration.denoiseIterations = 2;
        } else if (mode === "Medium") {
            this.configuration.neuralDenoise = false;
            this.configuration.aoSamples = 16;
            this.configuration.denoiseSamples = 8;
            this.configuration.denoiseRadius = 12;
            this.configuration.denoiseIterations = 2;
        } else if (mode === "High") {
            this.configuration.neuralDenoise = false;
            this.configuration.aoSamples = 64;
            this.configuration.denoiseSamples = 8;
            this.configuration.denoiseRadius = 6;
            this.configuration.denoiseIterations = 2;
        } else if (mode === "Ultra") {
            this.configuration.neuralDenoise = false;
            this.configuration.aoSamples = 64;
            this.configuration.denoiseSamples = 16;
            this.configuration.denoiseRadius = 6;
            this.configuration.denoiseIterations = 2;
        } else if ([
            "Neural-Performance",
            "Neural-Low",
            "Neural-Medium",
            "Neural-High"
        ].includes(mode)) {
            // Turned on first, so that turning it off later restores the settings from before.
            this.configuration.neuralDenoise = true;
            // [aoSamples, denoiseSamples]; Neural-Performance runs the low-end specialist model.
            [this.configuration.aoSamples, this.configuration.denoiseSamples] = ({
                "Neural-Performance": [
                    8,
                    4
                ],
                "Neural-Low": [
                    16,
                    4
                ],
                "Neural-Medium": [
                    16,
                    8
                ],
                "Neural-High": [
                    16,
                    16
                ]
            })[mode];
        }
    }
}


export {$05f6997e4b65da14$export$ed4ee5d1e55474a5 as DepthType, $05f6997e4b65da14$export$2d57db20b5eb5e0a as N8AOPass, $87431ee93b037844$export$2489f9981ab0fa82 as N8AOPostPass};
//# sourceMappingURL=N8AO.js.map
