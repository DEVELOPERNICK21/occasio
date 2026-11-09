import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import {
  BillingError,
  billingErrorFromSdk,
} from '../../src/features/billing/data/billingErrors';
import {
  BILLING_ACTION_LABEL,
  describeBillingNotice,
  plansUnavailableNotice,
  storeName,
  type BillingErrorCode,
} from '../../src/features/billing/domain/billingNotice';
import { NoticeCard } from '../../src/shared/ui/NoticeCard';

const ALL_CODES: BillingErrorCode[] = [
  'NOT_CONFIGURED',
  'CANCELLED',
  'NETWORK',
  'STORE',
  'INTERNAL',
  'PENDING',
  'NOT_ALLOWED',
  'PAYMENT_PROBLEM',
  'UNAVAILABLE',
  'ALREADY_OWNED',
  'OTHER_ACCOUNT',
  'BUSY',
  'INELIGIBLE',
  'NOTHING_TO_RESTORE',
];

describe('billingErrorFromSdk', () => {
  it('reads a pending payment, error 20, as pending and not as a failure', () => {
    const sdk = { code: '20', message: 'The payment is pending.', readableErrorCode: 'PAYMENT_PENDING_ERROR' };
    expect(billingErrorFromSdk(sdk).code).toBe('PENDING');
    expect(billingErrorFromSdk({ code: 20 }).code).toBe('PENDING');
    expect(billingErrorFromSdk({ readableErrorCode: 'PAYMENT_PENDING_ERROR' }).code).toBe('PENDING');
  });

  it('maps the other codes a purchase can end with', () => {
    const code = (value: string) => billingErrorFromSdk({ code: value }).code;
    expect(code('1')).toBe('CANCELLED');
    expect(code('2')).toBe('STORE');
    expect(code('3')).toBe('NOT_ALLOWED');
    expect(code('4')).toBe('PAYMENT_PROBLEM');
    expect(code('5')).toBe('UNAVAILABLE');
    expect(code('6')).toBe('ALREADY_OWNED');
    expect(code('7')).toBe('OTHER_ACCOUNT');
    expect(code('13')).toBe('OTHER_ACCOUNT');
    expect(code('10')).toBe('NETWORK');
    expect(code('35')).toBe('NETWORK');
    expect(code('15')).toBe('BUSY');
    expect(code('18')).toBe('INELIGIBLE');
    expect(code('32')).toBe('STORE');
  });

  it('treats a cancel the person chose as a cancel, however it is reported', () => {
    expect(billingErrorFromSdk({ userCancelled: true }).code).toBe('CANCELLED');
    expect(billingErrorFromSdk({ code: '1' }).code).toBe('CANCELLED');
  });

  it('falls back to a general problem for anything it does not know', () => {
    expect(billingErrorFromSdk({ code: '999' }).code).toBe('INTERNAL');
    expect(billingErrorFromSdk(new Error('boom')).code).toBe('INTERNAL');
    expect(billingErrorFromSdk('nope').code).toBe('INTERNAL');
    expect(billingErrorFromSdk(null).code).toBe('INTERNAL');
  });

  it('hands back an error it already made', () => {
    const own = new BillingError('NETWORK', 'offline');
    expect(billingErrorFromSdk(own)).toBe(own);
  });
});

