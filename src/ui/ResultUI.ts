// src/ui/ResultUI.ts
/**
 * 结果页面组件
 * 功能:
 * - 显示总分和各环节评分
 * - 显示NPC点评（青木先生点评）
 * - 显示薄弱点和优势分析
 * - 提供返回病案库或继续学习按钮
 *
 * Phase 2 S6e 实现
 */

import Phaser from 'phaser';
import { DiagnosisScore } from '../systems/ScoringSystem';

export interface ResultUIConfig {
  score: DiagnosisScore;
  caseId: string;
  caseName: string;
  onReturnToClinic: () => void;  // 返回诊所回调
  onViewCaseHistory: () => void; // 查看病案历史回调
}

export class ResultUI extends Phaser.GameObjects.Container {
  // 界面元素
  private background!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private totalScoreText!: Phaser.GameObjects.Text;
  private scoreBars: Phaser.GameObjects.Rectangle[] = [];
  private scoreLabels: Phaser.GameObjects.Text[] = [];
  private weaknessText!: Phaser.GameObjects.Text;
  private strengthText!: Phaser.GameObjects.Text;
  private npcFeedbackContainer!: Phaser.GameObjects.Container;
  private returnButton!: Phaser.GameObjects.Text;
  private historyButton!: Phaser.GameObjects.Text;

  // 状态
  private config: ResultUIConfig;

  constructor(scene: Phaser.Scene, x: number, y: number, config: ResultUIConfig) {
    super(scene, x, y);
    this.config = config;

    // 创建主背景
    this.background = scene.add.rectangle(0, 0, 780, 600, 0x2a2a2a, 0.95);
    this.background.setOrigin(0.5);
    this.add(this.background);

    // 创建标题
    this.createTitle(scene);

    // 创建总分区域
    this.createTotalScoreArea(scene);

    // 创建各环节评分区域
    this.createStageScoresArea(scene);

    // 创建薄弱点和优势区域
    this.createAnalysisArea(scene);

    // 创建NPC点评区域
    this.createNPCFeedbackArea(scene);

    // 创建按钮区域
    this.createButtonArea(scene);

    // 设置深度
    this.setDepth(100);
    this.setScrollFactor(0);

    // 添加到场景
    scene.add.existing(this);

    // 暴露到全局
    this.exposeToGlobal();

    // 结果UI可见
    if (typeof window !== 'undefined') {
      (window as any).__RESULT_UI_VISIBLE__ = true;
    }
  }

