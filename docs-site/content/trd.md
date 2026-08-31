---
title: Technical Requirements Document (TRD)
description: System architecture, stack, data model, auto-send engine, and build phases.
phase: Phase 3 — Technical
status: Draft v2
updated: 2026-08-24
---

## 1. Architecture Overview (system)

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Next.js Web App │      │  React Native App │      │  Recipient Link  │
│  (creator flow,   │◄────►│  Occasio (CLI)    │      │  (public, no      │
│  marketing pages) │      │  + push notifs    │      │  login, view-only)│
└────────┬─────────┘      └────────┬─────────┘      └────────┬────────┘
         │                          │                         │
         └───────────────┬──────────┴──────────────┬──────────┘
                          ▼                         ▼
                 ┌─────────────────┐       ┌─────────────────┐
                 │ Firebase Auth /  │       │  Cloud Functions │
                 │ Firestore (data) │◄─────►│ (scheduler, send │
                 └─────────────────┘       │  engine, payments)│
                          │                 └────────┬─────────┘
                          ▼                          ▼
                 ┌─────────────────┐       ┌─────────────────┐
                 │ Cloudflare R2    │       │ WhatsApp/SMS/    │
                 │ (image/video     │       │ Email provider   │
                 │  storage)        │       │ (send channel)   │
                 └─────────────────┘       └─────────────────┘
```

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Web (creator + recipient view) | Next.js 14+, Tailwind, Framer Motion | Fast to ship recipient/marketing surfaces; share public card links |
| Mobile | **React Native CLI** (Occasio repo; RN 0.86+) | Already bootstrapped; core competency; **not Expo** unless a later migration is explicitly decided |
| Auth + DB | Firebase Auth + Firestore | Same stack as Finch/Pawfect — reuse patterns/instincts |
| Media storage | **Cloudflare R2** (not Firebase Storage) | Zero egress fees — critical since shared cards get viewed repeatedly by recipients with no login |
| Scheduler (auto-send) | Google Cloud Scheduler + Cloud Functions (cron, daily check) | Managed, cheap, reliable enough for date-based triggers |
| Payments | Google Play Billing (Android) / StoreKit (iOS); Razorpay only for any web-only checkout where store policy allows it | Store policy compliance is mandatory for digital goods |
| Billing abstraction | RevenueCat | Avoid building receipt validation from scratch (solo-dev time saver) |
| Notifications (in-app) | Firebase Cloud Messaging | Free, already Firebase-native |
| Send channel (to recipient) | WhatsApp Business API (Meta) primary, SMS (e.g., MSG91) fallback, email (Resend/SendGrid) always-on backup | WhatsApp is the highest open-rate channel in India; needs a fallback because Business API approval/cost can be a blocker early on |
| Language | **TypeScript strict** (`strict: true`) | Typed domain + Firestore/DTO boundaries; no `any` in domain |

## 2b. Client application architecture (Occasio RN + later Next.js)

**Approach:** feature-based modules + Clean Architecture *principles* (dependency rule, pure domain) — **not** a full enterprise ports-and-adapters monorepo for MVP.

### Feature modules

Top-level features aligned to MVP IA:

| Feature | Owns |
|---|---|
| `auth` | Sign-in, OTP, soft-auth modal, session |
| `create` | Templates, photos, message, preview, share success, free-limit / one-off paywall entry |
| `vault` | People list, add/edit, auto-send toggles, upcoming, review window UI, delete person |
| `history` | Creations list + detail, reshare |
| `billing` | Plans, store purchase, manage/cancel, entitlement surface |
| `recipient` | Public card view concerns (primarily web; shared types with mobile where useful) |
| `shared` | Design tokens, UI primitives, navigation shell, pure utilities |

### Per-feature layering (pragmatic)

```
feature/
  ui/            → screens, components (React Native)
  application/   → hooks / use-cases orchestrating domain + data
  domain/        → types, pure rules (tier caps, auto-send eligibility, status transitions)
  data/          → Firestore / R2 / RevenueCat / FCM adapters
```

### Dependency rules (enforced)

1. **UI** may depend on `application` and `domain`; UI must **not** import Firebase/RevenueCat SDKs directly.
2. **`data`** may depend on `domain`; `data` must **not** import React components or `ui`.
3. Features must **not** import another feature’s `ui`. Cross-feature calls go through `application` APIs or shared domain types.
4. Enforce with ESLint `no-restricted-imports` (or equivalent) from Phase 1 onward; tighten in Phase 5.

### State management (predictable)

| Kind | Approach | Examples |
|---|---|---|
| **Server / remote state** | Cache + sync layer (e.g. TanStack Query) and/or controlled Firestore listeners | Vault list, creations history, subscription entitlement |
| **Local flow / UI state** | Small scoped store (e.g. Zustand) or feature-local state | Create wizard steps, review-window draft edits |
| **Auth session** | Dedicated auth module state sourced from Firebase Auth | Soft gate, tab shell |

Do **not** dump all app state into one global store.

### Explicitly out of MVP (client)

- Full Clean Architecture package graph (separate npm packages per layer)
- Shared monorepo domain package between Next.js and RN — **revisit** when web + mobile actively share domain logic
- Over-abstracted repository interfaces for every collection “just in case”

## 3. Data Model (Firestore, high-level)

Typed enums / unions (strict TypeScript at the boundary):

```
SubscriptionTier = 'free' | 'personal' | 'family'
ScheduledSendStatus = 'pending' | 'review' | 'approved' | 'sent' | 'cancelled' | 'failed'
DeliveryChannel = 'whatsapp' | 'sms' | 'email'
SubscriptionProvider = 'google_play' | 'app_store' | 'razorpay'
SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'grace' | 'pending'
```

```
users/{userId}
  - name, phone, email
  - subscriptionTier: SubscriptionTier
  - subscriptionExpiry: timestamp | null

