// src/systems/InventoryManager.ts
/**
 * 背包管理器
 *
 * 功能:
 * - 管理4类背包数据（药材/种子/工具/知识卡片）
 * - 提供物品增减接口
 * - 解锁检查（工具/知识卡片依赖Task完成）
 * - 药袋分类查询
 * - 与SaveManager集成（存档保存/恢复）
 * - EventBus事件触发（物品获取/消耗）
 *
 * Phase 2 S8.2 实现
 */

import { EventBus, EventData } from './EventBus';
import {
  HerbData,
  HerbBag,
  SeedData,
  ToolData,
  KnowledgeCardData,
  HERB_BAGS,
  TOOLS_DATA,
  KNOWLEDGE_CARDS_DATA,
  getHerbById,
  getHerbBagById,
  getSeedById,
  getToolById,
  getKnowledgeCardById,
  isToolUnlocked,
  isKnowledgeCardUnlocked
} from '../data/inventory-data';

// 背包数据结构
export interface InventoryState {
  herbs: Record<string, number>;      // 药材数量 { herb_id: quantity }
  seeds: Record<string, number>;       // 种子数量 { seed_id: quantity }
  tools: string[];                     // 已解锁工具ID列表
  knowledge_cards: string[];           // 已解锁知识卡片ID列表
}

// 物品变更记录
export interface ItemChangeRecord {
  item_id: string;
  item_type: 'herb' | 'seed' | 'tool' | 'knowledge_card';
  change: number;                      // 正数=增加，负数=减少
  reason: string;                      // 变更原因
  timestamp: string;
}

// InventoryManager配置
export interface InventoryManagerConfig {
  playerId: string;
  initialInventory?: Partial<InventoryState>;
}

// 导出数据格式（用于存档）
export interface InventoryExportData {
  player_id: string;
  last_updated: string;
  inventory: InventoryState;
  change_log: ItemChangeRecord[];
}

/**
 * 背包管理器类
 */
export class InventoryManager {
  private static instance: InventoryManager | null = null;

  private playerId: string;
  private eventBus: EventBus;

  // 背包数据
  private herbs: Record<string, number> = {};
  private seeds: Record<string, number> = {};
  private tools: string[] = [];
  private knowledgeCards: string[] = [];

  // 变更日志（用于追踪物品来源）
  private changeLog: ItemChangeRecord[] = [];

  // 已完成的Task列表（用于解锁判断）
  private completedTasks: string[] = [];

  // 事件监听器引用
  private taskCompleteListener: (data: EventData) => void;

  constructor(config: InventoryManagerConfig) {
    this.playerId = config.playerId;
    this.eventBus = EventBus.getInstance();

    // 初始化背包数据
    if (config.initialInventory) {
      this.herbs = config.initialInventory.herbs ?? {};
      this.seeds = config.initialInventory.seeds ?? {};
      this.tools = config.initialInventory.tools ?? [];
      this.knowledgeCards = config.initialInventory.knowledge_cards ?? [];
    }

    // 创建监听器
    this.taskCompleteListener = (data: EventData) => {
      const taskId = data.task_id as string;
      if (taskId) {
        this.completedTasks.push(taskId);
        this.checkUnlocks();
      }
    };

    // 注册事件监听
    this.registerEventListeners();
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: InventoryManagerConfig): InventoryManager {
    if (!InventoryManager.instance) {
      InventoryManager.instance = new InventoryManager(config ?? {
        playerId: 'player_001'
      });
      // 自动暴露到全局（供测试访问）
      InventoryManager.instance.exposeToWindow();
    }
    return InventoryManager.instance;
  }

  /**
   * 注册事件监听
   */
  private registerEventListeners(): void {
    // Task完成事件 → 触发解锁检查
    this.eventBus.on('task:complete', this.taskCompleteListener);
  }

  /**
   * 检查解锁（Task完成后检查工具/知识卡片是否解锁）
   */
  private checkUnlocks(): void {
    // 检查工具解锁
    TOOLS_DATA.forEach(tool => {
      if (!this.hasTool(tool.id) && isToolUnlocked(tool.id, this.completedTasks)) {
        this.unlockTool(tool.id, 'task_complete');
      }
    });

    // 检查知识卡片解锁
    KNOWLEDGE_CARDS_DATA.forEach(card => {
      if (!this.hasKnowledgeCard(card.id) && isKnowledgeCardUnlocked(card.id, this.completedTasks)) {
        this.unlockKnowledgeCard(card.id, 'task_complete');
      }
    });
  }

