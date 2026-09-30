import assert from 'node:assert/strict';
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

  it('birthday gets the candle scene, then the hub, then the finale', () => {
    const r = resolveExperience({
      templateType: 'birthday',
      mediaUrls: ['https://x/a.jpg', 'https://x/b.jpg'],
      message: 'You are wonderful. Enjoy today.',
      recipientName: 'Aanya',
      experienceMode: null,
    });
    assert.equal(r.mode, 'story');
    assert.deepEqual(r.scenes, ['gate', 'lamp', 'balloons', 'candle', 'gift', 'hub', 'finale']);
    assert.ok(r.revealLine.length > 0);
  });

  it('thank_you skips the candle', () => {
    const r = resolveExperience({
      templateType: 'thank_you',
      mediaUrls: ['https://x/a.jpg'],
      message: 'Thank you for everything.',
      recipientName: 'Sam',
    });
    assert.equal(r.mode, 'story');
    assert.deepEqual(r.scenes, ['gate', 'lamp', 'balloons', 'gift', 'hub', 'finale']);
  });

  it('the hub is always present, so photos and reasons never change the scene order', () => {
    const base = { templateType: 'anniversary', message: 'Us.', recipientName: 'Sam' };
    const bare = resolveExperience({ ...base, mediaUrls: [] });
    const rich = resolveExperience({
      ...base,
      mediaUrls: ['https://x/a.jpg', '   '],
      reasons: ['You laugh at my jokes'],
    });
    assert.deepEqual(bare.scenes, rich.scenes);
    assert.ok(bare.scenes.includes('hub'));
  });

  it('just_because gets the joke contract, other moments do not', () => {
    const card = { mediaUrls: [], message: 'Hi.', recipientName: 'Sam' };
    assert.ok(resolveExperience({ ...card, templateType: 'just_because' }).scenes.includes('contract'));
    assert.ok(!resolveExperience({ ...card, templateType: 'birthday' }).scenes.includes('contract'));
  });

  it('always opens with the gate and closes on the finale', () => {
    const r = resolveExperience({
      templateType: 'congratulations',
      mediaUrls: [],
      message: 'Well done.',
      recipientName: 'Sam',
    });
    assert.equal(r.scenes[0], 'gate');
    assert.equal(r.scenes[r.scenes.length - 1], 'finale');
  });
});
