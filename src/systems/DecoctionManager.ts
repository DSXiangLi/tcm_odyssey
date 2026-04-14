// src/systems/DecoctionManager.ts
/**
 * 煎药管理系统
 *
 * Phase 2 S9.2 实现
 *
 * 功能:
 * - 煎药游戏状态管理
 * - 药材选择验证
 * - 配伍放置管理
 * - 顺序设置管理
 * - 煎煮过程控制
 * - 评分计算
 * - 事件发布
 */

import { EventBus, EventData } from './EventBus';
import {
  getDecoctionParams,
  getPrescriptionHerbs,
  calculateDecoctionScore,
  getFireLevelConfig,
  getDecoctionOrderConfig,
  type FireLevel,
  type DecoctionOrderType,
  type DecoctionPhase,
  type DecoctionState,
  type DecoctionScoreResult
} from '../data/decoction-data';
import { getHerbById } from '../data/inventory-data';
import { InventoryManager } from './InventoryManager';

/**
 * 煎药事件类型
 */
export enum DecoctionEvent {
  PRESCRIPTION_SELECTED = 'decoction:prescription_selected',
  HERB_ADDED = 'decoction:herb_added',
  HERB_REMOVED = 'decoction:herb_removed',
  ROLE_PLACED = 'decoction:role_placed',
  ORDER_SET = 'decoction:order_set',
  FIRE_SET = 'decoction:fire_set',
  PHASE_CHANGED = 'decoction:phase_changed',
  DECOCTION_STARTED = 'decoction:started',
  DECOCTION_TICK = 'decoction:tick',
  DECOCTION_COMPLETE = 'decoction:complete',
  SCORE_CALCULATED = 'decoction:score_calculated'
}

/**
 * 煎药管理器配置
 */
export interface DecoctionManagerConfig {
  autoConsumeHerbs?: boolean;  // 完成后是否自动消耗药材
  passThreshold?: number;      // 通过阈值 (默认60)
}

/**
 * 煎药管理器
 *
 * 单例模式，管理整个煎药游戏流程
 */
export class DecoctionManager {
  private static instance: DecoctionManager | null = null;

  private state: DecoctionState;
  private config: DecoctionManagerConfig;
  private eventBus: EventBus;
  private inventoryManager: InventoryManager;
  private decoctionTimer: number | null = null;
  // @ts-expect-error - startTime used for potential future time tracking features
  private startTime: number = 0;

  /**
   * 获取单例实例
   */
  static getInstance(config?: DecoctionManagerConfig): DecoctionManager {
    if (!DecoctionManager.instance) {
      DecoctionManager.instance = new DecoctionManager(config);
    }
    return DecoctionManager.instance;
  }

  /**
   * 重置单例（用于测试）
   */
  static resetInstance(): void {
    if (DecoctionManager.instance) {
      DecoctionManager.instance.destroy();
      DecoctionManager.instance = null;
    }
  }

  private constructor(config?: DecoctionManagerConfig) {
    this.config = {
      autoConsumeHerbs: true,
      passThreshold: 60,
      ...config
    };

    this.eventBus = EventBus.getInstance();
    this.inventoryManager = InventoryManager.getInstance();

    // 初始状态
    this.state = {
      phase: 'select_prescription',
      prescription_id: null,
      selected_herbs: [],
      compatibility_placement: new Map(),
      order_settings: new Map(),
      fire_level: 'wen',
      decoction_time: 0,
      target_time: 0
    };
  }

  /**
   * 获取当前状态
   */
  getState(): DecoctionState {
    return {
      ...this.state,
      compatibility_placement: new Map(this.state.compatibility_placement),
      order_settings: new Map(this.state.order_settings)
    };
  }

  /**
   * 获取当前阶段
   */
  getPhase(): DecoctionPhase {
    return this.state.phase;
  }

  /**
   * 选择方剂
   */
  selectPrescription(prescriptionId: string): boolean {
    const params = getDecoctionParams(prescriptionId);
    if (!params) {
      console.error(`[DecoctionManager] Invalid prescription: ${prescriptionId}`);
      return false;
    }

    // 重置状态
    this.state = {
      phase: 'select_prescription',
      prescription_id: prescriptionId,
      selected_herbs: [],
      compatibility_placement: new Map(),
      order_settings: new Map(),
      fire_level: params.default_fire,
      decoction_time: 0,
      target_time: params.total_time
    };

    // 设置默认顺序
    params.herb_params.forEach(param => {
      this.state.order_settings.set(param.herb_id, param.order);
    });

    this.eventBus.emit(DecoctionEvent.PRESCRIPTION_SELECTED, {
      prescription_id: prescriptionId,
      target_time: params.total_time,
      default_fire: params.default_fire
    });

    // 自动进入药材选择阶段
    this.changePhase('select_herbs');

    return true;
  }

