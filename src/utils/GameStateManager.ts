// src/utils/GameStateManager.ts
/**
 * 游戏状态管理器（单例）
 *
 * 功能：
 * - 统一管理player_id（从localStorage读取或默认值）
 * - 提供统一的API调用方法（自动添加player_id header）
 * - 提供pending_game任务查询
 * - 提供任务状态更新和完成接口
 *
 * Phase 2.5 任务驱动游戏触发系统
 */

export interface GameTaskConfig {
  task_id: string;
  title: string;
  game_type: string;
  game_config: string;
  reward?: string;
  status: string;
  created_at: string;
}

export interface CompleteTaskResult {
  success: boolean;
  status: string;
  task_id: string;
  score: number;
  reward_granted?: {
    herbs?: Array<{ herb_id: string; delta: number }>;
  };
}

export class GameStateManager {
  private static instance: GameStateManager;
  private playerId: string;
  private apiBaseUrl: string = 'http://localhost:8643';

  private constructor() {
    // 从localStorage读取player_id，如果没有则使用默认值
    this.playerId = localStorage.getItem('player_id') || 'player_001';
  }

  /**
   * 获取单例实例
   */
  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  /**
   * 获取当前玩家ID
   */
  getPlayerId(): string {
    return this.playerId;
  }

  /**
   * 设置玩家ID（登录后更新）
   */
  setPlayerId(playerId: string): void {
    this.playerId = playerId;
    localStorage.setItem('player_id', playerId);
  }

  /**
   * 统一的API调用方法
   * 自动添加Content-Type和X-Player-ID headers
   */
  async fetchAPI(endpoint: string, options?: RequestInit): Promise<Response> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Player-ID': this.playerId,
    };

    return fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    });
  }

  /**
   * 查询pending游戏任务
   */
  async getPendingGameTask(): Promise<GameTaskConfig | null> {
    try {
      const response = await this.fetchAPI(`/api/tasks/${this.playerId}/pending_game`);
      if (!response.ok) {
        console.error('[GameStateManager] getPendingGameTask failed:', response.status);
        return null;
      }

      const data = await response.json();
      return data.pending_game || null;
    } catch (error) {
      console.error('[GameStateManager] getPendingGameTask error:', error);
      return null;
    }
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId: string, status: string, progress?: number): Promise<void> {
    try {
      const response = await this.fetchAPI('/api/task/update', {
        method: 'POST',
        body: JSON.stringify({
          task_id: taskId,
          status: status,
          progress: progress,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[GameStateManager] updateTaskStatus failed:', error);
        throw new Error(error.detail?.message || 'Update failed');
      }
    } catch (error) {
      console.error('[GameStateManager] updateTaskStatus error:', error);
      throw error;
    }
  }

  /**
   * 完成任务并获取奖励（联合事务）
   */
  async completeTaskWithReward(taskId: string, score: number): Promise<CompleteTaskResult | null> {
    try {
      const response = await this.fetchAPI('/api/task/complete_with_reward', {
        method: 'POST',
        body: JSON.stringify({
          task_id: taskId,
          score: score,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[GameStateManager] completeTaskWithReward failed:', error);
        throw new Error(error.detail?.message || 'Complete failed');
      }

      return await response.json();
    } catch (error) {
      console.error('[GameStateManager] completeTaskWithReward error:', error);
      return null;
    }
  }

  /**
   * 获取API基础URL
   */
  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  /**
   * 设置API基础URL（测试用）
   */
  setApiBaseUrl(url: string): void {
    this.apiBaseUrl = url;
  }
}

/**
 * 导出单例获取函数（便捷访问）
 */
export function getGameStateManager(): GameStateManager {
  return GameStateManager.getInstance();
}