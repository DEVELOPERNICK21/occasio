# Template System MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship relationship-first create (Who → Occasion → recommend) with a data-driven 5-template catalog, layout-primitive renderer, and Quick Create (B10), so guests can create and share without a Canva-style category grid.

**Architecture:** Stay in `src/features/create/`. Template definitions live as data (`catalog.json` + schema parse). Domain ranks templates; UI renders via 3 layout primitives (`editorial_portrait`, `dual_editorial`, `minimal_fullscreen`). Draft gains `audience` / `occasion` / `templateId`; API `templateType` = `occasion` string. Remote catalog override is a no-op stub.

**Tech Stack:** React Native CLI, TypeScript strict, Jest domain tests, React Navigation native stack, existing create upload/share pipeline.

**Spec:** [`docs-site/content/template-system-blueprint.md`](../../docs-site/content/template-system-blueprint.md)

## Global Constraints

- Layers: `ui` ↛ Firebase/RevenueCat; `data` ↛ React; domain pure, no `any`
- UI: `tokens.ts` only; no emoji-as-UI; one primary CTA; calm copy (`ui-design-principles.md` §11)
- No per-template React files (`B01.tsx` …)
- Seed templates all free; no PRO gating
- v1 photos: 1–2 slots only; hide B04 when `maxPhotosAllowed < 2`
- Recipient web layout parity out of scope
- Shipaton paused; do not expand billing in this plan
- Commits only when the user explicitly asks (skip commit steps unless requested)

---

## File map

| Path | Responsibility |
|---|---|
| `src/features/create/domain/templateSchema.ts` | Types + `parseTemplateCatalog` |
| `src/features/create/domain/recommendTemplates.ts` | Ranking |
| `src/features/create/domain/audienceOccasion.ts` | Audience/occasion labels + option lists |
| `src/features/create/domain/types.ts` | Extend draft + `TemplateType` |
| `src/features/create/domain/templates.ts` | Labels for new occasions |
| `src/features/create/domain/templateTheme.ts` | Themes for new occasions |
| `src/features/create/domain/creationRules.ts` | `canPreview` requires `templateId` + photos |
| `src/features/create/data/templates/catalog.json` | 5 seed definitions |
| `src/features/create/data/templateCatalog.ts` | `loadCatalog` + remote stub |
| `src/features/create/data/createDraftStorage.ts` | Persist new draft fields |
| `src/features/create/application/useCreateDraft.ts` | Setters for audience/occasion/templateId |
| `src/features/create/application/useTemplateCatalog.ts` | Catalog hook |
| `src/features/create/ui/components/layouts/*.tsx` | 3 primitives |
| `src/features/create/ui/components/TemplateRenderer.tsx` | Switch on `layoutId` |
| `src/features/create/ui/screens/WhoForScreen.tsx` | Step 1 |
| `src/features/create/ui/screens/OccasionScreen.tsx` | Step 2 |
| `src/features/create/ui/screens/TemplateRecommendScreen.tsx` | Step 3 |
| `src/shared/navigation/types.ts` + `CreateNavigator.tsx` | Routes |
| `src/features/create/ui/screens/CreateHomeScreen.tsx` | Entry CTAs |
| `src/features/create/ui/screens/AddPhotosScreen.tsx` | Slot count from template |
| `src/features/create/ui/screens/PreviewScreen.tsx` + `CardPreviewStage.tsx` | Use renderer |
| `src/shared/analytics/events.ts` | New events |
| `__tests__/create/templateSystem.test.ts` | Domain tests |
| `docs-site/content/template-system-blueprint.md` | Check acceptance boxes when done |

---

### Task 1: Domain schema + seed catalog parse

**Files:**
- Create: `src/features/create/domain/templateSchema.ts`
- Create: `src/features/create/data/templates/catalog.json`
- Create: `__tests__/create/templateSystem.test.ts`
- Test: `__tests__/create/templateSystem.test.ts`

**Interfaces:**
- Produces: `Audience`, `Occasion`, `LayoutId`, `TemplateDefinition`, `parseTemplateCatalog(raw: unknown): TemplateDefinition[]`

