// src/scenes/PulseScene.ts
/**
 * 脉诊场景
 * 功能:
 * - 显示古文脉象描述（《脉经》原文）
 * - 玩家选择脉位和脉势
 * - 验证判断正确性
 * - 进入下一环节（舌诊）
 *
 * Phase 2 S6a 实现
 */

import Phaser from 'phaser';
import { SCENES } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
import { DiagnosisFlowManager } from '../systems/DiagnosisFlowManager';
import { PulseUI, PulseUIConfig } from '../ui/PulseUI';

// 加载病案数据
import coreCasesData from '../data/cases/core_cases.json';

export interface PulseSceneConfig {
  caseId: string;
  flowManager?: DiagnosisFlowManager;
}

export class PulseScene extends Phaser.Scene {
  // 系统组件
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;
  private flowManager!: DiagnosisFlowManager;

  // UI组件
  private pulseUI!: PulseUI;

  // 数据
  private caseId: string;
  private caseData: any;

  constructor() {
    super({ key: 'PulseScene' });
    this.caseId = 'case_001';
  }

  init(data: PulseSceneConfig): void {
    this.caseId = data.caseId || 'case_001';

    // 获取流程管理器（如果已传递）
    if (data.flowManager) {
      this.flowManager = data.flowManager;
    } else {
      // 创建新的流程管理器
      this.flowManager = new DiagnosisFlowManager(this.caseId, 'player_001');
    }
  }

  create(): void {
    // 初始化事件系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: 'PulseScene' });

    // 加载病案数据
    this.loadCaseData();

    // 创建背景
    this.createBackground();

    // 创建脉诊UI
    this.createPulseUI();

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene('PulseScene');

    // 添加提示
    this.add.text(10, 10, '脉诊环节 (Phase 2 S6a)', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0).setDepth(100);

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: 'PulseScene' });
    (window as any).__SCENE_READY__ = true;

    this.exposeToGlobal();
  }

  /**
   * 加载病案数据
   */
  private loadCaseData(): void {
    const caseData = coreCasesData.cases.find(c => c.case_id === this.caseId);
    if (!caseData) {
      console.error(`[PulseScene] Case ${this.caseId} not found`);
      // 使用默认病案数据
      this.caseData = {
        pulse: {
          position: '浮',
          tension: '紧',
          description: '脉来浮取即得，重按稍减，紧如转索'
        },
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
    // 简化背景：深色诊所背景
    const bg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      this.cameras.main.width,
      this.cameras.main.height,
      0x1a1a1a
    );
    bg.setDepth(0);

    // 添加诊所氛围元素
    this.add.text(this.cameras.main.width / 2, 50, '青木诊所 - 切脉', {
      fontSize: '24px',
      color: '#8B4513',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);
  }

  /**
   * 创建脉诊UI
   */
  private createPulseUI(): void {
    const pulseInfo = this.caseData.pulse;

    const uiConfig: PulseUIConfig = {
      correctPosition: pulseInfo.position,
      correctTension: pulseInfo.tension,
      pulseDescription: pulseInfo.description,
      onConfirm: (position, tension) => this.handlePulseConfirm(position, tension)
    };

    this.pulseUI = new PulseUI(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      uiConfig
    );
  }

  /**
   * 处理脉诊确认
   */
  private handlePulseConfirm(position: string, tension: string): void {
    console.log('[PulseScene] Pulse confirm:', { position, tension });

    // 设置脉诊数据到流程管理器
    const isCorrect = this.flowManager.setPulseData(position, tension);

    // 显示结果
    this.pulseUI.showResult(isCorrect);

    // 延迟进入下一环节
    this.time.delayedCall(1500, () => {
      this.transitionToTongueScene();
    });
  }

  /**
   * 切换到舌诊场景
   */
  private transitionToTongueScene(): void {
    this.eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: 'PulseScene',
      to: 'TongueScene',
      data: {
        caseId: this.caseId,
        flowManager: this.flowManager
      }
    });

    this.scene.start(SCENES.TONGUE, {
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
      (window as any).__PULSE_SCENE__ = this;  // 暴露完整实例
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
   * 获取脉诊数据
   */
  getPulseData(): {
    position: string;
    tension: string;
    description: string;
  } {
    return this.caseData?.pulse || {
      position: '',
      tension: '',
      description: ''
    };
  }

  update(): void {
    // 暂时不需要update逻辑
  }

  shutdown(): void {
    // 清理UI组件
    if (this.pulseUI) {
      this.pulseUI.destroy();
    }

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__PULSE_SCENE__ = null;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: 'PulseScene' });
  }
}