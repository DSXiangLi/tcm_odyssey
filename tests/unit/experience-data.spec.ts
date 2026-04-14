// tests/unit/experience-data.spec.ts
/**
 * 经验值数据结构单元测试
 *
 * Phase 2 S12.1 实现
 */

import { describe, it, expect } from 'vitest';
import {
  EXPERIENCE_TYPES,
  EXPERIENCE_SOURCES,
  UNLOCK_CONTENTS,
  EXPERIENCE_PARAMS,
  getExperienceTypeConfig,
  getExperienceSourceConfig,
  getUnlockContentConfig,
  calculateExperienceFromScore,
  calculateTotalExperience,
  checkUnlockRequirements,
  getUnlockablesForExperience,
  type ExperienceType,
  type ExperienceSource,
  type UnlockContent
} from '../../src/data/experience-data';

describe('S12.1: 经验值数据结构', () => {
  describe('EXPERIENCE_TYPES - 经验值类型', () => {
    it('should have 3 experience types', () => {
      expect(EXPERIENCE_TYPES.length).toBe(3);
    });

    it('should include learning, practice, exploration types', () => {
      const names = EXPERIENCE_TYPES.map(t => t.name);
      expect(names).toContain('学习');
      expect(names).toContain('实践');
      expect(names).toContain('探索');
    });

    it('should have valid color for each type', () => {
      EXPERIENCE_TYPES.forEach(type => {
        expect(type.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('getExperienceTypeConfig should return correct config', () => {
      const learningType = getExperienceTypeConfig('learning');
      expect(learningType?.name).toBe('学习');

      const practiceType = getExperienceTypeConfig('practice');
      expect(practiceType?.name).toBe('实践');

      const invalid = getExperienceTypeConfig('invalid' as ExperienceType);
      expect(invalid).toBeUndefined();
    });
  });

  describe('EXPERIENCE_SOURCES - 经验值来源', () => {
    it('should have 5 experience sources', () => {
      expect(EXPERIENCE_SOURCES.length).toBe(5);
    });

    it('should include task_completion, case_score, clue_collected, daily_checkin, achievement', () => {
      const ids = EXPERIENCE_SOURCES.map(s => s.id);
      expect(ids).toContain('task_completion');
      expect(ids).toContain('case_score');
      expect(ids).toContain('clue_collected');
      expect(ids).toContain('daily_checkin');
      expect(ids).toContain('achievement');
    });

    it('task_completion should have base_value greater than 0', () => {
      const taskSource = EXPERIENCE_SOURCES.find(s => s.id === 'task_completion');
      expect(taskSource?.base_value).toBeGreaterThan(0);
    });

    it('case_score should have multiplier defined', () => {
      const caseSource = EXPERIENCE_SOURCES.find(s => s.id === 'case_score');
      expect(caseSource?.multiplier).toBeDefined();
      expect(caseSource?.multiplier).toBeGreaterThan(0);
    });

    it('clue_collected should have per_clue_value', () => {
      const clueSource = EXPERIENCE_SOURCES.find(s => s.id === 'clue_collected');
      expect(clueSource?.per_clue_value).toBeDefined();
      expect(clueSource?.per_clue_value).toBeGreaterThan(0);
    });

    it('daily_checkin should have daily_bonus', () => {
      const dailySource = EXPERIENCE_SOURCES.find(s => s.id === 'daily_checkin');
      expect(dailySource?.daily_bonus).toBeDefined();
      expect(dailySource?.daily_bonus).toBeGreaterThan(0);
    });

    it('achievement should have one_time_bonus structure', () => {
      const achievementSource = EXPERIENCE_SOURCES.find(s => s.id === 'achievement');
      expect(achievementSource?.achievement_bonuses).toBeDefined();
    });

    it('getExperienceSourceConfig should return correct config', () => {
      const taskConfig = getExperienceSourceConfig('task_completion');
      expect(taskConfig?.name).toBe('完成任务');

      const invalid = getExperienceSourceConfig('invalid' as ExperienceSource);
      expect(invalid).toBeUndefined();
    });
  });

  describe('UNLOCK_CONTENTS - 解锁内容', () => {
    it('should have at least 3 unlock contents', () => {
      expect(UNLOCK_CONTENTS.length).toBeGreaterThanOrEqual(3);
    });

    it('should include prescription_modification, yaowang_valley, new_npc', () => {
      const ids = UNLOCK_CONTENTS.map(c => c.id);
      expect(ids).toContain('prescription_modification');
      expect(ids).toContain('yaowang_valley');
      expect(ids).toContain('new_npc');
    });

    it('prescription_modification should have correct name', () => {
      const modContent = UNLOCK_CONTENTS.find(c => c.id === 'prescription_modification');
      expect(modContent?.name).toBe('方剂加减功能');
      expect(modContent?.description).toContain('加减');
    });

    it('yaowang_valley should have correct name', () => {
      const valleyContent = UNLOCK_CONTENTS.find(c => c.id === 'yaowang_valley');
      expect(valleyContent?.name).toBe('药王谷');
      expect(valleyContent?.description).toContain('探索');
    });

    it('new_npc should have correct name', () => {
      const npcContent = UNLOCK_CONTENTS.find(c => c.id === 'new_npc');
      expect(npcContent?.name).toBe('新导师');
      expect(npcContent?.description).toContain('NPC');
    });

    it('each unlock content should have required_experience', () => {
      UNLOCK_CONTENTS.forEach(content => {
        expect(content.required_experience).toBeGreaterThanOrEqual(0);
      });
    });

    it('getUnlockContentConfig should return correct config', () => {
      const modConfig = getUnlockContentConfig('prescription_modification');
      expect(modConfig?.name).toBe('方剂加减功能');

      const invalid = getUnlockContentConfig('invalid' as UnlockContent);
      expect(invalid).toBeUndefined();
    });
  });

  describe('EXPERIENCE_PARAMS - 经验值参数', () => {
    it('should have max_total_experience defined', () => {
      expect(EXPERIENCE_PARAMS.max_total_experience).toBeDefined();
      expect(EXPERIENCE_PARAMS.max_total_experience).toBeGreaterThan(0);
    });

    it('should have score_to_exp_ratio', () => {
      expect(EXPERIENCE_PARAMS.score_to_exp_ratio).toBeDefined();
      expect(EXPERIENCE_PARAMS.score_to_exp_ratio).toBeGreaterThan(0);
    });

    it('should have daily_streak_bonus structure', () => {
      expect(EXPERIENCE_PARAMS.daily_streak_bonus).toBeDefined();
    });
  });

  describe('calculateExperienceFromScore - 根据得分计算经验值', () => {
    it('should calculate correct experience from perfect score', () => {
      const exp = calculateExperienceFromScore(100);
      expect(exp).toBe(EXPERIENCE_PARAMS.score_to_exp_ratio * 100);
    });

    it('should calculate correct experience from zero score', () => {
      const exp = calculateExperienceFromScore(0);
      expect(exp).toBe(0);
    });

    it('should calculate correct experience from partial score', () => {
      const exp = calculateExperienceFromScore(60);
      expect(exp).toBe(EXPERIENCE_PARAMS.score_to_exp_ratio * 60);
    });

    it('should handle score above 100 gracefully', () => {
      const exp = calculateExperienceFromScore(150);
      expect(exp).toBeLessThanOrEqual(EXPERIENCE_PARAMS.score_to_exp_ratio * 100);
    });
  });

  describe('calculateTotalExperience - 计算总经验值', () => {
    it('should sum all experience values', () => {
      const sources = [
        { source: 'task_completion', value: 50 },
        { source: 'case_score', value: 30 },
        { source: 'clue_collected', value: 20 }
      ];
      const total = calculateTotalExperience(sources);
      expect(total).toBe(100);
    });

    it('should return 0 for empty array', () => {
      const total = calculateTotalExperience([]);
      expect(total).toBe(0);
    });
  });

  describe('checkUnlockRequirements - 检查解锁条件', () => {
    it('should return true when experience meets requirement', () => {
      const content = UNLOCK_CONTENTS.find(c => c.id === 'prescription_modification');
      if (content) {
        const result = checkUnlockRequirements(content.required_experience, content.required_experience);
        expect(result).toBe(true);
      }
    });

    it('should return false when experience is below requirement', () => {
      const result = checkUnlockRequirements(0, 1000);
      expect(result).toBe(false);
    });
  });

  describe('getUnlockablesForExperience - 获取可解锁内容', () => {
    it('should return empty array for zero experience', () => {
      const unlockables = getUnlockablesForExperience(0);
      expect(unlockables.length).toBe(0);
    });

    it('should return unlocked contents when experience meets requirement', () => {
      // 找到最低要求的解锁内容
      const minRequired = Math.min(...UNLOCK_CONTENTS.map(c => c.required_experience));
      const unlockables = getUnlockablesForExperience(minRequired);
      expect(unlockables.length).toBeGreaterThanOrEqual(1);
    });

    it('should return all contents for high experience', () => {
      const unlockables = getUnlockablesForExperience(EXPERIENCE_PARAMS.max_total_experience);
      expect(unlockables.length).toBe(UNLOCK_CONTENTS.length);
    });
  });
});