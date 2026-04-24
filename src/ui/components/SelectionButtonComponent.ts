// src/ui/components/SelectionButtonComponent.ts
/**
 * SelectionButtonComponent选择按钮组件
 *
 * 选择按钮组件，使用○→●符号切换表示选中状态
 *
 * 视觉规范:
 * - 尺寸: 自适应宽度，高度32px
 * - 边框风格: inset（内凹）
 * - 选中状态表示: 方案A(○→●符号切换)
 *
 * 状态管理:
 * - UNSELECTED → SELECTED
 *
 * 使用场景:
 * - PulseUI.options (脉位/脉势选择)
 * - TongueUI.options (舌象属性选择)
 * - SyndromeUI.options (证型选择)
 * - PrescriptionUI.options (方剂选择)
 * - DecoctionUI.fireButtons (火候选择)
 * - ProcessingUI.methodButtons (方法选择)
 * - PlantingUI.waterButtons (水源选择)
 *
 * Phase 2.5 UI组件系统统一化 Task 11
 */

import Phaser from 'phaser';
import { drawInsetSlotBorder } from '../base/UIBorderStyles';
import { UI_COLORS, UI_COLOR_STRINGS } from '../../data/ui-color-theme';

/**
 * 选择按钮状态枚举
 */
export enum SelectionButtonState {
  /** 未选中状态 */
  UNSELECTED = 'UNSELECTED',
  /** 已选中状态 */
  SELECTED = 'SELECTED',
}

/**
 * 选择按钮内容接口
 */
export interface SelectionButtonContent {
  /** 显示文字 */
  label: string;
  /** 选择值 */
  value: string;
  /** 选中符号（可选，默认○） */
  symbol?: '○' | '●';
}

/**
 * 选择按钮配置接口
 */
export interface SelectionButtonConfig {
  /** 是否支持多选 */
  multiSelect?: boolean;
  /** 初始选中状态 */
  selected?: boolean;
  /** 选择回调 */
  onSelect?: (value: string) => void;
  /** hover回调 */
  onHover?: () => void;
  /** 固定宽度（可选） */
  width?: number;
}

/**
 * SelectionButtonComponent选择按钮组件类
 *
 * 使用方式:
 * ```typescript
 * const button = new SelectionButtonComponent(scene, { label: '脉浮', value: 'mai_fu' });
 * button.select(); // 选中，符号变为●
 * button.deselect(); // 取消选中，符号变为○
 * ```
 */
export default class SelectionButtonComponent {
  /** Phaser场景引用 */
  protected scene: Phaser.Scene;

  /** 容器对象 */
  public container: Phaser.GameObjects.Container;

  /** 组件宽度 */
  public width: number;

  /** 组件高度 */
  public height: number;

  /** Graphics对象（用于绘制边框） */
  protected graphics: Phaser.GameObjects.Graphics | null = null;

  /** 文本对象 */
  protected textObject: Phaser.GameObjects.Text | null = null;

  /** 交互区域 */
  protected hitArea: Phaser.GameObjects.Zone | null = null;

  /** 当前状态 */
  public state: SelectionButtonState;

  /** 是否支持多选 */
  public multiSelect: boolean;

  /** 当前内容 */
  public content: SelectionButtonContent;

  /** 配置 */
  protected config: SelectionButtonConfig;

  /** 是否处于hover状态 */
  protected isHovering: boolean = false;

  /** 标准高度常量 */
  public static readonly BUTTON_HEIGHT = 32;

  /** 未选中符号 */
  public static readonly SYMBOL_UNSELECTED = '○';

  /** 已选中符号 */
  public static readonly SYMBOL_SELECTED = '●';

  /** 默认内边距 */
  protected static readonly PADDING = 16;

  /** 默认字体大小 */
  protected static readonly FONT_SIZE = '16px';

  /**
   * 构造函数
   * @param scene Phaser场景
   * @param content 按钮内容（label + value）
   * @param config 配置选项
   * @param x 位置X，默认0
   * @param y 位置Y，默认0
   */
  constructor(
    scene: Phaser.Scene,
    content: SelectionButtonContent,
    config?: SelectionButtonConfig,
    x: number = 0,
    y: number = 0
  ) {
    this.scene = scene;
    this.content = content;
    this.config = config ?? {};
    this.multiSelect = this.config.multiSelect ?? false;
    this.height = SelectionButtonComponent.BUTTON_HEIGHT;

    // 计算宽度：固定宽度或自适应文本宽度
    if (this.config.width) {
      this.width = this.config.width;
    } else {
      // 自适应宽度：符号 + 空格 + label + 内边距
      this.width = this.calculateTextWidth();
    }

    // 设置初始状态
    this.state = this.config.selected ? SelectionButtonState.SELECTED : SelectionButtonState.UNSELECTED;

    // 创建容器
    this.container = scene.add.container(x, y);

    // 创建Graphics
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    // 创建文本
    this.createText();

    // 创建交互区域
    this.hitArea = scene.add.zone(0, 0, this.width, this.height);
    this.hitArea.setOrigin(0.5, 0.5);
    this.hitArea.setInteractive({ useHandCursor: true });
    this.container.add(this.hitArea);

    // 设置交互事件
    this.setupInteraction();

    // 绘制边框
    this.drawBorder();

    // 添加到场景
    scene.add.existing(this.container);
  }

