# 01 · App brief — Occasio

Everything here comes from the project (source, docs, config, assets). Where the project is silent, the line is marked **ASSUMPTION**. Nothing is invented: no features, numbers, reviews or awards.

Evidence key: `[code]` source files · `[doc]` product docs in `docs-site/content` / `docs/` · `[cfg]` build config · `[asset]` brand files.

---

## 1. What it does, in one sentence

Occasio lets you turn a photo and a few words into a birthday, anniversary, thank-you, congratulations or "just because" card that the other person *plays* (pop balloons, blow out candles, unwrap a 3D gift, read a letter) from a private link, and it keeps the dates of the people who matter so you can start a card in a minute instead of a panic.

## 2. Platforms, stores, IDs, languages

| Item | Value | Source |
|---|---|---|
| Framework | React Native CLI 0.86 (not Expo), TypeScript strict | `package.json` `[cfg]` |
| Android | package `com.occasio.greetings` · versionName **1.0.1** · versionCode **13** · Firebase/RevenueCat `goog_` key present | `android/app/build.gradle` `[cfg]` |
| iOS | bundle `com.occasio.ios` · marketing version **1.0** (build 2) · min iOS 15.1 · **iPhone only** (`TARGETED_DEVICE_FAMILY = 1`), portrait only | `ios/Occasio.xcodeproj` `[cfg]` |
| Stores | Google Play (production US was the stated first target) and Apple App Store. **ASSUMPTION:** both ship, Play first | `AGENTS.md` `[doc]` |
| iOS extras | WidgetKit extension "OccasioWidgets" (Next up, Coming up, Make a card); Sign in with Apple | `ios/OccasioWidgets` `[code]` |
| Android extras | Home-screen widgets (Next up, Coming up, Quick create) | `AndroidManifest.xml` `[cfg]` |
| Languages | **English only.** No i18n library, no string tables, no `CFBundleLocalizations` | grep of `src/`, `Info.plist` `[code]` |
| Web companion | Recipients open `https://occasio-greetings.vercel.app/c/<slug>` in a browser, no install. Same site hosts `/privacy`, `/terms`, `/delete-account` | `docs-site/src/app` `[code]` |
| Backend | Firebase (Auth, Firestore, Storage, Cloud Messaging, Functions), card API on the Vercel site, RevenueCat for billing | `ARCHITECTURE.md` `[doc]` |

Permissions that appear in store review: camera and photo library (for card photos), push notifications (Vault reminders). No contacts access; the privacy policy states contacts are not scraped. `[cfg][doc]`

## 3. Primary user and the problem that brings them to the store

**Primary user (from the PRD personas):** 18–35, India-first, plus a US launch. Two sub-types:

- **"Forgetful but caring" adult child / partner (25–45).** Misses or nearly misses Mom's birthday or an anniversary and ends up sending a flat image or a one-line text. `[doc: prd-personas-moscow.md]`
- **Expressive young partner or friend (18–30).** Wants something more personal than a forwarded image, with no design skill and no account wall. `[doc]`

**The search that brings them to the store** (see `02-research.md` for the demand evidence):

1. "birthday reminder app", "never forget birthdays" → *I keep forgetting.*
2. "birthday card app", "personalized birthday card online", "interactive birthday card" → *I want to send something nicer than a text.*
3. "birthday wish app", "send birthday wishes" → *I need the right words and an easy way to send them.*

**The job to be done:** "When someone I love has a special day, help me show up on time with something that feels personal, without it taking an hour." `[doc: PRD §2]`

## 4. Five strongest features, ranked by how much users would pay for them

No purchase data exists, so this ranking is **ASSUMPTION** built on what the app actually gates and what competitors charge for.

| # | Feature (what the user gets) | Free or paid today | Why it ranks here |
|---|---|---|---|
| 1 | **24 cards a year and 365-day links** (free is 1 card per account, 30-day links) | Paid (Pro) or a single-card purchase | It is the only limit a user hits during normal use, at the moment they want to send a second card. The paywall opens here. `quota.ts` |
| 2 | **Cards prepared on their day, with a review window** (the "auto-send" engine: card built from the saved photo + message, push to review, 2-hour approve/cancel window, then share the link) | Paid (arming is gated to Pro) | It is the reason to subscribe rather than buy one card, and the retention engine. **Not fully verified end to end** (see §9 and the claims gate in `03-positioning.md`). `functions/src/autosend`, `vault-blueprint.md` |
| 3 | **Vault: save up to 5 people** with birthday and anniversary, "Coming up" on Create, home-screen widgets (free: 1 person) | Paid for 2–5 people | Turns Occasio from a one-off tool into something opened every year. `tierLimits.ts` |
| 4 | **The interactive card the recipient plays** (gate with Pip, balloons, candles, 3D gift, photo deck, reasons, wax-sealed letter, stickers) | Free | It is the acquisition hook and the reason a sender picks Occasio over a static card. Nobody pays for it directly, but it is why they come back. `recipient-experience.md` |
| 5 | **Depth of personalisation:** up to 5 photos, 11 photo layouts, five moments, "reasons" they open one by one, a custom balloon line, a 4-digit passcode lock | Free | Makes the card feel specific, which is what people pay a second time for. `DetailsScreen.tsx`, `creationRules.ts` |

