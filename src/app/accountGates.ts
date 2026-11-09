import { AccountAgeError, enforceAgeForNewAccount } from '../features/age/application/accountAge';
import { setNewAccountGate } from '../features/auth/application/newAccountGate';
import { NewAccountRefusedError, type NewAccountGate } from '../features/auth/domain/newAccountGate';

/** The age check as the gate for new accounts. Exported so it can be tested without the wiring. */
export const ageNewAccountGate: NewAccountGate = async (account) => {
  try {
    await enforceAgeForNewAccount(account);
  } catch (error) {
    if (error instanceof AccountAgeError) {
      throw new NewAccountRefusedError(error.reason === 'network' ? 'network' : 'refused');
    }
    throw error;
  }
};

/** Plugs the age check into account creation. Called once at startup, before anything can sign in. */
export function installAccountGates(): void {
  setNewAccountGate(ageNewAccountGate);
}
