import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalDocument } from "@/components/LegalDocument";
import { getDocBySlug } from "@/lib/docs";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Copyright and DMCA policy",
  description:
    "How to report copyright infringement on Occasio and how we respond.",
  alternates: { canonical: `${legal.website}/dmca` },
};

type Props = { searchParams: Promise<{ card?: string }> };

const SLUG = /^[a-z0-9]{6,32}$/;

export default async function DmcaPage({ searchParams }: Props) {
  const doc = await getDocBySlug("dmca");
  if (!doc) notFound();

  const { card } = await searchParams;
  const cardUrl = card && SLUG.test(card) ? `${legal.website}/c/${card}` : null;
  const agent = legal.dmcaAgent;

  return (
    <>
      <LegalDocument
        title={doc.meta.title}
        description={doc.meta.description}
        updated={doc.meta.updated}
        html={doc.contentHtml}
        mermaidBlocks={doc.mermaidBlocks}
      />
      <section className="mx-auto max-w-3xl px-6 pb-16" aria-labelledby="dmca-agent">
        <h2
          id="dmca-agent"
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--ink)]"
        >
          Designated agent
        </h2>
        {agent ? (
          <address className="mt-3 not-italic leading-relaxed text-[var(--ink-soft)]">
            {agent.name}
            {agent.organization ? <><br />{agent.organization}</> : null}
            <br />
            <span className="whitespace-pre-line">{agent.postalAddress}</span>
            <br />
            <a className="underline" href={`mailto:${agent.email}`}>
              {agent.email}
            </a>
            {agent.phone ? <><br />{agent.phone}</> : null}
          </address>
        ) : (
          <p className="mt-3 leading-relaxed text-[var(--ink-soft)]">
            Send notices by email to{" "}
            <a className="underline" href={`mailto:${legal.contactEmail}?subject=Copyright%20notice`}>
              {legal.contactEmail}
            </a>
            .
          </p>
        )}
        {cardUrl ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            You are reporting the card at <span className="break-all">{cardUrl}</span>. Include this link in your notice.
          </p>
        ) : null}
      </section>
    </>
  );
}
