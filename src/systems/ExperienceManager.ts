// src/systems/ExperienceManager.ts
/**
 * 经验值管理系统
 *
 * Phase 2 S12.2 实现
 *
 * 功能:
 * - 经验值增减管理
 * - 解锁检查
 * - 事件发布
 * - SaveManager集成
 */

import { EventBus, EventData } from './EventBus';
import {
  calculateExperienceFromScore,
  calculateExperienceFromClues,
  calculateExperienceFromTask,
  calculateDailyCheckinBonus,
  calculateAchievementBonus,
  getUnlockablesForExperience,
  initializeExperienceState,
  EXPERIENCE_PARAMS,
  type ExperienceState,
  type ExperienceType,
  type ExperienceSource,
  type UnlockContent
} from '../data/experience-data';

/**
 * 经验值事件类型
 */
export enum ExperienceEvent {
  EXPERIENCE_ADDED = 'experience:added',
  CONTENT_UNLOCKED = 'experience:content_unlocked',
  DAILY_CHECKIN = 'experience:daily_checkin',
  EXPERIENCE_CAPPED = 'experience:capped',
  STATE_RESET = 'experience:reset'
}

/**
 * 经验值管理器配置
 */
export interface ExperienceManagerConfig {
  maxExperience?: number;        // 最大经验值上限
  autoCheckUnlockables?: boolean; // 添加经验时自动检查解锁
}

/**
 * 每日打卡结果
 */
export interface DailyCheckinResult {
  isNewCheckin: boolean;
  bonus: number;
  streak: number;
}

/**
 * 经验值管理器
 *
 * 单例模式，管理整个经验值系统
 */
export class ExperienceManager {
  private static instance: ExperienceManager | null = null;

  private state: ExperienceState;
  private config: ExperienceManagerConfig;
  private eventBus: EventBus;

  /**
   * 获取单例实例
   */
  static getInstance(config?: ExperienceManagerConfig): ExperienceManager {
    if (!ExperienceManager.instance) {
      ExperienceManager.instance = new ExperienceManager(config);
    }
    return ExperienceManager.instance;
  }

  /**
   * 重置单例（用于测试）
   */
  static resetInstance(): void {
    if (ExperienceManager.instance) {
      ExperienceManager.instance.destroy();
      ExperienceManager.instance = null;
    }
  }

  private constructor(config?: ExperienceManagerConfig) {
    this.config = {
      maxExperience: EXPERIENCE_PARAMS.max_total_experience,
      autoCheckUnlockables: true,
      ...config
    };

    this.eventBus = EventBus.getInstance();
    this.state = initializeExperienceState();
  }

  /**
   * 获取当前状态
   */
  getState(): ExperienceState {
    // 返回不可变副本
    return {
      ...this.state,
      experience_by_type: { ...this.state.experience_by_type },
      unlocked_contents: [...this.state.unlocked_contents],
      achievement_unlocked: [...this.state.achievement_unlocked],
      daily_checkin_status: { ...this.state.daily_checkin_status }
    };
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.state = initializeExperienceState();
    this.eventBus.emit(ExperienceEvent.STATE_RESET, {} as EventData);
  }

  // ===== 经验值添加方法 =====

  /**
   * 从得分添加经验值
   */
  addExperienceFromScore(score: number): number {
    const value = calculateExperienceFromScore(score);
    return this.addExperience('case_score', value, { score });
  }

  /**
   * 从线索数量添加经验值
   */
  addExperienceFromClues(clueCount: number): number {
    const value = calculateExperienceFromClues(clueCount);
    return this.addExperience('clue_collected', value, { clue_count: clueCount });
  }

  /**
   * 从任务完成添加经验值
   */
  addExperienceFromTask(taskId: string): number {
    const value = calculateExperienceFromTask();
    return this.addExperience('task_completion', value, { task_id: taskId });
  }

