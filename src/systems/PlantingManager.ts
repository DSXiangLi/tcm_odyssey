// src/systems/PlantingManager.ts
/**
 * 种植管理系统
 *
 * Phase 2 S11.2 实现
 *
 * 功能:
 * - 种植游戏状态管理
 * - 种子选择验证
 * - 地块选择管理
 * - 水源/肥料选择
 * - 种植过程控制
 * - 生长进度更新
 * - 收获与考教
 * - 事件发布
 */

import { EventBus, EventData } from './EventBus';
import {
  getSeedData,
  getPlotData,
  getWaterData,
  getFertilizerData,
  getGrowthStage,
  getQuizForHerb,
  calculatePlantingMatch,
  initializePlantingState,
  SEEDS_DATA,
  PLOTS_DATA,
  WATERS_DATA,
  FERTILIZERS_DATA,
  type SeedData,
  type PlotData,
  type WaterData,
  type FertilizerData,
  type PlantingPhase,
  type PlantingState,
  type PlotState
} from '../data/planting-data';
import { InventoryManager } from './InventoryManager';

/**
 * 种植事件类型
 */
export enum PlantingEvent {
  SEED_SELECTED = 'planting:seed_selected',
  PLOT_SELECTED = 'planting:plot_selected',
  WATER_SELECTED = 'planting:water_selected',
  FERTILIZER_SELECTED = 'planting:fertilizer_selected',
  PHASE_CHANGED = 'planting:phase_changed',
  PLANTING_STARTED = 'planting:started',
  PLANTING_COMPLETE = 'planting:complete',
  GROWTH_UPDATED = 'planting:growth_updated',
  HARVEST_READY = 'planting:harvest_ready',
  HARVEST_COMPLETE = 'planting:harvest_complete',
  QUIZ_STARTED = 'planting:quiz_started',
  QUIZ_SUBMITTED = 'planting:quiz_submitted',
  SCORE_CALCULATED = 'planting:score_calculated'
}

/**
 * 种植管理器配置
 */
export interface PlantingManagerConfig {
  autoConsumeSeed?: boolean;    // 完成后是否自动消耗种子
  autoAddHerb?: boolean;        // 收获后是否自动添加药材到背包
  passThreshold?: number;       // 通过阈值 (默认60)
  growthTickInterval?: number;  // 生长更新间隔(毫秒，默认1000)
}

/**
 * 种植评分结果
 */
export interface PlantingScoreResult {
  total_score: number;
  plot_match: boolean;
  water_match: boolean;
  fertilizer_match: boolean;
  quiz_passed: boolean;
  passed: boolean;
  feedback: string;
}

/**
 * 种植管理器
 *
 * 单例模式，管理整个种植游戏流程
 */
export class PlantingManager {
  private static instance: PlantingManager | null = null;

  private state: PlantingState;
  private config: PlantingManagerConfig;
  private eventBus: EventBus;
  private inventoryManager: InventoryManager;
  private growthTimer: ReturnType<typeof setInterval> | null = null;
  private currentScore: PlantingScoreResult | null = null;

  /**
   * 获取单例实例
   */
  static getInstance(config?: PlantingManagerConfig): PlantingManager {
    if (!PlantingManager.instance) {
      PlantingManager.instance = new PlantingManager(config);
    }
    return PlantingManager.instance;
  }

  /**
   * 重置单例（用于测试）
   */
  static resetInstance(): void {
    if (PlantingManager.instance) {
      PlantingManager.instance.destroy();
      PlantingManager.instance = null;
    }
  }

  private constructor(config?: PlantingManagerConfig) {
    this.config = {
      autoConsumeSeed: true,
      autoAddHerb: true,
      passThreshold: 60,
      growthTickInterval: 1000,
      ...config
    };

    this.eventBus = EventBus.getInstance();
    this.inventoryManager = InventoryManager.getInstance();

    this.state = initializePlantingState();
  }

  /**
   * 获取当前状态
   */
  getState(): PlantingState {
    return {
      ...this.state,
      plots: this.state.plots.map(plot => ({ ...plot }))
    };
  }

