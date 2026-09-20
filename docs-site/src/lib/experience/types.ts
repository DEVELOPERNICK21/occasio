export type ExperienceMode = 'story' | 'classic';

export type SceneId =
  | 'balloons'
  | 'candle'
  | 'gift'
  | 'photo_deck'
  | 'envelope'
  | 'letter_write'
  | 'letter';

export type ExperienceCardInput = {
  templateType: string;
  mediaUrls?: string[];
  message: string | null;
  recipientName: string;
  experienceMode?: ExperienceMode | null;
  /** Optional ≤8-word balloon pop line. Empty → default "You are so special". */
  balloonLine?: string | null;
};

export type ResolvedExperience = {
  mode: ExperienceMode;
  scenes: SceneId[];
  revealLine: string;
};
