# Auto-send engine — design

**Date:** 2026-09-13  
**Decision:** Approach **1** — server-orchestrated engine (Cloud Scheduler + Functions).  
**PRD alignment:** MVP auto-send + 24h review window; birthday + anniversary.  
**Delivery channels:** Mock WhatsApp → SMS → email adapters now; real providers later without redesign.  
**Notify:** FCM for review/sent; after send, client opens system share sheet with `shareUrl` for manual forward while channels are mocked.

## Goal

On a loved one’s birthday or anniversary, Occasio generates a card, gives the sender 24 hours to approve/edit/cancel, then dispatches (mock chain today) and confirms to the sender — without requiring them to remember to open the app for the cron step.

## Decisions (locked)

| Topic | Choice |
|---|---|
| Architecture | Server cron + `scheduled_sends` (not client-polled) |
| Occasions v1 | Birthday + anniversary |
| Review window | 24 hours, then auto-approve → dispatch |
| Card content | Vault pack → last linked creation → default template + placeholder |
| Channels | Mock adapters (WA → SMS → email); swap keys later |
| Notify | FCM + share sheet after “sent” |
| Paid gate | Auto-send arming remains paid-only; cron skips/fails free-tier |

## Non-goals (this build)

- Live WhatsApp Business / MSG91 / Resend credentials
- Anniversary-specific new templates beyond catalog defaults
- Group gifting, AI copy, reminder-only free tier
- Claiming auto-delivery on store listing until mock→real channels are production-ready and flagged on

## Current reality

| Piece | Status |
|---|---|
| Vault people + birthday + `autoSendEnabled.birthday` | Done |
| Paid `canEnableAutoSend` toggle UX | Done (copy still “coming soon”) |
| Anniversary date / toggle / pack fields | Missing |
| `scheduled_sends` + Functions cron | Missing |
| Review window screens + approve/cancel API | Missing |
| FCM token registration | Missing |
| Delivery provider adapters | Missing (design: mock first) |
| Link creation ↔ relationship | Missing |

## Data model

### `relationships/{id}` (extend)

- Existing: `userId`, `personName`, `relationshipType`, `dates.birthday`, `contactChannel.whatsapp`, `autoSendEnabled.birthday`
- Add: `dates.anniversary` `{ month, day }`
- Add: `autoSendEnabled.anniversary` boolean (paid only)
- Add: `contactChannel.email` (optional string) for future email dispatch; SMS mock may reuse WhatsApp E.164
- Add auto-send pack (optional):
  - `preferredTemplateId`, `preferredTemplateType`
  - `photoRefs: string[]`
  - `defaultMessage`, `fromName`
- Add: `lastCreationId` (optional)

### `scheduled_sends/{id}` (new)

- `userId`, `relationshipId`
- `occasionType`: `'birthday' | 'anniversary'`
- `scheduledDate` (occasion calendar day, interpreted in IST)
- `reviewDeadline` (set when entering `review` = then + 24h)
- `status`: `'pending' | 'review' | 'approved' | 'cancelled' | 'sent' | 'failed'`
  - `pending` = reserved/idempotent row before generation finishes
  - generation success → `review`; generation failure → `failed`
- `generatedCreationId?`, `shareUrl?`
- `deliveryChannelAttempted?: ('whatsapp' | 'sms' | 'email')[]`
- `deliveryChannelUsed?`, `lastError?`
- `idempotencyKey`: `userId_relationshipId_occasionType_year` (unique)

### `users/{uid}` (extend)

- `fcmTokens`: `string[]` (dedupe on write; prune invalid tokens on FCM error)
- `subscriptionTier?`: `'free' | 'personal' | 'family'` mirrored for server gates (cron treats missing as `free`)

### Firestore rules

- `scheduled_sends`: client **read** own docs; **no** client write (approve/cancel via Functions)
- `relationships`: owner read/write including new pack + anniversary fields
- `creations`: remain server-only

## Engine flow (Functions)

### Daily cron (~06:00 IST)

1. Match relationships with `autoSendEnabled.{birthday|anniversary}` and today’s month/day (IST).
2. Verify paid entitlement via `users.subscriptionTier` (`personal` | `family`). Missing or `free` → write/keep send as `failed` + `lastError: 'tier'`.
3. Create `scheduled_sends` as `pending` with idempotency key (skip if key exists for that year).
4. Resolve card content (fallback C):
   1. Vault pack if template + `photoRefs.length > 0`
   2. Else fields from `lastCreationId` creation
   3. Else default template for occasion + short placeholder message (may have zero photos)
