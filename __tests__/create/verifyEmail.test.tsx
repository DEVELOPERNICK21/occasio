import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useCreateShareLink } from '../../src/features/create/application/useCreateShareLink';
import { VerifyEmailSheet } from '../../src/features/create/ui/components/VerifyEmailSheet';
import { CreationApiError } from '../../src/features/create/data/types';
import { SHEET_ACTION_DELAY_MS } from '../../src/shared/ui/ActionSheet';
import type { CreationDraft } from '../../src/features/create/domain/types';

jest.mock('../../src/shared/platform/haptics', () => ({
  triggerTabHaptic: jest.fn(),
  triggerCardHaptic: jest.fn(),
  triggerSuccessHaptic: jest.fn(),
}));

const mockCreate = jest.fn();
jest.mock('../../src/features/create/data/creationRepository', () => ({
  createShareLink: (...args: unknown[]) => mockCreate(...args),
  updateShareLink: jest.fn(),
}));
jest.mock('../../src/features/create/data/photoRefs', () => ({
  resolveCreationMedia: async () => ({ photoRefs: [], mediaUrls: [] }),
}));
jest.mock('../../src/features/create/data/storageService', () => ({
  deleteUploadedPhotos: jest.fn(async () => undefined),
}));
jest.mock('../../src/features/create/domain/creationRules', () => ({
  ...jest.requireActual('../../src/features/create/domain/creationRules'),
  canGenerateShareLink: () => true,
  framePhotosShort: () => 0,
}));

const draft = { editingCreationId: null, photoUris: ['p'] } as unknown as CreationDraft;

async function runHook() {
  let latest!: ReturnType<typeof useCreateShareLink>;
  function Harness() {
    latest = useCreateShareLink({ cardsCreated: 0, tier: 'free' });
    return null;
  }
  await act(async () => {
    TestRenderer.create(<Harness />);
  });
  return () => latest;
}

describe('useCreateShareLink when the server wants a confirmed email', () => {
  beforeEach(() => mockCreate.mockReset());

  it('asks to confirm the email, and does not show the paywall', async () => {
    mockCreate.mockRejectedValue(new CreationApiError('EMAIL_NOT_VERIFIED', 'Confirm your email'));
    const hook = await runHook();

    await act(async () => {
      await hook().generate(draft);
    });

    expect(hook().verifyRequired).toBe('unverified');
    expect(hook().paywallRequired).toBe(false);
    expect(hook().error).toBeNull();
    expect(hook().isLoading).toBe(false);
  });

  it('says plainly when the address cannot be used, again without the paywall', async () => {
    mockCreate.mockRejectedValue(new CreationApiError('EMAIL_NOT_ALLOWED', 'No'));
    const hook = await runHook();
    await act(async () => {
      await hook().generate(draft);
    });
    expect(hook().verifyRequired).toBe('not_allowed');
    expect(hook().paywallRequired).toBe(false);
  });

  it('still shows the paywall when the free card is simply used up', async () => {
    mockCreate.mockRejectedValue(new CreationApiError('QUOTA_EXCEEDED', 'No cards left'));
    const hook = await runHook();
    await act(async () => {
      await hook().generate(draft);
    });
    expect(hook().paywallRequired).toBe(true);
    expect(hook().verifyRequired).toBeNull();
  });

  it('forgets the request once reset, so a second try starts clean', async () => {
    mockCreate.mockRejectedValueOnce(new CreationApiError('EMAIL_NOT_VERIFIED', 'Confirm'));
    mockCreate.mockResolvedValueOnce({ shareSlug: 's', shareUrl: 'u', expiresAt: 'e', creationId: 'c' });
    const hook = await runHook();

    await act(async () => {
      await hook().generate(draft);
    });
    expect(hook().verifyRequired).toBe('unverified');

    await act(async () => hook().reset());
    expect(hook().verifyRequired).toBeNull();

    await act(async () => {
      await hook().generate(draft);
    });
    expect(hook().verifyRequired).toBeNull();
    expect(hook().result).not.toBeNull();
  });
});

describe('VerifyEmailSheet', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  type Overrides = Partial<React.ComponentProps<typeof VerifyEmailSheet>>;
  async function render(overrides: Overrides = {}) {
    const props = {
      reason: 'unverified' as const,
      email: 'maya@example.com',
      sendVerification: jest.fn(async () => undefined),
      checkVerified: jest.fn(async () => false),
      onVerified: jest.fn(),
      onClose: jest.fn(),
      ...overrides,
    };
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<VerifyEmailSheet {...props} />);
    });
    return { renderer, props };
  }
  const text = (r: TestRenderer.ReactTestRenderer) => JSON.stringify(r.toJSON());
  const press = (r: TestRenderer.ReactTestRenderer, label: RegExp) =>
    r.root.find((n) => typeof n.props.onPress === 'function' && label.test(String(n.props.accessibilityLabel)));
  const settle = async () => {
    await act(async () => {
      jest.advanceTimersByTime(SHEET_ACTION_DELAY_MS + 50);
    });
  };

  it('names the address the link went to', async () => {
    const { renderer } = await render();
    expect(text(renderer)).toContain('Confirm your email');
    expect(text(renderer)).toContain('maya@example.com');
  });

  it('carries on to create the link as soon as the inbox is confirmed', async () => {
    const { renderer, props } = await render({ checkVerified: jest.fn(async () => true) });
    await act(async () => press(renderer, /^I confirmed it/).props.onPress());
    await settle();
    expect(props.checkVerified).toHaveBeenCalledTimes(1);
    expect(props.onVerified).toHaveBeenCalledTimes(1);
  });

  it('comes back with a plain note when it is not confirmed yet, and does not carry on', async () => {
    const { renderer, props } = await render({ checkVerified: jest.fn(async () => false) });
    await act(async () => press(renderer, /^I confirmed it/).props.onPress());
    await settle();
    expect(props.onVerified).not.toHaveBeenCalled();
    expect(text(renderer)).toMatch(/Not confirmed yet/);
  });

  it('shows why when the check itself fails, for example with no connection', async () => {
    const { renderer } = await render({
      checkVerified: jest.fn(async () => {
        throw new Error('Could not check right now.');
      }),
    });
    await act(async () => press(renderer, /^I confirmed it/).props.onPress());
    await settle();
    expect(text(renderer)).toContain('Could not check right now.');
  });

  it('sends the link again, then makes them wait before another', async () => {
    const { renderer, props } = await render();
    await act(async () => press(renderer, /^Send the link again/).props.onPress());
    await settle();
    expect(props.sendVerification).toHaveBeenCalledTimes(1);
    expect(text(renderer)).toMatch(/Sent\./);

    // A second press right away is turned down, with the wait shown.
    await act(async () => press(renderer, /^Send the link again/).props.onPress());
    await settle();
    expect(props.sendVerification).toHaveBeenCalledTimes(1);
    expect(text(renderer)).toMatch(/Please wait/);
  });

  it('can be dismissed with Not now, without carrying on', async () => {
    const { renderer, props } = await render();
    await act(async () => press(renderer, /^Not now$/).props.onPress());
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onVerified).not.toHaveBeenCalled();
  });

  it('tells someone with a throwaway address to use a different one, with no way to "confirm" it', async () => {
    const { renderer } = await render({ reason: 'not_allowed' });
    expect(text(renderer)).toContain('Use a different email');
    expect(text(renderer)).toMatch(/Google or Apple/);
    expect(text(renderer)).not.toContain('I confirmed it');
  });

  it('shows nothing when nothing is being asked', async () => {
    const { renderer } = await render({ reason: null });
    expect(renderer.toJSON()).toBeNull();
  });
});
