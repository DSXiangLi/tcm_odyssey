// src/ui/TutorialUI.ts
/**
 * 新手引导界面组件
 *
 * 功能:
 * - 集中引导面板显示（TitleScene）
 * - 步骤提示（移动、交互、背包）
 * - 按键提示显示
 * - 跳过按钮
 * - 进度指示器
 * - 下一步/继续按钮
 * - 场景分散提示气泡（各场景首次进入）
 *
 * Phase 2 S13.3 实现
 */

import Phaser from 'phaser';
import { EventBus, EventData } from '../systems/EventBus';
import { TutorialManager, TutorialEvent } from '../systems/TutorialManager';
import {
  TutorialStepId,
  SceneTipConfig,
  TUTORIAL_STEPS,
  SKIP_TUTORIAL_CONFIG
} from '../data/tutorial-data';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';

/**
 * 创建渐变玻璃背景Graphics对象（方案A）
 *
 * 设计特征:
 * - 背景: 完全不透明(alpha=1.0)，灰蓝色渐变
 * - 边框: 3px 金棕(0xc0a080)，与底层场景区分
 * - 顶部光带: 金棕渐变装饰
 * - 外阴影: 8px黑色阴影增强立体感
 *
 * @param scene Phaser场景
 * @param x 绘制起点X（左上角）
 * @param y 绘制起点Y（左上角）
 * @param width 宽度
 * @param height 高度
 * @returns Graphics对象
 */
function createGradientGlassBackground(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();

  // 1. 外阴影（增强立体感，8px偏移）
  graphics.fillStyle(0x000000, 0.5);
  graphics.fillRect(x + 4, y + 8, width, height);

  // 2. 渐变背景（灰蓝到土黄，完全不透明）- 关键修改：alpha从0.3-0.4改为1.0
  graphics.fillGradientStyle(
    UI_COLORS.PANEL_GLASS_LIGHT, 1.0,  // 左上: 灰蓝，完全不透明
    UI_COLORS.PANEL_GLASS_DARK, 1.0,   // 右上: 土黄，完全不透明
    UI_COLORS.PANEL_GLASS_LIGHT, 1.0,  // 左下: 灰蓝，完全不透明
    UI_COLORS.PANEL_GLASS_DARK, 1.0    // 右下: 土黄，完全不透明
  );
  graphics.fillRect(x, y, width, height);

  // 3. 顶部光带（金棕到透明，从上到下，高度40px）
  const lightBandHeight = Math.min(40, height * 0.12);
  graphics.fillGradientStyle(
    UI_COLORS.BORDER_GLOW, 0.25,   // 左上: 金棕
    UI_COLORS.BORDER_GLOW, 0.25,   // 右上: 金棕
    0x000000, 0,                   // 左下: 透明
    0x000000, 0                    // 右下: 透明
  );
  graphics.fillRect(x, y, width, lightBandHeight);

  // 4. 金棕边框（3px，更醒目）
  graphics.lineStyle(3, UI_COLORS.BORDER_GLOW, 1.0);
  graphics.strokeRect(x, y, width, height);

  return graphics;
}

/**
 * 创建悬浮卡片背景Graphics对象（方案6）
 *
 * 设计特征:
 * - 底部悬浮阴影: 黑色(0x000000, 0.5) 8px高度
 * - 边缘阴影: 黑色(0x000000, 0.3) 4px偏移
 * - 主背景渐变: 灰蓝(0x406050) → 暗绿(0x304030)
 * - 顶部光带: 金棕(0xc0a080, 0.3) 2px
 * - 顶部高光: 白色(0xffffff, 0.1) 1px
 * - 边框: 2px 金棕(0xc0a080, 0.5)
 *
 * @param scene Phaser场景
 * @param x 绘制起点X（左上角）
 * @param y 绘制起点Y（左上角）
 * @param width 宽度
 * @param height 高度
 * @returns Graphics对象
 */
