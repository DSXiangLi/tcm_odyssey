// src/scenes/SyndromeScene.ts
/**
 * 辨证场景
 *
 * @deprecated Phase 2.5 后已废弃，请使用 DiagnosisScene (HTML直接迁移版本)
 * 新的诊断游戏整合了舌诊→脉诊→问诊→辨证→选方5个阶段
 *
 * 功能:
 * - 显示已收集信息汇总（问诊+脉诊+舌诊）
 * - 玩家选择证型
 * - 玩家论述推理过程
 * - 进入下一环节（选方）
 *
 * Phase 2 S6c 实现
 */

import Phaser from 'phaser';
import { SCENES } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
import { DiagnosisFlowManager } from '../systems/DiagnosisFlowManager';
import { SyndromeUI, SyndromeUIConfig, InfoSummaryData } from '../ui/SyndromeUI';
import { ClueState } from '../systems/ClueTracker';

// 加载病案数据
import coreCasesData from '../data/cases/core_cases.json';

export interface SyndromeSceneConfig {
  caseId: string;
  flowManager?: DiagnosisFlowManager;
  clueStates?: ClueState[];  // 从问诊传递的线索状态
  pulseResult?: { position: string; tension: string };  // 从脉诊传递的结果
  tongueResult?: { bodyColor: string; coating: string; shape: string; moisture: string };  // 从舌诊传递的结果
}

export class SyndromeScene extends Phaser.Scene {
  // 系统组件
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;
  private flowManager!: DiagnosisFlowManager;

  // UI组件
  private syndromeUI!: SyndromeUI;

  // 数据
  private caseId: string;
  private caseData: any;
  private clueStates: ClueState[];
  private pulseResult: { position: string; tension: string };
  private tongueResult: { bodyColor: string; coating: string; shape: string; moisture: string };

  constructor() {
    super({ key: 'SyndromeScene' });
    this.caseId = 'case_001';
    this.clueStates = [];
    this.pulseResult = { position: '', tension: '' };
    this.tongueResult = { bodyColor: '', coating: '', shape: '', moisture: '' };
  }

  init(data: SyndromeSceneConfig): void {
    this.caseId = data.caseId || 'case_001';

    // 获取流程管理器
    if (data.flowManager) {
      this.flowManager = data.flowManager;
    } else {
      this.flowManager = new DiagnosisFlowManager(this.caseId, 'player_001');
    }

    // 获取从前置环节传递的数据
    this.clueStates = data.clueStates || [];
    this.pulseResult = data.pulseResult || { position: '', tension: '' };
    this.tongueResult = data.tongueResult || { bodyColor: '', coating: '', shape: '', moisture: '' };
  }

