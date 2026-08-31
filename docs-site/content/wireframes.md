---
title: Low-fi wireframes
description: Structure-only mobile wireframes for Must-have screens — no visual design yet.
phase: Phase 2 — UX
status: Draft
updated: 2026-08-27
---

Structure only. No colors, fonts, or final copy. Mobile-first (Occasio RN). Use these for the usability pass, then Stitch (Phase 2.5).

**Primary action per flow:** Create = share a link · Vault = save person + arm auto-send · Billing = subscribe · Recipient = view card + make own.

---

## Shell — tab bar (authenticated / guest)

```
┌─────────────────────────────┐
│  (screen content)           │
│                             │
│                             │
├─────────────────────────────┤
│ [Create] [Vault] [History]  │
│          [Account]          │
└─────────────────────────────┘
```

Guest: all tabs visible; Vault / History / Account soft-gate on gated actions.

---

## A — Welcome (first launch)

**P0:** brand, one-line value, primary CTA, secondary sign-in  
**Success:** land on Create tab (guest) or signed-in shell

```
┌─────────────────────────────┐
│                             │
│         OCCASIO             │
│   never miss what matters   │
│                             │
│  [ Create a card ]          │
│  [ Sign in ]                │
│                             │
│  (skip / continue as guest) │
└─────────────────────────────┘
```

**States:** idle · loading (splash) · offline banner

---

## B — Create: Template picker (Tab root)

**P0:** occasion grid, continue  
**Empty N/A** (templates fail → error + retry)

```
┌─────────────────────────────┐
│ Create a wish               │
│ Pick an occasion            │
│                             │
│ ┌──────┐ ┌──────┐           │
│ │Birth │ │Anni. │           │
│ └──────┘ └──────┘           │
│ ┌──────┐ ┌──────┐           │
│ │Sorry │ │Mom/  │           │
│ │      │ │Dad   │           │
│ └──────┘ └──────┘           │
│                             │
│        [ Continue ]         │
├─────────────────────────────┤
│ Create  Vault  Hist  Acct   │
└─────────────────────────────┘
```

---

## C — Create: Add photos

**P0:** 1–3 photo slots, next  
**Error:** upload failed → retry / remove

```
┌─────────────────────────────┐
│ ←  Photos                   │
│ Add 1–3 photos              │
│                             │
│ ┌─────┐ ┌─────┐ ┌─────┐     │
│ │ +   │ │     │ │     │     │
│ │     │ │ img │ │     │     │
│ └─────┘ └─────┘ └─────┘     │
│                             │
│  (upload error inline)      │
│                             │
│        [ Next ]             │
└─────────────────────────────┘
```

---

## D — Create: Name + message

**P0:** recipient name, short message, next

```
┌─────────────────────────────┐
│ ←  Details                  │
│                             │
│ To                          │
│ [________________________]  │
│                             │
│ Message                     │
│ [________________________]  │
│ [________________________]  │
│                             │
│        [ Preview ]          │
└─────────────────────────────┘
```

---

## E — Create: Preview

**P0:** card preview stage, generate/share CTA  
**Branch:** free-limit → paywall modal

```
┌─────────────────────────────┐
│ ←  Preview                  │
│                             │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │     [ animated card ]   │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│     [ Generate link ]       │
└─────────────────────────────┘
```

---

## F — Create: Share success

**P0:** link, share button, save-to-vault nudge

```
┌─────────────────────────────┐
│  Link ready                 │
│                             │
│  [ copy link ............ ] │
│  [ Share via WhatsApp ]     │
│                             │
│  ┌───────────────────────┐  │
│  │ Save to Vault so you  │  │
│  │ never miss this date? │  │
│  │ [ Save person ] [No]  │  │
│  └───────────────────────┘  │
│                             │
│  [ Create another ]         │
└─────────────────────────────┘
```

---

## G — Paywall modal (free limit / watermark)

```
┌─────────────────────────────┐
│                             │
│    ╔═══════════════════╗    │
│    ║ Free limit reached║    │
│    ║                   ║    │
│    ║ [ Personal /yr ]  ║    │
│    ║ [ Family /yr ]    ║    │
│    ║ [ Unlock 1 card ] ║    │
│    ║ [ Not now ]       ║    │
│    ╚═══════════════════╝    │
└─────────────────────────────┘
```

