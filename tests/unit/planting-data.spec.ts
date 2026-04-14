// tests/unit/planting-data.spec.ts
import { describe, it, expect } from 'vitest';
import {
  SEEDS_DATA,
  PLOTS_DATA,
  WATERS_DATA,
  FERTILIZERS_DATA,
  GROWTH_STAGES,
  getSeedData,
  getPlotData,
  getWaterData,
  getFertilizerData,
  getGrowthStage,
  getGrowthStageConfig,
  getQuizForHerb,
  calculatePlantingMatch,
  initializePlotStates,
  initializePlantingState
} from '../../src/data/planting-data';

describe('Planting Data', () => {
  describe('种子数据', () => {
    it('应包含一期种子', () => {
      expect(SEEDS_DATA.length).toBeGreaterThanOrEqual(4);
      expect(SEEDS_DATA.map(s => s.herb_id)).toContain('mahuang');
    });

    it('每个种子应有完整配置', () => {
      SEEDS_DATA.forEach(seed => {
        expect(seed.id).toBeDefined();
        expect(seed.herb_id).toBeDefined();
        expect(seed.growth_time).toBeGreaterThan(0);
        expect(seed.required_water).toBeDefined();
        expect(seed.required_fertilizer).toBeDefined();
      });
    });

    it('getSeedData应返回正确数据', () => {
      const seed = getSeedData('seed_mahuang');
      expect(seed).toBeDefined();
      expect(seed?.name).toBe('麻黄种子');
    });

    it('getSeedData应返回undefined对于无效ID', () => {
      const seed = getSeedData('invalid_seed');
      expect(seed).toBeUndefined();
    });
  });

  describe('地块数据', () => {
    it('应包含不同归经地块', () => {
      expect(PLOTS_DATA.length).toBeGreaterThan(0);
      expect(PLOTS_DATA.map(p => p.meridian)).toContain('lung');
      expect(PLOTS_DATA.map(p => p.meridian)).toContain('heart');
      expect(PLOTS_DATA.map(p => p.meridian)).toContain('general');
    });

    it('getPlotData应返回正确数据', () => {
      const plot = getPlotData('plot_lung_1');
      expect(plot).toBeDefined();
      expect(plot?.meridian).toBe('lung');
    });
  });

  describe('水源数据', () => {
    it('应覆盖四气类型', () => {
      const qiTypes = WATERS_DATA.map(w => w.qi_type);
      expect(qiTypes).toContain('hot');
      expect(qiTypes).toContain('warm');
      expect(qiTypes).toContain('neutral');
      expect(qiTypes).toContain('cool');
      expect(qiTypes).toContain('cold');
    });

    it('getWaterData应返回正确数据', () => {
      const water = getWaterData('water_warm');
      expect(water).toBeDefined();
      expect(water?.name).toBe('温水');
    });
  });

  describe('肥料数据', () => {
    it('应覆盖五味类型', () => {
      const flavors = FERTILIZERS_DATA.map(f => f.flavor_type);
      expect(flavors).toContain('pungent');
      expect(flavors).toContain('sweet');
      expect(flavors).toContain('bitter');
      expect(flavors).toContain('sour');
      expect(flavors).toContain('salty');
    });

    it('getFertilizerData应返回正确数据', () => {
      const fertilizer = getFertilizerData('fertilizer_pungent');
      expect(fertilizer).toBeDefined();
      expect(fertilizer?.name).toBe('辛味肥');
    });
  });

  describe('生长阶段', () => {
    it('应有完整的5个阶段', () => {
      expect(GROWTH_STAGES.length).toBe(5);
      expect(GROWTH_STAGES.map(s => s.stage)).toContain('seed');
      expect(GROWTH_STAGES.map(s => s.stage)).toContain('sprout');
      expect(GROWTH_STAGES.map(s => s.stage)).toContain('growing');
      expect(GROWTH_STAGES.map(s => s.stage)).toContain('mature');
      expect(GROWTH_STAGES.map(s => s.stage)).toContain('harvest');
    });

    it('getGrowthStage应正确返回阶段', () => {
      expect(getGrowthStage(5)).toBe('seed');
      expect(getGrowthStage(20)).toBe('sprout');
      expect(getGrowthStage(50)).toBe('growing');
      expect(getGrowthStage(90)).toBe('mature');
      expect(getGrowthStage(100)).toBe('harvest');
    });

    it('getGrowthStageConfig应返回正确配置', () => {
      const config = getGrowthStageConfig('seed');
      expect(config).toBeDefined();
      expect(config?.name).toBe('种子期');
    });
  });

  describe('考教题目', () => {
    it('应有药材考教题目', () => {
      expect(getQuizForHerb('mahuang')).toBeDefined();
      expect(getQuizForHerb('guizhi')).toBeDefined();
      expect(getQuizForHerb('jinyinhua')).toBeDefined();
    });

    it('题目应有正确答案', () => {
      const quiz = getQuizForHerb('mahuang');
      expect(quiz?.correct_answer).toBe('辛温');
    });
  });

  describe('种植匹配计算', () => {
    it('完全匹配应得高分', () => {
      const result = calculatePlantingMatch(
        'seed_mahuang',
        'plot_lung_1',  // 麻黄归肺经
        'water_warm',   // 麻黄需温水
        'fertilizer_pungent' // 麻黄需辛味肥
      );
      expect(result.plot_match).toBe(true);
      expect(result.water_match).toBe(true);
      expect(result.fertilizer_match).toBe(true);
      expect(result.total_score).toBe(100);
    });

    it('不匹配应得低分', () => {
      const result = calculatePlantingMatch(
        'seed_mahuang',
        'plot_heart_1', // 心经地块（不匹配）
        'water_cool',   // 凉水（不匹配）
        'fertilizer_sweet' // 甘味肥（不匹配）
      );
      expect(result.plot_match).toBe(false);
      expect(result.water_match).toBe(false);
      expect(result.fertilizer_match).toBe(false);
      expect(result.total_score).toBe(0);
    });

    it('通用地块应匹配任何药材', () => {
      const result = calculatePlantingMatch(
        'seed_mahuang',
        'plot_general_1', // 通用地块
        'water_warm',
        'fertilizer_pungent'
      );
      expect(result.plot_match).toBe(true);
    });

    it('中性水应匹配任何药材', () => {
      const result = calculatePlantingMatch(
        'seed_mahuang',
        'plot_lung_1',
        'water_neutral', // 中性水
        'fertilizer_pungent'
      );
      expect(result.water_match).toBe(true);
    });

    it('部分匹配应得部分分数', () => {
      const result = calculatePlantingMatch(
        'seed_mahuang',
        'plot_lung_1',  // 匹配
        'water_cool',   // 不匹配
        'fertilizer_sweet' // 不匹配
      );
      expect(result.plot_match).toBe(true);
      expect(result.water_match).toBe(false);
      expect(result.fertilizer_match).toBe(false);
      expect(result.total_score).toBe(30);
    });
  });

  describe('状态初始化', () => {
    it('initializePlotStates应创建正确数量地块', () => {
      const plots = initializePlotStates();
      expect(plots.length).toBe(PLOTS_DATA.length);
    });

    it('地块初始状态应为空', () => {
      const plots = initializePlotStates();
      plots.forEach(plot => {
        expect(plot.seed_id).toBeNull();
        expect(plot.herb_id).toBeNull();
        expect(plot.growth_progress).toBe(0);
        expect(plot.is_ready).toBe(false);
      });
    });

    it('initializePlantingState应创建完整状态', () => {
      const state = initializePlantingState();
      expect(state.phase).toBe('select_seed');
      expect(state.selected_seed).toBeNull();
      expect(state.plots.length).toBe(PLOTS_DATA.length);
    });
  });
});