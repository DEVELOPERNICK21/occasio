# Recipient experience (docs-site `/c/[slug]`)

What the person who **receives** a card sees. Product code lives in
`docs-site/src/components/story/`, shared logic in `docs-site/src/lib/experience/`.

## Flow

`gate → balloons → candle (birthday, anniversary) → gift → contract (just because) → hub → finale`

- **gate** — "Do you want to see it?" with Pip. A playful "No" escalates twice, then both buttons become "Yes".
- **hub** — camera (photos), jar (reasons), envelope (letter), opened in any order. Photos are a swipe deck
  (birthday, anniversary) or a clothesline with a note on the back (other moments).
- **finale** — one choreographed show, then tap-for-more. Sticker pack, reaction, replay, "make one back".

Scene order is decided in `resolveExperience.ts`; add or remove a scene there and in `StoryPlayer.tsx`.

## One file per moment's look

`lib/experience/momentTheme.ts` holds palette, backdrop, celebration preset, mascot costume, gift wrap,
cake style and the gate's jokes. A new moment is a new entry, not new CSS.

## Look and feel

Every moment is a light, crisp scene: flat colour, hard-edged decorations, solid white chips and cards. No
frosted glass (`backdrop-filter`), no blurred bokeh or glows behind content, no dark themes. Celebrations use
normal blending (never additive) so they stay visible on light backgrounds.

The one exception is the **floating balloons** behind the scenes (`components/story/fx/BalloonArt.tsx`): they are drawn as
translucent, shaded latex on purpose, because flat ones read as stickers. The middle lets the page show through, the
rim is deeper in colour, a window reflection sits top left, and the neck ends in a knot with a curling string, so two
balloons that overlap show through each other. It is done with gradients and opacity only, no blur, glow or
`backdrop-filter`. Small balloons read as farther away and sit a little fainter (`balloonOpacity` in `MomentBackdrop.tsx`).
The balloons of the pop game (`BalloonPopScene.tsx`) are a separate drawing.

## 3D scenes

The gift and the cake use three.js, loaded lazily (`gift3d/`). If WebGL is unavailable, or the GPU context is
lost, the scene falls back to the flat SVG version. Entry-level phones get a smaller pixel ratio and shadow map.

The cake is chocolate outside and cream sponge with strawberry layers inside (birthday), so the cut face reads
at a glance against it. Each moment's `CakeStyle` in `momentTheme.ts` must keep the sponge visibly different from
the cake's side; the cut slice slides out far enough to show both cut faces, and the faces glow slightly.

## Opening the gift: tap or shake

Three taps open the gift, and so do three shakes of the phone; they count the same and can be mixed.
`lib/experience/shake.ts` detects a shake from accelerometer readings (pure and tested). Android sends motion
events freely, so shake works there with nothing asked.

**The page never asks for a permission.** iPhones only send motion after a prompt, and that prompt popped up in
the middle of the gift and blocked it, so it was removed: on an iPhone the gift opens by tap (or drag to turn it)
and the hint says so. `shakeSupport()` reports iPhones as unsupported on purpose; a test holds it there. Do not
add `DeviceMotionEvent.requestPermission` back.

## What comes out of the gift

When the box opens, the wish springs out as bunting: bold white capitals on coloured flags, a flag at a time
(`GiftWishBanner`, with the words and layout in `lib/experience/giftWish.ts`: "HAPPY BIRTHDAY", "THANK YOU",
"CONGRATS", "JUST BECAUSE", "HAPPY ANNIVERSARY"). It is real text laid over the 3D scene, so it stays crisp, large
and readable, and works the same on the flat fallback gift. Flag colours per moment keep white letters at 3:1 or
better (tested). Reduce Motion turns the pop and sway into a fade.

The gift tag that rises shows the name big, with "from {sender}" under it (the wish itself when the sender is not
known). The scene title above becomes a bold, non-repeating line ("Surprise, Maya"), so the wish is only said once
in words. Screen readers hear the wish from a hidden live region, and the flags are hidden from them.

