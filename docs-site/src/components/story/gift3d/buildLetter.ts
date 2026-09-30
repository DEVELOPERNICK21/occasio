import * as THREE from 'three';
import type { LetterStyle } from '@/lib/experience/momentTheme';
import { createConfetti3D } from './confetti3d';
import { createStage } from './stage3d';
import {
  makeEnvelopeTexture,
  makeGlowTexture,
  makeLetterCanvas,
  makeLiningTexture,
  luminance,
  makeSealTextures,
} from './textures';

export type LetterOptions = {
  style: LetterStyle;
  glow: string;
  greeting: string;
  body: string;
  signoff: string;
  photo: HTMLImageElement | null;
  fontFamily: string;
  reducedMotion: boolean;
  onSealBroken: () => void;
  onUnfolded: () => void;
  onWritten: () => void;
};

export type LetterController = {
  /** 0..1 while the recipient presses and holds the wax seal. */
  setHold: (progress: number) => void;
  breakSeal: () => void;
  /** Jump to the finished letter. */
  skip: () => void;
  setYaw: (radians: number) => void;
  /** Where the seal sits on the canvas, as fractions (0..1) from the top-left. */
  sealScreen: () => { x: number; y: number };
  isOpened: () => boolean;
  resize: (width: number, height: number) => void;
  dispose: () => void;
};

const ENV_W = 3.0;
const ENV_H = 2.0;
const ENV_Y = 1.05;
const LETTER_W = 2.6;
const PANEL_H = 1.1;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Seconds after the seal breaks for each beat. */
const BEAT = {
  flap: [0.35, 1.15],
  peek: [1.05, 1.75],
  out: [1.75, 2.7],
  unfoldMiddle: [1.95, 2.55],
  unfoldBottom: [2.45, 3.05],
  camera: [1.2, 2.9],
  unfolded: 3.05,
} as const;

function panelGeometry(index: number): THREE.PlaneGeometry {
  const g = new THREE.PlaneGeometry(LETTER_W, PANEL_H, 14, 1);
  // A gentle bow across the width so the sheet reads as paper, not a flat card.
  const pos = g.attributes.position!;
  for (let i = 0; i < pos.count; i += 1) {
    const u = pos.getX(i) / LETTER_W + 0.5;
    pos.setZ(i, Math.sin(u * Math.PI) * 0.06);
  }
  g.computeVertexNormals();
  const uv = g.attributes.uv!;
  for (let i = 0; i < uv.count; i += 1) {
    // Panels are stacked bottom to top; the texture's top row is v = 1.
    uv.setY(i, index / 3 + uv.getY(i) / 3);
  }
  uv.needsUpdate = true;
  return g;
}