  // ===== 药材管理 =====

  /**
   * 添加药材
   */
  addHerb(herbId: string, quantity: number, reason: string = 'acquired'): void {
    const herb = getHerbById(herbId);
    if (!herb) {
      console.warn(`[InventoryManager] Unknown herb: ${herbId}`);
      return;
    }

    const current = this.herbs[herbId] ?? 0;
    this.herbs[herbId] = current + quantity;

    this.recordChange(herbId, 'herb', quantity, reason);
    this.emitItemEvent('item:acquire', {
      item_id: herbId,
      item_type: 'herb',
      item_name: herb.name,
      quantity,
      total: this.herbs[herbId],
      reason
    });
  }

  /**
   * 减少药材
   */
  removeHerb(herbId: string, quantity: number, reason: string = 'used'): boolean {
    const herb = getHerbById(herbId);
    if (!herb) {
      console.warn(`[InventoryManager] Unknown herb: ${herbId}`);
      return false;
    }

    const current = this.herbs[herbId] ?? 0;
    if (current < quantity) {
      console.warn(`[InventoryManager] Not enough ${herb.name}: have ${current}, need ${quantity}`);
      return false;
    }

    this.herbs[herbId] = current - quantity;

    // 如果数量为0，删除记录
    if (this.herbs[herbId] === 0) {
      delete this.herbs[herbId];
    }

    this.recordChange(herbId, 'herb', -quantity, reason);
    this.emitItemEvent('item:consume', {
      item_id: herbId,
      item_type: 'herb',
      item_name: herb.name,
      quantity,
      remaining: this.herbs[herbId] ?? 0,
      reason
    });

    return true;
  }

  /**
   * 获取药材数量
   */
  getHerbQuantity(herbId: string): number {
    return this.herbs[herbId] ?? 0;
  }

  /**
   * 检查是否有足够的药材
   */
  hasHerb(herbId: string, quantity: number = 1): boolean {
    return this.getHerbQuantity(herbId) >= quantity;
  }

  /**
   * 获取所有药材（带数量）
   */
  getAllHerbs(): { herb: HerbData; quantity: number }[] {
    return Object.entries(this.herbs)
      .map(([id, quantity]) => ({
        herb: getHerbById(id)!,
        quantity
      }))
      .filter(item => item.herb);
  }

  /**
   * 获取药袋内的药材
   */
  getHerbsInBag(bagId: string): { herb: HerbData; quantity: number }[] {
    const bag = getHerbBagById(bagId);
    if (!bag) return [];

    return bag.herbs
      .map(herbId => ({
        herb: getHerbById(herbId)!,
        quantity: this.herbs[herbId] ?? 0
      }))
      .filter(item => item.herb);
  }

  // ===== 种子管理 =====

  /**
   * 添加种子
   */
  addSeed(seedId: string, quantity: number, reason: string = 'acquired'): void {
    const seed = getSeedById(seedId);
    if (!seed) {
      console.warn(`[InventoryManager] Unknown seed: ${seedId}`);
      return;
    }

    const current = this.seeds[seedId] ?? 0;
    this.seeds[seedId] = current + quantity;

    this.recordChange(seedId, 'seed', quantity, reason);
    this.emitItemEvent('item:acquire', {
      item_id: seedId,
      item_type: 'seed',
      item_name: seed.name,
      quantity,
      total: this.seeds[seedId],
      reason
    });
  }

  /**
   * 减少种子
   */
  removeSeed(seedId: string, quantity: number, reason: string = 'planted'): boolean {
    const seed = getSeedById(seedId);
    if (!seed) {
      console.warn(`[InventoryManager] Unknown seed: ${seedId}`);
      return false;
    }

    const current = this.seeds[seedId] ?? 0;
    if (current < quantity) {
      console.warn(`[InventoryManager] Not enough ${seed.name}: have ${current}, need ${quantity}`);
      return false;
    }

    this.seeds[seedId] = current - quantity;
    if (this.seeds[seedId] === 0) {
      delete this.seeds[seedId];
    }

    this.recordChange(seedId, 'seed', -quantity, reason);
    this.emitItemEvent('item:consume', {
      item_id: seedId,
      item_type: 'seed',
      item_name: seed.name,
      quantity,
      remaining: this.seeds[seedId] ?? 0,
      reason
    });

    return true;
  }

