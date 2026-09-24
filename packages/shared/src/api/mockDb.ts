// packages/shared/src/api/mockDb.ts
import type {
  User,
  Todo,
  CreateUserInput,
  CreateTodoInput,
  UpdateTodoInput,
} from '../types/domain';

export const INITIAL_USERS: readonly User[] = [
  {
    id: 'user-1',
    username: 'Ada Lovelace',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-2',
    username: 'Alan Turing',
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'user-3',
    username: 'Margaret Hamilton',
    createdAt: '2026-01-03T00:00:00.000Z',
  },
];

export const INITIAL_TODOS: readonly Todo[] = [
  {
    id: 'todo-1',
    title: 'Write algorithm for the Analytical Engine',
    assigneeId: 'user-1',
    completed: true,
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'todo-2',
    title: 'Draft notes on Bernoulli numbers computation',
    assigneeId: 'user-1',
    completed: false,
    createdAt: '2026-01-01T11:00:00.000Z',
  },
  {
    id: 'todo-3',
    title: 'Formalize Turing Machine computational model',
    assigneeId: 'user-2',
    completed: true,
    createdAt: '2026-01-02T09:00:00.000Z',
  },
  {
    id: 'todo-4',
    title: 'Crack Enigma Naval cipher specifications',
    assigneeId: 'user-2',
    completed: false,
    createdAt: '2026-01-02T14:30:00.000Z',
  },
  {
    id: 'todo-5',
    title: 'Author Apollo 11 guidance computer software',
    assigneeId: 'user-3',
    completed: true,
    createdAt: '2026-01-03T08:00:00.000Z',
  },
  {
    id: 'todo-6',
    title: 'Design asynchronous priority scheduling architecture',
    assigneeId: 'user-3',
    completed: false,
    createdAt: '2026-01-03T16:00:00.000Z',
  },
];

/**
 * In-Browser Mock Database Engine.
 * Provides complete zero-dependency offline functionality and chaos simulation.
 */
export class MockDb {
  private users: User[] = [];
  private todos: Todo[] = [];
  private defaultMinLatency = 200;
  private defaultMaxLatency = 400;

  constructor() {
    this.reset();
  }

  /**
   * Resets database back to clean initial seed data.
   */
  public reset(): void {
    this.users = INITIAL_USERS.map((u) => ({ ...u }));
    this.todos = INITIAL_TODOS.map((t) => ({ ...t }));
  }

  /**
   * Simulates realistic network delay (200-400ms).
   */
  private async delay(minMs?: number, maxMs?: number): Promise<void> {
    const min = minMs ?? this.defaultMinLatency;
    const max = maxMs ?? this.defaultMaxLatency;
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Computes user list with live assigned task counts.
   */
  public async getUsers(): Promise<User[]> {
    await this.delay();
    return this.users.map((user) => ({
      ...user,
      taskCount: this.todos.filter((t) => t.assigneeId === user.id).length,
    }));
  }

  /**
   * Retrieves single user by ID.
   */
  public async getUserById(id: string): Promise<User> {
    await this.delay();
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new Error(`User with ID '${id}' not found`);
    }
    const taskCount = this.todos.filter((t) => t.assigneeId === user.id).length;
    return { ...user, taskCount };
  }

  /**
   * Creates a new user with generated timestamp and ID.
   */
  public async createUser(input: CreateUserInput): Promise<User> {
    await this.delay();
    const username = input.username.trim();
    if (!username || username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    const newUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username,
      createdAt: new Date().toISOString(),
      taskCount: 0,
    };

    this.users.unshift(newUser);
    return { ...newUser };
  }

  /**
   * Retrieves todos optionally filtered by user ID.
   */
  public async getTodos(userId?: string): Promise<Todo[]> {
    await this.delay();
    if (userId) {
      return this.todos
        .filter((t) => t.assigneeId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [...this.todos].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Retrieves single todo by ID.
   */
  public async getTodoById(id: string): Promise<Todo> {
    await this.delay();
    const todo = this.todos.find((t) => t.id === id);
    if (!todo) {
      throw new Error(`Todo with ID '${id}' not found`);
    }
    return { ...todo };
  }

  /**
   * Creates a new todo item.
   * If chaos mode is active (via options.chaos === true), delays and throws Simulated Failure.
   */
  public async createTodo(
    input: CreateTodoInput,
    options?: { chaos?: boolean }
  ): Promise<Todo> {
    await this.delay();

    if (options?.chaos) {
      throw new Error('Simulated Network Failure: Chaos Mode Active');
    }

    const title = input.title.trim();
    if (!title) {
      throw new Error('Todo title cannot be empty');
    }

    const newTodo: Todo = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      assigneeId: input.assigneeId,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this.todos.unshift(newTodo);
    return { ...newTodo };
  }

  /**
   * Toggles completion status of a todo item.
   */
  public async toggleTodo(id: string): Promise<Todo> {
    await this.delay();
    const index = this.todos.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Todo with ID '${id}' not found`);
    }

    const current = this.todos[index];
    const updated: Todo = {
      ...current,
      completed: !current.completed,
    };
    this.todos[index] = updated;
    return { ...updated };
  }

  /**
   * Updates an existing todo item fields.
   */
  public async updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
    await this.delay();
    const index = this.todos.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Todo with ID '${id}' not found`);
    }

    const current = this.todos[index];
    const updated: Todo = {
      ...current,
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.completed !== undefined ? { completed: input.completed } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
    };
    this.todos[index] = updated;
    return { ...updated };
  }

  /**
   * Deletes a todo item.
   */
  public async deleteTodo(id: string): Promise<void> {
    await this.delay();
    const index = this.todos.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Todo with ID '${id}' not found`);
    }
    this.todos.splice(index, 1);
  }
}

export const mockDb = new MockDb();