- [ ] **Step 1: Write failing tests for schema parse**

```ts
// __tests__/create/templateSystem.test.ts
import { parseTemplateCatalog } from '../../src/features/create/domain/templateSchema';
import catalog from '../../src/features/create/data/templates/catalog.json';

describe('parseTemplateCatalog', () => {
  it('parses the seed catalog (5 templates)', () => {
    const parsed = parseTemplateCatalog(catalog);
    expect(parsed).toHaveLength(5);
    expect(parsed.map((t) => t.id).sort()).toEqual(
      ['B01', 'B04', 'B10', 'L06', 'T01'].sort(),
    );
  });

  it('rejects invalid catalog entries', () => {
    expect(() =>
      parseTemplateCatalog([{ id: 'X', layoutId: 'nope' }]),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (module missing)

```sh
npx jest __tests__/create/templateSystem.test.ts -v
```

- [ ] **Step 3: Enable JSON imports if needed**

In `tsconfig.json` set `"resolveJsonModule": true` (and ensure Jest can resolve JSON — default usually works).

- [ ] **Step 4: Add `catalog.json`**

```json
[
  {
    "id": "B01",
    "title": "It's Your Day",
    "category": "birthday",
    "audiences": ["mom", "dad", "partner", "friend", "family", "someone_special"],
    "occasions": ["birthday"],
    "style": "elegant",
    "layoutId": "editorial_portrait",
    "photoSlots": 1,
    "texts": [
      { "key": "headline", "role": "headline", "default": "Happy Birthday" },
      { "key": "body", "role": "body", "default": "With love, always." }
    ]
  },
  {
    "id": "B04",
    "title": "For Mom",
    "category": "birthday",
    "audiences": ["mom"],
    "occasions": ["birthday"],
    "style": "emotional",
    "layoutId": "dual_editorial",
    "photoSlots": 2,
    "texts": [
      { "key": "headline", "role": "headline", "default": "Happy Birthday, Mom." },
      {
        "key": "body",
        "role": "body",
        "default": "Everything good in me has a little bit of you."
      }
    ]
  },
  {
    "id": "B10",
    "title": "Just You",
    "category": "birthday",
    "audiences": ["mom", "dad", "partner", "friend", "family", "someone_special"],
    "occasions": ["birthday", "just_because"],
    "style": "minimal",
    "layoutId": "minimal_fullscreen",
    "photoSlots": 1,
    "quickCreate": true,
    "texts": [
      { "key": "headline", "role": "headline", "default": "Happy Birthday" }
    ]
  },
  {
    "id": "L06",
    "title": "Just Because",
    "category": "love",
    "audiences": ["partner", "someone_special"],
    "occasions": ["just_because", "anniversary"],
    "style": "emotional",
    "layoutId": "editorial_portrait",
    "photoSlots": 1,
    "texts": [
      { "key": "headline", "role": "headline", "default": "Just because" },
      {
        "key": "body",
        "role": "body",
        "default": "I just wanted you to know I love you."
      }
    ]
  },
  {
    "id": "T01",
    "title": "Thank You",
    "category": "thank_you",
    "audiences": ["mom", "dad", "partner", "friend", "family", "someone_special"],
    "occasions": ["thank_you", "congratulations"],
    "style": "elegant",
    "layoutId": "editorial_portrait",
    "photoSlots": 1,
    "texts": [
      { "key": "headline", "role": "headline", "default": "Thank you" },
      { "key": "body", "role": "body", "default": "for being there." }
    ]
  }
]
```

- [ ] **Step 5: Implement `templateSchema.ts`**

```ts
export type Audience =
  | 'mom'
  | 'dad'
  | 'partner'
  | 'friend'
  | 'family'
  | 'someone_special';

export type Occasion =
  | 'birthday'
  | 'anniversary'
  | 'thank_you'
  | 'congratulations'
  | 'just_because';

export type LayoutId =
  | 'editorial_portrait'
  | 'dual_editorial'
  | 'minimal_fullscreen';

export type TemplateTextRole = 'headline' | 'body' | 'name';

export type TemplateTextSlot = {
  key: string;
  role: TemplateTextRole;
  default: string;
};