  /**
   * 添加药材
   */
  addHerb(herbId: string): boolean {
    if (!this.state.prescription_id) {
      console.error('[DecoctionManager] No prescription selected');
      return false;
    }

    if (this.state.phase !== 'select_herbs') {
      console.error('[DecoctionManager] Not in herb selection phase');
      return false;
    }

    // 检查药材是否在方剂组成中
    const prescriptionHerbs = getPrescriptionHerbs(this.state.prescription_id);
    if (!prescriptionHerbs.includes(herbId)) {
      console.warn(`[DecoctionManager] Herb ${herbId} not in prescription`);
      // 允许添加多余药材，但会在评分中扣分
    }

    // 检查是否已添加
    if (this.state.selected_herbs.includes(herbId)) {
      console.warn(`[DecoctionManager] Herb ${herbId} already added`);
      return false;
    }

    // 检查背包是否有该药材
    if (!this.inventoryManager.hasHerb(herbId)) {
      console.warn(`[DecoctionManager] No ${herbId} in inventory`);
      return false;
    }

    this.state.selected_herbs.push(herbId);

    const herbData = getHerbById(herbId);
    this.eventBus.emit(DecoctionEvent.HERB_ADDED, {
      herb_id: herbId,
      herb_name: herbData?.name || herbId
    });

    return true;
  }

  /**
   * 移除药材
   */
  removeHerb(herbId: string): boolean {
    if (this.state.phase !== 'select_herbs') {
      console.error('[DecoctionManager] Not in herb selection phase');
      return false;
    }

    const index = this.state.selected_herbs.indexOf(herbId);
    if (index === -1) {
      console.warn(`[DecoctionManager] Herb ${herbId} not in selection`);
      return false;
    }

    this.state.selected_herbs.splice(index, 1);
    this.state.compatibility_placement.delete(herbId);
    this.state.order_settings.delete(herbId);

    const herbData = getHerbById(herbId);
    this.eventBus.emit(DecoctionEvent.HERB_REMOVED, {
      herb_id: herbId,
      herb_name: herbData?.name || herbId
    });

    return true;
  }

  /**
   * 放置药材到角色位置
   */
  placeRole(herbId: string, role: string): boolean {
    if (this.state.phase !== 'place_compatibility') {
      console.error('[DecoctionManager] Not in compatibility placement phase');
      return false;
    }

    if (!this.state.selected_herbs.includes(herbId)) {
      console.error(`[DecoctionManager] Herb ${herbId} not selected`);
      return false;
    }

    this.state.compatibility_placement.set(herbId, role);

    const herbData = getHerbById(herbId);
    this.eventBus.emit(DecoctionEvent.ROLE_PLACED, {
      herb_id: herbId,
      herb_name: herbData?.name || herbId,
      role: role
    });

    return true;
  }

  /**
   * 设置药材煎煮顺序
   */
  setOrder(herbId: string, order: DecoctionOrderType): boolean {
    if (this.state.phase !== 'set_order') {
      console.error('[DecoctionManager] Not in order setting phase');
      return false;
    }

    if (!this.state.selected_herbs.includes(herbId)) {
      console.error(`[DecoctionManager] Herb ${herbId} not selected`);
      return false;
    }

    this.state.order_settings.set(herbId, order);

    const herbData = getHerbById(herbId);
    const orderConfig = getDecoctionOrderConfig(order);
    this.eventBus.emit(DecoctionEvent.ORDER_SET, {
      herb_id: herbId,
      herb_name: herbData?.name || herbId,
      order: order,
      order_name: orderConfig?.name || order
    });

    return true;
  }

  /**
   * 设置火候
   */
  setFireLevel(fire: FireLevel): boolean {
    if (this.state.phase !== 'set_fire') {
      console.error('[DecoctionManager] Not in fire setting phase');
      return false;
    }

    this.state.fire_level = fire;

    const fireConfig = getFireLevelConfig(fire);
    this.eventBus.emit(DecoctionEvent.FIRE_SET, {
      fire_level: fire,
      fire_name: fireConfig?.name || fire
    });

    return true;
  }

  /**
   * 开始煎煮
   */
  startDecoction(): boolean {
    if (this.state.phase !== 'set_fire') {
      console.error('[DecoctionManager] Not ready to start decoction');
      return false;
    }

    this.changePhase('decocting');
    this.startTime = Date.now();
    this.state.decoction_time = 0;

    this.eventBus.emit(DecoctionEvent.DECOCTION_STARTED, {
      fire_level: this.state.fire_level,
      target_time: this.state.target_time
    });

    // 启动计时器
    this.decoctionTimer = window.setInterval(() => {
      this.tickDecoction();
    }, 1000);

    return true;
  }

  /**
   * 煎煮计时tick
   */
  private tickDecoction(): void {
    if (this.state.phase !== 'decocting') {
      this.stopTimer();
      return;
    }

    this.state.decoction_time += 1;

    this.eventBus.emit(DecoctionEvent.DECOCTION_TICK, {
      current_time: this.state.decoction_time,
      target_time: this.state.target_time,
      progress: this.state.decoction_time / this.state.target_time
    });

    // 检查是否达到目标时间（可以提前结束，但时间评分会扣分）
    if (this.state.decoction_time >= this.state.target_time * 1.5) {
      // 最大煎煮时间（1.5倍），强制结束
      this.completeDecoction();
    }
  }

