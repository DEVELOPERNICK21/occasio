import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/LegalDocument";
import { getDocBySlug } from "@/lib/docs";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Occasio collects, uses, stores, and protects your information.",
  alternates: {
    canonical: `${legal.website}/privacy`,
  },
  openGraph: {
    title: "Privacy Policy · Occasio",
    description:
      "How Occasio collects, uses, stores, and protects your information.",
    url: `${legal.website}/privacy`,
  },
};

export default async function PrivacyPage() {
  const doc = await getDocBySlug("privacy-policy");
  if (!doc) notFound();

  return (
    <LegalDocument
      title={doc.meta.title}
      description={doc.meta.description}
      updated={doc.meta.updated}
      html={doc.contentHtml}
      mermaidBlocks={doc.mermaidBlocks}
    />
  );
}
