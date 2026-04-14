// src/systems/ProcessingManager.ts
/**
 * 炮制管理系统
 *
 * Phase 2 S10.2 实现
 *
 * 功能:
 * - 炮制游戏状态管理
 * - 药材选择验证
 * - 方法/辅料选择管理
 * - 炮制过程控制
 * - 评分计算
 * - 事件发布
 */

import { EventBus, EventData } from './EventBus';
import {
  getProcessingMethodConfig,
  getHerbProcessingParams,
  getAdjuvantConfig,
  calculateProcessingScore,
  ADJUVANTS,
  type ProcessingMethodType,
  type AdjuvantType,
  type ProcessingPhase,
  type ProcessingState,
  type ProcessingScoreResult
} from '../data/processing-data';
import { InventoryManager } from './InventoryManager';

/**
 * 炮制事件类型
 */
export enum ProcessingEvent {
  HERB_SELECTED = 'processing:herb_selected',
  METHOD_SELECTED = 'processing:method_selected',
  ADJUVANT_SELECTED = 'processing:adjuvant_selected',
  PHASE_CHANGED = 'processing:phase_changed',
  PROCESSING_STARTED = 'processing:started',
  PROCESSING_TICK = 'processing:tick',
  PROCESSING_COMPLETE = 'processing:complete',
  SCORE_CALCULATED = 'processing:score_calculated'
}

/**
 * 炮制管理器配置
 */
export interface ProcessingManagerConfig {
  autoConsumeHerbs?: boolean;  // 完成后是否自动消耗药材
  autoConsumeAdjuvant?: boolean; // 完成后是否自动消耗辅料
  passThreshold?: number;      // 通过阈值 (默认60)
}

/**
 * 炮制管理器
 *
 * 单例模式，管理整个炮制游戏流程
 */
export class ProcessingManager {
  private static instance: ProcessingManager | null = null;

  private state: ProcessingState;
  private config: ProcessingManagerConfig;
  private eventBus: EventBus;
  private inventoryManager: InventoryManager;
  private processingTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * 获取单例实例
   */
  static getInstance(config?: ProcessingManagerConfig): ProcessingManager {
    if (!ProcessingManager.instance) {
      ProcessingManager.instance = new ProcessingManager(config);
    }
    return ProcessingManager.instance;
  }

  /**
   * 重置单例（用于测试）
   */
  static resetInstance(): void {
    if (ProcessingManager.instance) {
      ProcessingManager.instance.destroy();
      ProcessingManager.instance = null;
    }
  }

  private constructor(config?: ProcessingManagerConfig) {
    this.config = {
      autoConsumeHerbs: true,
      autoConsumeAdjuvant: true,
      passThreshold: 60,
      ...config
    };

    this.eventBus = EventBus.getInstance();
    this.inventoryManager = InventoryManager.getInstance();

    this.state = this.createInitialState();
  }

  /**
   * 创建初始状态
   */
  private createInitialState(): ProcessingState {
    return {
      phase: 'select_herb',
      herb_id: null,
      method: null,
      adjuvant: null,
      processing_time: 0,
      target_time: 0,
      temperature: '',
      quality_indicators: [],
      score: undefined
    };
  }

  /**
   * 获取当前状态
   */
  getState(): ProcessingState {
    return { ...this.state };
  }

  /**
   * 获取当前阶段
   */
  getPhase(): ProcessingPhase {
    return this.state.phase;
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.stopTimer();
    this.state = this.createInitialState();
    this.eventBus.emit(ProcessingEvent.PHASE_CHANGED, {
      old_phase: 'evaluate',
      new_phase: 'select_herb'
    } as EventData);
  }

  /**
   * 停止计时器
   */
  private stopTimer(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
  }

  /**
   * 选择药材
   */
  selectHerb(herbId: string): boolean {
    // 检查药材是否有炮制参数
    const params = getHerbProcessingParams(herbId);
    if (!params) {
      console.warn(`[ProcessingManager] 药材 ${herbId} 没有炮制参数`);
      return false;
    }

    // 检查背包中是否有该药材
    if (!this.inventoryManager.hasHerb(herbId)) {
      console.warn(`[ProcessingManager] 背包中没有药材 ${herbId}`);
      return false;
    }

    this.state.herb_id = herbId;
    this.setPhase('select_method');

    this.eventBus.emit(ProcessingEvent.HERB_SELECTED, {
      herb_id: herbId
    } as EventData);

    return true;
  }

