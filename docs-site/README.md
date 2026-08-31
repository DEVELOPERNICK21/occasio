# Occasio Docs Site

Next.js documentation site for Occasio product records (discovery, PRD, UX, TRD, blueprint).

## Run locally

```bash
cd docs-site
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Edit content

- Markdown pages: `content/*.md` (frontmatter + body)
- Sidebar: `src/lib/navigation.ts`
- Mermaid: use fenced ` ```mermaid ` blocks in markdown

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve production build |
