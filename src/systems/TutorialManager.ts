// src/systems/TutorialManager.ts
/**
 * 新手引导管理器
 *
 * 功能:
 * - 引导流程控制
 * - 步骤追踪
 * - 完成状态管理
 * - 跳过处理
 * - 场景提示管理
 * - SaveManager集成
 *
 * Phase 2 S13.2 实现
 */

import { EventBus, EventData } from './EventBus';
import {
  TutorialState,
  TutorialStepId,
  TutorialStepConfig,
  SceneTipConfig,
  initializeTutorialState,
  markTutorialStepComplete,
  markSceneTipSeen,
  skipCentralTutorial,
  isTutorialComplete,
  hasSeenSceneTip,
  exportTutorialState,
  importTutorialState,
  getTutorialStep,
  getSceneTip,
  TUTORIAL_STEPS,
  SCENE_TIPS
} from '../data/tutorial-data';

/**
 * TutorialManager事件类型
 */
export const TutorialEvent = {
  TUTORIAL_STARTED: 'tutorial:started',
  TUTORIAL_STEP_COMPLETED: 'tutorial:step_completed',
  TUTORIAL_SKIPPED: 'tutorial:skipped',
  TUTORIAL_COMPLETE: 'tutorial:complete',
  SCENE_TIP_SHOWN: 'tutorial:scene_tip_shown'
} as const;

/**
 * TutorialManager类
 *
 * 单例模式，管理新手引导的完整流程
 */
export class TutorialManager {
  private static instance: TutorialManager | null = null;

  private state: TutorialState;
  private eventBus: EventBus;

  private constructor() {
    this.state = initializeTutorialState();
    this.eventBus = EventBus.getInstance();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): TutorialManager {
    if (!TutorialManager.instance) {
      TutorialManager.instance = new TutorialManager();
    }
    return TutorialManager.instance;
  }

  /**
   * 重置单例（用于测试）
   */
  static resetInstance(): void {
    if (TutorialManager.instance) {
      TutorialManager.instance.destroy();
    }
    TutorialManager.instance = null;
  }

  // ===== 状态管理 =====

  /**
   * 获取当前状态
   */
  getState(): TutorialState {
    return { ...this.state };
  }

  /**
   * 重置到初始状态
   */
  reset(): void {
    this.state = initializeTutorialState();
    console.log('[TutorialManager] State reset to initial');
  }

  /**
   * 检查引导是否完成
   */
  isComplete(): boolean {
    return isTutorialComplete(this.state);
  }

  // ===== 引导流程控制 =====

  /**
   * 开始新手引导
   * 在TitleScene点击"新游戏"后调用
   */
  startTutorial(): void {
    if (this.state.phase !== 'central') {
      console.warn('[TutorialManager] Tutorial already started or completed');
      return;
    }

    // 发送引导开始事件
    this.eventBus.emit(TutorialEvent.TUTORIAL_STARTED, {
      step: this.state.current_step,
      timestamp: Date.now()
    });

    console.log(`[TutorialManager] Tutorial started with step: ${this.state.current_step}`);
  }

  /**
   * 完成当前引导步骤
   */
  completeCurrentStep(): void {
    if (this.state.phase !== 'central') {
      console.warn('[TutorialManager] Not in central tutorial phase');
      return;
    }

    if (!this.state.current_step) {
      console.warn('[TutorialManager] No current step to complete');
      return;
    }

    const currentStepId = this.state.current_step;
    const nextStep = this.getNextStep(currentStepId);

    // 使用数据层的函数更新状态
    this.state = markTutorialStepComplete(this.state, currentStepId);

    // 发送步骤完成事件
    this.eventBus.emit(TutorialEvent.TUTORIAL_STEP_COMPLETED, {
      step_id: currentStepId,
      next_step: nextStep,
      completed_count: this.state.completed_steps.length,
      total_steps: TUTORIAL_STEPS.length
    });

    console.log(`[TutorialManager] Step ${currentStepId} completed, next: ${nextStep || 'none'}`);

    // 检查是否进入场景提示阶段
    if (this.state.phase === 'scene_tips') {
      console.log('[TutorialManager] Central tutorial complete, entering scene tips phase');
    }
  }

