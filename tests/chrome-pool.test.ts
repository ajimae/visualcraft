import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChromePool } from '../src/chrome-pool';
import type { Ilogger } from '../src';

describe('ChromePool', () => {
  let pool: ChromePool;

  beforeEach(() => {
    pool = new ChromePool({ maxBrowsers: 2 });
  });

  afterEach(async () => {
    if (pool) {
      await pool.close();
    }
  });

  it('should initialize pool', async () => {
    await pool.initialize();
    const stats = pool.getStats();

    expect(stats.totalBrowsers).toBe(2);
    expect(stats.totalActivePages).toBe(0);
  }, 60000); // 60 second timeout for browser launch

  it('should acquire and release pages', async () => {
    await pool.initialize();

    const page = await pool.acquirePage();
    expect(page).toBeDefined();

    let stats = pool.getStats();
    expect(stats.totalActivePages).toBe(1);

    await pool.releasePage(page);

    stats = pool.getStats();
    expect(stats.totalActivePages).toBe(0);
  }, 60000);

  it('should handle multiple concurrent pages', async () => {
    await pool.initialize();

    const pages = await Promise.all([pool.acquirePage(), pool.acquirePage(), pool.acquirePage()]);

    const stats = pool.getStats();
    expect(stats.totalActivePages).toBe(3);

    await Promise.all(pages.map((page) => pool.releasePage(page)));

    const finalStats = pool.getStats();
    expect(finalStats.totalActivePages).toBe(0);
  }, 60000);

  it('should use passed in logger object', async () => {
    const logger: Ilogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    pool = new ChromePool({ maxBrowsers: 2, logger });
    await pool.initialize();

    expect(logger.info).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(`✅ Chrome pool ready`);

    const pages = await Promise.all([pool.acquirePage(), pool.acquirePage(), pool.acquirePage()]);

    const stats = pool.getStats();
    expect(stats.totalActivePages).toBe(3);

    await Promise.all(pages.map((page) => pool.releasePage(page)));

    const finalStats = pool.getStats();
    expect(finalStats.totalActivePages).toBe(0);
  }, 60000);

  it('should call the `onInitialize` function on successful initialize', async () => {
    const logger = { info: vi.fn() };
    const onInitialize = vi.fn(() => {
      logger.info(`Chrome Pool Ready!!`);
    });

    pool = new ChromePool({ maxBrowsers: 2, onInitialize });
    await pool.initialize();

    expect(onInitialize).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Chrome Pool Ready!!');
  }, 60000);
});
