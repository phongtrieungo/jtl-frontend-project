// packages/shared/src/api/mockDb.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { MockDb, INITIAL_USERS, INITIAL_TODOS } from './mockDb';

describe('Story 2.2: In-Browser Mock Database Engine', () => {
  let db: MockDb;

  beforeEach(() => {
    db = new MockDb();
  });

  it('initializes with seed users and todos', async () => {
    const users = await db.getUsers();
    const todos = await db.getTodos();

    expect(users.length).toBe(INITIAL_USERS.length);
    expect(todos.length).toBe(INITIAL_TODOS.length);

    // Verify task counts are calculated dynamically
    const ada = users.find((u) => u.id === 'user-1');
    expect(ada).toBeDefined();
    expect(ada?.taskCount).toBe(2);
  });

  it('creates new users with valid validation', async () => {
    const newUser = await db.createUser({ username: 'Grace Hopper' });
    expect(newUser.id).toBeDefined();
    expect(newUser.username).toBe('Grace Hopper');
    expect(newUser.taskCount).toBe(0);

    const found = await db.getUserById(newUser.id);
    expect(found.username).toBe('Grace Hopper');

    // Rejects invalid username
    await expect(db.createUser({ username: 'ab' })).rejects.toThrow(
      'Username must be at least 3 characters long'
    );
  });

  it('filters todos by user ID', async () => {
    const adaTodos = await db.getTodos('user-1');
    expect(adaTodos.length).toBe(2);
    expect(adaTodos.every((t) => t.assigneeId === 'user-1')).toBe(true);

    const turingTodos = await db.getTodos('user-2');
    expect(turingTodos.length).toBe(2);
    expect(turingTodos.every((t) => t.assigneeId === 'user-2')).toBe(true);
  });

  it('creates new todo and updates user taskCount', async () => {
    const newTodo = await db.createTodo({
      title: 'Compiler Design',
      assigneeId: 'user-1',
    });

    expect(newTodo.id).toBeDefined();
    expect(newTodo.title).toBe('Compiler Design');
    expect(newTodo.completed).toBe(false);

    const ada = await db.getUserById('user-1');
    expect(ada.taskCount).toBe(3);
  });

  it('throws simulated network failure when chaos mode is requested', async () => {
    await expect(
      db.createTodo(
        { title: 'Failure Test', assigneeId: 'user-1' },
        { chaos: true }
      )
    ).rejects.toThrow('Simulated Network Failure: Chaos Mode Active');
  });

  it('toggles todo completed status', async () => {
    const initial = await db.getTodoById('todo-2');
    expect(initial.completed).toBe(false);

    const toggled = await db.toggleTodo('todo-2');
    expect(toggled.completed).toBe(true);

    const reToggled = await db.toggleTodo('todo-2');
    expect(reToggled.completed).toBe(false);
  });

  it('deletes todo and decrements user taskCount', async () => {
    await db.deleteTodo('todo-1');
    await expect(db.getTodoById('todo-1')).rejects.toThrow("Todo with ID 'todo-1' not found");

    const ada = await db.getUserById('user-1');
    expect(ada.taskCount).toBe(1);
  });

  it('resets database back to clean initial state', async () => {
    await db.createUser({ username: 'Temporary User' });
    await db.deleteTodo('todo-1');

    db.reset();

    const users = await db.getUsers();
    expect(users.length).toBe(INITIAL_USERS.length);
    const todo1 = await db.getTodoById('todo-1');
    expect(todo1).toBeDefined();
  });
});