Honourable mentions (real, but weaker as pay drivers): the Wish journey (levels, badges, month streaks) `wishJourney.ts`; Sign in with Apple/Google/email; in-app account deletion.

## 5. The aha moment and how fast a new user reaches it

- **Aha for the sender:** seeing their own photo and words inside the finished card, then tapping the share link and realising the other person will *play* it. The app's own copy says "Most cards take under two minutes to make" and Create Home says "Your first wish takes about two minutes". `onboardingSlides.ts`, `createHome.ts`
- **Path:** onboarding (3 swipes, skippable) → Create → *Who is it for?* → *What's the moment?* → *Add photos* → *Choose a frame* → *Your words* → *Preview* → *Create the link* → *Your link is ready*. Quick Create shortens it to Photos → Words → Preview (3 screens). `createSteps.ts`
- **Account wall:** none. Guests can complete the whole path. Sign-in is asked only for Vault, history and subscriptions. `PRD §5`, onboarding "No account needed to start."
- **Time to aha:** about two minutes by the app's own claim (**not measured**, because analytics is a dev-only stub; see §9). **ASSUMPTION:** the first real "wow" is when the sender opens their own link and meets Pip.

## 6. What is free, what is paid, prices, and the upgrade triggers

| | Free (no account needed to start) | Occasio Pro |
|---|---|---|
| Cards | **1 per account, ever** (30-day links) | **24 per rolling year**, then single wishes (365-day links) |
| Saved people (Vault) | **1** | **Up to 5** |
| On-their-day card prep ("auto-send") | Off | On (arm per person) |
| Extra single card | Buy one "wish" (consumable) | n/a |
| Billing | n/a | Monthly or yearly auto-renewing subscription via App Store / Google Play, through RevenueCat. Entitlement `occasio_pro`; products `occasio_pro_monthly`, `occasio_pro_yearly`; consumable `occasio_wish_single` |

`[code: quota.ts, tierLimits.ts, entitlements.ts, mapTier.ts]` `[doc: REVENUECAT_SETUP.md]`

**Prices: not in the project.** No price string exists in code (the paywall reads the store price from RevenueCat). The PRD's *target* India prices for the "Personal" tier are **₹149/month and ₹999/year**, and ₹49–99 for a one-off card. `[doc: prd.md §8]` A "Family" tier (15 people, ₹299/₹1,999) is described in the PRD and has a 15-person cap in code, but **no product is wired to it**, so it is out of scope for the listing.

**What triggers an upgrade today:**

1. Tapping *Create the link* on a second card as a free user → paywall ("Your free card is used"). `PreviewScreen.tsx`, `PaywallModal.tsx`
2. Trying to add a second person to the Vault, or to arm auto-send, as a free user. `useSavePerson.ts`, `useToggleAutoSend.ts`
3. Account → *See Occasio Pro*.

**The in-app paywall** lists: "24 cards a year, and single wishes beyond that", "Links active for 365 days", "Save up to 5 people in Vault", "Priority support for Pro". The first three are enforced by the server (card allowance, link length) and `tierLimits.ts`.

## 7. Brand: colours, fonts, logo, tone

**Colours** (`design-tokens.json`, mirrored in `src/shared/theme/tokens.ts`):

| Role | Hex |
|---|---|
| Primary / accent (coral) | `#E8615D` (hover `#C94E4A`) |
| Secondary (amber) | `#F6A94A` |
| Tertiary / accent soft (peach) | `#F7C9B6` |
| Background (cream) · sidebar · surface | `#FDF6F2` · `#FCEEE8` · `#FFFFFF` |
| Ink · ink soft · muted | `#2A2220` · `#4D4340` · `#857371` |
| Border | `#EDD5CA` |
| Rose · sage · butter | `#E07A8A` · `#5B7A6E` · `#F9D56E` |

