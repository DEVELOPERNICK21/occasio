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

## `POST /v1/creations` (auth)

Create a shareable card. Requires `Authorization: Bearer <Firebase ID token>` (anonymous accounts refused). The app also sends `X-Firebase-AppCheck: <App Check token>` on writes, proving the request comes from the real app; it is checked and logged, and refused only when `APP_CHECK_MODE=enforce` (see `docs/app-check.md`). The guest can build the card; the app asks for sign-in at "Create the link".

**Allowance (server-enforced, one Firestore transaction with the card write):**

1. The first card per person is free, once, ever — `users/{uid}.freeCardsUsed`, plus one-way claims in `free_claims` (the inbox, spelled any way, and each Google or Apple id) so deleting the account and signing up again does not refill it (clients cannot write either). **The free card is for Google and Apple accounts only** (signed in with one, or has one linked). An email and password account, confirmed or not, gets `403 FREE_CARD_NEEDS_PROVIDER` (the app offers Google or Apple sign-in or the plans, it does not show the paywall), and a known throwaway inbox gets `403 EMAIL_NOT_ALLOWED`. Paying never needs Google or Apple: any account can buy Pro or single wishes. See `docs/free-card-abuse.md`.
2. After that, RevenueCat is checked server-side (`REVENUECAT_SECRET_KEY` on Vercel): active `occasio_pro` → allowed while fewer than 24 cards were made in the last 365 days (`users/{uid}.proCardTimes`).
3. Otherwise one purchased single-wish credit is spent (`wishCreditsUsed + 1`) if `purchased − used > 0` — this also covers a Pro member past 24.
4. Else `402 QUOTA_EXCEEDED`. Without the RevenueCat key, only the free card works.

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

**Invitation (`templateType: "invitation"`).** One link for many guests: a wedding, birthday or any other gathering. The body also carries an `invitation` object, checked by `parseInvitation` (`docs-site/src/lib/invitation.ts`, the one place the rules live; the app keeps a mirror in `src/features/create/domain/invitation.ts`). The server sets `recipientName` to the name or names (`"Aarav & Priya"`, `"Meera"`) whatever the client sent, and still needs at least one photo (the first is the portrait).

```json
"invitation": {
  "occasion": "wedding",
  "design": "sage",
  "nameOne": "Aarav",
  "nameTwo": "Priya",
  "tagline": "Together forever",
  "date": "2027-02-23",
  "venueName": "The Grand Courtyard",
  "venueAddress": "Civil Lines, Jaipur",
  "events": [{ "title": "Sangeet", "date": "2027-02-22", "time": "19:30", "venue": "The Grand Courtyard" }],
  "hostLine": "Together with their families",
  "rsvpWhatsapp": "919876543210",
  "rsvpBy": "2027-02-01",
  "blessing": "ganesh",
  "dressCode": "Festive Indian"
}
```

| Field | Rule |
|---|---|
| `occasion` | Required: `wedding`, `engagement`, `anniversary`, `birthday`, `baby_shower`, `housewarming`, `graduation` or `party`. Decides the look (the three ceremonies are regal, the rest are party) and the wording |
| `design` | Optional: `regal` (default), `sage` or `palace`. Only the three couple occasions use it; every other occasion has one look and the server stores `regal` whatever was sent. Unknown values fall back to `regal` |
| `nameOne`, `nameTwo` | `nameOne` is required, up to 36 characters. `nameTwo` is required for the three couple occasions (wedding, engagement, anniversary) and ignored for the rest, so a couple fits the 80-character recipient name |
| `tagline` | Optional, up to 40 characters, shown under the names ("turning 30", "25 years together") |
| `date` | Required, `YYYY-MM-DD`, a real calendar day |
| `venueName` | Required. `venueAddress` is optional and only feeds the map link |
| `events` | Up to 6, each with a title and a date (`time` is `HH:MM`, optional; `venue` is optional). Stored sorted by date and time. With none, the page and the calendar file use the main day |
| `rsvpWhatsapp` | Optional. Digits only (country code first, 8 to 15 digits). With none, the page shows a plain "let the family know" line instead of the reply pass |
| `rsvpBy` | Optional date |
| `blessing` | `ganesh` or `none` (default `none`) |
| `hostLine`, `dressCode` | Optional short text; `hostLine` defaults by occasion ("Together with their families" for a wedding or engagement, "You are invited" otherwise) |

A bad value answers `400 VALIDATION_ERROR` with a plain message (for example "Choose the occasion" or "Add the date"), which the app shows as it is. The same object is stored on the creation document and returned by `GET /v1/creations/:creationId` for editing.

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
| `UNAUTHORIZED` | 401 | No valid sign-in token |
| `QUOTA_EXCEEDED` | 402 | Free card used, no Pro, no credits — paywall |
| `FREE_CARD_NEEDS_PROVIDER` | 403 | The free card needs a Google or Apple account — offer that sign-in or the plans, not the paywall |
| `EMAIL_NOT_ALLOWED` | 403 | A throwaway email address cannot use the free card |
| `APP_CHECK_FAILED` | 403 | Only when enforcing: no valid App Check token — the app asks the person to update it |
| `UPLOAD_MISSING` | 400 | photoRefs not found in storage |
| `INTERNAL` | 500 | Retry |

## `GET /v1/creations/:creationId` (auth)

Load an owned card for edit-after-create. Requires `Authorization: Bearer <Firebase ID token>` and a matching `user_creations/{creationId}` row.

**Response 200** — creation fields including `shareSlug`, `shareUrl`, `expiresAt`, `mediaUrls`, message, template, etc.

