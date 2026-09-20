import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { chunkRevealWords } from './chunkRevealWords';

describe('chunkRevealWords', () => {
  it('splits You are so special into four words', () => {
    assert.deepEqual(chunkRevealWords('You are so special.', 4), [
      'You',
      'are',
      'so',
      'special',
    ]);
  });

  it('groups longer lines into count buckets', () => {
    const parts = chunkRevealWords('You light up every room today', 4);
    assert.equal(parts.length, 4);
    assert.equal(parts.join(' '), 'You light up every room today');
  });
});
