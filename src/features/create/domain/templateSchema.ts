export type Audience =
  | 'mom'
  | 'dad'
  | 'partner'
  | 'friend'
  | 'family'
  | 'someone_special';

export type Occasion =
  | 'birthday'
  | 'anniversary'
  | 'thank_you'
  | 'congratulations'
  | 'just_because';

export type LayoutId =
  | 'editorial_portrait'
  | 'dual_editorial'
  | 'minimal_fullscreen';

export type TemplateTextRole = 'headline' | 'body' | 'name';

export type TemplateTextSlot = {
  key: string;
  role: TemplateTextRole;
  default: string;
};

export type TemplateDefinition = {
  id: string;
  title: string;
  category: 'birthday' | 'love' | 'thank_you';
  audiences: Audience[];
  occasions: Occasion[];
  style: 'elegant' | 'emotional' | 'minimal';
  layoutId: LayoutId;
  photoSlots: 1 | 2;
  texts: TemplateTextSlot[];
  quickCreate?: boolean;
};

const LAYOUT_IDS = new Set<LayoutId>([
  'editorial_portrait',
  'dual_editorial',
  'minimal_fullscreen',
]);

function isAudience(v: unknown): v is Audience {
  return (
    v === 'mom' ||
    v === 'dad' ||
    v === 'partner' ||
    v === 'friend' ||
    v === 'family' ||
    v === 'someone_special'
  );
}

function isOccasion(v: unknown): v is Occasion {
  return (
    v === 'birthday' ||
    v === 'anniversary' ||
    v === 'thank_you' ||
    v === 'congratulations' ||
    v === 'just_because'
  );
}

function parseOne(raw: unknown): TemplateDefinition {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid template entry');
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || typeof r.title !== 'string') {
    throw new Error('Template missing id/title');
  }
  if (
    r.layoutId !== 'editorial_portrait' &&
    r.layoutId !== 'dual_editorial' &&
    r.layoutId !== 'minimal_fullscreen'
  ) {
    throw new Error(`Unknown layoutId: ${String(r.layoutId)}`);
  }
  if (r.photoSlots !== 1 && r.photoSlots !== 2) {
    throw new Error('photoSlots must be 1 or 2');
  }
  if (!Array.isArray(r.audiences) || !r.audiences.every(isAudience)) {
    throw new Error('Invalid audiences');
  }
  if (!Array.isArray(r.occasions) || !r.occasions.every(isOccasion)) {
    throw new Error('Invalid occasions');
  }
  if (!Array.isArray(r.texts)) {
    throw new Error('Invalid texts');
  }
  const texts: TemplateTextSlot[] = r.texts.map((t) => {
    if (!t || typeof t !== 'object') throw new Error('Invalid text slot');
    const s = t as Record<string, unknown>;
    if (
      typeof s.key !== 'string' ||
      typeof s.default !== 'string' ||
      (s.role !== 'headline' && s.role !== 'body' && s.role !== 'name')
    ) {
      throw new Error('Invalid text slot fields');
    }
    return { key: s.key, role: s.role, default: s.default };
  });

  return {
    id: r.id,
    title: r.title,
    category:
      r.category === 'birthday' || r.category === 'love' || r.category === 'thank_you'
        ? r.category
        : (() => {
            throw new Error('Invalid category');
          })(),
    audiences: r.audiences,
    occasions: r.occasions,
    style:
      r.style === 'elegant' || r.style === 'emotional' || r.style === 'minimal'
        ? r.style
        : (() => {
            throw new Error('Invalid style');
          })(),
    layoutId: r.layoutId,
    photoSlots: r.photoSlots,
    texts,
    quickCreate: r.quickCreate === true ? true : undefined,
  };
}

export function parseTemplateCatalog(raw: unknown): TemplateDefinition[] {
  if (!Array.isArray(raw)) {
    throw new Error('Catalog must be an array');
  }
  const parsed = raw.map(parseOne);
  if (parsed.length === 0) {
    throw new Error('Catalog is empty');
  }
  void LAYOUT_IDS; // keep set for future guards
  return parsed;
}
