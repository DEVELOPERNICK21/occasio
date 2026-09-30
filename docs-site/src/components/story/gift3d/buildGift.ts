import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { GiftStyle } from '@/lib/experience/momentTheme';
import { createConfetti3D } from './confetti3d';
import { createStage } from './stage3d';
import { makeGlowTexture, makeGrainTexture, makePaperTexture, makeTagTexture } from './textures';

export type GiftOptions = {
  style: GiftStyle;
  name: string;
  line: string;
  reducedMotion: boolean;
  onOpened: () => void;
};

export type GiftController = {
  /** 1 and 2 rattle the box harder each time. */
  shake(level: number): void;
  open(): void;
  setYaw(radians: number): void;
  resize(width: number, height: number): void;
  dispose(): void;
};

const TAU = Math.PI * 2;
const BODY = { w: 2, h: 1.25, d: 2 };
const LID = { w: 2.16, h: 0.36, d: 2.16 };
const CONFETTI = 130;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** A flat band swept along a path. `fixed` sets the width axis; `ref` derives it from the path. */
function strip(
  points: THREE.Vector3[],
  width: number,
  axis: { fixed: THREE.Vector3 } | { ref: THREE.Vector3 },
  taper = 0,
): THREE.BufferGeometry {
  const n = points.length;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < n; i += 1) {
    const p = points[i]!;
    const prev = points[Math.max(0, i - 1)]!;
    const next = points[Math.min(n - 1, i + 1)]!;
    const tangent = next.clone().sub(prev).normalize();
    const dir =
      'fixed' in axis
        ? axis.fixed.clone()
        : new THREE.Vector3().crossVectors(tangent, axis.ref).normalize();
    const half = (width / 2) * (1 - taper * (i / (n - 1)));
    const a = p.clone().addScaledVector(dir, half);
    const b = p.clone().addScaledVector(dir, -half);
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    uv.push(0, i / (n - 1), 1, i / (n - 1));
    if (i < n - 1) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Lens-shaped loop of ribbon standing in the XY plane, one end at the knot. */
function loopPoints(length: number, height: number, steps = 44): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const th = (i / steps) * TAU;
    const x = (length * (1 - Math.cos(th))) / 2;
    const y = height * Math.sin(th) * (0.35 + 0.65 * Math.sin(th / 2));
    // A little belly in z makes the loop read as puffy satin, not a flat cut-out.
    const z = Math.sin((i / steps) * Math.PI) * 0.09;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

function beamTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 256, 0, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.25)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 256);
  return new THREE.CanvasTexture(canvas);
}

