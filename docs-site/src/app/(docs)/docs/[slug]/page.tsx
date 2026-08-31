import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocContent } from "@/components/DocContent";
import { getDocBySlug, getDocSlugs } from "@/lib/docs";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getDocSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);
  if (!doc) return {};
  return {
    title: doc.meta.title,
    description: doc.meta.description,
  };
}

export default async function DocPage({ params }: Props) {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);
  if (!doc) notFound();

  return (
    <article>
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
          {doc.meta.phase && (
            <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[var(--accent)]">
              {doc.meta.phase}
            </span>
          )}
          {doc.meta.status && (
            <span className="rounded-full border border-[var(--border)] px-2.5 py-1">
              {doc.meta.status}
            </span>
          )}
          {doc.meta.updated && <span>Updated {doc.meta.updated}</span>}
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)] md:text-4xl">
          {doc.meta.title}
        </h1>
        {doc.meta.description && (
          <p className="mt-3 text-lg text-[var(--ink-soft)]">
            {doc.meta.description}
          </p>
        )}
      </header>
      <DocContent html={doc.contentHtml} mermaidBlocks={doc.mermaidBlocks} />
    </article>
  );
}
