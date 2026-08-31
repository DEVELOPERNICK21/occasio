---
title: Product Requirements Document (PRD)
description: Vision, MVP, monetization, metrics, and risks for Occasio.
phase: Phase 1 — Product
status: Draft v2.1
updated: 2026-08-27
---

**Product name:** Occasio  
**Former working name:** "Momento" (deprecated)  
**One-line pitch:** Never miss what matters — save people once, auto-send a personalized wish every year.  
**Author:** Nick Kubde | Draft v2.1 | August 2026  
**Changelog (v1 → v2):** Renamed to Occasio; guest create + soft-auth clarified; review window elevated to PRD; mobile stack locked to React Native CLI; client architecture (feature-based + Clean Architecture principles); build phases realigned to Occasio-as-mobile; data model enums tightened.  
**Changelog (v2 → v2.1):** Target release dates locked; Discovery signed off.

### Target release

| Milestone | Target | Scope |
|---|---|---|
| **Private beta** | **30 Nov 2026** | Create + share + recipient view (validate demand) |
| **MVP store soft launch** | **28 Feb 2027** | + Auth, Vault, History, Billing, Auto-send + review window |

Assumes part-time solo build after wireframes/Stitch (~Sep–Nov for beta create/share). Slip only if Phase 1 share demand fails — then pause auto-send investment.

---

## 1. Vision

Not a card generator. A **relationship-memory subscription**: you save the people who matter (mom, partner, best friend, dad) once, with their key dates, and the app automatically creates and sends them a personalized, gamified digital wish on the right day — every year — without you having to remember or open the app.

The one-off card ("HeartCraft" model) is the acquisition hook. The **auto-send relationship vault** is the retention engine and the actual subscription product.

## 2. Problem Statement

- People forget dates, or remember too late to do something thoughtful.
- Existing digital card tools (HeartCraft and similar) solve the *creation* moment but not the *remembering* moment — they require the sender to open the app every single time, which is why retention on pure card-generator apps is weak (proven by their own pay-per-use pricing complaints).
- A generic calendar reminder ("Mom's birthday today") still leaves the *work* of making something nice to the last minute.

## 3. Target Users

| Segment | Why they'd use it |
|---|---|
| Young adults (18–30), India-first | Partners, proposals, anniversaries — the emotionally expressive, low-cash-but-high-sentiment segment |
| "Forgetful but caring" adult children (25–45) | Auto-send for parents' birthdays / Mother's Day / Father's Day — guilt-driven retention |
| Long-distance couples/families | Recurring emotional touchpoints without effort |
| Content creators / influencers (secondary channel) | Use cards as shareable content themselves — organic distribution loop |

## 4. Core Differentiation vs. HeartCraft

| | HeartCraft (as observed) | This product |
|---|---|---|
| Monetization | Pay-per-card → recently bundled subscription | Relationship-based recurring subscription from day one |
| Retention driver | None — must remember to open app | Automated: app remembers for you |
| Value delivered | One nice moment | An ongoing "I never miss what matters" relationship |
| Growth loop | Recipient sees branded card, may click through | Same, plus recipients become senders (auto-send creates repeat exposure every year) |

## 5. MVP Feature Set (Phase 1)

1. **Occasion templates** (reuse the proven mechanic, don't reinvent): Birthday, Sorry, Proposal, Anniversary, Photo Puzzle, Mother's/Father's Day — 4-5 to start, not all 6.
2. **Creation flow**: pick template → upload 1-3 photos + name + short message → preview → generate shareable link (no login required for recipient).
   - **Guest create:** a user can complete Create → Share **without** signing in.
   - **Soft auth gate:** sign-in is required only when saving to the Vault, enabling auto-send, syncing creations history across devices, or managing a subscription.
3. **Relationship Vault** (the differentiator): save a person (name, relationship type, birthday/anniversary date, phone/WhatsApp or email), toggle "auto-send" per occasion.
4. **Auto-send engine**: on the scheduled date, system auto-generates a card from a saved template + saved photos/message and sends the link via WhatsApp/SMS/email, with a push notification to the sender ("Sent! 🎉 Priya just got her birthday surprise from you").
   - **Review window (required for MVP):** before the recipient is notified, the sender gets a short window (e.g. 2 hours) to preview, edit, approve, or cancel the send. Reduces unwanted-send and trust risk.
5. **Payment**: Google Play Billing (Android) / App Store (iOS) for subscriptions; web checkout only for non-mobile flows where store policy allows.
6. **Basic account**: phone/Google sign-in, saved creations history.

## 6. Phase 2 (post-MVP, only after traction)

- Video-based templates (short animated messages)
- Group gifting (multiple people contribute to one card — e.g., friends pooling a birthday surprise)
- AI-assisted message writing ("help me say this") — careful, no impersonation of real people
- Reminder-only free tier upsell nudges ("You have 3 days left to personalize Mom's card")
- Referral rewards (free month for both sides)

## 7. Explicit Non-Goals

- Not a general greeting-card marketplace (no print-on-demand, no physical products in v1)
- Not a dating app or matchmaking feature
- No AI voice/deepfake features
- No scraping of contacts' personal data beyond what the user manually enters

## 8. Monetization Model — Full Subscription Structure

**Principle:** free tier hooks people via the one-off card mechanic (like HeartCraft); the *paid* product is the Relationship Vault + auto-send.

| Tier | Price (India) | What's included |
|---|---|---|
| **Free** | ₹0 | 1 manual card/month, watermark on shared card, no auto-send, up to 1 saved person (manual reminder only, no auto-generate) |
| **Personal** | ₹149/month or ₹999/year | Unlimited manual cards, up to 5 saved people with auto-send, no watermark, all templates |
| **Family** | ₹299/month or ₹1,999/year | Up to 15 saved people, priority/seasonal templates, video templates (Phase 2), early access to new occasions |
| **One-off unlock** (no subscription) | ₹49–99/card | For users who just want a single polished card — this is the HeartCraft-equivalent entry point, kept intentionally cheap to funnel into subscription |

**Why annual-first pricing:** the core value (auto-send on a birthday next year) only pays off across a year — monthly billing undersells the product and increases churn-related admin. Lead with annual in-app messaging; offer monthly as the "trial" path.

**Google Play/App Store cut:** budget ~15% off subscription revenue (India, as of mid-2026 fee structure) — price accordingly; this is non-negotiable for any purchase flow inside the Android/iOS app.

## 9. Success Metrics (first 90 days post-launch)

- Free → paid conversion: 3–6% is a realistic target for this category (gifting/lifestyle apps skew low; don't plan around SaaS-level 15%+ conversion)
- Vault attach rate: % of card-creators who save at least 1 person to the vault (this is the KPI that predicts long-term revenue, more than downloads)
- Auto-send delivery success rate: >98% (a missed birthday send is a trust-breaking failure for this exact product)
- Recipient → sender conversion: % of people who received a card and later created their own account

## 10. Key Risks

- **Trust/refund risk**: the HeartCraft reviews flagged unclear/unauthorized charges — subscription cancellation and refund flow must be unambiguous, or 1-star reviews will cap growth.
- **Marketing-dependent, not tech-dependent**: revenue ceiling is set by distribution (Instagram/WhatsApp virality), not feature count — don't over-invest in features before validating this.
- **Notification delivery reliability**: WhatsApp Business API / SMS providers can fail or get rate-limited — auto-send is a promise; broken promises are the whole product's downside risk.
- **Data sensitivity**: storing other people's names, phone numbers, birthdays without their direct consent — needs a clear privacy policy and easy data-deletion path (per Play Store Data Safety requirements).

---
