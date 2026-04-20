// src/ui/base/BaseUIComponent.ts
/**
 * BaseUIComponent抽象基类
 *
 * 提供UI组件的基础功能：
 * - Container管理（创建、销毁）
 * - 边框绘制（drawBorder方法）
 * - 退出按钮创建（createExitButton方法）
 * - 深度设置（setDepth方法）
 * - 全局暴露（exposeToGlobal方法）
 * - 销毁流程
 *
 * Phase 2.5 UI Core Infrastructure Task 2
 */

import Phaser from 'phaser';
import {
  BorderStyleType,
  BORDER_STYLE_CONFIGS,
  draw3DBorder,
  drawNeumorphicBorderRaised,
  drawInsetSlotBorder,
} from './UIBorderStyles';
import { UI_COLOR_STRINGS } from '../../data/ui-color-theme';

/**
 * 退出按钮位置配置
 */
export interface ExitButtonPosition {
  x: number;
  y: number;
}

/**
 * BaseUIComponent抽象基类
 * 所有UI组件继承此基类
 */
export default abstract class BaseUIComponent {
  /** Phaser场景引用 */
  protected scene: Phaser.Scene;

  /** 容器对象 */
  public container: Phaser.GameObjects.Container;

  /** 宽度 */
  public width: number;

  /** 高度 */
  public height: number;

  /** 深度层级 */
  public depth: number;

  /** Graphics对象（用于绘制边框） */
  public graphics: Phaser.GameObjects.Graphics | null = null;

  /** 退出按钮 */
  protected exitButton: Phaser.GameObjects.Text | null = null;

  /** 默认深度 */
  protected static readonly DEFAULT_DEPTH = 100;

  /**
   * 构造函数
   * @param scene Phaser场景
   * @param width 组件宽度
   * @param height 组件高度
   * @param depth 可选的深度层级，默认100
   */
  constructor(scene: Phaser.Scene, width: number, height: number, depth: number = BaseUIComponent.DEFAULT_DEPTH) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.depth = depth;

    // 创建容器，位于屏幕中心（使用相机当前的世界中心坐标）
    // 重要：当相机跟随玩家滚动时，需要使用 scrollX + width/2 来获取当前屏幕中心的世界坐标
    // 然后立即设置 setScrollFactor(0) 来锁定容器在屏幕位置
    const camera = scene.cameras.main;
    const worldCenterX = camera.scrollX + camera.width / 2;
    const worldCenterY = camera.scrollY + camera.height / 2;
    this.container = scene.add.container(worldCenterX, worldCenterY);
    this.container.setScrollFactor(0);  // 立即锁定，防止相机滚动时移动

    // 设置深度
    this.container.setDepth(this.depth);