  /**
   * 获取种子数量
   */
  getSeedQuantity(seedId: string): number {
    return this.seeds[seedId] ?? 0;
  }

  /**
   * 获取所有种子
   */
  getAllSeeds(): { seed: SeedData; quantity: number }[] {
    return Object.entries(this.seeds)
      .map(([id, quantity]) => ({
        seed: getSeedById(id)!,
        quantity
      }))
      .filter(item => item.seed);
  }

  // ===== 工具管理 =====

  /**
   * 解锁工具
   */
  unlockTool(toolId: string, reason: string = 'unlocked'): void {
    const tool = getToolById(toolId);
    if (!tool) {
      console.warn(`[InventoryManager] Unknown tool: ${toolId}`);
      return;
    }

    if (this.hasTool(toolId)) {
      console.log(`[InventoryManager] Tool ${tool.name} already unlocked`);
      return;
    }

    this.tools.push(toolId);
    this.recordChange(toolId, 'tool', 1, reason);
    this.emitItemEvent('tool:unlock', {
      item_id: toolId,
      item_type: 'tool',
      item_name: tool.name,
      reason
    });
  }

  /**
   * 检查是否拥有工具
   */
  hasTool(toolId: string): boolean {
    return this.tools.includes(toolId);
  }

  /**
   * 检查工具是否可用（解锁检查）
   */
  canUseTool(toolId: string): boolean {
    const tool = getToolById(toolId);
    if (!tool) return false;

    // 默认解锁的工具
    if (tool.unlock_condition === 'default') return true;

    // 需要Task解锁的工具
    return isToolUnlocked(toolId, this.completedTasks) || this.hasTool(toolId);
  }

  /**
   * 获取所有已解锁工具
   */
  getAllTools(): ToolData[] {
    return this.tools
      .map(id => getToolById(id))
      .filter((tool): tool is ToolData => tool !== undefined);
  }

  // ===== 知识卡片管理 =====

  /**
   * 解锁知识卡片
   */
  unlockKnowledgeCard(cardId: string, reason: string = 'unlocked'): void {
    const card = getKnowledgeCardById(cardId);
    if (!card) {
      console.warn(`[InventoryManager] Unknown knowledge card: ${cardId}`);
      return;
    }

    if (this.hasKnowledgeCard(cardId)) {
      console.log(`[InventoryManager] Knowledge card ${card.name} already unlocked`);
      return;
    }

    this.knowledgeCards.push(cardId);
    this.recordChange(cardId, 'knowledge_card', 1, reason);
    this.emitItemEvent('knowledge:unlock', {
      item_id: cardId,
      item_type: 'knowledge_card',
      item_name: card.name,
      reason
    });
  }

  /**
   * 检查是否拥有知识卡片
   */
  hasKnowledgeCard(cardId: string): boolean {
    return this.knowledgeCards.includes(cardId);
  }

  /**
   * 获取所有已解锁知识卡片
   */
  getAllKnowledgeCards(): KnowledgeCardData[] {
    return this.knowledgeCards
      .map(id => getKnowledgeCardById(id))
      .filter((card): card is KnowledgeCardData => card !== undefined);
  }

  // ===== 药袋查询 =====

  /**
   * 获取所有药袋（带药材数量统计）
   */
  getAllBags(): { bag: HerbBag; totalQuantity: number }[] {
    return HERB_BAGS.map(bag => {
      const herbsInBag = this.getHerbsInBag(bag.id);
      const totalQuantity = herbsInBag.reduce((sum, item) => sum + item.quantity, 0);
      return { bag, totalQuantity };
    });
  }

