# Interactive Recipient Story (Phase A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a 3-scene interactive recipient experience on `/c/[slug]` (balloons → photo deck → letter) for birthday/anniversary, with classic WishCard fallback — per `docs/superpowers/specs/2026-09-17-interactive-recipient-story-design.md`.

**Architecture:** Pure `resolveExperience` builds a scene list from card fields. `StoryPlayer` hosts one scene at a time on the recipient web. Create path persists `experienceMode` + `experienceVersion`. RN only adds Preview copy in Phase A (no full in-app player yet).

**Tech Stack:** Next.js docs-site (React 19), CSS tokens from Occasio design system, existing Lottie/SFX where useful, Node `node:test` + `tsx` for pure lib tests, Jest not required for docs-site.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-17-interactive-recipient-story-design.md`
- Phase A scenes only: `balloons` → `photo_deck` (if photos) → `letter`
- Tokens: Occasio cream/green — **no** HeartCraft pink clone, no emoji UI chrome
- One primary CTA per scene
- `prefers-reduced-motion` → skip pop animations; still show reveal + Continue
- Load/player failure → classic `WishCard`
- Domain helpers: pure TypeScript, no `any`
- Prefer smallest diffs; recipient work lives in `docs-site/`
- Do not start Phase B (candle/gift) in this plan
- No git commits unless the user asks (skip commit steps or leave staged)

---

## File map

| Path | Responsibility |
|---|---|
| `docs-site/src/lib/experience/types.ts` | `ExperienceMode`, `SceneId`, `ResolvedExperience`, card input shape |
| `docs-site/src/lib/experience/splitRevealLine.ts` | Short balloon reveal copy from message/name |
| `docs-site/src/lib/experience/resolveExperience.ts` | Mode + ordered scenes |
| `docs-site/src/lib/experience/splitRevealLine.test.ts` | Unit tests |
| `docs-site/src/lib/experience/resolveExperience.test.ts` | Unit tests |
| `docs-site/src/lib/recipientCard.ts` | Add `experienceMode`, `experienceVersion` |
| `docs-site/src/lib/creationsServer.ts` | Persist + read experience fields; default mode |
| `docs-site/src/components/story/StoryPlayer.tsx` | Scene index, advance, fallback |
| `docs-site/src/components/story/BalloonPopScene.tsx` | Tap balloons → reveal |
| `docs-site/src/components/story/PhotoDeckScene.tsx` | Swipe Polaroid stack |
| `docs-site/src/components/story/LetterScene.tsx` | Letter + celebration + reaction |
| `docs-site/src/components/RecipientCardView.tsx` | Branch classic vs StoryPlayer |
| `docs-site/src/app/globals.css` | Story scene styles (tokens only) |
| `docs-site/package.json` | `test:experience` script |
| `docs-site/content/api-contracts.md` | Document new fields |
| `docs-site/content/recipient-blueprint.md` | Mark story MVP |
| `src/features/create/ui/screens/PreviewScreen.tsx` | One-line interactive note |
| `src/features/create/domain/experienceMode.ts` | Pure helper mirroring server default (optional RN) |

---

### Task 1: Experience domain — types + reveal line + resolve

**Files:**
- Create: `docs-site/src/lib/experience/types.ts`
- Create: `docs-site/src/lib/experience/splitRevealLine.ts`
- Create: `docs-site/src/lib/experience/resolveExperience.ts`
- Create: `docs-site/src/lib/experience/splitRevealLine.test.ts`
- Create: `docs-site/src/lib/experience/resolveExperience.test.ts`
- Modify: `docs-site/package.json` (add test script)

**Interfaces:**
- Produces:
  - `export type ExperienceMode = 'story' | 'classic'`
  - `export type SceneId = 'balloons' | 'photo_deck' | 'letter'`
  - `export type ExperienceCardInput = { templateType: string; mediaUrls?: string[]; message: string | null; recipientName: string; experienceMode?: ExperienceMode | null }`
  - `export type ResolvedExperience = { mode: ExperienceMode; scenes: SceneId[]; revealLine: string }`
  - `splitRevealLine(message: string | null, recipientName: string): string`
  - `resolveExperience(card: ExperienceCardInput): ResolvedExperience`
  - `defaultExperienceMode(templateType: string): ExperienceMode`

- [ ] **Step 1: Write failing tests for `splitRevealLine`**

Create `docs-site/src/lib/experience/splitRevealLine.test.ts`:

```ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { splitRevealLine } from './splitRevealLine';

