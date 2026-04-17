// src/ui/NPCFeedbackUI.ts
/**
 * NPC点评界面组件
 * 功能:
 * - 显示青木先生点评内容
 * - 流式输出点评文字
 * - 提供结束点评按钮
 *
 * Phase 2 S6e 实现
 */

import Phaser from 'phaser';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
import { SSEClient } from '../utils/sseClient';
import { DiagnosisScore } from '../systems/ScoringSystem';

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
  private background!: Phaser.GameObjects.Rectangle;
  private npcAvatar!: Phaser.GameObjects.Rectangle;
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

    // 创建主背景
    this.background = scene.add.rectangle(0, 0, 780, 400, UI_COLORS.PANEL_PRIMARY, 0.95);
    this.background.setOrigin(0.5);
    this.add(this.background);

    // 创建NPC头像区域
    this.createNPCAvatarArea(scene);

    // 创建点评内容区域
    this.createFeedbackArea(scene);

    // 创建按钮区域
    this.createButtonArea(scene);

    // 设置深度
    this.setDepth(100);
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
  private createNPCAvatarArea(scene: Phaser.Scene): void {
    // NPC头像占位
    this.npcAvatar = scene.add.rectangle(-300, -150, 100, 100, UI_COLORS.BORDER_PRIMARY, 0.9);
    this.npcAvatar.setOrigin(0.5);
    this.add(this.npcAvatar);

    // NPC名称
    this.npcNameText = scene.add.text(-300, -90, this.config.npcName, {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      fontStyle: 'bold'
    });
    this.npcNameText.setOrigin(0.5);
    this.add(this.npcNameText);

    // 点评标题
    const titleText = scene.add.text(0, -170, '诊治点评', {
      fontSize: '24px',
      color: '#ffaa00',
      fontStyle: 'bold'
    });
    titleText.setOrigin(0.5);
    this.add(titleText);
  }

  /**
   * 创建点评内容区域
   */
  private createFeedbackArea(scene: Phaser.Scene): void {
    // 点评内容背景
    const contentBg = scene.add.rectangle(0, -50, 700, 200, UI_COLORS.PANEL_SECONDARY, 0.9);
    contentBg.setOrigin(0.5);
    this.add(contentBg);

    // 点评文本
    this.feedbackText = scene.add.text(-340, -130, '', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      wordWrap: { width: 680 },
      lineSpacing: 8
    });
    this.add(this.feedbackText);

    // 光标效果
    this.cursorText = scene.add.text(340, -130, '|', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.STATUS_SUCCESS
    });
    this.cursorText.setVisible(false);
    this.add(this.cursorText);
  }

  /**
   * 创建按钮区域
   */
  private createButtonArea(scene: Phaser.Scene): void {
    // 停止生成按钮
    this.stopButton = scene.add.text(-100, 140, '[停止生成]', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.STATUS_WARNING,
      backgroundColor: UI_COLOR_STRINGS.PANEL_SECONDARY,
      padding: { x: 8, y: 4 }
    });
    this.stopButton.setOrigin(0.5);
    this.stopButton.setInteractive({ useHandCursor: true });

    this.stopButton.on('pointerdown', () => {
      this.handleStop();
    });

    this.stopButton.setVisible(false);  // 默认隐藏
    this.add(this.stopButton);

    // 完成按钮
    this.completeButton = scene.add.text(100, 140, '[完成点评]', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.ACCENT_SKY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_SECONDARY,
      padding: { x: 8, y: 4 }
    });
    this.completeButton.setOrigin(0.5);
    this.completeButton.setInteractive({ useHandCursor: true });

    this.completeButton.on('pointerdown', () => {
      this.handleComplete();
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

    // 更新光标位置
    const lastLineY = this.feedbackText.height;
    this.cursorText.setPosition(-340 + this.feedbackText.width, -130 + lastLineY);

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