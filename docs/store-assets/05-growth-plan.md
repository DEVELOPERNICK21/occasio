# 05 · Growth plan

Written as a launch plan, not a wish list. Where a number would need real store or product data, it says so instead of guessing. Targets quoted from the project are marked **(PRD)**.

---

## 0. Before any of this can run: three gaps in the product

| Gap | Evidence | Why it blocks growth | What to do |
|---|---|---|---|
| **No production analytics** | `trackEvent()` in `src/shared/analytics/events.ts` only logs in `__DEV__`; no Firebase Analytics dependency | Activation, share rate, Vault attach and paywall conversion (the PRD's own KPIs) cannot be measured, so no test result can be read past "installs" | Wire `AnalyticsEvents` (already defined) to Firebase Analytics before launch. Store consoles alone cannot tell you whether a winning variant also activates |
| **No rating prompt** | no store-review library in `package.json` | Without one, reviews arrive only from angry users | Add `react-native-in-app-review` (or equivalent) and the triggers in §4 |
| **Link expiry mismatch** | manual cards expire in 30 days; paywall and policy say 365 | Expired links are the likeliest source of 1-star reviews for a product whose promise is "a card they open" | Fix the server or the copy; see `01-app-brief.md` §9 |

*I did not change any code, per your instruction; these are prerequisites for you.*

---

## 1. A/B test order, with a hypothesis for each

**What each store can test.** Apple Product Page Optimization tests **icon, screenshots and app preview only**, not name, subtitle, promo text or description. Google Play store listing experiments test **icon, feature graphic, screenshots, short and full description and video**, not the title. So subtitle tests on iOS are *sequential* (change, wait, compare), which is weaker evidence.

**Ground rules.** One test at a time per store. No tests in launch week or until traffic exists. Run **≥7 days and whole weeks** (weekday/weekend behaviour differs); call a winner only at the tool's confidence threshold (aim for ≥90%). Always read **install → first card shared** and **D7 retention** next to conversion: a variant that wins installs but loses activation is a loss.

**How much traffic?** Illustrative only, because I don't know your baselines: to detect a 10% *relative* lift on a 25% page conversion rate with 80% power you need about **4,900 page views per variant** (n ≈ 7.84·[p₁(1−p₁)+p₂(1−p₂)]/(p₁−p₂)²). If you will not reach that in 4 weeks, test bigger changes (hero image, order) and skip small ones (a word in a subtitle).

| # | Test | Store tool | Change (one variable) | Hypothesis | Primary metric · guardrail |
|---|---|---|---|---|---|
| **1** | **Hero frame** | Play experiments · Apple PPO | Control: current frame 1 (native Create + Pip gate). Variant: full-bleed Pip gate with the candle cake, no native phone | The mascot and cake alone are more instantly "birthday" and "fun" than a two-phone diagram; the cost is losing the "how it works" cue | Page view → install · share rate of installers |
| **2** | **Frame order** | both | Move *Never miss their day* (Vault) from 3rd to 2nd | Reminder-intent searchers decide on utility; for them, "Pop. Blow. Unwrap." is a nice-to-have | Page view → install, **segmented by search term** if the tool allows · Vault attach |
| **3** | **Short description / hook** | Play experiments (iOS: sequential subtitle swap) | Short #1 vs #4 (reminder-led) vs #5 (friction-led); iOS subtitle #1 vs #3 *Cards they’ll love to open* | The best hook is "the other person will love it", not "never forget" | Page view → install (Play); impressions-to-installs 14 days before/after (iOS) |
| **4** | **Icon** | Play experiments · Apple PPO (needs the alternate icon in the app binary) | Control: shipped Gift Heart vs Concept A *Sealed Heart* | A flat envelope + heart says "card" at 29 px, where the 3D ribbon blurs | Tap-through (Apple) / conversion (Play) from *search results*; icon wins often show up there first |
| **5** | **Plan frame** | both | Frame 8 (Free vs Pro) present vs replaced by the Pip-reaction frame earlier | Telling buyers the free limit before install lowers installs slightly but raises paid conversion and cuts "surprise paywall" reviews (the PRD's #1 risk) | **Install → paywall → purchase**, and 1-star share · raw installs |
| **6** | **App preview video** | Apple PPO | Poster frame + 20 s in-app preview vs none | Motion shows "interactive" better than any still | Page view → install |
| **7** | **Promo text (iOS)** | direct swap, no test needed | Promo #1 → seasonal (#3) in the two weeks before Mother's Day, Diwali, Valentine's | Seasonal relevance lifts conversion for traffic that already arrived | Compare to the same weekday the prior week |

*Why this order:* biggest visual lever first (hero), then the sequence the first three frames tell, then words, then the icon (cheap on Play, needs a build on iOS), then the monetisation-framing test once there is enough traffic to see paid conversion, then video. Test 5 comes after 1–4 because it needs analytics and enough installs to see purchases.

---

## 2. Positioning tests that need more than a store experiment

`03-positioning.md` §6 defines angles A (memory), B (effortless/free) and C (relationship). They are tested by **traffic source**, not by the store experiment: run each angle as a **custom product page** (§3) behind its own ad group or link, then compare activation and Vault attach by page.

---

## 3. Custom product pages for the top three audiences

Apple custom product pages (up to 70) are reachable by their own URL and from Apple Search Ads ad groups; Google Play **custom store listings** do the same by URL and country. Confirm in the consoles whether Apple now also lets you attach pages to organic keywords. Each page below reuses the same eight frames in a different order; only the first three and the promo text change.

| | **1 · "Never miss Mom’s day"** | **2 · "Say it with a surprise"** | **3 · "A card that opens anywhere"** |
|---|---|---|---|
| **Audience** | "Forgetful but caring" adult children, 25–45 (PRD persona Ananya) | Expressive partners and friends, 18–30, India-first (persona Rohan) | Long-distance family, partners, friends abroad |
| **Their moment** | The date is close and they have five minutes | They want a surprise, not a forwarded image | They are far away and want to feel present |
| **Traffic** | Ad group on *birthday reminder*, *anniversary reminder*, *never forget birthdays*; Mother’s/Father’s Day | *birthday surprise*, *interactive birthday card*, *anniversary card*; Valentine’s, Friendship Day | *send a card*, *long distance*, *card that opens on any phone*; diaspora Diwali and festival pushes |
| **Frame order** | 3 Vault · 1 hero · 4 taps · 8 plan | 1 hero · 2 Pop/Blow/Unwrap · 6 letter · 7 "No" reaction | 1 hero · 5 five moments · 2 Pop/Blow/Unwrap · 4 taps |
| **Headline overrides** | Frame 1: *Never miss Mom’s day* (Mom/Dad variants) | Frame 1: *A surprise they’ll want to open* | Frame 1: *A card that opens on any phone* |
| **Promo text** | `Save Mom’s birthday once. Make her a card with her photo and your words, and send a private link. Free to start, no account needed.` (131/170) | `Pop balloons, blow out candles, unwrap a 3D gift. Make a surprise for someone you love in a few taps. Free to start, no account.` (128/170) | `They open a private link on any phone: no app, no account. Make a card with your photos and words from anywhere. Free to start.` (127/170) |
| **Success metric** | Install → Vault person added | Install → card shared | Install → card shared to a *different country code* (if analytics can see it) |

**Truthfulness check:** page 1 says "Save Mom’s birthday once" and shows the Vault; it does **not** say Occasio sends it for you. Keep it that way until auto-send is verified.

---

## 4. Where to ask for ratings in the app

Use the **system prompt** (`SKStoreReviewController` / Google Play In-App Review API). The OS limits how often it appears; **never pre-screen by sentiment** ("Do you like the app?" then only happy users go to the store). Both stores prohibit manipulating ratings, and Google's guidance says not to gate. Do not offer rewards for ratings.

| Priority | Moment | Why it is a good moment | Where in the code |
|---|---|---|---|
| **1** | **Second** successful share, after the share sheet closes | The first card has not yet proven the app; by the second, the user has chosen to come back | `ShareSuccessScreen.tsx`, after `Share.share` resolves |
| **2** | After **Approve & send** on a prepared card (once auto-send is live) | Peak "it remembered for me" moment | `ScheduledSendReviewScreen.tsx`, after `handleApprove` |
| **3** | After the **second person is saved** to the Vault | Evidence of commitment to the retention loop | `AddPersonScreen.tsx` save success |
| **Never** | At launch or first run; on any error; at a paywall or when the quota is hit; right after a cancel or delete | The user is blocked or annoyed | n/a |

**Always-visible, non-gating feedback path:** an Account → *Send feedback* row (a `mailto:[SUPPORT EMAIL]`). It sits beside, not in front of, the review prompt, so unhappy users have somewhere to go that is not a 1-star review.

**Rating goal:** ≥ 4.3 before spending on paid acquisition. A rating is a conversion multiplier on both stores (the BirthdayAlarm listing shows 4.7, JibJab 4.8, so a sub-4.3 listing starts behind).

---

## 5. Seasonal and campaign calendar

Use **promotional text** (iOS) and **custom pages / listings** (both), plus **Apple in-app events** (event cards on the product page and in search) and **Play promotional content**. Dates move: confirm each year.

| Campaign | Timing | Angle | Asset change |
|---|---|---|---|
| Diwali | 8 Nov 2026 (check; moves yearly) | Family, thank you, "send light to far-away family" | Promo #3 pattern; frame 5 first |
| Year-end | December | Thank-you cards to people who mattered this year | Thank-you gate as frame 1 |
| Valentine’s Day | 14 Feb | Anniversary and love; rose hue | Page 2; anniversary gate as frame 1 |
| Mother’s Day | 2nd Sunday of May (US/India) | "A card for Mom" | Page 1 with Mom variant |
| Father’s Day | 3rd Sunday of June | "A card for Dad" | Page 1 with Dad variant |
| Friendship Day (India) | 1st Sunday of August | Best friend, humour | Frame 7 first |

Build campaign pages 3–4 weeks ahead; stores need approval time and the lift starts before the day.

---

## 6. Review replies

Reply to **every** review within **48 hours**, in a calm voice; for praise, name what they mentioned. Play replies are limited to **350 characters**; every template below is within it. Replace `[SUPPORT EMAIL]` first. **Do not make promises the product has not kept** (the templates avoid dates and feature commitments).

**Negative or neutral**

| Situation | Reply |
|---|---|
| Paywall: “I wanted it free” | `Thanks for trying Occasio. Your first card is free with no account, and you get 1 free card a month after that. Paid plans and single cards help us keep the service running. If the paywall wording felt unclear, tell us at [SUPPORT EMAIL] and we will fix it.` (257/350) |
| Link expired | `We are sorry the link stopped working. Card links currently stay open for 30 days after you create them. If a card matters to you, email [SUPPORT EMAIL] with the name on it and we will look into it.` (198/350) |
| Crash or bug | `Thank you, and sorry about that. Could you email [SUPPORT EMAIL] with your phone model, the Occasio version (Account tab) and what you tapped just before it happened? We will reply here once it is fixed.` (203/350) |
| Missed reminder or send | `We are sorry, that is exactly what Occasio should prevent. Please email [SUPPORT EMAIL] with the person’s name and date so we can check what happened, and make sure notifications are on for Occasio in your phone settings.` (221/350) |
| Charged or cannot restore | `Sorry for the trouble. Purchases are handled by the App Store or Google Play. Try Account > Restore purchases. If you were charged by mistake, email [SUPPORT EMAIL] with the receipt. You can cancel any time in your store subscription settings.` (243/350) |
| Privacy worry | `Fair question. Card links are unlisted and open only for people you share them with, you can lock a card with a passcode, and you can delete your account and data inside the app. We do not read your contacts. Details: occasio-greetings.vercel.app/privacy` (254/350) |
| Feature request or language | `Thank you, this is useful. Occasio is English-only today and we will keep this in mind. We read every suggestion at [SUPPORT EMAIL], so please send anything else you would like to see.` (184/350) |

**Positive**

| Situation | Reply |
|---|---|
| Praise | `Thank you, this made our day. If you have a favourite moment or look, tell us at [SUPPORT EMAIL]. We read everything when choosing what to build next.` (150/350) |

*Why these shapes:* each acknowledges, gives one concrete next step, and offers a person to write to. Public replies are read by future installers more than by the reviewer, so a calm, specific answer to a bad review is itself conversion copy. Never ask the reviewer to change their rating.

---

## 7. Metrics to track weekly

**Rhythm:** 30 minutes every Monday. Log the same cells in one sheet so trends are visible. **Never read a number from the first 7 days after a change.**

### A. Store funnel (consoles; available from day 1)
| Metric | Source | Why |
|---|---|---|
| Impressions → product page views → installs (conversion at each step) | Apple App Analytics · Play Console | Impressions-to-views = icon/title/subtitle/first-3-frames; views-to-installs = the page |
| Installs by source (search, browse, web referrer, ads) | same | Which CPP or campaign is working |
| Rank for 10 target keywords: *birthday reminder, birthday card, birthday cards app, birthday wish app, anniversary reminder, interactive birthday card, personalized birthday card, ecard app, thank you card app, birthday widget* | manual or an ASO tool | The only way to see if metadata work changes ranking |
| Rating average and count; share of 1-star; reply time | consoles | Target ≥ 4.3 before paid spend |
| Crash-free sessions, ANR rate | Play vitals · Xcode Organizer | A broken release erases every other gain |

### B. Product funnel (needs the analytics prerequisite in §0)
| Metric | Definition (existing event names) | Reference |
|---|---|---|
| **Activation** | `create_started` → `photos_added` → `preview_opened` → `card_shared` within 24 h of install | First share link created is the PRD's activation (persona doc) |
| **Share rate** | % of installers with ≥1 `card_shared` | |
| **Vault attach** | % of card creators with ≥1 `vault_person_added` | The PRD's leading indicator of long-term revenue |
| **Paywall funnel** | `paywall_shown` → `purchase_started` → `subscribe_success` / `subscribe_failed` | Free → paid **3–6% by day 90 (PRD)** |
| **Single-card purchases** | `wish_credit_used` | Shows whether the consumable is a ladder to Pro or a substitute |
| **Retention** | D1, D7, D30: return or Vault interaction | Defined in the PRD as D7/D30 |
| **Sign-in friction** | `soft_auth_shown` → `sign_in_success` | Is the soft wall costing Vault conversions? |
| **Account deletions** | `account_deleted` | A rising line is a trust signal |
| **Auto-send (once live)** | Review sends opened, approved, cancelled; delivery success | **>98% delivery (PRD)** is the bar; a missed send is the product's trust risk |
| **Recipient → sender** | Taps on "Make one on Occasio" on the recipient page → installs | The PRD's growth loop; needs a web event and attribution |

### C. Quality and business
Refund rate and "charged unexpectedly" mentions; support emails per 100 installs; revenue per install; monthly churn on Pro; share of reviews mentioning *expired*, *paywall*, *reminder*.

### Weekly scorecard (copy into a sheet)

| Week | Impr. | Page views | Installs | Views→install | Share rate | Vault attach | Paywall→buy | 1-star % | Rating | Notes / change shipped |
|---|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | | |

*Targets:* set them after four weeks of data. The only numbers in this plan that come from the project are the PRD's: free→paid 3–6% in 90 days, auto-send delivery >98%, and Vault attach as the leading KPI.

---

## 8. Launch sequence (suggested)

| When | Do |
|---|---|
| **Before submit** | Fix the §0 gaps; replace `[PRICE]` and `[SUPPORT EMAIL]`; confirm `/privacy`, `/terms`, `/delete-account`, and the demo card URL load; retake `vault.jpg` and any frame with a real person's photo (`04-listing.md` §C2) |
| **Day 0** | Ship the listing as in `04-listing.md` with the **safe-now** copy. Personally message 20–30 people who will actually use it; ask them for honest feedback, not 5 stars |
| **Weeks 1–2** | No tests. Reply to every review. Read the funnel and the 1-star reasons. Fix anything crashing |
| **Weeks 3–6** | Tests 1 → 2 → 3 (§1), one at a time. Create custom page 1 or 2, matched to whichever ad group or link you can drive traffic to |
| **After auto-send is verified live** | Add the **[ADD AFTER VERIFIED]** blocks, swap in subtitle #2 and the Review-send frame (C2 #3), and test the reminder-led angle A |
| **Ongoing** | Seasonal swaps (§5); ASO rank log; quarterly review of screenshots against the competitors in `02-research.md` |
