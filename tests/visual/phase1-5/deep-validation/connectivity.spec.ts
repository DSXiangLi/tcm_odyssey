// tests/visual/phase1-5/deep-validation/connectivity.spec.ts
/**
 * Layer 3 深度验证: 连通性验证
 *
 * 测试用例:
 * - D-003: 全区域连通性验证 - BFS验证所有可行走区域形成单一连通域
 *
 * 评分制: 每个测试独立评分，记录详细验证结果
 */

import { test, expect } from '@playwright/test';
import { WalkableVerifier, ConnectivityResult, TilePos } from '../utils/walkable-verifier';
import { TOWN_OUTDOOR_CONFIG } from '../../../../src/data/map-config';

test.describe('Layer 3 深度验证: 连通性', () => {
  let verifier: WalkableVerifier;

  test.beforeAll(async () => {
    // 初始化验证器（使用配置文件，不依赖页面）
    verifier = new WalkableVerifier();
    verifier.initializeFromConfig(TOWN_OUTDOOR_CONFIG);
  });

  /**
   * D-003: 全区域连通性验证
   * 使用BFS验证所有可行走区域形成单一连通域
   *
   * 评分标准:
   * - 100%: 所有可行走区域连通（覆盖率100%）
   * - 90%: 覆盖率90-99%
   * - 80%: 覆盖率80-89%
   * - <80%: 不通过
   */
  test('D-003: 全区域连通性验证 - BFS验证所有可行走区域形成单一连通域', async () => {
    const PASS_THRESHOLD = 0.80;

    // 执行连通性验证
    const result = verifier.verifyAllConnected();

    // 记录详细结果
    console.log(`D-003 连通性结果:`);
    console.log(`  - 连通状态: ${result.isConnected ? '完全连通' : '存在不连通区域'}`);
    console.log(`  - 可达瓦片: ${result.reachableTiles}/${result.totalWalkableTiles}`);
    console.log(`  - 覆盖率: ${(result.coverageRatio * 100).toFixed(2)}%`);
    console.log(`  - 评分: ${Math.round(result.coverageRatio * 100)}%`);

    // 输出不连通区域（如果有）
    if (result.unreachableRegions.length > 0) {
      console.log(`  - 不连通区域数量: ${result.unreachableRegions.length}`);
      // 输出前10个不连通区域作为示例
      const sampleUnreachable = result.unreachableRegions.slice(0, 10);
      console.log(`  - 不连通区域示例: ${sampleUnreachable.map(t => `(${t.x},${t.y})`).join(', ')}`);
    }

    // 验证覆盖率
    expect(result.coverageRatio).toBeGreaterThanOrEqual(PASS_THRESHOLD);

    // 验证评分
    const score = Math.round(result.coverageRatio * 100);
    expect(score).toBeGreaterThanOrEqual(80);

    // 理想情况下应该是完全连通的
    expect(result.isConnected).toBe(true);
    expect(result.coverageRatio).toBe(1);
  });

  /**
   * 补充验证: 出生点到每个门周围区域的可达性
   * 注意：门坐标本身可能不在可行走集合中，所以验证门周围的可行走区域可达性
   */
  test('补充验证: 出生点可到达所有门周围区域', async () => {
    const spawnPoint = TOWN_OUTDOOR_CONFIG.playerSpawnPoint;
    const doors = TOWN_OUTDOOR_CONFIG.doors;

    let reachableDoors = 0;
    const pathDetails: Array<{ door: string; reachable: boolean; adjacentWalkable: number }> = [];

    for (const door of doors) {
      // 获取门周围的可行走瓦片
      const adjacentWalkable = verifier.getAdjacentWalkableTiles({ x: door.tileX, y: door.tileY });

      // 验证出生点是否可以到达门周围的任一可行走瓦片
      let canReachDoor = false;
      for (const adjacent of adjacentWalkable) {
        if (verifier.canReach(spawnPoint, adjacent)) {
          canReachDoor = true;
          break;
        }
      }

      if (canReachDoor) {
        reachableDoors++;
      }

      pathDetails.push({
        door: door.targetScene,
        reachable: canReachDoor,
        adjacentWalkable: adjacentWalkable.length
      });
    }

    const score = Math.round((reachableDoors / doors.length) * 100);

    console.log(`出生点到门可达性结果:`);
    console.log(`  - 可达门数: ${reachableDoors}/${doors.length}`);
    console.log(`  - 评分: ${score}%`);
    console.log(`  - 路径详情: ${pathDetails.map(p => `${p.door}: ${p.reachable ? '可达' : '不可达'}(${p.adjacentWalkable}个相邻可行走)`).join(', ')}`);

    // 所有门周围区域都应该可达
    expect(reachableDoors).toBe(doors.length);
    expect(score).toBe(100);
  });

  /**
   * 补充验证: 任意采样点之间的连通性
   */
  test('补充验证: 随机采样点之间可互相到达', async () => {
    const SAMPLE_COUNT = 10;

    // 采样可行走瓦片
    const samples = verifier.sampleWalkableTiles(SAMPLE_COUNT);

    expect(samples.length).toBeGreaterThanOrEqual(2);

    // 测试采样点之间的互相可达性
    let reachablePairs = 0;
    const totalPairs = samples.length * (samples.length - 1); // n*(n-1)对

    const testPairs: Array<{ from: TilePos; to: TilePos; reachable: boolean }> = [];

    for (let i = 0; i < samples.length; i++) {
      for (let j = 0; j < samples.length; j++) {
        if (i !== j) {
          const from = samples[i];
          const to = samples[j];
          const canReach = verifier.canReach(from, to);

          if (canReach) {
            reachablePairs++;
          }

          testPairs.push({ from, to, reachable: canReach });
        }
      }
    }

    const passRatio = reachablePairs / totalPairs;
    const score = Math.round(passRatio * 100);

    console.log(`采样点互达性结果:`);
    console.log(`  - 测试对数: ${totalPairs}`);
    console.log(`  - 可达对数: ${reachablePairs}`);
    console.log(`  - 覆盖率: ${(passRatio * 100).toFixed(2)}%`);
    console.log(`  - 评分: ${score}%`);

    // 输出不可达的对（如果有）
    const unreachablePairs = testPairs.filter(p => !p.reachable);
    if (unreachablePairs.length > 0) {
      console.log(`  - 不可达对示例: ${unreachablePairs.slice(0, 5).map(p => `(${p.from.x},${p.from.y})→(${p.to.x},${p.to.y})`).join(', ')}`);
    }

    // 所有采样点应该互相可达
    expect(passRatio).toBeGreaterThanOrEqual(0.80);
    expect(score).toBeGreaterThanOrEqual(80);
  });

  /**
   * 补充验证: 地图边界连通性
   */
  test('补充验证: 出生点可到达边界区域', async () => {
    const spawnPoint = TOWN_OUTDOOR_CONFIG.playerSpawnPoint;
    const walkableTiles = TOWN_OUTDOOR_CONFIG.walkableTiles;
    const { width, height } = TOWN_OUTDOOR_CONFIG;

    // 找到距离边界最近的可行走瓦片（测试边界区域可达性）
    const borderTiles: TilePos[] = [];

    // 采样边界附近的可行走瓦片
    for (const key of walkableTiles) {
      const [x, y] = key.split(',').map(Number);
      const isNearBorder =
        x <= 5 || x >= width - 5 ||
        y <= 5 || y >= height - 5;

      if (isNearBorder && borderTiles.length < 8) {
        borderTiles.push({ x, y });
      }
    }

    // 验证可达性
    let reachableBorders = 0;
    const borderDetails: Array<{ pos: TilePos; reachable: boolean }> = [];

    for (const border of borderTiles) {
      const canReach = verifier.canReach(spawnPoint, border);
      if (canReach) {
        reachableBorders++;
      }
      borderDetails.push({ pos: border, reachable: canReach });
    }

    const passRatio = reachableBorders / borderTiles.length;
    const score = Math.round(passRatio * 100);

    console.log(`边界区域可达性结果:`);
    console.log(`  - 边界采样点: ${borderTiles.length}`);
    console.log(`  - 可达数量: ${reachableBorders}`);
    console.log(`  - 评分: ${score}%`);
    console.log(`  - 详情: ${borderDetails.map(d => `(${d.pos.x},${d.pos.y}): ${d.reachable ? '可达' : '不可达'}`).join(', ')}`);

    // 边界区域应该可达
    expect(passRatio).toBeGreaterThanOrEqual(0.75);
    expect(score).toBeGreaterThanOrEqual(75);
  });

  /**
   * 补充验证: 连通域数量验证
   */
  test('补充验证: 只存在单一连通域', async () => {
    const result = verifier.verifyAllConnected();

    console.log(`连通域验证:`);
    console.log(`  - 连通域状态: ${result.isConnected ? '单一连通域' : '多个连通域'}`);
    console.log(`  - 不连通区域: ${result.unreachableRegions.length}`);

    // 应该是单一连通域
    expect(result.isConnected).toBe(true);
    expect(result.unreachableRegions.length).toBe(0);
  });
});