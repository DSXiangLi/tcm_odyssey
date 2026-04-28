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
 * Phase 2.5 UI统一化: 继承ModalUI基类
 */

import Phaser from 'phaser';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
import { CaseManager, CaseState, CaseStatus } from '../systems/CaseManager';
import ModalUI from './base/ModalUI';

export interface CasesListUIConfig {
  caseManager: CaseManager;
  onCaseSelect?: (caseId: string) => void;
  onCaseDetail?: (caseId: string) => void;
  onClose?: () => void;
}

/**
 * 病案列表UI组件
 * Phase 2.5 UI统一化: 继承ModalUI，使用标准弹窗尺寸
 */
export class CasesListUI extends ModalUI {
  private caseManager: CaseManager;
  private titleText!: Phaser.GameObjects.Text;
  private caseItems: Phaser.GameObjects.Container[] = [];
  private config: CasesListUIConfig;
  private scrollOffset: number = 0;
  private maxVisibleItems: number = 6;

  constructor(scene: Phaser.Scene, config: CasesListUIConfig) {
    // 先调用super()，使用空回调（稍后会在onExit中设置）
    // 注意：不能在super()参数中使用this，因为此时this还未创建
    super(
      scene,
      'INQUIRY_MODAL',
      '[关闭]',
      () => {
        // 占位回调，会在super()返回后重新设置
      },
      100
    );

    // super()完成后，this已创建，可以安全设置属性
    this.config = config;
    this.caseManager = config.caseManager;

    // 重新设置onExit回调，此时可以安全使用this
    this.onExit = () => {
      console.log('[CasesListUI] Close button clicked');
      if (config.onClose) config.onClose();
      this.destroy();
    };

    try {
      // 创建标题
      this.titleText = scene.add.text(0, -200, '病案记录', {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      this.titleText.setOrigin(0.5);
      this.container.add(this.titleText);

      // 创建统计信息
      this.createStatisticsText();

      // 创建病案列表
      this.createCaseList();

      // 设置深度
      this.container.setDepth(this.depth);

      // 暴露到全局供测试访问
      this.exposeToGlobalCustom();

      console.log('[CasesListUI] Constructor completed successfully');
    } catch (error) {
      console.error('[CasesListUI] Constructor error:', error);
      // 即使出错也要暴露状态，方便调试
      this.exposeErrorState(error);
    }
  }

  /**
   * 暴露错误状态（用于调试）
   */
  private exposeErrorState(error: any): void {
    if (typeof window !== 'undefined') {
      (window as any).__CASES_LIST_UI__ = {
        error: error?.message || 'Unknown error',
        visible: false
      };
    }
  }

  /**
   * 创建统计信息文字
   */
  private createStatisticsText(): void {
    const stats = this.caseManager.getStatistics();
    const statsText = this.scene.add.text(0, -160,
      `总计: ${stats.total} | 完成: ${stats.completed} | 平均分: ${stats.average_score}`,
      {
        fontSize: '14px',
        color: '#b0a090'  // TEXT_SECONDARY
      }
    );
    statsText.setOrigin(0.5);
    this.container.add(statsText);
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
      const itemY = -100 + i * 70;

      // 只显示可见范围内的项目
      if (i >= this.scrollOffset && i < this.scrollOffset + this.maxVisibleItems) {
        const item = this.createCaseItem(caseState, 0, itemY);
        this.caseItems.push(item);
        this.container.add(item);
      }
    }

    // 创建滚动提示（如果项目过多）
    if (cases.length > this.maxVisibleItems) {
      const scrollHint = this.scene.add.text(0, 190,
        `[滚动查看更多]`,
        {
          fontSize: '12px',
          color: '#b0a090'  // TEXT_SECONDARY (次级灰)
        }
      );
      scrollHint.setOrigin(0.5);
      this.container.add(scrollHint);
    }

    // Phase 2.5: 添加诊断练习按钮
    this.createDiagnosisPracticeButton();
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
    const itemBg = this.scene.add.rectangle(0, 0, 600, 60, statusInfo.bgColor, 0.85);
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
      case 'easy': return '#90c070';  // SOFT_GREEN
      case 'normal': return '#c0c080';  // SOFT_YELLOW
      case 'hard': return '#c07070';  // SOFT_RED
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
        buttonColor = '#90c070';  // SOFT_GREEN
        isInteractive = true;
        break;
      case 'in_progress':
        buttonText = '[继续诊治]';
        buttonColor = '#c0c080';  // SOFT_YELLOW
        isInteractive = true;
        break;
      case 'unlocked':
        buttonText = '[开始诊治]';
        buttonColor = '#90c070';  // SOFT_GREEN
        isInteractive = true;
        break;
      case 'locked':
        buttonText = '[查看解锁条件]';
        buttonColor = '#a08060';  // SOFT_BROWN
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
      backgroundColor: '#404040',  // BUTTON_DISABLED
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
    const popupBg = this.scene.add.rectangle(0, 0, 400, 100, UI_COLORS.PANEL_LIGHT, 0.85);
    popupBg.setOrigin(0.5);
    this.container.add(popupBg);

    const title = this.scene.add.text(0, -30, '解锁条件', {
      fontSize: '18px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    this.container.add(title);

    const condition = this.scene.add.text(0, 10, unlockCondition, {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY,
      wordWrap: { width: 350 }
    });
    condition.setOrigin(0.5);
    this.container.add(condition);

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
    this.container.add(closeBtn);
  }

  /**
   * Phase 2.5: 创建诊断练习按钮
   * 提供入口进入新的诊断游戏（HTML直接迁移版本）
   */
  private createDiagnosisPracticeButton(): void {
    const buttonY = 220;  // 位于滚动提示下方

    const buttonBg = this.scene.add.rectangle(0, buttonY, 200, 30, UI_COLORS.PANEL_LIGHT, 0.85);
    buttonBg.setOrigin(0.5);
    buttonBg.setInteractive({ useHandCursor: true });
    this.container.add(buttonBg);

    const button = this.scene.add.text(0, buttonY, '【诊断练习】', {
      fontSize: '14px',
      color: '#80c0a0',  // 青绿色
      fontStyle: 'bold'
    });
    button.setOrigin(0.5);
    button.setInteractive({ useHandCursor: true });
    this.container.add(button);

    // 点击事件 - 发送 diagnosis:start 事件
    const handleClick = () => {
      console.log('[CasesListUI] Diagnosis practice button clicked');
      // 发送 CustomEvent，ClinicScene 会监听并切换场景
      window.dispatchEvent(new CustomEvent('diagnosis:start', {
        detail: { caseId: 'case-001' }
      }));
      // 关闭病案列表
      this.destroy();
    };

    buttonBg.on('pointerdown', handleClick);
    button.on('pointerdown', handleClick);

    // 鼠标悬停效果
    buttonBg.on('pointerover', () => {
      buttonBg.setFillStyle(UI_COLORS.ACCENT_SKY, 0.9);
    });
    buttonBg.on('pointerout', () => {
      buttonBg.setFillStyle(UI_COLORS.PANEL_LIGHT, 0.85);
    });
  }

  /**
   * 刷新列表
   */
  refresh(): void {
    // 重新创建列表
    this.createCaseList();
    this.exposeToGlobalCustom();
  }

  /**
   * 暴露到全局（供测试访问）- 自定义名称
   */
  private exposeToGlobalCustom(): void {
    if (typeof window !== 'undefined') {
      const stats = this.caseManager.getStatistics();
      (window as any).__CASES_LIST_UI__ = {
        totalCases: stats.total,
        completedCases: stats.completed,
        lockedCases: stats.locked,
        inProgressCases: stats.in_progress,
        averageScore: stats.average_score,
        visible: this.container.visible
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
    // 清理case items
    for (const item of this.caseItems) {
      item.destroy();
    }
    this.caseItems = [];
    // 调用父类销毁方法
    super.destroy();
  }
}