import { parseAutosendPayload } from '../../src/features/vault/data/fcmRepository';

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: {
    apps: [{ name: '[DEFAULT]' }],
    app: () => ({ options: { projectId: 'test' } }),
    initializeApp: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/messaging', () => {
  const messaging = () => ({
    requestPermission: jest.fn(),
    getToken: jest.fn(),
    onTokenRefresh: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(async () => null),
    setBackgroundMessageHandler: jest.fn(),
  });
  return { __esModule: true, default: messaging };
});

jest.mock('@react-native-firebase/firestore', () => {
  const firestore = () => ({
    collection: jest.fn(),
  });
  firestore.FieldValue = { arrayUnion: jest.fn((token: string) => token) };
  return { __esModule: true, default: firestore };
});

describe('parseAutosendPayload', () => {
  it('parses review opens', () => {
    expect(
      parseAutosendPayload({
        type: 'autosend_review',
        sendId: 'send-1',
        personName: 'Sam',
      }),
    ).toEqual({ type: 'autosend_review', sendId: 'send-1' });
  });

  it('parses sent opens with shareUrl', () => {
    expect(
      parseAutosendPayload({
        type: 'autosend_sent',
        sendId: 'send-2',
        shareUrl: 'https://occasio-greetings.vercel.app/c/abc',
      }),
    ).toEqual({
      type: 'autosend_sent',
      sendId: 'send-2',
      shareUrl: 'https://occasio-greetings.vercel.app/c/abc',
    });
  });

  it('rejects unknown types and missing sendId', () => {
    expect(parseAutosendPayload({ type: 'other', sendId: 'x' })).toBeNull();
    expect(parseAutosendPayload({ type: 'autosend_review', sendId: '' })).toBeNull();
  });
});
