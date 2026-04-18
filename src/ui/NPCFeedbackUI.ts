// src/ui/NPCFeedbackUI.ts
/**
 * NPC点评界面组件
 * 功能:
 * - 显示青木先生点评内容
 * - 流式输出点评文字
 * - 提供结束点评按钮
 *
 * Phase 2 S6e 实现
 * Round 4 视觉优化: 方案D悬浮卡片（顶层弹窗）
 */

import Phaser from 'phaser';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
import { SSEClient } from '../utils/sseClient';
import { DiagnosisScore } from '../systems/ScoringSystem';

/**
 * 创建顶层悬浮卡片背景Graphics对象（方案D + 顶层特性）
 *
 * 设计特征（顶层弹窗专用）:
 * - 背景: 完全不透明(alpha=1.0)，渐变灰蓝到暗绿
 * - 底部阴影: 产生悬浮感
 * - 顶部光带: 金棕装饰
 * - 边框: 2px 金棕边框
 *
 * @param scene Phaser场景
 * @param x 绘制起点X（左上角）
 * @param y 绘制起点Y（左上角）
 * @param width 宽度
 * @param height 高度
 * @returns Graphics对象
 */
function createTopLevelFloatingCardBackground(
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

  // 3. 主背景渐变（灰蓝到暗绿，从上到下，完全不透明）
  graphics.fillGradientStyle(
    0x406050, 1,  // 左上: 灰蓝
    0x406050, 1,  // 右上: 灰蓝
    0x304030, 1,  // 左下: 暗绿
    0x304030, 1   // 右下: 暗绿
  );
  graphics.fillRect(x, y, width, height);

  // 4. 顶部光带（金棕色装饰，3px高度）
  graphics.fillStyle(UI_COLORS.BORDER_GLOW, 0.3);
  graphics.fillRect(x, y, width, 3);

  // 5. 顶部微弱高光（1px白色高光）
  graphics.fillStyle(0xffffff, 0.1);
  graphics.fillRect(x, y, width, 1);

  // 6. 金棕边框（3px，顶层强调）
  graphics.lineStyle(3, UI_COLORS.BORDER_GLOW, 1);
  graphics.strokeRect(x, y, width, height);

  return graphics;
}

/**
 * 创建内凹内容区域背景（方案8）
 *
 * 设计特征:
 * - 暗顶左边框 + 亮底右边框
 * - 完全不透明
 *
 * @param scene Phaser场景
 * @param x 绘制起点X
 * @param y 绘制起点Y
 * @param width 宽度
 * @param height 高度
 * @returns Graphics对象
 */
function createInsetContentBackground(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();

  // 主背景（内凹底色）
  graphics.fillStyle(UI_COLORS.PANEL_INSET, 1);
  graphics.fillRect(x, y, width, height);

  // 内凹边框效果（暗边在上/左，亮边在下/右）
  graphics.lineStyle(2, UI_COLORS.BORDER_INSET_DARK, 1);
  graphics.strokeRect(x, y, width, height);

  return graphics;
}

export interface NPCFeedbackUIConfig {
  npcId: string;           // NPC ID
  npcName: string;         // NPC名称
  score: DiagnosisScore;   // 评分结果
  caseId: string;          // 病案ID
  caseName: string;        // 病案名称
  onComplete: () => void;  // 点评完成回调
}

export class NPCFeedbackUI extends Phaser.GameObjects.Container {
  // 界面元素
  private background!: Phaser.GameObjects.Graphics;  // 方案D: Graphics渐变背景
  private npcAvatar!: Phaser.GameObjects.Graphics;   // 头像区域也使用Graphics
  private npcNameText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private cursorText!: Phaser.GameObjects.Text;
  private stopButton!: Phaser.GameObjects.Text;
  private completeButton!: Phaser.GameObjects.Text;

  // 状态
  private config: NPCFeedbackUIConfig;
  private sseClient: SSEClient;
  private isGenerating: boolean = false;
  private currentFeedback: string = '';

