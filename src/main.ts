import Phaser from 'phaser';
import { gameConfig } from './config/game.config';
import { EventBus } from './systems/EventBus';
import { GameLogger } from './utils/GameLogger';
import { GameStateBridge } from './utils/GameStateBridge';

window.addEventListener('load', () => {
  // 初始化事件总线
  const eventBus = EventBus.getInstance();

  // 初始化日志收集器
  const gameLogger = GameLogger.getInstance();
  gameLogger.start();

  // 初始化状态桥接器
  const gameStateBridge = GameStateBridge.getInstance();

  // 创建游戏实例
  const game = new Phaser.Game(gameConfig);

  // 设置游戏实例到状态桥接器
  gameStateBridge.setGame(game);

  // 开发模式下暴露调试接口
  if (import.meta.env.DEV) {
    (window as unknown as Record<string, unknown>).__GAME__ = game;
    (window as unknown as Record<string, unknown>).__EVENT_BUS__ = eventBus;
    (window as unknown as Record<string, unknown>).__GAME_LOGGER__ = gameLogger;
    console.log('[Dev] Game debugging interfaces initialized');
  }
});