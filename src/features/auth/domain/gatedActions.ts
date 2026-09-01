import type { GatedAction } from './types';

const GATED_ACTIONS: ReadonlySet<GatedAction> = new Set([
  'vault_save',
  'vault_view',
  'history_sync',
  'autosend_enable',
  'subscription_manage',
]);

/** Whether this action requires sign-in (all vault/history/billing gates do). */
export function requiresAuth(action: GatedAction): boolean {
  return GATED_ACTIONS.has(action);
}

export function gatedActionLabel(action: GatedAction): string {
  switch (action) {
    case 'vault_save':
      return 'save to your Vault';
    case 'vault_view':
      return 'open your Vault';
    case 'history_sync':
      return 'sync your history';
    case 'autosend_enable':
      return 'enable auto-send';
    case 'subscription_manage':
      return 'manage your plan';
    default:
      return 'continue';
  }
}