function createFloatingCardBackground(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();

  // 1. 底部悬浮阴影（模拟卡片悬浮感）
  graphics.fillStyle(0x000000, 0.5);
  graphics.fillRect(x + 4, y + height + 4, width, 8);

  // 2. 边缘阴影（卡片四周的柔和阴影）
  graphics.fillStyle(0x000000, 0.3);
  graphics.fillRect(x + 4, y + 4, width, height);

  // 3. 主背景渐变（灰蓝到暗绿，从上到下）
  graphics.fillGradientStyle(
    0x406050, 1,  // 左上: 灰蓝
    0x406050, 1,  // 右上: 灰蓝
    0x304030, 1,  // 左下: 暗绿
    0x304030, 1   // 右下: 暗绿
  );
  graphics.fillRect(x, y, width, height);

  // 4. 顶部光带（金棕色装饰，2px高度）
  graphics.fillStyle(UI_COLORS.BORDER_GLOW, 0.3);
  graphics.fillRect(x, y, width, 2);

  // 5. 顶部微弱高光（1px白色高光）
  graphics.fillStyle(0xffffff, 0.1);
  graphics.fillRect(x, y, width, 1);

  // 6. 金棕边框（2px）
  graphics.lineStyle(2, UI_COLORS.BORDER_GLOW, 0.5);
  graphics.strokeRect(x, y, width, height);

  return graphics;
}

/**
 * 创建顶层确认弹窗背景Graphics对象（方案C）
 *
 * 设计特征:
 * - 背景: 完全不透明(alpha=1.0)，灰蓝色
 * - 强边框: 4px 金棕色(#c0a080)
 * - 外发光: 2px 金棕外发光(alpha 0.4)
 * - 强阴影: 16px黑色阴影(alpha 0.6)
 *
 * @param scene Phaser场景
 * @param x 绘制起点X（左上角）
 * @param y 绘制起点Y（左上角）
 * @param width 宽度
 * @param height 高度
 * @returns Graphics对象
 */
function createTopLevelConfirmBackground(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();

  // 1. 强阴影（16px偏移，alpha 0.6）
  graphics.fillStyle(0x000000, 0.6);
  graphics.fillRect(x + 8, y + 16, width, height);

  // 2. 外发光（2px金棕，alpha 0.4）- 在弹窗外围
  graphics.lineStyle(2, UI_COLORS.BORDER_GLOW, 0.4);
  graphics.strokeRect(x - 2, y - 2, width + 4, height + 4);

  // 3. 主背景（完全不透明！灰蓝色）
  graphics.fillStyle(UI_COLORS.PANEL_PRIMARY, 1.0);
  graphics.fillRect(x, y, width, height);

  // 4. 强边框（4px金棕色）
  graphics.lineStyle(4, UI_COLORS.BORDER_GLOW, 1);
  graphics.strokeRect(x, y, width, height);

  return graphics;
}

/**
 * TutorialUI配置
 */
export interface TutorialUIConfig {
  scene: Phaser.Scene;
  type: 'central' | 'scene_tip';  // 集中引导或场景提示
  sceneTipConfig?: SceneTipConfig;  // 场景提示配置（type为scene_tip时使用）
  onClose?: () => void;
  onSkip?: () => void;
  onNext?: () => void;
}

/**
 * 新手引导UI类
 */
export class TutorialUI {
  private scene: Phaser.Scene;
  private tutorialManager: TutorialManager;
  private eventBus: EventBus;

  private container!: Phaser.GameObjects.Container;
  private type: 'central' | 'scene_tip';

  // 集中引导UI元素
  private background!: Phaser.GameObjects.Graphics;  // 渐变玻璃背景（方案3）
  private titleText!: Phaser.GameObjects.Text;
  private stepContainer!: Phaser.GameObjects.Container;
  private progressText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressBg!: Phaser.GameObjects.Rectangle;
  private skipButton!: Phaser.GameObjects.Text;
  private nextButton!: Phaser.GameObjects.Text;

  // 场景提示UI元素
  private tipContainer!: Phaser.GameObjects.Container;
  private tipBackground!: Phaser.GameObjects.Graphics;  // 方案6: 悬浮卡片背景（改为Graphics）
  private tipText!: Phaser.GameObjects.Text;

