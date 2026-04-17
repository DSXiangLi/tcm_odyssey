// src/ui/CasesListUI.ts
/**
 * 病案列表界面组件
 *
 * 功能:
 * - 显示所有病案列表
 * - 显示病案状态（已解锁/未解锁/进行中/已完成）
 * - 点击查看详情或开始诊治
 * - 显示解锁条件提示
 *
 * Phase 2 S5 实现
 */

import Phaser from 'phaser';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
import { CaseManager, CaseState, CaseStatus } from '../systems/CaseManager';

export interface CasesListUIConfig {
  caseManager: CaseManager;
  onCaseSelect?: (caseId: string) => void;
  onCaseDetail?: (caseId: string) => void;
  onClose?: () => void;
}

/**
 * 病案列表UI组件
 */
export class CasesListUI extends Phaser.GameObjects.Container {
  private caseManager: CaseManager;
  private background: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private caseItems: Phaser.GameObjects.Container[] = [];
  private closeButton: Phaser.GameObjects.Text;
  private config: CasesListUIConfig;
  private scrollOffset: number = 0;
  private maxVisibleItems: number = 6;

  constructor(scene: Phaser.Scene, x: number, y: number, config: CasesListUIConfig) {
    super(scene, x, y);
    this.config = config;
    this.caseManager = config.caseManager;

    // 创建背景
    this.background = scene.add.rectangle(0, 0, 700, 500, UI_COLORS.PANEL_PRIMARY, 0.95);
    this.background.setOrigin(0.5);
    this.add(this.background);

    // 创建标题
    this.titleText = scene.add.text(0, -220, '病案记录', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);

    // 创建统计信息
    this.createStatisticsText();

    // 创建病案列表
    this.createCaseList();

    // 创建关闭按钮
    this.closeButton = scene.add.text(300, -220, '[关闭]', {
      fontSize: '16px',
      color: '#ff6600'
    });
    this.closeButton.setOrigin(0.5);
    this.closeButton.setInteractive({ useHandCursor: true });
    this.closeButton.on('pointerdown', () => {
      if (config.onClose) config.onClose();
      this.destroy();
    });
    this.add(this.closeButton);

    // 设置深度
    this.setDepth(100);

    // 添加到场景
    scene.add.existing(this);

    // 暴露到全局供测试访问
    this.exposeToGlobal();
  }

  /**
   * 创建统计信息文字
   */
  private createStatisticsText(): void {
    const stats = this.caseManager.getStatistics();
    const statsText = this.scene.add.text(0, -180,
      `总计: ${stats.total} | 完成: ${stats.completed} | 平均分: ${stats.average_score}`,
      {
        fontSize: '14px',
        color: '#aaaaaa'
      }
    );
    statsText.setOrigin(0.5);
    this.add(statsText);
  }

  /**
   * 创建病案列表
   */
  private createCaseList(): void {
    const cases = this.caseManager.getAllCases();

    // 清空现有列表
    for (const item of this.caseItems) {
      item.destroy();
    }
    this.caseItems = [];

    // 按状态排序：进行中 > 已解锁 > 已完成 > 未解锁
    const sortedCases = this.sortCases(cases);

    // 创建每个病案项
    for (let i = 0; i < sortedCases.length; i++) {
      const caseState = sortedCases[i];
      const itemY = -120 + i * 70;

      // 只显示可见范围内的项目
      if (i >= this.scrollOffset && i < this.scrollOffset + this.maxVisibleItems) {
        const item = this.createCaseItem(caseState, 0, itemY);
        this.caseItems.push(item);
        this.add(item);
      }
    }

    // 创建滚动提示（如果项目过多）
    if (cases.length > this.maxVisibleItems) {
      const scrollHint = this.scene.add.text(0, 230,
        `[滚动查看更多]`,
        {
          fontSize: '12px',
          color: '#888888'
        }
      );
      scrollHint.setOrigin(0.5);
      this.add(scrollHint);
    }
  }

