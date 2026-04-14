// src/systems/DiagnosisFlowManager.ts
/**
 * 诊治流程管理器
 * 功能:
 * - 串联问诊→脉诊→舌诊→辨证→选方→结果各环节
 * - 管理各环节状态传递
 * - 汇总评分结果
 *
 * Phase 2 S6e 实现
 */

import { EventBus, GameEvents } from './EventBus';
import { ScoringSystem, DiagnosisScore, StageScore } from './ScoringSystem';
import { ClueTracker, ClueState } from './ClueTracker';

// 诊治阶段
export enum DiagnosisStage {
  INQUIRY = 'inquiry',
  PULSE = 'pulse',
  TONGUE = 'tongue',
  SYNDROME = 'syndrome',
  PRESCRIPTION = 'prescription',
  RESULT = 'result'
}

// 诊治流程数据
export interface DiagnosisFlowData {
  caseId: string;
  playerId: string;

  // 问诊数据
  inquiryData?: {
    clueStates: ClueState[];
    dialogueHistory: { role: 'user' | 'assistant'; content: string }[];
  };

  // 脉诊数据
  pulseData?: {
    correctPosition: string;
    correctTension: string;
    selectedPosition: string;
    selectedTension: string;
  };

  // 舌诊数据
  tongueData?: {
    correctBodyColor: string;
    correctCoating: string;
    correctShape: string;
    correctMoisture: string;
    selectedBodyColor: string;
    selectedCoating: string;
    selectedShape: string;
    selectedMoisture: string;
  };

  // 辨证数据
  syndromeData?: {
    correctSyndrome: string;
    selectedSyndrome: string;
    reasoningText: string;
  };

  // 选方数据
  prescriptionData?: {
    correctPrescription: string;
    selectedPrescription: string;
  };

  // 评分结果
  scoreResult?: DiagnosisScore;

  // 时间追踪
  startTime: number;
  stageStartTime: number;
  stageTimes: Record<string, number>;

  // 错误追踪
  errorCount: number;
}

// 病案数据接口（简化版本）
export interface CaseData {
  case_id: string;
  syndrome: {
    type: string;
    category: string;
  };
  prescription: {
    name: string;
    alternatives: string[];
  };
  pulse: {
    position: string;
    tension: string;
    description: string;
  };
  tongue: {
    body_color: string;
    coating: string;
    shape: string;
    moisture: string;
  };
  clues: {
    required: string[];
    auxiliary: string[];
  };
}

export class DiagnosisFlowManager {
  private eventBus: EventBus;
  private scoringSystem: ScoringSystem;
  private flowData: DiagnosisFlowData;
  private currentStage: DiagnosisStage;
  private caseData: CaseData | null = null;

  constructor(caseId: string, playerId: string = 'player_001') {
    this.eventBus = EventBus.getInstance();
    this.scoringSystem = new ScoringSystem(playerId);

    this.flowData = {
      caseId,
      playerId,
      startTime: Date.now(),
      stageStartTime: Date.now(),
      stageTimes: {},
      errorCount: 0
    };

    this.currentStage = DiagnosisStage.INQUIRY;

    // 监听事件
    this.setupEventListeners();
  }

  /**
   * 设置事件监听
   */
  private sceneSwitchHandler: (data: any) => void = () => {};

  private setupEventListeners(): void {
    this.sceneSwitchHandler = (data: any) => {
      if (data.from && data.to) {
        this.handleStageTransition(data.from, data.to);
      }
    };
    this.eventBus.on(GameEvents.SCENE_SWITCH, this.sceneSwitchHandler);
  }

  /**
   * 处理阶段转换
   */
  private handleStageTransition(fromScene: string, toScene: string): void {
    const stageMapping: Record<string, DiagnosisStage> = {
      'InquiryScene': DiagnosisStage.INQUIRY,
      'PulseScene': DiagnosisStage.PULSE,
      'TongueScene': DiagnosisStage.TONGUE,
      'SyndromeScene': DiagnosisStage.SYNDROME,
      'PrescriptionScene': DiagnosisStage.PRESCRIPTION,
      'ResultScene': DiagnosisStage.RESULT
    };

    const fromStage = stageMapping[fromScene];
    const toStage = stageMapping[toScene];

    if (fromStage && toStage) {
      // 记录上一个阶段用时
      const stageTime = Date.now() - this.flowData.stageStartTime;
      this.flowData.stageTimes[fromStage] = stageTime;

      // 更新当前阶段
      this.currentStage = toStage;
      this.flowData.stageStartTime = Date.now();

      console.log(`[DiagnosisFlowManager] Transition: ${fromStage} -> ${toStage}, time: ${stageTime}ms`);
    }
  }

