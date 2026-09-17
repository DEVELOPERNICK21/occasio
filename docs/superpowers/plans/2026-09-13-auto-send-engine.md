# Auto-Send Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the PRD auto-send engine (birthday + anniversary): cron creates reviewable cards, 24h approve/cancel/auto-resolve, mock WA→SMS→email dispatch, FCM + share sheet — per `docs/superpowers/specs/2026-09-13-auto-send-engine-design.md`.

**Architecture:** Cloud Scheduler hits a Functions cron that writes `scheduled_sends`, generates creations, and notifies via FCM. Client owns Vault pack/anniversary UX and `ScheduledSendReview`. Delivery uses a `DeliveryProvider` interface with mock adapters first. Dispatch gated by `OCCASIO_AUTOSEND_DISPATCH`.

**Tech Stack:** React Native CLI, Firestore, Cloud Functions (Express `api` + scheduled function), Cloud Scheduler, FCM (`@react-native-firebase/messaging`), Jest for domain tests, Functions emulator for cron dry-runs.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-13-auto-send-engine-design.md`
- Layering: `ui` ↛ Firebase/FCM/Functions; FCM only in `vault/data` (or `shared` data helper); hooks in `application/`
- Domain: pure TypeScript, no `any`, unit-tested
- Occasions v1: `birthday` | `anniversary` only
- Review window: **24 hours**; photo-less cards must **not** auto-dispatch (`incomplete_pack`)
- Channels: mock first; real provider keys later without redesign
- Tokens: `src/shared/theme/tokens.ts` only; calm copy; no “coming soon” once review path ships behind flag
- No commits of secrets; Blaze required for prod Scheduler
- Prefer smallest diffs; match `src/features/vault/` and `functions/src/index.ts` patterns
- Do not claim live WhatsApp delivery in store listing until real adapters are on

## File map

| Path | Responsibility |
|---|---|
| `src/features/vault/domain/types.ts` | Extend person + scheduled send types |
| `src/features/vault/domain/scheduledSend.ts` | Status transitions, idempotency key, deadline rules |
| `src/features/vault/domain/contentFallback.ts` | Pack → last creation → default |
| `src/features/vault/domain/personRules.ts` | Anniversary + pack validation |
| `src/features/vault/domain/vaultOccasion.ts` | Next occasion = nearer of birthday/anniversary |
| `src/features/vault/data/relationshipRepository.ts` | Persist anniversary, pack, lastCreationId |
| `src/features/vault/data/scheduledSendRepository.ts` | List sends; approve/cancel HTTP |
| `src/features/vault/data/fcmRepository.ts` | Token register + message handlers wiring data only |
| `src/features/vault/application/useScheduledSends.ts` | Inbox subscription |
| `src/features/vault/application/useReviewSend.ts` | Approve/cancel/share |
| `src/features/vault/application/useFcmRegistration.ts` | Register token when signed in |
| `src/features/vault/ui/screens/ScheduledSendReviewScreen.tsx` | Review UX |
| `functions/src/autosend/*.ts` | Cron, resolve content, dispatch mocks, FCM send |
| `functions/src/index.ts` | Mount routes + export scheduled function |
| `firestore.rules` | `scheduled_sends` read-own |
| `__tests__/vault/scheduledSend.test.ts` | Domain tests |
| `docs-site/content/vault-blueprint.md` / `blueprint.md` / `api-contracts.md` | Spec sync |

---

### Task 1: Domain — scheduled send rules + content fallback

**Files:**
- Create: `src/features/vault/domain/scheduledSend.ts`
- Create: `src/features/vault/domain/contentFallback.ts`
- Modify: `src/features/vault/domain/types.ts`
- Test: `__tests__/vault/scheduledSend.test.ts`

**Interfaces:**
- Produces:
  - `ScheduledSendStatus = 'pending' | 'review' | 'approved' | 'cancelled' | 'sent' | 'failed'`
  - `OccasionType = 'birthday' | 'anniversary'`
  - `buildIdempotencyKey(userId, relationshipId, occasionType, year): string`
  - `canTransition(from, to): boolean`
  - `isReviewExpired(reviewDeadlineIso, now): boolean`
  - `shouldAutoDispatchOnDeadline(hasPhotos, reviewExpired): 'dispatch' | 'incomplete_pack' | 'wait'`
  - `resolveAutoSendContent(input): { templateType, templateId, photoRefs, message, fromName, source }`

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/vault/scheduledSend.test.ts
import {
  buildIdempotencyKey,
  canTransition,
  shouldAutoDispatchOnDeadline,
} from '../../src/features/vault/domain/scheduledSend';
import { resolveAutoSendContent } from '../../src/features/vault/domain/contentFallback';

describe('scheduledSend', () => {
  it('builds stable idempotency keys', () => {
    expect(buildIdempotencyKey('u1', 'r1', 'birthday', 2026)).toBe(
      'u1_r1_birthday_2026',
    );
  });

  it('allows pending→review→approved→sent', () => {
    expect(canTransition('pending', 'review')).toBe(true);
    expect(canTransition('review', 'approved')).toBe(true);
    expect(canTransition('approved', 'sent')).toBe(true);
    expect(canTransition('cancelled', 'sent')).toBe(false);
  });

  it('auto-dispatches only with photos after deadline', () => {
    expect(shouldAutoDispatchOnDeadline(true, true)).toBe('dispatch');
    expect(shouldAutoDispatchOnDeadline(false, true)).toBe('incomplete_pack');
    expect(shouldAutoDispatchOnDeadline(true, false)).toBe('wait');
  });
});

describe('contentFallback', () => {
  it('prefers vault pack, then last creation, then default', () => {
    const pack = resolveAutoSendContent({
      occasionType: 'birthday',
      pack: {
        preferredTemplateType: 'birthday',
        preferredTemplateId: 't1',
        photoRefs: ['p1'],
        defaultMessage: 'Happy birthday',
        fromName: 'Nick',
      },
      lastCreation: null,
    });
    expect(pack.source).toBe('pack');

    const last = resolveAutoSendContent({
      occasionType: 'anniversary',
      pack: null,
      lastCreation: {
        templateType: 'anniversary',
        templateId: 't2',
        photoRefs: ['p2'],
        message: 'One more year',
        fromName: 'Nick',
      },
    });
    expect(last.source).toBe('last_creation');

    const fallback = resolveAutoSendContent({
      occasionType: 'birthday',
      pack: null,
      lastCreation: null,
    });
    expect(fallback.source).toBe('default');
    expect(fallback.photoRefs).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- __tests__/vault/scheduledSend.test.ts
```

Expected: module not found / FAIL

- [ ] **Step 3: Implement domain modules**

```ts
// types.ts — add:
export type OccasionType = 'birthday' | 'anniversary';
export type ScheduledSendStatus =
  | 'pending'
  | 'review'
  | 'approved'
  | 'cancelled'
  | 'sent'
  | 'failed';

export type AutoSendPack = {
  preferredTemplateId: string | null;
  preferredTemplateType: string | null;
  photoRefs: string[];
  defaultMessage: string;
  fromName: string | null;
};

// Extend VaultPerson with:
// anniversary, autoSendAnniversary, email, pack, lastCreationId
```

Implement `scheduledSend.ts` and `contentFallback.ts` so tests pass. Default template types: `'birthday'` / `'anniversary'` with empty `photoRefs` and message like `Thinking of you today.`

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- __tests__/vault/scheduledSend.test.ts
```

- [ ] **Step 5: Commit** (only if user asked to commit)

```bash
git add src/features/vault/domain/types.ts src/features/vault/domain/scheduledSend.ts src/features/vault/domain/contentFallback.ts __tests__/vault/scheduledSend.test.ts
git commit -m "$(cat <<'EOF'
feat(vault): add auto-send domain rules and content fallback

EOF
)"
```

---

### Task 2: Domain + data — anniversary, pack, person validation

**Files:**
- Modify: `src/features/vault/domain/types.ts`
- Modify: `src/features/vault/domain/personRules.ts`
- Modify: `src/features/vault/domain/vaultOccasion.ts`
- Modify: `src/features/vault/data/relationshipRepository.ts`
- Modify: `__tests__/vault/domain.test.ts`

**Interfaces:**
- Consumes: `AutoSendPack`, `OccasionType` from Task 1
- Produces:
  - `CreatePersonInput` includes `anniversary`, `autoSendAnniversary`, `email?`
  - `updateVaultPersonPack(personId, pack)`
  - `setVaultPersonAutoSendAnniversary(personId, enabled)`
  - `linkVaultPersonCreation(personId, creationId, packPartial)`
  - `getPersonNextOccasion` considers nearer of birthday/anniversary

- [ ] **Step 1: Extend failing domain tests**

```ts
it('requires anniversary when auto-send anniversary enabled', () => {
  const result = validatePersonDraft(
    { ...EMPTY_PERSON_DRAFT, personName: 'Sam', relationshipType: 'partner' },
    { autoSendBirthday: false, autoSendAnniversary: true },
  );
  expect(result.ok).toBe(false);
});

it('picks nearer occasion between birthday and anniversary', () => {
  // build VaultPerson with both dates; assert headline mentions nearer one
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- __tests__/vault/domain.test.ts
```

- [ ] **Step 3: Implement types + personRules + vaultOccasion + repository mapping**

Update `RelationshipDoc` / `mapDoc` / `toFirestorePayload` for:

```ts
dates: { birthday?, anniversary? }
contactChannel: { whatsapp?, email? }
autoSendEnabled: { birthday?, anniversary? }
preferredTemplateId?, preferredTemplateType?, photoRefs?, defaultMessage?, fromName?, lastCreationId?
```

Add repository functions:

```ts
export async function setVaultPersonAutoSendAnniversary(
  personId: string,
  enabled: boolean,
): Promise<void>;

export async function updateVaultPersonPack(
  personId: string,
  pack: AutoSendPack,
): Promise<void>;

export async function linkVaultPersonCreation(
  personId: string,
  creationId: string,
  pack: Partial<AutoSendPack>,
): Promise<void>;
```

Keep mock store (`env.useMockAuth`) in sync with the same fields.

- [ ] **Step 4: Run tests — PASS**

```bash
npm test -- __tests__/vault/domain.test.ts __tests__/vault/scheduledSend.test.ts
```

- [ ] **Step 5: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
feat(vault): persist anniversary and auto-send pack on relationships

EOF
)"
```

---

### Task 3: Vault UI — anniversary + arm toggles + pack editor

**Files:**
- Modify: `src/features/vault/ui/components/AddPersonFormFields.tsx`
- Modify: `src/features/vault/ui/components/AddPersonAutoSendCard.tsx` (or split birthday/anniversary cards)
- Modify: `src/features/vault/ui/screens/AddPersonScreen.tsx`
- Modify: `src/features/vault/ui/screens/PersonDetailScreen.tsx`
- Modify: `src/features/vault/ui/screens/VaultListScreen.tsx`
- Modify: `src/features/vault/ui/components/VaultPersonCard.tsx`
- Modify: `src/features/vault/application/useSavePerson.ts`
- Modify: `src/features/vault/application/useToggleAutoSend.ts`
- Create: `src/features/vault/ui/components/AutoSendPackCard.tsx` (optional small component)
- Reference: `docs-site/content/ui-design-principles.md`

**Interfaces:**
- Consumes: `canEnableAutoSend`, repository setters from Task 2
- Produces: UI that arms birthday **and** anniversary; pack fields on detail

- [ ] **Step 1: Extend `useToggleAutoSend`**

```ts
toggle(personId: string, occasion: 'birthday' | 'anniversary', nextValue: boolean)
```

Call the matching repository setter.

- [ ] **Step 2: Add anniversary date input + second arm toggle on Add Person**

Match existing birthday UI patterns and tokens. Copy: “Arm birthday auto-send” / “Arm anniversary auto-send” — remove “coming soon” / “when delivery ships” once Task 8 lands; until then keep “Armed for delivery when the date arrives” (honest, not “coming soon”).

- [ ] **Step 3: Person detail — show both arms + pack summary; button “Edit auto-send pack”**

Minimal pack editor on detail (message Text + note that photos come from last card / create flow link). Full photo picker can reuse create photo refs via **Save for auto-send** (Task 4).

- [ ] **Step 4: Vault list card — show armed occasions**

```ts
autoSendBirthday / autoSendAnniversary
```

- [ ] **Step 5: Manual UI check**

```bash
npx tsc --noEmit
npm start
# Add person with anniversary; arm both on Pro tier; free tier still blocked
```

- [ ] **Step 6: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
feat(vault): anniversary fields and dual auto-send arming UI

EOF
)"
```

---

### Task 4: Link creation → person (“Save for auto-send”)

**Files:**
- Modify: `src/features/create/ui/screens/ShareSuccessScreen.tsx`
- Modify: `src/features/history/ui/screens/HistoryDetailScreen.tsx` (if entry has creationId)
- Create: `src/features/vault/application/useLinkCreationToPerson.ts`
- Modify: `src/shared/navigation/types.ts` only if new params needed

**Interfaces:**
- Consumes: `linkVaultPersonCreation`
- Produces: After share, user can attach creation pack to a Vault person

- [ ] **Step 1: Hook**

```ts
export function useLinkCreationToPerson() {
  // link(personId, { creationId, templateType, templateId, photoRefs, message, fromName })
}
```

- [ ] **Step 2: ShareSuccess — secondary CTA “Save for auto-send”**

If signed in + people exist: pick person (simple ActionSheet / navigate to list with param). Guest: soft-auth first (`autosend_enable` or vault gate).

Copy pack onto person + set `lastCreationId`.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
feat(vault): link shared creation as auto-send pack

EOF
)"
```

---

### Task 5: Functions — autosend domain + cron generate → review

**Files:**
- Create: `functions/src/autosend/types.ts`
- Create: `functions/src/autosend/dates.ts` (IST month/day match)
- Create: `functions/src/autosend/content.ts` (same fallback rules as mobile)
- Create: `functions/src/autosend/cron.ts`
- Create: `functions/src/autosend/fcm.ts`
- Modify: `functions/src/index.ts`
- Modify: `firestore.rules`

**Interfaces:**
- Produces:
  - `export const autosendDaily = onSchedule(...)` OR HTTPS `POST /v1/internal/autosend/run` protected by `OCCASIO_CRON_SECRET`
  - Creates `scheduled_sends` + creation; status `review`; sends FCM `autosend_review`
  - Idempotent on `idempotencyKey`

- [ ] **Step 1: Prefer HTTPS cron endpoint for emulator-friendliness**

```ts
// POST /v1/internal/autosend/run
// Header: x-occasio-cron-secret: process.env.OCCASIO_CRON_SECRET
// Body optional: { "asOf": "2026-09-13T00:30:00.000Z" } for tests
```

Also export `onSchedule('0 6 * * *', { timeZone: 'Asia/Kolkata' })` that calls the same `runAutosendCron(db, now)` when Blaze/Scheduler available.

- [ ] **Step 2: Implement `runAutosendCron`**

Algorithm from spec § Engine flow:
1. Query relationships (paginate) where any `autoSendEnabled.*` true
2. Filter month/day match in IST for birthday and/or anniversary
3. Load `users/{uid}.subscriptionTier`; if not `personal`|`family` → write failed send or skip with `lastError: 'tier'`
4. Idempotency: query `idempotencyKey == ...`; skip if exists
5. Create `pending` → resolve content → write `creations` (extract shared helper from existing `POST /v1/creations`) → update send to `review` with `shareUrl`, `reviewDeadline`
6. FCM to `users.fcmTokens`

Default creation when no photos: still create doc with `photoRefs: []` / empty media so review can fix.

- [ ] **Step 3: Update firestore.rules**

```
match /scheduled_sends/{sendId} {
  allow read: if request.auth != null
    && request.auth.uid == resource.data.userId;
  allow write: if false;
}
```

- [ ] **Step 4: Emulator dry-run**

```bash
cd functions && npm run build
# seed a relationship with today's birthday + personal tier
curl -X POST "$EMULATOR_URL/v1/internal/autosend/run" \
  -H "x-occasio-cron-secret: $OCCASIO_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: one `scheduled_sends` in `review`.

- [ ] **Step 5: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
feat(functions): autosend cron generates reviewable scheduled sends

EOF
)"
```

---

### Task 6: Functions — approve / cancel / deadline sweeper / mock dispatch

**Files:**
- Create: `functions/src/autosend/dispatch.ts`
- Create: `functions/src/autosend/providers.ts` (mock WA/SMS/email)
- Create: `functions/src/autosend/review.ts`
- Modify: `functions/src/index.ts`
- Modify: `docs-site/content/api-contracts.md`

**Interfaces:**
- Produces:
  - `POST /v1/scheduled-sends/:id/approve`
  - `POST /v1/scheduled-sends/:id/cancel`
  - Sweeper inside cron: expired review → dispatch or `incomplete_pack`
  - `OCCASIO_AUTOSEND_DISPATCH` — when not `true`, approve moves to `approved` but skips channel calls (or no-ops dispatch)

```ts
export interface DeliveryProvider {
  channel: 'whatsapp' | 'sms' | 'email';
  send(input: {
    to: string;
    shareUrl: string;
    personName: string;
    occasionType: string;
  }): Promise<{ ok: true } | { ok: false; error: string }>;
}
```

Mock: log + return `{ ok: true }` unless `OCCASIO_MOCK_DELIVERY_FAIL=whatsapp,sms` etc.

- [ ] **Step 1: Approve handler**

Auth: verify Firebase ID token (`Authorization: Bearer`). Owner only. Require creation has ≥1 photoRef/mediaUrl. Transition `review` → `approved` → `dispatchScheduledSend`.

- [ ] **Step 2: Cancel handler**

`review` → `cancelled` only.

- [ ] **Step 3: `dispatchScheduledSend`**

Channel order whatsapp → sms → email using contact fields (`whatsapp`, phone same as whatsapp, `email`). Append attempts; on first ok → `sent` + FCM `autosend_sent`; if all fail → `failed`.

- [ ] **Step 4: Sweeper in cron**

For each `review` past deadline: `shouldAutoDispatchOnDeadline` logic → dispatch or `failed`/`incomplete_pack`.

- [ ] **Step 5: Document APIs in `api-contracts.md`**

- [ ] **Step 6: Emulator test approve + cancel**

- [ ] **Step 7: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
feat(functions): scheduled-send approve/cancel and mock dispatch

EOF
)"
```

---

### Task 7: Client data/hooks — scheduled sends inbox + review actions

**Files:**
- Create: `src/features/vault/data/scheduledSendRepository.ts`
- Create: `src/features/vault/application/useScheduledSends.ts`
- Create: `src/features/vault/application/useReviewSend.ts`
- Modify: `src/shared/config/env.ts` if needed for API base (reuse `getApiBaseUrl` pattern)
- Reference: `docs-site/content/data-flow.md`

**Interfaces:**
- Produces:
  - `subscribeScheduledSends(onChange)` — Firestore where `userId==uid` and `status in ['review','approved']` (or all recent)
  - `approveScheduledSend(id)`, `cancelScheduledSend(id)` — HTTP with auth token
  - Mock branch when `env.useMockApi`

```ts
export type ScheduledSend = {
  id: string;
  relationshipId: string;
  occasionType: OccasionType;
  status: ScheduledSendStatus;
  reviewDeadline: string;
  shareUrl: string | null;
  generatedCreationId: string | null;
  personName?: string; // denormalize on write in cron for easy UI
};
```

Denormalize `personName` on cron write to avoid extra reads in list UI.

- [ ] **Step 1: Repository + hooks**
- [ ] **Step 2: Unit-test any pure mapping if extracted**
- [ ] **Step 3: `npx tsc --noEmit`**
- [ ] **Step 4: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
feat(vault): scheduled-send repository and review hooks

EOF
)"
```

---

### Task 8: Review screen + Vault badge + share sheet

**Files:**
- Create: `src/features/vault/ui/screens/ScheduledSendReviewScreen.tsx`
- Modify: `src/shared/navigation/types.ts` — add `ScheduledSendReview: { sendId: string }`
- Modify: `src/shared/navigation/VaultNavigator.tsx`
- Modify: `src/features/vault/ui/screens/VaultListScreen.tsx` — badge / row for waiting sends
- Modify: `src/features/vault/ui/components/VaultPersonCard.tsx` copy (remove coming soon)
- Reference: `docs-site/content/ui-design-principles.md`

**Interfaces:**
- Consumes: `useScheduledSends`, `useReviewSend`
- Produces: Approve → on success `Share.share({ message: shareUrl })`; Cancel → back to list

- [ ] **Step 1: Screen layout**

One primary CTA **Approve & send**. Secondary **Cancel send**. Show person name, occasion, deadline countdown, card preview (reuse create preview components if practical; else message + photo count + open share URL).

If no photos: disable Approve; show “Add photos via Save for auto-send or cancel”.

- [ ] **Step 2: Wire navigation from Vault list badge**
- [ ] **Step 3: After approve, open share sheet (user choice C)**
- [ ] **Step 4: Manual pass on emulator data**
- [ ] **Step 5: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
feat(vault): scheduled send review screen and share sheet

EOF
)"
```

---

### Task 9: FCM registration + notification open

**Files:**
- Add dependency: `@react-native-firebase/messaging`
- Create: `src/features/vault/data/fcmRepository.ts`
- Create: `src/features/vault/application/useFcmRegistration.ts`
- Modify: `App.tsx` or auth-signed-in shell to call registration hook
- Android: ensure `POST_NOTIFICATIONS` / manifest as required by RN Firebase docs
- iOS: capability later if not in Shipaton path

**Interfaces:**
- Produces: writes token to `users/{uid}.fcmTokens` array (dedupe)
- On notification open with `type=autosend_review` → navigate `VaultTab` → `ScheduledSendReview`
- On `autosend_sent` → navigate review/success and optionally trigger share sheet once

```ts
// fcmRepository.ts — no React
export async function registerFcmToken(uid: string): Promise<void>;
export function parseAutosendPayload(data: Record<string, string>): {
  type: 'autosend_review' | 'autosend_sent';
  sendId: string;
  shareUrl?: string;
} | null;
```

- [ ] **Step 1: Install + native link / rebuild**

```bash
yarn add @react-native-firebase/messaging
cd ios && pod install # if on mac for iOS
```

- [ ] **Step 2: Implement data + hook (UI imports hook only)**
- [ ] **Step 3: Wire navigation handler in application layer / root navigator listener**
- [ ] **Step 4: Device test with Functions FCM send (or console test message)**
- [ ] **Step 5: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
feat(vault): FCM token registration for autosend review and sent

EOF
)"
```

---

### Task 10: Docs + blueprint checklist + feature flag defaults

**Files:**
- Modify: `docs-site/content/vault-blueprint.md`
- Modify: `docs-site/content/blueprint.md` (auto-send engine checkboxes)
- Modify: `docs-site/content/api-contracts.md` (if not done in Task 6)
- Modify: `docs-site/content/billing-blueprint.md` note (tier mirror for cron)
- Modify: `ARCHITECTURE.md` status row if it lists auto-send as deferred
- Create: `.env.example` entries for `OCCASIO_CRON_SECRET`, `OCCASIO_AUTOSEND_DISPATCH`, `OCCASIO_MOCK_DELIVERY_FAIL`

**Interfaces:**
- Produces: docs match shipped behavior; default `OCCASIO_AUTOSEND_DISPATCH=false` until mock path verified

- [ ] **Step 1: Update blueprints — mark engine tasks done/in progress accurately**
- [ ] **Step 2: Document emulator cron curl in vault-blueprint “Dev” section**
- [ ] **Step 3: Commit** (if requested)

```bash
git commit -m "$(cat <<'EOF'
docs: sync auto-send engine blueprint and API contracts

EOF
)"
```

---

### Task 11: End-to-end verification

**Files:** none (manual)

- [ ] **Step 1:** Pro user, person with birthday = today (IST), pack or linked creation with photos, auto-send armed
- [ ] **Step 2:** Run cron endpoint → `scheduled_sends` `review` + FCM (or badge)
- [ ] **Step 3:** Open review → Approve → mock dispatch → `sent` → share sheet
- [ ] **Step 4:** Second run same day → no duplicate (idempotency)
- [ ] **Step 5:** Cancel path: new fixture → Cancel → stays `cancelled`, no dispatch
- [ ] **Step 6:** Incomplete pack past deadline (force `reviewDeadline` in past) → `failed`/`incomplete_pack`
- [ ] **Step 7:** Free tier armed somehow → `failed`/`tier`
- [ ] **Step 8:** `npx tsc --noEmit` + `npm test -- __tests__/vault/`

---

## Spec coverage checklist

| Spec requirement | Task |
|---|---|
| Anniversary + birthday | 2, 3 |
| Pack + last creation + default | 1, 4, 5 |
| `scheduled_sends` + idempotency | 5 |
| 24h review + approve/cancel | 6, 8 |
| No photo-less auto-dispatch | 1, 6 |
| Mock WA→SMS→email | 6 |
| FCM + share sheet | 8, 9 |
| Paid gate | 3, 5 |
| Rules + API docs | 5, 6, 10 |
| Feature flag dispatch | 6, 10 |

## Plan self-review notes

- No TBD placeholders; dual copies of fallback logic (mobile domain + functions) are intentional (no shared package).
- Commit steps are optional until the user asks to commit.
- Scheduler: HTTPS secret endpoint works on emulator; `onSchedule` for production Blaze.
