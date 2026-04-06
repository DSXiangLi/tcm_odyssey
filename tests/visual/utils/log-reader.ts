// tests/visual/utils/log-reader.ts
import { Page } from '@playwright/test';

/**
 * 游戏日志
 */
export interface GameLog {
  timestamp: number;
  category: 'scene' | 'player' | 'interaction' | 'error';
  event: string;
  data: Record<string, unknown>;
}

/**
 * 日志读取器
 */
export class LogReader {
  /**
   * 从页面获取游戏日志
   */
  async getLogs(page: Page): Promise<GameLog[]> {
    return await page.evaluate(() => {
      const logger = (window as unknown as Record<string, unknown>).__GAME_LOGGER__;
      if (logger && typeof (logger as { exportLogs: () => GameLog[] }).exportLogs === 'function') {
        const logs = (logger as { exportLogs: () => Record<string, GameLog[]> }).exportLogs();
        // 合并所有类别的日志并按时间排序
        const allLogs: GameLog[] = [];
        Object.values(logs).forEach(categoryLogs => {
          allLogs.push(...categoryLogs);
        });
        return allLogs.sort((a, b) => a.timestamp - b.timestamp);
      }
      return [];
    });
  }

  /**
   * 按类别过滤日志
   */
  filterLogsByCategory(logs: GameLog[], category: string): GameLog[] {
    return logs.filter(log => log.category === category);
  }

  /**
   * 查找事件序列
   */
  findEventSequence(logs: GameLog[], eventName: string): GameLog[] {
    return logs.filter(log => log.event === eventName);
  }

  /**
   * 验证事件存在
   */
  verifyEventExists(logs: GameLog[], eventName: string): boolean {
    return logs.some(log => log.event === eventName);
  }

  /**
   * 验证事件序列
   */
  verifyEventSequence(logs: GameLog[], eventNames: string[]): boolean {
    let searchIndex = 0;
    for (const eventName of eventNames) {
      const found = logs.slice(searchIndex).find(log => log.event === eventName);
      if (!found) return false;
      searchIndex = logs.indexOf(found) + 1;
    }
    return true;
  }

  /**
   * 格式化日志为字符串
   */
  formatLogs(logs: GameLog[]): string {
    return logs.map(log => {
      const date = new Date(log.timestamp).toISOString();
      return `[${date}] [${log.category}] ${log.event}: ${JSON.stringify(log.data)}`;
    }).join('\n');
  }
}

export const logReader = new LogReader();