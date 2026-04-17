// src/ui/ExperienceUI.ts
/**
 * 经验值显示UI组件
 *
 * 功能:
 * - 经验值进度显示 (progress bar)
 * - 解锁内容提示 (unlock notification)
 * - 经验值获取动画 (experience gain animation)
 * - 经验值类型分类显示
 *
 * Phase 2 S12.4 实现
 */

import Phaser from 'phaser';
import { ExperienceManager, ExperienceEvent } from '../systems/ExperienceManager';
import { EventBus, EventData } from '../systems/EventBus';
import { UI_COLORS } from '../data/ui-color-theme';
import {
  EXPERIENCE_TYPES,
  EXPERIENCE_PARAMS,
  getExperienceTypeConfig,
  getUnlockContentConfig,
  type ExperienceType,
  type UnlockContent
} from '../data/experience-data';

// 经验值UI配置
export interface ExperienceUIConfig {
  scene: Phaser.Scene;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  showTypeBreakdown?: boolean;  // 是否显示各类型经验值
  onClose?: () => void;
}

// 解锁通知状态
interface UnlockNotification {
  container: Phaser.GameObjects.Container;
  contentId: UnlockContent;
  contentName: string;
  timestamp: number;
}

/**
 * 经验值显示UI类
 */
export class ExperienceUI {
  private scene: Phaser.Scene;
  private experienceManager: ExperienceManager;
  private eventBus: EventBus;

  private container!: Phaser.GameObjects.Container;
  private background!: Phaser.GameObjects.Rectangle;

  // 进度条元素
  private progressContainer!: Phaser.GameObjects.Container;
  private progressBarBg!: Phaser.GameObjects.Rectangle;
  private progressBarFill!: Phaser.GameObjects.Rectangle;
  private progressText!: Phaser.GameObjects.Text;
  private totalExpText!: Phaser.GameObjects.Text;

  // 类型分布元素
  private typeBreakdownContainer!: Phaser.GameObjects.Container;
  private typeBars: Map<ExperienceType, Phaser.GameObjects.Rectangle> = new Map();

  // 解锁通知
  private notificationContainer!: Phaser.GameObjects.Container;
  private activeNotifications: UnlockNotification[] = [];

  // 经验值获取动画
  private gainAnimationContainer!: Phaser.GameObjects.Container;
  private gainText!: Phaser.GameObjects.Text;

  // 位置和尺寸
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private showTypeBreakdown: boolean;

  private onClose?: () => void;
  private isVisible: boolean = true;

  // 事件监听器引用（用于清理）
  private experienceAddedListener: (data: EventData) => void;
  private contentUnlockedListener: (data: EventData) => void;
  private experienceCappedListener: (data: EventData) => void;

