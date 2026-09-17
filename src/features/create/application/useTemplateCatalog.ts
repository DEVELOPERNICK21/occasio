import { useEffect, useMemo, useState } from 'react';
import {
  loadCatalog,
  loadCatalogWithOptionalRemote,
} from '../data/templateCatalog';
import type { TemplateDefinition } from '../domain/templateSchema';

export function useTemplateCatalog() {
  const [templates, setTemplates] = useState<TemplateDefinition[]>(() =>
    loadCatalog(),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadCatalogWithOptionalRemote().then((list) => {
      if (!cancelled) {
        setTemplates(list);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const getById = useMemo(() => {
    const map = new Map(templates.map((t) => [t.id, t]));
    return (id: string) => map.get(id) ?? null;
  }, [templates]);

  return { templates, getById, isLoading };
}
