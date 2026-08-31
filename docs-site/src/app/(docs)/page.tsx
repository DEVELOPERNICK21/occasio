import Link from "next/link";
import { navigation } from "@/lib/navigation";

export default function HomePage() {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
        Occasio · Product record
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight tracking-tight text-[var(--ink)] md:text-5xl">
        Never miss what matters.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
        <strong>Occasio is the React Native mobile app</strong> at the repo
        root. This site holds specs, blueprint, and optional landing — not the
        product UI. Edit{" "}
        <code className="rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-sm">
          src/features/
        </code>{" "}
        to ship features; edit{" "}
        <code className="rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-sm">
          docs-site/content/
        </code>{" "}
        to update records.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {navigation
          .filter((s) => s.title !== "Start here")
          .flatMap((section) =>
            section.items.slice(0, 1).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent)]"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                  {section.title}
                </p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                  {item.title}
                </p>
              </Link>
            )),
          )}
      </div>

      <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] p-5">
        <p className="font-medium text-[var(--ink)]">Next recommended step</p>
        <p className="mt-1 text-[var(--ink-soft)]">
          Mobile-first plan:{" "}
          <Link href="/docs/surfaces" className="underline text-[var(--accent)]">
            Product surfaces
          </Link>
          . Next engineering in{" "}
          <code className="text-sm">src/features/create/data/</code> — see repo{" "}
          <code className="text-sm">ARCHITECTURE.md</code>.
        </p>
      </div>
    </div>
  );
}