export type TemplateDefinition = {
  id: string;
  title: string;
  category: 'birthday' | 'love' | 'thank_you';
  audiences: Audience[];
  occasions: Occasion[];
  style: 'elegant' | 'emotional' | 'minimal';
  layoutId: LayoutId;
  photoSlots: 1 | 2;
  texts: TemplateTextSlot[];
  quickCreate?: boolean;
};

const LAYOUT_IDS = new Set<LayoutId>([
  'editorial_portrait',
  'dual_editorial',
  'minimal_fullscreen',
]);

function isAudience(v: unknown): v is Audience {
  return (
    v === 'mom' ||
    v === 'dad' ||
    v === 'partner' ||
    v === 'friend' ||
    v === 'family' ||
    v === 'someone_special'
  );
}

function isOccasion(v: unknown): v is Occasion {
  return (
    v === 'birthday' ||
    v === 'anniversary' ||
    v === 'thank_you' ||
    v === 'congratulations' ||
    v === 'just_because'
  );
}

function parseOne(raw: unknown): TemplateDefinition {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid template entry');
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.title !== 'string') {
    throw new Error('Template missing id/title');
  }
  if (
    r.layoutId !== 'editorial_portrait' &&
    r.layoutId !== 'dual_editorial' &&
    r.layoutId !== 'minimal_fullscreen'
  ) {
    throw new Error(`Unknown layoutId: ${String(r.layoutId)}`);
  }
  if (r.photoSlots !== 1 && r.photoSlots !== 2) {
    throw new Error('photoSlots must be 1 or 2');
  }
  if (!Array.isArray(r.audiences) || !r.audiences.every(isAudience)) {
    throw new Error('Invalid audiences');
  }
  if (!Array.isArray(r.occasions) || !r.occasions.every(isOccasion)) {
    throw new Error('Invalid occasions');
  }
  if (!Array.isArray(r.texts)) {
    throw new Error('Invalid texts');
  }
  const texts: TemplateTextSlot[] = r.texts.map((t) => {
    if (!t || typeof t !== 'object') throw new Error('Invalid text slot');
    const s = t as Record<string, unknown>;
    if (
      typeof s.key !== 'string' ||
      typeof s.default !== 'string' ||
      (s.role !== 'headline' && s.role !== 'body' && s.role !== 'name')
    ) {
      throw new Error('Invalid text slot fields');
    }
    return { key: s.key, role: s.role, default: s.default };
  });

  return {
    id: r.id,
    title: r.title,
    category:
      r.category === 'birthday' || r.category === 'love' || r.category === 'thank_you'
        ? r.category
        : (() => {
            throw new Error('Invalid category');
          })(),
    audiences: r.audiences,
    occasions: r.occasions,
    style:
      r.style === 'elegant' || r.style === 'emotional' || r.style === 'minimal'
        ? r.style
        : (() => {
            throw new Error('Invalid style');
          })(),
    layoutId: r.layoutId,
    photoSlots: r.photoSlots,
    texts,
    quickCreate: r.quickCreate === true ? true : undefined,
  };
}

export function parseTemplateCatalog(raw: unknown): TemplateDefinition[] {
  if (!Array.isArray(raw)) {
    throw new Error('Catalog must be an array');
  }
  const parsed = raw.map(parseOne);
  if (parsed.length === 0) {
    throw new Error('Catalog is empty');
  }
  void LAYOUT_IDS; // keep set for future guards
  return parsed;
}
```

- [ ] **Step 6: Run tests — expect PASS**

```sh
npx jest __tests__/create/templateSystem.test.ts -v
```

---

### Task 2: `recommendTemplates` (domain)

**Files:**
- Create: `src/features/create/domain/recommendTemplates.ts`
- Modify: `__tests__/create/templateSystem.test.ts`

**Interfaces:**
- Consumes: `TemplateDefinition`, `Audience`, `Occasion` from `templateSchema`
- Produces: `recommendTemplates(input): TemplateDefinition[]`

- [ ] **Step 1: Write failing recommendation tests**

```ts
import { parseTemplateCatalog } from '../../src/features/create/domain/templateSchema';
import { recommendTemplates } from '../../src/features/create/domain/recommendTemplates';
import catalogJson from '../../src/features/create/data/templates/catalog.json';

