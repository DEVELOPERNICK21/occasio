# The free card: who gets it, and how it can be abused

Each person gets **one free card, ever**. Accounts are cheap to make, so "one per account" is not "one per person". This page lists every way round it that was checked, what is done about each, and what is not (and why).

## How it works now

The server decides (`createCreation` in `docs-site/src/lib/creationsServer.ts`); the app only reflects it. The rules are pure functions in `docs-site/src/lib/freeClaims.ts`, tested scenario by scenario.

1. **The free card is for Google and Apple accounts only.** An email and password account can sign up, use the app and pay for cards, but cannot claim the free one, **confirmed or not**: a throwaway inbox (yopmail and the like) receives the confirmation link just fine, and a blocklist cannot keep up with hundreds of rotating domains. Making a fake Google or Apple account costs real effort, and every Android phone has a Google account and every iPhone an Apple ID. An email account gets `403 FREE_CARD_NEEDS_PROVIDER`, and the app shows a "Your free card is waiting" sheet with Continue with Google, Continue with Apple (iPhone) and See plans, not the paywall.
2. **A Google account on a throwaway address is refused** (`mailinator`, `yopmail`, `guerrillamail` and about 60 more): `403 EMAIL_NOT_ALLOWED`. Google lets people create an account on any address, so this stays as a second layer.
3. **Spending the free card leaves claims that outlive the account** (`free_claims`, one-way hashes): the inbox (lower-cased, `+tags` removed, Gmail dots and `googlemail` folded) **and** each Google or Apple id. If any of them is already held by another account, the free card is treated as spent. Deleting the account and signing up again, with any of these doors, gets nothing free.
4. **Paying never needs Google or Apple.** Pro and single wishes work for any account.
5. The claims are disclosed in the privacy policy and the delete-account page.

## Scenarios

| # | What someone does | Result | Why |
|---|---|---|---|
| 1 | Signs in with Google or Apple for the first time | Free card | Google or Apple identity |
| 2 | Makes many accounts with made-up emails and passwords | **No free card on any of them** | `FREE_CARD_NEEDS_PROVIDER`. This was the hole: an email account used to get its own free card, so 100 fake accounts meant 100 free cards |
| 3 | Same, with a real inbox, or a throwaway one such as yopmail, and confirms it | **No free card** | Confirming an inbox proves nothing about the person, so it does not count |
| 4 | Makes many real Google accounts | One free card per Google account | Cannot be stopped from the server: see "Not covered" |
| 5 | Deletes the account, signs in again with the same Google account | **No free card** | The inbox claim and the Google id claim survive deletion |
| 6 | Same, but signs up with email and password for that inbox | No free card | It could not claim one anyway, and the inbox claim is held |
| 7 | `name+1@gmail.com`, `n.a.m.e@gmail.com`, `name@googlemail.com` | The same person | Normalised to one claim |
| 8 | Signs in with Google, deletes, then signs in with Apple using the same real email | No free card | Same inbox claim (when Apple shares the real address) |
| 9 | Changes the email on their Google account, comes back | No free card | The Google id claim is the same |
| 10 | Taps "Create" twice, or from two phones at once | One free card | One Firestore transaction decides and writes the claims |
| 11 | Edits the free card to send it to someone else | Blocked | `recipientEditAllowed`: a link is for one person, only typo fixes pass |
| 12 | Anonymous Firebase account | Refused | No free allowance, no card at all (`401`) |
| 13 | Edits or deletes their History to reset the count | Nothing changes | The counter lives on `users/{uid}`, which clients cannot write |
| 14 | Modified app, or a script calling the API with an account they minted | Same rules | The server checks the token itself. It needs a real Google or Apple identity |
| 15 | Email account that wants to pay | Works | Pro and single wishes do not need Google or Apple |
| 16 | Email account wants the free card | Sheet: Continue with Google / Apple / See plans | Signing in switches the phone to that account; if it is the same address, Firebase merges them |
| 17 | Email account while the plan lookup (RevenueCat) is down or misconfigured | Still asked for Google or Apple | They could not use the free card anyway, so the outage must not hide that step (a Google or Apple account that needs the plan check gets `503` and a Try again sheet) |
| 18 | Google account on a throwaway address | Refused | `EMAIL_NOT_ALLOWED`: Google accepts any address |

## Not covered (and what could cover it)

* **Several real Google or Apple accounts (scenario 4).** One person with five Gmail accounts gets five free cards. Only a **device** signal can link them. iOS: Apple's DeviceCheck stores two bits per device that survive deleting the app, but it needs an Apple key (.p8) and a small native module to produce the device token, so it is a separate piece of work. Android: Play Integrity's "device recall" can store a few bits per device if it is available for the app. Either needs a line in the privacy policy.
* **Apple "Hide My Email" after deleting.** App Store rules require the Apple sign-in to be **revoked** when an account is deleted. After that, signing in with Apple again makes a **new** Apple id and a **new** relay address, so none of the claims match. So on iPhone, delete + re-sign-in with Apple gives another free card. It cannot be closed from the server; the device signal above is the fix. Google and email sign-ins are covered.
* **A Google account on a throwaway domain that is not on the list**, or someone's own domain. The list is small on purpose; a bigger one means more false positives.
* **IP or per-network limits.** Not used for the free card: many Indian mobile users share one network address, and a limit would turn away real people. The create endpoint keeps its gentle limit (20 an hour per network).

## What to turn on in Firebase (not code)

* Authentication, Settings: keep **"Link accounts that use the same email"** on (the default), so signing in with Google using an email that already has a password account merges into that account instead of creating a duplicate.
* Authentication, Settings: turn **email enumeration protection** on.
* Turn on **App Check** (Play Integrity on Android, App Attest on iOS). Our own API checks the token (`X-Firebase-AppCheck`, verified with the Admin SDK), so scripts that call the API without the real app are refused once `APP_CHECK_MODE=enforce`. It is built and runs in log mode by default: the setup and rollout are in [app-check.md](./app-check.md). Enforcing App Check on Firebase Auth itself needs an upgrade to Identity Platform (a project-level billing change), so it is not the first step.

## Where it lives

* Rules and tests: `docs-site/src/lib/freeClaims.ts`, `freeClaims.test.ts` (every row above that the server decides is a test).
* The transaction: `createCreation` in `creationsServer.ts`. The token check (`verified` = has a Google or Apple identity, `subjects`): `verifyBearerToken.ts`.
* App: the sheet `src/features/create/ui/components/FreeCardSheet.tsx` (and `CreateProblemSheet.tsx` for any other failure), opened from the Preview screen. Sign-up no longer sends a confirmation email.
* `purgeUser` deliberately keeps `free_claims`.
