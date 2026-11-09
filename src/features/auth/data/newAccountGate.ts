import auth from '@react-native-firebase/auth';
import {
  NewAccountRefusedError,
  type NewAccountGate,
  type NewAccountHandle,
} from '../domain/newAccountGate';

let gate: NewAccountGate | null = null;

/** Installed once at startup by the app shell (`src/app/accountGates.ts`). */
export function setNewAccountGate(next: NewAccountGate | null): void {
  gate = next;
}

/**
 * Every new account passes through here. With no gate installed the account is removed and
 * refused: a missing wire must never let an unchecked account stay.
 */
export async function requireNewAccountApproval(account: NewAccountHandle): Promise<void> {
  if (!gate) {
    await account.delete().catch(() => undefined);
    await auth().signOut().catch(() => undefined);
    throw new NewAccountRefusedError('refused');
  }
  await gate(account);
}