## Photos: tap and slide

Both photo scenes answer to a tap and to a slide, decided by `lib/experience/gesture.ts` (pure and tested: a finger
always moves a little during a tap; a short quick flick counts as a slide).

- **The deck** (birthday, anniversary): tap the photo, or slide it either way, to go to the next one. Arrow keys and
  Enter do the same, and the "Next photo" button stays as the plain alternative.
- **The line** (thank you, congratulations, just because): tap a photo, or slide a finger across it, to turn it over
  and read the note. A slide flips it once; the click that follows it is ignored. Sideways slides reach the photo
  while up and down still scroll the page (`touch-action: pan-y`).

## The link preview (WhatsApp, Instagram, Messages, X)

A shared card link shows a picture, a title and a line before anyone opens it. It is a **teaser, never a spoiler**:

- **The image** (`app/c/[slug]/opengraph-image.tsx`, drawn by `lib/og/surpriseImage.tsx`) is a sealed gift with a "?" seal
  and Pip peeking over it, in the moment's own colours, with the name, who it is from, and "Tap to open the surprise".
- **Photos are never shown.** The preview is copied onto the chat service's own servers, so the real photo must not go
  into it. When a card has photos, a tilted tile shows only a heavily blurred wash of the first one
  (`lib/og/blurredPhoto.ts`: shrunk to 24x30 pixels, then softened, so every face and detail is gone for good). It
  reads only data URLs, our own storage and (for demo cards) `public/demo`, never any other address, and goes without
  the tile if anything is unexpected or `sharp` is not available.
- **The message is never used.** A locked card shows no name, no sender and no photo at all.
- The title and description come from the same function as the image text (`lib/og/teaser.ts`), so they can never
  disagree. Card pages are `noindex` so search engines skip them. This is a page tag, not a `robots.txt` rule:
  Facebook and Twitter read `robots.txt` before building a preview, and would show nothing.
- Keep the image under about 300 KB: WhatsApp drops larger ones. It is about 180 KB now. The image uses the renderer's
  built-in font (one weight) and thickens big text with a stroke, because a font fetched at request time would send each
  recipient's name to a font server.
- Chat apps keep a preview for a long time and cannot be told to refresh. The CDN keeps the image for an hour only.

## Share to your story (the recipient's frame)

