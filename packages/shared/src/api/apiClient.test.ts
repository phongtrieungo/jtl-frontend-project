// packages/shared/src/api/apiClient.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DualModeApiClient } from './apiClient';
import { MockDb } from './mockDb';
import { HttpBffClient } from './httpBffClient';

describe('Story 2.2: DualModeApiClient Adapter & Fallback', () => {
  let mockDb: MockDb;
  let mockBff: HttpBffClient;

  beforeEach(() => {
    localStorage.clear();
    mockDb = new MockDb();
    mockBff = new HttpBffClient();
  });

  it('runs directly against mock engine in mock mode', async () => {
    const client = new DualModeApiClient('mock', mockBff, mockDb);
    expect(client.getActiveMode()).toBe('mock');

    const users = await client.getUsers();
    expect(users.length).toBeGreaterThan(0);

    const health = await client.checkHealth();
    expect(health.mode).toBe('mock');
    expect(health.status).toBe('ok');
  });

  it('selects mock once when initial auto detection cannot reach the BFF', async () => {
    const health = vi.spyOn(mockBff, 'checkHealth')
      .mockRejectedValueOnce(new Error('Failed to fetch: Connection refused'))
      .mockResolvedValue({ status: 'ok', mode: 'bff', timestamp: new Date().toISOString() });
    const client = new DualModeApiClient('auto', mockBff, mockDb);

    const users = await client.getUsers();
    expect(users.length).toBeGreaterThan(0);
    expect(client.getActiveMode()).toBe('mock');

    const laterHealth = await client.checkHealth();
    expect(laterHealth.mode).toBe('mock');
    expect(health).toHaveBeenCalledTimes(1);
  });

  it('keeps explicit BFF mode fixed instead of redirecting a failed request to mock data', async () => {
    vi.spyOn(mockBff, 'getUsers').mockRejectedValueOnce(new Error('Failed to fetch: Connection refused'));
    const mockRead = vi.spyOn(mockDb, 'getUsers');
    const client = new DualModeApiClient('bff', mockBff, mockDb);

    await expect(client.getUsers()).rejects.toThrow('Failed to fetch');
    expect(client.getActiveMode()).toBe('bff');
    expect(mockRead).not.toHaveBeenCalled();
  });

  it('selects BFF once when initial auto detection succeeds', async () => {
    vi.spyOn(mockBff, 'checkHealth').mockResolvedValue({ status: 'ok', mode: 'bff', timestamp: new Date().toISOString() });
    const getUsers = vi.spyOn(mockBff, 'getUsers').mockResolvedValue([]);
    const client = new DualModeApiClient('auto', mockBff, mockDb);

    await client.getUsers();
    expect(client.getActiveMode()).toBe('bff');
    expect(getUsers).toHaveBeenCalledOnce();
  });

  it('notifies mode listeners when active mode changes', async () => {
    const client = new DualModeApiClient('mock', mockBff, mockDb);
    const listener = vi.fn();
    const unsubscribe = client.onModeChange(listener);

    client.setMode('bff');
    expect(listener).toHaveBeenCalledWith('bff');

    unsubscribe();
    client.setMode('mock');
    // listener should not be called again after unsubscribe
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('re-throws real API errors (like chaos mode 500) without falling back', async () => {
    vi.spyOn(mockBff, 'createTodo').mockRejectedValueOnce(
      new Error('Simulated Network Failure: Chaos Mode Active')
    );

    const client = new DualModeApiClient('bff', mockBff, mockDb);

    await expect(
      client.createTodo({ title: 'Task', assigneeId: 'user-1' }, { chaos: true })
    ).rejects.toThrow('Simulated Network Failure: Chaos Mode Active');

    // Should remain in BFF mode because it was a simulated server response, not a connection crash
    expect(client.getActiveMode()).toBe('bff');
  });
});
