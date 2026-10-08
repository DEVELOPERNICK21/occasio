# Google Play — listing, field by field

Limits are checked by `python3 tools/check-listing.py`. Text below is copy-paste ready; `[...]` are things only you can fill.

## Main store listing (en-US; reuse for en-IN/en-GB)

| Field | Limit | Value |
|---|---|---|
| App name | 30 | `Occasio: Birthday Wish Cards` (28) |
| Short description | 80 | `Never miss a birthday. Send interactive cards they'll love to open.` (67) |
| Full description | 4000 | [`play-description.en-US.txt`](play-description.en-US.txt) (1,781) |
| App icon | 512×512 PNG | `out/google-play/app-icon-512.png` |
| Feature graphic | 1024×500 | `out/google-play/feature-graphic-1024x500.png` |
| Phone screenshots | 2–8, 9:16 | `out/google-play/phone/01…08` (1080×1920) |
| Tablet screenshots | optional | Skip until the app is laid out for tablets |
| Promo video | YouTube URL | Optional — storyboard below |

## Categorisation

- **App category:** Lifestyle (Play has no "greeting cards" category; Lifestyle is where this audience browses).
- **Tags** (pick from Play's list): Greeting cards, Birthday, Reminders / Calendar, Photo, Social — choose the 5 closest that appear in your console.
- **Contact:** email `[SUPPORT EMAIL]` (the repo currently uses `develoepernick1@gmail.com` in `docs-site/src/lib/legal.ts` — change it to a role address you'll keep), website `https://occasio-greetings.vercel.app`.
- **Privacy policy URL:** `https://occasio-greetings.vercel.app/privacy`
- **Account deletion URL** (required in Data safety): `https://occasio-greetings.vercel.app/delete-account`

## Declarations — answer from the app's real behaviour, then re-check

- **Content rating (IARC):** expect *Everyone*. Declare that users can create and share user-generated content (their own text/photos via a link) — don't tick "no UGC".
- **Data safety** — the app handles: account email (Auth), photos you upload for a card (Storage), names/dates/contact details of *other people* in the Vault (third-party personal data — be explicit), push tokens (FCM), purchase history (RevenueCat). Mark which data is encrypted in transit (it is) and that deletion is available. Add analytics/crash SDKs if you add them.
- **Ads:** no ads → "No".
- **Target audience:** 18+ (avoid "Designed for children"; the Families programme adds obligations you don't need).
- **App access:** guest create works without login; see the reviewer notes in `aso-strategy.md`.
- **Subscriptions:** products `occasio_pro_monthly` and `occasio_pro_yearly` (from `docs/REVENUECAT_SETUP.md`), entitlement `occasio_pro`. Add a clear benefits list and cancellation text on the paywall.

## "What's new" (first release)

```
Welcome to Occasio. Make a card they'll want to open — pop balloons, blow out candles, unwrap a 3D gift and read a letter — and save the people you love so you never miss a date.
```

## Promo video storyboard (20–30 s, vertical, no voiceover needed)

Record a real screen capture of the sender flow, then cut to the recipient opening it. Add captions, not narration (most people watch muted).

| Sec | Shot | Caption |
|---|---|---|
| 0–3 | Phone buzzes: "It's Mom's birthday" (Vault) | *Forgot again?* |
| 3–8 | Create flow: moment → frame → words, fast taps | *Made in a few taps* |
| 8–13 | Share sheet → recipient opens the link, Pip + "Show me!" | *Send a surprise* |
| 13–22 | Balloons pop → candles blow out → gift opens → letter seal breaks | *Pop. Blow. Unwrap.* |
| 22–27 | Sticker reveal, then the message | *Wishes they'll want to open* |
| 27–30 | App icon + "Occasio" | *Get Occasio* |

(I can record this from the real flow with the same capture tooling — say the word.)
