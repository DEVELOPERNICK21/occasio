---
title: Discovery 1-pager
description: Phase 0 output — who, pain, cost, competitors, hypothesis, feasibility.
phase: Phase 0 — Discovery
status: Locked
updated: 2026-08-27
---

## Who

India-first adults **18–45** who care about people but forget dates or remember too late:

- Young adults sending to partners (anniversaries, proposals, “sorry”)
- Adult children who must not miss parents’ birthdays / Mother’s Day / Father’s Day
- Long-distance families needing low-effort emotional touchpoints

## Pain

- Existing digital card tools solve **creation**, not **remembering** — you must open the app every time
- Calendar reminders still leave the *work* of making something thoughtful to the last minute
- Guilt + weak last-minute “Happy Birthday” texts when care was intended

## Cost of not solving it

- Broken trust with people who matter (missed birthdays)
- No retention for pure card generators → pay-per-use fatigue (HeartCraft-style complaints)
- Recurring occasions never compound into a product habit

## Competitors & gaps (initial)

| Competitor / category | What they do | Gap vs Occasio |
|---|---|---|
| HeartCraft-like card apps | One-off gamified digital cards | Weak retention; must remember to open; pay friction |
| Calendar / reminder apps | Notify on the day | No personalized wish created or sent |
| WhatsApp alone | Manual message | No vault, no auto-generate, no year-over-year template |
| Generic subscription “gifting” | Broader marketplace | Occasio is relationship-memory + auto-send, not POD marketplace |

*(Expand with 1–2 named India-market apps as research deepens.)*

## Core hypothesis

**If** we let guests create and share a personalized card in under ~3 minutes, **and** nudge them to save that person to a Relationship Vault with auto-send,

**then** users will attach at least one person to the vault and enable auto-send,

**which drives** paid Personal/Family subscription and reliable yearly sends without reopening the app — measured by vault attach rate, free→paid 3–6%, and auto-send delivery &gt;98%.

## Feasibility

| Lens | Assessment |
|---|---|
| **Technical** | RN CLI + Firebase + R2 + Cloud Scheduler + WA/SMS/email is known territory; Phase 1 (create/share) validates before cron |
| **Legal / compliance** | Stores third-party PII (names, phones, birthdays) → **DPDP Act 2023**, Play Data Safety, Apple Privacy; in-app delete person + account |
| **Budget** | ~₹2,000–9,000/mo pre-scale; store ~15% cut on subscriptions; WA/SMS scales with sends |
| **Risk** | WhatsApp Business API approval/cost; delivery reliability is the product promise; trust/cancel UX |

## Decision

Proceed to Phase 1 PRD (already largely written) → wireframes → Phase 1 build (**create/share first**). Do not invest in auto-send engine until card share demand is validated.

## Sign-off

| Field | Value |
|---|---|
| **Status** | Locked — feeds PRD |
| **Date** | 2026-08-27 |
| **Owner** | Nick Kubde |
| **Next** | Phase 2 wireframes → usability pass → Phase 2.5 Stitch |
