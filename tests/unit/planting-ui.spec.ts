// tests/unit/planting-ui.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Phaser and PlantingManager
vi.mock('phaser', () => ({
  default: {
    Scene: class MockScene {
      add = {
        container: vi.fn(() => ({
          add: vi.fn(),
          destroy: vi.fn(),
          setDepth: vi.fn()
        })),
        rectangle: vi.fn(() => ({
          setInteractive: vi.fn(() => ({
            on: vi.fn()
          })),
          setOrigin: vi.fn(),
          setFillStyle: vi.fn()
        })),
        text: vi.fn(() => ({
          setOrigin: vi.fn(),
          setText: vi.fn()
        }))
      };
      time = {
        delayedCall: vi.fn((delay, callback) => callback())
      };
      scene = {
        stop: vi.fn()
      };
    }
  }
}));

vi.mock('../../src/systems/PlantingManager', () => ({
  PlantingManager: {
    getInstance: vi.fn(() => ({
      getState: vi.fn(() => ({
        phase: 'select_seed',
        plots: [],
        selected_seed: null,
        selected_water: null,
        selected_fertilizer: null,
        current_plot: null
      })),
      getPhase: vi.fn(() => 'select_seed'),
      getPlotStates: vi.fn(() => []),
      getAvailableSeeds: vi.fn(() => [
        { id: 'seed_mahuang', herb_id: 'mahuang', name: '麻黄种子', growth_time: 120, required_water: 'warm', required_fertilizer: 'pungent', meridian: 'lung', difficulty: 2 }
      ]),
      getAvailablePlots: vi.fn(() => [
        { id: 'plot_lung_1', meridian: 'lung', name: '肺经地块A', description: '适合种植入肺经药材' }
      ]),
      getAvailableWaters: vi.fn(() => [
        { id: 'water_warm', qi_type: 'warm', name: '温水', description: '温和的温水' }
      ]),
      getAvailableFertilizers: vi.fn(() => [
        { id: 'fertilizer_pungent', flavor_type: 'pungent', name: '辛味肥', description: '增强药材发散功效' }
      ]),
      selectSeed: vi.fn(() => true),
      selectPlot: vi.fn(() => true),
      selectWater: vi.fn(() => true),
      selectFertilizer: vi.fn(() => true),
      plant: vi.fn(() => true),
      harvest: vi.fn(() => true),
      submitQuizAnswer: vi.fn(() => true),
      cancelSelection: vi.fn(),
      reset: vi.fn()
    })),
    resetInstance: vi.fn()
  },
  PlantingEvent: {
    PHASE_CHANGED: 'planting:phase_changed',
    SEED_SELECTED: 'planting:seed_selected',
    PLOT_SELECTED: 'planting:plot_selected',
    WATER_SELECTED: 'planting:water_selected',
    FERTILIZER_SELECTED: 'planting:fertilizer_selected',
    GROWTH_UPDATED: 'planting:growth_updated',
    QUIZ_STARTED: 'planting:quiz_started',
    HARVEST_COMPLETE: 'planting:harvest_complete'
  }
}));

vi.mock('../../src/systems/EventBus', () => ({
  EventBus: {
    getInstance: vi.fn(() => ({
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn()
    }))
  }
}));

vi.mock('../../src/data/planting-data', () => ({
  getSeedData: vi.fn((id) => {
    if (id === 'seed_mahuang') {
      return { id: 'seed_mahuang', herb_id: 'mahuang', name: '麻黄种子', growth_time: 120, required_water: 'warm', required_fertilizer: 'pungent', meridian: 'lung', difficulty: 2 };
    }
    return undefined;
  }),
  getPlotData: vi.fn((id) => {
    if (id === 'plot_lung_1') {
      return { id: 'plot_lung_1', meridian: 'lung', name: '肺经地块A', description: '适合种植入肺经药材', position: { x: 1, y: 1 } };
    }
    return undefined;
  }),
  getWaterData: vi.fn((id) => {
    if (id === 'water_warm') {
      return { id: 'water_warm', qi_type: 'warm', name: '温水', description: '温和的温水', effect: '适合温性药材' };
    }
    return undefined;
  }),
  getFertilizerData: vi.fn((id) => {
    if (id === 'fertilizer_pungent') {
      return { id: 'fertilizer_pungent', flavor_type: 'pungent', name: '辛味肥', description: '增强药材发散功效', effect: '适合解表类药材' };
    }
    return undefined;
  }),
  getGrowthStageConfig: vi.fn(() => ({ stage: 'seed', name: '种子期', progress_range: [0, 10], visual_state: '种子刚播种' })),
  getQuizForHerb: vi.fn(() => ({
    herb_id: 'mahuang',
    question: '麻黄的性味是什么？',
    options: ['辛温', '辛凉', '甘温', '苦寒'],
    correct_answer: '辛温',
    explanation: '麻黄味辛性温'
  }))
}));

describe('PlantingUI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Initialization', () => {
    it('should create PlantingUI instance', async () => {
      const { PlantingUI } = await import('../../src/ui/PlantingUI');
      const mockScene = new (await import('phaser')).default.Scene();

      const ui = new PlantingUI({
        scene: mockScene,
        width: 800,
        height: 600
      });

      expect(ui).toBeDefined();
      expect(ui.destroy).toBeDefined();
    });

    it('should create container and text elements', async () => {
      const { PlantingUI } = await import('../../src/ui/PlantingUI');
      const mockScene = new (await import('phaser')).default.Scene();

      new PlantingUI({
        scene: mockScene,
        width: 800,
        height: 600
      });

      // Should create container for UI elements
      expect(mockScene.add.container).toHaveBeenCalled();
    });
  });

  describe('Phase UI Updates', () => {
    it('should show seed selection on init', async () => {
      const { PlantingUI } = await import('../../src/ui/PlantingUI');
      const mockScene = new (await import('phaser')).default.Scene();

      new PlantingUI({
        scene: mockScene,
        width: 800,
        height: 600
      });

      // Should call text creation for title and phase indicator
      expect(mockScene.add.text).toHaveBeenCalled();
    });
  });

  describe('Destroy', () => {
    it('should have destroy method', async () => {
      const { PlantingUI } = await import('../../src/ui/PlantingUI');
      const mockScene = new (await import('phaser')).default.Scene();

      const ui = new PlantingUI({
        scene: mockScene,
        width: 800,
        height: 600
      });

      // Destroy should work without error
      expect(() => ui.destroy()).not.toThrow();
    });
  });
});