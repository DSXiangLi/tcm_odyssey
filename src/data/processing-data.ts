// src/data/processing-data.ts
/**
 * 炮制游戏数据定义
 *
 * Phase 2 S10.1 实现
 *
 * 内容:
 * - 炮制方法类型定义 (ProcessingMethod)
 * - 炮制辅料定义 (ProcessingAdjuvant)
 * - 炮制参数定义 (ProcessingParams)
 * - 炮制评分规则 (ProcessingScoreRule)
 */

// ===== 炮制方法类型 =====

/**
 * 炮制方法大类
 */
export type ProcessingMethodCategory = 'chao' | 'zhi' | 'duan' | 'zheng' | 'zhu';

/**
 * 具体炮制方法
 */
export type ProcessingMethodType =
  | 'qing-chao'    // 清炒
  | 'fu-chao'      // 麸炒
  | 'tu-chao'      // 土炒
  | 'mi-zhi'       // 蜜炙
  | 'jiu-zhi'      // 酒炙
  | 'cu-zhi'       // 醋炙
  | 'yan-zhi'      // 盐炙
  | 'ming-duan'    // 明煅
  | 'duan-zi'      // 煅淬
  | 'qing-zheng'   // 清蒸
  | 'jiu-zheng'    // 酒蒸
  | 'shui-zhu'     // 水煮
  | 'cu-zhu';      // 醋煮

/**
 * 炮制方法配置
 */
export interface ProcessingMethodConfig {
  id: ProcessingMethodType;
  category: ProcessingMethodCategory;
  name: string;              // 中文名
  description: string;       // 描述
  requires_adjuvant: boolean; // 是否需要辅料
  adjuvant_types?: string[]; // 可用辅料类型
  temperature_range: string; // 温度范围
  time_range: number[];      // 时间范围(秒) [min, max]
  visual_effect: string;     // 视觉效果描述
}

/**
 * 炮制方法数据
 */
export const PROCESSING_METHODS: ProcessingMethodConfig[] = [
  // 炒类
  {
    id: 'qing-chao',
    category: 'chao',
    name: '清炒',
    description: '直接加热翻炒，不加辅料',
    requires_adjuvant: false,
    temperature_range: '中火',
    time_range: [60, 180],
    visual_effect: '药材颜色加深，散发香气'
  },
  {
    id: 'fu-chao',
    category: 'chao',
    name: '麸炒',
    description: '用麦麸作为辅料翻炒',
    requires_adjuvant: true,
    adjuvant_types: ['麦麸'],
    temperature_range: '中火',
    time_range: [90, 240],
    visual_effect: '药材表面附着麦麸，色泽金黄'
  },
  {
    id: 'tu-chao',
    category: 'chao',
    name: '土炒',
    description: '用灶心土作为辅料翻炒',
    requires_adjuvant: true,
    adjuvant_types: ['灶心土'],
    temperature_range: '中火',
    time_range: [120, 300],
    visual_effect: '药材表面附着土粉，增强健脾功效'
  },

  // 炙类
  {
    id: 'mi-zhi',
    category: 'zhi',
    name: '蜜炙',
    description: '用蜂蜜作为辅料炙制',
    requires_adjuvant: true,
    adjuvant_types: ['蜂蜜'],
    temperature_range: '文火',
    time_range: [180, 360],
    visual_effect: '药材表面光亮，蜜香浓郁'
  },
  {
    id: 'jiu-zhi',
    category: 'zhi',
    name: '酒炙',
    description: '用黄酒作为辅料炙制',
    requires_adjuvant: true,
    adjuvant_types: ['黄酒'],
    temperature_range: '文火',
    time_range: [120, 300],
    visual_effect: '药材表面微湿，酒香散发'
  },
  {
    id: 'cu-zhi',
    category: 'zhi',
    name: '醋炙',
    description: '用米醋作为辅料炙制',
    requires_adjuvant: true,
    adjuvant_types: ['米醋'],
    temperature_range: '文火',
    time_range: [90, 240],
    visual_effect: '药材表面醋香，增强入肝功效'
  },
  {
    id: 'yan-zhi',
    category: 'zhi',
    name: '盐炙',
    description: '用盐水作为辅料炙制',
    requires_adjuvant: true,
    adjuvant_types: ['盐水'],
    temperature_range: '文火',
    time_range: [60, 180],
    visual_effect: '药材表面微咸，增强入肾功效'
  },

  // 煅类
  {
    id: 'ming-duan',
    category: 'duan',
    name: '明煅',
    description: '直接高温煅烧',
    requires_adjuvant: false,
    temperature_range: '武火',
    time_range: [300, 600],
    visual_effect: '药材颜色灰白，质地酥脆'
  },
  {
    id: 'duan-zi',
    category: 'duan',
    name: '煅淬',
    description: '高温煅烧后迅速冷却',
    requires_adjuvant: true,
    adjuvant_types: ['水', '醋', '酒'],
    temperature_range: '武火',
    time_range: [240, 480],
    visual_effect: '药材质地酥脆，易于粉碎'
  },

  // 蒸类
  {
    id: 'qing-zheng',
    category: 'zheng',
    name: '清蒸',
    description: '水蒸气蒸制',
    requires_adjuvant: false,
    temperature_range: '文火',
    time_range: [600, 1200],
    visual_effect: '药材质地软化，色泽加深'
  },
  {
    id: 'jiu-zheng',
    category: 'zheng',
    name: '酒蒸',
    description: '用黄酒蒸制',
    requires_adjuvant: true,
    adjuvant_types: ['黄酒'],
    temperature_range: '文火',
    time_range: [480, 960],
    visual_effect: '药材酒香浓郁，增强活血功效'
  },

  // 煮类
  {
    id: 'shui-zhu',
    category: 'zhu',
    name: '水煮',
    description: '水煮制',
    requires_adjuvant: false,
    temperature_range: '文火',
    time_range: [480, 1200],
    visual_effect: '药材质地软化，毒性降低'
  },
  {
    id: 'cu-zhu',
    category: 'zhu',
    name: '醋煮',
    description: '用醋水煮制',
    requires_adjuvant: true,
    adjuvant_types: ['米醋'],
    temperature_range: '文火',
    time_range: [360, 720],
    visual_effect: '药材醋香，增强入肝功效'
  }
];

