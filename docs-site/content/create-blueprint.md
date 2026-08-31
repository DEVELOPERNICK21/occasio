---
title: Feature blueprint — Create
description: Phase 4 mini-PRD, entities, acceptance criteria, and analytics for the create flow.
phase: Phase 4 — Build
status: In progress
updated: 2026-08-31
---

## Goal

Guest or signed-in user completes **Template → Photos → Details → Preview → Share link** in under ~3 minutes.

## Screens (implemented scaffold)

| Screen | Route | Status |
|---|---|---|
| Template picker | `CreateTab` → `TemplatePicker` | ✅ UI scaffold |
| Add photos | `AddPhotos` | ✅ gallery + camera (`react-native-image-picker`) |
| Details | `Details` | ✅ |
| Preview | `Preview` | ✅ photo + message preview |
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

## Acceptance criteria

- [x] Guest can complete flow without sign-in
- [x] 1 photo (Spark base64) or 1–3 (Storage path when `useBase64Media: false`)
- [x] Generate saves to Firestore (Spark) — real `shareUrl`
- [x] Share sheet opens (native `Share`)
- [ ] Free quota shows paywall modal
- [ ] Vault nudge visible on share success
- [ ] Unit tests: `canPreview` rules, quota domain

## Code map

```
src/features/create/
  domain/
  application/
  ui/screens/
  data/          ← next
```

RN entry: `App.tsx` → `AppNavigator` → tabs → `CreateNavigator`
