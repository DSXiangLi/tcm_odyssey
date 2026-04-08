// tests/visual/phase1-5/utils/walkable-verifier.ts
/**
 * 可行走区域验证器
 * 用于验证Yaoling Shangu游戏的可行走区域连通性和可达性
 *
 * 关键参数:
 * - 地图尺寸: 86x48瓦片
 * - 可行走瓦片数: 916
 * - 门坐标: 药园(15,8)、诊所(60,8)、家(61,35)
 * - 出生点: (47,24)
 */

import { Page } from '@playwright/test';
import {
  TOWN_OUTDOOR_CONFIG,
  MapConfig,
  DoorConfig,
  isWalkable,
  isDoor,
  getAllPathTiles
} from '../../../../src/data/map-config';

/**
 * 瓦片位置
 */
export interface TilePos {
  x: number;
  y: number;
}

/**
 * 可行走验证结果
 */
export interface WalkableVerifyResult {
  position: TilePos;
  isWalkable: boolean;
  message: string;
}

/**
 * 连通性验证结果
 */
export interface ConnectivityResult {
  isConnected: boolean;
  reachableTiles: number;
  totalWalkableTiles: number;
  unreachableRegions: TilePos[];
  coverageRatio: number;
  message: string;
}

/**
 * 路径搜索结果
 */
export interface PathResult {
  found: boolean;
  path: TilePos[];
  length: number;
  message: string;
}

/**
 * 门可达性验证结果
 */
export interface DoorAccessibilityResult {
  door: DoorConfig;
  isAccessible: boolean;
  adjacentWalkable: TilePos[];
  pathFromSpawn: PathResult;
  message: string;
}

/**
 * 可行走区域验证器类
 */
export class WalkableVerifier {
  private walkableTiles: Set<string> = new Set();
  private mapConfig: MapConfig | null = null;
  private initialized: boolean = false;
  private mapWidth: number = 0;
  private mapHeight: number = 0;

  /**
   * 从游戏状态初始化验证器
   */
  async initialize(page: Page): Promise<boolean> {
    try {
      // 从页面获取游戏状态
      const gameState = await page.evaluate(() => {
        const getState = (window as unknown as Record<string, unknown>).__GAME_STATE__;
        if (typeof getState === 'function') {
          return getState() as {
            mapData?: { width: number; height: number; tiles?: unknown[][] };
            walkableTiles?: string[];
          };
        }
        return null;
      });

      if (gameState?.mapData) {
        this.mapWidth = gameState.mapData.width;
        this.mapHeight = gameState.mapData.height;
      } else {
        // 使用配置文件默认值
        this.mapWidth = TOWN_OUTDOOR_CONFIG.width;
        this.mapHeight = TOWN_OUTDOOR_CONFIG.height;
      }

      // 从配置文件获取可行走瓦片
      this.walkableTiles = getAllPathTiles(TOWN_OUTDOOR_CONFIG);
      this.mapConfig = TOWN_OUTDOOR_CONFIG;
      this.initialized = true;

      return true;
    } catch (error) {
      console.error('初始化失败:', error);
      return false;
    }
  }

  /**
   * 从配置文件直接初始化（不依赖页面）
   */
  initializeFromConfig(config: MapConfig = TOWN_OUTDOOR_CONFIG): void {
    this.mapWidth = config.width;
    this.mapHeight = config.height;
    this.walkableTiles = getAllPathTiles(config);
    this.mapConfig = config;
    this.initialized = true;
  }

  /**
   * 验证单个位置是否可行走
   */
  isWalkable(x: number, y: number): WalkableVerifyResult {
    if (!this.initialized) {
      return {
        position: { x, y },
        isWalkable: false,
        message: '验证器未初始化'
      };
    }

    // 检查坐标是否在地图范围内
    if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
      return {
        position: { x, y },
        isWalkable: false,
        message: `坐标(${x},${y})超出地图范围(${this.mapWidth}x${this.mapHeight})`
      };
    }

    const key = `${x},${y}`;
    const walkable = this.walkableTiles.has(key);

