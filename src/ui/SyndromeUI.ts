// src/ui/SyndromeUI.ts
/**
 * 辨证界面组件
 * 功能:
 * - 显示已收集信息汇总
 * - 玩家选择证型
 * - 玩家论述推理过程
 * - AI评估论述合理性
 *
 * Phase 2 S6c 实现
 */

import Phaser from 'phaser';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
import { ClueState } from '../systems/ClueTracker';

export interface InfoSummaryData {
  chiefComplaint: string;     // 主诉
  inquirySummary: string;     // 问诊摘要
  pulseResult: string;        // 脉诊结果
  tongueResult: string;       // 舌诊结果
  clueStates: ClueState[];    // 线索状态
}

export interface SyndromeUIConfig {
  infoSummary: InfoSummaryData;   // 信息汇总
  syndromeOptions: string[];      // 证型选项
  correctSyndrome: string;        // 正确证型
  onConfirm: (syndrome: string, reasoning: string) => void;  // 确认回调
}

export class SyndromeUI extends Phaser.GameObjects.Container {
  // 界面元素
  private background!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private summaryContainer!: Phaser.GameObjects.Container;
  private syndromeOptions: Phaser.GameObjects.Text[] = [];
  private reasoningBox!: Phaser.GameObjects.Rectangle;
  private reasoningText!: Phaser.GameObjects.Text;
  private reasoningHint!: Phaser.GameObjects.Text;
  private confirmButton!: Phaser.GameObjects.Text;

  // 状态
  private config: SyndromeUIConfig;
  private selectedSyndrome: string = '';
  private currentReasoning: string = '';

  constructor(scene: Phaser.Scene, x: number, y: number, config: SyndromeUIConfig) {
    super(scene, x, y);
    this.config = config;

    // 创建主背景
    this.background = scene.add.rectangle(0, 0, 720, 480, UI_COLORS.PANEL_PRIMARY, 0.85);
    this.background.setOrigin(0.5);
    this.add(this.background);

    // 创建标题
    this.createTitle(scene);

    // 创建信息汇总区域
    this.createSummaryArea(scene);

    // 创建证型选择区域
    this.createSyndromeOptions(scene);

    // 创建论述输入区域
    this.createReasoningArea(scene);

    // 创建确认按钮
    this.createConfirmButton(scene);

    // 设置键盘输入
    this.setupKeyboardInput(scene);

    // 设置深度
    this.setDepth(100);
    this.setScrollFactor(0);

    // 添加到场景
    scene.add.existing(this);

    // 暴露到全局
    this.exposeToGlobal();
  }