export function createGift(canvas: HTMLCanvasElement, opts: GiftOptions): GiftController {
  const { style, reducedMotion } = opts;

  const stage = createStage(canvas, {
    camera: { position: [0, 2.7, 7.9], lookAt: [0, 1.45, 0] },
    narrow: { aspect: 0.85, z: 8.7 },
    glow: style.glow,
  });
  const { scene, renderer, camera, flash } = stage;

  // A soft contact blob under the box so it feels grounded.
  const blobTex = makeGlowTexture('rgba(30,10,20,0.42)', 'rgba(30,10,20,0)');
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(3.7, 3.7),
    new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.003;
  scene.add(blob);

  // Materials
  const paperMap = makePaperTexture(style);
  const grain = makeGrainTexture();
  const paper = new THREE.MeshPhysicalMaterial({
    map: paperMap,
    bumpMap: grain,
    bumpScale: 0.9,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.32,
  });
  const lidPaperMap = paperMap.clone();
  lidPaperMap.repeat.set(1.15, 0.28);
  lidPaperMap.needsUpdate = true;
  const lidPaper = paper.clone();
  lidPaper.map = lidPaperMap;

  const satin = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(style.ribbon),
    roughness: 0.34,
    metalness: 0.1,
    sheen: 0.55,
    sheenColor: new THREE.Color(style.ribbonSheen),
    sheenRoughness: 0.32,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
    side: THREE.DoubleSide,
  });

  // Hierarchy: root (yaw + wobble) > body, lidGroup (ribbon + bow)
  const root = new THREE.Group();
  scene.add(root);

  const body = new THREE.Mesh(new RoundedBoxGeometry(BODY.w, BODY.h, BODY.d, 6, 0.07), paper);
  body.position.y = BODY.h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  paperMap.repeat.set(2.2, 1.4);
  root.add(body);

  const ribbonGeoA = new RoundedBoxGeometry(0.36, BODY.h + 0.012, BODY.d + 0.03, 3, 0.02);
  const ribbonGeoB = new RoundedBoxGeometry(BODY.w + 0.03, BODY.h + 0.012, 0.36, 3, 0.02);
  const bodyRibbonA = new THREE.Mesh(ribbonGeoA, satin);
  const bodyRibbonB = new THREE.Mesh(ribbonGeoB, satin);
  bodyRibbonA.position.y = BODY.h / 2;
  bodyRibbonB.position.y = BODY.h / 2 - 0.001;
  bodyRibbonA.castShadow = bodyRibbonB.castShadow = true;
  root.add(bodyRibbonA, bodyRibbonB);

  const lidGroup = new THREE.Group();
  const lidRestY = BODY.h + LID.h / 2 - 0.03;
  lidGroup.position.y = lidRestY;
  root.add(lidGroup);

  const lid = new THREE.Mesh(new RoundedBoxGeometry(LID.w, LID.h, LID.d, 5, 0.06), lidPaper);
  lid.castShadow = true;
  lid.receiveShadow = true;
  lidGroup.add(lid);

  const lidRibbonA = new THREE.Mesh(new RoundedBoxGeometry(0.38, LID.h + 0.014, LID.d + 0.03, 3, 0.02), satin);
  const lidRibbonB = new THREE.Mesh(new RoundedBoxGeometry(LID.w + 0.03, LID.h + 0.014, 0.38, 3, 0.02), satin);
  lidRibbonA.castShadow = lidRibbonB.castShadow = true;
  lidGroup.add(lidRibbonA, lidRibbonB);

  // Bow
  const bow = new THREE.Group();
  bow.position.y = LID.h / 2 + 0.02;
  lidGroup.add(bow);
  const zAxis = new THREE.Vector3(0, 0, 1);
  const loops: Array<[number, number, number, number]> = [
    // length, height, rotation.z, mirror (1 = right, -1 = left)
    [0.98, 0.5, 0.42, 1],
    [0.98, 0.5, 0.42, -1],
    [0.72, 0.32, -0.05, 1],
    [0.72, 0.32, -0.05, -1],
  ];
  for (const [length, height, rz, side] of loops) {
    const mesh = new THREE.Mesh(strip(loopPoints(length, height), 0.42, { fixed: zAxis }), satin);
    mesh.castShadow = true;
    // Order matters: tilt the loop toward the viewer first, then splay it left or right.
    mesh.rotation.order = 'ZXY';
    mesh.rotation.z = side === 1 ? rz : Math.PI - rz;
    mesh.rotation.x = -0.75;
    mesh.position.y = 0.06;
    bow.add(mesh);
  }
  for (const side of [-1, 1]) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 16; i += 1) {
      const t = i / 16;
      pts.push(
        new THREE.Vector3(
          side * (0.05 + t * 0.78),
          0.02 + Math.sin(t * Math.PI) * 0.045,
          0.06 + t * 0.9 + Math.sin(t * 5) * 0.03,
        ),
      );
    }
    const tail = new THREE.Mesh(strip(pts, 0.26, { ref: new THREE.Vector3(0, 1, 0) }, 0.12), satin);
    tail.castShadow = true;
    bow.add(tail);
  }
  const knot = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.26, 0.34, 4, 0.08), satin);
  knot.position.y = 0.09;
  knot.castShadow = true;
  bow.add(knot);

  // Gift tag that rises when opened
  const tagTex = makeTagTexture(opts.name, opts.line, style.motif2 === '#FFFFFF' ? style.ribbon : style.motif2);
  const tag = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 1.12),
    new THREE.MeshBasicMaterial({ map: tagTex, transparent: true, side: THREE.DoubleSide, toneMapped: false }),
  );
  tag.visible = false;
  scene.add(tag);

  // Light beam
  const beamTex = beamTexture();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.78, 0.16, 3.4, 40, 1, true),
    new THREE.MeshBasicMaterial({
      map: beamTex,
      color: new THREE.Color(style.glow),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  beam.position.y = BODY.h + 1.55;
  scene.add(beam);

  // Idle sparkles hint that the box is alive
  const sparkleCount = 26;
  const sparkPos = new Float32Array(sparkleCount * 3);
  for (let i = 0; i < sparkleCount; i += 1) {
    const a = Math.random() * TAU;
    const r = 1.7 + Math.random() * 0.9;
    sparkPos[i * 3] = Math.cos(a) * r;
    sparkPos[i * 3 + 1] = 0.3 + Math.random() * 2.4;
    sparkPos[i * 3 + 2] = Math.sin(a) * r;
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const glowTex = makeGlowTexture();
  const sparkles = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({
      map: glowTex,
      size: 0.24,
      color: new THREE.Color(style.glow),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.8,
    }),
  );
  scene.add(sparkles);

  const confetti = createConfetti3D(
    scene,
    [style.ribbon, style.motif, style.motif2, '#FF5D7A', '#3A86FF', '#06D6A0', '#FFFFFF'],
    CONFETTI,
    reducedMotion,
  );

  // State
  let yawTarget = 0;
  let wobble = { t: 99, amp: 0 };
  let openT = -1;
  let burstDone = false;
  let notified = false;
  const lidVel = new THREE.Vector3();
  const lidSpin = new THREE.Vector3();
  let raf = 0;
  let disposed = false;
  const clock = new THREE.Timer();

  function update(dt: number, t: number) {
    const opened = openT >= 0;
    const idleSway = reducedMotion || opened ? 0 : Math.sin(t * 0.7) * 0.1;
    root.rotation.y += (yawTarget + idleSway - root.rotation.y) * (1 - Math.exp(-dt * 7));
    root.position.y = reducedMotion || opened ? 0 : Math.sin(t * 1.7) * 0.025;
    root.rotation.z = 0;
    root.rotation.x = 0;
    root.scale.set(1, 1, 1);

    if (wobble.t < 2) {
      wobble.t += dt;
      const decay = Math.exp(-wobble.t * 4.4);
      root.rotation.z = Math.sin(wobble.t * 26) * 0.12 * wobble.amp * decay;
      root.rotation.x = Math.cos(wobble.t * 22) * 0.055 * wobble.amp * decay;
      root.position.y += Math.abs(Math.sin(wobble.t * 13)) * 0.2 * wobble.amp * Math.exp(-wobble.t * 5);
      lidGroup.position.y = lidRestY + Math.abs(Math.sin(wobble.t * 38)) * 0.035 * wobble.amp * decay;
    } else if (!opened) {
      lidGroup.position.y = lidRestY;
    }

    sparkles.rotation.y = t * 0.12;
    (sparkles.material as THREE.PointsMaterial).opacity = opened ? 0.35 : 0.55 + Math.sin(t * 2.4) * 0.3;

    if (opened) {
      openT += dt;

      if (openT < 0.22) {
        // Anticipation: the box squashes a touch and the lid presses down.
        const s = Math.sin((openT / 0.22) * Math.PI);
        root.scale.set(1 + 0.05 * s, 1 - 0.07 * s, 1 + 0.05 * s);
        lidGroup.position.y = lidRestY - 0.04 * s;
      } else {
        if (!burstDone) {
          burstDone = true;
          confetti.burst(new THREE.Vector3(0, BODY.h + 0.2, 0));
          lidVel.set(0.9, 4.3, 0.6);
          lidSpin.set(2.2, 4.4, 3.2);
          flash.intensity = 16;
        }
        const k = openT - 0.22;
        lidVel.y -= 9.5 * dt;
        lidGroup.position.addScaledVector(lidVel, dt);
        lidGroup.rotation.x += lidSpin.x * dt;
        lidGroup.rotation.y += lidSpin.y * dt;
        lidGroup.rotation.z += lidSpin.z * dt;
        const shrink = clamp(1 - (k - 0.55) / 0.5, 0, 1);
        lidGroup.scale.setScalar(shrink);
        lidGroup.visible = shrink > 0.01;

        flash.intensity = Math.max(0, flash.intensity - dt * 22);
        const beamAlpha = k < 0.35 ? (k / 0.35) * 0.6 : Math.max(0.12, 0.6 - (k - 0.35) * 0.32);
        (beam.material as THREE.MeshBasicMaterial).opacity = beamAlpha;

        const p = clamp((k - 0.08) / 1.1, 0, 1);
        tag.visible = true;
        tag.position.y = BODY.h - 0.1 + easeOutBack(p) * 1.15;
        tag.position.x = 0;
        tag.position.z = 0.4 + p * 0.4;
        tag.scale.setScalar(0.35 + easeOutCubic(p) * 0.65);
        tag.rotation.y = Math.sin(t * 1.1) * 0.12 * p;
        tag.rotation.z = Math.sin(t * 0.8) * 0.05 * p;
        if (p >= 1) tag.position.y += Math.sin(t * 1.6) * 0.035;

        if (!notified && k > 1.4) {
          notified = true;
          opts.onOpened();
        }
      }
    }

    confetti.update(dt);
  }

  function frame() {
    if (disposed) return;
    // Browsers already pause requestAnimationFrame for background tabs.
    raf = requestAnimationFrame(frame);
    clock.update();
    const dt = Math.min(clock.getDelta(), 0.05);
    update(dt, clock.getElapsed());
    renderer.render(scene, camera);
  }
  if (process.env.NODE_ENV === 'development') {
    (window as unknown as { __gift?: unknown }).__gift = { scene, camera, renderer, root };
  }
  frame();

  return {
    shake(level: number) {
      if (openT >= 0) return;
      wobble = { t: 0, amp: 0.7 + level * 0.55 };
    },
    open() {
      if (openT >= 0) return;
      openT = 0;
    },
    setYaw(radians: number) {
      yawTarget = clamp(radians, -1.1, 1.1);
    },
    resize: stage.resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      [paperMap, lidPaperMap, grain, tagTex, blobTex, beamTex, glowTex].forEach((t) => t.dispose());
      stage.dispose();
    },
  };
}
