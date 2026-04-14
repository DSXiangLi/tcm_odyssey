// tests/unit/processing-data.spec.ts
/**
 * 炮制数据结构单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  PROCESSING_METHODS,
  ADJUVANTS,
  HERB_PROCESSING_PARAMS,
  getProcessingMethodConfig,
  getMethodsByCategory,
  getAdjuvantConfig,
  getHerbProcessingParams,
  calculateProcessingScore,
  type ProcessingMethodType,
  type AdjuvantType,
  type ProcessingMethodCategory
} from '../../src/data/processing-data';

describe('Processing Data', () => {
  describe('炮制方法数据', () => {
    it('应包含5大类炮制方法', () => {
      const categories: ProcessingMethodCategory[] = ['chao', 'zhi', 'duan', 'zheng', 'zhu'];
      categories.forEach(cat => {
        const methods = getMethodsByCategory(cat);
        expect(methods.length).toBeGreaterThan(0);
      });
    });

    it('炒类应包含3种方法', () => {
      const chaoMethods = getMethodsByCategory('chao');
      expect(chaoMethods.length).toBe(3);
      expect(chaoMethods.map(m => m.id)).toContain('qing-chao');
      expect(chaoMethods.map(m => m.id)).toContain('fu-chao');
      expect(chaoMethods.map(m => m.id)).toContain('tu-chao');
    });

    it('炙类应包含4种方法', () => {
      const zhiMethods = getMethodsByCategory('zhi');
      expect(zhiMethods.length).toBe(4);
    });

    it('每个方法应有完整配置', () => {
      PROCESSING_METHODS.forEach(method => {
        expect(method.id).toBeDefined();
        expect(method.name).toBeDefined();
        expect(method.description).toBeDefined();
        expect(method.time_range).toBeDefined();
        expect(method.time_range.length).toBe(2);
      });
    });

    it('getProcessingMethodConfig应返回正确配置', () => {
      const config = getProcessingMethodConfig('mi-zhi');
      expect(config).toBeDefined();
      expect(config?.name).toBe('蜜炙');
      expect(config?.requires_adjuvant).toBe(true);
    });

    it('getProcessingMethodConfig对无效ID应返回undefined', () => {
      const config = getProcessingMethodConfig('invalid-method' as ProcessingMethodType);
      expect(config).toBeUndefined();
    });
  });

  describe('辅料数据', () => {
    it('应包含常用辅料', () => {
      expect(ADJUVANTS.length).toBeGreaterThan(5);
      expect(ADJUVANTS.map(a => a.id)).toContain('feng-mi');
      expect(ADJUVANTS.map(a => a.id)).toContain('huang-jiu');
    });

    it('每个辅料应有功效描述', () => {
      ADJUVANTS.forEach(adj => {
        expect(adj.effect).toBeDefined();
      });
    });

    it('getAdjuvantConfig应返回正确配置', () => {
      const config = getAdjuvantConfig('feng-mi');
      expect(config).toBeDefined();
      expect(config?.name).toBe('蜂蜜');
    });
  });

  describe('药材炮制参数', () => {
    it('甘草应有炮制参数', () => {
      const params = getHerbProcessingParams('gancao');
      expect(params).toBeDefined();
      expect(params?.suitable_methods).toContain('mi-zhi');
    });

    it('每种药材应有推荐方法', () => {
      HERB_PROCESSING_PARAMS.forEach(params => {
        expect(params.default_method).toBeDefined();
      });
    });
  });

  describe('评分计算', () => {
    it('正确炮制甘草应得高分', () => {
      const score = calculateProcessingScore(
        'gancao',
        'mi-zhi',
        'feng-mi',
        270,  // 接近最优时间
        ['色泽均匀', '蜜香浓郁', '不焦不糊']
      );
      expect(score.total_score).toBeGreaterThanOrEqual(80);
      expect(score.passed).toBe(true);
    });

    it('错误方法应得低分', () => {
      const score = calculateProcessingScore(
        'gancao',
        'qing-chao',  // 甘草不适合清炒
        null,
        120,
        []
      );
      expect(score.method_score).toBe(0);
      expect(score.passed).toBe(false);
    });

    it('时间超出范围应扣分', () => {
      const score = calculateProcessingScore(
        'gancao',
        'mi-zhi',
        'feng-mi',
        600,  // 远超出时间范围
        ['色泽均匀']
      );
      expect(score.time_score).toBeLessThan(30);
    });
  });
});