  /**
   * 从成就解锁添加经验值
   */
  addExperienceFromAchievement(achievementId: string): number {
    // 检查是否已解锁该成就
    if (this.state.achievement_unlocked.includes(achievementId)) {
      console.warn(`[ExperienceManager] Achievement ${achievementId} already unlocked`);
      return 0;
    }

    const value = calculateAchievementBonus(achievementId);

    // 记录成就解锁
    this.state.achievement_unlocked.push(achievementId);

    return this.addExperience('achievement', value, { achievement_id: achievementId });
  }

  /**
   * 每日打卡
   */
  addDailyCheckin(): DailyCheckinResult {
    const today = new Date().toISOString().split('T')[0];
    const lastCheckin = this.state.daily_checkin_status.last_checkin_date;

    // 今天已打卡
    if (lastCheckin === today) {
      return {
        isNewCheckin: false,
        bonus: 0,
        streak: this.state.daily_checkin_status.current_streak
      };
    }

    // 计算连续天数
    let newStreak = 1;
    if (lastCheckin) {
      const lastDate = new Date(lastCheckin);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak = this.state.daily_checkin_status.current_streak + 1;
      }
    }

    // 计算奖励
    const bonus = calculateDailyCheckinBonus(newStreak);

    // 更新打卡状态
    this.state.daily_checkin_status = {
      last_checkin_date: today,
      current_streak: newStreak,
      total_checkins: this.state.daily_checkin_status.total_checkins + 1
    };

    // 添加经验值
    this.addExperience('daily_checkin', bonus, { streak: newStreak });

    // 发送打卡事件
    this.eventBus.emit(ExperienceEvent.DAILY_CHECKIN, {
      streak: newStreak,
      bonus,
      total_checkins: this.state.daily_checkin_status.total_checkins
    } as EventData);

