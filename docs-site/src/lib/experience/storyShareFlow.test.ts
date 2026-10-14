import { shareStoryFrame, type StoryShareDeps } from './storyShareFlow';

const file = { name: 'occasio-story.png' } as File;
const caption = 'Someone made me a birthday surprise. Make one for your person: https://x.test/?ref=abc';

function deps(overrides: Partial<StoryShareDeps> = {}): StoryShareDeps & { save: jest.Mock } {
  return {
    canShare: () => true,
    share: jest.fn(async () => undefined),
    save: jest.fn(),
    copy: jest.fn(async () => undefined),
    ...overrides,
  } as StoryShareDeps & { save: jest.Mock };
}

const abort = () => Object.assign(new Error('cancelled'), { name: 'AbortError' });

describe('shareStoryFrame', () => {
  it('opens the share sheet with the picture and the caption, and copies the caption too', async () => {
    const d = deps();
    const outcome = await shareStoryFrame(file, caption, d);
    expect(d.share).toHaveBeenCalledWith({ files: [file], text: caption });
    expect(d.copy).toHaveBeenCalledWith(caption);
    expect(d.save).not.toHaveBeenCalled();
    expect(outcome).toEqual({ kind: 'shared', captionCopied: true });
  });

  it('opens the share sheet without waiting for the clipboard', async () => {
    let release!: () => void;
    const slowCopy = jest.fn(() => new Promise<void>((resolve) => (release = resolve)));
    const share = jest.fn(async () => undefined);
    const pending = shareStoryFrame(file, caption, deps({ copy: slowCopy, share }));
    await Promise.resolve();
    expect(share).toHaveBeenCalledTimes(1);
    release();
    await pending;
  });

  it('is quiet when they back out of the share sheet: nothing is saved, nothing is claimed', async () => {
    const d = deps({ share: jest.fn(async () => Promise.reject(abort())) });
    const outcome = await shareStoryFrame(file, caption, d);
    expect(outcome.kind).toBe('cancelled');
    expect(d.save).not.toHaveBeenCalled();
  });

  it('saves the picture when the browser cannot share files', async () => {
    const d = deps({ canShare: () => false });
    const outcome = await shareStoryFrame(file, caption, d);
    expect(d.share).not.toHaveBeenCalled();
    expect(d.save).toHaveBeenCalledWith(file);
    expect(outcome).toEqual({ kind: 'saved', captionCopied: true });
  });

  it('saves the picture when there is no share function at all (a desktop browser)', async () => {
    const d = deps({ share: undefined, canShare: undefined });
    expect((await shareStoryFrame(file, caption, d)).kind).toBe('saved');
    expect(d.save).toHaveBeenCalledTimes(1);
  });

  it('saves the picture when sharing fails for any other reason', async () => {
    const d = deps({ share: jest.fn(async () => Promise.reject(new Error('NotAllowedError'))) });
    const outcome = await shareStoryFrame(file, caption, d);
    expect(outcome.kind).toBe('saved');
    expect(d.save).toHaveBeenCalledWith(file);
  });

  it('does not claim the caption was copied when the clipboard is missing or refuses', async () => {
    expect((await shareStoryFrame(file, caption, deps({ copy: undefined }))).captionCopied).toBe(false);
    const refuse = deps({ copy: jest.fn(async () => Promise.reject(new Error('denied'))) });
    const outcome = await shareStoryFrame(file, caption, refuse);
    expect(outcome).toEqual({ kind: 'shared', captionCopied: false });
  });
});
