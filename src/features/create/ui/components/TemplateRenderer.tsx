import { occasionHeadline } from '../../domain/audienceOccasion';
import type { Occasion, TemplateDefinition } from '../../domain/templateSchema';
import { AsymmetricSplit } from './layouts/AsymmetricSplit';
import { DualEditorial } from './layouts/DualEditorial';
import { EditorialPortrait } from './layouts/EditorialPortrait';
import { FilmStrip } from './layouts/FilmStrip';
import { MinimalFullscreen } from './layouts/MinimalFullscreen';
import { PolaroidOverlay } from './layouts/PolaroidOverlay';
import { StoryMosaic } from './layouts/StoryMosaic';

export type LayoutProps = {
  photoUris: string[];
  recipientName: string;
  headline: string;
  body: string;
  fromName?: string;
  compact?: boolean;
  replayKey?: number;
  /** Staged reveal — off for compact picker tiles. */
  animate?: boolean;
};

type Props = {
  definition: TemplateDefinition;
  occasion: Occasion | null;
  photoUris: string[];
  recipientName: string;
  message: string;
  fromName?: string;
  compact?: boolean;
  replayKey?: number;
  animate?: boolean;
};

export function TemplateRenderer({
  definition,
  occasion,
  photoUris,
  recipientName,
  message,
  fromName,
  compact,
  replayKey = 0,
  animate = true,
}: Props) {
  const headline =
    occasionHeadline(occasion) ??
    definition.texts.find((text) => text.role === 'headline')?.default ??
    '';
  const bodyDefault =
    definition.texts.find((text) => text.role === 'body')?.default ?? '';
  const body = message.trim() || bodyDefault;
  const layoutProps: LayoutProps = {
    photoUris,
    recipientName,
    headline,
    body,
    fromName,
    compact,
    replayKey,
    animate,
  };

  switch (definition.layoutId) {
    case 'dual_editorial':
      return <DualEditorial {...layoutProps} />;
    case 'minimal_fullscreen':
      return <MinimalFullscreen {...layoutProps} />;
    case 'film_strip':
      return <FilmStrip {...layoutProps} />;
    case 'asymmetric_split':
      return <AsymmetricSplit {...layoutProps} />;
    case 'story_mosaic':
      return <StoryMosaic {...layoutProps} />;
    case 'polaroid_overlay':
      return <PolaroidOverlay {...layoutProps} />;
    case 'editorial_portrait':
    default:
      return <EditorialPortrait {...layoutProps} />;
  }
}
