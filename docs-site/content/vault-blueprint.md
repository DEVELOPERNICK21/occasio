---
title: Feature blueprint — Vault
description: Relationship Vault — save people, dates, contact, auto-send pack, and review scheduled sends.
phase: Phase 4 — Build
status: In progress
updated: 2026-09-13
---

## Goal

Save the people who matter (name, relationship, birthday, anniversary, WhatsApp/email) so Occasio can remind and auto-send later. **Soft-auth required** — guest create stays unchanged.

## Firestore

### `relationships/{id}` (per TRD)

| Field | Type |
|---|---|
| `userId` | string (owner) |
| `personName` | string |
| `relationshipType` | enum |
| `dates.birthday` | `{ month, day }` |
| `dates.anniversary` | `{ month, day }` optional |
| `contactChannel.whatsapp` | E.164 optional |
| `contactChannel.email` | string optional |
| `autoSendEnabled.birthday` | boolean (paid only) |
| `autoSendEnabled.anniversary` | boolean (paid only) |
| `preferredTemplateId`, `preferredTemplateType` | pack optional |
| `photoRefs`, `defaultMessage`, `fromName` | pack optional |
| `lastCreationId` | string optional |

Rules: `firestore.rules` — owner read/write on `userId`.

### `scheduled_sends/{id}` (auto-send engine)

| Field | Type |
|---|---|
| `userId`, `relationshipId` | string |
| `occasionType` | `'birthday' \| 'anniversary'` |
| `scheduledDate`, `reviewDeadline` | Timestamp |
| `status` | `'pending' \| 'review' \| 'approved' \| 'cancelled' \| 'sent' \| 'failed'` |
| `generatedCreationId`, `shareUrl` | optional |
| `deliveryChannelAttempted`, `deliveryChannelUsed` | optional |
| `lastError` | optional (`tier`, `incomplete_pack`, …) |
| `idempotencyKey` | `userId_relationshipId_occasionType_year` |

Rules: client **read** own sends; **no** client write (approve/cancel via Functions).

### `users/{uid}` (server gates)

| Field | Type |
|---|---|
| `fcmTokens` | `string[]` (dedupe on register) |
| `subscriptionTier` | `'free' \| 'personal' \| 'family'` — mirrored from RevenueCat client for cron paid gate |

## Layers

```
ui/screens     → VaultList, AddPerson, PersonDetail, ScheduledSendReview
application/   → useVaultPeople, useSavePerson, useToggleAutoSend, useUpdateAutoSendPack,
                 useLinkCreationToPerson, useScheduledSends, useReviewSend, useFcmRegistration
domain/        → personRules, scheduledSend, contentFallback, vaultOccasion, types
data/          → relationshipRepository, scheduledSendRepository, fcmRepository
```

## Screens

| Screen | Status |
|---|---|
| Vault list (empty + rows + upcoming + inbox badge) | ✅ |
| Add person form (birthday + anniversary + arm toggles) | ✅ |
| Person detail + delete + pack editor + arm toggles | ✅ |
| Share success / History → Save for auto-send (link creation) | ✅ |
| Scheduled send review (approve / cancel + share sheet) | ✅ |
| FCM open → review screen | ✅ (device send not verified) |

## Tier rules (domain)

| Tier | Person cap | Auto-send |
|---|---|---|
| Free | 1 | Off |
| Personal | 5 | On |
| Family | 15 | On |

Tier from `useSubscription()` when RevenueCat is configured; cron reads `users/{uid}.subscriptionTier` (client mirror via `BillingProvider`).

## Acceptance criteria

- [x] Signed-in user can add a person to Firestore
- [x] Vault list shows saved people + upcoming birthdays/anniversaries
- [x] Guest sees soft-auth gate on Vault tab
- [x] Share success → Save to Vault → Add person (prefilled name)
- [x] Free tier: 1 person max; auto-send toggle disabled
- [x] Domain tests: validation, tier caps, scheduled send rules
- [x] Person detail + delete
- [x] Link creation to relationship record (“Save for auto-send”)
- [x] Anniversary date + arm toggles + pack editor
- [x] Review window UX + approve/cancel via Functions API
- [x] FCM token registration + notification open to review
- [ ] End-to-end cron → review → approve → mock dispatch (Task 11)
- [ ] Real delivery providers (post-mock)

## Code map

```
src/features/vault/
  domain/scheduledSend.ts, contentFallback.ts, personRules.ts, vaultOccasion.ts, types.ts
  data/relationshipRepository.ts, scheduledSendRepository.ts, fcmRepository.ts
  application/useVaultPeople.ts, useSavePerson.ts, useToggleAutoSend.ts,
    useUpdateAutoSendPack.ts, useLinkCreationToPerson.ts,
    useScheduledSends.ts, useReviewSend.ts, useFcmRegistration.ts
  ui/screens/VaultListScreen.tsx, AddPersonScreen.tsx, PersonDetailScreen.tsx,
    ScheduledSendReviewScreen.tsx
  ui/components/ScheduledSendInboxCard.tsx, AutoSendPackCard.tsx, …
functions/src/autosend/   ← cron, dispatch, review, providers, fcm
src/shared/navigation/VaultNavigator.tsx
```

## Dev without SMS / offline

```ts
// env.ts
useMockAuth: true   // in-memory relationships + scheduled sends
useMockApi: true    // mock approve/cancel HTTP
```

Uses in-memory mock store in `relationshipRepository` and `scheduledSendRepository`.

## Dev — emulator cron (auto-send engine)

Requires **JDK 21+** for Firestore emulator. Build Functions first.

```bash
cd functions && npm run build
export OCCASIO_CRON_SECRET=dev-cron
# Optional: treat all tiers as paid in emulator
# export OCCASIO_AUTOSEND_ALLOW_FREE=true
# Dispatch off by default (safe rollout):
# export OCCASIO_AUTOSEND_DISPATCH=false

# Seed Firestore: users/{uid}.subscriptionTier=personal (or use ALLOW_FREE),
# relationships/{id} with autoSendEnabled.birthday=true and dates.birthday = today's IST month/day.

npx firebase-tools emulators:start --only functions,firestore --project occasio-app-dev

curl -X POST "http://127.0.0.1:5001/occasio-app-dev/asia-south1/api/v1/internal/autosend/run" \
  -H "x-occasio-cron-secret: $OCCASIO_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"asOf":"2026-09-13T00:30:00.000Z"}'
```

Expected: `{ "ok": true, "created": 1, ... }` and one `scheduled_sends` doc in `review`. FCM requires a registered device token.

**Functions env flags** (see `.env.example`):

| Variable | Default | Purpose |
|---|---|---|
| `OCCASIO_CRON_SECRET` | *(required for manual cron)* | Header `x-occasio-cron-secret` on `POST /v1/internal/autosend/run` |
| `OCCASIO_AUTOSEND_DISPATCH` | `false` | Must be exactly `true` to call mock WA/SMS/email; otherwise approve/sweeper stop at `approved` |
| `OCCASIO_AUTOSEND_ALLOW_FREE` | `false` | Dev/emulator only: cron treats all tiers as paid |
| `OCCASIO_MOCK_DELIVERY_FAIL` | — | Comma-separated channels (`whatsapp,sms,email`) to force mock failure and test fallback |

Production also runs `autosendDaily` at **06:00 Asia/Kolkata** via Cloud Scheduler.

## Next

**Shipaton** — device-verify RevenueCat purchase + production store. **Task 11** — E2E cron → review → approve → mock dispatch. **Later** — real WhatsApp/SMS/email providers; enable `OCCASIO_AUTOSEND_DISPATCH=true` only after mock path verified.