  // 当前状态
  private currentStep: TutorialStepId | null = null;
  private completedSteps: TutorialStepId[] = [];
  private sceneTipConfig?: SceneTipConfig;

  // 回调
  private onClose?: () => void;
  private onSkip?: () => void;
  private onNext?: () => void;

  // 事件监听器引用
  private tutorialStartedListener: (data: EventData) => void;
  private tutorialStepCompletedListener: (data: EventData) => void;
  private tutorialSkippedListener: (data: EventData) => void;
  private sceneTipShownListener: (data: EventData) => void;

  // 进度条样式常量
  private readonly progressBarConfig = {
    strokeWidth: 2,          // 边框宽度
    internalPadding: 2,      // 内部间隙（边框到填充的距离）
    fillHeight: 16,          // 填充高度
    bgHeight: 20             // 背景高度
  };

  // 样式配置（使用场景PNG提取的配色主题 + 方案3渐变玻璃）
  private readonly styles = {
    // 背景使用Graphics绘制渐变，不再使用Rectangle
    title: { fontSize: '28px', color: UI_COLOR_STRINGS.TEXT_BRIGHT, fontStyle: 'bold' },  // 高亮文字
    stepTitle: { fontSize: '20px', color: UI_COLOR_STRINGS.TEXT_BRIGHT, fontStyle: 'bold' },  // 高亮文字
    stepContent: { fontSize: '16px', color: UI_COLOR_STRINGS.TEXT_TIP },  // 提示文字
    keyHint: { fontSize: '18px', color: UI_COLOR_STRINGS.TEXT_HIGHLIGHT },
    progress: { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_TIP },  // 提示文字
    progressBar: { fillColor: UI_COLORS.BUTTON_SUCCESS, alpha: 1 },
    progressBg: { fillColor: UI_COLORS.PANEL_INSET, alpha: 0.8, strokeColor: UI_COLORS.BORDER_PRIMARY, strokeAlpha: 0.8 },  // 内凹背景色 + 边框
    skipButton: { fontSize: '16px', color: '#c07070' },  // SOFT_RED 警示色
    nextButton: { fontSize: '18px', color: UI_COLOR_STRINGS.TEXT_BRIGHT, backgroundColor: UI_COLOR_STRINGS.BUTTON_SUCCESS },  // 高亮文字
    tipBackground: { fillColor: UI_COLORS.PANEL_PRIMARY, alpha: 0.85 },
    tipText: { fontSize: '16px', color: UI_COLOR_STRINGS.TEXT_TIP }  // 提示文字
  };

  constructor(config: TutorialUIConfig) {
    this.scene = config.scene;
    this.tutorialManager = TutorialManager.getInstance();
    this.eventBus = EventBus.getInstance();
    this.type = config.type;
    this.sceneTipConfig = config.sceneTipConfig;
    this.onClose = config.onClose;
    this.onSkip = config.onSkip;
    this.onNext = config.onNext;

    // 创建监听器函数引用
    this.tutorialStartedListener = (data: EventData) => {
      this.handleTutorialStarted(data);
    };
    this.tutorialStepCompletedListener = (data: EventData) => {
      this.handleTutorialStepCompleted(data);
    };
    this.tutorialSkippedListener = (data: EventData) => {
      this.handleTutorialSkipped(data);
    };
    this.sceneTipShownListener = (data: EventData) => {
      this.handleSceneTipShown(data);
    };

    // 初始化状态
    const state = this.tutorialManager.getState();
    this.currentStep = state.current_step;
    this.completedSteps = state.completed_steps;

    // 创建UI
    this.createUI();

    // 注册事件监听
    this.registerEvents();

    // 暴露到全局（供测试访问）
    this.exposeToGlobal();
  }

  /**
   * 创建UI元素
   */
  private createUI(): void {
    if (this.type === 'central') {
      this.createCentralTutorialUI();
    } else {
      this.createSceneTipUI();
    }
  }

