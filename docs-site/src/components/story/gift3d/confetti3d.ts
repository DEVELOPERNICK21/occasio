import * as THREE from 'three';

const TAU = Math.PI * 2;

type Piece = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  spin: THREE.Vector3;
  resting: boolean;
};

export type Confetti3D = {
  /** Shoot paper out of `origin`; pieces tumble, land flat on the floor and stay. */
  burst: (origin: THREE.Vector3, count?: number) => void;
  update: (dt: number) => void;
};

export function createConfetti3D(
  scene: THREE.Scene,
  palette: string[],
  capacity = 130,
  reducedMotion = false,
): Confetti3D {
  const mesh = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.13, 0.08),
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }),
    capacity,
  );
  mesh.visible = false;
  mesh.frustumCulled = false;
  scene.add(mesh);

  const pieces: Piece[] = Array.from({ length: capacity }, (_, i) => {
    mesh.setColorAt(i, new THREE.Color(palette[i % palette.length]));
    return {
      pos: new THREE.Vector3(0, -5, 0),
      vel: new THREE.Vector3(),
      rot: new THREE.Euler(),
      spin: new THREE.Vector3(),
      resting: true,
    };
  });
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  const dummy = new THREE.Object3D();
  let cursor = 0;

  return {
    burst(origin, count = capacity) {
      mesh.visible = true;
      const n = reducedMotion ? Math.min(count, 40) : count;
      for (let k = 0; k < n; k += 1) {
        const p = pieces[cursor % capacity]!;
        cursor += 1;
        p.resting = false;
        p.pos.set(
          origin.x + (Math.random() - 0.5) * 0.9,
          origin.y,
          origin.z + (Math.random() - 0.5) * 0.9,
        );
        const a = Math.random() * TAU;
        const speed = 1.2 + Math.random() * 2.6;
        p.vel.set(Math.cos(a) * speed, 4.2 + Math.random() * 3.6, Math.sin(a) * speed);
        p.rot.set(Math.random() * TAU, Math.random() * TAU, Math.random() * TAU);
        p.spin.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 16);
      }
    },
    update(dt) {
      if (!mesh.visible) return;
      for (let i = 0; i < capacity; i += 1) {
        const p = pieces[i]!;
        if (!p.resting) {
          p.vel.y -= 8.5 * dt;
          p.vel.multiplyScalar(1 - 0.9 * dt);
          p.pos.addScaledVector(p.vel, dt);
          p.rot.x += p.spin.x * dt;
          p.rot.y += p.spin.y * dt;
          p.rot.z += p.spin.z * dt;
          if (p.pos.y <= 0.012) {
            p.pos.y = 0.012 + Math.random() * 0.004;
            p.resting = true;
            p.rot.x = -Math.PI / 2;
            p.rot.y = 0;
          }
        }
        dummy.position.copy(p.pos);
        dummy.rotation.copy(p.rot);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
