// src/ui/components/PotVisualComponent.ts
import Phaser from 'phaser';

/**
 * 药罐视觉配置
 */
export interface PotVisualConfig {
  width: number;        // 药罐宽度 (默认 44px * 6 = 264)
  height: number;       // 药罐高度 (默认 28px * 6 = 168)
  pixelSize?: number;   // 像素尺寸 (默认 6)
  showSteam?: boolean;  // 是否显示蒸汽
  showLadle?: boolean;  // 是否显示搅拌勺
}

/**
 * 药罐视觉组件 - 1比1还原设计稿药罐形状
 *
 * CSS设计稿对应:
 * .pot-body - 罐身
 * .pot-rim - 罐口边缘
 * .pot-liquid - 药液表面
 * .pot-handle - 把手
 * .steam-puff - 蒸汽
 * .ladle - 搅拌勺
 */
export default class PotVisualComponent {
  protected scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  public width: number;
  public height: number;
  protected pixelSize: number;
  protected showSteam: boolean;
  protected showLadle: boolean;

  // Graphics对象
  public bodyGraphics: Phaser.GameObjects.Graphics | null = null;
  public rimGraphics: Phaser.GameObjects.Graphics | null = null;
  public liquidGraphics: Phaser.GameObjects.Graphics | null = null;
  public handleGraphics: Phaser.GameObjects.Graphics | null = null;

  // 动画对象
  protected steamPuffs: Phaser.GameObjects.Graphics[] = [];
  protected steamTweens: Phaser.Tweens.Tween[] = [];
  protected ladleContainer: Phaser.GameObjects.Container | null = null;
  protected ladleTween: Phaser.Tweens.Tween | null = null;
  protected liquidTween: Phaser.Tweens.Tween | null = null;

  // 颜色常量 (对应设计稿CSS)
  public static readonly COLORS = {
    potDark: 0x3a1a0a,     // 罐身暗色
    potMid: 0x5a2e18,      // 罐身中间色
    potLight: 0x7a4422,    // 罐身亮色
    rimTop: 0x7a4422,      // 边缘顶部
    rimMid: 0x3a1a0a,      // 边缘中间
    rimBot: 0x5a2e18,      // 边缘底部
    liquidTop: 0x4a2010,   // 药液表面
    liquidBot: 0x6a3a1a,   // 药液底部
    steamColor: 0xf0e6d2,  // 蒸汽色
  };

  constructor(scene: Phaser.Scene, config: PotVisualConfig) {
    this.scene = scene;
    this.width = config.width;
    this.height = config.height;
    this.pixelSize = config.pixelSize ?? 6;
    this.showSteam = config.showSteam ?? true;
    this.showLadle = config.showLadle ?? true;

    // 创建容器
    this.container = scene.add.container(0, 0);
    scene.add.existing(this.container);

    // 绘制各层
    this.drawPotBody();
    this.drawPotRim();
    this.drawLiquidSurface();
    this.drawHandles();

    // 创建动画
    if (this.showSteam) {
      this.createSteamParticles();
    }
    if (this.showLadle) {
      this.createLadle();
    }
  }

  // 骨架方法 - 后续Task实现
  protected drawPotBody(): void {
    this.bodyGraphics = this.scene.add.graphics();
    this.container.add(this.bodyGraphics);
  }

  protected drawPotRim(): void {
    this.rimGraphics = this.scene.add.graphics();
    this.container.add(this.rimGraphics);
  }

  protected drawLiquidSurface(): void {
    this.liquidGraphics = this.scene.add.graphics();
    this.container.add(this.liquidGraphics);
  }

  protected drawHandles(): void {
    this.handleGraphics = this.scene.add.graphics();
    this.container.add(this.handleGraphics);
  }

  protected createSteamParticles(): void {}
  protected createLadle(): void {}

  destroy(): void {
    this.steamTweens.forEach(t => t.stop());
    if (this.ladleTween) this.ladleTween.stop();
    if (this.liquidTween) this.liquidTween.stop();

    // Explicitly destroy graphics and null out references
    if (this.bodyGraphics) { this.bodyGraphics.destroy(); this.bodyGraphics = null; }
    if (this.rimGraphics) { this.rimGraphics.destroy(); this.rimGraphics = null; }
    if (this.liquidGraphics) { this.liquidGraphics.destroy(); this.liquidGraphics = null; }
    if (this.handleGraphics) { this.handleGraphics.destroy(); this.handleGraphics = null; }

    this.container.destroy();
  }
}