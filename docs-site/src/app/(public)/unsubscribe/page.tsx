import type { Metadata } from "next";
import { contact } from "@/lib/contact";
import { UnsubscribeButton } from "./UnsubscribeButton";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ t?: string }> };

export default async function UnsubscribePage({ searchParams }: Props) {
  const { t } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--ink)]">
        Unsubscribe from Occasio emails
      </h1>
      {t ? (
        <>
          <p className="mt-4 text-[var(--ink-soft)]">
            Confirm and we will stop emailing this address right away. Cards other people send you
            through Occasio will no longer be delivered by email.
          </p>
          <div className="mt-6">
            <UnsubscribeButton token={t} />
          </div>
        </>
      ) : (
        <p className="mt-4 text-[var(--ink-soft)]">
          This link is incomplete. Open it from the email you received, or write to{" "}
          <a className="underline" href={contact.mailto}>
            {contact.email}
          </a>{" "}
          and we will remove you.
        </p>
      )}
    </div>
  );
}
