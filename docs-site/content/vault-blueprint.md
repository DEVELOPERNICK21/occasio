---
title: Feature blueprint — Vault
description: Relationship Vault — save people, dates, and contact for auto-send.
phase: Phase 4 — Build
status: In progress
updated: 2026-09-01
---

## Goal

Save the people who matter (name, relationship, birthday, WhatsApp) so Occasio can remind and auto-send later. **Soft-auth required** — guest create stays unchanged.

## Firestore

Collection: `relationships/{id}` (per TRD)

| Field | Type |
|---|---|
| `userId` | string (owner) |
| `personName` | string |
| `relationshipType` | enum |
| `dates.birthday` | `{ month, day }` |
| `contactChannel.whatsapp` | E.164 optional |
| `autoSendEnabled.birthday` | boolean (paid only) |

Rules: `firestore.rules` — owner read/write on `userId`.

## Layers

```
ui/screens     → VaultList, AddPerson
application/   → useVaultPeople, useSavePerson
domain/        → personRules, tierLimits, types
data/          → relationshipRepository (Firestore)
```

## Screens

| Screen | Status |
|---|---|
| Vault list (empty + rows + upcoming) | ✅ |
| Add person form | ✅ |
| Person detail + delete | ✅ |
| Auto-send review window | Deferred (engine phase) |

## Tier rules (domain)

| Tier | Person cap | Auto-send |
|---|---|---|
| Free | 1 | Off |
| Personal | 5 | On |
| Family | 15 | On |

Tier is `'free'` until billing ships (`useSavePerson` default).

## Acceptance criteria

- [x] Signed-in user can add a person to Firestore
- [x] Vault list shows saved people + upcoming birthdays
- [x] Guest sees soft-auth gate on Vault tab
- [x] Share success → Save to Vault → Add person (prefilled name)
- [x] Free tier: 1 person max; auto-send toggle disabled
- [x] Domain tests: validation, tier caps
- [x] Person detail + delete
- [ ] Link creation to relationship record

## Code map

```
src/features/vault/
  domain/
  data/relationshipRepository.ts
  application/useVaultPeople.ts, useSavePerson.ts
  ui/screens/VaultListScreen.tsx, AddPersonScreen.tsx, PersonDetailScreen.tsx
src/shared/navigation/VaultNavigator.tsx
```

## Dev without SMS

```ts
// env.ts
useMockAuth: true
```

Uses in-memory mock store in `relationshipRepository`.

## Next

**Billing** — RevenueCat + paid tier caps. **Person detail** — edit/delete in Vault.