  /**
   * 获取当前阶段
   */
  getPhase(): PlantingPhase {
    return this.state.phase;
  }

  /**
   * 获取当前评分
   */
  getScore(): PlantingScoreResult | null {
    return this.currentScore;
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.stopGrowthTimer();
    this.state = initializePlantingState();
    this.currentScore = null;
    this.emitPhaseChange('quiz', 'select_seed');
  }

  /**
   * 停止生长计时器
   */
  private stopGrowthTimer(): void {
    if (this.growthTimer) {
      clearInterval(this.growthTimer);
      this.growthTimer = null;
    }
  }

  /**
   * 发射阶段变化事件
   */
  private emitPhaseChange(oldPhase: PlantingPhase, newPhase: PlantingPhase): void {
    this.eventBus.emit(PlantingEvent.PHASE_CHANGED, {
      old_phase: oldPhase,
      new_phase: newPhase
    } as EventData);
  }

  /**
   * 设置阶段
   */
  private setPhase(phase: PlantingPhase): void {
    const oldPhase = this.state.phase;
    this.state.phase = phase;
    this.emitPhaseChange(oldPhase, phase);
  }

  /**
   * 选择种子
   */
  selectSeed(seedId: string): boolean {
    // 检查种子是否有效
    const seedData = getSeedData(seedId);
    if (!seedData) {
      console.warn(`[PlantingManager] 无效的种子 ${seedId}`);
      return false;
    }

    // 检查背包中是否有该种子
    if (this.inventoryManager.getSeedQuantity(seedId) <= 0) {
      console.warn(`[PlantingManager] 背包中没有种子 ${seedId}`);
      return false;
    }

    this.state.selected_seed = seedId;
    this.setPhase('select_plot');

    this.eventBus.emit(PlantingEvent.SEED_SELECTED, {
      seed_id: seedId,
      seed_name: seedData.name,
      herb_id: seedData.herb_id,
      meridian: seedData.meridian
    } as EventData);

    return true;
  }

  /**
   * 选择地块
   */
  selectPlot(plotId: string): boolean {
    // 检查地块是否有效
    const plotData = getPlotData(plotId);
    if (!plotData) {
      console.warn(`[PlantingManager] 无效的地块 ${plotId}`);
      return false;
    }

    // 检查地块是否空闲
    const plotState = this.state.plots.find(p => p.plot_id === plotId);
    if (!plotState) {
      console.warn(`[PlantingManager] 找不到地块状态 ${plotId}`);
      return false;
    }

    if (plotState.seed_id !== null) {
      console.warn(`[PlantingManager] 地块 ${plotId} 已被占用`);
      return false;
    }

    this.state.current_plot = plotId;
    this.setPhase('select_water');

    this.eventBus.emit(PlantingEvent.PLOT_SELECTED, {
      plot_id: plotId,
      plot_name: plotData.name,
      plot_meridian: plotData.meridian
    } as EventData);

    return true;
  }

  /**
   * 选择水源
   */
  selectWater(waterId: string): boolean {
    // 检查水源是否有效
    const waterData = getWaterData(waterId);
    if (!waterData) {
      console.warn(`[PlantingManager] 无效的水源 ${waterId}`);
      return false;
    }

    // 检查当前阶段
    if (this.state.phase !== 'select_water') {
      console.warn(`[PlantingManager] 当前阶段不能选择水源`);
      return false;
    }

    this.state.selected_water = waterId;
    this.setPhase('select_fertilizer');

    this.eventBus.emit(PlantingEvent.WATER_SELECTED, {
      water_id: waterId,
      water_name: waterData.name,
      qi_type: waterData.qi_type
    } as EventData);

    return true;
  }

