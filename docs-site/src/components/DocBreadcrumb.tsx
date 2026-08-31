import Link from "next/link";
import { getNavItem, getSectionForPath } from "@/lib/navigation";

type Props = {
  pathname: string;
};

export function DocBreadcrumb({ pathname }: Props) {
  const item = getNavItem(pathname);
  const section = getSectionForPath(pathname);

  if (!item) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--docs-muted)]">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/docs" className="hover:text-[var(--docs-accent)]">
            Docs
          </Link>
        </li>
        {section && item.href !== "/docs" && (
          <>
            <li aria-hidden>/</li>
            <li>{section}</li>
          </>
        )}
        {item.href !== "/docs" && (
          <>
            <li aria-hidden>/</li>
            <li className="font-medium text-[var(--docs-ink)]">{item.title}</li>
          </>
        )}
      </ol>
    </nav>
  );
}
