// src/ui/components/HerbTagComponent.ts
/**
 * HerbTagComponent药牌组件
 *
 * 显示药材信息的悬挂式木牌组件，包含：
 * - 绳子：悬挂用的红色绳结
 * - 木牌：条纹纹理背景
 * - 像素图标：使用PixelSpriteComponent绘制药材图标
 * - 药名：药材名称
 * - 属性：药材功效属性
 * - 数量角标：显示数量（当数量>1时）
 *
 * Phase 2.5 煎药小游戏UI重构 Task 3
 */

import Phaser from 'phaser';
import PixelSpriteComponent from './PixelSpriteComponent';

/**
 * 药材数据接口
 */
export interface HerbData {
  /** 药材ID */
  id: string;
  /** 药材名称 */
  name: string;
  /** 药材功效属性 */
  prop: string;
  /** 药材数量 */
  count: number;
  /** 像素栅格数据 */
  grid: string[];
  /** 颜色调色板 */
  palette: Record<string, string>;
}

/**
 * 药牌配置接口
 */
export interface HerbTagConfig {
  /** 药材数据 */
  herb: HerbData;
  /** 像素尺寸，默认为3 */
  pixelSize?: number;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 拖拽开始回调 */
  onDragStart?: () => void;
  /** 拖拽结束回调 */
  onDragEnd?: () => void;
  /** 是否选中 */
  selected?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 颜色常量
 */
const TAG_COLOR = {
  /** 木牌背景色 */
  PLANK: 0xc89550,
  /** 木牌暗色边框 */
  PLANK_DARK: 0x3f2412,
  /** 木牌高光 */
  PLANK_LIGHT: 0xffd24a,
  /** 墨色文字 */
  INK: 0x2a1810,
  /** 朱砂红色 */
  CINNABAR: 0x8a1f1a,
};

/**
 * HerbTagComponent药牌组件类
 *
 * 使用方式:
 * ```typescript
 * const herb = {
 *   id: 'danggui',
 *   name: '当归',
 *   prop: '补血',
 *   count: 6,
 *   grid: ['  aa  ', ' abba '],
 *   palette: { a: '#6a8c78', b: '#8ab098' },
 * };
 * const tag = new HerbTagComponent(scene, { herb, draggable: true });
 * tag.setPosition(100, 100);
 * tag.destroy();
 * ```
 */
export default class HerbTagComponent {
  /** Phaser场景引用 */
  protected scene: Phaser.Scene;

  /** 容器对象 */
  public container: Phaser.GameObjects.Container;

  /** 药材数据 */
  public readonly herb: HerbData;

  /** 木牌宽度 */
  public readonly plankWidth: number;

  /** 木牌高度 */
  public readonly plankHeight: number;

  /** 像素尺寸 */
  public readonly pixelSize: number;

  /** 是否可拖拽 */
  public readonly draggable: boolean;

  /** 木牌Graphics */
  protected plankGraphics: Phaser.GameObjects.Graphics | null = null;

  /** 绳子Graphics */
  protected stringGraphics: Phaser.GameObjects.Graphics | null = null;

  /** 像素精灵组件 */
  protected pixelSprite: PixelSpriteComponent | null = null;

  /** 药名文本 */
  protected nameText: Phaser.GameObjects.Text | null = null;

  /** 属性文本 */
  protected propText: Phaser.GameObjects.Text | null = null;

  /** 数量角标文本 */
  protected countText: Phaser.GameObjects.Text | null = null;

  /** 配置选项 */
  protected config: HerbTagConfig;

  /**
   * 构造函数
   * @param scene Phaser场景
   * @param config 配置选项
   * @param x 位置X，默认0
   * @param y 位置Y，默认0
   */
  constructor(scene: Phaser.Scene, config: HerbTagConfig, x: number = 0, y: number = 0) {
    // Input validation - check required fields
    if (!config.herb?.grid || !config.herb?.palette) {
      throw new Error('HerbTagComponent: herb.grid and herb.palette are required');
    }

    this.scene = scene;
    this.config = config;

    // Clone herb data to prevent external mutation
    this.herb = {
      ...config.herb,
      grid: [...config.herb.grid],
      palette: { ...config.herb.palette },
    };

    this.plankWidth = 84;
    this.plankHeight = 78;
    this.pixelSize = config.pixelSize ?? 3;
    this.draggable = config.draggable ?? false;

    // 创建容器
    this.container = scene.add.container(x, y);

    // 绘制各部分
    this.drawString();
    this.drawPlank();
    this.createPixelSprite();
    this.createTexts();
    this.setupInteraction();

    // 添加到场景
    scene.add.existing(this.container);
  }

