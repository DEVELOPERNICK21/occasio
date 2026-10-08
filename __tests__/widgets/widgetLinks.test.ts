import {
  parseWidgetLink,
  widgetLinkUrl,
  type WidgetLink,
} from '../../src/features/widgets/domain/widgetLinks';

describe('parseWidgetLink', () => {
  it('understands every link the native widgets open', () => {
    expect(parseWidgetLink('occasio://create/quick')).toEqual({ kind: 'quick_create' });
    expect(parseWidgetLink('occasio://vault')).toEqual({ kind: 'vault' });
    expect(parseWidgetLink('occasio://vault/add')).toEqual({ kind: 'add_person' });
    expect(parseWidgetLink('occasio://card/new?person=abc123&occasion=anniversary')).toEqual({
      kind: 'card',
      personId: 'abc123',
      occasion: 'anniversary',
    });
  });

  it('defaults the occasion to birthday and tolerates slashes and case', () => {
    expect(parseWidgetLink('OCCASIO://card/new/?person=p_1')).toEqual({
      kind: 'card',
      personId: 'p_1',
      occasion: 'birthday',
    });
  });

  it('rejects other schemes, unknown paths and bad person ids', () => {
    expect(parseWidgetLink('https://occasio-greetings.vercel.app/c/abc')).toBeNull();
    expect(parseWidgetLink('occasio://settings')).toBeNull();
    expect(parseWidgetLink('occasio://card/new')).toBeNull();
    expect(parseWidgetLink('occasio://card/new?person=../etc')).toBeNull();
    expect(parseWidgetLink('com.googleusercontent.apps.1://oauth')).toBeNull();
    expect(parseWidgetLink(null)).toBeNull();
    expect(parseWidgetLink('')).toBeNull();
  });

  it('round-trips with widgetLinkUrl', () => {
    const links: WidgetLink[] = [
      { kind: 'quick_create' },
      { kind: 'vault' },
      { kind: 'add_person' },
      { kind: 'card', personId: 'Zk3-9_a', occasion: 'birthday' },
      { kind: 'card', personId: 'q', occasion: 'anniversary' },
    ];
    for (const link of links) {
      expect(parseWidgetLink(widgetLinkUrl(link))).toEqual(link);
    }
  });
});
