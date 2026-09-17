import catalogJson from './templates/catalog.json';
import {
  parseTemplateCatalog,
  type TemplateDefinition,
} from '../domain/templateSchema';

export function loadCatalog(): TemplateDefinition[] {
  return parseTemplateCatalog(catalogJson);
}

/** v1 stub — always null. Later: fetch CDN/Firestore and merge by id. */
export async function fetchRemoteCatalogOverride(): Promise<
  TemplateDefinition[] | null
> {
  return null;
}

export async function loadCatalogWithOptionalRemote(): Promise<
  TemplateDefinition[]
> {
  const bundled = loadCatalog();
  const remote = await fetchRemoteCatalogOverride();
  if (!remote || remote.length === 0) return bundled;

  const byId = new Map(bundled.map((t) => [t.id, t]));
  for (const t of remote) {
    byId.set(t.id, t);
  }
  return Array.from(byId.values());
}
