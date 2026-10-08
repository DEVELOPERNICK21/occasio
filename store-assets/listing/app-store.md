# App Store — listing, field by field

Limits are checked by `python3 tools/check-listing.py`. `[...]` are things only you can fill.

## Version metadata (en-US)

| Field | Limit | Value |
|---|---|---|
| Name | 30 | `Occasio: Birthday Wish Cards` (28) |
| Subtitle | 30 | `Reminders & Surprise Greetings` (30) |
| Promotional text | 170 | `Send a card they'll want to open: pop balloons, blow out the candles, unwrap a 3D gift, read your letter. Save the people you love and never miss a date.` (153) — editable any time without a new build, so use it for seasonal pushes |
| Description | 4000 | [`app-store-description.en-US.txt`](app-store-description.en-US.txt) (2,127) — includes the required subscription disclosure |
| Keywords | 100 | `anniversary,thanks,congrats,photo,ecard,interactive,vault,remember,gift,love,family,mom,dad,partner` (99) |
| Support URL | — | `https://occasio-greetings.vercel.app` |
| Marketing URL | — | `https://occasio-greetings.vercel.app` |
| Privacy Policy URL | — | `https://occasio-greetings.vercel.app/privacy` |
| Terms of Use (EULA) | — | `https://occasio-greetings.vercel.app/terms` (also linked in the description) |
| Copyright | — | `© 2026 [LEGAL NAME]` |

Keywords deliberately omit every word already in the name/subtitle (birthday, wish, cards, reminders, surprise, greetings) — Apple indexes those for free.

## Assets

| Slot | File |
|---|---|
| App icon (1024×1024, opaque) | `out/app-store/app-icon-1024.png` |
| iPhone 6.9″ screenshots (up to 10) | `out/app-store/iphone-6.9/01…10` — 1320×2868 |
| iPhone 6.5″ screenshots (optional — Apple scales the 6.9″ set down) | `out/app-store/iphone-6.5/01…10` — 1284×2778 |
| iPad | Not needed: the project is iPhone-only (`TARGETED_DEVICE_FAMILY = 1`) |
| App Preview video | Skipped on purpose: previews must be captured from the app on-device; the recipient experience is a web page. Record one from the native create flow if you want it. |

## Categories & rating

- **Primary:** Lifestyle · **Secondary:** Photo & Video (frames/photo cards). Avoid Social Networking — it invites extra UGC-moderation scrutiny the app doesn't need.
- **Age rating:** answer honestly; user-generated content is shared by private link. Expect 4+ (or 12+ if the questionnaire flags unrestricted UGC).
- **Privacy "nutrition label":** Contact info (email), User content (photos, text), Contacts-like data (names/dates of people in the Vault — third-party personal data), Identifiers (push token), Purchases. Linked to the user; not used for tracking unless you add an ad/attribution SDK.

## Subscription setup (App Store Connect)

- One subscription group "Occasio Pro" with monthly and yearly products matching `occasio_pro_monthly` / `occasio_pro_yearly`; localise display names.
- Review screenshot of the paywall; the paywall must show price, period, auto-renew text and links to Terms + Privacy.
- Add "Restore purchases" (already on the Account screen).

## Review notes

Paste the **Reviewer / App-access notes** block from [`aso-strategy.md`](aso-strategy.md#reviewer--app-access-notes-paste-into-both-consoles).

## What's new (1.0)

```
Welcome to Occasio. Make a card they'll want to open — pop balloons, blow out candles, unwrap a 3D gift and read a letter — and save the people you love so you never miss a date.
```
