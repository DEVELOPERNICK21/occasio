import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store.get(k) ?? null),
      setItem: jest.fn(async (k: string, v: string) => void store.set(k, v)),
      removeItem: jest.fn(async (k: string) => void store.delete(k)),
      clear: jest.fn(async () => store.clear()),
      __store: store,
    },
  };
});
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({ currentUser: { getIdToken: async () => 'token' } }),
}));
jest.mock('../../src/shared/api/httpClient', () => ({
  httpClient: { post: jest.fn(), patch: jest.fn(), get: jest.fn() },
}));
jest.mock('../../src/shared/config/env', () => ({
  env: { useMockApi: false, sparkApiBaseUrl: 'https://api.test', shareBaseUrl: 'https://share.test', devRelaxedQuota: false },
  getApiBaseUrl: () => 'https://api.test',
}));
jest.mock('../../src/features/create/data/backendMode', () => ({ isSparkBackend: () => true }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { httpClient } from '../../src/shared/api/httpClient';
import { useCreateDraft } from '../../src/features/create/application/useCreateDraft';
import { readCreationDraft, writeCreationDraft } from '../../src/features/create/data/createDraftStorage';
import { createShareLinkSpark } from '../../src/features/create/data/sparkCreationRepository';
import { canGenerateShareLink } from '../../src/features/create/domain/creationRules';
import { toInvitationPayload } from '../../src/features/create/domain/invitation';
import { EMPTY_CREATION_DRAFT } from '../../src/features/create/domain/types';

type Hook = ReturnType<typeof useCreateDraft>;

async function mountDraft(): Promise<{ current: () => Hook }> {
  let latest!: Hook;
  function Probe() {
    latest = useCreateDraft();
    return null;
  }
  await act(async () => {
    TestRenderer.create(<Probe />);
  });
  return { current: () => latest };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  (httpClient.post as jest.Mock).mockReset();
});

describe('starting and filling in an invitation', () => {
  it('starts a blank invitation for the chosen occasion, with a design marker so it can be previewed', async () => {
    const draft = await mountDraft();
    await act(async () => draft.current().startInvitation('birthday'));
    const d = draft.current().draft;
    expect(d.templateType).toBe('invitation');
    expect(d.templateId).toBe('invitation');
    expect(d.invitation?.occasion).toBe('birthday');
    expect(d.photoUris).toEqual([]);
  });

  it('keeps the name the card is addressed to in step with the names', async () => {
    const draft = await mountDraft();
    await act(async () => draft.current().startInvitation('wedding'));
    await act(async () => draft.current().updateInvitation({ nameOne: 'Aarav' }));
    expect(draft.current().draft.recipientName).toBe('Aarav');
    await act(async () => draft.current().updateInvitation({ nameTwo: 'Priya' }));
    expect(draft.current().draft.recipientName).toBe('Aarav & Priya');
  });

  it('does nothing to a card that is not an invitation', async () => {
    const draft = await mountDraft();
    await act(async () => draft.current().updateInvitation({ nameOne: 'Aarav' }));
    expect(draft.current().draft.invitation).toBeNull();
    expect(draft.current().draft.recipientName).toBe('');
  });

  it('is ready to share only when the details and a photo are there', async () => {
    const draft = await mountDraft();
    await act(async () => draft.current().startInvitation('birthday'));
    await act(async () =>
      draft.current().updateInvitation({ nameOne: 'Meera', date: '2027-02-23', venueName: 'Cafe' }),
    );
    expect(canGenerateShareLink(draft.current().draft)).toBe(false);
    await act(async () => draft.current().setPhotoUris(['file:///a.jpg']));
    expect(canGenerateShareLink(draft.current().draft)).toBe(true);
  });
});

describe('the saved draft', () => {
  it('survives a restart with the invitation intact', async () => {
    const first = await mountDraft();
    await act(async () => first.current().startInvitation('wedding'));
    await act(async () =>
      first.current().updateInvitation({
        nameOne: 'Aarav',
        nameTwo: 'Priya',
        date: '2027-02-23',
        venueName: 'Hall',
        events: [{ title: 'Sangeet', date: '', time: '19:30', venue: '' }],
        blessing: 'ganesh',
        design: 'sage',
      }),
    );
    await writeCreationDraft(first.current().draft);

    const restored = await readCreationDraft();
    expect(restored?.templateType).toBe('invitation');
    expect(restored?.invitation?.nameTwo).toBe('Priya');
    expect(restored?.invitation?.events[0]?.time).toBe('19:30');
    expect(restored?.invitation?.blessing).toBe('ganesh');
    expect(restored?.invitation?.design).toBe('sage');
  });

  it('drops an invitation payload that is not valid rather than crashing', async () => {
    await AsyncStorage.setItem(
      'occasio.create.draft',
      JSON.stringify({ ...EMPTY_CREATION_DRAFT, templateType: 'invitation', templateId: 'invitation', invitation: { occasion: 'nope' } }),
    );
    const restored = await readCreationDraft();
    expect(restored?.templateType).toBe('invitation');
    expect(restored?.invitation).toBeNull();
  });

  it('ignores an invitation payload on a card that is not an invitation', async () => {
    await AsyncStorage.setItem(
      'occasio.create.draft',
      JSON.stringify({ ...EMPTY_CREATION_DRAFT, templateType: 'birthday', templateId: 'B10', recipientName: 'Mom', invitation: { occasion: 'wedding' } }),
    );
    expect((await readCreationDraft())?.invitation).toBeNull();
  });
});

describe('editing a saved invitation', () => {
  it('loads the stored invitation into the draft, with the same link', async () => {
    const stored = toInvitationPayload({
      occasion: 'wedding',
      design: 'palace',
      nameOne: 'Aarav',
      nameTwo: 'Priya',
      tagline: '',
      date: '2027-02-23',
      venueName: 'Hall',
      venueAddress: '',
      events: [],
      hostLine: '',
      rsvpCountry: '91',
      rsvpPhone: '9876543210',
      rsvpBy: '',
      blessing: 'none',
      dressCode: '',
    });
    (httpClient.get as jest.Mock).mockResolvedValue({
      creationId: 'c1',
      shareSlug: 'abc123',
      shareUrl: 'https://share.test/c/abc123',
      expiresAt: '2027-03-01T00:00:00Z',
      watermarked: false,
      templateType: 'invitation',
      templateId: 'invitation',
      recipientName: 'Aarav & Priya',
      fromName: '',
      message: 'Come',
      photoRefs: [],
      mediaUrls: ['https://cdn/1.jpg'],
      experienceMode: null,
      balloonLine: null,
      invitation: stored,
    });
    const draft = await mountDraft();
    let error: string | null = 'unset';
    await act(async () => {
      error = await draft.current().loadForEdit('c1');
    });
    expect(error).toBeNull();
    const d = draft.current().draft;
    expect(d.templateType).toBe('invitation');
    expect(d.invitation?.rsvpPhone).toBe('9876543210');
    expect(d.invitation?.design).toBe('palace');
    expect(d.editingCreationId).toBe('c1');
    expect(d.editingShareSlug).toBe('abc123');
    expect(d.message).toBe('Come');
  });

  it('refuses an invitation the server sent back without usable details', async () => {
    (httpClient.get as jest.Mock).mockResolvedValue({
      creationId: 'c1',
      shareSlug: 'abc123',
      shareUrl: 'https://share.test/c/abc123',
      expiresAt: '2027-03-01T00:00:00Z',
      watermarked: false,
      templateType: 'invitation',
      templateId: null,
      recipientName: 'x',
      fromName: '',
      message: '',
      photoRefs: [],
      mediaUrls: ['https://cdn/1.jpg'],
      experienceMode: null,
      balloonLine: null,
      invitation: null,
    });
    const draft = await mountDraft();
    let error: string | null = null;
    await act(async () => {
      error = await draft.current().loadForEdit('c1');
    });
    expect(error).toBe('This invitation could not be opened for editing.');
  });
});

describe('what is sent to the server', () => {
  it('carries the invitation, tidied, with the card details', async () => {
    (httpClient.post as jest.Mock).mockResolvedValue({ creationId: 'c1', shareSlug: 's', shareUrl: 'u', expiresAt: 'e', watermarked: false });
    const draft = await mountDraft();
    await act(async () => draft.current().startInvitation('birthday'));
    await act(async () =>
      draft.current().updateInvitation({
        nameOne: '  Meera ',
        tagline: 'turning 30',
        date: '2027-02-23',
        venueName: 'Cafe',
        rsvpPhone: '98765 43210',
      }),
    );
    await act(async () => draft.current().setPhotoUris(['file:///a.jpg']));

    await createShareLinkSpark(draft.current().draft, ['ref/1'], ['https://cdn/1.jpg'], 'token');

    const body = (httpClient.post as jest.Mock).mock.calls[0]![2] as Record<string, unknown>;
    expect(body.templateType).toBe('invitation');
    expect(body.recipientName).toBe('Meera');
    expect(body.invitation).toMatchObject({
      occasion: 'birthday',
      nameOne: 'Meera',
      nameTwo: '',
      tagline: 'turning 30',
      rsvpWhatsapp: '919876543210',
    });
  });

  it('sends nothing extra for an ordinary card', async () => {
    (httpClient.post as jest.Mock).mockResolvedValue({ creationId: 'c1', shareSlug: 's', shareUrl: 'u', expiresAt: 'e', watermarked: false });
    await createShareLinkSpark(
      { ...EMPTY_CREATION_DRAFT, templateType: 'birthday', templateId: 'B10', recipientName: 'Mom', photoUris: ['x'] },
      ['ref/1'],
      [],
      'token',
    );
    const body = (httpClient.post as jest.Mock).mock.calls[0]![2] as Record<string, unknown>;
    expect(body).not.toHaveProperty('invitation');
  });
});
