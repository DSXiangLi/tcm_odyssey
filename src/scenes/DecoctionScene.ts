// src/scenes/DecoctionScene.ts
/**
 * 煎药场景
 *
 * Phase 2 S9.4 实现
 *
 * 功能:
 * - 集成DecoctionManager和DecoctionUI
 * - 煎药游戏流程控制
 * - 从ClinicScene进入，完成后返回
 *
 * 流程:
 * 1. ClinicScene → DecoctionScene (按D键或点击按钮)
 * 2. 方剂选择 → 药材选择 → 配伍放置 → 顺序设置 → 火候设置 → 煎煮 → 评分
 * 3. DecoctionScene → ClinicScene (完成或取消)
 */

import Phaser from 'phaser';
import { SCENES } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
import { DecoctionManager, DecoctionManagerConfig } from '../systems/DecoctionManager';
import { DecoctionUI } from '../ui/DecoctionUI';

export interface DecoctionSceneConfig {
  prescriptionId?: string;  // 可选：预设方剂ID
}

export class DecoctionScene extends Phaser.Scene {
  // 系统组件
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;
  private decoctionManager!: DecoctionManager;

  // UI组件
  private decoctionUI!: DecoctionUI;

  // 数据
  private prescriptionId: string | null = null;

  // 状态
  private isInitialized: boolean = false;

  constructor() {
    super({ key: SCENES.DECOCTION });
  }

  init(data: DecoctionSceneConfig): void {
    // 获取可选的预设方剂ID
    this.prescriptionId = data.prescriptionId || null;
  }

  create(): void {
    // 初始化事件系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.DECOCTION });

    // 创建背景
    this.createBackground();

    // 创建DecoctionManager
    this.createDecoctionManager();

    // 创建DecoctionUI
    this.createDecoctionUI();

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene(SCENES.DECOCTION);

    // 如果有预设方剂，自动选择
    if (this.prescriptionId) {
      this.decoctionManager.selectPrescription(this.prescriptionId);
    }

    // 标记初始化完成
    this.isInitialized = true;

    // 添加提示
    this.add.text(10, 10, '煎药环节 (Phase 2 S9)', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0).setDepth(100);

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: SCENES.DECOCTION });
    (window as any).__SCENE_READY__ = true;

    // 暴露到全局供测试访问
    this.exposeToGlobal();
  }

  /**
   * 创建背景
   */
  private createBackground(): void {
    // 深色背景 - 药炉氛围
    const bg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x2d1f1f  // 深棕色（药炉色调）
    );
    bg.setDepth(0);

    // 添加标题
    this.add.text(this.cameras.main.width / 2, 30, '煎药', {
      fontSize: '28px',
      color: '#d4a574',  // 古朴金色
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);

    // 添加装饰元素（简化的药炉图标）
    this.add.text(this.cameras.main.width / 2, 70, '🔥', {
      fontSize: '32px'
    }).setOrigin(0.5).setDepth(1);
  }

  /**
   * 创建DecoctionManager
   */
  private createDecoctionManager(): void {
    const config: DecoctionManagerConfig = {
      autoConsumeHerbs: true,  // 完成后自动消耗药材
      passThreshold: 60        // 通过阈值60分
    };

    this.decoctionManager = DecoctionManager.getInstance(config);
  }

  /**
   * 创建DecoctionUI
   */
  private createDecoctionUI(): void {
    this.decoctionUI = new DecoctionUI(this);
  }

  /**
   * 暴露到全局（供测试访问）
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__DECOCTION_SCENE__ = {
        isInitialized: this.isInitialized,
        prescriptionId: this.prescriptionId,
        phase: this.decoctionManager.getPhase(),
        state: this.decoctionManager.getState()
      };

      // 暴露完整的管理器实例
      this.decoctionManager.exposeToWindow();
    }
  }

  /**
   * 获取当前阶段
   */
  getPhase(): string {
    return this.decoctionManager.getPhase();
  }

  /**
   * 获取煎药状态
   */
  getState(): any {
    return this.decoctionManager.getState();
  }

  /**
   * 返回诊所场景
   */
  returnToClinic(): void {
    this.eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: SCENES.DECOCTION,
      to: SCENES.CLINIC
    });

    // 重置管理器
    this.decoctionManager.reset();

    // 切换场景
    this.scene.start(SCENES.CLINIC);
  }

  update(): void {
    // DecoctionUI通过事件系统更新，不需要额外的update逻辑
  }

  shutdown(): void {
    // 清理UI组件
    if (this.decoctionUI) {
      this.decoctionUI.destroy();
    }

    // 清理管理器
    if (this.decoctionManager) {
      DecoctionManager.resetInstance();
    }

    // 重置状态
    this.isInitialized = false;
    this.prescriptionId = null;

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__DECOCTION_SCENE__ = null;
      (window as any).__DECOCTION_MANAGER__ = undefined;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: SCENES.DECOCTION });
  }
}