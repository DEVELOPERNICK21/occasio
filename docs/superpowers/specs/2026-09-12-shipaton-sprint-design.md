# Shipaton 2026 sprint — design

**Date:** 2026-09-12  
**Decision:** Path **A** — Shipaton eligibility only; auto-send **engine** deferred until after Devpost submit.  
**Deadline:** 30 Sep 2026, 11:45pm PDT

## Goal

Ship a public store build that uses RevenueCat for ≥1 IAP, available in the US, with a complete Devpost submission — without claiming auto-send delivery.

## Current reality (audit)

| Piece | Status |
|---|---|
| `features/billing/` (domain → data → application) | Implemented |
| `BillingProvider` in `App.tsx` | Wired |
| RC Paywall UI + Customer Center | Wired via `revenueCatUi.ts` |
| Preview quota → `presentPaywall` | Wired |
| Account: See Pro / Restore / Manage | Wired |
| Vault caps + `canEnableAutoSend` from tier | Wired (toggle only) |
| Domain tests for `occasio_pro` → personal | Present |
| Test Store API key in `revenueCat.ts` | Present |
| Play/App Store production products + listing | **You** (console) |
| Devpost assets + submit | **You** |
| Auto-send scheduler / WhatsApp / review push | **Out of scope** |

**Dev note:** `env.devRelaxedQuota` is `__DEV__`, so debug builds skip free-tier paywall on Generate. Use **Account → See Occasio Pro** to force the RC paywall in debug.

## Explicit non-goals (this sprint)

- Cloud Scheduler / `scheduled_sends`
- WhatsApp / SMS / email delivery
- Review-window push UX
- Claiming “auto-sends wishes” on Play/App Store listing copy

Vault may keep the auto-send **toggle** (paid gate). Listing and demo video: “save people + upgrade for Pro” — not “we send for you every year” until the engine ships.

## Success criteria

1. Sandbox/Test Store purchase grants `occasio_pro` → badge shows OCCASIO PRO; Vault allows >1 person / auto-send toggle  
2. Production Play (and/or App Store) listing live in **US**  
3. Devpost submitted with store URL, video ≤2 min, icon, screenshot, RC Project ID, judge trial/promo instructions  

## Tracks

1. **Verify billing** (device)  
2. **Store release** (Play Console / ASC)  
3. **Devpost** (assets + submit)