  /**
   * 选择肥料
   */
  selectFertilizer(fertilizerId: string): boolean {
    // 检查肥料是否有效
    const fertilizerData = getFertilizerData(fertilizerId);
    if (!fertilizerData) {
      console.warn(`[PlantingManager] 无效的肥料 ${fertilizerId}`);
      return false;
    }

    // 检查当前阶段
    if (this.state.phase !== 'select_fertilizer') {
      console.warn(`[PlantingManager] 当前阶段不能选择肥料`);
      return false;
    }

    this.state.selected_fertilizer = fertilizerId;
    this.setPhase('planting');

    this.eventBus.emit(PlantingEvent.FERTILIZER_SELECTED, {
      fertilizer_id: fertilizerId,
      fertilizer_name: fertilizerData.name,
      flavor_type: fertilizerData.flavor_type
    } as EventData);

    return true;
  }

  /**
   * 执行种植操作
   */
  plant(): boolean {
    // 验证必要参数
    if (!this.state.selected_seed || !this.state.current_plot ||
        !this.state.selected_water || !this.state.selected_fertilizer) {
      console.warn('[PlantingManager] 缺少必要的种植参数');
      return false;
    }

    // 验证当前阶段
    if (this.state.phase !== 'planting') {
      console.warn('[PlantingManager] 当前阶段不能执行种植');
      return false;
    }

    const seedData = getSeedData(this.state.selected_seed);
    if (!seedData) {
      return false;
    }

    // 计算匹配度
    const matchResult = calculatePlantingMatch(
      this.state.selected_seed,
      this.state.current_plot,
      this.state.selected_water,
      this.state.selected_fertilizer
    );

    // 更新地块状态
    const plotIndex = this.state.plots.findIndex(p => p.plot_id === this.state.current_plot);
    if (plotIndex === -1) {
      return false;
    }

    this.state.plots[plotIndex] = {
      plot_id: this.state.current_plot,
      seed_id: this.state.selected_seed,
      herb_id: seedData.herb_id,
      water_id: this.state.selected_water,
      fertilizer_id: this.state.selected_fertilizer,
      growth_progress: 0,
      current_stage: 'seed',
      plant_time: Date.now(),
      is_ready: false
    };

    // 消耗种子（如果配置启用）
    if (this.config.autoConsumeSeed) {
      this.inventoryManager.removeSeed(this.state.selected_seed, 1, 'planting');
    }

    this.eventBus.emit(PlantingEvent.PLANTING_STARTED, {
      plot_id: this.state.current_plot,
      seed_id: this.state.selected_seed,
      herb_id: seedData.herb_id,
      match_score: matchResult.total_score
    } as EventData);

    this.eventBus.emit(PlantingEvent.PLANTING_COMPLETE, {
      plot_id: this.state.current_plot,
      plot_match: matchResult.plot_match,
      water_match: matchResult.water_match,
      fertilizer_match: matchResult.fertilizer_match
    } as EventData);

    // 清除选择状态
    this.state.selected_seed = null;
    this.state.selected_water = null;
    this.state.selected_fertilizer = null;
    this.state.current_plot = null;

    // 进入等待生长阶段
    this.setPhase('waiting');

    // 启动生长计时器
    this.startGrowthTimer();

    return true;
  }

  /**
   * 启动生长计时器
   */
  private startGrowthTimer(): void {
    this.stopGrowthTimer();
    this.growthTimer = setInterval(() => {
      this.updateGrowth();
    }, this.config.growthTickInterval);
  }

  /**
   * 更新生长进度
   */
  updateGrowth(): void {
    // 更新所有已种植地块的生长进度
    for (const plot of this.state.plots) {
      if (plot.seed_id === null || plot.plant_time === null) continue;

      const seedData = getSeedData(plot.seed_id);
      if (!seedData) continue;

      // 计算生长进度（基于时间）
      const elapsedSeconds = (Date.now() - plot.plant_time) / 1000;
      const progress = Math.min(100, (elapsedSeconds / seedData.growth_time) * 100);

      // 更新进度
      plot.growth_progress = progress;
      plot.current_stage = getGrowthStage(progress);

      // 检查是否可以收获
      if (progress >= 100 && !plot.is_ready) {
        plot.is_ready = true;
        this.eventBus.emit(PlantingEvent.HARVEST_READY, {
          plot_id: plot.plot_id,
          herb_id: plot.herb_id
        } as EventData);
      }

      // 发射生长更新事件
      this.eventBus.emit(PlantingEvent.GROWTH_UPDATED, {
        plot_id: plot.plot_id,
        progress: progress,
        stage: plot.current_stage
      } as EventData);
    }
  }

