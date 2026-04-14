// src/systems/SaveManager.ts
/**
 * 存档管理器
 *
 * 功能:
 * - 手动存档功能
 * - 自动存档功能（关键节点触发）
 * - 存档加载功能
 * - 多存档槽位管理（3个存档槽）
 * - 存档版本管理
 * - Hermes TASKS.json同步
 *
 * Phase 2 S7 实现
 */

import { EventBus, EventData } from './EventBus';
import { GameStateBridge, PlayerState } from '../utils/GameStateBridge';
import { CaseManager, CaseHistoryRecord } from './CaseManager';
import { ExperienceManager } from './ExperienceManager';
import { initializeExperienceState, type ExperienceState } from '../data/experience-data';

// 存档版本
const SAVE_VERSION = '3.0.0';

// 存档槽位数量
const MAX_SAVE_SLOTS = 3;

// 玩家属性存档
export interface PlayerSaveData {
  experience: number;
  unlocked_features: string[];
  achievements: string[];
}

// 背包数据存档
export interface InventorySaveData {
  herbs: Record<string, number>;      // { herb_id: quantity }
  seeds: Record<string, number>;       // { seed_id: quantity }
  tools: string[];                     // 工具ID列表
  knowledge_cards: string[];           // 知识卡片ID列表
}

// Task进度存档（从Hermes同步）
export interface TaskProgressSaveData {
  npc_id: string;
  tasks: {
    task_id: string;
    status: 'pending' | 'in_progress' | 'completed';
    progress: number;
    todos: {
      id: string;
      mastery: number;
      status: 'pending' | 'in_progress' | 'completed';
    }[];
  }[];
}

// 场景状态存档
export interface SceneStateSaveData {
  current_scene: string;
  player_position: {
    x: number;
    y: number;
  };
}

// 完整存档数据结构
export interface SaveData {
  save_version: string;
  saved_at: string;
  slot_id: number;

  // 玩家属性
  player: PlayerSaveData;

  // 背包数据
  inventory: InventorySaveData;

  // Task进度（从Hermes同步）
  tasks: TaskProgressSaveData[];

  // 病案历史
  case_history: CaseHistoryRecord[];

  // 场景状态
  scene_state: SceneStateSaveData;

  // 经验值状态 (Phase 2 S12.3)
  experience: ExperienceState;

  // 游戏设置
  settings: {
    music_volume: number;
    sfx_volume: number;
    language: string;
  };
}

// 存档槽位信息
export interface SaveSlotInfo {
  slot_id: number;
  exists: boolean;
  saved_at: string | null;
  player_experience: number;
  current_scene: string;
  completed_cases: number;
}

// 存档触发类型
export type SaveTriggerType =
  | 'manual'           // 手动存档
  | 'exit'             // 退出时自动存档
  | 'task_complete'    // Task完成时
  | 'case_complete'    // 病案完成时
  | 'scene_change'     // 场景切换时
  | 'item_acquire';    // 获得物品时

// 存档管理器配置
export interface SaveManagerConfig {
  playerId: string;
  autoSaveEnabled: boolean;
  maxSlots: number;
}

/**
 * 存档管理器类
 */
export class SaveManager {
  private static instance: SaveManager | null = null;

  private playerId: string;
  private autoSaveEnabled: boolean = true;
  private maxSlots: number = MAX_SAVE_SLOTS;

  private eventBus: EventBus;
  private gameStateBridge: GameStateBridge;
  private caseManager: CaseManager | null = null;

  private currentSlot: number = 1;  // 当前使用的存档槽位
  private lastAutoSaveTime: number = 0;
  private autoSaveInterval: number = 60000;  // 自动存档间隔（毫秒）

  private saveDataCache: Map<number, SaveData> = new Map();

  // 事件监听器引用（用于移除监听）
  private taskCompleteListener: (data: EventData) => void;
  private caseCompleteListener: (data: EventData) => void;
  private sceneChangeListener: (data: EventData) => void;
  private itemAcquireListener: (data: EventData) => void;

