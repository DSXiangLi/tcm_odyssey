// src/scenes/PrescriptionScene.ts
/**
 * 选方场景
 *
 * @deprecated Phase 2.5 后已废弃，请使用 DiagnosisScene (HTML直接迁移版本)
 * 新的诊断游戏整合了舌诊→脉诊→问诊→辨证→选方5个阶段
 *
 * 功能:
 * - 显示方剂列表（麻黄汤/桂枝汤/银翘散/桑菊饮）
 * - 显示方剂详情
 * - 方剂加减按钮（未解锁）
 * - 进入评分环节
 *
 * Phase 2 S6d 实现
 */

import Phaser from 'phaser';
import { SCENES } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
import { DiagnosisFlowManager } from '../systems/DiagnosisFlowManager';
import { PrescriptionUI, PrescriptionUIConfig } from '../ui/PrescriptionUI';

// 加载病案数据
import coreCasesData from '../data/cases/core_cases.json';

export interface PrescriptionSceneConfig {
  caseId: string;
  flowManager?: DiagnosisFlowManager;
}

export class PrescriptionScene extends Phaser.Scene {
  // 系统组件
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;
  private flowManager!: DiagnosisFlowManager;

  // UI组件
  private prescriptionUI!: PrescriptionUI;

  // 数据
  private caseId: string;
  private caseData: any;

  constructor() {
    super({ key: 'PrescriptionScene' });
    this.caseId = 'case_001';
  }

  init(data: PrescriptionSceneConfig): void {
    this.caseId = data.caseId || 'case_001';

    // 获取流程管理器
    if (data.flowManager) {
      this.flowManager = data.flowManager;
    } else {
      this.flowManager = new DiagnosisFlowManager(this.caseId, 'player_001');
    }
  }

  create(): void {
    // 初始化事件系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: 'PrescriptionScene' });

    // 加载病案数据
    this.loadCaseData();

    // 创建背景
    this.createBackground();

    // 创建选方UI
    this.createPrescriptionUI();

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene('PrescriptionScene');

    // 添加提示
    this.add.text(10, 10, '选方环节 (Phase 2 S6d)', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0).setDepth(100);

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: 'PrescriptionScene' });
    (window as any).__SCENE_READY__ = true;

    this.exposeToGlobal();
  }

  /**
   * 加载病案数据
   */
  private loadCaseData(): void {
    const caseData = coreCasesData.cases.find(c => c.case_id === this.caseId);
    if (!caseData) {
      console.error(`[PrescriptionScene] Case ${this.caseId} not found`);
      this.caseData = {
        prescription: { name: '麻黄汤' },
        syndrome: { type: '风寒表实证' }
      };
    } else {
      this.caseData = caseData;
    }

    // 加载到流程管理器
    this.flowManager.loadCaseData(this.caseData);
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
    this.add.text(this.cameras.main.width / 2, 50, '青木诊所 - 选方', {
      fontSize: '24px',
      color: '#8B4513',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);
  }

  /**
   * 创建选方UI
   */
  private createPrescriptionUI(): void {
    const prescriptionInfo = this.caseData.prescription;

    const uiConfig: PrescriptionUIConfig = {
      correctPrescription: prescriptionInfo.name,
      onConfirm: (prescription) => this.handlePrescriptionConfirm(prescription)
    };

    this.prescriptionUI = new PrescriptionUI(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      uiConfig
    );
  }

  /**
   * 处理选方确认
   */
  private async handlePrescriptionConfirm(prescription: string): Promise<void> {
    console.log('[PrescriptionScene] Prescription confirm:', prescription);

    // 设置选方数据到流程管理器
    const isCorrect = this.flowManager.setPrescriptionData(prescription);

    // 显示结果
    this.prescriptionUI.showResult(isCorrect);

    // 计算最终评分
    const score = await this.flowManager.calculateFinalScore();
    console.log('[PrescriptionScene] Final score:', score);

    // 暴露流程管理器到全局
    this.flowManager.exposeToGlobal();

    // 延迟进入结果场景
    this.time.delayedCall(1500, () => {
      this.transitionToResultScene(score);
    });
  }

  /**
   * 切换到结果场景
   */
  private transitionToResultScene(score: any): void {
    // 暂时使用诊所作为结果场景
    // TODO: 创建专门的结果场景
    this.eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: 'PrescriptionScene',
      to: 'ClinicScene',
      data: {
        caseId: this.caseId,
        score: score
      }
    });

    this.scene.start(SCENES.CLINIC, {
      caseId: this.caseId,
      score: score
    });
  }

  /**
   * 暴露到全局（供测试访问）
   * ⭐ 修复: 暴露完整实例而非数据快照，使测试可调用方法
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__PRESCRIPTION_SCENE__ = this;  // 暴露完整实例
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
   * 获取选方数据
   */
  getPrescriptionData(): {
    correctPrescription: string;
  } {
    return {
      correctPrescription: this.caseData?.prescription?.name || ''
    };
  }

  update(): void {
    // 暂时不需要update逻辑
  }

  shutdown(): void {
    // 清理UI组件
    if (this.prescriptionUI) {
      this.prescriptionUI.destroy();
    }

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__PRESCRIPTION_SCENE__ = null;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: 'PrescriptionScene' });
  }
}