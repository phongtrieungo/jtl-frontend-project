// packages/shared/src/api/httpBffClient.ts
import type {
  User,
  Todo,
  CreateUserInput,
  CreateTodoInput,
  UpdateTodoInput,
  ApiHealthStatus,
} from '../types/domain';

export interface HttpBffClientOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

/**
 * HTTP Client targeting the ASP.NET Core .NET 10 Minimal API BFF.
 */
export class HttpBffClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(options: HttpBffClientOptions = {}) {
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } })
      ?.process?.env;
    this.baseUrl = options.baseUrl || env?.VITE_BFF_URL || 'http://localhost:5000/api';
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async fetchWithTimeout(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status} (${response.statusText})`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) {
          errorMessage = errorJson.error;
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // Fallback to response text if not JSON
        try {
          const errorText = await response.text();
          if (errorText) errorMessage = errorText;
        } catch {
          // ignore
        }
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json();
  }

  public async getUsers(): Promise<User[]> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/users`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return this.handleResponse<User[]>(response);
  }

  public async getUserById(id: string): Promise<User> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/users/${id}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return this.handleResponse<User>(response);
  }

  public async createUser(input: CreateUserInput): Promise<User> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(input),
    });
    return this.handleResponse<User>(response);
  }

  public async getTodos(userId?: string): Promise<Todo[]> {
    const url = userId
      ? `${this.baseUrl}/todos?userId=${encodeURIComponent(userId)}`
      : `${this.baseUrl}/todos`;

    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return this.handleResponse<Todo[]>(response);
  }

  public async getTodoById(id: string): Promise<Todo> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/todos/${id}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return this.handleResponse<Todo>(response);
  }

  public async createTodo(
    input: CreateTodoInput,
    options?: { chaos?: boolean }
  ): Promise<Todo> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (options?.chaos) {
      headers['X-Simulate-Chaos'] = 'true';
    }

    const response = await this.fetchWithTimeout(`${this.baseUrl}/todos`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });
    return this.handleResponse<Todo>(response);
  }

  public async toggleTodo(id: string): Promise<Todo> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/todos/${id}/toggle`, {
      method: 'PUT',
      headers: { Accept: 'application/json' },
    });
    return this.handleResponse<Todo>(response);
  }

  public async updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/todos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(input),
    });
    return this.handleResponse<Todo>(response);
  }

  public async deleteTodo(id: string): Promise<void> {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/todos/${id}`, {
      method: 'DELETE',
    });
    return this.handleResponse<void>(response);
  }

  public async checkHealth(): Promise<ApiHealthStatus> {
    const startTime = Date.now();
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        return {
          status: 'ok',
          mode: 'bff',
          latencyMs,
          timestamp: new Date().toISOString(),
        };
      }
      return {
        status: 'degraded',
        mode: 'bff',
        latencyMs,
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'offline',
        mode: 'bff',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const httpBffClient = new HttpBffClient();