    return {
      position: { x, y },
      isWalkable: walkable,
      message: walkable
        ? `坐标(${x},${y})可行走`
        : `坐标(${x},${y})不可行走`
    };
  }

  /**
   * 验证从起点到终点的可达性（BFS）
   */
  canReach(from: TilePos, to: TilePos): boolean {
    if (!this.initialized) {
      return false;
    }

    // 检查起点和终点是否可行走
    if (!this.walkableTiles.has(`${from.x},${from.y}`) ||
        !this.walkableTiles.has(`${to.x},${to.y}`)) {
      return false;
    }

    // BFS搜索
    const visited = new Set<string>();
    const queue: TilePos[] = [from];
    visited.add(`${from.x},${from.y}`);

    const directions = [
      { dx: 0, dy: 1 },   // 下
      { dx: 0, dy: -1 },  // 上
      { dx: 1, dy: 0 },   // 右
      { dx: -1, dy: 0 }   // 左
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.x === to.x && current.y === to.y) {
        return true;
      }

      for (const { dx, dy } of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const key = `${nx},${ny}`;

        if (this.walkableTiles.has(key) && !visited.has(key)) {
          visited.add(key);
          queue.push({ x: nx, y: ny });
        }
      }
    }

    return false;
  }

  /**
   * BFS寻路
   */
  findPath(from: TilePos, to: TilePos): PathResult {
    if (!this.initialized) {
      return {
        found: false,
        path: [],
        length: 0,
        message: '验证器未初始化'
      };
    }

    // 检查起点是否可行走
    const fromWalkable = this.walkableTiles.has(`${from.x},${from.y}`);
    const toWalkable = this.walkableTiles.has(`${to.x},${to.y}`);

    if (!fromWalkable) {
      return {
        found: false,
        path: [],
        length: 0,
        message: `起点(${from.x},${from.y})不可行走`
      };
    }

    if (!toWalkable) {
      return {
        found: false,
        path: [],
        length: 0,
        message: `终点(${to.x},${to.y})不可行走`
      };
    }

    // BFS搜索路径
    const visited = new Map<string, TilePos>();
    const queue: TilePos[] = [from];
    visited.set(`${from.x},${from.y}`, from);

    const directions = [
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 }
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.x === to.x && current.y === to.y) {
        // 回溯构建路径
        const path: TilePos[] = [];
        let pos: TilePos | undefined = current;
        while (pos) {
          path.unshift(pos);
          pos = visited.get(`${pos.x},${pos.y}`);
          // 防止无限循环
          if (path.length > 1000) break;
        }
        return {
          found: true,
          path,
          length: path.length,
          message: `找到路径，长度${path.length}`
        };
      }

      for (const { dx, dy } of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const key = `${nx},${ny}`;

        if (this.walkableTiles.has(key) && !visited.has(key)) {
          visited.set(key, { x: nx, y: ny });
          queue.push({ x: nx, y: ny });
        }
      }
    }

    return {
      found: false,
      path: [],
      length: 0,
      message: `无法从(${from.x},${from.y})到达(${to.x},${to.y})`
    };
  }

  /**
   * 验证所有可行走区域的连通性
   */
  verifyAllConnected(): ConnectivityResult {
    if (!this.initialized) {
      return {
        isConnected: false,
        reachableTiles: 0,
        totalWalkableTiles: 0,
        unreachableRegions: [],
        coverageRatio: 0,
        message: '验证器未初始化'
      };
    }

    const totalWalkable = this.walkableTiles.size;

    if (totalWalkable === 0) {
      return {
        isConnected: false,
        reachableTiles: 0,
        totalWalkableTiles: 0,
        unreachableRegions: [],
        coverageRatio: 0,
        message: '没有可行走瓦片'
      };
    }

    // 找第一个可行走瓦片作为起始点
    const firstTileKey = Array.from(this.walkableTiles)[0];
    const [startX, startY] = firstTileKey.split(',').map(Number);
    const startPos: TilePos = { x: startX, y: startY };

    // BFS计算可达区域
    const visited = new Set<string>();
    const queue: TilePos[] = [startPos];
    visited.add(firstTileKey);

    const directions = [
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 }
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const { dx, dy } of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const key = `${nx},${ny}`;

        if (this.walkableTiles.has(key) && !visited.has(key)) {
          visited.add(key);
          queue.push({ x: nx, y: ny });
        }
      }
    }

    // 找出不可达区域
    const unreachableRegions: TilePos[] = [];
    for (const tileKey of this.walkableTiles) {
      if (!visited.has(tileKey)) {
        const [x, y] = tileKey.split(',').map(Number);
        unreachableRegions.push({ x, y });
      }
    }

    const coverageRatio = visited.size / totalWalkable;
    const isConnected = visited.size === totalWalkable;

    return {
      isConnected,
      reachableTiles: visited.size,
      totalWalkableTiles: totalWalkable,
      unreachableRegions,
      coverageRatio,
      message: isConnected
        ? `所有可行走区域连通，共${totalWalkable}个瓦片`
        : `存在不连通区域，可达${visited.size}/${totalWalkable}，覆盖率${(coverageRatio * 100).toFixed(2)}%`
    };
  }

  /**
   * 随机采样可行走瓦片
   */
  sampleWalkableTiles(count: number): TilePos[] {
    if (!this.initialized) {
      return [];
    }

    const allTiles = Array.from(this.walkableTiles);

    if (allTiles.length <= count) {
      return allTiles.map(key => {
        const [x, y] = key.split(',').map(Number);
        return { x, y };
      });
    }

    // 随机采样
    const sampledIndices = new Set<number>();
    const result: TilePos[] = [];

    while (result.length < count) {
      const randomIndex = Math.floor(Math.random() * allTiles.length);
      if (!sampledIndices.has(randomIndex)) {
        sampledIndices.add(randomIndex);
        const [x, y] = allTiles[randomIndex].split(',').map(Number);
        result.push({ x, y });
      }
    }

    return result;
  }

  /**
   * 验证门可达性
   */
  verifyDoorAccessibility(doorPos: TilePos): DoorAccessibilityResult {
    if (!this.initialized || !this.mapConfig) {
      return {
        door: { tileX: doorPos.x, tileY: doorPos.y, targetScene: 'unknown', spawnPoint: { x: 0, y: 0 } },
        isAccessible: false,
        adjacentWalkable: [],
        pathFromSpawn: { found: false, path: [], length: 0, message: '验证器未初始化' },
        message: '验证器未初始化'
      };
    }

    // 查找门配置
    const door = this.mapConfig.doors.find(d => d.tileX === doorPos.x && d.tileY === doorPos.y);
    if (!door) {
      return {
        door: { tileX: doorPos.x, tileY: doorPos.y, targetScene: 'unknown', spawnPoint: { x: 0, y: 0 } },
        isAccessible: false,
        adjacentWalkable: [],
        pathFromSpawn: { found: false, path: [], length: 0, message: '门配置不存在' },
        message: `门(${doorPos.x},${doorPos.y})配置不存在`
      };
    }

    // 检查门周围的可行走瓦片
    const adjacentPositions: TilePos[] = [
      { x: doorPos.x - 1, y: doorPos.y },
      { x: doorPos.x + 1, y: doorPos.y },
      { x: doorPos.x, y: doorPos.y - 1 },
      { x: doorPos.x, y: doorPos.y + 1 }
    ];

    const adjacentWalkable = adjacentPositions.filter(pos =>
      this.walkableTiles.has(`${pos.x},${pos.y}`)
    );

    // 从出生点到门的路径
    const spawnPoint = this.mapConfig.playerSpawnPoint;
    const pathFromSpawn = this.findPath(spawnPoint, doorPos);

    // 门可达的条件: 至少有一个相邻可行走瓦片
    const isAccessible = adjacentWalkable.length > 0;

    return {
      door,
      isAccessible,
      adjacentWalkable,
      pathFromSpawn,
      message: isAccessible
        ? `门(${doorPos.x},${doorPos.y})可达，相邻可行走瓦片${adjacentWalkable.length}个`
        : `门(${doorPos.x},${doorPos.y})不可达，无相邻可行走瓦片`
    };
  }

  /**
   * 验证所有门的可达性
   */
  verifyAllDoors(): DoorAccessibilityResult[] {
    if (!this.initialized || !this.mapConfig) {
      return [];
    }

    return this.mapConfig.doors.map(door =>
      this.verifyDoorAccessibility({ x: door.tileX, y: door.tileY })
    );
  }

  /**
   * 获取验证器状态信息
   */
  getStatus(): {
    initialized: boolean;
    mapWidth: number;
    mapHeight: number;
    walkableTileCount: number;
  } {
    return {
      initialized: this.initialized,
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight,
      walkableTileCount: this.walkableTiles.size
    };
  }

  /**
   * 检查出生点是否在可行走区域
   */
  verifySpawnPoint(): WalkableVerifyResult {
    if (!this.initialized || !this.mapConfig) {
      return {
        position: { x: 0, y: 0 },
        isWalkable: false,
        message: '验证器未初始化'
      };
    }

    const spawn = this.mapConfig.playerSpawnPoint;
    return this.isWalkable(spawn.x, spawn.y);
  }

  /**
   * 计算两点之间的距离（曼哈顿距离）
   */
  calculateDistance(from: TilePos, to: TilePos): number {
    return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
  }

  /**
   * 获取指定位置周围的可行走瓦片
   */
  getAdjacentWalkableTiles(pos: TilePos): TilePos[] {
    if (!this.initialized) {
      return [];
    }

    const adjacent: TilePos[] = [
      { x: pos.x - 1, y: pos.y },
      { x: pos.x + 1, y: pos.y },
      { x: pos.x, y: pos.y - 1 },
      { x: pos.x, y: pos.y + 1 }
    ];

    return adjacent.filter(tile =>
      tile.x >= 0 && tile.x < this.mapWidth &&
      tile.y >= 0 && tile.y < this.mapHeight &&
      this.walkableTiles.has(`${tile.x},${tile.y}`)
    );
  }
}

/**
 * 创建验证器实例的便捷函数
 */
export function createWalkableVerifier(): WalkableVerifier {
  return new WalkableVerifier();
}

/**
 * 预初始化的验证器实例（使用默认配置）
 */
export const defaultWalkableVerifier = new WalkableVerifier();
defaultWalkableVerifier.initializeFromConfig();