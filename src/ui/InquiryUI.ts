// src/ui/InquiryUI.ts
/**
 * 问诊界面组件
 * 功能:
 * - 显示病人对话（流式输出）
 * - 追问输入框 + 常用问题提示按钮
 * - 线索追踪UI（显示收集进度）
 * - 必须线索完成确认提示
 *
 * Phase 2 S4 实现
 * Round 4 视觉优化: 3D立体边框(方案B) + 内凹槽位(方案8)
 */

import Phaser from 'phaser';
import { ClueTracker, ClueState } from '../systems/ClueTracker';
import { SSEClient } from '../utils/sseClient';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';

export interface InquiryUIConfig {
  patientName: string;
  patientOccupation: string;
  patientAge: number;
  clueTracker: ClueTracker;
  onSendQuestion: (question: string) => void;
  onComplete: () => void;  // 问诊完成，进入下一环节
}

// 常用问题提示
const COMMON_QUESTIONS = [
  '怕冷还是怕热？',
  '出汗情况怎么样？',
  '头疼吗？身上疼吗？',
  '咳嗽吗？嗓子疼吗？',
  '口渴吗？想喝水吗？',
  '怎么发病的？'
];

export class InquiryUI extends Phaser.GameObjects.Container {
  // 界面元素 - 使用Graphics替代Rectangle（Round 4视觉优化）
  private backgroundGraphics!: Phaser.GameObjects.Graphics;
  private clueTrackerGraphics!: Phaser.GameObjects.Graphics;
  private patientAvatar!: Phaser.GameObjects.Image;
  private patientNameText!: Phaser.GameObjects.Text;
  private patientInfoText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private inputBox!: Phaser.GameObjects.Rectangle;
  private inputText!: Phaser.GameObjects.Text;
  private inputHint!: Phaser.GameObjects.Text;
  private sendButton!: Phaser.GameObjects.Text;
  private stopButton!: Phaser.GameObjects.Text;
  private completeButton!: Phaser.GameObjects.Text;

  // 线索追踪UI
  private clueTrackerContainer!: Phaser.GameObjects.Container;
  private requiredClueElements: Map<string, { checkbox: Phaser.GameObjects.Text; label: Phaser.GameObjects.Text }> = new Map();
  private auxiliaryClueElements: Map<string, { checkbox: Phaser.GameObjects.Text; label: Phaser.GameObjects.Text }> = new Map();

  // 常用问题按钮
  private questionButtons: Phaser.GameObjects.Text[] = [];

  // 状态
  private config: InquiryUIConfig;
  private currentQuestion: string = '';
  private isGenerating: boolean = false;
  private sseClient: SSEClient;

  // 样式配置（Round 4 3D边框设计）
  private readonly InquiryUI_COLORS = {
    // 方案B: 3D立体边框
    outerBorder: UI_COLORS.BORDER_OUTER_GREEN,      // 亮绿边框 0x80a040
    panelBg: UI_COLORS.PANEL_3D_BG,                 // 深绿背景 0x1a2e26
    topLight: UI_COLORS.BORDER_TOP_LIGHT,           // 顶部高光 0x90c070
    bottomShadow: UI_COLORS.BORDER_BOTTOM_SHADOW,   // 底部阴影 0x604020
    // 方案8: 内凹槽位
    insetBg: UI_COLORS.PANEL_INSET,                 // 内凹底色 0x0d1f17
    insetDarkBorder: UI_COLORS.BORDER_INSET_DARK,   // 暗边框 0x0a1510
    insetLightBorder: UI_COLORS.BORDER_INSET_LIGHT, // 亮边框 0x406050
  };