  create(): void {
    // 初始化事件系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: 'SyndromeScene' });

    // 加载病案数据
    this.loadCaseData();

    // 从流程管理器获取数据（如果没有从参数传递）
    this.loadDataFromFlowManager();

    // 创建背景
    this.createBackground();

    // 创建辨证UI
    this.createSyndromeUI();

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene('SyndromeScene');

    // 添加提示
    this.add.text(10, 10, '辨证环节 (Phase 2 S6c)', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0).setDepth(100);

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: 'SyndromeScene' });
    (window as any).__SCENE_READY__ = true;

    this.exposeToGlobal();
  }

  /**
   * 加载病案数据
   */
  private loadCaseData(): void {
    const caseData = coreCasesData.cases.find(c => c.case_id === this.caseId);
    if (!caseData) {
      console.error(`[SyndromeScene] Case ${this.caseId} not found`);
      this.caseData = {
        syndrome: { type: '风寒表实证' },
        clues: { required: [], auxiliary: [] },
        chief_complaint_template: ''
      };
    } else {
      this.caseData = caseData;
    }

    // 加载到流程管理器
    this.flowManager.loadCaseData(this.caseData);
  }

  /**
   * 从流程管理器加载数据
   */
  private loadDataFromFlowManager(): void {
    const flowData = this.flowManager.getFlowData();

    // 如果没有从参数传递，从流程管理器获取
    if (this.clueStates.length === 0 && flowData.inquiryData) {
      this.clueStates = flowData.inquiryData.clueStates;
    }

    if (!this.pulseResult.position && flowData.pulseData) {
      this.pulseResult = {
        position: flowData.pulseData.selectedPosition,
        tension: flowData.pulseData.selectedTension
      };
    }

    if (!this.tongueResult.bodyColor && flowData.tongueData) {
      this.tongueResult = {
        bodyColor: flowData.tongueData.selectedBodyColor,
        coating: flowData.tongueData.selectedCoating,
        shape: flowData.tongueData.selectedShape,
        moisture: flowData.tongueData.selectedMoisture
      };
    }
  }

  /**
   * 创建背景
   */
  private createBackground(): void {
    // 简化背景
    const bg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x1a1a1a
    );
    bg.setDepth(0);

    // 添加诊所氛围元素
    this.add.text(this.cameras.main.width / 2, 50, '青木诊所 - 辨证', {
      fontSize: '24px',
      color: '#8B4513',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);
  }

  /**
   * 创建辨证UI
   */
  private createSyndromeUI(): void {
    // 构建信息汇总
    const infoSummary: InfoSummaryData = {
      chiefComplaint: this.caseData.chief_complaint_template || '未知主诉',
      inquirySummary: this.buildInquirySummary(),
      pulseResult: `脉${this.pulseResult.position}${this.pulseResult.tension}`,
      tongueResult: `舌${this.tongueResult.bodyColor}，苔${this.tongueResult.coating}`,
      clueStates: this.clueStates
    };

    // 获取证型选项（根据病案类别）
    const syndromeOptions = this.getSyndromeOptions();

    const uiConfig: SyndromeUIConfig = {
      infoSummary,
      syndromeOptions,
      correctSyndrome: this.caseData.syndrome.type,
      onConfirm: (syndrome, reasoning) => this.handleSyndromeConfirm(syndrome, reasoning)
    };

    this.syndromeUI = new SyndromeUI(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      uiConfig
    );
  }

  /**
   * 构建问诊摘要
   */
  private buildInquirySummary(): string {
    const collectedClues = this.clueStates.filter(c => c.collected).map(c => c.clueId);
    return collectedClues.length > 0 ? collectedClues.join('、') : '暂无收集线索';
  }

  /**
   * 获取证型选项
   */
  private getSyndromeOptions(): string[] {
    const category = this.caseData.syndrome?.category || '';

    // 根据病案类别返回相关证型
    if (category.includes('风寒')) {
      return ['风寒表实证', '风寒表虚证', '风寒湿痹证'];
    } else if (category.includes('风热')) {
      return ['风热犯卫证', '风温咳嗽证', '风热感冒证'];
    }

    // 默认返回所有证型
    return ['风寒表实证', '风寒表虚证', '风热犯卫证', '风温咳嗽证'];
  }

  /**
   * 处理辨证确认
   */
  private handleSyndromeConfirm(syndrome: string, reasoning: string): void {
    console.log('[SyndromeScene] Syndrome confirm:', { syndrome, reasoning });

    // 设置辨证数据到流程管理器
    const isCorrect = this.flowManager.setSyndromeData(syndrome, reasoning);

    // 显示结果（简化：不显示论述评分）
    this.syndromeUI.showResult(isCorrect, 25);  // 基础分25

    // 延迟进入下一环节
    this.time.delayedCall(1500, () => {
      this.transitionToPrescriptionScene();
    });
  }

  /**
   * 切换到选方场景
   */
  private transitionToPrescriptionScene(): void {
    this.eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: 'SyndromeScene',
      to: 'PrescriptionScene',
      data: {
        caseId: this.caseId,
        flowManager: this.flowManager
      }
    });

    this.scene.start(SCENES.PRESCRIPTION, {
      caseId: this.caseId,
      flowManager: this.flowManager
    });
  }

  /**
   * 暴露到全局（供测试访问）
   * ⭐ 修复: 暴露完整实例而非数据快照，使测试可调用方法
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__SYNDROME_SCENE__ = this;  // 暴露完整实例
      this.flowManager.exposeToGlobal();  // 同时暴露流程管理器
    }
  }

  /**
   * 获取病案ID
   */
  getCaseId(): string {
    return this.caseId;
  }

  /**
   * 获取流程管理器（供测试访问）
   */
  getFlowManager(): DiagnosisFlowManager {
    return this.flowManager;
  }

  /**
   * 获取辨证数据
   */
  getSyndromeData(): {
    correctSyndrome: string;
    syndromeOptions: string[];
  } {
    return {
      correctSyndrome: this.caseData?.syndrome?.type || '',
      syndromeOptions: this.getSyndromeOptions()
    };
  }

  update(): void {
    // 暂时不需要update逻辑
  }

  shutdown(): void {
    // 清理UI组件
    if (this.syndromeUI) {
      this.syndromeUI.destroy();
    }

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__SYNDROME_SCENE__ = null;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: 'SyndromeScene' });
  }
}