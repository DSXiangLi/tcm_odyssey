// src/data/planting-data.ts
/**
 * 种植游戏数据定义
 *
 * Phase 2 S11.1 实现
 *
 * 内容:
 * - 种子类型定义 (SeedType)
 * - 地块类型定义 (PlotType)
 * - 水源类型定义（对应四气）(WaterType)
 * - 肥料类型定义（对应五味）(FertilizerType)
 * - 生长阶段定义 (GrowthStage)
 * - 种植评分规则
 */

// ===== 种子类型 =====

/**
 * 种子数据
 */
export interface SeedData {
  id: string;              // 种子ID，与药材ID对应
  herb_id: string;         // 对应药材ID
  name: string;            // 种子名称
  growth_time: number;     // 生长时间(秒)
  required_water: string;  // 需求水源（四气）
  required_fertilizer: string; // 需求肥料（五味）
  meridian: string;        // 归经（决定地块选择）
  difficulty: number;      // 难度等级 1-5
}

/**
 * 一期种子数据
 */
export const SEEDS_DATA: SeedData[] = [
  {
    id: 'seed_mahuang',
    herb_id: 'mahuang',
    name: '麻黄种子',
    growth_time: 120,
    required_water: 'warm',
    required_fertilizer: 'pungent',
    meridian: 'lung',
    difficulty: 2
  },
  {
    id: 'seed_guizhi',
    herb_id: 'guizhi',
    name: '桂枝种子',
    growth_time: 180,
    required_water: 'warm',
    required_fertilizer: 'pungent',
    meridian: 'heart',
    difficulty: 2
  },
  {
    id: 'seed_jinyinhua',
    herb_id: 'jinyinhua',
    name: '金银花种子',
    growth_time: 240,
    required_water: 'cool',
    required_fertilizer: 'sweet',
    meridian: 'lung',
    difficulty: 3
  },
  {
    id: 'seed_lianqiao',
    herb_id: 'lianqiao',
    name: '连翘种子',
    growth_time: 200,
    required_water: 'cool',
    required_fertilizer: 'bitter',
    meridian: 'heart',
    difficulty: 3
  }
];

// ===== 地块类型 =====

/**
 * 地块归经类型
 */
export type PlotMeridian = 'lung' | 'heart' | 'liver' | 'kidney' | 'spleen' | 'general';

/**
 * 地块数据
 */
export interface PlotData {
  id: string;
  meridian: PlotMeridian;  // 归经属性
  name: string;
  description: string;
  position: { x: number; y: number }; // 在药园中的位置
}

/**
 * 药园地块数据
 */
export const PLOTS_DATA: PlotData[] = [
  {
    id: 'plot_lung_1',
    meridian: 'lung',
    name: '肺经地块A',
    description: '适合种植入肺经药材，如麻黄、金银花',
    position: { x: 1, y: 1 }
  },
  {
    id: 'plot_lung_2',
    meridian: 'lung',
    name: '肺经地块B',
    description: '适合种植入肺经药材',
    position: { x: 2, y: 1 }
  },
  {
    id: 'plot_heart_1',
    meridian: 'heart',
    name: '心经地块',
    description: '适合种植入心经药材，如桂枝、连翘',
    position: { x: 3, y: 1 }
  },
  {
    id: 'plot_general_1',
    meridian: 'general',
    name: '通用地块',
    description: '适合种植各类药材',
    position: { x: 4, y: 1 }
  }
];

// ===== 水源类型（对应四气）=====

/**
 * 四气类型
 */
export type FourQiType = 'hot' | 'warm' | 'neutral' | 'cool' | 'cold';

/**
 * 水源数据
 */
export interface WaterData {
  id: string;
  qi_type: FourQiType;
  name: string;
  description: string;
  effect: string;          // 对药材的影响
}

/**
 * 水源数据
 */
export const WATERS_DATA: WaterData[] = [
  {
    id: 'water_hot',
    qi_type: 'hot',
    name: '温泉水',
    description: '来自温泉的温水，性热',
    effect: '增强药材温热属性'
  },
  {
    id: 'water_warm',
    qi_type: 'warm',
    name: '温水',
    description: '温和的温水',
    effect: '适合温性药材'
  },
  {
    id: 'water_neutral',
    qi_type: 'neutral',
    name: '井水',
    description: '清凉井水，性平',
    effect: '不影响药材属性'
  },
  {
    id: 'water_cool',
    qi_type: 'cool',
    name: '溪水',
    description: '山间溪流清水，性凉',
    effect: '适合凉性药材'
  },
  {
    id: 'water_cold',
    qi_type: 'cold',
    name: '冰水',
    description: '来自冰雪的冷水',
    effect: '增强药材寒凉属性'
  }
];

