import Phaser from 'phaser';

export interface DragEffectTrailConfig {
  enabled: boolean;
  maxCount: number;
  fadeTime: number;
  particleSize: number;
}

export interface DragEffectSplashConfig {
  enabled: boolean;
  count: number;
  spread: number;
  riseHeight: number;
}

export interface DragEffectBurstSuccessConfig {
  text: string;
  color: string;
  duration: number;
}

export interface DragEffectBurstFailureConfig {
  showCross: boolean;
  showSmoke: boolean;
  duration: number;
}

export interface DragEffectConfig {
  trail?: Partial<DragEffectTrailConfig>;
  splash?: Partial<DragEffectSplashConfig>;
  burst?: {
    success?: Partial<DragEffectBurstSuccessConfig>;
    failure?: Partial<DragEffectBurstFailureConfig>;
  };
}

const DEFAULT_CONFIG: DragEffectConfig = {
  trail: {
    enabled: true,
    maxCount: 20,
    fadeTime: 600,
    particleSize: 4,
  },
  splash: {
    enabled: true,
    count: 8,
    spread: 40,
    riseHeight: 50,
  },
  burst: {
    success: {
      text: '合',
      color: '#ffd24a',
      duration: 1400,
    },
    failure: {
      showCross: true,
      showSmoke: true,
      duration: 1100,
    },
  },
};

// 颜色常量
const EFFECT_COLOR = {
  GOLD: 0xffd24a,
  GOLD_LIGHT: 0xfff3c0,
  RED: 0xff4a3a,
  CINNABAR: 0xb8322c,
  CINNABAR_DEEP: 0x8a1f1a,
  SMOKE: 0x281410,
};

export default class DragEffectManager {
  protected scene: Phaser.Scene;
  public config: Required<DragEffectConfig>;

  protected trailParticles: Phaser.GameObjects.Graphics[] = [];
  public isDragging: boolean = false;
  protected lastDragX: number = 0;
  protected lastDragY: number = 0;

  constructor(scene: Phaser.Scene, config?: DragEffectConfig) {
    this.scene = scene;
    this.config = this.mergeConfig(config);
  }

  protected mergeConfig(config?: DragEffectConfig): Required<DragEffectConfig> {
    return {
      trail: { ...DEFAULT_CONFIG.trail!, ...config?.trail },
      splash: { ...DEFAULT_CONFIG.splash!, ...config?.splash },
      burst: {
        success: { ...DEFAULT_CONFIG.burst!.success!, ...config?.burst?.success },
        failure: { ...DEFAULT_CONFIG.burst!.failure!, ...config?.burst?.failure },
      },
    } as Required<DragEffectConfig>;
  }

  public startDrag(x: number, y: number): void {
    this.isDragging = true;
    this.lastDragX = x;
    this.lastDragY = y;
  }

