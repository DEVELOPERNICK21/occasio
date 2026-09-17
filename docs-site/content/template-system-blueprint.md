---
title: Feature blueprint — Template system (MVP)
description: Relationship-first create flow, data-driven layout catalog (5 seed templates), renderer, Quick Create. Priority over Shipaton until validated.
phase: Phase 4 — Build
status: Implemented (MVP)
updated: 2026-09-07
---

## Goal

Prove people **create and share** personal greetings — not that we have a big template library.

Ship a **data-driven template system** + **Who → Occasion → recommend** UX + **5 free layouts** + **Quick Create**, then measure share rate before expanding to 30.

**North-star behavior:** Completed greeting → Shared.

**Priority:** This slice is **above Shipaton** until the funnel is validated. Billing/store work resumes after.

## Decisions locked

| Decision | Choice |
|---|---|
| Timing vs Shipaton | Templates first |
| v1 content | System + ~5 layouts (not all 30) |
| Catalog source | Hybrid — bundled JSON now; remote override hook later |
| Discovery UX | Who → Occasion → recommend (no vibe step) |
| Seed set | B01, B04, B10, L06, T01 + Quick Create → B10 |
| Renderer approach | Layout primitives + JSON (not absolute % slots, not one `.tsx` per template) |

## Product identity

```
Person → Occasion → Design → Share
```

(“Feeling” comes from the layout’s copy and style — not a separate UX step in v1.)

Not: Template category grid → Edit → Export (Canva-style).

## Out of scope (v1)

- 30-template library / festivals / Indian occasion pack
- Vibe step (Elegant / Emotional / Playful / Minimal)
- Live remote catalog fetch (hook/stub only)
- 4–6 photo collage layouts
- Dual Story (9:16) / Post (4:5) export
- Animated / video templates
- PRO gating of templates (all 5 free)
- Recipient web multi-layout parity (mobile renderer first; web keeps current card)

## Architecture

Stay inside `src/features/create/`. No new feature package.

```
src/features/create/
  domain/
    types.ts                 # draft: audience, occasion, templateId (+ API map)
    templateSchema.ts        # TemplateDefinition (pure)
    recommendTemplates.ts    # Who + Occasion → ranked ids
    creationRules.ts         # canPreview uses templateId + photos
  data/
    templates/catalog.json   # bundled seed definitions
    templateCatalog.ts       # loadCatalog(); remote override hook (no-op)
  application/
    useTemplateCatalog.ts
    useCreateDraft.ts        # audience / occasion / templateId
  ui/
    screens/
      WhoForScreen.tsx
      OccasionScreen.tsx
      TemplateRecommendScreen.tsx
    components/
      TemplateRenderer.tsx
      layouts/
        EditorialPortrait.tsx
        DualEditorial.tsx
        MinimalFullscreen.tsx
```

**Dependency rules unchanged:** `ui` ↛ Firebase/RevenueCat; `data` ↛ React; domain pure + unit-tested.

### Template definition (conceptual)

```ts
type Audience =
  | 'mom'
  | 'dad'
  | 'partner'
  | 'friend'
  | 'family'
  | 'someone_special';

type Occasion =
  | 'birthday'
  | 'anniversary'
  | 'thank_you'
  | 'congratulations'
  | 'just_because';

type LayoutId =
  | 'editorial_portrait'
  | 'dual_editorial'
  | 'minimal_fullscreen';

type TemplateId = string; // seed ids: B01 | B04 | B10 | L06 | T01

type TemplateDefinition = {
  id: TemplateId;
  title: string;
  category: 'birthday' | 'love' | 'thank_you';
  audiences: Audience[];
  occasions: Occasion[];
  style: 'elegant' | 'emotional' | 'minimal';
  layoutId: LayoutId;
  photoSlots: 1 | 2;
  texts: Array<{
    key: string;
    role: 'headline' | 'body' | 'name';
    default: string;
  }>;
  quickCreate?: boolean;
};
```

### Draft & API compatibility

Draft stores:

- `audience`
- `occasion`
- `templateId`
- existing `photoUris`, `recipientName`, `message`

For `POST /creations`, send `templateType` from draft `occasion` (same string). Backend already accepts a string; extend the client `TemplateType` / label helpers so recipient labels stay correct:

| Draft `occasion` | API `templateType` | Display label |
|---|---|---|
| `birthday` | `birthday` | Birthday |
| `anniversary` | `anniversary` | Anniversary |
| `thank_you` | `thank_you` | Thank you |
| `congratulations` | `congratulations` | Congratulations |
| `just_because` | `just_because` | Just because |

Add these values to client domain types + `templateLabel` / themes. Legacy occasions (`sorry`, `proposal`, `mothers_day`, `fathers_day`) remain valid for old drafts/history.

### Catalog hybrid

