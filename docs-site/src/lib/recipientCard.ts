export type RecipientCard = {
  recipientName: string;
  message: string | null;
  templateType: string;
  /** Frame the sender chose. Null for cards made before frames shipped. */
  templateId: string | null;
  fromName: string | null;
  isDemo: boolean;
  mediaUrls?: string[];
  reactionCount?: number;
  /** Interactive story vs classic card. Null on legacy docs → resolve from templateType. */
  experienceMode?: 'story' | 'classic' | null;
  experienceVersion?: number | null;
  /** Optional ≤8-word balloon pop line. */
  balloonLine?: string | null;
};

/** Parse mock slugs from the mobile app (`demo-mom-abc123`). */
export function parseDemoSlug(slug: string): RecipientCard | null {
  if (!slug.startsWith("demo-")) return null;

  const parts = slug.split("-");
  if (parts.length < 3) return null;

  const nameParts = parts.slice(1, -1);
  const recipientName = nameParts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  if (!recipientName) return null;

  return {
    recipientName,
    message: "You are so special.",
    templateType: "birthday",
    templateId: null,
    fromName: "Someone who cares",
    isDemo: true,
    experienceMode: "story",
    experienceVersion: 1,
    /** Sample stack so local/demo links show a multi-card Polaroid deck. */
    mediaUrls: [
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=800&fit=crop",
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=800&fit=crop",
      "https://images.unsplash.com/photo-1522673607200-164a1a38d7f3?w=600&h=800&fit=crop",
    ],
  };
}

export function templateLabel(templateType: string): string {
  const labels: Record<string, string> = {
    birthday: "Birthday",
    anniversary: "Anniversary",
    thank_you: "Thank you",
    congratulations: "Congratulations",
    just_because: "Just because",
    sorry: "Sorry",
    proposal: "Proposal",
    mothers_day: "Mother's Day",
    fathers_day: "Father's Day",
  };
  return labels[templateType] ?? "Special wish";
}

export function wishGreeting(templateType: string): string {
  switch (templateType) {
    case "sorry":
      return "Thinking of you,";
    case "proposal":
    case "just_because":
      return "For you,";
    case "anniversary":
      return "Happy anniversary,";
    case "thank_you":
      return "Thank you,";
    case "congratulations":
      return "Congratulations,";
    default:
      return `Happy ${templateLabel(templateType)},`;
  }
}
