import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { splitRevealLine } from './splitRevealLine';

describe('splitRevealLine', () => {
  it('uses first sentence when message is long enough', () => {
    const line = splitRevealLine(
      'You light up every room. Have the best day.',
      'Aanya',
    );
    assert.equal(line, 'You light up every room.');
  });

  it('falls back when message missing', () => {
    assert.equal(
      splitRevealLine(null, 'Aanya'),
      'You are so special, Aanya.',
    );
  });

  it('falls back when message too short', () => {
    assert.equal(splitRevealLine('Hi', 'Sam'), 'You are so special, Sam.');
  });

  it('truncates very long first sentence to ~80 chars at word boundary', () => {
    const long =
      'This is a very long birthday wish that goes on and on with many words so we must shorten it for balloons.';
    const line = splitRevealLine(long, 'Sam');
    assert.ok(line.length <= 80);
    assert.ok(!line.includes('balloons'));
  });
});
