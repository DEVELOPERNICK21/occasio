# 00 · Summary: Occasio store assets

**Position in one line:** *Be the one who remembered, with a card they'll want to open.* Occasio is the birthday-card app where the recipient **plays** the card (balloons, candles, a 3D gift, a letter) and the sender's dates are remembered, free to start with no account.

Everything is in this folder (`/docs/store-assets/`). **Pass 1 changed no app code. Pass 2 (Apple compliance, after your App Store Connect screens) did**, and `06-apple-submission.md` §2 lists every file touched. An earlier pass already exists in `/store-assets/` (listing drafts and a 10-slide set); I read it, kept what held up, and did not touch it. This set replaces it where they differ (see "What changed vs the earlier set").

## Files

| File | What it is |
|---|---|
| `01-app-brief.md` | What the app is, from the code: platforms, IDs, tiers, brand, and 10 discrepancies I found |
| `02-research.md` | 7 competitors, the gap, 46 keywords by intent, official limits and image specs for both stores |
| `03-positioning.md` | Statement, promise, pillars, the **claims gate**, 3 alternative angles, voice |
| `04-listing.md` | Every field for both stores (3 names, 5 subtitles/shorts, keywords, promo, descriptions), the 8-frame storyboard, video script, icon concepts, IAP names, localization |
| `05-growth-plan.md` | Test order with hypotheses, 3 custom product pages, rating-prompt spots, review replies, weekly metrics |
| **`06-apple-submission.md`** | **Read before you submit to Apple:** your App Store Connect form field by field, the guideline-by-guideline audit, the code fixes made, Sign in with Apple and deletion setup, a smoke-test script |
| `images/` | **Built and size-verified:** App Store icon, iPhone 6.3″ (this is the slot your console shows) and 6.9″ screenshots (8 each), **header and search-results assets**, Play icon, feature graphic, Play screenshots (8), icon concepts |
| `metadata/` | `metadata.json` (all limited fields), the two full descriptions, and **`en-US/app-store-connect/`: one paste-ready file per App Store Connect field** (name, subtitle, promo, keywords, description, URLs, copyright, review notes) |
| `tools/` | The build scripts and source screens, so any headline or frame can be changed: `node tools/build.mjs && python3 tools/finalize.py`; limit checks: `python3 tools/check-limits.py`, `python3 tools/verify-doc-counts.py` |

## What to ship first

**1. Ship the safe-now listing, in this order**

0. **Rebuild the iOS app and redeploy docs-site** (this pass changed both), then follow `06-apple-submission.md` §4–§6.
1. Fix the three things that block honest selling (below, "Only you can confirm", items 1–3).
2. Upload from `images/`: the **6.3″ set into the "iPhone with Dynamic Island (medium display)" slot** (your console lists 1206×2622) and optionally the 6.9″ set; the 1024 icon is already in the build; the header/search assets are optional (App Store). Play: icon 512, feature graphic, 8 phone screenshots.
3. Paste from `04-listing.md`: iOS name ★ `Occasio: Birthday Cards`, subtitle ★ `Remember dates. Send wishes.`, keyword set 1, promo text 1, description (A5); Play title ★ `Occasio: Birthday Wish Cards`, short ★ #1, full description (B3).
4. Fill `[PRICE]` and `[SUPPORT EMAIL]`. Paste the reviewer notes (A6). Answer the privacy/data-safety forms as in A6 and B5.
5. Keep the **[ADD AFTER VERIFIED]** blocks out until auto-send has run end to end on a production build.

**2. Then, with traffic** (not before week 3): run the tests in `05-growth-plan.md` §1 in order: hero frame → frame order → short description/subtitle → icon (Concept A vs the shipped icon) → plan frame → preview video.

**3. When auto-send is verified live:** add the "On their day" blocks, switch the subtitle to #2, retake the Vault and add the Review-send frame (`04-listing.md` C2).

## What changed vs the earlier set in `/store-assets/`

| Earlier pass | This pass | Why |
|---|---|---|
| Title `Occasio: Birthday Wish Cards` on both stores | iOS `Occasio: Birthday Cards` + subtitle `Remember dates. Send wishes.`; Play keeps the longer title | Avoids spending "wish" twice on iOS; Play has no subtitle so the title does more work |
| 10 frames, 7 of them the recipient's web page | 8 frames, 4 real app screens, labelled "In the app" / "What they open" | Apple 2.3.3 wants the app in use |
| Seven hues, including violet, blue and teal | Four brand hues (coral, amber, rose, sage) | The project's own rules say calm, on-brand, no purple |
| Screens with a real person's face used | Those frames removed from the set | Likeness and consent |
| Auto-send described as "prepares the card for you on the day" | Held behind a claims gate with ready-to-paste blocks | The engine is not verified end to end |
| No plan frame | Frame 8 states Free vs Pro before the paywall | Protects ratings, pre-qualifies buyers |

## Apple compliance pass (added 8 Oct)

You asked me to check Apple's guidelines against the app and make it approvable. Result, in one table; the full audit is `06-apple-submission.md`.

