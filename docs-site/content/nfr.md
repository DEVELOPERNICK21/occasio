---
title: Non-functional requirements (NFR)
description: Performance, reliability, and size targets for Occasio MVP.
phase: Phase 3 — Technical
status: Draft v1
updated: 2026-08-31
---

## Mobile (RN)

| Metric | Target | Measure |
|---|---|---|
| Cold start (mid Android) | &lt; 3s to interactive | Manual / Firebase Perf |
| Create wizard scroll | 60 fps | Systrace on low-end device |
| JS bundle (Phase 1) | &lt; 8 MB | Metro report |
| Image picker → preview | &lt; 2s local | In-app timing |

## Backend

| Metric | Target | Measure |
|---|---|---|
| `POST /v1/creations` p95 | &lt; 3s | Cloud Monitoring |
| Recipient `GET /cards/:slug` p95 | &lt; 500ms | CDN + Function logs |
| Auto-send batch failure rate | &lt; 2% / day | `scheduled_sends` status |
| Auto-send delivery success | &gt; 98% | PRD KPI |

## Reliability

- Share link generation: idempotent per draft session
- Upload: retry 3x with backoff
- Dispatch: WhatsApp → SMS → email queue with dead-letter alert

## Accessibility (baseline)

- Tap targets ≥ 44pt
- Screen reader labels on Create CTAs
- Color contrast ≥ 4.5:1 on body text (accent on cream passes)

## Security NFR (see Phase 5)

- Tokens in Keychain/Keystore
- TLS only
- No PII in logs