// ===== 肥料类型（对应五味）=====

/**
 * 五味类型
 */
export type FiveFlavorType = 'pungent' | 'sweet' | 'bitter' | 'sour' | 'salty';

/**
 * 肥料数据
 */
export interface FertilizerData {
  id: string;
  flavor_type: FiveFlavorType;
  name: string;
  description: string;
  effect: string;
}

/**
 * 肥料数据
 */
export const FERTILIZERS_DATA: FertilizerData[] = [
  {
    id: 'fertilizer_pungent',
    flavor_type: 'pungent',
    name: '辛味肥',
    description: '增强药材发散功效',
    effect: '适合解表类药材'
  },
  {
    id: 'fertilizer_sweet',
    flavor_type: 'sweet',
    name: '甘味肥',
    description: '增强药材补益功效',
    effect: '适合补气类药材'
  },
  {
    id: 'fertilizer_bitter',
    flavor_type: 'bitter',
    name: '苦味肥',
    description: '增强药材清热功效',
    effect: '适合清热类药材'
  },
  {
    id: 'fertilizer_sour',
    flavor_type: 'sour',
    name: '酸味肥',
    description: '增强药材收敛功效',
    effect: '适合收涩类药材'
  },
  {
    id: 'fertilizer_salty',
    flavor_type: 'salty',
    name: '咸味肥',
    description: '增强药材软坚功效',
    effect: '适合软坚类药材'
  }
];

// ===== 生长阶段 =====

/**
 * 生长阶段
 */
export type GrowthStage = 'seed' | 'sprout' | 'growing' | 'mature' | 'harvest';

/**
 * 生长阶段配置
 */
export interface GrowthStageConfig {
  stage: GrowthStage;
  name: string;
  progress_range: number[]; // 进度范围 [start, end]
  visual_state: string;     // 视觉状态描述
}

/**
 * 生长阶段数据
 */
export const GROWTH_STAGES: GrowthStageConfig[] = [
  {
    stage: 'seed',
    name: '种子期',
    progress_range: [0, 10],
    visual_state: '种子刚播种'
  },
  {
    stage: 'sprout',
    name: '发芽期',
    progress_range: [10, 30],
    visual_state: '幼苗破土'
  },
  {
    stage: 'growing',
    name: '生长期',
    progress_range: [30, 80],
    visual_state: '植株茁壮成长'
  },
  {
    stage: 'mature',
    name: '成熟期',
    progress_range: [80, 95],
    visual_state: '植株成熟待收'
  },
  {
    stage: 'harvest',
    name: '收获期',
    progress_range: [95, 100],
    visual_state: '可以收获'
  }
];

// ===== 种植状态 =====

/**
 * 单个地块种植状态
 */
export interface PlotState {
  plot_id: string;
  seed_id: string | null;
  herb_id: string | null;
  water_id: string | null;
  fertilizer_id: string | null;
  growth_progress: number;     // 生长进度 0-100
  current_stage: GrowthStage;
  plant_time: number | null;   // 种植时间戳
  is_ready: boolean;           // 是否可收获
}

/**
 * 种植游戏阶段
 */
export type PlantingPhase =
  | 'select_seed'      // 选择种子
  | 'select_plot'      // 选择地块
  | 'select_water'     // 选择水源
  | 'select_fertilizer'// 选择肥料
  | 'planting'         // 种植操作
  | 'waiting'          // 等待生长
  | 'harvest'          // 收获
  | 'quiz';            // 考教答题

/**
 * 种植游戏总状态
 */
export interface PlantingState {
  phase: PlantingPhase;
  current_plot: string | null;
  plots: PlotState[];          // 所有地块状态
  selected_seed: string | null;
  selected_water: string | null;
  selected_fertilizer: string | null;
  quiz_question: string | null;
  quiz_passed: boolean;
}

// ===== 考教题目 =====

/**
 * 考教题目
 */
