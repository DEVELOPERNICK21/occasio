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
| Add photos | `AddPhotos` | ✅ placeholder slots |
| Details | `Details` | ✅ |
| Preview | `Preview` | ✅ static preview |
| Share success | `ShareSuccess` | ✅ demo URL |

## Domain

- `CreationDraft`, `Creation`, `TemplateType` — `src/features/create/domain/`
- `useCreateDraft` — `application/`

## Data (next slices)

| Layer | File | Todo |
|---|---|---|
| `data` | `creationRepository.ts` | presign upload + `POST /v1/creations` |
| `data` | `uploadService.ts` | image resize + storage |
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

- [ ] Guest can complete flow without sign-in
- [ ] 1–3 photos, name required, message optional
- [ ] Generate returns real `shareUrl` (not demo)
- [ ] Share sheet opens (WhatsApp intent on Android)
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
