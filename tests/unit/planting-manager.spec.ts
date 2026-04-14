// tests/unit/planting-manager.spec.ts
/**
 * PlantingManager 单元测试
 *
 * Phase 2 S11.2 实现
 *
 * 测试覆盖:
 * - Smoke: getInstance, initialize, reset (3个)
 * - 状态管理: phase切换, plot状态更新 (5个)
 * - 验证逻辑: 无效种子、地块占用、水源匹配 (7个)
 * - 流程控制: 种植→生长→收获→考教 (5个)
 * - 事件发布: 每个操作发布对应事件 (5个)
 * - 存档: 导出导入状态一致性 (2个)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlantingManager, PlantingEvent, type PlantingScoreResult } from '../../src/systems/PlantingManager';
import { EventBus } from '../../src/systems/EventBus';
import { InventoryManager } from '../../src/systems/InventoryManager';
import {
  getSeedData,
  getPlotData,
  getWaterData,
  getFertilizerData,
  calculatePlantingMatch,
  getQuizForHerb,
  initializePlantingState,
  type PlantingState
} from '../../src/data/planting-data';

// Mock EventBus
vi.mock('../../src/systems/EventBus', () => {
  const mockEmit = vi.fn();
  const mockOn = vi.fn();
  const mockOff = vi.fn();
  return {
    EventBus: {
      getInstance: () => ({
        emit: mockEmit,
        on: mockOn,
        off: mockOff
      })
    }
  };
});

// Mock InventoryManager
vi.mock('../../src/systems/InventoryManager', () => {
  let seeds: Record<string, number> = {};
  let herbs: Record<string, number> = {};

  const mockGetInstance = vi.fn(() => ({
    getSeedQuantity: (seedId: string) => seeds[seedId] ?? 0,
    addSeed: (seedId: string, quantity: number) => {
      seeds[seedId] = (seeds[seedId] ?? 0) + quantity;
    },
    removeSeed: vi.fn((seedId: string, quantity: number) => {
      if (seeds[seedId] < quantity) return false;
      seeds[seedId] -= quantity;
      return true;
    }),
    getAllSeeds: vi.fn(() =>
      Object.entries(seeds).map(([id, quantity]) => ({
        seed: { id, name: id },
        quantity
      }))
    ),
    addHerb: vi.fn((herbId: string, quantity: number) => {
      herbs[herbId] = (herbs[herbId] ?? 0) + quantity;
    }),
    getHerbQuantity: (herbId: string) => herbs[herbId] ?? 0,
    exposeToWindow: vi.fn()
  }));

  // Helper to set mock data
  (mockGetInstance as any).__setMockData = (data: { seeds?: Record<string, number>; herbs?: Record<string, number> }) => {
    seeds = data.seeds ?? {};
    herbs = data.herbs ?? {};
  };

  return {
    InventoryManager: {
      getInstance: mockGetInstance
    }
  };
});

describe('PlantingManager', () => {
  let manager: PlantingManager;
  let eventBus: EventBus;
  let inventoryManager: InventoryManager;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Reset instances
    PlantingManager.resetInstance();

    // Initialize with mock data
    (InventoryManager.getInstance as any).__setMockData({
      seeds: {
        'seed_mahuang': 5,
        'seed_guizhi': 3,
        'seed_jinyinhua': 2
      },
      herbs: {}
    });

    manager = PlantingManager.getInstance();
    eventBus = EventBus.getInstance();
    inventoryManager = InventoryManager.getInstance();
  });

  afterEach(() => {
    PlantingManager.resetInstance();
  });

  // ===== Smoke Tests (3个) =====

  describe('Smoke Tests', () => {
    it('should get singleton instance', () => {
      const instance1 = PlantingManager.getInstance();
      const instance2 = PlantingManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with correct default state', () => {
      const state = manager.getState();
      expect(state.phase).toBe('select_seed');
      expect(state.selected_seed).toBeNull();
      expect(state.current_plot).toBeNull();
      expect(state.plots.length).toBe(4); // 4 plots defined in planting-data.ts
    });

    it('should reset state correctly', () => {
      // Set some state
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');

      // Reset
      manager.reset();

      const state = manager.getState();
      expect(state.phase).toBe('select_seed');
      expect(state.selected_seed).toBeNull();
      expect(state.current_plot).toBeNull();
    });
  });

  // ===== 状态管理 Tests (5个) =====

  describe('State Management', () => {
    it('should change phase after selecting seed', () => {
      const result = manager.selectSeed('seed_mahuang');
      expect(result).toBe(true);
      expect(manager.getPhase()).toBe('select_plot');
    });

    it('should change phase after selecting plot', () => {
      manager.selectSeed('seed_mahuang');
      const result = manager.selectPlot('plot_lung_1');
      expect(result).toBe(true);
      expect(manager.getPhase()).toBe('select_water');
    });

    it('should change phase after selecting water', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      const result = manager.selectWater('water_warm');
      expect(result).toBe(true);
      expect(manager.getPhase()).toBe('select_fertilizer');
    });

    it('should change phase after selecting fertilizer', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      manager.selectWater('water_warm');
      const result = manager.selectFertilizer('fertilizer_pungent');
      expect(result).toBe(true);
      expect(manager.getPhase()).toBe('planting');
    });

    it('should update plot state after planting', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      manager.selectWater('water_warm');
      manager.selectFertilizer('fertilizer_pungent');
      manager.plant();

      const plotState = manager.getPlotState('plot_lung_1');
      expect(plotState?.seed_id).toBe('seed_mahuang');
      expect(plotState?.herb_id).toBe('mahuang');
      expect(plotState?.water_id).toBe('water_warm');
      expect(plotState?.fertilizer_id).toBe('fertilizer_pungent');
      expect(plotState?.growth_progress).toBe(0);
      expect(plotState?.current_stage).toBe('seed');
    });
  });

  // ===== 验证逻辑 Tests (7个) =====

  describe('Validation Logic', () => {
    it('should reject invalid seed', () => {
      const result = manager.selectSeed('invalid_seed');
      expect(result).toBe(false);
      expect(manager.getPhase()).toBe('select_seed');
    });

    it('should reject seed not in inventory', () => {
      (InventoryManager.getInstance as any).__setMockData({
        seeds: { 'seed_mahuang': 0 } // No seeds available
      });

      const result = manager.selectSeed('seed_mahuang');
      expect(result).toBe(false);
    });

    it('should reject invalid plot', () => {
      manager.selectSeed('seed_mahuang');
      const result = manager.selectPlot('invalid_plot');
      expect(result).toBe(false);
      expect(manager.getPhase()).toBe('select_plot');
    });

    it('should reject occupied plot', () => {
      // First, plant on plot_lung_1
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      manager.selectWater('water_warm');
      manager.selectFertilizer('fertilizer_pungent');
      manager.plant();

      // Export state with occupied plot
      const occupiedState = manager.exportState();

      // Reset manager
      PlantingManager.resetInstance();
      (InventoryManager.getInstance as any).__setMockData({
        seeds: {
          'seed_mahuang': 5,
          'seed_guizhi': 3
        }
      });
      manager = PlantingManager.getInstance();

      // Import state with occupied plot
      manager.importState(occupiedState);

      // Verify plot is occupied
      const plotState = manager.getPlotState('plot_lung_1');
      expect(plotState?.seed_id).toBe('seed_mahuang');

      // Try to select the same plot - should fail
      manager.selectSeed('seed_guizhi');
      const result = manager.selectPlot('plot_lung_1');
      expect(result).toBe(false);
    });

    it('should reject invalid water', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      const result = manager.selectWater('invalid_water');
      expect(result).toBe(false);
    });

    it('should reject invalid fertilizer', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      manager.selectWater('water_warm');
      const result = manager.selectFertilizer('invalid_fertilizer');
      expect(result).toBe(false);
    });

    it('should reject planting with missing parameters', () => {
      // Setup partial planting - not selecting fertilizer
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      manager.selectWater('water_warm');
      // Note: fertilizer NOT selected, so phase should still be 'select_fertilizer'

      // Try to plant in wrong phase - should fail
      const result = manager.plant();
      expect(result).toBe(false);
    });
  });

  // ===== 流程控制 Tests (5个) =====

  describe('Process Control', () => {
    it('should complete full planting process', () => {
      // Select seed
      manager.selectSeed('seed_mahuang');
      expect(manager.getPhase()).toBe('select_plot');

      // Select plot
      manager.selectPlot('plot_lung_1');
      expect(manager.getPhase()).toBe('select_water');

      // Select water
      manager.selectWater('water_warm');
      expect(manager.getPhase()).toBe('select_fertilizer');

      // Select fertilizer
      manager.selectFertilizer('fertilizer_pungent');
      expect(manager.getPhase()).toBe('planting');

      // Plant
      const result = manager.plant();
      expect(result).toBe(true);
      expect(manager.getPhase()).toBe('waiting');
    });

    it('should update growth progress', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      manager.selectWater('water_warm');
      manager.selectFertilizer('fertilizer_pungent');
      manager.plant();

      // Use export/import to simulate time passing
      const currentState = manager.exportState();
      // Simulate 60 seconds passed (seed_mahuang growth_time is 120 seconds)
      currentState.plots[0].plant_time = Date.now() - 60000;
      manager.importState(currentState);

      manager.updateGrowth();

      const updatedPlot = manager.getPlotState('plot_lung_1');
      // 60/120 = 50% progress
      expect(updatedPlot?.growth_progress).toBeGreaterThan(0);
      expect(updatedPlot?.growth_progress).toBeLessThan(100);
    });

    it('should mark plot as ready when growth complete', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      manager.selectWater('water_warm');
      manager.selectFertilizer('fertilizer_pungent');
      manager.plant();

      // Get current state and modify it to have ready plot
      const currentState = manager.exportState();
      currentState.plots[0].growth_progress = 100;
      currentState.plots[0].current_stage = 'harvest';
      currentState.plots[0].is_ready = true;

      manager.importState(currentState);

      // Check if harvest can be triggered
      const result = manager.harvest('plot_lung_1');
      expect(result).toBe(true);
    });

    it('should reject harvest if not ready', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      manager.selectWater('water_warm');
      manager.selectFertilizer('fertilizer_pungent');
      manager.plant();

      // Try to harvest immediately (not ready)
      const result = manager.harvest('plot_lung_1');
      expect(result).toBe(false);
    });

    it('should complete quiz and harvest', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      manager.selectWater('water_warm');
      manager.selectFertilizer('fertilizer_pungent');
      manager.plant();

      // Get current state and modify it to have ready plot
      const currentState = manager.exportState();
      currentState.plots[0].growth_progress = 100;
      currentState.plots[0].current_stage = 'harvest';
      currentState.plots[0].is_ready = true;

      manager.importState(currentState);

      // Harvest
      manager.harvest('plot_lung_1');
      expect(manager.getPhase()).toBe('quiz');

      // Submit correct answer
      const quiz = getQuizForHerb('mahuang');
      const result = manager.submitQuiz(quiz?.correct_answer || '辛温');
      expect(result).toBe(true);

      // Should return to select_seed phase
      expect(manager.getPhase()).toBe('select_seed');

      // Check score
      const score = manager.getScore();
      expect(score?.quiz_passed).toBe(true);
    });
  });

  // ===== 事件发布 Tests (5个) =====

  describe('Event Publishing', () => {
    it('should emit SEED_SELECTED event', () => {
      manager.selectSeed('seed_mahuang');
      expect(eventBus.emit).toHaveBeenCalledWith(
        PlantingEvent.SEED_SELECTED,
        expect.objectContaining({
          seed_id: 'seed_mahuang'
        })
      );
    });

    it('should emit PLOT_SELECTED event', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      expect(eventBus.emit).toHaveBeenCalledWith(
        PlantingEvent.PLOT_SELECTED,
        expect.objectContaining({
          plot_id: 'plot_lung_1'
        })
      );
    });

    it('should emit WATER_SELECTED event', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      manager.selectWater('water_warm');
      expect(eventBus.emit).toHaveBeenCalledWith(
        PlantingEvent.WATER_SELECTED,
        expect.objectContaining({
          water_id: 'water_warm'
        })
      );
    });

    it('should emit FERTILIZER_SELECTED event', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      manager.selectWater('water_warm');
      manager.selectFertilizer('fertilizer_pungent');
      expect(eventBus.emit).toHaveBeenCalledWith(
        PlantingEvent.FERTILIZER_SELECTED,
        expect.objectContaining({
          fertilizer_id: 'fertilizer_pungent'
        })
      );
    });

    it('should emit PHASE_CHANGED event on phase transitions', () => {
      manager.selectSeed('seed_mahuang');
      expect(eventBus.emit).toHaveBeenCalledWith(
        PlantingEvent.PHASE_CHANGED,
        expect.objectContaining({
          old_phase: 'select_seed',
          new_phase: 'select_plot'
        })
      );
    });
  });

  // ===== 存档 Tests (2个) =====

  describe('Save/Load', () => {
    it('should export state correctly', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      manager.selectWater('water_warm');
      manager.selectFertilizer('fertilizer_pungent');
      manager.plant();

      const exportedState = manager.exportState();

      expect(exportedState.phase).toBe('waiting');
      expect(exportedState.plots.length).toBe(4);
      expect(exportedState.plots[0].seed_id).toBe('seed_mahuang');
    });

    it('should import state correctly', () => {
      // Create a state to import
      const stateToImport: PlantingState = {
        phase: 'waiting',
        current_plot: null,
        plots: [
          {
            plot_id: 'plot_lung_1',
            seed_id: 'seed_guizhi',
            herb_id: 'guizhi',
            water_id: 'water_warm',
            fertilizer_id: 'fertilizer_pungent',
            growth_progress: 50,
            current_stage: 'growing',
            plant_time: Date.now() - 90000,
            is_ready: false
          },
          {
            plot_id: 'plot_lung_2',
            seed_id: null,
            herb_id: null,
            water_id: null,
            fertilizer_id: null,
            growth_progress: 0,
            current_stage: 'seed',
            plant_time: null,
            is_ready: false
          },
          {
            plot_id: 'plot_heart_1',
            seed_id: null,
            herb_id: null,
            water_id: null,
            fertilizer_id: null,
            growth_progress: 0,
            current_stage: 'seed',
            plant_time: null,
            is_ready: false
          },
          {
            plot_id: 'plot_general_1',
            seed_id: null,
            herb_id: null,
            water_id: null,
            fertilizer_id: null,
            growth_progress: 0,
            current_stage: 'seed',
            plant_time: null,
            is_ready: false
          }
        ],
        selected_seed: null,
        selected_water: null,
        selected_fertilizer: null,
        quiz_question: null,
        quiz_passed: false
      };

      manager.importState(stateToImport);

      const importedState = manager.getState();
      expect(importedState.phase).toBe('waiting');
      expect(importedState.plots[0].seed_id).toBe('seed_guizhi');
      expect(importedState.plots[0].growth_progress).toBe(50);
    });
  });

  // ===== 辅助方法 Tests (3个) =====

  describe('Helper Methods', () => {
    it('should get available plots (empty ones)', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1');
      manager.selectWater('water_warm');
      manager.selectFertilizer('fertilizer_pungent');
      manager.plant();

      PlantingManager.resetInstance();
      manager = PlantingManager.getInstance();

      // Import state with occupied plot
      manager.importState({
        phase: 'select_seed',
        current_plot: null,
        plots: [
          {
            plot_id: 'plot_lung_1',
            seed_id: 'seed_mahuang',
            herb_id: 'mahuang',
            water_id: 'water_warm',
            fertilizer_id: 'fertilizer_pungent',
            growth_progress: 50,
            current_stage: 'growing',
            plant_time: Date.now(),
            is_ready: false
          },
          {
            plot_id: 'plot_lung_2',
            seed_id: null,
            herb_id: null,
            water_id: null,
            fertilizer_id: null,
            growth_progress: 0,
            current_stage: 'seed',
            plant_time: null,
            is_ready: false
          },
          {
            plot_id: 'plot_heart_1',
            seed_id: null,
            herb_id: null,
            water_id: null,
            fertilizer_id: null,
            growth_progress: 0,
            current_stage: 'seed',
            plant_time: null,
            is_ready: false
          },
          {
            plot_id: 'plot_general_1',
            seed_id: null,
            herb_id: null,
            water_id: null,
            fertilizer_id: null,
            growth_progress: 0,
            current_stage: 'seed',
            plant_time: null,
            is_ready: false
          }
        ],
        selected_seed: null,
        selected_water: null,
        selected_fertilizer: null,
        quiz_question: null,
        quiz_passed: false
      });

      const availablePlots = manager.getAvailablePlots();
      expect(availablePlots).toContain('plot_lung_2');
      expect(availablePlots).toContain('plot_heart_1');
      expect(availablePlots).toContain('plot_general_1');
      expect(availablePlots).not.toContain('plot_lung_1');
    });

    it('should get all seeds data', () => {
      const seeds = manager.getAllSeeds();
      expect(seeds.length).toBeGreaterThan(0);
      expect(seeds.find(s => s.id === 'seed_mahuang')).toBeDefined();
    });

    it('should get all plots data', () => {
      const plots = manager.getAllPlots();
      expect(plots.length).toBe(4);
      expect(plots.find(p => p.id === 'plot_lung_1')).toBeDefined();
    });
  });

  // ===== 评分计算 Tests (3个) =====

  describe('Score Calculation', () => {
    it('should calculate score with perfect match', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_lung_1'); // Match meridian
      manager.selectWater('water_warm');  // Match qi_type
      manager.selectFertilizer('fertilizer_pungent'); // Match flavor

      manager.plant();

      // Use export/import to set plot as ready
      const currentState = manager.exportState();
      currentState.plots[0].is_ready = true;
      currentState.plots[0].growth_progress = 100;
      manager.importState(currentState);

      manager.harvest('plot_lung_1');

      // Submit correct answer
      const quiz = getQuizForHerb('mahuang');
      manager.submitQuiz(quiz?.correct_answer || '辛温');

      const score = manager.getScore();
      expect(score?.total_score).toBe(120); // 30+35+35+20
      expect(score?.plot_match).toBe(true);
      expect(score?.water_match).toBe(true);
      expect(score?.fertilizer_match).toBe(true);
      expect(score?.quiz_passed).toBe(true);
      expect(score?.passed).toBe(true);
    });

    it('should calculate score with partial match', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_heart_1'); // Wrong meridian
      manager.selectWater('water_cool');   // Wrong qi_type
      manager.selectFertilizer('fertilizer_sweet'); // Wrong flavor

      manager.plant();

      // Use export/import to set plot as ready
      const currentState = manager.exportState();
      // Find plot_heart_1 index (should be index 2)
      const heartPlotIndex = currentState.plots.findIndex(p => p.plot_id === 'plot_heart_1');
      currentState.plots[heartPlotIndex].is_ready = true;
      currentState.plots[heartPlotIndex].growth_progress = 100;
      manager.importState(currentState);

      manager.harvest('plot_heart_1');

      // Submit wrong answer
      manager.submitQuiz('甘温');

      const score = manager.getScore();
      expect(score?.total_score).toBe(0);
      expect(score?.plot_match).toBe(false);
      expect(score?.water_match).toBe(false);
      expect(score?.fertilizer_match).toBe(false);
      expect(score?.quiz_passed).toBe(false);
      expect(score?.passed).toBe(false);
    });

    it('should pass with threshold score', () => {
      manager.selectSeed('seed_mahuang');
      manager.selectPlot('plot_general_1'); // General plot (match)
      manager.selectWater('water_warm');     // Match
      manager.selectFertilizer('fertilizer_sweet'); // Wrong

      manager.plant();

      // Use export/import to set plot as ready
      const currentState = manager.exportState();
      // Find plot_general_1 index (should be index 3)
      const generalPlotIndex = currentState.plots.findIndex(p => p.plot_id === 'plot_general_1');
      currentState.plots[generalPlotIndex].is_ready = true;
      currentState.plots[generalPlotIndex].growth_progress = 100;
      manager.importState(currentState);

      manager.harvest('plot_general_1');

      // Submit correct answer
      const quiz = getQuizForHerb('mahuang');
      manager.submitQuiz(quiz?.correct_answer || '辛温');

      const score = manager.getScore();
      // 30 (plot) + 35 (water) + 0 (fertilizer) + 20 (quiz) = 85
      expect(score?.total_score).toBe(85);
      expect(score?.passed).toBe(true);
    });
  });

  // ===== 暴露接口 Tests (1个) =====

  describe('Expose to Window', () => {
    it('should expose methods to window object', () => {
      manager.exposeToWindow();
      expect((window as any).__PLANTING_MANAGER__).toBeDefined();
      expect((window as any).__PLANTING_MANAGER__.getState).toBeDefined();
      expect((window as any).__PLANTING_MANAGER__.selectSeed).toBeDefined();
    });
  });
});