---
title: UI design principles
description: Visual and interaction rules for Occasio mobile + recipient web — all UI must follow these.
phase: Phase 2.5 — UI Design
status: Locked
updated: 2026-09-01
---

Agents and humans: **do not invent UI ad hoc.** Use tokens + shared components + these rules.

**Token source:** `design-tokens.json` → mobile: `src/shared/theme/tokens.ts` → web recipient: CSS vars from same JSON.

---

## 1. Brand & mood

| Principle | Rule |
|---|---|
| **Calm trust** | Warm cream canvas, deep green accent — not loud purple/pink “greeting card app” cliché |
| **India-first** | Readable on mid/low-end Android; sufficient contrast outdoors |
| **Emotional but not cheesy** | Personal copy from user; UI stays restrained |
| **One primary action** | Each screen has exactly **one** primary CTA (accent button) |

Product principles (trust, delivery, privacy) live in [product-principles.md](./product-principles.md) — UI must **express** them (clear labels, no dark patterns).

---

## 2. Typography

| Role | Token / font | Use |
|---|---|---|
| Screen title | `sizeXl` + semibold | One per screen via `Screen` |
| Subtitle | `sizeMd` + `muted` | Context under title |
| Body | `sizeMd` + `inkSoft` | Messages, descriptions |
| Label / meta | `sizeSm` + `muted` | Hints, timestamps |
| Display (marketing only) | Fraunces | Splash, recipient hero — sparingly |

**Rules**
- Max **2 type sizes** in a single card/block
- No ALL CAPS except short labels (e.g. “PREVIEW” badge)
- Line length: message inputs multiline; body text not wider than screen padding

---

## 3. Color

| Token | Use | Don't use for |
|---|---|---|
| `bg` | Screen background | Buttons |
| `surface` | Cards, inputs | Full-screen fill |
| `accent` | Primary CTA, links | Large backgrounds |
| `accentSoft` | Selected state, nudges | Primary buttons |
| `error` / `errorSoft` | Errors, destructive confirm | Decoration |
| `border` | Dividers, input outlines | Text |

**Rules**
- Never hardcode hex in feature screens — import `tokens.ts`
- Primary button: white text on `accent`
- Disabled: reduce opacity (0.5), don't change hue randomly

---

## 4. Spacing & layout

| Token | px | Typical use |
|---|---|---|
| `sm` | 8 | Gap between related items |
| `md` | 16 | Screen horizontal padding, field gap |
| `lg` | 24 | Section separation |
| `xl` | 32 | Major blocks |

**Rules**
- Screen horizontal padding: **`lg` (24)** — use `Screen` component
- Tap targets: **min 48pt** height (buttons already enforce this)
- Bottom CTAs: sit in `Screen` footer (sticky), not floating mid-scroll
- Grids: 2 columns for template picker; single column for forms

---

## 5. Radius & elevation

| Element | Radius |
|---|---|
| Buttons | `radius.md` (10) |
| Cards, inputs | `radius.md` or `radius.lg` (16) |
| Modals / sheets | `radius.lg` top corners |

Shadows: light only (`shadow.card` on web). Mobile: prefer border (`border` token) over heavy shadow.

---

## 6. Components (use these — don't duplicate)

Build in `src/shared/ui/`. Feature screens **compose** shared components.

| Component | Status | Use when |
|---|---|---|
| `Screen` | ✅ | Every full screen (title, subtitle, footer) |
| `Button` | ✅ | primary / secondary / ghost actions |
| `Input` | 🔜 | Text fields (replace raw TextInput) |
| `Card` | 🔜 | Selectable template tiles, nudge panels |
| `EmptyState` | 🔜 | Vault / History zero data |
| `ErrorBanner` | 🔜 | Inline recoverable errors |
| `PaywallModal` | 🔜 | Quota exceeded |

**Before adding a new shared component:** check wireframes + tokens; add to this table.

---

## 7. Interaction patterns

| Pattern | Rule |
|---|---|
| **Loading** | Disable primary button + show `ActivityIndicator` on accent — no full-screen blocker for &lt;2s ops |
| **Errors** | Inline copy below action; offer Retry; map API codes to human text in `application/` |
| **Empty** | Illustration optional; always **one** clear CTA (“Add your first person”) |
| **Success** | Share success = link + share button + vault nudge (not confetti overload) |
| **Modals** | Paywall, soft auth, delete confirm — dismiss without losing stack |
| **Motion** | Template preview = subtle animation (Lottie/Reanimated later); no autoplay video in v1 |

