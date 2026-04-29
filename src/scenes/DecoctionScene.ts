// src/scenes/DecoctionScene.ts
/**
 * 煎药场景
 *
 * Phase 2 S9.4 实现
 * Phase 2.5 煎药小游戏 UI 重构 Task 7 - 集成 React UI
 *
 * 功能:
 * - 集成DecoctionManager和React DecoctionUI
 * - 煎药游戏流程控制
 * - 从ClinicScene进入，完成后返回
 *
 * 流程:
 * 1. ClinicScene → DecoctionScene (按D键或点击按钮)
 * 2. 方剂选择 → 药材选择 → 配伍放置 → 顺序设置 → 火候设置 → 煎煮 → 评分
 * 3. DecoctionScene → ClinicScene (完成或取消)
 */

import Phaser from 'phaser';
import type { Root } from 'react-dom/client';
import { SCENES } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
import { DecoctionManager, DecoctionManagerConfig } from '../systems/DecoctionManager';

// React UI imports (Phase 2.5 Task 7)
import { mountDecoctionUI, unmountDecoctionUI, DECOCTION_EVENTS } from '../ui/html/decoction-entry';
import { DecoctionUIProps } from '../ui/html/types/index';
import { ScoreResultData, HerbResultData } from '../ui/html/bridge/types';
import { HERB_PIXELS, FORMULAS } from '../ui/html/data/herb-pixels';
import type { FireLevel } from '../data/decoction-data';
import prescriptionsData from '../data/prescriptions.json';

export interface DecoctionSceneConfig {
  prescriptionId?: string;  // 可选：预设方剂ID
}

export class DecoctionScene extends Phaser.Scene {
  // 系统组件
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;
  private decoctionManager!: DecoctionManager;

  // React UI (Phase 2.5 Task 7)
  private reactRoot: Root | null = null;
  private domContainer: HTMLElement | null = null;

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

    // 创建React UI (Phase 2.5 Task 7)
    this.createReactUI();

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene(SCENES.DECOCTION);

    // 如果有预设方剂，自动选择
    if (this.prescriptionId) {
      this.decoctionManager.selectPrescription(this.prescriptionId);
    }

    // 标记初始化完成
    this.isInitialized = true;

