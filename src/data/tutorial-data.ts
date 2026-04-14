// src/data/tutorial-data.ts
/**
 * 新手引导数据定义
 *
 * Phase 2 S13.1 实现
 *
 * 内容:
 * - 引导步骤定义 (TutorialStep)
 * - 引导内容配置 (TutorialContent)
 * - 跳过选项配置 (SkipConfig)
 * - 场景分散提示定义 (SceneTip)
 */

// ===== 引导步骤类型 =====

/**
 * 引导步骤ID
 */
export type TutorialStepId = 'move' | 'interact' | 'bag';

/**
 * 引导阶段
 */
export type TutorialPhase = 'central' | 'scene_tips' | 'complete';

/**
 * 引导步骤配置
 */
export interface TutorialStepConfig {
  id: TutorialStepId;
  title: string;           // 步骤标题
  content: string;         // 步骤内容（提示文字）
  order: number;           // 显示顺序
  key_hint?: string;       // 按键提示（如"方向键/WASD"）
  icon?: string;           // 图标名称
}

/**
 * 集中引导步骤数据
 *
 * 在TitleScene"新游戏"后显示，可跳过
 */
export const TUTORIAL_STEPS: TutorialStepConfig[] = [
  {
    id: 'move',
    title: '移动控制',
    content: '使用方向键或WASD移动角色',
    order: 0,
    key_hint: '方向键 / WASD',
    icon: 'move_icon'
  },
  {
    id: 'interact',
    title: '交互操作',
    content: '走近NPC或物体后，按空格键进行交互',
    order: 1,
    key_hint: '空格键',
    icon: 'interact_icon'
  },
  {
    id: 'bag',
    title: '背包系统',
    content: '按B键打开背包，查看药材、种子等物品',
    order: 2,
    key_hint: 'B键',
    icon: 'bag_icon'
  }
];

// ===== 场景分散提示 =====

/**
 * 提示触发条件
 */
export type TipTriggerType = 'first_enter' | 'first_interact' | 'first_action';

/**
 * 场景提示配置
 */
export interface SceneTipConfig {
  scene_key: string;       // 场景名称（Phaser Scene key）
  content: string;         // 提示内容
  trigger: TipTriggerType; // 触发条件
  duration?: number;       // 显示时长（毫秒），默认3000
  position?: {             // 提示气泡位置
    x: number;
    y: number;
  };
}

/**
 * 场景分散提示数据
 *
 * 各场景首次进入时显示
 */
export const SCENE_TIPS: SceneTipConfig[] = [
  {
    scene_key: 'TownOutdoorScene',
    content: '这是百草镇，你将在这里学习中医知识，开始你的药灵之旅。',
    trigger: 'first_enter',
    duration: 4000,
    position: { x: 400, y: 200 }
  },
  {
    scene_key: 'ClinicScene',
    content: '进入诊所后可以与青木先生对话，他会指导你学习中医诊断。',
    trigger: 'first_enter',
    duration: 4000,
    position: { x: 300, y: 150 }
  },
  {
    scene_key: 'GardenScene',
    content: '药园可以种植药材，按G键打开种植界面进行种植操作。',
    trigger: 'first_enter',
    duration: 4000,
    position: { x: 350, y: 180 }
  },
  {
    scene_key: 'HomeScene',
    content: '这是你的家，可以休息、查看学习进度和存储物品。',
    trigger: 'first_enter',
    duration: 3500,
    position: { x: 300, y: 160 }
  }
];

// ===== 引导状态 =====

/**
 * 新手引导状态
 */
export interface TutorialState {
  phase: TutorialPhase;              // 当前阶段
  current_step: TutorialStepId | null; // 当前集中引导步骤
  completed_steps: TutorialStepId[];  // 已完成的集中引导步骤
  seen_scene_tips: string[];          // 已显示过的场景提示（scene_key列表）
  skipped: boolean;                   // 是否跳过集中引导
}

/**
 * 跳过引导配置
 */
export interface SkipTutorialConfig {
  allow_skip: boolean;       // 是否允许跳过
  skip_text: string;         // 跳过按钮文字
  confirm_text: string;      // 确认跳过提示文字
}

/**
 * 跳过引导配置
 */
export const SKIP_TUTORIAL_CONFIG: SkipTutorialConfig = {
  allow_skip: true,
  skip_text: '跳过引导',
  confirm_text: '跳过引导将直接进入游戏，你也可以随时在设置中查看操作指南。'
};

