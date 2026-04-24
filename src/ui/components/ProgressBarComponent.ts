// src/ui/components/ProgressBarComponent.ts
/**
 * ProgressBarComponent进度条组件
 *
 * 用于煎药/炮制/种植小游戏的进度显示
 *
 * 视觉规范:
 * - 高度: 20px (默认)
 * - 边框风格: 方案8(内凹槽位)
 * - 进度填充: 渐变色（低值红色→中值黄色→高值绿色）
 * - 文本显示: 百分比或时间格式
 *
 * 状态管理:
 * - EMPTY → FILLING → COMPLETE
 * - 支持 ERROR 状态
 *
 * Phase 2.5 UI组件系统统一化 Task 1
 */

import Phaser from 'phaser';
import { drawInsetSlotBorder } from '../base/UIBorderStyles';
import { UI_COLORS, UI_COLOR_STRINGS } from '../../data/ui-color-theme';

/**
 * 进度条状态枚举
 */
export type ProgressBarState = 'empty' | 'filling' | 'complete' | 'error';

/**
 * 进度条渐变颜色配置
 */
export interface ProgressBarGradientColors {
  /** 低值颜色（红色系，进度<33%） */
  low: number;
  /** 中值颜色（黄色系，进度33%-66%） */
  mid: number;
  /** 高值颜色（绿色系，进度>66%） */
  high: number;
}

/**
 * 进度条配置接口
 */
export interface ProgressBarConfig {
  /** 进度条宽度 */
  width: number;
  /** 进度条高度（默认20px） */
  height?: number;
  /** 最大值（100或时间秒数） */
  maxValue: number;
  /** 当前值 */
  currentValue?: number;
  /** 显示百分比 */
  showPercentage?: boolean;
  /** 显示时间（格式为 MM:SS） */
  showTime?: boolean;
  /** 渐变颜色配置 */
  gradientColors?: ProgressBarGradientColors;
  /** 完成回调 */
  onComplete?: () => void;
}

/**
 * 默认渐变颜色配置
 * 使用柔和色系，符合田园风格
 */
export const DEFAULT_GRADIENT_COLORS: ProgressBarGradientColors = {
  low: UI_COLORS.SOFT_RED,      // 0xc07070 - 柔和红色
  mid: UI_COLORS.SOFT_YELLOW,   // 0xc0c080 - 柔和黄色
  high: UI_COLORS.SOFT_GREEN,   // 0x90c070 - 柔和绿色
};

/**
 * ProgressBarComponent进度条组件类
 *
 * 使用方式:
 * ```typescript
 * // 煎药进度条（显示时间）
 * const decoctionBar = new ProgressBarComponent(scene, {
 *   width: 300,
 *   maxValue: 300,  // 5分钟 = 300秒
 *   showTime: true
 * });
 * decoctionBar.setProgress(120); // 2分钟已过
 *
 * // 种植进度条（显示百分比）
 * const plantingBar = new ProgressBarComponent(scene, {
 *   width: 200,
 *   maxValue: 100,
 *   showPercentage: true
 * });
 * plantingBar.setProgress(65); // 65%
 * ```
 */
export default class ProgressBarComponent {
  /** Phaser场景引用 */
  protected scene: Phaser.Scene;

  /** 容器对象 */
  public container: Phaser.GameObjects.Container;

  /** 组件宽度 */
  public width: number;

  /** 组件高度 */
  public height: number;

  /** 最大值 */
  public maxValue: number;

  /** 当前值 */
  public currentValue: number;

  /** 当前状态 */
  public state: ProgressBarState;

  /** Graphics对象（用于绘制背景和进度） */
  protected graphics: Phaser.GameObjects.Graphics | null = null;

  /** 进度填充Graphics */
  protected fillGraphics: Phaser.GameObjects.Graphics | null = null;

  /** 文本显示 */
  protected textDisplay: Phaser.GameObjects.Text | null = null;

  /** 配置 */
  protected config: ProgressBarConfig;

  /** 渐变颜色 */
  protected gradientColors: ProgressBarGradientColors;

  /** 标准高度常量 */
  public static readonly DEFAULT_HEIGHT = 20;

  /** 内边距（边框宽度） */
  public static readonly BORDER_PADDING = 2;

