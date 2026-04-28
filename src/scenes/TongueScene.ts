// src/scenes/TongueScene.ts
/**
 * 舌诊场景
 *
 * @deprecated Phase 2.5 后已废弃，请使用 DiagnosisScene (HTML直接迁移版本)
 * 新的诊断游戏整合了舌诊→脉诊→问诊→辨证→选方5个阶段
 *
 * 功能:
 * - 显示舌象描述（或舌象图片）
 * - 玩家选择舌体颜色、舌苔、舌形、润燥
 * - 验证观察正确性
 * - 进入下一环节（辨证）
 *
 * Phase 2 S6b 实现
 */

import Phaser from 'phaser';
import { SCENES } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
import { DiagnosisFlowManager } from '../systems/DiagnosisFlowManager';
import { TongueUI, TongueUIConfig } from '../ui/TongueUI';

// 加载病案数据
import coreCasesData from '../data/cases/core_cases.json';

export interface TongueSceneConfig {
  caseId: string;
  flowManager?: DiagnosisFlowManager;
}

export class TongueScene extends Phaser.Scene {
  // 系统组件
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;
  private flowManager!: DiagnosisFlowManager;

  // UI组件
  private tongueUI!: TongueUI;

  // 数据
  private caseId: string;
  private caseData: any;

  constructor() {
    super({ key: 'TongueScene' });
    this.caseId = 'case_001';
  }

  init(data: TongueSceneConfig): void {
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

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: 'TongueScene' });

    // 加载病案数据
    this.loadCaseData();

    // 创建背景
    this.createBackground();

    // 创建舌诊UI
    this.createTongueUI();

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene('TongueScene');

    // 添加提示
    this.add.text(10, 10, '舌诊环节 (Phase 2 S6b)', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0).setDepth(100);

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: 'TongueScene' });
    (window as any).__SCENE_READY__ = true;

    this.exposeToGlobal();
  }

  /**
   * 加载病案数据
   */
  private loadCaseData(): void {
    const caseData = coreCasesData.cases.find(c => c.case_id === this.caseId);
    if (!caseData) {
      console.error(`[TongueScene] Case ${this.caseId} not found`);
      this.caseData = {
        tongue: {
          body_color: '淡红',
          coating: '薄白',
          shape: '正常',
          moisture: '润'
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
    this.add.text(this.cameras.main.width / 2, 50, '青木诊所 - 舌诊', {
      fontSize: '24px',
      color: '#8B4513',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1);
  }

  /**
   * 创建舌诊UI
   */
  private createTongueUI(): void {
    const tongueInfo = this.caseData.tongue;

    const uiConfig: TongueUIConfig = {
      correctBodyColor: tongueInfo.body_color,
      correctCoating: tongueInfo.coating,
      correctShape: tongueInfo.shape,
      correctMoisture: tongueInfo.moisture,
      onConfirm: (bodyColor, coating, shape, moisture) => this.handleTongueConfirm(bodyColor, coating, shape, moisture)
    };

    this.tongueUI = new TongueUI(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 30,  // 调整位置
      uiConfig
    );
  }

  /**
   * 处理舌诊确认
   */
  private handleTongueConfirm(bodyColor: string, coating: string, shape: string, moisture: string): void {
    console.log('[TongueScene] Tongue confirm:', { bodyColor, coating, shape, moisture });

    // 设置舌诊数据到流程管理器
    const result = this.flowManager.setTongueData(bodyColor, coating, shape, moisture);

    // 显示结果
    this.tongueUI.showResult(result.correctCount, result.totalCount);

    // 延迟进入下一环节
    this.time.delayedCall(1500, () => {
      this.transitionToSyndromeScene();
    });
  }

  /**
   * 切换到辨证场景
   */
  private transitionToSyndromeScene(): void {
    this.eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: 'TongueScene',
      to: 'SyndromeScene',
      data: {
        caseId: this.caseId,
        flowManager: this.flowManager
      }
    });

    this.scene.start(SCENES.SYNDROME, {
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
      (window as any).__TONGUE_SCENE__ = this;  // 暴露完整实例
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
   * 获取舌诊数据
   */
  getTongueData(): {
    bodyColor: string;
    coating: string;
    shape: string;
    moisture: string;
  } {
    return {
      bodyColor: this.caseData?.tongue?.body_color || '',
      coating: this.caseData?.tongue?.coating || '',
      shape: this.caseData?.tongue?.shape || '',
      moisture: this.caseData?.tongue?.moisture || ''
    };
  }

  update(): void {
    // 暂时不需要update逻辑
  }

  shutdown(): void {
    // 清理UI组件
    if (this.tongueUI) {
      this.tongueUI.destroy();
    }

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__TONGUE_SCENE__ = null;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: 'TongueScene' });
  }
}