---
title: Information architecture
description: MVP screen inventory, navigation patterns, and hierarchy for Occasio.
phase: Phase 2 — UX
status: Draft
updated: 2026-08-24
---

## Navigation assumptions

- **Guest** can finish Create → Share without signing in
- **Soft auth** gates Vault save, auto-send, synced History, subscription
- **4 tabs:** Create · Vault · History · Account

### Pattern legend

| Pattern | Meaning |
|---|---|
| Tab | Root destination |
| Push | Full-screen stack |
| Modal | Sheet/dialog over current screen |
| Deep link / FCM | External entry |

## Site map

```mermaid
flowchart TB
  SPLASH([Splash]) --> GATE{Signed in?}
  GATE -->|No| WELCOME[Welcome]
  GATE -->|Yes| TABS
  WELCOME --> TABS
  WELCOME --> AUTH

  subgraph AUTH[Onboarding / Auth]
    SIGNIN[Sign In]
    OTP[Phone OTP]
    SIGNIN --> OTP
  end

  subgraph TABS[Main Tab Shell]
    TAB_CREATE[Create]
    TAB_VAULT[Vault]
    TAB_HISTORY[History]
    TAB_ACCOUNT[Account]
  end

  AUTH_SOFT{{Soft Auth Modal}}

  subgraph CREATE[Create stack]
    TEMPLATES[Template Picker]
    PHOTOS[Photos]
    DETAILS[Name + Message]
    PREVIEW[Preview]
    SHARE[Share Success]
    TEMPLATES --> PHOTOS --> DETAILS --> PREVIEW --> SHARE
  end

  TAB_CREATE --> TEMPLATES
  SHARE --> SAVE_VAULT{{Save to Vault?}}
  SAVE_VAULT --> PERSON_FORM

  subgraph VAULT[Vault stack]
    VAULT_LIST[Vault List]
    PERSON_FORM[Add / Edit Person]
    PERSON_DETAIL[Person Detail]
    AUTOSEND[Auto-send toggles]
    REVIEW[Review Window]
    VAULT_LIST --> PERSON_DETAIL --> AUTOSEND
    VAULT_LIST --> PERSON_FORM
  end

  TAB_VAULT --> VAULT_LIST
  FCM([Push]) --> REVIEW

  subgraph HISTORY[History]
    HIST_LIST[Creations]
    HIST_DETAIL[Detail]
    HIST_LIST --> HIST_DETAIL
  end

  TAB_HISTORY --> HIST_LIST

  subgraph ACCOUNT[Account]
    ACC_HOME[Account Home]
    PLANS[Plans]
    MANAGE[Manage / Cancel]
    ACC_HOME --> PLANS
    ACC_HOME --> MANAGE
  end

  TAB_ACCOUNT --> ACC_HOME

  subgraph RECIPIENT[Public web]
    CARD_VIEW[Recipient Card]
    CTA[Make Your Own]
    CARD_VIEW --> CTA
  end

  SHARE -.-> CARD_VIEW
```

## Hierarchy

```
App
├── Splash / Welcome / Auth
├── Tab Shell
│   ├── Create → Template → Photos → Details → Preview → Share
│   ├── Vault → List → Detail / Add → Auto-send (+ Review via FCM)
│   ├── History → Detail
│   └── Account → Plans / Manage / Privacy / Settings
└── Web Recipient → Card → CTA
```

Full screen tables (purpose, entry, exit) live in conversation history and should be expanded here during the wireframe pass — this page is the structural spine.
