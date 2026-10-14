# The free card: who gets it, and how it can be abused

Each person gets **one free card, ever**. Accounts are cheap to make, so "one per account" is not "one per person". This page lists every way round it that was checked, what is done about each, and what is not (and why).

## How it works now

The server decides (`createCreation` in `docs-site/src/lib/creationsServer.ts`); the app only reflects it. The rules are pure functions in `docs-site/src/lib/freeClaims.ts`, tested scenario by scenario.

1. **The free card needs a verified identity.** Google and Apple vouch for the person when they sign in. An email and password counts only once the inbox is **confirmed** (the app sends the link on sign-up and asks again when they try to create their first card). An email and password nobody has confirmed gets `403 EMAIL_NOT_VERIFIED`, and the app shows a "Confirm your email" sheet, not the paywall.
2. **Known throwaway inboxes are refused** (`mailinator`, `yopmail`, `guerrillamail` and about 60 more), even when confirmed: `403 EMAIL_NOT_ALLOWED`.
3. **Spending the free card leaves claims that outlive the account** (`free_claims`, one-way hashes): the inbox (lower-cased, `+tags` removed, Gmail dots and `googlemail` folded) **and** each Google or Apple id. If any of them is already held by another account, the free card is treated as spent. Deleting the account and signing up again, with any of these doors, gets nothing free.
4. **Paying never needs verification.** Pro and single wishes work for anyone.
5. The claims are disclosed in the privacy policy and the delete-account page.

## Scenarios

| # | What someone does | Result | Why |
|---|---|---|---|
| 1 | Signs in with Google or Apple for the first time | Free card | Verified identity |
| 2 | Makes many accounts with made-up emails and passwords | **No free card on any of them** | Unverified: `EMAIL_NOT_VERIFIED`. This was the hole: before, an unverified account got its own free card, so 100 fake accounts meant 100 free cards |
| 3 | Same, but with real inboxes they control (many Gmail accounts) | One free card per real inbox | Cannot be stopped from the server: see "Not covered" |
| 4 | Uses `mailinator` or another throwaway inbox and confirms it | Refused | `EMAIL_NOT_ALLOWED`. A list can only catch the common ones |
| 5 | Deletes the account, signs up again with the same Google account | **No free card** | The inbox claim and the Google id claim survive deletion |
| 6 | Same, but with an email and password for the same inbox | No free card | The same inbox claim, however it is spelled |
| 7 | `name+1@gmail.com`, `n.a.m.e@gmail.com`, `name@googlemail.com` | The same person | Normalised to one claim |
| 8 | Signs in with Google, deletes, then signs in with Apple using the same real email | No free card | Same inbox claim (when Apple shares the real address) |
| 9 | Changes the email on their Google account, comes back | No free card | The Google id claim is the same |
| 10 | Taps "Create" twice, or from two phones at once | One free card | One Firestore transaction decides and writes the claims |
| 11 | Edits the free card to send it to someone else | Blocked | `recipientEditAllowed`: a link is for one person, only typo fixes pass |
| 12 | Anonymous Firebase account | Refused | No free allowance, no card at all (`401`) |
| 13 | Edits or deletes their History to reset the count | Nothing changes | The counter lives on `users/{uid}`, which clients cannot write |
| 14 | Modified app, or a script calling the API with an account they minted | Same rules | The server checks the token itself. Needs a real, confirmed inbox to get a free card |
| 15 | Already had an unconfirmed email account that used its free card before this change | Keeps using the app; asked to pay for the next card | The card was spent; no verification is asked for it |
| 16 | Already had an unconfirmed account that never used its free card | Asked to confirm their email first | One-time, and the sheet says exactly what to do |
| 17 | Unconfirmed account while the plan lookup (RevenueCat) is down or misconfigured | Still asked to confirm their email | They could not use the free card anyway, so the outage must not hide that step (a confirmed or paying account gets `503` and a Try again sheet) |

## Not covered (and what could cover it)

* **Several real inboxes or Apple/Google accounts (scenario 3).** One person with five Gmail accounts gets five free cards. Only a **device** signal can link them. iOS: Apple's DeviceCheck stores two bits per device that survive deleting the app, but it needs an Apple key (.p8) and a small native module to produce the device token, so it is a separate piece of work. Android: Play Integrity's "device recall" can store a few bits per device if it is available for the app. Either needs a line in the privacy policy.
* **Apple "Hide My Email" after deleting.** App Store rules require the Apple sign-in to be **revoked** when an account is deleted. After that, signing in with Apple again makes a **new** Apple id and a **new** relay address, so none of the claims match. So on iPhone, delete + re-sign-in with Apple gives another free card. It cannot be closed from the server; the device signal above is the fix. Google and email sign-ins are covered.
* **A throwaway domain not on the list**, or someone's own domain. The list is small on purpose; a bigger one means more false positives.
* **IP or per-network limits.** Not used for the free card: many Indian mobile users share one network address, and a limit would turn away real people. The create endpoint keeps its gentle limit (20 an hour per network).

## What to turn on in Firebase (not code)

* Authentication, Settings: keep **"Link accounts that use the same email"** on (the default), so signing in with Google using an email that has an unconfirmed password account invalidates that password account instead of creating a duplicate.
* Authentication, Settings: turn **email enumeration protection** on.
* Turn on **App Check** (Play Integrity on Android, App Attest on iOS) and enforce it for Firebase Auth, so scripts that mint accounts without the real app are refused. This is the best next step against scripted abuse.

## Where it lives

* Rules and tests: `docs-site/src/lib/freeClaims.ts`, `freeClaims.test.ts` (every row above that the server decides is a test).
* The transaction: `createCreation` in `creationsServer.ts`. The token check (`verified`, `subjects`): `verifyBearerToken.ts`.
* App: `src/features/auth/domain/emailVerification.ts`, the sheet `src/features/create/ui/components/VerifyEmailSheet.tsx`, and the Preview screen. Sign-up sends the confirmation email (`createAccountWithEmail`).
* `purgeUser` deliberately keeps `free_claims`.
