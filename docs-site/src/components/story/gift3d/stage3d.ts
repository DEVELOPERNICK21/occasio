import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type StageOptions = {
  camera: { position: [number, number, number]; lookAt: [number, number, number]; fov?: number };
  /** Extra camera distance when the canvas is narrower than this aspect ratio. */
  narrow?: { aspect: number; z: number };
  keyPosition?: [number, number, number];
  glow: string;
};

export type Stage = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  flash: THREE.PointLight;
  textures: THREE.Texture[];
  resize: (width: number, height: number) => void;
  dispose: () => void;
};

/**
 * Shared studio for the 3D scenes: soft key + rim light, image-based reflections,
 * a shadow-catching floor and a transparent canvas so the page backdrop shows through.
 */
export function createStage(canvas: HTMLCanvasElement, o: StageOptions): Stage {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  // Entry-level phones get a lighter render: fewer pixels and a smaller shadow map.
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowEnd = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowEnd ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  scene.environmentIntensity = 0.62;

  const camera = new THREE.PerspectiveCamera(o.camera.fov ?? 34, 1, 0.1, 50);
  camera.position.set(...o.camera.position);
  camera.lookAt(...o.camera.lookAt);

  const key = new THREE.DirectionalLight(0xfff1dc, 2.4);
  key.position.set(...(o.keyPosition ?? [1.6, 7.6, 3.4]));
  key.castShadow = true;
  key.shadow.mapSize.set(lowEnd ? 512 : 1024, lowEnd ? 512 : 1024);
  key.shadow.camera.left = -3.4;
  key.shadow.camera.right = 3.4;
  key.shadow.camera.top = 3.4;
  key.shadow.camera.bottom = -3.4;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 16;
  key.shadow.bias = -0.0006;
  key.shadow.radius = 9;
  key.shadow.blurSamples = 20;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xb9d4ff, 0.9);
  rim.position.set(-4, 3, -3.5);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffe3d0, 0.35));

  const flash = new THREE.PointLight(new THREE.Color(o.glow), 0, 9, 1.6);
  flash.position.set(0, 1.5, 0);
  scene.add(flash);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.ShadowMaterial({ opacity: 0.2 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const baseZ = o.camera.position[2];
  return {
    renderer,
    scene,
    camera,
    flash,
    textures: [envTexture],
    resize(width, height) {
      if (width < 2 || height < 2) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = o.narrow && camera.aspect < o.narrow.aspect ? o.narrow.z : baseZ;
      camera.updateProjectionMatrix();
    },
    dispose() {
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose?.();
      });
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
