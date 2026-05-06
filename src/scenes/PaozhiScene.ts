// src/scenes/PaozhiScene.ts
/**
 * 炮制场景
 *
 * Phase 2.5 炮制 HTML 嵌入
 *
 * 功能:
 * - 集成 React PaozhiUI
 * - 炮制方法选择
 * - 拖拽药材/辅料
 * - 炮制进度动画
 * - 炮制品入背包
 */

import Phaser from 'phaser';
import type { Root } from 'react-dom/client';
import { SCENES } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';

// React UI imports
import { mountPaozhiUI, unmountPaozhiUI, PAOZHI_EVENTS } from '../ui/html/paozhi-entry';

export interface PaozhiSceneConfig {
  recipeId?: string;
}

export class PaozhiScene extends Phaser.Scene {
  // 系统组件
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;

  // React UI
  private reactRoot: Root | null = null;
  private domContainer: HTMLElement | null = null;

  // 事件监听器引用
  private boundCompleteHandler: EventListener | null = null;
  private boundCloseHandler: EventListener | null = null;

  // 数据
  private initialRecipeId: string | null = null;

  // 状态
  private isInitialized: boolean = false;

  constructor() {
    super({ key: SCENES.PAOZHI });
  }

  init(data: PaozhiSceneConfig): void {
    this.initialRecipeId = data.recipeId || null;
  }

  create(): void {
    // 初始化系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.PAOZHI });

    // 创建 React UI
    this.createReactUI();

    // 设置事件监听
    this.setupEventListeners();

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene(SCENES.PAOZHI);

    // 标记初始化完成
    this.isInitialized = true;

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: SCENES.PAOZHI });

    // 暴露到全局供测试访问
    this.exposeToGlobal();
  }

  /**
   * 创建 React UI
   */
  private createReactUI(): void {
    // 创建 DOM 容器
    this.domContainer = document.createElement('div');
    this.domContainer.id = 'paozhi-react-root';

    // 添加到 body
    document.body.appendChild(this.domContainer);

    // 挂载 React UI
    this.reactRoot = mountPaozhiUI(this.domContainer, {
      onClose: () => this.closeScene(),
      initialRecipeId: this.initialRecipeId || 'r1',
      onComplete: (recipeId: string, quality: number) => {
        this.handlePaozhiComplete(recipeId, quality);
      },
    });
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // COMPLETE → 炮制完成
    this.boundCompleteHandler = ((e: CustomEvent) => {
      const { recipeId, quality } = e.detail;
      this.handlePaozhiComplete(recipeId, quality);
    }) as EventListener;
    window.addEventListener(PAOZHI_EVENTS.COMPLETE, this.boundCompleteHandler);

    // CLOSE → 关闭场景
    this.boundCloseHandler = (() => {
      this.closeScene();
    }) as EventListener;
    window.addEventListener(PAOZHI_EVENTS.CLOSE, this.boundCloseHandler);
  }

  /**
   * 处理炮制完成
   */
  private handlePaozhiComplete(recipeId: string, quality: number): void {
    console.log('[PaozhiScene] Paozhi complete:', { recipeId, quality });

    // 更新注册表中的进度
    const progress = this.registry.get('paozhi_progress') || {};
    progress[recipeId] = quality;
    this.registry.set('paozhi_progress', progress);

    // 发送结果到背包系统
    window.dispatchEvent(new CustomEvent(PAOZHI_EVENTS.PAOZHI_ADDED, {
      detail: { recipeId, quality }
    }));
  }

  /**
   * 关闭场景
   */
  private closeScene(): void {
    this.cleanupReactUI();
    this.scene.stop();
  }

  /**
   * 清理 React UI
   */
  private cleanupReactUI(): void {
    if (this.reactRoot) {
      unmountPaozhiUI(this.reactRoot);
      this.reactRoot = null;
    }
    if (this.domContainer) {
      this.domContainer.remove();
      this.domContainer = null;
    }

    // 移除事件监听
    if (this.boundCompleteHandler) {
      window.removeEventListener(PAOZHI_EVENTS.COMPLETE, this.boundCompleteHandler);
      this.boundCompleteHandler = null;
    }
    if (this.boundCloseHandler) {
      window.removeEventListener(PAOZHI_EVENTS.CLOSE, this.boundCloseHandler);
      this.boundCloseHandler = null;
    }
  }

  /**
   * 暴露到全局（供测试访问）
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__PAOZHI_SCENE__ = {
        isInitialized: this.isInitialized,
        initialRecipeId: this.initialRecipeId,
        hasReactUI: !!this.reactRoot,
      };
    }
  }

  /**
   * 获取当前配方 ID
   */
  getRecipeId(): string | null {
    return this.initialRecipeId;
  }

  update(): void {
    // React UI 自行管理更新
  }

  shutdown(): void {
    // 清理 React UI
    this.cleanupReactUI();

    // 重置状态
    this.isInitialized = false;
    this.initialRecipeId = null;

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__PAOZHI_SCENE__ = null;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: SCENES.PAOZHI });
  }
}