import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultExperienceMode, resolveExperience } from './resolveExperience';

describe('defaultExperienceMode', () => {
  it('story for birthday and anniversary', () => {
    assert.equal(defaultExperienceMode('birthday'), 'story');
    assert.equal(defaultExperienceMode('anniversary'), 'story');
  });

  it('classic for other occasions', () => {
    assert.equal(defaultExperienceMode('thank_you'), 'classic');
    assert.equal(defaultExperienceMode('just_because'), 'classic');
  });
});

describe('resolveExperience', () => {
  it('uses stored experienceMode when present', () => {
    const r = resolveExperience({
      templateType: 'birthday',
      mediaUrls: ['https://x/a.jpg'],
      message: 'Happy birthday love.',
      recipientName: 'Mom',
      experienceMode: 'classic',
    });
    assert.equal(r.mode, 'classic');
    assert.deepEqual(r.scenes, []);
  });

  it('birthday with photos gets full story pack', () => {
    const r = resolveExperience({
      templateType: 'birthday',
      mediaUrls: ['https://x/a.jpg', 'https://x/b.jpg'],
      message: 'You are wonderful. Enjoy today.',
      recipientName: 'Aanya',
      experienceMode: null,
    });
    assert.equal(r.mode, 'story');
    assert.deepEqual(r.scenes, [
      'balloons',
      'candle',
      'gift',
      'photo_deck',
      'envelope',
      'letter_write',
      'letter',
    ]);
    assert.ok(r.revealLine.length > 0);
  });

  it('birthday without photos skips photo_deck', () => {
    const r = resolveExperience({
      templateType: 'birthday',
      mediaUrls: [],
      message: 'Happy day.',
      recipientName: 'Sam',
    });
    assert.deepEqual(r.scenes, [
      'balloons',
      'candle',
      'gift',
      'envelope',
      'letter_write',
      'letter',
    ]);
  });

  it('filters blank media urls before deciding photo_deck', () => {
    const r = resolveExperience({
      templateType: 'anniversary',
      mediaUrls: ['', '  '],
      message: 'Still us.',
      recipientName: 'Alex',
    });
    assert.deepEqual(r.scenes, [
      'balloons',
      'candle',
      'gift',
      'envelope',
      'letter_write',
      'letter',
    ]);
  });
});
