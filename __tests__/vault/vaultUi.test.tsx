import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { AddPersonAutoSendCard } from '../../src/features/vault/ui/components/AddPersonAutoSendCard';
import { AutoSendPackCard } from '../../src/features/vault/ui/components/AutoSendPackCard';
import { ScheduledSendInboxCard } from '../../src/features/vault/ui/components/ScheduledSendInboxCard';
import { VaultPersonCard } from '../../src/features/vault/ui/components/VaultPersonCard';
import { getVaultCardTheme } from '../../src/features/vault/domain/vaultCardTheme';
import { AUTO_SEND_DELIVERY_COPY } from '../../src/features/vault/domain/vaultOccasion';
import type { VaultPerson } from '../../src/features/vault/domain/types';

function renderedText(element: React.ReactElement): string {
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return JSON.stringify(renderer!.toJSON());
}

const person: VaultPerson = {
  id: '1',
  userId: 'u',
  personName: 'Sam',
  relationshipType: 'partner',
  birthday: { month: 9, day: 6 },
  anniversary: { month: 12, day: 1 },
  whatsapp: null,
  email: null,
  autoSendBirthday: true,
  autoSendAnniversary: true,
  pack: {
    preferredTemplateId: null,
    preferredTemplateType: null,
    photoRefs: [],
    defaultMessage: 'Happy anniversary',
    fromName: null,
  },
  lastCreationId: null,
  createdAt: '',
  updatedAt: '',
};

describe('vault auto-send UI copy', () => {
  it('shows both armed occasions and honest delivery copy on the list card', () => {
    const output = renderedText(
      <VaultPersonCard
        person={person}
        theme={getVaultCardTheme('partner')}
        occasion={{ icon: '', headline: 'Anniversary in 3 days', hasDate: true }}
        autoSendBirthday
        autoSendAnniversary
        birthdayDisabled={false}
        anniversaryDisabled={false}
        onBirthdayToggle={() => undefined}
        onAnniversaryToggle={() => undefined}
        onOpenVault={() => undefined}
        onNote={() => undefined}
        onMenu={() => undefined}
      />,
    );

    expect(output).toContain('Birthday · Anniversary');
    expect(output).toContain(AUTO_SEND_DELIVERY_COPY);
    expect(output.toLowerCase()).not.toContain('coming soon');
  });

  it('labels a waiting send without coming-soon copy', () => {
    const output = renderedText(
      <ScheduledSendInboxCard
        personName="Sam"
        occasionLabel="Birthday"
        deadlineLabel="4 hours left to review"
        status="review"
        onPress={() => undefined}
      />,
    );

    expect(output).toContain('Waiting for review');
    expect(output).toContain('Sam');
    expect(output).toContain('Birthday');
    expect(output.toLowerCase()).not.toContain('coming soon');
  });

  it('labels birthday and anniversary arm cards', () => {
    const birthday = renderedText(
      <AddPersonAutoSendCard
        title="Arm birthday auto-send"
        enabled={false}
        disabled={false}
        onToggle={() => undefined}
      />,
    );
    const anniversary = renderedText(
      <AddPersonAutoSendCard
        title="Arm anniversary auto-send"
        enabled
        disabled={false}
        onToggle={() => undefined}
      />,
    );

    expect(birthday).toContain('Arm birthday auto-send');
    expect(birthday).toContain(AUTO_SEND_DELIVERY_COPY);
    expect(anniversary).toContain('Arm anniversary auto-send');
  });

  it('summarizes pack message and notes photos come from last card', () => {
    const output = renderedText(
      <AutoSendPackCard
        pack={person.pack}
        lastCreationId={null}
        editing={false}
        message=""
        onChangeMessage={() => undefined}
      />,
    );

    expect(output).toContain('Happy anniversary');
    expect(output).toContain('Photos from last card or Create');
  });

  it('shows the edit-pack photo note while editing', () => {
    const output = renderedText(
      <AutoSendPackCard
        pack={person.pack}
        lastCreationId={null}
        editing
        message="Hello"
        onChangeMessage={() => undefined}
      />,
    );

    expect(output).toContain('Photos come from your last card or the Create flow');
  });
});
