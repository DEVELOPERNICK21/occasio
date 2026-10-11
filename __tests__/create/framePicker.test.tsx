import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { loadCatalog } from '../../src/features/create/data/templateCatalog';
import { DesignFrameCard } from '../../src/features/create/ui/components/DesignFrameCard';
import { NeedMorePhotosSheet } from '../../src/features/create/ui/components/NeedMorePhotosSheet';

const catalog = loadCatalog();
const booth = catalog.find((t) => t.id === 'F04')!;
const TONE = {
  wash: '#FCEEE8',
  photo: '#E8A4A0',
  photoAlt: '#F7C9B6',
  accent: '#E8615D',
  ink: '#2A2220',
};

function render(element: React.ReactElement): TestRenderer.ReactTestRenderer {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer!;
}

describe('DesignFrameCard for a frame that needs more photos', () => {
  it('stays tappable, says what it needs, and is not dimmed or locked', () => {
    const onPress = jest.fn();
    const renderer = render(
      <DesignFrameCard
        template={booth}
        cue="Three shots and a name"
        headline="Happy Birthday"
        photoUris={['photo://1']}
        tone={TONE}
        width={180}
        needsNote="Add 2 more photos"
        onPress={onPress}
      />,
    );
    const output = JSON.stringify(renderer.toJSON());

    expect(output).toContain('Add 2 more photos');
    expect(output).not.toContain('"opacity":0.5');

    const pressable = renderer.root.find(
      (node) => typeof node.props.onPress === 'function' && node.props.accessibilityRole === 'button',
    );
    act(() => pressable.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows its usual style and photo count when it fits', () => {
    const output = JSON.stringify(
      render(
        <DesignFrameCard
          template={booth}
          cue="Three shots and a name"
          headline="Happy Birthday"
          photoUris={['photo://1', 'photo://2', 'photo://3']}
          tone={TONE}
          width={180}
          onPress={() => undefined}
        />,
      ).toJSON(),
    );
    expect(output).toContain('3 photos');
    expect(output).not.toContain('Add ');
  });
});

describe('NeedMorePhotosSheet', () => {
  it('explains the shortfall and offers to add photos or pick another frame', () => {
    const onAddPhotos = jest.fn();
    const onClose = jest.fn();
    const renderer = render(
      <NeedMorePhotosSheet
        template={booth}
        photoCount={1}
        photosNeeded={2}
        onAddPhotos={onAddPhotos}
        onClose={onClose}
      />,
    );
    const output = JSON.stringify(renderer.toJSON());

    expect(output).toContain('Photo booth uses 3 photos');
    expect(output).toContain('You have added 1');
    expect(output).toContain('Add 2 more photos');
    expect(output).toContain('Choose another frame');
  });

  it('uses the singular when only one more photo is needed', () => {
    const output = JSON.stringify(
      render(
        <NeedMorePhotosSheet
          template={booth}
          photoCount={2}
          photosNeeded={1}
          onAddPhotos={() => undefined}
          onClose={() => undefined}
        />,
      ).toJSON(),
    );
    expect(output).toContain('Add 1 more photo');
    expect(output).not.toContain('Add 1 more photos');
  });
});
