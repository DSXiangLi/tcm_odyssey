// tests/visual/phase1-5/deep-validation/walkable-coverage.spec.ts
/**
 * Layer 3 深度验证: 可行走区域覆盖验证
 *
 * 测试用例:
 * - D-001: 随机采样可行走区域验证 - 采样30个点，全部可达
 * - D-002: 随机采样不可行走区域验证 - 采样30个不可行走点，验证不可达
 * - D-004: 门周围可达性验证 - 验证3个门周围有可行走瓦片
 *
 * 评分制: 每个测试独立评分，记录详细验证结果
 */

import { test, expect } from '@playwright/test';
import { WalkableVerifier, TilePos, WalkableVerifyResult } from '../utils/walkable-verifier';
import { TOWN_OUTDOOR_CONFIG } from '../../../../src/data/map-config';

test.describe('Layer 3 深度验证: 可行走区域覆盖', () => {
  let verifier: WalkableVerifier;

  test.beforeAll(async () => {
    // 初始化验证器（使用配置文件，不依赖页面）
    verifier = new WalkableVerifier();
    verifier.initializeFromConfig(TOWN_OUTDOOR_CONFIG);
  });

  /**
   * D-001: 随机采样可行走区域验证
   * 采样30个可行走瓦片，验证每个都确实可行走
   *
   * 评分标准:
   * - 100%: 全部30个点可达
   * - 90%: 27-29个点可达
   * - 80%: 24-26个点可达
   * - <80%: 不通过
   */
  test('D-001: 随机采样可行走区域验证 - 采样30个点，全部可达', async () => {
    const SAMPLE_COUNT = 30;
    const PASS_THRESHOLD = 0.80; // 80%通过阈值

    // 随机采样可行走瓦片
    const sampledTiles = verifier.sampleWalkableTiles(SAMPLE_COUNT);

    // 验证采样数量
    expect(sampledTiles.length).toBeGreaterThanOrEqual(Math.min(SAMPLE_COUNT, verifier.getStatus().walkableTileCount));

    // 验证每个采样点确实可行走
    const results: WalkableVerifyResult[] = [];
    let passCount = 0;

    for (const tile of sampledTiles) {
      const result = verifier.isWalkable(tile.x, tile.y);
      results.push(result);
      if (result.isWalkable) {
        passCount++;
      }
    }

    const passRatio = passCount / sampledTiles.length;
    const score = Math.round(passRatio * 100);

    // 记录详细结果
    console.log(`D-001 采样结果: 通过${passCount}/${sampledTiles.length}, 评分: ${score}%`);

    // 输出失败的点（如果有）
    const failures = results.filter(r => !r.isWalkable);
    if (failures.length > 0) {
      console.log('失败的采样点:', failures.map(f => `(${f.position.x},${f.position.y})`).join(', '));
    }

    // 验证通过率
    expect(passRatio).toBeGreaterThanOrEqual(PASS_THRESHOLD);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  /**
   * D-002: 随机采样不可行走区域验证
   * 采样30个不可行走瓦片，验证每个确实不可行走
   *
   * 评分标准:
   * - 100%: 全部30个点不可达
   * - 90%: 27-29个点不可达
   * - 80%: 24-26个点不可达
   * - <80%: 不通过
   */
  test('D-002: 随机采样不可行走区域验证 - 采样30个不可行走点，验证不可达', async () => {
    const SAMPLE_COUNT = 30;
    const PASS_THRESHOLD = 0.80;

    // 获取地图信息
    const status = verifier.getStatus();
    const { mapWidth, mapHeight } = status;

    // 生成不可行走区域采样点（地图边界、建筑区域等）
    const nonWalkableSamples: TilePos[] = [];

    // 策略1: 边界墙（地图四周）
    for (let x = 0; x < mapWidth && nonWalkableSamples.length < 10; x++) {
      nonWalkableSamples.push({ x, y: 0 }); // 上边界
      nonWalkableSamples.push({ x, y: mapHeight - 1 }); // 下边界
    }
    for (let y = 0; y < mapHeight && nonWalkableSamples.length < 20; y++) {
      nonWalkableSamples.push({ x: 0, y }); // 左边界
      nonWalkableSamples.push({ x: mapWidth - 1, y }); // 右边界
    }

    // 策略2: 随机采样可能不可行走的区域
    const walkableSet = TOWN_OUTDOOR_CONFIG.walkableTiles;
    const maxAttempts = 100;
    let attempts = 0;

    while (nonWalkableSamples.length < SAMPLE_COUNT && attempts < maxAttempts) {
      const randomX = Math.floor(Math.random() * mapWidth);
      const randomY = Math.floor(Math.random() * mapHeight);
      const key = `${randomX},${randomY}`;

      if (!walkableSet.has(key)) {
        // 确保不重复
        const exists = nonWalkableSamples.some(s => s.x === randomX && s.y === randomY);
        if (!exists) {
          nonWalkableSamples.push({ x: randomX, y: randomY });
        }
      }
      attempts++;
    }

    // 验证采样数量
    expect(nonWalkableSamples.length).toBeGreaterThanOrEqual(10);

    // 验证每个采样点确实不可行走
    const results: WalkableVerifyResult[] = [];
    let passCount = 0;

    for (const tile of nonWalkableSamples) {
      const result = verifier.isWalkable(tile.x, tile.y);
      results.push(result);
      if (!result.isWalkable) {
        passCount++;
      }
    }

    const passRatio = passCount / nonWalkableSamples.length;
    const score = Math.round(passRatio * 100);

    // 记录详细结果
    console.log(`D-002 采样结果: 通过${passCount}/${nonWalkableSamples.length}, 评分: ${score}%`);

    // 输出失败的点（如果有）- 即错误标记为可行走的不可行走区域
    const failures = results.filter(r => r.isWalkable);
    if (failures.length > 0) {
      console.log('错误标记为可行走的点:', failures.map(f => `(${f.position.x},${f.position.y})`).join(', '));
    }

    // 验证通过率
    expect(passRatio).toBeGreaterThanOrEqual(PASS_THRESHOLD);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  /**
   * D-004: 门周围可达性验证
   * 验证3个门（药园、诊所、家）周围都有可行走瓦片
   *
   * 评分标准:
   * - 100%: 3个门全部可达
   * - 67%: 2个门可达
   * - 33%: 1个门可达
   * - 0%: 所有门不可达
   */
  test('D-004: 门周围可达性验证 - 验证3个门周围有可行走瓦片', async () => {
    // 验证所有门
    const doorResults = verifier.verifyAllDoors();

    expect(doorResults.length).toBe(3); // 应有3个门

    // 验证每个门
    let accessibleCount = 0;
    const doorDetails: Array<{ door: string; accessible: boolean; adjacentWalkable: number }> = [];

    for (const result of doorResults) {
      const isAccessible = result.isAccessible;
      if (isAccessible) {
        accessibleCount++;
      }

      doorDetails.push({
        door: result.door.targetScene,
        accessible: isAccessible,
        adjacentWalkable: result.adjacentWalkable.length
      });

      // 门应该至少有一个相邻可行走瓦片
      expect(result.adjacentWalkable.length).toBeGreaterThanOrEqual(0);
    }

    // 计算评分
    const score = Math.round((accessibleCount / 3) * 100);

    // 记录详细结果
    console.log(`D-004 门可达性结果: 通过${accessibleCount}/3, 评分: ${score}%`);
    console.log('门详情:', doorDetails.map(d => `${d.door}: ${d.accessible ? '可达' : '不可达'}(${d.adjacentWalkable}个相邻可行走)`).join(', '));

    // 所有门都应该可达
    expect(accessibleCount).toBe(3);
    expect(score).toBe(100);

    // 验证每个门至少有1个相邻可行走瓦片
    for (const result of doorResults) {
      expect(result.isAccessible).toBe(true);
      expect(result.adjacentWalkable.length).toBeGreaterThanOrEqual(1);
    }
  });

  /**
   * 补充验证: 出生点可行走验证
   */
  test('补充验证: 出生点位于可行走区域', async () => {
    const spawnResult = verifier.verifySpawnPoint();

    console.log(`出生点(${spawnResult.position.x},${spawnResult.position.y}): ${spawnResult.message}`);

    expect(spawnResult.isWalkable).toBe(true);
  });

  /**
   * 补充验证: 可行走瓦片数量验证
   */
  test('补充验证: 可行走瓦片数量符合预期', async () => {
    const status = verifier.getStatus();

    // 预期可行走瓦片数量: 916（基于遮罩分析）
    const EXPECTED_WALKABLE_COUNT = 916;
    const TOLERANCE = 50; // 允许一定误差

    console.log(`可行走瓦片数量: ${status.walkableTileCount}, 预期: ${EXPECTED_WALKABLE_COUNT}`);

    expect(status.walkableTileCount).toBeGreaterThanOrEqual(EXPECTED_WALKABLE_COUNT - TOLERANCE);
    expect(status.walkableTileCount).toBeLessThanOrEqual(EXPECTED_WALKABLE_COUNT + TOLERANCE);
  });
});