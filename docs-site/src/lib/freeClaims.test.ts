import { decideCreateAllowance, freeClaimId } from './cardAllowance';
import {
  applyFreeRules,
  eligibilityRefusal,
  freeClaimIds,
  freeEligibility,
  heldBackRefusal,
  isDisposableEmail,
  type FreeIdentity,
} from './freeClaims';

const verified = (overrides: Partial<FreeIdentity> = {}): FreeIdentity => ({
  email: 'priya@gmail.com',
  verified: true,
  subjects: [],
  ...overrides,
});

describe('freeEligibility', () => {
  it('lets a Google or Apple identity have the free card', () => {
    expect(freeEligibility(verified())).toEqual({ ok: true });
    expect(freeEligibility(verified({ email: 'abc123@privaterelay.appleid.com', subjects: ['apple.com:000.x'] }))).toEqual({ ok: true });
  });

  it('refuses an email and password account: anyone can make those, confirmed or not', () => {
    expect(freeEligibility({ email: null, verified: false, subjects: [] })).toEqual({
      ok: false,
      reason: 'needs_provider',
    });
  });

  it('refuses a Google account that sits on a throwaway address', () => {
    expect(freeEligibility(verified({ email: 'x@mailinator.com' }))).toEqual({
      ok: false,
      reason: 'disposable',
    });
  });

  it('asks for Google or Apple before looking at the address', () => {
    expect(freeEligibility({ email: 'x@mailinator.com', verified: false, subjects: [] })).toEqual({
      ok: false,
      reason: 'needs_provider',
    });
  });
});

describe('isDisposableEmail', () => {
  it('spots throwaway providers however they are written', () => {
    expect(isDisposableEmail('a@mailinator.com')).toBe(true);
    expect(isDisposableEmail('A@YOPMAIL.COM')).toBe(true);
    expect(isDisposableEmail('a@mail.guerrillamail.com')).toBe(true);
    expect(isDisposableEmail('  a@temp-mail.org  ')).toBe(true);
  });

  it('leaves ordinary and private-relay addresses alone', () => {
    for (const email of ['a@gmail.com', 'a@outlook.com', 'a@icloud.com', 'a@privaterelay.appleid.com', 'a@company.co.in']) {
      expect(isDisposableEmail(email)).toBe(false);
    }
  });

  it('does not match a lookalike that merely contains the name', () => {
    expect(isDisposableEmail('a@notmailinator.com')).toBe(false);
    expect(isDisposableEmail('a@mailinator.com.example.org')).toBe(false);
  });

  it('copes with missing or malformed input', () => {
    expect(isDisposableEmail(null)).toBe(false);
    expect(isDisposableEmail('')).toBe(false);
    expect(isDisposableEmail('no-at-sign')).toBe(false);
  });
});

describe('freeClaimIds', () => {
  it('holds one claim for the inbox, however it is spelled', () => {
    const a = freeClaimIds(verified({ email: 'Priya.Sharma+cards@Gmail.com' }));
    const b = freeClaimIds(verified({ email: 'priyasharma@googlemail.com' }));
    expect(a).toEqual(b);
    expect(a).toEqual([freeClaimId('priyasharma@gmail.com')]);
  });

  it('adds a claim for each Google or Apple id, so a changed email does not give a second card', () => {
    const first = freeClaimIds(verified({ email: 'old@gmail.com', subjects: ['google.com:555'] }));
    const second = freeClaimIds(verified({ email: 'new@gmail.com', subjects: ['google.com:555'] }));
    expect(first).toHaveLength(2);
    // They share the Google id's claim, so the second sign-in finds the first one's.
    expect(first.filter((id) => second.includes(id))).toHaveLength(1);
  });

  it('keeps an Apple id and a Google id with the same digits apart', () => {
    const [google] = freeClaimIds({ email: null, verified: true, subjects: ['google.com:42'] });
    const [apple] = freeClaimIds({ email: null, verified: true, subjects: ['apple.com:42'] });
    expect(google).not.toBe(apple);
  });

  it('never exposes the address or the id it came from', () => {
    for (const id of freeClaimIds(verified({ subjects: ['apple.com:secret-sub-id'] }))) {
      expect(id).toMatch(/^[0-9a-f]{64}$/);
      expect(id).not.toContain('priya');
      expect(id).not.toContain('secret');
    }
  });

  it('is empty for an identity with nothing to hold a claim on', () => {
    expect(freeClaimIds({ email: null, verified: false, subjects: [] })).toEqual([]);
    expect(freeClaimIds({ email: null, verified: true, subjects: ['  '] })).toEqual([]);
  });
});

describe('eligibilityRefusal', () => {
  it('uses codes the app can act on, and says what to do', () => {
    const needsProvider = eligibilityRefusal('needs_provider');
    expect([needsProvider.status, needsProvider.code]).toEqual([403, 'FREE_CARD_NEEDS_PROVIDER']);
    expect(needsProvider.message).toMatch(/Google or Apple/);

    const disposable = eligibilityRefusal('disposable');
    expect([disposable.status, disposable.code]).toEqual([403, 'EMAIL_NOT_ALLOWED']);
    expect(disposable.message).toMatch(/Google or Apple/);
  });
});

