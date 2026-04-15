// tests/visual/phase1-5/deep-validation/walkable-coverage.spec.ts
/**
 * Layer 3 深度验证: 可行走区域覆盖验证
 *
 * 测试用例:
 * - D-001: 分层采样可行走区域验证 - 51个采样点（边界+角落+门+出生点+随机）
 * - D-002: 分层采样不可行走区域验证 - 43个采样点（水域+建筑+边界外+随机）
 * - D-004: 门周围可达性验证 - 验证3个门周围有可行走瓦片
 *
 * 采样策略改进:
 * - 可行走采样分层: 边界(10) + 角落(4) + 门周围(9) + 出生点(8) + 随机(20) = 51点
 * - 不可行走采样分层: 水域/建筑(10) + 建筑内部(9) + 边界外(4) + 随机(20) = 43点
 *
 * 评分制: 每个测试独立评分，记录详细验证结果
 */

import { test, expect } from '@playwright/test';
import { WalkableVerifier, TilePos, WalkableVerifyResult } from '../utils/walkable-verifier';
import { TOWN_OUTDOOR_CONFIG, BuildingConfig } from '../../../../src/data/map-config';

// 地图参数
const MAP_WIDTH = 86;
const MAP_HEIGHT = 48;
const SPAWN_POINT = { x: 47, y: 24 };
const DOORS = [
  { name: '药园', x: 15, y: 8 },
  { name: '诊所', x: 60, y: 8 },
  { name: '家', x: 61, y: 35 }
];
const BUILDINGS: BuildingConfig[] = [
  { id: 'garden', name: '老张药园', startX: 10, startY: 4, width: 10, height: 8, doorOffsetX: 5, doorY: 'bottom', targetScene: 'GardenScene' },
  { id: 'clinic', name: '青木诊所', startX: 55, startY: 4, width: 10, height: 8, doorOffsetX: 5, doorY: 'bottom', targetScene: 'ClinicScene' },
  { id: 'home', name: '玩家之家', startX: 56, startY: 30, width: 10, height: 8, doorOffsetX: 5, doorY: 'bottom', targetScene: 'HomeScene' }
];

/**
 * 分层采样可行走瓦片
 * @param verifier 可行走验证器
 * @param walkableSet 可行走瓦片集合
 * @returns 分层采样结果
 */