  /**
   * 选择炮制方法
   */
  selectMethod(method: ProcessingMethodType): boolean {
    const methodConfig = getProcessingMethodConfig(method);
    if (!methodConfig) {
      console.warn(`[ProcessingManager] 无效的炮制方法 ${method}`);
      return false;
    }

    this.state.method = method;
    // 设置目标时间为方法时间范围的中间值
    this.state.target_time = (methodConfig.time_range[0] + methodConfig.time_range[1]) / 2;
    this.state.temperature = methodConfig.temperature_range;

    // 根据是否需要辅料决定下一阶段
    if (methodConfig.requires_adjuvant) {
      this.setPhase('select_adjuvant');
    } else {
      this.state.adjuvant = null;
      this.setPhase('preprocess');
    }

    this.eventBus.emit(ProcessingEvent.METHOD_SELECTED, {
      method: method,
      method_name: methodConfig.name
    } as EventData);

    return true;
  }

  /**
   * 选择辅料
   */
  selectAdjuvant(adjuvant: AdjuvantType): boolean {
    const adjuvantConfig = getAdjuvantConfig(adjuvant);
    if (!adjuvantConfig) {
      console.warn(`[ProcessingManager] 无效的辅料 ${adjuvant}`);
      return false;
    }

    // 检查辅料是否需要背包物品
    // 简化处理：部分辅料（如盐水、清水）可以现场配制，无需背包检查
    // 有inventory_item的辅料需要检查背包
    if (adjuvantConfig.inventory_item) {
      // 将辅料当作药材存储（简化处理）
      if (!this.inventoryManager.hasHerb(adjuvant)) {
        console.warn(`[ProcessingManager] 背包中没有辅料 ${adjuvantConfig.name}`);
        // 不阻止选择，但会在评分时记录
      }
    }

    this.state.adjuvant = adjuvant;
    this.setPhase('preprocess');

    this.eventBus.emit(ProcessingEvent.ADJUVANT_SELECTED, {
      adjuvant: adjuvant,
      adjuvant_name: adjuvantConfig.name
    } as EventData);

    return true;
  }

  /**
   * 开始预处理（简化：直接进入炮制）
   */
  startPreprocess(): void {
    // 一期简化：预处理直接完成
    this.setPhase('processing');
  }

  /**
   * 开始炮制操作
   */
  startProcessing(): void {
    this.state.processing_time = 0;

    this.eventBus.emit(ProcessingEvent.PROCESSING_STARTED, {
      herb_id: this.state.herb_id,
      method: this.state.method,
      adjuvant: this.state.adjuvant,
      target_time: this.state.target_time
    } as EventData);

    // 启动计时器（每秒更新）
    this.processingTimer = setInterval(() => {
      this.tickProcessing();
    }, 1000);

    this.setPhase('processing');
  }

  /**
   * 炮制计时tick
   */
  private tickProcessing(): void {
    if (this.state.phase !== 'processing') {
      this.stopTimer();
      return;
    }

    this.state.processing_time += 1;

    this.eventBus.emit(ProcessingEvent.PROCESSING_TICK, {
      current_time: this.state.processing_time,
      target_time: this.state.target_time,
      progress: this.state.processing_time / this.state.target_time
    } as EventData);
  }

  /**
   * 停止炮制
   */
  stopProcessing(): void {
    this.stopTimer();
    this.eventBus.emit(ProcessingEvent.PROCESSING_COMPLETE, {
      processing_time: this.state.processing_time
    } as EventData);
    this.setPhase('check_endpoint');
  }

  /**
   * 记录质量指标
   */
  recordQualityIndicator(indicator: string): void {
    this.state.quality_indicators.push(indicator);
  }

  /**
   * 提交终点判断
   */
  submitEndpoint(indicators: string[]): void {
    this.state.quality_indicators = indicators;
    this.calculateScore();
  }

