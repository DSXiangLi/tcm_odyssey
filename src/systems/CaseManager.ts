// src/systems/CaseManager.ts
/**
 * 病案管理器
 *
 * 功能:
 * - 管理病案列表和状态
 * - 处理blocked_by解锁逻辑（病案解锁依赖于学习任务完成）
 * - 保存病案历史记录
 * - 提供病案查询接口
 *
 * Phase 2 S5 实现
 */

import { SSEClient } from '../utils/sseClient';

// 病案定义类型（从core_cases.json映射）
export interface CaseDefinition {
  case_id: string;
  case_type: 'core' | 'free';
  blocked_by: string | null;  // Task ID，null表示自由解锁

  syndrome: {
    type: string;           // "风寒表实证"
    category: string;       // "风寒外感"
  };

  prescription: {
    name: string;           // "麻黄汤"
    alternatives: string[];
  };

  chief_complaint_template: string;

  clues: {
    required: string[];
    auxiliary: string[];
  };

  pulse: {
    position: string;
    tension: string;
    description: string;
  };

  tongue: {
    body_color: string;
    coating: string;
    shape: string;
    moisture: string;
  };

  difficulty: 'easy' | 'normal' | 'hard';

  teaching_notes: {
    key_points: string[];
    common_mistakes: string[];
  };
}

// 病案状态类型
export type CaseStatus = 'locked' | 'unlocked' | 'in_progress' | 'completed';

// 病案历史记录
export interface CaseHistoryRecord {
  case_id: string;
  completed_at: string;
  score: {
    total: number;
    inquiry: number;
    pulse: number;
    tongue: number;
    syndrome: number;
    prescription: number;
  };
  clues_collected: {
    required: string[];
    auxiliary: string[];
  };
  syndrome_reasoning: string;    // 辨证论述原文
  npc_feedback: string;          // NPC点评原文
}

// 病案状态信息
export interface CaseState {
  case_id: string;
  definition: CaseDefinition;
  status: CaseStatus;
  history?: CaseHistoryRecord;   // 完成后的历史记录
  in_progress_data?: {
    started_at: string;
    current_phase: string;       // 当前诊治环节
  };
}

// Task状态（用于解锁判断）
export interface TaskStatus {
  task_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
}

// CaseManager配置
export interface CaseManagerConfig {
  playerId: string;
  npcId: string;
}

// 病案库数据结构（用于本地存储）
export interface CaseLibraryData {
  player_id: string;
  last_updated: string;
  cases: CaseState[];
  history: CaseHistoryRecord[];
}

/**
 * 病案管理器类
 */
export class CaseManager {
  private playerId: string;
  private _npcId: string = 'qingmu';  // 默认NPC ID（内部使用）
  private sseClient: SSEClient;
  private caseDefinitions: Map<string, CaseDefinition> = new Map();
  private caseStates: Map<string, CaseState> = new Map();
  private caseHistory: CaseHistoryRecord[] = [];
  private taskStatuses: Map<string, TaskStatus> = new Map();

  constructor(config: CaseManagerConfig) {
    this.playerId = config.playerId;
    this._npcId = config.npcId;
    this.sseClient = new SSEClient();
  }

  /**
   * 获取NPC ID
   */
  get npcId(): string {
    return this._npcId;
  }

  /**
   * 加载病案定义（从JSON文件）
   */
  async loadCaseDefinitions(): Promise<void> {
    try {
      // 在浏览器环境中使用fetch加载
      const response = await fetch('/src/data/cases/core_cases.json');
      const data = await response.json();

      for (const caseDef of data.cases) {
        this.caseDefinitions.set(caseDef.case_id, caseDef);
      }

      console.log(`[CaseManager] Loaded ${this.caseDefinitions.size} case definitions`);
    } catch (error) {
      console.error('[CaseManager] Failed to load case definitions:', error);
      // 尝试使用内置数据作为fallback
      this.loadFallbackDefinitions();
    }
  }

