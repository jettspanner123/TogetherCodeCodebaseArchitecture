import { APIResponse } from '@/Types/APIResponseType';

export default class APIClientUtility {
  public static current = new APIClientUtility();

  public async get<T>(url: string, headers: HeadersInit = {}): Promise<APIResponse<T>> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    const body: APIResponse<T> = await response.json();
    if (!response.ok || !body.success) {
      throw new Error(body.message || body.error || `HTTP error ${response.status}`);
    }

    return body;
  }

  public async post<T, B = unknown>(url: string, payload?: B, headers: HeadersInit = {}): Promise<APIResponse<T>> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
    });

    const body: APIResponse<T> = await response.json();
    if (!response.ok || !body.success) {
      throw new Error(body.message || body.error || `HTTP error ${response.status}`);
    }

    return body;
  }
}