export function createLetter(canvas: HTMLCanvasElement, opts: LetterOptions): LetterController {
  const { style, reducedMotion } = opts;
  const stage = createStage(canvas, {
    camera: { position: [0, 2.3, 7.3], lookAt: [0, 1.05, 0] },
    narrow: { aspect: 0.85, z: 8.2 },
    keyPosition: [1.2, 7.4, 4.6],
    glow: opts.glow,
  });
  const { scene, renderer, camera } = stage;
  const textures: THREE.Texture[] = [];
  const track = <T extends THREE.Texture>(t: T): T => {
    textures.push(t);
    return t;
  };

  // Materials
  const envTex = track(makeEnvelopeTexture(style.envelope));
  const liningTex = track(makeLiningTexture(style.lining, style.liningMotif, style.pattern));
  const outsideMat = new THREE.MeshPhysicalMaterial({
    map: envTex,
    emissive: new THREE.Color('#ffffff'),
    emissiveMap: envTex,
    // Self-light only for pale stock; it would wash a kraft or navy envelope to grey.
    emissiveIntensity: 0.3 * clamp((luminance(style.envelope) - 0.55) / 0.35, 0, 1),
    roughness: 0.82,
    // Dark stock keeps the sheen low, or the highlights bleach it toward lavender.
    sheen: 0.5 * clamp(luminance(style.envelope) * 1.6, 0.1, 1),
    sheenColor: new THREE.Color('#ffffff'),
    sheenRoughness: 0.7,
  });
  // The key light is strong; pull dark stock down so navy stays navy.
  const darkness = luminance(style.envelope) < 0.35 ? 0.55 : 1;
  outsideMat.color = new THREE.Color(darkness, darkness, darkness);
  const pocketMat = outsideMat.clone();
  pocketMat.color = new THREE.Color(0.95 * darkness, 0.95 * darkness, 0.95 * darkness);
  const liningMat = new THREE.MeshStandardMaterial({ map: liningTex, roughness: 0.9 });

  // Envelope
  const env = new THREE.Group();
  env.position.y = ENV_Y;
  scene.add(env);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(ENV_W, ENV_H), liningMat);
  back.castShadow = true;
  env.add(back);

  const pocket = new THREE.Shape();
  pocket.moveTo(-ENV_W / 2, -ENV_H / 2);
  pocket.lineTo(ENV_W / 2, -ENV_H / 2);
  pocket.lineTo(ENV_W / 2, ENV_H / 2);
  pocket.lineTo(0, 0.02);
  pocket.lineTo(-ENV_W / 2, ENV_H / 2);
  pocket.closePath();
  const pocketMesh = new THREE.Mesh(new THREE.ShapeGeometry(pocket), pocketMat);
  pocketMesh.position.z = 0.02;
  pocketMesh.castShadow = true;
  env.add(pocketMesh);

  // Fold lines on the front, for depth
  const seam = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-ENV_W / 2, -ENV_H / 2, 0.022),
      new THREE.Vector3(0, 0.02, 0.022),
      new THREE.Vector3(ENV_W / 2, -ENV_H / 2, 0.022),
      new THREE.Vector3(0, 0.02, 0.022),
    ]),
    new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 }),
  );
  env.add(seam);

  // Flap: outside + lining as two back-to-back shapes
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-ENV_W / 2, 0);
  flapShape.lineTo(ENV_W / 2, 0);
  flapShape.quadraticCurveTo(ENV_W * 0.2, -ENV_H * 0.42, 0, -ENV_H * 0.58);
  flapShape.quadraticCurveTo(-ENV_W * 0.2, -ENV_H * 0.42, -ENV_W / 2, 0);
  const flapGeo = new THREE.ShapeGeometry(flapShape);
  const flap = new THREE.Group();
  flap.position.set(0, ENV_H / 2, 0.03);
  const flapOut = new THREE.Mesh(flapGeo, outsideMat);
  flapOut.castShadow = true;
  const flapIn = new THREE.Mesh(flapGeo, liningMat);
  flapIn.rotation.y = Math.PI;
  flapIn.position.z = -0.003;
  flap.add(flapOut, flapIn);
  env.add(flap);

  // Wax seal, two halves so it can crack
  const sealTex = makeSealTextures(style.wax);
  textures.push(sealTex.color, sealTex.bump);
  for (const t of [sealTex.color, sealTex.bump]) {
    t.center.set(0.5, 0.5);
    t.rotation = Math.PI / 2;
  }
  const waxMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: sealTex.color,
    bumpMap: sealTex.bump,
    bumpScale: 2.4,
    roughness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    emissive: new THREE.Color(style.wax),
    emissiveIntensity: 0,
  });
  const seal = new THREE.Group();
  seal.position.set(0, -ENV_H * 0.5, 0.05);
  seal.rotation.x = Math.PI / 2;
  const halfR = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.08, 40, 1, false, 0, Math.PI), waxMat);
  const halfL = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.08, 40, 1, false, Math.PI, Math.PI), waxMat);
  halfR.castShadow = halfL.castShadow = true;
  seal.add(halfR, halfL);
  flap.add(seal);

  // Letter, folded in thirds (Z-fold), sitting inside the envelope
  const letterCanvas = makeLetterCanvas({
    paper: style.paper,
    ink: style.ink,
    accent: style.accent,
    fontFamily: opts.fontFamily,
    greeting: opts.greeting,
    body: opts.body,
    signoff: opts.signoff,
    photo: opts.photo,
  });
  textures.push(letterCanvas.texture);
  const sheetMat = new THREE.MeshStandardMaterial({
    map: letterCanvas.texture,
    roughness: 0.92,
    side: THREE.DoubleSide,
    // A little self-light keeps cream paper looking cream, not grey, under tone mapping.
    emissive: new THREE.Color('#ffffff'),
    emissiveMap: letterCanvas.texture,
    emissiveIntensity: 0.5,
  });
  // The sheet hangs from its top edge, so unfolding always opens downward.
  const letterRoot = new THREE.Group();
  const letterTop0 = ENV_Y + PANEL_H / 2;
  const LETTER_SCALE = 1.38;
  const LETTER_TOP_FINAL = 0.3 + 3 * PANEL_H * LETTER_SCALE;
  letterRoot.position.set(0, letterTop0, 0.012);
  scene.add(letterRoot);

  const makePanel = (index: number, parent: THREE.Object3D, y: number) => {
    const g = new THREE.Group();
    g.position.y = y;
    const mesh = new THREE.Mesh(panelGeometry(index), sheetMat);
    mesh.position.y = -PANEL_H / 2;
    mesh.castShadow = true;
    g.add(mesh);
    parent.add(g);
    return g;
  };
  // index 2 = top third of the texture, 0 = bottom third.
  const panelTop = makePanel(2, letterRoot, 0);
  const panelMiddle = makePanel(1, panelTop, -PANEL_H);
  const panelBottom = makePanel(0, panelMiddle, -PANEL_H);
  // Folded in a Z: the middle third folds up over the top, the bottom folds down again.
  panelMiddle.rotation.x = Math.PI;
  panelBottom.rotation.x = -Math.PI;

  // Dust motes and paper confetti
  const motePos = new Float32Array(36 * 3);
  for (let i = 0; i < 36; i += 1) {
    motePos[i * 3] = (Math.random() - 0.5) * 6;
    motePos[i * 3 + 1] = Math.random() * 4.5;
    motePos[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  const glowTex = track(makeGlowTexture());
  const motes = new THREE.Points(
    moteGeo,
    new THREE.PointsMaterial({
      map: glowTex,
      size: 0.16,
      color: new THREE.Color(opts.glow),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  scene.add(motes);

  const confetti = createConfetti3D(
    scene,
    [style.accent, style.wax, style.liningMotif, '#FFFFFF', style.envelope],
    110,
    reducedMotion,
  );

  const blobTex = track(makeGlowTexture('rgba(30,10,20,0.4)', 'rgba(30,10,20,0)'));
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 2.4),
    new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }),
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.003;
  scene.add(blob);

  // State
  type Phase = 'sealed' | 'opening' | 'writing' | 'done';
  let phase: Phase = 'sealed';
  let t = 0;
  let hold = 0;
  let yawTarget = 0;
  let typed = 0;
  let lastDraw = 0;
  let unfoldedFired = false;
  let paused = false;
  let raf = 0;
  let disposed = false;
  const timer = new THREE.Timer();
  const halves: Array<{ mesh: THREE.Mesh; vel: THREE.Vector3; spin: THREE.Vector3 }> = [];

  const camFrom = { pos: new THREE.Vector3(0, 2.3, 7.3), look: new THREE.Vector3(0, 1.05, 0) };
  const camTo = { pos: new THREE.Vector3(0, 2.7, 9.2), look: new THREE.Vector3(0, 2.55, 0) };
  const camLook = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  function detachSeal() {
    for (const [mesh, dir] of [
      [halfR, 1],
      [halfL, -1],
    ] as const) {
      scene.attach(mesh);
      halves.push({
        mesh,
        vel: new THREE.Vector3(dir * (1.1 + Math.random() * 0.5), 1.6 + Math.random() * 0.6, 0.9),
        spin: new THREE.Vector3(Math.random() * 4, dir * 3, dir * (2 + Math.random() * 3)),
      });
    }
  }

  function breakSeal() {
    if (phase !== 'sealed') return;
    phase = 'opening';
    t = 0;
    detachSeal();
    tmp.setFromMatrixPosition(halfR.matrixWorld);
    confetti.burst(tmp.clone(), 26);
    opts.onSealBroken();
    if (reducedMotion) t = BEAT.unfolded + 0.01;
  }

  function finishNow() {
    t = Math.max(t, BEAT.unfolded + 0.02);
    typed = letterCanvas.total;
    letterCanvas.render(typed);
    for (const h of halves) h.mesh.visible = false;
  }

  function update(dt: number, time: number) {
    // Yaw + idle motion while the envelope is still on the table
    const opened = phase !== 'sealed';
    env.rotation.y += ((opened ? 0 : yawTarget) + (opened ? 0 : Math.sin(time * 0.8) * 0.05) - env.rotation.y) * (1 - Math.exp(-dt * 6));
    env.position.y = ENV_Y + (opened ? 0 : Math.sin(time * 1.5) * 0.025);
    // Before opening the letter rides with the envelope; after, the reader can tilt it.
    letterRoot.rotation.y += ((opened ? yawTarget : env.rotation.y) - letterRoot.rotation.y) * (1 - Math.exp(-dt * 6));

    // Press-and-hold feedback on the seal
    if (phase === 'sealed') {
      const shake = hold * 0.012;
      seal.position.x = Math.sin(time * 70) * shake;
      seal.scale.setScalar(1 + hold * 0.16);
      waxMat.emissiveIntensity = hold * 0.7;
    } else {
      waxMat.emissiveIntensity = 0;
    }

    if (opened) {
      if (!paused) t += dt;

      // Broken wax falls away
      for (const h of halves) {
        h.vel.y -= 9 * dt;
        h.mesh.position.addScaledVector(h.vel, dt);
        h.mesh.rotation.x += h.spin.x * dt;
        h.mesh.rotation.y += h.spin.y * dt;
        h.mesh.rotation.z += h.spin.z * dt;
        h.mesh.scale.setScalar(clamp(1 - (t - 0.5) / 0.5, 0, 1));
        h.mesh.visible = h.mesh.scale.x > 0.02;
      }

      // Flap
      flap.rotation.x = Math.PI * 0.94 * easeInOut(prog(t, BEAT.flap[0], BEAT.flap[1]));

      // Letter: peek out, then come forward and unfold downward
      const peek = easeOutCubic(prog(t, BEAT.peek[0], BEAT.peek[1]));
      const out = easeInOut(prog(t, BEAT.out[0], BEAT.out[1]));
      letterRoot.position.y = lerp(letterTop0 + peek * 1.1, LETTER_TOP_FINAL, out);
      letterRoot.position.z = lerp(0.012, 0.9, out);
      letterRoot.scale.setScalar(lerp(1, LETTER_SCALE, out));
      panelMiddle.rotation.x = Math.PI * (1 - easeInOut(prog(t, BEAT.unfoldMiddle[0], BEAT.unfoldMiddle[1])));
      panelBottom.rotation.x = -Math.PI * (1 - easeInOut(prog(t, BEAT.unfoldBottom[0], BEAT.unfoldBottom[1])));

      // Envelope steps back
      // The envelope slips down and away so the letter has the stage to itself.
      env.position.y = lerp(ENV_Y, ENV_Y - 3.9, out);
      env.position.z = lerp(0, -1.2, out);
      env.scale.setScalar(lerp(1, 0.8, out));

      // Camera glides to frame the whole sheet
      const c = easeInOut(prog(t, BEAT.camera[0], BEAT.camera[1]));
      camera.position.lerpVectors(camFrom.pos, camTo.pos, c);
      if (camera.aspect < 0.85) camera.position.z += 0.9 * c;
      camLook.lerpVectors(camFrom.look, camTo.look, c);
      camera.lookAt(camLook);

      if (!unfoldedFired && t >= BEAT.unfolded) {
        unfoldedFired = true;
        phase = 'writing';
        tmp.set(0, 3.2, 1);
        confetti.burst(tmp.clone(), 80);
        stage.flash.position.set(0, 2.6, 3);
        stage.flash.intensity = 10;
        opts.onUnfolded();
      }
    }

    if (phase === 'writing') {
      // ~5 seconds of writing, capped so long messages still finish promptly.
      const perSecond = Math.max(letterCanvas.total / 5, 26);
      typed = Math.min(letterCanvas.total, typed + perSecond * dt);
      if (time - lastDraw > 0.06 || typed >= letterCanvas.total) {
        lastDraw = time;
        letterCanvas.render(Math.floor(typed));
      }
      if (typed >= letterCanvas.total) {
        phase = 'done';
        opts.onWritten();
      }
    }

    if (phase === 'done' && !reducedMotion) {
      // Once written, the sheet breathes a little.
      letterRoot.rotation.z = Math.sin(time * 0.9) * 0.012;
      letterRoot.position.y = LETTER_TOP_FINAL + Math.sin(time * 1.3) * 0.03;
    }

    motes.rotation.y = time * 0.03;
    stage.flash.intensity = Math.max(0, stage.flash.intensity - dt * 18);
    confetti.update(dt);
  }

  function frame() {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    update(dt, timer.getElapsed());
    renderer.render(scene, camera);
  }
  if (process.env.NODE_ENV === 'development') {
    // Dev-only: freeze the opening animation at a chosen second, to review each beat.
    (window as unknown as { __letter?: unknown }).__letter = {
      scene,
      camera,
      renderer,
      seek: (time: number) => {
        if (phase === 'sealed') breakSeal();
        paused = true;
        t = time;
      },
    };
  }
  frame();

  return {
    setHold(progress) {
      hold = clamp(progress, 0, 1);
    },
    breakSeal,
    skip() {
      if (phase === 'sealed') breakSeal();
      finishNow();
    },
    setYaw(radians) {
      yawTarget = clamp(radians, -0.7, 0.7);
    },
    sealScreen() {
      seal.updateWorldMatrix(true, false);
      tmp.setFromMatrixPosition(seal.matrixWorld).project(camera);
      return { x: (tmp.x + 1) / 2, y: (1 - tmp.y) / 2 };
    },
    isOpened: () => phase !== 'sealed',
    resize: stage.resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      textures.forEach((tx) => tx.dispose());
      halves.forEach((h) => {
        h.mesh.geometry.dispose();
      });
      stage.dispose();
    },
  };
}