describe('splitRevealLine', () => {
  it('uses first sentence when message is long enough', () => {
    const line = splitRevealLine(
      'You light up every room. Have the best day.',
      'Aanya',
    );
    assert.equal(line, 'You light up every room.');
  });

  it('falls back when message missing', () => {
    assert.equal(
      splitRevealLine(null, 'Aanya'),
      'You are so special, Aanya.',
    );
  });

  it('falls back when message too short', () => {
    assert.equal(splitRevealLine('Hi', 'Sam'), 'You are so special, Sam.');
  });

  it('truncates very long first sentence to ~80 chars at word boundary', () => {
    const long =
      'This is a very long birthday wish that goes on and on with many words so we must shorten it for balloons.';
    const line = splitRevealLine(long, 'Sam');
    assert.ok(line.length <= 80);
    assert.ok(!line.includes('balloons'));
  });
});
```

- [ ] **Step 2: Write failing tests for `resolveExperience`**

Create `docs-site/src/lib/experience/resolveExperience.test.ts`:

```ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultExperienceMode, resolveExperience } from './resolveExperience';

describe('defaultExperienceMode', () => {
  it('story for birthday and anniversary', () => {
    assert.equal(defaultExperienceMode('birthday'), 'story');
    assert.equal(defaultExperienceMode('anniversary'), 'story');
  });

  it('classic for other occasions', () => {
    assert.equal(defaultExperienceMode('thank_you'), 'classic');
    assert.equal(defaultExperienceMode('just_because'), 'classic');
  });
});

describe('resolveExperience', () => {
  it('uses stored experienceMode when present', () => {
    const r = resolveExperience({
      templateType: 'birthday',
      mediaUrls: ['https://x/a.jpg'],
      message: 'Happy birthday love.',
      recipientName: 'Mom',
      experienceMode: 'classic',
    });
    assert.equal(r.mode, 'classic');
    assert.deepEqual(r.scenes, []);
  });

  it('birthday with photos gets full story pack', () => {
    const r = resolveExperience({
      templateType: 'birthday',
      mediaUrls: ['https://x/a.jpg', 'https://x/b.jpg'],
      message: 'You are wonderful. Enjoy today.',
      recipientName: 'Aanya',
      experienceMode: null,
    });
    assert.equal(r.mode, 'story');
    assert.deepEqual(r.scenes, ['balloons', 'photo_deck', 'letter']);
    assert.ok(r.revealLine.length > 0);
  });

  it('birthday without photos skips photo_deck', () => {
    const r = resolveExperience({
      templateType: 'birthday',
      mediaUrls: [],
      message: 'Happy day.',
      recipientName: 'Sam',
    });
    assert.deepEqual(r.scenes, ['balloons', 'letter']);
  });

  it('filters blank media urls before deciding photo_deck', () => {
    const r = resolveExperience({
      templateType: 'anniversary',
      mediaUrls: ['', '  '],
      message: 'Still us.',
      recipientName: 'Alex',
    });
    assert.deepEqual(r.scenes, ['balloons', 'letter']);
  });
});
```

- [ ] **Step 3: Add test script**

In `docs-site/package.json` scripts:

```json
"test:experience": "npx --yes tsx --test src/lib/experience/*.test.ts"
```

- [ ] **Step 4: Run tests — expect FAIL**

```bash
cd docs-site && npm run test:experience
```

Expected: FAIL (modules missing)

- [ ] **Step 5: Implement types + helpers**

`docs-site/src/lib/experience/types.ts`:

```ts
export type ExperienceMode = 'story' | 'classic';

