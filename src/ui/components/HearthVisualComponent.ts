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
    brickMid20: 0x7a4a28,    // 20% 渐变过渡色
    brickMid: 0x5a3020,      // 中间色 (50%)
    brickMid70: 0x4a2818,    // 70% 渐变过渡色
    brickDark: 0x3f2412,     // --brick-dark
    mortarColor: 0x2a1408,   // 灰缝颜色
    emberCore: 0xffd24a,     // --ember-core 金色
    emberOuter: 0xff7a1a,    // --ember 橙色
    cinnabar: 0xb8322c,      // --cinnabar 红色
    fireCore: 0xfff1a8,      // 火焰核心白黄色
  };

  // 砖墙渐变颜色序列
  protected static readonly BRICK_GRADIENT_COLORS = [
    HearthVisualComponent.COLORS.brickLight,   // 0%
    HearthVisualComponent.COLORS.brickMid20,   // 20%
    HearthVisualComponent.COLORS.brickMid,     // 50%
    HearthVisualComponent.COLORS.brickMid70,   // 70%
    HearthVisualComponent.COLORS.brickDark,    // 100%
  ];

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
    // 创建阴影Graphics对象
    this.shadowGraphics = this.scene.add.graphics();
    this.container.add(this.shadowGraphics);

    const px = this.pixelSize;
    const shadowWidth = this.width + px * 4;  // 比砖墙宽 (360 + 24 = 384)
    const shadowHeight = px * 2;              // 12
    const x = -shadowWidth / 2;               // 居中
    const y = px * 2;                         // 炉灶底部下方

    // 绘制椭圆形阴影 (对应CSS: radial-gradient ellipse)
    const centerX = x + shadowWidth / 2;
    const centerY = y;

    // 渐变阴影 - 从外到内 (多层叠加模拟径向渐变)
    const gradientRings = [
      { radiusX: shadowWidth / 2, radiusY: shadowHeight, color: 0x000000, alpha: 0.5 },
      { radiusX: shadowWidth / 2 * 0.7, radiusY: shadowHeight * 0.7, color: 0x000000, alpha: 0.3 },
      { radiusX: shadowWidth / 2 * 0.3, radiusY: shadowHeight * 0.3, color: 0x000000, alpha: 0.1 },
    ];

    // 绘制多层椭圆阴影
    gradientRings.forEach(ring => {
      this.shadowGraphics!.fillStyle(ring.color, ring.alpha);
      this.shadowGraphics!.fillEllipse(centerX, centerY, ring.radiusX * 2, ring.radiusY * 2);
    });
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
    const gradientColors = HearthVisualComponent.BRICK_GRADIENT_COLORS;

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
    // 创建顶板Graphics对象
    this.topGraphics = this.scene.add.graphics();
    this.container.add(this.topGraphics);

    const brickWidth = this.width;       // 360
    const brickHeight = this.height;     // 204
    const px = this.pixelSize;           // 6

    // 顶板比砖墙宽8px (左右各4px)
    const topWidth = brickWidth + px * 8;  // 360 + 48 = 408
    const topHeight = px * 3;              // 18
    const x = -topWidth / 2;               // 居中
    const y = -brickHeight - topHeight;    // 在砖墙上方

    // Step 1: 绘制顶板渐变 (对应CSS: linear-gradient 180deg)
    // Colors: #4a2818 → #3a2010 → #2a1408
    const topGradientColors = [
      HearthVisualComponent.COLORS.brickMid70, // #4a2818 (top)
      0x3a2010,                                  // 中间过渡色
      HearthVisualComponent.COLORS.mortarColor, // #2a1408 (bottom)
    ];

    const gradientSteps = 3;
    const stepHeight = topHeight / gradientSteps;

    for (let i = 0; i < gradientSteps; i++) {
      const progress = i / gradientSteps;
      const colorIndex = Math.floor(progress * (topGradientColors.length - 1));
      const nextColorIndex = Math.min(colorIndex + 1, topGradientColors.length - 1);
      const blend = (progress * (topGradientColors.length - 1)) - colorIndex;

      const color = this.blendColors(
        topGradientColors[colorIndex],
        topGradientColors[nextColorIndex],
        blend
      );

      this.topGraphics!.fillStyle(color, 1);
      this.topGraphics!.fillRect(x, y + i * stepHeight, topWidth, stepHeight + 1);
    }

    // Step 2: 绘制顶板边框 (灰缝颜色)
    this.topGraphics!.lineStyle(px, HearthVisualComponent.COLORS.mortarColor, 1);
    this.topGraphics!.strokeRect(x, y, topWidth, topHeight);
  }

  protected drawFireHole(): void {
    // 创建火焰开口Graphics对象
    this.fireHoleGraphics = this.scene.add.graphics();
    this.container.add(this.fireHoleGraphics);

    const brickHeight = this.height;     // 204
    const px = this.pixelSize;           // 6

    // 火焰开口尺寸 (24px宽, 16px高)
    const holeWidth = px * 24;   // 144
    const holeHeight = px * 16;  // 96
    const x = -holeWidth / 2;    // 居中
    const y = -brickHeight + px * 6;  // 从顶部向下偏移

    // Step 1: 绘制火焰开口背景 (黑色)
    this.fireHoleGraphics!.fillStyle(0x000000, 1);
    this.fireHoleGraphics!.fillRect(x, y, holeWidth, holeHeight);

    // Step 2: 绘制径向渐变效果 (同心椭圆)
    // Colors: black → cinnabar → emberOuter → emberCore
    const radialColors = [
      { color: 0x000000, radius: 1.0 },       // 最外层黑色
      { color: HearthVisualComponent.COLORS.cinnabar, radius: 0.7 }, // 红色层
      { color: HearthVisualComponent.COLORS.emberOuter, radius: 0.4 }, // 橙色层
      { color: HearthVisualComponent.COLORS.emberCore, radius: 0.15 }, // 金色核心
    ];

    // 绘制同心椭圆模拟径向渐变
    for (let i = radialColors.length - 1; i >= 0; i--) {
      const layer = radialColors[i];
      const layerWidth = holeWidth * layer.radius;
      const layerHeight = holeHeight * layer.radius;
      const layerX = x + (holeWidth - layerWidth) / 2;
      const layerY = y + (holeHeight - layerHeight) / 2;

      this.fireHoleGraphics!.fillStyle(layer.color, 1);
      this.fireHoleGraphics!.fillRect(layerX, layerY, layerWidth, layerHeight);
    }

    // Step 3: 绘制开口边框 (拱形效果 - 圆角顶部)
    this.fireHoleGraphics!.lineStyle(px, HearthVisualComponent.COLORS.mortarColor, 1);

    // 拱形边框: 左竖线、顶部弧线、右竖线、底部横线
    this.fireHoleGraphics!.beginPath();
    // 左竖线
    this.fireHoleGraphics!.moveTo(x, y + holeHeight);
    this.fireHoleGraphics!.lineTo(x, y + px * 2);  // 留出顶部圆角空间
    // 顶部弧线 (模拟圆角)
    this.fireHoleGraphics!.lineTo(x + px * 4, y);  // 左圆角
    this.fireHoleGraphics!.lineTo(x + holeWidth - px * 4, y);  // 顶边
    this.fireHoleGraphics!.lineTo(x + holeWidth, y + px * 2);  // 右圆角
    // 右竖线
    this.fireHoleGraphics!.lineTo(x + holeWidth, y + holeHeight);
    this.fireHoleGraphics!.strokePath();
  }
  protected createFlames(): void {
    const brickHeight = this.height;     // 204
    const px = this.pixelSize;           // 6

    // 火焰开口尺寸 (参考drawFireHole)
    const holeWidth = px * 24;   // 144
    const holeHeight = px * 16;  // 96
    const holeX = -holeWidth / 2;  // 居中 (-72)
    const holeY = -brickHeight + px * 6;  // 火焰开口顶部位置

    // 4个火焰配置 (不同尺寸、位置、动画延迟)
    const flameConfigs = [
      { height: px * 26, width: px * 12, leftPercent: 16, delay: 0 },    // f1: 156×72
      { height: px * 32, width: px * 14, leftPercent: 38, delay: 150 },  // f2: 192×84 (最高)
      { height: px * 28, width: px * 12, leftPercent: 58, delay: 300 },  // f3: 168×72
      { height: px * 22, width: px * 10, leftPercent: 78, delay: 50 },   // f4: 132×60 (最小)
    ];

    // 创建每个火焰
    flameConfigs.forEach((config) => {
      const flame = this.scene.add.graphics();
      this.container.add(flame);

      // 计算火焰位置 (相对于火焰开口底部)
      const flameX = holeX + holeWidth * config.leftPercent / 100 - config.width / 2;
      const flameBaseY = holeY + holeHeight;  // 火焰开口底部

      // 绘制火焰 (渐变效果: cinnabar → emberOuter → emberCore → fireCore)
      this.drawFlame(flame, flameX, flameBaseY, config.width, config.height);

      // 火焰发光效果
      this.drawFlameGlow(flame, flameX, flameBaseY, config.width, config.height);

      this.flames.push(flame);

      // 创建火焰跳动动画
      const tween = this.scene.tweens.add({
        targets: flame,
        scaleY: 1.15,       // 高度增长15%
        scaleX: 0.85,       // 宽度收缩15%
        y: flameBaseY - px * 3,  // 向上移动3个像素单位
        duration: 800,
        delay: config.delay,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.flameTweens.push(tween);
    });
  }

  /**
   * 绘制单个火焰形状
   */
  protected drawFlame(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    baseY: number,
    width: number,
    height: number
  ): void {
    const COLORS = HearthVisualComponent.COLORS;

    // 火焰形状: 底部宽，顶部尖 (三角形 + 弧线)
    // 从底部向上绘制渐变层

    // 底层: cinnabar (红色) - 最宽
    graphics.fillStyle(COLORS.cinnabar, 0.8);
    graphics.beginPath();
    graphics.moveTo(x, baseY);
    graphics.lineTo(x + width, baseY);
    graphics.lineTo(x + width / 2, baseY - height * 0.6);
    graphics.closePath();
    graphics.fillPath();

    // 中层: emberOuter (橙色) - 较窄
    const midWidth = width * 0.7;
    const midHeight = height * 0.75;
    graphics.fillStyle(COLORS.emberOuter, 0.9);
    graphics.beginPath();
    graphics.moveTo(x + (width - midWidth) / 2, baseY);
    graphics.lineTo(x + (width + midWidth) / 2, baseY);
    graphics.lineTo(x + width / 2, baseY - midHeight);
    graphics.closePath();
    graphics.fillPath();

    // 核心: emberCore (金色) - 更窄
    const coreWidth = width * 0.4;
    const coreHeight = height * 0.85;
    graphics.fillStyle(COLORS.emberCore, 1);
    graphics.beginPath();
    graphics.moveTo(x + (width - coreWidth) / 2, baseY);
    graphics.lineTo(x + (width + coreWidth) / 2, baseY);
    graphics.lineTo(x + width / 2, baseY - coreHeight);
    graphics.closePath();
    graphics.fillPath();

    // 最内层: fireCore (白黄色) - 最亮
    const innerWidth = width * 0.2;
    const innerHeight = height * 0.95;
    graphics.fillStyle(COLORS.fireCore, 1);
    graphics.beginPath();
    graphics.moveTo(x + (width - innerWidth) / 2, baseY);
    graphics.lineTo(x + (width + innerWidth) / 2, baseY);
    graphics.lineTo(x + width / 2, baseY - innerHeight);
    graphics.closePath();
    graphics.fillPath();
  }

  /**
   * 绘制火焰发光效果 (模拟发光阴影)
   */
  protected drawFlameGlow(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    baseY: number,
    width: number,
    height: number
  ): void {
    const COLORS = HearthVisualComponent.COLORS;

    // 发光效果: 在火焰周围绘制半透明的橙色光晕
    graphics.fillStyle(COLORS.emberOuter, 0.3);
    graphics.beginPath();
    // 比火焰本体宽一些
    const glowWidth = width * 1.3;
    const glowHeight = height * 0.5;
    graphics.moveTo(x - (glowWidth - width) / 2, baseY);
    graphics.lineTo(x + width + (glowWidth - width) / 2, baseY);
    graphics.lineTo(x + width / 2, baseY - glowHeight);
    graphics.closePath();
    graphics.fillPath();
  }
  protected createEmberParticles(): void {
    if (!this.animated) return;

    const px = this.pixelSize;
    const brickHeight = this.height;     // 204
    const holeWidth = px * 24;           // 144
    const holeHeight = px * 16;          // 96
    const holeY = -brickHeight + px * 6; // 火焰开口顶部位置
    const baseY = holeY + holeHeight;    // 火焰开口底部

    // 创建粒子纹理 (小圆形火星)
    const particleKey = 'emberParticle';
    if (!this.scene.textures.exists(particleKey)) {
      // 创建小圆形粒子纹理
      const particleGraphics = this.scene.add.graphics();
      particleGraphics.fillStyle(HearthVisualComponent.COLORS.emberCore, 1);
      particleGraphics.fillCircle(3, 3, 3);
      particleGraphics.generateTexture(particleKey, 6, 6);
      particleGraphics.destroy();
    }

    // 创建粒子发射器 (对应CSS: emberRise 2.2s linear infinite)
    // 火星从火焰开口底部升起，向上飘散
    this.emberParticles = this.scene.add.particles(0, baseY, particleKey, {
      x: { min: -holeWidth / 2 + px * 2, max: holeWidth / 2 - px * 2 },  // 从火焰开口范围内随机x位置
      lifespan: 2200,           // 2.2s (对应CSS动画时长)
      speedY: { min: -60, max: -80 },  // 向上升起速度
      speedX: { min: -20, max: 20 },   // 左右漂移
      scale: { start: 0.5, end: 0 },   // 从大到小消失
      alpha: { start: 1, end: 0 },     // 透明度渐变 (1→0)
      quantity: 2,                    // 每次发射数量
      frequency: 300,                 // 发射频率 (每300ms发射)
      blendMode: 'ADD',               // 发光效果 (叠加混合)
      tint: HearthVisualComponent.COLORS.emberCore,  // 金色火星
    });

    this.container.add(this.emberParticles);
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