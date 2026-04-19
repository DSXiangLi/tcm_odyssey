// src/ui/CaseDetailUI.ts
/**
 * 病案详情界面组件
 *
 * 功能:
 * - 显示病案完整信息（证型、方剂、线索、脉象、舌象）
 * - 显示完成后的评分详情
 * - 显示NPC点评
 * - 支持开始诊治或回顾历史
 *
 * Phase 2 S5 实现
 * Phase 2.5 UI统一化: 继承ModalUI基类
 */

import Phaser from 'phaser';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
import { CaseManager, CaseState, CaseHistoryRecord } from '../systems/CaseManager';
import ModalUI from './base/ModalUI';

export interface CaseDetailUIConfig {
  caseId: string;
  caseManager: CaseManager;
  onStartCase?: (caseId: string) => void;
  onClose?: () => void;
}

/**
 * 病案详情UI组件
 * Phase 2.5 UI统一化: 继承ModalUI，使用标准弹窗尺寸
 */
export class CaseDetailUI extends ModalUI {
  private caseId: string;
  private caseManager: CaseManager;
  private caseState: CaseState;
  private titleText!: Phaser.GameObjects.Text;
  private config: CaseDetailUIConfig;

  constructor(scene: Phaser.Scene, config: CaseDetailUIConfig) {
    // 先调用super()，使用空回调（稍后会在onExit中设置）
    // 注意：不能在super()参数中使用this，因为此时this还未创建
    super(
      scene,
      'DIAGNOSIS_MODAL',
      '[关闭]',
      () => {
        // 占位回调，会在super()返回后重新设置
      },
      100
    );

    // super()完成后，this已创建，可以安全设置属性
    this.config = config;
    this.caseId = config.caseId;
    this.caseManager = config.caseManager;
    this.caseState = this.caseManager.getCase(this.caseId)!;

    // 重新设置onExit回调，此时可以安全使用this
    this.onExit = () => {
      console.log('[CaseDetailUI] Close button clicked');
      if (config.onClose) config.onClose();
      this.destroy();
    };

    if (!this.caseState) {
      console.error(`[CaseDetailUI] Case ${this.caseId} not found`);
      this.exposeErrorState(`Case ${this.caseId} not found`);
      this.destroy();
      return;
    }

    try {
      // 创建标题
      this.titleText = scene.add.text(0, -230, '病案详情', {
        fontSize: '24px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY,
        fontStyle: 'bold'
      });
      this.titleText.setOrigin(0.5);
      this.container.add(this.titleText);

      // 创建病案ID和状态
      this.createHeader();

      // 创建内容区域
      this.createContent();

      // 设置深度
      this.container.setDepth(this.depth);

      // 暴露到全局供测试访问
      this.exposeToGlobalCustom();

      console.log('[CaseDetailUI] Constructor completed successfully');
    } catch (error) {
      console.error('[CaseDetailUI] Constructor error:', error);
      this.exposeErrorState(error);
    }
  }

  /**
   * 暴露错误状态（用于调试）
   */
  private exposeErrorState(error: any): void {
    if (typeof window !== 'undefined') {
      (window as any).__CASE_DETAIL_UI__ = {
        error: error?.message || 'Unknown error',
        visible: false
      };
    }
  }

  /**
   * 创建头部信息
   */
  private createHeader(): void {
    const definition = this.caseState.definition;

    // 病案ID
    const idText = this.scene.add.text(-340, -200, `ID: ${this.caseId}`, {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY
    });
    this.container.add(idText);

    // 状态标签
    const statusText = this.scene.add.text(340, -200, this.getStatusText(), {
      fontSize: '14px',
      color: this.getStatusColor(),
      backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
      padding: { x: 6, y: 2 }
    });
    statusText.setOrigin(1, 0);
    this.container.add(statusText);

    // 证型标题
    const syndromeTitle = this.scene.add.text(0, -160,
      `${definition.syndrome.type} (${definition.syndrome.category})`,
      {
        fontSize: '20px',
        color: '#90c070',  // SOFT_GREEN
        fontStyle: 'bold'
      }
    );
    syndromeTitle.setOrigin(0.5);
    this.container.add(syndromeTitle);

    // 方剂名称
    const prescriptionText = this.scene.add.text(0, -130,
      `方剂: ${definition.prescription.name}`,
      {
        fontSize: '16px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY
      }
    );
    prescriptionText.setOrigin(0.5);
    this.container.add(prescriptionText);

    // 难度
    const difficultyText = this.scene.add.text(-340, -130,
      `难度: ${this.getDifficultyText(definition.difficulty)}`,
      {
        fontSize: '14px',
        color: this.getDifficultyColor(definition.difficulty)
      }
    );
    this.container.add(difficultyText);
  }

