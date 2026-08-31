import { HttpError, type HttpErrorCode } from './errors';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
};

function mapStatusToCode(status: number, bodyCode?: string): HttpErrorCode {
  if (bodyCode && isHttpErrorCode(bodyCode)) {
    return bodyCode;
  }
  if (status === 400) return 'VALIDATION_ERROR';
  if (status === 402) return 'QUOTA_EXCEEDED';
  if (status === 404) return 'NOT_FOUND';
  if (status === 410) return 'EXPIRED';
  if (status === 501) return 'NOT_IMPLEMENTED';
  return 'INTERNAL';
}

function isHttpErrorCode(value: string): value is HttpErrorCode {
  return [
    'VALIDATION_ERROR',
    'QUOTA_EXCEEDED',
    'UPLOAD_MISSING',
    'NOT_FOUND',
    'EXPIRED',
    'NOT_IMPLEMENTED',
    'INTERNAL',
  ].includes(value);
}

/**
 * Thin HTTP client for Cloud Functions API.
 * All feature repositories should use this — not raw fetch.
 */
export async function httpRequest<T>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;
  const url = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as {
      code?: string;
      message?: string;
    };
    const code = mapStatusToCode(res.status, payload.code);
    throw new HttpError(
      code,
      payload.message ?? `Request failed (${res.status})`,
      res.status,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const httpClient = {
  get<T>(baseUrl: string, path: string, headers?: Record<string, string>) {
    return httpRequest<T>(baseUrl, path, { method: 'GET', headers });
  },
  post<T>(
    baseUrl: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ) {
    return httpRequest<T>(baseUrl, path, { method: 'POST', body, headers });
  },
};