  /**
   * 加载内置病案定义（fallback）
   */
  private loadFallbackDefinitions(): void {
    // 使用内置数据（与core_cases.json一致）
    const fallbackCases: CaseDefinition[] = [
      {
        case_id: 'case_001',
        case_type: 'core',
        blocked_by: 'mahuang-tang-learning',
        syndrome: { type: '风寒表实证', category: '风寒外感' },
        prescription: { name: '麻黄汤', alternatives: [] },
        chief_complaint_template: '昨天冒雨干活后怕冷发热无汗一天',
        clues: {
          required: ['恶寒重', '无汗', '发热轻', '脉浮紧'],
          auxiliary: ['身痛', '头痛', '起病原因', '口渴情况']
        },
        pulse: { position: '浮', tension: '紧', description: '脉来浮取即得，重按稍减，紧如转索' },
        tongue: { body_color: '淡红', coating: '薄白', shape: '正常', moisture: '润' },
        difficulty: 'easy',
        teaching_notes: {
          key_points: ['无汗是关键鉴别', '脉浮紧配合无汗确认表实'],
          common_mistakes: ['混淆表实与表虚', '忽视汗出情况']
        }
      },
      {
        case_id: 'case_002',
        case_type: 'core',
        blocked_by: 'guizhi-tang-learning',
        syndrome: { type: '风寒表虚证', category: '风寒外感' },
        prescription: { name: '桂枝汤', alternatives: [] },
        chief_complaint_template: '昨天吹风后怕风发热出汗一天',
        clues: {
          required: ['恶风', '有汗', '发热', '脉浮缓'],
          auxiliary: ['头痛', '鼻鸣干呕', '起病原因']
        },
        pulse: { position: '浮', tension: '缓', description: '脉来浮取即得，重按无力，缓如风吹' },
        tongue: { body_color: '淡红', coating: '薄白', shape: '正常', moisture: '润' },
        difficulty: 'easy',
        teaching_notes: {
          key_points: ['有汗是关键鉴别', '脉浮缓配合有汗确认表虚'],
          common_mistakes: ['混淆表虚与表实', '忽视汗出情况']
        }
      },
      {
        case_id: 'case_003',
        case_type: 'core',
        blocked_by: 'yin-qiao-san-learning',
        syndrome: { type: '风热犯卫证', category: '风热外感' },
        prescription: { name: '银翘散', alternatives: [] },
        chief_complaint_template: '昨天开始发热嗓子疼有点怕冷',
        clues: {
          required: ['发热重', '咽痛', '恶寒轻', '脉浮数'],
          auxiliary: ['口渴', '头痛', '咳嗽情况']
        },
        pulse: { position: '浮', tension: '数', description: '脉来浮取即得，一息六至以上' },
        tongue: { body_color: '红', coating: '薄黄', shape: '正常', moisture: '润' },
        difficulty: 'normal',
        teaching_notes: {
          key_points: ['咽痛明显是关键', '发热重恶寒轻'],
          common_mistakes: ['混淆风寒与风热', '忽视咽痛']
        }
      },
      {
        case_id: 'case_004',
        case_type: 'core',
        blocked_by: 'sang-ju-yin-learning',
        syndrome: { type: '风温咳嗽证', category: '风热外感' },
        prescription: { name: '桑菊饮', alternatives: [] },
        chief_complaint_template: '这两天咳嗽有点发热微恶风',
        clues: {
          required: ['咳嗽', '发热轻', '微恶风', '脉浮数'],
          auxiliary: ['咽痒', '口渴', '痰色']
        },
        pulse: { position: '浮', tension: '数', description: '脉来浮取即得，一息五六至' },
        tongue: { body_color: '淡红', coating: '薄黄', shape: '正常', moisture: '润' },
        difficulty: 'normal',
        teaching_notes: {
          key_points: ['咳嗽为主是关键', '发热轻'],
          common_mistakes: ['混淆银翘散与桑菊饮', '忽视咳嗽主症']
        }
      },
      // 自由练习病案（无解锁限制）
      {
        case_id: 'case_free_001',
        case_type: 'free',
        blocked_by: null,
        syndrome: { type: '风寒表实证', category: '风寒外感' },
        prescription: { name: '麻黄汤', alternatives: [] },
        chief_complaint_template: '练习病案：风寒表实基础练习',
        clues: {
          required: ['恶寒重', '无汗', '脉浮紧'],
          auxiliary: ['身痛']
        },
        pulse: { position: '浮', tension: '紧', description: '脉浮紧' },
        tongue: { body_color: '淡红', coating: '薄白', shape: '正常', moisture: '润' },
        difficulty: 'easy',
        teaching_notes: {
          key_points: ['基础练习'],
          common_mistakes: []
        }
      }
    ];

    for (const caseDef of fallbackCases) {
      this.caseDefinitions.set(caseDef.case_id, caseDef);
    }

    console.log(`[CaseManager] Loaded ${this.caseDefinitions.size} fallback case definitions`);
  }

