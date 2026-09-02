---
title: Feature blueprint — History
description: Signed-in list of past card creations with reshare.
phase: Phase 4 — Build
status: Done
updated: 2026-09-01
---

## Goal

Signed-in users see cards they created, with share links to resend. Guest create stays unchanged — history records only when signed in at share time.

## Data model

`creations` remains **server-only** (no client read). History uses a client-writable index:

**`user_creations/{creationId}`**

| Field | Type |
|---|---|
| `userId` | owner uid |
| `creationId` | matches server doc id |
| `shareSlug`, `shareUrl` | for reshare |
| `recipientName`, `templateType`, `message` | display metadata (no photos) |
| `createdAt`, `expiresAt` | timestamps |

Rules: owner read/write only (`firestore.rules`).

## Layers

```
ui/screens     → HistoryList, HistoryDetail
application/   → useHistory, useRecordHistory
domain/        → historyRules, display
data/          → historyRepository (Firestore)
```

## Flow

```
ShareSuccess (signed in)
  → useRecordHistory().record({ creationId, ... })
  → user_creations doc (idempotent by creationId)

History tab
  → subscribe user_creations where userId == uid
  → tap row → detail → Share again / Copy link
```

## Screens

| Screen | Status |
|---|---|
| History list (empty + rows) | ✅ |
| History detail (reshare, copy) | ✅ |
| Guest soft-auth gate | ✅ |
| Link guest cards on sign-in | ✅ |

## Acceptance criteria

- [x] Signed-in create → entry appears in History
- [x] Guest create → queued locally, synced on sign-in
- [x] List sorted newest first
- [x] Expired links show badge; reshare disabled
- [x] Firestore rules for `user_creations`
- [x] Domain tests
- [x] Deploy updated Firestore rules
- [ ] Server `userId` on `creations` doc when authed (optional sync)

## Code map

```
src/features/history/
  domain/
  data/historyRepository.ts, pendingHistoryStorage.ts, syncPendingHistory.ts
  application/useHistory.ts
  ui/screens/HistoryListScreen.tsx, HistoryDetailScreen.tsx
src/shared/navigation/HistoryNavigator.tsx
```

Recorded from `ShareSuccessScreen` when `isSignedIn`.

## Next

**Billing** — RevenueCat + tier caps. **Auto-send** — scheduled dispatch.
