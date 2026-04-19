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
 * Round 4 视觉优化: 3D立体边框(方案B)
 * Phase 2.5 UI统一化: 使用SelectionButtonComponent (Task 12)
 */

import Phaser from 'phaser';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
import { ClueState } from '../systems/ClueTracker';
import SelectionButtonComponent, {
  SelectionButtonContent
} from './components/SelectionButtonComponent';

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
  private backgroundGraphics!: Phaser.GameObjects.Graphics;  // 使用Graphics替代Rectangle
  private titleText!: Phaser.GameObjects.Text;
  private summaryContainer!: Phaser.GameObjects.Container;
  private syndromeButtons: SelectionButtonComponent[] = [];  // 使用SelectionButtonComponent替代Text
  private reasoningBox!: Phaser.GameObjects.Rectangle;
  private reasoningText!: Phaser.GameObjects.Text;
  private reasoningHint!: Phaser.GameObjects.Text;
  private confirmButton!: Phaser.GameObjects.Text;

  // 状态
  private config: SyndromeUIConfig;
  private selectedSyndrome: string = '';
  private currentReasoning: string = '';

  // 3D边框样式配置（方案B）
  private readonly BORDER_COLORS = {
    outerBorder: UI_COLORS.BORDER_OUTER_GREEN,      // 亮绿边框 0x80a040
    panelBg: UI_COLORS.PANEL_3D_BG,                 // 深绿背景 0x1a2e26
    topLight: UI_COLORS.BORDER_TOP_LIGHT,           // 顶部高光 0x90c070
    bottomShadow: UI_COLORS.BORDER_BOTTOM_SHADOW,   // 底部阴影 0x604020
  };

  constructor(scene: Phaser.Scene, x: number, y: number, config: SyndromeUIConfig) {
    super(scene, x, y);
    this.config = config;

    // 创建主背景 - 使用Graphics绘制3D立体边框（方案B）
    this.backgroundGraphics = scene.add.graphics();
    this.draw3DBorder(this.backgroundGraphics, 0, 0, 720, 480);
    this.add(this.backgroundGraphics);

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

    // 创建退出按钮
    const exitButton = this.createExitButton();
    this.add(exitButton);

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
      color: '#a08060',  // SOFT_BROWN
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
      color: '#90c070'  // SOFT_GREEN
    });
    this.summaryContainer.add(pulseResult);

    // 舌诊结果
    const tongueResult = scene.add.text(-280, 40, `舌诊: ${this.config.infoSummary.tongueResult}`, {
      fontSize: '14px',
      color: '#90c070'  // SOFT_GREEN
    });
    this.summaryContainer.add(tongueResult);
  }

  /**
   * 创建证型选择区域
   * Phase 2.5: 使用SelectionButtonComponent替代手动创建Text
   */
  private createSyndromeOptions(scene: Phaser.Scene): void {
    // 标签
    const label = scene.add.text(-350, -60, '选择证型:', {
      fontSize: '18px',
      color: '#c0c080'  // SOFT_YELLOW
    });
    this.add(label);

    // 使用SelectionButtonComponent创建证型选项
    for (let i = 0; i < this.config.syndromeOptions.length; i++) {
      const syndrome = this.config.syndromeOptions[i];
      const optionX = -350;
      const optionY = -30 + i * 35;

      const content: SelectionButtonContent = {
        label: syndrome,
        value: syndrome
      };

      const button = new SelectionButtonComponent(
        scene,
        content,
        {
          // 证型选择为单选模式
          multiSelect: false,
          onSelect: (value: string) => {
            this.handleSyndromeSelection(value, button);
          }
        },
        optionX,
        optionY
      );

      // 设置深度
      button.setDepth(50);

      this.add(button.container);
      this.syndromeButtons.push(button);
    }
  }

  /**
   * 创建论述输入区域
   */
  private createReasoningArea(scene: Phaser.Scene): void {
    // 标签
    const label = scene.add.text(-350, 80, '你的论述:', {
      fontSize: '18px',
      color: '#c0c080'  // SOFT_YELLOW
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
      this.confirmButton.setColor('#90c070');  // SOFT_GREEN
    });
    this.confirmButton.on('pointerout', () => {
      this.confirmButton.setColor('#70a0c0');  // SOFT_BLUE
    });

    this.add(this.confirmButton);
  }

  /**
   * 创建退出按钮
   */
  private createExitButton(): Phaser.GameObjects.Text {
    const exitButton = this.scene.add.text(
      340,  // 右上角（考虑UI宽度720）
      -250,  // 与标题同高度
      '[退出诊断]',
      {
        fontSize: '16px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY,
        backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    exitButton.on('pointerover', () => {
      exitButton.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
    });

    exitButton.on('pointerout', () => {
      exitButton.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
    });

    exitButton.on('pointerdown', () => {
      this.handleExit();
    });

    return exitButton;
  }

  /**
   * 绘制3D立体边框（方案B）
   * 外层边框 + 顶部高光 + 底部阴影
   */
  private draw3DBorder(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // 调整坐标以适应Container中心定位（Container以中心为原点）
    const adjustedX = x - width / 2;
    const adjustedY = y - height / 2;

    // 1. 外层边框（亮绿色，4px）
    graphics.lineStyle(4, this.BORDER_COLORS.outerBorder);
    graphics.strokeRect(adjustedX - 4, adjustedY - 4, width + 8, height + 8);

    // 2. 主背景（深绿色，完全不透明）
    graphics.fillStyle(this.BORDER_COLORS.panelBg, 1.0);
    graphics.fillRect(adjustedX, adjustedY, width, height);

    // 3. 顶部/左侧高光边框（亮绿，2px）
    graphics.lineStyle(2, this.BORDER_COLORS.topLight);
    graphics.beginPath();
    graphics.moveTo(adjustedX, adjustedY + height);
    graphics.lineTo(adjustedX, adjustedY);
    graphics.lineTo(adjustedX + width, adjustedY);
    graphics.strokePath();

    // 4. 底部/右侧阴影边框（暗棕，2px）
    graphics.lineStyle(2, this.BORDER_COLORS.bottomShadow);
    graphics.beginPath();
    graphics.moveTo(adjustedX + width, adjustedY);
    graphics.lineTo(adjustedX + width, adjustedY + height);
    graphics.lineTo(adjustedX, adjustedY + height);
    graphics.strokePath();
  }

  /**
   * 处理退出
   */
  private handleExit(): void {
    this.destroy();
    this.scene.scene.stop('SyndromeScene');
    this.scene.scene.start('ClinicScene');
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
   * 处理证型选择
   * Phase 2.5: 使用SelectionButtonComponent的选中状态管理
   */
  private handleSyndromeSelection(value: string, selectedButton: SelectionButtonComponent): void {
    // 单选模式：先取消其他按钮的选中状态
    for (const button of this.syndromeButtons) {
      if (button !== selectedButton && button.isSelected()) {
        button.deselect();
      }
    }

    // 更新选中状态
    this.selectedSyndrome = value;

    // 暴露到全局供测试验证
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
      color: '#c09060'  // SOFT_ORANGE
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
    const resultColor = isCorrect ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#c0c080';  // SOFT_YELLOW

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
   * Phase 2.5: 清理SelectionButtonComponent实例
   */
  destroy(): void {
    // 清理所有SelectionButtonComponent
    for (const button of this.syndromeButtons) {
      button.destroy();
    }
    this.syndromeButtons = [];

    if (typeof window !== 'undefined') {
      (window as any).__SYNDROME_UI__ = null;
    }

    super.destroy();
  }
}