  /**
   * 排序病案列表
   */
  private sortCases(cases: CaseState[]): CaseState[] {
    const statusOrder: Record<CaseStatus, number> = {
      'in_progress': 0,
      'unlocked': 1,
      'completed': 2,
      'locked': 3
    };

    return cases.sort((a, b) => {
      // 按状态排序
      const orderDiff = statusOrder[a.status] - statusOrder[b.status];
      if (orderDiff !== 0) return orderDiff;

      // 同状态按ID排序
      return a.case_id.localeCompare(b.case_id);
    });
  }

  /**
   * 创建单个病案项
   */
  private createCaseItem(caseState: CaseState, x: number, y: number): Phaser.GameObjects.Container {
    const item = this.scene.add.container(x, y);

    // 获取状态图标和颜色
    const statusInfo = this.getStatusDisplay(caseState.status);

    // 创建背景条
    const itemBg = this.scene.add.rectangle(0, 0, 650, 60, statusInfo.bgColor, 0.8);
    itemBg.setOrigin(0.5);
    item.add(itemBg);

    // 创建状态图标
    const statusIcon = this.scene.add.text(-280, 0, statusInfo.icon, {
      fontSize: '20px',
      color: statusInfo.textColor
    });
    statusIcon.setOrigin(0.5);
    item.add(statusIcon);

    // 创建病案ID和名称
    const caseName = `${caseState.definition.syndrome.type} - ${caseState.definition.prescription.name}`;
    const nameText = this.scene.add.text(-220, -15, caseState.case_id, {
      fontSize: '14px',
      color: '#ffffff'
    });
    item.add(nameText);

    const syndromeText = this.scene.add.text(-220, 5, caseName, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      wordWrap: { width: 430 }  // Item width 650 - offset 220 = 430 max
    });
    item.add(syndromeText);

    // 创建难度标识
    const difficultyText = this.scene.add.text(150, 0,
      this.getDifficultyText(caseState.definition.difficulty),
      {
        fontSize: '12px',
        color: this.getDifficultyColor(caseState.definition.difficulty)
      }
    );
    difficultyText.setOrigin(0.5);
    item.add(difficultyText);

    // 根据状态创建不同按钮
    const button = this.createActionButton(caseState, 250, 0);
    item.add(button);

    // 整个item可点击（查看详情）
    itemBg.setInteractive({ useHandCursor: true });
    itemBg.on('pointerdown', () => {
      if (this.config.onCaseDetail) {
        this.config.onCaseDetail(caseState.case_id);
      }
    });

    // 鼠标悬停效果
    itemBg.on('pointerover', () => {
      itemBg.setFillStyle(statusInfo.bgColor, 1);
    });
    itemBg.on('pointerout', () => {
      itemBg.setFillStyle(statusInfo.bgColor, 0.8);
    });

