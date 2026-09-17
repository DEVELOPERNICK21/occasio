# Interactive recipient story — design

**Date:** 2026-09-17  
**Priority:** Ahead of Devpost / Shipaton polish (user-locked).  
**Competitor reference:** HeartCraft (`birthday.myheartcraft.com`) — multi-scene interactive birthday mini-site.  
**Decision:** Approach **B** — fixed scene packs + classic fallback; expand packs in Phase B/C. Do **not** clone HeartCraft pink/romantic UI.

## Goal

When a recipient opens `/c/[slug]`, they play a short, delightful **interactive story** (tap, swipe, reveal) built from the sender’s photos + message — not a single static card. Occasio stays calm cream/green; interaction and reliability beat competitors, not palette copy.

## Decisions (locked)

| Topic | Choice |
|---|---|
| Spine | Scene player + data-driven scene list |
| Phase A scenes | Balloons → Photo deck → Letter (+ celebration) |
| Default mode | `story` for birthday (+ anniversary); `classic` for other occasions |
| Fallback | Missing photos skip photo scene; load errors → classic WishCard |
| Creator UI (A) | Minimal — server/derive mode; Preview note only |
| Blow candle / gift | Phase B |
| Mic blow / music / custom playlist | Phase C (or later) |
| Visual language | Occasio tokens only — no HeartCraft pink clone |
| Primary surface | Recipient **web** first; RN Preview parity in Phase B |

## Non-goals (Phase A)

- Microphone candle / breath detection  
- Gift bouquet picker / shop-style beats  
- Full in-app StoryPlayer parity  
- Creator scene reordering UI  
- Separate birthday subdomain  
- Claiming “interactive website” on store listing until A is live and stable  

## Current reality

| Piece | Status |
|---|---|
| Multi-step **create** flow (Who → Template → Photos → Details → Share) | Done |
| Recipient `/c/[slug]` single `WishCard` + sticker shower + reaction | Done |
| Timed card reveal + occasion Lottie/SFX | Done (in-card, not multi-scene) |
| `mediaUrls` 1–3 on creation | Done |
| HeartCraft-like multi-scene recipient journey | Missing |

## Competitive gap (what we steal as product, not pixels)

HeartCraft reel flow observed:

1. Pop balloons → words appear  
2. Blow candle + personalized name  
3. Gift / bouquet beat  
4. Swipe Polaroid photo stack  
5. Long handwritten letter  
6. Soft finale  

**Occasio Phase A** ships 1 + 4 + 5. **Phase B** adds 2 + 3. **Phase C** deepens packs, music, analytics, endings.

---

## Architecture

```
Creation (Firestore / API)
  recipientName, fromName, message, mediaUrls[], templateType, templateId
  experienceMode: 'story' | 'classic'     // persisted at create time
  experienceVersion: 1                    // for future pack upgrades

/c/[slug]
  fetch RecipientCard (+ experience fields)
  resolveExperience(card) → { mode, scenes[] }
  mode === 'classic' → RecipientCardView / WishCard (today)
  mode === 'story'   → StoryPlayer
                         SceneHost
                           balloons | photo_deck | letter
                           (+ later: candle | gift | finale)
                         progress · Continue · skip-to-end
```

### Units (clear boundaries)

| Unit | Responsibility | Depends on |
|---|---|---|
| `resolveExperience(card)` | Pure: mode + ordered scene list | card fields only |
| `splitRevealLine(message, name)` | Pure: short balloon reveal copy | string helpers |
| `StoryPlayer` | Scene index, advance, reduced-motion, errors | resolveExperience output |
| `BalloonPopScene` | Tap N balloons → reveal line → Continue | props only |
| `PhotoDeckScene` | Swipe stack of `mediaUrls` → Continue | props only |
| `LetterScene` | Full message, celebration, reaction, CTA | existing WishCard pieces / SFX |
| Create write path | Persist `experienceMode` (+ version) | creationsServer / RN repository |

**Rule:** Scene components do not fetch. Player does not know HeartCraft. Packs are config, not hardcoded JSX trees.

---

## Phase A — MVP (build next)

### Recipient scenes

1. **Balloons**  
   - 3–4 tap targets (reuse existing balloon art / Lottie where possible)  
   - Each pop reveals next word/fragment toward a short line  
   - Line source: first sentence of `message` truncated, or ``You are so special, {name}`` fallback if message empty/short  
   - Primary CTA: Continue (enabled when all popped, or after reveal)

2. **Photo deck** (“Some sweet moments”)  
   - Polaroid-style stack; swipe to dismiss / reveal next  
   - Uses `mediaUrls` (1–3)  
   - If 0 photos after resolve → scene omitted  
   - Continue after last card (or always available after first swipe)