  /**
   * 获取下一个引导步骤
   */
  private getNextStep(currentStep: TutorialStepId): TutorialStepId | null {
    const currentConfig = getTutorialStep(currentStep);
    if (!currentConfig) return null;

    const nextConfig = TUTORIAL_STEPS.find(s => s.order === currentConfig.order + 1);
    return nextConfig?.id ?? null;
  }

  /**
   * 跳过集中引导
   */
  skipTutorial(): void {
    if (this.state.phase !== 'central') {
      console.warn('[TutorialManager] Cannot skip - not in central phase');
      return;
    }

    // 使用数据层的函数更新状态
    this.state = skipCentralTutorial(this.state);

    // 发送跳过事件
    this.eventBus.emit(TutorialEvent.TUTORIAL_SKIPPED, {
      timestamp: Date.now()
    });

    console.log('[TutorialManager] Tutorial skipped');
  }

  // ===== 步骤追踪 =====

  /**
   * 获取当前步骤信息
   */
  getCurrentStepInfo(): TutorialStepConfig | undefined {
    if (!this.state.current_step) return undefined;
    return getTutorialStep(this.state.current_step);
  }

  /**
   * 获取剩余步骤数量
   */
  getRemainingStepsCount(): number {
    return TUTORIAL_STEPS.length - this.state.completed_steps.length;
  }

  /**
   * 获取进度百分比
   */
  getProgressPercentage(): number {
    const completed = this.state.completed_steps.length;
    const total = TUTORIAL_STEPS.length;
    return Math.round((completed / total) * 100);
  }

  // ===== 场景提示管理 =====

  /**
   * 判断是否应该显示场景提示
   */
  shouldShowSceneTip(sceneKey: string): boolean {
    // 只有在scene_tips阶段才显示场景提示
    if (this.state.phase !== 'scene_tips' && this.state.phase !== 'complete') {
      return false;
    }

    // 检查是否已显示过
    return !hasSeenSceneTip(this.state, sceneKey);
  }

  /**
   * 标记场景提示已显示
   */
  markSceneTipShown(sceneKey: string): void {
    if (this.state.phase !== 'scene_tips' && this.state.phase !== 'complete') {
      console.warn('[TutorialManager] Cannot mark scene tip - not in scene tips phase');
      return;
    }

    // 使用数据层的函数更新状态
    this.state = markSceneTipSeen(this.state, sceneKey);

    // 发送场景提示显示事件
    this.eventBus.emit(TutorialEvent.SCENE_TIP_SHOWN, {
      scene_key: sceneKey,
      timestamp: Date.now()
    });

    console.log(`[TutorialManager] Scene tip shown for: ${sceneKey}`);

    // 检查是否所有场景提示都已显示
    if (this.state.phase === 'complete') {
      // 发送引导完成事件
      this.eventBus.emit(TutorialEvent.TUTORIAL_COMPLETE, {
        timestamp: Date.now()
      });
      console.log('[TutorialManager] Tutorial fully complete');
    }
  }

  /**
   * 获取场景提示信息
   */
  getSceneTipInfo(sceneKey: string): SceneTipConfig | undefined {
    return getSceneTip(sceneKey);
  }

  // ===== 存档集成 =====

  /**
   * 导出状态（供SaveManager使用）
   */
  exportState(): Record<string, unknown> {
    return exportTutorialState(this.state);
  }

  /**
   * 导入状态（从SaveManager恢复）
   */
  importState(state: TutorialState): void {
    // 使用数据层的导入函数，但要保持当前实例的状态
    const importedState = importTutorialState(state as Record<string, unknown>);
    this.state = importedState;

    console.log(`[TutorialManager] State imported: phase=${this.state.phase}, steps=${this.state.completed_steps.length}`);
  }

  /**
   * 暴露到全局window（供测试访问）
   */
  exposeToWindow(): void {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__TUTORIAL_MANAGER__ = this;
      (window as unknown as Record<string, unknown>).__TUTORIAL_STATE__ = () => this.getState();
    }
  }

  // ===== 销毁 =====

  /**
   * 销毁
   */
  destroy(): void {
    this.state = initializeTutorialState();
    TutorialManager.instance = null;
  }
}

/**
 * 创建默认的TutorialManager
 */
export function createTutorialManager(): TutorialManager {
  return TutorialManager.getInstance();
}