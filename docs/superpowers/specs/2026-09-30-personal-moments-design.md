# Personal moments — design

**Date:** 2026-09-30  
**Priority:** After Shipaton submission (Play production + Devpost). Nothing here ships before that.  
**Builds on:** [`2026-09-17-interactive-recipient-story-design.md`](./2026-09-17-interactive-recipient-story-design.md) (Phase A/B shipped).  
**Competitor references (screen recordings, 2026-09-29/30):**

| # | Source | What it does |
|---|---|---|
| 1 | Boyfriend's Day mini-site (mint grid paper) | Envelope "tap anywhere to begin" → "To X from Y" ribbon → photo with handwritten sticker → "Our Song" player → "every photo has something written on the back" (pinned flip-notes) → mock contract ("Snack policy… valid forever, non-refundable", signed by "the cat, official witness") → long letter |
| 2 | template_diaryy — birthday (gingham) | "Do you wanna see it? YES / NO" → NO = "HOW?? try again" → "Are you really excited? YES / YES" → "Each gift has something for you" (3 gifts → photo card, make-a-wish cake, memories on a string, letter) |
| 3 | template_diaryy — anniversary | Passcode keypad (their date) → calendar page with the day circled → "Everything I love about you" heart jar → "10 years later…" photo wall → letter → "This little website may come to an end, but my love for you never will." |
| 4 | template_diaryy — birthday (character) | Passcode → "WRONG PASSCODE — try again" joke screen → Yes/No → ransom-letter "Happy Birthday" → "With love" crumpled paper |
| 5 | template_diaryy — birthday (dog) | No = "SERIOUSLY!? how dare you" → "That's you ♥" photo → hub "click on each item to open" (camera = gallery, envelope = letter, cassette = song) |
| 6 | OurMoments (`ourmoments.live`, paid ad) | Rich chat link preview → heart fills screen → tree grows heart leaves "Happy Birthday, Arina" → "First things first" cake + candle → "Pop the balloons — each one hides a reason you're loved" → reason cards → "A walk down memory lane" polaroids → "One last thing…" envelope → letter → fireworks finale "Made with love by… create one for your special someone" |

**Decision:** Close the **personal content** gap, not the animation gap. Our scene engine already matches OurMoments beat-for-beat; what recipients react to in every video is the sender's own words (reasons, notes, closing line) and a playful ritual (Yes/No, passcode). Do **not** clone their visuals: no character IP, no pink/red slop, Occasio tokens only.

## Goal

A recipient opening `/c/[slug]` should read the **sender's words at every beat**, not our stock copy, and the sender should **know it landed** (opened + reply). Each of the five moments gets its own arc instead of one shared sequence.

## Decisions (locked)

| Topic | Choice |
|---|---|
| Content model | Add `reasons[]`, `photoNotes[]`, `closingLine`, `gate` to the creation. All optional |
| Creator UX | One optional "Make it personal" section on Details. Quick Create unchanged |
| Stock copy | Stays as fallback whenever a personal field is empty |
| Gate | `none` (default) \| `yes_no` \| `passcode`. Passcode is a ritual, not security, but card data is still withheld until unlock |
| Arcs | Per-moment scene lists in `resolveExperience` (see below) |
| Feedback loop | First open → push to creator; recipient can send one short reply |
| Visuals | Occasio tokens. Paper textures (grid, kraft) allowed later; no characters, no emoji chrome in app UI |
| Monetization | Basic story free. Passcode, voice note, certificate, > 3 reasons = Pro or `single_wish` |

## Non-goals

- Licensed music or Spotify/YouTube embeds (licensing; use voice note instead, Phase 3)
- Character stickers (Snoopy, Shinchan, Sanrio) or any third-party IP
- Recording the recipient's reaction (camera/privacy)
- AI-written reasons/letters (PRD Phase 2 "AI message help" is separate)
- Creator scene reordering UI
- Recipient accounts

## Current reality

| Piece | Status |
|---|---|
| Scenes: lamp, balloons, candle, gift, photo_deck, envelope, letter_write, letter | Shipped (`docs-site/src/components/story/`) |
| Balloon reveal | One line split into words (`balloonLine`, max 8 words) |
| Photo captions | Stock per-moment copy (`storyCopy.photoCaptions`), not per photo |
| Heart reaction | Shipped (`POST /api/v1/cards/[slug]/reactions` → `reactionCount`) |
| View tracking | `recordCardView` exists in `creationsServer.ts` but is **never called** |
| Creator push | FCM tokens on `users/{uid}.fcmTokens`; senders in `functions/src/autosend/fcm.ts` |
| Reply from recipient | Missing |
| Gate (Yes/No, passcode) | Missing |
| Per-moment arcs | Only difference today: candle for birthday/anniversary |