  constructor(scene: Phaser.Scene, x: number, y: number, config: InquiryUIConfig) {
    super(scene, x, y);
    this.config = config;
    this.sseClient = new SSEClient();

    // 创建主背景 - 使用Graphics绘制3D立体边框（方案B）
    this.backgroundGraphics = scene.add.graphics();
    this.draw3DBorder(this.backgroundGraphics, -320, -210, 640, 420);
    this.add(this.backgroundGraphics);

    // 创建病人信息区域
    this.createPatientInfoArea(scene);

    // 创建对话显示区域
    this.createDialogueArea(scene);

    // 创建输入区域
    this.createInputArea(scene);

    // 创建线索追踪区域
    this.createClueTrackerArea(scene);

    // 创建按钮区域
    this.createButtonArea(scene);

    // 设置深度
    this.setDepth(100);
    this.setScrollFactor(0);

    // 添加到场景
    scene.add.existing(this);

    // 暴露到全局供测试访问
    this.exposeToGlobal();

    // 线索追踪UI可见
    if (typeof window !== 'undefined') {
      (window as any).__CLUE_TRACKER_VISIBLE__ = true;
    }

    // 监听键盘输入
    this.setupKeyboardInput(scene);

    // 创建退出按钮
    const exitButton = this.createExitButton();
    this.add(exitButton);
  }

  /**
   * 绘制3D立体边框（方案B）
   * 外层边框 + 顶部高光 + 底部阴影
   *
   * @param alpha 背景透明度，默认0.85（让背景略微可见但面板清晰）
   */
  private draw3DBorder(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    alpha: number = 0.85
  ): void {
    // 1. 外层边框（亮绿色）
    graphics.lineStyle(4, this.InquiryUI_COLORS.outerBorder);
    graphics.strokeRect(x - 4, y - 4, width + 8, height + 8);

    // 2. 主背景（深绿色，可调透明度）
    graphics.fillStyle(this.InquiryUI_COLORS.panelBg, alpha);
    graphics.fillRect(x, y, width, height);

    // 3. 顶部/左侧高光边框（亮绿）
    graphics.lineStyle(2, this.InquiryUI_COLORS.topLight);
    graphics.beginPath();
    graphics.moveTo(x, y + height);
    graphics.lineTo(x, y);
    graphics.lineTo(x + width, y);
    graphics.strokePath();

    // 4. 底部/右侧阴影边框（暗棕）
    graphics.lineStyle(2, this.InquiryUI_COLORS.bottomShadow);
    graphics.beginPath();
    graphics.moveTo(x + width, y);
    graphics.lineTo(x + width, y + height);
    graphics.lineTo(x, y + height);
    graphics.strokePath();
  }

  /**
   * 绘制内凹槽位（方案8）
   * 深色底 + 暗顶左边框 + 亮底右边框
   */
  private drawInsetSlot(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    isSelected: boolean = false
  ): void {
    // 如果选中，背景稍亮（用于高亮状态）
    const bgColor = isSelected
      ? 0x203030
      : this.InquiryUI_COLORS.insetBg;

    // 1. 深色底背景
    graphics.fillStyle(bgColor, 1);
    graphics.fillRect(x, y, width, height);

    // 2. 顶部/左侧暗边框（凹陷效果）
    graphics.lineStyle(2, this.InquiryUI_COLORS.insetDarkBorder);
    graphics.beginPath();
    graphics.moveTo(x + width, y);
    graphics.lineTo(x, y);
    graphics.lineTo(x, y + height);
    graphics.strokePath();

    // 3. 底部/右侧亮边框（凸出效果）
    graphics.lineStyle(2, this.InquiryUI_COLORS.insetLightBorder);
    graphics.beginPath();
    graphics.moveTo(x, y + height);
    graphics.lineTo(x + width, y + height);
    graphics.lineTo(x + width, y);
    graphics.strokePath();
  }

