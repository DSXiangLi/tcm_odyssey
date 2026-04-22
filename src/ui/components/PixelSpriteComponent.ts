// src/ui/components/PixelSpriteComponent.ts
/**
 * PixelSpriteComponent像素图标绘制组件
 *
 * 使用grid/palette数据绘制像素艺术图标
 *
 * 栅格数据格式:
 * - grid: 字符数组，每个字符代表一个像素，空格为透明
 * - palette: 颜色映射，将字符映射为十六进制颜色值
 *
 * 示例:
 * ```typescript
 * const grid = ['  aa  ', ' abba ', '  aa  '];
 * const palette = { a: '#6a8c78', b: '#8ab098' };
 * const sprite = new PixelSpriteComponent(scene, { grid, palette });
 * ```
 *
 * Phase 2.5 煎药小游戏UI重构 Task 1
 */

import Phaser from 'phaser';

/**
 * 像素精灵配置接口
 */
export interface PixelSpriteConfig {
  /** 栅格数据，每个字符代表一个像素 */
  grid: string[];
  /** 颜色调色板，字符到颜色值的映射 */
  palette: Record<string, string>;
  /** 像素尺寸，默认为3 */
  pixelSize?: number;
  /** 是否动画（预留） */
  animated?: boolean;
}

/**
 * PixelSpriteComponent像素图标绘制组件类
 *
 * 使用方式:
 * ```typescript
 * const sprite = new PixelSpriteComponent(scene, { grid, palette });
 * sprite.setPosition(100, 100);
 * sprite.destroy();
 * ```
 */
export default class PixelSpriteComponent {
  /** Phaser场景引用 */
  protected scene: Phaser.Scene;

  /** 容器对象 */
  public container: Phaser.GameObjects.Container;

  /** Graphics对象（用于绘制像素） */
  public graphics: Phaser.GameObjects.Graphics | null = null;

  /** 栅格数据 */
  public grid: string[];

  /** 颜色调色板 */
  public palette: Record<string, string>;

  /** 像素尺寸 */
  public pixelSize: number;

  /** 是否动画（预留） */
  public animated: boolean;

  /** 宽度（基于栅格计算） */
  public width: number;

  /** 高度（基于栅格计算） */
  public height: number;

  /**
   * 构造函数
   * @param scene Phaser场景
   * @param config 配置选项
   * @param x 位置X，默认0
   * @param y 位置Y，默认0
   */
  constructor(scene: Phaser.Scene, config: PixelSpriteConfig, x: number = 0, y: number = 0) {
    this.scene = scene;
    // Clone data to prevent external mutation
    this.grid = [...config.grid];
    this.palette = { ...config.palette };
    this.pixelSize = config.pixelSize ?? 3;
    this.animated = config.animated ?? false;

    // Handle empty grid
    if (this.grid.length === 0) {
      this.grid = [''];
    }

    // Validate grid consistency (warn only)
    const expectedWidth = this.grid[0]?.length ?? 0;
    for (const row of this.grid) {
      if (row.length !== expectedWidth) {
        console.warn('PixelSpriteComponent: Grid rows have inconsistent lengths');
      }
    }

    // 计算宽高
    const gridWidth = this.grid[0]?.length ?? 0;
    this.width = gridWidth * this.pixelSize;
    this.height = this.grid.length * this.pixelSize;

    // 创建容器
    this.container = scene.add.container(x, y);

    // 创建Graphics
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    // 绘制像素
    this.drawPixels();

    // 添加到场景
    scene.add.existing(this.container);
  }

  /**
   * 绘制像素
   */
  protected drawPixels(): void {
    if (!this.graphics) return;

    this.graphics.clear();

    this.grid.forEach((row, y) => {
      [...row].forEach((char, x) => {
        // 跳过空格和未定义的颜色
        if (char === ' ' || !this.palette[char]) return;

        // 获取颜色值
        const color = Phaser.Display.Color.HexStringToColor(this.palette[char]).color;

        // 设置填充样式
        this.graphics!.fillStyle(color, 1);

        // 绘制像素方块
        this.graphics!.fillRect(
          x * this.pixelSize,
          y * this.pixelSize,
          this.pixelSize,
          this.pixelSize
        );
      });
    });
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
   * 销毁组件
   */
  public destroy(): void {
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
    this.container.destroy();
  }
}