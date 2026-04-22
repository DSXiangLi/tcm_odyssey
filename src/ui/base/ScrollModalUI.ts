// src/ui/base/ScrollModalUI.ts
/**
 * ScrollModalUI卷轴风格弹窗基类
 *
 * 继承ModalUI，提供卷轴风格的装饰元素：
 * - 上下木轴（roller）
 * - 纸张背景（paper）
 * - 印章装饰（seal）
 * - 标题栏（竖排副标题）
 *
 * Phase 2.5 UI Core Infrastructure Task 4
 */

import Phaser from 'phaser';
import ModalUI from './ModalUI';

/**
 * ScrollModalConfig配置接口
 */
export interface ScrollModalConfig {
  title: string;
  subtitle?: string;
  sealMain?: string;
  sealCorner?: string;
  variant?: 'default' | 'dark' | 'light';
  modalType: 'MINIGAME_MODAL' | 'DIAGNOSIS_MODAL' | 'FULLSCREEN_MODAL';
  onExit: () => void;
}

/**
 * 卷轴颜色常量（从 HTML CSS 提取）
 */
const SCROLL_COLOR = {
  PAPER: 0xe8c991,
  PAPER_BRIGHT: 0xf4dba8,
  PAPER_DEEP: 0xc89550,
  CINNABAR: 0xb8322c,
  CINNABAR_DEEP: 0x8a1f1a,
  WOOD: 0x6b3e1f,
  WOOD_DARK: 0x3f2412,
  WOOD_LIGHT: 0xa26a3a,
  INK: 0x2a1810,
};

/**
 * ScrollModalUI卷轴风格弹窗基类
 * 继承ModalUI，提供：
 * - 卷轴边框（木轴+纸张）
 * - 印章装饰（主印章+角印章）
 * - 标题栏（主标题+竖排副标题）
 * - 内容容器（用于添加子元素）
 */
export default class ScrollModalUI extends ModalUI {
  /** 主标题 */
  public title: string;

  /** 副标题（竖排显示） */
  public subtitle?: string;

  /** 主印章文字（左上角） */
  public sealMain?: string;

  /** 角印章文字（右下角） */
  public sealCorner?: string;

  /** 卷轴样式变体 */
  public variant: 'default' | 'dark' | 'light';

  /** 卷轴装饰Graphics */
  protected scrollGraphics: Phaser.GameObjects.Graphics | null = null;

  /** 主印章Graphics */
  protected sealMainGraphics: Phaser.GameObjects.Graphics | null = null;

  /** 角印章Graphics */
  protected sealCornerGraphics: Phaser.GameObjects.Graphics | null = null;

  /** 主标题Text */
  protected titleText: Phaser.GameObjects.Text | null = null;

  /** 副标题Text */
  protected subtitleText: Phaser.GameObjects.Text | null = null;

  /** 内容容器 */
  protected contentContainer: Phaser.GameObjects.Container | null = null;

  /**
   * 构造函数
   * @param scene Phaser场景
   * @param config ScrollModalConfig配置
   */
  constructor(scene: Phaser.Scene, config: ScrollModalConfig) {
    // 调用父类构造函数（exitText使用特殊符号）
    super(scene, config.modalType, '[×]', config.onExit);

    // 存储配置
    this.title = config.title;
    this.subtitle = config.subtitle;
    this.sealMain = config.sealMain;
    this.sealCorner = config.sealCorner;
    this.variant = config.variant ?? 'default';

    // 绘制卷轴装饰（覆盖默认边框）
    this.drawScrollFrame();
    this.drawSeals();
    this.drawTitleBar();
    this.createContentContainer();
  }

  /**
   * 绘制卷轴边框（木轴+纸张）
   */
  protected drawScrollFrame(): void {
    if (!this.graphics) return;
    this.graphics.clear();

    const x = -this.width / 2;
    const y = -this.height / 2;

    // 上下轴（木轴）
    const rollerHeight = 28;

    // 上轴
    this.graphics.fillStyle(SCROLL_COLOR.WOOD, 1);
    this.graphics.fillRect(x - 16, y - 8, this.width + 32, rollerHeight);
    this.graphics.lineStyle(3, SCROLL_COLOR.WOOD_LIGHT, 1);
    this.graphics.strokeRect(x - 16, y - 8, this.width + 32, rollerHeight);

    // 下轴
    this.graphics.fillStyle(SCROLL_COLOR.WOOD, 1);
    this.graphics.fillRect(x - 16, y + this.height - rollerHeight + 8, this.width + 32, rollerHeight);
    this.graphics.lineStyle(3, SCROLL_COLOR.WOOD_DARK, 1);
    this.graphics.strokeRect(x - 16, y + this.height - rollerHeight + 8, this.width + 32, rollerHeight);

    // 纸张背景
    this.graphics.fillStyle(SCROLL_COLOR.PAPER, 1);
    this.graphics.fillRect(x + 14, y + 14, this.width - 28, this.height - 28);

    // 纸张边框
    this.graphics.lineStyle(6, SCROLL_COLOR.WOOD_DARK, 1);
    this.graphics.strokeRect(x + 14, y + 14, this.width - 28, this.height - 28);
  }

