import { INVITATION_TEMPLATE } from '../invitation';
import { wishGreeting, type RecipientCard } from '../recipientCard';
import type { TeaserInput } from './teaser';

/** What the link preview of an opened-up card says: the one place that decides it, for the title and the image. */
export function teaserInputForCard(card: RecipientCard): TeaserInput {
  if (card.templateType === INVITATION_TEMPLATE && card.invitation) {
    return { kind: 'invitation', invitation: card.invitation };
  }
  return {
    kind: 'card',
    greeting: wishGreeting(card.templateType),
    recipientName: card.recipientName,
    fromName: card.fromName,
  };
}
