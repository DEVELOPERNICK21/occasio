# Recipient experience (docs-site `/c/[slug]`)

What the person who **receives** a card sees. Product code lives in
`docs-site/src/components/story/`, shared logic in `docs-site/src/lib/experience/`.

## Flow

`gate → lamp → balloons → candle (birthday, anniversary) → gift → contract (just because) → hub → finale`

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
