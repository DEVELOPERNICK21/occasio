export type RecipientCard = {
  recipientName: string;
  message: string | null;
  templateType: string;
  fromName: string | null;
  isDemo: boolean;
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
    message: null,
    templateType: "birthday",
    fromName: null,
    isDemo: true,
  };
}

export function templateLabel(templateType: string): string {
  const labels: Record<string, string> = {
    birthday: "Birthday",
    anniversary: "Anniversary",
    congratulations: "Congratulations",
    thankyou: "Thank you",
    festival: "Festival",
  };
  return labels[templateType] ?? "Special wish";
}
