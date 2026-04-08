// src/data/map-config.ts
/**
 * 地图配置文件
 * 集中管理所有建筑、门、路径的坐标
 * 当UI素材变更时，只需修改此文件
 *
 * Phase 1.5 更新: 基于黑白遮罩层自动映射
 * - 地图尺寸: 86×48瓦片 (2752×1536像素)
 * - 可行走瓦片: 916个 (由遮罩分析生成)
 * - 门坐标: 药园(15,8)、诊所(60,8)、家(61,35)
 */

import { TILE_SIZE } from './constants';
import { TOWN_WALKABLE_CONFIG, DOOR_POSITIONS } from './town-walkable-data';

// 建筑配置
export interface BuildingConfig {
  id: string;                    // 建筑ID
  name: string;                  // 显示名称
  startX: number;                // 建筑起始X（瓦片坐标）
  startY: number;                // 建筑起始Y（瓦片坐标）
  width: number;                 // 建筑宽度
  height: number;                // 建筑高度
  doorOffsetX: number;           // 门相对于建筑起始X的偏移
  doorY: 'top' | 'bottom';       // 门在建筑顶部还是底部
  targetScene: string;           // 目标场景
}

// 门配置
export interface DoorConfig {
  tileX: number;                 // 门瓦片X坐标
  tileY: number;                 // 门瓦片Y坐标
  targetScene: string;           // 目标场景
  spawnPoint: {                  // 从建筑返回时的出生点
    x: number;
    y: number;
  };
}

// 路径配置 - Phase 1.5使用可行走瓦片列表
export interface PathConfig {
  tiles: Array<{ x: number; y: number }>;  // 路径瓦片列表
}

// 可行走瓦片配置 - Phase 1.5新增
export interface WalkableConfig {
  walkableTiles: Array<{ x: number; y: number }>;
}

// 完整地图配置
export interface MapConfig {
  width: number;
  height: number;
  buildings: BuildingConfig[];
  doors: DoorConfig[];
  paths: PathConfig[];           // 保留兼容性，实际使用walkableTiles
  walkableTiles: Set<string>;    // Phase 1.5: 可行走瓦片集合（用于碰撞检测）
  playerSpawnPoint: { x: number; y: number };  // 默认出生点
}

/**
 * 百草镇室外地图配置 (Phase 1.5)
 * 基于黑白遮罩层自动映射生成的配置
 */
export const TOWN_OUTDOOR_CONFIG: MapConfig = {
  // 地图尺寸 - 从遮罩分析获取
  width: TOWN_WALKABLE_CONFIG.width,   // 86
  height: TOWN_WALKABLE_CONFIG.height, // 48

  // 建筑配置 - 基于遮罩分析的门位置推断
  buildings: [
    {
      id: 'garden',
      name: '老张药园',
      startX: 10,   // 门在(15,8)，建筑大致范围
      startY: 4,
      width: 10,
      height: 8,
      doorOffsetX: 5,    // startX + 5 = 15
      doorY: 'bottom',
      targetScene: 'GardenScene'
    },
    {
      id: 'clinic',
      name: '青木诊所',
      startX: 55,   // 门在(60,8)
      startY: 4,
      width: 10,
      height: 8,
      doorOffsetX: 5,    // startX + 5 = 60
      doorY: 'bottom',
      targetScene: 'ClinicScene'
    },
    {
      id: 'home',
      name: '玩家之家',
      startX: 56,   // 门在(61,35)
      startY: 30,
      width: 10,
      height: 8,
      doorOffsetX: 5,    // startX + 5 = 61
      doorY: 'bottom',
      targetScene: 'HomeScene'
    }
  ],

  // 门配置 - 从遮罩分析获取
  doors: [
    {
      tileX: DOOR_POSITIONS.garden.tileX,    // 15
      tileY: DOOR_POSITIONS.garden.tileY,    // 8
      targetScene: 'GardenScene',
      spawnPoint: { x: 15, y: 10 }  // 出生点在门外一格
    },
    {
      tileX: DOOR_POSITIONS.clinic.tileX,    // 60
      tileY: DOOR_POSITIONS.clinic.tileY,    // 8
      targetScene: 'ClinicScene',
      spawnPoint: { x: 60, y: 10 }
    },
    {
      tileX: DOOR_POSITIONS.home.tileX,      // 61
      tileY: DOOR_POSITIONS.home.tileY,      // 35
      targetScene: 'HomeScene',
      spawnPoint: { x: 61, y: 37 }
    }
  ],

  // 路径配置 - Phase 1.5改为使用可行走瓦片列表
  paths: [],  // 不再使用固定路径，使用walkableTiles

  // 可行走瓦片集合 - 从遮罩分析获取
  walkableTiles: new Set(
    TOWN_WALKABLE_CONFIG.walkableTiles.map(t => `${t.x},${t.y}`)
  ),

  // 玩家默认出生点 - 地图中心区域（基于可行走瓦片分析）
  playerSpawnPoint: { x: 47, y: 24 }  // 中心区域可行走瓦片
};

