import {
  ACTIVE_TAB_WIDTH,
  MIN_TAB_WIDTH,
  activeWidthFor,
  pillSlot,
  restingWidthFor,
  tabSlot,
} from '../../src/shared/navigation/tabBarGeometry';

const COUNT = 4;
const slots = (pos: number, inner: number) =>
  Array.from({ length: COUNT }, (_, index) => tabSlot(pos, index, inner, COUNT));

describe('tab bar geometry', () => {
  it('fills the bar exactly, with no gaps or overlaps, wherever the pill is', () => {
    for (const inner of [272, 312, 342, 420]) {
      for (const pos of [0, 0.25, 0.5, 1, 1.4, 2, 2.75, 3]) {
        const all = slots(pos, inner);
        const total = all.reduce((sum, slot) => sum + slot.width, 0);
        expect(total).toBeCloseTo(inner, 6);
        expect(all[0].left).toBeCloseTo(0, 6);
        for (let i = 1; i < COUNT; i += 1) {
          expect(all[i].left).toBeCloseTo(all[i - 1].left + all[i - 1].width, 6);
        }
      }
    }
  });

  it('gives the tab the pill rests on the wide width and the others the same narrow one', () => {
    const inner = 342;
    for (let active = 0; active < COUNT; active += 1) {
      const all = slots(active, inner);
      expect(all[active].width).toBeCloseTo(ACTIVE_TAB_WIDTH, 6);
      expect(all[active].activeness).toBe(1);
      const narrow = restingWidthFor(inner, COUNT);
      all.filter((_, i) => i !== active).forEach((slot) => {
        expect(slot.width).toBeCloseTo(narrow, 6);
        expect(slot.activeness).toBe(0);
      });
    }
  });

  it('puts the pill exactly over the tab it rests on', () => {
    const inner = 342;
    for (let active = 0; active < COUNT; active += 1) {
      const pill = pillSlot(active, inner, COUNT);
      const tab = tabSlot(active, active, inner, COUNT);
      expect(pill.left).toBeCloseTo(tab.left, 6);
      expect(pill.width).toBeCloseTo(tab.width, 6);
    }
  });

  it('moves smoothly: halfway between two tabs they share the width equally', () => {
    const all = slots(0.5, 342);
    expect(all[0].activeness).toBeCloseTo(0.5, 6);
    expect(all[1].activeness).toBeCloseTo(0.5, 6);
    expect(all[0].width).toBeCloseTo(all[1].width, 6);
  });

  it('never lets a tab get narrower than a thumb can hit, even on a very small phone', () => {
    const inner = 220;
    const wide = activeWidthFor(inner, COUNT);
    expect(wide).toBeLessThan(ACTIVE_TAB_WIDTH);
    for (const slot of slots(1, inner)) {
      expect(slot.width).toBeGreaterThanOrEqual(MIN_TAB_WIDTH - 1e-9);
    }
  });

  it('stays on the bar if the spring overshoots either end', () => {
    for (const pos of [-0.2, 3.2]) {
      const pill = pillSlot(pos, 342, COUNT);
      expect(pill.left).toBeGreaterThanOrEqual(0);
      expect(pill.left + pill.width).toBeLessThanOrEqual(342 + 1e-6);
    }
  });
});