describe('describeBillingNotice', () => {
  it.each(ALL_CODES)('says something plain and specific for %s', (code) => {
    for (const platform of ['android', 'ios', 'other'] as const) {
      const notice = describeBillingNotice(code, { platform });
      expect(notice.title.length).toBeGreaterThan(3);
      expect(notice.message.length).toBeGreaterThan(15);
      const words = `${notice.title} ${notice.message}`;
      // No SDK jargon or numbers, no hype, no emoji (the project's copy rules).
      expect(words).not.toMatch(/error\s*\d|code\s*\d|revenuecat|_ERROR|undefined|\[object/i);
      expect(words).not.toContain('!');
      expect(words).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it('explains a pending payment for each thing that can be bought', () => {
    const pro = describeBillingNotice('PENDING', { platform: 'android', subject: 'pro' });
    expect(pro.tone).toBe('pending');
    expect(pro.title).toBe('Your payment is pending');
    expect(pro.message).toContain('Google Play is still confirming your payment');
    expect(pro.message).toContain('Occasio Pro switches on by itself');
    expect(pro.action).toBe('recheck');

    const wish = describeBillingNotice('PENDING', { platform: 'android', subject: 'wish' });
    expect(wish.message).toContain('Your extra wish is ready as soon as it goes through');
    expect(wish.message).toContain('tap Create the link');
  });

  it('says "Still pending" when the person has checked and the store has not settled it', () => {
    const again = describeBillingNotice('PENDING', { platform: 'ios', subject: 'pro', rechecked: true });
    expect(again.title).toBe('Still pending');
    expect(again.message).toContain('The App Store has not confirmed it yet');
    expect(again.message).toContain('nothing more you need to do');
    expect(again.action).toBe('recheck');
  });

  it('names the store the person is on, and capitalises it at the start of a sentence', () => {
    expect(storeName('android')).toBe('Google Play');
    expect(storeName('ios')).toBe('the App Store');
    expect(storeName('other')).toBe('the store');
    expect(describeBillingNotice('PAYMENT_PROBLEM', { platform: 'ios' }).message).toMatch(
      /^The App Store could not take the payment\./,
    );
    expect(describeBillingNotice('NETWORK', { platform: 'android' }).message).toContain('reach Google Play');
  });

  it('is calm about a pending payment and only a problem for real problems', () => {
    expect(describeBillingNotice('PENDING', { platform: 'android' }).tone).toBe('pending');
    expect(describeBillingNotice('ALREADY_OWNED', { platform: 'android' }).tone).toBe('info');
    expect(describeBillingNotice('NOTHING_TO_RESTORE', { platform: 'android' }).tone).toBe('info');
    expect(describeBillingNotice('PAYMENT_PROBLEM', { platform: 'android' }).tone).toBe('problem');
    expect(describeBillingNotice('INTERNAL', { platform: 'android' }).tone).toBe('problem');
  });

  it('offers a way forward where there is one, and says where the money stands when it is unclear', () => {
    expect(describeBillingNotice('ALREADY_OWNED', { platform: 'android' }).action).toBe('restore');
    expect(describeBillingNotice('NOT_ALLOWED', { platform: 'android' }).action).toBeNull();
    // A dropped connection may have happened after the charge: say how to get it back.
    const network = describeBillingNotice('NETWORK', { platform: 'android' });
    expect(network.message).toContain('Restore purchases');
    const internal = describeBillingNotice('INTERNAL', { platform: 'android' });
    expect(internal.message).toContain('shows a charge');
    expect(BILLING_ACTION_LABEL.recheck).toBe('Check again');
    expect(BILLING_ACTION_LABEL.restore).toBe('Restore purchases');
  });

  it('does not offer to "check" when the store screen itself failed, since nothing may have started', () => {
    const failed = plansUnavailableNotice('android');
    expect(failed.action).toBeNull();
    expect(failed.message).toContain('switches on by itself once Google Play confirms it');
  });
});

describe('NoticeCard', () => {
  async function render(element: React.ReactElement) {
    let renderer: TestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = TestRenderer.create(element);
    });
    return renderer!;
  }

  it('shows what happened, and the one thing to do', async () => {
    const onAction = jest.fn();
    const renderer = await render(
      <NoticeCard
        tone="pending"
        title="Your payment is pending"
        message="Google Play is still confirming your payment."
        actionLabel="Check again"
        onAction={onAction}
      />,
    );
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain('Your payment is pending');
    expect(json).toContain('Google Play is still confirming your payment.');

    const action = renderer.root.findByProps({ accessibilityLabel: 'Check again' });
    await act(async () => {
      action.props.onPress();
    });
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('cannot be tapped twice while the check runs', async () => {
    const renderer = await render(
      <NoticeCard tone="pending" title="t" message="m" actionLabel="Check again" onAction={() => undefined} busy />,
    );
    expect(renderer.root.findByProps({ accessibilityLabel: 'Check again' }).props.disabled).toBe(true);
  });

  it('can be dismissed, and announces a problem as an alert', async () => {
    const onDismiss = jest.fn();
    const renderer = await render(
      <NoticeCard tone="problem" title="Something went wrong" message="m" onDismiss={onDismiss} />,
    );
    expect(renderer.root.findAll((n) => n.props.accessibilityRole === 'alert')).not.toHaveLength(0);
    await act(async () => {
      renderer.root.findByProps({ accessibilityLabel: 'Dismiss' }).props.onPress();
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows no action row when there is nothing to do', async () => {
    const renderer = await render(<NoticeCard tone="info" title="Nothing to restore" message="m" />);
    expect(JSON.stringify(renderer.toJSON())).not.toContain('Dismiss');
  });
});
