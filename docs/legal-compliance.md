# Legal-exposure audit — what was found, changed, and what is still yours

Audited and fixed 2026-10-09. This is an engineering record, **not legal advice**: have a lawyer who knows your
markets (India, US, EU/UK if you serve them) read the policies before you rely on them.

Everything below was checked against the real code and, where possible, the live site. "Evidence" lines say how.

---

## Do these first (in this order — it matters)

1. **Set secrets on Vercel, then deploy `docs-site/`** *before* you ship an app build that contains the age gate.
   The gate calls `/api/v1/age/check`; without the secret it answers 503 and **new users cannot get past the first screen**.
   * `AGE_ATTESTATION_SECRET` — 32+ random characters (`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`).
   * `EMAIL_UNSUBSCRIBE_SECRET` — 32+ random characters, **the same value** you later give Cloud Functions.
2. Check it is live (should print 200, then 403):
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" -X POST -H 'Content-Type: application/json' -d '{"year":1990,"month":5,"day":5}' https://occasio-greetings.vercel.app/api/v1/age/check
   curl -s -o /dev/null -w "%{http_code}\n" -X POST -H 'Content-Type: application/json' -d '{"year":2018,"month":1,"day":1}' https://occasio-greetings.vercel.app/api/v1/age/check
   ```
3. Ship the app update. Existing users see the age screen once.
4. When Cloud Functions are deployed (Blaze plan — see `production-readiness.md`), also set there:
   `EMAIL_UNSUBSCRIBE_SECRET` (same value), `OCCASIO_POSTAL_ADDRESS`, `RESEND_API_KEY`, `OCCASIO_EMAIL_FROM`.
   **Email stays off** until the postal address and secret are set, by design.
5. Deploy the Firestore rules (`npm run firestore:deploy`): they now explicitly deny clients access to
   `email_suppressions`, `email_receipts` and `takedowns`.

---

## 1. COPPA — age gate

**Found**
* Accounts can be created in four places, all client-side Firebase calls with no server step:
  email sign-up, email sign-in of a new user, Google, Apple (`authRepository.ts`).
* Without an account, the app still collects a recipient's name, a sender name and photos (guest card creation).
* **No** newsletter, waitlist, contact or magic-link forms exist (evidence: no `<form>`/`<input>` anywhere in
  `docs-site/src`; contact is a `mailto:` link). The onboarding creates no accounts.

**Changed**
* A **date-of-birth screen is the very first thing** in the app, before onboarding, accounts, names or photos
  (`AppNavigator` → `AgeGateScreen`). Neutral wording; it never states the cut-off.
* The date is **validated on the server** (`POST /api/v1/age/check`, `docs-site/src/lib/age/`). The server stores nothing
  and logs no body; on "yes" it returns a signed token that contains **no birthday and no identity**.
* **Under 13:** blocked on the spot, the date is **never sent anywhere**, and only `{"status":"blocked"}` is stored,
  so the check cannot just be retried with a different date.
* **Every new account** must be accepted by the server (`POST /api/v1/account/age`, verifies the token, records
  `users/{uid}.ageConfirmedAt`). If it is not, the new account is **deleted immediately** and the user is signed out.
  Accounts that predate the gate are stamped quietly the first time they are seen (`ensureAccountStamped`).
* An existing account that proves to be under 13 (date supplied) is **erased**: Vault, history, cards, push token and the
  sign-in account (`purgeUser`).
* Time zones handled: the server judges the date in UTC+14, so someone on their 13th birthday is never refused (a bug
  I found and fixed while testing).
* Verified on the Android emulator against a local copy of the server: invalid date → message; 10-year-old → blocked,
  **server received nothing**, device holds no birthday, block survives a restart; adult → passes, only a token stored.

**Limits you should know (honest)**
* Firebase's public sign-up API cannot be closed from this codebase. A technically skilled person could call it directly
  and skip the app. Closing that fully needs **Identity Platform + a `beforeUserCreated` blocking function**.
* The block lives on the phone, so reinstalling the app resets it (standard for age gates).
* On first launch the app needs a network connection to pass the gate (it fails closed).

**You still need to**
* Do the "first" steps above (Vercel secret + deploy before the app).
* Answer the store questionnaires consistently: not directed to children; Play *Target audience* 13+ / 18+, *Data safety*;
  App Store age rating.
* Optional hardening: Identity Platform blocking function (I can write it).

---

## 2. Third-party fonts / scripts

**Found**
* Fonts use `next/font/google`, which **downloads the font files at build time and serves them from your domain**.
  Evidence on the live site: the home, privacy, terms and card pages reference no `fonts.googleapis.com` /
  `fonts.gstatic.com`; the CSS has no external URL; the page loads `/_next/static/media/*.woff2` (31 files in the build).
  The mobile app uses system fonts.
* The **only** third-party load was the three demo-card photos from `images.unsplash.com` (every visitor to a demo link
  sent their IP address to Unsplash). One of the three had also been removed upstream (404), so the demo card already
  had a broken image.
* No Typekit/CDN/analytics scripts anywhere. `play.google.com` appears only as a link.

**Changed**
* Demo photos are now **self-hosted** (`docs-site/public/demo/`, Unsplash License; README lists the sources). The dead
  third photo was dropped.
* A tripwire test (`__tests__/compliance/privacyGuards.test.ts`) fails the build if any of 12 third-party hosts (Google
  Fonts, jsDelivr, unpkg, cdnjs, Tag Manager, Unsplash, Hotjar, Clarity…) is referenced, and checks `layout.tsx` still
  uses `next/font`. I proved the test catches a planted violation.

**You still need to**
* Nothing required. Optional: switch to `next/font/local` with committed `.woff2` files so builds don't depend on
  Google at build time. (The marketing-graphics tool in `store-assets/` loads Google Fonts when it renders images; it is
  a dev tool and not shipped.)

---

## 3. Analytics / session replay

**Found**
* **No analytics, replay, heatmap or tracking SDK exists** — none in the three `package.json` files, none in source;
  iOS `GoogleService-Info.plist` has `IS_ANALYTICS_ENABLED=false` and `IS_ADS_ENABLED=false`; the Android release manifest
  has no ad-ID permission. `trackEvent` only printed to the dev console.
* The privacy policy, however, **claimed** crash logs and usage events were collected and "crash reporting" existed.

**Changed**
* `src/shared/analytics/consent.ts`: an **opt-in, stored, revocable** choice. Default is *no*; "not asked yet" counts as
  *no*. `trackEvent` checks it before handing an event to **any** sink, and a new SDK can only be attached through
  `registerAnalyticsSink`, so adding one later cannot start collecting by accident. The stored choice is loaded at startup.
* A tripwire test fails if a known analytics / replay / crash package (Sentry, PostHog, Hotjar, Clarity, Mixpanel,
  Crashlytics, Firebase Analytics…) is added to any `package.json` without a conscious decision.
* The privacy policy now says what is true: no analytics, advertising or replay today; anything added later stays off
  until the user turns it on.
* I did **not** add a settings toggle: a switch that controls nothing is exactly what your UI guide forbids.

**Crashlytics (added 12 Oct)**
* Wired in `src/shared/firebase/crashlytics.ts`: collection is off in `firebase.json`, switched on only in release builds
  while consent is granted, and turning it off deletes unsent reports. It is a sink for event names (breadcrumbs) only.
* The "Send crash reports" switch on the Account tab (Privacy card) calls `setAnalyticsConsent`. The privacy policy §3.2
  and §6 describe it; the tripwire test checks it stays opt-in and is imported in that one file.

**Firebase Analytics (added 12 Oct)**
* Wired in `src/shared/firebase/analytics.ts` behind the same switch (now "Share usage and crash reports"). Off in
  `firebase.json`; no advertising ID (Android `AD_ID` permission removed, iOS built without AdSupport, ad consent flags
  off, automatic screen reporting off). Only allow-listed event fields are sent, never `shareSlug` or free text.
  Turning the switch off resets the analytics install ID.

**You still need to**
* Play *Data safety*: Crash logs (collected, optional, app functionality) and App interactions (collected, optional,
  analytics). Keep "Advertising ID" = No.
* App Store label: Diagnostics → Crash Data and Usage Data → Product Interaction, before this build ships.
* Never enable session replay or keystroke capture behind this switch; it would need its own consent and masking of every
  input.

---

## 4. Email — CAN-SPAM

**Found**
* The app sends **no marketing email** (no launch, newsletter, waitlist, promo or re-engagement mail exists).
* Three kinds of email exist: Firebase Auth's verification/reset (sent by Google, transactional); the **auto-send card
  email** via Resend to someone who never signed up (no footer, no postal address, no unsubscribe, no suppression);
  and **no** purchase confirmation.
* Auto-send is not deployed yet (Cloud Functions have never been deployed), so none of this has reached anyone.

**Changed** (`functions/src/email/`, `docs-site/src/lib/email/`, `/unsubscribe`)
* Every email has a **kind** — `transactional`, `delivery` or `marketing` — and `composeEmail` **refuses to build** a
  `delivery` or `marketing` email without our postal address and an unsubscribe link. Transactional is documented in code as
  "purely transactional; anything promotional makes it marketing", and a test keeps its templates free of sales language.
* The card email now carries a visible **one-click unsubscribe link**, our **postal address**, and the headers
  `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
* **Unsubscribe works immediately** (not 10 days): the link is a signed token holding only a hash of the address; the
  `/unsubscribe` page and the one-click endpoint write to `email_suppressions`; a plain GET never unsubscribes (link
  scanners). **Every send checks the list first** and skips unsubscribed addresses.
* Email **switches itself off** if the postal address or unsubscribe secret is missing, rather than sending something
  non-compliant. A contract test proves the website and the functions create and verify identical links.
* A confirmation email after purchase (below, item 5).

**You still need to**
* Provide a real **postal address** (a PO box or registered address is fine) as `OCCASIO_POSTAL_ADDRESS`.
* Verify your sending domain in Resend and publish **SPF, DKIM and DMARC**.
* Deploy Cloud Functions (Blaze), then set the env vars from "first" step 4.
* If you ever send marketing email: only to people who opted in, always `kind: 'marketing'`.

---

## 5. Subscriptions — automatic renewal

**Found**
* Billing is **App Store / Google Play in-app purchase through RevenueCat only** — no Stripe, Paddle or web checkout.
* Buy buttons exist in three places: (a) the **RevenueCat dashboard paywall** (`presentPaywall`, designed in their
  dashboard, not in this repo), (b) the in-app `PaywallModal`, (c) the onboarding plan step.
* The onboarding plan step already showed price, interval, auto-renew and how to cancel beside the buttons. **The
  `PaywallModal` showed none of it** and had no Terms/Privacy links.
* The cancel path existed (Account → Manage subscription → RevenueCat Customer Center) but depended on that screen being
  configured, and was labelled "Manage subscription".
* No free trial is defined anywhere in the code (store configuration can't be seen from here).

**Changed**
* `PaywallModal`: the terms ("Renews automatically until you cancel. Cancel any time in Account → Manage subscription, or
  in Google Play subscriptions / your App Store account settings.") sit directly under the plans, plus Terms and Privacy
  links. Each plan row now reads "Renews monthly/yearly until you cancel".
* Account: the button reads **"Cancel or manage subscription"**, and if the in-app screen cannot open it sends the person
  straight to the store's own cancel page, so cancelling is never blocked. Fixed an old bug where this fallback could
  never trigger.
* **Confirmation email** on a new subscription (`functions/src/subscriptionEmail.ts`, triggered by the RevenueCat webhook):
  price, renewal interval and next date, and how to cancel without emailing anyone; once per event even if RevenueCat
  retries; never blocks billing sync if it fails; also words a trial correctly if you add one.
* Terms of Service updated (auto-renewal, in-app cancellation, confirmation email, access until period end).

**You still need to**
* **RevenueCat dashboard:** make sure the paywall template shows price, period, "renews automatically until cancelled",
  Restore, and links to Terms and Privacy; enable **Customer Center**.
* Deploy Functions and point the RevenueCat webhook at `/v1/billing/webhook` (needed for the confirmation email).
* **Free trials:** none exist. If you add one in the stores, you must also send a reminder before the first charge. I did
  not build that, since there is no trial to attach it to.
* Strictest reading of the rule wants the renewal wording *on the button itself*. The onboarding plan cards currently rely
  on the notice directly beneath them plus the store's own confirmation sheet. I left your onboarding files alone while you
  are redesigning them; say the word and I will add a "Renews yearly until you cancel" line to each plan card.

---

## 6. User uploads — DMCA safe harbor

**Found**
* Users upload **photos** and write **messages, reasons and names** that are then shown publicly (by link) to recipients.
  There are no avatars, posts or attachments. Cards are unlisted, anonymous to create, and previously had no copyright
  procedure. Someone had just added a "Report this card" mailto link.

**Changed**
* **`/dmca` page** (`docs-site/content/dmca.md`): the 17 U.S.C. § 512 notice requirements, how we respond, counter-notice,
  **repeat-infringer policy** (three valid notices), misrepresentation warning, and a "Designated agent" block that reads from
  config. Linked from the site footer, from every card ("Copyright" next to "Report this card", pre-filled with the card),
  from the Account screen, and from the Terms (§4).
* **Takedown tooling:** `docs-site/scripts/takedown.mjs <slug> "<reason>"` disables a card instantly, logs it to
  `takedowns`, and warns when an owner reaches three. Taken-down cards are kept 90 days so a counter-notice can be honoured.
* Config slot: `docs-site/src/lib/legal.ts` → `dmcaAgent`. **Until you fill it in, the page does not claim an agent is
  registered** (it only gives the contact email), because safe harbor does not apply without registration.

**You still need to — register the designated agent (about 10 minutes, $6)**
1. Go to **https://www.copyright.gov/dmca-directory/** and create an account (use an email you will keep).
2. Choose **Register an agent**. Enter your **service provider name** (`Occasio` / `Nick Kubde`) and every other name the
   service operates under (`occasio-greetings.vercel.app`).
3. Enter the **designated agent**: a person or a role. Their **name, postal address, email and phone are published in the
   public directory** — use a business address / PO box and a dedicated address such as `copyright@…`, not a home address.
4. Pay the **$6** fee. The registration is valid for **3 years**: put a reminder in your calendar to renew it.
5. Copy the same details into **`docs-site/src/lib/legal.ts`** → `dmcaAgent: { name, postalAddress, email, phone }` and deploy.
   The `/dmca` page then shows them automatically.
6. Run takedowns with the script above and keep the notices you receive.
* Note: the DMCA is US law. It protects you for US users even though you operate from India; a lawyer can tell you what
  else applies.

---

## Also checked

| Check | Result |
| --- | --- |
| Privacy policy and Terms exist | Yes, live at `/privacy` and `/terms` (HTTP 200) |
| Linked from the footer | Yes (also now **Copyright**) |
| Linked at sign-up | **Gap fixed:** the in-app sign-up modal (`SoftAuthModal`) had no links; it now shows Terms and Privacy. The full login screen already did. |
| Policy lists every processor the code uses | **Rewritten from the code:** Firebase (Auth, Firestore, Messaging; Functions/Storage once enabled), Google Sign-In, Sign in with Apple, RevenueCat, Vercel, **Resend** (was missing), Google Play / App Store. Removed false claims (crash reporting, usage events, deletion after expiry that no job performed). |
| Deletion promise | The policy promises expired cards are deleted. **Nothing did that.** Added a daily purge job (`purgeExpired`, 14 days after expiry; taken-down cards 90 days). It runs once Functions are deployed. |
| Cookies / consent | No advertising or analytics cookies exist. The only cookie is a strictly necessary, httpOnly, secure docs-access cookie. Card pages store sound/sticker/reaction preferences in local storage (functional, never sent anywhere). Nothing to consent to today, so no banner; the analytics consent store handles the future. |
| Secrets in client bundles | Built the **release** Android bundle and the website: no private keys, service account, Resend or RevenueCat secrets. The public RevenueCat SDK keys and Firebase config are present by design. **Fixed:** the RevenueCat **Test Store key** shipped in release bundles; now debug-only (0 hits in a release bundle). |
| Secrets / user data in logs | All app `console` output is `__DEV__`-guarded. Fixed an error message shown to users that named a server env var and told them to "redeploy on Vercel". Server routes do not log request bodies. |

## What changed, file by file

| Area | Files |
| --- | --- |
| Age gate (server) | `docs-site/src/lib/age/{ageGate,attestation,purgeUser}.ts`, `src/app/api/v1/age/check/route.ts`, `src/app/api/v1/account/age/route.ts` |
| Age gate (app) | `src/features/age/**`, `src/shared/navigation/AppNavigator.tsx`, `src/features/auth/data/authRepository.ts`, `src/features/auth/application/AuthProvider.tsx`, `src/shared/api/{errors,httpClient}.ts`, create repositories (error mapping) |
| Email | `functions/src/email/**`, `functions/src/subscriptionEmail.ts`, `functions/src/autosend/providers.ts`, `dispatch.ts`, `billing.ts`, `index.ts`; `docs-site/src/lib/email/unsubscribe.ts`, `app/api/v1/email/unsubscribe/route.ts`, `app/(public)/unsubscribe/*` |
| Subscriptions | `src/features/billing/domain/renewalTerms.ts`, `data/revenueCatClient.ts`, `application/BillingProvider.tsx`, `src/features/create/ui/components/PaywallModal.tsx`, `src/features/auth/ui/{screens/AccountScreen,components/AccountSettingsCards}.tsx` |
| DMCA / retention | `docs-site/content/dmca.md`, `app/(public)/dmca/page.tsx`, `components/{ReportCardLink,PublicShell}.tsx`, `lib/legal.ts`, `globals.css`, `scripts/takedown.mjs`, `functions/src/purgeExpired.ts` |
| Analytics consent | `src/shared/analytics/{consent,events}.ts`, `App.tsx` |
| Third parties / secrets | `docs-site/public/demo/*`, `docs-site/src/lib/recipientCard.ts`, `src/shared/config/revenueCat.ts`, `sparkCreationRepository.ts` |
| Legal text | `docs-site/content/{privacy-policy,terms-of-service}.md`, `.env.example`, `firestore.rules` |
| Tests added | `__tests__/{age,email,analytics,compliance}/*`, `docs-site/src/lib/age/age.test.ts`, `__tests__/functions/purgeExpired.test.ts` |
