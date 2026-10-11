import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { songFor } from './occasionSongs';

const MOMENTS = ['birthday', 'anniversary', 'thank_you', 'congratulations', 'just_because'];

describe('songFor', () => {
  it('gives every story moment a real, looping song, not a one-second chime', () => {
    for (const moment of MOMENTS) {
      const song = songFor(moment);
      expect(song.file).toMatch(/\.mp3$/);
      expect(song.loop).toBe(true);
    }
  });

  it('only points at files that exist in public/sounds', () => {
    const files = new Set(readdirSync(join(__dirname, '../../../public/sounds')));
    for (const moment of [...MOMENTS, 'unknown']) {
      expect(files.has(songFor(moment).file.replace('/sounds/', ''))).toBe(true);
    }
  });

  it('keeps each moment on its own song where it has one', () => {
    expect(songFor('birthday').file).toBe('/sounds/balloons.mp3');
    expect(songFor('anniversary').file).toBe('/sounds/hearts.mp3');
    expect(songFor('thank_you').file).toBe('/sounds/sparkles.mp3');
  });
});