  /**
   * 收获药材
   */
  harvest(plotId: string): boolean {
    // 检查地块状态
    const plotIndex = this.state.plots.findIndex(p => p.plot_id === plotId);
    if (plotIndex === -1) {
      console.warn(`[PlantingManager] 找不到地块 ${plotId}`);
      return false;
    }

    const plotState = this.state.plots[plotIndex];
    if (!plotState.is_ready) {
      console.warn(`[PlantingManager] 地块 ${plotId} 还未准备好收获`);
      return false;
    }

    if (!plotState.herb_id) {
      console.warn(`[PlantingManager] 地块 ${plotId} 没有药材可以收获`);
      return false;
    }

    // 进入收获阶段
    this.state.current_plot = plotId;
    this.setPhase('harvest');

    this.eventBus.emit(PlantingEvent.HARVEST_COMPLETE, {
      plot_id: plotId,
      herb_id: plotState.herb_id,
      seed_id: plotState.seed_id
    } as EventData);

    // 进入考教阶段
    this.startQuiz(plotState.herb_id);

    return true;
  }

  /**
   * 开始考教
   */
  private startQuiz(herbId: string): boolean {
    const quiz = getQuizForHerb(herbId);
    if (!quiz) {
      console.warn(`[PlantingManager] 找不到药材 ${herbId} 的考教题目`);
      // 如果没有考教题目，直接完成收获
      this.completeHarvestWithoutQuiz();
      return false;
    }

    this.state.quiz_question = quiz.question;
    this.setPhase('quiz');

    this.eventBus.emit(PlantingEvent.QUIZ_STARTED, {
      herb_id: herbId,
      question: quiz.question,
      options: quiz.options
    } as EventData);

    return true;
  }

  /**
   * 无考教直接完成收获
   */
  private completeHarvestWithoutQuiz(): void {
    if (!this.state.current_plot) return;

    const plotIndex = this.state.plots.findIndex(p => p.plot_id === this.state.current_plot);
    if (plotIndex === -1) return;

    const plotState = this.state.plots[plotIndex];
    if (!plotState.herb_id) return;

    // 计算评分（没有考教，quiz_passed为true）
    this.calculateScore(true);

    // 添加药材到背包
    if (this.config.autoAddHerb) {
      this.inventoryManager.addHerb(plotState.herb_id, 1, 'harvest');
    }

    // 重置地块状态
    this.state.plots[plotIndex] = {
      plot_id: this.state.current_plot,
      seed_id: null,
      herb_id: null,
      water_id: null,
      fertilizer_id: null,
      growth_progress: 0,
      current_stage: 'seed',
      plant_time: null,
      is_ready: false
    };

    this.state.current_plot = null;
    this.setPhase('select_seed');
  }

  /**
   * 提交考教答案
   */
  submitQuiz(answer: string): boolean {
    // 验证当前阶段
    if (this.state.phase !== 'quiz') {
      console.warn('[PlantingManager] 当前阶段不是考教阶段');
      return false;
    }

    if (!this.state.current_plot) {
      console.warn('[PlantingManager] 没有当前地块');
      return false;
    }

    const plotIndex = this.state.plots.findIndex(p => p.plot_id === this.state.current_plot);
    if (plotIndex === -1) return false;

    const plotState = this.state.plots[plotIndex];
    if (!plotState.herb_id) return false;

    // 获取考教题目
    const quiz = getQuizForHerb(plotState.herb_id);
    if (!quiz) {
      this.completeHarvestWithoutQuiz();
      return true;
    }

    // 检查答案是否正确
    const isCorrect = answer === quiz.correct_answer;
    this.state.quiz_passed = isCorrect;

    this.eventBus.emit(PlantingEvent.QUIZ_SUBMITTED, {
      herb_id: plotState.herb_id,
      answer: answer,
      correct: isCorrect,
      correct_answer: quiz.correct_answer,
      explanation: quiz.explanation
    } as EventData);

    // 计算评分
    this.calculateScore(isCorrect);

    // 添加药材到背包（无论答对与否都收获）
    if (this.config.autoAddHerb) {
      this.inventoryManager.addHerb(plotState.herb_id, 1, 'harvest');
    }

    // 重置地块状态
    this.state.plots[plotIndex] = {
      plot_id: this.state.current_plot,
      seed_id: null,
      herb_id: null,
      water_id: null,
      fertilizer_id: null,
      growth_progress: 0,
      current_stage: 'seed',
      plant_time: null,
      is_ready: false
    };

    // 清除状态
    this.state.current_plot = null;
    this.state.quiz_question = null;

    // 返回选择种子阶段
    this.setPhase('select_seed');

    return true;
  }

