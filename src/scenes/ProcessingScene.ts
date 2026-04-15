// src/scenes/ProcessingScene.ts
/**
 * 炮制场景
 *
 * Phase 2 S10.4 实现
 *
 * 功能:
 * - 集成ProcessingManager和ProcessingUI
 * - 炮制游戏流程控制
 * - 从ClinicScene进入，完成后返回
 *
 * 流程:
 * 1. ClinicScene → ProcessingScene (按P键或点击按钮)
 * 2. 药材选择 → 方法选择 → 辅料选择 → 预处理 → 炮制 → 评分
 * 3. ProcessingScene → ClinicScene (完成或取消)
 */

import Phaser from 'phaser';
import { SCENES } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
import { ProcessingManager, ProcessingManagerConfig } from '../systems/ProcessingManager';
import { ProcessingUI } from '../ui/ProcessingUI';

export interface ProcessingSceneConfig {
  herbId?: string;  // 可选：预设药材ID
}

export class ProcessingScene extends Phaser.Scene {
  // 系统组件
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;
  private processingManager!: ProcessingManager;

  // UI组件
  private processingUI!: ProcessingUI;

  // 数据
  private herbId: string | null = null;

  // 状态
  private isInitialized: boolean = false;

  constructor() {
    super({ key: SCENES.PROCESSING });
  }

  init(data: ProcessingSceneConfig): void {
    // 获取可选的预设药材ID
    this.herbId = data.herbId || null;
  }

  create(): void {
    // 初始化事件系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.PROCESSING });

    // 创建背景
    this.createBackground();

    // 创建ProcessingManager
    this.createProcessingManager();

    // 创建ProcessingUI
    this.createProcessingUI();

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene(SCENES.PROCESSING);

    // 如果有预设药材，自动选择
    if (this.herbId) {
      this.processingManager.selectHerb(this.herbId);
    }

    // 标记初始化完成
    this.isInitialized = true;

    // 添加提示
    this.add.text(10, 10, '炮制环节 (Phase 2 S10)', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0).setDepth(100);

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: SCENES.PROCESSING });
    (window as any).__SCENE_READY__ = true;

    // 暴露到全局供测试访问
    this.exposeToGlobal();
  }

  /**
   * 创建背景
   */
  private createBackground(): void {
    // 深色背景 - 炮制台氛围
    const bg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x3d2d2d  // 深棕色（炮制台色调）
    );
    bg.setDepth(0);

    // 添加标题
    this.add.text(this.cameras.main.width / 2, 30, '药材炮制', {
      fontSize: '28px',
      color: '#c9a05c',  // 古朴金色
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);

    // 添加装饰元素（简化的炮制工具图标）
    this.add.text(this.cameras.main.width / 2, 70, '🔥', {
      fontSize: '32px'
    }).setOrigin(0.5).setDepth(1);
  }

  /**
   * 创建ProcessingManager
   */
  private createProcessingManager(): void {
    const config: ProcessingManagerConfig = {
      autoConsumeHerbs: true,   // 完成后自动消耗药材
      autoConsumeAdjuvant: true, // 完成后自动消耗辅料
      passThreshold: 60         // 通过阈值60分
    };

    this.processingManager = ProcessingManager.getInstance(config);
  }

  /**
   * 创建ProcessingUI
   */
  private createProcessingUI(): void {
    this.processingUI = new ProcessingUI({
      scene: this,
      width: this.cameras.main.width,
      height: this.cameras.main.height
    });
  }

  /**
   * 暴露到全局（供测试访问）
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__PROCESSING_SCENE__ = {
        isInitialized: this.isInitialized,
        herbId: this.herbId,
        phase: this.processingManager.getPhase(),
        state: this.processingManager.getState()
      };

      // 暴露完整的管理器实例
      this.processingManager.exposeToWindow();
    }
  }

  /**
   * 获取当前阶段
   */
  getPhase(): string {
    return this.processingManager.getPhase();
  }

  /**
   * 获取炮制状态
   */
  getState(): any {
    return this.processingManager.getState();
  }

  /**
   * 返回诊所场景
   */
  returnToClinic(): void {
    this.eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: SCENES.PROCESSING,
      to: SCENES.CLINIC
    });

    // 重置管理器
    this.processingManager.reset();

    // 切换场景
    this.scene.start(SCENES.CLINIC);
  }

  update(): void {
    // ProcessingUI通过事件系统更新，不需要额外的update逻辑
  }

  shutdown(): void {
    // 清理UI组件
    if (this.processingUI) {
      this.processingUI.destroy();
    }

    // 清理管理器
    if (this.processingManager) {
      ProcessingManager.resetInstance();
    }

    // 重置状态
    this.isInitialized = false;
    this.herbId = null;

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__PROCESSING_SCENE__ = null;
      (window as any).__PROCESSING_MANAGER__ = undefined;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: SCENES.PROCESSING });
  }
}