  /**
   * 绘制印章装饰
   */
  protected drawSeals(): void {
    // 主印章（左上角）
    if (this.sealMain) {
      this.sealMainGraphics = this.scene.add.graphics();
      this.container.add(this.sealMainGraphics);

      const sealSize = 60;
      const sealX = -this.width / 2 + 30;
      const sealY = -this.height / 2 + 40;

      // 印章背景
      this.sealMainGraphics.fillStyle(SCROLL_COLOR.CINNABAR_DEEP, 1);
      this.sealMainGraphics.fillRect(sealX, sealY, sealSize, sealSize);

      // 印章边框
      this.sealMainGraphics.lineStyle(4, SCROLL_COLOR.CINNABAR, 1);
      this.sealMainGraphics.strokeRect(sealX, sealY, sealSize, sealSize);

      // 印章文字
      const sealText = this.scene.add.text(
        sealX + sealSize / 2,
        sealY + sealSize / 2,
        this.sealMain,
        {
          fontSize: '20px',
          fontFamily: 'Noto Serif SC',
          color: '#f4dba8',
          fontWeight: '900',
        }
      );
      sealText.setOrigin(0.5, 0.5);
      sealText.setRotation(-0.07); // 约 -4 度
      this.container.add(sealText);
    }

    // 角印章（右下角，小）
    if (this.sealCorner) {
      this.sealCornerGraphics = this.scene.add.graphics();
      this.container.add(this.sealCornerGraphics);

      const sealSize = 44;
      const sealX = this.width / 2 - 60;
      const sealY = this.height / 2 - 70;

      this.sealCornerGraphics.fillStyle(SCROLL_COLOR.CINNABAR_DEEP, 1);
      this.sealCornerGraphics.fillRect(sealX, sealY, sealSize, sealSize);

      this.sealCornerGraphics.lineStyle(3, SCROLL_COLOR.CINNABAR, 1);
      this.sealCornerGraphics.strokeRect(sealX, sealY, sealSize, sealSize);

      const sealText = this.scene.add.text(
        sealX + sealSize / 2,
        sealY + sealSize / 2,
        this.sealCorner,
        {
          fontSize: '14px',
          fontFamily: 'Noto Serif SC',
          color: '#f4dba8',
          fontWeight: '900',
        }
      );
      sealText.setOrigin(0.5, 0.5);
      sealText.setRotation(0.05); // 约 3 度
      this.container.add(sealText);
    }
  }

  /**
   * 绘制标题栏（主标题+竖排副标题）
   */
  protected drawTitleBar(): void {
    const titleX = 0;
    const titleY = -this.height / 2 + 50;

    // 主标题
    this.titleText = this.scene.add.text(titleX, titleY, this.title, {
      fontSize: '28px',
      fontFamily: 'Noto Serif SC',
      color: '#2a1810',
      fontWeight: '900',
    });
    this.titleText.setOrigin(0.5, 0.5);
    this.container.add(this.titleText);

    // 副标题（竖排）
    if (this.subtitle) {
      this.subtitleText = this.scene.add.text(titleX + 60, titleY - 10, this.subtitle, {
        fontSize: '12px',
        fontFamily: 'ZCOOL XiaoWei, Noto Serif SC',
        color: '#3f2412',
      });
      this.subtitleText.setOrigin(0.5, 0);
      this.subtitleText.setRotation(Math.PI / 2); // 竖排
      this.container.add(this.subtitleText);
    }
  }

  /**
   * 创建内容容器（用于添加子元素）
   */
  protected createContentContainer(): void {
    this.contentContainer = this.scene.add.container(0, 30);
    this.container.add(this.contentContainer);
  }

  /**
   * 获取内容容器
   * @returns 内容容器（用于添加子元素）
   */
  public getContentContainer(): Phaser.GameObjects.Container {
    return this.contentContainer!;
  }

  /**
   * 销毁组件
   * 清理所有Graphics和Text资源
   */
  public destroy(): void {
    // 销毁卷轴Graphics
    if (this.scrollGraphics) {
      this.scrollGraphics.destroy();
      this.scrollGraphics = null;
    }

    // 销毁印章Graphics
    if (this.sealMainGraphics) {
      this.sealMainGraphics.destroy();
      this.sealMainGraphics = null;
    }
    if (this.sealCornerGraphics) {
      this.sealCornerGraphics.destroy();
      this.sealCornerGraphics = null;
    }

    // 销毁标题Text
    if (this.titleText) {
      this.titleText.destroy();
      this.titleText = null;
    }
    if (this.subtitleText) {
      this.subtitleText.destroy();
      this.subtitleText = null;
    }

    // 销毁内容容器
    if (this.contentContainer) {
      this.contentContainer.destroy();
      this.contentContainer = null;
    }

    // 调用父类销毁方法
    super.destroy();
  }
}