  /**
   * 计算评分
   */
  private calculateScore(quizPassed: boolean): PlantingScoreResult {
    if (!this.state.current_plot) {
      const errorScore: PlantingScoreResult = {
        total_score: 0,
        plot_match: false,
        water_match: false,
        fertilizer_match: false,
        quiz_passed: quizPassed,
        passed: false,
        feedback: '缺少地块信息'
      };
      this.currentScore = errorScore;
      this.eventBus.emit(PlantingEvent.SCORE_CALCULATED, errorScore as unknown as EventData);
      return errorScore;
    }

    const plotIndex = this.state.plots.findIndex(p => p.plot_id === this.state.current_plot);
    if (plotIndex === -1) {
      const errorScore: PlantingScoreResult = {
        total_score: 0,
        plot_match: false,
        water_match: false,
        fertilizer_match: false,
        quiz_passed: quizPassed,
        passed: false,
        feedback: '找不到地块状态'
      };
      this.currentScore = errorScore;
      this.eventBus.emit(PlantingEvent.SCORE_CALCULATED, errorScore as unknown as EventData);
      return errorScore;
    }

    const plotState = this.state.plots[plotIndex];
    if (!plotState.seed_id || !plotState.water_id || !plotState.fertilizer_id) {
      const errorScore: PlantingScoreResult = {
        total_score: 0,
        plot_match: false,
        water_match: false,
        fertilizer_match: false,
        quiz_passed: quizPassed,
        passed: false,
        feedback: '缺少种植信息'
      };
      this.currentScore = errorScore;
      this.eventBus.emit(PlantingEvent.SCORE_CALCULATED, errorScore as unknown as EventData);
      return errorScore;
    }

    // 计算匹配度
    const matchResult = calculatePlantingMatch(
      plotState.seed_id,
      this.state.current_plot,
      plotState.water_id,
      plotState.fertilizer_id
    );

    // 计算总分
    let totalScore = matchResult.total_score;
    if (quizPassed) {
      totalScore += 20;
    }

    // 判断是否通过
    const passed = totalScore >= (this.config.passThreshold ?? 60);

    // 生成反馈
    const feedback = this.generateFeedback(
      matchResult,
      quizPassed,
      passed
    );

    const score: PlantingScoreResult = {
      total_score: totalScore,
      plot_match: matchResult.plot_match,
      water_match: matchResult.water_match,
      fertilizer_match: matchResult.fertilizer_match,
      quiz_passed: quizPassed,
      passed: passed,
      feedback: feedback
    };

    this.currentScore = score;
    this.eventBus.emit(PlantingEvent.SCORE_CALCULATED, score as unknown as EventData);

    return score;
  }

