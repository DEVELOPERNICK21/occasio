import { DocsShell } from "@/components/DocsShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Occasio Docs",
    template: "%s · Occasio Docs",
  },
  description: "Internal product documentation for Occasio.",
  robots: { index: false, follow: false },
};

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DocsShell>{children}</DocsShell>;
}