/**
 * The scenarios behind the free card, end to end through the same two functions the server
 * runs: what the account is allowed to do, given who it is and what was already claimed.
 */
describe('heldBackRefusal', () => {
  it('asks an email account to sign in with Google or Apple, which is also the answer if the plan lookup fails', () => {
    const unverified = freeEligibility({ email: 'a@x.com', verified: false, subjects: [] });
    expect(heldBackRefusal(true, unverified)?.code).toBe('FREE_CARD_NEEDS_PROVIDER');
  });

  it('names a throwaway address as not allowed', () => {
    const throwaway = freeEligibility(verified({ email: 'a@mailinator.com' }));
    expect(heldBackRefusal(true, throwaway)?.code).toBe('EMAIL_NOT_ALLOWED');
  });

  it('says nothing when no free card is waiting or the account is fine', () => {
    const unverified = freeEligibility({ email: 'a@x.com', verified: false, subjects: [] });
    expect(heldBackRefusal(false, unverified)).toBeNull();
    expect(heldBackRefusal(true, { ok: true })).toBeNull();
  });
});

describe('the free card, by scenario', () => {
  const NOW = Date.parse('2026-10-14T00:00:00Z');
  const none = { proActive: false, creditsPurchased: 0 };
  const proPlan = { proActive: true, creditsPurchased: 0 };

  function outcome(options: {
    doc?: Record<string, unknown>;
    identity: FreeIdentity;
    claimedElsewhere?: boolean;
    billing?: typeof none | null;
  }) {
    const eligibility = freeEligibility(options.identity);
    const { seen, freeHeldBack } = applyFreeRules(
      options.doc ?? {},
      eligibility,
      options.claimedElsewhere ?? false,
    );
    return {
      allowance: decideCreateAllowance(seen, NOW, options.billing === undefined ? null : options.billing),
      freeHeldBack,
    };
  }

  const google = verified({ email: 'maya@gmail.com', subjects: ['google.com:1'] });
  const apple = verified({ email: 'x1@privaterelay.appleid.com', subjects: ['apple.com:9'] });
  const emailAccount: FreeIdentity = { email: null, verified: false, subjects: [] };

  it('a first-time Google or Apple user gets the free card', () => {
    expect(outcome({ identity: google }).allowance).toBe('free');
    expect(outcome({ identity: apple }).allowance).toBe('free');
  });

  it('the same person after deleting their account and coming back gets nothing free', () => {
    // A new account has fresh counters, but the claim from the first one is still there.
    const back = outcome({ identity: google, claimedElsewhere: true });
    expect(back.allowance).toBe('needs_billing');
    expect(outcome({ identity: google, claimedElsewhere: true, billing: none }).allowance).toBe('none');
  });

  it('a made-up email and password gets no free card, however many are made', () => {
    for (let i = 0; i < 5; i += 1) {
      const attempt = outcome({ identity: emailAccount });
      expect(attempt.allowance).toBe('needs_billing');
      expect(attempt.freeHeldBack).toBe(true);
    }
    expect(outcome({ identity: emailAccount, billing: none })).toEqual({ allowance: 'none', freeHeldBack: true });
  });

  it('a confirmed email and password account still gets no free card: any inbox can be confirmed', () => {
    // The server only sees "no Google or Apple", whether or not the inbox was confirmed.
    const confirmedInbox: FreeIdentity = { email: 'real.person@outlook.com', verified: false, subjects: [] };
    expect(outcome({ identity: confirmedInbox, billing: none })).toEqual({ allowance: 'none', freeHeldBack: true });
  });

  it('the free card is spent once per Google or Apple account', () => {
    expect(outcome({ identity: google }).allowance).toBe('free');
    expect(outcome({ identity: google, doc: { freeCardsUsed: 1 } }).allowance).toBe('needs_billing');
  });

  it('a Google account on a throwaway address is refused', () => {
    const throwaway = verified({ email: 'abc@mailinator.com' });
    expect(outcome({ identity: throwaway, billing: none })).toEqual({ allowance: 'none', freeHeldBack: true });
  });

  it('paying never needs Google or Apple: Pro and single wishes work for anyone', () => {
    expect(outcome({ identity: emailAccount, billing: proPlan }).allowance).toBe('pro');
    expect(
      outcome({ identity: emailAccount, billing: { proActive: false, creditsPurchased: 1 } }).allowance,
    ).toBe('credit');
  });

  it('an email account that already used its free card is simply asked to pay, not to sign in with Google', () => {
    const used = outcome({ identity: emailAccount, doc: { freeCardsUsed: 1 }, billing: none });
    expect(used).toEqual({ allowance: 'none', freeHeldBack: false });
  });

  it('a second door for the same person is shut: another inbox that shares a Google or Apple id', () => {
    // Different email, same Google account: the Google id's claim is already held.
    const sameGoogle = verified({ email: 'other@gmail.com', subjects: ['google.com:1'] });
    expect(outcome({ identity: sameGoogle, claimedElsewhere: true }).allowance).toBe('needs_billing');
  });
});
