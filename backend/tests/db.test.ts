import { getConnectionState, disconnectDB } from '../src/config/db';

describe('MongoDB Connection - TDD (Lightweight)', () => {
  it('should report connection state as number', () => {
    const state: number = getConnectionState();
    expect([0, 1, 2, 3]).toContain(state);
  });

  it('should handle disconnect gracefully when not connected', async () => {
    await expect(disconnectDB()).resolves.not.toThrow();
    expect(getConnectionState()).toBe(0);
  });

  it('should have disconnect handle idempotent', async () => {
    await disconnectDB();
    await disconnectDB();
    expect(getConnectionState()).toBe(0);
  });
});
