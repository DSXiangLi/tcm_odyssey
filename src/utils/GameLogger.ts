// src/utils/GameLogger.ts
import { EventBus, GameEvents, EventData } from '../systems/EventBus';

/**
 * 日志类别
 */
export type LogCategory = 'scene' | 'player' | 'interaction' | 'error';

/**
 * 日志条目
 */
export interface LogEntry {
  timestamp: number;
  category: LogCategory;
  event: string;
  data: EventData;
}

/**
 * 日志配置
 */
interface LoggerConfig {
  enabled: boolean;
  maxEntriesPerCategory: number;
}

/**
 * 事件到日志类别的映射
 */
const EventCategoryMap: Record<string, LogCategory> = {
  [GameEvents.SCENE_CREATE]: 'scene',
  [GameEvents.SCENE_READY]: 'scene',
  [GameEvents.SCENE_DESTROY]: 'scene',
  [GameEvents.SCENE_SWITCH]: 'scene',
  [GameEvents.PLAYER_MOVE]: 'player',
  [GameEvents.PLAYER_STOP]: 'player',
  [GameEvents.PLAYER_POSITION]: 'player',
  [GameEvents.PLAYER_COLLIDE]: 'player',
  [GameEvents.DOOR_INTERACT]: 'interaction',
  [GameEvents.ERROR]: 'error'
};

/**
 * GameLogger - 游戏日志收集器
 * 单例模式，监听EventBus事件并记录日志
 */
export class GameLogger {
  private static instance: GameLogger;
  private logs: Map<LogCategory, LogEntry[]>;
  private config: LoggerConfig;
  private unsubscribeFns: Array<() => void> = [];

  private constructor() {
    this.logs = new Map();
    this.config = {
      enabled: true,
      maxEntriesPerCategory: 1000
    };
    this.initializeCategories();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): GameLogger {
    if (!GameLogger.instance) {
      GameLogger.instance = new GameLogger();
    }
    return GameLogger.instance;
  }

  /**
   * 初始化日志类别
   */
  private initializeCategories(): void {
    const categories: LogCategory[] = ['scene', 'player', 'interaction', 'error'];
    categories.forEach(category => {
      this.logs.set(category, []);
    });
  }

  /**
   * 启动日志记录
   */
  start(): void {
    const eventBus = EventBus.getInstance();

    // 订阅所有事件
    Object.values(GameEvents).forEach(event => {
      const unsubscribe = eventBus.on(event, (data: EventData) => {
        this.log(event, data);
      });
      this.unsubscribeFns.push(unsubscribe);
    });

    console.log('[GameLogger] Started logging');
  }

  /**
   * 停止日志记录
   */
  stop(): void {
    this.unsubscribeFns.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFns = [];
    console.log('[GameLogger] Stopped logging');
  }

  /**
   * 记录日志
   */
  private log(event: string, data: EventData): void {
    if (!this.config.enabled) return;

    const category = EventCategoryMap[event] || 'error';
    const entry: LogEntry = {
      timestamp: Date.now(),
      category,
      event,
      data
    };

    const categoryLogs = this.logs.get(category);
    if (categoryLogs) {
      categoryLogs.push(entry);

      // 限制日志条目数量
      if (categoryLogs.length > this.config.maxEntriesPerCategory) {
        categoryLogs.shift();
      }
    }
  }

  /**
   * 获取指定类别的日志
   */
  getLogs(category?: LogCategory): LogEntry[] {
    if (category) {
      return this.logs.get(category) || [];
    }

    // 返回所有日志，按时间排序
    const allLogs: LogEntry[] = [];
    this.logs.forEach(categoryLogs => {
      allLogs.push(...categoryLogs);
    });
    return allLogs.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 获取最近的日志
   */
  getRecentLogs(count: number = 50, category?: LogCategory): LogEntry[] {
    const logs = this.getLogs(category);
    return logs.slice(-count);
  }

  /**
   * 清除日志
   */
  clearLogs(category?: LogCategory): void {
    if (category) {
      this.logs.set(category, []);
    } else {
      this.initializeCategories();
    }
  }

  /**
   * 格式化日志为字符串
   */
  formatLogs(category?: LogCategory): string {
    const logs = this.getLogs(category);
    return logs.map(entry => {
      const date = new Date(entry.timestamp).toISOString();
      return `[${date}] [${entry.category}] ${entry.event}: ${JSON.stringify(entry.data)}`;
    }).join('\n');
  }

  /**
   * 导出日志为JSON
   */
  exportLogs(): Record<LogCategory, LogEntry[]> {
    const result: Record<string, LogEntry[]> = {};
    this.logs.forEach((entries, category) => {
      result[category] = entries;
    });
    return result as Record<LogCategory, LogEntry[]>;
  }

  /**
   * 启用/禁用日志
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * 检查日志是否启用
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}