function stratifiedWalkableSampling(
  verifier: WalkableVerifier,
  walkableSet: Set<string>
): {
  samples: TilePos[];
  layers: {
    boundary: TilePos[];
    corners: TilePos[];
    doorSurroundings: TilePos[];
    spawnSurroundings: TilePos[];
    random: TilePos[];
  };
  summary: string;
} {
  const layers = {
    boundary: [] as TilePos[],
    corners: [] as TilePos[],
    doorSurroundings: [] as TilePos[],
    spawnSurroundings: [] as TilePos[],
    random: [] as TilePos[]
  };

  // 1. 边界采样 (10点) - 地图边缘可行走瓦片
  // 采样上边缘、下边缘、左边缘、右边缘各2-3个可行走点
  const boundaryCandidates: TilePos[] = [];

  // 上边缘 (y=0)
  for (let x = 0; x < MAP_WIDTH && boundaryCandidates.length < 30; x++) {
    if (walkableSet.has(`${x},0`)) boundaryCandidates.push({ x, y: 0 });
  }
  // 下边缘 (y=MAP_HEIGHT-1)
  for (let x = 0; x < MAP_WIDTH && boundaryCandidates.length < 60; x++) {
    if (walkableSet.has(`${x},${MAP_HEIGHT - 1}`)) boundaryCandidates.push({ x, y: MAP_HEIGHT - 1 });
  }
  // 左边缘 (x=0)
  for (let y = 0; y < MAP_HEIGHT && boundaryCandidates.length < 90; y++) {
    if (walkableSet.has(`0,${y}`)) boundaryCandidates.push({ x: 0, y });
  }
  // 右边缘 (x=MAP_WIDTH-1)
  for (let y = 0; y < MAP_HEIGHT && boundaryCandidates.length < 120; y++) {
    if (walkableSet.has(`${MAP_WIDTH - 1},${y}`)) boundaryCandidates.push({ x: MAP_WIDTH - 1, y });
  }

  // 随机选择10个边界可行走点
  while (layers.boundary.length < 10 && boundaryCandidates.length > 0) {
    const idx = Math.floor(Math.random() * boundaryCandidates.length);
    const candidate = boundaryCandidates.splice(idx, 1)[0];
    if (!layers.boundary.some(s => s.x === candidate.x && s.y === candidate.y)) {
      layers.boundary.push(candidate);
    }
  }

  // 2. 角落采样 (4点) - 四个角落附近5x5区域内的可行走瓦片
  const cornerRegions = [
    { name: '左上角', minX: 0, maxX: 10, minY: 0, maxY: 10 },
    { name: '右上角', minX: MAP_WIDTH - 10, maxX: MAP_WIDTH, minY: 0, maxY: 10 },
    { name: '左下角', minX: 0, maxX: 10, minY: MAP_HEIGHT - 10, maxY: MAP_HEIGHT },
    { name: '右下角', minX: MAP_WIDTH - 10, maxX: MAP_WIDTH, minY: MAP_HEIGHT - 10, maxY: MAP_HEIGHT }
  ];

  for (const region of cornerRegions) {
    const cornerCandidates: TilePos[] = [];
    for (let x = region.minX; x < region.maxX; x++) {
      for (let y = region.minY; y < region.maxY; y++) {
        if (walkableSet.has(`${x},${y}`)) {
          cornerCandidates.push({ x, y });
        }
      }
    }
    if (cornerCandidates.length > 0) {
      const idx = Math.floor(Math.random() * cornerCandidates.length);
      layers.corners.push(cornerCandidates[idx]);
    }
  }

  // 3. 门周围采样 (9点) - 每个门周围3点
  for (const door of DOORS) {
    const doorCandidates: TilePos[] = [];
    // 门周围的8个相邻位置 + 更远的范围
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        if (dx === 0 && dy === 0) continue; // 跳过门本身
        const x = door.x + dx;
        const y = door.y + dy;
        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT && walkableSet.has(`${x},${y}`)) {
          doorCandidates.push({ x, y });
        }
      }
    }
    // 随机选择3个
    let selected = 0;
    while (selected < 3 && doorCandidates.length > 0) {
      const idx = Math.floor(Math.random() * doorCandidates.length);
      const candidate = doorCandidates.splice(idx, 1)[0];
      if (!layers.doorSurroundings.some(s => s.x === candidate.x && s.y === candidate.y)) {
        layers.doorSurroundings.push(candidate);
        selected++;
      }
    }
  }

  // 4. 出生点采样 (8点) - 出生点周围8方向
  const spawnDirections = [
    { dx: -2, dy: 0 },   // 左
    { dx: 2, dy: 0 },    // 右
    { dx: 0, dy: -2 },   // 上
    { dx: 0, dy: 2 },    // 下
    { dx: -2, dy: -2 },  // 左上
    { dx: 2, dy: -2 },   // 右上
    { dx: -2, dy: 2 },   // 左下
    { dx: 2, dy: 2 }     // 右下
  ];

  for (const dir of spawnDirections) {
    const x = SPAWN_POINT.x + dir.dx;
    const y = SPAWN_POINT.y + dir.dy;
    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT && walkableSet.has(`${x},${y}`)) {
      layers.spawnSurroundings.push({ x, y });
    }
  }
  // 如果8方向不够，补充附近的可行走点
  if (layers.spawnSurroundings.length < 8) {
    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = -4; dy <= 4; dy++) {
        if (dx === 0 && dy === 0) continue;
        const x = SPAWN_POINT.x + dx;
        const y = SPAWN_POINT.y + dy;
        if (walkableSet.has(`${x},${y}`) && !layers.spawnSurroundings.some(s => s.x === x && s.y === y)) {
          layers.spawnSurroundings.push({ x, y });
          if (layers.spawnSurroundings.length >= 8) break;
        }
      }
      if (layers.spawnSurroundings.length >= 8) break;
    }
  }

  // 5. 随机采样 (20点) - 从剩余可行走瓦片中随机选择
  const allWalkableArray = Array.from(walkableSet).map(key => {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  });

  // 排除已选择的点
  const alreadySelected = new Set<string>();
  for (const layer of [layers.boundary, layers.corners, layers.doorSurroundings, layers.spawnSurroundings]) {
    for (const tile of layer) {
      alreadySelected.add(`${tile.x},${tile.y}`);
    }
  }

  const remainingTiles = allWalkableArray.filter(t => !alreadySelected.has(`${t.x},${t.y}`));

  while (layers.random.length < 20 && remainingTiles.length > 0) {
    const idx = Math.floor(Math.random() * remainingTiles.length);
    const candidate = remainingTiles.splice(idx, 1)[0];
    layers.random.push(candidate);
  }

  // 合并所有采样点
  const samples = [
    ...layers.boundary,
    ...layers.corners,
    ...layers.doorSurroundings,
    ...layers.spawnSurroundings,
    ...layers.random
  ];

  // 生成摘要
  const summary = `分层采样结果:
  - 边界采样: ${layers.boundary.length}点 ${layers.boundary.map(t => `(${t.x},${t.y})`).join(', ')}
  - 角落采样: ${layers.corners.length}点 ${layers.corners.map(t => `(${t.x},${t.y})`).join(', ')}
  - 门周围: ${layers.doorSurroundings.length}点 ${layers.doorSurroundings.map(t => `(${t.x},${t.y})`).join(', ')}
  - 出生点周围: ${layers.spawnSurroundings.length}点 ${layers.spawnSurroundings.map(t => `(${t.x},${t.y})`).join(', ')}
  - 随机采样: ${layers.random.length}点
  总计: ${samples.length}点`;

  return { samples, layers, summary };
}