  constructor(scene: Phaser.Scene, x: number, y: number, config: NPCFeedbackUIConfig) {
    super(scene, x, y);
    this.config = config;
    this.sseClient = new SSEClient();

    // 弹窗尺寸
    const panelWidth = 640;
    const panelHeight = 360;

    // 创建主背景（方案D: 顶层悬浮卡片，完全不透明）
    this.background = createTopLevelFloatingCardBackground(
      scene,
      -panelWidth / 2,  // x（左上角）
      -panelHeight / 2, // y（左上角）
      panelWidth,
      panelHeight
    );
    this.add(this.background);

    // 创建NPC头像区域
    this.createNPCAvatarArea(scene, panelWidth, panelHeight);

    // 创建点评内容区域
    this.createFeedbackArea(scene, panelWidth, panelHeight);

    // 创建按钮区域
    this.createButtonArea(scene, panelHeight);

    // 设置深度（顶层弹窗）
    this.setDepth(200);
    this.setScrollFactor(0);

    // 添加到场景
    scene.add.existing(this);

    // 开始生成点评
    this.startFeedbackGeneration();

    // 暴露到全局
    this.exposeToGlobal();
  }

  /**
   * 创建NPC头像区域
   */
  private createNPCAvatarArea(scene: Phaser.Scene, panelWidth: number, panelHeight: number): void {
    // NPC头像位置（左上区域）
    const avatarX = -panelWidth / 2 + 50;
    const avatarY = -panelHeight / 2 + 50;
    const avatarSize = 80;

    // NPC头像背景（使用柔和绿色边框）
    this.npcAvatar = scene.add.graphics();
    // 头像背景填充
    this.npcAvatar.fillStyle(UI_COLORS.PANEL_SECONDARY, 1);
    this.npcAvatar.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    // 头像边框（金棕色）
    this.npcAvatar.lineStyle(2, UI_COLORS.BORDER_GLOW, 1);
    this.npcAvatar.strokeRect(avatarX, avatarY, avatarSize, avatarSize);
    this.add(this.npcAvatar);

    // NPC名称（头像下方）
    this.npcNameText = scene.add.text(avatarX + avatarSize / 2, avatarY + avatarSize + 15, this.config.npcName, {
      fontSize: '18px',
      color: UI_COLOR_STRINGS.TEXT_BRIGHT,  // 高亮文字
      fontStyle: 'bold'
    });
    this.npcNameText.setOrigin(0.5);
    this.add(this.npcNameText);

    // 点评标题（居中，顶部）
    const titleText = scene.add.text(0, -panelHeight / 2 + 25, '诊治点评', {
      fontSize: '24px',
      color: UI_COLOR_STRINGS.SOFT_YELLOW,  // 柔和黄色标题
      fontStyle: 'bold'
    });
    titleText.setOrigin(0.5);
    this.add(titleText);

    // 评分摘要（右侧）
    const score = this.config.score;
    const scoreText = scene.add.text(panelWidth / 2 - 100, avatarY + 20, `得分: ${score.total}分`, {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.TEXT_BRIGHT,
      fontStyle: 'bold'
    });
    scoreText.setOrigin(0.5);
    this.add(scoreText);

    // 评分百分比
    const percentText = scene.add.text(panelWidth / 2 - 100, avatarY + 50, `${score.percentage}%`, {
      fontSize: '16px',
      color: score.percentage >= 80 ? UI_COLOR_STRINGS.STATUS_SUCCESS :
            score.percentage >= 60 ? UI_COLOR_STRINGS.STATUS_WARNING :
            UI_COLOR_STRINGS.STATUS_ERROR
    });
    percentText.setOrigin(0.5);
    this.add(percentText);
  }

