import {
  isPastGrace,
  ORPHAN_GRACE_MS,
  purgeOrphanUploads,
} from '../../functions/src/purgeOrphanUploads';
import { enforceVaultCap, personCapForTier } from '../../functions/src/vaultCap';

type Doc = { id: string; createTime: number; ref: { delete: () => Promise<void> } };

function vaultDb(options: {
  tier: string;
  people: number;
  deleted: string[];
}): FirebaseFirestore.Firestore {
  const docs: Doc[] = Array.from({ length: options.people }, (_, i) => ({
    id: `p${i}`,
    createTime: i,
    ref: {
      delete: async () => {
        options.deleted.push(`p${i}`);
      },
    },
  }));
  return {
    collection: (name: string) => ({
      where: () => ({
        get: async () => ({
          size: docs.length,
          docs: docs.map((d) => ({
            ...d,
            createTime: { toMillis: () => d.createTime },
          })),
        }),
      }),
      doc: () => ({
        get: async () => ({ data: () => (name === 'users' ? { subscriptionTier: options.tier } : {}) }),
      }),
    }),
  } as unknown as FirebaseFirestore.Firestore;
}

describe('Vault person limit', () => {
  it('matches the app caps', () => {
    expect(personCapForTier('free')).toBe(1);
    expect(personCapForTier('personal')).toBe(5);
    expect(personCapForTier('family')).toBe(15);
    expect(personCapForTier(undefined)).toBe(1);
  });

  it('removes the newest extras for a free account', async () => {
    const deleted: string[] = [];
    const removed = await enforceVaultCap(
      vaultDb({ tier: 'free', people: 3, deleted }),
      'u1',
      async () => 'free',
    );
    expect(removed).toBe(2);
    expect(deleted.sort()).toEqual(['p1', 'p2']);
  });

  it('keeps everyone when RevenueCat says the account is paid', async () => {
    const deleted: string[] = [];
    const removed = await enforceVaultCap(
      vaultDb({ tier: 'free', people: 3, deleted }),
      'u1',
      async () => 'personal',
    );
    expect(removed).toBe(0);
    expect(deleted).toEqual([]);
  });

  it('removes nothing when the plan cannot be checked', async () => {
    const deleted: string[] = [];
    const removed = await enforceVaultCap(
      vaultDb({ tier: 'free', people: 4, deleted }),
      'u1',
      async () => null,
    );
    expect(removed).toBe(0);
    expect(deleted).toEqual([]);
  });

  it('does nothing within the limit', async () => {
    const deleted: string[] = [];
    let asked = false;
    const removed = await enforceVaultCap(
      vaultDb({ tier: 'personal', people: 5, deleted }),
      'u1',
      async () => {
        asked = true;
        return 'personal';
      },
    );
    expect(removed).toBe(0);
    expect(asked).toBe(false);
  });
});

describe('orphan photo cleanup', () => {
  const now = new Date('2026-10-11T12:00:00Z');
  const old = new Date(now.getTime() - ORPHAN_GRACE_MS - 1000).toISOString();
  const fresh = new Date(now.getTime() - 60_000).toISOString();

  it('only judges photos older than the grace period', () => {
    expect(isPastGrace(old, now)).toBe(true);
    expect(isPastGrace(fresh, now)).toBe(false);
    expect(isPastGrace(undefined, now)).toBe(false);
  });

  it('deletes unreferenced old photos and keeps the rest', async () => {
    const deleted: string[] = [];
    const file = (name: string, timeCreated: string) => ({
      name,
      metadata: { timeCreated },
      delete: async () => {
        deleted.push(name);
      },
    });
    const used = new Set(['uploads/u1/used.jpg']);
    const db = {
      collection: () => ({
        where: (_field: string, _op: string, path: string) => ({
          limit: () => ({ get: async () => ({ empty: !used.has(path) }) }),
        }),
      }),
    } as unknown as FirebaseFirestore.Firestore;

    const removed = await purgeOrphanUploads(db, now, 500, async () => [
      file('uploads/u1/used.jpg', old),
      file('uploads/u1/orphan.jpg', old),
      file('uploads/u1/new.jpg', fresh),
    ]);

    expect(removed).toBe(1);
    expect(deleted).toEqual(['uploads/u1/orphan.jpg']);
  });
});
