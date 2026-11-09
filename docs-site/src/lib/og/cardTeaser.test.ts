import { INVITATION_TEMPLATE, demoInvitation } from '../invitation';
import type { RecipientCard } from '../recipientCard';
import { teaserInputForCard } from './cardTeaser';

const base: RecipientCard = {
  recipientName: 'Maya',
  message: 'A secret',
  templateType: 'birthday',
  templateId: null,
  fromName: 'Sam',
  isDemo: false,
};

describe('teaserInputForCard', () => {
  it('describes an ordinary card by its greeting, recipient and sender, never its message', () => {
    const input = teaserInputForCard(base);
    expect(input).toEqual({ kind: 'card', greeting: 'Happy Birthday,', recipientName: 'Maya', fromName: 'Sam' });
    expect(JSON.stringify(input)).not.toContain('secret');
  });

  it('describes an invitation by its names and day', () => {
    const input = teaserInputForCard({
      ...base,
      templateType: INVITATION_TEMPLATE,
      invitation: demoInvitation('birthday'),
    });
    expect(input.kind).toBe('invitation');
  });

  it('falls back to a plain card when an invitation has no details', () => {
    expect(teaserInputForCard({ ...base, templateType: INVITATION_TEMPLATE, invitation: null }).kind).toBe('card');
  });
});
