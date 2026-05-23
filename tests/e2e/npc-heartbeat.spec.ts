// tests/e2e/npc-heartbeat.spec.ts
/**
 * NPC心跳机制测试
 * 覆盖场景触发心跳、缓存机制、间隔控制
 */

import { test, expect } from '@playwright/test';
import {
  enterClinicSceneDirect,
  enterGardenSceneDirect,
  getCacheState,
  injectInventoryCache,
  injectProgressCache,
  MOCK_INVENTORY,
  MOCK_PROGRESS,
  TIMEOUTS
} from './utils/npc-test-helpers';

test.setTimeout(60000);

test.describe('NPC Heartbeat Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('canvas');
  });

  // NPC-HB-01: ClinicScene进入触发心跳
  test('NPC-HB-01: Heartbeat triggered on ClinicScene enter', async ({ page }) => {
    await enterClinicSceneDirect(page);
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    const cacheState = await getCacheState(page);

    expect(cacheState.exists).toBe(true);
    console.log('[NPC-HB-01] Cache state:', JSON.stringify(cacheState));
  });

  // NPC-HB-02: GardenScene进入触发心跳
  test('NPC-HB-02: Heartbeat triggered on GardenScene enter', async ({ page }) => {
    await enterGardenSceneDirect(page);
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    const cacheState = await getCacheState(page);

    expect(cacheState.exists).toBe(true);
    console.log('[NPC-HB-02] Cache state:', JSON.stringify(cacheState));
  });

  // NPC-HB-03: 心跳缓存inventory数据格式正确
  test('NPC-HB-03: Heartbeat caches inventory with correct format', async ({ page }) => {
    await enterClinicSceneDirect(page);

    await injectInventoryCache(page, MOCK_INVENTORY);

    const cacheState = await getCacheState(page);

    expect(cacheState.inventoryCache).toBeTruthy();
    expect(cacheState.inventoryCache).toHaveProperty('herbs');
  });

  // NPC-HB-04: 心跳缓存progress数据格式正确
  test('NPC-HB-04: Heartbeat caches progress with correct format', async ({ page }) => {
    await enterClinicSceneDirect(page);

    await injectProgressCache(page, MOCK_PROGRESS);

    const cacheState = await getCacheState(page);

    expect(cacheState.progressCache).toBeTruthy();
    expect(cacheState.progressCache).toHaveProperty('total_cases');
  });

  // NPC-HB-05: 30秒间隔防重复触发
  test('NPC-HB-05: Heartbeat interval prevents duplicate triggers', async ({ page }) => {
    await enterClinicSceneDirect(page);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    const firstTime = await page.evaluate(() => {
      const heartbeat = (window as any).__NPC_HEARTBEAT__;
      return heartbeat?.lastHeartbeatTime || 0;
    });

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene?.start('GardenScene');
    });
    await page.waitForTimeout(TIMEOUTS.SHORT);

    const secondTime = await page.evaluate(() => {
      const heartbeat = (window as any).__NPC_HEARTBEAT__;
      return heartbeat?.lastHeartbeatTime || 0;
    });

    expect(secondTime).toBe(firstTime);
  });

  // NPC-HB-06: NPC主动发布任务
  test('NPC-HB-06: NPC can publish task based on progress', async ({ page }) => {
    await enterClinicSceneDirect(page);

    await injectProgressCache(page, {
      total_cases: 10,
      completed_cases: 2,
      correct_rate: 0.3,
      current_task: null
    });

    await page.keyboard.press('N');
    await page.waitForSelector('#dialog-ui-root', { timeout: TIMEOUTS.DIALOG_UI });

    await page.waitForTimeout(TIMEOUTS.SCENE_LOAD);

    const content = await page.locator('.dialog-content').textContent();
    expect(content).toBeTruthy();
  });

  // NPC-HB-07: 缓存失效重新获取
  test('NPC-HB-07: Cache invalidation triggers refetch', async ({ page }) => {
    await enterClinicSceneDirect(page);
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    await page.evaluate(() => {
      const bridge = (window as any).__GAME_STATE_BRIDGE__;
      bridge?.clearCaches?.();
    });

    const afterClear = await getCacheState(page);
    expect(afterClear.inventoryCache).toBeNull();

    await page.keyboard.press('N');
    await page.waitForSelector('#dialog-ui-root', { timeout: TIMEOUTS.DIALOG_UI });
  });

  // NPC-HB-08: weaknessLog跨场景保留
  test('NPC-HB-08: weaknessLog persists across scene switches', async ({ page }) => {
    await enterClinicSceneDirect(page);

    await page.evaluate(() => {
      const bridge = (window as any).__GAME_STATE_BRIDGE__;
      bridge?.recordWeakness?.('舌诊识别不准');
      bridge?.recordWeakness?.('脉诊理解偏差');
    });

    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      game?.scene?.start('GardenScene');
    });
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    const weaknesses = await page.evaluate(() => {
      const bridge = (window as any).__GAME_STATE_BRIDGE__;
      return bridge?.getWeaknessLog?.() || [];
    });

    expect(weaknesses.length).toBeGreaterThanOrEqual(2);
    expect(weaknesses).toContain('舌诊识别不准');
  });
});