    return {
      isNewCheckin: true,
      bonus,
      streak: newStreak
    };
  }

  /**
   * 核心添加经验值方法
   */
  private addExperience(
    source: ExperienceSource,
    value: number,
    context?: Record<string, unknown>
  ): number {
    if (value <= 0) return 0;

    // 获取来源配置
    const sourceConfig = this.getExperienceSourceConfig(source);
    const experienceType = sourceConfig?.experience_type || 'learning';

    // 计算实际添加值（考虑上限）
    const oldValue = this.state.total_experience;
    const newTotal = Math.min(
      this.state.total_experience + value,
      this.config.maxExperience || EXPERIENCE_PARAMS.max_total_experience
    );
    const actualValue = newTotal - oldValue;

    if (actualValue <= 0) {
      // 已达上限
      this.eventBus.emit(ExperienceEvent.EXPERIENCE_CAPPED, {
        attempted_value: value,
        current_total: this.state.total_experience,
        max: this.config.maxExperience
      } as EventData);
      return 0;
    }

    // 更新状态
    this.state.total_experience = newTotal;
    this.state.experience_by_type[experienceType] += actualValue;

    // 发送经验值添加事件
    this.eventBus.emit(ExperienceEvent.EXPERIENCE_ADDED, {
      source,
      value: actualValue,
      total: this.state.total_experience,
      type: experienceType,
      ...context
    } as EventData);

    // 自动检查解锁（如果启用）
    if (this.config.autoCheckUnlockables) {
      this.checkAndUnlockContents();
    }

    return actualValue;
  }

  // ===== 解锁检查方法 =====

  /**
   * 检查内容是否已解锁
   */
  isContentUnlocked(contentId: UnlockContent): boolean {
    return this.state.unlocked_contents.includes(contentId);
  }

  /**
   * 获取当前经验值可解锁的内容列表
   */
  getUnlockableContents(): ReturnType<typeof getUnlockablesForExperience> {
    return getUnlockablesForExperience(this.state.total_experience);
  }

  /**
   * 检查并解锁新内容
   */
  private checkAndUnlockContents(): UnlockContent[] {
    const unlockables = getUnlockablesForExperience(this.state.total_experience);
    const newlyUnlocked: UnlockContent[] = [];

    for (const content of unlockables) {
      if (!this.state.unlocked_contents.includes(content.id)) {
        this.state.unlocked_contents.push(content.id);
        newlyUnlocked.push(content.id);

        // 发送解锁事件
        this.eventBus.emit(ExperienceEvent.CONTENT_UNLOCKED, {
          content_id: content.id,
          content_name: content.name,
          required_experience: content.required_experience,
          current_experience: this.state.total_experience
        } as EventData);
      }
    }

    return newlyUnlocked;
  }

  /**
   * 手动检查是否有新解锁内容
   */
  checkForNewUnlocks(): UnlockContent[] {
    return this.checkAndUnlockContents();
  }

  // ===== SaveManager集成 =====

  /**
   * 导出数据（供SaveManager使用）
   */
  exportData(): ExperienceState {
    return this.getState();
  }

  /**
   * 导入数据（从SaveManager恢复）
   */
  importData(data: ExperienceState): void {
    this.state = {
      ...data,
      experience_by_type: { ...data.experience_by_type },
      unlocked_contents: [...data.unlocked_contents],
      achievement_unlocked: [...data.achievement_unlocked],
      daily_checkin_status: { ...data.daily_checkin_status }
    };

    // 确保所有字段存在
    if (!this.state.experience_by_type) {
      this.state.experience_by_type = {
        learning: 0,
        practice: 0,
        exploration: 0
      };
    }
    if (!this.state.unlocked_contents) {
      this.state.unlocked_contents = [];
    }
    if (!this.state.achievement_unlocked) {
      this.state.achievement_unlocked = [];
    }
    if (!this.state.daily_checkin_status) {
      this.state.daily_checkin_status = {
        last_checkin_date: null,
        current_streak: 0,
        total_checkins: 0
      };
    }
  }

  // ===== 辅助方法 =====

  /**
   * 获取经验值来源配置
   */
  private getExperienceSourceConfig(source: ExperienceSource): {
    experience_type: ExperienceType;
  } | undefined {
    const sourceTypeMap: Record<ExperienceSource, ExperienceType> = {
      task_completion: 'learning',
      case_score: 'practice',
      clue_collected: 'practice',
      daily_checkin: 'learning',
      achievement: 'exploration'
    };
    return { experience_type: sourceTypeMap[source] };
  }

  /**
   * 获取经验值进度百分比
   */
  getExperienceProgress(): number {
    const max = this.config.maxExperience || EXPERIENCE_PARAMS.max_total_experience;
    return Math.min(1, this.state.total_experience / max);
  }

  /**
   * 获取距离下一解锁需要的经验值
   */
  getExperienceToNextUnlock(): number | null {
    const unlockables = getUnlockablesForExperience(this.state.total_experience);

    // 找到第一个未解锁的内容
    for (const content of unlockables) {
      if (!this.state.unlocked_contents.includes(content.id)) {
        return content.required_experience - this.state.total_experience;
      }
    }

    // 所有可解锁内容都已解锁，返回null
    return null;
  }

  /**
   * 暴露到全局（供测试访问）
   */
  exposeToWindow(): void {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__EXPERIENCE_MANAGER__ = {
        getState: this.getState.bind(this),
        reset: this.reset.bind(this),
        addExperienceFromScore: this.addExperienceFromScore.bind(this),
        addExperienceFromClues: this.addExperienceFromClues.bind(this),
        addExperienceFromTask: this.addExperienceFromTask.bind(this),
        addExperienceFromAchievement: this.addExperienceFromAchievement.bind(this),
        addDailyCheckin: this.addDailyCheckin.bind(this),
        isContentUnlocked: this.isContentUnlocked.bind(this),
        getUnlockableContents: this.getUnlockableContents.bind(this),
        exportData: this.exportData.bind(this),
        importData: this.importData.bind(this),
        getExperienceProgress: this.getExperienceProgress.bind(this),
        getExperienceToNextUnlock: this.getExperienceToNextUnlock.bind(this)
      };
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.state = initializeExperienceState();
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__EXPERIENCE_MANAGER__ = undefined;
    }
  }
}