    return item;
  }

  /**
   * 获取状态显示信息
   */
  private getStatusDisplay(status: CaseStatus): { icon: string; bgColor: number; textColor: string } {
    switch (status) {
      case 'completed':
        return { icon: '☑', bgColor: UI_COLORS.STATUS_SUCCESS, textColor: UI_COLOR_STRINGS.STATUS_SUCCESS };
      case 'in_progress':
        return { icon: '●', bgColor: UI_COLORS.STATUS_WARNING, textColor: UI_COLOR_STRINGS.STATUS_WARNING };
      case 'unlocked':
        return { icon: '○', bgColor: UI_COLORS.PANEL_LIGHT, textColor: UI_COLOR_STRINGS.STATUS_SUCCESS };
      case 'locked':
        return { icon: '☐', bgColor: UI_COLORS.PANEL_DARK, textColor: UI_COLOR_STRINGS.TEXT_DISABLED };
      default:
        return { icon: '?', bgColor: UI_COLORS.PANEL_PRIMARY, textColor: UI_COLOR_STRINGS.TEXT_PRIMARY };
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
      case 'easy': return '#4caf50';
      case 'normal': return '#ffc107';
      case 'hard': return '#f44336';
      default: return '#ffffff';
    }
  }

  /**
   * 创建操作按钮
   */
  private createActionButton(caseState: CaseState, x: number, y: number): Phaser.GameObjects.Text {
    let buttonText: string;
    let buttonColor: string;
    let isInteractive: boolean;

    switch (caseState.status) {
      case 'completed':
        buttonText = `${caseState.history?.score.total || 0}分 [详情]`;
        buttonColor = '#4caf50';
        isInteractive = true;
        break;
      case 'in_progress':
        buttonText = '[继续诊治]';
        buttonColor = '#ffc107';
        isInteractive = true;
        break;
      case 'unlocked':
        buttonText = '[开始诊治]';
        buttonColor = '#4caf50';
        isInteractive = true;
        break;
      case 'locked':
        buttonText = '[查看解锁条件]';
        buttonColor = '#9e9e9e';
        isInteractive = true;
        break;
      default:
        buttonText = '[未知]';
        buttonColor = '#ffffff';
        isInteractive = false;
    }

    const button = this.scene.add.text(x, y, buttonText, {
      fontSize: '14px',
      color: buttonColor,
      backgroundColor: '#222222',
      padding: { x: 8, y: 4 }
    });
    button.setOrigin(0.5);

    if (isInteractive) {
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => {
        this.handleButtonClick(caseState);
      });
    }

    return button;
  }

  /**
   * 处理按钮点击
   */
  private handleButtonClick(caseState: CaseState): void {
    switch (caseState.status) {
      case 'completed':
        // 查看详情
        if (this.config.onCaseDetail) {
          this.config.onCaseDetail(caseState.case_id);
        }
        break;
      case 'in_progress':
        // 继续诊治
        if (this.config.onCaseSelect) {
          this.config.onCaseSelect(caseState.case_id);
        }
        break;
      case 'unlocked':
        // 开始诊治
        if (this.config.onCaseSelect) {
          this.config.onCaseSelect(caseState.case_id);
        }
        break;
      case 'locked':
        // 显示解锁条件
        this.showUnlockCondition(caseState.case_id);
        break;
    }
  }

  /**
   * 显示解锁条件
   */
  private showUnlockCondition(caseId: string): void {
    const unlockCondition = this.caseManager.getUnlockCondition(caseId);

    // 创建弹出提示
    const popupBg = this.scene.add.rectangle(0, 0, 400, 100, UI_COLORS.PANEL_LIGHT, 0.95);
    popupBg.setOrigin(0.5);
    this.add(popupBg);

    const title = this.scene.add.text(0, -30, '解锁条件', {
      fontSize: '18px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    this.add(title);

    const condition = this.scene.add.text(0, 10, unlockCondition, {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY,
      wordWrap: { width: 350 }
    });
    condition.setOrigin(0.5);
    this.add(condition);

    const closeBtn = this.scene.add.text(0, 40, '[知道了]', {
      fontSize: '12px',
      color: UI_COLOR_STRINGS.ACCENT_SKY
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      popupBg.destroy();
      title.destroy();
      condition.destroy();
      closeBtn.destroy();
    });
    this.add(closeBtn);
  }

  /**
   * 刷新列表
   */
  refresh(): void {
    // 重新创建列表
    this.createCaseList();
    this.exposeToGlobal();
  }

  /**
   * 暴露到全局（供测试访问）
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      const stats = this.caseManager.getStatistics();
      (window as any).__CASES_LIST_UI__ = {
        totalCases: stats.total,
        completedCases: stats.completed,
        lockedCases: stats.locked,
        inProgressCases: stats.in_progress,
        averageScore: stats.average_score,
        visible: this.visible
      };
    }
  }

  /**
   * 获取状态
   */
  getStatus(): { totalCases: number; completedCases: number; lockedCases: number } {
    const stats = this.caseManager.getStatistics();
    return {
      totalCases: stats.total,
      completedCases: stats.completed,
      lockedCases: stats.locked
    };
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__CASES_LIST_UI__ = null;
    }
    super.destroy();
  }
}