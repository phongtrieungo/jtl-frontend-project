// packages/shared/src/api/apiClient.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DualModeApiClient } from './apiClient';
import { MockDb } from './mockDb';
import { HttpBffClient } from './httpBffClient';

describe('Story 2.2: DualModeApiClient Adapter & Fallback', () => {
  let mockDb: MockDb;
  let mockBff: HttpBffClient;

  beforeEach(() => {
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

  it('transparently falls back to mock engine when BFF fetch fails with connection error', async () => {
    // Stub BFF client to simulate connection refusal / network failure
    vi.spyOn(mockBff, 'getUsers').mockRejectedValueOnce(
      new Error('Failed to fetch: Connection refused')
    );

    const client = new DualModeApiClient('bff', mockBff, mockDb);
    expect(client.getActiveMode()).toBe('bff');

    const users = await client.getUsers();
    // Fallback should yield mock users and switch active mode to mock
    expect(users.length).toBeGreaterThan(0);
    expect(client.getActiveMode()).toBe('mock');
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