---

## H — Vault list

**Empty (P0):** CTA add first person  
**Idle:** people rows + upcoming hint

```
EMPTY                         WITH DATA
┌─────────────────────┐       ┌─────────────────────┐
│ Vault               │       │ Vault          [+]  │
│                     │       │                     │
│  No people yet      │       │ Mom        12 Sep   │
│  Save someone you   │       │ Partner    3 Oct    │
│  care about         │       │                     │
│                     │       │ Upcoming            │
│  [ Add a person ]   │       │ · Mom birthday 18d  │
│                     │       │                     │
├─────────────────────┤       ├─────────────────────┤
│ Create Vault Hist…  │       │ Create Vault Hist…  │
└─────────────────────┘       └─────────────────────┘
```

---

## I — Add / Edit person

**P0:** name, relationship, date(s), contact channel  
**Warn:** no date → can’t arm auto-send

```
┌─────────────────────────────┐
│ ←  Add person               │
│ Name     [______________]   │
│ Relation [ Mom      ▾ ]     │
│ Birthday [ date     ]       │
│ (warn if empty)             │
│ WhatsApp [______________]   │
│                             │
│        [ Save ]             │
└─────────────────────────────┘
```

---

## J — Person detail + auto-send

```
┌─────────────────────────────┐
│ ←  Mom                      │
│ Birthday · 12 Sep           │
│ WhatsApp · +91…             │
│                             │
│ Auto-send                   │
│ Birthday     [ ON / OFF ]   │
│ (if free → upsell Plans)    │
│                             │
│ [ Edit ]  [ Delete ]        │
└─────────────────────────────┘
```

---

## K — Auto-send review window (from push)

**P0:** preview, time left, approve / edit / cancel

```
┌─────────────────────────────┐
│ Review before send          │
│ Sends in 1h 42m             │
│                             │
│ ┌─────────────────────────┐ │
│ │     card preview        │ │
│ └─────────────────────────┘ │
│                             │
│ [ Approve now ]             │
│ [ Edit ]  [ Cancel send ]   │
└─────────────────────────────┘
```

---

## L — History

```
EMPTY                         WITH DATA
┌─────────────────────┐       ┌─────────────────────┐
│ History             │       │ History             │
│ No creations yet    │       │ Mom · Birthday      │
│ [ Create a card ]   │       │ Shared · 2 views    │
└─────────────────────┘       └─────────────────────┘
```

---

## M — Account + Plans

```
ACCOUNT                       PLANS
┌─────────────────────┐       ┌─────────────────────┐
│ Account             │       │ ← Plans             │
│ Guest / signed-in   │       │ Annual (recommended)│
│ Tier: Free          │       │ ○ Personal ₹999/yr  │
│ [ Plans ]           │       │ ○ Family  ₹1999/yr  │
│ [ Manage / Cancel ] │       │ Monthly alternative │
│ [ Privacy ]         │       │ [ Continue ]        │
└─────────────────────┘       └─────────────────────┘
```

---

## N — Recipient (public web)

```
OK                            EXPIRED
┌─────────────────────┐       ┌─────────────────────┐
│  (card plays)       │       │ Link expired        │
│                     │       │                     │
│ From Rohan          │       │ [ Make your own ]   │
│                     │       └─────────────────────┘
│ [ Make your own ]   │
└─────────────────────┘
```

---

## Content inventory (global P0)

| Screen | Must show on first paint |
|---|---|
| Welcome | Brand + create CTA |
| Template | Occasion choices |
| Photos | Slots + next |
| Details | Name + message |
| Preview | Card + generate |
| Share | Link + share + vault nudge |
| Vault empty | Add person CTA |
| Review | Preview + approve/cancel + timer |
| Recipient | Card + make-your-own |

## Open questions (resolve in usability / Stitch)

1. Vault nudge on Share: modal vs inline card? (wireframe uses inline)
2. Tab labels: “History” vs “Creations”?
3. Review window: full screen only, or also in-app inbox row?