  // 样式配置
  private readonly styles = {
    background: { fillColor: UI_COLORS.PANEL_PRIMARY, alpha: 0.85 },
    progressBar: {
      bgColor: UI_COLORS.PANEL_LIGHT,
      fillColor: UI_COLORS.BUTTON_PRIMARY,
      width: 300,
      height: 20,
      borderRadius: 5
    },
    text: {
      title: { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' },
      progress: { fontSize: '14px', color: '#ffffff' },
      total: { fontSize: '12px', color: '#aaaaaa' },
      gain: { fontSize: '24px', color: '#4a9c59', fontStyle: 'bold' },
      notification: { fontSize: '16px', color: '#ffffff' }
    },
    notification: {
      bgColor: 0x3a7a4a,
      borderColor: 0x5a9a6a,
      duration: 3000  // 通知显示时间（毫秒）
    },
    typeBar: {
      height: 8,
      spacing: 4
    }
  };

  constructor(config: ExperienceUIConfig) {
    this.scene = config.scene;
    this.experienceManager = ExperienceManager.getInstance();
    this.eventBus = EventBus.getInstance();

    this.x = config.x ?? 50;
    this.y = config.y ?? 50;
    this.width = config.width ?? 400;
    this.height = config.height ?? 250;
    this.showTypeBreakdown = config.showTypeBreakdown ?? true;

    this.onClose = config.onClose;

    // 创建监听器函数引用
    this.experienceAddedListener = (data: EventData) => {
      this.handleExperienceAdded(data);
    };
    this.contentUnlockedListener = (data: EventData) => {
      this.handleContentUnlocked(data);
    };
    this.experienceCappedListener = (_data: EventData) => {
      this.showCappedMessage();
    };

    this.createUI();
    this.updateFromManager();
    this.registerEvents();
    this.exposeToWindow();
  }

  /**
   * 创建UI元素
   */
  private createUI(): void {
    // 主容器
    this.container = this.scene.add.container(this.x, this.y);
    this.container.setDepth(1000);
    this.container.setScrollFactor(0);

    // 背景
    this.background = this.scene.add.rectangle(
      this.width / 2,
      this.height / 2,
      this.width,
      this.height,
      this.styles.background.fillColor,
      this.styles.background.alpha
    );
    this.container.add(this.background);

    // 标题
    const titleText = this.scene.add.text(
      this.width / 2,
      20,
      '经验值',
      this.styles.text.title
    ).setOrigin(0.5);
    this.container.add(titleText);

    // 进度条容器
    this.progressContainer = this.scene.add.container(20, 50);
    this.container.add(this.progressContainer);
    this.createProgressBar();

    // 类型分布容器
    this.typeBreakdownContainer = this.scene.add.container(20, 90);
    this.container.add(this.typeBreakdownContainer);
    if (this.showTypeBreakdown) {
      this.createTypeBreakdown();
    }

    // 解锁通知容器
    this.notificationContainer = this.scene.add.container(0, this.height - 80);
    this.container.add(this.notificationContainer);

    // 经验值获取动画容器
    this.gainAnimationContainer = this.scene.add.container(this.width / 2, 60);
    this.container.add(this.gainAnimationContainer);
    this.createGainAnimation();
  }

  /**
   * 创建进度条
   */
  private createProgressBar(): void {
    const barWidth = this.styles.progressBar.width;
    const barHeight = this.styles.progressBar.height;

    // 进度条背景
    this.progressBarBg = this.scene.add.rectangle(
      barWidth / 2,
      barHeight / 2,
      barWidth,
      barHeight,
      this.styles.progressBar.bgColor
    );
    this.progressBarBg.setStrokeStyle(2, 0x4a4a6a);
    this.progressContainer.add(this.progressBarBg);

    // 进度条填充
    this.progressBarFill = this.scene.add.rectangle(
      0,
      barHeight / 2,
      0,  // 初始宽度为0
      barHeight - 4,
      this.styles.progressBar.fillColor
    );
    this.progressBarFill.setOrigin(0, 0.5);
    this.progressBarFill.setX(2);
    this.progressContainer.add(this.progressBarFill);

    // 进度百分比文本
    this.progressText = this.scene.add.text(
      barWidth / 2,
      barHeight / 2,
      '0%',
      this.styles.text.progress
    ).setOrigin(0.5);
    this.progressContainer.add(this.progressText);

    // 总经验值文本
    this.totalExpText = this.scene.add.text(
      barWidth + 10,
      barHeight / 2,
      `0 / ${EXPERIENCE_PARAMS.max_total_experience}`,
      this.styles.text.total
    ).setOrigin(0, 0.5);
    this.progressContainer.add(this.totalExpText);
  }

  /**
   * 创建类型分布条
   */
  private createTypeBreakdown(): void {
    const barWidth = this.styles.progressBar.width;
    const barHeight = this.styles.typeBar.height;
    const spacing = this.styles.typeBar.spacing;

    let yOffset = 0;

    EXPERIENCE_TYPES.forEach((typeConfig) => {
      // 类型名称
      const typeLabel = this.scene.add.text(
        0,
        yOffset,
        typeConfig.name,
        { fontSize: '12px', color: typeConfig.color }
      );
      this.typeBreakdownContainer.add(typeLabel);

      // 类型进度条背景
      const typeBarBg = this.scene.add.rectangle(
        60,
        yOffset + barHeight / 2 + 6,
        barWidth - 60,
        barHeight,
        UI_COLORS.PANEL_LIGHT
      );
      this.typeBreakdownContainer.add(typeBarBg);

      // 类型进度条填充
      const typeBarFill = this.scene.add.rectangle(
        60,
        yOffset + barHeight / 2 + 6,
        0,
        barHeight - 2,
        Phaser.Display.Color.HexStringToColor(typeConfig.color).color
      );
      typeBarFill.setOrigin(0, 0.5);
      this.typeBreakdownContainer.add(typeBarFill);

      this.typeBars.set(typeConfig.id, typeBarFill);

      yOffset += barHeight + spacing + 16;
    });
  }

  /**
   * 创建经验值获取动画元素
   */
  private createGainAnimation(): void {
    this.gainText = this.scene.add.text(
      0,
      0,
      '',
      this.styles.text.gain
    ).setOrigin(0.5);
    this.gainText.setVisible(false);
    this.gainAnimationContainer.add(this.gainText);
  }

  /**
   * 从ExperienceManager更新显示
   */
  private updateFromManager(): void {
    const state = this.experienceManager.getState();
    const progress = this.experienceManager.getExperienceProgress();

    // 更新进度条
    this.updateProgressBar(state.total_experience, progress);

    // 更新类型分布
    if (this.showTypeBreakdown) {
      this.updateTypeBreakdown(state.experience_by_type);
    }
  }

  /**
   * 更新进度条显示
   */
  private updateProgressBar(total: number, progress: number): void {
    const barWidth = this.styles.progressBar.width;
    const fillWidth = Math.floor((barWidth - 4) * progress);

    this.progressBarFill.setSize(fillWidth, this.styles.progressBar.height - 4);
    this.progressText.setText(`${Math.floor(progress * 100)}%`);
    this.totalExpText.setText(`${total} / ${EXPERIENCE_PARAMS.max_total_experience}`);
  }

  /**
   * 更新类型分布显示
   */
  private updateTypeBreakdown(experienceByType: Record<ExperienceType, number>): void {
    const barWidth = this.styles.progressBar.width - 60;
    const maxTotal = EXPERIENCE_PARAMS.max_total_experience;

    EXPERIENCE_TYPES.forEach((typeConfig) => {
      const bar = this.typeBars.get(typeConfig.id);
      if (bar) {
        const typeValue = experienceByType[typeConfig.id] || 0;
        const typeProgress = Math.min(typeValue / maxTotal, 1);
        const fillWidth = Math.floor(barWidth * typeProgress);
        bar.setSize(fillWidth, this.styles.typeBar.height - 2);
      }
    });
  }

  /**
   * 处理经验值添加事件
   */
  private handleExperienceAdded(data: EventData): void {
    const value = data.value as number;
    const total = data.total as number;
    const type = data.type as ExperienceType;

    // 显示获取动画
    this.showGainAnimation(value, type);

    // 更新进度条（带动画）
    this.animateProgressUpdate(total);

    // 更新类型分布
    if (this.showTypeBreakdown) {
      const state = this.experienceManager.getState();
      this.updateTypeBreakdown(state.experience_by_type);
    }
  }

  /**
   * 显示经验值获取动画
   */
  private showGainAnimation(value: number, type: ExperienceType): void {
    const typeConfig = getExperienceTypeConfig(type);
    const color = typeConfig?.color || '#4a9c59';

    this.gainText.setText(`+${value}`);
    this.gainText.setColor(color);
    this.gainText.setVisible(true);
    this.gainText.setAlpha(1);
    this.gainText.setScale(0.5);

    // 动画：放大、上移、渐隐
    this.scene.tweens.add({
      targets: this.gainText,
      scale: 1.2,
      y: -20,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        this.gainText.setVisible(false);
        this.gainText.setY(0);
        this.gainText.setAlpha(1);
        this.gainText.setScale(1);
      }
    });
  }

