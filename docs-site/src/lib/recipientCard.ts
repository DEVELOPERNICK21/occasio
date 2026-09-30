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
  /** Short "reasons I love you" lines, revealed one tap at a time. */
  reasons?: string[];
};

const DEMO_TYPES = new Set([
  "birthday",
  "anniversary",
  "thank_you",
  "congratulations",
  "just_because",
]);

const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=800&fit=crop",
  "https://images.unsplash.com/photo-1522673607200-164a1a38d7f3?w=600&h=800&fit=crop",
];

const DEMO_REASONS = [
  "You laugh at my worst jokes",
  "You remember the small things",
  "Home feels like wherever you are",
];

/** The lock screen demo accepts this code (no Firestore needed). */
export const DEMO_PASSCODE = "1408";

function titleCase(parts: string[]): string {
  return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

/**
 * Parse mock slugs. Forms:
 *  - `demo-mom-abc123`               → birthday story
 *  - `demo-<moment>-<name>-<code>`   → that moment (birthday, anniversary,
 *                                      thank_you, congratulations, just_because)
 *  - `demo-classic-<name>-<code>`    → classic (non-interactive) card
 *  - `demo-locked-<name>-<code>`     → passcode lock (unlock code 1408)
 */
export function parseDemoSlug(slug: string): RecipientCard | null {
  if (!slug.startsWith("demo-")) return null;

  const parts = slug.split("-");
  if (parts.length < 3) return null;

  const variant = parts[1]!;
  const isVariant =
    DEMO_TYPES.has(variant) || variant === "classic" || variant === "locked";
  const nameParts = isVariant ? parts.slice(2, -1) : parts.slice(1, -1);
  const recipientName = titleCase(nameParts);
  if (!recipientName) return null;

  const templateType = DEMO_TYPES.has(variant) ? variant : "birthday";
  const classic = variant === "classic";

  return {
    recipientName,
    message: "You are so special. Thank you for being exactly who you are.",
    templateType: variant === "locked" ? "anniversary" : templateType,
    templateId: null,
    fromName: "Someone who cares",
    isDemo: true,
    experienceMode: classic ? "classic" : "story",
    experienceVersion: 1,
    mediaUrls: DEMO_PHOTOS,
    reasons: classic ? [] : DEMO_REASONS,
  };
}

export function isDemoLockedSlug(slug: string): boolean {
  return slug.startsWith("demo-locked-");
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