// ===== 炮制辅料 =====

/**
 * 辅料类型
 */
export type AdjuvantType = 'mai-fu' | 'zao-xin-tu' | 'feng-mi' | 'huang-jiu' | 'mi-cu' | 'yan-shui' | 'shui';

/**
 * 辅料配置
 */
export interface AdjuvantConfig {
  id: AdjuvantType;
  name: string;
  description: string;
  effect: string;          // 功效影响
  inventory_item?: string; // 背包物品ID
}

/**
 * 辅料数据
 */
export const ADJUVANTS: AdjuvantConfig[] = [
  {
    id: 'mai-fu',
    name: '麦麸',
    description: '小麦磨粉后的副产品',
    effect: '增强健脾消食功效',
    inventory_item: 'mai-fu'
  },
  {
    id: 'zao-xin-tu',
    name: '灶心土',
    description: '灶内经久烧制的黄土',
    effect: '增强健脾止泻功效',
    inventory_item: 'zao-xin-tu'
  },
  {
    id: 'feng-mi',
    name: '蜂蜜',
    description: '蜜蜂酿造的蜜',
    effect: '增强润肺补气功效',
    inventory_item: 'feng-mi'
  },
  {
    id: 'huang-jiu',
    name: '黄酒',
    description: '传统酿造米酒',
    effect: '增强活血通络功效',
    inventory_item: 'huang-jiu'
  },
  {
    id: 'mi-cu',
    name: '米醋',
    description: '传统酿造醋',
    effect: '增强入肝止痛功效',
    inventory_item: 'mi-cu'
  },
  {
    id: 'yan-shui',
    name: '盐水',
    description: '食盐溶解的水溶液',
    effect: '增强入肾补肾功效',
    inventory_item: undefined  // 可现场配制
  },
  {
    id: 'shui',
    name: '清水',
    description: '普通清水',
    effect: '基础辅料',
    inventory_item: undefined
  }
];

// ===== 药材炮制参数 =====

/**
 * 药材炮制参数
 */
export interface HerbProcessingParams {
  herb_id: string;
  suitable_methods: ProcessingMethodType[];  // 适用方法
  default_method: ProcessingMethodType;      // 推荐方法
  default_adjuvant?: AdjuvantType;           // 推荐辅料
  endpoint_indicator: string;                 // 终点判断指标
  quality_check: string[];                    // 质量检查要点
}

/**
 * 药材炮制参数数据
 */
export const HERB_PROCESSING_PARAMS: HerbProcessingParams[] = [
  {
    herb_id: 'gancao',
    suitable_methods: ['mi-zhi'],
    default_method: 'mi-zhi',
    default_adjuvant: 'feng-mi',
    endpoint_indicator: '表面金黄光亮，不粘手',
    quality_check: ['色泽均匀', '蜜香浓郁', '不焦不糊']
  },
  {
    herb_id: 'mahuang',
    suitable_methods: ['mi-zhi'],
    default_method: 'mi-zhi',
    default_adjuvant: 'feng-mi',
    endpoint_indicator: '表面微黄，蜜香散发',
    quality_check: ['蜜量适中', '发汗解表力减弱', '止咳力增强']
  },
  // 后续扩展其他药材...
];

// ===== 炮制游戏状态 =====

/**
 * 炮制游戏阶段
 */
export type ProcessingPhase =
  | 'select_herb'       // 选择药材
  | 'select_method'     // 选择方法
  | 'select_adjuvant'   // 选择辅料
  | 'preprocess'        // 预处理
  | 'processing'        // 炮制操作
  | 'check_endpoint'    // 判断终点
  | 'evaluate';         // 评分

/**
 * 炮制游戏状态
 */