  /**
   * 构造函数
   * @param scene Phaser场景
   * @param config 配置选项
   * @param x 位置X，默认0
   * @param y 位置Y，默认0
   */
  constructor(
    scene: Phaser.Scene,
    config: ProgressBarConfig,
    x: number = 0,
    y: number = 0
  ) {
    this.scene = scene;
    this.config = config;
    this.width = config.width;
    this.height = config.height ?? ProgressBarComponent.DEFAULT_HEIGHT;
    this.maxValue = config.maxValue;
    this.currentValue = config.currentValue ?? 0;
    this.gradientColors = config.gradientColors ?? DEFAULT_GRADIENT_COLORS;

    // 初始化状态
    if (this.currentValue === 0) {
      this.state = 'empty';
    } else if (this.currentValue >= this.maxValue) {
      this.state = 'complete';
    } else {
      this.state = 'filling';
    }

    // 创建容器
    this.container = scene.add.container(x, y);

    // 创建Graphics（背景）
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    // 创建进度填充Graphics
    this.fillGraphics = scene.add.graphics();
    this.container.add(this.fillGraphics);

    // 创建文本显示
    this.createTextDisplay();

    // 绘制初始状态
    this.draw();

    // 添加到场景
    scene.add.existing(this.container);
  }

  /**
   * 创建文本显示
   */
  protected createTextDisplay(): void {
    // 文本位置：进度条右侧外部
    const textX = this.width / 2 + 10;
    const textY = 0;

    this.textDisplay = this.scene.add.text(textX, textY, '', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
    });
    this.textDisplay.setOrigin(0, 0.5);
    this.container.add(this.textDisplay);

