/**
 * What the app shell needs from the age check beyond the gate screen: approving a new account
 * and stamping older ones. Plain async functions, no React.
 */
export { AccountAgeError, enforceAgeForNewAccount, ensureAccountStamped } from '../data/ageRepository';