**Fonts:** tokens name *Plus Jakarta Sans* (display) and *Inter* (body); the RN app currently falls back to the system font ("until custom fonts ship"). The recipient web experience uses *Fraunces* (serif headlines), *Plus Jakarta Sans*, *Inter* and *Caveat* (handwritten letters). The store art uses Fraunces + Plus Jakarta Sans to match what recipients see. All are SIL OFL, free for commercial use.

**Logo / icon (what ships):** Pip, the mascot, big and front-facing on a flat amber field, with a calendar-and-heart badge on his side (concept C3, chosen 13 Oct 2026). One drawing in `docs/store-assets/tools/icon-art.mjs` makes every size: `scripts/generate-app-icons.sh` redraws the layers in `assets/brand/` and writes the iOS set, the Android adaptive, themed and notification icons, the store copies and the website favicon. **Mascot:** *Pip*, an orange blob with a party hat who greets the recipient and reacts when they say "No" (five costumes, one per moment). `[asset][code]`

**Tone (from `product-principles.md` §7 and `AGENTS.md`):** calm, specific, warm, honest. Avoid hype ("amazing", "supercharge", "unlock"), fake friendliness and dark patterns; state what the user gets ("Link works until…"). The recipient side is playful (Pip, jokes), the sender side is calm. Store copy follows the same split: warm and plain, with the playfulness shown in the screenshots rather than shouted in the words.

## 8. Things the project settles that shape the listing

- **Two surfaces, one product.** The *app* is the sender's tool. The thing that delights is a *web page* the recipient opens. Store screenshots must therefore be honest about which is which (labelled "In the app" / "What they open"), and at least half of the frames show real app screens. Apple 2.3.3 asks for screenshots that show the app in use.
- **No account wall** is a genuine differentiator and is true today.
- **No contact import** is a deliberate privacy choice (PRD non-goal), which is a trust point against reminder apps that import contacts, and a friction point against the same apps.
- **Reminder strength is modest on free**: a Vault, a "Coming up" section and widgets; the *push on the day* belongs to the auto-send engine.

## 9. Discrepancies and risks found while reading the code (only you can confirm)

These affect what the listing may claim. Details and the rules I applied are in `03-positioning.md` §5 and `00-summary.md`.

> **Update, 12 Oct:** Pro cards now expire in 365 days and free/credit cards in 30 (`linkTtlDaysFor`). Free is 1 card per account (lifetime), Pro is 24 per rolling year — both enforced on the create API. Auto-send only emails a consented address (or asks the owner to share the link). WhatsApp/SMS are not sold.

1. **Auto-send delivery is email only.** The engine prepares the card and asks for a 2-hour review. If the person has a saved email and they agreed, we email the link after approve (or after the window, when dispatch is on). Otherwise the owner shares the link themselves. WhatsApp and SMS providers are mocks for tests only.
2. **~~"Links active for 365 days" was only true for auto-send.~~ Done.** The create API uses `linkTtlDaysFor`: Pro 365 days, free and single-wish 30 days. Redeploy the website API if this is not live yet.
3. **~~The 1-card-a-month limit is enforced in the app only.~~ Done.** The create API counts `freeCardsUsed` (1 lifetime) and Pro `proCardTimes` (24 / 365 days). Store copy must say that — never "unlimited" or "1 per month".
4. **"Priority support for Pro"** appears in the paywall; no support tooling exists in the repo. → Not used.
5. **Analytics is a stub.** `trackEvent` only logs in `__DEV__`. There is no Firebase Analytics dependency. Without it, activation, share rate and paywall conversion cannot be measured, and the growth plan cannot run. (`src/shared/analytics/events.ts`)
6. **No in-app review prompt exists** (no store-review library in `package.json`).
7. **Reminder timing is India-centric.** The daily job runs at 06:00 Asia/Kolkata and matches the date in IST. For US users the "their birthday is today" push would arrive the evening before. (`vault-blueprint.md`, `cron.ts`)
8. **Privacy policy vs login:** the policy listed phone/SMS sign-in while the login screen offers Apple, Google and email, and the support address in the code was misspelled (`develoepernick1`; the real address is `developernick1@gmail.com`). *Both fixed in the 8 Oct compliance pass; redeploy the website.*
9. **Test content in captured screens:** the native screenshots show a real person's photo in "Choose a frame" / "Preview" (so I did not use those frames), a test person "Nikhil" in the Vault, and a stock group photo in the demo card.
10. **Name:** a similarly named app, *Occasions 3 – Reminders*, exists on the App Store (same birthdays/anniversaries job). Not a blocker, but check "Occasio" availability in App Store Connect and Play Console, and trademark clearance if you have not.