  /**
   * 加载Task状态（从TASKS.json或存档）
   */
  async loadTaskStatuses(): Promise<void> {
    try {
      const response = await fetch('/hermes/npcs/qingmu/TASKS.json');
      const data = await response.json();

      for (const task of data.tasks) {
        this.taskStatuses.set(task.task_id, {
          task_id: task.task_id,
          status: task.status as 'pending' | 'in_progress' | 'completed',
          progress: task.progress
        });
      }

      console.log(`[CaseManager] Loaded ${this.taskStatuses.size} task statuses`);
    } catch (error) {
      console.warn('[CaseManager] Failed to load task statuses, using defaults:', error);
      // 使用默认状态（全部pending）
      this.loadFallbackTaskStatuses();
    }
  }

  /**
   * 加载内置Task状态（fallback）
   */
  private loadFallbackTaskStatuses(): void {
    const defaultTasks: TaskStatus[] = [
      { task_id: 'mahuang-tang-learning', status: 'pending', progress: 0 },
      { task_id: 'guizhi-tang-learning', status: 'pending', progress: 0 },
      { task_id: 'yin-qiao-san-learning', status: 'pending', progress: 0 },
      { task_id: 'sang-ju-yin-learning', status: 'pending', progress: 0 },
      { task_id: 'wind-cold-syndrome', status: 'pending', progress: 0 },
      { task_id: 'wind-heat-syndrome', status: 'pending', progress: 0 }
    ];

    for (const task of defaultTasks) {
      this.taskStatuses.set(task.task_id, task);
    }
  }

  /**
   * 加载病案历史（从存档）
   */
  async loadCaseHistory(): Promise<void> {
    try {
      const response = await fetch('/src/data/save.json');
      const data = await response.json();

      if (data.case_history) {
        this.caseHistory = data.case_history;
        console.log(`[CaseManager] Loaded ${this.caseHistory.length} case history records`);
      }
    } catch (error) {
      console.warn('[CaseManager] No saved case history found');
      this.caseHistory = [];
    }
  }

  /**
   * 初始化所有病案状态
   */
  async initialize(): Promise<void> {
    await this.loadCaseDefinitions();
    await this.loadTaskStatuses();
    await this.loadCaseHistory();

    // 初始化所有病案状态
    for (const [caseId, definition] of this.caseDefinitions) {
      const status = this.determineCaseStatus(caseId);
      const history = this.caseHistory.find(h => h.case_id === caseId);

      this.caseStates.set(caseId, {
        case_id: caseId,
        definition,
        status,
        history
      });
    }

    console.log(`[CaseManager] Initialized with ${this.caseStates.size} cases`);
  }

  /**
   * 判断病案解锁状态
   * blocked_by机制：病案解锁依赖于学习任务完成
   */
  determineCaseStatus(caseId: string): CaseStatus {
    const definition = this.caseDefinitions.get(caseId);
    if (!definition) {
      return 'locked';
    }

    // 自由病案（blocked_by = null）始终解锁
    if (definition.blocked_by === null) {
      // 检查是否有历史记录
      const history = this.caseHistory.find(h => h.case_id === caseId);
      return history ? 'completed' : 'unlocked';
    }

    // 检查blocked_by Task是否完成
    const taskStatus = this.taskStatuses.get(definition.blocked_by);
    if (!taskStatus) {
      console.warn(`[CaseManager] Task ${definition.blocked_by} not found for case ${caseId}`);
      return 'locked';
    }

    // Task已完成 → 病案解锁
    if (taskStatus.status === 'completed') {
      const history = this.caseHistory.find(h => h.case_id === caseId);
      return history ? 'completed' : 'unlocked';
    }

    // Task未完成 → 病案锁定
    return 'locked';
  }

  /**
   * 获取所有病案列表
   */
  getAllCases(): CaseState[] {
    return Array.from(this.caseStates.values());
  }

  /**
   * 获取单个病案状态
   */
  getCase(caseId: string): CaseState | undefined {
    return this.caseStates.get(caseId);
  }

  /**
   * 获取病案定义
   */
  getCaseDefinition(caseId: string): CaseDefinition | undefined {
    return this.caseDefinitions.get(caseId);
  }

  /**
   * 检查病案是否可开始诊治
   */
  canStartCase(caseId: string): boolean {
    const state = this.caseStates.get(caseId);
    if (!state) return false;
    return state.status === 'unlocked' || state.status === 'in_progress';
  }

