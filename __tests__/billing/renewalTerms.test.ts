import {
  renewalPeriodLabel,
  renewalTerms,
  storeLabel,
  subscriptionsUrl,
} from '../../src/features/billing/domain/renewalTerms';

describe('the auto-renewal disclosure shown beside every subscribe button', () => {
  it('says it renews until cancelled and how to cancel, in the app first and then the right store', () => {
    expect(renewalTerms('ios')).toBe(
      'Renews automatically until you cancel. Cancel any time in Account → Manage subscription, or in your App Store account settings.',
    );
    expect(renewalTerms('android')).toContain('Google Play subscriptions');
    expect(renewalTerms('other')).toContain('your store account settings');
  });

  it('names the store by platform', () => {
    expect(storeLabel('ios')).toBe('your App Store account settings');
    expect(storeLabel('android')).toBe('Google Play subscriptions');
    expect(storeLabel('other')).toBe('your store account settings');
  });

  it('links to the store page where a subscription can be managed', () => {
    expect(subscriptionsUrl('ios')).toBe('https://apps.apple.com/account/subscriptions');
    expect(subscriptionsUrl('android')).toBe('https://play.google.com/store/account/subscriptions');
    expect(subscriptionsUrl('other')).toBe('https://play.google.com/store/account/subscriptions');
  });

  it('states the interval each plan renews on', () => {
    expect(renewalPeriodLabel('monthly')).toBe('Renews monthly until you cancel');
    expect(renewalPeriodLabel('yearly')).toBe('Renews yearly until you cancel');
  });
});