  /**
   * 创建点评内容区域
   */
  private createFeedbackArea(scene: Phaser.Scene, panelWidth: number, _panelHeight: number): void {
    // 内容区域尺寸和位置
    const contentWidth = panelWidth - 40;  // 左右留边距
    const contentHeight = 180;
    const contentX = -contentWidth / 2;
    const contentY = -30;  // 居中偏上

    // 点评内容背景（方案8: 内凹效果）
    const contentBg = createInsetContentBackground(
      scene,
      contentX,
      contentY,
      contentWidth,
      contentHeight
    );
    this.add(contentBg);

    // 文字区域约束（确保不溢出）
    const textPadding = 20;
    const textMaxWidth = contentWidth - textPadding * 2;

    // 点评文本
    this.feedbackText = scene.add.text(contentX + textPadding, contentY + textPadding, '', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_TIP,  // 提示文字色（高对比度）
      wordWrap: { width: textMaxWidth },
      lineSpacing: 8
    });
    this.add(this.feedbackText);

    // 光标效果
    this.cursorText = scene.add.text(contentX + textPadding, contentY + textPadding, '|', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.STATUS_SUCCESS
    });
    this.cursorText.setVisible(false);
    this.add(this.cursorText);
  }

  /**
   * 创建按钮区域
   */
  private createButtonArea(scene: Phaser.Scene, _panelHeight: number): void {
    // 按钮位置（底部区域）
    const buttonY = 360 / 2 - 50;  // 使用固定值，panelHeight = 360

    // 停止生成按钮（柔和红色警示）
    this.stopButton = scene.add.text(-100, buttonY, '[停止生成]', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.SOFT_RED,  // 柔和红色
      backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
      padding: { x: 12, y: 6 }
    });
    this.stopButton.setOrigin(0.5);
    this.stopButton.setInteractive({ useHandCursor: true });

    this.stopButton.on('pointerdown', () => {
      this.handleStop();
    });

    // 悬停效果
    this.stopButton.on('pointerover', () => {
      this.stopButton.setColor('#d08080');  // 悬停红色更亮
    });
    this.stopButton.on('pointerout', () => {
      this.stopButton.setColor(UI_COLOR_STRINGS.SOFT_RED);
    });

    this.stopButton.setVisible(false);  // 默认隐藏
    this.add(this.stopButton);

    // 完成按钮（柔和绿色成功）
    this.completeButton = scene.add.text(100, buttonY, '[完成点评]', {
      fontSize: '18px',
      color: UI_COLOR_STRINGS.TEXT_BRIGHT,  // 高亮文字
      backgroundColor: UI_COLOR_STRINGS.BUTTON_SUCCESS,  // 柔和绿色背景
      padding: { x: 12, y: 6 }
    });
    this.completeButton.setOrigin(0.5);
    this.completeButton.setInteractive({ useHandCursor: true });

    this.completeButton.on('pointerdown', () => {
      this.handleComplete();
    });

    // 悬停效果
    this.completeButton.on('pointerover', () => {
      this.completeButton.setBackgroundColor(UI_COLOR_STRINGS.SOFT_GREEN_HOVER);
    });
    this.completeButton.on('pointerout', () => {
      this.completeButton.setBackgroundColor(UI_COLOR_STRINGS.BUTTON_SUCCESS);
    });

    this.completeButton.setVisible(false);  // 默认隐藏，生成完成后显示
    this.add(this.completeButton);
  }

  /**
   * 开始生成点评
   */
  private async startFeedbackGeneration(): Promise<void> {
    this.isGenerating = true;
    this.stopButton.setVisible(true);
    this.cursorText.setVisible(true);

    // 构建点评请求
    const prompt = this.buildFeedbackPrompt();

    try {
      await this.sseClient.chatStream(
        {
          npc_id: this.config.npcId,
          player_id: 'player_001',
          user_message: prompt
        },
        (chunk) => {
          this.handleChunk(chunk);
        },
        (full) => {
          this.handleCompleteGeneration(full);
        },
        (error) => {
          this.handleError(error);
        }
      );
    } catch (error) {
      // 使用本地生成作为备用
      this.generateLocalFeedback();
    }
  }

  /**
   * 构建点评请求
   */
  private buildFeedbackPrompt(): string {
    const score = this.config.score;

    return `请点评以下诊治表现:

病案: ${this.config.caseName}
总分: ${score.total}分 (${score.percentage}%)

各环节得分:
- 问诊: ${score.stages.inquiry.earnedScore}分
- 脉诊: ${score.stages.pulse.earnedScore}分
- 舌诊: ${score.stages.tongue.earnedScore}分
- 辨证: ${score.stages.syndrome.earnedScore}分
- 选方: ${score.stages.prescription.earnedScore}分

薄弱环节: ${score.weaknesses.join('、') || '无明显薄弱'}
优势环节: ${score.strengths.join('、') || '继续努力'}

请以青木先生（中医师，说话古朴典雅）的风格给出点评:
1. 总体评价
2. 各环节具体点评
3. 学习建议
4. 鼓励语

控制在200字以内。`;
  }

  /**
   * 处理流式输出chunk
   */
  private handleChunk(chunk: string): void {
    this.currentFeedback += chunk;
    this.feedbackText.setText(this.currentFeedback);

    // 内容区域参数
    const contentWidth = 640 - 40;  // panelWidth - padding
    const contentX = -contentWidth / 2;
    const contentY = -30;
    const textPadding = 20;

    // 更新光标位置（跟随文字）
    const cursorX = contentX + textPadding + this.feedbackText.width;
    const cursorY = contentY + textPadding + this.feedbackText.height;
    this.cursorText.setPosition(cursorX, cursorY);

    this.exposeToGlobal();
  }

  /**
   * 处理生成完成
   */
  private handleCompleteGeneration(full: string): void {
    this.isGenerating = false;
    this.stopButton.setVisible(false);
    this.cursorText.setVisible(false);
    this.completeButton.setVisible(true);

    this.currentFeedback = full;
    this.feedbackText.setText(full);

    console.log('[NPCFeedbackUI] Generation complete:', full);
    this.exposeToGlobal();
  }

  /**
   * 处理错误
   */
  private handleError(error: Error): void {
    console.error('[NPCFeedbackUI] Generation error:', error);
    this.generateLocalFeedback();
  }

  /**
   * 本地生成点评（备用）
   */
  private generateLocalFeedback(): void {
    const score = this.config.score;
    let feedback = '';

    if (score.percentage >= 80) {
      feedback = `${this.config.npcName}: "做得很好！辨证思路清晰，方剂选择准确。你的医道悟性颇高，继续保持这份认真，日后必成良医。"`;
    } else if (score.percentage >= 60) {
      feedback = `${this.config.npcName}: "尚可。${score.weaknesses.length > 0 ? `你在${score.weaknesses.join('、')}方面还需加强。` : ''}医道之路，贵在积累，多加练习，定有进步。"`;
    } else {
      feedback = `${this.config.npcName}: "还需努力。${score.weaknesses.length > 0 ? `建议你回去复习${score.weaknesses.join('、')}的内容。` : ''}医者仁心，亦需医者耐心，循序渐进，方能得道。"`;
    }

    this.handleCompleteGeneration(feedback);
  }

  /**
   * 处理停止
   */
  private handleStop(): void {
    if (this.isGenerating) {
      this.sseClient.stop();
      this.isGenerating = false;
      this.stopButton.setVisible(false);
      this.cursorText.setVisible(false);
      this.completeButton.setVisible(true);

      console.log('[NPCFeedbackUI] Generation stopped');
      this.exposeToGlobal();
    }
  }

  /**
   * 处理完成
   */
  private handleComplete(): void {
    this.config.onComplete();
  }

  /**
   * 获取状态
   */
  getStatus(): {
    isGenerating: boolean;
    currentFeedback: string;
    feedbackLength: number;
  } {
    return {
      isGenerating: this.isGenerating,
      currentFeedback: this.currentFeedback,
      feedbackLength: this.currentFeedback.length
    };
  }

  /**
   * 暴露到全局
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__NPC_FEEDBACK_UI__ = {
        npcId: this.config.npcId,
        npcName: this.config.npcName,
        isGenerating: this.isGenerating,
        feedbackLength: this.currentFeedback.length,
        getStatus: () => this.getStatus()
      };
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.sseClient.stop();

    if (typeof window !== 'undefined') {
      (window as any).__NPC_FEEDBACK_UI__ = null;
    }

    super.destroy();
  }
}