import { connectOnDemand } from '../src/config/db';

describe('connectOnDemand - serverless self-healing (TDD)', () => {
  it('should return true when a connect attempt succeeds', async () => {
    const connect = jest.fn().mockResolvedValue(undefined);
    await expect(connectOnDemand(connect)).resolves.toBe(true);
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('should return false on failure and allow a retry on the next request', async () => {
    const connect = jest.fn().mockRejectedValue(new Error('boom'));
    await expect(connectOnDemand(connect)).resolves.toBe(false);
    await expect(connectOnDemand(connect)).resolves.toBe(false);
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it('should heal after a failure when connect later succeeds', async () => {
    const connect = jest
      .fn()
      .mockRejectedValueOnce(new Error('first fail'))
      .mockResolvedValueOnce(undefined);
    await expect(connectOnDemand(connect)).resolves.toBe(false);
    await expect(connectOnDemand(connect)).resolves.toBe(true);
    expect(connect).toHaveBeenCalledTimes(2);
  });
});