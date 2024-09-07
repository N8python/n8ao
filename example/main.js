import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { ShadowMesh } from 'three/addons/objects/ShadowMesh.js';
import { Stats } from "./stats.js";
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { N8AOPass } from './N8AO.js';
async function main() {
    // Setup basic renderer, controls, and profiler
    let clientWidth = window.innerWidth;
    let clientHeight = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 1000);
    camera.position.set(50, 75, 50);
    const renderer = new THREE.WebGLRenderer({
        stencil: true
    });
    renderer.setSize(clientWidth, clientHeight);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 25, 0);
    const stats = new Stats();
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
    // Setup scene
    // Skybox
    const environment = new THREE.CubeTextureLoader().load([
        "skybox/Box_Right.bmp",
        "skybox/Box_Left.bmp",
        "skybox/Box_Top.bmp",
        "skybox/Box_Bottom.bmp",
        "skybox/Box_Front.bmp",
        "skybox/Box_Back.bmp"
    ]);
    environment.colorSpace = THREE.SRGBColorSpace;
    scene.background = environment;
    const torusKnot = new THREE.Mesh(new THREE.TorusKnotGeometry(5, 1.5, 200, 32), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, envMap: environment, color: new THREE.Color(0.0, 1.0, 0.0) }));
    torusKnot.position.y = 8.5;
    torusKnot.position.x = 0;
    torusKnot.position.z = 0;
    torusKnot.castShadow = true;
    torusKnot.receiveShadow = true;
    scene.add(torusKnot);
    const torusKnot2 = new THREE.Mesh(new THREE.TorusKnotGeometry(5, 1.5, 200, 32), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, envMap: environment, color: new THREE.Color(1.0, 0.0, 0.0), transparent: true, depthWrite: true }));
    torusKnot2.position.y = 8.5;
    torusKnot2.position.x = -20;
    torusKnot2.position.z = 0;
    torusKnot2.castShadow = true;
    torusKnot2.receiveShadow = true;
    scene.add(torusKnot2);
    const torusKnot3 = new THREE.Mesh(new THREE.TorusKnotGeometry(5, 1.5, 200, 32), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, envMap: environment, color: new THREE.Color(0.0, 0.0, 1.0), transparent: true, depthWrite: false }));
    torusKnot3.position.y = 8.5;
    torusKnot3.position.x = 20;
    torusKnot3.position.z = 0;
    torusKnot3.castShadow = true;
    torusKnot3.receiveShadow = true;
    scene.add(torusKnot3);
    const torusKnotShadow = new ShadowMesh(torusKnot);
    scene.add(torusKnotShadow);
    const torusKnotShadow2 = new ShadowMesh(torusKnot2);
    torusKnotShadow2.material.color = new THREE.Color(1.0, 0.4, 0.4);
    torusKnotShadow2.material.opacity = 1.0;
    torusKnotShadow2.material.blending = THREE.MultiplyBlending;
    scene.add(torusKnotShadow2);
    const torusKnotShadow3 = new ShadowMesh(torusKnot3);
    torusKnotShadow3.material.color = new THREE.Color(0.4, 0.4, 1.0);
    torusKnotShadow3.material.opacity = 1.0;
    torusKnotShadow3.material.blending = THREE.MultiplyBlending;
    scene.add(torusKnotShadow3);
    torusKnotShadow.userData.treatAsOpaque = true;
    torusKnotShadow2.userData.treatAsOpaque = false;
    torusKnotShadow3.userData.treatAsOpaque = false;
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.1);
    const lightPos4d = new THREE.Vector4(50, 100, 50, 0);


    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("./draco/");
    loader.setDRACOLoader(dracoLoader);
    const sponza = (await loader.loadAsync("sponza_cd.glb")).scene;
    sponza.traverse(object => {
        if (object.material) {
            object.material.envMap = environment;
            if (object.material.map) {
                object.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
            }
        }
    });
    sponza.scale.set(10, 10, 10);
    scene.add(sponza);
    const effectController = {
        aoSamples: 16.0,
        aoRadius: 5.0,
        aoTones: 0.0,
        denoiseSamples: 8.0,
        denoiseRadius: 12.0,
        denoiseIterations: 2.0,
        distanceFalloff: 1.0,
        screenSpaceRadius: false,
        halfRes: false,
        depthAwareUpsampling: true,
        transparencyAware: true,
        intensity: 5.0,
        renderMode: "Combined",
        color: [0, 0, 0],
        colorMultiply: true,
        stencil: true,
        accumulate: false,
    };
    const gui = new GUI();
    gui.add(effectController, "aoSamples", 1.0, 64.0, 1.0);
    const aor = gui.add(effectController, "aoRadius", 1.0, 10.0, 0.01);
    gui.add(effectController, "aoTones", 0.0, 8.0, 1.0);
    gui.add(effectController, "denoiseSamples", 1.0, 64.0, 1.0);
    gui.add(effectController, "denoiseRadius", 0.0, 24.0, 0.01);
    gui.add(effectController, "denoiseIterations", 1.0, 10.0, 1.0);
    const df = gui.add(effectController, "distanceFalloff", 0.0, 10.0, 0.01);
    gui.add(effectController, "screenSpaceRadius").onChange((value) => {
        if (value) {
            effectController.aoRadius = 48.0;
            effectController.distanceFalloff = 0.2;
            aor._min = 0;
            aor._max = 64;
            df._min = 0;
            df._max = 1;
        } else {
            effectController.aoRadius = 5.0;
            effectController.distanceFalloff = 1.0;
            aor._min = 1;
            aor._max = 10;
            df._min = 0;
            df._max = 10;
        }
        aor.updateDisplay();
        df.updateDisplay();
    });
    gui.add(effectController, "halfRes");
    gui.add(effectController, "transparencyAware");
    gui.add(effectController, "depthAwareUpsampling");
    gui.add(effectController, "stencil");
    gui.add(effectController, "intensity", 0.0, 10.0, 0.01);
    gui.addColor(effectController, "color");
    gui.add(effectController, "colorMultiply");
    gui.add(effectController, "accumulate");
    gui.add(effectController, "renderMode", ["Combined", "AO", "No AO", "Split", "Split AO"]);
    // Post Effects
    const composer = new EffectComposer(renderer);
    const n8aopass = new N8AOPass(
        scene,
        camera,
        clientWidth,
        clientHeight
    );
    const smaaPass = new SMAAPass(clientWidth, clientHeight);
    composer.addPass(n8aopass);
    composer.addPass(smaaPass);
    window.addEventListener("resize", () => {
        clientWidth = window.innerWidth;
        clientHeight = window.innerHeight;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
        composer.setSize(clientWidth, clientHeight);
    });
    const timerDOM = document.getElementById("aoTime");
    const aoMeta = document.getElementById("aoMetadata");
    n8aopass.enableDebugMode();
    const clock = new THREE.Clock();

    function animate() {
        aoMeta.innerHTML = `${clientWidth}x${clientHeight}`
        const spin = 2 * clock.getDelta();
        if (!effectController.accumulate) {
            torusKnot.rotation.x += spin;
            torusKnot.rotation.y += spin;
            torusKnot2.rotation.x += spin;
            torusKnot2.rotation.y += spin;
            torusKnot3.rotation.x += spin;
            torusKnot3.rotation.y += spin;
            torusKnot2.material.opacity = Math.sin(performance.now() * 0.001) * 0.5 + 0.5;
            torusKnot3.material.opacity = Math.cos(performance.now() * 0.001) * 0.5 + 0.5;
        }
        torusKnotShadow2.material.color.g = 1 - 0.6 * torusKnot2.material.opacity;
        torusKnotShadow2.material.color.b = 1 - 0.6 * torusKnot2.material.opacity;
        torusKnotShadow3.material.color.r = 1 - 0.6 * torusKnot3.material.opacity;
        torusKnotShadow3.material.color.g = 1 - 0.6 * torusKnot3.material.opacity;
        torusKnotShadow.update(
            groundPlane,
            lightPos4d
        );
        torusKnotShadow2.update(
            groundPlane,
            lightPos4d
        );
        torusKnotShadow3.update(
            groundPlane,
            lightPos4d
        );
        n8aopass.configuration.aoRadius = effectController.aoRadius;
        n8aopass.configuration.aoSamples = effectController.aoSamples;
        n8aopass.configuration.aoTones = effectController.aoTones;
        n8aopass.configuration.distanceFalloff = effectController.distanceFalloff;
        n8aopass.configuration.transparencyAware = effectController.transparencyAware;
        n8aopass.configuration.intensity = effectController.intensity;
        n8aopass.configuration.denoiseRadius = effectController.denoiseRadius;
        n8aopass.configuration.denoiseSamples = effectController.denoiseSamples;
        n8aopass.configuration.denoiseIterations = effectController.denoiseIterations;
        n8aopass.configuration.stencil = effectController.stencil;
        n8aopass.configuration.renderMode = ["Combined", "AO", "No AO", "Split", "Split AO"].indexOf(effectController.renderMode);
        n8aopass.configuration.color = new THREE.Color(effectController.color[0], effectController.color[1], effectController.color[2]);
        n8aopass.configuration.screenSpaceRadius = effectController.screenSpaceRadius;
        n8aopass.configuration.halfRes = effectController.halfRes;
        n8aopass.configuration.depthAwareUpsampling = effectController.depthAwareUpsampling;
        n8aopass.configuration.colorMultiply = effectController.colorMultiply;
        n8aopass.configuration.accumulate = effectController.accumulate;
        composer.render();
        timerDOM.innerHTML = n8aopass.lastTime.toFixed(2);
        controls.update();
        stats.update();
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}
main();