    this.updateText();
  }

  /**
   * 更新文本显示
   */
  protected updateText(): void {
    if (!this.textDisplay) return;

    // 根据配置决定显示格式
    if (this.config.showTime) {
      // 时间格式：MM:SS
      const seconds = Math.floor(this.currentValue);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      const formattedTime = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
      this.textDisplay.setText(formattedTime);
    } else if (this.config.showPercentage) {
      // 百分比格式：XX%
      const percentage = Math.round((this.currentValue / this.maxValue) * 100);
      this.textDisplay.setText(`${percentage}%`);
    } else {
      // 默认：数值格式
      this.textDisplay.setText(`${this.currentValue}/${this.maxValue}`);
    }
  }

  /**
   * 绘制进度条
   */
  protected draw(): void {
    this.drawBackground();
    this.drawProgressFill();
  }

  /**
   * 绘制背景槽位（内凹效果）
   */
  protected drawBackground(): void {
    if (!this.graphics) return;

    this.graphics.clear();

    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    const x = -halfWidth;
    const y = -halfHeight;

    // 使用方案8：内凹槽位边框
    drawInsetSlotBorder(this.graphics, x, y, this.width, this.height);
  }

  /**
   * 绘制进度填充
   */
  protected drawProgressFill(): void {
    if (!this.fillGraphics) return;

    this.fillGraphics.clear();

    // 计算填充区域（考虑边框内边距）
    const padding = ProgressBarComponent.BORDER_PADDING;
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    const fillAreaWidth = this.width - padding * 2;
    const fillAreaHeight = this.height - padding * 2;
    const fillAreaX = -halfWidth + padding;
    const fillAreaY = -halfHeight + padding;

    // 计算进度比例
    const progressRatio = Math.min(this.currentValue / this.maxValue, 1);
    const fillWidth = fillAreaWidth * progressRatio;

    if (fillWidth <= 0) return; // 空状态不绘制填充

    // 根据进度比例选择颜色（三段渐变）
    const fillColor = this.getGradientColor(progressRatio);

    // 绘制填充矩形
    this.fillGraphics.fillStyle(fillColor, 0.9);
    this.fillGraphics.fillRect(fillAreaX, fillAreaY, fillWidth, fillAreaHeight);

    // 添加微妙的渐变效果（顶部稍亮）
    this.fillGraphics.fillStyle(fillColor, 0.3);
    this.fillGraphics.fillRect(fillAreaX, fillAreaY, fillWidth, 2);
  }

  /**
   * 根据进度比例获取渐变颜色
   * @param ratio 进度比例 (0-1)
   * @returns 颜色值
   */
  protected getGradientColor(ratio: number): number {
    // 三段色阶：0-33%红色, 33-66%黄色, 66-100%绿色
    if (ratio < 0.33) {
      return this.gradientColors.low;
    } else if (ratio < 0.66) {
      return this.gradientColors.mid;
    } else {
      return this.gradientColors.high;
    }
  }

  /**
   * 设置进度值
   * @param value 新进度值
   */
  public setProgress(value: number): void {
    // 确保值在有效范围内
    this.currentValue = Math.max(0, Math.min(value, this.maxValue));

    // 更新状态
    if (this.currentValue === 0) {
      this.state = 'empty';
    } else if (this.currentValue >= this.maxValue) {
      this.state = 'complete';
      // 触发完成回调
      if (this.config.onComplete) {
        this.config.onComplete();
      }
    } else {
      this.state = 'filling';
    }

    // 重绘
    this.draw();
    this.updateText();
  }

  /**
   * 增加进度
   * @param amount 增加量
   */
  public increase(amount: number): void {
    this.setProgress(this.currentValue + amount);
  }

  /**
   * 减少进度
   * @param amount 减少量
   */
  public decrease(amount: number): void {
    this.setProgress(this.currentValue - amount);
  }

  /**
   * 重置进度
   */
  public reset(): void {
    this.currentValue = 0;
    this.state = 'empty';
    this.draw();
    this.updateText();
  }

  /**
   * 设置错误状态
   */
  public setError(): void {
    this.state = 'error';
    // 错误状态使用红色填充
    if (this.fillGraphics) {
      this.fillGraphics.clear();
      const padding = ProgressBarComponent.BORDER_PADDING;
      const halfWidth = this.width / 2;
      const halfHeight = this.height / 2;
      const fillAreaX = -halfWidth + padding;
      const fillAreaY = -halfHeight + padding;
      const fillWidth = this.width - padding * 2;
      const fillHeight = this.height - padding * 2;
      this.fillGraphics.fillStyle(UI_COLORS.STATUS_ERROR, 0.9);
      this.fillGraphics.fillRect(fillAreaX, fillAreaY, fillWidth, fillHeight);
    }
    if (this.textDisplay) {
      this.textDisplay.setText('ERROR');
      this.textDisplay.setColor(UI_COLOR_STRINGS.STATUS_ERROR);
    }
  }

  /**
   * 获取进度比例
   * @returns 进度比例 (0-1)
   */
  public getProgressRatio(): number {
    return this.currentValue / this.maxValue;
  }

  /**
   * 获取当前颜色
   * @returns 当前进度对应的颜色值
   */
  public getCurrentColor(): number {
    return this.getGradientColor(this.getProgressRatio());
  }

  /**
   * 是否已完成
   */
  public isComplete(): boolean {
    return this.state === 'complete';
  }

  /**
   * 是否为空
   */
  public isEmpty(): boolean {
    return this.state === 'empty';
  }

  /**
   * 是否正在填充
   */
  public isFilling(): boolean {
    return this.state === 'filling';
  }

  /**
   * 是否错误状态
   */
  public isError(): boolean {
    return this.state === 'error';
  }

  /**
   * 设置位置
   * @param x X坐标
   * @param y Y坐标
   * @returns this（用于链式调用）
   */
  public setPosition(x: number, y: number): this {
    this.container.setPosition(x, y);
    return this;
  }

  /**
   * 设置深度
   * @param depth 深度值
   * @returns this（用于链式调用）
   */
  public setDepth(depth: number): this {
    this.container.setDepth(depth);
    return this;
  }

  /**
   * 设置可见性
   * @param visible 是否可见
   * @returns this（用于链式调用）
   */
  public setVisible(visible: boolean): this {
    this.container.setVisible(visible);
    return this;
  }

  /**
   * 暴露到全局（供测试访问）
   * @param name 全局变量名
   */
  public exposeToGlobal(name: string = '__PROGRESS_BAR__'): void {
    if (typeof window !== 'undefined') {
      (window as any)[name] = this;
    }
  }

  /**
   * 销毁组件
   */
  public destroy(): void {
    // 销毁Graphics
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }

    // 销毁填充Graphics
    if (this.fillGraphics) {
      this.fillGraphics.destroy();
      this.fillGraphics = null;
    }

    // 销毁文本
    if (this.textDisplay) {
      this.textDisplay.destroy();
      this.textDisplay = null;
    }

    // 销毁容器
    this.container.destroy();

    // 清空状态
    this.currentValue = 0;
    this.state = 'empty';

    // 清理全局引用
    if (typeof window !== 'undefined') {
      delete (window as any).__PROGRESS_BAR__;
      // 清理自定义名称的全局引用
      const keys = Object.keys(window);
      for (const key of keys) {
        if ((window as any)[key] === this) {
          delete (window as any)[key];
        }
      }
    }
  }
}