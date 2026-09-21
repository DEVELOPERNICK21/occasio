import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultExperienceMode, resolveExperience } from './resolveExperience';

describe('defaultExperienceMode', () => {
  it('story for all five create-flow moments', () => {
    assert.equal(defaultExperienceMode('birthday'), 'story');
    assert.equal(defaultExperienceMode('anniversary'), 'story');
    assert.equal(defaultExperienceMode('thank_you'), 'story');
    assert.equal(defaultExperienceMode('congratulations'), 'story');
    assert.equal(defaultExperienceMode('just_because'), 'story');
  });

  it('classic for unknown occasions', () => {
    assert.equal(defaultExperienceMode('sorry'), 'classic');
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

  it('birthday with photos gets full story pack including candle', () => {
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

  it('thank_you story skips candle', () => {
    const r = resolveExperience({
      templateType: 'thank_you',
      mediaUrls: ['https://x/a.jpg'],
      message: 'Thank you for everything.',
      recipientName: 'Sam',
    });
    assert.equal(r.mode, 'story');
    assert.deepEqual(r.scenes, [
      'balloons',
      'gift',
      'photo_deck',
      'envelope',
      'letter_write',
      'letter',
    ]);
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
