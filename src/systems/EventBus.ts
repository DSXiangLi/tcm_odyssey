// src/systems/EventBus.ts

/**
 * 游戏事件类型定义
 */
export const GameEvents = {
  // 场景事件
  SCENE_CREATE: 'scene:create',
  SCENE_READY: 'scene:ready',
  SCENE_DESTROY: 'scene:destroy',
  SCENE_SWITCH: 'scene:switch',

  // 玩家事件
  PLAYER_MOVE: 'player:move',
  PLAYER_STOP: 'player:stop',
  PLAYER_POSITION: 'player:position',
  PLAYER_COLLIDE: 'player:collide',

  // 交互事件
  DOOR_INTERACT: 'door:interact',

  // NPC触发事件
  NPC_SCENE_ENTER: 'npc:scene_enter',
  NPC_NEARBY_DETECTED: 'npc:nearby_detected',
  NPC_DIALOG_SHOWN: 'npc:dialog_shown',
  NPC_DIALOG_HIDDEN: 'npc:dialog_hidden',
  NPC_USER_INPUT: 'npc:user_input',
  NPC_MINIGAME_TRIGGERED: 'npc:minigame_triggered',

  // 错误事件
  ERROR: 'game:error'
} as const;

export type GameEventType = typeof GameEvents[keyof typeof GameEvents];

/**
 * 事件数据类型
 */
export interface EventData {
  [key: string]: unknown;
}

/**
 * 事件监听器类型
 */
type EventListener = (data: EventData) => void;

/**
 * EventBus - 游戏事件总线
 * 单例模式，用于解耦游戏组件与日志系统
 */
export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventListener>>;
  private eventHistory: Array<{ event: string; data: EventData; timestamp: number }>;
  private maxHistorySize: number = 1000;

  private constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
  }

  /**
   * 获取单例实例
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 发射事件
   */
  emit(event: string, data: EventData = {}): void {
    // 记录事件历史
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now()
    });

    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // 通知所有监听器
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[EventBus] Error in listener for event "${event}":`, error);
        }
      });
    }
  }

  /**
   * 订阅事件
   */
  on(event: string, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // 返回取消订阅函数
    return () => this.off(event, listener);
  }

  /**
   * 取消订阅事件
   */
  off(event: string, listener: EventListener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 订阅一次性事件
   */
  once(event: string, listener: EventListener): () => void {
    const onceListener: EventListener = (data) => {
      this.off(event, onceListener);
      listener(data);
    };
    return this.on(event, onceListener);
  }

  /**
   * 清除所有监听器
   */
  clearAll(): void {
    this.listeners.clear();
    this.eventHistory = [];
  }

  /**
   * 获取事件历史
   */
  getEventHistory(eventFilter?: string): Array<{ event: string; data: EventData; timestamp: number }> {
    if (eventFilter) {
      return this.eventHistory.filter(e => e.event === eventFilter);
    }
    return [...this.eventHistory];
  }

  /**
   * 获取最近的事件
   */
  getRecentEvents(count: number = 10): Array<{ event: string; data: EventData; timestamp: number }> {
    return this.eventHistory.slice(-count);
  }

  /**
   * 检查是否有指定事件的监听器
   */
  hasListeners(event: string): boolean {
    const listeners = this.listeners.get(event);
    return listeners ? listeners.size > 0 : false;
  }

  /**
   * 重置单例（用于测试）
   */
  static resetInstance(): void {
    if (EventBus.instance) {
      EventBus.instance.clearAll();
    }
    EventBus.instance = null as any;
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.clearAll();
  }
}