  /**
   * 创建标题
   */
  private createTitle(scene: Phaser.Scene): void {
    this.titleText = scene.add.text(0, -250, '辨证论述', {
      fontSize: '24px',
      color: '#8B4513',
      fontStyle: 'bold'
    });
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);
  }

  /**
   * 创建信息汇总区域
   */
  private createSummaryArea(scene: Phaser.Scene): void {
    this.summaryContainer = scene.add.container(0, -180);
    this.add(this.summaryContainer);

    // 汇总背景
    const summaryBg = scene.add.rectangle(0, 0, 560, 100, UI_COLORS.PANEL_SECONDARY, 0.9);
    summaryBg.setOrigin(0.5);
    this.summaryContainer.add(summaryBg);

    // 标题
    const summaryTitle = scene.add.text(0, -40, '已收集信息汇总', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_DISABLED
    });
    summaryTitle.setOrigin(0.5);
    this.summaryContainer.add(summaryTitle);

    // 主诉
    const chiefComplaint = scene.add.text(-280, -20, `主诉: ${this.config.infoSummary.chiefComplaint}`, {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      wordWrap: { width: 560 }
    });
    this.summaryContainer.add(chiefComplaint);

    // 问诊摘要
    const inquirySummary = scene.add.text(-280, 0, `问诊: ${this.config.infoSummary.inquirySummary}`, {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      wordWrap: { width: 560 }
    });
    this.summaryContainer.add(inquirySummary);

    // 脉诊结果
    const pulseResult = scene.add.text(-280, 20, `脉诊: ${this.config.infoSummary.pulseResult}`, {
      fontSize: '14px',
      color: '#00ffaa'
    });
    this.summaryContainer.add(pulseResult);

    // 舌诊结果
    const tongueResult = scene.add.text(-280, 40, `舌诊: ${this.config.infoSummary.tongueResult}`, {
      fontSize: '14px',
      color: '#00ffaa'
    });
    this.summaryContainer.add(tongueResult);
  }

  /**
   * 创建证型选择区域
   */
  private createSyndromeOptions(scene: Phaser.Scene): void {
    // 标签
    const label = scene.add.text(-350, -60, '选择证型:', {
      fontSize: '18px',
      color: '#ffaa00'
    });
    this.add(label);

    // 创建证型选项
    for (let i = 0; i < this.config.syndromeOptions.length; i++) {
      const syndrome = this.config.syndromeOptions[i];
      const optionX = -350;
      const optionY = -30 + i * 35;

      const option = scene.add.text(optionX, optionY, `○ ${syndrome}`, {
        fontSize: '18px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY,
        backgroundColor: UI_COLOR_STRINGS.PANEL_LIGHT,
        padding: { x: 8, y: 4 }
      });
      option.setInteractive({ useHandCursor: true });

      option.on('pointerdown', () => {
        this.selectSyndrome(syndrome, option);
      });

      option.on('pointerover', () => {
        if (this.selectedSyndrome !== syndrome) {
          option.setColor('#88aaff');
        }
      });
      option.on('pointerout', () => {
        if (this.selectedSyndrome !== syndrome) {
          option.setColor('#ffffff');
        }
      });

      this.add(option);
      this.syndromeOptions.push(option);
    }
  }

  /**
   * 创建论述输入区域
   */
  private createReasoningArea(scene: Phaser.Scene): void {
    // 标签
    const label = scene.add.text(-350, 80, '你的论述:', {
      fontSize: '18px',
      color: '#ffaa00'
    });
    this.add(label);

    // 论述框背景
    this.reasoningBox = scene.add.rectangle(0, 130, 660, 120, UI_COLORS.PANEL_LIGHT, 0.9);
    this.reasoningBox.setOrigin(0.5);
    this.reasoningBox.setStrokeStyle(2, UI_COLORS.BORDER_LIGHT);
    this.add(this.reasoningBox);

    // 论述文本
    this.reasoningText = scene.add.text(-340, 80, '', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      wordWrap: { width: 680 },
      lineSpacing: 6
    });
    this.add(this.reasoningText);

    // 输入提示
    this.reasoningHint = scene.add.text(-340, 80, '输入你的辨证推理过程...', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_DISABLED
    });
    this.add(this.reasoningHint);
  }

  /**
   * 创建确认按钮
   */
  private createConfirmButton(scene: Phaser.Scene): void {
    this.confirmButton = scene.add.text(0, 240, '[提交回答]', {
      fontSize: '18px',
      color: UI_COLOR_STRINGS.ACCENT_SKY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_SECONDARY,
      padding: { x: 12, y: 6 }
    });
    this.confirmButton.setOrigin(0.5);
    this.confirmButton.setInteractive({ useHandCursor: true });

    this.confirmButton.on('pointerdown', () => {
      this.handleConfirm();
    });

    this.confirmButton.on('pointerover', () => {
      this.confirmButton.setColor('#00ffaa');
    });
    this.confirmButton.on('pointerout', () => {
      this.confirmButton.setColor('#00aaff');
    });

    this.add(this.confirmButton);
  }

  /**
   * 设置键盘输入
   */
  private setupKeyboardInput(scene: Phaser.Scene): void {
    scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        // 单Enter不处理，Shift+Enter可以换行
      } else if (event.key === 'Backspace') {
        this.currentReasoning = this.currentReasoning.slice(0, -1);
        this.updateReasoningText();
      } else if (event.key.length === 1) {
        this.currentReasoning += event.key;
        this.updateReasoningText();
      }
    });
  }

  /**
   * 更新论述文本显示
   */
  private updateReasoningText(): void {
    this.reasoningText.setText(this.currentReasoning);
    this.reasoningHint.setVisible(this.currentReasoning.length === 0);
    this.exposeToGlobal();
  }

  /**
   * 选择证型
   */
  private selectSyndrome(syndrome: string, option: Phaser.GameObjects.Text): void {
    this.selectedSyndrome = syndrome;

    // 更新所有选项
    for (const opt of this.syndromeOptions) {
      const text = opt.text;
      if (text.includes('●')) {
        opt.setText(text.replace('●', '○'));
        opt.setColor('#ffffff');
      }
    }

    // 更新选中
    option.setText(option.text.replace('○', '●'));
    option.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY);

    this.exposeToGlobal();
  }

  /**
   * 处理确认
   */
  private handleConfirm(): void {
    if (this.selectedSyndrome && this.currentReasoning.length >= 10) {
      this.config.onConfirm(this.selectedSyndrome, this.currentReasoning);
    } else if (!this.selectedSyndrome) {
      this.showWarning('请先选择证型');
    } else if (this.currentReasoning.length < 10) {
      this.showWarning('论述内容过短，请详细说明你的推理过程');
    }
  }

  /**
   * 显示警告提示
   */
  private showWarning(message: string): void {
    const warning = this.scene.add.text(0, 220, message, {
      fontSize: '14px',
      color: '#ff6600'
    });
    warning.setOrigin(0.5);
    this.add(warning);

    this.scene.time.delayedCall(2000, () => {
      warning.destroy();
    });
  }

  /**
   * 显示结果
   */
  showResult(isCorrect: boolean, reasoningScore: number): void {
    const resultText = isCorrect
      ? `证型判断正确! 论述评分: ${reasoningScore}分`
      : `证型判断有误。论述评分: ${reasoningScore}分`;
    const resultColor = isCorrect ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#ffaa00';

    const result = this.scene.add.text(0, 260, resultText, {
      fontSize: '16px',
      color: resultColor,
      fontStyle: 'bold'
    });
    result.setOrigin(0.5);
    this.add(result);
  }

  /**
   * 获取状态
   */
  getStatus(): {
    selectedSyndrome: string;
    reasoning: string;
    isComplete: boolean;
  } {
    return {
      selectedSyndrome: this.selectedSyndrome,
      reasoning: this.currentReasoning,
      isComplete: this.selectedSyndrome !== '' && this.currentReasoning.length >= 10
    };
  }

  /**
   * 暴露到全局
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__SYNDROME_UI__ = {
        selectedSyndrome: this.selectedSyndrome,
        reasoning: this.currentReasoning,
        reasoningLength: this.currentReasoning.length,
        isComplete: this.getStatus().isComplete,
        getStatus: () => this.getStatus()
      };
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.syndromeOptions = [];

    if (typeof window !== 'undefined') {
      (window as any).__SYNDROME_UI__ = null;
    }

    super.destroy();
  }
}