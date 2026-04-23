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

  /**
   * 绘制罐身 - 水平渐变效果
   * CSS对应: linear-gradient(90deg, #3a1a0a 0%, #5a2e18 25%, #7a4422 50%, #5a2e18 75%, #3a1a0a 100%)
   */
  protected drawPotBody(): void {
    this.bodyGraphics = this.scene.add.graphics();
    this.container.add(this.bodyGraphics);

    const px = this.pixelSize;
    const bodyWidth = this.width;    // 44px * 6 = 264
    const bodyHeight = px * 22;      // 22px * 6 = 132
    const x = -bodyWidth / 2;
    const y = -bodyHeight;           // 罐身底部在容器中心下方

    // Step 1: 绘制罐身水平渐变 (对应CSS: linear-gradient 90deg)
    // #3a1a0a → #5a2e18 → #7a4422 → #5a2e18 → #3a1a0a
    const gradientSteps = 8;
    const stepWidth = bodyWidth / gradientSteps;
    const gradientColors = [
      PotVisualComponent.COLORS.potDark,   // 0%
      0x4a2410,                            // 12.5%
      PotVisualComponent.COLORS.potMid,    // 25%
      0x6a3a1c,                            // 37.5%
      PotVisualComponent.COLORS.potLight,  // 50%
      0x6a3a1c,                            // 62.5%
      PotVisualComponent.COLORS.potMid,    // 75%
      PotVisualComponent.COLORS.potDark,   // 100%
    ];

    gradientColors.forEach((color, i) => {
      this.bodyGraphics.fillStyle(color, 1);
      this.bodyGraphics.fillRect(x + i * stepWidth, y, stepWidth + 1, bodyHeight);
    });

    // Step 2: 绘制圆底 (对应CSS: border-radius 0 0 40% 40%)
    // 使用弧形绘制底部
    this.bodyGraphics.fillStyle(PotVisualComponent.COLORS.potDark, 1);
    this.bodyGraphics.fillRoundedRect(
      x, y + bodyHeight - px * 10,
      bodyWidth, px * 10,
      { tl: 0, tr: 0, bl: bodyWidth * 0.4, br: bodyWidth * 0.4 }
    );

    // Step 3: 绘制内阴影 (对应CSS: inset -4px -4px 0 rgba(0,0,0,.5))
    this.bodyGraphics.fillStyle(0x000000, 0.5);
    this.bodyGraphics.fillRect(x + bodyWidth - px * 4, y, px * 4, bodyHeight);
    this.bodyGraphics.fillRect(x, y + bodyHeight - px * 4, bodyWidth, px * 4);
  }

  /**
   * 绘制罐口边缘 - 垂直渐变效果
   * CSS对应: linear-gradient(180deg, #7a4422 0%, #3a1a0a 50%, #5a2e18 100%)
   */
  protected drawPotRim(): void {
    this.rimGraphics = this.scene.add.graphics();
    this.container.add(this.rimGraphics);

    const px = this.pixelSize;
    const rimWidth = this.width + px * 8;  // 52px * 6 = 312 (比罐身宽)
    const rimHeight = px * 8;              // 8px * 6 = 48
    const x = -rimWidth / 2;
    const y = -this.height;                // 罐口顶部

    // 绘制边缘渐变 (对应CSS: linear-gradient 180deg)
    const gradientColors = [
      PotVisualComponent.COLORS.rimTop,    // 0%: #7a4422
      PotVisualComponent.COLORS.rimMid,    // 50%: #3a1a0a
      PotVisualComponent.COLORS.rimBot,    // 100%: #5a2e18
    ];

    const stepHeight = rimHeight / gradientColors.length;
    gradientColors.forEach((color, i) => {
      this.rimGraphics.fillStyle(color, 1);
      this.rimGraphics.fillRect(x, y + i * stepHeight, rimWidth, stepHeight + 1);
    });

    // 边缘高光 (对应CSS: inset 0 2px 0 rgba(200,120,60,.4))
    this.rimGraphics.fillStyle(0xc8783c, 0.4);
    this.rimGraphics.fillRect(x, y, rimWidth, px * 2);
  }

  /**
   * 绘制药液表面 - 水平渐变 + 波纹条纹效果
   * CSS对应: linear-gradient(180deg), repeating-linear-gradient(条纹)
   * 动画对应: liquidRipple 3s linear infinite
   */
  protected drawLiquidSurface(): void {
    this.liquidGraphics = this.scene.add.graphics();
    this.container.add(this.liquidGraphics);

    const px = this.pixelSize;
    const liquidWidth = this.width + px * 2;  // 38px * 6 = 228 (稍窄于罐口)
    const liquidHeight = px * 5;              // 5px * 6 = 30
    const x = -liquidWidth / 2;
    const y = -this.height + px * 12;         // 边缘下方

    // Step 1: 绘制药液渐变 (对应CSS: linear-gradient 180deg)
    const gradientColors = [
      PotVisualComponent.COLORS.liquidTop,   // 顶部暗色
      PotVisualComponent.COLORS.liquidBot,   // 底部亮色
    ];

    gradientColors.forEach((color, i) => {
      this.liquidGraphics.fillStyle(color, 1);
      this.liquidGraphics.fillRect(x, y + i * liquidHeight / 2, liquidWidth, liquidHeight / 2 + 1);
    });

    // Step 2: 波纹条纹效果 (对应CSS: repeating-linear-gradient)
    this.liquidGraphics.fillStyle(0xffd282, 0.3);
    for (let i = 0; i < liquidWidth; i += px * 10) {
      this.liquidGraphics.fillRect(x + i, y, px * 2, liquidHeight);
    }

    // Step 3: 椭圆形表面光泽
    this.liquidGraphics.fillStyle(PotVisualComponent.COLORS.liquidTop, 0.8);
    this.liquidGraphics.fillEllipse(x + liquidWidth / 2, y + liquidHeight / 2, liquidWidth, liquidHeight);

    // Step 4: 波纹动画 (对应CSS: liquidRipple 3s linear infinite)
    this.liquidTween = this.scene.tweens.add({
      targets: this.liquidGraphics,
      x: { from: x, to: x - px * 10 },
      duration: 3000,
      ease: 'Linear',
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * 绘制把手 - 左右两侧
   * CSS对应: .pot-handle.l, .pot-handle.r
   */
  protected drawHandles(): void {
    this.handleGraphics = this.scene.add.graphics();
    this.container.add(this.handleGraphics);

    const px = this.pixelSize;
    const handleWidth = px * 3;   // 18
    const handleHeight = px * 4;  // 24
    const bodyWidth = this.width;

    // 左把手 (对应CSS: .pot-handle.l)
    const leftX = -bodyWidth / 2 - px * 4;
    const handleY = -this.height + px * 14;

    this.handleGraphics.fillStyle(PotVisualComponent.COLORS.potDark, 1);
    this.handleGraphics.fillRect(leftX, handleY, handleWidth, handleHeight);
    this.handleGraphics.lineStyle(2, 0x2a1408, 1);
    this.handleGraphics.strokeRect(leftX, handleY, handleWidth, handleHeight);

    // 右把手 (对应CSS: .pot-handle.r)
    const rightX = bodyWidth / 2 + px * 1;
    this.handleGraphics.fillStyle(PotVisualComponent.COLORS.potDark, 1);
    this.handleGraphics.fillRect(rightX, handleY, handleWidth, handleHeight);
    this.handleGraphics.lineStyle(2, 0x2a1408, 1);
    this.handleGraphics.strokeRect(rightX, handleY, handleWidth, handleHeight);
  }

  /**
   * 创建蒸汽粒子 - 5团蒸汽，各有不同位置和延迟
   * CSS对应: .steam-puff.s1/s2/s3/s4/s5, steamRise 3.2s ease-out infinite
   */
  protected createSteamParticles(): void {
    if (!this.showSteam) return;

    const px = this.pixelSize;

    // 蒸汽配置 (对应CSS: .steam-puff.s1/s2/s3/s4/s5)
    const steamConfigs = [
      { left: -px * 14, delay: 0, dx: px * 15 },      // s1
      { left: -px * 2, delay: 600, dx: px * 20 },     // s2
      { left: px * 10, delay: 1200, dx: px * 10 },    // s3
      { left: -px * 10, delay: 1800, dx: px * 25 },   // s4
      { left: px * 2, delay: 2400, dx: px * 5 },      // s5
    ];

    const baseY = -this.height - px * 10;  // 罐口上方

    steamConfigs.forEach(config => {
      const steamGraphics = this.scene.add.graphics();
      this.container.add(steamGraphics);

      // 绘制蒸汽团 (对应CSS: radial-gradient circle)
      const puffRadius = px * 11;  // 22px / 2 * 6 = 66

      // 渐变蒸汽 - 多层同心圆模拟径向渐变
      const gradientRings = [
        { radius: puffRadius, color: PotVisualComponent.COLORS.steamColor, alpha: 0.85 },
        { radius: puffRadius * 0.5, color: PotVisualComponent.COLORS.steamColor, alpha: 0.4 },
        { radius: puffRadius * 0.2, color: PotVisualComponent.COLORS.steamColor, alpha: 0 },
      ];

      gradientRings.forEach(ring => {
        steamGraphics.fillStyle(ring.color, ring.alpha);
        steamGraphics.fillCircle(config.left, baseY, ring.radius);
      });

      // 初始状态 (对应CSS: opacity 0, scale 0.4)
      steamGraphics.setAlpha(0);
      steamGraphics.setScale(0.4);
      this.steamPuffs.push(steamGraphics);

      // 蒸汽上升动画 (对应CSS: steamRise 3.2s ease-out infinite)
      const tween = this.scene.tweens.add({
        targets: steamGraphics,
        y: baseY - px * 120,  // 上升120px
        x: config.left + config.dx,  // 水平漂移
        scale: 1.8,
        alpha: { from: 0, to: 0.8 },
        duration: 3200,
        delay: config.delay,
        ease: 'Sine.easeOut',
        repeat: -1,
      });

      this.steamTweens.push(tween);
    });
  }
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