export interface ProcessingState {
  phase: ProcessingPhase;
  herb_id: string | null;
  method: ProcessingMethodType | null;
  adjuvant: AdjuvantType | null;
  processing_time: number;       // 已炮制时间(秒)
  target_time: number;           // 目标时间(秒)
  temperature: string;           // 当前温度
  quality_indicators: string[];  // 质量指标记录
  score?: ProcessingScoreResult; // 评分结果
}

/**
 * 炮制评分结果
 */
export interface ProcessingScoreResult {
  total_score: number;           // 总分 (0-100)
  method_score: number;          // 方法选择分 (30分)
  adjuvant_score: number;        // 辅料选择分 (20分)
  time_score: number;            // 时间掌握分 (30分)
  quality_score: number;         // 质量判断分 (20分)
  passed: boolean;
  feedback: string;
}

// ===== 辅助函数 =====

/**
 * 获取炮制方法配置
 */
export function getProcessingMethodConfig(methodId: ProcessingMethodType): ProcessingMethodConfig | undefined {
  return PROCESSING_METHODS.find(m => m.id === methodId);
}

/**
 * 获取方法大类配置列表
 */
export function getMethodsByCategory(category: ProcessingMethodCategory): ProcessingMethodConfig[] {
  return PROCESSING_METHODS.filter(m => m.category === category);
}

/**
 * 获取辅料配置
 */
export function getAdjuvantConfig(adjuvantId: AdjuvantType): AdjuvantConfig | undefined {
  return ADJUVANTS.find(a => a.id === adjuvantId);
}

/**
 * 获取药材炮制参数
 */
export function getHerbProcessingParams(herbId: string): HerbProcessingParams | undefined {
  return HERB_PROCESSING_PARAMS.find(p => p.herb_id === herbId);
}

/**
 * 计算炮制评分
 */
export function calculateProcessingScore(
  herbId: string,
  method: ProcessingMethodType,
  adjuvant: AdjuvantType | null,
  processingTime: number,
  qualityIndicators: string[]
): ProcessingScoreResult {
  const params = getHerbProcessingParams(herbId);
  const methodConfig = getProcessingMethodConfig(method);

  if (!params || !methodConfig) {
    return {
      total_score: 0,
      method_score: 0,
      adjuvant_score: 0,
      time_score: 0,
      quality_score: 0,
      passed: false,
      feedback: '药材或方法参数缺失'
    };
  }

  let methodScore = 0;
  let adjuvantScore = 0;
  let timeScore = 0;
  let qualityScore = 0;

  // 1. 方法选择评分 (30分)
  if (params.suitable_methods.includes(method)) {
    methodScore = method === params.default_method ? 30 : 20;
  } else {
    methodScore = 0;
  }

  // 2. 辅料选择评分 (20分)
  if (methodConfig.requires_adjuvant) {
    if (adjuvant === params.default_adjuvant) {
      adjuvantScore = 20;
    } else if (methodConfig.adjuvant_types?.some(t => {
      const adjConfig = ADJUVANTS.find(a => a.name === t);
      return adjConfig?.id === adjuvant;
    })) {
      adjuvantScore = 10;
    } else {
      adjuvantScore = 0;
    }
  } else {
    // 不需要辅料时，未选择辅料得满分
    adjuvantScore = adjuvant === null ? 20 : 10;
  }

  // 3. 时间评分 (30分)
  const [minTime, maxTime] = methodConfig.time_range;
  const optimalTime = (minTime + maxTime) / 2;
  const timeDiff = Math.abs(processingTime - optimalTime);

  if (timeDiff <= 30) {
    timeScore = 30;
  } else if (timeDiff <= 60) {
    timeScore = 20;
  } else if (processingTime >= minTime && processingTime <= maxTime) {
    timeScore = 15;
  } else {
    timeScore = 0;
  }

  // 4. 质量判断评分 (20分)
  const expectedChecks = params.quality_check;
  const matchedChecks = qualityIndicators.filter(ind =>
    expectedChecks.some(check => ind.includes(check) || check.includes(ind))
  );
  qualityScore = (matchedChecks.length / expectedChecks.length) * 20;

  const totalScore = Math.round(methodScore + adjuvantScore + timeScore + qualityScore);

  let feedback = '';
  if (totalScore >= 80) {
    feedback = '优秀！炮制方法正确，时间掌握精准，质量判断准确。';
  } else if (totalScore >= 60) {
    feedback = '良好，基本掌握炮制方法，部分细节需要注意。';
  } else if (totalScore >= 40) {
    feedback = '还需加强练习，重点关注方法选择和时间掌握。';
  } else {
    feedback = '炮制方法掌握不足，建议重新学习药材炮制要求。';
  }

  return {
    total_score: totalScore,
    method_score: Math.round(methodScore),
    adjuvant_score: Math.round(adjuvantScore),
    time_score: Math.round(timeScore),
    quality_score: Math.round(qualityScore),
    passed: totalScore >= 60,
    feedback
  };
}