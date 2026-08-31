---
title: How to use this docs site
description: Documentation and landing for Occasio — the product is the React Native mobile app.
phase: Meta
status: Living
updated: 2026-08-31
---

## Purpose

This Next.js site holds **specs, blueprint, and optional public landing** for Occasio.

**The product is the React Native app** at the repo root (`src/`, `App.tsx`). Build features there — not in docs-site.

| You want to… | Work in… |
|---|---|
| Ship user-facing features | `src/features/` (mobile) |
| AI agent context | `AGENTS.md` + `.cursor/rules/` |
| Read/update PRD, TRD, flows | `docs-site/content/` |
| Run the app | `npm start` + `npm run android` (repo root) |
| Browse specs in browser | `cd docs-site && npm run dev` |

See [Product surfaces](/docs/surfaces) and repo root `ARCHITECTURE.md`.

## Edit a docs page

1. Open `docs-site/content/<slug>.md`
2. Update frontmatter (`title`, `description`, `phase`, `status`, `updated`) and markdown body
3. Mermaid diagrams use fenced ` ```mermaid ` blocks — they render automatically
4. Add the page to `src/lib/navigation.ts` if it is new
5. Run `npm run dev` inside `docs-site`

## Folder map

| Path | Role |
|---|---|
| `docs-site/content/` | All markdown records |
| `docs-site/src/lib/navigation.ts` | Sidebar sections |
| `docs-site/src/lib/docs.ts` | Markdown → HTML loader |
| `../docs/prd-trd.md` | Legacy combined file — prefer editing `content/prd.md` + `content/trd.md` going forward |

## Blueprint alignment

Follow [Blueprint tracker](/docs/blueprint). As each checklist item completes, update that page’s status and link the artifact (PRD section, flow, Stitch export, etc.).
