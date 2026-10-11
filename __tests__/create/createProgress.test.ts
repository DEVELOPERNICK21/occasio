import {
  getCreateProgress,
  getCreateStep,
  type CreateProgressInput,
} from '../../src/features/create/domain/createProgress';

const base: CreateProgressInput = {
  stage: 'photos',
  isQuickCreate: false,
  photoCount: 0,
  hasRecipient: false,
  hasFrom: false,
  hasMessage: false,
};

describe('getCreateStep', () => {
  it('counts the "who" screen, so the full flow has six steps', () => {
    expect(getCreateStep('who', false)).toEqual({ current: 1, total: 6 });
    expect(getCreateStep('occasion', false)).toEqual({ current: 2, total: 6 });
    expect(getCreateStep('photos', false)).toEqual({ current: 3, total: 6 });
    expect(getCreateStep('frame', false)).toEqual({ current: 4, total: 6 });
    expect(getCreateStep('details', false)).toEqual({ current: 5, total: 6 });
    expect(getCreateStep('preview', false)).toEqual({ current: 6, total: 6 });
  });

  it('uses three steps for quick create and never leaves a gap', () => {
    expect(getCreateStep('photos', true)).toEqual({ current: 1, total: 3 });
    expect(getCreateStep('details', true)).toEqual({ current: 2, total: 3 });
    expect(getCreateStep('preview', true)).toEqual({ current: 3, total: 3 });
    expect(getCreateStep('frame', true)).toEqual({ current: 1, total: 3 });
  });
});

describe('getCreateProgress', () => {
  it('starts at zero on the first screen', () => {
    const progress = getCreateProgress({ ...base, stage: 'who' });
    expect(progress.fraction).toBe(0);
    expect(progress.percent).toBe(0);
    expect(progress.stages.map((s) => s.state)).toEqual([
      'current',
      'todo',
      'todo',
      'todo',
      'todo',
      'todo',
    ]);
  });

  it('marks earlier screens done and later ones to do', () => {
    const progress = getCreateProgress({ ...base, stage: 'frame' });
    expect(progress.stages.map((s) => s.state)).toEqual([
      'done',
      'done',
      'done',
      'current',
      'todo',
      'todo',
    ]);
    expect(progress.stageLabel).toBe('Frame');
  });

  it('moves the bar as photos are added, before leaving the screen', () => {
    const none = getCreateProgress({ ...base, photoCount: 0 }).fraction;
    const one = getCreateProgress({ ...base, photoCount: 1 }).fraction;
    const three = getCreateProgress({ ...base, photoCount: 3 }).fraction;
    expect(one).toBeGreaterThan(none);
    expect(three).toBeGreaterThan(one);
    // A full photo screen still stops short of the next screen.
    expect(three).toBeLessThanOrEqual(getCreateProgress({ ...base, stage: 'frame' }).fraction);
  });

  it('moves the bar as the words are filled in', () => {
    const details = { ...base, stage: 'details' as const };
    const empty = getCreateProgress(details).fraction;
    const named = getCreateProgress({ ...details, hasRecipient: true }).fraction;
    const written = getCreateProgress({
      ...details,
      hasRecipient: true,
      hasMessage: true,
      hasFrom: true,
    }).fraction;
    expect(named).toBeGreaterThan(empty);
    expect(written).toBeGreaterThan(named);
    expect(written).toBeLessThan(getCreateProgress({ ...base, stage: 'preview' }).fraction + 1e-9);
  });

  it('never reaches 100% before the link is made', () => {
    const preview = getCreateProgress({ ...base, stage: 'preview', photoCount: 5 });
    expect(preview.fraction).toBeLessThan(1);
    expect(preview.timeLeft).toBe('One tap to share');
  });

  it('shortens the estimate as the person gets further in', () => {
    const early = getCreateProgress({ ...base, stage: 'who' }).timeLeft;
    const late = getCreateProgress({ ...base, stage: 'details', hasRecipient: true, hasMessage: true }).timeLeft;
    expect(early).toMatch(/minutes left$/);
    expect(late).toBe('Under 30 seconds left');
  });

  it('says what to do next in plain words, with no hype or emoji', () => {
    const stages = ['who', 'occasion', 'photos', 'frame', 'details', 'preview'] as const;
    for (const stage of stages) {
      for (const photoCount of [0, 1, 3, 5]) {
        const { nudge } = getCreateProgress({ ...base, stage, photoCount });
        expect(nudge.length).toBeGreaterThan(10);
        expect(nudge).not.toMatch(/!|amazing|awesome|incredible|\p{Extended_Pictographic}/u);
      }
    }
  });

  it('reacts to what has been filled in on the words screen', () => {
    const details = { ...base, stage: 'details' as const };
    expect(getCreateProgress(details).nudge).toMatch(/name/i);
    expect(getCreateProgress({ ...details, hasRecipient: true }).nudge).toMatch(/words/i);
    expect(
      getCreateProgress({ ...details, hasRecipient: true, hasMessage: true }).nudge,
    ).toMatch(/preview/i);
  });

  it('encourages adding photos by what they open up', () => {
    expect(getCreateProgress({ ...base, photoCount: 0 }).nudge).toMatch(/one photo/i);
    expect(getCreateProgress({ ...base, photoCount: 1 }).nudge).toMatch(/more frames/i);
  });
});
