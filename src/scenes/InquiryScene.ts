// src/scenes/InquiryScene.ts
/**
 * 问诊场景
 * 功能:
 * - 病人自主描述主诉（流式输出）
 * - 玩家自由追问，病人实时回答
 * - 线索追踪系统后台分析
 * - 必须线索收集完成后可进入下一环节
 *
 * Phase 2 S4 实现
 */

import Phaser from 'phaser';
import { SCENES } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
import { ClueTracker, ClueTrackerConfig } from '../systems/ClueTracker';
import { PatientDialogGenerator, PatientDialogConfig, PatientTemplate, CaseInfo, DialogResponse } from '../systems/PatientDialogGenerator';
import { InquiryUI, InquiryUIConfig } from '../ui/InquiryUI';

// 加载病案数据
import coreCasesData from '../data/cases/core_cases.json';
import farmerTemplate from '../data/patient-templates/farmer.json';
import merchantTemplate from '../data/patient-templates/merchant.json';
import scholarTemplate from '../data/patient-templates/scholar.json';
import elderTemplate from '../data/patient-templates/elder.json';
import childTemplate from '../data/patient-templates/child.json';

// 病人名字池
const PATIENT_NAMES = {
  farmer: ['张三', '李四', '王五', '赵六'],
  merchant: ['陈掌柜', '刘老板', '孙商贾', '周掌柜'],
  scholar: ['文先生', '徐秀才', '钱公子', '许书生'],
  elder: ['老张', '老李', '老王', '老赵'],
  child: ['小明', '小红', '小刚', '小芳']
};

// 年龄范围池
const AGE_RANGES = {
  farmer: [25, 50],
  merchant: [30, 55],
  scholar: [20, 40],
  elder: [60, 75],
  child: [8, 15]
};

export interface InquirySceneConfig {
  caseId: string;
  playerSpawnPoint?: { x: number; y: number };
}

export class InquiryScene extends Phaser.Scene {
  // 系统组件
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;
  private clueTracker!: ClueTracker;
  private patientGenerator!: PatientDialogGenerator;

  // UI组件
  private inquiryUI!: InquiryUI;

  // 数据
  private caseId: string;
  private caseInfo!: CaseInfo;
  private patientTemplate!: PatientTemplate;
  private patientName!: string;
  private patientAge!: number;

  // 状态
  private isInitialized: boolean = false;
  private hermesAvailable: boolean = false;

  constructor() {
    super({ key: 'InquiryScene' });
    // 默认使用case_001
    this.caseId = 'case_001';
  }

  init(data: InquirySceneConfig): void {
    this.caseId = data.caseId || 'case_001';
  }

