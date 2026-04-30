// src/scenes/DiagnosisScene.ts
/**
 * 诊断场景
 *
 * Phase 2.5 诊断游戏 HTML 直接迁移
 *
 * 功能:
 * - 集成 React DiagnosisUI
 * - 诊断游戏流程控制（5阶段：舌诊→脉诊→问诊→辨证→选方）
 * - 从病案列表或 NPC 对话触发进入
 *
 * 流程:
 * 1. 病案弹窗 → DiagnosisScene (点击"开始诊断")
 * 2. 舌诊 → 脉诊 → 问诊 → 辨证 → 选方 → 呈递医案
 * 3. DiagnosisScene → 返回场景 (完成或取消)
 */

import Phaser from 'phaser';
import type { Root } from 'react-dom/client';
import { SCENES } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';

// React UI imports
import { mountDiagnosisUI, unmountDiagnosisUI, DIAGNOSIS_EVENTS } from '../ui/html/diagnosis-entry';
import { DiagnosisCase } from '../ui/html/data/diagnosis-cases';
import { getCaseById } from '../ui/html/data/diagnosis-cases';
import type { DiagnosisResult } from '../ui/html/DiagnosisUI';

export interface DiagnosisSceneConfig {
  caseId: string;           // 必须指定病案 ID
  returnScene?: string;     // 返回场景（默认诊所）
}

export class DiagnosisScene extends Phaser.Scene {
  // 系统组件
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;

  // React UI
  private reactRoot: Root | null = null;
  private domContainer: HTMLElement | null = null;

  // 事件监听器引用（用于正确移除）
  private boundCompleteHandler: EventListener | null = null;
  private boundCloseHandler: EventListener | null = null;

  // 数据
  private caseId: string;
  private caseData: DiagnosisCase | null = null;
  private returnScene: string;

  // 状态
  private isInitialized: boolean = false;

  constructor() {
    super({ key: 'DiagnosisScene' });
    this.caseId = '';
    this.returnScene = SCENES.CLINIC;
  }

  init(data: DiagnosisSceneConfig): void {
    this.caseId = data.caseId;
    this.returnScene = data.returnScene || SCENES.CLINIC;

    // 获取病案数据
    const foundCase = getCaseById(this.caseId);
    this.caseData = foundCase || null;

    if (!this.caseData) {
      console.error(`DiagnosisScene: 病案 ID "${this.caseId}" 不存在`);
    }
  }

