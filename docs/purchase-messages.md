# Purchase messages

What a person reads when a purchase does not simply succeed. The store and RevenueCat speak in codes ("error 20");
the app never shows them. Everything is in one place: `src/features/billing/domain/billingNotice.ts`.

## How it works

1. `billingErrorFromSdk` (`data/billingErrors.ts`) turns whatever the SDK threw into one `BillingErrorCode`.
2. `describeBillingNotice(code, { platform, subject })` gives the notice: a tone, a title, a message that names the store
   (Google Play or the App Store) and says what happens next, and at most one action.
3. `BillingProvider` keeps the current `notice`. `useBillingNotice()` hands a screen the props for a `NoticeCard`
   (`shared/ui/NoticeCard.tsx`), a calm card with an icon, the words and a quiet text action.

The raw SDK text is never displayed. The code (not the text) goes to analytics.

## A pending payment (RevenueCat error 20)

Not a failure: the store is still confirming the payment. This happens with slower payment methods (UPI, carrier billing,
cash) on Google Play, and with Ask to Buy on the App Store.

* The card is warm (not red), titled **Your payment is pending**, and says what will happen: Pro switches on by itself;
  an extra wish is ready as soon as it goes through, then come back and tap Create the link.
* **Check again** asks the store afresh (`refreshCustomerInfo` clears the cached answer first). If it has not settled, the
  card says **Still pending** and that there is nothing more to do.
* It **clears itself** when the store confirms (the customer-info listener), and it stays when you leave the screen,
  unlike other notices.
* Analytics: `purchase_pending` (instead of `subscribe_failed`).

## The messages

| Code | Title | Tone | Action |
|---|---|---|---|
| `PENDING` | Your payment is pending / Still pending | pending | Check again |
| `NETWORK` | No connection | problem | Restore purchases |
| `STORE` | Google Play / The App Store had a problem | problem | none |
| `NOT_ALLOWED` | Purchases are turned off | problem | none |
| `PAYMENT_PROBLEM` | The payment did not go through | problem | none |
| `UNAVAILABLE` | That plan is not available | problem | none |
| `ALREADY_OWNED` | You already have this | info | Restore purchases |
| `OTHER_ACCOUNT` | Used by another account | problem | none |
| `BUSY` | Still working on it | info | Check again |
| `INELIGIBLE` | Not available for this account | problem | none |
| `NOT_CONFIGURED` | Plans are not available yet | info | none |
| `NOTHING_TO_RESTORE` | Nothing to restore | info | none |
| `INTERNAL` | Something went wrong | problem | Restore purchases |
| `CANCELLED` | (nothing shown) | | |

The store's own plans screen failing (`plansUnavailableNotice`) says "We could not finish that" and offers no "check",
because we cannot tell whether a payment had started.

## Rules (enforced by `__tests__/billing/billingNotice.test.tsx`)

No numbers or SDK names, no exclamation marks, no emoji; the store is named for the platform and capitalised at the
start of a sentence; money is mentioned only where the truth is clear ("If you were already charged, tap Restore
purchases").

## Limits

* **RevenueCat's own paywall** (the dashboard-designed screen opened from Account and from a card's free limit) draws its
  own pop-ups inside the native view. This code cannot change their wording. If a payment goes pending inside it, the
  person sees RevenueCat's text, then our neutral "We could not finish that" notice. Replacing that screen with our own
  plans screen (the onboarding plan step already is one) would put every message under our control.
* A pending payment is remembered only while the app is running. After a restart it is settled by the store and the
  plan appears on its own; there is no "pending" banner until then.

## Testing a pending payment

* **Google Play**: add yourself as a license tester and pay with the slow test card (it approves or declines after a
  few minutes). The card should show **Your payment is pending**, then clear itself when it approves.
* **App Store**: use a sandbox account with Ask to Buy, or Xcode's StoreKit configuration with a deferred transaction.
* Unit tests: `__tests__/billing/billingProvider.test.tsx` walks the whole flow with the store mocked.