  /**
   * 创建内容区域
   */
  private createContent(): void {
    const definition = this.caseState.definition;
    let contentY = -90;

    // 主诉
    this.createSectionTitle('主诉', -340, contentY);
    const chiefComplaint = this.scene.add.text(-340, contentY + 25,
      definition.chief_complaint_template,
      {
        fontSize: '14px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY,
        wordWrap: { width: 340 }
      }
    );
    this.container.add(chiefComplaint);
    contentY += 60;

    // 关键线索
    this.createSectionTitle('必须线索', -340, contentY);
    const requiredClues = this.scene.add.text(-340, contentY + 25,
      definition.clues.required.join('、'),
      {
        fontSize: '14px',
        color: '#90c070',  // SOFT_GREEN
        wordWrap: { width: 340 }
      }
    );
    this.container.add(requiredClues);

    this.createSectionTitle('辅助线索', 40, contentY);
    const auxiliaryClues = this.scene.add.text(40, contentY + 25,
      definition.clues.auxiliary.join('、'),
      {
        fontSize: '14px',
        color: '#b0a090',  // TEXT_SECONDARY
        wordWrap: { width: 340 }
      }
    );
    this.container.add(auxiliaryClues);
    contentY += 70;

    // 脉象和舌象
    this.createSectionTitle('脉象', -340, contentY);
    const pulseText = this.scene.add.text(-340, contentY + 25,
      `${definition.pulse.position}${definition.pulse.tension}脉\n"${definition.pulse.description}"`,
      {
        fontSize: '14px',
        color: '#c0c080',  // SOFT_YELLOW
        wordWrap: { width: 340 }
      }
    );
    this.container.add(pulseText);

    this.createSectionTitle('舌象', 40, contentY);
    const tongueText = this.scene.add.text(40, contentY + 25,
      `舌${definition.tongue.body_color}，苔${definition.tongue.coating}\n舌形${definition.tongue.shape}，${definition.tongue.moisture}`,
      {
        fontSize: '14px',
        color: '#c0c080',  // SOFT_YELLOW
        wordWrap: { width: 340 }
      }
    );
    this.container.add(tongueText);
    contentY += 90;

    // 教学要点
    this.createSectionTitle('教学要点', -340, contentY);
    const keyPoints = this.scene.add.text(-340, contentY + 25,
      definition.teaching_notes.key_points.join('\n'),
      {
        fontSize: '12px',
        color: '#b0a090',  // TEXT_SECONDARY
        wordWrap: { width: 700 }
      }
    );
    this.container.add(keyPoints);
    contentY += 60;

    // 常见错误
    this.createSectionTitle('常见错误', -340, contentY);
    const mistakes = this.scene.add.text(-340, contentY + 25,
      definition.teaching_notes.common_mistakes.join('\n'),
      {
        fontSize: '12px',
        color: '#c07070',  // SOFT_RED
        wordWrap: { width: 700 }
      }
    );
    this.container.add(mistakes);

    // 如果已完成，显示历史记录
    if (this.caseState.status === 'completed' && this.caseState.history) {
      this.createHistorySection(this.caseState.history);
    }

    // 创建操作按钮
    this.createActionButtons();
  }

  /**
   * 创建小节标题
   */
  private createSectionTitle(title: string, x: number, y: number): void {
    const titleBg = this.scene.add.rectangle(x, y, 760, 25, UI_COLORS.PANEL_LIGHT, 0.8);
    titleBg.setOrigin(0, 0);
    this.container.add(titleBg);

    const titleText = this.scene.add.text(x + 10, y + 5, title, {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      fontStyle: 'bold'
    });
    this.container.add(titleText);
  }

