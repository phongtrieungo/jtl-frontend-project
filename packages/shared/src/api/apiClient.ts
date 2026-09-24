// packages/shared/src/api/apiClient.ts
import type {
  User,
  Todo,
  CreateUserInput,
  CreateTodoInput,
  UpdateTodoInput,
  ApiHealthStatus,
} from '../types/domain';
import { mockDb, MockDb } from './mockDb';
import { httpBffClient, HttpBffClient } from './httpBffClient';

export type ApiClientMode = 'auto' | 'bff' | 'mock';

/**
 * Standardized API Client Contract implemented by Dual-Mode Adapter.
 */
export interface ApiClient {
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User>;
  createUser(input: CreateUserInput): Promise<User>;
  getTodos(userId?: string): Promise<Todo[]>;
  getTodosByUser(userId: string): Promise<Todo[]>;
  getTodoById(id: string): Promise<Todo>;
  createTodo(input: CreateTodoInput, options?: { chaos?: boolean }): Promise<Todo>;
  toggleTodo(id: string): Promise<Todo>;
  updateTodo(id: string, input: UpdateTodoInput): Promise<Todo>;
  deleteTodo(id: string): Promise<void>;
  checkHealth(): Promise<ApiHealthStatus>;
  getActiveMode(): 'bff' | 'mock';
  getModePreference(): ApiClientMode;
  setMode(mode: ApiClientMode): void;
  onModeChange(listener: (activeMode: 'bff' | 'mock') => void): () => void;
}

/**
 * DualModeApiClient provides seamless, resilient switching between
 * the ASP.NET Core .NET 8 BFF and the in-browser mock database engine.
 */
export class DualModeApiClient implements ApiClient {
  private modePreference: ApiClientMode;
  private activeMode: 'bff' | 'mock' = 'mock';
  private bffClient: HttpBffClient;
  private mockClient: MockDb;
  private modeListeners: Set<(mode: 'bff' | 'mock') => void> = new Set();

  constructor(
    preference?: ApiClientMode,
    bff: HttpBffClient = httpBffClient,
    mock: MockDb = mockDb
  ) {
    this.bffClient = bff;
    this.mockClient = mock;

    // Detect initial mode preference from environment or argument
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } })
      ?.process?.env;
    const envMode = (env?.VITE_API_MODE as ApiClientMode) || 'auto';
    this.modePreference = preference || envMode;

    if (this.modePreference === 'mock') {
      this.setActiveMode('mock');
    } else {
      // In auto or bff mode, default activeMode to bff tentatively
      this.activeMode = 'bff';
    }
  }

  public getActiveMode(): 'bff' | 'mock' {
    return this.activeMode;
  }

  public getModePreference(): ApiClientMode {
    return this.modePreference;
  }

  public setMode(mode: ApiClientMode): void {
    this.modePreference = mode;
    if (mode === 'mock') {
      this.setActiveMode('mock');
    } else if (mode === 'bff') {
      this.setActiveMode('bff');
    } else {
      // Re-trigger auto detection
      this.checkHealth();
    }
  }

  public onModeChange(listener: (activeMode: 'bff' | 'mock') => void): () => void {
    this.modeListeners.add(listener);
    return () => {
      this.modeListeners.delete(listener);
    };
  }

  private setActiveMode(mode: 'bff' | 'mock'): void {
    if (this.activeMode !== mode) {
      this.activeMode = mode;
      for (const listener of this.modeListeners) {
        listener(mode);
      }
    }
  }

  public async checkHealth(): Promise<ApiHealthStatus> {
    if (this.modePreference === 'mock') {
      return {
        status: 'ok',
        mode: 'mock',
        latencyMs: 0,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const bffHealth = await this.bffClient.checkHealth();

      if (bffHealth.status === 'ok') {
        this.setActiveMode('bff');
        return bffHealth;
      }

      // BFF is degraded or offline; fall back gracefully to mock
      this.setActiveMode('mock');
      return {
        status: 'degraded',
        mode: 'mock',
        timestamp: new Date().toISOString(),
      };
    } catch {
      this.setActiveMode('mock');
      return {
        status: 'offline',
        mode: 'mock',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Safe execution wrapper that transparently falls back to mockDb
   * if a network disconnection or connection refusal occurs while talking to BFF.
   */
  private async executeWithFallback<T>(
    bffAction: () => Promise<T>,
    mockAction: () => Promise<T>
  ): Promise<T> {
    if (this.modePreference === 'mock' || this.activeMode === 'mock') {
      return mockAction();
    }

    try {
      return await bffAction();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      // Do NOT fall back on simulated chaos errors or client validation errors (HTTP 4xx/5xx)
      // Only fall back on network failures (connection refused, fetch failed, abort)
      const isNetworkDisconnection =
        errorMsg.includes('Failed to fetch') ||
        errorMsg.includes('NetworkError') ||
        errorMsg.includes('ECONNREFUSED') ||
        errorMsg.includes('AbortError') ||
        errorMsg.includes('aborted');

      if (isNetworkDisconnection) {
        console.warn(
          `[DualModeApiClient] BFF connection failed (${errorMsg}). Gracefully falling back to in-browser mock engine.`
        );
        this.setActiveMode('mock');
        return mockAction();
      }

      // If it's a real server error (including chaos mode 500 error), rethrow so caller handles it!
      throw err;
    }
  }

  public async getUsers(): Promise<User[]> {
    return this.executeWithFallback(
      () => this.bffClient.getUsers(),
      () => this.mockClient.getUsers()
    );
  }

  public async getUserById(id: string): Promise<User> {
    return this.executeWithFallback(
      () => this.bffClient.getUserById(id),
      () => this.mockClient.getUserById(id)
    );
  }

  public async createUser(input: CreateUserInput): Promise<User> {
    return this.executeWithFallback(
      () => this.bffClient.createUser(input),
      () => this.mockClient.createUser(input)
    );
  }

  public async getTodos(userId?: string): Promise<Todo[]> {
    return this.executeWithFallback(
      () => this.bffClient.getTodos(userId),
      () => this.mockClient.getTodos(userId)
    );
  }

  public async getTodosByUser(userId: string): Promise<Todo[]> {
    return this.getTodos(userId);
  }

  public async getTodoById(id: string): Promise<Todo> {
    return this.executeWithFallback(
      () => this.bffClient.getTodoById(id),
      () => this.mockClient.getTodoById(id)
    );
  }

  public async createTodo(
    input: CreateTodoInput,
    options?: { chaos?: boolean }
  ): Promise<Todo> {
    return this.executeWithFallback(
      () => this.bffClient.createTodo(input, options),
      () => this.mockClient.createTodo(input, options)
    );
  }

  public async toggleTodo(id: string): Promise<Todo> {
    return this.executeWithFallback(
      () => this.bffClient.toggleTodo(id),
      () => this.mockClient.toggleTodo(id)
    );
  }

  public async updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
    return this.executeWithFallback(
      () => this.bffClient.updateTodo(id, input),
      () => this.mockClient.updateTodo(id, input)
    );
  }

  public async deleteTodo(id: string): Promise<void> {
    return this.executeWithFallback(
      () => this.bffClient.deleteTodo(id),
      () => this.mockClient.deleteTodo(id)
    );
  }
}

export const apiClient: ApiClient = new DualModeApiClient();
export function createApiClient(
  preference?: ApiClientMode,
  bff?: HttpBffClient,
  mock?: MockDb
): ApiClient {
  return new DualModeApiClient(preference, bff, mock);
}