export type SceneId = 'balloons' | 'photo_deck' | 'letter';

export type ExperienceCardInput = {
  templateType: string;
  mediaUrls?: string[];
  message: string | null;
  recipientName: string;
  experienceMode?: ExperienceMode | null;
};

export type ResolvedExperience = {
  mode: ExperienceMode;
  scenes: SceneId[];
  revealLine: string;
};
```

`docs-site/src/lib/experience/splitRevealLine.ts`:

```ts
const MAX_LEN = 80;
const MIN_USEFUL = 12;

export function splitRevealLine(
  message: string | null,
  recipientName: string,
): string {
  const name = recipientName.trim() || 'you';
  const fallback = `You are so special, ${name}.`;
  const raw = (message ?? '').trim();
  if (raw.length < MIN_USEFUL) return fallback;

  const firstSentence = raw.split(/(?<=[.!?])\s+/)[0]?.trim() || raw;
  if (firstSentence.length <= MAX_LEN) {
    return /[.!?]$/.test(firstSentence) ? firstSentence : `${firstSentence}.`;
  }

  const sliced = firstSentence.slice(0, MAX_LEN);
  const cut = sliced.lastIndexOf(' ');
  const truncated = (cut > 40 ? sliced.slice(0, cut) : sliced).trim();
  return `${truncated}…`;
}
```

`docs-site/src/lib/experience/resolveExperience.ts`:

```ts
import { splitRevealLine } from './splitRevealLine';
import type {
  ExperienceCardInput,
  ExperienceMode,
  ResolvedExperience,
  SceneId,
} from './types';

const STORY_TYPES = new Set(['birthday', 'anniversary']);

export function defaultExperienceMode(templateType: string): ExperienceMode {
  return STORY_TYPES.has(templateType) ? 'story' : 'classic';
}

export function resolveExperience(
  card: ExperienceCardInput,
): ResolvedExperience {
  const mode =
    card.experienceMode === 'story' || card.experienceMode === 'classic'
      ? card.experienceMode
      : defaultExperienceMode(card.templateType);

  const revealLine = splitRevealLine(card.message, card.recipientName);

  if (mode === 'classic') {
    return { mode, scenes: [], revealLine };
  }

  const photos = (card.mediaUrls ?? []).map((u) => u.trim()).filter(Boolean);
  const scenes: SceneId[] = ['balloons'];
  if (photos.length > 0) scenes.push('photo_deck');
  scenes.push('letter');

  return { mode, scenes, revealLine };
}
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd docs-site && npm run test:experience
```

Expected: all tests pass

---

### Task 2: Persist + read `experienceMode` on creations

**Files:**
- Modify: `docs-site/src/lib/recipientCard.ts`
- Modify: `docs-site/src/lib/creationsServer.ts`
- Modify: `docs-site/content/api-contracts.md`

**Interfaces:**
- Consumes: `defaultExperienceMode` from Task 1
- Produces: `RecipientCard.experienceMode`, `RecipientCard.experienceVersion`; Firestore write/read

- [ ] **Step 1: Extend `RecipientCard`**

In `docs-site/src/lib/recipientCard.ts`, add:

```ts
experienceMode?: 'story' | 'classic' | null;
experienceVersion?: number | null;
```

Also set on `parseDemoSlug` return: `experienceMode: 'story'`, `experienceVersion: 1` (demo birthday stays competitive).

- [ ] **Step 2: Persist on create**

In `creationsServer.ts`:

1. Import `defaultExperienceMode` from `@/lib/experience/resolveExperience`.
2. When building the Firestore `set` payload, add:

```ts
experienceMode: defaultExperienceMode(input.templateType),
experienceVersion: 1,
```

(Do not require client to send mode in Phase A.)

- [ ] **Step 3: Read on lookup**

In `lookupCardBySlug` card mapping:

```ts
experienceMode:
  doc.experienceMode === 'story' || doc.experienceMode === 'classic'
    ? doc.experienceMode
    : null,
