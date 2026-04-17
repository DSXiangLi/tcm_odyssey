// src/scenes/PlantingScene.ts
/**
 * 种植场景
 *
 * Phase 2 S11.4 实现
 *
 * 功能:
 * - 集成PlantingManager和PlantingUI
 * - 种植游戏流程控制
 * - 从GardenScene进入，完成后返回
 *
 * 流程:
 * 1. GardenScene → PlantingScene (按G键)
 * 2. 种子选择 → 地块选择 → 水源选择 → 肥料选择 → 种植 → 生长 → 收获 → 考教
 * 3. PlantingScene → GardenScene (完成或取消)
 */

import Phaser from 'phaser';
import { SCENES } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
import { PlantingManager, PlantingManagerConfig } from '../systems/PlantingManager';
import { PlantingUI } from '../ui/PlantingUI';

export class PlantingScene extends Phaser.Scene {
  // 系统组件
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;
  private plantingManager!: PlantingManager;

  // UI组件
  private plantingUI!: PlantingUI;

  // 状态
  private isInitialized: boolean = false;

  constructor() {
    super({ key: SCENES.PLANTING });
  }

  create(): void {
    // 初始化事件系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.PLANTING });

    // 创建背景
    this.createBackground();

    // 创建PlantingManager
    this.createPlantingManager();

    // 创建PlantingUI
    this.createPlantingUI();

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene(SCENES.PLANTING);

    // 标记初始化完成
    this.isInitialized = true;

    // 添加提示
    this.add.text(10, 10, '种植环节 (Phase 2 S11)', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0).setDepth(100);

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: SCENES.PLANTING });
    (window as any).__SCENE_READY__ = true;

    // 暴露到全局供测试访问
    this.exposeToGlobal();
  }

  /**
   * 创建背景
   */
  private createBackground(): void {
    // 绿色背景 - 药园氛围
    const bg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x2d4f2d  // 深绿色（药园色调）
    );
    bg.setDepth(0);

    // 添加标题
    this.add.text(this.cameras.main.width / 2, 30, '种植', {
      fontSize: '28px',
      color: '#4a9',  // 田园绿
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);

    // 添加装饰元素（简化的种子图标）
    this.add.text(this.cameras.main.width / 2, 70, '🌱', {
      fontSize: '32px'
    }).setOrigin(0.5).setDepth(1);
  }

  /**
   * 创建PlantingManager
   */
  private createPlantingManager(): void {
    const config: PlantingManagerConfig = {
      growthTickInterval: 1000,   // 生长更新间隔1秒
      autoAddHerb: true,         // 收获后自动添加到背包
      autoConsumeSeed: true      // 消耗种子
    };

    this.plantingManager = PlantingManager.getInstance(config);
  }

  /**
   * 创建PlantingUI
   */
  private createPlantingUI(): void {
    this.plantingUI = new PlantingUI({
      scene: this,
      width: 720,
      height: 480
    });
  }

  /**
   * 暴露到全局（供测试访问）
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__PLANTING_SCENE__ = {
        isInitialized: this.isInitialized,
        phase: this.plantingManager.getPhase(),
        state: this.plantingManager.getState()
      };

      // 暴露完整的管理器实例
      this.plantingManager.exposeToWindow();
    }
  }

  /**
   * 获取当前阶段
   */
  getPhase(): string {
    return this.plantingManager.getPhase();
  }

  /**
   * 获取种植状态
   */
  getState(): any {
    return this.plantingManager.getState();
  }

  /**
   * 返回药园场景
   */
  returnToGarden(): void {
    this.eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: SCENES.PLANTING,
      to: SCENES.GARDEN
    });

    // 重置管理器
    this.plantingManager.reset();

    // 停止种植场景，恢复药园场景
    this.scene.stop();
    this.scene.resume(SCENES.GARDEN);
  }

  update(): void {
    // PlantingUI通过事件系统更新，不需要额外的update逻辑
  }

  shutdown(): void {
    // 清理UI组件
    if (this.plantingUI) {
      this.plantingUI.destroy();
    }

    // 清理管理器
    if (this.plantingManager) {
      PlantingManager.resetInstance();
    }

    // 重置状态
    this.isInitialized = false;

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__PLANTING_SCENE__ = null;
      (window as any).__PLANTING_MANAGER__ = undefined;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: SCENES.PLANTING });
  }
}