    // 添加提示
    this.add.text(10, 10, '煎药环节 (Phase 2 S9) - React UI', {
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
   * 创建背景 - 不创建Phaser背景，让场景透明显示下面的游戏
   */
  private createBackground(): void {
    // 透明背景，React UI自己有样式，玩家能看到下面的诊所场景
    // 不添加任何Phaser背景元素（标题等由React UI处理）
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
   * 创建React UI (Phase 2.5 Task 7)
   * 使用 DOM Element 方式挂载 React UI
   */
  private createReactUI(): void {
    // 创建 DOM 容器
    this.domContainer = document.createElement('div');
    this.domContainer.id = 'decoction-react-root';
    // 不设置内联样式，让 CSS 文件完全控制布局和 z-index
    // CSS 中定义了 position:fixed, z-index:1000, pointer-events:auto

    // 添加到 body
    document.body.appendChild(this.domContainer);

    // 准备 UI props
    const uiProps: DecoctionUIProps = {
      herbs: HERB_PIXELS,
      targetFormula: FORMULAS[0],  // 默认第一个方剂
      completedVials: [null, null, null, null, null],  // 5个空槽位
      onHerbDrop: (herbId: string) => this.handleHerbDropFromUI(herbId),
      onFireSelect: (type: 'martial' | 'civil' | 'gentle') => this.handleFireSelectFromUI(type),
      onComplete: (herbs: string[], fireType: string) => this.handleCompleteFromUI(herbs, fireType),
      onClose: () => this.returnToClinic(),
    };

    // 挂载 React UI
    this.reactRoot = mountDecoctionUI(this.domContainer, uiProps);

    // 设置桥接事件监听
    this.setupBridgeEventListeners();
  }

  /**
   * 设置桥接事件监听 (React UI → Phaser)
   */
  private setupBridgeEventListeners(): void {
    // 监听药材拖放事件
    window.addEventListener(DECOCTION_EVENTS.HERB_DROP, ((e: CustomEvent) => {
      const data = e.detail as { herbId: string; success: boolean };
      this.handleHerbDropEvent(data.herbId, data.success);
    }) as EventListener);

    // 监听完成事件
    window.addEventListener(DECOCTION_EVENTS.COMPLETE, ((e: CustomEvent) => {
      const data = e.detail as { herbs: string[]; fireType: string };
      this.handleCompleteEvent(data.herbs, data.fireType);
    }) as EventListener);

    // 监听关闭事件
    window.addEventListener(DECOCTION_EVENTS.CLOSE, (() => {
      this.returnToClinic();
    }) as EventListener);
  }

  /**
   * 处理药材拖放事件 (从 React UI)
   */
  private handleHerbDropEvent(herbId: string, success: boolean): void {
    // 发送结果回 React UI
    const result: HerbResultData = {
      success,
      herbId,
      message: success ? '药材正确' : '药材不正确或已添加'
    };
    window.dispatchEvent(new CustomEvent(DECOCTION_EVENTS.HERB_RESULT, { detail: result }));
  }

  /**
   * 处理药材拖放回调 (从 props.onHerbDrop)
   */
  private handleHerbDropFromUI(herbId: string): void {
    // 调用 DecoctionManager 添加药材
    try {
      this.decoctionManager.addHerb(herbId);
    } catch (error) {
      // 药材添加失败（可能是重复添加或不在配方中）
      console.warn('Herb drop failed:', error);
    }
  }

  /**
   * 处理火候选择回调 (从 props.onFireSelect)
   */
  private handleFireSelectFromUI(type: 'martial' | 'civil' | 'gentle'): void {
    // 映射火候类型到 DecoctionManager 的 FireLevel ('wu' | 'wen' | 'slow')
    const fireLevelMap: Record<string, FireLevel> = {
      'martial': 'wu',
      'civil': 'wen',
      'gentle': 'slow'
    };
    this.decoctionManager.setFireLevel(fireLevelMap[type] || 'wu');
  }

  /**
   * 处理完成回调 (从 props.onComplete)
   */
  private handleCompleteFromUI(_herbs: string[], _fireType: string): ScoreResultData {
    // 调用 DecoctionManager 完成煎药
    this.decoctionManager.completeDecoction();
    const result = this.decoctionManager.evaluate();

    if (!result) {
      // 返回失败结果
      const failResult: ScoreResultData = {
        score: 0,
        breakdown: { composition: 0, fire: 0, time: 0 },
        passed: false,
        prescriptionName: undefined
      };
      window.dispatchEvent(new CustomEvent(DECOCTION_EVENTS.SCORE_RESULT, { detail: failResult }));
      return failResult;
    }

    // 获取方剂名称
    const state = this.decoctionManager.getState();
    const prescription = prescriptionsData.prescriptions.find(p => p.id === state.prescription_id);
    const prescriptionName = prescription?.name || undefined;

    // 转换结果格式
    const scoreResult: ScoreResultData = {
      score: result.total_score,
      breakdown: {
        composition: result.dimension_scores.composition,
        fire: result.dimension_scores.fire,
        time: result.dimension_scores.time
      },
      passed: result.passed,
      prescriptionName
    };

    // 发送结果回 React UI
    window.dispatchEvent(new CustomEvent(DECOCTION_EVENTS.SCORE_RESULT, { detail: scoreResult }));

    return scoreResult;
  }

  /**
   * 处理完成事件 (从 CustomEvent)
   */
  private handleCompleteEvent(_herbs: string[], _fireType: string): void {
    // 已通过 handleCompleteFromUI 处理
    // This method is for event-based communication if needed
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
        state: this.decoctionManager.getState(),
        hasReactUI: !!this.reactRoot,
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
    // ===== 显式清理 React UI（不依赖 Phaser shutdown） =====
    // Phaser 的 shutdown() 不一定在 scene.start() 后立即调用
    // 所以必须在切换场景前手动清理
    this.cleanupReactUI();

    this.eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: SCENES.DECOCTION,
      to: SCENES.CLINIC
    });

    // 重置管理器
    this.decoctionManager.reset();

    // 切换场景
    this.scene.start(SCENES.CLINIC);
  }

  /**
   * 清理 React UI（从 returnToClinic 和 shutdown 调用）
   */
  private cleanupReactUI(): void {
    // 清理 React Root
    if (this.reactRoot) {
      unmountDecoctionUI(this.reactRoot);
      this.reactRoot = null;
    }
    // 移除 DOM 容器
    if (this.domContainer) {
      this.domContainer.remove();
      this.domContainer = null;
    }

    // 移除桥接事件监听
    window.removeEventListener(DECOCTION_EVENTS.HERB_DROP, (() => {}) as EventListener);
    window.removeEventListener(DECOCTION_EVENTS.COMPLETE, (() => {}) as EventListener);
    window.removeEventListener(DECOCTION_EVENTS.CLOSE, (() => {}) as EventListener);
  }

  update(): void {
    // React UI 自行管理更新，不需要额外的 update 逻辑
  }

  shutdown(): void {
    // 清理 React UI（调用公共方法）
    this.cleanupReactUI();

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