  /**
   * 加载病案数据
   */
  loadCaseData(caseData: CaseData): void {
    this.caseData = caseData;
    console.log('[DiagnosisFlowManager] Case data loaded:', caseData.case_id);
  }

  /**
   * 设置问诊数据
   */
  setInquiryData(clueTracker: ClueTracker): void {
    this.flowData.inquiryData = {
      clueStates: clueTracker.getAllClueStates(),
      dialogueHistory: clueTracker.getDialogueHistory()
    };
  }

  /**
   * 设置脉诊数据
   */
  setPulseData(selectedPosition: string, selectedTension: string): boolean {
    if (!this.caseData) {
      console.error('[DiagnosisFlowManager] No case data loaded');
      return false;
    }

    const correctPosition = this.caseData.pulse.position;
    const correctTension = this.caseData.pulse.tension;

    this.flowData.pulseData = {
      correctPosition,
      correctTension,
      selectedPosition,
      selectedTension
    };

    const isCorrect = selectedPosition === correctPosition && selectedTension === correctTension;

    if (!isCorrect) {
      this.flowData.errorCount++;
    }

    console.log('[DiagnosisFlowManager] Pulse data set:', {
      selected: `${selectedPosition}+${selectedTension}`,
      correct: `${correctPosition}+${correctTension}`,
      isCorrect
    });

    return isCorrect;
  }

  /**
   * 设置舌诊数据
   */
  setTongueData(
    selectedBodyColor: string,
    selectedCoating: string,
    selectedShape: string,
    selectedMoisture: string
  ): { correctCount: number; totalCount: number } {
    if (!this.caseData) {
      console.error('[DiagnosisFlowManager] No case data loaded');
      return { correctCount: 0, totalCount: 4 };
    }

    const correctBodyColor = this.caseData.tongue.body_color;
    const correctCoating = this.caseData.tongue.coating;
    const correctShape = this.caseData.tongue.shape;
    const correctMoisture = this.caseData.tongue.moisture;

    this.flowData.tongueData = {
      correctBodyColor,
      correctCoating,
      correctShape,
      correctMoisture,
      selectedBodyColor,
      selectedCoating,
      selectedShape,
      selectedMoisture
    };

    let correctCount = 0;
    if (selectedBodyColor === correctBodyColor) correctCount++;
    if (selectedCoating === correctCoating) correctCount++;
    if (selectedShape === correctShape) correctCount++;
    if (selectedMoisture === correctMoisture) correctCount++;

    if (correctCount < 4) {
      this.flowData.errorCount += (4 - correctCount);
    }

    console.log('[DiagnosisFlowManager] Tongue data set:', {
      correctCount,
      totalCount: 4
    });

    return { correctCount, totalCount: 4 };
  }

  /**
   * 设置辨证数据
   */
  setSyndromeData(selectedSyndrome: string, reasoningText: string): boolean {
    if (!this.caseData) {
      console.error('[DiagnosisFlowManager] No case data loaded');
      return false;
    }

    const correctSyndrome = this.caseData.syndrome.type;

    this.flowData.syndromeData = {
      correctSyndrome,
      selectedSyndrome,
      reasoningText
    };

    const isCorrect = selectedSyndrome === correctSyndrome;

    if (!isCorrect) {
      this.flowData.errorCount++;
    }

    console.log('[DiagnosisFlowManager] Syndrome data set:', {
      selected: selectedSyndrome,
      correct: correctSyndrome,
      isCorrect
    });

    return isCorrect;
  }

  /**
   * 设置选方数据
   */
  setPrescriptionData(selectedPrescription: string): boolean {
    if (!this.caseData) {
      console.error('[DiagnosisFlowManager] No case data loaded');
      return false;
    }

    const correctPrescription = this.caseData.prescription.name;

    this.flowData.prescriptionData = {
      correctPrescription,
      selectedPrescription
    };

    const isCorrect = selectedPrescription === correctPrescription;

    if (!isCorrect) {
      this.flowData.errorCount++;
    }

    console.log('[DiagnosisFlowManager] Prescription data set:', {
      selected: selectedPrescription,
      correct: correctPrescription,
      isCorrect
    });

    return isCorrect;
  }