  /**
   * 创建退出按钮（右上角）
   */
  private createExitButton(): Phaser.GameObjects.Text {
    const exitButton = this.scene.add.text(
      300,  // 右上角位置（考虑UI宽度640）
      -200,
      '[退出问诊]',
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
   * 处理退出
   */
  private handleExit(): void {
    // 通知场景退出（场景负责清理，无需自行销毁）
    const inquiryScene = this.scene as any;
    if (inquiryScene.returnToClinic) {
      inquiryScene.returnToClinic();
    }
  }

  /**
   * 创建病人信息区域
   */
  private createPatientInfoArea(scene: Phaser.Scene): void {
    // 病人头像占位
    this.patientAvatar = scene.add.image(-300, -180, '__DEFAULT');
    this.patientAvatar.setDisplaySize(80, 80);
    this.patientAvatar.setTint(0x8B4513);
    this.add(this.patientAvatar);

    // 病人姓名
    this.patientNameText = scene.add.text(-250, -200, this.config.patientName, {
      fontSize: '24px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      fontStyle: 'bold'
    });
    this.add(this.patientNameText);

    // 病人信息（职业、年龄）
    this.patientInfoText = scene.add.text(-250, -170, `${this.config.patientOccupation}，${this.config.patientAge}岁`, {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY
    });
    this.add(this.patientInfoText);
  }

  /**
   * 创建对话显示区域
   * Round 4 布局修复: 文字宽度约束
   */
  private createDialogueArea(scene: Phaser.Scene): void {
    // 对话背景（宽度460）
    const dialogueBg = scene.add.rectangle(-150, -80, 460, 180, UI_COLORS.PANEL_SECONDARY, 0.9);
    dialogueBg.setOrigin(0.5);
    this.add(dialogueBg);

    // 对话文本（宽度=背景宽度-边框*2-padding*2 = 460-4-16 = 440）
    // 位置：背景左边界 = -150-230 = -380，加padding 8 = -372
    this.dialogueText = scene.add.text(-372, -165, '', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      wordWrap: { width: 440 },  // 修复：从480改为440
      lineSpacing: 8
    });
    this.add(this.dialogueText);
  }

  /**
   * 创建输入区域
   * Round 4 布局修复: 文字宽度约束
   */
  private createInputArea(scene: Phaser.Scene): void {
    // 输入框背景（宽度460）
    this.inputBox = scene.add.rectangle(-150, 80, 460, 50, UI_COLORS.PANEL_LIGHT, 0.9);
    this.inputBox.setOrigin(0.5);
    this.inputBox.setStrokeStyle(2, UI_COLORS.BORDER_LIGHT);
    this.add(this.inputBox);

    // 输入文本（宽度440）
    this.inputText = scene.add.text(-372, 58, '', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      wordWrap: { width: 440 }  // 修复：从480改为440
    });
    this.add(this.inputText);

    // 输入提示
    this.inputHint = scene.add.text(-372, 58, '输入追问问题...', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_DISABLED
    });
    this.add(this.inputHint);

    // 发送按钮（位置调整：背景右边界 = -150+230 = 80，按钮在80附近）
    this.sendButton = scene.add.text(70, 65, '[发送]', {
      fontSize: '18px',
      color: UI_COLOR_STRINGS.ACCENT_SKY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_SECONDARY,
      padding: { x: 8, y: 4 }
    });
    this.sendButton.setInteractive({ useHandCursor: true });
    this.sendButton.on('pointerdown', () => this.handleSend());
    this.add(this.sendButton);