  create(): void {
    // 初始化事件系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: 'InquiryScene' });

    // 初始化病案和病人数据
    this.initializeCaseData();

    // 创建背景
    this.createBackground();

    // 创建ClueTracker
    this.createClueTracker();

    // 创建PatientDialogGenerator
    this.createPatientDialogGenerator();

    // 创建问诊UI
    this.createInquiryUI();

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene('InquiryScene');

    // 检查Hermes服务可用性
    this.checkHermesAvailability();

    // 开始问诊流程
    this.startInquiry();

    // 添加提示
    this.add.text(10, 10, '问诊环节 (Phase 2 S4)', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0).setDepth(100);

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: 'InquiryScene' });
    (window as any).__SCENE_READY__ = true;

    // 暴露到全局供测试访问
    this.exposeToGlobal();
  }

  /**
   * 初始化病案和病人数据
   */
  private initializeCaseData(): void {
    // 加载病案数据
    const caseData = coreCasesData.cases.find(c => c.case_id === this.caseId);
    if (!caseData) {
      console.error(`[InquiryScene] Case ${this.caseId} not found`);
      // 使用默认病案
      this.caseInfo = {
        case_id: 'case_001',
        syndrome: { type: '风寒表实证', category: '风寒外感' },
        chief_complaint_template: '昨天冒雨干活后怕冷发热无汗一天',
        clues: {
          required: ['恶寒重', '无汗', '发热轻', '脉浮紧'],
          auxiliary: ['身痛', '头痛', '起病原因', '口渴情况']
        }
      };
    } else {
      this.caseInfo = caseData as CaseInfo;
    }

    // 选择病人模板（简化：根据病案类型选择）
    // 风寒类用farmer，风热类用merchant
    const templateId = this.caseInfo.syndrome.category.includes('风寒') ? 'farmer' : 'merchant';

    // 加载病人模板
    const templates: Record<string, PatientTemplate> = {
      farmer: farmerTemplate as PatientTemplate,
      merchant: merchantTemplate as PatientTemplate,
      scholar: scholarTemplate as PatientTemplate,
      elder: elderTemplate as PatientTemplate,
      child: childTemplate as PatientTemplate
    };

    this.patientTemplate = templates[templateId] || farmerTemplate as PatientTemplate;

    // 随机选择病人名字和年龄
    const names = PATIENT_NAMES[templateId] || PATIENT_NAMES.farmer;
    this.patientName = names[Math.floor(Math.random() * names.length)];

    const ageRange = AGE_RANGES[templateId] || AGE_RANGES.farmer;
    this.patientAge = ageRange[0] + Math.floor(Math.random() * (ageRange[1] - ageRange[0]));

    console.log('[InquiryScene] Initialized:', {
      caseId: this.caseId,
      templateId: templateId,
      patientName: this.patientName,
      patientAge: this.patientAge
    });
  }

  /**
   * 创建背景
   */
  private createBackground(): void {
    // 简化背景：深色诊所背景
    const bg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x1a1a1a
    );
    bg.setDepth(0);

    // 添加诊所氛围元素（简化）
    this.add.text(this.cameras.main.width / 2, 50, '青木诊所 - 问诊', {
      fontSize: '24px',
      color: '#8B4513',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);
  }

  /**
   * 创建ClueTracker
   */
  private createClueTracker(): void {
    const trackerConfig: ClueTrackerConfig = {
      caseId: this.caseId,
      clues: this.caseInfo.clues,
      playerId: 'player_001'
    };
    this.clueTracker = new ClueTracker(trackerConfig);
  }

  /**
   * 创建PatientDialogGenerator
   */
  private createPatientDialogGenerator(): void {
    const generatorConfig: PatientDialogConfig = {
      template: this.patientTemplate,
      caseInfo: this.caseInfo,
      playerId: 'player_001',
      patientName: this.patientName,
      patientAge: this.patientAge
    };
    this.patientGenerator = new PatientDialogGenerator(generatorConfig);
  }

  /**
   * 创建问诊UI
   */
  private createInquiryUI(): void {
    const uiConfig: InquiryUIConfig = {
      patientName: this.patientName,
      patientOccupation: this.patientTemplate.occupation,
      patientAge: this.patientAge,
      clueTracker: this.clueTracker,
      onSendQuestion: (question) => this.handlePlayerQuestion(question),
      onComplete: () => this.handleCompleteInquiry()
    };

    this.inquiryUI = new InquiryUI(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      uiConfig
    );
  }

  /**
   * 检查Hermes服务可用性
   */
  private async checkHermesAvailability(): Promise<void> {
    this.hermesAvailable = await this.patientGenerator.checkConnection();
    console.log('[InquiryScene] Hermes available:', this.hermesAvailable);
  }

  /**
   * 开始问诊流程
   */
  private async startInquiry(): Promise<void> {
    this.isInitialized = true;

    // 延迟1秒后显示病人主诉
    this.time.delayedCall(1000, async () => {
      if (this.hermesAvailable) {
        // 使用AI生成主诉
        await this.patientGenerator.generateChiefComplaint(
          (chunk) => this.handleChiefComplaintChunk(chunk),
          (response) => this.handleChiefComplaintComplete(response),
          (error) => this.handleChiefComplaintError(error)
        );
      } else {
        // 使用本地生成
        this.handleChiefComplaintLocal();
      }
    });
  }

  /**
   * 处理主诉流式输出chunk
   */
  private handleChiefComplaintChunk(chunk: string): void {
    // 显示病人对话（流式）- 直接使用chunk更新UI
    this.inquiryUI.displayPatientDialogue(chunk, true);
  }

  /**
   * 处理主诉完成
   */
  private handleChiefComplaintComplete(response: DialogResponse): void {
    console.log('[InquiryScene] Chief complaint complete:', response);

    // 更新UI显示完整对话
    this.inquiryUI.displayPatientDialogue(response.text, false);

    // 记录对话历史
    this.clueTracker.addDialogue('assistant', response.text);

    // 更新线索状态
    for (const clueId of response.revealedClues) {
      this.clueTracker.updateClueState(clueId, true);
    }

    // 更新UI线索显示
    this.inquiryUI.updateClueStates(this.clueTracker.getAllClueStates());

    this.exposeToGlobal();
  }

  /**
   * 处理主诉本地生成（备用）
   */
  private handleChiefComplaintLocal(): void {
    const response = this.patientGenerator.generateLocalChiefComplaint();
    this.handleChiefComplaintComplete(response);
  }

  /**
   * 处理主诉错误
   */
  private handleChiefComplaintError(error: Error): void {
    console.error('[InquiryScene] Chief complaint error:', error);
    // 使用本地生成作为备用
    this.handleChiefComplaintLocal();
  }

  /**
   * 处理玩家追问
   */
  private async handlePlayerQuestion(question: string): Promise<void> {
    if (!this.isInitialized) return;

    // 显示玩家问题
    this.inquiryUI.displayPlayerQuestion(question);

    // 记录问题到对话历史
    this.clueTracker.addDialogue('user', question);

    if (this.hermesAvailable) {
      // 使用AI生成回答
      await this.patientGenerator.generateFollowUpResponse(
        question,
        (chunk) => this.handleFollowUpChunk(chunk),
        (response) => this.handleFollowUpComplete(response),
        (error) => this.handleFollowUpError(error)
      );
    } else {
      // 使用本地生成
      this.handleFollowUpLocal(question);
    }
  }

  /**
   * 处理追问回答流式输出chunk
   */
  private handleFollowUpChunk(chunk: string): void {
    // 显示病人对话（流式）- 直接使用chunk更新UI
    this.inquiryUI.displayPatientDialogue(chunk, true);
  }

  /**
   * 处理追问回答完成
   */
  private handleFollowUpComplete(response: DialogResponse): void {
    console.log('[InquiryScene] Follow-up complete:', response);

    // 更新UI
    this.inquiryUI.displayPatientDialogue(response.text, false);

    // 记录对话历史
    this.clueTracker.addDialogue('assistant', response.text);

    // 更新线索状态
    for (const clueId of response.revealedClues) {
      this.clueTracker.updateClueState(clueId, true);
    }

    // 执行AI线索分析（可选）
    this.performClueAnalysis();

    // 更新UI线索显示
    this.inquiryUI.updateClueStates(this.clueTracker.getAllClueStates());

    this.exposeToGlobal();
  }

  /**
   * 处理追问本地生成（备用）
   */
  private handleFollowUpLocal(question: string): void {
    const response = this.patientGenerator.generateLocalFollowUpResponse(question);
    this.handleFollowUpComplete(response);
  }

  /**
   * 处理追问错误
   */
  private handleFollowUpError(error: Error): void {
    console.error('[InquiryScene] Follow-up error:', error);
    // 获取当前问题用于本地生成
    const dialogues = this.patientGenerator.getDialogueHistory();
    const lastQuestion = dialogues.find(d => d.role === 'user')?.content || '';
    this.handleFollowUpLocal(lastQuestion);
  }

  /**
   * 执行线索分析
   */
  private async performClueAnalysis(): Promise<void> {
    try {
      const result = await this.clueTracker.analyzeClues();
      console.log('[InquiryScene] Clue analysis result:', result);

      // 应用分析结果
      this.clueTracker.applyAnalysisResult(result);

      // 更新UI
      this.inquiryUI.updateClueStates(this.clueTracker.getAllClueStates());
    } catch (error) {
      // 使用本地分析作为备用
      const localResult = this.clueTracker.localAnalyzeClues();
      this.clueTracker.applyAnalysisResult(localResult);
      this.inquiryUI.updateClueStates(this.clueTracker.getAllClueStates());
    }
  }

  /**
   * 处理完成问诊
   */
  private handleCompleteInquiry(): void {
    // 检查必须线索是否收集完成
    if (this.clueTracker.areRequiredCluesComplete()) {
      console.log('[InquiryScene] Inquiry complete, transitioning to pulse scene');

      // 发送事件
      this.eventBus.emit(GameEvents.SCENE_SWITCH, {
        from: 'InquiryScene',
        to: 'PulseScene',
        data: {
          caseId: this.caseId,
          clueTrackerState: this.clueTracker.getAllClueStates()
        }
      });

      // 切换到脉诊场景（S6a）
      // 注：脉诊场景尚未实现，这里暂时返回诊所
      this.scene.start(SCENES.CLINIC);
    } else {
      // 显示无法进入下一环节提示
      this.inquiryUI.showIncompleteWarning();
    }
  }

  /**
   * 暴露到全局（供测试访问）
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__INQUIRY_SCENE__ = {
        caseId: this.caseId,
        patientName: this.patientName,
        patientAge: this.patientAge,
        hermesAvailable: this.hermesAvailable,
        isInitialized: this.isInitialized,
        requiredCluesComplete: this.clueTracker.areRequiredCluesComplete(),
        clueStates: this.clueTracker.getAllClueStates(),
        dialogueHistory: this.clueTracker.getDialogueHistory()
      };
    }
  }

  /**
   * 获取病案ID
   */
  getCaseId(): string {
    return this.caseId;
  }

  /**
   * 获取病人信息
   */
  getPatientInfo(): { name: string; age: number; occupation: string } {
    return {
      name: this.patientName,
      age: this.patientAge,
      occupation: this.patientTemplate.occupation
    };
  }

  /**
   * 获取线索状态
   */
  getClueStates(): { clueId: string; collected: boolean }[] {
    return this.clueTracker.getAllClueStates().map(s => ({
      clueId: s.clueId,
      collected: s.collected
    }));
  }

  update(): void {
    // 暂时不需要update逻辑
  }

  shutdown(): void {
    // 清理组件
    if (this.inquiryUI) {
      this.inquiryUI.destroy();
    }
    if (this.clueTracker) {
      this.clueTracker.destroy();
    }
    if (this.patientGenerator) {
      this.patientGenerator.destroy();
    }

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__INQUIRY_SCENE__ = null;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: 'InquiryScene' });
  }
}