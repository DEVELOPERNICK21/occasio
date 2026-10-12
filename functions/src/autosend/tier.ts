import { syncUserBilling } from '../billing';
import { isPaidAutosendTier } from './types';

/**
 * `unknown` means RevenueCat could not be asked. Delivery to a third party never
 * goes out on a guess, so callers wait and retry instead of sending.
 */
export type SendTimeTier = 'paid' | 'lapsed' | 'unknown';

export type SendTimeTierCheck = (
  db: FirebaseFirestore.Firestore,
  uid: string,
) => Promise<SendTimeTier>;

/**
 * Asks RevenueCat right now (not the stored tier, which only changes when a
 * webhook or an app sync lands) and refreshes the stored tier while at it.
 * Dev/emulator only: OCCASIO_AUTOSEND_ALLOW_FREE=true skips the check.
 */
export const verifyPaidAtSendTime: SendTimeTierCheck = async (db, uid) => {
  if (process.env.OCCASIO_AUTOSEND_ALLOW_FREE === 'true') {
    return 'paid';
  }
  if (!uid) {
    return 'lapsed';
  }
  try {
    const state = await syncUserBilling(db, uid);
    return isPaidAutosendTier(state.tier) ? 'paid' : 'lapsed';
  } catch (error) {
    console.error('AUTOSEND_TIER_CHECK_FAILED', {
      uid,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return 'unknown';
  }
};
