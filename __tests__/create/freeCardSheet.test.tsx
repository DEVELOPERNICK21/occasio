import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useCreateShareLink } from '../../src/features/create/application/useCreateShareLink';
import { FreeCardSheet } from '../../src/features/create/ui/components/FreeCardSheet';
import { CreationApiError } from '../../src/features/create/data/types';
import { SHEET_ACTION_DELAY_MS } from '../../src/shared/ui/ActionSheet';
import type { CreationDraft } from '../../src/features/create/domain/types';

jest.mock('../../src/shared/platform/haptics', () => ({
  triggerTabHaptic: jest.fn(),
  triggerCardHaptic: jest.fn(),
  triggerSuccessHaptic: jest.fn(),
}));

// The real provider (and AuthError) pull in storage, Firebase and Google Sign-In native code;
// the sheet only needs this one check, so a look-alike error stands in for AuthError.
jest.mock('../../src/features/auth/application/AuthProvider', () => ({
  isAuthError: (error: unknown) => error instanceof Error && error.name === 'AuthError',
}));

class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

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

describe('useCreateShareLink when the free card needs Google or Apple', () => {
  beforeEach(() => mockCreate.mockReset());

  it('asks for Google or Apple, and does not show the paywall', async () => {
    mockCreate.mockRejectedValue(new CreationApiError('FREE_CARD_NEEDS_PROVIDER', 'Use Google or Apple'));
    const hook = await runHook();

    await act(async () => {
      await hook().generate(draft);
    });

    expect(hook().freeCardBlocked).toBe('needs_provider');
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
    expect(hook().freeCardBlocked).toBe('not_allowed');
    expect(hook().paywallRequired).toBe(false);
  });

  it('still shows the paywall when the free card is simply used up', async () => {
    mockCreate.mockRejectedValue(new CreationApiError('QUOTA_EXCEEDED', 'No cards left'));
    const hook = await runHook();
    await act(async () => {
      await hook().generate(draft);
    });
    expect(hook().paywallRequired).toBe(true);
    expect(hook().freeCardBlocked).toBeNull();
  });

  it('forgets the request once reset, so a second try starts clean', async () => {
    mockCreate.mockRejectedValueOnce(new CreationApiError('FREE_CARD_NEEDS_PROVIDER', 'Use Google or Apple'));
    mockCreate.mockResolvedValueOnce({ shareSlug: 's', shareUrl: 'u', expiresAt: 'e', creationId: 'c' });
    const hook = await runHook();

    await act(async () => {
      await hook().generate(draft);
    });
    expect(hook().freeCardBlocked).toBe('needs_provider');

    await act(async () => hook().reset());
    expect(hook().freeCardBlocked).toBeNull();

    await act(async () => {
      await hook().generate(draft);
    });
    expect(hook().freeCardBlocked).toBeNull();
    expect(hook().result).not.toBeNull();
  });
});

describe('FreeCardSheet', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  type Overrides = Partial<React.ComponentProps<typeof FreeCardSheet>>;
  async function render(overrides: Overrides = {}) {
    const props = {
      reason: 'needs_provider' as const,
      canSignInWithApple: true,
      signInGoogle: jest.fn(async () => undefined),
      signInApple: jest.fn(async () => undefined),
      onSeePlans: jest.fn(),
      onSignedIn: jest.fn(),
      onClose: jest.fn(),
      ...overrides,
    };
    let renderer!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(<FreeCardSheet {...props} />);
    });
    return { renderer, props };
  }
  const text = (r: TestRenderer.ReactTestRenderer) => JSON.stringify(r.toJSON());
  const find = (r: TestRenderer.ReactTestRenderer, label: RegExp) =>
    r.root.findAll((n) => typeof n.props.onPress === 'function' && label.test(String(n.props.accessibilityLabel)));
  const press = (r: TestRenderer.ReactTestRenderer, label: RegExp) => find(r, label)[0]!;
  const settle = async () => {
    await act(async () => {
      jest.advanceTimersByTime(SHEET_ACTION_DELAY_MS + 50);
    });
  };

  it('says the free card is waiting and offers Google, Apple and the plans', async () => {
    const { renderer } = await render();
    expect(text(renderer)).toContain('Your free card is waiting');
    expect(find(renderer, /Continue with Google/)).toHaveLength(1);
    expect(find(renderer, /Continue with Apple/)).toHaveLength(1);
    expect(find(renderer, /See plans/)).toHaveLength(1);
  });

  it('leaves Apple out where it cannot be used', async () => {
    const { renderer } = await render({ canSignInWithApple: false });
    expect(find(renderer, /Continue with Apple/)).toHaveLength(0);
  });

  it('carries on to create the link as soon as Google signs them in', async () => {
    const { renderer, props } = await render();
    await act(async () => press(renderer, /Continue with Google/).props.onPress());
    await settle();
    expect(props.signInGoogle).toHaveBeenCalledTimes(1);
    expect(props.onSignedIn).toHaveBeenCalledTimes(1);
  });

  it('uses Apple when that is the one they pick', async () => {
    const { renderer, props } = await render();
    await act(async () => press(renderer, /Continue with Apple/).props.onPress());
    await settle();
    expect(props.signInApple).toHaveBeenCalledTimes(1);
    expect(props.signInGoogle).not.toHaveBeenCalled();
    expect(props.onSignedIn).toHaveBeenCalledTimes(1);
  });

  it('comes back quietly when they back out of the Google screen', async () => {
    const signInGoogle = jest.fn(async () => {
      throw new AuthError('CANCELLED', 'Sign-in was cancelled.');
    });
    const { renderer, props } = await render({ signInGoogle });
    await act(async () => press(renderer, /Continue with Google/).props.onPress());
    await settle();
    expect(props.onSignedIn).not.toHaveBeenCalled();
    expect(text(renderer)).not.toContain('cancelled');
    expect(text(renderer)).toContain('Your free card is waiting');
  });

  it('says what went wrong when sign-in fails, and does not create the link', async () => {
    const signInGoogle = jest.fn(async () => {
      throw new AuthError('NETWORK', 'No connection. Try again.');
    });
    const { renderer, props } = await render({ signInGoogle });
    await act(async () => press(renderer, /Continue with Google/).props.onPress());
    await settle();
    expect(props.onSignedIn).not.toHaveBeenCalled();
    expect(text(renderer)).toContain('No connection. Try again.');
  });

  it('opens the plans from the sheet', async () => {
    const { renderer, props } = await render();
    await act(async () => press(renderer, /See plans/).props.onPress());
    await settle();
    expect(props.onSeePlans).toHaveBeenCalledTimes(1);
  });

  it('for a throwaway address, says so and offers only the plans', async () => {
    const { renderer } = await render({ reason: 'not_allowed' });
    expect(text(renderer)).toContain('Use a different email');
    expect(find(renderer, /Continue with Google/)).toHaveLength(0);
    expect(find(renderer, /See plans/)).toHaveLength(1);
  });

  it('shows nothing while nothing is being asked', async () => {
    const { renderer } = await render({ reason: null });
    expect(renderer.toJSON()).toBeNull();
  });
});
