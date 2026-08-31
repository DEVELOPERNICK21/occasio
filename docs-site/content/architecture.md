---
title: Client architecture
description: Occasio mobile app — feature modules, layers, dependency rules, state.
phase: Phase 3 — Technical
status: Agreed
updated: 2026-08-31
---

> **Scope:** This document describes the **React Native app** (`src/`). The [docs-site](/docs/surfaces) is documentation/landing only — not the product codebase.

## Approach

**Feature-based + Clean Architecture principles + strict TypeScript + dependency boundaries + predictable state.**

Apply principles pragmatically for a solo MVP — **not** a full ports-and-adapters monorepo on day one.

**Code lives at:** `src/features/<name>/{ui,application,domain,data}`

## Feature modules (mobile)

| Feature | Path | Owns |
|---|---|---|
| `auth` | `src/features/auth/` | Sign-in, OTP, soft-auth, session |
| `create` | `src/features/create/` ✅ started | Templates → share |
| `vault` | `src/features/vault/` | People, auto-send UI, review window |
| `history` | `src/features/history/` | Creations list/detail |
| `billing` | `src/features/billing/` | Plans, IAP, cancel |
| `shared` | `src/shared/` | Navigation shell, tokens, UI primitives |

**Recipient** public card view is a **thin web page** (share URL), not a mobile feature folder — see [Product surfaces](/docs/surfaces).

## Per-feature layering

```
src/features/<feature>/
  ui/            → screens, components (React Native only)
  application/   → hooks / use-cases
  domain/        → types, pure rules (tier caps, eligibility)
  data/          → Firestore / upload / RevenueCat adapters
```

## Dependency rules

1. UI → application/domain only (no direct Firebase/RevenueCat in screens)
2. `data` → domain only (no React/`ui`)
3. No feature may import another feature’s `ui`
4. Enforce with ESLint `no-restricted-imports` (foundation hardening — next)

## State

| Kind | Tooling |
|---|---|
| Remote | TanStack Query and/or Firestore listeners |
| Flow UI | Small Zustand / local state (create wizard, review draft) |
| Auth | Auth module from Firebase Auth |

## Out of MVP

- Separate npm packages per layer
- Shared monorepo domain with docs-site
- Repository interfaces for every collection “just in case”

System/backend: [TRD](/docs/trd) · Repo map: [Surfaces](/docs/surfaces) · Root: `ARCHITECTURE.md`
