export type ExperienceMode = 'story' | 'classic';

export type SceneId =
  | 'gate'
  | 'lamp'
  | 'balloons'
  | 'candle'
  | 'gift'
  | 'contract'
  /** Photos, reasons and the letter, opened in any order. */
  | 'hub'
  | 'finale';

export type ExperienceCardInput = {
  templateType: string;
  mediaUrls?: string[];
  message: string | null;
  recipientName: string;
  experienceMode?: ExperienceMode | null;
  /** Optional ≤8-word balloon pop line. Empty → default "You are so special". */
  balloonLine?: string | null;
  /** Short lines revealed one tap at a time. */
  reasons?: string[];
};

export type ResolvedExperience = {
  mode: ExperienceMode;
  scenes: SceneId[];
  revealLine: string;
};
