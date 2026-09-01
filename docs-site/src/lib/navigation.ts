export type NavItem = {
  title: string;
  href: string;
  description?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

/**
 * Lean developer nav — only pages needed to orient and ship.
 * Other content/*.md files remain in the repo but are not linked here.
 */
export const navigation: NavSection[] = [
  {
    title: "Start here",
    items: [
      {
        title: "Overview",
        href: "/docs",
        description: "What Occasio is and how to read these docs.",
      },
      {
        title: "Blueprint",
        href: "/docs/blueprint",
        description: "Current phase, checklist, and what to build next.",
      },
      {
        title: "Architecture",
        href: "/docs/architecture",
        description: "Mobile layers, folder rules, and dependencies.",
      },
      {
        title: "UI design principles",
        href: "/docs/ui-design-principles",
        description: "Tokens, components, mobile + web consistency — agents must read.",
      },
      {
        title: "Data flow & network",
        href: "/docs/data-flow",
        description: "Layer flow, API patterns, upload/share sequences.",
      },
      {
        title: "Product surfaces",
        href: "/docs/surfaces",
        description: "What lives in the app vs web vs backend.",
      },
    ],
  },
  {
    title: "Build",
    items: [
      {
        title: "Create feature",
        href: "/docs/create-blueprint",
        description: "Active slice — screens, API, acceptance criteria.",
      },
      {
        title: "Recipient web",
        href: "/docs/recipient-blueprint",
        description: "Public card view, OG previews, expired/404 states.",
      },
      {
        title: "Auth feature",
        href: "/docs/auth-blueprint",
        description: "Soft-auth, phone OTP, session — guest create unchanged.",
      },
      {
        title: "Vault feature",
        href: "/docs/vault-blueprint",
        description: "Save people, birthdays, contact — Firestore relationships.",
      },
      {
        title: "History feature",
        href: "/docs/history-blueprint",
        description: "Past creations, reshare — user_creations index.",
      },
      {
        title: "API contracts",
        href: "/docs/api-contracts",
        description: "Endpoints the mobile app calls.",
      },
      {
        title: "Environment & secrets",
        href: "/docs/env-strategy",
        description: "What goes in .env and what never ships to git.",
      },
    ],
  },
  {
    title: "Reference",
    items: [
      {
        title: "Design tokens",
        href: "/docs/design-tokens",
        description: "Colors, type, spacing — mirror in src/shared/theme.",
      },
      {
        title: "Wireframes",
        href: "/docs/wireframes",
        description: "Screen layouts when building UI.",
      },
      {
        title: "Changelog",
        href: "/docs/changelog",
        description: "Decisions and spec updates over time.",
      },
    ],
  },
];

/** Flat list for prev / next navigation on doc pages. */
export function flatNavigation(): NavItem[] {
  return navigation.flatMap((section) => section.items);
}

export function getAdjacentDocs(pathname: string): {
  prev: NavItem | null;
  next: NavItem | null;
} {
  const items = flatNavigation();
  const index = items.findIndex((item) => item.href === pathname);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? items[index - 1] : null,
    next: index < items.length - 1 ? items[index + 1] : null,
  };
}

export function getNavItem(pathname: string): NavItem | null {
  return flatNavigation().find((item) => item.href === pathname) ?? null;
}

export function getSectionForPath(pathname: string): string | null {
  for (const section of navigation) {
    if (section.items.some((item) => item.href === pathname)) {
      return section.title;
    }
  }
  return null;
}