  constructor(config: SaveManagerConfig) {
    this.playerId = config.playerId;
    this.autoSaveEnabled = config.autoSaveEnabled ?? true;
    this.maxSlots = config.maxSlots ?? MAX_SAVE_SLOTS;

    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    // 创建监听器函数
    this.taskCompleteListener = (data: EventData) => {
      this.autoSave('task_complete', `Task ${data.task_id as string} completed`);
    };
    this.caseCompleteListener = (data: EventData) => {
      this.autoSave('case_complete', `Case ${data.case_id as string} completed with score ${data.score as number}`);
    };
    this.sceneChangeListener = (data: EventData) => {
      this.autoSave('scene_change', `Scene changed from ${data.from as string} to ${data.to as string}`);
    };
    this.itemAcquireListener = (data: EventData) => {
      this.autoSave('item_acquire', `Acquired ${data.quantity as number} ${data.item_id as string}`);
    };

    // 注册自动存档事件监听
    this.registerAutoSaveTriggers();
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: SaveManagerConfig): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager(config ?? {
        playerId: 'player_001',
        autoSaveEnabled: true,
        maxSlots: MAX_SAVE_SLOTS
      });
    }
    return SaveManager.instance;
  }

  /**
   * 设置病案管理器（用于存档时获取病案数据）
   */
  setCaseManager(caseManager: CaseManager): void {
    this.caseManager = caseManager;
  }

  /**
   * 注册自动存档触发事件
   */
  private registerAutoSaveTriggers(): void {
    // Task完成时自动存档
    this.eventBus.on('task:complete', this.taskCompleteListener);

    // 病案完成时自动存档
    this.eventBus.on('case:complete', this.caseCompleteListener);

    // 场景切换时自动存档
    this.eventBus.on('scene:change', this.sceneChangeListener);

    // 获得物品时自动存档
    this.eventBus.on('item:acquire', this.itemAcquireListener);
  }

  /**
   * 创建默认存档数据
   */
  createDefaultSaveData(slotId: number): SaveData {
    return {
      save_version: SAVE_VERSION,
      saved_at: new Date().toISOString(),
      slot_id: slotId,

      player: {
        experience: 0,
        unlocked_features: [],
        achievements: []
      },

      inventory: {
        herbs: {},
        seeds: {},
        tools: [],
        knowledge_cards: []
      },

      tasks: [],

      case_history: [],

      scene_state: {
        current_scene: 'TownOutdoorScene',
        player_position: { x: 47, y: 24 }  // 默认出生点
      },

      experience: initializeExperienceState(),

      settings: {
        music_volume: 0.8,
        sfx_volume: 0.8,
        language: 'zh-CN'
      }
    };
  }

  /**
   * 手动存档
   */
  async save(slotId: number = this.currentSlot): Promise<boolean> {
    try {
      console.log(`[SaveManager] Saving to slot ${slotId}...`);

      // 收集当前游戏状态
      const gameState = this.gameStateBridge.getState();
      const caseData = this.caseManager?.exportData();
      const experienceData = ExperienceManager.getInstance().exportData();

      // 构建存档数据
      const saveData: SaveData = {
        save_version: SAVE_VERSION,
        saved_at: new Date().toISOString(),
        slot_id: slotId,

        player: this.collectPlayerData(),
        inventory: this.collectInventoryData(),
        tasks: await this.collectTaskData(),
        case_history: caseData?.history ?? [],
        scene_state: {
          current_scene: gameState.currentScene || 'TownOutdoorScene',
          player_position: {
            x: gameState.player?.tileX ?? 47,
            y: gameState.player?.tileY ?? 24
          }
        },
        experience: experienceData,
        settings: this.collectSettingsData()
      };

      // 保存到localStorage（浏览器环境）
      this.saveToLocalStorage(slotId, saveData);

      // 同步到save.json文件（需要后端支持）
      await this.syncToSaveFile(slotId, saveData);

      // 更新缓存
      this.saveDataCache.set(slotId, saveData);

      // 发送存档成功事件
      this.eventBus.emit('save:success', {
        slot_id: slotId,
        trigger: 'manual',
        timestamp: Date.now()
      });

      console.log(`[SaveManager] Save successful to slot ${slotId}`);
      return true;
    } catch (error) {
      console.error('[SaveManager] Save failed:', error);

      this.eventBus.emit('save:failed', {
        slot_id: slotId,
        error: String(error)
      });

      return false;
    }
  }

  /**
   * 自动存档（静默执行，不阻塞游戏）
   */
  async autoSave(trigger: SaveTriggerType, reason: string): Promise<void> {
    // 检查自动存档是否启用
    if (!this.autoSaveEnabled) return;

    // 检查是否需要存档（避免频繁存档）
    const now = Date.now();
    if (now - this.lastAutoSaveTime < this.autoSaveInterval) {
      // 距离上次存档时间太短，跳过
      return;
    }

    this.lastAutoSaveTime = now;

    // 异步执行，不阻塞
    this.save(this.currentSlot).then(success => {
      if (success) {
        console.log(`[SaveManager] Auto-save triggered: ${trigger} - ${reason}`);
        this.eventBus.emit('save:auto', {
          trigger,
          reason,
          timestamp: now
        });
      }
    }).catch(error => {
      console.warn('[SaveManager] Auto-save failed (non-blocking):', error);
    });
  }

  /**
   * 加载存档
   */
  async load(slotId: number): Promise<SaveData | null> {
    try {
      console.log(`[SaveManager] Loading from slot ${slotId}...`);

      // 从localStorage读取
      const saveData = this.loadFromLocalStorage(slotId);

      if (!saveData) {
        console.warn(`[SaveManager] No save found in slot ${slotId}`);
        return null;
      }

      // 检查版本兼容性
      if (!this.checkVersionCompatibility(saveData.save_version)) {
        console.warn(`[SaveManager] Save version ${saveData.save_version} not compatible with current ${SAVE_VERSION}`);
        // 可以选择进行版本迁移或返回null
      }

      // 更新当前槽位
      this.currentSlot = slotId;

      // 恢复游戏状态
      await this.restoreGameState(saveData);

      // 发送加载成功事件
      this.eventBus.emit('save:loaded', {
        slot_id: slotId,
        saved_at: saveData.saved_at,
        timestamp: Date.now()
      });

      console.log(`[SaveManager] Load successful from slot ${slotId}`);
      return saveData;
    } catch (error) {
      console.error('[SaveManager] Load failed:', error);

      this.eventBus.emit('save:load_failed', {
        slot_id: slotId,
        error: String(error)
      });

      return null;
    }
  }

  /**
   * 恢复游戏状态
   */
  private async restoreGameState(saveData: SaveData): Promise<void> {
    // 1. 恢复场景状态
    this.gameStateBridge.updateCurrentScene(saveData.scene_state.current_scene);

    // 2. 恢复玩家位置（等待场景加载后执行）
    const playerState: PlayerState = {
      x: saveData.scene_state.player_position.x * 32,
      y: saveData.scene_state.player_position.y * 32,
      tileX: saveData.scene_state.player_position.x,
      tileY: saveData.scene_state.player_position.y,
      speed: 150,
      velocity: { x: 0, y: 0 }
    };

    // 发送恢复玩家位置事件（供场景处理）
    this.eventBus.emit('player:restore_position', {
      x: playerState.x,
      y: playerState.y,
      tileX: playerState.tileX,
      tileY: playerState.tileY,
      speed: playerState.speed,
      velocity: playerState.velocity
    });

    // 3. 恢复病案历史（如果有CaseManager）
    if (this.caseManager && saveData.case_history.length > 0) {
      this.caseManager.importData({
        player_id: this.playerId,
        last_updated: saveData.saved_at,
        cases: [],  // CaseManager会根据历史重建
        history: saveData.case_history
      });
    }

    // 4. 恢复经验值状态（Phase 2 S12.3）
    if (saveData.experience) {
      ExperienceManager.getInstance().importData(saveData.experience);
    } else {
      // 如果存档中没有经验值数据，使用默认状态
      ExperienceManager.getInstance().importData(initializeExperienceState());
    }

    // 5. 同步Task进度到Hermes
    await this.syncTaskDataToHermes(saveData.tasks);

    // 6. 发送恢复完成事件
    this.eventBus.emit('save:restored', {
      scene: saveData.scene_state.current_scene,
      position: saveData.scene_state.player_position,
      cases_completed: saveData.case_history.length,
      experience: saveData.experience?.total_experience ?? 0
    });
  }

  /**
   * 删除存档
   */
  async deleteSave(slotId: number): Promise<boolean> {
    try {
      // 从localStorage删除
      localStorage.removeItem(`save_slot_${slotId}`);

      // 清除缓存
      this.saveDataCache.delete(slotId);

      // 发送删除事件
      this.eventBus.emit('save:deleted', { slot_id: slotId });

      console.log(`[SaveManager] Deleted save slot ${slotId}`);
      return true;
    } catch (error) {
      console.error('[SaveManager] Delete failed:', error);
      return false;
    }
  }

  /**
   * 获取存档槽位列表
   */
  getSaveSlots(): SaveSlotInfo[] {
    const slots: SaveSlotInfo[] = [];

    for (let i = 1; i <= this.maxSlots; i++) {
      const saveData = this.loadFromLocalStorage(i);

      if (saveData) {
        slots.push({
          slot_id: i,
          exists: true,
          saved_at: saveData.saved_at,
          player_experience: saveData.player.experience,
          current_scene: saveData.scene_state.current_scene,
          completed_cases: saveData.case_history.length
        });
      } else {
        slots.push({
          slot_id: i,
          exists: false,
          saved_at: null,
          player_experience: 0,
          current_scene: '',
          completed_cases: 0
        });
      }
    }

    return slots;
  }

  /**
   * 检查是否有存档
   */
  hasAnySave(): boolean {
    for (let i = 1; i <= this.maxSlots; i++) {
      if (this.loadFromLocalStorage(i)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 获取最新存档
   */
  getLatestSave(): SaveSlotInfo | null {
    const slots = this.getSaveSlots();
    const existingSlots = slots.filter(s => s.exists);

    if (existingSlots.length === 0) return null;

    // 按时间排序，返回最新的
    existingSlots.sort((a, b) => {
      return new Date(b.saved_at!).getTime() - new Date(a.saved_at!).getTime();
    });

    return existingSlots[0];
  }

  /**
   * 设置当前存档槽位
   */
  setCurrentSlot(slotId: number): void {
    if (slotId >= 1 && slotId <= this.maxSlots) {
      this.currentSlot = slotId;
    }
  }

  /**
   * 获取当前存档槽位
   */
  getCurrentSlot(): number {
    return this.currentSlot;
  }

  // ===== 数据收集方法 =====

  /**
   * 收集玩家数据
   */
  private collectPlayerData(): PlayerSaveData {
    // 从全局状态或默认值获取
    const savedPlayer = this.loadFromLocalStorage(this.currentSlot)?.player;

    return {
      experience: savedPlayer?.experience ?? 0,
      unlocked_features: savedPlayer?.unlocked_features ?? [],
      achievements: savedPlayer?.achievements ?? []
    };
  }

  /**
   * 收集背包数据
   */
  private collectInventoryData(): InventorySaveData {
    // 从全局状态或默认值获取
    const savedInventory = this.loadFromLocalStorage(this.currentSlot)?.inventory;

    return {
      herbs: savedInventory?.herbs ?? {},
      seeds: savedInventory?.seeds ?? {},
      tools: savedInventory?.tools ?? [],
      knowledge_cards: savedInventory?.knowledge_cards ?? []
    };
  }

  /**
   * 收集Task数据（从Hermes TASKS.json）
   */
  private async collectTaskData(): Promise<TaskProgressSaveData[]> {
    try {
      // 尝试从Hermes读取TASKS.json
      const response = await fetch('/hermes/npcs/qingmu/TASKS.json');
      const data = await response.json();

      return [{
        npc_id: 'qingmu',
        tasks: data.tasks.map((task: any) => ({
          task_id: task.task_id,
          status: task.status,
          progress: task.progress,
          todos: task.todos?.map((todo: any) => ({
            id: todo.id,
            mastery: todo.mastery ?? 0,
            status: todo.status
          })) ?? []
        }))
      }];
    } catch (error) {
      console.warn('[SaveManager] Failed to fetch TASKS.json, using cached data');

      // 使用缓存的数据
      const savedTasks = this.loadFromLocalStorage(this.currentSlot)?.tasks;
      return savedTasks ?? [];
    }
  }

  /**
   * 收集设置数据
   */
  private collectSettingsData(): { music_volume: number; sfx_volume: number; language: string } {
    const savedSettings = this.loadFromLocalStorage(this.currentSlot)?.settings;

    return {
      music_volume: savedSettings?.music_volume ?? 0.8,
      sfx_volume: savedSettings?.sfx_volume ?? 0.8,
      language: savedSettings?.language ?? 'zh-CN'
    };
  }

  // ===== 存储方法 =====

  /**
   * 保存到localStorage
   */
  private saveToLocalStorage(slotId: number, saveData: SaveData): void {
    const key = `save_slot_${slotId}`;
    localStorage.setItem(key, JSON.stringify(saveData));
  }

  /**
   * 从localStorage加载
   */
  private loadFromLocalStorage(slotId: number): SaveData | null {
    const key = `save_slot_${slotId}`;
    const data = localStorage.getItem(key);

    if (!data) return null;

    try {
      return JSON.parse(data) as SaveData;
    } catch {
      return null;
    }
  }

  /**
   * 同步到save.json文件（通过API）
   */
  private async syncToSaveFile(slotId: number, saveData: SaveData): Promise<void> {
    // 在浏览器环境中，通过API将存档同步到服务器端文件
    // 这里使用localStorage作为主要存储，save.json作为备份
    try {
      // 检查是否有API支持
      const apiAvailable = await this.checkApiAvailable();

      if (apiAvailable) {
        await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot_id: slotId, data: saveData })
        });
      }
    } catch (error) {
      // 静默失败，不影响游戏运行
      console.warn('[SaveManager] Failed to sync to save.json:', error);
    }
  }

  /**
   * 同步Task数据到Hermes
   */
  private async syncTaskDataToHermes(tasks: TaskProgressSaveData[]): Promise<void> {
    try {
      const apiAvailable = await this.checkApiAvailable();

      if (apiAvailable) {
        await fetch('/api/tasks/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tasks })
        });
      }
    } catch (error) {
      console.warn('[SaveManager] Failed to sync tasks to Hermes:', error);
    }
  }

  /**
   * 检查API是否可用
   */
  private async checkApiAvailable(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 检查版本兼容性
   */
  private checkVersionCompatibility(savedVersion: string): boolean {
    // 简单版本检查：主版本号匹配
    const savedMajor = savedVersion.split('.')[0];
    const currentMajor = SAVE_VERSION.split('.')[0];

    return savedMajor === currentMajor;
  }

  /**
   * 退出时自动存档
   */
  async saveOnExit(): Promise<void> {
    console.log('[SaveManager] Saving on exit...');

    // 强制等待存档完成（退出前必须完成）
    await this.save(this.currentSlot);

    // 发送退出存档事件
    this.eventBus.emit('save:exit_complete', {
      slot_id: this.currentSlot,
      timestamp: Date.now()
    });
  }

  /**
   * 暴露存档数据到全局（供测试访问）
   */
  exposeToWindow(): void {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__SAVE_MANAGER__ = this;
      (window as unknown as Record<string, unknown>).__SAVE_SLOTS__ = () => this.getSaveSlots();
      (window as unknown as Record<string, unknown>).__CURRENT_SAVE__ = () => this.loadFromLocalStorage(this.currentSlot);
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    // 取消事件监听（使用存储的监听器引用）
    this.eventBus.off('task:complete', this.taskCompleteListener);
    this.eventBus.off('case:complete', this.caseCompleteListener);
    this.eventBus.off('scene:change', this.sceneChangeListener);
    this.eventBus.off('item:acquire', this.itemAcquireListener);

    // 清除缓存
    this.saveDataCache.clear();

    SaveManager.instance = null;
  }
}

/**
 * 创建默认的存档管理器
 */
export function createSaveManager(playerId: string = 'player_001'): SaveManager {
  return SaveManager.getInstance({
    playerId,
    autoSaveEnabled: true,
    maxSlots: MAX_SAVE_SLOTS
  });
}