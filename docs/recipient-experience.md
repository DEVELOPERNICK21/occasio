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

## 3D scenes

The gift and the cake use three.js, loaded lazily (`gift3d/`). If WebGL is unavailable, or the GPU context is
lost, the scene falls back to the flat SVG version. Entry-level phones get a smaller pixel ratio and shadow map.

The cake is chocolate outside and cream sponge with strawberry layers inside (birthday), so the cut face reads
at a glance against it. Each moment's `CakeStyle` in `momentTheme.ts` must keep the sponge visibly different from
the cake's side; the cut slice slides out far enough to show both cut faces, and the faces glow slightly.

## Opening the gift: tap or shake

Three taps open the gift, and so do three shakes of the phone; they count the same and can be mixed.
`lib/experience/shake.ts` detects a shake from accelerometer readings (pure and tested). Android needs nothing.
iPhones only send motion after a permission request that must come from a tap, so the first tap on the gift asks
for it and an "allow motion" link is shown under the hint. Desktops show the tap-only hint.

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
