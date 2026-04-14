// src/data/decoction-data.ts
/**
 * 煎药游戏数据定义
 *
 * Phase 2 S9.1 实现
 *
 * 内容:
 * - 煎药参数定义 (DecoctionParams)
 * - 火候类型定义 (FireLevel)
 * - 煎药顺序定义 (DecoctionOrder)
 * - 煎药评分规则 (DecoctionScoreRule)
 * - 煎药配方扩展数据 (DecoctionRecipe)
 */

import prescriptionsData from './prescriptions.json';

// ===== 火候类型 =====

/**
 * 火候等级
 */
export type FireLevel = 'wu' | 'wen' | 'slow';

/**
 * 火候配置
 */
export interface FireLevelConfig {
  id: FireLevel;
  name: string;          // 中文名: "武火"/"文火"
  description: string;   // 描述
  visual_speed: number;  // UI动画速度 (0-100)
  temperature_range: string; // 温度范围描述
}

/**
 * 火候数据
 */
export const FIRE_LEVELS: FireLevelConfig[] = [
  {
    id: 'wu',
    name: '武火',
    description: '大火急煎，火力猛烈，适合需要快速煎煮的方剂',
    visual_speed: 80,
    temperature_range: '高温'
  },
  {
    id: 'wen',
    name: '文火',
    description: '小火慢煎，火力温和，适合需要长时间煎煮的方剂',
    visual_speed: 40,
    temperature_range: '中温'
  },
  {
    id: 'slow',
    name: '缓火',
    description: '极小火，适合需要极长时间熬制的方剂',
    visual_speed: 20,
    temperature_range: '低温'
  }
];

// ===== 煎药顺序 =====

/**
 * 煎药顺序类型
 */
export type DecoctionOrderType = 'first' | 'normal' | 'last' | 'special';

/**
 * 煎药顺序配置
 */
export interface DecoctionOrderConfig {
  id: DecoctionOrderType;
  name: string;          // 中文名: "先煎"/"后下"
  description: string;
  timing_offset: number; // 时间偏移(秒)，相对于正常煎煮时间
}

/**
 * 煎药顺序数据
 */
export const DECOCTION_ORDERS: DecoctionOrderConfig[] = [
  {
    id: 'first',
    name: '先煎',
    description: '需要先单独煎煮一段时间，再加入其他药材',
    timing_offset: -300  // 先煎5分钟
  },
  {
    id: 'normal',
    name: '同煎',
    description: '与其他药材同时煎煮',
    timing_offset: 0
  },
  {
    id: 'last',
    name: '后下',
    description: '在其他药材煎煮一段时间后再加入',
    timing_offset: 180   // 后下3分钟
  },
  {
    id: 'special',
    name: '特殊处理',
    description: '需要特殊处理方式（如包煎、烊化等）',
    timing_offset: 0
  }
];

// ===== 煎药参数 =====

/**
 * 单个药材的煎药参数
 */
export interface HerbDecoctionParams {
  herb_id: string;           // 药材ID
  order: DecoctionOrderType; // 煎药顺序
  fire_level: FireLevel;     // 建议火候
  special_note?: string;     // 特殊处理说明（如"去沫"、"包煎"）
}

/**
 * 方剂煎药参数
 */
export interface PrescriptionDecoctionParams {
  prescription_id: string;   // 方剂ID
  total_time: number;        // 总煎煮时间(秒)
  default_fire: FireLevel;   // 默认火候
  water_amount: string;      // 用水量描述
  herb_params: HerbDecoctionParams[]; // 各药材参数
  special_steps?: string[];  // 特殊步骤说明
  serving_method?: string;   // 服用方法
}

// ===== 一期方剂煎药参数 =====

/**
 * 煎药参数数据
 *
 * 基于prescriptions.json中的decoction_method字段扩展
 */