/**
 * 分层采样不可行走瓦片
 * @param verifier 可行走验证器
 * @param walkableSet 可行走瓦片集合
 * @returns 分层采样结果
 */
function stratifiedNonWalkableSampling(
  verifier: WalkableVerifier,
  walkableSet: Set<string>
): {
  samples: TilePos[];
  layers: {
    waterOrBuilding: TilePos[];
    buildingInterior: TilePos[];
    outsideBoundary: TilePos[];
    random: TilePos[];
  };
  summary: string;
} {
  const layers = {
    waterOrBuilding: [] as TilePos[],
    buildingInterior: [] as TilePos[],
    outsideBoundary: [] as TilePos[],
    random: [] as TilePos[]
  };

  // 1. 水域/建筑采样 (10点)
  // 根据地图设计，水域可能在特定区域。如果无法确定水域，使用建筑内部代替
  // 这里假设水域可能在地图中央偏下区域（根据一般游戏设计）
  // 先尝试水域区域，如果没有足够的不可行走点，使用建筑外墙区域

  // 尝试水域采样（假设水域范围: y在20-35，x在30-50）
  const waterCandidates: TilePos[] = [];
  for (let x = 30; x < 50; x++) {
    for (let y = 20; y < 35; y++) {
      if (!walkableSet.has(`${x},${y}`)) {
        waterCandidates.push({ x, y });
      }
    }
  }

  // 随机选择水域点
  while (layers.waterOrBuilding.length < 10 && waterCandidates.length > 0) {
    const idx = Math.floor(Math.random() * waterCandidates.length);
    const candidate = waterCandidates.splice(idx, 1)[0];
    if (!layers.waterOrBuilding.some(s => s.x === candidate.x && s.y === candidate.y)) {
      layers.waterOrBuilding.push(candidate);
    }
  }

  // 如果水域采样不够，补充建筑外墙区域
  if (layers.waterOrBuilding.length < 10) {
    // 建筑外墙采样（建筑周围一圈）
    for (const building of BUILDINGS) {
      for (let x = building.startX - 1; x <= building.startX + building.width && layers.waterOrBuilding.length < 10; x++) {
        for (let y = building.startY - 1; y <= building.startY + building.height && layers.waterOrBuilding.length < 10; y++) {
          if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT && !walkableSet.has(`${x},${y}`)) {
            if (!layers.waterOrBuilding.some(s => s.x === x && s.y === y)) {
              layers.waterOrBuilding.push({ x, y });
            }
          }
        }
      }
    }
  }

  // 2. 建筑内部采样 (9点) - 每个建筑内部3点
  for (const building of BUILDINGS) {
    const interiorCandidates: TilePos[] = [];
    // 建筑内部（排除门位置）
    for (let x = building.startX + 1; x < building.startX + building.width - 1; x++) {
      for (let y = building.startY + 1; y < building.startY + building.height - 1; y++) {
        // 排除门位置
        const doorX = building.startX + building.doorOffsetX;
        const doorY = building.doorY === 'bottom' ? building.startY + building.height - 1 : building.startY;
        if (x !== doorX || y !== doorY) {
          interiorCandidates.push({ x, y });
        }
      }
    }
    // 随机选择3个
    let selected = 0;
    while (selected < 3 && interiorCandidates.length > 0) {
      const idx = Math.floor(Math.random() * interiorCandidates.length);
      const candidate = interiorCandidates.splice(idx, 1)[0];
      if (!layers.buildingInterior.some(s => s.x === candidate.x && s.y === candidate.y)) {
        layers.buildingInterior.push(candidate);
        selected++;
      }
    }
  }

  // 3. 边界外采样 (4点) - 地图边界外的坐标
  layers.outsideBoundary = [
    { x: -1, y: -1 },                    // 左上角外
    { x: MAP_WIDTH, y: 0 },              // 右上角外
    { x: 0, y: MAP_HEIGHT },             // 左下角外
    { x: MAP_WIDTH, y: MAP_HEIGHT }      // 右下角外
  ];

  // 4. 随机采样 (20点) - 随机不可行走瓦片
  const allNonWalkable: TilePos[] = [];
  for (let x = 0; x < MAP_WIDTH; x++) {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      if (!walkableSet.has(`${x},${y}`)) {
        allNonWalkable.push({ x, y });
      }
    }
  }

  // 排除已选择的点
  const alreadySelected = new Set<string>();
  for (const layer of [layers.waterOrBuilding, layers.buildingInterior]) {
    for (const tile of layer) {
      alreadySelected.add(`${tile.x},${tile.y}`);
    }
  }
  // 边界外的点不在地图内，不需要排除

  const remainingTiles = allNonWalkable.filter(t => !alreadySelected.has(`${t.x},${t.y}`));

  while (layers.random.length < 20 && remainingTiles.length > 0) {
    const idx = Math.floor(Math.random() * remainingTiles.length);
    const candidate = remainingTiles.splice(idx, 1)[0];
    layers.random.push(candidate);
  }

  // 合并所有采样点（边界外的点不计入总数验证，但会测试）
  const samples = [
    ...layers.waterOrBuilding,
    ...layers.buildingInterior,
    ...layers.outsideBoundary,
    ...layers.random
  ];

  // 生成摘要
  const summary = `分层采样结果:
  - 水域/建筑采样: ${layers.waterOrBuilding.length}点 ${layers.waterOrBuilding.map(t => `(${t.x},${t.y})`).slice(0, 5).join(', ')}...
  - 建筑内部: ${layers.buildingInterior.length}点 ${layers.buildingInterior.map(t => `(${t.x},${t.y})`).join(', ')}
  - 边界外: ${layers.outsideBoundary.length}点 (超出地图范围)
  - 随机采样: ${layers.random.length}点
  总计: ${samples.length}点`;

  return { samples, layers, summary };
}

