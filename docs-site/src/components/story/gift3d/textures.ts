import * as THREE from 'three';
import type { GiftStyle } from '@/lib/experience/momentTheme';

const TAU = Math.PI * 2;

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s / 24, s / 24);
  ctx.translate(-12, -12);
  ctx.fill(
    new Path2D(
      'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    ),
  );
  ctx.restore();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (i / 10) * TAU - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.ellipse(0, 0, s, s * 0.42, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-s * 0.9, 0);
  ctx.lineTo(s * 0.9, 0);
  ctx.stroke();
  ctx.restore();
}

/** Seamless wrapping-paper tile, drawn on a canvas so each moment has its own print. */
export function makePaperTexture(style: GiftStyle): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, style.paper);
  base.addColorStop(1, style.paper);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Draw each motif at the tile edges too, so the pattern wraps without a seam.
  const stamp = (fn: (x: number, y: number) => void, x: number, y: number) => {
    for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) fn(x + dx, y + dy);
  };

  const step = 128;
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const x = col * step + (row % 2 ? step / 2 : 0) + step / 4;
      const y = row * step + step / 2;
      const alt = (row + col) % 2 === 0;
      switch (style.pattern) {
        case 'dots':
          ctx.fillStyle = style.motif;
          stamp((px, py) => {
            ctx.beginPath();
            ctx.arc(px, py, alt ? 15 : 9, 0, TAU);
            ctx.fill();
          }, x, y);
          ctx.fillStyle = style.motif2;
          stamp((px, py) => star(ctx, px + 46, py + 30, 9, 0.3), x, y);
          break;
        case 'hearts':
          ctx.fillStyle = alt ? style.motif : style.motif2;
          ctx.globalAlpha = alt ? 0.85 : 0.6;
          stamp((px, py) => heart(ctx, px, py, alt ? 40 : 22, alt ? -0.2 : 0.25), x, y);
          ctx.globalAlpha = 1;
          break;
        case 'leaves':
          ctx.fillStyle = alt ? style.motif : style.motif2;
          ctx.globalAlpha = 0.9;
          stamp((px, py) => leaf(ctx, px, py, alt ? 34 : 24, (row * 0.8 + col) * 0.9), x, y);
          ctx.globalAlpha = 1;
          break;
        case 'stars':
          ctx.fillStyle = alt ? style.motif : style.motif2;
          ctx.globalAlpha = alt ? 1 : 0.7;
          stamp((px, py) => star(ctx, px, py, alt ? 24 : 12, row * 0.5 + col), x, y);
          ctx.globalAlpha = 1;
          break;
        case 'doodles':
        default:
          ctx.strokeStyle = alt ? style.motif : style.motif2;
          ctx.fillStyle = alt ? style.motif : style.motif2;
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          stamp((px, py) => {
            if ((row + col) % 3 === 0) {
              ctx.beginPath();
              ctx.arc(px, py, 16, 0, TAU);
              ctx.stroke();
            } else if ((row + col) % 3 === 1) {
              ctx.beginPath();
              ctx.moveTo(px - 30, py);
              ctx.bezierCurveTo(px - 16, py - 22, px - 2, py + 22, px + 12, py);
              ctx.bezierCurveTo(px + 20, py - 14, px + 28, py + 10, px + 34, py);
              ctx.stroke();
            } else {
              star(ctx, px, py, 18, 0.2);
            }
          }, x, y);
          break;
      }
    }
  }

  // Soft paper sheen: a barely-there diagonal light wash.
  const wash = ctx.createLinearGradient(0, 0, size, size);
  wash.addColorStop(0, 'rgba(255,255,255,0.10)');
  wash.addColorStop(0.5, 'rgba(255,255,255,0)');
  wash.addColorStop(1, 'rgba(0,0,0,0.08)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Fine paper grain for the bump map. */
export function makeGrainTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.random() * 60;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

/** Hand-written gift tag that rises out of the box. */
export function makeTagTexture(name: string, line: string, accent: string): THREE.CanvasTexture {
  const w = 640;
  const h = 420;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFF9EC';
  ctx.beginPath();
  ctx.roundRect(20, 20, w - 40, h - 40, 26);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.setLineDash([16, 12]);
  ctx.beginPath();
  ctx.roundRect(40, 40, w - 80, h - 80, 18);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#EDE0C8';
  ctx.beginPath();
  ctx.arc(w / 2, 62, 13, 0, TAU);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#7A6A58';
  ctx.font = '600 30px system-ui, sans-serif';
  ctx.fillText('FOR', w / 2, 140);

  let size = 96;
  ctx.fillStyle = '#2B1B2E';
  do {
    ctx.font = `italic 700 ${size}px Georgia, serif`;
    size -= 4;
  } while (ctx.measureText(name).width > w - 130 && size > 36);
  ctx.fillText(name, w / 2, 240);

  ctx.fillStyle = accent;
  ctx.font = 'italic 500 34px Georgia, serif';
  ctx.fillText(line, w / 2, 316);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Soft round glow used for sparkles and the contact shadow. */
export function makeGlowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