**Errors:** `UNAUTHORIZED` 401/403 · `NOT_FOUND` 404 · `EXPIRED` 410

## `PATCH /v1/creations/:creationId` (auth)

Update card content **in place**. Same `shareSlug` / `shareUrl`. **No quota charge.** Body matches `POST /v1/creations`. The recipient name is locked to the original (case, spacing and small typo fixes allowed) so one link cannot be rewritten for someone else; otherwise `400 VALIDATION_ERROR`.

**Response 200** — same shape as create (`creationId`, `shareSlug`, `shareUrl`, `expiresAt`, `watermarked`).

**Errors:** `UNAUTHORIZED` 401/403 · `NOT_FOUND` 404 · `EXPIRED` 410 · `VALIDATION_ERROR` 400

## `DELETE /v1/creations/:creationId` (auth)

Expire the public share link and remove History. Ownership via `user_creations/{creationId}`.

**Response:** `204` empty body.

## `POST /v1/uploads/presign`

Get signed URL for client → R2/Firebase Storage upload.

**Response**
```json
{ "uploadUrl": "...", "photoRef": "uploads/tmp/abc.jpg", "expiresIn": 900 }
```

## `GET /api/story-frame` (public)

The picture a recipient posts to their story: a 1080x1920 PNG of Pip standing on a half-open card, with the occasion and the
stars found. Without `slug` it carries nothing from any card, so the same address always gives the same picture and it is
cached for good. With `slug` it also shows a peek: the sender's first name, the opening of the message (dropped if it looks
private) and the photo only as a blurred wash. The slug already opens the card, so nothing new is revealed; a locked or
missing card gets the plain picture, and a peek is cached for an hour only.

| Query | Meaning |
|---|---|
| `occasion` | `birthday`, `anniversary`, `thank_you`, `congratulations` or `just_because`; anything else looks like `birthday`. With a readable `slug` the card's own type wins |
| `found` | Stars found, 0 to 12 (never more than `of`) |
| `of` | Stars there were, 0 to 12. With `found=0` or `of=0` there is no score |
| `slug` | Optional. The card to peek at. The app leaves it out when the person turns the peek off |
| `v` | Design version. Ignored by the server; it only keeps a cached older design from being served after a redesign |

Anything out of range is made safe, not refused. See `docs/recipient-experience.md`.

## `GET /v1/cards/:slug` (public)

Recipient view metadata (no auth).

**Response 200**
```json
{
  "recipientName": "Mom",
  "message": "...",
  "templateType": "birthday",
  "mediaUrls": ["https://cdn.../1.jpg"],
  "fromName": "Rohan",
  "invitation": null
}
```

`invitation` is the object above for an invitation, and `null` for every other kind.

**Errors:** `NOT_FOUND` 404 · `EXPIRED` 410

## `GET /v1/cards/:slug/calendar` (public)

The dates of an invitation as an `.ics` file (`text/calendar`), one entry per event (or one all-day entry named for the occasion when none are listed). Times are floating local times, so a guest's phone shows them as written for the venue, three hours long. An event held somewhere else carries only its own venue as the location; the address is the main venue's. It follows the same read rules as the card (rate limit, expiry, `404` for anything that is not an invitation) and is sent `no-store` and `noindex`.

## `POST /v1/scheduled-sends/:id/approve`

Sender approves a send in `review`. **Auth required** (`Authorization: Bearer <Firebase ID token>`). Owner only.

Requires the generated creation to have ≥1 `photoRef` or `mediaUrl`. Otherwise **400 `VALIDATION_ERROR`** (`photos_required`) and the send stays `review`.

On success the send moves `review` → `approved`, then `dispatchScheduledSend` runs:

- If `OCCASIO_AUTOSEND_DISPATCH` is **not** `true` (default), channel calls are skipped and the send stays `approved`. `shareUrl` from generation is still returned so the client can open the system share sheet.
- If `OCCASIO_AUTOSEND_DISPATCH=true`, the providers run in order **whatsapp → email** (mock providers for whatsapp, sms and email only in the emulator or with `OCCASIO_MOCK_DELIVERY=true`). A channel is used only when its provider is configured and `relationships.deliveryConsent.<channel>` is `true`: `whatsapp` (Meta Cloud API, see `docs/whatsapp-delivery.md`) and `email` (Resend). First success → `sent` + FCM `autosend_sent`. All fail → retried by the sweep, then `failed` + `lastError`.
- WhatsApp refusals leave a `lastError` of `whatsapp_yearly_cap` (100 a year per user), `whatsapp_opted_out` (they replied STOP), `whatsapp_not_on_whatsapp`, `whatsapp_rate_limited`, `whatsapp_template`, `whatsapp_auth`, or `whatsapp_<http status>`; email takes over in each case.

Set `OCCASIO_MOCK_DELIVERY_FAIL=whatsapp,sms` (comma-separated channels) to force mock failures and test fallback.

### `GET|POST /v1/whatsapp/webhook`

Meta's webhook for the WhatsApp number. **No Firebase auth**; trust comes from Meta. `GET` answers the one-time address check (`hub.verify_token` must equal `WHATSAPP_VERIFY_TOKEN`, else **403**). `POST` needs a valid `X-Hub-Signature-256` (HMAC-SHA256 of the raw body keyed with `WHATSAPP_APP_SECRET`; **401** otherwise, **503** if the secret is not set). A reply of STOP, UNSUBSCRIBE, CANCEL, END, QUIT or OPT OUT records the sender's number (as a SHA-256 hash in `whatsapp_optouts`); that number is never sent a WhatsApp wish again. Always **200 `{ ok: true }`** for a signed delivery.

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
