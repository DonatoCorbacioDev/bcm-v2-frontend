import {
  IDLE_TIMEOUT_MS,
  IDLE_WARNING_MS,
  KEEP_ALIVE_EVERY_MS,
  idleState,
  latestActivity,
  shareActivity,
  shouldKeepAlive,
} from '@/lib/idleSession';

const MINUTE = 60_000;

describe('lib/idleSession', () => {
  beforeEach(() => localStorage.clear());

  it('is active up to 28 minutes, warns until 30, then has expired', () => {
    expect(idleState(0, 27 * MINUTE)).toBe('active');
    expect(idleState(0, IDLE_WARNING_MS)).toBe('warning');
    expect(idleState(0, IDLE_TIMEOUT_MS - 1)).toBe('warning');
    expect(idleState(0, IDLE_TIMEOUT_MS)).toBe('expired');
  });

  it('renews the session only for an active user, at most every ten minutes', () => {
    expect(shouldKeepAlive(9 * MINUTE, 0, 9 * MINUTE)).toBe(false);
    expect(shouldKeepAlive(KEEP_ALIVE_EVERY_MS, 0, KEEP_ALIVE_EVERY_MS)).toBe(true);
    // Idle: background activity must not keep the session going.
    expect(shouldKeepAlive(0, 0, 29 * MINUTE)).toBe(false);
  });

  it("counts another tab's activity", () => {
    shareActivity(5_000);
    expect(latestActivity(1_000)).toBe(5_000);
    expect(latestActivity(9_000)).toBe(9_000);
  });

  it('works without storage, on its own tab only', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    try {
      expect(latestActivity(1_000)).toBe(1_000);
    } finally {
      spy.mockRestore();
    }
  });
});