  /**
   * 获取非空药袋
   */
  getNonEmptyBags(): { bag: HerbBag; herbs: { herb: HerbData; quantity: number }[] }[] {
    return HERB_BAGS
      .map(bag => ({
        bag,
        herbs: this.getHerbsInBag(bag.id).filter(item => item.quantity > 0)
      }))
      .filter(item => item.herbs.length > 0);
  }

  // ===== 存档集成 =====

  /**
   * 导出数据（用于存档）
   */
  exportData(): InventoryExportData {
    return {
      player_id: this.playerId,
      last_updated: new Date().toISOString(),
      inventory: {
        herbs: { ...this.herbs },
        seeds: { ...this.seeds },
        tools: [...this.tools],
        knowledge_cards: [...this.knowledgeCards]
      },
      change_log: [...this.changeLog]
    };
  }

  /**
   * 导入数据（用于恢复存档）
   */
  importData(data: InventoryExportData): void {
    this.playerId = data.player_id;
    this.herbs = { ...data.inventory.herbs };
    this.seeds = { ...data.inventory.seeds };
    this.tools = [...data.inventory.tools];
    this.knowledgeCards = [...data.inventory.knowledge_cards];
    this.changeLog = data.change_log ? [...data.change_log] : [];

    console.log(`[InventoryManager] Imported inventory data for player ${this.playerId}`);
    this.emitItemEvent('inventory:restored', {
      herbs_count: Object.keys(this.herbs).length,
      seeds_count: Object.keys(this.seeds).length,
      tools_count: this.tools.length,
      cards_count: this.knowledgeCards.length
    });
  }

  /**
   * 获取当前状态（用于SaveManager）
   */
  getState(): InventoryState {
    return {
      herbs: { ...this.herbs },
      seeds: { ...this.seeds },
      tools: [...this.tools],
      knowledge_cards: [...this.knowledgeCards]
    };
  }

  /**
   * 设置已完成Task列表（用于解锁检查）
   */
  setCompletedTasks(tasks: string[]): void {
    this.completedTasks = [...tasks];
    this.checkUnlocks();
  }

  /**
   * 获取已完成Task列表
   */
  getCompletedTasks(): string[] {
    return [...this.completedTasks];
  }

  // ===== 辅助方法 =====

  /**
   * 记录物品变更
   */
  private recordChange(itemId: string, itemType: ItemChangeRecord['item_type'], change: number, reason: string): void {
    this.changeLog.push({
      item_id: itemId,
      item_type: itemType,
      change,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 发送物品事件
   */
  private emitItemEvent(event: string, data: EventData): void {
    this.eventBus.emit(event, data);
  }

  /**
   * 获取统计信息
   */
  getStatistics(): {
    total_herbs: number;
    unique_herbs: number;
    total_seeds: number;
    unique_seeds: number;
    tools_count: number;
    cards_count: number;
  } {
    return {
      total_herbs: Object.values(this.herbs).reduce((sum, q) => sum + q, 0),
      unique_herbs: Object.keys(this.herbs).length,
      total_seeds: Object.values(this.seeds).reduce((sum, q) => sum + q, 0),
      unique_seeds: Object.keys(this.seeds).length,
      tools_count: this.tools.length,
      cards_count: this.knowledgeCards.length
    };
  }

  /**
   * 清空背包（用于测试）
   */
  clear(): void {
    this.herbs = {};
    this.seeds = {};
    this.tools = [];
    this.knowledgeCards = [];
    this.changeLog = [];
    this.completedTasks = [];
  }

  /**
   * 暴露到全局（供测试访问）
   */
  exposeToWindow(): void {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__INVENTORY_MANAGER__ = this;
    }
  }

  /**
   * 重置单例（用于测试）
   */
  static resetInstance(): void {
    if (InventoryManager.instance) {
      InventoryManager.instance.destroy();
      InventoryManager.instance = null;
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.eventBus.off('task:complete', this.taskCompleteListener);
    this.clear();
    InventoryManager.instance = null;
  }
}

/**
 * 创建默认的背包管理器
 */
export function createInventoryManager(playerId: string = 'player_001'): InventoryManager {
  return InventoryManager.getInstance({
    playerId,
    initialInventory: {
      herbs: {},
      seeds: {},
      tools: ['sickle', 'water_bucket'],  // 默认解锁镰刀和水桶
      knowledge_cards: []
    }
  });
}