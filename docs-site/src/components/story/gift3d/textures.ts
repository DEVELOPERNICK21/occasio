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

/** Perceived brightness of a #rrggbb colour, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Cotton-paper look: soft tint, long fibres, specks, and a faint vignette. */
export function drawPaperBase(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tint: string,
  fibres = 1400,
): void {
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < fibres; i += 1) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const len = 6 + Math.random() * 22;
    const a = Math.random() * TAU;
    // Pale fibres vanish on light paper and turn to noise on dark paper, so fade them with brightness.
    const pale = 0.05 + 0.3 * Math.min(1, luminance(tint) * 1.2);
    ctx.strokeStyle = Math.random() > 0.5 ? `rgba(255,255,255,${pale.toFixed(2)})` : 'rgba(90,70,50,0.10)';
    ctx.lineWidth = 0.6 + Math.random() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5, y + Math.sin(a + 0.6) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  for (let i = 0; i < 260; i += 1) {
    ctx.fillStyle = `rgba(80,60,40,${0.03 + Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 1.6, 1 + Math.random() * 1.6);
  }
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(60,40,20,0.14)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/** Envelope skin: paper tone with a faint deckled grain. */
export function makeEnvelopeTexture(color: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 340;
  const ctx = c.getContext('2d')!;
  drawPaperBase(ctx, 512, 340, color, 900);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Patterned tissue lining, like the inside of a nice envelope. */
export function makeLiningTexture(lining: string, motif: string, pattern: GiftStyle['pattern']): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 340;
  const ctx = c.getContext('2d')!;
  drawPaperBase(ctx, 512, 340, lining, 500);
  ctx.fillStyle = motif;
  ctx.strokeStyle = motif;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const x = col * 64 + (row % 2 ? 32 : 0);
      const y = row * 58 + 24;
      switch (pattern) {
        case 'hearts':
          heart(ctx, x, y, 22, 0.15);
          break;
        case 'stars':
          star(ctx, x, y, 12, row + col);
          break;
        case 'leaves':
          leaf(ctx, x, y, 16, (row + col) * 0.8);
          break;
        case 'doodles':
          if ((row + col) % 2) {
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, TAU);
            ctx.stroke();
          } else {
            star(ctx, x, y, 11, 0.2);
          }
          break;
        case 'dots':
        default:
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, TAU);
          ctx.fill();
          break;
      }
    }
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Wax seal: embossed heart used both as colour map and bump map. */
export function makeSealTextures(wax: string): { color: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const size = 256;
  const make = (bump: boolean) => {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = bump ? '#808080' : wax;
    ctx.fillRect(0, 0, size, size);
    // raised rim
    ctx.strokeStyle = bump ? '#d8d8d8' : 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.4, 0, TAU);
    ctx.stroke();
    // heart
    ctx.fillStyle = bump ? '#ffffff' : 'rgba(255,255,255,0.32)';
    heart(ctx, size / 2, size / 2 + 4, 118, 0);
    const tex = new THREE.CanvasTexture(c);
    if (!bump) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };
  return { color: make(false), bump: make(true) };
}

export type LetterCanvas = {
  texture: THREE.CanvasTexture;
  /** Draw the letter with the first `chars` characters of the message written in. */
  render: (chars: number) => void;
  total: number;
};

export type LetterCanvasOptions = {
  paper: string;
  ink: string;
  accent: string;
  fontFamily: string;
  text: string;
};

/**
 * The sheet itself, folded in thirds. Paper and creases are drawn once; only the
 * handwriting is redrawn as it "writes", so texture uploads stay small.
 */
export function makeLetterCanvas(o: LetterCanvasOptions): LetterCanvas {
  const W = 768;
  const H = 1014;
  const base = document.createElement('canvas');
  base.width = W;
  base.height = H;
  const b = base.getContext('2d')!;
  drawPaperBase(b, W, H, o.paper, 2200);

  // Border with corner flourishes
  b.strokeStyle = o.accent;
  b.globalAlpha = 0.55;
  b.lineWidth = 3;
  b.strokeRect(34, 34, W - 68, H - 68);
  b.lineWidth = 1.2;
  b.strokeRect(44, 44, W - 88, H - 88);
  b.globalAlpha = 1;
  b.fillStyle = o.accent;
  b.globalAlpha = 0.85;
  heart(b, W / 2, 96, 34, 0);
  b.globalAlpha = 1;

  // Fold creases in thirds: a soft dark line with a light edge.
  for (const y of [H / 3, (2 * H) / 3]) {
    const g = b.createLinearGradient(0, y - 22, 0, y + 22);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.48, 'rgba(60,40,20,0.14)');
    g.addColorStop(0.52, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    b.fillStyle = g;
    b.fillRect(0, y - 22, W, 44);
  }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const fontPx = 46;
  const lineH = 66;
  const left = 92;
  const maxW = W - left * 2;
  ctx.font = `${fontPx}px ${o.fontFamily}`;

  // Wrap once, keeping paragraph breaks.
  const lines: string[] = [];
  for (const para of o.text.split('\n')) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  const total = lines.reduce((n, l) => n + l.length, 0);
  const startY = 190;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const render = (chars: number) => {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(base, 0, 0);
    ctx.font = `${fontPx}px ${o.fontFamily}`;
    ctx.fillStyle = o.ink;
    ctx.textBaseline = 'alphabetic';
    let left0 = chars;
    lines.forEach((line, i) => {
      if (left0 <= 0) return;
      const part = line.slice(0, left0);
      left0 -= line.length;
      // A hair of wobble per line so it reads as handwriting, not print.
      ctx.save();
      ctx.translate(left, startY + i * lineH);
      ctx.rotate(((i % 5) - 2) * 0.0025);
      ctx.fillText(part, 0, 0);
      ctx.restore();
    });
    texture.needsUpdate = true;
  };
  render(0);
  return { texture, render, total };
}
