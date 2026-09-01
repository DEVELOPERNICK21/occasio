import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/LegalDocument";
import { getDocBySlug } from "@/lib/docs";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using the Occasio app and services.",
  alternates: {
    canonical: `${legal.website}/terms`,
  },
  openGraph: {
    title: "Terms of Service · Occasio",
    description: "Terms and conditions for using the Occasio app and services.",
    url: `${legal.website}/terms`,
  },
};

export default async function TermsPage() {
  const doc = await getDocBySlug("terms-of-service");
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
