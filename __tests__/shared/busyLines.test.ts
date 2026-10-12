import {
  BUSY_STAGES,
  busyLine,
  isCalmBusy,
  lastBusyStageMs,
  type BusyKind,
} from '../../src/shared/mascot/busyLines';

const KINDS = Object.keys(BUSY_STAGES) as BusyKind[];

describe('busy lines', () => {
  it('starts every wait with a line at once, and changes it the longer it takes', () => {
    for (const kind of KINDS) {
      const stages = BUSY_STAGES[kind];
      expect(stages[0].fromMs).toBe(0);
      expect(stages.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < stages.length; i += 1) {
        expect(stages[i].fromMs).toBeGreaterThan(stages[i - 1].fromMs);
      }
    }
  });

  it('picks the line for how long it has been', () => {
    expect(busyLine('deleteCard', 0)).toBe('Turning off the link.');
    expect(busyLine('deleteCard', 2499)).toBe('Turning off the link.');
    expect(busyLine('deleteCard', 2500)).toBe('Taking it out of History.');
    expect(busyLine('deleteCard', 60_000)).toMatch(/Still working/);
  });

  it('always ends on a line that says it is still working, never silence', () => {
    for (const kind of KINDS) {
      const stages = BUSY_STAGES[kind];
      expect(stages[stages.length - 1].line).toMatch(/Still working|Nearly there|Keeping/);
      expect(busyLine(kind, lastBusyStageMs(kind) + 120_000)).toBe(
        stages[stages.length - 1].line,
      );
    }
  });

  it('keeps Pip calm and honest: no hype, no emoji, no promised time', () => {
    for (const kind of KINDS) {
      for (const { line } of BUSY_STAGES[kind]) {
        expect(line).not.toMatch(/!/);
        expect(line).not.toMatch(/\p{Extended_Pictographic}/u);
        expect(line).not.toMatch(/amazing|awesome|magic|almost done in/i);
        expect(line).not.toMatch(/\d+\s*(seconds|minutes)/i);
        expect(line.trim()).toBe(line);
      }
    }
  });

  it('keeps him calm, not hopping, whenever something is being removed for good', () => {
    expect(isCalmBusy('deleteCard')).toBe(true);
    expect(isCalmBusy('deleteAccount')).toBe(true);
    expect(isCalmBusy('deletePerson')).toBe(true);
    expect(isCalmBusy('creating')).toBe(false);
    expect(isCalmBusy('saving')).toBe(false);
    expect(isCalmBusy('working')).toBe(false);
  });
});