  /**
   * 动画更新进度条
   */
  private animateProgressUpdate(newTotal: number): void {
    const progress = newTotal / EXPERIENCE_PARAMS.max_total_experience;
    const barWidth = this.styles.progressBar.width;
    const targetFillWidth = Math.floor((barWidth - 4) * progress);

    // 使用tween动画
    this.scene.tweens.add({
      targets: this.progressBarFill,
      width: targetFillWidth,
      duration: 500,
      ease: 'Power2',
      onUpdate: () => {
        const currentWidth = this.progressBarFill.width;
        const currentProgress = currentWidth / (barWidth - 4);
        this.progressText.setText(`${Math.floor(currentProgress * 100)}%`);
      },
      onComplete: () => {
        this.totalExpText.setText(`${newTotal} / ${EXPERIENCE_PARAMS.max_total_experience}`);
      }
    });
  }

  /**
   * 处理内容解锁事件
   */
  private handleContentUnlocked(data: EventData): void {
    const contentId = data.content_id as UnlockContent;
    const contentName = data.content_name as string;

    this.showUnlockNotification(contentId, contentName);
  }

  /**
   * 显示解锁通知
   */
  private showUnlockNotification(contentId: UnlockContent, contentName: string): void {
    const config = getUnlockContentConfig(contentId);

    // 创建通知容器
    const notification = this.scene.add.container(
      this.width / 2,
      this.activeNotifications.length * 60
    );

    // 通知背景
    const bgWidth = 350;
    const bgHeight = 50;
    const bg = this.scene.add.rectangle(
      0,
      0,
      bgWidth,
      bgHeight,
      this.styles.notification.bgColor,
      0.9
    );
    bg.setStrokeStyle(2, this.styles.notification.borderColor);
    notification.add(bg);

    // 解锁图标（使用文字代替）
    const icon = this.scene.add.text(
      -bgWidth / 2 + 20,
      0,
      '🔓',
      { fontSize: '20px' }
    ).setOrigin(0.5);
    notification.add(icon);

    // 解锁文本
    const text = this.scene.add.text(
      0,
      -10,
      '解锁新内容!',
      { fontSize: '14px', color: '#ffcc00', fontStyle: 'bold' }
    ).setOrigin(0.5);
    notification.add(text);

    // 内容名称
    const nameText = this.scene.add.text(
      0,
      12,
      contentName,
      this.styles.text.notification
    ).setOrigin(0.5);
    notification.add(nameText);

    // 类型标签
    if (config) {
      const typeLabel = this.scene.add.text(
        bgWidth / 2 - 20,
        0,
        this.formatUnlockType(config.unlock_type),
        { fontSize: '12px', color: '#aaaaaa' }
      ).setOrigin(0.5, 0.5);
      notification.add(typeLabel);
    }

    this.notificationContainer.add(notification);

    // 记录通知
    const notificationData: UnlockNotification = {
      container: notification,
      contentId,
      contentName,
      timestamp: Date.now()
    };
    this.activeNotifications.push(notificationData);

    // 动画：淡入
    notification.setAlpha(0);
    this.scene.tweens.add({
      targets: notification,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });

    // 自动消失
    this.scene.time.delayedCall(this.styles.notification.duration, () => {
      this.removeNotification(notificationData);
    });
  }

