import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocBreadcrumb } from "@/components/DocBreadcrumb";
import { DocContent } from "@/components/DocContent";
import { DocPager } from "@/components/DocPager";
import { getDocBySlug, getDocSlugs } from "@/lib/docs";
import { getNavItem } from "@/lib/navigation";

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

  const pathname = `/docs/${slug}`;
  const navItem = getNavItem(pathname);

  return (
    <article>
      <DocBreadcrumb pathname={pathname} />

      <header className="doc-header">
        <h1>{navItem?.title ?? doc.meta.title}</h1>
        {(navItem?.description ?? doc.meta.description) && (
          <p className="doc-lead">{navItem?.description ?? doc.meta.description}</p>
        )}
        {doc.meta.updated && (
          <p className="mt-3 text-xs text-[var(--docs-muted)]">
            Last updated {doc.meta.updated}
          </p>
        )}
      </header>

      <DocContent html={doc.contentHtml} mermaidBlocks={doc.mermaidBlocks} />
      <DocPager />
    </article>
  );
}
