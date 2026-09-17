export type ExperienceMode = 'story' | 'classic';

export type SceneId = 'balloons' | 'photo_deck' | 'letter';

export type ExperienceCardInput = {
  templateType: string;
  mediaUrls?: string[];
  message: string | null;
  recipientName: string;
  experienceMode?: ExperienceMode | null;
};

export type ResolvedExperience = {
  mode: ExperienceMode;
  scenes: SceneId[];
  revealLine: string;
};
