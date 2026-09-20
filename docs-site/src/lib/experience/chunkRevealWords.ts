/** Split a reveal line into exactly `count` short phrases for balloon pops. */
export function chunkRevealWords(line: string, count: number): string[] {
  const cleaned = line.replace(/[.!?…]+$/u, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (count < 1) return [];

  if (words.length === 0) {
    return Array.from({ length: count }, () => '·');
  }

  if (words.length === count) {
    return words;
  }

  if (words.length > count) {
    const chunks: string[] = [];
    const base = Math.floor(words.length / count);
    let rem = words.length % count;
    let i = 0;
    for (let c = 0; c < count; c += 1) {
      const take = base + (rem > 0 ? 1 : 0);
      if (rem > 0) rem -= 1;
      chunks.push(words.slice(i, i + take).join(' '));
      i += take;
    }
    return chunks;
  }

  // Fewer words than balloons — repeat last softly / pad with heart words
  const pad = ['so', 'special', 'always', 'you'];
  const out = [...words];
  let p = 0;
  while (out.length < count) {
    out.push(pad[p % pad.length]!);
    p += 1;
  }
  return out.slice(0, count);
}