  /**
   * 停止计时器
   */
  private stopTimer(): void {
    if (this.decoctionTimer) {
      window.clearInterval(this.decoctionTimer);
      this.decoctionTimer = null;
    }
  }

  /**
   * 完成煎煮（玩家主动结束）
   */
  completeDecoction(): boolean {
    if (this.state.phase !== 'decocting') {
      console.error('[DecoctionManager] Not in decocting phase');
      return false;
    }

    this.stopTimer();
    this.changePhase('complete');

    this.eventBus.emit(DecoctionEvent.DECOCTION_COMPLETE, {
      decoction_time: this.state.decoction_time,
      target_time: this.state.target_time
    });

    // 自动进入评分阶段
    this.evaluate();

    return true;
  }

  /**
   * 评分
   */
  evaluate(): DecoctionScoreResult | null {
    if (!this.state.prescription_id) {
      console.error('[DecoctionManager] No prescription selected');
      return null;
    }

    this.changePhase('evaluate');

    // 转换Map为Record
    const compatibilityRecord: Record<string, string> = {};
    this.state.compatibility_placement.forEach((role, herbId) => {
      compatibilityRecord[herbId] = role;
    });

    const orderRecord: Record<string, DecoctionOrderType> = {};
    this.state.order_settings.forEach((order, herbId) => {
      orderRecord[herbId] = order;
    });

    const result = calculateDecoctionScore(
      this.state.prescription_id,
      this.state.selected_herbs,
      compatibilityRecord,
      orderRecord,
      this.state.fire_level,
      this.state.decoction_time
    );

    this.state.score = result;

    this.eventBus.emit(DecoctionEvent.SCORE_CALCULATED, result as unknown as EventData);

    // 自动消耗药材（如果配置启用）
    if (this.config.autoConsumeHerbs && result.passed) {
      this.consumeHerbs();
    }

    return result;
  }

  /**
   * 消耗使用的药材
   */
  private consumeHerbs(): void {
    this.state.selected_herbs.forEach(herbId => {
      this.inventoryManager.removeHerb(herbId, 1);
    });
  }

  /**
   * 改变阶段
   */
  private changePhase(newPhase: DecoctionPhase): void {
    const oldPhase = this.state.phase;
    this.state.phase = newPhase;

    this.eventBus.emit(DecoctionEvent.PHASE_CHANGED, {
      old_phase: oldPhase,
      new_phase: newPhase
    });
  }

  /**
   * 获取当前阶段可以进行的操作
   */
  getAvailableActions(): string[] {
    switch (this.state.phase) {
      case 'select_prescription':
        return ['select_prescription'];
      case 'select_herbs':
        return ['add_herb', 'remove_herb', 'confirm_selection'];
      case 'place_compatibility':
        return ['place_role', 'confirm_compatibility'];
      case 'set_order':
        return ['set_order', 'confirm_order'];
      case 'set_fire':
        return ['set_fire', 'start_decoction'];
      case 'decocting':
        return ['complete_decoction'];
      case 'complete':
        return ['evaluate'];
      case 'evaluate':
        return ['reset', 'select_new'];
      default:
        return [];
    }
  }

  /**
   * 检查是否可以进入下一阶段
   */
  canProceedToNextPhase(): boolean {
    switch (this.state.phase) {
      case 'select_herbs':
        // 至少选择了一个药材
        return this.state.selected_herbs.length > 0;

      case 'place_compatibility':
        // 所有已选药材都已放置角色
        return this.state.selected_herbs.every(
          herbId => this.state.compatibility_placement.has(herbId)
        );

      case 'set_order':
        // 所有已选药材都已设置顺序
        return this.state.selected_herbs.every(
          herbId => this.state.order_settings.has(herbId)
        );

      default:
        return true;
    }
  }

  /**
   * 进入下一阶段
   */
  proceedToNextPhase(): boolean {
    if (!this.canProceedToNextPhase()) {
      return false;
    }

    const phaseSequence: DecoctionPhase[] = [
      'select_prescription',
      'select_herbs',
      'place_compatibility',
      'set_order',
      'set_fire',
      'decocting',
      'complete',
      'evaluate'
    ];

    const currentIndex = phaseSequence.indexOf(this.state.phase);
    if (currentIndex === -1 || currentIndex >= phaseSequence.length - 1) {
      return false;
    }

    this.changePhase(phaseSequence[currentIndex + 1]);
    return true;
  }

  /**
   * 重置游戏
   */
  reset(): void {
    this.stopTimer();

    this.state = {
      phase: 'select_prescription',
      prescription_id: null,
      selected_herbs: [],
      compatibility_placement: new Map(),
      order_settings: new Map(),
      fire_level: 'wen',
      decoction_time: 0,
      target_time: 0
    };
  }

  /**
   * 暴露到全局（用于测试）
   */
  exposeToWindow(): void {
    (window as any).__DECOCTION_MANAGER__ = this;
    // 同时暴露 InventoryManager（确保测试可以添加药材）
    this.inventoryManager.exposeToWindow();
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopTimer();
    this.reset();

    if ((window as any).__DECOCTION_MANAGER__ === this) {
      (window as any).__DECOCTION_MANAGER__ = undefined;
    }
  }
}