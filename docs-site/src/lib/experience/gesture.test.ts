import { classifyGesture, FLICK_MAX_MS, SLIDE_MIN, TAP_MAX_MOVE, TAP_MAX_MS } from './gesture';

describe('classifyGesture', () => {
  it('counts a quick touch that barely moves as a tap', () => {
    expect(classifyGesture({ dx: 0, dy: 0, ms: 90 })).toBe('tap');
    expect(classifyGesture({ dx: 4, dy: -6, ms: 200 })).toBe('tap');
    expect(classifyGesture({ dx: TAP_MAX_MOVE, dy: TAP_MAX_MOVE, ms: TAP_MAX_MS })).toBe('tap');
  });

  it('does not count a long press without movement as a tap', () => {
    expect(classifyGesture({ dx: 0, dy: 0, ms: TAP_MAX_MS + 1 })).toBe('none');
  });

  it('counts a long sideways drag as a slide, in the direction it went', () => {
    expect(classifyGesture({ dx: SLIDE_MIN, dy: 5, ms: 700 })).toBe('slide-right');
    expect(classifyGesture({ dx: -SLIDE_MIN - 20, dy: -8, ms: 900 })).toBe('slide-left');
  });

  it('counts a short but quick flick as a slide', () => {
    expect(classifyGesture({ dx: -40, dy: 2, ms: FLICK_MAX_MS })).toBe('slide-left');
    expect(classifyGesture({ dx: 40, dy: 2, ms: 120 })).toBe('slide-right');
  });

  it('ignores a short, slow drag: not a tap and not a slide', () => {
    expect(classifyGesture({ dx: 40, dy: 0, ms: 600 })).toBe('none');
    expect(classifyGesture({ dx: 30, dy: 0, ms: 100 })).toBe('none');
  });

  it('leaves vertical scrolling alone, and diagonal wobbles too', () => {
    expect(classifyGesture({ dx: 12, dy: 140, ms: 300 })).toBe('none');
    expect(classifyGesture({ dx: 80, dy: 90, ms: 300 })).toBe('none');
    expect(classifyGesture({ dx: 80, dy: 80, ms: 300 })).toBe('none');
  });

  it('is symmetric, so left and right are treated the same', () => {
    for (const dx of [20, 40, 64, 120]) {
      for (const ms of [80, 260, 600]) {
        const right = classifyGesture({ dx, dy: 3, ms });
        const left = classifyGesture({ dx: -dx, dy: 3, ms });
        expect(left.replace('left', 'right')).toBe(right);
      }
    }
  });
});
