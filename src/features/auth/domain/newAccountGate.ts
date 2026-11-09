/**
 * A brand-new account is only kept if something else approves it first (today: the age check).
 * Auth does not know what that something is: the app shell plugs it in, so auth never imports
 * the feature behind it. The default is to refuse, never to wave an account through.
 */
export type NewAccountHandle = {
  getIdToken(): Promise<string>;
  /** Removes the account again. */
  delete(): Promise<void>;
};

/** Approves the account, or throws `NewAccountRefusedError`. It removes the account itself when it refuses. */
export type NewAccountGate = (account: NewAccountHandle) => Promise<void>;

export type NewAccountRefusal =
  /** Could not be checked right now: worth trying again. */
  | 'network'
  /** Checked and refused, or no check was installed. */
  | 'refused';

export class NewAccountRefusedError extends Error {
  constructor(public readonly reason: NewAccountRefusal) {
    super(`new_account_${reason}`);
    this.name = 'NewAccountRefusedError';
  }
}