3. **Letter**  
   - Full `message`, `fromName`, greeting from `templateType`  
   - Existing celebration / sticker shower / SFX  
   - Heart reaction + “Make one for someone”  
   - This is the terminal scene for Phase A

### Mode resolution

```
if experienceMode stored → use it
else if templateType in { birthday, anniversary } → story
else → classic
```

Legacy cards without `experienceMode` follow the else-if rule so birthdays become story automatically when A ships (acceptable; document in release notes). If we need stricter backward compat, default legacy to `classic` — **prefer auto-upgrade for birthday** so demos look competitive immediately.

### Creator / API (minimal)

- On `POST` create: set `experienceMode` from rule above (allow optional client override later)  
- Store `experienceVersion: 1`  
- RN Preview: one line of copy — “They’ll open an interactive experience” when mode is story  
- No new create screens in Phase A

### A11y / errors

- `prefers-reduced-motion`: skip pop animations; show reveal + Continue  
- Image load fail: drop that photo; if none left, skip deck  
- StoryPlayer crash / invalid pack → render classic WishCard  
- One primary CTA per scene  

### Acceptance (Phase A)

- [ ] Birthday share link opens story (balloons → photos → letter) when photos exist  
- [ ] Birthday with 0 photos: balloons → letter  
- [ ] Non-birthday/anniversary: classic unchanged  
- [ ] Reaction + make-your-own still work after letter  
- [ ] Cream/green tokens; no HeartCraft pink clone  
- [ ] Unit tests: `resolveExperience`, `splitRevealLine`  
- [ ] Manual: mobile Safari + Chrome WhatsApp in-app browser  

---

## Phase B — beat HeartCraft feature parity (after A)

Order of work:

1. **Candle scene** (after balloons, before photos)  
   - Personalized “Blow the candle, {NAME}”  
   - Tap-to-extinguish first (reliable); optional mic later  
2. **Gift beat** (optional illustration: cake / flowers by occasion)  
3. **RN Preview StoryPlayer** — same scene list as web (shared types; web-first components stay in docs-site, RN may reimplement thin scenes or WebView preview — prefer shared domain types + RN scenes)  
4. **Creator lite** — toggle Interactive on/off; optional custom reveal line field  

Acceptance adds: candle + gift in birthday pack; Preview matches recipient order.

---

## Phase C — go past competitors

1. **Template scene packs** — proposal / anniversary / thank-you variants (not one birthday clone)  
2. **Music bed** — opt-in, muted by default, stop on letter end  
3. **Soft ending** — stronger reaction, Vault nudge for sender analytics later, share-again  
4. **Analytics** — `story_started`, `scene_completed` (id), `story_finished`, `story_fallback_classic`  
5. **Mic blow** only if tap path is solid and permissions UX is calm  
6. Still no pink-slop UI, no emoji chrome, no paid testing-provider copy in product  

---

## Data / API touchpoints

| Change | Where |
|---|---|
| `experienceMode`, `experienceVersion` on create + Firestore doc | `docs-site/src/lib/creationsServer.ts`, RN `creationRepository` / spark path |
| Map into `RecipientCard` | `recipientCard.ts`, Firestore lookup |
| Document fields | `docs-site/content/api-contracts.md` |
| Update recipient blueprint | `docs-site/content/recipient-blueprint.md` |

No base64 expansion. No new Firebase client reads on recipient (keep server fetch).

---

## Testing strategy

| Layer | What |
|---|---|
| Domain (pure) | `resolveExperience`, scene omission rules, `splitRevealLine` |
| Component (web) | StoryPlayer advances; balloon gate; photo skip |
| Manual | Real share link on phone; reduced-motion; 1 vs 3 photos |

---

## Risks

| Risk | Mitigation |
|---|---|
| Scope creep into full HeartCraft clone | Hard phase gates; A ships 3 scenes only |
| Motion jank on low-end Android browsers | CSS/transform-light; reduced-motion path |
| WhatsApp in-app browser quirks | Test early; Continue always available |
| Shipaton / Devpost delay | Accepted by user; resume Devpost after A (ideally after B candle) |

---

## Implementation order (when planning)

1. Domain helpers + types + tests  
2. Persist `experienceMode` on create + read on recipient  
3. `StoryPlayer` shell + classic fallback  
4. Balloon scene  
5. Photo deck scene  
6. Letter scene (wire celebration + reaction)  
7. Preview copy in RN  
8. Blueprint + api-contracts update  

Phase B/C get their own implementation plans after A is accepted.