The person who receives a card is the best sharer: they have just been surprised, it costs them nothing, and every post
puts the link in front of someone new. The finale has a **Share to your story** button (not shown inside the landing
page's live sample). It opens a sheet with the picture, one switch and **Share**.

- **The picture** (`GET /api/story-frame`, drawn by `lib/og/storyFrameImage.tsx`) is 1080x1920. Pip (the real one, in
  the moment's costume) stands on a half-open card. A photo is tucked into its corner, the first words of the message
  fade out on the paper, and the sender's name signs it ("With love, Aarav"). The headline says who made it ("Aarav made
  me a birthday surprise"), chips say what is inside ("5 photos", "6 reasons", "5 of 6 stars found"), and a
  button-shaped "Make one for someone" is where the person lays their link sticker. Everything that matters sits between
  the strips Instagram covers (the top 250 px and bottom 340 px).
- **One Pip everywhere.** The drawing lives in `components/story/fx/pipParts.tsx` and is used by the live page
  (`Pip.tsx`), this picture and the link preview, so they cannot drift apart. They are plain functions, not
  components, because the image renderer cannot expand a component inside an svg (and cannot take a fragment, so the
  figure is one `<g>`).
- **What goes public, and who decides.** The picture shows a peek at the card only through the card's own `slug`, which
  is already the secret that opens it, so it reveals nothing the link does not. The switch **Show a peek of what they
  wrote** (on by default) lets the person see the picture first and turn the peek off, which gives the plain picture:
  "Someone made me a birthday wish", lines where the words would be, and only the star score.
  - The photo is only ever the blurred wash (`lib/og/blurredPhoto.ts`), never the photo.
  - The excerpt is the first 72 characters, cut at a word, and is dropped if it looks private (a link, an email address,
    a run of six or more digits). Only the first name is used.
  - A locked or missing card gets the plain picture. Nobody is named and nothing is quoted unless the card could be read.
- **Cache.** The plain picture takes only the occasion and the score, so it is cached for good, which means a redesign
  needs a new address: **bump `STORY_FRAME_VERSION`** in `lib/experience/storyShare.ts` whenever the design changes. A peek
  is held for an hour only, because a card can be edited or revoked.
- **Sharing** (`components/story/StoryShareButton.tsx`, `lib/experience/storyShareFlow.ts`): the picture is fetched ahead
  of the tap so the share sheet can open straight from it, which some browsers insist on. The share sheet (Instagram,
  WhatsApp Status, anything) gets the picture and the caption. A browser that cannot share files downloads it instead.
  The caption is copied either way, and the hint only says so when the clipboard accepted it.
- **The link sticker**: Instagram does not let a page place one, so the person lays their own over the button shape, and
  the caption carries the link too. Adding it in one tap needs Meta's "Share to Stories" API (a Meta developer app ID
  and a native module), which is a later step in the app.
- **The link points at the public landing page** with `?ref=<slug>`, never at the private card. `story_share` counts
  taps on **Share**, next to `opened`, `finished`, `replayed` and `cta`, so shares per finished card, and the people each
  one brings, can be measured.
- Words are calm: no exclamation marks, no emoji (tested), with or without the peek.

## Music under the message and the finale

`lib/experience/occasionMusic.ts` plays the moment's song (`public/sounds/*.mp3`, chosen in `occasionSongs.ts`)
once the story reaches the message (hub) and keeps it going through the finale. It stops when Replay starts and
fades back in at the message.

- Browsers only allow sound after a tap, and iPhones need each audio element started from a tap before it may be
  started later. The first tap anywhere in the story calls `unlockMusic` (the gate's "Yes" is normally that tap).
- It is a normal `<audio>` element, not Web Audio, so it keeps playing on an iPhone whose ring switch is on silent.
  iPhones ignore the volume setting and play at the phone's own volume.
- The sound switch (top right, also on the finale) stops it and brings it back. If a browser still refuses to
  play, the story carries on silently.

## The landing page's live sample

The hero phone on `/` is an `<iframe>` of a real demo card (`/c/demo-<moment>-maya-abc123`, see
`lib/landingMoments.ts`). Nothing loads until someone taps "Play a sample", which keeps the page light, avoids a
scroll trap on phones, and is the tap that lets the sample play its sound. When the story detects it is framed it
hides the "Report this card" links and the "Make one on Occasio" block so the site never nests inside itself, and
hides its scrollbar.

## Behavior-design rules (do not break these)

Persuasive design is welcome; deceptive design is not.

| Do | Don't |
|---|---|
| Show progress and celebrate finishing (goal gradient, peak-end) | Hide or lock content behind stars or stickers |
| Give a small surprise reward (lucky star, sticker rarity) | Use countdowns, fake scarcity or "only N left" |
| Let the recipient choose the order (hub) | Shame the "No" or skip button ("are you sure you don't love her?") |
| Offer "make one back" at the emotional high | Make sharing a condition of seeing the card |
| Keep Skip, Mute and "just tap to agree" always available | Farm rewards on replay (awards are idempotent per action) |
| Ask for the microphone only when the recipient taps for it | Collect analytics beyond the four anonymous funnel counters |

The "No" gag is safe because it can never trap anyone: the second refusal turns both buttons into "Yes".

## Reviewing a scene quickly

Demo cards (`demo-<moment>-<name>-<code>`) accept `?scene=<id>` and, for the hub, `&room=photos|reasons|letter`.
Example: `/c/demo-birthday-aanya-a1?scene=gift`. Real cards ignore these parameters.
