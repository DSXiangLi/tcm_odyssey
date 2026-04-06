// tests/visual/utils/state-extractor.ts
import { Page } from '@playwright/test';

/**
 * 瓦片数据
 */
export interface TileData {
  x: number;
  y: number;
  type: string;
  properties?: Record<string, unknown>;
}

/**
 * 地图数据
 */
export interface MapData {
  width: number;
  height: number;
  tiles: TileData[][];
}

/**
 * 玩家状态
 */
export interface PlayerState {
  x: number;
  y: number;
  tileX: number;
  tileY: number;
  speed: number;
  velocity: { x: number; y: number };
}

/**
 * 场景尺寸
 */
export interface SceneSize {
  width: number;
  height: number;
}

/**
 * 碰撞状态
 */
export interface CollisionState {
  lastCollision: string | null;
  isColliding: boolean;
}

/**
 * 游戏状态
 */
export interface GameState {
  mapData: MapData | null;
  player: PlayerState | null;
  sceneSize: SceneSize | null;
  currentScene: string;
  collision: CollisionState;
  timestamp: number;
}

/**
 * 状态提取器
 */
export class StateExtractor {
  /**
   * 获取完整游戏状态
   */
  async getGameState(page: Page): Promise<GameState | null> {
    return await page.evaluate(() => {
      const getState = (window as unknown as Record<string, unknown>).__GAME_STATE__;
      if (typeof getState === 'function') {
        return getState() as GameState;
      }
      return null;
    });
  }

  /**
   * 获取地图数据
   */
  async getMapData(page: Page): Promise<MapData | null> {
    const state = await this.getGameState(page);
    return state?.mapData || null;
  }

  /**
   * 获取玩家状态
   */
  async getPlayerState(page: Page): Promise<PlayerState | null> {
    const state = await this.getGameState(page);
    return state?.player || null;
  }

  /**
   * 获取场景尺寸
   */
  async getSceneSize(page: Page): Promise<SceneSize | null> {
    const state = await this.getGameState(page);
    return state?.sceneSize || null;
  }

  /**
   * 获取当前场景名称
   */
  async getCurrentScene(page: Page): Promise<string> {
    const state = await this.getGameState(page);
    return state?.currentScene || '';
  }

  /**
   * 验证地图尺寸
   */
  async verifyMapSize(
    page: Page,
    expectedWidth: number,
    expectedHeight: number
  ): Promise<{ passed: boolean; actual?: { width: number; height: number }; message: string }> {
    const mapData = await this.getMapData(page);

    if (!mapData) {
      return { passed: false, message: '无法获取地图数据' };
    }

    const passed = mapData.width === expectedWidth && mapData.height === expectedHeight;

    return {
      passed,
      actual: { width: mapData.width, height: mapData.height },
      message: passed
        ? `地图尺寸验证通过: ${mapData.width}x${mapData.height}`
        : `地图尺寸不匹配: 期望 ${expectedWidth}x${expectedHeight}, 实际 ${mapData.width}x${mapData.height}`
    };
  }

  /**
   * 验证玩家位置
   */
  async verifyPlayerPosition(
    page: Page,
    expectedTileX?: number,
    expectedTileY?: number
  ): Promise<{ passed: boolean; actual?: PlayerState; message: string }> {
    const playerState = await this.getPlayerState(page);

    if (!playerState) {
      return { passed: false, message: '无法获取玩家状态' };
    }

    if (expectedTileX !== undefined && expectedTileY !== undefined) {
      const passed = playerState.tileX === expectedTileX && playerState.tileY === expectedTileY;
      return {
        passed,
        actual: playerState,
        message: passed
          ? `玩家位置验证通过: (${playerState.tileX}, ${playerState.tileY})`
          : `玩家位置不匹配: 期望 (${expectedTileX}, ${expectedTileY}), 实际 (${playerState.tileX}, ${playerState.tileY})`
      };
    }

    return { passed: true, actual: playerState, message: `玩家位置: (${playerState.tileX}, ${playerState.tileY})` };
  }

  /**
   * 验证玩家速度
   */
  async verifyPlayerSpeed(
    page: Page,
    expectedSpeed: number
  ): Promise<{ passed: boolean; actual?: number; message: string }> {
    const playerState = await this.getPlayerState(page);

    if (!playerState) {
      return { passed: false, message: '无法获取玩家状态' };
    }

    const passed = playerState.speed === expectedSpeed;

    return {
      passed,
      actual: playerState.speed,
      message: passed
        ? `玩家速度验证通过: ${playerState.speed}`
        : `玩家速度不匹配: 期望 ${expectedSpeed}, 实际 ${playerState.speed}`
    };
  }

  /**
   * 验证对角线移动速度
   */
  async verifyDiagonalSpeed(
    page: Page,
    expectedSpeed: number
  ): Promise<{ passed: boolean; actual?: number; message: string }> {
    const playerState = await this.getPlayerState(page);

    if (!playerState) {
      return { passed: false, message: '无法获取玩家状态' };
    }

    const actualSpeed = Math.sqrt(
      playerState.velocity.x ** 2 + playerState.velocity.y ** 2
    );

    const passed = Math.abs(actualSpeed - expectedSpeed) < expectedSpeed * 0.05;

    return {
      passed,
      actual: actualSpeed,
      message: passed
        ? `对角线速度验证通过: ${actualSpeed.toFixed(2)}`
        : `对角线速度不匹配: 期望 ~${expectedSpeed.toFixed(2)}, 实际 ${actualSpeed.toFixed(2)}`
    };
  }
}

export const stateExtractor = new StateExtractor();