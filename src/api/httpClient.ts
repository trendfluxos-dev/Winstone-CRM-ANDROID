import { AppEnvironmentConfig } from '../config/appConfig';

/**
 * Standard HTTP Client for Android Agent App.
 * Handles:
 * - Authorization Bearer headers
 * - JSON serialization
 * - Timeout handling (via AbortController)
 * - Network error handling & HTTP error status mapping
 * - Retries for idempotent requests
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export class HttpClient {
  private baseUrl: string;
  private token: string | null = null;
  private timeoutMs: number;

  constructor(baseUrl: string = AppEnvironmentConfig.crmBaseUrl, timeoutMs: number = AppEnvironmentConfig.timeoutMs) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
  }

  public setAuthToken(token: string | null) {
    this.token = token;
  }

  public getAuthToken(): string | null {
    return this.token;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 1
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new ApiError(503, 'CRM Base URL not configured. Operating in Offline / Isolated mode.');
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Client-Platform': 'Android-WinstoneAgent',
      'X-App-Version': 'v2.0.0-crm-sync',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errorData = null;
        try {
          errorData = await response.json();
        } catch {
          // ignore non-json error responses
        }
        throw new ApiError(response.status, response.statusText, errorData);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new ApiError(408, `Request timeout after ${this.timeoutMs}ms`);
      }

      if (retries > 0 && (options.method === 'GET' || !options.method)) {
        return this.request<T>(endpoint, options, retries - 1);
      }

      throw err;
    }
  }

  public get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  public post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}

export const defaultHttpClient = new HttpClient();
