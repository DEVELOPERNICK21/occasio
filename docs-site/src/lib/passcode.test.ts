import assert from 'node:assert/strict';
import { hashPasscode, newPasscodeSalt, verifyPasscode } from './passcode';
import { rateLimit, resetRateLimits } from './rateLimit';

describe('passcode', () => {
  it('verifies only the right four digits', () => {
    const salt = newPasscodeSalt();
    const hash = hashPasscode('1408', salt);
    assert.equal(verifyPasscode('1408', salt, hash), true);
    assert.equal(verifyPasscode('1409', salt, hash), false);
    assert.equal(verifyPasscode('14080', salt, hash), false);
    assert.equal(verifyPasscode('abcd', salt, hash), false);
  });

  it('never stores the code itself', () => {
    const salt = newPasscodeSalt();
    assert.doesNotMatch(hashPasscode('1408', salt), /1408/);
  });
});

describe('rateLimit', () => {
  it('blocks after the limit and recovers after the window', () => {
    resetRateLimits();
    assert.equal(rateLimit('k', 2, 1000, 0), true);
    assert.equal(rateLimit('k', 2, 1000, 10), true);
    assert.equal(rateLimit('k', 2, 1000, 20), false);
    assert.equal(rateLimit('k', 2, 1000, 1500), true);
  });
});
