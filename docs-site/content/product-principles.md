---
title: Product principles
description: Locked decision principles for Occasio — ordered by product risk.
phase: Phase 1 — Product
status: Locked draft
updated: 2026-08-27
---

Template checklists often list offline / a11y / performance / security as equals. For Occasio, principles are **ordered by what can kill the product**.

## 1. Trust-first

Cancel, refund, and the auto-send **review window** must be obvious. HeartCraft-style “surprise charge” patterns are an existential review risk.

## 2. Delivery-reliability-first

Auto-send is a promise. Missed birthdays break the product. Design for WhatsApp → SMS → email fallback, retries, and failure alerts.

## 3. Privacy-first (third-party PII)

Vault stores other people’s names, dates, and contacts. DPDP + store disclosures + one-tap delete are mandatory, not polish.

## 4. Narrow v1

Guest create/share validates demand before the scheduler. Non-goals stay non-goals until traction.

## 5. Performance & accessibility

Snappy create wizard; readable type; workable on mid/low-end Android. Important — secondary to trust and delivery.

## 6. Offline best-effort (not offline-first)

Drafting a card offline is nice. Sharing and auto-send **require network**. Do not block architecture on full offline-first sync.