  /**
   * 创建历史记录区域（完成后的病案）
   */
  private createHistorySection(history: CaseHistoryRecord): void {
    // 创建分隔线
    const divider = this.scene.add.rectangle(0, 100, 660, 2, UI_COLORS.DIVIDER);
    this.container.add(divider);

    // 标题
    const historyTitle = this.scene.add.text(0, 130, '诊治记录', {
      fontSize: '18px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      fontStyle: 'bold'
    });
    historyTitle.setOrigin(0.5);
    this.container.add(historyTitle);

    // 评分详情
    this.createScoreDisplay(history);

    // 收集的线索
    this.createCluesDisplay(history);

    // NPC点评
    this.createFeedbackDisplay(history);
  }

  /**
   * 创建评分显示
   */
  private createScoreDisplay(history: CaseHistoryRecord): void {
    const scoreY = 170;

    // 总分
    const totalScore = this.scene.add.text(-300, scoreY,
      `总分: ${history.score.total}`,
      {
        fontSize: '20px',
        color: '#90c070',  // SOFT_GREEN
        fontStyle: 'bold'
      }
    );
    this.container.add(totalScore);

    // 各环节分数
    const scores = [
      { name: '问诊', value: history.score.inquiry },
      { name: '脉诊', value: history.score.pulse },
      { name: '舌诊', value: history.score.tongue },
      { name: '辨证', value: history.score.syndrome },
      { name: '选方', value: history.score.prescription }
    ];

    const details = scores.map(s => `${s.name}: ${s.value}`).join(' | ');
    const scoreDetails = this.scene.add.text(100, scoreY, details, {
      fontSize: '12px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY
    });
    this.container.add(scoreDetails);

    // 完成时间
    const timeText = this.scene.add.text(-300, scoreY + 30,
      `完成时间: ${new Date(history.completed_at).toLocaleString()}`,
      {
        fontSize: '12px',
        color: UI_COLOR_STRINGS.TEXT_DISABLED
      }
    );
    this.container.add(timeText);
  }

  /**
   * 创建线索收集显示
   */
  private createCluesDisplay(history: CaseHistoryRecord): void {
    const cluesY = 220;

    // 必须线索收集
    const requiredText = this.scene.add.text(-300, cluesY,
      `必须线索: ${history.clues_collected.required.join('、')}`,
      {
        fontSize: '12px',
        color: '#90c070',  // SOFT_GREEN
        wordWrap: { width: 350 }
      }
    );
    this.container.add(requiredText);

    // 辅助线索收集
    const auxiliaryText = this.scene.add.text(100, cluesY,
      `辅助线索: ${history.clues_collected.auxiliary.join('、')}`,
      {
        fontSize: '12px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
        wordWrap: { width: 350 }
      }
    );
    this.container.add(auxiliaryText);
  }

  /**
   * 创建NPC点评显示
   */
  private createFeedbackDisplay(history: CaseHistoryRecord): void {
    const feedbackY = 260;

    // 辨证论述
    this.createSectionTitle('辨证论述', -340, feedbackY);
    const reasoningText = this.scene.add.text(-340, feedbackY + 30,
      history.syndrome_reasoning,
      {
        fontSize: '12px',
        color: '#ffffff',
        wordWrap: { width: 340 }
      }
    );
    this.container.add(reasoningText);

    // NPC点评
    this.createSectionTitle('青木点评', 40, feedbackY);
    const feedbackText = this.scene.add.text(40, feedbackY + 30,
      history.npc_feedback,
      {
        fontSize: '12px',
        color: UI_COLOR_STRINGS.TEXT_HIGHLIGHT,
        wordWrap: { width: 340 }
      }
    );
    this.container.add(feedbackText);
  }

  /**
   * 创建操作按钮
   */
  private createActionButtons(): void {
    const buttonY = 260;

    switch (this.caseState.status) {
      case 'completed':
        // 已完成：只有返回按钮
        const backButton = this.scene.add.text(0, buttonY, '[返回列表]', {
          fontSize: '16px',
          color: '#90c070',  // SOFT_GREEN
          backgroundColor: '#404040',  // BUTTON_DISABLED
          padding: { x: 16, y: 8 }
        });
        backButton.setOrigin(0.5);
        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerdown', () => {
          if (this.config.onClose) this.config.onClose();
          this.destroy();
        });
        this.container.add(backButton);
        break;