export const DECOCTION_PARAMS: PrescriptionDecoctionParams[] = [
  {
    prescription_id: 'mahuang-tang',
    total_time: 600,  // 10分钟
    default_fire: 'wu',
    water_amount: '三碗水',
    herb_params: [
      { herb_id: 'mahuang', order: 'first', fire_level: 'wu', special_note: '先煎去沫' },
      { herb_id: 'guizhi', order: 'normal', fire_level: 'wen' },
      { herb_id: 'xingren', order: 'normal', fire_level: 'wen' },
      { herb_id: 'gancao', order: 'normal', fire_level: 'wen' }
    ],
    special_steps: ['先煎麻黄，去沫后加入诸药'],
    serving_method: '温服，盖被微汗'
  },
  {
    prescription_id: 'guizhi-tang',
    total_time: 450,  // 7-8分钟
    default_fire: 'wen',
    water_amount: '三碗水',
    herb_params: [
      { herb_id: 'guizhi', order: 'normal', fire_level: 'wen' },
      { herb_id: 'shaoyao', order: 'normal', fire_level: 'wen' },
      { herb_id: 'gancao', order: 'normal', fire_level: 'wen' },
      { herb_id: 'shengjiang', order: 'normal', fire_level: 'wen' },
      { herb_id: 'dazao', order: 'normal', fire_level: 'wen' }
    ],
    special_steps: ['水煎温服', '服后啜热稀粥助药力'],
    serving_method: '温服，啜热稀粥'
  },
  {
    prescription_id: 'yin-qiao-san',
    total_time: 300,  // 5分钟
    default_fire: 'wen',
    water_amount: '鲜苇根汤',
    herb_params: [
      { herb_id: 'jinyinhua', order: 'normal', fire_level: 'wen' },
      { herb_id: 'lianqiao', order: 'normal', fire_level: 'wen' },
      { herb_id: 'bohe', order: 'last', fire_level: 'wen', special_note: '后下，香气易散' },
      { herb_id: 'jingjie', order: 'normal', fire_level: 'wen' },
      { herb_id: 'niubangzi', order: 'normal', fire_level: 'wen' },
      { herb_id: 'douchi', order: 'normal', fire_level: 'wen' },
      { herb_id: 'zhuye', order: 'normal', fire_level: 'wen' },
      { herb_id: 'jiegeng', order: 'normal', fire_level: 'wen' },
      { herb_id: 'gancao', order: 'normal', fire_level: 'wen' }
    ],
    special_steps: ['原方为散剂', '薄荷后下保留香气'],
    serving_method: '温服'
  },
  {
    prescription_id: 'sang-ju-yin',
    total_time: 300,  // 5分钟
    default_fire: 'wen',
    water_amount: '一碗半水',
    herb_params: [
      { herb_id: 'sangye', order: 'normal', fire_level: 'wen' },
      { herb_id: 'juhua', order: 'normal', fire_level: 'wen' },
      { herb_id: 'xingren', order: 'normal', fire_level: 'wen' },
      { herb_id: 'jiegeng', order: 'normal', fire_level: 'wen' },
      { herb_id: 'lianqiao', order: 'normal', fire_level: 'wen' },
      { herb_id: 'bohe', order: 'last', fire_level: 'wen' },
      { herb_id: 'lugen', order: 'normal', fire_level: 'wen' },
      { herb_id: 'gancao', order: 'normal', fire_level: 'wen' }
    ],
    special_steps: ['薄荷后下'],
    serving_method: '温服'
  }
];

// ===== 评分规则 =====

/**
 * 评分维度
 */
export type ScoreDimension = 'compatibility' | 'composition' | 'order' | 'fire' | 'time';

/**
 * 评分规则配置
 */
export interface ScoreRuleConfig {
  dimension: ScoreDimension;
  name: string;          // 中文名
  weight: number;        // 权重 (0-100)
  description: string;   // 描述
  scoring_criteria: string; // 评分标准说明
}

/**
 * 煎药评分规则
 */
export const DECOCTION_SCORE_RULES: ScoreRuleConfig[] = [
  {
    dimension: 'compatibility',
    name: '配伍正确',
    weight: 40,
    description: '药材放置在正确的君臣佐使位置',
    scoring_criteria: '每味药材角色正确得满分，错误得0分'
  },
  {
    dimension: 'composition',
    name: '组成正确',
    weight: 20,
    description: '选择的药材与方剂组成一致',
    scoring_criteria: '药材数量正确且无多余/缺失'
  },
  {
    dimension: 'order',
    name: '顺序正确',
    weight: 20,
    description: '药材煎煮顺序符合要求',
    scoring_criteria: '先煎/后下等顺序安排正确'
  },
  {
    dimension: 'fire',
    name: '火候正确',
    weight: 10,
    description: '煎煮火候符合方剂要求',
    scoring_criteria: '火候选择与建议一致'
  },
  {
    dimension: 'time',
    name: '时间正确',
    weight: 10,
    description: '煎煮时间符合方剂要求',
    scoring_criteria: '时间在要求范围内(±30秒)'
  }
];

// ===== 煎药游戏状态 =====

/**
 * 煎药游戏阶段
 */
export type DecoctionPhase =
  | 'select_prescription'  // 选择方剂
  | 'select_herbs'         // 选择药材
  | 'place_compatibility'  // 配伍放置
  | 'set_order'            // 设置顺序
  | 'set_fire'             // 设置火候
  | 'decocting'            // 煎煮中
  | 'complete'             // 完成
  | 'evaluate';            // 评分

/**
 * 煎药游戏当前状态
 */