const catalog = parseTemplateCatalog(catalogJson);

describe('recommendTemplates', () => {
  it('ranks B04 first for mom + birthday when 2 photos allowed', () => {
    const ids = recommendTemplates({
      audience: 'mom',
      occasion: 'birthday',
      catalog,
      maxPhotosAllowed: 2,
    }).map((t) => t.id);
    expect(ids[0]).toBe('B04');
    expect(ids.length).toBeGreaterThanOrEqual(1);
    expect(ids.length).toBeLessThanOrEqual(5);
  });

  it('hides B04 when only 1 photo allowed', () => {
    const ids = recommendTemplates({
      audience: 'mom',
      occasion: 'birthday',
      catalog,
      maxPhotosAllowed: 1,
    }).map((t) => t.id);
    expect(ids).not.toContain('B04');
    expect(ids.length).toBeGreaterThan(0);
  });

  it('prefers L06 for partner + just_because', () => {
    const ids = recommendTemplates({
      audience: 'partner',
      occasion: 'just_because',
      catalog,
      maxPhotosAllowed: 1,
    }).map((t) => t.id);
    expect(ids[0]).toBe('L06');
  });

  it('never returns empty for thin occasion matches', () => {
    const ids = recommendTemplates({
      audience: 'friend',
      occasion: 'congratulations',
      catalog,
      maxPhotosAllowed: 1,
    });
    expect(ids.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```sh
npx jest __tests__/create/templateSystem.test.ts -v
```

- [ ] **Step 3: Implement `recommendTemplates.ts`**

```ts
import type { Audience, Occasion, TemplateDefinition } from './templateSchema';

export type RecommendInput = {
  audience: Audience;
  occasion: Occasion;
  catalog: TemplateDefinition[];
  maxPhotosAllowed: number;
  limit?: number;
};

const FALLBACK_ORDER = ['B10', 'B01', 'T01', 'L06', 'B04'] as const;

export function recommendTemplates(input: RecommendInput): TemplateDefinition[] {
  const limit = input.limit ?? 5;
  const eligible = input.catalog.filter(
    (t) => t.photoSlots <= input.maxPhotosAllowed,
  );

  const scored = eligible.map((t) => {
    let score = 0;
    if (t.occasions.includes(input.occasion)) score += 10;
    if (t.audiences.includes(input.audience)) score += 8;
    if (
      input.audience === 'mom' &&
      input.occasion === 'birthday' &&
      t.id === 'B04'
    ) {
      score += 20;
    }
    if (
      input.audience === 'partner' &&
      input.occasion === 'just_because' &&
      t.id === 'L06'
    ) {
      score += 20;
    }
    if (input.occasion === 'thank_you' && t.id === 'T01') score += 15;
    if (input.occasion === 'birthday' && (t.id === 'B01' || t.id === 'B10')) {
      score += 5;
    }
    return { t, score };
  });

  scored.sort((a, b) => b.score - a.score || a.t.id.localeCompare(b.t.id));

  let ranked = scored.filter((s) => s.score > 0).map((s) => s.t);

  if (ranked.length === 0) {
    const byId = new Map(eligible.map((t) => [t.id, t]));
    ranked = FALLBACK_ORDER.map((id) => byId.get(id)).filter(
      (t): t is TemplateDefinition => Boolean(t),
    );
  }

  // Dedupe preserve order
  const seen = new Set<string>();
  const out: TemplateDefinition[] = [];
  for (const t of ranked) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
    if (out.length >= limit) break;
  }

  if (out.length === 0 && eligible.length > 0) {
    return eligible.slice(0, limit);
  }

  return out;
}
```

- [ ] **Step 4: Run — expect PASS**

```sh
npx jest __tests__/create/templateSystem.test.ts -v
```

---

### Task 3: Catalog loader (hybrid stub)

**Files:**
- Create: `src/features/create/data/templateCatalog.ts`
- Create: `src/features/create/application/useTemplateCatalog.ts`
- Modify: `__tests__/create/templateSystem.test.ts` (optional loadCatalog test)

**Interfaces:**
- Produces: `loadCatalog(): TemplateDefinition[]`, `fetchRemoteCatalogOverride(): Promise<TemplateDefinition[] | null>`
- Produces: `useTemplateCatalog()` → `{ templates, getById, isLoading }`

- [ ] **Step 1: Implement `templateCatalog.ts`**

```ts
import catalogJson from './templates/catalog.json';
import {
  parseTemplateCatalog,
  type TemplateDefinition,
} from '../domain/templateSchema';

export function loadCatalog(): TemplateDefinition[] {
  return parseTemplateCatalog(catalogJson);
}

/** v1 stub — always null. Later: fetch CDN/Firestore and merge by id. */
export async function fetchRemoteCatalogOverride(): Promise<
  TemplateDefinition[] | null
> {
  return null;
}

export async function loadCatalogWithOptionalRemote(): Promise<
  TemplateDefinition[]
> {
  const bundled = loadCatalog();
  const remote = await fetchRemoteCatalogOverride();
  if (!remote || remote.length === 0) return bundled;

  const byId = new Map(bundled.map((t) => [t.id, t]));
  for (const t of remote) {
    byId.set(t.id, t);
  }
  return Array.from(byId.values());
}
```

- [ ] **Step 2: Implement `useTemplateCatalog.ts`**

```ts
import { useEffect, useMemo, useState } from 'react';
import { loadCatalogWithOptionalRemote } from '../data/templateCatalog';
import type { TemplateDefinition } from '../domain/templateSchema';

export function useTemplateCatalog() {
  const [templates, setTemplates] = useState<TemplateDefinition[]>(() =>
    // sync bundled for first paint; remote merge optional
    require('../data/templateCatalog').loadCatalog(),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadCatalogWithOptionalRemote().then((list) => {
      if (!cancelled) {
        setTemplates(list);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const getById = useMemo(() => {
    const map = new Map(templates.map((t) => [t.id, t]));
    return (id: string) => map.get(id) ?? null;
  }, [templates]);

  return { templates, getById, isLoading };
}
```

Prefer importing `loadCatalog` instead of `require` for the initial state:

```ts
import { loadCatalog, loadCatalogWithOptionalRemote } from '../data/templateCatalog';
// useState(() => loadCatalog())
```

- [ ] **Step 3: Smoke-test in Jest**

```ts
import { loadCatalog } from '../../src/features/create/data/templateCatalog';

it('loadCatalog returns 5 templates', () => {
  expect(loadCatalog()).toHaveLength(5);
});
```

```sh
npx jest __tests__/create/templateSystem.test.ts -v
```

---

### Task 4: Extend draft types, storage, creation rules, occasion labels

**Files:**
- Modify: `src/features/create/domain/types.ts`
- Modify: `src/features/create/domain/creationRules.ts`
- Modify: `src/features/create/domain/templates.ts`
- Modify: `src/features/create/domain/templateTheme.ts`
- Modify: `src/features/create/data/createDraftStorage.ts`
- Modify: `src/features/create/application/useCreateDraft.ts`
- Modify: `__tests__/create/domain.test.ts`
- Create: `src/features/create/domain/audienceOccasion.ts`

**Interfaces:**
- Produces: draft fields `audience`, `occasion`, `templateId`
- Produces: `templateType` synced from `occasion` for API
- Produces: `startWish` / `startQuickCreate` / setters

- [ ] **Step 1: Extend `types.ts`**

```ts
import type { Audience, Occasion } from './templateSchema';

export type TemplateType =
  | 'birthday'
  | 'anniversary'
  | 'sorry'
  | 'proposal'
  | 'mothers_day'
  | 'fathers_day'
  | 'thank_you'
  | 'congratulations'
  | 'just_because';

export type CreationDraft = {
  templateType: TemplateType | null;
  templateId: string | null;
  audience: Audience | null;
  occasion: Occasion | null;
  photoUris: string[];
  recipientName: string;
  message: string;
};

export const EMPTY_CREATION_DRAFT: CreationDraft = {
  templateType: null,
  templateId: null,
  audience: null,
  occasion: null,
  photoUris: [],
  recipientName: '',
  message: '',
};
```

- [ ] **Step 2: Update `creationRules.ts`**

```ts
export function canPreviewDraft(draft: CreationDraft): boolean {
  return (
    draft.templateId !== null &&
    draft.photoUris.length >= 1 &&
    draft.recipientName.trim().length > 0
  );
}
```

Update `__tests__/create/domain.test.ts` accordingly (include `templateId: 'B01'`).

- [ ] **Step 3: `audienceOccasion.ts`**

```ts
import type { Audience, Occasion } from './templateSchema';

export const AUDIENCE_OPTIONS: { id: Audience; label: string }[] = [
  { id: 'someone_special', label: 'Someone special' },
  { id: 'mom', label: 'Mom' },
  { id: 'dad', label: 'Dad' },
  { id: 'friend', label: 'Best friend' },
  { id: 'partner', label: 'Partner' },
  { id: 'family', label: 'Family' },
];

export const OCCASION_OPTIONS: { id: Occasion; label: string }[] = [
  { id: 'birthday', label: 'Birthday' },
  { id: 'anniversary', label: 'Anniversary' },
  { id: 'thank_you', label: 'Thank you' },
  { id: 'congratulations', label: 'Congratulations' },
  { id: 'just_because', label: 'Just because' },
];

export function occasionToTemplateType(occasion: Occasion): TemplateType {
  return occasion; // same string; TemplateType includes these values
}
```

(Import `TemplateType` in that file.)

- [ ] **Step 4: Extend `templates.ts` + `templateTheme.ts`**

Add options/themes for `thank_you`, `congratulations`, `just_because` (token colors only — reuse soft backgrounds from birthday/anniversary; no new random hex outside existing theme palette). Update `wishGreeting` for the new types.

- [ ] **Step 5: Update `createDraftStorage.ts`**

- Extend `TEMPLATE_TYPES` set with new occasions
- Parse/persist `templateId`, `audience`, `occasion`
- Treat draft empty if all new fields null/empty too

- [ ] **Step 6: Update `useCreateDraft.ts`**

```ts
const setAudience = useCallback((audience: Audience) => {
  setDraft((d) => ({ ...d, audience }));
}, []);

const setOccasion = useCallback((occasion: Occasion) => {
  setDraft((d) => ({
    ...d,
    occasion,
    templateType: occasionToTemplateType(occasion),
  }));
}, []);

const setTemplateId = useCallback((templateId: string) => {
  setDraft((d) => ({ ...d, templateId }));
}, []);

const startQuickCreate = useCallback(() => {
  setDraft({
    ...EMPTY_CREATION_DRAFT,
    templateId: 'B10',
    occasion: 'birthday',
    templateType: 'birthday',
  });
}, []);

const startFromAudience = useCallback((audience: Audience) => {
  setDraft({
    ...EMPTY_CREATION_DRAFT,
    audience,
  });
}, []);
```

Keep `startWish` for vault shortcuts (set audience/name + navigate Who or Occasion as product decides — default: set `recipientName` + `templateType: birthday` + `templateId: 'B10'` for fastest path).

- [ ] **Step 7: Run domain tests**

```sh
npx jest __tests__/create/domain.test.ts __tests__/create/templateSystem.test.ts -v
npx tsc --noEmit
```

---

### Task 5: Layout primitives + `TemplateRenderer`

**Files:**
- Create: `src/features/create/ui/components/layouts/EditorialPortrait.tsx`
- Create: `src/features/create/ui/components/layouts/DualEditorial.tsx`
- Create: `src/features/create/ui/components/layouts/MinimalFullscreen.tsx`
- Create: `src/features/create/ui/components/TemplateRenderer.tsx`
- Modify: `src/features/create/ui/components/CardPreviewStage.tsx`
- Modify: `src/features/create/ui/screens/PreviewScreen.tsx`
- Modify: `src/features/create/ui/screens/ShareSuccessScreen.tsx` (optional: pass templateId)

**Interfaces:**
- Consumes: `TemplateDefinition`, draft photo/name/message
- Produces: visual card matching layoutId

- [ ] **Step 1: Implement three layout components**

Shared props:

```ts
type LayoutProps = {
  photoUris: string[];
  recipientName: string;
  message: string;
  headline: string;
  body: string;
  compact?: boolean;
};
```

- `EditorialPortrait`: hero photo (~60%) + text block (headline, name, body/message)
- `DualEditorial`: two photo slots (primary large, secondary small) + emotional text
- `MinimalFullscreen`: full-bleed photo + minimal overlay (headline + name)

Use `colors`, `spacing`, `typography`, `radius` from `tokens.ts`. No emoji.

- [ ] **Step 2: `TemplateRenderer.tsx`**

```ts
export function TemplateRenderer({
  definition,
  photoUris,
  recipientName,
  message,
  compact,
}: {
  definition: TemplateDefinition;
  photoUris: string[];
  recipientName: string;
  message: string;
  compact?: boolean;
}) {
  const headline =
    definition.texts.find((t) => t.role === 'headline')?.default ?? '';
  const bodyDefault =
    definition.texts.find((t) => t.role === 'body')?.default ?? '';
  const body = message.trim() || bodyDefault;

  switch (definition.layoutId) {
    case 'dual_editorial':
      return (
        <DualEditorial
          photoUris={photoUris}
          recipientName={recipientName}
          message={message}
          headline={headline}
          body={body}
          compact={compact}
        />
      );
    case 'minimal_fullscreen':
      return (
        <MinimalFullscreen
          photoUris={photoUris}
          recipientName={recipientName}
          message={message}
          headline={headline}
          body={body}
          compact={compact}
        />
      );
    case 'editorial_portrait':
    default:
      return (
        <EditorialPortrait
          photoUris={photoUris}
          recipientName={recipientName}
          message={message}
          headline={headline}
          body={body}
          compact={compact}
        />
      );
  }
}
```

- [ ] **Step 3: Wire Preview**

In `CardPreviewStage` / `PreviewScreen`: resolve definition via `useTemplateCatalog().getById(draft.templateId)`. If missing, fall back to existing `AnimatedWishCard` (legacy safety). Prefer renderer when definition exists.

- [ ] **Step 4: Manual check**

```sh
npx tsc --noEmit
# npm start + navigate Preview with a mock draft if needed
```

---

### Task 6: Who / Occasion / Recommend screens + navigation

**Files:**
- Create: `src/features/create/ui/screens/WhoForScreen.tsx`
- Create: `src/features/create/ui/screens/OccasionScreen.tsx`
- Create: `src/features/create/ui/screens/TemplateRecommendScreen.tsx`
- Modify: `src/shared/navigation/types.ts`
- Modify: `src/shared/navigation/CreateNavigator.tsx`
- Modify: `src/shared/analytics/events.ts`

**Interfaces:**
- Routes: `WhoFor`, `Occasion`, `TemplateRecommend`

- [ ] **Step 1: Add analytics events**

```ts
audienceSelected: 'audience_selected',
occasionSelected: 'occasion_selected',
quickCreateStarted: 'quick_create_started',
```

(`template_selected` payload should include `templateId`.)

- [ ] **Step 2: Extend nav types + navigator**

```ts
export type CreateStackParamList = {
  CreateHome: undefined;
  WhoFor: undefined;
  Occasion: undefined;
  TemplateRecommend: undefined;
  TemplatePicker: undefined; // keep temporarily for vault/legacy
  AddPhotos: undefined;
  Details: undefined;
  Preview: undefined;
  ShareSuccess: { ... };
};
```

Register screens in `CreateNavigator`.

- [ ] **Step 3: `WhoForScreen`**

- `Screen` title: “Who is this for?”
- List/grid of `AUDIENCE_OPTIONS` (Pressable rows, min 48pt, tokens)
- On press: `setAudience(id)`, track `audience_selected`, navigate `Occasion`
- One clear primary path; no emoji marks

- [ ] **Step 4: `OccasionScreen`**

- Title: “What’s the moment?”
- `OCCASION_OPTIONS`
- On press: `setOccasion(id)`, track `occasion_selected`, navigate `TemplateRecommend`

- [ ] **Step 5: `TemplateRecommendScreen`**

```ts
const maxPhotos = env.useBase64Media ? MAX_PHOTOS_BASE64 : MAX_PHOTOS_STORAGE;
const { templates } = useTemplateCatalog();
const recommended = useMemo(() => {
  if (!draft.audience || !draft.occasion) return [];
  return recommendTemplates({
    audience: draft.audience,
    occasion: draft.occasion,
    catalog: templates,
    maxPhotosAllowed: maxPhotos,
  });
}, [draft.audience, draft.occasion, templates]);
```

- Show cards with `title` + short style cue (not 30-grid)
- On press: `setTemplateId(t.id)`, track `template_selected` with `{ templateId: t.id }`, navigate `AddPhotos`
- Guard: if audience/occasion missing, `navigation.replace('WhoFor')`

- [ ] **Step 6: `tsc --noEmit`**

---

### Task 7: Create Home + Quick Create + AddPhotos slot limits

**Files:**
- Modify: `src/features/create/ui/screens/CreateHomeScreen.tsx`
- Modify: `src/features/create/ui/components/CreateWishPill.tsx` (copy → Quick Create)
- Modify: `src/features/create/ui/screens/AddPhotosScreen.tsx`

- [ ] **Step 1: Replace occasion emoji grid as primary path**

Create Home:

1. Primary button/row: “Make something for someone” → `startFromAudience` reset + navigate `WhoFor`
2. Secondary: Quick Create → `startQuickCreate()` + track `quick_create_started` + navigate `AddPhotos`
3. Remove or collapse `TEMPLATE_OPTIONS` grid (prefer remove from home; leave `TemplatePicker` route unused or delete in a follow-up)
4. Vault “Send card” can call `startQuickCreate` with `recipientName` prefilled or jump to `WhoFor` with name set — prefer: set name + Quick Create B10 for speed

- [ ] **Step 2: AddPhotos respects template `photoSlots`**

```ts
const { getById } = useTemplateCatalog();
const def = draft.templateId ? getById(draft.templateId) : null;
const templateSlots = def?.photoSlots ?? 1;
const maxPhotos = Math.min(
  templateSlots,
  env.useBase64Media ? MAX_PHOTOS_BASE64 : MAX_PHOTOS_STORAGE,
);
```

Update subtitle copy accordingly (“Add 1 photo” / “Add 1–2 photos”).

- [ ] **Step 3: Manual funnel smoke**

Guest: Who → Occasion → pick layout → photo(s) → details → preview (renderer) → share.

Quick Create: photo → name → preview → share.

```sh
npx tsc --noEmit
npx jest __tests__/create/ -v
```

---

### Task 8: Docs acceptance + cleanup

**Files:**
- Modify: `docs-site/content/template-system-blueprint.md` (check acceptance boxes)
- Modify: `docs-site/content/create-blueprint.md` (screen table)
- Optional: remove dead `TemplatePicker` usage if fully replaced

- [ ] **Step 1: Update create-blueprint screen table** with WhoFor / Occasion / TemplateRecommend / Quick Create
- [ ] **Step 2: Check off acceptance criteria** in template-system-blueprint that are truly done
- [ ] **Step 3: Final verify**

```sh
npx tsc --noEmit
npx jest __tests__/create/ -v
```

---

## Self-review (plan vs spec)

| Spec requirement | Task |
|---|---|
| Data-driven schema + JSON | Task 1 |
| recommendTemplates + B04 hide | Task 2 |
| Hybrid catalog stub | Task 3 |
| Draft audience/occasion/templateId + API occasion string | Task 4 |
| Layout primitives + renderer on Preview | Task 5 |
| Who → Occasion → Recommend | Task 6 |
| Create Home + Quick Create + photo slots | Task 7 |
| Docs / acceptance | Task 8 |
| Out of scope (30 templates, vibe, remote live, web parity) | Not in plan |

---

## Execution handoff

Plan saved to `docs/superpowers/plans/2026-09-07-template-system-mvp.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — run tasks in this session with executing-plans checkpoints  

Which approach?