  create(): void {
    // 初始化系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    // CaseManager 暂不使用（单例模式尚未实现）
    // 后续可通过 EventBus 与 NPC 系统交互记录诊断结果

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: 'DiagnosisScene' });

    // 创建背景
    this.createBackground();

    // 创建 React UI
    if (this.caseData) {
      this.createReactUI();
    } else {
      // 病案不存在，显示错误并返回
      this.showErrorAndReturn();
      return;
    }

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene('DiagnosisScene');

    // 标记初始化完成
    this.isInitialized = true;

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: 'DiagnosisScene' });
    (window as any).__SCENE_READY__ = true;

    // 暴露到全局供测试访问
    this.exposeToGlobal();
  }

  /**
   * 创建背景 - 不创建Phaser背景，让场景透明显示下面的游戏
   */
  private createBackground(): void {
    // 透明背景，React UI自己有样式，玩家能看到下面的诊所场景
    // 不添加任何Phaser背景元素
  }

  /**
   * 创建 React UI
   */
  private createReactUI(): void {
    // 创建 DOM 容器
    this.domContainer = document.createElement('div');
    this.domContainer.id = 'diagnosis-react-root';

    // 添加到 body
    document.body.appendChild(this.domContainer);

    // 挂载 React UI
    this.reactRoot = mountDiagnosisUI(this.domContainer, {
      caseData: this.caseData!,
      onComplete: (result) => this.handleDiagnosisComplete(result),
      onClose: () => this.returnToPreviousScene(),
    });

    // 设置桥接事件监听
    this.setupBridgeEventListeners();
  }

  /**
   * 设置桥接事件监听 (React UI → Phaser)
   */
  private setupBridgeEventListeners(): void {
    // 保存监听器引用以便正确移除
    this.boundCompleteHandler = ((e: CustomEvent) => {
      const result = e.detail as DiagnosisResult;
      this.handleDiagnosisComplete(result);
    }) as EventListener;

    this.boundCloseHandler = (() => {
      this.returnToPreviousScene();
    }) as EventListener;

    // 监听诊断完成事件
    window.addEventListener(DIAGNOSIS_EVENTS.COMPLETE, this.boundCompleteHandler);

    // 监听关闭事件
    window.addEventListener(DIAGNOSIS_EVENTS.CLOSE, this.boundCloseHandler);
  }

  /**
   * 处理诊断完成
   */
  private handleDiagnosisComplete(result: DiagnosisResult): void {
    console.log('DiagnosisScene: 诊断完成', result);

    // 发送诊断完成事件（供 NPC 系统监听）
    this.eventBus.emit('DIAGNOSIS_COMPLETE', {
      caseId: this.caseId,
      result
    });

    // CaseManager 结果记录（通过 EventBus）
    // TODO: 后续实现 CaseManager.recordDiagnosisResult 方法

    // 发送事件给 NPC 系统（通过 CustomEvent）
    window.dispatchEvent(new CustomEvent('game:diagnosis_complete', {
      detail: {
        caseId: this.caseId,
        patientName: result.patient.name,
        diagnosis: result.diagnosis
      }
    }));

    // 返回场景（后续由 NPC 触发煎药）
    this.returnToPreviousScene();
  }

  /**
   * 返回上一个场景
   */
  private returnToPreviousScene(): void {
    // 清理 React UI
    this.cleanupReactUI();

    this.eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: 'DiagnosisScene',
      to: this.returnScene
    });

    // 停止当前场景（ClinicScene仍在运行）
    this.scene.stop();
  }

  /**
   * 显示错误并返回
   */
  private showErrorAndReturn(): void {
    const errorText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      `病案加载失败: ID "${this.caseId}" 不存在`,
      {
        fontSize: '24px',
        color: '#a8442a',
        backgroundColor: '#f1e6cc',
        padding: { x: 16, y: 8 }
      }
    ).setOrigin(0.5);

    // 使用 errorText 后返回
    console.warn(errorText.text);

    // 3秒后停止当前场景
    this.time.delayedCall(3000, () => {
      this.scene.stop();
    });
  }

  /**
   * 清理 React UI
   */
  private cleanupReactUI(): void {
    if (this.reactRoot) {
      unmountDiagnosisUI(this.reactRoot);
      this.reactRoot = null;
    }

    if (this.domContainer) {
      this.domContainer.remove();
      this.domContainer = null;
    }

    // 正确移除桥接事件监听（使用保存的引用）
    if (this.boundCompleteHandler) {
      window.removeEventListener(DIAGNOSIS_EVENTS.COMPLETE, this.boundCompleteHandler);
      this.boundCompleteHandler = null;
    }
    if (this.boundCloseHandler) {
      window.removeEventListener(DIAGNOSIS_EVENTS.CLOSE, this.boundCloseHandler);
      this.boundCloseHandler = null;
    }
  }

  /**
   * 暴露到全局（供测试访问）
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__DIAGNOSIS_SCENE__ = {
        isInitialized: this.isInitialized,
        caseId: this.caseId,
        caseData: this.caseData,
        returnScene: this.returnScene,
        hasReactUI: !!this.reactRoot,
      };
    }
  }

  /**
   * 获取当前病案 ID
   */
  getCaseId(): string {
    return this.caseId;
  }

  /**
   * 获取病案数据
   */
  getCaseData(): DiagnosisCase | null {
    return this.caseData;
  }

  update(): void {
    // React UI 自行管理更新
  }

  shutdown(): void {
    // 清理 React UI
    this.cleanupReactUI();

    // 重置状态
    this.isInitialized = false;
    this.caseId = '';
    this.caseData = null;

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__DIAGNOSIS_SCENE__ = null;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: 'DiagnosisScene' });
  }
}