      case 'in_progress':
        // 进行中：继续诊治按钮
        const continueButton = this.scene.add.text(0, buttonY, '[继续诊治]', {
          fontSize: '18px',
          color: '#c0c080',  // SOFT_YELLOW
          backgroundColor: '#404040',  // BUTTON_DISABLED
          padding: { x: 20, y: 10 }
        });
        continueButton.setOrigin(0.5);
        continueButton.setInteractive({ useHandCursor: true });
        continueButton.on('pointerdown', () => {
          if (this.config.onStartCase) {
            this.config.onStartCase(this.caseId);
          }
          this.destroy();
        });
        this.container.add(continueButton);
        break;

      case 'unlocked':
        // 已解锁：开始诊治按钮
        const startButton = this.scene.add.text(0, buttonY, '[开始诊治]', {
          fontSize: '18px',
          color: '#90c070',  // SOFT_GREEN
          backgroundColor: '#404040',  // BUTTON_DISABLED
          padding: { x: 20, y: 10 }
        });
        startButton.setOrigin(0.5);
        startButton.setInteractive({ useHandCursor: true });
        startButton.on('pointerdown', () => {
          if (this.config.onStartCase) {
            this.config.onStartCase(this.caseId);
          }
          this.destroy();
        });
        this.container.add(startButton);
        break;

      case 'locked':
        // 未解锁：显示解锁条件
        const unlockCondition = this.caseManager.getUnlockCondition(this.caseId);
        const lockedText = this.scene.add.text(0, buttonY,
          `病案未解锁\n${unlockCondition}`,
          {
            fontSize: '16px',
            color: '#b0a090',  // TEXT_SECONDARY
            align: 'center'
          }
        );
        lockedText.setOrigin(0.5);
        this.container.add(lockedText);
        break;
    }
  }

  /**
   * 获取状态文字
   */
  private getStatusText(): string {
    switch (this.caseState.status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'unlocked': return '已解锁';
      case 'locked': return '未解锁';
      default: return '未知';
    }
  }

  /**
   * 获取状态颜色
   */
  private getStatusColor(): string {
    switch (this.caseState.status) {
      case 'completed': return '#90c070';  // SOFT_GREEN
      case 'in_progress': return '#c0c080';  // SOFT_YELLOW
      case 'unlocked': return '#90c070';  // SOFT_GREEN
      case 'locked': return '#b0a090';  // TEXT_SECONDARY
      default: return '#ffffff';
    }
  }

  /**
   * 获取难度文字
   */
  private getDifficultyText(difficulty: 'easy' | 'normal' | 'hard'): string {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'normal': return '普通';
      case 'hard': return '困难';
      default: return '未知';
    }
  }

  /**
   * 获取难度颜色
   */
  private getDifficultyColor(difficulty: 'easy' | 'normal' | 'hard'): string {
    switch (difficulty) {
      case 'easy': return '#90c070';  // SOFT_GREEN
      case 'normal': return '#c0c080';  // SOFT_YELLOW
      case 'hard': return '#c07070';  // SOFT_RED
      default: return '#ffffff';
    }
  }

  /**
   * 暴露到全局（供测试访问）- 自定义名称
   */
  private exposeToGlobalCustom(): void {
    if (typeof window !== 'undefined') {
      (window as any).__CASE_DETAIL_UI__ = {
        caseId: this.caseId,
        status: this.caseState.status,
        syndrome: this.caseState.definition.syndrome.type,
        prescription: this.caseState.definition.prescription.name,
        score: this.caseState.history?.score.total || null,
        visible: this.container.visible
      };
    }
  }

  /**
   * 获取状态
   */
  getStatus(): {
    caseId: string;
    status: string;
    syndrome: string;
    prescription: string;
    score: number | null
  } {
    return {
      caseId: this.caseId,
      status: this.caseState.status,
      syndrome: this.caseState.definition.syndrome.type,
      prescription: this.caseState.definition.prescription.name,
      score: this.caseState.history?.score.total || null
    };
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__CASE_DETAIL_UI__ = null;
    }
    // 调用父类销毁方法
    super.destroy();
  }
}