  /**
   * 创建标题
   */
  private createTitle(scene: Phaser.Scene): void {
    this.titleText = scene.add.text(0, -280, `诊治完成 - ${this.config.caseName}`, {
      fontSize: '24px',
      color: '#8B4513',
      fontStyle: 'bold'
    });
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);
  }

  /**
   * 创建总分区域
   */
  private createTotalScoreArea(scene: Phaser.Scene): void {
    // 总分背景
    const totalBg = scene.add.rectangle(0, -230, 200, 80, 0x1a1a1a, 0.9);
    totalBg.setOrigin(0.5);
    this.add(totalBg);

    // 总分标题
    const totalLabel = scene.add.text(0, -260, '总分', {
      fontSize: '16px',
      color: '#888888'
    });
    totalLabel.setOrigin(0.5);
    this.add(totalLabel);

    // 总分数值
    const scoreColor = this.getScoreColor(this.config.score.percentage);
    this.totalScoreText = scene.add.text(0, -220, `${this.config.score.total}分`, {
      fontSize: '32px',
      color: scoreColor,
      fontStyle: 'bold'
    });
    this.totalScoreText.setOrigin(0.5);
    this.add(this.totalScoreText);

    // 百分比
    const percentageText = scene.add.text(0, -190, `${this.config.score.percentage}%`, {
      fontSize: '14px',
      color: scoreColor
    });
    percentageText.setOrigin(0.5);
    this.add(percentageText);
  }

  /**
   * 创建各环节评分区域
   */
  private createStageScoresArea(scene: Phaser.Scene): void {
    const stages = [
      { name: '问诊', score: this.config.score.stages.inquiry },
      { name: '脉诊', score: this.config.score.stages.pulse },
      { name: '舌诊', score: this.config.score.stages.tongue },
      { name: '辨证', score: this.config.score.stages.syndrome },
      { name: '选方', score: this.config.score.stages.prescription },
      { name: '综合', score: this.config.score.stages.overall }
    ];

    const startX = -300;
    const startY = -150;
    const barWidth = 120;
    const barHeight = 20;
    const spacing = 40;

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const x = startX;
      const y = startY + i * spacing;

      // 环节名称
      const label = scene.add.text(x, y, stage.name, {
        fontSize: '14px',
        color: '#ffffff'
      });
      this.add(label);
      this.scoreLabels.push(label);

      // 评分条背景
      const barBg = scene.add.rectangle(x + 60, y + 10, barWidth, barHeight, 0x3a3a3a, 0.9);
      barBg.setOrigin(0, 0);
      this.add(barBg);

      // 评分条（填充）
      const fillWidth = (stage.score.percentage / 100) * barWidth;
      const fillColor = this.getScoreColor(stage.score.percentage);
      const barFill = scene.add.rectangle(x + 60, y + 10, fillWidth, barHeight, this.hexToNumber(fillColor), 0.9);
      barFill.setOrigin(0, 0);
      this.add(barFill);
      this.scoreBars.push(barFill);

      // 分数文字
      const scoreText = scene.add.text(x + 190, y, `${stage.score.earnedScore}/${stage.score.maxScore}`, {
        fontSize: '14px',
        color: fillColor
      });
      this.add(scoreText);
    }
  }

  /**
   * 创建薄弱点和优势区域
   */
  private createAnalysisArea(scene: Phaser.Scene): void {
    // 薄弱点标题
    const weaknessLabel = scene.add.text(-300, 100, '薄弱环节:', {
      fontSize: '16px',
      color: '#ff6600'
    });
    this.add(weaknessLabel);

    // 薄弱点内容
    const weaknessContent = this.config.score.weaknesses.length > 0
      ? this.config.score.weaknesses.join('、')
      : '无明显薄弱环节';
    this.weaknessText = scene.add.text(-300, 125, weaknessContent, {
      fontSize: '14px',
      color: '#ff6600',
      wordWrap: { width: 350 }
    });
    this.add(this.weaknessText);

    // 优势标题
    const strengthLabel = scene.add.text(100, 100, '优势环节:', {
      fontSize: '16px',
      color: '#00ff00'
    });
    this.add(strengthLabel);

    // 优势内容
    const strengthContent = this.config.score.strengths.length > 0
      ? this.config.score.strengths.join('、')
      : '继续努力';
    this.strengthText = scene.add.text(100, 125, strengthContent, {
      fontSize: '14px',
      color: '#00ff00',
      wordWrap: { width: 350 }
    });
    this.add(this.strengthText);
  }

  /**
   * 创建NPC点评区域
   */
  private createNPCFeedbackArea(scene: Phaser.Scene): void {
    this.npcFeedbackContainer = scene.add.container(0, 180);
    this.add(this.npcFeedbackContainer);

    // NPC点评背景
    const feedbackBg = scene.add.rectangle(0, 0, 700, 100, 0x1a1a1a, 0.9);
    feedbackBg.setOrigin(0.5);
    this.npcFeedbackContainer.add(feedbackBg);

    // NPC头像占位
    const avatarPlaceholder = scene.add.rectangle(-320, 0, 60, 60, 0x8B4513, 0.9);
    avatarPlaceholder.setOrigin(0.5);
    this.npcFeedbackContainer.add(avatarPlaceholder);

    // NPC名称
    const npcName = scene.add.text(-320, -40, '青木先生', {
      fontSize: '14px',
      color: '#ffffff'
    });
    npcName.setOrigin(0.5);
    this.npcFeedbackContainer.add(npcName);

    // NPC点评内容
    const feedbackText = this.generateNPCFeedback();
    const feedbackContent = scene.add.text(-270, -30, feedbackText, {
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: 550 },
      lineSpacing: 6
    });
    this.npcFeedbackContainer.add(feedbackContent);
  }

  /**
   * 生成NPC点评
   */
  private generateNPCFeedback(): string {
    const score = this.config.score.percentage;
    const weaknesses = this.config.score.weaknesses;

    let feedback = '';

    if (score >= 80) {
      feedback = '做得很好！你的辨证思路清晰，方剂选择准确。继续保持这种认真的态度，医道可期。';
    } else if (score >= 60) {
      feedback = `尚可。你在${weaknesses.length > 0 ? weaknesses.join('、') : '某些环节'}还有提升空间。记得多练习，积累经验。`;
    } else {
      feedback = `还需努力。建议你回去复习${weaknesses.length > 0 ? weaknesses.join('、') : '相关内容'}的内容，理解后再来尝试。医道之路，循序渐进。`;
    }

    // 根据证型添加针对性点评
    if (this.config.caseName.includes('风寒表实')) {
      feedback += '\n\n记住：无汗是风寒表实与表虚的关键鉴别点。';
    } else if (this.config.caseName.includes('风寒表虚')) {
      feedback += '\n\n记住：有汗是风寒表虚与表实的鉴别关键。';
    } else if (this.config.caseName.includes('风热')) {
      feedback += '\n\n记住：咽痛明显、发热重是风热外感的典型特征。';
    }

    return feedback;
  }

  /**
   * 创建按钮区域
   */
  private createButtonArea(scene: Phaser.Scene): void {
    // 返回诊所按钮
    this.returnButton = scene.add.text(-100, 260, '[返回诊所]', {
      fontSize: '18px',
      color: '#00aaff',
      backgroundColor: '#1a1a1a',
      padding: { x: 10, y: 5 }
    });
    this.returnButton.setOrigin(0.5);
    this.returnButton.setInteractive({ useHandCursor: true });

    this.returnButton.on('pointerdown', () => {
      this.config.onReturnToClinic();
    });

    this.returnButton.on('pointerover', () => {
      this.returnButton.setColor('#00ffaa');
    });
    this.returnButton.on('pointerout', () => {
      this.returnButton.setColor('#00aaff');
    });

    this.add(this.returnButton);

    // 查看病案历史按钮
    this.historyButton = scene.add.text(100, 260, '[查看病案记录]', {
      fontSize: '18px',
      color: '#00aaff',
      backgroundColor: '#1a1a1a',
      padding: { x: 10, y: 5 }
    });
    this.historyButton.setOrigin(0.5);
    this.historyButton.setInteractive({ useHandCursor: true });

    this.historyButton.on('pointerdown', () => {
      this.config.onViewCaseHistory();
    });

    this.historyButton.on('pointerover', () => {
      this.historyButton.setColor('#00ffaa');
    });
    this.historyButton.on('pointerout', () => {
      this.historyButton.setColor('#00aaff');
    });

    this.add(this.historyButton);
  }

  /**
   * 获取评分颜色
   */
  private getScoreColor(percentage: number): string {
    if (percentage >= 80) return '#00ff00';
    if (percentage >= 60) return '#ffaa00';
    return '#ff6600';
  }

  /**
   * 将颜色字符串转换为数字
   */
  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }

  /**
   * 获取状态
   */
  getStatus(): {
    totalScore: number;
    percentage: number;
    weaknesses: string[];
    strengths: string[];
  } {
    return {
      totalScore: this.config.score.total,
      percentage: this.config.score.percentage,
      weaknesses: this.config.score.weaknesses,
      strengths: this.config.score.strengths
    };
  }

  /**
   * 暴露到全局
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__RESULT_UI__ = {
        totalScore: this.config.score.total,
        percentage: this.config.score.percentage,
        weaknesses: this.config.score.weaknesses,
        strengths: this.config.score.strengths,
        getStatus: () => this.getStatus()
      };
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.scoreBars = [];
    this.scoreLabels = [];

    if (typeof window !== 'undefined') {
      (window as any).__RESULT_UI__ = null;
      (window as any).__RESULT_UI_VISIBLE__ = false;
    }

    super.destroy();
  }
}