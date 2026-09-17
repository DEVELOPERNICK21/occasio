---
title: Feature blueprint — Create
description: Phase 4 mini-PRD, entities, acceptance criteria, and analytics for the create flow.
phase: Phase 4 — Build
status: In progress
updated: 2026-09-07
---

## Goal

Guest or signed-in user completes **Home occasion → Who → Layout → Photos → Details → Preview → Share** in under ~3 minutes (Quick birthday wish skips Who/Recommend).

**Active slice:** [Template system MVP](/docs/template-system-blueprint) — data-driven layouts after home selection (Who → Recommend). Create Home grid stays as-is.

## Screens (implemented)

| Screen | Route | Status |
|---|---|---|
| Create home | `CreateHome` | ✅ same occasion grid + Quick birthday wish; grid → Who/Recommend |
| Who for | `WhoFor` | ✅ after home occasion pick (skipped for Mother’s/Father’s Day) |
| Occasion | `Occasion` | ✅ alternate entry when occasion not pre-set |
| Template recommend | `TemplateRecommend` | ✅ ranked layouts (3–5) |
| Template picker (legacy) | `TemplatePicker` | ⚠️ route kept |
| Add photos | `AddPhotos` | ✅ gallery + camera; enforces template `photoSlots` |
| Details | `Details` | ✅ |
| Preview | `Preview` | ✅ `TemplateRenderer` |
| Share success | `ShareSuccess` | ✅ native share sheet |

## Domain

- `CreationDraft`, `Creation`, `TemplateType` — `src/features/create/domain/`
- `useCreateDraft` — `application/`

## Data (next slices)

| Layer | File | Todo |
|---|---|---|
| `data` | `creationRepository.ts` | Spark Firestore + optional Functions |
| `data` | `photoRefs.ts`, `sparkCreationRepository.ts` | base64 inline (Spark) or Storage (Blaze) |
| `data` | `uploadService.ts` | presign when on Blaze + Functions |
| `application` | `usePhotoPicker.ts` | gallery + camera orchestration |
| `domain` | `quota.ts` | free tier 1 card/month |

## Analytics

| Event | When |
|---|---|
| `create_started` | Template picker open |
| `template_selected` | Occasion chosen |
| `photos_added` | ≥1 photo |
| `preview_opened` | Preview screen |
| `card_shared` | Share success + link generated |
| `upload_failed` | Upload error |

## Slug strategy

| Mode | Format | Example | Where generated |
|---|---|---|---|
| **Production** | 8-char random `a-z0-9` | `6agd6sg9` | Server only (`creationsServer.ts`) |
| **Mock / demo** | `demo-{name}-{id}` | `demo-mom-abc123` | App mock only (`useMockApi: true`) |

Production slugs use `crypto.randomBytes` (not `Math.random`) with collision retry. Unlisted — not guessable like name-based slugs.

## Acceptance criteria

- [x] Guest can complete flow without sign-in
- [x] 1 photo (Spark base64) or 1–3 (Storage when Blaze)
- [x] Generate saves via Vercel API — real `shareUrl`
- [x] Share sheet + copy link
- [x] Paywall modal on free quota
- [x] Expired link page on recipient web
- [x] Analytics stub events
- [x] Vault save CTA → soft auth (vault data deferred)
- [x] Unit tests: quota, shareSlug, base64 rules

## Code map

```
src/features/create/
  domain/
  application/
  ui/screens/
  data/          ← next
```

RN entry: `App.tsx` → `AppNavigator` → tabs → `CreateNavigator`
