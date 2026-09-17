import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import {
  templateLabel as recipientTemplateLabel,
  wishGreeting as recipientWishGreeting,
} from '../../docs-site/src/lib/recipientCard';
import { loadCatalog } from '../../src/features/create/data/templateCatalog';
import { DualEditorial } from '../../src/features/create/ui/components/layouts/DualEditorial';
import { MinimalFullscreen } from '../../src/features/create/ui/components/layouts/MinimalFullscreen';
import { TemplateRenderer } from '../../src/features/create/ui/components/TemplateRenderer';
import { getCreateStep } from '../../src/features/create/ui/createSteps';

function renderedText(element: React.ReactElement): string {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return JSON.stringify(renderer!.toJSON());
}

describe('recipient web occasion copy', () => {
  it.each([
    ['thank_you', 'Thank you', 'Thank you,'],
    ['congratulations', 'Congratulations', 'Congratulations,'],
    ['just_because', 'Just because', 'For you,'],
  ])('renders a valid label and greeting for %s', (occasion, label, greeting) => {
    expect(recipientTemplateLabel(occasion)).toBe(label);
    expect(recipientWishGreeting(occasion)).toBe(greeting);
  });
});

describe('template renderer occasion copy', () => {
  const definition = loadCatalog().find((template) => template.id === 'L06')!;

  it('prefers the selected occasion headline over a fallback template headline', () => {
    const output = renderedText(
      <TemplateRenderer
        definition={definition}
        occasion="anniversary"
        photoUris={[]}
        recipientName="Ari"
        message=""
      />,
    );

    expect(output).toContain('Happy Anniversary');
    expect(output).not.toContain('Just because');
  });
});

describe('template layout content', () => {
  const layoutProps = {
    photoUris: ['photo://one'],
    recipientName: 'Ari',
    message: 'You make every day better.',
    headline: 'Just because',
    body: 'You make every day better.',
  };

  it('shows the message in the minimal fullscreen layout', () => {
    expect(renderedText(<MinimalFullscreen {...layoutProps} />)).toContain(
      'You make every day better.',
    );
  });

  it('does not duplicate one photo in the dual layout', () => {
    const output = renderedText(<DualEditorial {...layoutProps} />);
    expect(output.match(/photo:\/\/one/g)).toHaveLength(1);
  });
});

describe('create flow step indicators', () => {
  it('uses five steps for the full flow', () => {
    expect(getCreateStep('occasion', false)).toEqual({ current: 1, total: 5 });
    expect(getCreateStep('photos', false)).toEqual({ current: 2, total: 5 });
    expect(getCreateStep('frame', false)).toEqual({ current: 3, total: 5 });
    expect(getCreateStep('details', false)).toEqual({ current: 4, total: 5 });
    expect(getCreateStep('preview', false)).toEqual({ current: 5, total: 5 });
  });

  it('uses three steps for quick create', () => {
    expect(getCreateStep('photos', true)).toEqual({ current: 1, total: 3 });
    expect(getCreateStep('details', true)).toEqual({ current: 2, total: 3 });
    expect(getCreateStep('preview', true)).toEqual({ current: 3, total: 3 });
  });

  it('never leaves a gap when a screen is skipped', () => {
    expect(getCreateStep('frame', true)).toEqual({ current: 1, total: 3 });
  });
});
