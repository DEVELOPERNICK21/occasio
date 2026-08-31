---
title: Design tokens & Stitch brief
description: Locked tokens for Stitch, Figma, and RN — plus screen prompts from wireframes.
phase: Phase 2.5 — UI Design
status: Tokens locked
updated: 2026-08-31
---

## Tokens

**Source of truth:** `design-tokens.json` at repo root (also mirrored in `src/shared/theme/tokens.ts` for RN).

| Token | Value | Use |
|---|---|---|
| Background | `#F6F1E8` | App canvas |
| Surface | `#FFFDF8` | Cards, inputs |
| Ink | `#1C1914` | Headlines |
| Accent | `#1F5C4D` | Primary CTA, trust |
| Accent soft | `#D8EBE4` | Selected states |
| Border | `#DDD2C0` | Dividers |

**Typography:** Display = Fraunces · Body = Source Sans 3 · Mono = IBM Plex Mono  
**Radius:** 10px buttons, 16px cards  
**Mood:** Calm, India-warm, trust-first — not loud gifting-app purple

## Stitch workflow

1. Import `design-tokens.json` or paste token table into Stitch project settings
2. Generate **mobile** screens from [Wireframes](/docs/wireframes) one flow at a time
3. Use multi-screen generation for Create stack consistency
4. Export to Figma for polish → reconcile back to tokens
5. Export HTML/Tailwind as **reference only** — build RN from `src/features/`

## Screen prompts (copy into Stitch)

### Template picker
> Mobile app screen, Occasio. Warm cream background #F6F1E8, green accent #1F5C4D. Title "Create a wish", subtitle "Pick an occasion". 2-column grid of occasion cards: Birthday, Anniversary, Sorry, Proposal, Mother's Day, Father's Day. Bottom tab bar: Create, Vault, History, Account. Primary button "Continue" at bottom. Calm, trustworthy, not generic AI purple.

### Share success
> Mobile screen after generating a share link. Show copyable URL field, green "Share via WhatsApp" button, soft green card nudging "Save to Vault so you never miss this date". Same tokens as above.

## Checklist

- [x] `design-tokens.json` at repo root
- [x] RN `tokens.ts` mirror
- [ ] Stitch screens generated (you — in Stitch UI)
- [ ] Figma polish
- [ ] Reconcile Stitch output to tokens before engineering handoff
