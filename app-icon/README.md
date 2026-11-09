# Occasio app icon

The final icon: Pip in a party hat, holding the date badge, on warm yellow. Use these files whenever you need the icon outside the app (decks, social, a website, a store listing, a press kit).

| File | Size | Use it for |
|---|---|---|
| `occasio-icon-1024.png` | 1024 x 1024, square, **no transparency** | The master. App Store Connect's 1024 icon, Apple Developer, anywhere a square icon is asked for |
| `occasio-icon-512-play-store.png` | 512 x 512 | Google Play Console (App icon) |
| `occasio-icon-rounded-1024.png` | 1024 x 1024, rounded corners, transparent | How it looks on a phone. Slides, blog posts, a website, a README |
| `occasio-icon-circle-1024.png` | 1024 x 1024, circle, transparent | Profile pictures: WhatsApp, Instagram, X, YouTube |
| `occasio-pip-transparent-1024.png` | 1024 x 1024, transparent background | Pip and the badge alone, for banners, stickers and anything with its own backdrop |

Do not upload the rounded or circle versions to the App Store or Play Store: both stores round the corners themselves and the App Store rejects an icon with transparency.

## Where the icon lives in the app

- **Source of truth:** `assets/brand/app-icon-1024.png` (plus `android-foreground.png`, `android-monochrome.png`, `notification-glyph.png` next to it). This folder is a convenient copy made from it.
- **Generated for the apps:** iOS `ios/Occasio/Images.xcassets/AppIcon.appiconset/`, Android `android/app/src/main/res/mipmap-*` (adaptive, round, and the Android 13 themed icon), the notification icon `drawable-*/ic_stat_occasio.png`, and the website favicon.
- **Rebuild them all** from the source art: `npm run icons:generate`. Then rebuild the native apps.

## If the icon on a phone or simulator still looks old

The icon is baked into the installed app. Delete the app and install a fresh build (`npm run ios` / `npm run android`). iOS also caches home-screen icons, so a restart of the simulator can be needed.