experienceVersion: (doc.experienceVersion as number | undefined) ?? null,
```

Legacy docs with `null` still resolve via `resolveExperience` default (birthday → story).

- [ ] **Step 4: Document API**

In `docs-site/content/api-contracts.md` under creations / card shape, note:

```md
| `experienceMode` | `'story' \| 'classic'` | Set server-side from templateType (birthday/anniversary → story) |
| `experienceVersion` | number | `1` for Phase A packs |
```

- [ ] **Step 5: Typecheck docs-site**

```bash
cd docs-site && npx tsc --noEmit
```

Expected: clean (or only pre-existing unrelated errors)

---

### Task 3: `StoryPlayer` shell + classic branch

**Files:**
- Create: `docs-site/src/components/story/StoryPlayer.tsx`
- Modify: `docs-site/src/components/RecipientCardView.tsx`
- Modify: `docs-site/src/app/globals.css` (minimal player chrome)

**Interfaces:**
- Consumes: `resolveExperience`, `RecipientCard`
- Produces: `StoryPlayer({ card, slug })` — for now stub scenes with Continue advancing until Task 4–6 fill them

- [ ] **Step 1: Implement `StoryPlayer` with placeholder scene bodies**

```tsx
'use client';

import { useCallback, useMemo, useState } from 'react';
import { resolveExperience } from '@/lib/experience/resolveExperience';
import type { SceneId } from '@/lib/experience/types';
import type { RecipientCard } from '@/lib/recipientCard';
import { WishCard } from '@/components/WishCard';
import { CardReaction } from '@/components/CardReaction';
import { OccasionStickerShower } from '@/components/OccasionStickerShower';
import Link from 'next/link';

type Props = { card: RecipientCard; slug: string };

export function StoryPlayer({ card, slug }: Props) {
  const resolved = useMemo(() => resolveExperience(card), [card]);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const scene: SceneId | null = resolved.scenes[index] ?? null;

  const advance = useCallback(() => {
    setIndex((i) => Math.min(i + 1, resolved.scenes.length - 1));
  }, [resolved.scenes.length]);

  if (failed || resolved.mode === 'classic' || !scene) {
    // classic fallback tree matches prior RecipientCardView
    return (
      <div className="wish-recipient-page">
        <OccasionStickerShower templateType={card.templateType} replayKey={0} />
        <div className="wish-recipient-inner">
          <p className="mb-6 text-center text-xs font-medium tracking-wide text-[var(--accent)]">
            Occasio
          </p>
          <WishCard card={card} />
          {!card.isDemo ? (
            <CardReaction slug={slug} initialCount={card.reactionCount ?? 0} />
          ) : null}
          <div className="mt-8 text-center">
            <Link href="/" className="landing-btn-primary">
              Make one for someone
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wish-recipient-page story-player">
      <div className="wish-recipient-inner">
        <p className="mb-4 text-center text-xs font-medium tracking-wide text-[var(--accent)]">
          Occasio
        </p>
        <div
          className="story-progress"
          aria-label={`Step ${index + 1} of ${resolved.scenes.length}`}
        >
          {resolved.scenes.map((id, i) => (
            <span
              key={id}
              className={`story-progress__dot${i <= index ? ' is-on' : ''}`}
            />
          ))}
        </div>

        {/* Task 4–6 replace these stubs */}
        <div className="story-scene" data-scene={scene}>
          <p className="story-scene__hint">{scene}</p>
          <button type="button" className="landing-btn-primary" onClick={advance}>
            Continue
          </button>
        </div>

        <button
          type="button"
          className="story-skip"
          onClick={() => setIndex(resolved.scenes.length - 1)}
        >
          Skip to message
        </button>
      </div>
    </div>
  );
}
```

Add CSS (token-based):

```css
.story-progress {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 1.5rem;
}
.story-progress__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--muted) 35%, transparent);
}
.story-progress__dot.is-on {
  background: var(--accent);
}
.story-skip {
  display: block;
  margin: 1rem auto 0;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 0.85rem;
  text-decoration: underline;
  cursor: pointer;
}
```

- [ ] **Step 2: Branch in `RecipientCardView`**

```tsx
import { resolveExperience } from '@/lib/experience/resolveExperience';
import { StoryPlayer } from '@/components/story/StoryPlayer';

