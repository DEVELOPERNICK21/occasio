/**
 * Dev-relaxed mode skips the card allowance and shortens links. Off unless a
 * server env var turns it on — `next dev` / NODE_ENV=development is not enough,
 * so a local or preview deploy cannot give cards away by accident.
 */
export function isDevRelaxedQuota(
  devModeRequested = false,
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (env.OCCASIO_DEV_RELAXED_QUOTA === 'true') {
    return true;
  }
  return devModeRequested && env.OCCASIO_ALLOW_DEV_CREATE === 'true';
}
