---
title: User flows — Must-have stories
description: Happy paths plus error and empty branches for the five MVP Must stories.
phase: Phase 2 — UX
status: Draft
updated: 2026-08-24
---

## 1) Create and share a card

```mermaid
flowchart TD
  START([Open Create]) --> PICK[Template Picker]
  PICK --> PHOTO[Add Photos]
  PHOTO --> UP{Upload OK?}
  UP -->|Fail| UP_ERR[Retry / remove]
  UP_ERR --> PHOTO
  UP -->|OK| DETAILS[Name + Message]
  DETAILS --> PREVIEW[Preview]
  PREVIEW --> LIMIT{Free limit?}
  LIMIT -->|Yes| PAYWALL[Paywall modal]
  PAYWALL -->|Subscribe| SUB[[Story 4]]
  PAYWALL -->|One-off| PAY{Payment OK?}
  PAY -->|Declined| PAY_FAIL[Payment declined]
  PAY_FAIL --> PAYWALL
  PAY -->|OK| GEN
  LIMIT -->|No| GEN[Generate share link]
  GEN --> SHARE[Share Success]
  SHARE --> SAVE{{Save to Vault?}}
  SAVE -->|Yes| S2[[Story 2]]
  SAVE -->|No| DONE([Shared])
```

## 2) Add person to Vault + enable auto-send

```mermaid
flowchart TD
  START([Vault / Save modal]) --> AUTH{Signed in?}
  AUTH -->|No| SOFT[Soft Auth]
  AUTH -->|Yes| LIST[Vault List]
  LIST --> EMPTY{Any people?}
  EMPTY -->|No| EMPTY_UI[Empty: Add first person]
  EMPTY_UI --> FORM
  EMPTY -->|Yes| FORM[Add / Edit Person]
  FORM --> DATE{Date set?}
  DATE -->|No| NO_DATE[Warn: no upcoming date]
  NO_DATE --> FORM
  DATE -->|Yes| DETAIL[Person Detail]
  DETAIL --> TOGGLE[Auto-send toggles]
  TOGGLE --> PAID{Paid tier?}
  PAID -->|No| SUB[[Story 4]]
  PAID -->|Yes| ARM([Auto-send armed])
```

## 3) Auto-send on schedule

```mermaid
flowchart TD
  CRON([Daily cron IST]) --> MATCH{Due sends?}
  MATCH -->|None| IDLE([No-op])
  MATCH -->|Yes| GEN[Generate creation]
  GEN --> REVIEW[Review window + FCM]
  REVIEW --> ACT{Approve / timeout / cancel}
  ACT -->|Cancel| CANCEL[cancelled]
  ACT -->|Go| WA[WhatsApp]
  WA -->|Fail| SMS[SMS fallback]
  SMS -->|Fail| EMAIL[Email fallback]
  EMAIL -->|Fail| FAIL[failed + alert]
  WA -->|OK| SENT[sent + FCM]
  SMS -->|OK| SENT
  EMAIL -->|OK| SENT
```

## 4) Subscribe

```mermaid
flowchart TD
  START([Paywall / Account / Cap]) --> PLANS[Plans annual-first]
  PLANS --> STORE[Play / App Store sheet]
  STORE --> R{Result}
  R -->|Cancel| PLANS
  R -->|Declined| DECLINE[Payment declined]
  DECLINE --> STORE
  R -->|OK| VAL[Validate receipt]
  VAL -->|Fail| RESTORE[Restore / retry]
  VAL -->|OK| SUCCESS[Purchase Success]
  SUCCESS --> RESUME([Resume prior flow])
```

## 5) Recipient opens card → own Vault

```mermaid
flowchart TD
  LINK([Open share link]) --> RES{Slug OK?}
  RES -->|Expired/missing| EXP[Expired / Not found]
  RES -->|OK| VIEW[Recipient Card View]
  VIEW --> CTA[Make Your Own]
  CTA --> AUTH{Account?}
  AUTH -->|No| SIGNIN[Sign in]
  AUTH -->|Yes| VAULT[Add Person]
  SIGNIN --> VAULT
  VAULT --> EMPTY{Vault empty?}
  EMPTY -->|Yes| EMPTY_UI[Empty state]
  EMPTY_UI --> SAVE
  EMPTY -->|No| SAVE[Save person]
  SAVE --> DONE([Saved — optional Story 2])
```

## Cross-links

| From | Branch | To |
|---|---|---|
| 1 | Subscribe / one-off | 4 |
| 1 | Save to Vault | 2 |
| 2 | Cap / auto-send gate | 4 |
| 3 | Delivery link | 5 |
| 5 | Make your own | 1 |