export interface QuizQuestion {
  herb_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

/**
 * 一期考教题目
 */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    herb_id: 'mahuang',
    question: '麻黄的性味是什么？',
    options: ['辛温', '辛凉', '甘温', '苦寒'],
    correct_answer: '辛温',
    explanation: '麻黄味辛性温，归肺、膀胱经，具有发汗解表、宣肺平喘的功效'
  },
  {
    herb_id: 'guizhi',
    question: '桂枝主要归哪条经？',
    options: ['肺经', '心经', '肝经', '脾经'],
    correct_answer: '心经',
    explanation: '桂枝归心、肺、膀胱经，主要功效为温通经脉'
  },
  {
    herb_id: 'jinyinhua',
    question: '金银花的功效是什么？',
    options: ['解表散寒', '清热解毒', '补气健脾', '活血化瘀'],
    correct_answer: '清热解毒',
    explanation: '金银花性寒味甘，具有清热解毒、疏散风热的功效'
  }
];

// ===== 辅助函数 =====

/**
 * 获取种子数据
 */
export function getSeedData(seedId: string): SeedData | undefined {
  return SEEDS_DATA.find(s => s.id === seedId);
}

/**
 * 获取地块数据
 */
export function getPlotData(plotId: string): PlotData | undefined {
  return PLOTS_DATA.find(p => p.id === plotId);
}

/**
 * 获取水源数据
 */
export function getWaterData(waterId: string): WaterData | undefined {
  return WATERS_DATA.find(w => w.id === waterId);
}

/**
 * 获取肥料数据
 */
export function getFertilizerData(fertilizerId: string): FertilizerData | undefined {
  return FERTILIZERS_DATA.find(f => f.id === fertilizerId);
}

/**
 * 根据进度获取生长阶段
 */
export function getGrowthStage(progress: number): GrowthStage {
  for (const stage of GROWTH_STAGES) {
    if (progress >= stage.progress_range[0] && progress < stage.progress_range[1]) {
      return stage.stage;
    }
  }
  return 'harvest';
}

/**
 * 获取生长阶段配置
 */
export function getGrowthStageConfig(stage: GrowthStage): GrowthStageConfig | undefined {
  return GROWTH_STAGES.find(s => s.stage === stage);
}

/**
 * 获取药材的考教题目
 */
export function getQuizForHerb(herbId: string): QuizQuestion | undefined {
  return QUIZ_QUESTIONS.find(q => q.herb_id === herbId);
}

/**
 * 计算种植匹配度
 * 返回地块、水源、肥料选择与药材需求的匹配程度
 */
export function calculatePlantingMatch(
  seedId: string,
  plotId: string,
  waterId: string,
  fertilizerId: string
): {
  plot_match: boolean;
  water_match: boolean;
  fertilizer_match: boolean;
  total_score: number;
} {
  const seed = getSeedData(seedId);
  const plot = getPlotData(plotId);
  const water = getWaterData(waterId);
  const fertilizer = getFertilizerData(fertilizerId);

  if (!seed || !plot || !water || !fertilizer) {
    return { plot_match: false, water_match: false, fertilizer_match: false, total_score: 0 };
  }

  // 地块匹配：归经一致或通用地块
  const plotMatch = plot.meridian === seed.meridian || plot.meridian === 'general';

  // 水源匹配：四气一致或中性
  const waterMatch = water.qi_type === seed.required_water || water.qi_type === 'neutral';

  // 肥料匹配：五味一致
  const fertilizerMatch = fertilizer.flavor_type === seed.required_fertilizer;

  // 计算总分
  let score = 0;
  if (plotMatch) score += 30;
  if (waterMatch) score += 35;
  if (fertilizerMatch) score += 35;

  return {
    plot_match: plotMatch,
    water_match: waterMatch,
    fertilizer_match: fertilizerMatch,
    total_score: score
  };
}

/**
 * 初始化地块状态
 */
export function initializePlotStates(): PlotState[] {
  return PLOTS_DATA.map(plot => ({
    plot_id: plot.id,
    seed_id: null,
    herb_id: null,
    water_id: null,
    fertilizer_id: null,
    growth_progress: 0,
    current_stage: 'seed',
    plant_time: null,
    is_ready: false
  }));
}

/**
 * 初始化种植状态
 */
export function initializePlantingState(): PlantingState {
  return {
    phase: 'select_seed',
    current_plot: null,
    plots: initializePlotStates(),
    selected_seed: null,
    selected_water: null,
    selected_fertilizer: null,
    quiz_question: null,
    quiz_passed: false
  };
}