5. Create creation (reuse existing creations write path), set status `review`, `reviewDeadline = now + 24h`.
6. FCM data+notification: type `autosend_review`, sendId, person name, occasion.

**Incomplete pack:** still enter `review` so sender can fix. Manual **Approve** requires ≥1 photo on the generated creation (review UI can attach photos or “use last card”). **Cancel** always allowed.

### Review resolution

- `POST /v1/scheduled-sends/:id/approve` (auth) → validate media → `approved` → dispatch
- `POST /v1/scheduled-sends/:id/cancel` (auth) → `cancelled`
- Sweeper (same cron or second job): if `status == review` && `now > reviewDeadline`:
  - if creation has ≥1 photo → auto-approve → dispatch
  - else → `failed` + `lastError: 'incomplete_pack'` (do **not** send a photo-less card)

### Dispatch

1. Channel order: WhatsApp → SMS → email (all mock implementations implementing one `DeliveryProvider` interface).
2. Record each attempt on the send doc; first success → `deliveryChannelUsed`, status `sent`.
3. FCM type `autosend_sent` with `shareUrl`.
4. Client: on `autosend_sent` (or review success screen) open system `Share.share` with link for manual forward.
5. Feature flag `OCCASIO_AUTOSEND_DISPATCH` — when false, stop after `review` / skip channel calls (safe rollout).

Mock provider: log payload, return success (optional `__DEV__` / env force-fail to test fallback).

## App UX

### Vault

- Anniversary fields + arm toggle (paid gate)
- Auto-send pack editor (template, photos, message) or “Use last card”
- Share Success / History: **Save for auto-send** → set `lastCreationId` + copy pack onto person
- Replace “coming soon” copy when engine is behind a shipped flag

### Review

- Screen `ScheduledSendReview`: card preview; edit message; attach/replace photos or “use last card” if incomplete; Approve, Cancel
- Entry points: FCM tap, Vault badge (“N waiting”), optional Account nudge
- Post-send: confirmation + Share sheet

### Layers

```
vault/domain   → status transitions, date match IST, pack validation, content fallback
vault/data     → relationships extend, scheduledSendRepository (list + approve/cancel)
vault/application → useScheduledSends, useReviewSend, useFcmRegistration
vault/ui       → review screen, pack UI, anniversary fields
```

UI does not import Firebase Messaging or Functions clients directly.

## Errors

| Case | Behavior |
|---|---|
| Free tier | Cron → `failed` / `tier`; UI keeps toggle gated |
| No FCM token | Engine continues; Vault badge is backup |
| All mock channels fail | `failed` + `lastError`; no silent success |
| Approve without media | Reject with validation error; stay in `review` |
| Deadline + no media | Sweeper → `failed` / `incomplete_pack` (no dispatch) |

## Testing

- Domain: IST date match, idempotency key, status machine, content fallback C, 24h deadline
- Functions emulator: fixture person birthday = today → cron dry-run
- App: `useMockApi` inbox + approve/cancel
- Manual: arm both occasions, force cron, review, share sheet

## Rollout order

1. Data model + Vault anniversary + pack + link creation  
2. Cron + generate + review APIs (dispatch flag off)  
3. FCM + review screen + Vault badge  
4. Enable mock dispatch + share sheet  
5. Later: real WA / SMS / email secrets into same adapters  

## Prerequisites

- Firebase **Blaze** for Cloud Scheduler in production  
- Emulator sufficient for local cron testing  
- FCM setup (Android/iOS) for push  

## Success criteria

1. Armed birthday or anniversary matching “today” (IST) creates exactly one `scheduled_sends` per person/occasion/year.  
2. Sender gets review (FCM and/or Vault badge) and can approve, cancel, or wait 24h for auto-approve.  
3. Dispatch runs mock channel chain, marks `sent`, stores `shareUrl`, FCM fires, share sheet available.  
4. Free tier cannot successfully complete an auto-send.  
5. Real providers can replace mocks without changing `scheduled_sends` status machine or app review UX.