  /**
   * 创建集中引导UI（方案3：渐变玻璃）
   */
  private createCentralTutorialUI(): void {
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;
    const width = 500;
    const height = 350;

    // 创建容器
    this.container = this.scene.add.container(centerX, centerY);
    this.container.setDepth(1000);
    this.container.setScrollFactor(0);

    // 背景 - 使用渐变玻璃效果（方案3）
    // Graphics绘制起点为左上角，容器中心为(0,0)，所以绘制起点为(-width/2, -height/2)
    this.background = createGradientGlassBackground(this.scene, -width / 2, -height / 2, width, height);
    this.container.add(this.background);

    // 标题（使用TEXT_BRIGHT高亮文字）
    this.titleText = this.scene.add.text(0, -height / 2 + 30, '新手引导', this.styles.title).setOrigin(0.5);
    this.container.add(this.titleText);

    // 步骤容器
    this.stepContainer = this.scene.add.container(0, 0);
    this.container.add(this.stepContainer);

    // 进度条背景（使用内凹底色 + 边框）
    const barWidth = width - 80;
    const barHeight = this.progressBarConfig.bgHeight;
    this.progressBg = this.scene.add.rectangle(0, height / 2 - 80, barWidth, barHeight, this.styles.progressBg.fillColor, this.styles.progressBg.alpha);
    this.progressBg.setOrigin(0.5);
    // 添加边框（strokeStyle）
    this.progressBg.setStrokeStyle(this.progressBarConfig.strokeWidth, this.styles.progressBg.strokeColor, this.styles.progressBg.strokeAlpha);
    this.container.add(this.progressBg);

    // 进度条填充（计算有效宽度，考虑边框和内部间隙）
    const effectiveWidth = this.calculateEffectiveFillWidth(barWidth);
    const fillWidth = this.calculateProgressWidth(effectiveWidth);
    // 填充起始位置：背景左边缘 + 边框宽度 + 内部间隙
    const fillStartX = -(barWidth / 2) + this.progressBarConfig.strokeWidth + this.progressBarConfig.internalPadding;
    // 填充中心位置：起始位置 + 填充宽度的一半
    const fillCenterX = fillStartX + fillWidth / 2;
    this.progressBar = this.scene.add.rectangle(fillCenterX, height / 2 - 80, fillWidth, this.progressBarConfig.fillHeight, this.styles.progressBar.fillColor, this.styles.progressBar.alpha);
    this.progressBar.setOrigin(0.5);
    this.container.add(this.progressBar);

    // 进度文字（使用TEXT_TIP提示文字）
    const progressText = this.getProgressText();
    this.progressText = this.scene.add.text(0, height / 2 - 60, progressText, this.styles.progress).setOrigin(0.5);
    this.container.add(this.progressText);

    // 跳过按钮
    this.skipButton = this.scene.add.text(-width / 2 + 30, height / 2 - 30, SKIP_TUTORIAL_CONFIG.skip_text, this.styles.skipButton).setOrigin(0, 0.5);
    this.skipButton.setInteractive({ useHandCursor: true });
    this.skipButton.on('pointerover', () => this.skipButton.setStyle({ color: '#d08080' }));  // SOFT_RED_HOVER
    this.skipButton.on('pointerout', () => this.skipButton.setStyle({ color: '#c07070' }));  // SOFT_RED
    this.skipButton.on('pointerdown', () => this.handleSkipClick());
    this.container.add(this.skipButton);

    // 下一步按钮
    this.nextButton = this.scene.add.text(width / 2 - 30, height / 2 - 30, this.getNextButtonText(), {
      ...this.styles.nextButton,
      padding: { x: 15, y: 8 }
    }).setOrigin(1, 0.5);
    this.nextButton.setInteractive({ useHandCursor: true });
    this.nextButton.on('pointerover', () => this.nextButton.setStyle({ backgroundColor: UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER }));
    this.nextButton.on('pointerout', () => this.nextButton.setStyle({ backgroundColor: UI_COLOR_STRINGS.BUTTON_SUCCESS }));
    this.nextButton.on('pointerdown', () => this.handleNextClick());
    this.container.add(this.nextButton);

    // 显示当前步骤
    this.updateStepDisplay();
  }