  /**
   * 移除通知
   */
  private removeNotification(notification: UnlockNotification): void {
    // 动画淡出
    this.scene.tweens.add({
      targets: notification.container,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        notification.container.destroy();
        this.activeNotifications = this.activeNotifications.filter(n => n !== notification);
        // 重新排列剩余通知
        this.rearrangeNotifications();
      }
    });
  }

  /**
   * 重新排列通知位置
   */
  private rearrangeNotifications(): void {
    this.activeNotifications.forEach((notification, index) => {
      this.scene.tweens.add({
        targets: notification.container,
        y: index * 60,
        duration: 200,
        ease: 'Power2'
      });
    });
  }

  /**
   * 显示经验值上限提示
   */
  private showCappedMessage(): void {
    const cappedText = this.scene.add.text(
      this.width / 2,
      40,
      '已达到经验值上限!',
      { fontSize: '14px', color: '#ff9900', fontStyle: 'bold' }
    ).setOrigin(0.5);
    this.container.add(cappedText);

    // 2秒后消失
    this.scene.time.delayedCall(2000, () => {
      cappedText.destroy();
    });
  }

  /**
   * 格式化解锁类型
   */
  private formatUnlockType(type: string): string {
    const typeNames: Record<string, string> = {
      'feature': '功能',
      'area': '区域',
      'npc': '导师',
      'knowledge': '知识'
    };
    return typeNames[type] ?? type;
  }

  /**
   * 注册事件
   */
  private registerEvents(): void {
    this.eventBus.on(ExperienceEvent.EXPERIENCE_ADDED, this.experienceAddedListener);
    this.eventBus.on(ExperienceEvent.CONTENT_UNLOCKED, this.contentUnlockedListener);
    this.eventBus.on(ExperienceEvent.EXPERIENCE_CAPPED, this.experienceCappedListener);
  }

  /**
   * 取消事件注册
   */
  private unregisterEvents(): void {
    this.eventBus.off(ExperienceEvent.EXPERIENCE_ADDED, this.experienceAddedListener);
    this.eventBus.off(ExperienceEvent.CONTENT_UNLOCKED, this.contentUnlockedListener);
    this.eventBus.off(ExperienceEvent.EXPERIENCE_CAPPED, this.experienceCappedListener);
  }

  /**
   * 显示UI
   */
  show(): void {
    // 经验值UI显示
    if (typeof window !== 'undefined') {
      (window as any).__EXPERIENCE_UI_VISIBLE__ = true;
    }
    this.container.setVisible(true);
    this.isVisible = true;
    this.updateFromManager();
  }

  /**
   * 隐藏UI
   */
  hide(): void {
    // 经验值UI隐藏
    if (typeof window !== 'undefined') {
      (window as any).__EXPERIENCE_UI_VISIBLE__ = false;
    }
    this.container.setVisible(false);
    this.isVisible = false;

    if (this.onClose) {
      this.onClose();
    }
  }

  /**
   * 切换显示/隐藏
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 检查是否可见
   */
  isShowing(): boolean {
    return this.isVisible;
  }

  /**
   * 设置类型分布显示
   */
  setShowTypeBreakdown(show: boolean): void {
    this.showTypeBreakdown = show;
    this.typeBreakdownContainer.setVisible(show);
  }

  /**
   * 刷新显示（外部调用）
   */
  refresh(): void {
    if (this.isVisible) {
      this.updateFromManager();
    }
  }

  /**
   * 清除所有通知
   */
  clearNotifications(): void {
    this.activeNotifications.forEach(notification => {
      notification.container.destroy();
    });
    this.activeNotifications = [];
  }

  /**
   * 暴露到全局（供测试访问）
   */
  private exposeToWindow(): void {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__EXPERIENCE_UI__ = {
        show: this.show.bind(this),
        hide: this.hide.bind(this),
        toggle: this.toggle.bind(this),
        isShowing: this.isShowing.bind(this),
        refresh: this.refresh.bind(this),
        clearNotifications: this.clearNotifications.bind(this),
        setShowTypeBreakdown: this.setShowTypeBreakdown.bind(this),
        updateFromManager: this.updateFromManager.bind(this),
        showGainAnimation: this.showGainAnimation.bind(this),
        showUnlockNotification: this.showUnlockNotification.bind(this),
        getState: () => ({
          isVisible: this.isVisible,
          showTypeBreakdown: this.showTypeBreakdown,
          notificationCount: this.activeNotifications.length
        })
      };
    }
  }

  /**
   * 销毁UI
   */
  destroy(): void {
    // 取消事件监听
    this.unregisterEvents();

    // 清除通知
    this.clearNotifications();

    // 清除全局引用
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__EXPERIENCE_UI__ = undefined;
    }

    // 销毁容器
    this.container.destroy();

    // 清空引用
    this.typeBars.clear();

    if (this.onClose) {
      this.onClose();
    }
  }
}

/**
 * 创建经验值UI的工厂函数
 */
export function createExperienceUI(scene: Phaser.Scene, onClose?: () => void): ExperienceUI {
  return new ExperienceUI({
    scene,
    onClose
  });
}

/**
 * 创建嵌入式经验值显示（用于HUD）
 */
export function createEmbeddedExperienceUI(config: ExperienceUIConfig): ExperienceUI {
  return new ExperienceUI({
    ...config,
    showTypeBreakdown: config.showTypeBreakdown ?? false
  });
}