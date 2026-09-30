import * as THREE from 'three';
import type { CakeStyle } from '@/lib/experience/momentTheme';
import { createConfetti3D } from './confetti3d';
import { createStage } from './stage3d';
import { makeGlowTexture } from './textures';

export type CakeOptions = {
  style: CakeStyle;
  glow: string;
  candles: number;
  reducedMotion: boolean;
};

export type CakeController = {
  blow: (index: number) => void;
  cut: () => void;
  celebrate: (kind: 'out' | 'cut') => void;
  setYaw: (radians: number) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
};

const TAU = Math.PI * 2;
const PLATE = { r: 2.05, h: 0.09 };
const T1 = { r: 1.6, h: 0.95, y: PLATE.h };
const T2 = { r: 1.08, h: 0.8, y: PLATE.h + 0.95 };
const CAP_H = 0.06;
/** The slice that slides out sits at the front, facing the camera. */
const WEDGE_LEN = Math.PI / 5.4;
const WEDGE_START = -WEDGE_LEN / 2;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function inWedge(theta: number): boolean {
  const a = ((((theta + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
  return a > WEDGE_START - 0.03 && a < WEDGE_START + WEDGE_LEN + 0.03;
}

function makeSliceTexture(style: CakeStyle): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const bands: Array<[number, number, string]> = [
    [0, 16, style.icing],
    [16, 90, style.sponge],
    [90, 108, style.filling],
    [108, 170, style.sponge],
    [170, 188, style.filling],
    [188, 256, style.sponge],
  ];
  for (const [a, b, color] of bands) {
    ctx.fillStyle = color;
    ctx.fillRect(0, a, 256, b - a);
  }
  for (let i = 0; i < 700; i += 1) {
    ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.08})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeCandleTexture(color: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#FFFDF6';
  ctx.fillRect(0, 0, 64, 128);
  ctx.fillStyle = color;
  ctx.save();
  ctx.translate(32, 64);
  ctx.rotate(-0.6);
  for (let y = -160; y < 160; y += 32) ctx.fillRect(-160, y, 320, 14);
  ctx.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

function makeFlameTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 192;
  const ctx = c.getContext('2d')!;
  ctx.translate(64, 184);
  const g = ctx.createLinearGradient(0, 0, 0, -176);
  g.addColorStop(0, 'rgba(110,160,255,0.9)');
  g.addColorStop(0.12, 'rgba(255,255,225,1)');
  g.addColorStop(0.5, 'rgba(255,205,90,0.95)');
  g.addColorStop(1, 'rgba(255,120,20,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-46, -34, -32, -104, 0, -176);
  ctx.bezierCurveTo(32, -104, 46, -34, 0, 0);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type Candle = {
  state: 'lit' | 'blowing' | 'out';
  t: number;
  flame: THREE.Sprite;
  glow: THREE.Sprite;
  light: THREE.PointLight;
  pos: THREE.Vector3;
};

type Puff = { sprite: THREE.Sprite; age: number; life: number; delay: number; base: THREE.Vector3 };

export function createCake(canvas: HTMLCanvasElement, opts: CakeOptions): CakeController {
  const { style, reducedMotion } = opts;
  const stage = createStage(canvas, {
    camera: { position: [0, 3.3, 8.6], lookAt: [0, 1.4, 0] },
    narrow: { aspect: 0.85, z: 9.4 },
    keyPosition: [1.8, 7.6, 3.6],
    glow: opts.glow,
  });
  const { scene, renderer, camera } = stage;
  const textures: THREE.Texture[] = [];
  const track = <T extends THREE.Texture>(t: T): T => {
    textures.push(t);
    return t;
  };

  // Materials
  const sideMat = new THREE.MeshPhysicalMaterial({
    color: style.side,
    roughness: 0.5,
    sheen: 0.6,
    sheenColor: new THREE.Color(style.side).lerp(new THREE.Color('#fff'), 0.45),
    sheenRoughness: 0.5,
    clearcoat: 0.12,
  });
  const icingMat = new THREE.MeshPhysicalMaterial({
    color: style.icing,
    roughness: 0.4,
    clearcoat: 0.3,
    clearcoatRoughness: 0.35,
  });
  const spongeMat = new THREE.MeshStandardMaterial({ color: style.sponge, roughness: 0.9 });
  const wallMat = new THREE.MeshStandardMaterial({
    map: track(makeSliceTexture(style)),
    roughness: 0.85,
    side: THREE.DoubleSide,
  });

  const root = new THREE.Group();
  const cakeGroup = new THREE.Group();
  const wedgeGroup = new THREE.Group();
  root.add(cakeGroup, wedgeGroup);
  scene.add(root);

  // Plate
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(PLATE.r, PLATE.r + 0.05, PLATE.h, 72),
    new THREE.MeshPhysicalMaterial({ color: '#FBF7F0', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 }),
  );
  plate.position.y = PLATE.h / 2;
  plate.castShadow = true;
  plate.receiveShadow = true;
  root.add(plate);

  // Tiers, each split into a main body and the front slice.
  function addTier(t: { r: number; h: number; y: number }) {
    const mats = [sideMat, icingMat, spongeMat];
    const main = new THREE.Mesh(
      new THREE.CylinderGeometry(t.r, t.r, t.h, 72, 1, false, WEDGE_START + WEDGE_LEN, TAU - WEDGE_LEN),
      mats,
    );
    const wedge = new THREE.Mesh(
      new THREE.CylinderGeometry(t.r, t.r, t.h, 12, 1, false, WEDGE_START, WEDGE_LEN),
      mats,
    );
    for (const [mesh, group] of [
      [main, cakeGroup],
      [wedge, wedgeGroup],
    ] as const) {
      mesh.position.y = t.y + t.h / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }

    // Icing cap with a slight overhang
    const capY = t.y + t.h + CAP_H / 2;
    const capMain = new THREE.Mesh(
      new THREE.CylinderGeometry(t.r + 0.012, t.r + 0.012, CAP_H, 72, 1, false, WEDGE_START + WEDGE_LEN, TAU - WEDGE_LEN),
      icingMat,
    );
    const capWedge = new THREE.Mesh(
      new THREE.CylinderGeometry(t.r + 0.012, t.r + 0.012, CAP_H, 12, 1, false, WEDGE_START, WEDGE_LEN),
      icingMat,
    );
    capMain.position.y = capWedge.position.y = capY;
    capMain.castShadow = capWedge.castShadow = true;
    cakeGroup.add(capMain);
    wedgeGroup.add(capWedge);

    // Cut faces: what you see once the slice slides out.
    for (const theta of [WEDGE_START, WEDGE_START + WEDGE_LEN]) {
      for (const group of [cakeGroup, wedgeGroup]) {
        const wall = new THREE.Mesh(new THREE.PlaneGeometry(t.r, t.h + CAP_H), wallMat);
        wall.position.set((Math.sin(theta) * t.r) / 2, t.y + (t.h + CAP_H) / 2, (Math.cos(theta) * t.r) / 2);
        wall.rotation.y = theta - Math.PI / 2;
        group.add(wall);
      }
    }
  }
  addTier(T1);
  addTier(T2);

  // Decorations are assigned to whichever part they sit on, so the slice carries its own.
  const scatter = {
    rosette: { main: [] as THREE.Matrix4[], wedge: [] as THREE.Matrix4[] },
    bead: { main: [] as THREE.Matrix4[], wedge: [] as THREE.Matrix4[] },
    sprinkle: {
      main: [] as THREE.Matrix4[],
      wedge: [] as THREE.Matrix4[],
      mainColors: [] as THREE.Color[],
      wedgeColors: [] as THREE.Color[],
    },
  };
  const m4 = (x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, yaw = 0) => {
    const m = new THREE.Matrix4();
    m.compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)),
      new THREE.Vector3(sx, sy, sz),
    );
    return m;
  };

  function ring(kind: 'rosette' | 'bead', radius: number, y: number, count: number, sy = 1) {
    for (let i = 0; i < count; i += 1) {
      const theta = (i / count) * TAU + WEDGE_START;
      const target = inWedge(theta) ? scatter[kind].wedge : scatter[kind].main;
      target.push(m4(Math.sin(theta) * radius, y, Math.cos(theta) * radius, 1, sy, 1));
    }
  }
  ring('rosette', T1.r - 0.07, T1.y + T1.h + CAP_H + 0.02, 30, 0.78);
  ring('rosette', T2.r - 0.07, T2.y + T2.h + CAP_H + 0.02, 22, 0.78);
  ring('bead', T1.r + 0.015, T1.y + 0.05, 48);

  // Drips
  function drips(t: { r: number; h: number; y: number }, count: number) {
    for (let i = 0; i < count; i += 1) {
      const theta = (i / count) * TAU + WEDGE_START + rand(-0.06, 0.06);
      const len = rand(0.16, 0.44);
      const drip = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, len, 4, 10), icingMat);
      const radius = t.r + 0.014;
      drip.position.set(
        Math.sin(theta) * radius,
        t.y + t.h - len / 2 - 0.02,
        Math.cos(theta) * radius,
      );
      drip.rotation.y = theta;
      drip.scale.z = 0.5;
      drip.castShadow = true;
      (inWedge(theta) ? wedgeGroup : cakeGroup).add(drip);
    }
  }
  drips(T1, 22);
  drips(T2, 15);

  // Sprinkles on both exposed tops
  const sprinkleQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  function sprinkles(rMin: number, rMax: number, y: number, count: number) {
    for (let i = 0; i < count; i += 1) {
      const rr = Math.sqrt(rand(rMin * rMin, rMax * rMax));
      const theta = rand(0, TAU);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand(0, TAU), 0)).multiply(sprinkleQuat);
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(Math.sin(theta) * rr, y, Math.cos(theta) * rr),
        q,
        new THREE.Vector3(1, 1, 1),
      );
      const color = new THREE.Color(style.sprinkles[i % style.sprinkles.length]);
      if (inWedge(theta)) {
        scatter.sprinkle.wedge.push(m);
        scatter.sprinkle.wedgeColors.push(color);
      } else {
        scatter.sprinkle.main.push(m);
        scatter.sprinkle.mainColors.push(color);
      }
    }
  }
  sprinkles(0.2, T2.r - 0.18, T2.y + T2.h + CAP_H + 0.012, 34);
  sprinkles(T2.r + 0.12, T1.r - 0.2, T1.y + T1.h + CAP_H + 0.012, 60);

  function flush(
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    mats: THREE.Matrix4[],
    group: THREE.Group,
    colors?: THREE.Color[],
  ) {
    if (mats.length === 0) return;
    const mesh = new THREE.InstancedMesh(geo, mat, mats.length);
    mats.forEach((m, i) => {
      mesh.setMatrixAt(i, m);
      if (colors) mesh.setColorAt(i, colors[i]!);
    });
    mesh.castShadow = true;
    group.add(mesh);
  }
  const rosetteGeo = new THREE.SphereGeometry(0.09, 16, 12);
  const beadGeo = new THREE.SphereGeometry(0.05, 10, 8);
  const sprinkleGeo = new THREE.CapsuleGeometry(0.018, 0.085, 3, 6);
  const sprinkleMat = new THREE.MeshStandardMaterial({ roughness: 0.5 });
  flush(rosetteGeo, icingMat, scatter.rosette.main, cakeGroup);
  flush(rosetteGeo, icingMat, scatter.rosette.wedge, wedgeGroup);
  flush(beadGeo, icingMat, scatter.bead.main, cakeGroup);
  flush(beadGeo, icingMat, scatter.bead.wedge, wedgeGroup);
  flush(sprinkleGeo, sprinkleMat, scatter.sprinkle.main, cakeGroup, scatter.sprinkle.mainColors);
  flush(sprinkleGeo, sprinkleMat, scatter.sprinkle.wedge, wedgeGroup, scatter.sprinkle.wedgeColors);

  // Topper
  const topY = T2.y + T2.h + CAP_H;
  if (style.topper === 'cherry') {
    const cherry = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 28, 20),
      new THREE.MeshPhysicalMaterial({ color: style.accent, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }),
    );
    cherry.position.set(0, topY + 0.14, 0);
    cherry.castShadow = true;
    const stem = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, topY + 0.28, 0),
          new THREE.Vector3(0.05, topY + 0.42, 0.02),
          new THREE.Vector3(0.14, topY + 0.5, 0.04),
        ]),
        10,
        0.014,
        6,
      ),
      new THREE.MeshStandardMaterial({ color: '#3F7D3A', roughness: 0.7 }),
    );
    cakeGroup.add(cherry, stem);
  } else {
    const s = new THREE.Shape();
    s.moveTo(0.25, 0.25);
    s.bezierCurveTo(0.25, 0.25, 0.2, 0, 0, 0);
    s.bezierCurveTo(-0.3, 0, -0.3, 0.35, -0.3, 0.35);
    s.bezierCurveTo(-0.3, 0.55, -0.15, 0.77, 0.25, 0.95);
    s.bezierCurveTo(0.6, 0.77, 0.8, 0.55, 0.8, 0.35);
    s.bezierCurveTo(0.8, 0.35, 0.8, 0, 0.5, 0);
    s.bezierCurveTo(0.35, 0, 0.25, 0.25, 0.25, 0.25);
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 5,
      curveSegments: 28,
    });
    geo.center();
    const heart = new THREE.Mesh(
      geo,
      new THREE.MeshPhysicalMaterial({ color: style.accent, metalness: 0.95, roughness: 0.22, clearcoat: 0.6 }),
    );
    heart.scale.setScalar(0.3);
    heart.rotation.z = Math.PI;
    heart.position.set(0, topY + 0.24, 0);
    heart.castShadow = true;
    cakeGroup.add(heart);
  }

  // Candles
  const flameTex = track(makeFlameTexture());
  const glowTex = track(makeGlowTexture('rgba(255,190,110,0.9)', 'rgba(255,150,60,0)'));
  const smokeTex = track(makeGlowTexture('rgba(255,255,255,0.85)', 'rgba(255,255,255,0)'));
  const candles: Candle[] = [];
  const count = Math.max(1, Math.min(opts.candles, 5));
  const stripeColors = ['#8FC7E8', '#F6A6C1', '#B9DE8A', '#FFD166', '#C9A7FF'];
  const CANDLE_H = 0.66;
  for (let i = 0; i < count; i += 1) {
    const a = ((70 + (count === 1 ? 110 : (220 * i) / (count - 1))) * Math.PI) / 180;
    const x = Math.sin(a) * 0.62;
    const z = Math.cos(a) * 0.62;
    const tex = track(makeCandleTexture(stripeColors[i % stripeColors.length]!));
    tex.repeat.set(1, 1.6);
    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, CANDLE_H, 24),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 }),
    );
    stick.position.set(x, topY + CANDLE_H / 2 - 0.015, z);
    stick.castShadow = true;
    const wick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.09, 6),
      new THREE.MeshStandardMaterial({ color: '#2b2320' }),
    );
    wick.position.set(x, topY + CANDLE_H + 0.03, z);
    cakeGroup.add(stick, wick);

    const tip = new THREE.Vector3(x, topY + CANDLE_H + 0.08, z);
    const flame = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    );
    flame.center.set(0.5, 0.06);
    flame.position.copy(tip);
    flame.scale.set(0.34, 0.5, 1);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }),
    );
    glow.position.copy(tip).add(new THREE.Vector3(0, 0.16, 0));
    glow.scale.set(1.0, 1.0, 1);
    const light = new THREE.PointLight(0xffb066, 1.3, 3.2, 2);
    light.position.copy(tip).add(new THREE.Vector3(0, 0.18, 0));
    cakeGroup.add(flame, glow, light);
    candles.push({ state: 'lit', t: 0, flame, glow, light, pos: tip });
  }

  // Smoke
  const puffs: Puff[] = Array.from({ length: 18 }, () => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: smokeTex,
        color: 0xa9a4a0,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      }),
    );
    sprite.visible = false;
    cakeGroup.add(sprite);
    return { sprite, age: 99, life: 1.6, delay: 0, base: new THREE.Vector3() };
  });
  let puffCursor = 0;

  const confetti = createConfetti3D(
    scene,
    [style.side, style.icing, style.accent, ...style.sprinkles],
    130,
    reducedMotion,
  );

  // Animation
  let yawTarget = 0;
  let cutT = -1;
  const celebrated = { out: false, cut: false };
  let raf = 0;
  let disposed = false;
  const clock = new THREE.Timer();

  function spawnSmoke(at: THREE.Vector3) {
    for (let k = 0; k < 3; k += 1) {
      const p = puffs[puffCursor % puffs.length]!;
      puffCursor += 1;
      p.age = 0;
      p.life = 1.4 + Math.random() * 0.5;
      p.delay = k * 0.12;
      p.base.copy(at).add(new THREE.Vector3(rand(-0.03, 0.03), 0.05, rand(-0.03, 0.03)));
      p.sprite.visible = false;
    }
  }

  function celebrate(kind: 'out' | 'cut') {
    if (celebrated[kind]) return;
    celebrated[kind] = true;
    confetti.burst(new THREE.Vector3(0, topY + 1.4, kind === 'cut' ? 0.8 : 0), kind === 'cut' ? 90 : 130);
    stage.flash.position.set(0, topY + 1, 0);
    stage.flash.intensity = 14;
  }

  function update(dt: number, t: number) {
    root.rotation.y += (yawTarget + (reducedMotion || cutT >= 0 ? 0 : Math.sin(t * 0.6) * 0.06) - root.rotation.y) * (1 - Math.exp(-dt * 7));

    candles.forEach((c, i) => {
      if (c.state === 'lit') {
        const s = 1 + 0.07 * Math.sin(t * 18 + i * 2) + 0.05 * Math.sin(t * 31 + i);
        c.flame.scale.set(0.34 * (1 + 0.06 * Math.sin(t * 23 + i)), 0.5 * s, 1);
        c.flame.material.rotation = 0.07 * Math.sin(t * 9 + i * 1.7);
        c.glow.material.opacity = 0.5 + 0.12 * Math.sin(t * 14 + i);
        c.light.intensity = 1.3 + 0.25 * Math.sin(t * 20 + i * 3);
      } else if (c.state === 'blowing') {
        c.t += dt;
        const k = clamp(c.t / 0.34, 0, 1);
        c.flame.material.rotation = 0.9 * k;
        c.flame.scale.set(0.34 * (1 - 0.6 * k), 0.5 * (1 - k), 1);
        c.glow.material.opacity = 0.5 * (1 - k);
        c.light.intensity = 1.3 * (1 - k);
        if (k >= 1) {
          c.state = 'out';
          c.flame.visible = false;
          c.glow.visible = false;
          c.light.intensity = 0;
          spawnSmoke(c.pos);
        }
      }
    });

    for (const p of puffs) {
      p.age += dt;
      const a = p.age - p.delay;
      if (a < 0 || a > p.life) {
        p.sprite.visible = false;
        continue;
      }
      const k = a / p.life;
      p.sprite.visible = true;
      p.sprite.position.set(p.base.x + Math.sin(a * 3) * 0.05, p.base.y + a * 0.55, p.base.z);
      const size = 0.16 + k * 0.5;
      p.sprite.scale.set(size, size, 1);
      p.sprite.material.opacity = 0.42 * (1 - k) * Math.min(1, a * 8);
    }

    if (cutT >= 0) {
      cutT += dt;
      const k = clamp(cutT / 1.1, 0, 1);
      const e = easeOutCubic(k);
      wedgeGroup.position.set(0, Math.sin(k * Math.PI) * 0.06, 0.55 * e);
      wedgeGroup.rotation.y = 0.12 * e;
      if (cutT > 0.5) celebrate('cut');
    }

    stage.flash.intensity = Math.max(0, stage.flash.intensity - dt * 20);
    confetti.update(dt);
  }

  function frame() {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    clock.update();
    const dt = Math.min(clock.getDelta(), 0.05);
    update(dt, clock.getElapsed());
    renderer.render(scene, camera);
  }
  if (process.env.NODE_ENV === 'development') {
    (window as unknown as { __cake?: unknown }).__cake = { scene, camera, renderer, root };
  }
  frame();

  return {
    blow(index) {
      const c = candles[index];
      if (c && c.state === 'lit') {
        c.state = 'blowing';
        c.t = 0;
      }
    },
    cut() {
      if (cutT < 0) cutT = 0;
    },
    celebrate,
    setYaw(radians) {
      yawTarget = clamp(radians, -1.2, 1.2);
    },
    resize: stage.resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      textures.forEach((t) => t.dispose());
      stage.dispose();
    },
  };
}
