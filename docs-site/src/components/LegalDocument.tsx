import { DocContent } from "@/components/DocContent";

type Props = {
  title: string;
  description?: string;
  updated?: string;
  html: string;
  mermaidBlocks: string[];
};

export function LegalDocument({
  title,
  description,
  updated,
  html,
  mermaidBlocks,
}: Props) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
      <header className="mb-10 border-b border-[var(--border)] pb-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-base text-[var(--ink-soft)]">{description}</p>
        ) : null}
        {updated ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Last updated: {updated}
          </p>
        ) : null}
      </header>
      <DocContent html={html} mermaidBlocks={mermaidBlocks} />
    </div>
  );
}
