import { httpClient } from '../../src/shared/api/httpClient';
import { getAppCheckToken } from '../../src/shared/firebase/appCheck';

const mockToken = getAppCheckToken as jest.Mock;

describe('httpClient and App Check', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    (global as { fetch?: unknown }).fetch = fetchMock;
    mockToken.mockReset();
  });

  const sentHeaders = () => fetchMock.mock.calls[0][1].headers as Record<string, string>;

  it('says a write comes from the real app', async () => {
    mockToken.mockResolvedValue('app-check-jwt');
    await httpClient.post('https://api.test', '/v1/creations', {});
    expect(sentHeaders()['X-Firebase-AppCheck']).toBe('app-check-jwt');
  });

  it('does the same for edits and deletes', async () => {
    mockToken.mockResolvedValue('app-check-jwt');
    await httpClient.patch('https://api.test', '/v1/creations/1', {});
    await httpClient.delete('https://api.test', '/v1/creations/1');
    expect(fetchMock.mock.calls.map((c) => c[1].headers['X-Firebase-AppCheck'])).toEqual([
      'app-check-jwt',
      'app-check-jwt',
    ]);
  });

  it('does not ask for a token on a read', async () => {
    mockToken.mockResolvedValue('app-check-jwt');
    await httpClient.get('https://api.test', '/v1/cards/x');
    expect(mockToken).not.toHaveBeenCalled();
    expect(sentHeaders()['X-Firebase-AppCheck']).toBeUndefined();
  });

  it('goes without the header when there is no token, and still sends the request', async () => {
    mockToken.mockResolvedValue(null);
    await httpClient.post('https://api.test', '/v1/creations', {});
    expect(sentHeaders()['X-Firebase-AppCheck']).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the caller headers, such as the sign-in token', async () => {
    mockToken.mockResolvedValue('app-check-jwt');
    await httpClient.post('https://api.test', '/v1/creations', {}, { Authorization: 'Bearer abc' });
    expect(sentHeaders().Authorization).toBe('Bearer abc');
    expect(sentHeaders()['X-Firebase-AppCheck']).toBe('app-check-jwt');
  });

  it('hands the server refusal to the app with a code it can show', async () => {
    mockToken.mockResolvedValue(null);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ code: 'APP_CHECK_FAILED', message: 'Update the app and try again.' }),
    });
    await expect(httpClient.post('https://api.test', '/v1/creations', {})).rejects.toMatchObject({
      code: 'APP_CHECK_FAILED',
      status: 403,
    });
  });
});