export function RecipientCardView({ card, slug }: Props) {
  const resolved = resolveExperience(card);
  if (resolved.mode === 'story') {
    return <StoryPlayer card={card} slug={slug} />;
  }
  // existing classic JSX unchanged
  ...
}
```

Wrap `StoryPlayer` in an error boundary **or** try/catch via a tiny `StoryPlayerSafe` that sets classic on render error — simplest Phase A: inside `StoryPlayer`, keep `failed` state and a `componentDidCatch` is overkill; use:

```tsx
// optional wrapper
export function RecipientCardView(...) {
  try {
    const resolved = resolveExperience(card);
    if (resolved.mode === 'story') {
      return <StoryPlayer card={card} slug={slug} />;
    }
  } catch {
    // fall through to classic
  }
  // classic...
}
```

- [ ] **Step 3: Manual smoke**

```bash
cd docs-site && npm run dev
```

Open a demo birthday slug (or local create). Expect progress dots + stub Continue advances. Non-birthday still classic.

---

### Task 4: Balloon pop scene

**Files:**
- Create: `docs-site/src/components/story/BalloonPopScene.tsx`
- Modify: `docs-site/src/components/story/StoryPlayer.tsx`
- Modify: `docs-site/src/app/globals.css`

**Interfaces:**
- Consumes: `revealLine: string`, `onComplete: () => void`
- Produces: interactive balloon gate

- [ ] **Step 1: Implement `BalloonPopScene`**

Requirements:
- Render 4 balloon buttons in a 2×2 grid
- Each tap marks popped (hide or scale-out); use CSS transition; respect `prefers-reduced-motion: reduce` (instant hide)
- After all popped, show `revealLine` and enable primary **Continue**
- Also allow Continue once reveal is visible
- Calm copy: title `Pop the balloons` (no emoji)

Skeleton:

```tsx
'use client';

import { useMemo, useState } from 'react';

type Props = {
  revealLine: string;
  onComplete: () => void;
};

const COUNT = 4;

export function BalloonPopScene({ revealLine, onComplete }: Props) {
  const [popped, setPopped] = useState<boolean[]>(() =>
    Array.from({ length: COUNT }, () => false),
  );
  const allPopped = popped.every(Boolean);

  return (
    <section className="story-balloons" aria-label="Pop the balloons">
      <h2 className="story-scene-title">Pop the balloons</h2>
      <div className="story-balloons__grid">
        {popped.map((isPopped, i) => (
          <button
            key={i}
            type="button"
            className={`story-balloon${isPopped ? ' is-popped' : ''}`}
            aria-label={isPopped ? 'Popped' : `Balloon ${i + 1}`}
            disabled={isPopped}
            onClick={() =>
              setPopped((prev) => prev.map((v, j) => (j === i ? true : v)))
            }
          />
        ))}
      </div>
      {allPopped ? (
        <p className="story-reveal-line" role="status">
          {revealLine}
        </p>
      ) : (
        <p className="story-scene-sub">Tap each one</p>
      )}
      <button
        type="button"
        className="landing-btn-primary"
        disabled={!allPopped}
        onClick={onComplete}
      >
        Continue
      </button>
    </section>
  );
}
```

Style balloons with `var(--accent)` / soft fills from tokens — not pink HeartCraft balloons. Simple CSS circles + string are fine for A; optional: reuse public Lottie later.

- [ ] **Step 2: Wire into `StoryPlayer`**

Replace stub when `scene === 'balloons'`:

```tsx
{scene === 'balloons' ? (
  <BalloonPopScene revealLine={resolved.revealLine} onComplete={advance} />
) : null}
```

- [ ] **Step 3: Manual check** — Continue disabled until 4 pops; reduced-motion still works

---

### Task 5: Photo deck scene

**Files:**
- Create: `docs-site/src/components/story/PhotoDeckScene.tsx`
- Modify: `docs-site/src/components/story/StoryPlayer.tsx`
- Modify: `docs-site/src/app/globals.css`

**Interfaces:**
- Consumes: `urls: string[]`, `onComplete: () => void`
- Produces: swipeable Polaroid stack

- [ ] **Step 1: Implement swipe deck**

Keep Phase A simple — pointer events, no new deps:

```tsx
'use client';

