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
  /** Draw the letter with the first `chars` characters written in. */
  render: (chars: number) => void;
  total: number;
};

export type LetterCanvasOptions = {
  paper: string;
  ink: string;
  accent: string;
  fontFamily: string;
  greeting: string;
  body: string;
  /** e.g. "With love,\nSam". Empty for an unsigned letter. */
  signoff: string;
  /** Optional photo, taped to the lower corner. */
  photo?: HTMLImageElement | null;
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
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
  return lines;
}

/**
 * The sheet itself, folded in thirds. Paper, creases and photo are drawn once;
 * only the handwriting is redrawn as it "writes", so texture uploads stay small.
 * The type size is the largest that fits the message, so short notes read big.
 */
export function makeLetterCanvas(o: LetterCanvasOptions): LetterCanvas {
  const W = 768;
  const H = 1014;
  const left = 88;
  const maxW = W - left * 2;
  const hasPhoto = Boolean(o.photo);

  // ── Static layer: paper, border, emblem, creases, photo
  const base = document.createElement('canvas');
  base.width = W;
  base.height = H;
  const b = base.getContext('2d')!;
  drawPaperBase(b, W, H, o.paper, 2200);

  b.strokeStyle = o.accent;
  b.globalAlpha = 0.5;
  b.lineWidth = 3;
  b.strokeRect(30, 30, W - 60, H - 60);
  b.lineWidth = 1.2;
  b.strokeRect(41, 41, W - 82, H - 82);
  b.globalAlpha = 1;
  // corner dots
  b.fillStyle = o.accent;
  for (const [x, y] of [
    [30, 30],
    [W - 30, 30],
    [30, H - 30],
    [W - 30, H - 30],
  ] as const) {
    b.beginPath();
    b.arc(x, y, 7, 0, TAU);
    b.fill();
  }
  b.globalAlpha = 0.9;
  heart(b, W / 2, 92, 38, 0);
  b.globalAlpha = 1;

  if (o.photo) {
    const fw = 214;
    const fh = 256;
    const fx = W - left - fw + 8;
    const fy = H - 96 - fh;
    b.save();
    b.translate(fx + fw / 2, fy + fh / 2);
    b.rotate(0.06);
    b.shadowColor = 'rgba(40,20,10,0.35)';
    b.shadowBlur = 16;
    b.shadowOffsetY = 6;
    b.fillStyle = '#FFFEFA';
    b.fillRect(-fw / 2, -fh / 2, fw, fh);
    b.shadowColor = 'transparent';
    const pw = fw - 24;
    const ph = fh - 60;
    const ir = o.photo.width / o.photo.height;
    let sw = o.photo.width;
    let sh = o.photo.height;
    let sx = 0;
    let sy = 0;
    if (ir > pw / ph) {
      sw = sh * (pw / ph);
      sx = (o.photo.width - sw) / 2;
    } else {
      sh = sw / (pw / ph);
      sy = (o.photo.height - sh) / 2;
    }
    b.drawImage(o.photo, sx, sy, sw, sh, -pw / 2, -fh / 2 + 12, pw, ph);
    // washi tape
    b.fillStyle = 'rgba(255,214,120,0.85)';
    b.save();
    b.translate(0, -fh / 2 + 4);
    b.rotate(-0.08);
    b.fillRect(-46, -14, 92, 28);
    b.restore();
    b.restore();
  }

  for (const y of [H / 3, (2 * H) / 3]) {
    const g = b.createLinearGradient(0, y - 24, 0, y + 24);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.48, 'rgba(60,40,20,0.13)');
    g.addColorStop(0.52, 'rgba(255,255,255,0.4)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    b.fillStyle = g;
    b.fillRect(0, y - 24, W, 48);
  }

  // ── Layout: pick the largest type size that fits
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const topY = 190;
  const bottomReserve = hasPhoto ? 330 : 150;
  const signLines = o.signoff ? o.signoff.split('\n') : [];
  const signH = signLines.length ? 150 : 0;
  const available = H - topY - bottomReserve - (hasPhoto ? 0 : signH);

  let size = 40;
  let bodyLines: string[] = [];
  let greetingLines: string[] = [];
  for (const candidate of [64, 60, 56, 52, 48, 44, 40, 36]) {
    ctx.font = `${candidate * 1.16}px ${o.fontFamily}`;
    const g = wrapText(ctx, o.greeting, maxW);
    ctx.font = `${candidate}px ${o.fontFamily}`;
    const bl = wrapText(ctx, o.body, maxW);
    const height = g.length * candidate * 1.5 + candidate * 0.5 + bl.length * candidate * 1.42;
    size = candidate;
    greetingLines = g;
    bodyLines = bl;
    if (height <= available) break;
  }
  const bodyLine = size * 1.42;
  const greetLine = size * 1.5;

  const total =
    greetingLines.reduce((n, l) => n + l.length, 0) +
    bodyLines.reduce((n, l) => n + l.length, 0) +
    signLines.reduce((n, l) => n + l.length, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const render = (chars: number) => {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(base, 0, 0);
    ctx.textBaseline = 'alphabetic';
    let remaining = chars;
    let pen: { x: number; y: number } | null = null;

    const write = (line: string, x: number, y: number, font: string, color: string, tilt: number) => {
      if (remaining <= 0) return;
      const part = line.slice(0, remaining);
      remaining -= line.length;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(tilt);
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.fillText(part, 0, 0);
      if (remaining <= 0) pen = { x: x + ctx.measureText(part).width * Math.cos(tilt), y: y - size * 0.32 };
      ctx.restore();
    };

    let y = topY;
    greetingLines.forEach((line, i) => {
      write(line, left, y, `${size * 1.16}px ${o.fontFamily}`, o.accent, ((i % 3) - 1) * 0.002);
      y += greetLine;
    });
    y += size * 0.2;
    bodyLines.forEach((line, i) => {
      write(line, left, y, `${size}px ${o.fontFamily}`, o.ink, ((i % 5) - 2) * 0.0025);
      y += bodyLine;
    });

    if (signLines.length) {
      const sy = hasPhoto ? H - 96 - 58 * (signLines.length - 1) - 20 : Math.max(y + size * 0.6, H - bottomReserve - 40);
      // Keep the sign-off clear of the photo: shrink it until it fits the free width.
      const signMaxW = hasPhoto ? W - left * 2 - 240 : maxW;
      const signFit = (line: string, px: number) => {
        let f = px;
        ctx.font = `${f}px ${o.fontFamily}`;
        while (ctx.measureText(line).width > signMaxW && f > 24) {
          f -= 2;
          ctx.font = `${f}px ${o.fontFamily}`;
        }
        return f;
      };
      signLines.forEach((line, i) => {
        const isName = i === signLines.length - 1 && signLines.length > 1;
        const px = signFit(line, isName ? size * 1.25 : size * 0.95);
        write(line, left, sy + i * size * 1.25, `${px}px ${o.fontFamily}`, isName ? o.accent : o.ink, -0.012);
      });
      // A flourish under the name once the whole letter is written.
      if (remaining <= 0 && signLines.length > 1) {
        const fy = sy + (signLines.length - 1) * size * 1.25 + 14;
        ctx.strokeStyle = o.accent;
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(left, fy);
        ctx.bezierCurveTo(left + 60, fy - 14, left + 110, fy + 12, left + 190, fy - 6);
        ctx.bezierCurveTo(left + 230, fy - 14, left + 260, fy + 4, left + 300, fy - 4);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // The pen: a small glowing ink dot at the end of what has been written so far.
    if (chars < total && pen) {
      const p = pen as { x: number; y: number };
      ctx.save();
      ctx.shadowColor = o.accent;
      ctx.shadowBlur = 14;
      ctx.fillStyle = o.accent;
      ctx.beginPath();
      ctx.arc(p.x + 8, p.y, 6, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    texture.needsUpdate = true;
  };
  render(0);
  return { texture, render, total };
}