// ===== 辅助函数 =====

/**
 * 获取引导步骤配置
 */
export function getTutorialStep(stepId: TutorialStepId): TutorialStepConfig | undefined {
  return TUTORIAL_STEPS.find(s => s.id === stepId);
}

/**
 * 获取场景提示配置
 */
export function getSceneTip(sceneKey: string): SceneTipConfig | undefined {
  return SCENE_TIPS.find(t => t.scene_key === sceneKey);
}

/**
 * 获取下一个引导步骤
 */
export function getNextTutorialStep(currentStep: TutorialStepId): TutorialStepId | null {
  const currentOrder = TUTORIAL_STEPS.find(s => s.id === currentStep)?.order ?? -1;
  const nextStep = TUTORIAL_STEPS.find(s => s.order === currentOrder + 1);
  return nextStep?.id ?? null;
}

/**
 * 初始化引导状态
 */
export function initializeTutorialState(): TutorialState {
  return {
    phase: 'central',
    current_step: 'move',  // 第一个步骤
    completed_steps: [],
    seen_scene_tips: [],
    skipped: false
  };
}

/**
 * 检查引导是否完成
 */
export function isTutorialComplete(state: TutorialState): boolean {
  // 跳过视为完成
  if (state.skipped) return true;

  // 集中引导完成 + 场景提示阶段
  if (state.phase === 'complete') return true;

  // 所有集中引导步骤完成
  if (state.phase === 'scene_tips' &&
      state.completed_steps.length === TUTORIAL_STEPS.length) {
    return true;
  }

  return false;
}

/**
 * 检查场景提示是否已显示
 */
export function hasSeenSceneTip(state: TutorialState, sceneKey: string): boolean {
  return state.seen_scene_tips.includes(sceneKey);
}

/**
 * 标记引导步骤完成
 */
export function markTutorialStepComplete(
  state: TutorialState,
  stepId: TutorialStepId
): TutorialState {
  if (state.completed_steps.includes(stepId)) {
    return state;
  }

  const newCompletedSteps = [...state.completed_steps, stepId];
  const nextStep = getNextTutorialStep(stepId);

  // 检查是否所有集中引导完成
  const allStepsComplete = newCompletedSteps.length === TUTORIAL_STEPS.length;

  return {
    ...state,
    phase: allStepsComplete ? 'scene_tips' : state.phase,
    current_step: nextStep,
    completed_steps: newCompletedSteps
  };
}

/**
 * 标记场景提示已显示
 */
export function markSceneTipSeen(
  state: TutorialState,
  sceneKey: string
): TutorialState {
  if (state.seen_scene_tips.includes(sceneKey)) {
    return state;
  }

  const newSeenTips = [...state.seen_scene_tips, sceneKey];

  // 检查是否所有场景提示都已显示
  const allTipsSeen = SCENE_TIPS.every(t => newSeenTips.includes(t.scene_key));

  return {
    ...state,
    phase: allTipsSeen ? 'complete' : state.phase,
    seen_scene_tips: newSeenTips
  };
}

/**
 * 跳过集中引导
 */
export function skipCentralTutorial(state: TutorialState): TutorialState {
  return {
    ...state,
    phase: 'scene_tips',
    current_step: null,
    completed_steps: [],
    skipped: true
  };
}

/**
 * 导出引导状态到存档格式
 */
export function exportTutorialState(state: TutorialState): Record<string, unknown> {
  return {
    phase: state.phase,
    completed_steps: state.completed_steps,
    seen_scene_tips: state.seen_scene_tips,
    skipped: state.skipped
  };
}

/**
 * 从存档导入引导状态
 */
export function importTutorialState(data: Record<string, unknown>): TutorialState {
  return {
    phase: (data.phase as TutorialPhase) || 'central',
    current_step: (data.completed_steps as TutorialStepId[])?.length === TUTORIAL_STEPS.length
      ? null
      : getNextTutorialStep(
        (data.completed_steps as TutorialStepId[])?.[
          (data.completed_steps as TutorialStepId[])?.length - 1
        ] || 'move'
      ) || 'move',
    completed_steps: (data.completed_steps as TutorialStepId[]) || [],
    seen_scene_tips: (data.seen_scene_tips as string[]) || [],
    skipped: (data.skipped as boolean) || false
  };
}