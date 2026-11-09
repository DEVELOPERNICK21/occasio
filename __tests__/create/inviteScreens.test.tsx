import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

const mockDraftContext = jest.fn();
jest.mock('../../src/features/create/application/CreateDraftContext', () => ({
  useCreateDraftContext: () => mockDraftContext(),
}));

import { ScreenHeaderAction } from '../../src/shared/ui/ScreenHeaderAction';
import { InvitationSummary } from '../../src/features/create/ui/components/InvitationSummary';
import { InviteDesignScreen } from '../../src/features/create/ui/screens/InviteDesignScreen';
import { InviteDetailsScreen } from '../../src/features/create/ui/screens/InviteDetailsScreen';
import { InviteHomeScreen } from '../../src/features/create/ui/screens/InviteHomeScreen';
import { InvitePlanScreen } from '../../src/features/create/ui/screens/InvitePlanScreen';
import { InviteReplyScreen } from '../../src/features/create/ui/screens/InviteReplyScreen';
import {
  INVITATION_OCCASIONS,
  emptyInvitation,
  type InvitationDraft,
} from '../../src/features/create/domain/invitation';
import { EMPTY_CREATION_DRAFT } from '../../src/features/create/domain/types';

const navigate = jest.fn();
const goBack = jest.fn();
// The screens only use these two calls; the rest of the navigation prop is not needed.
const navigation = { navigate, goBack } as never;
const route = { key: 'k', name: 'x' } as never;

function draftWith(invitation: InvitationDraft | null, extra: Record<string, unknown> = {}) {
  return {
    ...EMPTY_CREATION_DRAFT,
    templateType: invitation ? 'invitation' : null,
    templateId: invitation ? 'invitation' : null,
    invitation,
    ...extra,
  };
}

function setContext(draft: ReturnType<typeof draftWith>) {
  const actions = {
    startInvitation: jest.fn(),
    updateInvitation: jest.fn(),
    setMessage: jest.fn(),
    reset: jest.fn(),
  };
  mockDraftContext.mockReturnValue({ draft, ...actions });
  return actions;
}

async function render(element: React.ReactElement) {
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(element);
  });
  return renderer;
}

