import Phaser from 'phaser';
import { gameConfig } from './config/game.config';
import { EventBus } from './systems/EventBus';
import { GameLogger } from './utils/GameLogger';
import { GameStateBridge } from './utils/GameStateBridge';
import { HermesManager, DEFAULT_HERMES_CONFIG, HermesStatus } from './systems/HermesManager';
import { SaveManager, createSaveManager } from './systems/SaveManager';

// Hermes服务状态（全局暴露供测试访问）
let hermesManager: HermesManager | null = null;
let hermesStatus: HermesStatus = { available: false };

// 存档管理器（全局）
let saveManager: SaveManager | null = null;

/**
 * 初始化存档系统
 */
function initSaveSystem(): SaveManager {
  saveManager = createSaveManager('player_001');

  // 暴露到全局供测试访问
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__SAVE_MANAGER__ = saveManager;
  }

  // 注册退出时自动存档
  window.addEventListener('beforeunload', () => {
    saveManager?.saveOnExit();
  });

  console.log('[SaveManager] Save system initialized');
  return saveManager;
}

/**
 * 初始化Hermes服务（异步检查）
 * 不阻塞游戏启动，采用降级模式运行
 */
async function initHermes(): Promise<HermesStatus> {
  hermesManager = new HermesManager(DEFAULT_HERMES_CONFIG);

  // 尝试连接Hermes（不阻塞游戏启动）
  const status = await hermesManager.waitForReady();

  if (status.available) {
    console.log('[Hermes] Service available, NPC system enabled');
    // 启动定期健康检查
    hermesManager.startHealthCheck(30000);
  } else {
    console.warn('[Hermes] Service unavailable, NPC system disabled (degraded mode)');
    console.warn('[Hermes] Error:', status.error);
  }

  // 暴露状态到全局
  hermesStatus = status;
  exposeHermesStatus();

  return status;
}

/**
 * 暴露Hermes状态到全局window对象
 */
function exposeHermesStatus(): void {
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__HERMES_STATUS__ = hermesStatus;
    (window as unknown as Record<string, unknown>).__HERMES_MANAGER__ = hermesManager;
  }
}

/**
 * 获取Hermes状态（供外部调用）
 */
export function getHermesStatus(): HermesStatus {
  return hermesStatus;
}

/**
 * 获取Hermes管理器（供外部调用）
 */
export function getHermesManager(): HermesManager | null {
  return hermesManager;
}

window.addEventListener('load', () => {
  // 初始化事件总线
  const eventBus = EventBus.getInstance();

  // 初始化日志收集器
  const gameLogger = GameLogger.getInstance();
  gameLogger.start();

  // 初始化状态桥接器
  const gameStateBridge = GameStateBridge.getInstance();

  // 初始化存档系统（Phase 2 S7）
  initSaveSystem();

  // 创建游戏实例
  const game = new Phaser.Game(gameConfig);

  // 设置游戏实例到状态桥接器
  gameStateBridge.setGame(game);

  // 异步初始化Hermes（不阻塞游戏启动）
  initHermes().then((status) => {
    // 通过EventBus触发Hermes初始化事件（GameLogger会自动记录）
    eventBus.emit('hermes:init', {
      available: status.available,
      port: status.port,
      error: status.error
    });
  });

  // 开发模式下暴露调试接口
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__GAME__ = game;
    (window as unknown as Record<string, unknown>).__PHASER_GAME__ = game;  // Phase 2 S4: 供测试访问
    (window as unknown as Record<string, unknown>).__EVENT_BUS__ = eventBus;
    (window as unknown as Record<string, unknown>).__GAME_LOGGER__ = gameLogger;
    (window as unknown as Record<string, unknown>).__HERMES_STATUS__ = hermesStatus;
    (window as unknown as Record<string, unknown>).__HERMES_MANAGER__ = hermesManager;
    (window as unknown as Record<string, unknown>).__SAVE_MANAGER__ = saveManager;
    (window as unknown as Record<string, unknown>).getHermesStatus = getHermesStatus;
    (window as unknown as Record<string, unknown>).getHermesManager = getHermesManager;
    (window as unknown as Record<string, unknown>).getSaveManager = getSaveManager;
    console.log('[Dev] Game debugging interfaces initialized');
    console.log('[Dev] Hermes integration enabled (check __HERMES_STATUS__ for availability)');
    console.log('[Dev] Save system enabled (check __SAVE_MANAGER__ for access)');
  }
});

/**
 * 获取存档管理器（供外部调用）
 */
export function getSaveManager(): SaveManager | null {
  return saveManager;
}