  /**
   * 创建场景提示UI（方案6：悬浮卡片）
   */
  private createSceneTipUI(): void {
    if (!this.sceneTipConfig) {
      console.warn('[TutorialUI] No scene tip config provided');
      return;
    }

    const position = this.sceneTipConfig.position ?? { x: 400, y: 200 };
    const duration = this.sceneTipConfig.duration ?? 3000;

    // 计算适合2行文字的尺寸
    // 文字padding: 40 (左右各20)
    // 行高: ~24px (16px字体 + 行间距)
    // 2行 = 48px，加上上下padding各10 = 68px
    const width = 400;
    const height = 72;  // 适应最多2行文字 (2行高度48px + 上下padding24px)
    const textPaddingH = 20;  // 左右padding

    // 创建容器
    this.tipContainer = this.scene.add.container(position.x, position.y);
    this.tipContainer.setDepth(900);
    this.tipContainer.setScrollFactor(0);

    // 提示气泡背景 - 使用悬浮卡片效果（方案6）
    // Graphics绘制起点为左上角，容器中心为(0,0)，所以绘制起点为(-width/2, -height/2)
    this.tipBackground = createFloatingCardBackground(this.scene, -width / 2, -height / 2, width, height);
    this.tipContainer.add(this.tipBackground);

    // 提示文字（限制最多2行）
    const textWidth = width - textPaddingH * 2;  // wordWrap宽度考虑padding
    this.tipText = this.scene.add.text(0, 0, this.sceneTipConfig.content, {
      ...this.styles.tipText,
      wordWrap: { width: textWidth, useAdvancedWrap: true },
      maxLines: 2,  // 防止垂直溢出
      align: 'center'
    }).setOrigin(0.5);
    this.tipContainer.add(this.tipText);

    // 自动消失
    if (duration > 0) {
      this.scene.time.delayedCall(duration, () => {
        this.fadeOutTip();
      });
    }

    // 点击关闭（使用整个容器作为交互区域）
    // 创建一个透明的交互区域覆盖整个卡片
    const hitArea = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0);
    hitArea.setOrigin(0.5);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      this.destroy();
    });
    this.tipContainer.add(hitArea);
  }

  /**
   * 提示气泡淡出
   */
  private fadeOutTip(): void {
    if (!this.tipContainer) return;

    this.scene.tweens.add({
      targets: this.tipContainer,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.destroy();
      }
    });
  }

  /**
   * 更新步骤显示
   */
  private updateStepDisplay(): void {
    // 清空步骤容器
    this.stepContainer.removeAll(true);

    if (!this.currentStep) {
      // 所有步骤完成
      const completeText = this.scene.add.text(0, 0, '引导完成！\n点击继续进入游戏', {
        fontSize: '20px',
        color: UI_COLOR_STRINGS.STATUS_SUCCESS,
        align: 'center'
      }).setOrigin(0.5);
      this.stepContainer.add(completeText);

      // 更新按钮文字
      this.nextButton.setText('开始游戏');
      this.skipButton.setVisible(false);
      return;
    }

    const stepConfig = TUTORIAL_STEPS.find(s => s.id === this.currentStep);
    if (!stepConfig) return;

    // 步骤标题
    const stepTitle = this.scene.add.text(0, -50, stepConfig.title, this.styles.stepTitle).setOrigin(0.5);
    this.stepContainer.add(stepTitle);

    // 步骤内容
    const stepContent = this.scene.add.text(0, -10, stepConfig.content, {
      ...this.styles.stepContent,
      wordWrap: { width: 400 },
      align: 'center'
    }).setOrigin(0.5);
    this.stepContainer.add(stepContent);

    // 按键提示（如果有）
    if (stepConfig.key_hint) {
      const keyHintBox = this.scene.add.rectangle(0, 50, 200, 40, UI_COLORS.PANEL_LIGHT, 1);
      keyHintBox.setOrigin(0.5);
      keyHintBox.setStrokeStyle(2, UI_COLORS.BORDER_PRIMARY);
      this.stepContainer.add(keyHintBox);

      const keyHintText = this.scene.add.text(0, 50, stepConfig.key_hint, this.styles.keyHint).setOrigin(0.5);
      this.stepContainer.add(keyHintText);
    }

    // 步骤图标占位（可以后续添加实际图标）
    if (stepConfig.icon) {
      const iconPlaceholder = this.scene.add.text(-180, -50, `[${stepConfig.icon}]`, {
        fontSize: '14px',
        color: UI_COLOR_STRINGS.TEXT_DISABLED
      }).setOrigin(0.5);
      this.stepContainer.add(iconPlaceholder);
    }
  }

  /**
   * 计算有效填充宽度（考虑边框和内部间隙）
   * 公式: barWidth - strokeWidth * 2 - internalPadding * 2
   */
  private calculateEffectiveFillWidth(barWidth: number): number {
    const strokePadding = this.progressBarConfig.strokeWidth * 2;  // 边框占用：每边strokeWidth像素
    const internalPaddingTotal = this.progressBarConfig.internalPadding * 2;  // 内部间隙：每边internalPadding像素
    return barWidth - strokePadding - internalPaddingTotal;
  }

  /**
   * 计算进度条填充宽度
   * @param effectiveWidth 有效填充宽度（已减去边框和内部间隙）
   */
  private calculateProgressWidth(effectiveWidth: number): number {
    const totalSteps = TUTORIAL_STEPS.length;
    const completedCount = this.completedSteps.length;
    const currentStepProgress = this.currentStep ? 0.5 : 1; // 当前步骤进行中算0.5进度

    const progress = (completedCount + currentStepProgress) / totalSteps;
    return Math.floor(effectiveWidth * progress);
  }

  /**
   * 获取进度文字
   */
  private getProgressText(): string {
    const totalSteps = TUTORIAL_STEPS.length;
    const currentStepIndex = this.currentStep
      ? TUTORIAL_STEPS.findIndex(s => s.id === this.currentStep) + 1
      : totalSteps;
    return `步骤 ${currentStepIndex} / ${totalSteps}`;
  }

  /**
   * 获取下一步按钮文字
   */
  private getNextButtonText(): string {
    if (!this.currentStep) {
      return '开始游戏';
    }

    const currentIndex = TUTORIAL_STEPS.findIndex(s => s.id === this.currentStep);
    if (currentIndex === TUTORIAL_STEPS.length - 1) {
      return '完成';
    }
    return '下一步';
  }

  /**
   * 处理跳过点击
   */
  private handleSkipClick(): void {
    // 显示确认弹窗
    this.showSkipConfirmDialog();
  }

  /**
   * 显示跳过确认弹窗（方案C：强边框顶层弹窗）
   * - 背景: 完全不透明(alpha=1.0)
   * - 边框: 4px金棕色(与底层绿色边框不同)
   * - 外发光: 2px金棕(alpha 0.4)
   * - 阴影: 16px强阴影
   */
  private showSkipConfirmDialog(): void {
    const dialogWidth = 350;
    const dialogHeight = 180;
    const textMaxWidth = dialogWidth - 60;  // 文字宽度约束公式

    // 创建弹窗容器
    const dialogContainer = this.scene.add.container(0, 0);
    dialogContainer.setDepth(1100);
    this.container.add(dialogContainer);

    // 弹窗背景 - 使用顶层确认弹窗效果（方案C：完全不透明+强边框）
    const dialogBg = createTopLevelConfirmBackground(this.scene, -dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight);
    dialogContainer.add(dialogBg);

    // 确认文字（使用TEXT_BRIGHT高亮文字，宽度约束）
    const confirmText = this.scene.add.text(0, -40, SKIP_TUTORIAL_CONFIG.confirm_text, {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_BRIGHT,  // 高亮文字（顶层弹窗使用更亮文字）
      wordWrap: { width: textMaxWidth },
      align: 'center'
    }).setOrigin(0.5);
    dialogContainer.add(confirmText);

    // 确认跳过按钮（使用TEXT_BRIGHT高亮文字）
    const confirmSkipBtn = this.scene.add.text(-80, 50, '确认跳过', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_BRIGHT,  // 高亮文字
      backgroundColor: '#c07070',  // SOFT_RED 警示按钮
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    confirmSkipBtn.setInteractive({ useHandCursor: true });
    confirmSkipBtn.on('pointerdown', () => {
      this.tutorialManager.skipTutorial();
      dialogContainer.destroy();
      if (this.onSkip) {
        this.onSkip();
      }
    });
    dialogContainer.add(confirmSkipBtn);

    // 继续引导按钮（使用TEXT_BRIGHT高亮文字）
    const continueBtn = this.scene.add.text(80, 50, '继续引导', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_BRIGHT,  // 高亮文字
      backgroundColor: UI_COLOR_STRINGS.BUTTON_SUCCESS,
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    continueBtn.setInteractive({ useHandCursor: true });
    continueBtn.on('pointerdown', () => {
      dialogContainer.destroy();
    });
    dialogContainer.add(continueBtn);
  }

  /**
   * 处理下一步点击
   */
  private handleNextClick(): void {
    if (!this.currentStep) {
      // 引导完成，进入游戏
      this.destroy();
      if (this.onClose) {
        this.onClose();
      }
      return;
    }

    // 完成当前步骤
    this.tutorialManager.completeCurrentStep();

    // 更新状态
    const state = this.tutorialManager.getState();
    this.currentStep = state.current_step;
    this.completedSteps = state.completed_steps;

    // 更新UI
    this.updateStepDisplay();
    this.updateProgress();

    if (this.onNext) {
      this.onNext();
    }
  }

  /**
   * 更新进度显示
   */
  private updateProgress(): void {
    // 更新进度条
    const width = 500;
    const barWidth = width - 80;
    const effectiveWidth = this.calculateEffectiveFillWidth(barWidth);
    const fillWidth = this.calculateProgressWidth(effectiveWidth);

    // 更新填充宽度
    this.progressBar.width = fillWidth;

    // 更新填充位置：背景左边缘 + 边框宽度 + 内部间隙 + 填充宽度的一半
    const fillStartX = -(barWidth / 2) + this.progressBarConfig.strokeWidth + this.progressBarConfig.internalPadding;
    this.progressBar.x = fillStartX + fillWidth / 2;

    // 更新进度文字
    this.progressText.setText(this.getProgressText());

    // 更新按钮文字
    this.nextButton.setText(this.getNextButtonText());
  }

  /**
   * 注册事件监听
   */
  private registerEvents(): void {
    this.eventBus.on(TutorialEvent.TUTORIAL_STARTED, this.tutorialStartedListener);
    this.eventBus.on(TutorialEvent.TUTORIAL_STEP_COMPLETED, this.tutorialStepCompletedListener);
    this.eventBus.on(TutorialEvent.TUTORIAL_SKIPPED, this.tutorialSkippedListener);
    this.eventBus.on(TutorialEvent.SCENE_TIP_SHOWN, this.sceneTipShownListener);

    // ESC键关闭（场景提示时）
    if (this.type === 'scene_tip' && this.scene.input.keyboard) {
      this.scene.input.keyboard.on('keydown-ESC', () => {
        this.destroy();
      });
    }
  }

  /**
   * 处理引导开始事件
   */
  private handleTutorialStarted(data: EventData): void {
    console.log('[TutorialUI] Tutorial started:', data);
    if (this.type === 'central') {
      this.show();
    }
  }

  /**
   * 处理步骤完成事件
   */
  private handleTutorialStepCompleted(data: EventData): void {
    console.log('[TutorialUI] Step completed:', data);
    if (this.type === 'central') {
      // 更新状态
      const state = this.tutorialManager.getState();
      this.currentStep = state.current_step;
      this.completedSteps = state.completed_steps;

      // 更新UI
      this.updateStepDisplay();
      this.updateProgress();
    }
  }

  /**
   * 处理引导跳过事件
   */
  private handleTutorialSkipped(data: EventData): void {
    console.log('[TutorialUI] Tutorial skipped:', data);
    if (this.type === 'central') {
      this.hide();
      if (this.onSkip) {
        this.onSkip();
      }
    }
  }

  /**
   * 处理场景提示显示事件
   */
  private handleSceneTipShown(data: EventData): void {
    console.log('[TutorialUI] Scene tip shown:', data);
  }

  /**
   * 显示UI
   */
  show(): void {
    // 新手引导UI激活
    if (typeof window !== 'undefined') {
      (window as any).__TUTORIAL_ACTIVE__ = true;
    }
    if (this.type === 'central' && this.container) {
      this.container.setVisible(true);
    } else if (this.type === 'scene_tip' && this.tipContainer) {
      this.tipContainer.setVisible(true);
    }
    this.exposeToGlobal();
  }

  /**
   * 隐藏UI
   */
  hide(): void {
    // 新手引导UI关闭
    if (typeof window !== 'undefined') {
      (window as any).__TUTORIAL_ACTIVE__ = false;
    }
    if (this.type === 'central' && this.container) {
      this.container.setVisible(false);
    } else if (this.type === 'scene_tip' && this.tipContainer) {
      this.tipContainer.setVisible(false);
    }
    this.exposeToGlobal();
  }

  /**
   * 获取当前状态
   */
  getStatus(): {
    type: 'central' | 'scene_tip';
    currentStep: TutorialStepId | null;
    completedSteps: TutorialStepId[];
    visible: boolean;
  } {
    return {
      type: this.type,
      currentStep: this.currentStep,
      completedSteps: this.completedSteps,
      visible: this.type === 'central'
        ? (this.container?.visible ?? false)
        : (this.tipContainer?.visible ?? false)
    };
  }

  /**
   * 暴露到全局（供测试访问）
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__TUTORIAL_UI__ = {
        type: this.type,
        currentStep: this.currentStep,
        completedSteps: this.completedSteps,
        visible: this.type === 'central'
          ? (this.container?.visible ?? false)
          : (this.tipContainer?.visible ?? false),
        getStatus: () => this.getStatus()
      };
    }
  }

  /**
   * 销毁UI
   */
  destroy(): void {
    // 取消事件监听
    this.eventBus.off(TutorialEvent.TUTORIAL_STARTED, this.tutorialStartedListener);
    this.eventBus.off(TutorialEvent.TUTORIAL_STEP_COMPLETED, this.tutorialStepCompletedListener);
    this.eventBus.off(TutorialEvent.TUTORIAL_SKIPPED, this.tutorialSkippedListener);
    this.eventBus.off(TutorialEvent.SCENE_TIP_SHOWN, this.sceneTipShownListener);

    if (this.type === 'scene_tip' && this.scene.input.keyboard) {
      this.scene.input.keyboard.off('keydown-ESC');
    }

    // 销毁容器
    if (this.container) {
      this.container.destroy();
    }
    if (this.tipContainer) {
      this.tipContainer.destroy();
    }

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__TUTORIAL_UI__ = null;
    }

    // 调用关闭回调
    if (this.onClose) {
      this.onClose();
    }
  }
}

/**
 * 创建集中引导UI
 */
export function createCentralTutorialUI(
  scene: Phaser.Scene,
  onClose?: () => void,
  onSkip?: () => void,
  onNext?: () => void
): TutorialUI {
  return new TutorialUI({
    scene,
    type: 'central',
    onClose,
    onSkip,
    onNext
  });
}

/**
 * 创建场景提示UI
 */
export function createSceneTipUI(
  scene: Phaser.Scene,
  sceneTipConfig: SceneTipConfig,
  onClose?: () => void
): TutorialUI {
  return new TutorialUI({
    scene,
    type: 'scene_tip',
    sceneTipConfig,
    onClose
  });
}