  /**
   * 生成反馈信息
   */
  private generateFeedback(
    matchResult: { plot_match: boolean; water_match: boolean; fertilizer_match: boolean },
    quizPassed: boolean,
    passed: boolean
  ): string {
    const parts: string[] = [];

    if (!matchResult.plot_match) {
      parts.push('地块归经不匹配，药材生长受限');
    }
    if (!matchResult.water_match) {
      parts.push('水源四气不匹配，药性受到影响');
    }
    if (!matchResult.fertilizer_match) {
      parts.push('肥料五味不匹配，功效减弱');
    }
    if (!quizPassed) {
      parts.push('考教未通过，需要加强学习');
    }

    if (passed) {
      if (parts.length === 0) {
        parts.push('完美种植！药材品质优良');
      } else {
        parts.push('总体合格，但仍有改进空间');
      }
    } else {
      parts.push('种植失败，请重新学习种植知识');
    }

    return parts.join('；');
  }

  /**
   * 取消当前选择
   */
  cancelSelection(): void {
    this.state.selected_seed = null;
    this.state.selected_water = null;
    this.state.selected_fertilizer = null;
    this.state.current_plot = null;
    this.setPhase('select_seed');
  }

  /**
   * 获取可用种子列表（从背包）
   */
  getAvailableSeeds(): string[] {
    const allSeeds = this.inventoryManager.getAllSeeds();
    return allSeeds.map(item => item.seed.id);
  }

  /**
   * 获取空闲地块列表
   */
  getAvailablePlots(): string[] {
    return this.state.plots
      .filter(plot => plot.seed_id === null)
      .map(plot => plot.plot_id);
  }

  /**
   * 获取地块状态
   */
  getPlotState(plotId: string): PlotState | undefined {
    const plot = this.state.plots.find(p => p.plot_id === plotId);
    return plot ? { ...plot } : undefined;
  }

  /**
   * 获取所有种子数据
   */
  getAllSeeds(): SeedData[] {
    return [...SEEDS_DATA];
  }

  /**
   * 获取所有地块数据
   */
  getAllPlots(): PlotData[] {
    return [...PLOTS_DATA];
  }

  /**
   * 获取所有水源数据
   */
  getAllWaters(): WaterData[] {
    return [...WATERS_DATA];
  }

  /**
   * 获取所有肥料数据
   */
  getAllFertilizers(): FertilizerData[] {
    return [...FERTILIZERS_DATA];
  }

  /**
   * 导出状态（存档）
   */
  exportState(): PlantingState {
    return {
      ...this.state,
      plots: this.state.plots.map(plot => ({ ...plot }))
    };
  }

  /**
   * 导入状态（存档）
   */
  importState(state: PlantingState): void {
    this.stopGrowthTimer();
    this.state = {
      ...state,
      plots: state.plots.map(plot => ({ ...plot }))
    };

    // 如果有正在生长的作物，恢复计时器
    const hasGrowingPlot = this.state.plots.some(
      plot => plot.seed_id !== null && !plot.is_ready
    );
    if (hasGrowingPlot) {
      this.startGrowthTimer();
    }
  }

  /**
   * 暴露到全局（供测试访问）
   */
  exposeToWindow(): void {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__PLANTING_MANAGER__ = {
        getState: this.getState.bind(this),
        getPhase: this.getPhase.bind(this),
        getScore: this.getScore.bind(this),
        selectSeed: this.selectSeed.bind(this),
        selectPlot: this.selectPlot.bind(this),
        selectWater: this.selectWater.bind(this),
        selectFertilizer: this.selectFertilizer.bind(this),
        plant: this.plant.bind(this),
        updateGrowth: this.updateGrowth.bind(this),
        harvest: this.harvest.bind(this),
        submitQuiz: this.submitQuiz.bind(this),
        reset: this.reset.bind(this),
        getAvailableSeeds: this.getAvailableSeeds.bind(this),
        getAvailablePlots: this.getAvailablePlots.bind(this),
        getPlotState: this.getPlotState.bind(this),
        getAllSeeds: this.getAllSeeds.bind(this),
        getAllPlots: this.getAllPlots.bind(this),
        getAllWaters: this.getAllWaters.bind(this),
        getAllFertilizers: this.getAllFertilizers.bind(this),
        exportState: this.exportState.bind(this),
        importState: this.importState.bind(this)
      };
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopGrowthTimer();
    this.state = initializePlantingState();
    this.currentScore = null;
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__PLANTING_MANAGER__ = undefined;
    }
  }
}