  /**
   * 绘制绳子
   */
  protected drawString(): void {
    this.stringGraphics = this.scene.add.graphics();
    this.container.add(this.stringGraphics);

    // 绳子（顶部悬挂）
    const stringLength = 10;
    this.stringGraphics.fillStyle(TAG_COLOR.INK, 1);
    this.stringGraphics.fillRect(-1, -stringLength - 14, 2, stringLength);

    // 绳子顶端圆点（红色）
    this.stringGraphics.fillStyle(TAG_COLOR.CINNABAR, 1);
    this.stringGraphics.fillCircle(0, -stringLength - 17, 4);
  }

  /**
   * 绘制木牌
   */
  protected drawPlank(): void {
    this.plankGraphics = this.scene.add.graphics();
    this.container.add(this.plankGraphics);

    const plankX = -this.plankWidth / 2;
    const plankY = -14; // 绳子下方

    // 木牌背景（条纹纹理）
    this.plankGraphics.fillStyle(TAG_COLOR.PLANK, 1);
    this.plankGraphics.fillRect(plankX, plankY, this.plankWidth, this.plankHeight);

    // 木牌边框
    this.plankGraphics.lineStyle(3, TAG_COLOR.PLANK_DARK, 1);
    this.plankGraphics.strokeRect(plankX, plankY, this.plankWidth, this.plankHeight);

    // 顶部高光
    this.plankGraphics.fillStyle(TAG_COLOR.PLANK_LIGHT, 0.3);
    this.plankGraphics.fillRect(plankX + 2, plankY + 2, this.plankWidth - 4, 3);
  }

  /**
   * 创建像素精灵
   */
  protected createPixelSprite(): void {
    this.pixelSprite = new PixelSpriteComponent(
      this.scene,
      {
        grid: this.herb.grid,
        palette: this.herb.palette,
        pixelSize: this.pixelSize,
      },
      0,
      -14 + 16
    );
    this.container.add(this.pixelSprite.container);
  }

  /**
   * 创建文本
   */
  protected createTexts(): void {
    // 药名
    this.nameText = this.scene.add.text(0, -14 + 44, this.herb.name, {
      fontSize: '12px',
      fontFamily: 'Noto Serif SC',
      color: '#2a1810',
      fontWeight: '900',
    } as Phaser.Types.GameObjects.Text.TextStyle);
    this.nameText.setOrigin(0.5, 0.5);
    this.container.add(this.nameText);

    // 属性
    this.propText = this.scene.add.text(0, -14 + 56, this.herb.prop, {
      fontSize: '9px',
      fontFamily: 'ZCOOL XiaoWei, Noto Serif SC',
      color: '#8a1f1a',
    });
    this.propText.setOrigin(0.5, 0.5);
    this.container.add(this.propText);

    // 数量角标（仅当数量>1时显示）
    if (this.herb.count > 1) {
      this.countText = this.scene.add.text(
        this.plankWidth / 2 - 4,
        this.plankHeight / 2 - 8,
        `×${this.herb.count}`,
        {
          fontSize: '10px',
          fontFamily: 'VT323, monospace',
          color: '#f4dba8',
          backgroundColor: '#2a1810',
          padding: { x: 2, y: 1 },
        }
      );
      this.countText.setOrigin(0.5, 0.5);
      this.container.add(this.countText);
    }
  }

  /**
   * 设置交互
   */
  protected setupInteraction(): void {
    if (this.draggable) {
      this.container.setSize(this.plankWidth, this.plankHeight + 14);
      this.container.setInteractive({ useHandCursor: true });

      this.scene.input.setDraggable(this.container);

      this.container.on('dragstart', () => {
        if (this.config.onDragStart) this.config.onDragStart();
      });

      this.container.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        this.container.setPosition(dragX, dragY);
      });

      this.container.on('dragend', () => {
        if (this.config.onDragEnd) this.config.onDragEnd();
      });
    } else if (this.config.onClick) {
      this.container.setSize(this.plankWidth, this.plankHeight + 14);
      this.container.setInteractive({ useHandCursor: true });
      this.container.on('pointerdown', this.config.onClick);
    }
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
    if (this.plankGraphics) {
      this.plankGraphics.destroy();
      this.plankGraphics = null;
    }
    if (this.stringGraphics) {
      this.stringGraphics.destroy();
      this.stringGraphics = null;
    }
    if (this.pixelSprite) {
      this.pixelSprite.destroy();
      this.pixelSprite = null;
    }
    if (this.nameText) {
      this.nameText.destroy();
      this.nameText = null;
    }
    if (this.propText) {
      this.propText.destroy();
      this.propText = null;
    }
    if (this.countText) {
      this.countText.destroy();
      this.countText = null;
    }
    this.container.destroy();
  }
}