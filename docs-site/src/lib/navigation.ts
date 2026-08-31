export type NavItem = {
  title: string;
  href: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

/** Sidebar structure — add a content/*.md file for each href slug. */
export const navigation: NavSection[] = [
  {
    title: "Start here",
    items: [
      { title: "Home", href: "/" },
      { title: "Product surfaces (mobile-first)", href: "/docs/surfaces" },
      { title: "Blueprint tracker", href: "/docs/blueprint" },
      { title: "Solo dev playbook", href: "/docs/playbook" },
      { title: "How to use this site", href: "/docs/how-to-use" },
    ],
  },
  {
    title: "Phase 0 — Discovery",
    items: [{ title: "Discovery 1-pager", href: "/docs/discovery" }],
  },
  {
    title: "Phase 1 — Product",
    items: [
      { title: "PRD", href: "/docs/prd" },
      { title: "Personas & MoSCoW", href: "/docs/prd-personas-moscow" },
      { title: "Product principles", href: "/docs/product-principles" },
    ],
  },
  {
    title: "Phase 2 — UX",
    items: [
      { title: "Information architecture", href: "/docs/ia" },
      { title: "User flows (Must-haves)", href: "/docs/user-flows" },
      { title: "Low-fi wireframes", href: "/docs/wireframes" },
      { title: "Usability test script", href: "/docs/usability" },
      { title: "Design tokens & Stitch", href: "/docs/design-tokens" },
    ],
  },
  {
    title: "Phase 3 — Technical",
    items: [
      { title: "TRD", href: "/docs/trd" },
      { title: "Client architecture", href: "/docs/architecture" },
      { title: "API contracts", href: "/docs/api-contracts" },
      { title: "Environment strategy", href: "/docs/env-strategy" },
      { title: "NFR targets", href: "/docs/nfr" },
    ],
  },
  {
    title: "Phase 4 — Build",
    items: [{ title: "Create feature blueprint", href: "/docs/create-blueprint" }],
  },
  {
    title: "Decisions",
    items: [{ title: "Changelog", href: "/docs/changelog" }],
  },
];
