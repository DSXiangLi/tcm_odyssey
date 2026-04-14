// src/data/experience-data.ts
/**
 * 经验值框架数据定义
 *
 * Phase 2 S12.1 实现
 *
 * 内容:
 * - 经验值类型定义 (ExperienceType)
 * - 经验值来源定义 (ExperienceSource)
 * - 解锁内容定义 (UnlockContent)
 * - 经验值计算规则
 */

// ===== 经验值类型 =====

/**
 * 经验值类型
 */
export type ExperienceType = 'learning' | 'practice' | 'exploration';

/**
 * 经验值类型配置
 */
export interface ExperienceTypeConfig {
  id: ExperienceType;
  name: string;          // 中文名
  description: string;   // 描述
  color: string;         // UI显示颜色
}

/**
 * 经验值类型数据
 */
export const EXPERIENCE_TYPES: ExperienceTypeConfig[] = [
  {
    id: 'learning',
    name: '学习',
    description: '通过完成任务、学习知识获得的经验值',
    color: '#4CAF50'  // 绿色
  },
  {
    id: 'practice',
    name: '实践',
    description: '通过诊治病案、煎药炮制获得的经验值',
    color: '#2196F3'  // 蓝色
  },
  {
    id: 'exploration',
    name: '探索',
    description: '通过探索药王谷、收集药材获得的经验值',
    color: '#FF9800'  // 橙色
  }
];

// ===== 经验值来源 =====

/**
 * 经验值来源类型
 */
export type ExperienceSource =
  | 'task_completion'
  | 'case_score'
  | 'clue_collected'
  | 'daily_checkin'
  | 'achievement';

/**
 * 经验值来源配置
 */
export interface ExperienceSourceConfig {
  id: ExperienceSource;
  name: string;           // 中文名
  description: string;    // 描述
  experience_type: ExperienceType; // 所属类型
  base_value?: number;    // 基础值
  multiplier?: number;    // 倍数（用于得分转换）
  per_clue_value?: number; // 每条线索值
  daily_bonus?: number;   // 每日奖励值
  achievement_bonuses?: AchievementBonus[]; // 成就奖励列表
}

/**
 * 成就奖励配置
 */
export interface AchievementBonus {
  achievement_id: string;
  name: string;
  bonus_value: number;
}

/**
 * 经验值来源数据
 */
export const EXPERIENCE_SOURCES: ExperienceSourceConfig[] = [
  {
    id: 'task_completion',
    name: '完成任务',
    description: '每个Task完成时获得的经验值',
    experience_type: 'learning',
    base_value: 50  // 每个任务完成基础奖励50点
  },
  {
    id: 'case_score',
    name: '病案得分',
    description: '根据病案诊治得分计算的经验值',
    experience_type: 'practice',
    multiplier: 1  // 得分直接转换为经验值（100分=100点）
  },
  {
    id: 'clue_collected',
    name: '收集线索',
    description: '每条辅助线索获得额外经验值',
    experience_type: 'practice',
    per_clue_value: 10  // 每条线索10点
  },
  {
    id: 'daily_checkin',
    name: '每日打卡',
    description: '每天首次学习获得的奖励',
    experience_type: 'learning',
    daily_bonus: 20  // 每日首签奖励20点
  },
  {
    id: 'achievement',
    name: '成就解锁',
    description: '一次性成就奖励',
    experience_type: 'exploration',
    achievement_bonuses: [
      { achievement_id: 'first_case_complete', name: '完成首诊', bonus_value: 100 },
      { achievement_id: 'first_prescription_correct', name: '方剂完美', bonus_value: 150 },
      { achievement_id: 'collect_all_herbs', name: '药材全集', bonus_value: 200 },
      { achievement_id: 'master_decoction', name: '煎药大师', bonus_value: 150 }
    ]
  }
];

// ===== 解锁内容 =====

/**
 * 解锁内容类型
 */
export type UnlockContent =
  | 'prescription_modification'
  | 'yaowang_valley'
  | 'new_npc'
  | 'advanced_prescriptions'
  | 'herb_collection';

/**
 * 解锁内容配置
 */
export interface UnlockContentConfig {
  id: UnlockContent;
  name: string;              // 中文名
  description: string;       // 描述
  required_experience: number; // 解锁所需经验值
  unlock_type: 'feature' | 'area' | 'npc' | 'knowledge'; // 解锁类型
  preview_description?: string; // 未解锁时显示的预览描述
}

/**
 * 解锁内容数据
 */