  public updateDrag(x: number, y: number): void {
    if (!this.isDragging || !this.config.trail.enabled) return;

    const dx = x - this.lastDragX;
    const dy = y - this.lastDragY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 8) {
      this.createTrailParticle(x, y);
      this.lastDragX = x;
      this.lastDragY = y;
    }
  }

  protected createTrailParticle(x: number, y: number): void {
    while (this.trailParticles.length >= this.config.trail.maxCount) {
      const oldest = this.trailParticles.shift();
      if (oldest) oldest.destroy();
    }

    const particle = this.scene.add.graphics();
    particle.fillStyle(EFFECT_COLOR.GOLD, 1);
    particle.fillCircle(0, 0, this.config.trail.particleSize);
    particle.setPosition(x, y);

    this.scene.tweens.add({
      targets: particle,
      alpha: 0,
      scale: 0.2,
      duration: this.config.trail.fadeTime,
      onComplete: () => {
        particle.destroy();
        const index = this.trailParticles.indexOf(particle);
        if (index >= 0) this.trailParticles.splice(index, 1);
      },
    });

    this.trailParticles.push(particle);
  }

  public endDrop(x: number, y: number, result: 'success' | 'failure'): void {
    this.isDragging = false;
    this.clearTrail();

    if (this.config.splash.enabled) {
      this.createSplash(x, y);
    }

    if (result === 'success') {
      this.createSuccessBurst(x, y);
    } else {
      this.createFailureBurst(x, y);
    }
  }

  protected createSplash(x: number, y: number): void {
    for (let i = 0; i < this.config.splash.count; i++) {
      const angle = (Math.PI * 2 / this.config.splash.count) * i + Math.random() * 0.5;
      const spread = this.config.splash.spread * (0.5 + Math.random() * 0.5);

      const targetX = x + Math.cos(angle) * spread;
      const targetY = y - this.config.splash.riseHeight + Math.sin(angle) * spread * 0.5;

      const splash = this.scene.add.graphics();
      splash.fillStyle(0xc89550, 1);
      splash.fillCircle(0, 0, 4);
      splash.setPosition(x, y);

      this.scene.tweens.add({
        targets: splash,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.2,
        duration: 800,
        onComplete: () => splash.destroy(),
      });
    }
  }

  protected createSuccessBurst(x: number, y: number): void {
    // 金色光芒圆环
    for (let i = 0; i < 2; i++) {
      const ring = this.scene.add.graphics();
      ring.lineStyle(3 + i * 2, EFFECT_COLOR.GOLD, 1);
      ring.strokeCircle(0, 0, 10);
      ring.setPosition(x, y);

      this.scene.tweens.add({
        targets: ring,
        scale: 7 + i * 2,
        alpha: 0,
        duration: 700 + i * 200,
        onComplete: () => ring.destroy(),
      });
    }

    // 印章 "合"
    const stamp = this.scene.add.text(x, y, this.config.burst.success.text, {
      fontSize: '22px',
      fontFamily: 'Noto Serif SC',
      color: '#ffd24a',
      backgroundColor: '#8a1f1a',
      padding: { x: 8, y: 8 },
      fontWeight: '900',
    } as Phaser.Types.GameObjects.Text.TextStyle);
    stamp.setOrigin(0.5, 0.5);
    stamp.setRotation(-0.07);

    this.scene.tweens.add({
      targets: stamp,
      scale: { from: 0, to: 1.3 },
      alpha: { from: 0, to: 1 },
      duration: 300,
      yoyo: true,
      hold: 400,
      onComplete: () => stamp.destroy(),
    });

    // 金色火花
    for (let i = 0; i < 8; i++) {
      const spark = this.scene.add.graphics();
      spark.fillStyle(EFFECT_COLOR.GOLD, 1);
      spark.fillCircle(0, 0, 3);
      spark.setPosition(x, y);

      const angle = (Math.PI * 2 / 8) * i;
      const distance = 60 + Math.random() * 40;

      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 1000,
        onComplete: () => spark.destroy(),
      });
    }
  }

  protected createFailureBurst(x: number, y: number): void {
    // 红X
    if (this.config.burst.failure.showCross) {
      const crossGraphics = this.scene.add.graphics();
      crossGraphics.setPosition(x, y);

      crossGraphics.lineStyle(8, EFFECT_COLOR.RED, 1);
      crossGraphics.beginPath();
      crossGraphics.moveTo(-28, -28);
      crossGraphics.lineTo(28, 28);
      crossGraphics.moveTo(28, -28);
      crossGraphics.lineTo(-28, 28);
      crossGraphics.strokePath();

      this.scene.tweens.add({
        targets: crossGraphics,
        scale: { from: 0.3, to: 1 },
        alpha: { from: 0, to: 1 },
        duration: 300,
        yoyo: true,
        hold: 300,
        onComplete: () => crossGraphics.destroy(),
      });
    }

    // 烟雾
    if (this.config.burst.failure.showSmoke) {
      const smoke = this.scene.add.graphics();
      smoke.fillStyle(EFFECT_COLOR.SMOKE, 0.7);
      smoke.fillCircle(0, 0, 30);
      smoke.setPosition(x, y);

      this.scene.tweens.add({
        targets: smoke,
        scale: 2,
        alpha: 0,
        y: y - 60,
        duration: 1100,
        onComplete: () => smoke.destroy(),
      });
    }

    // 红色火花
    for (let i = 0; i < 6; i++) {
      const spark = this.scene.add.graphics();
      spark.fillStyle(EFFECT_COLOR.RED, 1);
      spark.fillCircle(0, 0, 3);
      spark.setPosition(x, y);

      const angle = (Math.PI * 2 / 6) * i + Math.random() * 0.5;
      const distance = 50 + Math.random() * 30;

      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 1000,
        onComplete: () => spark.destroy(),
      });
    }
  }

  protected clearTrail(): void {
    for (const particle of this.trailParticles) {
      particle.destroy();
    }
    this.trailParticles = [];
  }

  public destroy(): void {
    this.clearTrail();
  }
}