    // 常用问题按钮
    this.createQuestionButtons(scene);
  }

  /**
   * 创建常用问题按钮
   * Round 4 布局修复: 按钮间距和位置调整
   */
  private createQuestionButtons(scene: Phaser.Scene): void {
    // 修复：调整起始位置和间距，确保在主面板边界内
    // 主面板宽度640，中心0，左边界-320，右边界320
    // 6个按钮，每行3个，需要调整间距
    const startX = -300;  // 修复：从-380改为-300
    const startY = 140;
    const spacing = 130;  // 修复：从170改为130

    for (let i = 0; i < COMMON_QUESTIONS.length; i++) {
      const question = COMMON_QUESTIONS[i];
      const col = i % 3;
      const row = Math.floor(i / 3);

      const button = scene.add.text(
        startX + col * spacing,
        startY + row * 30,
        `[${question}]`,
        {
          fontSize: '14px',
          color: '#70a0c0',  // SOFT_BLUE
          backgroundColor: UI_COLOR_STRINGS.PANEL_PRIMARY,
          padding: { x: 4, y: 2 }
        }
      );
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => this.handleQuestionButtonClick(question));
      this.add(button);
      this.questionButtons.push(button);
    }
  }

  /**
   * 创建线索追踪区域（使用内凹槽位方案8）
   * Round 4 布局修复: 位置调整确保在主面板边界内
   */
  private createClueTrackerArea(scene: Phaser.Scene): void {
    // 线索追踪区域位置和尺寸
    // 修复：trackerY从-100改为-50，确保tracker顶部在主面板内
    // 主面板边界：y从-210到210
    // tracker顶部 = trackerY - trackerHeight/2 = -50 - 160 = -210 ✓（与面板顶部对齐）
    // tracker底部 = trackerY + trackerHeight/2 = -50 + 160 = 110 ✓（在面板底部210内）
    const trackerX = 220;  // 修复：从280改为220
    const trackerY = -50;  // 修复：从-100改为-50，使顶部与面板对齐
    const trackerWidth = 180;
    const trackerHeight = 320;

    // 创建线索追踪Graphics背景（内凹槽位）
    this.clueTrackerGraphics = scene.add.graphics();
    this.drawInsetSlot(this.clueTrackerGraphics, trackerX - trackerWidth / 2, trackerY - trackerHeight / 2, trackerWidth, trackerHeight);
    this.add(this.clueTrackerGraphics);

    this.clueTrackerContainer = scene.add.container(trackerX, trackerY);
    this.add(this.clueTrackerContainer);

    // 标题
    const titleText = scene.add.text(0, -140, '收集进度', {
      fontSize: '18px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      fontStyle: 'bold'
    });
    titleText.setOrigin(0.5);
    this.clueTrackerContainer.add(titleText);

    // 必须线索区域
    const requiredLabel = scene.add.text(-80, -110, '必须线索:', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.STATUS_WARNING
    });
    this.clueTrackerContainer.add(requiredLabel);

    const requiredClues = this.config.clueTracker.getRequiredClueStates();
    let requiredY = -90;
    for (const clueState of requiredClues) {
      const checkbox = scene.add.text(-80, requiredY, clueState.collected ? '☑' : '☐', {
        fontSize: '14px',
        color: clueState.collected ? UI_COLOR_STRINGS.STATUS_SUCCESS : UI_COLOR_STRINGS.TEXT_DISABLED
      });
      const label = scene.add.text(-60, requiredY, clueState.clueId, {
        fontSize: '14px',
        color: clueState.collected ? UI_COLOR_STRINGS.TEXT_PRIMARY : UI_COLOR_STRINGS.TEXT_SECONDARY
      });
      this.clueTrackerContainer.add(checkbox);
      this.clueTrackerContainer.add(label);
      this.requiredClueElements.set(clueState.clueId, { checkbox, label });
      requiredY += 22;
    }

    // 辅助线索区域
    const auxiliaryLabel = scene.add.text(-80, requiredY + 10, '辅助线索:', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY
    });
    this.clueTrackerContainer.add(auxiliaryLabel);

    const auxiliaryClues = this.config.clueTracker.getAuxiliaryClueStates();
    let auxiliaryY = requiredY + 30;
    for (const clueState of auxiliaryClues) {
      const checkbox = scene.add.text(-80, auxiliaryY, clueState.collected ? '☑' : '☐', {
        fontSize: '14px',
        color: clueState.collected ? UI_COLOR_STRINGS.ACCENT_SKY : UI_COLOR_STRINGS.TEXT_DISABLED
      });
      const label = scene.add.text(-60, auxiliaryY, clueState.clueId, {
        fontSize: '14px',
        color: clueState.collected ? UI_COLOR_STRINGS.TEXT_PRIMARY : UI_COLOR_STRINGS.TEXT_SECONDARY
      });
      this.clueTrackerContainer.add(checkbox);
      this.clueTrackerContainer.add(label);
      this.auxiliaryClueElements.set(clueState.clueId, { checkbox, label });
      auxiliaryY += 22;
    }
  }

  /**
   * 创建按钮区域
   */
  private createButtonArea(scene: Phaser.Scene): void {
    // 停止生成按钮
    this.stopButton = scene.add.text(-380, 210, '[停止生成]', {
      fontSize: '14px',
      color: '#c09060'  // SOFT_ORANGE
    });
    this.stopButton.setInteractive({ useHandCursor: true });
    this.stopButton.on('pointerdown', () => this.handleStop());
    this.stopButton.setVisible(false);
    this.add(this.stopButton);

    // 完成问诊按钮
    this.completeButton = scene.add.text(300, 210, '[完成问诊，进入切脉]', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.STATUS_SUCCESS,
      backgroundColor: UI_COLOR_STRINGS.PANEL_PRIMARY,
      padding: { x: 8, y: 4 }
    });
    this.completeButton.setInteractive({ useHandCursor: true });
    this.completeButton.on('pointerdown', () => this.handleComplete());
    this.completeButton.setVisible(false);  // 默认隐藏，必须线索收集完成后显示
    this.add(this.completeButton);
  }

  /**
   * 设置键盘输入
   */
  private setupKeyboardInput(scene: Phaser.Scene): void {
    // 获取当前输入的文字
    scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.isGenerating) return;

      if (event.key === 'Enter') {
        this.handleSend();
      } else if (event.key === 'Backspace') {
        this.currentQuestion = this.currentQuestion.slice(0, -1);
        this.updateInputText();
      } else if (event.key.length === 1) {
        this.currentQuestion += event.key;
        this.updateInputText();
      }
    });
  }

  /**
   * 更新输入文本显示
   */
  private updateInputText(): void {
    this.inputText.setText(this.currentQuestion);
    this.inputHint.setVisible(this.currentQuestion.length === 0);
    this.exposeToGlobal();
  }

  /**
   * 处理发送
   */
  private handleSend(): void {
    if (this.currentQuestion.trim().length === 0 || this.isGenerating) return;

    const question = this.currentQuestion.trim();
    this.currentQuestion = '';
    this.updateInputText();

    // 调用回调
    if (this.config.onSendQuestion) {
      this.config.onSendQuestion(question);
    }
  }

  /**
   * 处理问题按钮点击
   */
  private handleQuestionButtonClick(question: string): void {
    if (this.isGenerating) return;

    this.currentQuestion = question;
    this.updateInputText();
    this.handleSend();
  }

  /**
   * 处理停止
   */
  private handleStop(): void {
    if (this.isGenerating) {
      this.sseClient.stop();
      this.isGenerating = false;
      this.stopButton.setVisible(false);
      this.exposeToGlobal();
    }
  }

  /**
   * 处理完成
   */
  private handleComplete(): void {
    if (this.config.onComplete) {
      this.config.onComplete();
    }
  }

  /**
   * 显示病人对话（流式更新）
   */
  displayPatientDialogue(text: string, isStreaming: boolean = true): void {
    this.dialogueText.setText(text);
    this.isGenerating = isStreaming;
    this.stopButton.setVisible(isStreaming);
    this.exposeToGlobal();
  }

  /**
   * 显示玩家问题
   */
  displayPlayerQuestion(question: string): void {
    // 在对话文本上方显示玩家问题（简化版本）
    const currentText = this.dialogueText.text;
    this.dialogueText.setText(`【你的追问】: ${question}\n\n${currentText}`);
  }

  /**
   * 更新线索状态
   */
  updateClueStates(clueStates: ClueState[]): void {
    for (const state of clueStates) {
      // 更新必须线索
      const requiredElement = this.requiredClueElements.get(state.clueId);
      if (requiredElement) {
        requiredElement.checkbox.setText(state.collected ? '☑' : '☐');
        requiredElement.checkbox.setColor(state.collected ? UI_COLOR_STRINGS.STATUS_SUCCESS : UI_COLOR_STRINGS.TEXT_DISABLED);
        requiredElement.label.setColor(state.collected ? UI_COLOR_STRINGS.TEXT_PRIMARY : UI_COLOR_STRINGS.TEXT_SECONDARY);
      }

      // 更新辅助线索
      const auxiliaryElement = this.auxiliaryClueElements.get(state.clueId);
      if (auxiliaryElement) {
        auxiliaryElement.checkbox.setText(state.collected ? '☑' : '☐');
        auxiliaryElement.checkbox.setColor(state.collected ? UI_COLOR_STRINGS.ACCENT_SKY : UI_COLOR_STRINGS.TEXT_DISABLED);
        auxiliaryElement.label.setColor(state.collected ? UI_COLOR_STRINGS.TEXT_PRIMARY : UI_COLOR_STRINGS.TEXT_SECONDARY);
      }
    }

    // 检查是否可以完成
    this.checkCompletionState();
    this.exposeToGlobal();
  }

  /**
   * 检查完成状态
   */
  private checkCompletionState(): void {
    const isComplete = this.config.clueTracker.areRequiredCluesComplete();
    this.completeButton.setVisible(isComplete);

    // 更新按钮颜色/状态
    if (isComplete) {
      this.completeButton.setColor(UI_COLOR_STRINGS.STATUS_SUCCESS);
      this.completeButton.setText('[完成问诊，进入切脉]');
    }
  }

  /**
   * 显示完成确认弹窗
   */
  showCompletionConfirmation(): void {
    // 简化版本：直接显示按钮
    this.completeButton.setVisible(true);
    this.completeButton.setText('必须线索已收集完成！点击进入切脉');
    this.completeButton.setColor(UI_COLOR_STRINGS.STATUS_SUCCESS);
  }

  /**
   * 显示无法进入下一环节提示
   */
  showIncompleteWarning(): void {
    const missing = this.config.clueTracker.getMissingRequiredClues();
    this.completeButton.setVisible(true);
    this.completeButton.setText(`缺少线索: ${missing.join(', ')}`);
    this.completeButton.setColor('#c09060');  // SOFT_ORANGE
    this.completeButton.disableInteractive();

    // 3秒后恢复
    this.scene.time.delayedCall(3000, () => {
      this.completeButton.setVisible(false);
      this.completeButton.setInteractive({ useHandCursor: true });
    });
  }

  /**
   * 获取当前状态
   */
  getStatus(): {
    isGenerating: boolean;
    currentQuestion: string;
    requiredCluesComplete: boolean;
    patientName: string;
  } {
    return {
      isGenerating: this.isGenerating,
      currentQuestion: this.currentQuestion,
      requiredCluesComplete: this.config.clueTracker.areRequiredCluesComplete(),
      patientName: this.config.patientName
    };
  }

  /**
   * 暴露到全局（供测试访问）
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__INQUIRY_UI__ = {
        patientName: this.config.patientName,
        isGenerating: () => this.isGenerating,
        currentQuestion: this.currentQuestion,
        requiredCluesComplete: this.config.clueTracker.areRequiredCluesComplete(),
        visible: this.visible,
        getStatus: () => this.getStatus()
      };
    }
  }

  /**
   * 清空对话
   */
  clear(): void {
    this.dialogueText.setText('');
    this.currentQuestion = '';
    this.updateInputText();
    this.exposeToGlobal();
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    this.sseClient.stop();
    this.requiredClueElements.clear();
    this.auxiliaryClueElements.clear();
    this.questionButtons = [];

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__INQUIRY_UI__ = null;
      (window as any).__CLUE_TRACKER_VISIBLE__ = false;
    }

    super.destroy();
  }
}