  /**
   * 计算最终评分
   */
  async calculateFinalScore(): Promise<DiagnosisScore> {
    if (!this.caseData || !this.flowData.inquiryData) {
      console.error('[DiagnosisFlowManager] Missing data for scoring');
      return this.getDefaultScore();
    }

    // 计算问诊评分
    const requiredClues = this.caseData.clues.required;
    const auxiliaryClues = this.caseData.clues.auxiliary;

    let requiredCollected = 0;
    let auxiliaryCollected = 0;

    for (const state of this.flowData.inquiryData.clueStates) {
      if (state.collected) {
        if (requiredClues.includes(state.clueId)) {
          requiredCollected++;
        } else if (auxiliaryClues.includes(state.clueId)) {
          auxiliaryCollected++;
        }
      }
    }

    const inquiryScore = this.scoringSystem.calculateInquiryScore({
      requiredCluesCollected: requiredCollected,
      requiredCluesTotal: requiredClues.length,
      auxiliaryCluesCollected: auxiliaryCollected,
      auxiliaryCluesTotal: auxiliaryClues.length
    });

    // 计算脉诊评分
    let pulseScore: StageScore;
    if (this.flowData.pulseData) {
      pulseScore = this.scoringSystem.calculatePulseScore({
        positionCorrect: this.flowData.pulseData.selectedPosition === this.flowData.pulseData.correctPosition,
        tensionCorrect: this.flowData.pulseData.selectedTension === this.flowData.pulseData.correctTension,
        correctPosition: this.flowData.pulseData.correctPosition,
        correctTension: this.flowData.pulseData.correctTension,
        selectedPosition: this.flowData.pulseData.selectedPosition,
        selectedTension: this.flowData.pulseData.selectedTension
      });
    } else {
      pulseScore = this.getDefaultStageScore('脉诊');
    }

    // 计算舌诊评分
    let tongueScore: StageScore;
    if (this.flowData.tongueData) {
      tongueScore = this.scoringSystem.calculateTongueScore({
        bodyColorCorrect: this.flowData.tongueData.selectedBodyColor === this.flowData.tongueData.correctBodyColor,
        coatingCorrect: this.flowData.tongueData.selectedCoating === this.flowData.tongueData.correctCoating,
        shapeCorrect: this.flowData.tongueData.selectedShape === this.flowData.tongueData.correctShape,
        moistureCorrect: this.flowData.tongueData.selectedMoisture === this.flowData.tongueData.correctMoisture,
        correctBodyColor: this.flowData.tongueData.correctBodyColor,
        correctCoating: this.flowData.tongueData.correctCoating,
        correctShape: this.flowData.tongueData.correctShape,
        correctMoisture: this.flowData.tongueData.correctMoisture,
        selectedBodyColor: this.flowData.tongueData.selectedBodyColor,
        selectedCoating: this.flowData.tongueData.selectedCoating,
        selectedShape: this.flowData.tongueData.selectedShape,
        selectedMoisture: this.flowData.tongueData.selectedMoisture
      });
    } else {
      tongueScore = this.getDefaultStageScore('舌诊');
    }

    // 计算辨证评分（可能需要AI评分论述）
    let syndromeScore: StageScore;
    if (this.flowData.syndromeData) {
      // 先尝试AI评分，如果失败则使用本地评分
      let reasoningScore = 25;
      try {
        reasoningScore = await this.scoringSystem.calculateReasoningScoreAI(
          this.flowData.syndromeData.selectedSyndrome,
          this.flowData.syndromeData.reasoningText,
          this.flowData.syndromeData.correctSyndrome
        );
      } catch (error) {
        console.warn('[DiagnosisFlowManager] AI scoring failed, using local scoring');
      }

      syndromeScore = this.scoringSystem.calculateSyndromeScore({
        syndromeCorrect: this.flowData.syndromeData.selectedSyndrome === this.flowData.syndromeData.correctSyndrome,
        correctSyndrome: this.flowData.syndromeData.correctSyndrome,
        selectedSyndrome: this.flowData.syndromeData.selectedSyndrome,
        reasoningText: this.flowData.syndromeData.reasoningText,
        reasoningScore
      });
    } else {
      syndromeScore = this.getDefaultStageScore('辨证');
    }

    // 计算选方评分
    let prescriptionScore: StageScore;
    if (this.flowData.prescriptionData) {
      prescriptionScore = this.scoringSystem.calculatePrescriptionScore({
        prescriptionCorrect: this.flowData.prescriptionData.selectedPrescription === this.flowData.prescriptionData.correctPrescription,
        correctPrescription: this.flowData.prescriptionData.correctPrescription,
        selectedPrescription: this.flowData.prescriptionData.selectedPrescription
      });
    } else {
      prescriptionScore = this.getDefaultStageScore('选方');
    }

    // 计算综合表现评分
    const totalTime = (Date.now() - this.flowData.startTime) / 1000;
    const clueEfficiency = requiredCollected / Math.max(1, this.flowData.inquiryData.dialogueHistory.filter(d => d.role === 'user').length);

    const overallScore = this.scoringSystem.calculateOverallScore({
      totalTime,
      clueEfficiency,
      errorCount: this.flowData.errorCount
    });

    // 计算总分
    const finalScore = this.scoringSystem.calculateTotalScore(
      inquiryScore,
      pulseScore,
      tongueScore,
      syndromeScore,
      prescriptionScore,
      overallScore
    );

    this.flowData.scoreResult = finalScore;

    console.log('[DiagnosisFlowManager] Final score calculated:', finalScore);

    return finalScore;
  }

