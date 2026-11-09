import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

// Only used to re-open a saved card; it pulls in the sign-in SDK, which a draft test does not need.
jest.mock('../../src/features/create/data/creationRepository', () => ({
  fetchOwnedCreation: jest.fn(),
}));

import { useCreateDraft } from '../../src/features/create/application/useCreateDraft';

async function mountHook() {
  const seen: { current: ReturnType<typeof useCreateDraft> | null } = { current: null };
  function Probe() {
    seen.current = useCreateDraft();
    return null;
  }
  await act(async () => {
    TestRenderer.create(<Probe />);
  });
  return seen as { current: ReturnType<typeof useCreateDraft> };
}

describe('starting a card for a festival', () => {
  it('sets the card type and its stand-in occasion, and leaves the frame to be chosen', async () => {
    const hook = await mountHook();
    await act(async () => hook.current.startFromHoliday('diwali'));
    expect(hook.current.draft).toMatchObject({
      templateType: 'diwali',
      occasion: 'just_because',
      templateId: null,
      photoUris: [],
      recipientName: '',
    });
  });

  it('uses the festival’s usual audience, or a neutral one so frames can be listed', async () => {
    const hook = await mountHook();
    await act(async () => hook.current.startFromHoliday('valentines_day'));
    expect(hook.current.draft.audience).toBe('partner');
    expect(hook.current.draft.occasion).toBe('anniversary');
    await act(async () => hook.current.startFromHoliday('diwali'));
    expect(hook.current.draft.audience).toBe('someone_special');
  });

  it('keeps who it is for when they already said, and starts clean otherwise', async () => {
    const hook = await mountHook();
    await act(async () => hook.current.startFromAudience('mom'));
    await act(async () => hook.current.startFromHoliday('holi', true));
    expect(hook.current.draft).toMatchObject({ audience: 'mom', templateType: 'holi' });
    await act(async () => hook.current.startFromAudience('dad'));
    await act(async () => hook.current.startFromHoliday('holi'));
    expect(hook.current.draft.audience).toBe('someone_special');
  });

  it('does nothing for an unknown festival', async () => {
    const hook = await mountHook();
    await act(async () => hook.current.startFromHoliday('not_a_festival' as never));
    expect(hook.current.draft.templateType).toBeNull();
  });

  it('is a draft that survives being stored and read back', async () => {
    const { parseTemplateType } = jest.requireActual('../../src/features/create/domain/templates');
    const hook = await mountHook();
    await act(async () => hook.current.startFromHoliday('eid_al_fitr'));
    const stored = JSON.parse(JSON.stringify(hook.current.draft));
    expect(parseTemplateType(stored.templateType)).toBe('eid_al_fitr');
  });
});
