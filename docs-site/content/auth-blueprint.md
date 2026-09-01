---
title: Feature blueprint — Auth
description: Phase 4 mini-PRD for guest → account soft-auth (Google + Email).
phase: Phase 4 — Build
status: In progress
updated: 2026-09-01
---

## Goal

Guest can **create and share without signing in**. Sign-in is required only for Vault, synced History, auto-send, and subscription — via a **soft-auth modal**, not a hard wall.

## Principles (from PRD)

- Guest create → share: **no auth**
- Soft gate on: vault save/view, history sync, auto-send, billing
- **MVP sign-in: Google + Email** (free on Firebase Spark — no SMS cost)
- Phone OTP deferred until Blaze + budget for per-SMS charges
- Recipient phone numbers in Vault are **contact data**, not login OTP

## Layers

| Layer | Responsibility |
|---|---|
| `domain/` | `GatedAction`, `email.ts` validation, `mapUser` / `formatAuthIdentity` |
| `data/` | `authRepository` — Firebase Auth + Google Sign-In only (no React) |
| `application/` | `AuthProvider`, `useAuth`, `useRequireAuth` |
| `ui/` | `SoftAuthModal`, `AccountScreen`, `GuestGateScreen` |

**No Firebase imports in `ui/`.** Session flows through `AuthProvider`.

## Screens & surfaces

| Surface | Status |
|---|---|
| Soft-auth modal (Google + Email) | ✅ |
| Account tab | ✅ Guest + signed-in states |
| Vault / History guest gates | ✅ Sign-in CTA |
| Share success → Save to Vault | ✅ Triggers soft auth |
| Phone OTP login | Deferred (paid SMS) |
| Welcome / splash | Deferred |

## Firebase Console

| Provider | Status |
|---|---|
| Email/Password | Enable in Authentication → Sign-in method |
| Google | Enable + SHA-1 for Android debug/release |
| Phone | **Off for MVP** (costs per SMS on Blaze) |

## Config

| Flag | Purpose |
|---|---|
| `env.useMockAuth` | Skip Firebase — mock Google/email sign-in (UI dev only) |
| `firebaseConfig.googleWebClientId` | Web client ID (client_type 3) for Google Sign-In |

Native configs: `google-services.json`, `GoogleService-Info.plist`, iOS URL scheme in `Info.plist`.

## Analytics

| Event | When |
|---|---|
| `soft_auth_shown` | Modal opens |
| `email_sign_in_started` | Email form submitted |
| `sign_in_success` | Signed in (`method`: `google` \| `email`) |
| `sign_out` | User signs out |
| `vault_save_requested` | Authed user taps Save to Vault |

## Acceptance criteria

- [x] Guest can use Create tab without sign-in
- [x] `useRequireAuth(action, onSuccess)` pattern for gated actions
- [x] Google Sign-In in soft-auth modal
- [x] Email sign-in + create account in soft-auth modal
- [x] Account screen shows session + sign out
- [x] Domain tests: email, gated actions, identity display
- [ ] Device tested: Google on Android + iOS
- [ ] Device tested: Email create + sign-in
- [ ] Link anonymous creations to uid on sign-in (later)

## Code map

```
src/features/auth/
  domain/types.ts, gatedActions.ts, email.ts, mapUser.ts, phone.ts (vault contacts)
  data/authRepository.ts, authErrors.ts, googleSignIn.ts
  application/AuthProvider.tsx, useAuth.ts
  ui/components/SoftAuthModal.tsx
  ui/screens/AccountScreen.tsx, GuestGateScreen.tsx
```

Wired in `App.tsx` → `AuthProvider` + `SoftAuthModal`.

## Next

**History feature** — past creations for signed-in user. **Person detail** — edit/delete in Vault.
