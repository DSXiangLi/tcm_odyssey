// tests/unit/tutorial-data.spec.ts
/**
 * 新手引导数据结构单元测试
 *
 * Phase 2 S13.1 实现
 */

import { describe, it, expect } from 'vitest';
import {
  TUTORIAL_STEPS,
  SCENE_TIPS,
  getTutorialStep,
  getSceneTip,
  initializeTutorialState,
  isTutorialComplete,
  type TutorialStepId,
  type TutorialPhase,
  type TutorialState
} from '../../src/data/tutorial-data';

describe('S13.1: 新手引导数据结构', () => {
  describe('TUTORIAL_STEPS - 集中引导步骤', () => {
    it('应包含至少3个集中引导步骤', () => {
      expect(TUTORIAL_STEPS.length).toBeGreaterThanOrEqual(3);
    });

    it('应包含移动引导', () => {
      const moveStep = TUTORIAL_STEPS.find(s => s.id === 'move');
      expect(moveStep).toBeDefined();
      expect(moveStep?.title).toContain('移动');
      expect(moveStep?.content).toContain('方向键');
      expect(moveStep?.content).toContain('WASD');
    });

    it('应包含交互引导', () => {
      const interactStep = TUTORIAL_STEPS.find(s => s.id === 'interact');
      expect(interactStep).toBeDefined();
      expect(interactStep?.title).toContain('交互');
      expect(interactStep?.content).toContain('空格');
    });

    it('应包含背包引导', () => {
      const bagStep = TUTORIAL_STEPS.find(s => s.id === 'bag');
      expect(bagStep).toBeDefined();
      expect(bagStep?.title).toContain('背包');
      expect(bagStep?.content).toContain('B');
    });

    it('每个步骤应有完整配置', () => {
      TUTORIAL_STEPS.forEach(step => {
        expect(step.id).toBeDefined();
        expect(step.title).toBeDefined();
        expect(step.content).toBeDefined();
        expect(step.order).toBeGreaterThanOrEqual(0);
      });
    });

    it('getTutorialStep应返回正确步骤', () => {
      const moveStep = getTutorialStep('move');
      expect(moveStep?.id).toBe('move');

      const invalidStep = getTutorialStep('invalid' as TutorialStepId);
      expect(invalidStep).toBeUndefined();
    });
  });

  describe('SCENE_TIPS - 场景分散提示', () => {
    it('应包含至少3个场景提示', () => {
      expect(SCENE_TIPS.length).toBeGreaterThanOrEqual(3);
    });

    it('应包含TownOutdoorScene提示', () => {
      const townTip = SCENE_TIPS.find(t => t.scene_key === 'TownOutdoorScene');
      expect(townTip).toBeDefined();
      expect(townTip?.content).toContain('百草镇');
    });

    it('应包含ClinicScene提示', () => {
      const clinicTip = SCENE_TIPS.find(t => t.scene_key === 'ClinicScene');
      expect(clinicTip).toBeDefined();
      expect(clinicTip?.content).toContain('诊所');
      expect(clinicTip?.content).toContain('青木');
    });

    it('应包含GardenScene提示', () => {
      const gardenTip = SCENE_TIPS.find(t => t.scene_key === 'GardenScene');
      expect(gardenTip).toBeDefined();
      expect(gardenTip?.content).toContain('药园');
      expect(gardenTip?.content).toContain('种植');
    });

    it('每个提示应有完整配置', () => {
      SCENE_TIPS.forEach(tip => {
        expect(tip.scene_key).toBeDefined();
        expect(tip.content).toBeDefined();
        expect(tip.trigger).toBeDefined();
      });
    });

    it('getSceneTip应返回正确提示', () => {
      const townTip = getSceneTip('TownOutdoorScene');
      expect(townTip?.scene_key).toBe('TownOutdoorScene');

      const invalidTip = getSceneTip('InvalidScene');
      expect(invalidTip).toBeUndefined();
    });
  });

  describe('TutorialState - 引导状态', () => {
    it('initializeTutorialState应创建正确状态', () => {
      const state = initializeTutorialState();
      expect(state.phase).toBe('central');
      expect(state.current_step).toBe('move');
      expect(state.completed_steps).toEqual([]);
      expect(state.seen_scene_tips).toEqual([]);
      expect(state.skipped).toBe(false);
    });

    it('isTutorialComplete应正确判断完成状态', () => {
      // 未完成
      const incompleteState: TutorialState = {
        phase: 'central',
        current_step: 'move',
        completed_steps: ['move'],
        seen_scene_tips: [],
        skipped: false
      };
      expect(isTutorialComplete(incompleteState)).toBe(false);

      // 完成
      const completeState: TutorialState = {
        phase: 'complete',
        current_step: null,
        completed_steps: ['move', 'interact', 'bag'],
        seen_scene_tips: ['TownOutdoorScene', 'ClinicScene', 'GardenScene'],
        skipped: false
      };
      expect(isTutorialComplete(completeState)).toBe(true);

      // 跳过
      const skippedState: TutorialState = {
        phase: 'complete',
        current_step: null,
        completed_steps: [],
        seen_scene_tips: [],
        skipped: true
      };
      expect(isTutorialComplete(skippedState)).toBe(true);
    });
  });
});