export interface DecoctionState {
  phase: DecoctionPhase;
  prescription_id: string | null;
  selected_herbs: string[];         // 已选药材ID列表
  compatibility_placement: Map<string, string>; // 药材->角色映射
  order_settings: Map<string, DecoctionOrderType>; // 药材->顺序映射
  fire_level: FireLevel;
  decoction_time: number;           // 已煎煮时间(秒)
  target_time: number;              // 目标时间(秒)
  score?: DecoctionScoreResult;     // 评分结果
}

/**
 * 评分结果
 */
export interface DecoctionScoreResult {
  total_score: number;              // 总分 (0-100)
  dimension_scores: Record<ScoreDimension, number>; // 各维度分数
  passed: boolean;                  // 是否通过
  feedback: string;                 // 反馈文字
  herb_errors?: HerbError[];        // 药材错误详情
}

/**
 * 药材错误详情
 */
export interface HerbError {
  herb_id: string;
  herb_name: string;
  error_type: 'missing' | 'extra' | 'role_wrong' | 'order_wrong' | 'fire_wrong';
  expected?: string;
  actual?: string;
}

// ===== 辅助函数 =====

/**
 * 根据方剂ID获取煎药参数
 */
export function getDecoctionParams(prescriptionId: string): PrescriptionDecoctionParams | undefined {
  return DECOCTION_PARAMS.find(p => p.prescription_id === prescriptionId);
}

/**
 * 根据火候ID获取火候配置
 */
export function getFireLevelConfig(fireId: FireLevel): FireLevelConfig | undefined {
  return FIRE_LEVELS.find(f => f.id === fireId);
}

/**
 * 根据顺序ID获取顺序配置
 */
export function getDecoctionOrderConfig(orderId: DecoctionOrderType): DecoctionOrderConfig | undefined {
  return DECOCTION_ORDERS.find(o => o.id === orderId);
}

/**
 * 获取方剂的组成药材列表
 */
export function getPrescriptionHerbs(prescriptionId: string): string[] {
  const prescription = prescriptionsData.prescriptions.find(p => p.id === prescriptionId);
  if (!prescription) return [];
  return prescription.composition.map(c => {
    // 药材名称转ID (需要映射)
    const herbNameToId: Record<string, string> = {
      '麻黄': 'mahuang',
      '桂枝': 'guizhi',
      '杏仁': 'xingren',
      '甘草': 'gancao',
      '芍药': 'shaoyao',
      '生姜': 'shengjiang',
      '大枣': 'dazao',
      '金银花': 'jinyinhua',
      '连翘': 'lianqiao',
      '薄荷': 'bohe',
      '荆芥': 'jingjie',
      '牛蒡子': 'niubangzi',
      '豆豉': 'douchi',
      '竹叶': 'zhuye',
      '桔梗': 'jiegeng',
      '桑叶': 'sangye',
      '菊花': 'juhua',
      '芦根': 'lugen'
    };
    return herbNameToId[c.herb] || c.herb;
  });
}

/**
 * 获取方剂的君臣佐使角色映射
 */
export function getPrescriptionRoles(prescriptionId: string): Record<string, string> {
  const prescription = prescriptionsData.prescriptions.find(p => p.id === prescriptionId);
  if (!prescription) return {};

  const herbNameToId: Record<string, string> = {
    '麻黄': 'mahuang',
    '桂枝': 'guizhi',
    '杏仁': 'xingren',
    '甘草': 'gancao',
    '芍药': 'shaoyao',
    '生姜': 'shengjiang',
    '大枣': 'dazao',
    '金银花': 'jinyinhua',
    '连翘': 'lianqiao',
    '薄荷': 'bohe',
    '荆芥': 'jingjie',
    '牛蒡子': 'niubangzi',
    '豆豉': 'douchi',
    '竹叶': 'zhuye',
    '桔梗': 'jiegeng',
    '桑叶': 'sangye',
    '菊花': 'juhua',
    '芦根': 'lugen'
  };

  const roles: Record<string, string> = {};
  prescription.composition.forEach(c => {
    const herbId = herbNameToId[c.herb] || c.herb;
    roles[herbId] = c.role;
  });
  return roles;
}

/**
 * 计算煎药评分
 */
