import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { HistoryDetailScreen } from '../../src/features/history/ui/screens/HistoryDetailScreen';
import type { HistoryEntry } from '../../src/features/history/domain/types';

const mockEntries: { current: HistoryEntry[] } = { current: [] };

jest.mock('../../src/shared/platform/haptics', () => ({
  triggerSuccessHaptic: jest.fn(),
  triggerCardHaptic: jest.fn(),
  triggerTabHaptic: jest.fn(),
}));
jest.mock('../../src/features/history/application/useHistory', () => ({
  useHistory: () => ({
    entries: mockEntries.current,
    isLoading: false,
    error: null,
    reload: jest.fn(),
  }),
  useDeleteHistory: () => ({ remove: jest.fn(), isDeleting: false }),
}));
jest.mock('../../src/features/auth/application/useAuth', () => ({
  useAuth: () => ({ isSignedIn: true, isLoading: false }),
  useRequireAuth: () => ({ requireAuth: (_action: string, run: () => void) => run() }),
}));
jest.mock('../../src/features/create/application/CreateDraftContext', () => ({
  useCreateDraftContext: () => ({ loadForEdit: jest.fn(async () => null) }),
}));
jest.mock('../../src/features/vault/application/useVaultPeople', () => ({
  useVaultPeople: () => ({ people: [], isLoading: false, error: null, reload: jest.fn() }),
}));
jest.mock('../../src/features/vault/application/useLinkCreationToPerson', () => ({
  useLinkCreationToPerson: () => ({ link: jest.fn(), isSaving: false, error: null }),
}));

const DAY_MS = 24 * 60 * 60 * 1000;

function entry(overrides: Partial<HistoryEntry>): HistoryEntry {
  return {
    id: 'h1',
    creationId: 'c1',
    recipientName: 'Maya Rao',
    templateType: 'birthday',
    message: 'Happy birthday, Maya',
    shareUrl: 'https://occasio.example/w/abc',
    createdAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
    expiresAt: new Date(Date.now() + 20 * DAY_MS).toISOString(),
    ...overrides,
  } as HistoryEntry;
}

function renderDetail(): string {
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };
  const props = {
    navigation,
    route: { params: { entryId: 'h1' } },
  } as unknown as React.ComponentProps<typeof HistoryDetailScreen>;
  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<HistoryDetailScreen {...props} />);
  });
  return JSON.stringify(renderer!.toJSON());
}

describe('HistoryDetailScreen', () => {
  it('offers share, copy, edit and auto-send for a live link, with a header back control', () => {
    mockEntries.current = [entry({})];
    const output = renderDetail();

    expect(output).toContain('Share again');
    expect(output).toContain('Copy link');
    expect(output).toContain('Edit card');
    expect(output).toContain('Save for auto-send');
    expect(output).toContain('Delete from History');
    expect(output).toContain('Go back');
    expect(output).not.toContain('Make a new card');
  });

  it('replaces share, copy and edit with one clear next step when the link has expired', () => {
    mockEntries.current = [
      entry({ expiresAt: new Date(Date.now() - DAY_MS).toISOString() }),
    ];
    const output = renderDetail();

    expect(output).toContain('Make a new card');
    expect(output).toContain('This link has expired');
    expect(output).not.toContain('Share again');
    expect(output).not.toContain('Copy link');
    expect(output).not.toContain('Edit card');
  });

  it('says so when the card no longer exists', () => {
    mockEntries.current = [];
    const output = renderDetail();

    expect(output).toContain('could not be found');
  });
});
