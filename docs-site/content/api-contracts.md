---
title: API & Cloud Functions contracts
description: HTTPS/callable contracts between Occasio clients and backend (Phase 3).
phase: Phase 3 — Technical
status: Draft v1
updated: 2026-08-31
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

## `POST /v1/scheduled-sends/:id/approve` | `/cancel`

Sender review window actions (auth required).

## `POST /v1/webhooks/revenuecat`

Server-to-server subscription updates — never called from client.

## Firestore (client read paths)

| Collection | Client read | Client write |
|---|---|---|
| `users/{uid}` | own doc | own profile fields only |
| `relationships` | own | via rules + validation |
| `creations` | own | create via Function only |
| `scheduled_sends` | own | approve/cancel via Function |

## Analytics events (Phase 4)

`card_share_started` · `card_shared` · `upload_failed` · `paywall_shown` · `vault_save_prompt_tapped`
