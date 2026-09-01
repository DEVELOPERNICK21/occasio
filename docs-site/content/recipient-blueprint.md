---
title: Feature blueprint — Recipient web
description: Phase 4 mini-PRD for the public card view at /c/[slug].
phase: Phase 4 — Build
status: In progress
updated: 2026-09-01
---

## Goal

Recipient opens a share link (WhatsApp, SMS, etc.) and sees a calm, branded card — no login, fast load, good link previews.

**Route:** `https://occasio-greetings.vercel.app/c/{slug}`

## Screens

| Surface | Route | Status |
|---|---|---|
| Card view | `/c/[slug]` | ✅ Live |
| Expired link | `/c/[slug]` (410/expired) | ✅ |
| Not found | `/c/[slug]` (404) | ✅ Branded |
| OG preview image | `/c/[slug]/opengraph-image` | ✅ Dynamic |

## Data flow

```
/c/[slug]
  → fetchRecipientCard(slug)
      demo slug? → parseDemoSlug
      else → Firestore Admin (lookupCardBySlug)
      fallback → OCCASIO_API_BASE/v1/cards/:slug
  → RecipientCardView | ExpiredCardPage | notFound()
```

Create still writes via `POST /api/v1/creations` (Vercel). Recipient reads server-side only — Firestore client rules deny direct access.

## Acceptance criteria

- [x] Card renders name, template, message, photo (base64 or URL)
- [x] Expired cards show friendly message (30-day guest TTL)
- [x] Missing slug shows branded 404 (not generic Next.js page)
- [x] OG image for WhatsApp / iMessage previews (`summary_large_image`)
- [x] "Make your own" CTA → public landing `/`
- [ ] Multi-photo carousel (deferred until Blaze + Storage)
- [ ] Framer Motion entrance (nice-to-have)
- [ ] Analytics: `card_viewed` (deferred)

## OG image strategy

| Photo type | Preview |
|---|---|
| Base64 inline (Spark) | Embedded in generated OG image |
| HTTPS URL (Blaze/Storage) | Same — photo in OG card layout |
| No photo | Accent-soft placeholder panel |

Next.js file convention: `opengraph-image.tsx` auto-wires `og:image` and `twitter:image`.

## Code map

```
docs-site/src/
  app/c/[slug]/page.tsx
  app/c/[slug]/opengraph-image.tsx
  app/c/[slug]/not-found.tsx
  components/RecipientCardView.tsx
  components/ExpiredCardPage.tsx
  components/CardNotFoundPage.tsx
  lib/fetchRecipientCard.ts
  lib/fetchCardFromFirestore.ts
  lib/creationsServer.ts   ← lookupCardBySlug
```

## Next after recipient

1. **Auth** — guest → account (Firebase Auth)
2. **Vault + history** — save people, past cards
3. **Billing** — RevenueCat, wire paywall
4. **Auto-send** — scheduled dispatch engine
