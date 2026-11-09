import { OCCASIONS } from './invitation';
import { parseDemoSlug } from './recipientCard';

describe('parseDemoSlug for invitations', () => {
  it('opens a sample invitation for every occasion', () => {
    for (const occasion of OCCASIONS) {
      const card = parseDemoSlug(`demo-invite-${occasion}-example`);
      expect(card?.templateType).toBe('invitation');
      expect(card?.invitation?.occasion).toBe(occasion);
      expect(card?.isDemo).toBe(true);
    }
  });

  it('addresses the sample to its host, never to "someone"', () => {
    expect(parseDemoSlug('demo-invite-wedding-example')?.recipientName).toBe('Aarav & Priya');
    expect(parseDemoSlug('demo-invite-birthday-example')?.recipientName).toBe('Meera');
  });

  it('opens a ceremony in each design by naming it', () => {
    expect(parseDemoSlug('demo-invite-wedding-sage-example')?.invitation?.design).toBe('sage');
    expect(parseDemoSlug('demo-invite-wedding-palace-example')?.invitation?.design).toBe('palace');
    expect(parseDemoSlug('demo-invite-engagement-sage-example')?.invitation?.design).toBe('sage');
    expect(parseDemoSlug('demo-invite-anniversary-palace-example')?.invitation?.design).toBe('palace');
  });

  it('treats anything else after the occasion as a name, in the regal design', () => {
    expect(parseDemoSlug('demo-invite-wedding-aarav-priya')?.invitation?.design).toBe('regal');
    expect(parseDemoSlug('demo-invite-wedding-regal-example')?.invitation?.design).toBe('regal');
  });

  it('keeps the short wedding form, with or without a design', () => {
    expect(parseDemoSlug('demo-wedding-aarav-priya')?.invitation?.design).toBe('regal');
    expect(parseDemoSlug('demo-wedding-sage-example')?.invitation?.design).toBe('sage');
    expect(parseDemoSlug('demo-wedding-palace-example')?.invitation?.design).toBe('palace');
  });

  it('ignores a design for an occasion that has only one look', () => {
    expect(parseDemoSlug('demo-invite-birthday-sage-example')?.invitation?.design).toBe('regal');
  });

  it('gives nothing for an occasion that does not exist', () => {
    expect(parseDemoSlug('demo-invite-funeral-example')).toBeNull();
  });

  it('still opens an ordinary demo card', () => {
    expect(parseDemoSlug('demo-mom-abc123')?.templateType).toBe('birthday');
    expect(parseDemoSlug('demo-anniversary-sam-abc123')?.templateType).toBe('anniversary');
  });
});
