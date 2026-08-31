import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  parseDemoSlug,
  templateLabel,
  type RecipientCard,
} from "@/lib/recipientCard";

type Props = {
  params: Promise<{ slug: string }>;
};

async function fetchCard(slug: string): Promise<RecipientCard | null> {
  const demo = parseDemoSlug(slug);
  if (demo) return demo;

  const apiBase = process.env.OCCASIO_API_BASE;
  if (!apiBase) return null;

  try {
    const res = await fetch(`${apiBase}/v1/cards/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Omit<RecipientCard, "isDemo">;
    return { ...data, isDemo: false };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = await fetchCard(slug);
  if (!card) {
    return { title: "Card not found" };
  }
  return {
    title: `A wish for ${card.recipientName}`,
    description: card.message ?? `Someone sent ${card.recipientName} a wish on Occasio.`,
    openGraph: {
      title: `A wish for ${card.recipientName}`,
      description: card.message ?? `A personalized wish on Occasio.`,
      type: "website",
    },
  };
}

export default async function RecipientCardPage({ params }: Props) {
  const { slug } = await params;
  const card = await fetchCard(slug);
  if (!card) notFound();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Occasio
        </p>

        <div
          className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
          style={{ boxShadow: "0 4px 24px rgba(28, 25, 20, 0.08)" }}
        >
          <div className="flex aspect-[3/4] items-center justify-center bg-[var(--accent-soft)] p-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                {templateLabel(card.templateType)}
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight text-[var(--ink)]">
                {card.recipientName}
              </h1>
              {card.message ? (
                <p className="mt-4 text-[var(--ink-soft)]">{card.message}</p>
              ) : (
                <p className="mt-4 text-[var(--muted)] italic">
                  A personalized wish is on its way.
                </p>
              )}
            </div>
          </div>

          {card.fromName && (
            <p className="border-t border-[var(--border)] px-6 py-4 text-center text-sm text-[var(--ink-soft)]">
              From {card.fromName}
            </p>
          )}
        </div>

        {card.isDemo && (
          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            Preview card — photos and animation ship with the real API.
          </p>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#174a3e]"
          >
            Make your own
          </Link>
        </div>
      </div>
    </div>
  );
}
