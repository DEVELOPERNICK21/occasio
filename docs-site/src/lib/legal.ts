/** Shared legal copy constants — update contact email before store submission. */
export const legal = {
  appName: "Occasio",
  website: "https://occasio-greetings.vercel.app",
  contactEmail: "developernick1@gmail.com",
  operator: "Nick Kubde",
  country: "India",
  effectiveDate: "1 September 2026",
  /**
   * DMCA designated agent (17 U.S.C. § 512(c)(2)). Register at
   * https://www.copyright.gov/dmca-directory/ and then fill this in. Until it is
   * set, the /dmca page says notices go to the contact email and does NOT claim an
   * agent is registered. Safe harbor does not apply without a registered agent.
   */
  dmcaAgent: null as null | {
    name: string;
    organization?: string;
    postalAddress: string;
    email: string;
    phone?: string;
  },
} as const;
