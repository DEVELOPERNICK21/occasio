# Wishes left, purchases and badges

## How many wishes are left

The home screen, the profile and the review step all show the same answer, so a purchase is visible where it matters.
It comes from `billing/domain/wishBalance.ts` and is read by `useWishBalance` (`billing/application`).

| Source | Where it is read | Meaning |
|---|---|---|
| Free card | `users/{uid}.freeCardsUsed` | One per account, ever |
| Pro cards | `users/{uid}.proCardTimes` | 24 in any rolling 365 days; each frees a slot a year after it was made |
| Extra wishes | RevenueCat (`occasio_wish_single` purchases) minus `users/{uid}.wishCreditsUsed` | One bought wish makes one card |
| Plan | RevenueCat's `occasio_pro` entitlement | Product (yearly or monthly), when it renews or ends |

The server owns those counters and spends them in the order **free, then Pro, then bought** (`docs-site/src/lib/cardAllowance.ts`).
The app only reads them, so the number on screen is the one that will be enforced. The limits (`FREE_CARD_LIMIT`,
`PRO_YEARLY_CARD_LIMIT`) live in `wishBalance.ts` and must match the server's.

Where it shows:

* **Home** (`WishBalanceCard`, under the Create button): "3 wishes ready" and where they come from. With none left it says what
  to do and offers "See plans". A guest, or a failed read, sees the old one-line free-card note instead of a wrong number.
* **Profile** ("Your plan and wishes"): the plan and when it renews or ends, Pro cards left this year with a bar (and the date a
  slot opens when they are all used), extra wishes bought, used and ready (and when last bought), and the free card.
* **Review step**: "This uses your free card", "This uses 1 of your 2 extra wishes", and so on, before the card is made.

It is read again when a screen comes into view and when the plan changes. Pip is not on any of these: the project keeps him
away from money screens.

## Badges

Eleven badges, all derived from real History and Vault data (`create/domain/wishJourney.ts`): first wish, 3 wishes, 10 wishes,
Vault, 5 people, 2-month streak, Thank you, Anniversary, Host (an invitation), 3 occasions, and Autopilot (auto-send armed).

Each badge has one entry that holds everything about it: how it is counted, the sentence when it is earned, how to earn it
("2 more wishes to earn this."), what Pip says, and what to do next (make a wish, or save a person). The journey card on Home
shows them in a row with the **next badge** (the one closest to done) and a way into the **Badges screen**, which lists
every badge, shows progress for a locked one and Pip's words for an earned one. The profile has a "Your badges" row that opens it.

### The celebration

When a badge is earned the person sees a pop-up on Home (`BadgeCelebration`): the medal and confetti, Pip cheering, what they
did, **Pip's own words** (the first wish names the person: "Priya will open it soon, and know you thought of them."), the next
badge to aim for, and a main button that leads on, "Make another wish" (or "Save another person" for the Vault badge). "Maybe
later" closes it.

Pip's lines are calm and concrete: no exclamation marks, no emoji, never a guilt trip, and nothing about money. A test enforces it.

### Adding a badge

Add one entry to `SPECS` in `wishJourney.ts`, an icon and colours in `ui/components/badgeStyle.ts`, and **bump
`BADGE_SET_VERSION`**. The bump matters: the first time the app sees a newer set it accepts what a person already qualifies for
without celebrating, so nobody is shown a string of pop-ups for badges they earned long ago. Only badges earned afterwards get one.