---

## Arcs per moment

Target scene lists (`?` = only when data exists; `gate` resolves to `yes_no_gate` / `passcode_gate` / nothing):

| Moment | Scenes |
|---|---|
| birthday | gate? → candle → balloons (reasons) → gift → photo_deck? → envelope → letter_write → letter → finale |
| anniversary | gate? → calendar? → reasons_jar → photo_deck? → envelope → letter_write → letter → finale |
| thank_you | gate? → envelope → certificate → photo_deck? → letter_write → letter |
| congratulations | gate? → certificate → balloons (reasons) → photo_deck? → letter_write → letter → finale |
| just_because | gate? → balloons (reasons) → photo_deck? → envelope → letter_write → letter |

Notes:

- `lamp` stays available as an opener but is no longer in every arc (it's long; 851-line scene). Keep it for birthday behind a `experienceVersion >= 2` check only if playtests like it.
- `calendar` requires an occasion date (from Vault person, or a new optional date field). Omitted otherwise.
- `reasons_jar` is the same data as balloons with a different presentation (tap hearts in a jar). Falls back to balloons if we don't build the jar.
- Legacy cards (`experienceVersion` 1 or missing) keep today's sequence exactly.

---

## Architecture

```
Creation (Firestore / API)
  …existing fields…
  experienceVersion: 2
  reasons?: string[]            // 0–5, each ≤ 80 chars
  photoNotes?: string[]         // index-aligned with mediaUrls, each ≤ 60 chars
  closingLine?: string          // ≤ 120 chars
  gate?: { type: 'none' | 'yes_no' | 'passcode'; hint?: string }
  passcodeHash?: string         // server-only, never returned to client
  firstOpenedAt?: Timestamp
  viewCount, reactionCount      // existing

creations/{id}/replies/{replyId}
  text: string (≤ 140), createdAt, deviceKey (hashed)

/c/[slug]
  fetch RecipientCard
    gate.type === 'passcode' → return shell only (recipientName, fromName, templateType, hint)
    else → full card
  resolveExperience(card) → { mode, scenes[], revealLine }
  StoryPlayer → SceneHost
```

### Units

| Unit | Responsibility | Depends on |
|---|---|---|
| `resolveExperience(card)` | Per-moment arc, version switch, omission rules | card fields only |
| `resolveReasons(card)` | `reasons` → else split `balloonLine` → else stock | pure |
| `validatePersonalFields` (RN domain) | Lengths, counts, passcode format (4 digits) | pure |
| `YesNoGateScene` | Yes advances; No cycles escalating replies, No button shrinks, then only Yes | props |
| `PasscodeGateScene` | Keypad, calls unlock via player callback, wrong-code joke screen | props + `onUnlock` |
| `BalloonPopScene` (update) | Each balloon reveals one reason card | props |
| `PhotoDeckScene` (update) | Tap a card to flip → `photoNotes[i]` or stock caption | props |
| `CertificateScene` | Audience-specific certificate, sender name as signer | props |
| `CalendarScene` | Month page, day circled, "our day" copy | props |
| `FinaleScene` | Closing line + celebration + replay + "make one" CTA | props |
| `ReplyBox` (in LetterScene) | One reply per device, presets + free text | `onReply` |
| `onCardFirstOpened` (Functions trigger) | On `firstOpenedAt` set → FCM to creator | `fcm.ts` |
| `onCardReply` (Functions trigger) | On reply create → FCM to creator | `fcm.ts` |

**Rule (unchanged):** scenes don't fetch; the player/page owns IO.

---

## Phase 1 — personal content + feedback loop (2–3 days)

### 1. Reasons

- RN: `reasons: string[]` on `CreationDraft` (`src/features/create/domain/types.ts`), default `[]`. `balloonLine` kept for old drafts.
- Details screen, "Make it personal": up to 3 reason inputs (5 with Pro), placeholder by audience ("You always pick up when I call").
- Web: `BalloonPopScene` shows N balloons = N reasons (min 3; pad with stock reasons). Each pop reveals a reason card that stacks, as in OurMoments.
- Title copy by moment in `storyCopy.ts`: "Each one hides a reason" (birthday/just because), "A few reasons" (congrats).

### 2. Photo notes ("written on the back")

- RN: `photoNotes: string[]`, one optional input under each photo on `AddPhotosScreen`. Reordering/removing a photo moves/removes its note (domain helper, tested).
- Web: `PhotoDeckScene` tap flips the polaroid; back shows the note in the handwritten font. Swipe still advances. No note → current stock caption on the front, no flip affordance.

### 3. Yes/No gate

- `gate.type = 'yes_no'`. Creator toggle: "Ask before it opens" (default off; on by default for just_because).
- Scene copy: "{from} made something for you. Want to see it?"
- No sequence (recipient side, playful copy allowed here only): "Wrong answer." → "Try that again." → "Last chance." → No hidden. Button shrinks each time. Reduced motion: no shrink, same copy.
- One primary CTA (Yes); No is a text button.

### 4. Opened + reply

- Page: call `recordCardView(slug)` server-side on first render; set `firstOpenedAt` if missing (same update, transaction).
- Functions: Firestore `onDocumentUpdated('creations/{id}')` → when `firstOpenedAt` goes from missing to set and `userId` is non-null → FCM "{recipientName} opened your card". Guests (no uid) get nothing; History shows "Opened" once they sign in and the card is linked.
- Recipient reply on `LetterScene`, under the heart:
  - Presets: "Loved it", "Made my day", "Calling you now" + free text (≤ 140).
  - One reply per device (localStorage + hashed device key server-side), rate-limited per slug.
  - `POST /api/v1/cards/[slug]/replies` → `creations/{id}/replies`.
  - Function trigger → FCM "{recipientName} replied".
- RN History detail: "Opened · Loved · 1 reply" row, reply text shown. Read via existing history repository (Functions endpoint), not Firestore in UI.

### Acceptance (Phase 1)

- [ ] Card with 3 reasons shows 3 reason cards; card with none shows stock reasons (no regression)
- [ ] Legacy card with only `balloonLine` renders exactly as today
- [ ] Photo with note flips to show it; photo without note doesn't offer a flip
- [ ] Removing photo 2 of 3 in the app removes note 2 and keeps notes 1 and 3 aligned
- [ ] Yes/No gate: No path reaches the story in ≤ 4 taps; reduced-motion works
- [ ] First open sends exactly one push to a signed-in creator; reopen sends none
- [ ] Reply saved, pushed, visible in History; second reply from same device blocked
- [ ] Quick Create flow unchanged in steps and time
- [ ] Unit tests: `resolveReasons`, `resolveExperience` v1 vs v2, photo-note alignment, `validatePersonalFields`
- [ ] Manual: WhatsApp in-app browser (Android + iOS), Instagram in-app browser

---

## Phase 2 — moment-specific scenes (3–4 days)

### 5. Passcode gate

- Creator: 4-digit code + required hint ("Our first date, DDMM"). Pro / `single_wish`.
- Server stores `passcodeHash` (scrypt with per-card salt). Never returned.
- `GET /cards/:slug` returns a shell (names, templateType, hint, gate) when passcode is set.
- `POST /api/v1/cards/[slug]/unlock { code }` → full card or `401`. Rate limit: 10 attempts / 10 min per IP+slug.
- Wrong code → joke screen ("That's not it. {from} is judging you a little.") → retry. After 5 wrong: show the hint more prominently.
- OG image and page metadata must **not** show the photo or message for passcode cards (generic moment art only).
- Honest framing in creator UI: "A fun lock, not a vault."

### 6. Certificate

- Templates per audience × moment: "Certificate of Being the Best Mom", "Official Thank-You", "Award for Outstanding Achievement".
- Creator edits only: signer line (defaults to `fromName`), optional witness ("the cat"). Terms/lines are ours, written per audience.
- Screenshot-friendly: fixed aspect ratio, legible at phone width.

### 7. Calendar

- Needs a date: from Vault person (occasion date) or new optional `occasionDate` on Details.
- Month grid, the day circled in hand-drawn stroke, caption "The day that made {name} mine" (anniversary) / "The day the world got {name}" (birthday).

### 8. Closing line + finale

- `closingLine` input, placeholder: "This little link may end one day. What I feel for you won't."
- `FinaleScene`: closing line, celebration burst (existing sticker shower/Lottie), Replay, "Make one for someone". Replaces the CTA currently on `LetterScene` for arcs that include finale.

### Acceptance (Phase 2)

- [ ] Passcode card: page source and `GET /cards/:slug` contain no message/photos before unlock
- [ ] Unlock rate limit enforced; wrong-code screen shows; hint escalation after 5
- [ ] OG preview for passcode card has no personal content
- [ ] Certificate renders for all 6 audiences without overflow at 320px width
- [ ] Calendar omitted when no date
- [ ] Finale shows closing line or omits the line cleanly
- [ ] Pro gating via `resolveExtraWish` / entitlement, no hardcoded bypass

---

## Phase 3 — differentiation + growth

9. **Voice note** — record ≤ 30s in app (`AddPhotos` or Details), upload to Storage (same presign path), cassette-style player scene. Muted until tapped. Pro.
10. **Hub scene** — "Tap each one to open": camera (photo deck), envelope (letter), cassette (voice note). Non-linear; letter unlocks after the others or after 1 min. Birthday alternative arc.
11. **In-app preview + record** — RN story player (backlog item in `recipient-blueprint.md`), "Preview & record" button so creators can post the reveal to Reels/Stories. This is how every reference video spread.
12. **Paper themes** — grid, kraft, lined; washi tape and pin stickers as our own SVGs. Added to `design-tokens.json` first.
13. **Rich link preview** — OG image per moment with the recipient's name large ("For Arina") and moment art; test in WhatsApp, iMessage, Instagram DM.

---

## Data / API touchpoints

| Change | Where |
|---|---|
| Draft fields + validation | `src/features/create/domain/types.ts`, new rules in `src/features/create/domain/` |
| Create/PATCH payload | `src/features/create/data/creationRepository.ts`, `functions/src/creations.ts`, `docs-site/src/lib/creationsServer.ts` |
| Recipient mapping | `docs-site/src/lib/recipientCard.ts`, `lib/experience/types.ts`, `resolveExperience.ts`, `storyCopy.ts` |
| New endpoints | `POST /api/v1/cards/[slug]/replies`, `POST /api/v1/cards/[slug]/unlock` |
| Triggers | `functions/src/index.ts` (first-open, reply), reuse `functions/src/autosend/fcm.ts` pattern + `pruneFcmTokens` |
| Firestore rules | `replies` subcollection: server-write only |
| History UI | `src/features/history/` (opened / reply row) |
| Docs | `docs-site/content/api-contracts.md`, `recipient-blueprint.md`, `create-blueprint.md` |

No base64. Recipient page keeps server-side fetch only.

---

## Testing strategy

| Layer | What |
|---|---|
| RN domain | `validatePersonalFields`, photo-note alignment on reorder/remove, quota/gating for Pro-only fields |
| Web pure | `resolveExperience` per moment × version × data presence; `resolveReasons` fallbacks |
| Web component | Yes/No escalation; passcode wrong/right; photo flip; reply once-per-device |
| Functions | First-open trigger fires once; reply trigger; invalid token pruning |
| Manual | Real links in WhatsApp/Instagram in-app browsers; reduced motion; 0/1/5 photos; guest vs signed-in creator |

---

## Risks

| Risk | Mitigation |
|---|---|
| Details screen gets long, Quick Create slows | Everything in one collapsed "Make it personal" section; all optional |
| Passcode seen as security | Copy says "fun lock"; still withhold data server-side; rate limit |
| Reply spam/abuse | One per device, 140 chars, rate limit, creator can delete in History |
| Push fatigue | Only first open + reply; respect OS permission; no marketing push |
| Clone drift toward pink/character style | Tokens only; review against `ui-design-principles.md` §11 |
| Legacy cards change unexpectedly | Arcs keyed on `experienceVersion`; v1 frozen |

---

## Implementation order

1. Domain types + validation + tests (RN) and `resolveReasons` / versioned `resolveExperience` (web)
2. Persist new fields through create + PATCH (RN repository, Functions, docs-site server)
3. Balloons → reasons; photo flip notes
4. Yes/No gate scene
5. `recordCardView` + `firstOpenedAt` + first-open push
6. Replies endpoint, reply box, reply push, History row
7. Details "Make it personal" section + AddPhotos notes inputs
8. Docs: api-contracts, recipient/create blueprints

Phase 2 and 3 get their own implementation plans after Phase 1 is accepted.

## Open questions

- Should reasons be required (min 1) for anniversary, where the jar is the centerpiece?
- Do we show "Opened" to guest creators via a local-only indicator, or only after sign-in?
- Keep `lamp` in the birthday v2 arc, or retire it to shorten time-to-letter?