  /**
   * 获取默认评分（数据缺失时）
   */
  private getDefaultScore(): DiagnosisScore {
    return {
      total: 0,
      maxTotal: 100,
      percentage: 0,
      stages: {
        inquiry: this.getDefaultStageScore('问诊'),
        pulse: this.getDefaultStageScore('脉诊'),
        tongue: this.getDefaultStageScore('舌诊'),
        syndrome: this.getDefaultStageScore('辨证'),
        prescription: this.getDefaultStageScore('选方'),
        overall: this.getDefaultStageScore('综合表现')
      },
      weaknesses: ['数据缺失'],
      strengths: []
    };
  }

  /**
   * 获取默认阶段评分
   */
  private getDefaultStageScore(stageName: string): StageScore {
    return {
      stage: stageName,
      maxScore: 100,
      earnedScore: 0,
      percentage: 0,
      details: [{
        item: '未完成',
        correct: false,
        score: 0
      }]
    };
  }

  /**
   * 获取当前阶段
   */
  getCurrentStage(): DiagnosisStage {
    return this.currentStage;
  }

  /**
   * 获取流程数据
   */
  getFlowData(): DiagnosisFlowData {
    return this.flowData;
  }

  /**
   * 获取病案数据
   */
  getCaseData(): CaseData | null {
    return this.caseData;
  }

  /**
   * 获取评分结果
   */
  getScoreResult(): DiagnosisScore | undefined {
    return this.flowData.scoreResult;
  }

  /**
   * 重置流程
   */
  reset(): void {
    this.flowData = {
      caseId: this.flowData.caseId,
      playerId: this.flowData.playerId,
      startTime: Date.now(),
      stageStartTime: Date.now(),
      stageTimes: {},
      errorCount: 0
    };
    this.currentStage = DiagnosisStage.INQUIRY;
    this.caseData = null;
    console.log('[DiagnosisFlowManager] Flow reset');
  }

  /**
   * 暴露到全局（供测试访问）
   * ⭐ 修复: 暴露完整实例而非数据快照，使测试可调用方法
   */
  exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__FLOW_MANAGER__ = this;  // 暴露完整实例
      (window as any).__DIAGNOSIS_FLOW__ = this;  // 兼容旧命名
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.scoringSystem.destroy();
    if (this.sceneSwitchHandler) {
      this.eventBus.off(GameEvents.SCENE_SWITCH, this.sceneSwitchHandler);
    }

    if (typeof window !== 'undefined') {
      (window as any).__DIAGNOSIS_FLOW__ = null;
    }

    console.log('[DiagnosisFlowManager] Destroyed');
  }
}