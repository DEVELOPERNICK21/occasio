import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";

export const metadata: Metadata = {
  title: {
    default: "Occasio — Never miss what matters",
    template: "%s · Occasio",
  },
  description:
    "Save the people who matter once. Occasio sends personalized digital wishes on birthdays, anniversaries, and every occasion — automatically.",
  openGraph: {
    title: "Occasio — Never miss what matters",
    description:
      "Personalized digital wishes, sent on the right day. Save people once, never forget again.",
    type: "website",
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicShell>{children}</PublicShell>;
}
