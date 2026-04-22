import Phaser from 'phaser';

/**
 * 炉灶视觉配置
 */
export interface HearthVisualConfig {
  width: number;       // 炉灶总宽度 (像素单位，默认 360 = 60px * 6)
  height: number;      // 炉灶总高度 (像素单位，默认 204 = 34px * 6)
  pixelSize: number;   // 像素尺寸 (默认 6)
  animated?: boolean;  // 是否启用动画
}

/**
 * 炉灶视觉组件 - 1比1还原设计稿砖墙纹理
 *
 * CSS设计稿对应:
 * .stove-body - 砖墙主体
 * .stove-top - 炉灶顶板
 * .fire-hole - 火焰开口
 * .flame - 4个独立火焰
 * .ember-spark - 火星粒子
 * .stove-shadow - 地面阴影
 */
export default class HearthVisualComponent {
  protected scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  public width: number;
  public height: number;
  protected pixelSize: number;
  protected animated: boolean;

  // Graphics对象
  public brickGraphics: Phaser.GameObjects.Graphics | null = null;
  public shadowGraphics: Phaser.GameObjects.Graphics | null = null;
  public topGraphics: Phaser.GameObjects.Graphics | null = null;
  public fireHoleGraphics: Phaser.GameObjects.Graphics | null = null;

  // 动画对象
  protected flames: Phaser.GameObjects.Graphics[] = [];
  protected flameTweens: Phaser.Tweens.Tween[] = [];
  protected emberParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  // 颜色常量 (对应设计稿CSS变量)
  public static readonly COLORS = {
    brickLight: 0x8a5a2a,    // --brick-light
    brickMid: 0x5a3020,      // 中间色
    brickDark: 0x3f2412,     // --brick-dark
    mortarColor: 0x2a1408,   // 灰缝颜色
    emberCore: 0xffd24a,     // --ember-core 金色
    emberOuter: 0xff7a1a,    // --ember 橙色
    cinnabar: 0xb8322c,      // --cinnabar 红色
    fireCore: 0xfff1a8,      // 火焰核心白黄色
  };

  constructor(scene: Phaser.Scene, config: HearthVisualConfig) {
    this.scene = scene;
    this.width = config.width;
    this.height = config.height;
    this.pixelSize = config.pixelSize ?? 6;
    this.animated = config.animated ?? true;

    // 创建容器 (相对于父容器定位)
    this.container = scene.add.container(0, 0);
    scene.add.existing(this.container);

    // 创建砖墙Graphics对象
    this.brickGraphics = scene.add.graphics();
    this.container.add(this.brickGraphics);

    // 绘制各层 (后续Task将实现)
    this.drawGroundShadow();
    this.drawBrickTexture();
    this.drawStoveTop();
    this.drawFireHole();

    // 启动动画 (后续Task将实现)
    if (this.animated) {
      this.createFlames();
      this.createEmberParticles();
    }
  }

  // 后续方法将在后续Task中实现
  protected drawGroundShadow(): void {
    // TODO: Task 2 - 实现地面阴影
  }
  protected drawBrickTexture(): void {
    // TODO: Task 3 - 实现砖墙纹理
  }
  protected drawStoveTop(): void {
    // TODO: Task 4 - 实现炉灶顶板
  }
  protected drawFireHole(): void {
    // TODO: Task 5 - 实现火焰开口
  }
  protected createFlames(): void {
    // TODO: Task 6 - 实现火焰动画
  }
  protected createEmberParticles(): void {
    // TODO: Task 7 - 实现火星粒子
  }

  destroy(): void {
    this.flameTweens.forEach(t => t.stop());
    this.flameTweens = [];
    if (this.emberParticles) {
      this.emberParticles.destroy();
    }
    this.container.destroy();
  }
}