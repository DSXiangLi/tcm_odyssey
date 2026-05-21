// src/systems/NPCHeartbeat.ts
/**
 * NPC心跳检查机制
 *
 * 功能：在特定时机预查询玩家状态并缓存到GameStateBridge
 * 触发时机：
 * - 进入诊所场景时（ClinicScene.create）
 * - 对话开始前（由DialogUI调用）
 */

import { GameStateBridge } from '../utils/GameStateBridge';

export class NPCHeartbeat {
  private static instance: NPCHeartbeat;
  private gameStateBridge: GameStateBridge;

  // 上次心跳时间（避免频繁调用）
  private lastHeartbeatTime: number = 0;
  private heartbeatInterval: number = 30000;  // 30秒间隔

  private constructor() {
    this.gameStateBridge = GameStateBridge.getInstance();
  }

  static getInstance(): NPCHeartbeat {
    if (!NPCHeartbeat.instance) {
      NPCHeartbeat.instance = new NPCHeartbeat();
    }
    return NPCHeartbeat.instance;
  }

  /**
   * 场景进入时触发心跳检查
   *
   * 实现：预查询+静默缓存机制
   * - 调用InventoryManager获取背包数据
   * - 缓存到GameStateBridge，供后续DialogUI读取
   *
   * @param playerId 玩家ID
   */
  triggerOnSceneEnter(playerId: string): void {
    const now = Date.now();
    if (now - this.lastHeartbeatTime < this.heartbeatInterval) {
      return; // 避免频繁调用
    }

    this.lastHeartbeatTime = now;

    // 获取实时数据（从InventoryManager/CaseManager）
    this.fetchAndCacheData(playerId);
  }

  /**
   * 对话开始时触发（由DialogUI调用）
   *
   * @param playerId 玩家ID
   */
  triggerOnDialogStart(playerId: string): void {
    // 对话开始时，检查缓存是否有效
    const cachedProgress = this.gameStateBridge.getProgressCache();
    if (!cachedProgress) {
      // 缓存无效，重新获取
      this.fetchAndCacheData(playerId);
    }
  }

  /**
   * 获取数据并缓存
   */
  private fetchAndCacheData(_playerId: string): void {
    // 从InventoryManager获取背包数据
    const inventoryData = this.getInventoryFromManager();
    if (inventoryData) {
      this.gameStateBridge.updateInventoryCache(inventoryData);
    }

    // 进度数据（从CaseManager或TASKS.json）
    const progressData = this.getProgressFromManager();
    if (progressData) {
      this.gameStateBridge.updateProgressCache(progressData);
    }

    // NPC记忆（从对话历史）
    const memoryData = this.getNpcMemoryFromBridge();
    if (memoryData) {
      this.gameStateBridge.updateNpcMemoryCache(memoryData);
    }
  }

  /**
   * 从InventoryManager获取背包数据
   */
  private getInventoryFromManager(): Record<string, unknown> | null {
    // 尝试从全局获取（测试环境可能不存在）
    const inventoryManager = (window as unknown as { __INVENTORY_MANAGER__?: { exportData: () => Record<string, unknown> } }).__INVENTORY_MANAGER__;
    if (inventoryManager && inventoryManager.exportData) {
      return inventoryManager.exportData();
    }
    return null;
  }

  /**
   * 从CaseManager获取进度数据
   */
  private getProgressFromManager(): Record<string, unknown> | null {
    const caseManager = (window as unknown as { __CASE_MANAGER__?: { getStatistics: () => Record<string, unknown> } }).__CASE_MANAGER__;
    if (caseManager && caseManager.getStatistics) {
      return caseManager.getStatistics();
    }
    return null;
  }

  /**
   * 从GameStateBridge获取NPC记忆
   */
  private getNpcMemoryFromBridge(): Record<string, unknown> | null {
    // 对话历史已在GameStateBridge中存储
    return null; // 后续实现
  }

  /**
   * 销毁
   */
  destroy(): void {
    NPCHeartbeat.instance = null as unknown as NPCHeartbeat;
  }
}