| Fixed in code (typecheck clean, 218 tests pass, nothing committed) | Still needs you before you submit |
|---|---|
| Account deletion now **revokes the Sign in with Apple token** and warns subscribers that billing continues | Add the **Apple key to Firebase** (Team ID, Key ID, .p8) or Apple users cannot delete, and test on a real iPhone |
| Removed developer text in user alerts ("RevenueCat", "rebuild", "coming soon"), three dead switches, and a **false "concierge team 24/7" claim** | Create the **demo account** and fill Review Information |
| Removed the false **"year-long links"** claim from the Account screen | Put the **auto-renew text, price, period, Terms and Privacy links** in the RevenueCat paywall template |
| Added **Terms of Service** next to Privacy in the app; honest Help card | Make products "Ready to Submit", attach to the version, add paywall review screenshots; Paid Apps Agreement and tax |
| Added **"Report this card"** on every recipient page (Guideline 1.2) | **Redeploy docs-site** to Vercel (report link, policy and deletion page are web changes) |
| Privacy policy and delete-account page rewritten to match the app | Replace the support email; hide the Play "internal test" buttons on the landing page; confirm the production backend is live |
| Removed an empty location purpose string; added the export-compliance key | Confirm Sign in with Apple, Push and App Groups on both App IDs |

## Assumptions I made

1. **Both stores ship**, Play first (the repo's stated first target is Play production, US). iOS is iPhone-only as built.
2. **English only.** The app has no localisation, so the shipping set is English. Hindi is a labelled draft for later, not shipped.
3. **Pro is the only paid tier.** The PRD's "Family" tier has no product behind it, so it is not in the listing.
4. **Prices are not in the project.** I recommend the PRD's ₹149/₹999 for India and about $19.99/year for the US as a *starting point*; they are my suggestion, not a fact.
5. **Feature ranking** (what users would pay for) is my judgement; there is no purchase data.
6. **Primary audience** is the PRD's personas (India-first 18–35 and "forgetful but caring" adult children), with a US launch.
7. **"1 free card a month"** is the intended free limit and is what the app enforces on the client (the server does not enforce it).
8. **Competition levels** for keywords are my estimates; I had no ASO tool or search-volume data. `02-research.md` §5 says how to replace them with real numbers.
9. **Play screenshots** use iOS-captured native screens inside an Android-style frame, and the recipient pages are web captures. Fine for review, not strictly Android.
10. **Export compliance, age rating and category choices** in `04-listing.md` §A6/B5 are my best reading, to be confirmed in the consoles.

## Only you can confirm (blockers first)

1. **Link lifetime.** Manual cards expire after **30 days** for everyone; the paywall says "365 days" and the privacy policy says "up to 365". Which is true at launch? Fix the server or the words. I kept 365 out of all store copy.
2. **Support email.** `develoepernick1@gmail.com` appears on the policy and will be public on both listings. It looks like a typo of "developer". Decide the address you will keep.
3. **Analytics and a rating prompt.** Production analytics is a stub and there is no review prompt. Without analytics no growth test can be read; see `05-growth-plan.md` §0.
4. **Is auto-send live and verified in production?** (cron deployed, push working, a real approve-and-send done). Is `OCCASIO_AUTOSEND_DISPATCH` on? Which channels are real? Until you can say yes, the listing sells reminders plus a prepared-card review flow, not delivery.
5. **Reminder time zone.** The daily job runs at 06:00 India time; for US users "their birthday is today" arrives the evening before. Fine for India-first; decide before a US push.
6. **Prices** for each product in each country, and whether you want an introductory offer.
7. **Final IDs.** iOS `com.occasio.ios` vs Android `com.occasio.greetings`; they are permanent once published. Also check `aps-environment` is `production` in the release build and that the RevenueCat `appl_`/`goog_` products exist.
8. **Name.** "Occasio" availability and trademark in both stores (a similar app, *Occasions 3 – Reminders*, exists).
9. **Live URLs.** `/privacy`, `/terms`, `/delete-account` and the demo card `…/c/demo-birthday-maya-1408` must load in production. The privacy policy still lists phone/SMS sign-in; the login screen offers Apple, Google and email.
10. **Likeness and photos.** The native captures contain the name "Nikhil" and one real person's photo (I did not use those frames), and the demo card uses a stock group photo. Use photos you own or have consent for in any retake.
11. **Widgets.** The code has iOS and Android widgets; confirm they are in the release builds before the listing mentions them (it does, in two lines).
12. **Housekeeping, unrelated to the listing:** the folder `../IMP/` next to the project holds a Firebase Admin service-account key and an Android upload keystore. I did not open them. Keep them out of any repo and out of backups you share.

## How I checked my own work

- Every limited field is machine-checked against the stores' limits (`tools/check-limits.py`), and every character count printed in the docs is re-verified against the string beside it (`tools/verify-doc-counts.py`).
- All images are opaque and exact-size (`tools/finalize.py` fails otherwise); I looked at each set at overview size and the hero and plan frames at full size.
- Limits and specs were read from the stores' own pages on 8 Oct 2026 (sources are linked in `02-research.md`). The two limits I could only get from secondary sources (Play release-notes length, Play subscription name length) are marked "confirm in the console".
- I could not see competitor screenshots as images except BirthdayAlarm's; the others are read from text or asset file names, and the doc says so.