  /**
   * 计算文本宽度
   * @returns 计算的宽度
   */
  protected calculateTextWidth(): number {
    // 估算文本宽度：每个字符约16px（中文字符）
    // 格式: "○ 脉浮" = 符号(1) + 空格(1) + label
    const symbolWidth = 16; // ○ 或 ●
    const spaceWidth = 8;
    const labelWidth = this.content.label.length * 16;
    const padding = SelectionButtonComponent.PADDING * 2;

    return symbolWidth + spaceWidth + labelWidth + padding;
  }

  /**
   * 创建文本对象
   */
  protected createText(): void {
    const text = this.getText();

    this.textObject = this.scene.add.text(0, 0, text, {
      fontSize: SelectionButtonComponent.FONT_SIZE,
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      fontFamily: 'Arial',
    });

    this.textObject.setOrigin(0.5, 0.5);
    this.container.add(this.textObject);
  }

  /**
   * 设置交互事件
   */
  protected setupInteraction(): void {
    if (!this.hitArea) return;

    // 点击事件
    this.hitArea.on('pointerdown', () => {
      this.handleClick();
    });

    // Hover效果
    this.hitArea.on('pointerover', () => {
      this.handleHover(true);
    });

    this.hitArea.on('pointerout', () => {
      this.handleHover(false);
    });
  }

  /**
   * 处理点击
   */
  public handleClick(): void {
    // 切换状态
    if (this.state === SelectionButtonState.UNSELECTED) {
      this.select();
    } else {
      this.deselect();
    }
  }

  /**
   * 处理Hover效果
   * @param isHovering 是否Hover中
   */
  public handleHover(isHovering: boolean): void {
    this.isHovering = isHovering;

    // 触发回调
    if (isHovering && this.config.onHover) {
      this.config.onHover();
    }

    // 重绘边框（添加/移除高亮）
    this.drawBorder();
  }

  /**
   * 绘制边框
   */
  protected drawBorder(): void {
    if (!this.graphics) return;

    this.graphics.clear();

    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    const x = -halfWidth;
    const y = -halfHeight;

    // 基础inset边框
    drawInsetSlotBorder(this.graphics, x, y, this.width, this.height);

    // 选中状态：添加选中高亮边框
    if (this.state === SelectionButtonState.SELECTED) {
      this.graphics.lineStyle(3, UI_COLORS.BUTTON_PRIMARY, 1);
      this.graphics.strokeRect(x, y, this.width, this.height);
    }

    // Hover状态：添加hover高亮
    if (this.isHovering) {
      this.graphics.lineStyle(2, UI_COLORS.BUTTON_PRIMARY_HOVER, 0.5);
      this.graphics.strokeRect(x + 2, y + 2, this.width - 4, this.height - 4);
    }
  }

  /**
   * 更新文本显示
   */
  protected updateText(): void {
    if (!this.textObject) return;

    const text = this.getText();
    this.textObject.setText(text);

    // 选中状态改变文字颜色
    if (this.state === SelectionButtonState.SELECTED) {
      this.textObject.setColor(UI_COLOR_STRINGS.TEXT_HIGHLIGHT);
    } else {
      this.textObject.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
    }
  }

  /**
   * 获取当前符号
   * @returns 当前显示的符号
   */
  public getSymbol(): string {
    return this.state === SelectionButtonState.SELECTED
      ? SelectionButtonComponent.SYMBOL_SELECTED
      : SelectionButtonComponent.SYMBOL_UNSELECTED;
  }

  /**
   * 获取显示文本
   * @returns 格式化的显示文本 "符号 label"
   */
  public getText(): string {
    const symbol = this.getSymbol();
    return `${symbol} ${this.content.label}`;
  }

  /**
   * 选中按钮
   * @param silent 是否静默选中（不触发回调），用于父组件状态同步
   */
  public select(silent: boolean = false): void {
    this.state = SelectionButtonState.SELECTED;
    this.drawBorder();
    this.updateText();

    // 只有用户点击触发的select才调用回调，程序调用不触发
    // 防止无限循环：parent.updateButtonStates() → select() → onSelect → parent.handler → updateButtonStates()
    if (!silent && this.config.onSelect) {
      this.config.onSelect(this.content.value);
    }
  }

  /**
   * 取消选中
   */
  public deselect(): void {
    this.state = SelectionButtonState.UNSELECTED;
    this.drawBorder();
    this.updateText();

    // 注意：取消选中不触发onSelect回调，避免循环调用
    // 父组件通过updateButtonStates()统一管理状态
  }

  /**
   * 是否已选中
   */
  public isSelected(): boolean {
    return this.state === SelectionButtonState.SELECTED;
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
   * 暴露到全局（供测试访问）
   * @param name 全局变量名
   */
  public exposeToGlobal(name: string = '__SELECTION_BUTTON__'): void {
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

    // 销毁文本
    if (this.textObject) {
      this.textObject.destroy();
      this.textObject = null;
    }

    // 销毁交互区域
    if (this.hitArea) {
      this.hitArea.destroy();
      this.hitArea = null;
    }

    // 销毁容器
    this.container.destroy();

    // 重置状态
    this.state = SelectionButtonState.UNSELECTED;

    // 清理全局引用
    if (typeof window !== 'undefined') {
      delete (window as any).__SELECTION_BUTTON__;
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