export const UNLOCK_CONTENTS: UnlockContentConfig[] = [
  {
    id: 'prescription_modification',
    name: '方剂加减功能',
    description: '选方时可以显示加减按钮，自定义调整方剂组成',
    required_experience: 200,
    unlock_type: 'feature',
    preview_description: '掌握更多方剂知识后解锁'
  },
  {
    id: 'yaowang_valley',
    name: '药王谷',
    description: '解锁探索区域，可以采集稀有药材',
    required_experience: 500,
    unlock_type: 'area',
    preview_description: '积累足够经验后可探索药王谷'
  },
  {
    id: 'new_npc',
    name: '新导师',
    description: '解锁更多NPC导师，获得新的学习机会',
    required_experience: 300,
    unlock_type: 'npc',
    preview_description: '完成更多学习任务后解锁新导师'
  },
  {
    id: 'advanced_prescriptions',
    name: '进阶方剂',
    description: '解锁更复杂的方剂学习内容',
    required_experience: 800,
    unlock_type: 'knowledge',
    preview_description: '精通基础方剂后解锁进阶内容'
  },
  {
    id: 'herb_collection',
    name: '药材图鉴',
    description: '解锁完整药材图鉴功能，查看所有药材详情',
    required_experience: 400,
    unlock_type: 'feature',
    preview_description: '收集更多药材后解锁完整图鉴'
  }
];

// ===== 经验值参数 =====

/**
 * 经验值全局参数
 */
export interface ExperienceParams {
  max_total_experience: number;  // 最大总经验值
  score_to_exp_ratio: number;    // 得分转经验值比例
  daily_streak_bonus: DailyStreakBonus; // 连续打卡奖励
}

/**
 * 连续打卡奖励配置
 */
export interface DailyStreakBonus {
  streak_days: number[];  // 连续天数阈值
  bonus_multiplier: number[]; // 对应奖励倍数
}

/**
 * 经验值参数配置
 */
export const EXPERIENCE_PARAMS: ExperienceParams = {
  max_total_experience: 1000,  // 最大1000点经验值
  score_to_exp_ratio: 1,       // 1分=1点经验值
  daily_streak_bonus: {
    streak_days: [3, 7, 14, 30], // 连续3/7/14/30天
    bonus_multiplier: [1.5, 2, 3, 5] // 对应倍数
  }
};

// ===== 经验值状态 =====

/**
 * 单条经验值记录
 */
export interface ExperienceRecord {
  source: ExperienceSource;
  value: number;
  timestamp?: number; // 获得时间戳
  context?: string;   // 上下文描述
}

/**
 * 玩家经验值状态
 */
export interface ExperienceState {
  total_experience: number;           // 总经验值
  experience_by_type: Record<ExperienceType, number>; // 各类型经验值
  unlocked_contents: UnlockContent[]; // 已解锁内容
  daily_checkin_status: DailyCheckinStatus; // 每日打卡状态
  achievement_unlocked: string[];     // 已解锁成就ID列表
}

/**
 * 每日打卡状态
 */
export interface DailyCheckinStatus {
  last_checkin_date: string | null;   // 最后打卡日期
  current_streak: number;             // 连续天数
  total_checkins: number;             // 总打卡次数
}

/**
 * 每天的毫秒数常量
 */
export const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ===== 辅助函数 =====

/**
 * 获取经验值类型配置
 */
export function getExperienceTypeConfig(typeId: ExperienceType): ExperienceTypeConfig | undefined {
  return EXPERIENCE_TYPES.find(t => t.id === typeId);
}

/**
 * 获取经验值来源配置
 */
export function getExperienceSourceConfig(sourceId: ExperienceSource): ExperienceSourceConfig | undefined {
  return EXPERIENCE_SOURCES.find(s => s.id === sourceId);
}

/**
 * 获取解锁内容配置
 */
export function getUnlockContentConfig(contentId: UnlockContent): UnlockContentConfig | undefined {
  return UNLOCK_CONTENTS.find(c => c.id === contentId);
}

/**
 * 根据得分计算经验值
 */
export function calculateExperienceFromScore(score: number): number {
  // 限制得分在0-100范围内
  const normalizedScore = Math.max(0, Math.min(100, score));
  return normalizedScore * EXPERIENCE_PARAMS.score_to_exp_ratio;
}

/**
 * 根据线索数量计算经验值
 */
export function calculateExperienceFromClues(clueCount: number): number {
  const clueSource = getExperienceSourceConfig('clue_collected');
  return clueCount * (clueSource?.per_clue_value || 10);
}

/**
 * 根据任务完成计算经验值
 */
export function calculateExperienceFromTask(): number {
  const taskSource = getExperienceSourceConfig('task_completion');
  return taskSource?.base_value || 50;
}

