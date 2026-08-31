# Occasio

**Mobile app** — relationship-memory subscription: save people once, auto-send personalized wishes on the right day.

> **This repo is mobile-first.** Product code lives in `src/`. [`docs-site/`](./docs-site/) is documentation and optional landing only.

**AI / solo dev:** read [`AGENTS.md`](./AGENTS.md) and [`.cursor/rules/`](./.cursor/rules/) — Cursor loads these automatically.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for repo map and layer rules.

## Run the app (primary)

```sh
npm install
npm start
npm run android   # or npm run ios (cd ios && bundle exec pod install first)
```

## App structure

```
src/
  features/create/     # domain, application, ui (+ data/ next)
  shared/
    navigation/        # tabs + create stack
    theme/tokens.ts    # mirrors design-tokens.json
    ui/                # Screen, Button
```

## Product docs (secondary)

Specs, PRD, TRD, blueprint: [`docs-site/`](./docs-site/)

```sh
cd docs-site && npm install && npm run dev
```

---

This is a [**React Native**](https://reactnative.dev) project (CLI 0.86), bootstrapped with [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started
