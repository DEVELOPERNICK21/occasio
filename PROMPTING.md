# PROMPTING.md — Occasio AI prompt cheat sheet

**For you (Nick), not auto-loaded.** Cursor already applies `AGENTS.md` + `.cursor/rules/`.  
**@ this file** when you want the agent to follow your ritual explicitly.

---

## Current focus (update weekly)

> **Phase 4 — Auth device test (Google + Email) + Vault person detail**

**Done vs left:** [`docs-site/content/blueprint.md`](./docs-site/content/blueprint.md)

**Build order:** create → recipient → auth/vault/history → billing → auto-send

---

## One-line architecture (memorize)

> **Screens orchestrate · hooks coordinate · domain decides · data fetches.**

| Layer | Folder | May call | Must NOT |
|---|---|---|---|
| **ui** | `features/<x>/ui/` | `application` hooks, `domain` types | `fetch`, Firebase, RevenueCat |
| **application** | `features/<x>/application/` | `domain`, `data` | JSX, StyleSheet |
| **domain** | `features/<x>/domain/` | nothing external | React, fetch, Firebase |
| **data** | `features/<x>/data/` | `domain`, `shared/api`, `shared/config` | React, `ui/` |

**SSOT:** tokens → `design-tokens.json` → `src/shared/theme/tokens.ts` · API shapes → `api-contracts.md` · phase status → `blueprint.md`

---

## The 3-file prompt (every product task)

Attach **exactly three** things:

| # | What | Example |
|---|---|---|
| 1 | **Where we are** | `@docs-site/content/blueprint.md` or active feature blueprint |
| 2 | **How to build** | UI → `@ui-design-principles.md` · data → `@data-flow.md` |
| 3 | **Code you touch** | 1–3 files, e.g. `@PreviewScreen.tsx` |

Then add your task + **one learning line** from the table below.

### Blank template (copy-paste)

```
@[feature-blueprint].md @[ui-design-principles.md OR data-flow.md] @[file1] @[file2]

[TASK — one sentence, specific outcome]

Constraints: match create feature patterns · minimize diff · no fetch in ui · no AI slop (ui-design §11).

[LEARNING LINE — pick one from table below]
```

### Anti-slop line (add to any UI prompt)

```
No generic AI aesthetic: use tokens.ts only, calm copy, one primary CTA, match create/ screens.
```

---

## Learning lines (pick one per prompt)

| Add this line | What you learn |
|---|---|
| `Before coding, tell me which layers this touches and why.` | Architecture |
| `After implementing, explain what would break if we put this in ui/.` | Dependency rules |
| `Compare this to how the create feature does the same thing.` | Repo patterns |
| `What should I remember for the next feature?` | Retention |
| `Update the feature blueprint checkboxes if acceptance criteria changed.` | Docs stay true |
| `List folder structure first; implement domain + application only.` | Layer discipline |
| `Check against ui-design §11 and data-flow §12 — list any slop you avoided.` | Anti-slop discipline |

**Your rule:** if the agent skips the explanation, reply: *“Stop — explain layers first, then code.”*

---

## What to @ by task type

| You're doing… | Include |
|---|---|
| Any product work (first prompt in session) | `AGENTS.md` |
| Create flow | `create-blueprint.md` |
| Auth | `auth-blueprint.md` |
| Vault | `vault-blueprint.md` |
| History | `history-blueprint.md` |
| New screen | `ui-design-principles.md` + `wireframes.md` + similar screen in `create/ui/screens/` |
| Hook / repository | `data-flow.md` + `api-contracts.md` |
| Recipient web | `recipient-blueprint.md` + `docs-site/src/app/c/[slug]/page.tsx` |
| Env / Firebase | `env.ts` + `data-flow.md` |
| Status check | `blueprint.md` only |

**Don't** attach the whole repo. **Do** attach one feature blueprint + one how-to doc + 1–3 code files.

---

## Example prompts (ready to use)

### UI work

```
@docs-site/content/create-blueprint.md
@docs-site/content/ui-design-principles.md
@src/features/create/ui/screens/PreviewScreen.tsx

Add paywall modal on Preview when quota exceeded.
Use Screen + Button + tokens only. No purple/emoji/hype copy. Match PreviewScreen patterns.
Explain which layer each new file goes in.
```

### Data / API work

```
@docs-site/content/data-flow.md
@docs-site/content/api-contracts.md
@src/features/create/data/creationRepository.ts

Wire paywall check to server quota response.
Before coding: say which layer owns what and why ui must not call fetch.
```

### New feature (Vault)

```
@docs-site/content/blueprint.md
@ARCHITECTURE.md
@src/features/create/

Scaffold vault feature using create as the pattern.
List folder structure first; then implement domain + application only.
Teach me one Clean Architecture rule this feature demonstrates.
```

### Auth (current slice)

```
@docs-site/content/auth-blueprint.md
@docs-site/content/data-flow.md
@src/features/auth/ui/components/SoftAuthModal.tsx

Verify Google + Email sign-in flow matches blueprint acceptance criteria.
Before coding: which layers change? After: what to test on device.
```

### Docs / status only

```
@docs-site/content/blueprint.md

What is done vs left for Phase 4? No code changes — summary only.
```

---

## Session rhythm (5 steps)

1. **Read** blueprint checkbox for today's slice (~30 sec)
2. **Prompt** with 3-file pattern + one learning line
3. **Review** agent's layer explanation — approve or correct
4. **Verify** `npm run typecheck` (+ device test if UI/native)
5. **Tick** blueprint or note one sentence you learned

---

## Verify after implementation

```sh
npm run typecheck
npm start && npm run android   # or ios
```

---

## Related files

| File | Role |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Master agent instructions (auto-read) |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Repo map + layers |
| [`.cursor/rules/`](./.cursor/rules/) | Auto-enforced Cursor rules |
| [`docs-site/content/blueprint.md`](./docs-site/content/blueprint.md) | Done vs left tracker |
| [`docs-site/content/ui-design-principles.md`](./docs-site/content/ui-design-principles.md) | UI + copy anti-slop (§11) |
| [`docs-site/content/data-flow.md`](./docs-site/content/data-flow.md) | Code anti-slop (§12) |
