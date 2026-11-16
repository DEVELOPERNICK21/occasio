import {
  ADD_PERSON_RELATIONSHIP_OPTIONS,
  RELATIONSHIP_OPTIONS,
  relationshipLabel,
} from '../../src/features/vault/domain/relationshipTypes';

describe('relationship options', () => {
  it('lists each relationship once, with a label', () => {
    for (const list of [ADD_PERSON_RELATIONSHIP_OPTIONS, RELATIONSHIP_OPTIONS]) {
      const ids = list.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const option of list) expect(option.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('offers on the Add Person screen only relationships the full list knows', () => {
    const known = new Set(RELATIONSHIP_OPTIONS.map((o) => o.id));
    for (const option of ADD_PERSON_RELATIONSHIP_OPTIONS) expect(known.has(option.id)).toBe(true);
  });

  it('labels a relationship, and falls back to Other for one it does not know', () => {
    expect(relationshipLabel('mom')).toBe('Mom');
    expect(relationshipLabel('colleague')).toBe('Colleague');
    expect(relationshipLabel('nobody' as never)).toBe('Other');
  });
});