/**
 * 从建筑配置计算门坐标
 */
export function calculateDoorPosition(building: BuildingConfig): { tileX: number; tileY: number } {
  const tileX = building.startX + building.doorOffsetX;
  const tileY = building.doorY === 'bottom'
    ? building.startY + building.height - 1
    : building.startY;
  return { tileX, tileY };
}

/**
 * 初始化门配置（备用函数，Phase 1.5直接使用遮罩分析的门坐标）
 */
export function initializeDoors(buildings: BuildingConfig[]): DoorConfig[] {
  return buildings.map(building => {
    const doorPos = calculateDoorPosition(building);
    // 出生点在门外一格
    const spawnY = building.doorY === 'bottom' ? doorPos.tileY + 1 : doorPos.tileY - 1;

    return {
      tileX: doorPos.tileX,
      tileY: doorPos.tileY,
      targetScene: building.targetScene,
      spawnPoint: { x: doorPos.tileX, y: spawnY }
    };
  });
}

// Phase 1.5: 不再自动初始化门配置，使用遮罩分析的精确坐标
// TOWN_OUTDOOR_CONFIG.doors = initializeDoors(TOWN_OUTDOOR_CONFIG.buildings);

/**
 * 检查坐标是否可行走（Phase 1.5更新）
 */
export function isOnPath(x: number, y: number, config: MapConfig = TOWN_OUTDOOR_CONFIG): boolean {
  // Phase 1.5: 使用可行走瓦片集合
  if (config.walkableTiles) {
    return config.walkableTiles.has(`${x},${y}`);
  }
  // 兼容旧版本：使用paths配置
  for (const path of config.paths) {
    if (path.tiles.some(tile => tile.x === x && tile.y === y)) {
      return true;
    }
  }
  return false;
}

/**
 * 检查坐标是否可行走（Phase 1.5新增，语义更清晰）
 */
export function isWalkable(x: number, y: number, config: MapConfig = TOWN_OUTDOOR_CONFIG): boolean {
  return config.walkableTiles?.has(`${x},${y}`) ?? false;
}

/**
 * 检查坐标是否是门
 */
export function isDoor(x: number, y: number, config: MapConfig = TOWN_OUTDOOR_CONFIG): boolean {
  return config.doors.some(door => door.tileX === x && door.tileY === y);
}

/**
 * 获取门配置
 */
export function getDoorAt(x: number, y: number, config: MapConfig = TOWN_OUTDOOR_CONFIG): DoorConfig | undefined {
  return config.doors.find(door => door.tileX === x && door.tileY === y);
}

/**
 * 获取建筑配置
 */
export function getBuildingConfig(id: string, config: MapConfig = TOWN_OUTDOOR_CONFIG): BuildingConfig | undefined {
  return config.buildings.find(b => b.id === id);
}

/**
 * 瓦片坐标转像素坐标
 */
export function tileToPixel(tileX: number, tileY: number): { x: number; y: number } {
  return {
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2
  };
}

/**
 * 获取所有可行走瓦片（Phase 1.5更新）
 */
export function getAllPathTiles(config: MapConfig = TOWN_OUTDOOR_CONFIG): Set<string> {
  // Phase 1.5: 直接返回可行走瓦片集合
  if (config.walkableTiles && config.walkableTiles.size > 0) {
    return config.walkableTiles;
  }
  // 兼容旧版本：从paths构建集合
  const pathSet = new Set<string>();
  for (const path of config.paths) {
    for (const tile of path.tiles) {
      pathSet.add(`${tile.x},${tile.y}`);
    }
  }
  return pathSet;
}

/**
 * 获取所有建筑墙瓦片（用于碰撞检测）
 */
export function getBuildingWallTiles(config: MapConfig = TOWN_OUTDOOR_CONFIG): Set<string> {
  const wallSet = new Set<string>();
  for (const building of config.buildings) {
    for (let y = building.startY; y < building.startY + building.height; y++) {
      for (let x = building.startX; x < building.startX + building.width; x++) {
        const doorPos = calculateDoorPosition(building);
        // 门不是墙
        if (x !== doorPos.tileX || y !== doorPos.tileY) {
          wallSet.add(`${x},${y}`);
        }
      }
    }
  }
  return wallSet;
}