---

## 8. Mobile vs web consistency

| Aspect | Mobile (RN) | Web (recipient `/c/[slug]`) |
|---|---|---|
| Tokens | `tokens.ts` | CSS variables from `design-tokens.json` |
| Layout | Tabs + stacks | Single column, centered card max ~480px |
| Typography | System + token sizes | Same font families (Google Fonts) |
| Primary CTA | `Button` component | Same accent, same label style |
| Chrome | Tab bar, native share | Minimal header; “Make your own” CTA |

**docs-site** (PRD browser) uses similar palette but **does not** need pixel-perfect match — it's internal/docs.

---

## 9. Accessibility (baseline)

- Contrast ≥ 4.5:1 for body text on `bg` / `surface`
- `accessibilityLabel` on icon-only controls
- Don't rely on color alone for errors (add text)
- Support system font scaling where possible

---

## 10. Agent checklist (before shipping UI)

- [ ] Uses `Screen` + `Button` (or new shared component in `shared/ui/`)
- [ ] Colors/spacing from `tokens.ts` only
- [ ] One primary CTA per screen
- [ ] Loading, error, empty states considered
- [ ] Matches [wireframes](./wireframes.md) structure
- [ ] No new hex values in feature `StyleSheet`
- [ ] **Anti-slop:** no generic AI palette, copy, or layout (see §11)
- [ ] Copied patterns from an existing screen in the same feature — not invented from scratch

---

## 11. Anti-slop — avoid generic AI UI & copy

**Occasio is calm trust, not “AI greeting card generator.”** If it could be any random SaaS or Dribbble shot, reject it.

### Visual — never add

| Slop signal | Do instead |
|---|---|
| Purple/violet gradients, neon pink, “startup blue” | `bg`, `surface`, `accent` from `tokens.ts` only |
| New fonts (Inter, Roboto swap, system default drift) | Token sizes + weights; Fraunces **marketing only** |
| Heavy glassmorphism, blur stacks, 3D cards | Border + `surface` + light shadow on web only |
| Emoji in titles, buttons, or empty states | Plain text; user message is the emotion |
| Confetti, particles, bounce-on-every-tap | Subtle feedback; success = link + share, not celebration UI |
| Random icons from mixed sets | Text labels first; icons only when wireframe specifies |
| Gradients on primary buttons | Solid `accent` + white label |
| `borderRadius: 999` pills everywhere | `radius.md` / `radius.lg` per §5 |
| Extra wrapper `View`s “for spacing” | `gap` + token spacing on parent |
| Copy-pasted card styles per screen | Compose `Screen` + shared `shared/ui/` |

### Copy — never write

| Slop copy | Occasio tone |
|---|---|
| “Welcome back!” / “Hey there!” / “Let’s get started!” | State the screen job: “Photos”, “Link ready” |
| “Oops! Something went wrong” | Specific: “Could not create share link” + retry |
| “Unlock premium features” / “Supercharge your…” | “Free limit reached” · plain plan names |
| “Your journey begins here” | What happens next in one line |
| Lorem ipsum or placeholder names (“John Doe”) | Wireframe copy or `[Recipient name]` hint |
| Exclamation marks in body text | Periods; calm, not hype |

Full tone: [product-principles.md](./product-principles.md) — trust-first, no dark patterns.

### Interaction — never add

| Slop pattern | Rule |
|---|---|
| Second primary button competing for attention | One accent CTA; rest `secondary` or `ghost` |
| Full-screen loader for &lt;2s actions | Disabled button + small `ActivityIndicator` |
| Auto-opening modals on tab focus | Soft auth only when user taps a gated action |
| Onboarding carousel before first create | Guest goes straight to Create (PRD) |
| “Skip” + “Get started” + “Sign up” trio | One path forward + one dismiss |

### UI implementation — never do

- Invent a new `*Card` style in a feature — extend `shared/ui/` or match `create/` screens
- Inline `style={{ … }}` with magic numbers — `StyleSheet` + tokens
- `console.log` left in screens for “debug”
- Ship a screen without empty + error path because “we’ll add later”

### Before/after (mental check)

```
❌ Slop: gradient header, “Welcome! 🎉”, two blue CTAs, shadow-xl card
✅ Occasio: cream bg, “Create a wish”, one green Continue, bordered surface tile
```

---

## 12. Reference screen (copy this, don’t reinvent)

When unsure, open **`src/features/create/ui/screens/`** — TemplatePicker, Details, ShareSuccess. Match spacing, `Screen` footer, and button variants.
