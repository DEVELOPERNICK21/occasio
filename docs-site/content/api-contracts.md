---
title: API & Cloud Functions contracts
description: HTTPS/callable contracts between Occasio clients and backend (Phase 3).
phase: Phase 3 — Technical
status: Draft v1
updated: 2026-09-13
---

Clients talk to **Firestore** for reads where rules allow; **Cloud Functions** for privileged writes (share link creation, dispatch, billing webhooks).

Base URL (prod): `https://asia-south1-<project>.cloudfunctions.net`

## Share link lifecycle

Public greeting links are **unlisted** (anyone with the URL can view) but **time-limited**.

| Creator | Link TTL (`expiresAt`) | Notes |
|---|---|---|
| Guest | **30 days** | Default for anonymous create |
| Free (signed in) | **30 days** | Manual cards |
| Paid / pinned | **365 days** | Longer retention for subscribers |

**Server rules**

1. `POST /v1/creations` sets `expiresAt` from the table above (see `src/features/create/domain/shareLink.ts`).
2. `GET /v1/cards/:slug` returns **410 `EXPIRED`** when `now > expiresAt`.
3. Recipient web shows an expired state (not the card).
4. **Media cleanup** (R2): delete files within ~7 days after `expiresAt` via scheduled job. Firestore guest rows may be purged later; signed-in users keep History metadata.

**Slug security:** production slugs are cryptographically random (e.g. `x7k2m9`), not predictable `demo-name-*` strings.

## `POST /v1/creations`

Create a shareable card (guest or authed).

**Request**
```json
{
  "templateType": "birthday",
  "recipientName": "Mom",
  "message": "Happy birthday!",
  "photoRefs": ["uploads/tmp/abc.jpg"],
  "guestSessionId": "optional-uuid"
}
```

**Response 201**
```json
{
  "creationId": "c_123",
  "shareSlug": "x7k2m9",
  "shareUrl": "https://occasio.app/c/x7k2m9",
  "expiresAt": "2026-09-30T00:00:00Z",
  "watermarked": true
}
```

Server also persists on the creation document (not echoed in the response body today):

| Field | Type | Notes |
|---|---|---|
| `experienceMode` | `'story' \| 'classic'` | Set server-side from `templateType` (`birthday` / `anniversary` → `story`) |
| `experienceVersion` | number | `1` for Phase A packs |

**Errors**

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Missing name/photos/template |
| `QUOTA_EXCEEDED` | 402 | Free monthly limit — paywall |
| `UPLOAD_MISSING` | 400 | photoRefs not found in storage |
| `INTERNAL` | 500 | Retry |

## `POST /v1/uploads/presign`

Get signed URL for client → R2/Firebase Storage upload.

**Response**
```json
{ "uploadUrl": "...", "photoRef": "uploads/tmp/abc.jpg", "expiresIn": 900 }
```

## `GET /v1/cards/:slug` (public)

Recipient view metadata (no auth).

**Response 200**
```json
{
  "recipientName": "Mom",
  "message": "...",
  "templateType": "birthday",
  "mediaUrls": ["https://cdn.../1.jpg"],
  "fromName": "Rohan"
}
```

**Errors:** `NOT_FOUND` 404 · `EXPIRED` 410

## `POST /v1/scheduled-sends/:id/approve`

Sender approves a send in `review`. **Auth required** (`Authorization: Bearer <Firebase ID token>`). Owner only.

Requires the generated creation to have ≥1 `photoRef` or `mediaUrl`. Otherwise **400 `VALIDATION_ERROR`** (`photos_required`) and the send stays `review`.

On success the send moves `review` → `approved`, then `dispatchScheduledSend` runs:

- If `OCCASIO_AUTOSEND_DISPATCH` is **not** `true` (default), channel calls are skipped and the send stays `approved`. `shareUrl` from generation is still returned so the client can open the system share sheet.
- If `OCCASIO_AUTOSEND_DISPATCH=true`, mock providers run **whatsapp → sms → email** using `relationships.contactChannel` (`whatsapp` for WA and SMS unless `phone` is set; `email` for email). First success → `sent` + FCM `autosend_sent`. All fail → `failed` + `lastError`.

