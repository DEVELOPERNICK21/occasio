# Architecture audit (2026-10-15)

**Question:** does the app follow Feature-Based Architecture + Pragmatic Clean Architecture, with single sources of truth and controlled dependencies, so it stays maintainable?

**Rules checked against:** `docs-site/content/architecture.md`, `trd.md` §2b, `data-flow.md` §1 and `ARCHITECTURE.md` (the PRD has no architecture rules beyond "React Native CLI + Firebase"). Method: an import graph of all 289 source files and 1,520 imports, with every relative import resolved to the file it really points at. Run it any time with `npm run arch:check`.

## Verdict before the fixes

The layering *inside* a feature was healthy. **No screen imported a data file or an SDK, nothing called `fetch` from UI, domain had no `any`.** The weakness was **between** features and in how the rules were enforced:

| Finding | Count | Why it matters |
|---|---|---|
| The ESLint "boundaries" caught nothing: patterns matched `features/…` paths but every import is relative, and a second override replaced the first, dropping the `Text` rule for UI | all | The rules existed on paper only. A screen importing a data repository and the restricted `Text` passed lint with zero errors |
| `shared/navigation` imported 27 things from features | 27 | Shared must sit below features |
| Feature loops: auth↔history, auth↔vault, auth↔billing, billing↔vault, create↔history | 5 | Features cannot be changed, tested or removed on their own |
| `SubscriptionTier` defined twice (create, vault) and billing imported it from vault | 2 + 6 importers | Not single source of truth; the cause of the billing↔vault loop |
| API error codes listed in three files (type, runtime check, create's subset) | 3 | Adding a code meant three edits; I had just done exactly that |
| `templateLabel` defined in create and history with different fallback wording | 2 | Duplicate rule |
| A feature importing another feature's UI | 2 | `AccountToggle` (auth → create), `AudienceCard` tones (create → onboarding) |
| Domain importing UI tokens | 1 | `vaultCardTheme` is colours, not a rule |
| Data importing React Native | 1 | The celebration-sound adapter used `Platform` and `Image` directly |
| Auth importing age's data layer | 2 | A feature reaching into another's data |
| Hard-coded colours in UI files | 11 `rgba` literals in 10 files, plus 12 hex literals | The same dim level re-typed by hand in 5 files; the 12 hex literals in `TemplateRecommendScreen` were dead data (overwritten before use) |
| Dead code | `wishCount` (unused var), the two sources of tone colours | Noise that hides real warnings |

## What changed

**Enforcement (so it stays fixed)**
- `scripts/architecture/` — the import-graph checker (`npm run arch:check`), `features.json` (which feature may import which, with the one allowed mutual pair and its reason), and `move.js` (moves files and rewrites every import, including `jest.mock` paths).
- `__tests__/architecture/layering.test.ts` — runs the check inside `npm test`, plus 16 tests that prove each rule really fails on a violation.
- `.eslintrc.js` rebuilt: rules generated per feature and layer from `features.json`, merged correctly, matching relative paths. Probed with deliberate violations in UI, application, data and domain. `eslint .` is scoped to the app (it used to also lint docs-site, which has its own config, and printed dozens of unrelated errors); the codebase's `void promise()` idiom is allowed; **0 errors, 46 warnings** (the corrected rules also surfaced two real violations the old config hid: `TextInput` imported from `react-native` in two screens, now a `TextInputHandle` type from `shared/ui`).
- Rule added for hard-coded colours, with a short justified allowlist (mascot, template palettes, celebration effects, Google's logo).

**Structure**
- **`src/app/`** (the app shell): the five navigators moved out of `shared/navigation`; `AccountTab`; `SessionEffects` (what happens on sign-in); `accountGates` (startup wiring). The shell is the only place that knows several features.
- **New `account` feature**: the Account screens and profile rules left `auth`, so auth no longer depends on billing, vault or history.
- **Auth no longer knows age or history.** The age check is a *new-account gate* auth defines as a port (`NewAccountGate`) and the shell installs. With no gate installed, **a new account is refused and deleted**, never kept (tested). Saving guest cards and stamping older accounts moved to `SessionEffects`.
- `SubscriptionTier` lives in `billing/domain` only. API error codes come from one `HTTP_ERROR_CODES` list. One `templateLabel` (fallback is an argument). `Toggle` and the audience colour/icon maps moved to `shared/ui`; `vaultCardTheme` moved to vault UI; the sound adapter uses `shared/platform/runtime`; `createHome` no longer imports history's type.
- Colours: the stray `rgba` literals became `overlay` tokens; the dead tone table in `TemplateRecommendScreen` was deleted.

**Result:** `arch:check` — no violations. Typecheck clean. 85 test suites, 788 tests pass (was 81 / 760). No behaviour was changed on purpose; the moves are import-only, the age/history wiring has tests, and the app shell mounts the same effects in the same provider tree.

## What is still imperfect (honest list)

1. **`create` ↔ `history` depend on each other**, by design and written down in `features.json`. Create records a finished card and shows history-based progress; history re-opens a card in the create flow and reads template data. Their `domain` and `data` layers do not loop (checked). The clean fix is to pull the template catalogue and the draft hand-off into a lower module; that is a larger change with no user-visible gain, so it is recorded, not done.
2. **`DesignFramePreview.tsx` is 873 lines** (the card-frame previews). It is UI only and tested through its parts, but it is the file most likely to hurt. Split it per frame when next touched.
3. **`countWishesThisMonth`** (create domain) has no production caller since the home screen switched to the "journey"; only its test uses it. Delete both together when confirmed.
4. **The server and the app mirror some constants** (free-card limit, link lifetimes, error codes). They are two codebases; the contract is `docs-site/content/api-contracts.md`. A shared package would remove the duplication but is out of scope for the MVP.
5. **Template palettes** (`templateTheme.ts`, 45 hex values) are product data kept as literals so domain stays pure. They are on the colour allowlist on purpose.
6. **`Audience` colours are keyed by string** in `shared/ui` so shared needs no feature type; an unknown id falls back to the "someone special" look. A test fails if a new audience is added without its own look.

## Keeping it maintainable

- Run `npm run arch:check` (it is also in `npm test`). A failure names the file, the import and the rule.
- To let one feature use another, add the edge to `scripts/architecture/features.json` on purpose, and import only its `application` or `domain`. If two features need the same UI, put it in `shared/ui`. If something must know both, wire it in `src/app`.
- To move files: `node scripts/architecture/move.js <from> <to>`, then `npm run typecheck && npm test`.
- A declared dependency nobody uses fails the check, so the map cannot drift from the code.

---

# Re-check (2026-11-09)

**Question:** since the first audit, the app gained invitations, festivals, WhatsApp delivery, wishes and badges, and clearer purchase messages. Does it still follow Feature-Based Architecture + Pragmatic Clean Architecture?

**Verdict: yes, and it is still enforced by tooling, not by good intentions.** The one real risk is size: `create` has grown into a hub.

## What was measured

| Check | Result |
|---|---|
| Layer rules (`ui` to `application` to `domain`, `data` below; no SDK or `fetch` in UI; domain pure; colours only in tokens; `src/app` the only place that knows many features) | **0 violations** (`npm run arch:check`, also inside `npm test`) |
| `any` in `src/` | **0** |
| `fetch`, Firebase or AsyncStorage outside a `data/` layer | none, other than the four adapters in `shared/firebase/` (shared infrastructure, below every feature) |
| Impure calls in domain (`Date.now()`, `new Date()` without an argument, `Math.random`, `console`, `fetch`) | **none**: time comes in as a `now` parameter, so rules stay testable |
| Feature dependency map | acyclic except `create` and `history`, the documented pair in `features.json` |
| Domain files with no test | was 5 small ones; **now 0** (tests added for `accountProfile`, `renewalTerms`, `cardReveal`, `relationshipTypes`; `occasionSounds` was dead and deleted) |
| Dead code | 5 exports of `createHome.ts` had no caller except their tests; **removed with the tests** |

The "pragmatic" part holds too: there are no repository interfaces, use-case classes or dependency-injection containers. Application hooks call data functions directly, domain is plain functions and types, and the only port is `NewAccountGate` where auth genuinely must not know what approves an account.

## The risk: `create` is a hub

| Feature | UI files | UI lines |
|---|---|---|
| **create** | **78** | **12,765** |
| vault | 16 | 2,422 |
| onboarding | 17 | 1,586 |
| auth | 12 | 1,332 |
| every other feature | 4 or fewer | under 1,000 each |

`create` is about 60% of the app's UI and has 25 domain files (3.4k lines). Three features import it (`history`, `onboarding`, `widgets`) and it imports four. It holds four areas that are not part of capturing a card:

| Area inside `create` | Files | Lines | How separable |
|---|---|---|---|
| Frame layouts (`ui/components/layouts`) | 19 | about 2,500 | pure UI; fine to stay as one folder |
| Badges, journey and wish balance | 10 | about 1,700 | **easiest to extract**: `computeWishJourney` is a pure function of history entries and a Vault count |
| Invitations (`Invite*`, `invitation.ts`) | 12 | about 1,350 | hard: `CreationDraft` carries an `InvitationDraft`, so a split needs a small shared draft kernel first |
| Festivals (`holidays*`, `Holiday*`) | 5 | about 1,200 | pure domain plus two components; depends on `create`'s draft, so it can stay |

**Recommendation, in this order:** (1) move badges and the journey into their own `journey` feature (it would depend on `history` and `vault`, and `create` on it, never the reverse); (2) give invitations their own feature once the draft is split; (3) leave the rest. Do it with `scripts/architecture/move.js`, which rewrites imports. Not done now: it is a refactor with no user-visible gain, and today's work was size and verification.

## Smaller items

- `create` and `history` still depend on each other, for the same documented reason as before.
- Large files: `DesignFramePreview.tsx` (873 lines), `AccountSettingsCards.tsx` (538, several cards in one file) and `VaultListScreen.tsx` (472). UI only and tested through their parts; split when next touched.
- `docs-site` (Next.js) and `functions/` are outside `arch:check`. Their largest files are `creationsServer.ts` (941 lines) and `cron.ts` (520); a smaller layering check for them would be the next step if they keep growing.
- `ARCHITECTURE.md` now says what `create` holds and what is done.

## Added today so it stays this way

- `__tests__/architecture/iconBarrel.test.ts`: every icon comes through `src/shared/ui/icons/lucide.ts` (see `docs/app-size.md`), so the whole 1,800-icon package can never be bundled again by accident.