export function calculateDecoctionScore(
  prescriptionId: string,
  selectedHerbs: string[],
  compatibilityPlacement: Record<string, string>,
  orderSettings: Record<string, DecoctionOrderType>,
  fireLevel: FireLevel,
  decoctionTime: number
): DecoctionScoreResult {
  const params = getDecoctionParams(prescriptionId);
  const prescriptionHerbs = getPrescriptionHerbs(prescriptionId);
  const correctRoles = getPrescriptionRoles(prescriptionId);

  if (!params) {
    return {
      total_score: 0,
      dimension_scores: {
        compatibility: 0,
        composition: 0,
        order: 0,
        fire: 0,
        time: 0
      },
      passed: false,
      feedback: '方剂参数缺失'
    };
  }

  const errors: HerbError[] = [];
  const dimensionScores: Record<ScoreDimension, number> = {
    compatibility: 0,
    composition: 0,
    order: 0,
    fire: 0,
    time: 0
  };

  // 1. 组成评分 (20%)
  const missingHerbs = prescriptionHerbs.filter(h => !selectedHerbs.includes(h));
  const extraHerbs = selectedHerbs.filter(h => !prescriptionHerbs.includes(h));

  if (missingHerbs.length === 0 && extraHerbs.length === 0) {
    dimensionScores.composition = 20;
  } else {
    const correctCount = selectedHerbs.filter(h => prescriptionHerbs.includes(h)).length;
    dimensionScores.composition = (correctCount / prescriptionHerbs.length) * 20;

    missingHerbs.forEach(h => {
      const herbData = getHerbById(h);
      errors.push({
        herb_id: h,
        herb_name: herbData?.name || h,
        error_type: 'missing',
        expected: '应选'
      });
    });

    extraHerbs.forEach(h => {
      const herbData = getHerbById(h);
      errors.push({
        herb_id: h,
        herb_name: herbData?.name || h,
        error_type: 'extra',
        expected: '不应选'
      });
    });
  }

  // 2. 配伍评分 (40%)
  let correctRoleCount = 0;
  const herbsToCheck = selectedHerbs.filter(h => prescriptionHerbs.includes(h));

  herbsToCheck.forEach(herbId => {
    const expectedRole = correctRoles[herbId];
    const actualRole = compatibilityPlacement[herbId];

    if (actualRole === expectedRole) {
      correctRoleCount++;
    } else {
      const herbData = getHerbById(herbId);
      errors.push({
        herb_id: herbId,
        herb_name: herbData?.name || herbId,
        error_type: 'role_wrong',
        expected: expectedRole,
        actual: actualRole || '未放置'
      });
    }
  });

  dimensionScores.compatibility = (correctRoleCount / prescriptionHerbs.length) * 40;

  // 3. 顺序评分 (20%)
  let correctOrderCount = 0;

  herbsToCheck.forEach(herbId => {
    const herbParam = params.herb_params.find(p => p.herb_id === herbId);
    const expectedOrder = herbParam?.order || 'normal';
    const actualOrder = orderSettings[herbId] || 'normal';

    if (actualOrder === expectedOrder) {
      correctOrderCount++;
    } else {
      const herbData = getHerbById(herbId);
      const orderConfig = getDecoctionOrderConfig(expectedOrder);
      errors.push({
        herb_id: herbId,
        herb_name: herbData?.name || herbId,
        error_type: 'order_wrong',
        expected: orderConfig?.name || expectedOrder,
        actual: getDecoctionOrderConfig(actualOrder)?.name || actualOrder
      });
    }
  });

  dimensionScores.order = (correctOrderCount / prescriptionHerbs.length) * 20;

  // 4. 火候评分 (10%)
  if (fireLevel === params.default_fire) {
    dimensionScores.fire = 10;
  } else {
    errors.push({
      herb_id: '',
      herb_name: '整体',
      error_type: 'fire_wrong',
      expected: getFireLevelConfig(params.default_fire)?.name || params.default_fire,
      actual: getFireLevelConfig(fireLevel)?.name || fireLevel
    });
    dimensionScores.fire = 0;
  }

  // 5. 时间评分 (10%)
  const timeDiff = Math.abs(decoctionTime - params.total_time);
  const tolerance = 30; // ±30秒容差

  if (timeDiff <= tolerance) {
    dimensionScores.time = 10;
  } else if (timeDiff <= tolerance * 2) {
    dimensionScores.time = 5;
  } else {
    dimensionScores.time = 0;
  }

  // 计算总分
  const totalScore = Object.values(dimensionScores).reduce((sum, s) => sum + s, 0);

  // 如果组成分数为0（没选药材或全选错），整个煎药失败
  const finalScore = dimensionScores.composition === 0 ? 0 : totalScore;

  // 生成反馈
  let feedback = '';
  if (totalScore >= 80) {
    feedback = '优秀！煎药操作规范，对各环节掌握良好。';
  } else if (totalScore >= 60) {
    feedback = '良好，基本掌握煎药方法，但有部分细节需要注意。';
  } else if (totalScore >= 40) {
    feedback = '还需加强练习，重点关注配伍和顺序的处理。';
  } else {
    feedback = '煎药方法掌握不足，建议重新学习方剂煎煮要求。';
  }

  return {
    total_score: Math.round(finalScore),
    dimension_scores: dimensionScores,
    passed: finalScore >= 60,
    feedback,
    herb_errors: errors
  };
}

// 导入药材获取函数
import { getHerbById } from './inventory-data';