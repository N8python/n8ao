import * as THREE from 'three';
const PoissionBlur = {
    uniforms: {

        'sceneDiffuse': { value: null },
        'sceneDepth': { value: null },
        'tDiffuse': { value: null },
        'projMat': { value: /* @__PURE__ */ new THREE.Matrix4() },
        'viewMat': { value: /* @__PURE__ */ new THREE.Matrix4() },
        'projectionMatrixInv': { value: /* @__PURE__ */ new THREE.Matrix4() },
        'viewMatrixInv': { value: /* @__PURE__ */ new THREE.Matrix4() },
        'cameraPos': { value: /* @__PURE__ */ new THREE.Vector3() },
        'resolution': { value: /* @__PURE__ */ new THREE.Vector2() },
        'time': { value: 0.0 },
        'r': { value: 5.0 },
        'blueNoise': { value: null },
        'radius': { value: 12.0 },
        'worldRadius': { value: 5.0 },
        'index': { value: 0.0 },
        "poissonDisk": { value: [] },
        "distanceFalloff": { value: 1.0 },
        'near': { value: 0.1 },
        'far': { value: 1000.0 },
        'screenSpaceRadius': { value: false }
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

}
export { PoissionBlur };
