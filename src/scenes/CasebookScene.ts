// src/scenes/CasebookScene.ts
/**
 * 病案集场景
 *
 * Phase 2.5 病案集 HTML 嵌入
 *
 * 功能:
 * - 集成 React CasebookUI
 * - 病案查看与选择
 * - 触发诊断游戏
 * - 诊断结果回写
 */

import Phaser from 'phaser';
import type { Root } from 'react-dom/client';
import { SCENES } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';

// React UI imports
import { mountCasebookUI, unmountCasebookUI, CASEBOOK_EVENTS } from '../ui/html/casebook-entry';
import { DIAGNOSIS_EVENTS } from '../ui/html/bridge/diagnosis-events';

export interface CasebookSceneConfig {
  caseId?: string;
}

export class CasebookScene extends Phaser.Scene {
  // 系统组件
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;

  // React UI
  private reactRoot: Root | null = null;
  private domContainer: HTMLElement | null = null;

  // 事件监听器引用
  private boundStartCaseHandler: EventListener | null = null;
  private boundReplayCaseHandler: EventListener | null = null;
  private boundCloseHandler: EventListener | null = null;
  private boundDiagnosisCompleteHandler: EventListener | null = null;

  // 数据
  private initialCaseId: string | null = null;

  // 状态
  private isInitialized: boolean = false;

  constructor() {
    super({ key: SCENES.CASEBOOK });
  }

  init(data: CasebookSceneConfig): void {
    this.initialCaseId = data.caseId || null;
  }

  create(): void {
    // 初始化系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.CASEBOOK });

    // 创建 React UI
    this.createReactUI();

    // 设置事件监听
    this.setupEventListeners();

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene(SCENES.CASEBOOK);

    // 标记初始化完成
    this.isInitialized = true;

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: SCENES.CASEBOOK });
    (window as any).__SCENE_READY__ = true;

    // 暴露到全局供测试访问
    this.exposeToGlobal();
  }

  /**
   * 创建 React UI
   */
  private createReactUI(): void {
    // 创建 DOM 容器
    this.domContainer = document.createElement('div');
    this.domContainer.id = 'casebook-react-root';

    // 添加到 body
    document.body.appendChild(this.domContainer);

    // 加载病案进度
    const progress = this.registry.get('casebook_progress') || {};

    // 挂载 React UI
    this.reactRoot = mountCasebookUI(this.domContainer, {
      onClose: () => this.closeScene(),
      initialCaseId: this.initialCaseId || undefined,
      progress,
    });
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // START_CASE → 启动诊断
    this.boundStartCaseHandler = ((e: CustomEvent) => {
      const { caseId } = e.detail;
      this.launchDiagnosis(caseId);
    }) as EventListener;
    window.addEventListener(CASEBOOK_EVENTS.START_CASE, this.boundStartCaseHandler);

    // REPLAY_CASE → 启动诊断
    this.boundReplayCaseHandler = ((e: CustomEvent) => {
      const { caseId } = e.detail;
      this.launchDiagnosis(caseId);
    }) as EventListener;
    window.addEventListener(CASEBOOK_EVENTS.REPLAY_CASE, this.boundReplayCaseHandler);

    // CLOSE → 关闭场景
    this.boundCloseHandler = (() => {
      this.closeScene();
    }) as EventListener;
    window.addEventListener(CASEBOOK_EVENTS.CLOSE, this.boundCloseHandler);

    // DIAGNOSIS_COMPLETE → 更新进度
    this.boundDiagnosisCompleteHandler = ((e: CustomEvent) => {
      const { caseId, score, syndrome, formula } = e.detail;
      this.handleDiagnosisComplete(caseId, score, syndrome, formula);
    }) as EventListener;
    window.addEventListener(DIAGNOSIS_EVENTS.COMPLETE, this.boundDiagnosisCompleteHandler);
  }

  /**
   * 启动诊断
   */
  private launchDiagnosis(caseId: string): void {
    console.log('[CasebookScene] Launching diagnosis for case:', caseId);

    // 先关闭病案集
    this.cleanupReactUI();

    // 启动诊断场景
    this.scene.launch(SCENES.DIAGNOSIS, { caseId });
  }

  /**
   * 处理诊断完成
   */
  private handleDiagnosisComplete(
    caseId: string,
    score: string,
    syndrome: string,
    formula: string
  ): void {
    console.log('[CasebookScene] Diagnosis complete:', { caseId, score, syndrome, formula });

    // 更新注册表中的进度
    const progress = this.registry.get('casebook_progress') || {};
    const categoryId = caseId.split('-')[0];

    if (!progress[categoryId]) {
      progress[categoryId] = [];
    }
    if (!progress[categoryId].includes(caseId)) {
      progress[categoryId].push(caseId);
    }
    this.registry.set('casebook_progress', progress);

    // 发送结果回病案集UI
    window.dispatchEvent(new CustomEvent(CASEBOOK_EVENTS.RESULT, {
      detail: { caseId, score, syndrome, formula }
    }));

    // 停止诊断场景，重新启动病案集
    this.scene.stop(SCENES.DIAGNOSIS);
    this.scene.launch(SCENES.CASEBOOK, { caseId });
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
      unmountCasebookUI(this.reactRoot);
      this.reactRoot = null;
    }
    if (this.domContainer) {
      this.domContainer.remove();
      this.domContainer = null;
    }

    // 移除事件监听
    if (this.boundStartCaseHandler) {
      window.removeEventListener(CASEBOOK_EVENTS.START_CASE, this.boundStartCaseHandler);
      this.boundStartCaseHandler = null;
    }
    if (this.boundReplayCaseHandler) {
      window.removeEventListener(CASEBOOK_EVENTS.REPLAY_CASE, this.boundReplayCaseHandler);
      this.boundReplayCaseHandler = null;
    }
    if (this.boundCloseHandler) {
      window.removeEventListener(CASEBOOK_EVENTS.CLOSE, this.boundCloseHandler);
      this.boundCloseHandler = null;
    }
    if (this.boundDiagnosisCompleteHandler) {
      window.removeEventListener(DIAGNOSIS_EVENTS.COMPLETE, this.boundDiagnosisCompleteHandler);
      this.boundDiagnosisCompleteHandler = null;
    }
  }

  /**
   * 暴露到全局（供测试访问）
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__CASEBOOK_SCENE__ = {
        isInitialized: this.isInitialized,
        initialCaseId: this.initialCaseId,
        hasReactUI: !!this.reactRoot,
      };
    }
  }

  /**
   * 获取当前病案 ID
   */
  getCaseId(): string | null {
    return this.initialCaseId;
  }

  update(): void {
    // React UI 自行管理更新
  }

  shutdown(): void {
    // 清理 React UI
    this.cleanupReactUI();

    // 重置状态
    this.isInitialized = false;
    this.initialCaseId = null;

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__CASEBOOK_SCENE__ = null;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: SCENES.CASEBOOK });
  }
}