Set `OCCASIO_MOCK_DELIVERY_FAIL=whatsapp,sms` (comma-separated channels) to force mock failures and test fallback.

**Response 200**
```json
{
  "ok": true,
  "id": "uid_rel_birthday_2026",
  "status": "sent",
  "shareUrl": "https://occasio.app/c/x7k2m9",
  "deliveryChannelUsed": "whatsapp"
}
```

`status` may be `approved` (dispatch flag off), `sent`, or `failed`.

**Errors**

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing/invalid Bearer token |
| `FORBIDDEN` | 403 | Not the send owner |
| `NOT_FOUND` | 404 | Unknown send id |
| `VALIDATION_ERROR` | 400 | No photos on the creation (stays `review`) |
| `CONFLICT` | 409 | Send is not in `review` |
| `INTERNAL` | 500 | Retry |

## `POST /v1/scheduled-sends/:id/cancel`

Cancels a send in `review` only (`review` → `cancelled`). Same auth as approve. Does not dispatch.

**Response 200**
```json
{ "ok": true, "id": "uid_rel_birthday_2026", "status": "cancelled" }
```

**Errors:** same `UNAUTHORIZED` / `FORBIDDEN` / `NOT_FOUND` / `CONFLICT` as approve.

## `POST /v1/internal/autosend/run` (cron — secret only)

Daily auto-send job. Also invoked by Cloud Scheduler export `autosendDaily` at **06:00 Asia/Kolkata**.

**Auth:** header `x-occasio-cron-secret` must match `OCCASIO_CRON_SECRET`. Missing env → **503**; mismatch → **401**.

**Request body (optional)**
```json
{ "asOf": "2026-09-13T00:30:00.000Z" }
```

**Response 200**
```json
{
  "ok": true,
  "asOf": "2026-09-13T00:30:00.000Z",
  "matched": 1,
  "created": 1,
  "skipped": 0,
  "failed": 0,
  "expiredReviews": 0,
  "autoDispatched": 0,
  "incompletePack": 0,
  "approvedRetried": 0
}
```

**Flow**

1. Match armed relationships (birthday + anniversary) for today's IST month/day.
2. Paid gate via `users/{uid}.subscriptionTier` (`personal` \| `family`; missing → `free` → `failed` / `tier`). Dev bypass: `OCCASIO_AUTOSEND_ALLOW_FREE=true`.
3. Idempotent `scheduled_sends` doc (`userId_relationshipId_occasionType_year`) → generate creation → `review` + FCM `autosend_review`.
4. Sweeper: expired `review` rows (see below).

## Deadline sweeper (same cron)

After generate→review, the cron sweeps `scheduled_sends` in `review` whose `reviewDeadline` is in the past:

- Creation has ≥1 photo → auto-approve → `dispatchScheduledSend` (no-ops channels unless `OCCASIO_AUTOSEND_DISPATCH=true`)
- Otherwise → `failed` + `lastError: 'incomplete_pack'` (no photo-less dispatch)

When dispatch is enabled, the sweeper also retries existing `approved` sends so turning the flag on can complete earlier no-ops.

## FCM (auto-send)

| Type | When | Payload |
|---|---|---|
| `autosend_review` | Cron enters `review` | `sendId`, person/occasion in notification body |
| `autosend_sent` | Dispatch success | `sendId`, optional `shareUrl` — client opens system share sheet |

Client registers tokens on `users/{uid}.fcmTokens` (dedupe). Invalid tokens pruned on FCM error.

## `POST /v1/webhooks/revenuecat`

Server-to-server subscription updates — never called from client.

## Firestore (client read paths)

| Collection | Client read | Client write |
|---|---|---|
| `users/{uid}` | own doc | own profile fields only |
| `relationships` | own | via rules + validation |
| `creations` | **server only** (Admin SDK) | **deny all clients** |
| `scheduled_sends` | own | approve/cancel via Function |
| `users/{uid}.fcmTokens` | own | client append (tier mirror via billing) |

## Analytics events (Phase 4)

`card_share_started` · `card_shared` · `upload_failed` · `paywall_shown` · `vault_save_prompt_tapped` · `autosend_*` · `subscribe_success`
