import catalogJson from '../../src/features/create/data/templates/catalog.json';
import { parseTemplateCatalog } from '../../src/features/create/domain/templateSchema';
import { wishLayoutId } from '../../docs-site/src/lib/templateLayout';

const catalog = parseTemplateCatalog(catalogJson);

describe('app catalog and recipient web page agree on every frame', () => {
  it('the web page draws each template with the layout the app preview used', () => {
    for (const template of catalog) {
      expect(wishLayoutId(template.id, template.photoSlots)).toBe(template.layoutId);
    }
  });

  it('falls back to the classic layout instead of drawing empty slots', () => {
    for (const template of catalog.filter((t) => t.photoSlots > 1)) {
      expect(wishLayoutId(template.id, template.photoSlots - 1)).toBe('editorial_portrait');
    }
  });

  it('shows cards made with an unknown or missing frame as the classic layout', () => {
    expect(wishLayoutId('Z99', 5)).toBe('editorial_portrait');
    expect(wishLayoutId(null, 5)).toBe('editorial_portrait');
  });
});