test.describe('Layer 3 深度验证: 可行走区域覆盖', () => {
  let verifier: WalkableVerifier;

  test.beforeAll(async () => {
    // 初始化验证器（使用配置文件，不依赖页面）
    verifier = new WalkableVerifier();
    verifier.initializeFromConfig(TOWN_OUTDOOR_CONFIG);
  });

  /**
   * D-001: 分层采样可行走区域验证
   * 采样51个可行走瓦片（边界+角落+门+出生点+随机），验证每个都确实可行走
   *
   * 分层采样策略:
   * - 边界采样 (10点) - 地图边缘可行走瓦片
   * - 角落采样 (4点) - 四个角落附近
   * - 门周围采样 (9点) - 每个门周围3点
   * - 出生点采样 (8点) - 出生点周围8方向
   * - 随机采样 (20点) - 随机可行走瓦片
   * - 总计: 51点
   *
   * 评分标准:
   * - 100%: 全部51个点可达
   * - 90%: 46-50个点可达
   * - 80%: 41-45个点可达
   * - <80%: 不通过
   */
  test('D-001: 分层采样可行走区域验证 - 边界+角落+门+出生点+随机，共51点', async () => {
    const PASS_THRESHOLD = 0.80; // 80%通过阈值

    // 获取可行走瓦片集合
    const walkableSet = TOWN_OUTDOOR_CONFIG.walkableTiles;

    // 执行分层采样
    const samplingResult = stratifiedWalkableSampling(verifier, walkableSet);

    // 输出详细分层采样信息
    console.log('\n========================================');
    console.log('D-001 分层可行走采样详情');
    console.log('========================================');
    console.log(samplingResult.summary);
    console.log('========================================\n');

    // 验证采样数量
    expect(samplingResult.samples.length).toBeGreaterThanOrEqual(40);

    // 验证各层采样数量
    console.log('各层采样数量验证:');
    console.log(`  边界采样: ${samplingResult.layers.boundary.length}点 (预期10)`);
    console.log(`  角落采样: ${samplingResult.layers.corners.length}点 (预期4)`);
    console.log(`  门周围采样: ${samplingResult.layers.doorSurroundings.length}点 (预期9)`);
    console.log(`  出生点采样: ${samplingResult.layers.spawnSurroundings.length}点 (预期8)`);
    console.log(`  随机采样: ${samplingResult.layers.random.length}点 (预期20)`);

    // 验证每个采样点确实可行走
    const results: WalkableVerifyResult[] = [];
    let passCount = 0;
    const layerResults: Record<string, { pass: number; fail: number }> = {
      boundary: { pass: 0, fail: 0 },
      corners: { pass: 0, fail: 0 },
      doorSurroundings: { pass: 0, fail: 0 },
      spawnSurroundings: { pass: 0, fail: 0 },
      random: { pass: 0, fail: 0 }
    };

    for (const tile of samplingResult.samples) {
      const result = verifier.isWalkable(tile.x, tile.y);
      results.push(result);
      if (result.isWalkable) {
        passCount++;
      }
    }

    // 分类统计各层通过/失败
    for (const [layerName, tiles] of Object.entries(samplingResult.layers)) {
      for (const tile of tiles) {
        const result = verifier.isWalkable(tile.x, tile.y);
        if (result.isWalkable) {
          layerResults[layerName].pass++;
        } else {
          layerResults[layerName].fail++;
        }
      }
    }

    const passRatio = passCount / samplingResult.samples.length;
    const score = Math.round(passRatio * 100);

    // 输出详细结果
    console.log('\n========================================');
    console.log('D-001 分层验证结果');
    console.log('========================================');
    console.log(`总体通过率: ${passCount}/${samplingResult.samples.length}, 评分: ${score}%`);
    console.log('\n各层验证详情:');
    for (const [layerName, stats] of Object.entries(layerResults)) {
      console.log(`  ${layerName}: 通过${stats.pass}/${stats.pass + stats.fail}`);
    }

    // 输出失败的点（如果有）
    const failures = results.filter(r => !r.isWalkable);
    if (failures.length > 0) {
      console.log('\n失败的采样点:');
      for (const f of failures) {
        console.log(`  (${f.position.x},${f.position.y}) - ${f.message}`);
      }
    }
    console.log('========================================\n');

    // 验证通过率
    expect(passRatio).toBeGreaterThanOrEqual(PASS_THRESHOLD);
    expect(score).toBeGreaterThanOrEqual(80);

    // 验证边界采样至少有5个通过
    expect(layerResults.boundary.pass).toBeGreaterThanOrEqual(5);

    // 验证门周围采样至少有6个通过
    expect(layerResults.doorSurroundings.pass).toBeGreaterThanOrEqual(6);

    // 验证出生点采样至少有4个通过
    expect(layerResults.spawnSurroundings.pass).toBeGreaterThanOrEqual(4);
  });

  /**
   * D-002: 分层采样不可行走区域验证
   * 采样43个不可行走瓦片（水域/建筑+建筑内部+边界外+随机），验证每个确实不可行走
   *
   * 分层采样策略:
   * - 水域采样 (10点) - 根据地图设计确定水域范围，不足时用建筑外墙代替
   * - 建筑内部采样 (9点) - 每个建筑内部3点
   * - 边界外采样 (4点) - 地图边界外坐标
   * - 随机采样 (20点) - 随机不可行走瓦片
   * - 总计: 43点
   *
   * 评分标准:
   * - 100%: 全部43个点不可达
   * - 90%: 39-42个点不可达
   * - 80%: 34-38个点不可达
   * - <80%: 不通过
   */
  test('D-002: 分层采样不可行走区域验证 - 水域+建筑+边界外+随机，共43点', async () => {
    const PASS_THRESHOLD = 0.80;

    // 获取可行走瓦片集合
    const walkableSet = TOWN_OUTDOOR_CONFIG.walkableTiles;

    // 执行分层采样
    const samplingResult = stratifiedNonWalkableSampling(verifier, walkableSet);

    // 输出详细分层采样信息
    console.log('\n========================================');
    console.log('D-002 分层不可行走采样详情');
    console.log('========================================');
    console.log(samplingResult.summary);
    console.log('========================================\n');

    // 验证采样数量（排除边界外的4个点，因为它们在地图范围外）
    const inMapSamples = [
      ...samplingResult.layers.waterOrBuilding,
      ...samplingResult.layers.buildingInterior,
      ...samplingResult.layers.random
    ];
    expect(inMapSamples.length).toBeGreaterThanOrEqual(30); // 至少30个在地图内的不可行走点

    // 验证各层采样数量
    console.log('各层采样数量验证:');
    console.log(`  水域/建筑采样: ${samplingResult.layers.waterOrBuilding.length}点 (预期10)`);
    console.log(`  建筑内部采样: ${samplingResult.layers.buildingInterior.length}点 (预期9)`);
    console.log(`  边界外采样: ${samplingResult.layers.outsideBoundary.length}点 (预期4)`);
    console.log(`  随机采样: ${samplingResult.layers.random.length}点 (预期20)`);

    // 验证每个采样点确实不可行走
    const results: WalkableVerifyResult[] = [];
    let passCount = 0; // 这里passCount表示"确实不可行走"
    const layerResults: Record<string, { pass: number; fail: number }> = {
      waterOrBuilding: { pass: 0, fail: 0 },
      buildingInterior: { pass: 0, fail: 0 },
      outsideBoundary: { pass: 0, fail: 0 },
      random: { pass: 0, fail: 0 }
    };

    for (const tile of samplingResult.samples) {
      const result = verifier.isWalkable(tile.x, tile.y);
      results.push(result);
      if (!result.isWalkable) {
        passCount++; // 不可行走验证通过
      }
    }

    // 分类统计各层通过/失败
    for (const [layerName, tiles] of Object.entries(samplingResult.layers)) {
      for (const tile of tiles) {
        const result = verifier.isWalkable(tile.x, tile.y);
        if (!result.isWalkable) {
          layerResults[layerName].pass++;
        } else {
          layerResults[layerName].fail++;
        }
      }
    }

    const passRatio = passCount / samplingResult.samples.length;
    const score = Math.round(passRatio * 100);

    // 输出详细结果
    console.log('\n========================================');
    console.log('D-002 分层验证结果');
    console.log('========================================');
    console.log(`总体通过率: ${passCount}/${samplingResult.samples.length}, 评分: ${score}%`);
    console.log('\n各层验证详情:');
    for (const [layerName, stats] of Object.entries(layerResults)) {
      console.log(`  ${layerName}: 确实不可行走${stats.pass}/${stats.pass + stats.fail}`);
    }

    // 输出失败的点（如果有）- 即错误标记为可行走的不可行走区域
    const failures = results.filter(r => r.isWalkable);
    if (failures.length > 0) {
      console.log('\n错误标记为可行走的点:');
      for (const f of failures) {
        console.log(`  (${f.position.x},${f.position.y}) - ${f.message}`);
      }
    }
    console.log('========================================\n');

    // 验证通过率
    expect(passRatio).toBeGreaterThanOrEqual(PASS_THRESHOLD);
    expect(score).toBeGreaterThanOrEqual(80);

    // 边界外采样应该全部不可行走（超出地图范围）
    expect(layerResults.outsideBoundary.pass).toBe(4);

    // 建筑内部采样应该至少有7个不可行走
    expect(layerResults.buildingInterior.pass).toBeGreaterThanOrEqual(7);
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