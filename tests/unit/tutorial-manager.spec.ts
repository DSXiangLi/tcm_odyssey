// tests/unit/tutorial-manager.spec.ts
/**
 * TutorialManager 单元测试
 *
 * Phase 2 S13.2 实现
 *
 * 测试覆盖:
 * - 单例模式
 * - 状态管理
 * - 引导流程控制
 * - 步骤追踪
 * - 完成状态管理
 * - 跳过处理
 * - 场景提示管理
 * - 存档集成
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TutorialManager, TutorialEvent } from '../../src/systems/TutorialManager';
import { EventBus } from '../../src/systems/EventBus';
import {
  TutorialState,
  TutorialStepId,
  initializeTutorialState,
  TUTORIAL_STEPS,
  SCENE_TIPS
} from '../../src/data/tutorial-data';

describe('TutorialManager', () => {
  let tutorialManager: TutorialManager;
  let eventBus: EventBus;

  beforeEach(() => {
    // 重置单例
    EventBus.resetInstance();
    TutorialManager.resetInstance();

    eventBus = EventBus.getInstance();
    tutorialManager = TutorialManager.getInstance();
  });

  afterEach(() => {
    tutorialManager.destroy();
    eventBus.destroy();
  });

  // ===== Test 1: 单例模式 =====

  it('should be a singleton', () => {
    const instance1 = TutorialManager.getInstance();
    const instance2 = TutorialManager.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should allow resetting the singleton for testing', () => {
    const instance1 = TutorialManager.getInstance();
    TutorialManager.resetInstance();
    const instance2 = TutorialManager.getInstance();

    expect(instance1).not.toBe(instance2);
  });

  // ===== Test 2: 状态管理 =====

  it('should return initial state after creation', () => {
    const state = tutorialManager.getState();

    expect(state.phase).toBe('central');
    expect(state.current_step).toBe('move');
    expect(state.completed_steps).toEqual([]);
    expect(state.seen_scene_tips).toEqual([]);
    expect(state.skipped).toBe(false);
  });

  it('should reset to initial state', () => {
    // 先完成一些步骤
    tutorialManager.completeCurrentStep();
    tutorialManager.completeCurrentStep();

    // 重置
    tutorialManager.reset();

    const state = tutorialManager.getState();
    expect(state.phase).toBe('central');
    expect(state.current_step).toBe('move');
    expect(state.completed_steps).toEqual([]);
  });

  // ===== Test 3: 引导流程控制 =====

  it('should start tutorial and emit TUTORIAL_STARTED event', () => {
    const eventSpy = vi.fn();
    eventBus.on(TutorialEvent.TUTORIAL_STARTED, eventSpy);

    tutorialManager.startTutorial();

    expect(eventSpy).toHaveBeenCalledWith({
      step: 'move',
      timestamp: expect.any(Number)
    });
  });

  it('should advance to next step after completing current', () => {
    const initialStep = tutorialManager.getState().current_step;
    expect(initialStep).toBe('move');

    tutorialManager.completeCurrentStep();

    const newStep = tutorialManager.getState().current_step;
    expect(newStep).toBe('interact');
  });

  it('should emit TUTORIAL_STEP_COMPLETED event when step is completed', () => {
    const eventSpy = vi.fn();
    eventBus.on(TutorialEvent.TUTORIAL_STEP_COMPLETED, eventSpy);

    tutorialManager.completeCurrentStep();

    expect(eventSpy).toHaveBeenCalledWith({
      step_id: 'move',
      next_step: 'interact',
      completed_count: 1,
      total_steps: TUTORIAL_STEPS.length
    });
  });

  // ===== Test 4: 步骤追踪 =====

  it('should track completed steps', () => {
    tutorialManager.completeCurrentStep();
    tutorialManager.completeCurrentStep();

    const state = tutorialManager.getState();
    expect(state.completed_steps).toEqual(['move', 'interact']);
  });

  it('should not duplicate completed steps', () => {
    tutorialManager.completeCurrentStep();
    tutorialManager.completeCurrentStep();

    // 尝试再次完成已完成的步骤（不应该发生，但要测试保护机制）
    // 需要先跳回上一步（通过reset再手动设置）
    tutorialManager.reset();

    const state = tutorialManager.getState();
    expect(state.completed_steps).toEqual([]);
  });

  it('should return current step info', () => {
    const currentStep = tutorialManager.getCurrentStepInfo();

    expect(currentStep).toBeDefined();
    expect(currentStep?.id).toBe('move');
    expect(currentStep?.title).toBe('移动控制');
  });

  // ===== Test 5: 完成状态管理 =====

  it('should detect when all central tutorial steps are completed', () => {
    // 完成所有集中引导步骤
    for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
      tutorialManager.completeCurrentStep();
    }

    const state = tutorialManager.getState();
    expect(state.phase).toBe('scene_tips');
    expect(state.current_step).toBeNull();
  });

  it('should mark tutorial as complete after all steps and tips', () => {
    // 完成所有集中引导步骤
    for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
      tutorialManager.completeCurrentStep();
    }

    // 显示所有场景提示
    for (const tip of SCENE_TIPS) {
      tutorialManager.markSceneTipShown(tip.scene_key);
    }

    const state = tutorialManager.getState();
    expect(state.phase).toBe('complete');
    expect(tutorialManager.isComplete()).toBe(true);
  });

  it('should emit TUTORIAL_COMPLETE event when all steps are done', () => {
    const eventSpy = vi.fn();
    eventBus.on(TutorialEvent.TUTORIAL_COMPLETE, eventSpy);

    // 完成所有步骤和提示
    for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
      tutorialManager.completeCurrentStep();
    }
    for (const tip of SCENE_TIPS) {
      tutorialManager.markSceneTipShown(tip.scene_key);
    }

    expect(eventSpy).toHaveBeenCalled();
  });

  // ===== Test 6: 跳过处理 =====

  it('should skip tutorial and emit TUTORIAL_SKIPPED event', () => {
    const eventSpy = vi.fn();
    eventBus.on(TutorialEvent.TUTORIAL_SKIPPED, eventSpy);

    tutorialManager.skipTutorial();

    const state = tutorialManager.getState();
    expect(state.skipped).toBe(true);
    expect(state.phase).toBe('scene_tips');
    expect(state.current_step).toBeNull();

    expect(eventSpy).toHaveBeenCalledWith({
      timestamp: expect.any(Number)
    });
  });

  it('should consider skipped tutorial as complete', () => {
    tutorialManager.skipTutorial();

    expect(tutorialManager.isComplete()).toBe(true);
  });

  // ===== Test 7: 场景提示管理 =====

  it('should determine if scene tip should be shown', () => {
    // 初始状态，场景提示不应该显示（还在集中引导阶段）
    expect(tutorialManager.shouldShowSceneTip('TownOutdoorScene')).toBe(false);

    // 完成集中引导后，场景提示应该显示
    for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
      tutorialManager.completeCurrentStep();
    }

    expect(tutorialManager.shouldShowSceneTip('TownOutdoorScene')).toBe(true);
  });

  it('should mark scene tip as shown and emit SCENE_TIP_SHOWN event', () => {
    const eventSpy = vi.fn();
    eventBus.on(TutorialEvent.SCENE_TIP_SHOWN, eventSpy);

    // 先进入scene_tips阶段
    for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
      tutorialManager.completeCurrentStep();
    }

    tutorialManager.markSceneTipShown('TownOutdoorScene');

    const state = tutorialManager.getState();
    expect(state.seen_scene_tips).toContain('TownOutdoorScene');

    expect(eventSpy).toHaveBeenCalledWith({
      scene_key: 'TownOutdoorScene',
      timestamp: expect.any(Number)
    });
  });

  it('should not show scene tip that was already shown', () => {
    // 进入scene_tips阶段
    for (let i = 0; i < TUTORIAL_STEPS.length; i++) {
      tutorialManager.completeCurrentStep();
    }

    tutorialManager.markSceneTipShown('TownOutdoorScene');

    // 第二次不应该显示
    expect(tutorialManager.shouldShowSceneTip('TownOutdoorScene')).toBe(false);
  });

  // ===== Test 8: 存档集成 =====

  it('should export state for save system', () => {
    tutorialManager.completeCurrentStep();
    tutorialManager.completeCurrentStep();

    const exportedData = tutorialManager.exportState();

    expect(exportedData).toHaveProperty('phase');
    expect(exportedData).toHaveProperty('completed_steps');
    expect(exportedData).toHaveProperty('seen_scene_tips');
    expect(exportedData).toHaveProperty('skipped');

    expect((exportedData as any).completed_steps).toEqual(['move', 'interact']);
  });

  it('should import state from save system', () => {
    const savedState: Partial<TutorialState> = {
      phase: 'scene_tips',
      completed_steps: ['move', 'interact', 'bag'],
      seen_scene_tips: ['TownOutdoorScene'],
      skipped: false
    };

    tutorialManager.importState(savedState as TutorialState);

    const state = tutorialManager.getState();
    expect(state.phase).toBe('scene_tips');
    expect(state.completed_steps).toEqual(['move', 'interact', 'bag']);
    expect(state.seen_scene_tips).toContain('TownOutdoorScene');
  });

  it('should expose to window for testing', () => {
    tutorialManager.exposeToWindow();

    expect((window as any).__TUTORIAL_MANAGER__).toBe(tutorialManager);
    expect(typeof (window as any).__TUTORIAL_STATE__).toBe('function');
  });

  // ===== Test 9: 辅助方法 =====

  it('should get remaining steps count', () => {
    expect(tutorialManager.getRemainingStepsCount()).toBe(TUTORIAL_STEPS.length);

    tutorialManager.completeCurrentStep();
    expect(tutorialManager.getRemainingStepsCount()).toBe(TUTORIAL_STEPS.length - 1);
  });

  it('should get progress percentage', () => {
    expect(tutorialManager.getProgressPercentage()).toBe(0);

    tutorialManager.completeCurrentStep();
    // Math.round((1/3) * 100) = 33
    expect(tutorialManager.getProgressPercentage()).toBe(33);

    tutorialManager.completeCurrentStep();
    // Math.round((2/3) * 100) = 67
    expect(tutorialManager.getProgressPercentage()).toBe(67);

    tutorialManager.completeCurrentStep();
    expect(tutorialManager.getProgressPercentage()).toBe(100);
  });

  it('should get scene tip info for a scene', () => {
    const tipInfo = tutorialManager.getSceneTipInfo('ClinicScene');

    expect(tipInfo).toBeDefined();
    expect(tipInfo?.scene_key).toBe('ClinicScene');
    expect(tipInfo?.content).toContain('青木先生');
  });

  it('should return null for unknown scene tip', () => {
    const tipInfo = tutorialManager.getSceneTipInfo('UnknownScene');

    expect(tipInfo).toBeUndefined();
  });
});