import { useState } from 'react';

type Props = {
  urls: string[];
  onComplete: () => void;
};

export function PhotoDeckScene({ urls, onComplete }: Props) {
  const photos = urls.map((u) => u.trim()).filter(Boolean);
  const [top, setTop] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const current = photos[top];
  const done = top >= photos.length;

  if (photos.length === 0 || done) {
    return (
      <section className="story-photos">
        <h2 className="story-scene-title">Sweet moments</h2>
        <button type="button" className="landing-btn-primary" onClick={onComplete}>
          Continue
        </button>
      </section>
    );
  }

  return (
    <section className="story-photos">
      <h2 className="story-scene-title">Sweet moments</h2>
      <p className="story-scene-sub">Swipe the cards</p>
      <div
        className="story-polaroid-stack"
        onPointerDown={(e) => {
          setDragging(true);
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          setDx((d) => d + e.movementX);
        }}
        onPointerUp={() => {
          setDragging(false);
          if (Math.abs(dx) > 80) {
            setTop((t) => t + 1);
          }
          setDx(0);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt=""
          className="story-polaroid"
          style={{ transform: `translateX(${dx}px) rotate(${dx / 40}deg)` }}
          draggable={false}
          onError={() => setTop((t) => t + 1)}
        />
      </div>
      <button type="button" className="landing-btn-primary" onClick={onComplete}>
        Continue
      </button>
    </section>
  );
}
```

Polaroid CSS: white frame, soft shadow, cream page background — match Occasio, not pink.

- [ ] **Step 2: Wire `photo_deck` in StoryPlayer**

```tsx
{scene === 'photo_deck' ? (
  <PhotoDeckScene
    urls={card.mediaUrls ?? []}
    onComplete={advance}
  />
) : null}
```

- [ ] **Step 3: Manual** — 1 and 3 photos; broken URL skips; Continue always available

---

### Task 6: Letter scene (terminal)

**Files:**
- Create: `docs-site/src/components/story/LetterScene.tsx`
- Modify: `docs-site/src/components/story/StoryPlayer.tsx`

**Interfaces:**
- Consumes: full `card`, `slug`
- Produces: message + celebration + reaction + CTA (no further Continue)

- [ ] **Step 1: Implement `LetterScene`**

Reuse existing pieces rather than redesigning WishCard from scratch:

```tsx
'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { CardReaction } from '@/components/CardReaction';
import { OccasionStickerShower } from '@/components/OccasionStickerShower';
import { WishCard } from '@/components/WishCard';
import type { RecipientCard } from '@/lib/recipientCard';

type Props = { card: RecipientCard; slug: string };

export function LetterScene({ card, slug }: Props) {
  const [replayKey, setReplayKey] = useState(0);
  const handleReplay = useCallback(() => {
    setReplayKey((k) => k + 1);
  }, []);

  return (
    <section className="story-letter">
      <h2 className="story-scene-title">A message for you</h2>
      <OccasionStickerShower
        templateType={card.templateType}
        replayKey={replayKey}
      />
      <WishCard card={card} replayKey={replayKey} onReplay={handleReplay} />
      {card.isDemo ? (
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          Preview card — create the link in the app for a real share URL.
        </p>
      ) : (
        <CardReaction slug={slug} initialCount={card.reactionCount ?? 0} />
      )}
      <div className="mt-8 text-center">
        <Link href="/" className="landing-btn-primary">
          Make one for someone
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire `letter` — hide Skip on last scene; no Continue**

```tsx
{scene === 'letter' ? <LetterScene card={card} slug={slug} /> : null}
{scene !== 'letter' ? (
  <button type="button" className="story-skip" onClick={() => setIndex(resolved.scenes.length - 1)}>
    Skip to message
  </button>
) : null}
```

Remove stub Continue for letter.

- [ ] **Step 3: End-to-end manual**

Create birthday card with 2 photos via app → open share URL → complete balloons → swipe photos → letter + heart.

---

### Task 7: RN Preview note + blueprints

**Files:**
- Create: `src/features/create/domain/experienceMode.ts`
- Modify: `src/features/create/ui/screens/PreviewScreen.tsx`
- Modify: `docs-site/content/recipient-blueprint.md`
- Add/update: `__tests__/create/experienceMode.test.ts` (root Jest)

**Interfaces:**
- Produces: `isInteractiveExperience(templateType: TemplateType | null): boolean`

- [ ] **Step 1: Domain helper + test**

```ts
// src/features/create/domain/experienceMode.ts
import type { TemplateType } from './types';

export function isInteractiveExperience(
  templateType: TemplateType | null,
): boolean {
  return templateType === 'birthday' || templateType === 'anniversary';
}
```

```ts
// __tests__/create/experienceMode.test.ts
import { isInteractiveExperience } from '../../src/features/create/domain/experienceMode';

describe('isInteractiveExperience', () => {
  it('true for birthday and anniversary', () => {
    expect(isInteractiveExperience('birthday')).toBe(true);
    expect(isInteractiveExperience('anniversary')).toBe(true);
  });
  it('false otherwise', () => {
    expect(isInteractiveExperience('thank_you')).toBe(false);
    expect(isInteractiveExperience(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Preview copy**

Above primary share CTA on `PreviewScreen`, when `isInteractiveExperience(draft.templateType)`:

```tsx
<Text style={styles.hint}>
  They’ll open a short interactive experience — balloons, photos, then your message.
</Text>
```

Use existing `colors.muted` / `typography` — calm, no hype.

- [ ] **Step 3: Update `recipient-blueprint.md`**

Add status row: Interactive story (Phase A) ✅ balloons / photo deck / letter; candle/gift Phase B.

- [ ] **Step 4: Verify**

```bash
npm test -- --testPathPattern=experienceMode
cd docs-site && npm run test:experience
npx tsc --noEmit
```

---

## Phase A acceptance checklist

- [ ] Birthday (+ anniversary) share → story with 3 or 2 scenes
- [ ] Other occasions → classic WishCard
- [ ] 0 photos → no photo_deck
- [ ] Reaction + Make one work after letter
- [ ] Cream/green only
- [ ] Domain tests green
- [ ] Manual WhatsApp in-app browser smoke

## Out of scope (later plans)

- Phase B: candle, gift, RN StoryPlayer parity, creator toggle  
- Phase C: packs, music, mic, analytics events  

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|---|---|
| Balloons → photos → letter | 4, 5, 6 |
| Mode default birthday/anniversary | 1, 2 |
| Persist experienceMode | 2 |
| Classic fallback | 3 |
| Reduced motion | 4 |
| Preview note | 7 |
| No HeartCraft pink / no Phase B | Global constraints |
| Tests for resolve + reveal | 1 |