/**
 * 计算每日打卡奖励（考虑连续天数）
 */
export function calculateDailyCheckinBonus(streak: number): number {
  const dailySource = getExperienceSourceConfig('daily_checkin');
  const baseBonus = dailySource?.daily_bonus || 20;
  const streakConfig = EXPERIENCE_PARAMS.daily_streak_bonus;

  // 根据连续天数计算倍数
  let multiplier = 1;
  for (let i = streakConfig.streak_days.length - 1; i >= 0; i--) {
    if (streak >= streakConfig.streak_days[i]) {
      multiplier = streakConfig.bonus_multiplier[i];
      break;
    }
  }

  return Math.floor(baseBonus * multiplier);
}

/**
 * 根据成就ID计算奖励
 */
export function calculateAchievementBonus(achievementId: string): number {
  const achievementSource = getExperienceSourceConfig('achievement');
  const bonus = achievementSource?.achievement_bonuses?.find(
    b => b.achievement_id === achievementId
  );
  return bonus?.bonus_value || 0;
}

/**
 * 计算总经验值
 */
export function calculateTotalExperience(records: ExperienceRecord[]): number {
  return records.reduce((sum, record) => sum + record.value, 0);
}

/**
 * 检查解锁条件
 */
export function checkUnlockRequirements(currentExperience: number, requiredExperience: number): boolean {
  return currentExperience >= requiredExperience;
}

/**
 * 获取当前经验值可解锁的内容
 */
export function getUnlockablesForExperience(currentExperience: number): UnlockContentConfig[] {
  return UNLOCK_CONTENTS.filter(content =>
    checkUnlockRequirements(currentExperience, content.required_experience)
  );
}

/**
 * 初始化经验值状态
 */
export function initializeExperienceState(): ExperienceState {
  const experienceByType: Record<ExperienceType, number> = {
    learning: 0,
    practice: 0,
    exploration: 0
  };

  return {
    total_experience: 0,
    experience_by_type: experienceByType,
    unlocked_contents: [],
    daily_checkin_status: {
      last_checkin_date: null,
      current_streak: 0,
      total_checkins: 0
    },
    achievement_unlocked: []
  };
}

/**
 * 添加经验值并更新状态
 */
export function addExperience(
  state: ExperienceState,
  source: ExperienceSource,
  value: number,
  context?: string
): ExperienceState {
  const sourceConfig = getExperienceSourceConfig(source);
  const experienceType = sourceConfig?.experience_type || 'learning';

  // 计算新的解锁内容ID（不可变操作）
  const newUnlockables = getUnlockablesForExperience(
    Math.min(state.total_experience + value, EXPERIENCE_PARAMS.max_total_experience)
  );
  const newUnlockIds = newUnlockables
    .filter(content => !state.unlocked_contents.includes(content.id))
    .map(content => content.id);

  // 创建新的状态对象（遵循不可变性原则）
  const newState: ExperienceState = {
    ...state,
    total_experience: Math.min(
      state.total_experience + value,
      EXPERIENCE_PARAMS.max_total_experience
    ),
    experience_by_type: {
      ...state.experience_by_type,
      [experienceType]: state.experience_by_type[experienceType] + value
    },
    unlocked_contents: [...state.unlocked_contents, ...newUnlockIds]
  };

  return newState;
}

/**
 * 检查打卡状态并更新
 */
export function checkAndUpdateDailyCheckin(state: ExperienceState): {
  newState: ExperienceState;
  bonus: number;
  isNewCheckin: boolean;
} {
  const today = new Date().toISOString().split('T')[0];
  const lastCheckin = state.daily_checkin_status.last_checkin_date;

  // 如果今天已经打卡，返回原状态
  if (lastCheckin === today) {
    return {
      newState: state,
      bonus: 0,
      isNewCheckin: false
    };
  }

  // 计算连续天数
  let newStreak = 1;
  if (lastCheckin) {
    const lastDate = new Date(lastCheckin);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / MS_PER_DAY);
    if (diffDays === 1) {
      newStreak = state.daily_checkin_status.current_streak + 1;
    }
  }

  // 计算奖励
  const bonus = calculateDailyCheckinBonus(newStreak);

  // 创建新状态
  const newState: ExperienceState = {
    ...state,
    daily_checkin_status: {
      last_checkin_date: today,
      current_streak: newStreak,
      total_checkins: state.daily_checkin_status.total_checkins + 1
    }
  };

  // 添加经验值
  return {
    newState: addExperience(newState, 'daily_checkin', bonus, `连续${newStreak}天打卡`),
    bonus,
    isNewCheckin: true
  };
}