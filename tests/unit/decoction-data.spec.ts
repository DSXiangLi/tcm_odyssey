// tests/unit/decoction-data.spec.ts
/**
 * 煎药数据结构单元测试
 *
 * Phase 2 S9.1 实现
 */

import { describe, it, expect } from 'vitest';
import {
  FIRE_LEVELS,
  DECOCTION_ORDERS,
  DECOCTION_PARAMS,
  DECOCTION_SCORE_RULES,
  getDecoctionParams,
  getFireLevelConfig,
  getDecoctionOrderConfig,
  getPrescriptionHerbs,
  getPrescriptionRoles,
  calculateDecoctionScore,
  type FireLevel,
  type DecoctionOrderType,
  type DecoctionScoreResult
} from '../../src/data/decoction-data';

describe('S9.1: 煎药数据结构', () => {
  describe('FIRE_LEVELS - 火候数据', () => {
    it('should have 3 fire levels', () => {
      expect(FIRE_LEVELS.length).toBe(3);
    });

    it('should include 武火, 文火, 缓火', () => {
      const names = FIRE_LEVELS.map(f => f.name);
      expect(names).toContain('武火');
      expect(names).toContain('文火');
      expect(names).toContain('缓火');
    });

    it('should have valid visual_speed for each level', () => {
      FIRE_LEVELS.forEach(level => {
        expect(level.visual_speed).toBeGreaterThanOrEqual(0);
        expect(level.visual_speed).toBeLessThanOrEqual(100);
      });
    });

    it('getFireLevelConfig should return correct config', () => {
      const wuFire = getFireLevelConfig('wu');
      expect(wuFire?.name).toBe('武火');

      const wenFire = getFireLevelConfig('wen');
      expect(wenFire?.name).toBe('文火');

      const invalid = getFireLevelConfig('invalid' as FireLevel);
      expect(invalid).toBeUndefined();
    });
  });

  describe('DECOCTION_ORDERS - 煎药顺序数据', () => {
    it('should have 4 order types', () => {
      expect(DECOCTION_ORDERS.length).toBe(4);
    });

    it('should include 先煎, 同煎, 后下, 特殊处理', () => {
      const names = DECOCTION_ORDERS.map(o => o.name);
      expect(names).toContain('先煎');
      expect(names).toContain('同煎');
      expect(names).toContain('后下');
      expect(names).toContain('特殊处理');
    });

    it('先煎 should have negative timing_offset', () => {
      const firstOrder = DECOCTION_ORDERS.find(o => o.id === 'first');
      expect(firstOrder?.timing_offset).toBeLessThan(0);
    });

    it('后下 should have positive timing_offset', () => {
      const lastOrder = DECOCTION_ORDERS.find(o => o.id === 'last');
      expect(lastOrder?.timing_offset).toBeGreaterThan(0);
    });

    it('getDecoctionOrderConfig should return correct config', () => {
      const firstConfig = getDecoctionOrderConfig('first');
      expect(firstConfig?.name).toBe('先煎');

      const normalConfig = getDecoctionOrderConfig('normal');
      expect(normalConfig?.name).toBe('同煎');

      const invalid = getDecoctionOrderConfig('invalid' as DecoctionOrderType);
      expect(invalid).toBeUndefined();
    });
  });

  describe('DECOCTION_PARAMS - 方剂煎药参数', () => {
    it('should have params for all Phase 1 prescriptions', () => {
      expect(DECOCTION_PARAMS.length).toBe(4);
    });

    it('should include 麻黄汤 params', () => {
      const mahuangParams = getDecoctionParams('mahuang-tang');
      expect(mahuangParams).toBeDefined();
      expect(mahuangParams?.total_time).toBe(600);
      expect(mahuangParams?.default_fire).toBe('wu');
    });

    it('should include 桂枝汤 params', () => {
      const guizhiParams = getDecoctionParams('guizhi-tang');
      expect(guizhiParams).toBeDefined();
      expect(guizhiParams?.default_fire).toBe('wen');
    });

    it('should include 银翘散 params', () => {
      const yinqiaoParams = getDecoctionParams('yin-qiao-san');
      expect(yinqiaoParams).toBeDefined();
      expect(yinqiaoParams?.total_time).toBe(300);
    });

    it('should include 桑菊饮 params', () => {
      const sangjuParams = getDecoctionParams('sang-ju-yin');
      expect(sangjuParams).toBeDefined();
    });

    it('麻黄汤 should have 先煎 for 麻黄', () => {
      const mahuangParams = getDecoctionParams('mahuang-tang');
      const mahuangHerbParam = mahuangParams?.herb_params.find(p => p.herb_id === 'mahuang');
      expect(mahuangHerbParam?.order).toBe('first');
      expect(mahuangHerbParam?.special_note).toContain('去沫');
    });

    it('银翘散 should have 后下 for 薄荷', () => {
      const yinqiaoParams = getDecoctionParams('yin-qiao-san');
      const boheParam = yinqiaoParams?.herb_params.find(p => p.herb_id === 'bohe');
      expect(boheParam?.order).toBe('last');
    });

    it('should have herb_params for all herbs in prescription', () => {
      DECOCTION_PARAMS.forEach(param => {
        const prescriptionHerbs = getPrescriptionHerbs(param.prescription_id);
        const paramHerbs = param.herb_params.map(p => p.herb_id);

        // 检查所有方剂药材都有对应的煎药参数
        prescriptionHerbs.forEach(herbId => {
          expect(paramHerbs).toContain(herbId);
        });
      });
    });

    it('getDecoctionParams should return undefined for invalid id', () => {
      const invalid = getDecoctionParams('invalid-prescription');
      expect(invalid).toBeUndefined();
    });
  });

  describe('DECOCTION_SCORE_RULES - 评分规则', () => {
    it('should have 5 score dimensions', () => {
      expect(DECOCTION_SCORE_RULES.length).toBe(5);
    });

    it('should include 配伍正确 with weight 40', () => {
      const compatibilityRule = DECOCTION_SCORE_RULES.find(r => r.dimension === 'compatibility');
      expect(compatibilityRule?.weight).toBe(40);
      expect(compatibilityRule?.name).toBe('配伍正确');
    });

    it('should include 组成正确 with weight 20', () => {
      const compositionRule = DECOCTION_SCORE_RULES.find(r => r.dimension === 'composition');
      expect(compositionRule?.weight).toBe(20);
    });

    it('should include 顺序正确 with weight 20', () => {
      const orderRule = DECOCTION_SCORE_RULES.find(r => r.dimension === 'order');
      expect(orderRule?.weight).toBe(20);
    });

    it('should include 火候正确 with weight 10', () => {
      const fireRule = DECOCTION_SCORE_RULES.find(r => r.dimension === 'fire');
      expect(fireRule?.weight).toBe(10);
    });

    it('should include 时间正确 with weight 10', () => {
      const timeRule = DECOCTION_SCORE_RULES.find(r => r.dimension === 'time');
      expect(timeRule?.weight).toBe(10);
    });

    it('total weights should be 100', () => {
      const totalWeight = DECOCTION_SCORE_RULES.reduce((sum, r) => sum + r.weight, 0);
      expect(totalWeight).toBe(100);
    });
  });

  describe('getPrescriptionHerbs - 获取方剂药材', () => {
    it('should return correct herbs for 麻黄汤', () => {
      const herbs = getPrescriptionHerbs('mahuang-tang');
      expect(herbs).toContain('mahuang');
      expect(herbs).toContain('guizhi');
      expect(herbs).toContain('xingren');
      expect(herbs).toContain('gancao');
      expect(herbs.length).toBe(4);
    });

    it('should return correct herbs for 桂枝汤', () => {
      const herbs = getPrescriptionHerbs('guizhi-tang');
      expect(herbs).toContain('guizhi');
      expect(herbs).toContain('shaoyao');
      expect(herbs).toContain('gancao');
      expect(herbs).toContain('shengjiang');
      expect(herbs).toContain('dazao');
      expect(herbs.length).toBe(5);
    });

    it('should return empty array for invalid prescription', () => {
      const herbs = getPrescriptionHerbs('invalid');
      expect(herbs).toEqual([]);
    });
  });

  describe('getPrescriptionRoles - 获取君臣佐使映射', () => {
    it('should return correct roles for 麻黄汤', () => {
      const roles = getPrescriptionRoles('mahuang-tang');
      expect(roles['mahuang']).toBe('君');
      expect(roles['guizhi']).toBe('臣');
      expect(roles['xingren']).toBe('佐');
      expect(roles['gancao']).toBe('使');
    });

    it('should return correct roles for 桂枝汤', () => {
      const roles = getPrescriptionRoles('guizhi-tang');
      expect(roles['guizhi']).toBe('君');
      expect(roles['shaoyao']).toBe('臣');
    });

    it('should return empty object for invalid prescription', () => {
      const roles = getPrescriptionRoles('invalid');
      expect(roles).toEqual({});
    });
  });

  describe('calculateDecoctionScore - 评分计算', () => {
    it('should return perfect score for correct 麻黄汤', () => {
      const result = calculateDecoctionScore(
        'mahuang-tang',
        ['mahuang', 'guizhi', 'xingren', 'gancao'],
        { mahuang: '君', guizhi: '臣', xingren: '佐', gancao: '使' },
        { mahuang: 'first', guizhi: 'normal', xingren: 'normal', gancao: 'normal' },
        'wu',
        600
      );

      expect(result.total_score).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.dimension_scores.compatibility).toBe(40);
      expect(result.dimension_scores.composition).toBe(20);
      expect(result.dimension_scores.order).toBe(20);
      expect(result.dimension_scores.fire).toBe(10);
      expect(result.dimension_scores.time).toBe(10);
      expect(result.herb_errors?.length).toBe(0);
    });

    it('should return zero score for missing all herbs', () => {
      const result = calculateDecoctionScore(
        'mahuang-tang',
        [],
        {},
        {},
        'wu',
        600
      );

      expect(result.total_score).toBe(0);
      expect(result.passed).toBe(false);
      expect(result.dimension_scores.composition).toBe(0);
    });

    it('should penalize wrong role placement', () => {
      const result = calculateDecoctionScore(
        'mahuang-tang',
        ['mahuang', 'guizhi', 'xingren', 'gancao'],
        { mahuang: '臣', guizhi: '君', xingren: '佐', gancao: '使' }, // 麻黄和桂枝角色错误
        { mahuang: 'first', guizhi: 'normal', xingren: 'normal', gancao: 'normal' },
        'wu',
        600
      );

      expect(result.total_score).toBeLessThan(100);
      expect(result.dimension_scores.compatibility).toBe(20); // 只有2个正确
      expect(result.herb_errors?.length).toBeGreaterThan(0);
    });

    it('should penalize wrong order', () => {
      const result = calculateDecoctionScore(
        'mahuang-tang',
        ['mahuang', 'guizhi', 'xingren', 'gancao'],
        { mahuang: '君', guizhi: '臣', xingren: '佐', gancao: '使' },
        { mahuang: 'normal', guizhi: 'normal', xingren: 'normal', gancao: 'normal' }, // 麻黄应该先煎
        'wu',
        600
      );

      expect(result.dimension_scores.order).toBe(15); // 3/4正确
    });

    it('should penalize wrong fire level', () => {
      const result = calculateDecoctionScore(
        'mahuang-tang',
        ['mahuang', 'guizhi', 'xingren', 'gancao'],
        { mahuang: '君', guizhi: '臣', xingren: '佐', gancao: '使' },
        { mahuang: 'first', guizhi: 'normal', xingren: 'normal', gancao: 'normal' },
        'wen', // 麻黄汤应该用武火
        600
      );

      expect(result.dimension_scores.fire).toBe(0);
    });

    it('should give partial time score for close time', () => {
      const result = calculateDecoctionScore(
        'mahuang-tang',
        ['mahuang', 'guizhi', 'xingren', 'gancao'],
        { mahuang: '君', guizhi: '臣', xingren: '佐', gancao: '使' },
        { mahuang: 'first', guizhi: 'normal', xingren: 'normal', gancao: 'normal' },
        'wu',
        620 // 20秒偏差，在30秒容差内
      );

      expect(result.dimension_scores.time).toBe(10);

      // 45秒偏差，在30-60秒范围
      const result2 = calculateDecoctionScore(
        'mahuang-tang',
        ['mahuang', 'guizhi', 'xingren', 'gancao'],
        { mahuang: '君', guizhi: '臣', xingren: '佐', gancao: '使' },
        { mahuang: 'first', guizhi: 'normal', xingren: 'normal', gancao: 'normal' },
        'wu',
        645
      );

      expect(result2.dimension_scores.time).toBe(5);
    });

    it('should return zero for invalid prescription', () => {
      const result = calculateDecoctionScore(
        'invalid-prescription',
        [],
        {},
        {},
        'wen',
        300
      );

      expect(result.total_score).toBe(0);
      expect(result.feedback).toContain('缺失');
    });

    it('should detect missing herbs', () => {
      const result = calculateDecoctionScore(
        'mahuang-tang',
        ['mahuang', 'guizhi', 'xingren'], // 缺少甘草
        { mahuang: '君', guizhi: '臣', xingren: '佐' },
        { mahuang: 'first', guizhi: 'normal', xingren: 'normal' },
        'wu',
        600
      );

      const missingErrors = result.herb_errors?.filter(e => e.error_type === 'missing');
      expect(missingErrors?.length).toBe(1);
      expect(missingErrors?.[0]?.herb_id).toBe('gancao');
    });

    it('should detect extra herbs', () => {
      const result = calculateDecoctionScore(
        'mahuang-tang',
        ['mahuang', 'guizhi', 'xingren', 'gancao', 'jinyinhua'], // 多了金银花
        { mahuang: '君', guizhi: '臣', xingren: '佐', gancao: '使', jinyinhua: '君' },
        { mahuang: 'first', guizhi: 'normal', xingren: 'normal', gancao: 'normal', jinyinhua: 'normal' },
        'wu',
        600
      );

      const extraErrors = result.herb_errors?.filter(e => e.error_type === 'extra');
      expect(extraErrors?.length).toBe(1);
      expect(extraErrors?.[0]?.herb_id).toBe('jinyinhua');
    });

    it('should generate appropriate feedback', () => {
      // 优秀
      const excellent = calculateDecoctionScore(
        'mahuang-tang',
        ['mahuang', 'guizhi', 'xingren', 'gancao'],
        { mahuang: '君', guizhi: '臣', xingren: '佐', gancao: '使' },
        { mahuang: 'first', guizhi: 'normal', xingren: 'normal', gancao: 'normal' },
        'wu',
        600
      );
      expect(excellent.feedback).toContain('优秀');

      // 良好
      const good = calculateDecoctionScore(
        'mahuang-tang',
        ['mahuang', 'guizhi', 'xingren', 'gancao'],
        { mahuang: '君', guizhi: '臣', xingren: '佐', gancao: '使' },
        { mahuang: 'first', guizhi: 'normal', xingren: 'normal', gancao: 'normal' },
        'wen', // 火候错误
        600
      );
      expect(good.feedback).toContain('良好');

      // 较差
      const poor = calculateDecoctionScore(
        'mahuang-tang',
        ['mahuang'], // 只选了一个
        { mahuang: '臣' }, // 角色错误
        { mahuang: 'normal' }, // 顺序错误
        'wen',
        100
      );
      expect(poor.feedback).toContain('掌握不足');
    });
  });
});