const byLabel = (root: ReactTestInstance, label: string) =>
  root.findAll((node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function');

const nextAction = (root: ReactTestInstance) => root.findByType(ScreenHeaderAction);

const textOf = (root: ReactTestInstance) =>
  root
    .findAll((node) => (node.type as unknown) === 'Text')
    .map((node) => node.children.join(''))
    .join('\n');

beforeEach(() => {
  navigate.mockReset();
  goBack.mockReset();
});

describe('the Invitations home', () => {
  it('offers every occasion', async () => {
    setContext(draftWith(null));
    const tree = await render(<InviteHomeScreen navigation={navigation} route={route} />);
    for (const label of ['Wedding', 'Engagement', 'Anniversary', 'Birthday', 'Baby shower', 'Housewarming', 'Graduation', 'Party']) {
      expect(textOf(tree.root)).toContain(label);
    }
    expect(INVITATION_OCCASIONS).toHaveLength(8);
  });

  it('starts that occasion and goes to the first step when one is tapped', async () => {
    const actions = setContext(draftWith(null));
    const tree = await render(<InviteHomeScreen navigation={navigation} route={route} />);
    const tile = tree.root.findAll(
      (node) => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith('Birthday invitation'),
    )[0]!;
    await act(async () => tile.props.onPress());
    expect(actions.startInvitation).toHaveBeenCalledWith('birthday');
    expect(navigate).toHaveBeenCalledWith('InviteDetails');
  });

  it('asks a ceremony which design first, and sends everything else straight to the details', async () => {
    const actions = setContext(draftWith(null));
    const tree = await render(<InviteHomeScreen navigation={navigation} route={route} />);
    const tile = (label: string) =>
      tree.root.findAll(
        (node) => typeof node.props.accessibilityLabel === 'string' && node.props.accessibilityLabel.startsWith(label),
      )[0]!;
    await act(async () => tile('Wedding invitation').props.onPress());
    expect(actions.startInvitation).toHaveBeenLastCalledWith('wedding');
    expect(navigate).toHaveBeenLastCalledWith('InviteDesign');
    await act(async () => tile('Anniversary invitation').props.onPress());
    expect(navigate).toHaveBeenLastCalledWith('InviteDesign');
    await act(async () => tile('Party invitation').props.onPress());
    expect(navigate).toHaveBeenLastCalledWith('InviteDetails');
  });

  it('offers to carry on with an invitation that was started', async () => {
    const actions = setContext(draftWith({ ...emptyInvitation('wedding'), nameOne: 'Aarav', nameTwo: 'Priya', date: '2027-02-23' }));
    const tree = await render(<InviteHomeScreen navigation={navigation} route={route} />);
    const text = textOf(tree.root);
    expect(text).toContain('Aarav & Priya');
    expect(text).toContain('Carry on');
    expect(text).toContain('Start over');
    expect(actions.reset).not.toHaveBeenCalled();
    await act(async () => tree.root.findAll((node) => node.props.label === 'Start over')[0]!.props.onPress());
    expect(actions.reset).toHaveBeenCalledTimes(1);
    await act(async () => tree.root.findAll((node) => node.props.label === 'Carry on')[0]!.props.onPress());
    expect(navigate).toHaveBeenCalledWith('InviteDetails');
  });

  it('does not offer to carry on with an invitation that is being edited', async () => {
    setContext(draftWith({ ...emptyInvitation('wedding'), nameOne: 'A' }, { editingCreationId: 'c1' }));
    const tree = await render(<InviteHomeScreen navigation={navigation} route={route} />);
    expect(textOf(tree.root)).not.toContain('Carry on');
  });
});

describe('the design choice', () => {
  it('shows the three designs, with the chosen one marked', async () => {
    setContext(draftWith({ ...emptyInvitation('wedding'), design: 'sage' }));
    const tree = await render(<InviteDesignScreen navigation={navigation} route={route} />);
    const radios = tree.root.findAll((node) => node.props.accessibilityRole === 'radio' && typeof node.props.onPress === 'function');
    expect(radios).toHaveLength(3);
    const text = textOf(tree.root);
    for (const label of ['Baraat road', 'Garden doors', 'Pink City palace']) expect(text).toContain(label);
    expect(radios.map((node) => Boolean(node.props.accessibilityState?.selected))).toEqual([false, true, false]);
  });

  it('records the design that is tapped', async () => {
    const actions = setContext(draftWith(emptyInvitation('wedding')));
    const tree = await render(<InviteDesignScreen navigation={navigation} route={route} />);
    const palace = tree.root.findAll(
      (node) => node.props.accessibilityRole === 'radio' && String(node.props.accessibilityLabel).startsWith('Pink City palace'),
    )[0]!;
    await act(async () => palace.props.onPress());
    expect(actions.updateInvitation).toHaveBeenCalledWith({ design: 'palace' });
  });

  it('offers a live example of each design, and goes on to the details', async () => {
    setContext(draftWith(emptyInvitation('wedding')));
    const tree = await render(<InviteDesignScreen navigation={navigation} route={route} />);
    const links = tree.root.findAll((node) => node.props.accessibilityRole === 'link' && typeof node.props.onPress === 'function');
    expect(links).toHaveLength(3);
    await act(async () => tree.root.findAll((node) => node.props.label === 'Continue')[0]!.props.onPress());
    expect(navigate).toHaveBeenCalledWith('InviteDetails');
  });

  it('opens the example for the design it belongs to', async () => {
    const openURL = jest.spyOn(require('react-native').Linking, 'openURL').mockResolvedValue(true);
    setContext(draftWith(emptyInvitation('wedding')));
    const tree = await render(<InviteDesignScreen navigation={navigation} route={route} />);
    const links = tree.root.findAll((node) => node.props.accessibilityRole === 'link' && typeof node.props.onPress === 'function');
    await act(async () => links[1]!.props.onPress());
    expect(openURL).toHaveBeenCalledWith(expect.stringMatching(/\/c\/demo-invite-wedding-sage-example$/));
    openURL.mockRestore();
  });

  it('sends the person back to the start when the draft has gone', async () => {
    setContext(draftWith(null));
    const tree = await render(<InviteDesignScreen navigation={navigation} route={route} />);
    expect(textOf(tree.root)).toContain('This invitation was cleared');
  });
});

describe('the first step', () => {
  it('shows the chosen design and a way to change it, for a ceremony only', async () => {
    setContext(draftWith({ ...emptyInvitation('wedding'), design: 'palace' }));
    let tree = await render(<InviteDetailsScreen navigation={navigation} route={route} />);
    expect(textOf(tree.root)).toContain('Pink City palace');
    await act(async () =>
      tree.root.findAll((node) => String(node.props.accessibilityLabel).startsWith('Design: Pink City palace'))[0]!.props.onPress(),
    );
    expect(navigate).toHaveBeenCalledWith('InviteDesign');

    setContext(draftWith(emptyInvitation('birthday')));
    tree = await render(<InviteDetailsScreen navigation={navigation} route={route} />);
    expect(textOf(tree.root)).not.toContain('Change');
    // Every occasion can still open an example.
    expect(tree.root.findAll((node) => node.props.accessibilityRole === 'link')).not.toHaveLength(0);
  });

  it('asks for both names for a wedding and one for a birthday', async () => {
    setContext(draftWith(emptyInvitation('wedding')));
    let tree = await render(<InviteDetailsScreen navigation={navigation} route={route} />);
    expect(textOf(tree.root)).toContain('Second name');

    setContext(draftWith(emptyInvitation('birthday')));
    tree = await render(<InviteDetailsScreen navigation={navigation} route={route} />);
    expect(textOf(tree.root)).not.toContain('Second name');
  });

  it('keeps Next off until the names, day and venue are there, and says what is missing', async () => {
    setContext(draftWith(emptyInvitation('wedding')));
    const tree = await render(<InviteDetailsScreen navigation={navigation} route={route} />);
    expect(nextAction(tree.root).props.disabled).toBe(true);
    expect(textOf(tree.root)).toContain('Add both names');
  });

  it('goes on to the plan once it is ready', async () => {
    setContext(
      draftWith({ ...emptyInvitation('wedding'), nameOne: 'Aarav', nameTwo: 'Priya', date: '2027-02-23', venueName: 'Hall' }),
    );
    const tree = await render(<InviteDetailsScreen navigation={navigation} route={route} />);
    expect(nextAction(tree.root).props.disabled).toBe(false);
    await act(async () => nextAction(tree.root).props.onPress());
    expect(navigate).toHaveBeenCalledWith('InvitePlan');
  });

  it('writes what is typed into the invitation', async () => {
    const actions = setContext(draftWith(emptyInvitation('wedding')));
    const tree = await render(<InviteDetailsScreen navigation={navigation} route={route} />);
    const first = tree.root.findAll((node) => node.props.placeholder === 'Aarav' && typeof node.props.onChangeText === 'function')[0]!;
    await act(async () => first.props.onChangeText('Aarav'));
    expect(actions.updateInvitation).toHaveBeenCalledWith({ nameOne: 'Aarav' });
  });

  it('sends the person back to the start when the draft has gone', async () => {
    setContext(draftWith(null));
    const tree = await render(<InviteDetailsScreen navigation={navigation} route={route} />);
    expect(textOf(tree.root)).toContain('This invitation was cleared');
  });
});

describe('the plan', () => {
  it('adds an event from a suggestion in one tap, and stops offering it', async () => {
    const actions = setContext(draftWith({ ...emptyInvitation('wedding'), date: '2027-02-23' }));
    const tree = await render(<InvitePlanScreen navigation={navigation} route={route} />);
    await act(async () => byLabel(tree.root, 'Add Sangeet')[0]!.props.onPress());
    expect(actions.updateInvitation).toHaveBeenCalledWith({
      events: [{ title: 'Sangeet', date: '', time: '', venue: '' }],
    });

    setContext(
      draftWith({
        ...emptyInvitation('wedding'),
        date: '2027-02-23',
        events: [{ title: 'Sangeet', date: '', time: '', venue: '' }],
      }),
    );
    const after = await render(<InvitePlanScreen navigation={navigation} route={route} />);
    expect(byLabel(after.root, 'Add Sangeet')).toHaveLength(0);
    expect(byLabel(after.root, 'Add Mehendi').length).toBeGreaterThan(0);
  });

  it('removes an event', async () => {
    const actions = setContext(
      draftWith({
        ...emptyInvitation('wedding'),
        date: '2027-02-23',
        events: [
          { title: 'Mehendi', date: '', time: '', venue: '' },
          { title: 'Sangeet', date: '', time: '', venue: '' },
        ],
      }),
    );
    const tree = await render(<InvitePlanScreen navigation={navigation} route={route} />);
    await act(async () => byLabel(tree.root, 'Remove Mehendi')[0]!.props.onPress());
    expect(actions.updateInvitation).toHaveBeenCalledWith({ events: [{ title: 'Sangeet', date: '', time: '', venue: '' }] });
  });

  it('stops at six events', async () => {
    const six = Array.from({ length: 6 }, (_, i) => ({ title: `E${i}`, date: '', time: '', venue: '' }));
    setContext(draftWith({ ...emptyInvitation('wedding'), date: '2027-02-23', events: six }));
    const tree = await render(<InvitePlanScreen navigation={navigation} route={route} />);
    expect(textOf(tree.root)).toContain('That is the most an invitation can hold: 6 events.');
    expect(textOf(tree.root)).not.toContain('Add another event');
  });
});

describe('the replies', () => {
  it('offers the blessing for a wedding and not for a birthday', async () => {
    setContext(draftWith(emptyInvitation('wedding')));
    let tree = await render(<InviteReplyScreen navigation={navigation} route={route} />);
    expect(textOf(tree.root)).toContain('Begin with a blessing');

    setContext(draftWith(emptyInvitation('birthday')));
    tree = await render(<InviteReplyScreen navigation={navigation} route={route} />);
    expect(textOf(tree.root)).not.toContain('Begin with a blessing');
  });

  it('only lets digits into the country code and the number', async () => {
    const actions = setContext(draftWith(emptyInvitation('wedding')));
    const tree = await render(<InviteReplyScreen navigation={navigation} route={route} />);
    const country = tree.root.findAll((node) => node.props.accessibilityLabel === 'Country code' && typeof node.props.onChangeText === 'function')[0]!;
    await act(async () => country.props.onChangeText('+9a1'));
    expect(actions.updateInvitation).toHaveBeenCalledWith({ rsvpCountry: '91' });
    const phone = tree.root.findAll((node) => node.props.accessibilityLabel === 'WhatsApp number' && typeof node.props.onChangeText === 'function')[0]!;
    await act(async () => phone.props.onChangeText('98765-43210x'));
    expect(actions.updateInvitation).toHaveBeenCalledWith({ rsvpPhone: '9876543210' });
  });

  it('goes on to the photos', async () => {
    setContext(draftWith(emptyInvitation('wedding')));
    const tree = await render(<InviteReplyScreen navigation={navigation} route={route} />);
    await act(async () => nextAction(tree.root).props.onPress());
    expect(navigate).toHaveBeenCalledWith('AddPhotos');
  });

  it('holds Next back for a number that cannot be right', async () => {
    setContext(draftWith({ ...emptyInvitation('wedding'), rsvpPhone: '12' }));
    const tree = await render(<InviteReplyScreen navigation={navigation} route={route} />);
    expect(nextAction(tree.root).props.disabled).toBe(true);
    expect(textOf(tree.root)).toContain('Check the WhatsApp number, with the country code');
  });
});

describe('the review summary', () => {
  const invitation: InvitationDraft = {
    ...emptyInvitation('wedding'),
    nameOne: 'Aarav',
    nameTwo: 'Priya',
    date: '2027-02-23',
    venueName: 'Hall',
    venueAddress: 'Civil Lines',
    dressCode: 'Festive',
    rsvpPhone: '98765 43210',
    events: [
      { title: 'Wedding', date: '', time: '18:30', venue: '' },
      { title: 'Mehendi', date: '2027-02-21', time: '16:00', venue: '' },
    ],
  };

  it('lists what guests will read, in order, with the plan sorted', async () => {
    const tree = await render(<InvitationSummary invitation={invitation} photoUri="file:///a.jpg" note="Come early" />);
    const text = textOf(tree.root);
    expect(text).toContain('Wedding invitation');
    expect(text).toContain('Aarav & Priya');
    expect(text).toContain('23 Feb 2027');
    expect(text).toContain('Hall, Civil Lines');
    expect(text).toContain('Festive');
    expect(text.indexOf('Mehendi')).toBeLessThan(text.indexOf('Wedding ·'));
    expect(text).toContain('6:30 PM');
    expect(text).toContain('Come early');
    expect(text).toContain('Guests reply to +91 98765 43210 on WhatsApp');
  });

  it('says plainly when there is no reply button', async () => {
    const tree = await render(<InvitationSummary invitation={{ ...invitation, rsvpPhone: '' }} photoUri={null} note="" />);
    expect(textOf(tree.root)).toContain('No reply button');
  });
});
