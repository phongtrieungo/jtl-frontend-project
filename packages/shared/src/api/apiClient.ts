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
export interface WriteRequestOptions {
  chaos?: boolean;
}

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
  toggleTodo(id: string, options?: WriteRequestOptions): Promise<Todo>;
  updateTodo(id: string, input: UpdateTodoInput, options?: WriteRequestOptions): Promise<Todo>;
  deleteTodo(id: string, options?: WriteRequestOptions): Promise<void>;
  checkHealth(): Promise<ApiHealthStatus>;
  getActiveMode(): 'bff' | 'mock';
  getModePreference(): ApiClientMode;
  setMode(mode: ApiClientMode): void;
  onModeChange(listener: (activeMode: 'bff' | 'mock') => void): () => void;
}

/**
 * DualModeApiClient provides seamless, resilient switching between
 * the ASP.NET Core .NET 10 BFF and the in-browser mock database engine.
 */
export class DualModeApiClient implements ApiClient {
  private modePreference: ApiClientMode;
  private activeMode: 'bff' | 'mock' = 'mock';
  private autoDetection: Promise<ApiHealthStatus> | undefined;
  private autoResolved = false;
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

    this.activeMode = this.modePreference === 'bff' ? 'bff' : 'mock';
  }

  public getActiveMode(): 'bff' | 'mock' {
    return this.activeMode;
  }

  public getModePreference(): ApiClientMode {
    return this.modePreference;
  }

  public setMode(mode: ApiClientMode): void {
    this.modePreference = mode;
    this.autoDetection = undefined;
    this.autoResolved = mode !== 'auto';
    if (mode === 'mock') {
      this.setActiveMode('mock');
    } else if (mode === 'bff') {
      this.setActiveMode('bff');
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

  private detectAutoMode(): Promise<ApiHealthStatus> {
    if (this.autoDetection) return this.autoDetection;

    const detection = (async (): Promise<ApiHealthStatus> => {
      try {
        const bffHealth = await this.bffClient.checkHealth();
        if (bffHealth.status === 'ok') {
          this.setActiveMode('bff');
          return bffHealth;
        }
      } catch {
        // Initial auto detection selects the persistent browser mock below.
      }

      this.setActiveMode('mock');
      return {
        status: 'ok',
        mode: 'mock',
        timestamp: new Date().toISOString(),
      };
    })().finally(() => {
      this.autoResolved = true;
    });

    this.autoDetection = detection;
    return detection;
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

    if (this.modePreference === 'auto') {
      if (!this.autoResolved) return this.detectAutoMode();
      if (this.activeMode === 'mock') {
        return {
          status: 'ok',
          mode: 'mock',
          timestamp: new Date().toISOString(),
        };
      }
    }

    try {
      const bffHealth = await this.bffClient.checkHealth();
      return bffHealth;
    } catch {
      return {
        status: 'offline',
        mode: 'bff',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /** Routes requests through the backend selected before application data access begins. */
  private async executeInSelectedMode<T>(
    bffAction: () => Promise<T>,
    mockAction: () => Promise<T>
  ): Promise<T> {
    if (this.modePreference === 'auto' && !this.autoResolved) {
      await this.detectAutoMode();
    }

    if (this.modePreference === 'mock' || this.activeMode === 'mock') {
      return mockAction();
    }

    // Once selected, a mode stays fixed for the page session. Redirecting a
    // failed BFF write into mock storage would create two divergent datasets.
    return bffAction();
  }

  public async getUsers(): Promise<User[]> {
    return this.executeInSelectedMode(
      () => this.bffClient.getUsers(),
      () => this.mockClient.getUsers()
    );
  }

  public async getUserById(id: string): Promise<User> {
    return this.executeInSelectedMode(
      () => this.bffClient.getUserById(id),
      () => this.mockClient.getUserById(id)
    );
  }

  public async createUser(input: CreateUserInput): Promise<User> {
    return this.executeInSelectedMode(
      () => this.bffClient.createUser(input),
      () => this.mockClient.createUser(input)
    );
  }

  public async getTodos(userId?: string): Promise<Todo[]> {
    return this.executeInSelectedMode(
      () => this.bffClient.getTodos(userId),
      () => this.mockClient.getTodos(userId)
    );
  }

  public async getTodosByUser(userId: string): Promise<Todo[]> {
    return this.getTodos(userId);
  }

  public async getTodoById(id: string): Promise<Todo> {
    return this.executeInSelectedMode(
      () => this.bffClient.getTodoById(id),
      () => this.mockClient.getTodoById(id)
    );
  }

  public async createTodo(
    input: CreateTodoInput,
    options?: { chaos?: boolean }
  ): Promise<Todo> {
    return this.executeInSelectedMode(
      () => this.bffClient.createTodo(input, options),
      () => this.mockClient.createTodo(input, options)
    );
  }

  public async toggleTodo(id: string, options?: WriteRequestOptions): Promise<Todo> {
    return this.executeInSelectedMode(
      () => this.bffClient.toggleTodo(id, options),
      () => this.mockClient.toggleTodo(id, options)
    );
  }

  public async updateTodo(id: string, input: UpdateTodoInput, options?: WriteRequestOptions): Promise<Todo> {
    return this.executeInSelectedMode(
      () => this.bffClient.updateTodo(id, input, options),
      () => this.mockClient.updateTodo(id, input, options)
    );
  }

  public async deleteTodo(id: string, options?: WriteRequestOptions): Promise<void> {
    return this.executeInSelectedMode(
      () => this.bffClient.deleteTodo(id, options),
      () => this.mockClient.deleteTodo(id, options)
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