    // 添加到场景
    scene.add.existing(this.container);
  }

  /**
   * 绘制边框
   * @param style 边框样式，默认 '3d'
   * @param config 可选的自定义配置
   * @returns Graphics对象（用于链式调用）
   */
  protected drawBorder(style: BorderStyleType = '3d'): Phaser.GameObjects.Graphics {
    // 创建或清除Graphics
    if (this.graphics) {
      this.graphics.clear();
    } else {
      this.graphics = this.scene.add.graphics();
      this.container.add(this.graphics);
    }

    // 计算绘制起点（相对于容器中心）
    const x = -this.width / 2;
    const y = -this.height / 2;

    // 根据样式绘制边框
    switch (style) {
      case 'glass':
        this.drawGlassBorder(x, y);
        break;
      case '3d':
        draw3DBorder(this.graphics, x, y, this.width, this.height);
        break;
      case 'traditional':
        this.drawTraditionalBorder(x, y);
        break;
      case 'neumorphic':
        drawNeumorphicBorderRaised(this.graphics, x, y, this.width, this.height);
        break;
      case 'inset':
        drawInsetSlotBorder(this.graphics, x, y, this.width, this.height);
        break;
      default:
        draw3DBorder(this.graphics, x, y, this.width, this.height);
    }

    return this.graphics;
  }

  /**
   * 绘制玻璃态边框（渐变背景+金棕高光）
   */
  private drawGlassBorder(x: number, y: number): void {
    const config = BORDER_STYLE_CONFIGS['glass'];

    // 绘制渐变背景
    this.graphics?.fillGradientStyle(
      config.glassLight ?? 0x408080,
      1,
      config.glassLight ?? 0x408080,
      1,
      config.glassDark ?? 0x402020,
      1,
      config.glassDark ?? 0x402020,
      1
    );
    this.graphics?.fillRect(x, y, this.width, this.height);

    // 绘制顶部光带
    if (config.glowColor !== undefined) {
      this.graphics?.fillStyle(config.glowColor, 0.3);
      this.graphics?.fillRect(x, y, this.width, 2);
    }

    // 绘制边框
    if (config.glowColor !== undefined) {
      this.graphics?.lineStyle(config.borderWidth ?? 3, config.glowColor, 0.5);
      this.graphics?.strokeRect(x, y, this.width, this.height);
    }
  }

  /**
   * 绘制传统边框（单色边框）
   */
  private drawTraditionalBorder(x: number, y: number): void {
    const config = BORDER_STYLE_CONFIGS['traditional'];

    // 绘制背景
    if (config.background !== undefined) {
      this.graphics?.fillStyle(config.background, 1);
      this.graphics?.fillRect(x, y, this.width, this.height);
    }

    // 绘制边框
    if (config.outerColor !== undefined) {
      this.graphics?.lineStyle(config.borderWidth ?? 2, config.outerColor, 1);
      this.graphics?.strokeRect(x, y, this.width, this.height);
    }
  }

  /**
   * 创建退出按钮
   * @param text 按钮文字，默认 '退出'
   * @param position 按钮位置（相对于容器中心），默认右上角
   * @param action 点击回调函数
   * @returns 创建的Text对象
   */
  protected createExitButton(
    text: string = '退出',
    position?: ExitButtonPosition,
    action?: () => void
  ): Phaser.GameObjects.Text {
    // 默认位置：右上角（相对于容器中心）
    const defaultPosition: ExitButtonPosition = {
      x: this.width / 2 - 50,
      y: -this.height / 2 + 10,
    };

    const pos = position ?? defaultPosition;

    // 创建文字按钮
    this.exitButton = this.scene.add.text(pos.x, pos.y, text, {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.BUTTON_SECONDARY,
      padding: { x: 8, y: 4 },
    });

    // 设置原点
    this.exitButton.setOrigin(0, 0);

    // 设置交互
    this.exitButton.setInteractive({ useHandCursor: true });

    // 悬停效果
    this.exitButton.on('pointerover', () => {
      this.exitButton?.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
      this.exitButton?.setBackgroundColor?.(UI_COLOR_STRINGS.BUTTON_SECONDARY_HOVER);
    });

    this.exitButton.on('pointerout', () => {
      this.exitButton?.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
      this.exitButton?.setBackgroundColor?.(UI_COLOR_STRINGS.BUTTON_SECONDARY);
    });

    // 点击事件
    this.exitButton.on('pointerdown', () => {
      if (action) {
        action();
      } else {
        this.destroy();
      }
    });

    // 添加到容器
    this.container.add(this.exitButton);

    return this.exitButton;
  }

  /**
   * 设置深度层级
   * @param depth 深度值
   * @returns this（用于链式调用）
   */
  setDepth(depth: number): this {
    this.depth = depth;
    this.container.setDepth(depth);
    return this;
  }

  /**
   * 设置滚动因子
   * @param x X方向滚动因子，默认1（跟随相机）
   * @param y Y方向滚动因子，默认1（跟随相机）
   * @returns this（用于链式调用）
   */
  setScrollFactor(x: number = 1, y: number = 1): this {
    this.container.setScrollFactor(x, y);
    return this;
  }

  /**
   * 暴露到全局（供测试访问）
   * @param name 全局变量名
   */
  exposeToGlobal(name: string = '__BASE_UI__'): void {
    if (typeof window !== 'undefined') {
      (window as any)[name] = this;
    }
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    // 销毁Graphics
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }

    // 销毁退出按钮
    if (this.exitButton) {
      this.exitButton.destroy();
      this.exitButton = null;
    }

    // 销毁容器
    this.container.destroy();

    // 清理全局引用
    if (typeof window !== 'undefined') {
      delete (window as any).__BASE_UI__;
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