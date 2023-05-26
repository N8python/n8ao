import * as THREE from 'three';
//import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { Stats } from "./stats.js";
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { N8AOPass, N8AOPostPass } from './N8AO.js';
import { BloomEffect, Effect, EffectComposer, EffectPass, RenderPass, SMAAEffect, SMAAPreset } from "postprocessing";
async function main() {
    // Setup basic renderer, controls, and profiler
    let clientWidth = window.innerWidth;
    let clientHeight = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 1000);
    camera.position.set(50, 75, 50);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(clientWidth, clientHeight);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    //renderer.outputColorSpace = THREE.LinearColorSpace;
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
    const torusKnot = new THREE.Mesh(new THREE.TorusKnotGeometry(5, 1.5, 200, 32), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, envMap: environment, metalness: 0.5, roughness: 0.5, color: new THREE.Color(0.0, 1.0, 0.0) }));
    torusKnot.position.y = 8.5;
    torusKnot.position.x = 0;
    torusKnot.position.z = 0;
    torusKnot.castShadow = true;
    torusKnot.receiveShadow = true;
    scene.add(torusKnot);
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("./draco/");
    loader.setDRACOLoader(dracoLoader);
    const sponza = (await loader.loadAsync("sponza_cd.glb")).scene;
    sponza.traverse(object => {
        if (object.material) {
            object.material.envMap = environment;
        }
    })
    sponza.scale.set(10, 10, 10)
    scene.add(sponza);
    const effectController = {
        aoSamples: 16.0,
        denoiseSamples: 8.0,
        denoiseRadius: 12.0,
        aoRadius: 5.0,
        distanceFalloff: 1.0,
        screenSpaceRadius: false,
        intensity: 5.0,
        renderMode: "Combined",
        color: [0, 0, 0]
    };
    const gui = new GUI();
    gui.add(effectController, "aoSamples", 1.0, 64.0, 1.0);
    gui.add(effectController, "denoiseSamples", 1.0, 64.0, 1.0);
    gui.add(effectController, "denoiseRadius", 0.0, 24.0, 0.01);
    const aor = gui.add(effectController, "aoRadius", 1.0, 10.0, 0.01);
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
    gui.add(effectController, "intensity", 0.0, 10.0, 0.01);
    gui.addColor(effectController, "color");
    gui.add(effectController, "renderMode", ["Combined", "AO", "No AO", "Split", "Split AO"]);
    // Post Effects
    //  const composer = new EffectComposer(renderer);
    /* const n8aopass = new N8AOPass(
         scene,
         camera,
         clientWidth,
         clientHeight
     );
     const smaaPass = new SMAAPass(clientWidth, clientHeight);
     composer.addPass(n8aopass);
     composer.addPass(smaaPass);*/
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const n8aopass = new N8AOPostPass(
        scene,
        camera,
        clientWidth,
        clientHeight
    );
    composer.addPass(n8aopass);
    composer.addPass(new EffectPass(camera, new SMAAEffect({
        preset: SMAAPreset.ULTRA
    })));

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

    function animate() {
        aoMeta.innerHTML = `${clientWidth}x${clientHeight}`
        torusKnot.rotation.x += 0.033;
        torusKnot.rotation.y += 0.033;
        n8aopass.configuration.aoRadius = effectController.aoRadius;
        n8aopass.configuration.distanceFalloff = effectController.distanceFalloff;
        n8aopass.configuration.intensity = effectController.intensity;
        n8aopass.configuration.aoSamples = effectController.aoSamples;
        n8aopass.configuration.denoiseRadius = effectController.denoiseRadius;
        n8aopass.configuration.denoiseSamples = effectController.denoiseSamples;
        n8aopass.configuration.renderMode = ["Combined", "AO", "No AO", "Split", "Split AO"].indexOf(effectController.renderMode);
        n8aopass.configuration.color = new THREE.Color(effectController.color[0], effectController.color[1], effectController.color[2]);
        n8aopass.configuration.screenSpaceRadius = effectController.screenSpaceRadius;
        composer.render();
        timerDOM.innerHTML = n8aopass.lastTime.toFixed(2);
        controls.update();
        stats.update();
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}
main();