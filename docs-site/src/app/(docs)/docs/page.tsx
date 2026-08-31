import Link from "next/link";
import { DocBreadcrumb } from "@/components/DocBreadcrumb";
import { DocPager } from "@/components/DocPager";
import { navigation } from "@/lib/navigation";

const readingOrder = [
  { step: 1, href: "/docs/blueprint", label: "Check the blueprint" },
  { step: 2, href: "/docs/architecture", label: "Learn the code layout" },
  { step: 3, href: "/docs/create-blueprint", label: "Ship the active feature" },
];

export default function DocsHomePage() {
  return (
    <>
      <DocBreadcrumb pathname="/docs" />

      <header className="doc-header">
        <h1>Developer guide</h1>
        <p className="doc-lead">
          Everything you need to orient on Occasio and ship the mobile app. Read in
          order the first time — then jump to Build or Reference as needed.
        </p>
      </header>

      <section className="doc-callout">
        <p className="doc-callout-title">Product in one line</p>
        <p>
          Occasio is a React Native app: save people once, send personalized digital
          wishes on the right day. Engineering lives in <code>src/</code> at the repo
          root — not on this site.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="doc-section-title">Read first</h2>
        <ol className="mt-3 space-y-2">
          {readingOrder.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="doc-link-row">
                <span className="doc-step">{item.step}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="doc-section-title">All pages</h2>
        <div className="mt-4 space-y-6">
          {navigation
            .filter((section) => section.title !== "Start here" || true)
            .map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--docs-muted)]">
                  {section.title}
                </h3>
                <ul className="mt-2 divide-y divide-[var(--docs-border)] rounded-lg border border-[var(--docs-border)] bg-[var(--docs-bg)]">
                  {section.items
                    .filter((item) => item.href !== "/docs")
                    .map((item) => (
                      <li key={item.href}>
                        <Link href={item.href} className="block px-4 py-3 transition hover:bg-[var(--docs-surface)]">
                          <p className="text-sm font-medium text-[var(--docs-ink)]">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="mt-0.5 text-xs text-[var(--docs-muted)]">
                              {item.description}
                            </p>
                          )}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
        </div>
      </section>

      <DocPager />
    </>
  );
}