creations/{creationId}
  - userId, templateType, mediaUrls[] (R2 refs), message, recipientName
  - shareLink (public slug), viewCount, createdAt, expiresAt
  - watermarked: boolean

relationships/{relationshipId}
  - userId, personName, relationshipType
  - dates: { birthday?, anniversary?, ... }
  - autoSendEnabled: { birthday?: boolean, anniversary?: boolean, ... }
  - contactChannel: { whatsapp?, phone?, email? }
  - preferredTemplateType?: string

scheduled_sends/{sendId}
  - relationshipId, userId, occasionType
  - scheduledDate, reviewDeadline
  - status: ScheduledSendStatus
  - generatedCreationId?
  - deliveryChannelAttempted?: DeliveryChannel[]
  - deliveryChannelUsed?: DeliveryChannel
  - lastError?: string

subscriptions/{subscriptionId}
  - userId, tier: SubscriptionTier
  - provider: SubscriptionProvider
  - status: SubscriptionStatus
  - renewalDate
```

**Domain rules (pure, in `domain/`):** vault person caps by tier; auto-send allowed only on paid tiers; free manual card quota; watermark when free/one-off rules say so.

## 4. Core System: Auto-Send Engine

1. **Daily cron job** (Cloud Scheduler, runs once/day, e.g. 6 AM IST) queries `relationships` where `autoSendEnabled` is true and today matches a saved date (or N days before, for prep-ahead cards).
2. For each match: auto-generate a `creation` using the person's saved photos/template preference (fallback to a default template if none set) → upload media to R2 → create shareable link; set `scheduled_sends.status` to `review`.
3. Notify sender (FCM) that the review window is open. On approve **or** review deadline timeout → dispatch. On cancel → `cancelled` (no delivery).
4. Dispatch via preferred channel (WhatsApp → SMS fallback → email fallback) using a queue (Cloud Tasks) to handle retries and avoid provider rate limits. Record `deliveryChannelUsed` / errors on the send doc.
5. Push notification to the **sender** confirming send (`sent`).
6. Log delivery status; alert (email to yourself, initially) on failures above a threshold — this is your highest-severity bug class since it breaks the core promise.

## 5. Payments & Store Compliance

- All subscription purchases inside the Android/iOS apps **must** route through Google Play Billing / StoreKit — no exceptions for digital goods.
- Use RevenueCat to abstract both platforms' billing and avoid building receipt validation from scratch — saves real engineering time for a solo dev.
- Entitlement checks used by UI live behind `billing` / `domain` (tier → caps, auto-send allowed) — screens never hardcode store SKUs for business rules.
- Design the cancel/refund flow to be one-tap and unambiguous in-app — directly mitigates the "unauthorized charge" complaint pattern seen in HeartCraft's reviews.

## 6. Security & Privacy

- Recipient-facing card pages: no login, but rate-limit view endpoints to prevent scraping of other users' photos.
- Relationship data (other people's names/dates/numbers) is personal data about non-users — Play Store Data Safety form must disclose this; provide an easy in-app "delete this person's data" action.
- Auto-expire and hard-delete media in R2 after a configurable window (e.g., 120 days) unless the sender pins it — controls storage cost and reduces data-retention liability.

## 7. Cost Estimate (early stage, <5K users)

| Item | Estimated monthly cost |
|---|---|
| Firebase (Auth + Firestore, free tier initially) | ₹0–1,500 |
| Cloudflare R2 (storage, zero egress) | ₹500–2,000 |
| Cloud Scheduler + Functions | ₹0–500 (generous free tier) |
| WhatsApp Business API / SMS fallback | ₹1,000–5,000 (usage-based, scales with sends) |
| Domain + misc | ~₹100/month amortized |
| **Total pre-scale** | **~₹2,000–9,000/month**, scaling with send volume, not user count |

Play Store/App Store commission (~15% of subscription revenue) comes off the top separately — factor into your price points, don't treat it as a cost line to optimize away.

## 8. Build Phases & Timeline (solo, part-time — Occasio-as-mobile)

Occasio RN is the primary client. Web recipient/marketing can start minimal alongside Phase 1 share links.

| Phase | Scope | Est. time | Architecture focus |
|---|---|---|---|
| 1 | Create flow, 3 templates, shareable link, minimal recipient view (no auth to view) | 3 weeks | Features `create` + `recipient`; `Creation` domain types; guest create |
| 2 | Auth, Relationship Vault (add/edit people, dates), History; manual reminders only (no auto-send yet) | 2 weeks | Features `auth`, `vault`, `history`; soft-auth gate |
| 3 | Auto-send engine (cron + WhatsApp/SMS/email dispatch), review-window UX | 2–3 weeks | `scheduled_sends` status machine in domain; Functions outside app UI |
| 4 | Subscription tiers + Play Billing (RevenueCat), one-off unlock | 1–2 weeks | Feature `billing`; entitlement rules in domain |
| 5 | Hardening: FCM permissions, cancel/delete-data flows, ESLint dependency boundaries, strictness pass; shared types with web only if needed | 1–2 weeks | Boundaries + predictability pass |
| **Total** | | **~10–12 weeks part-time** | Automation engine remains the added scope vs a plain card clone |

## 9. Recommended Build Order Relative to Your Other Projects

Per earlier discussion: this sits behind the model portfolio outreach and UNTIL growth work in priority. If you do start it, **Phase 1 alone (plain card creator, no automation) is enough to test demand** before investing in the scheduler/auto-send engine — validate people actually want to make and share cards before building the harder, more valuable automation layer.

That priority also constrains architecture: ship Phase 1 with feature folders + strict TS + thin domain; do **not** block launch on a shared monorepo or full Clean Architecture package split.
