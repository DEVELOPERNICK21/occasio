import {
  INVITATION_TEMPLATE,
  demoInvitation,
  invitationTitle,
  isDesign,
  isOccasion,
  type Invitation,
  type InvitationDesign,
  type Occasion,
} from "./invitation";
import { webHolidayFor } from "./holidays";

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
  /** The details of an invitation (`templateType` is `invitation`). */
  invitation?: Invitation | null;
};

const DEMO_TYPES = new Set([
  "birthday",
  "anniversary",
  "thank_you",
  "congratulations",
  "just_because",
]);

/** A sample can be made for any moment, and for any festival (`demo-diwali-maya-abc123`). */
function isDemoMoment(variant: string): boolean {
  return DEMO_TYPES.has(variant) || webHolidayFor(variant) !== null;
}

/** Self-hosted (see public/demo/README.md): demo cards must not contact third parties. */
const DEMO_PHOTOS = ["/demo/photo-1.jpg", "/demo/photo-2.jpg"];

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

const DEMO_INVITATION_NOTES: Record<Occasion, string> = {
  wedding: "We would be honoured to have you with us as we begin our life together.",
  engagement: "Your blessings mean the world to us as we begin this journey.",
  anniversary: "Twenty-five years, and we would love to celebrate them with you.",
  birthday: "Come hungry, come loud, and stay for the cake.",
  baby_shower: "Join us for a gentle afternoon of games, good food and good wishes.",
  housewarming: "Our door is open. Come bless our new home.",
  graduation: "We could not have done it without you. Come celebrate with us.",
  party: "No speeches, just good company.",
};

function demoInvitationCard(occasion: Occasion, design: InvitationDesign): RecipientCard {
  const invitation = demoInvitation(occasion, new Date(), design);
  return {
    recipientName: invitationTitle(invitation),
    message: DEMO_INVITATION_NOTES[occasion],
    templateType: INVITATION_TEMPLATE,
    templateId: null,
    fromName: null,
    isDemo: true,
    experienceMode: "classic",
    experienceVersion: 1,
    mediaUrls: DEMO_PHOTOS,
    reasons: [],
    invitation,
  };
}

/**
 * Parse mock slugs. Forms:
 *  - `demo-mom-abc123`               → birthday story
 *  - `demo-<moment>-<name>-<code>`   → that moment (birthday, anniversary,
 *                                      thank_you, congratulations, just_because)
 *                                      or any festival (diwali, holi, halloween, eid_al_fitr...)
 *  - `demo-classic-<name>-<code>`    → classic (non-interactive) card
 *  - `demo-locked-<name>-<code>`     → passcode lock (unlock code 1408)
 *  - `demo-invite-<occasion>-<code>` → a sample invitation (wedding, engagement, anniversary,
 *                                      birthday, baby_shower, housewarming, graduation, party)
 *  - `demo-invite-wedding-sage-<code>` → the same ceremony in another design (regal, sage, palace)
 */
export function parseDemoSlug(slug: string): RecipientCard | null {
  if (!slug.startsWith("demo-")) return null;

  const parts = slug.split("-");
  if (parts.length < 3) return null;

  const variant = parts[1]!;
  // `demo-invite-<occasion>[-<design>]-<anything>` (and `demo-wedding[-<design>]-<anything>`): a sample
  // invitation, so each look can be seen without making one. A ceremony can name its design (regal,
  // sage or palace); anything else after the occasion is just a name.
  if (variant === "invite" || variant === "wedding") {
    const occasion = variant === "wedding" ? "wedding" : parts[2];
    if (!isOccasion(occasion)) return null;
    const named = variant === "wedding" ? parts[2] : parts[3];
    return demoInvitationCard(occasion, isDesign(named) ? named : "regal");
  }
  const isVariant =
    isDemoMoment(variant) || variant === "classic" || variant === "locked";
  const nameParts = isVariant ? parts.slice(2, -1) : parts.slice(1, -1);
  const recipientName = titleCase(nameParts);
  if (!recipientName) return null;

  const templateType = isDemoMoment(variant) ? variant : "birthday";
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
    invitation: "Invitation",
    sorry: "Sorry",
    proposal: "Proposal",
  };
  return labels[templateType] ?? webHolidayFor(templateType)?.label ?? "Special wish";
}

export function wishGreeting(templateType: string): string {
  const holiday = webHolidayFor(templateType);
  if (holiday) return `${holiday.headline},`;
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
