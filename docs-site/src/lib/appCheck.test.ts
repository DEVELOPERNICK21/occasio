import {
  appCheckDecision,
  appCheckMode,
  checkAppCheck,
  APP_CHECK_REFUSAL,
  type VerifyAppCheckToken,
} from './appCheck';

const request = (token?: string) =>
  new Request('https://example.com/api/v1/creations', {
    method: 'POST',
    headers: token === undefined ? {} : { 'X-Firebase-AppCheck': token },
  });

describe('appCheckMode', () => {
  it('defaults to log, so rolling it out cannot lock anyone out', () => {
    expect(appCheckMode(undefined)).toBe('log');
    expect(appCheckMode('')).toBe('log');
  });

  it('reads off and enforce, in any case', () => {
    expect(appCheckMode('off')).toBe('off');
    expect(appCheckMode(' ENFORCE ')).toBe('enforce');
  });

  it('treats a typo as log, not as off or enforce', () => {
    expect(appCheckMode('enforced')).toBe('log');
    expect(appCheckMode('true')).toBe('log');
  });
});

describe('appCheckDecision', () => {
  it('always lets a valid token through', () => {
    for (const mode of ['off', 'log', 'enforce'] as const) {
      expect(appCheckDecision(mode, 'valid').allow).toBe(true);
    }
  });

  it('logs every result while watching, so the share of real devices that pass can be seen', () => {
    expect(appCheckDecision('log', 'valid')).toEqual({ allow: true, log: true });
    expect(appCheckDecision('log', 'missing')).toEqual({ allow: true, log: true });
    expect(appCheckDecision('log', 'invalid')).toEqual({ allow: true, log: true });
  });

  it('once enforcing, stays quiet for valid tokens and logs the refusals', () => {
    expect(appCheckDecision('enforce', 'valid')).toEqual({ allow: true, log: false });
  });

  it('refuses a missing or invalid token only when enforcing', () => {
    expect(appCheckDecision('enforce', 'missing')).toEqual({ allow: false, log: true });
    expect(appCheckDecision('enforce', 'invalid')).toEqual({ allow: false, log: true });
  });

  it('does not look at anything when off', () => {
    expect(appCheckDecision('off', 'missing')).toEqual({ allow: true, log: false });
  });

  it('refuses with a code the app can show and a message that says what to do', () => {
    expect([APP_CHECK_REFUSAL.status, APP_CHECK_REFUSAL.code]).toEqual([403, 'APP_CHECK_FAILED']);
    expect(APP_CHECK_REFUSAL.message).toMatch(/update the app/i);
  });
});

describe('checkAppCheck', () => {
  it('is missing when the header is absent or blank, without calling Firebase', async () => {
    const verify = jest.fn<ReturnType<VerifyAppCheckToken>, Parameters<VerifyAppCheckToken>>();
    expect(await checkAppCheck(request(), verify)).toBe('missing');
    expect(await checkAppCheck(request('   '), verify)).toBe('missing');
    expect(verify).not.toHaveBeenCalled();
  });

  it('is valid when Firebase accepts the token, and passes it on untouched', async () => {
    const verify = jest.fn(async () => true);
    expect(await checkAppCheck(request(' abc.def.ghi '), verify)).toBe('valid');
    expect(verify).toHaveBeenCalledWith('abc.def.ghi');
  });

  it('is invalid when Firebase refuses the token', async () => {
    expect(await checkAppCheck(request('forged'), async () => false)).toBe('invalid');
  });

  it('refuses oversized junk without a network call', async () => {
    const verify = jest.fn(async () => true);
    expect(await checkAppCheck(request('a'.repeat(5000)), verify)).toBe('invalid');
    expect(verify).not.toHaveBeenCalled();
  });
});