1. Ship `catalog.json` with 5 definitions.
2. `loadCatalog()` returns bundled catalog.
3. `fetchRemoteCatalogOverride?: () => Promise<TemplateDefinition[] | null>` stub — returns `null` in v1. When remote ships later, merge/override by `id` without changing the renderer.

## UX flow

```
CreateHome
  ├─ Quick Create → AddPhotos (templateId=B10) → Details → Preview → Share
  └─ Make something for someone
        → WhoFor → Occasion → TemplateRecommend
        → AddPhotos → Details → Preview → Share
```

| Screen | Job |
|---|---|
| `WhoForScreen` | Mom · Dad · Partner · Best friend · Family · Someone special |
| `OccasionScreen` | Birthday · Thank you · Just because · Anniversary · Congratulations |
| `TemplateRecommendScreen` | Show 3–5 ranked layouts; pick one |
| AddPhotos → Details → Preview → Share | Existing path; Preview uses `TemplateRenderer` |

**Create Home:** Primary entry is relationship-first (“Who is this for?”). Quick Create is secondary. Old 6-occasion emoji grid is de-emphasized or removed once recommend path works.

**UI rules:** Tokens from `tokens.ts`; no emoji-as-UI; one primary CTA; calm copy (`ui-design-principles.md` §11).

### Recommendation

`recommendTemplates({ audience, occasion, catalog, maxPhotosAllowed })`:

- Score audience + occasion match; drop templates with `photoSlots > maxPhotosAllowed`
- Mom + Birthday → B04 first **when** `maxPhotosAllowed >= 2`
- Partner + Just because → L06
- Birthday general → B01 / B10
- Thank you → T01
- If no strong matches (e.g. Anniversary / Congratulations with thin catalog): fall back to B10 → B01 → T01 (still capped at 3–5)
- Cap list at 3–5; never show an empty recommend screen

### Quick Create

Preselect `B10` (`minimal_fullscreen`, 1 photo). Flow: photo → name (message optional/default) → preview → share. Frictionless 10–15s path.

### Photos

- Enforce `photoSlots` from selected template (1 or 2).
- If Spark/base64 mode (`MAX_PHOTOS_BASE64 = 1`), **hide B04** from recommendations.
- Do not add 4–6 slot layouts in v1.

## Seed catalog (all free)

| ID | Layout | Photos | Role |
|---|---|---|---|
| B01 | `editorial_portrait` | 1 | General birthday — “It's Your Day” |
| B04 | `dual_editorial` | 2 | Mom + Birthday — emotional |
| B10 | `minimal_fullscreen` | 1 | Fast path + Quick Create — “Just You” |
| L06 | `editorial_portrait` | 1 | Just because — “I love you” |
| T01 | `editorial_portrait` | 1 | Thank you |

## Analytics

Extend stub events:

| Event | When |
|---|---|
| `create_started` | Create home / flow open |
| `audience_selected` | Who step |
| `occasion_selected` | Occasion step |
| `template_selected` | Layout id (e.g. `B01`) |
| `photos_added` | ≥1 photo |
| `preview_opened` | Preview |
| `card_shared` | Share success |
| `quick_create_started` | Quick Create CTA |

Funnel to watch: start → audience → occasion → template → photo → complete → **share**.

## Acceptance criteria

- [ ] Guest completes Who → Occasion → layout → photos → personalize → share *(flow wired; not device-verified)*
- [x] Quick Create completes via B10 without browsing templates
- [x] Recommend ranks Mom+Birthday with B04 first when 2 photos allowed
- [x] B04 hidden when only 1 photo allowed (base64 mode)
- [x] No per-template React screen files (`B01.tsx` …); definitions in JSON + layout primitives
- [x] Domain unit tests: `recommendTemplates`, catalog/schema parse
- [x] Preview uses `TemplateRenderer` for seed layouts
- [x] Create API receives `templateType` = occasion string (extended labels; no broken shares)
- [x] Docs: this blueprint linked; master blueprint focus updated

## Implementation order (high level)

Full step-by-step plan: [`docs/superpowers/plans/2026-09-07-template-system-mvp.md`](../../docs/superpowers/plans/2026-09-07-template-system-mvp.md)

1. Domain schema + catalog JSON + `recommendTemplates` + tests
2. Draft/context fields + API occasion→`templateType` map
3. Layout primitives + `TemplateRenderer` wired into Preview
4. Who / Occasion / Recommend screens + navigation
5. Create Home entries (relationship CTA + Quick Create)
6. Analytics events + blueprint checkboxes

## Later (after metrics)

- Expand toward 30 layouts using the same schema
- Vibe filter when catalog is large enough
- Live remote catalog
- Multi-photo Storage layouts (B02, B03, …)
- Recipient web layout parity
- Resume Shipaton / billing
