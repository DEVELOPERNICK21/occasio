import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/LegalDocument";
import { getDocBySlug } from "@/lib/docs";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Delete your account and data",
  description:
    "How to request deletion of your Occasio account, Vault data, or specific information.",
  alternates: {
    canonical: `${legal.website}/delete-account`,
  },
  openGraph: {
    title: "Delete your account and data · Occasio",
    description:
      "How to request deletion of your Occasio account, Vault data, or specific information.",
    url: `${legal.website}/delete-account`,
  },
};

export default async function DeleteAccountPage() {
  const doc = await getDocBySlug("delete-account");
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
