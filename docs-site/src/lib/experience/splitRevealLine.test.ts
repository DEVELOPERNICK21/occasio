import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_BALLOON_LINE,
  normalizeBalloonLine,
  splitRevealLine,
} from './splitRevealLine';

describe('splitRevealLine', () => {
  it('defaults to hardcoded short line', () => {
    assert.equal(splitRevealLine(null, 'Aanya'), DEFAULT_BALLOON_LINE);
    assert.equal(
      splitRevealLine('A very long personal letter that should not appear.', 'Sam'),
      DEFAULT_BALLOON_LINE,
    );
  });

  it('uses optional balloonLine when provided', () => {
    assert.equal(
      splitRevealLine(null, 'Sam', 'You make me smile'),
      'You make me smile',
    );
  });

  it('clamps balloonLine to 8 words', () => {
    const line = normalizeBalloonLine(
      'one two three four five six seven eight nine ten',
    );
    assert.equal(line, 'one two three four five six seven eight');
  });
});
