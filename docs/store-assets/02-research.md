# 02 · Market and keyword research

Research date: **8 October 2026**. Store pages and policies were read live; where I could only see text, not images, I say so. **I had no ASO tool (Sensor Tower, AppTweak, Apple Search Ads popularity, Play Console search terms), so I have no search-volume numbers.** Keyword "competition" below is my judgement from who ranks and how large they are; treat it as a hypothesis and validate it with the steps in §5 before you spend money on it.

---

## 1. Competitors

Seven apps, chosen because a user typing the queries in §4 would meet them. They fall into three camps.

| # | App (store title) | Subtitle / short pitch | Camp | Price (as listed) | Rating |
|---|---|---|---|---|---|
| 1 | **BirthdayAlarm: Reminders Cards** (iOS, Lifestyle) | "Countdown, Wishes & eGifts" | Reminder + cards | Free; monthly **$4.99**, annual **$29.99** (listing mentions a 30-day free trial) | 4.7 · 1K ratings |
| 2 | **JibJab: Fun Ecards, GIFs & AI** (iOS, Entertainment) | "Funny Greeting Cards, GIFS, AI" | Funny e-cards, video, AI | Free; IAP from $2.99; subscriptions seen at **$6.99/mo** and **$35.99/yr** | 4.8 · 263K ratings |
| 3 | **Givingli: Send Gifts & Cards** (iOS) | "Digital Greetings & Gift Cards" | Cards + gift cards | Free plan; Premium **$7.99/mo** or **$47.99/yr** (third-party price aggregator; verify) | not checked |
| 4 | **Paperless Post: Invitations** (iOS) | Invitations and e-cards, sold by "coins" | Formal invites/cards | Coin packs from **$12 (25 coins)** up to ~$141 (1,000 coins) (third-party aggregator; verify) | not checked |
| 5 | **MyHeartCraft** (web, myheartcraft.com; the PRD's named competitor) | "Turn special moments into gamified digital gifts and cards" | Interactive link cards | **From $4.99 per creation**; no subscription seen | n/a (web) |
| 6 | **Birthday Countdown & Widget** (iOS, Utilities) | "Reminders, Calendar, Contacts" | Pure reminder utility | Free; Premium **$2.99** | 4.8 · 72 ratings |
| 7 | **Birthday Countdown • Reminders** (iOS, Lifestyle) | "Calendar, Widgets & Timers" | Pure reminder utility | Free; Premium $0.99 (1 week) / $2.99 (1 month) | 5.0 · 2 ratings |

### How each one positions itself

1. **BirthdayAlarm.** Lead promise "Never miss a birthday!" Strong on *reminders*, *contact import*, a very large catalogue of generic online cards, group cards and eGifts. Its screenshots (I viewed the page): **#1** "Never Miss a Birthday" over a collage of illustrated cards with a reminder-notification banner on top; **#2** a carousel of "Upcoming reminders" date cards with a "Send a card now" button; **#3** "Import 83 birthdays" from the phone's contacts; **#4** a home-screen widget. *Read:* utility-first, generic card art, no personalisation story, no sense of the *moment the recipient has*.
2. **JibJab.** Comedy: put your face in a dancing video, "Starring You" AI photo packs, 1,500+ ecards/GIFs per its listing. Screenshot file names on the page (not visually inspected) say the first three are *Ecards feature*, *Cast yourself in a birthday video*, *AI image pack*. *Read:* entertainment, funny, not sentimental, not about remembering.
3. **Givingli.** Sends a card plus a gift card; premium positioning, higher price. *Read:* the card is a wrapper for a gift.
4. **Paperless Post.** Invitations first; cards are an add-on; coin pricing is confusing. *Read:* formal, occasion-planning, not personal and not a reminder.
5. **MyHeartCraft.** The closest idea to ours: an interactive link the recipient opens, templates for birthday, anniversary, sorry, proposal, no app for the recipient, QR codes. Pay per creation, no memory of the relationship. *Read:* they do the "gamified card"; nobody remembers the date for you. (Whether they also have a store app I could not confirm from search.)
6–7. **Birthday countdown utilities.** Counters, calendar, widgets; premium unlocks at $0.99–$2.99. *Read:* the reminder job done cheaply, with no way to *do* anything on the day.

First-three-screenshot patterns across the set: headline over a busy collage of card art (BirthdayAlarm, JibJab); a notification or countdown UI (utilities). **Nobody leads with the recipient's reaction or with a mascot.**

### Naming collision to know about

*Occasions 3 – Reminders* (Hand Carved Code) is on the App Store and does birthdays/anniversaries reminders. A distinct name, but searchers typing "occasions" may land on either. Keep the word "Occasions" out of metadata, and check "Occasio" availability and trademark yourself.

---

## 2. The gap we can own

```
                     makes the moment personal & playful
                                   ▲
              MyHeartCraft ●       │       ★ Occasio (target)
              (interactive, web,   │       (interactive + remembers dates,
               pay-per-card,       │        free to start, no account)
               no memory)          │
   ─────────────────────────────── ┼ ───────────────────────────────►
   forgets the date                │                     remembers the date
              JibJab ● Givingli ●  │   ● BirthdayAlarm (reminder + generic cards)
              Paperless Post ●     │   ● Birthday Countdown apps (reminder only)
                                   ▼
                          generic / forwarded image
```

**The gap in one line:** *remembering* and *making it personal* live in different apps today. Reminder apps tell you the date and hand you a generic card; card apps make something clever but never bring you back next year.

**What we can honestly claim that the set cannot:**

| Claim | True today? | Closest rival |
|---|---|---|
| The recipient *plays* the card (balloons, candles, 3D gift, letter), with no app or account for them | Yes | MyHeartCraft (web, paid per card) |
| Create and share your first card with **no account** | Yes | Few of the apps above allow it |
| Free to start with a real free tier | Yes (1 card a month, 1 saved person) | MyHeartCraft charges from the first card |
| Saves the dates of the people you care about, with widgets | Yes | BirthdayAlarm and the countdown apps do this better on volume and contact import |
| Card prepared for you on the day, you review and send | **Built, not verified end to end** | None found. Hold this back until verified (`03-positioning.md` §5) |
| Privacy: no contact scraping, unlisted links, passcode lock, in-app account delete | Yes | Reminder apps that import contacts |

**What we should not fight on:** catalogue size (BirthdayAlarm), comedy/video (JibJab), gift cards (Givingli), formal invitations (Paperless Post), contact import. The pitch is *one thoughtful card, remembered on time*, not *a thousand cards*.

**Price headroom (context, not a recommendation of fact):** competitors' annual plans sit at $23.99–$47.99; the PRD's India targets (₹149/mo, ₹999/yr) and a US yearly in the low-to-mid $20s would undercut them. A pay-per-creation rival at $4.99 means a single extra card should cost clearly less than that.

---

## 3. Demand signals (Google autocomplete, 8 Oct 2026)

Not store search volume, but a free proxy for how people phrase the need. Suggestions returned for each seed:

| Seed | What people also type |
|---|---|
| birthday reminder app | …free · for android · for iphone · ios · reddit · for pc |
| birthday reminder widget | …iphone · "app & widget" · "how do i set birthday reminders on my phone" |
| birthday card app | …free · download · for iphone free · for android · application |
| personalized birthday card online | …free · customize … online · customize … with photo · personalised … uk |
| interactive birthday card | …online · free · website · template · maker · **code** · free download |
| send birthday wishes app | …**"app to send birthday wishes automatically"** · free app to send birthday wishes · send birthday card app |
| thank you card app | …for iphone · free · apple |
| birthday surprise for girlfriend online | …gift · ideas · "how can i surprise my girlfriend online" |

Readings: (a) reminder queries are *platform-specific* ("for iphone", "for android"), so the store title/subtitle should say "reminder" plainly. (b) "Interactive birthday card" is a real query family that is **web-first today**, so an app that owns it faces thin competition. (c) "…automatically" shows appetite for auto-send, but we cannot use that wording until it ships (see `03-positioning.md` §5).

---

## 4. Keywords (46), grouped by intent

**Relevance:** H = the app does exactly this today · M = adjacent, honest to include · L = tempting but weak or risky.
**Competition (estimate):** VH/H/M/L, based on incumbent strength. **Use:** T title · S subtitle · K iOS keyword field · D description (both stores) · P Play short description · — skip.

### A. Reminder intent (utility)
| # | Keyword | Rel | Comp | Use | Note |
|---|---|---|---|---|---|
| 1 | birthday reminder | H | H | K (+T/S combine) | Core utility query; platform variants dominate suggestions |
| 2 | birthday reminder app | H | H | D, P | Phrase match from title + keyword "reminder" |
| 3 | anniversary reminder | H | M | K, D | Vault supports anniversaries; fewer rivals than "birthday" |
| 4 | birthday countdown | M | H | D | We show days-until, not a countdown timer product |
| 5 | birthday widget | H | M | K, D | iOS + Android widgets exist |
| 6 | upcoming birthdays | M | M | D | Matches the "Coming up" section |
| 7 | never forget birthdays | H | L | D, P | Long-tail; matches the pain |
| 8 | important dates | M | M | D | Broad; do not lead with it |
| 9 | birthday calendar | L | H | — | We are not a calendar; attracts wrong intent |

### B. Card / e-card intent
| # | Keyword | Rel | Comp | Use | Note |
|---|---|---|---|---|---|
| 10 | birthday card | H | VH | T | Biggest head term; the title carries it |
| 11 | birthday cards app | H | H | D, P | |
| 12 | ecard / e-card | H | H | K | Single word "ecard" in keyword field |
| 13 | greeting card | M | H | K | Matches "greeting" |
| 14 | digital card | H | M | D | |
| 15 | personalized birthday card | H | M | K | Autocomplete shows "personalized/customize … with photo" |
| 16 | animated birthday card | M | M | D | Cards are interactive/animated; do not oversell video |
| 17 | interactive birthday card | H | **L** | K, D | Strongest differentiator query; web-first today |
| 18 | photo birthday card | M | H | D | |
| 19 | anniversary card | H | M | K, D | |
| 20 | thank you card | M | H | K ("thank"), D | |
| 21 | congratulations card | M | M | K ("congrats"), D | |
| 22 | card maker | L | VH | — | Generic; draws photo-editor intent |

### C. Wishes intent (strong in India)
| # | Keyword | Rel | Comp | Use | Note |
|---|---|---|---|---|---|
| 23 | birthday wishes | H | VH | S | Subtitle "Send wishes" |
| 24 | birthday wish app | H | H | D, P | |
| 25 | send birthday wishes | H | H | S, D | |
| 26 | happy birthday | M | VH | D | Too broad to chase |
| 27 | birthday greetings | M | H | K ("greeting") | |
| 28 | wishes for mom / dad | M | M | D | We offer Mom/Dad audiences |

### D. Surprise / relationship intent
| # | Keyword | Rel | Comp | Use | Note |
|---|---|---|---|---|---|
| 29 | birthday surprise | H | M | K | The card is a surprise they unwrap |
| 30 | surprise for partner | M | M | D | Use "partner", not gendered long-tails |
| 31 | romantic card / love card | M | H | K ("love") | Anniversary + partner audience |
| 32 | long distance | M | L | D | Honest: shareable link works anywhere |
| 33 | mom birthday | M | M | K ("mom") | |
| 34 | dad birthday | M | M | K ("dad") | |
| 35 | best friend birthday | M | M | D | "Best friend" is an audience tile |
| 36 | family birthdays | M | M | D | |

### E. Format / feature intent
| # | Keyword | Rel | Comp | Use | Note |
|---|---|---|---|---|---|
| 37 | pop balloons / blow candles | M | L | D | Ownable, descriptive, cute |
| 38 | 3D gift | M | L | D | Real 3D scene |
| 39 | private link | M | L | D | Trust cue |
| 40 | no account / no sign up | M | L | D | True; strong with install-friction-averse users |
| 41 | photo card | M | H | K ("photo") | |
| 42 | birthday photo | L | VH | — | Photo-frame / editor apps own it |

### F. Do-not-use (policy or relevance)
| # | Keyword | Why |
|---|---|---|
| 43 | whatsapp birthday wishes | Third-party trademark in metadata (Apple Guidelines 2.3 and 5.2; Play metadata policy). Say "any messaging app" |
| 44 | instagram story / status | Same |
| 45 | free / best / #1 / top | Prohibited ranking and price claims (Play); Apple rejects as misleading |
| 46 | gift cards, send money, e-gift | We do not sell gifts; irrelevant and misleading |

**Where it lands:** Title *Occasio: Birthday Cards*; subtitle *Remember dates. Send wishes.*; iOS keyword field `reminder,anniversary,greeting,ecard,personalized,surprise,interactive,photo,thank,congrats,widget` (97/100 bytes, no repeated title/subtitle words). Apple combines words across title, subtitle and keywords, so "birthday reminder", "birthday wishes", "anniversary card", "interactive card" are all formed without repeating anything.

---

## 5. How to validate the keyword guesses (do this before paying for installs)

1. **Apple Search Ads Advanced → Keyword recommendations / popularity** (free to open, no spend needed): note the 5–100 popularity for rows 1, 5, 10, 12, 15, 17, 23, 24, 29. Replace any keyword under ~20 popularity with the next candidate.
2. **Play Console → Statistics → Store listing acquisition → Search terms** (after the first weeks) and **Apple App Analytics → Sources → App Store Search** (after ~1,000 impressions).
3. **Autocomplete in each store's own search box** (type the seed, record suggestions).
4. After 4 weeks, rank each target keyword manually from a clean device and log it weekly (`05-growth-plan.md` §6).

---

## 6. Official limits and image specs (read from the stores' own pages, 8 Oct 2026)

### Apple App Store (App Store Connect)
| Field | Limit | Notes |
|---|---|---|
| App name | 30 characters | Indexed. Must be unique in the store |
| Subtitle | 30 characters | Indexed |
| Promotional text | 170 characters | Editable any time without a new build; not indexed |
| Description | 4,000 characters | Plain text; **not indexed**; must carry subscription disclosure if you sell subscriptions |
| Keywords | **100 bytes** total, comma-separated | Bytes, not characters (matters for Hindi/Devanagari). No spaces after commas; don't repeat title/subtitle words; plurals are matched automatically |
| What's New | 4,000 characters | |
| App Review notes | 4,000 bytes | |
| Support URL / Marketing URL | required / optional | Support URL must lead to real contact info |
| IAP / subscription display name · description | 30 · 45 characters | |
| Screenshots | 1–10 per size, `.png/.jpg/.jpeg`, **no alpha** | **Required: at least one set for iPhone with Dynamic Island (medium display): 1179×2556 or 1206×2622.** Larger accepted sizes include 1260×2736, 1290×2796, **1320×2868 (6.9″)**. Apple scales your largest set down if the UI is consistent |
| App Preview video | 15–30 s, up to 3 per size/locale, ≤500 MB, H.264 (10–12 Mbps, ≤30 fps) or ProRes 422 HQ, stereo AAC | iPhone portrait **886×1920** (Dynamic Island / Face ID displays). Must be captured **from the app** (no stock footage or pure motion graphics) |
| Icon | 1024×1024 PNG, **no alpha**, no rounded corners | |

Sources: [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) · [App preview specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications) · [Platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information).

### Google Play Console
| Field | Limit | Notes |
|---|---|---|
| App name (title) | 30 characters | Indexed and the heaviest-weighted field |
| Short description | 80 characters | Indexed; shown above the fold |
| Full description | 4,000 characters | Indexed; repeat important phrases naturally (3–5×), no stuffing |
| What's new (release notes) | 500 characters per locale | (from Play Console; confirm in the console) |
| Subscription name | 55 characters | |
| App icon | **512×512, 32-bit PNG (alpha allowed), ≤1,024 KB** | No badges, ranking, price or category text |
| Feature graphic | **1024×500**, JPEG or 24-bit PNG, **no alpha** | Required to publish; keep text out of the edges |
| Phone screenshots | **2–8**, JPEG/24-bit PNG, no alpha, each side 320–3,840 px, long side ≤2× the short side | Recommended: ≥4 at 1080 px minimum, 9:16 (1080×1920) |
| Promo video | YouTube URL (public or unlisted, ads off, not age-restricted) | Optional |

**Metadata policy (Play):** no ranking/price/performance claims ("Best", "#1", "Top", "New", "Sale", "Free"), no "Download now" calls to action, no emoji or special characters, no ALL-CAPS emphasis, no repeated keywords for manipulation.
Source: [Add preview assets](https://support.google.com/googleplay/android-developer/answer/9866151) (also read: Google Play Developer Policy Center → *Store Listing and Promotion*).

### Guardrails applied to every string in `04-listing.md`
No competitor or third-party trademarks (WhatsApp, Instagram, JibJab…) in title, subtitle or keywords. No "best/#1/free/top" in titles. No emoji in titles/subtitles. No fake reviews, awards or user counts. Screenshots show real app screens and say plainly when they show the recipient's web page.
