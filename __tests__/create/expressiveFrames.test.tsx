import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { loadCatalog } from '../../src/features/create/data/templateCatalog';
import { slotLabels } from '../../src/features/create/domain/frameSlots';
import { DesignFramePreview } from '../../src/features/create/ui/components/DesignFramePreview';
import { TemplateRenderer } from '../../src/features/create/ui/components/TemplateRenderer';

const catalog = loadCatalog();
const NEW_IDS = ['F01', 'F02', 'F03', 'F04', 'F05'] as const;

const PHOTOS = ['photo://1', 'photo://2', 'photo://3', 'photo://4', 'photo://5'];

function render(element: React.ReactElement): string {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return JSON.stringify(renderer!.toJSON());
}

function card(id: string, over: Partial<React.ComponentProps<typeof TemplateRenderer>> = {}) {
  const definition = catalog.find((t) => t.id === id)!;
  return (
    <TemplateRenderer
      definition={definition}
      occasion="birthday"
      photoUris={PHOTOS.slice(0, definition.photoSlots)}
      recipientName="Maya"
      message="You make every room feel like home."
      fromName="Rahul"
      animate={false}
      {...over}
    />
  );
}

describe.each(NEW_IDS)('frame %s', (id) => {
  it("shows the recipient's name, the occasion and their message", () => {
    const output = render(card(id));
    expect(output).toContain('Maya');
    expect(output).toContain('Happy Birthday');
    expect(output).toContain('You make every room feel like home.');
  });

  it('shows who it is from', () => {
    expect(render(card(id))).toContain('Rahul');
  });

  it('renders every photo it asks for', () => {
    const definition = catalog.find((t) => t.id === id)!;
    const output = render(card(id));
    for (const uri of PHOTOS.slice(0, definition.photoSlots)) {
      expect(output).toContain(uri);
    }
  });

  it('still renders sensibly with no photos and no message', () => {
    const output = render(card(id, { photoUris: [], message: '', fromName: '' }));
    expect(output).toContain('Maya');
    expect(output).not.toContain('undefined');
  });

  it('has a picker thumbnail that uses the real photos', () => {
    const definition = catalog.find((t) => t.id === id)!;
    const output = render(
      <DesignFramePreview
        layoutId={definition.layoutId}
        title="Happy Birthday"
        tone={{
          wash: '#FCEEE8',
          photo: '#E8A4A0',
          photoAlt: '#F7C9B6',
          accent: '#C94E4A',
          ink: '#2A2220',
        }}
        photoUris={PHOTOS}
      />,
    );
    expect(output).toContain('photo://1');
  });
});

describe('every catalog frame', () => {
  it('has a named spot for each photo it asks for, so arranging never shows "Photo 3"', () => {
    for (const template of catalog) {
      const labels = slotLabels(template.layoutId, template.photoSlots);
      expect(labels.filter((label) => /^Photo \d/.test(label))).toEqual([]);
    }
  });

  it('renders without crashing for every occasion', () => {
    for (const template of catalog) {
      for (const occasion of ['birthday', 'anniversary', 'thank_you', 'congratulations', 'just_because'] as const) {
        expect(() =>
          render(
            <TemplateRenderer
              definition={template}
              occasion={occasion}
              photoUris={PHOTOS.slice(0, template.photoSlots)}
              recipientName="Maya"
              message=""
              animate={false}
            />,
          ),
        ).not.toThrow();
      }
    }
  });
});
