# Creating a card: frames and progress

How a card gets made, what the frames are, and how to add one. The two halves that
must stay in step are the app and the recipient web page.

## The flow

Create home → **Who** → **Moment** → **Photos** → **Frame** → **Words** → **Preview** → Share.
Quick Create skips Who, Moment and Frame (Photos → Words → Preview).

### Progress (`domain/createProgress.ts`, `ui/components/CreateProgress.tsx`)

- The bar counts what the person has actually done, not only which screen they are on: photos added,
  a name entered, a message written. It never reaches 100% until the link exists.
- The header holds only the slim bar (stage, "3 of 6", time left). The one-line next step
  (`CreateNudge`) sits at the top of each screen's scrolling body, so it never eats height on short phones.
- Copy is calm and concrete: what to do next and why it helps. No exclamation marks, no emoji (a test enforces it).
- The bar remembers its last value, so moving forward looks like one bar filling rather than a reset.

### Things that raise completion

| What | Where |
|---|---|
| Every frame is always listed. Frames that fit your photos come first; the rest say "Add 2 more photos" and stay tappable (`listFrames`) | Frame picker |
| Tapping one of those explains the gap and offers "Add 2 more photos", then returns to that frame ready to arrange (`NeedMorePhotosSheet`, `openFrame` / `forFrame` route params) | Frame picker → Photos → Frame picker |
| Three openers to finish ("I was thinking about the time we …") (`messageStarters`) | Words screen |
| A real "Choose photos" button | Photos screen |

**Rule: never hide a frame.** An earlier version showed only the frames that fit the photos added so far, so with
one photo most of the picker looked like it had disappeared. A frame that needs more photos must stay visible and
selectable, with the shortfall stated on it. `listFrames` is tested to keep every older frame in the list.

## Frames

A frame is a `layoutId` drawn by a React Native component, plus a catalog entry. Eighteen templates
map to sixteen layouts.

| Layout | Template | Photos | Idea |
|---|---|---|---|
| `cinema_still` | F01 Our movie | 1 | Their name is the title, you are "directed by" |
| `handwritten_note` | F02 Handwritten note | 1 | Ruled paper, taped photo, words as if by hand |
| `postcard` | F03 Postcard | 1 | Picture on the front, message and stamp on the back |
| `photo_booth` | F04 Photo booth | 3 | Four-frame strip on a booth curtain |
| `contact_sheet` | F05 Contact sheet | 5 | Film sheet, one frame circled in red pencil |

The older layouts (editorial, dual, full photo, strip, split, mosaic, snapshot, scrapbook, poster, big words,
framed blur) are unchanged.

### Adding a frame: every place that must change

1. `src/features/create/domain/templateSchema.ts`: add the id to `LayoutId` and `LAYOUT_IDS`.
2. `src/features/create/data/templates/catalog.json`: add the template (id up to 16 chars, `[A-Za-z0-9_-]`).
3. `src/features/create/ui/components/layouts/<Name>.tsx` and the `switch` in `TemplateRenderer.tsx`.
4. `src/features/create/ui/components/DesignFramePreview.tsx`: the picker thumbnail (it draws its own silhouette).
5. `src/features/create/domain/frameSlots.ts`: a name for each photo spot.
6. `TEMPLATE_CUES` in `TemplateRecommendScreen.tsx`, and a bonus in `recommendTemplates.ts` so it shows for the
   right person and moment.
7. **Web**: `docs-site/src/lib/templateLayout.ts` (id, template map, minimum photos), the markup in
   `docs-site/src/components/WishCard.tsx` and the CSS at the end of `docs-site/src/app/globals.css`.

`__tests__/create/webFrameParity.test.ts` fails if the app catalog and the web mapping disagree, and
`expressiveFrames.test.tsx` renders every frame for every moment.

### Materials and fonts

Colours for film stock, paper, pencil and the booth curtain live in `frameArt` in `src/shared/theme/tokens.ts`.
The handwriting face is a system font (`src/shared/theme/artFonts.ts`: Bradley Hand on iOS, Android's `cursive`,
which is Dancing Script). No font file ships in the app. The web page uses Caveat. The two look alike but are not
identical, and that is expected.

## Before this reaches recipients

- **Deploy the web app (Vercel).** Cards made with F01–F05 open as the classic layout on the old site, so the
  frames only look right once the new `docs-site` is live. Nothing breaks in the meantime: unknown ids and
  missing photos already fall back to the classic layout.
- Release the app build that contains the new frames and progress bar.