  /**
   * 计算评分
   */
  calculateScore(): ProcessingScoreResult {
    if (!this.state.herb_id || !this.state.method) {
      const errorScore: ProcessingScoreResult = {
        total_score: 0,
        method_score: 0,
        adjuvant_score: 0,
        time_score: 0,
        quality_score: 0,
        passed: false,
        feedback: '缺少必要参数'
      };
      this.state.score = errorScore;
      this.setPhase('evaluate');
      this.eventBus.emit(ProcessingEvent.SCORE_CALCULATED, errorScore as unknown as EventData);
      return errorScore;
    }

    const score = calculateProcessingScore(
      this.state.herb_id,
      this.state.method,
      this.state.adjuvant,
      this.state.processing_time,
      this.state.quality_indicators
    );

    this.state.score = score;
    this.setPhase('evaluate');

    this.eventBus.emit(ProcessingEvent.SCORE_CALCULATED, score as unknown as EventData);

    // 消耗药材（通过时自动消耗）
    if (this.config.autoConsumeHerbs && score.passed && this.state.herb_id) {
      this.inventoryManager.removeHerb(this.state.herb_id, 1, 'processing');
    }

    // 消耗辅料（通过时自动消耗，如果有背包物品）
    if (this.config.autoConsumeAdjuvant && score.passed && this.state.adjuvant) {
      const adjConfig = getAdjuvantConfig(this.state.adjuvant);
      if (adjConfig?.inventory_item && this.inventoryManager.hasHerb(this.state.adjuvant)) {
        this.inventoryManager.removeHerb(this.state.adjuvant, 1, 'processing');
      }
    }

    return score;
  }

  /**
   * 设置阶段
   */
  private setPhase(phase: ProcessingPhase): void {
    const oldPhase = this.state.phase;
    this.state.phase = phase;
    this.eventBus.emit(ProcessingEvent.PHASE_CHANGED, {
      old_phase: oldPhase,
      new_phase: phase
    } as EventData);
  }

  /**
   * 获取可用药材列表（从背包）
   */
  getAvailableHerbs(): string[] {
    // 获取背包中所有有炮制参数的药材
    const allHerbs = this.inventoryManager.getAllHerbs();
    return allHerbs
      .filter(item => getHerbProcessingParams(item.herb.id) !== undefined)
      .map(item => item.herb.id);
  }

  /**
   * 获取可用方法列表（基于当前药材）
   */
  getAvailableMethods(): ProcessingMethodType[] {
    if (!this.state.herb_id) return [];
    const params = getHerbProcessingParams(this.state.herb_id);
    return params?.suitable_methods || [];
  }

  /**
   * 获取可用辅料列表（基于当前方法）
   */
  getAvailableAdjuvants(): AdjuvantType[] {
    if (!this.state.method) return [];
    const methodConfig = getProcessingMethodConfig(this.state.method);
    if (!methodConfig?.adjuvant_types) return [];

    // 辅料名称映射到ID，过滤未找到的项
    return methodConfig.adjuvant_types
      .map(name => ADJUVANTS.find(a => a.name === name)?.id)
      .filter((id): id is AdjuvantType => id !== undefined);
  }

  /**
   * 暴露到全局（供测试访问）
   */
  exposeToWindow(): void {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__PROCESSING_MANAGER__ = {
        getState: this.getState.bind(this),
        getPhase: this.getPhase.bind(this),
        selectHerb: this.selectHerb.bind(this),
        selectMethod: this.selectMethod.bind(this),
        selectAdjuvant: this.selectAdjuvant.bind(this),
        startPreprocess: this.startPreprocess.bind(this),
        startProcessing: this.startProcessing.bind(this),
        stopProcessing: this.stopProcessing.bind(this),
        submitEndpoint: this.submitEndpoint.bind(this),
        reset: this.reset.bind(this),
        getAvailableHerbs: this.getAvailableHerbs.bind(this),
        getAvailableMethods: this.getAvailableMethods.bind(this),
        getAvailableAdjuvants: this.getAvailableAdjuvants.bind(this),
        recordQualityIndicator: this.recordQualityIndicator.bind(this)
      };
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopTimer();
    this.state = this.createInitialState();
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__PROCESSING_MANAGER__ = undefined;
    }
  }
}