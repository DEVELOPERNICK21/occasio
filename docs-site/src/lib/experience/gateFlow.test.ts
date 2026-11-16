import { OPEN_AFTER_ALL, declineLabel, gateView, nextPhase, type GateAnswer, type GatePhase } from './gateFlow';
import { WEB_HOLIDAYS } from '../holidays';
import { allMomentThemes, momentThemeFor } from './momentTheme';

const PHASES: GatePhase[] = ['asking', 'reacted', 'declined', 'opening'];

describe('what the person answers stays answered', () => {
  it('never opens the card on a decline, from any phase', () => {
    for (const phase of PHASES) {
      if (phase === 'opening') continue; // already open: nothing left to decide
      expect(nextPhase(phase, 'decline')).not.toBe('opening');
    }
  });

  it('opens the card only when the person says yes, from any phase', () => {
    for (const phase of PHASES) expect(nextPhase(phase, 'yes')).toBe('opening');
    // and opening is final: nothing taken back by a late tap
    for (const answer of ['yes', 'decline'] as GateAnswer[]) expect(nextPhase('opening', answer)).toBe('opening');
  });

  it('lets Pip react to the first No without closing or opening anything', () => {
    expect(nextPhase('asking', 'decline')).toBe('reacted');
    expect(declineLabel('asking')).toBe('No');
  });

  it('turns the second button into a real "Not now" after that reaction, and Not now closes the card', () => {
    expect(declineLabel('reacted')).toBe('Not now');
    expect(nextPhase('reacted', 'decline')).toBe('declined');
  });

  it('stays closed: more declines change nothing, and there is no second button to press', () => {
    expect(nextPhase('declined', 'decline')).toBe('declined');
    expect(declineLabel('declined')).toBeNull();
    expect(declineLabel('opening')).toBeNull();
  });

  it('never turns the second button into a "Yes" in any phase', () => {
    for (const phase of PHASES) {
      const label = declineLabel(phase);
      if (label) expect(label).toMatch(/^(No|Not now)$/);
    }
  });
});

describe('what Pip and the page say', () => {
  // The moments' own themes, and the one every festival builds from its colours.
  const themes = [...allMomentThemes(), ...Object.keys(WEB_HOLIDAYS).map((id) => momentThemeFor(id))];

  it('keeps the funny reactions: shocked after the first No, crying once the card is closed', () => {
    for (const theme of themes) {
      expect(gateView('reacted', theme.gate, 'Sam').mood).toBe('shocked');
      const closed = gateView('declined', theme.gate, 'Sam');
      expect(closed.mood).toBe('cry');
      expect(closed.title).toBe(theme.gate.declined);
      expect(closed.sub).toBe(theme.gate.declinedSub);
      expect(closed.title.length).toBeGreaterThan(0);
      expect(closed.sub.length).toBeGreaterThan(0);
    }
  });

  it('says plainly, after the joke, that the answer was heard and the card will keep', () => {
    for (const theme of themes) {
      const closed = gateView('declined', theme.gate, 'Sam');
      expect(closed.note).toBe('No problem. Your surprise will be right here whenever you want it.');
      // the other phases have no such note
      for (const phase of ['asking', 'reacted', 'opening'] as GatePhase[]) {
        expect(gateView(phase, theme.gate, 'Sam').note).toBeNull();
      }
    }
  });

  it('does not push, guilt or hurry the person once they have said not now', () => {
    for (const theme of themes) {
      const closed = gateView('declined', theme.gate, 'Sam');
      const said = `${closed.title} ${closed.sub} ${closed.note}`;
      expect(said).not.toMatch(/one tap|look what you did|are you sure|just tap|fix it|hurry|last chance|please|come on/i);
    }
    expect(OPEN_AFTER_ALL).toBe('Open it after all');
  });

  it('asks in the sender’s name, and opens with Pip happy', () => {
    for (const theme of themes) {
      expect(gateView('asking', theme.gate, 'Sam').title).toBe(`Sam ${theme.gate.hopeful}`);
      expect(gateView('asking', theme.gate, 'Sam').mood).toBe('hopeful');
      expect(gateView('opening', theme.gate, 'Sam').mood).toBe('joy');
    }
  });

  it('covers every theme, with all the copy filled in', () => {
    expect(themes.length).toBeGreaterThan(Object.keys(WEB_HOLIDAYS).length);
    for (const { gate } of themes) {
      for (const key of ['hopeful', 'hopefulSub', 'refusedOnce', 'refusedOnceSub', 'declined', 'declinedSub', 'yes'] as const) {
        expect(gate[key].trim().length).toBeGreaterThan(0);
      }
    }
  });
});
