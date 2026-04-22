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
    // brickGraphics已在构造函数中创建，无需重新创建

    const brickWidth = this.width;       // 60px * 6 = 360
    const brickHeight = this.height;     // 34px * 6 = 204
    const px = this.pixelSize;           // 6

    // 计算相对于容器中心的坐标 (容器在炉灶底部)
    const x = -brickWidth / 2;
    const y = -brickHeight;

    // Step 1: 绘制砖墙主体渐变 (对应CSS: linear-gradient 180deg)
    const gradientSteps = 10;
    const stepHeight = brickHeight / gradientSteps;
    const gradientColors = [
      HearthVisualComponent.COLORS.brickLight,  // 0%: #8a5a2a
      0x7a4a28,                                   // 20%
      HearthVisualComponent.COLORS.brickMid,     // 50%: #5a3020
      0x4a2818,                                   // 70%
      HearthVisualComponent.COLORS.brickDark,    // 100%: #3f2412
    ];

    for (let i = 0; i < gradientSteps; i++) {
      const progress = i / gradientSteps;
      const colorIndex = Math.floor(progress * (gradientColors.length - 1));
      const nextColorIndex = Math.min(colorIndex + 1, gradientColors.length - 1);
      const blend = (progress * (gradientColors.length - 1)) - colorIndex;

      const color = this.blendColors(
        gradientColors[colorIndex],
        gradientColors[nextColorIndex],
        blend
      );

      this.brickGraphics!.fillStyle(color, 1);
      this.brickGraphics!.fillRect(x, y + i * stepHeight, brickWidth, stepHeight + 1);
    }

    // Step 2: 绘制灰缝网格
    const mortarWidth = px * 2;      // 12
    const mortarSpacing = px * 10;   // 60
    const mortarHeight = px * 2;     // 12

    // 奇数行灰缝
    this.brickGraphics!.fillStyle(HearthVisualComponent.COLORS.mortarColor, 1);
    for (let row = 0; row < 3; row++) {
      const rowY = y + row * mortarSpacing;
      for (let col = 0; col <= 6; col++) {
        const colX = x + col * mortarSpacing;
        this.brickGraphics!.fillRect(colX, rowY, mortarWidth, mortarHeight);
      }
    }

    // 偶数行灰缝 (错开半格)
    const offset = px * 5;  // 30
    for (let row = 3; row < 6; row++) {
      const rowY = y + row * mortarSpacing;
      for (let col = 0; col <= 5; col++) {
        const colX = x + offset + col * mortarSpacing;
        this.brickGraphics!.fillRect(colX, rowY, mortarWidth, mortarHeight);
      }
    }

    // Step 3: 绘制外阴影
    this.brickGraphics!.fillStyle(0x000000, 0.6);
    this.brickGraphics!.fillRect(x + brickWidth, y + 3, px * 3, brickHeight);
    this.brickGraphics!.fillRect(x + 3, y + brickHeight, brickWidth, px * 3);

    // Step 4: 绘制内阴影底部
    this.brickGraphics!.fillStyle(0x000000, 0.4);
    this.brickGraphics!.fillRect(x, y + brickHeight - px * 3, brickWidth, px * 3);
  }

  /**
   * 混合两个颜色
   */
  protected blendColors(color1: number, color2: number, ratio: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;
    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return (r << 16) | (g << 8) | b;
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