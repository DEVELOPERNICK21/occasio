# Invitations

One link for many guests: a wedding, engagement, anniversary, birthday, baby shower, housewarming, graduation or any
party. It is a card with a different job, so it shares the card pipeline (upload, allowance, paywall, share link) and
differs only in what the host fills in and what a guest opens.

What a guest sees is in [`recipient-experience.md`](./recipient-experience.md#invitations-templatetype-invitation). The
API shape is in `docs-site/content/api-contracts.md` (`templateType: "invitation"`).

## In the app: the Invites tab

A fifth tab, **Invites**, with its own steps. The last three screens are the ones cards use, so an invitation is paid for,
uploaded and shared by exactly the same code.

| Step | Screen | What it asks |
|---|---|---|
| Home | `InviteHomeScreen` | Which occasion. Carry on with one that was started, or start over |
| Design | `InviteDesignScreen` | Only for a wedding, engagement or anniversary: Regal Indian, Sage minimal or Palace pastel, each with a swatch, what it does on opening and a live "See an example" link. The next screen has a Change row |
| 1 The day | `InviteDetailsScreen` | Name (two for a couple), a line under it, the day, the venue and address |
| 2 The plan | `InvitePlanScreen` | Up to 6 events (name, day, time, place), one-tap suggestions for the occasion, a dress code |
| 3 Replies | `InviteReplyScreen` | WhatsApp number with country code, reply-by day, the line above the names, a blessing, a note for guests |
| 4 Photos | `AddPhotosScreen` | Shared with cards. The first photo is the portrait |
| 5 Review | `PreviewScreen` | Shared with cards. Shows `InvitationSummary`, then "Create the link" |
| Done | `ShareSuccessScreen` | Shared with cards |

Every step after the first only needs what is required (names, day, venue); everything else is optional.

## Where the code is

Invitations live in the **create** feature, not a new one, because publishing is the same job as for a card and a second
feature would have had to copy or reach into create's data layer.

| What | File |
|---|---|
| Occasions, the draft, checks for each step, the server payload, reading it back for editing | `src/features/create/domain/invitation.ts` |
| `CreationDraft.invitation`, the `invitation` card type | `src/features/create/domain/types.ts` |
| Start, update (keeps the recipient name in step with the names), edit hydration | `src/features/create/application/useCreateDraft.ts` |
| Saved drafts survive a restart | `src/features/create/data/createDraftStorage.ts` |
| The request body carries `invitation` | `src/features/create/data/sparkCreationRepository.ts` |
| Screens and pieces | `src/features/create/ui/screens/Invite*Screen.tsx`, `ui/components/Invit*.tsx` |
| The tab and its stack | `src/app/navigation/InvitesNavigator.tsx`, `MainTabNavigator.tsx`, `shared/navigation/{types,FloatingTabBar}.ts(x)` |
| Date and time picking (the shared date field gained a `time` mode and a minimum day) | `src/shared/ui/DateField.tsx` |

The rules are written twice, once for the app and once for the server (`docs-site/src/lib/invitation.ts`), because they
are two packages. The API contract is the source for both; the limits (36 characters per name, 6 events, and so on) must
match.

## Behaviour worth knowing

- **One draft.** The create draft is shared, so starting an invitation replaces a half-made card, and the other way round.
  The Invites home offers "Carry on" or "Start over" for an invitation in progress.
- **Editing.** History opens an invitation's own steps (not the card photos) and saves with a PATCH, so the link stays the
  same.
- **The number is optional.** Without one, the invitation page shows no reply pass.
- **Nothing a guest types is stored.** A reply is a WhatsApp message from the guest's phone to the host's number.
- **Photos are required** (at least one), as for every card.

## The three designs

A ceremony is told in one of three scenes, chosen on the Design step and stored as `invitation.design` (`regal` by
default). They share the data, the reply pass, the venue and the photos; each has its own entrance, story and game, so
they are three different invitations, not three colour schemes. The full description is in
[`recipient-experience.md`](./recipient-experience.md#invitations-templatetype-invitation).

| Design (`design`) | Name in the app | Opening | The story | The game |
|---|---|---|---|---|
| `regal` | Baraat road | Honk the horn on a photograph of a wedding car | An ivory sheet with the photograph printed on it; each celebration is a stop on the road | Honk at stops, hang marigolds over the print |
| `sage` | Garden doors | Tap the brass boss: golden doors, then satin curtains | Walk into a photographed garden towards a fountain | Scratch a foil heart, turn cards |
| `palace` | Pink City palace | Pull a door ring | The arch fills with plum satin, a monogram draws itself, the host's photograph rests at its foot | Open the windows |

Live samples, which the app's "See an example" opens: `/c/demo-invite-wedding-regal-example`,
`/c/demo-invite-wedding-sage-example`, `/c/demo-invite-wedding-palace-example` (also `engagement` and `anniversary`).
Every other occasion has one look: `/c/demo-invite-birthday-example`.

## Adding an occasion

1. Add it to `OCCASIONS` and `OCCASION_INFO` in `docs-site/src/lib/invitation.ts` (label, how it reads in a sentence,
   whether it is a couple, the line above the names, the line between).
2. Give it a palette and a family in `docs-site/src/lib/invitationTheme.ts`, and a demo in `DEMO_PLANS`. A new design is a new
   scene: a folder in `docs-site/src/components/invitation/scenes/` with its entrance, art, stylesheet and game, a theme
   in `DESIGN_THEMES`, a line in `SCENES` (`InvitationPlayer.tsx`) and its name in both `DESIGN_INFO` tables.
3. Mirror it in `INVITATION_OCCASIONS` and `OCCASION_INFO` in the app, plus its icon and wash in `InviteOccasionTile.tsx`.
4. The tests check that every occasion has a theme, a demo, a readable palette and a tile.
