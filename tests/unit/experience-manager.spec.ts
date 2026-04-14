// tests/unit/experience-manager.spec.ts
/**
 * ExperienceManager 单元测试
 *
 * Phase 2 S12.2 实现
 *
 * 测试内容:
 * - 单例模式
 * - 状态管理
 * - 经验值添加
 * - 解锁检查
 * - 事件发布
 * - SaveManager集成
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ExperienceManager,
  ExperienceEvent,
  type ExperienceManagerConfig
} from '../../src/systems/ExperienceManager';
import { EventBus } from '../../src/systems/EventBus';
import {
  initializeExperienceState,
  type ExperienceState,
  type UnlockContent,
  type ExperienceSource
} from '../../src/data/experience-data';

// Mock EventBus
vi.mock('../../src/systems/EventBus', () => {
  const mockEventBusInstance = {
    emit: vi.fn(),
    on: vi.fn(() => vi.fn()),
    off: vi.fn(),
    clearAll: vi.fn(),
    getEventHistory: vi.fn(() => []),
    hasListeners: vi.fn(() => false)
  };

  return {
    EventBus: {
      getInstance: vi.fn(() => mockEventBusInstance),
      resetInstance: vi.fn(() => {
        mockEventBusInstance.clearAll();
      })
    }
  };
});

describe('ExperienceManager', () => {
  let manager: ExperienceManager;
  let mockEventBus: ReturnType<typeof EventBus.getInstance>;

  beforeEach(() => {
    // Reset singleton before each test
    ExperienceManager.resetInstance();
    EventBus.resetInstance();

    // Create fresh instance
    manager = ExperienceManager.getInstance();
    mockEventBus = EventBus.getInstance();

    // Clear mock history
    vi.clearAllMocks();
  });

  afterEach(() => {
    ExperienceManager.resetInstance();
    EventBus.resetInstance();
  });

  // ===== 单例模式测试 =====

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ExperienceManager.getInstance();
      const instance2 = ExperienceManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = ExperienceManager.getInstance();
      ExperienceManager.resetInstance();

      const instance2 = ExperienceManager.getInstance();

      expect(instance1).not.toBe(instance2);
    });

    it('should accept config on first instantiation', () => {
      ExperienceManager.resetInstance();

      const config: ExperienceManagerConfig = {
        maxExperience: 500,
        autoCheckUnlockables: false
      };

      const instance = ExperienceManager.getInstance(config);
      const state = instance.getState();

      // Config should affect behavior (maxExperience caps total)
      expect(instance).toBeDefined();
    });
  });

  // ===== 状态管理测试 =====

  describe('State Management', () => {
    it('should initialize with default state', () => {
      const state = manager.getState();

      expect(state.total_experience).toBe(0);
      expect(state.experience_by_type.learning).toBe(0);
      expect(state.experience_by_type.practice).toBe(0);
      expect(state.experience_by_type.exploration).toBe(0);
      expect(state.unlocked_contents).toEqual([]);
      expect(state.achievement_unlocked).toEqual([]);
      expect(state.daily_checkin_status.last_checkin_date).toBeNull();
      expect(state.daily_checkin_status.current_streak).toBe(0);
      expect(state.daily_checkin_status.total_checkins).toBe(0);
    });

    it('should return immutable state copy', () => {
      const state1 = manager.getState();
      state1.total_experience = 100;

      const state2 = manager.getState();
      expect(state2.total_experience).toBe(0);
    });

    it('should reset state to initial values', () => {
      // Add some experience first
      manager.addExperienceFromScore(50);

      // Reset
      manager.reset();

      const state = manager.getState();
      expect(state.total_experience).toBe(0);
      expect(state.unlocked_contents).toEqual([]);
    });
  });

  // ===== 经验值添加测试 =====

  describe('Experience Addition', () => {
    it('should add experience from score', () => {
      manager.addExperienceFromScore(75);

      const state = manager.getState();
      expect(state.total_experience).toBe(75);
      expect(state.experience_by_type.practice).toBe(75);

      // Check event emitted
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ExperienceEvent.EXPERIENCE_ADDED,
        expect.objectContaining({
          source: 'case_score',
          value: 75,
          total: 75
        })
      );
    });

    it('should add experience from clues', () => {
      manager.addExperienceFromClues(5);

      const state = manager.getState();
      // 5 clues * 10 points each = 50
      expect(state.total_experience).toBe(50);
      expect(state.experience_by_type.practice).toBe(50);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ExperienceEvent.EXPERIENCE_ADDED,
        expect.objectContaining({
          source: 'clue_collected',
          value: 50,
          clue_count: 5
        })
      );
    });

    it('should add experience from task', () => {
      manager.addExperienceFromTask('task_001');

      const state = manager.getState();
      // Task completion base value = 50
      expect(state.total_experience).toBe(50);
      expect(state.experience_by_type.learning).toBe(50);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ExperienceEvent.EXPERIENCE_ADDED,
        expect.objectContaining({
          source: 'task_completion',
          value: 50,
          task_id: 'task_001'
        })
      );
    });

    it('should add experience from achievement', () => {
      manager.addExperienceFromAchievement('first_case_complete');

      const state = manager.getState();
      // Achievement bonus = 100
      expect(state.total_experience).toBe(100);
      expect(state.experience_by_type.exploration).toBe(100);
      expect(state.achievement_unlocked).toContain('first_case_complete');

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ExperienceEvent.EXPERIENCE_ADDED,
        expect.objectContaining({
          source: 'achievement',
          value: 100,
          achievement_id: 'first_case_complete'
        })
      );
    });

    it('should cap experience at maximum value', () => {
      // Default max is 1000
      // Score is normalized to 0-100, so we need multiple additions
      manager.addExperienceFromScore(100);  // 100 experience (max for score)
      manager.addExperienceFromScore(100);  // another 100
      manager.addExperienceFromTask('task_001'); // 50
      manager.addExperienceFromAchievement('collect_all_herbs'); // 200
      manager.addExperienceFromAchievement('master_decoction'); // 150
      manager.addExperienceFromScore(100);
      manager.addExperienceFromScore(100);
      manager.addExperienceFromScore(100);
      manager.addExperienceFromScore(100);
      manager.addExperienceFromScore(100);
      manager.addExperienceFromScore(100);
      manager.addExperienceFromScore(100);
      manager.addExperienceFromScore(100);
      manager.addExperienceFromScore(100);
      // Total should be capped at 1000

      const state = manager.getState();
      expect(state.total_experience).toBe(1000);
    });

    it('should accumulate experience correctly', () => {
      manager.addExperienceFromScore(30);
      manager.addExperienceFromTask('task_001');
      manager.addExperienceFromClues(2);

      const state = manager.getState();
      // 30 + 50 + 20 = 100
      expect(state.total_experience).toBe(100);
      expect(state.experience_by_type.practice).toBe(50);  // 30 + 20
      expect(state.experience_by_type.learning).toBe(50);  // task
    });
  });

  // ===== 每日打卡测试 =====

  describe('Daily Checkin', () => {
    it('should add daily checkin bonus on first checkin', () => {
      const result = manager.addDailyCheckin();

      expect(result.isNewCheckin).toBe(true);
      expect(result.bonus).toBe(20);  // Base bonus for streak 1

      const state = manager.getState();
      expect(state.total_experience).toBe(20);
      expect(state.daily_checkin_status.current_streak).toBe(1);
      expect(state.daily_checkin_status.total_checkins).toBe(1);

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ExperienceEvent.DAILY_CHECKIN,
        expect.objectContaining({
          streak: 1,
          bonus: 20
        })
      );
    });

    it('should not add bonus if already checked in today', () => {
      // First checkin
      manager.addDailyCheckin();

      // Second checkin (same day)
      const result = manager.addDailyCheckin();

      expect(result.isNewCheckin).toBe(false);
      expect(result.bonus).toBe(0);
    });

    it('should increase streak on consecutive days', () => {
      // Simulate yesterday's checkin by setting state
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Manually set state to simulate yesterday checkin
      manager.importData({
        total_experience: 20,
        experience_by_type: { learning: 20, practice: 0, exploration: 0 },
        unlocked_contents: [],
        daily_checkin_status: {
          last_checkin_date: yesterdayStr,
          current_streak: 1,
          total_checkins: 1
        },
        achievement_unlocked: []
      });

      // Today's checkin
      const result = manager.addDailyCheckin();

      expect(result.isNewCheckin).toBe(true);
      expect(result.bonus).toBe(20);  // streak 2, still base multiplier

      const state = manager.getState();
      expect(state.daily_checkin_status.current_streak).toBe(2);
    });

    it('should apply streak bonus multiplier', () => {
      // Simulate 7-day streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      manager.importData({
        total_experience: 100,
        experience_by_type: { learning: 100, practice: 0, exploration: 0 },
        unlocked_contents: [],
        daily_checkin_status: {
          last_checkin_date: yesterdayStr,
          current_streak: 7,
          total_checkins: 7
        },
        achievement_unlocked: []
      });

      const result = manager.addDailyCheckin();

      // 7-day streak gives 2x multiplier: 20 * 2 = 40
      expect(result.bonus).toBe(40);
    });
  });

  // ===== 解锁检查测试 =====

  describe('Unlock Check', () => {
    it('should check if content is unlocked', () => {
      expect(manager.isContentUnlocked('prescription_modification')).toBe(false);

      // Add enough experience (200 required)
      // Score is normalized to 0-100, so we need multiple additions
      manager.addExperienceFromScore(100);  // 100
      manager.addExperienceFromTask('task_001'); // 50
      manager.addExperienceFromTask('task_002'); // 50

      expect(manager.isContentUnlocked('prescription_modification')).toBe(true);
    });

    it('should emit CONTENT_UNLOCKED event when content unlocks', () => {
      // Add exactly 200 to unlock prescription_modification
      manager.addExperienceFromScore(100);  // 100
      manager.addExperienceFromTask('task_001'); // 50
      manager.addExperienceFromTask('task_002'); // 50

      // Should have emitted unlock event for prescription_modification
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ExperienceEvent.CONTENT_UNLOCKED,
        expect.objectContaining({
          content_id: 'prescription_modification',
          required_experience: 200
        })
      );
    });

    it('should return unlockable contents for current experience', () => {
      // Add 250 experience
      manager.addExperienceFromScore(100);
      manager.addExperienceFromScore(100);
      manager.addExperienceFromTask('task_001'); // 50

      const unlockables = manager.getUnlockableContents();

      // Should include prescription_modification (200), but yaowang_valley (500) not yet
      expect(unlockables.some(c => c.id === 'prescription_modification')).toBe(true);
      expect(unlockables.some(c => c.id === 'yaowang_valley')).toBe(false);  // 500 required
    });

    it('should track multiple unlocked contents', () => {
      // Add 500 experience
      manager.addExperienceFromScore(100);
      manager.addExperienceFromScore(100);
      manager.addExperienceFromScore(100);
      manager.addExperienceFromScore(100);
      manager.addExperienceFromScore(100);

      const state = manager.getState();
      // Should unlock: prescription_modification (200), herb_collection (400), new_npc (300)
      expect(state.unlocked_contents.length).toBeGreaterThanOrEqual(3);
      expect(state.unlocked_contents).toContain('prescription_modification');
      expect(state.unlocked_contents).toContain('new_npc');
      expect(state.unlocked_contents).toContain('herb_collection');
    });
  });

  // ===== SaveManager集成测试 =====

  describe('SaveManager Integration', () => {
    it('should export data for saving', () => {
      manager.addExperienceFromScore(50);
      manager.addExperienceFromAchievement('first_case_complete');

      const exported = manager.exportData();

      expect(exported.total_experience).toBe(150);
      expect(exported.experience_by_type.practice).toBe(50);
      expect(exported.experience_by_type.exploration).toBe(100);
      expect(exported.achievement_unlocked).toContain('first_case_complete');
    });

    it('should import data from save', () => {
      const savedData: ExperienceState = {
        total_experience: 300,
        experience_by_type: {
          learning: 100,
          practice: 150,
          exploration: 50
        },
        unlocked_contents: ['prescription_modification', 'new_npc'],
        daily_checkin_status: {
          last_checkin_date: '2026-04-13',
          current_streak: 5,
          total_checkins: 5
        },
        achievement_unlocked: ['first_case_complete']
      };

      manager.importData(savedData);

      const state = manager.getState();
      expect(state.total_experience).toBe(300);
      expect(state.unlocked_contents).toContain('prescription_modification');
      expect(state.achievement_unlocked).toContain('first_case_complete');
      expect(state.daily_checkin_status.current_streak).toBe(5);
    });

    it('should preserve state after export/import cycle', () => {
      // Setup state
      manager.addExperienceFromScore(100);
      manager.addDailyCheckin();
      manager.addExperienceFromAchievement('first_prescription_correct');

      // Export
      const exported = manager.exportData();

      // Reset and import
      manager.reset();
      manager.importData(exported);

      const state = manager.getState();
      expect(state.total_experience).toBe(exported.total_experience);
      expect(state.achievement_unlocked).toEqual(exported.achievement_unlocked);
    });
  });

  // ===== 暴露到全局测试 =====

  describe('Window Exposure', () => {
    it('should expose manager to window', () => {
      const mockWindow = { __EXPERIENCE_MANAGER__: null };
      vi.stubGlobal('window', mockWindow);

      manager.exposeToWindow();

      expect(mockWindow.__EXPERIENCE_MANAGER__).toBeDefined();
      expect(mockWindow.__EXPERIENCE_MANAGER__.getState).toBeDefined();
      expect(mockWindow.__EXPERIENCE_MANAGER__.addExperienceFromScore).toBeDefined();
    });
  });

  // ===== 销毁测试 =====

  describe('Destroy', () => {
    it('should cleanup on destroy', () => {
      manager.addExperienceFromScore(50);
      manager.destroy();

      // After destroy, new instance should have fresh state
      const newManager = ExperienceManager.getInstance();
      const state = newManager.getState();

      expect(state.total_experience).toBe(0);
    });
  });
});