  /**
   * 开始病案诊治
   */
  startCase(caseId: string): boolean {
    const state = this.caseStates.get(caseId);
    if (!state || !this.canStartCase(caseId)) {
      console.warn(`[CaseManager] Cannot start case ${caseId}`);
      return false;
    }

    // 更新状态为进行中
    state.status = 'in_progress';
    state.in_progress_data = {
      started_at: new Date().toISOString(),
      current_phase: 'inquiry'
    };

    console.log(`[CaseManager] Started case ${caseId}`);
    return true;
  }

  /**
   * 完成病案诊治
   */
  completeCase(caseId: string, record: CaseHistoryRecord): void {
    const state = this.caseStates.get(caseId);
    if (!state) return;

    // 更新状态为已完成
    state.status = 'completed';
    state.history = record;
    state.in_progress_data = undefined;

    // 添加到历史记录
    const existingIndex = this.caseHistory.findIndex(h => h.case_id === caseId);
    if (existingIndex >= 0) {
      this.caseHistory[existingIndex] = record;
    } else {
      this.caseHistory.push(record);
    }

    console.log(`[CaseManager] Completed case ${caseId} with score ${record.score.total}`);
  }

  /**
   * 获取病案历史
   */
  getCaseHistory(caseId?: string): CaseHistoryRecord[] {
    if (caseId) {
      return this.caseHistory.filter(h => h.case_id === caseId);
    }
    return this.caseHistory;
  }

  /**
   * 获取解锁条件描述
   */
  getUnlockCondition(caseId: string): string {
    const definition = this.caseDefinitions.get(caseId);
    if (!definition) return '未知病案';

    if (definition.blocked_by === null) {
      return '随时可练习';
    }

    const taskStatus = this.taskStatuses.get(definition.blocked_by);
    if (!taskStatus) {
      return `需要完成: ${definition.blocked_by}`;
    }

    if (taskStatus.status === 'completed') {
      return '已解锁';
    }

    const progressPercent = Math.round(taskStatus.progress * 100);
    return `需要完成: ${definition.blocked_by} (${progressPercent}%完成)`;
  }

  /**
   * 获取病案统计信息
   */
  getStatistics(): {
    total: number;
    locked: number;
    unlocked: number;
    in_progress: number;
    completed: number;
    average_score: number;
  } {
    const cases = this.getAllCases();
    let locked = 0;
    let unlocked = 0;
    let in_progress = 0;
    let completed = 0;
    let totalScore = 0;

    for (const caseState of cases) {
      switch (caseState.status) {
        case 'locked': locked++; break;
        case 'unlocked': unlocked++; break;
        case 'in_progress': in_progress++; break;
        case 'completed':
          completed++;
          if (caseState.history) {
            totalScore += caseState.history.score.total;
          }
          break;
      }
    }

    return {
      total: cases.length,
      locked,
      unlocked,
      in_progress,
      completed,
      average_score: completed > 0 ? Math.round(totalScore / completed) : 0
    };
  }

  /**
   * 更新Task状态（外部调用，用于解锁病案）
   */
  updateTaskStatus(taskId: string, status: 'pending' | 'in_progress' | 'completed', progress: number): void {
    this.taskStatuses.set(taskId, {
      task_id: taskId,
      status,
      progress
    });

    // 重新计算受影响的病案状态
    for (const [caseId, definition] of this.caseDefinitions) {
      if (definition.blocked_by === taskId) {
        const newStatus = this.determineCaseStatus(caseId);
        const state = this.caseStates.get(caseId);
        if (state) {
          state.status = newStatus;
          console.log(`[CaseManager] Case ${caseId} status updated to ${newStatus}`);
        }
      }
    }
  }

  /**
   * 导出病案数据（用于存档）
   */
  exportData(): CaseLibraryData {
    return {
      player_id: this.playerId,
      last_updated: new Date().toISOString(),
      cases: this.getAllCases(),
      history: this.caseHistory
    };
  }

  /**
   * 导入病案数据（用于恢复存档）
   */
  importData(data: CaseLibraryData): void {
    this.caseHistory = data.history || [];

    for (const caseState of data.cases) {
      this.caseStates.set(caseState.case_id, caseState);
    }

    console.log(`[CaseManager] Imported ${data.cases.length} cases and ${data.history.length} history records`);
  }

  /**
   * 检查Hermes服务是否可用
   */
  async checkConnection(): Promise<boolean> {
    return this.sseClient.checkConnection();
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.caseDefinitions.clear();
    this.caseStates.clear();
    this.caseHistory = [];
    this.taskStatuses.clear();
  }
}

/**
 * 创建默认的病案管理器
 */
export function createCaseManager(playerId: string = 'player_001', npcId: string = 'qingmu'): CaseManager {
  return new CaseManager({ playerId, npcId });
}