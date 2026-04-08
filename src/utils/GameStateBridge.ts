// src/utils/GameStateBridge.ts
import Phaser from 'phaser';
import { TOWN_OUTDOOR_CONFIG } from '../data/map-config';

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
 * GameStateBridge - 游戏状态桥接器
 * 单例模式，通过window对象暴露游戏状态供测试访问
 */
export class GameStateBridge {
  private static instance: GameStateBridge;
  private _game: Phaser.Game | null = null;
  private state: GameState;
  private exposedToWindow: boolean = false;

  private constructor() {
    this.state = {
      mapData: null,
      player: null,
      sceneSize: null,
      currentScene: '',
      collision: {
        lastCollision: null,
        isColliding: false
      },
      timestamp: Date.now()
    };
  }

  /**
   * 获取单例实例
   */
  static getInstance(): GameStateBridge {
    if (!GameStateBridge.instance) {
      GameStateBridge.instance = new GameStateBridge();
    }
    return GameStateBridge.instance;
  }

  /**
   * 设置游戏实例
   */
  setGame(game: Phaser.Game): void {
    this._game = game;
    this.exposeToWindow();
  }

  /**
   * 获取游戏实例
   */
  getGame(): Phaser.Game | null {
    return this._game;
  }

  /**
   * 暴露状态到window对象
   */
  private exposeToWindow(): void {
    if (this.exposedToWindow) return;

    // 将getState方法暴露到window对象
    (window as unknown as Record<string, unknown>).__GAME_STATE__ = this.getState.bind(this);

    this.exposedToWindow = true;
    console.log('[GameStateBridge] State exposed to window.__GAME_STATE__');
  }

  /**
   * 获取当前游戏状态
   */
  getState(): GameState {
    return {
      ...this.state,
      timestamp: Date.now()
    };
  }

  /**
   * 更新当前场景
   */
  updateCurrentScene(sceneName: string): void {
    this.state.currentScene = sceneName;
    this.state.timestamp = Date.now();
  }

  /**
   * 更新场景尺寸
   */
  updateSceneSize(size: SceneSize): void {
    this.state.sceneSize = size;
    this.state.timestamp = Date.now();
  }

  /**
   * 更新地图数据
   */
  updateMapData(mapData: MapData): void {
    this.state.mapData = mapData;
    this.state.timestamp = Date.now();
  }

  /**
   * 更新玩家状态
   */
  updatePlayerState(player: PlayerState): void {
    this.state.player = player;
    this.state.timestamp = Date.now();
  }

  /**
   * 更新碰撞状态
   */
  updateCollisionState(collision: CollisionState): void {
    this.state.collision = collision;
    this.state.timestamp = Date.now();
  }

  /**
   * 记录碰撞
   */
  recordCollision(collisionWith: string): void {
    this.state.collision = {
      lastCollision: collisionWith,
      isColliding: true
    };
    this.state.timestamp = Date.now();
  }

  /**
   * 清除碰撞状态
   */
  clearCollision(): void {
    this.state.collision.isColliding = false;
    this.state.timestamp = Date.now();
  }

  /**
   * 暴露地图配置到全局对象
   * 供测试代码访问地图的可行走瓦片、尺寸、门配置
   */
  public exposeMapConfig(): void {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__MAP_CONFIG__ = {
        walkableTiles: TOWN_OUTDOOR_CONFIG.walkableTiles,
        width: TOWN_OUTDOOR_CONFIG.width,
        height: TOWN_OUTDOOR_CONFIG.height,
        doors: TOWN_OUTDOOR_CONFIG.doors
      };
      console.log('[GameStateBridge] Map config exposed to window.__MAP_CONFIG__');
    }
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.state = {
      mapData: null,
      player: null,
      sceneSize: null,
      currentScene: '',
      collision: {
        lastCollision: null,
        isColliding: false
      },
      timestamp: Date.now()
    };
  }
}