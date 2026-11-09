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

import { HolidayFeatureCard } from '../../src/features/create/ui/components/HolidayFeatureCard';
import { HolidaysScreen } from '../../src/features/create/ui/screens/HolidaysScreen';
import {
  HOLIDAYS,
  holidayById,
  nextOccurrence,
} from '../../src/features/create/domain/holidays';

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

describe('the Home festival card', () => {
  const diwali = nextOccurrence(holidayById('diwali')!, new Date(2026, 10, 1))!;

  it('says how close the festival is, starts it with one tap, and links to the rest', async () => {
    const onStart = jest.fn();
    const onSeeAll = jest.fn();
    const tree = await render(<HolidayFeatureCard occurrence={diwali} onStart={onStart} onSeeAll={onSeeAll} />);
    const text = textOf(tree.root);
    expect(text).toContain('Diwali is in 7 days');
    expect(text).toContain('A photo and a few honest words beat a forwarded message.');
    expect(text).not.toContain('!');
    await press(tree.root, 'Diwali is in 7 days');
    expect(onStart).toHaveBeenCalledTimes(1);
    await press(tree.root, 'See all festivals and holidays');
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it('is just the way into the list when nothing is close', async () => {
    const onStart = jest.fn();
    const onSeeAll = jest.fn();
    const tree = await render(<HolidayFeatureCard occurrence={null} onStart={onStart} onSeeAll={onSeeAll} />);
    expect(textOf(tree.root)).toContain('Festivals and holidays');
    await press(tree.root, 'Festivals and holidays.');
    expect(onSeeAll).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
    // No second link when the card itself is the link.
    expect(tree.root.findAll((n) => n.props.accessibilityLabel === 'See all festivals and holidays')).toHaveLength(0);
  });
});
