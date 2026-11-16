import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

const mockDraftContext = jest.fn();
jest.mock('../../src/features/create/application/CreateDraftContext', () => ({
  useCreateDraftContext: () => mockDraftContext(),
}));
jest.mock('../../src/shared/platform/haptics', () => ({
  triggerSuccessHaptic: jest.fn(),
  triggerCardHaptic: jest.fn(),
}));
// The shared analytics module reads stored consent, so it needs a storage to read from.
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

jest.mock('../../src/shared/analytics/events', () => ({
  ...jest.requireActual('../../src/shared/analytics/events'),
  trackEvent: jest.fn(),
}));

import { UpcomingHolidays } from '../../src/features/create/ui/components/UpcomingHolidays';
import { HolidaysScreen } from '../../src/features/create/ui/screens/HolidaysScreen';
import { HOLIDAYS, comingUpHolidays } from '../../src/features/create/domain/holidays';

const navigate = jest.fn();
const goBack = jest.fn();
const navigation = { navigate, goBack } as never;

async function render(element: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(element);
  });
  return renderer;
}

const press = async (root: ReactTestInstance, label: string) => {
  const target = root.findAll((n) => n.props.accessibilityLabel?.startsWith?.(label) && typeof n.props.onPress === 'function')[0];
  expect(target).toBeDefined();
  await act(async () => {
    target!.props.onPress();
  });
};

const textOf = (root: ReactTestInstance) =>
  root
    .findAll((node) => (node.type as unknown) === 'Text')
    .map((node) => node.children.join(''))
    .join('\n');

beforeEach(() => {
  navigate.mockReset();
  goBack.mockReset();
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 10, 9, 10, 0, 0));
});
afterEach(() => jest.useRealTimers());

describe('the festivals list', () => {
  it('shows every festival, grouped, with the next one first under Coming up', async () => {
    const startFromHoliday = jest.fn();
    mockDraftContext.mockReturnValue({ startFromHoliday });
    const route = { key: 'k', name: 'Holidays' } as never;
    const tree = await render(<HolidaysScreen navigation={navigation} route={route} />);
    const text = textOf(tree.root);
    expect(text).toContain('Festivals and holidays');
    expect(text).toContain('Coming up');
    for (const heading of ['Hindu festivals', 'New years and harvest', 'Eid and Ramadan', 'Around the world']) {
      expect(text).toContain(heading);
    }
    for (const holiday of HOLIDAYS) expect(text).toContain(holiday.label);
    // Diwali was yesterday: still offered, as a late wish, with the next one dated a year on.
    expect(text).toContain('Yesterday');
    expect(text).toContain('Dates of festivals that follow the moon can differ by a day');
  });

  it('starts a card for the festival that is tapped, and goes on to the photo', async () => {
    const startFromHoliday = jest.fn();
    mockDraftContext.mockReturnValue({ startFromHoliday });
    const route = { key: 'k', name: 'Holidays' } as never;
    const tree = await render(<HolidaysScreen navigation={navigation} route={route} />);
    await press(tree.root, 'Holi.');
    expect(startFromHoliday).toHaveBeenCalledWith('holi', false);
    expect(navigate).toHaveBeenCalledWith('AddPhotos');
  });

  it('keeps who it is for when it was opened from the moment step', async () => {
    const startFromHoliday = jest.fn();
    mockDraftContext.mockReturnValue({ startFromHoliday });
    const route = { key: 'k', name: 'Holidays', params: { fromOccasion: true } } as never;
    const tree = await render(<HolidaysScreen navigation={navigation} route={route} />);
    await press(tree.root, 'Halloween.');
    expect(startFromHoliday).toHaveBeenCalledWith('halloween', true);
  });
});

describe('the upcoming festivals strip', () => {
  const now = new Date(2026, 10, 9, 10, 0, 0);
  const items = comingUpHolidays(now);

  it('shows several festivals with how soon they are, so none has to be searched for', async () => {
    const tree = await render(<UpcomingHolidays items={items} now={now} onPick={jest.fn()} onSeeAll={jest.fn()} />);
    const text = textOf(tree.root);
    expect(text).toContain('Festivals coming up');
    for (const label of ['Diwali', 'Bhai Dooj', 'Guru Nanak Jayanti', 'Christmas', "New Year's Eve", 'New Year']) {
      expect(text).toContain(label);
    }
    expect(text).toContain('Yesterday');
    expect(text).toContain('In 2 days');
    expect(text).toContain('Fri 25 Dec');
    expect(text).not.toContain('!');
  });

  it('starts a wish for the festival that is tapped', async () => {
    const onPick = jest.fn();
    const tree = await render(<UpcomingHolidays items={items} now={now} onPick={onPick} onSeeAll={jest.fn()} />);
    await press(tree.root, 'Bhai Dooj.');
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0]![0]).toMatchObject({ id: 'bhai_dooj', label: 'Bhai Dooj' });
  });

  it('opens the whole list from See all', async () => {
    const onSeeAll = jest.fn();
    const tree = await render(<UpcomingHolidays items={items} now={now} onPick={jest.fn()} onSeeAll={onSeeAll} />);
    await press(tree.root, 'See all festivals and holidays');
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it('is only a way into the list when nothing is coming up', async () => {
    const onPick = jest.fn();
    const onSeeAll = jest.fn();
    const tree = await render(<UpcomingHolidays items={[]} now={now} onPick={onPick} onSeeAll={onSeeAll} />);
    expect(textOf(tree.root)).toContain('Festivals and holidays');
    expect(textOf(tree.root)).not.toContain('Festivals coming up');
    await press(tree.root, 'Festivals and holidays');
    expect(onSeeAll).toHaveBeenCalledTimes(1);
    expect(onPick).not.toHaveBeenCalled();
  });
});
