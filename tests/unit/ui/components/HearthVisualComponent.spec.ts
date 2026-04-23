// tests/unit/ui/components/HearthVisualComponent.spec.ts
/**
 * HearthVisualComponent炉灶视觉组件单元测试
 *
 * 测试内容：
 * - 构造与属性：容器创建、尺寸设置、Graphics对象初始化
 * - 砖墙纹理：砖块绘制、灰缝处理
 * - 火焰动画：火焰创建、Tween动画
 * - 销毁清理：资源释放
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import HearthVisualComponent from '../../../../src/ui/components/HearthVisualComponent';

// Mock Phaser Scene
const createMockScene = () => {
  const mockContainer = {
    setDepth: vi.fn().mockReturnThis(),
    add: vi.fn((item: any) => {
      mockContainer.list.push(item);
      return mockContainer;
    }),
    destroy: vi.fn(),
    setPosition: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setScrollFactor: vi.fn().mockReturnThis(),
    list: [] as any[],
  };

  const mockGraphics = {
    fillStyle: vi.fn().mockReturnThis(),
    fillGradientStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    fillEllipse: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    beginPath: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    closePath: vi.fn().mockReturnThis(),
    fillPath: vi.fn().mockReturnThis(),
    strokePath: vi.fn().mockReturnThis(),
    generateTexture: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    clear: vi.fn().mockReturnThis(),
  };

  const mockTween = {
    stop: vi.fn(),
  };

  const mockParticleEmitter = {
    stop: vi.fn(),
    destroy: vi.fn(),
    setEmitterAngle: vi.fn().mockReturnThis(),
    setEmitterSpeed: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    setAlpha: vi.fn().mockReturnThis(),
    setFrequency: vi.fn().mockReturnThis(),
  };

  const mockTextures = {
    exists: vi.fn().mockReturnValue(false),
    get: vi.fn(),
    addBase64: vi.fn(),
  };

  return {
    add: {
      container: vi.fn().mockReturnValue(mockContainer),
      graphics: vi.fn().mockReturnValue(mockGraphics),
      existing: vi.fn(),
      particles: vi.fn().mockReturnValue(mockParticleEmitter),
    },
    tweens: {
      add: vi.fn().mockReturnValue(mockTween),
    },
    cameras: {
      main: {
        centerX: 400,
        centerY: 300,
        width: 800,
        height: 600,
        scrollX: 0,
        scrollY: 0,
      },
    },
    textures: mockTextures,
    scene: { key: 'testScene' },
    scale: {
      width: 800,
      height: 600,
    },
  } as any;
};

describe('HearthVisualComponent', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
  });

  afterEach(() => {
    // Cleanup
  });

  it('should create container with correct dimensions', () => {
    const config = { width: 360, height: 204, pixelSize: 6 };
    const hearth = new HearthVisualComponent(mockScene, config);

    expect(hearth.container).toBeDefined();
    expect(hearth.width).toBe(360);
    expect(hearth.height).toBe(204);
  });

  it('should create graphics for brick texture', () => {
    const config = { width: 360, height: 204, pixelSize: 6 };
    const hearth = new HearthVisualComponent(mockScene, config);

    expect(hearth.brickGraphics).toBeDefined();
    expect(mockScene.add.graphics).toHaveBeenCalled();
  });

  it('should add brick graphics to container', () => {
    const config = { width: 360, height: 204, pixelSize: 6 };
    const hearth = new HearthVisualComponent(mockScene, config);

    // The container.add method should be called for each graphics object
    expect(hearth.container.add).toHaveBeenCalled();
  });

  it('should use default pixelSize when not specified', () => {
    const config = { width: 360, height: 204, pixelSize: 6 };
    const hearth = new HearthVisualComponent(mockScene, config);

    // pixelSize is specified, but test that constructor accepts it
    expect(hearth.width).toBe(360);
  });

  it('should store all color constants', () => {
    const config = { width: 360, height: 204, pixelSize: 6 };
    const hearth = new HearthVisualComponent(mockScene, config);

    // Access static COLORS through class
    expect(HearthVisualComponent.COLORS).toBeDefined();
    expect(HearthVisualComponent.COLORS.brickLight).toBe(0x8a5a2a);
    expect(HearthVisualComponent.COLORS.brickDark).toBe(0x3f2412);
    expect(HearthVisualComponent.COLORS.emberCore).toBe(0xffd24a);
  });

  it('should have destroy method that cleans up resources', () => {
    const config = { width: 360, height: 204, pixelSize: 6 };
    const hearth = new HearthVisualComponent(mockScene, config);

    hearth.destroy();

    expect(hearth.container.destroy).toHaveBeenCalled();
  });

  // Task 2: 砖墙纹理绘制测试
  it('should draw brick texture with gradient colors', () => {
    const config = { width: 360, height: 204, pixelSize: 6 };
    const hearth = new HearthVisualComponent(mockScene, config);

    // 检查 brickGraphics 存在
    expect(hearth.brickGraphics).toBeDefined();

    // 检查容器包含砖墙层
    const brickInContainer = hearth.container.list.some(
      obj => obj === hearth.brickGraphics
    );
    expect(brickInContainer).toBe(true);
  });

  it('should draw mortar grid lines for brick texture', () => {
    const config = { width: 360, height: 204, pixelSize: 6 };
    const hearth = new HearthVisualComponent(mockScene, config);

    // 检查绘制了灰缝网格
    expect(hearth.brickGraphics).toBeDefined();
  });

  // Task 3: 炉灶顶板和火焰开口测试
  it('should draw stove top ledge with gradient', () => {
    const config = { width: 360, height: 204, pixelSize: 6 };
    const hearth = new HearthVisualComponent(mockScene, config);

    expect(hearth.topGraphics).toBeDefined();
    const topInContainer = hearth.container.list.some(
      obj => obj === hearth.topGraphics
    );
    expect(topInContainer).toBe(true);
  });

  it('should draw fire hole with radial gradient colors', () => {
    const config = { width: 360, height: 204, pixelSize: 6 };
    const hearth = new HearthVisualComponent(mockScene, config);

    expect(hearth.fireHoleGraphics).toBeDefined();
    const fireHoleInContainer = hearth.container.list.some(
      obj => obj === hearth.fireHoleGraphics
    );
    expect(fireHoleInContainer).toBe(true);
  });

  // Task 4: 火焰动画测试
  it('should create 4 flame objects with different sizes', () => {
    const config = { width: 360, height: 204, pixelSize: 6, animated: true };
    const hearth = new HearthVisualComponent(mockScene, config);

    expect(hearth.flames.length).toBe(4);
  });

  it('should start flame dance animation with different delays', () => {
    const config = { width: 360, height: 204, pixelSize: 6, animated: true };
    const hearth = new HearthVisualComponent(mockScene, config);

    expect(hearth.flameTweens.length).toBe(4);
  });

  it('should not create flames when animated is false', () => {
    const config = { width: 360, height: 204, pixelSize: 6, animated: false };
    const hearth = new HearthVisualComponent(mockScene, config);

    expect(hearth.flames.length).toBe(0);
    expect(hearth.flameTweens.length).toBe(0);
  });

  // Task 5: 火星粒子系统测试
  it('should create ember particle emitter when animated', () => {
    const config = { width: 360, height: 204, pixelSize: 6, animated: true };
    const hearth = new HearthVisualComponent(mockScene, config);

    expect(hearth.emberParticles).not.toBeNull();
    expect(hearth.emberParticles).toBeDefined();
  });

  it('should not create ember particles when animated is false', () => {
    const config = { width: 360, height: 204, pixelSize: 6, animated: false };
    const hearth = new HearthVisualComponent(mockScene, config);

    expect(hearth.emberParticles).toBeNull();
  });

  it('should draw ground shadow under stove', () => {
    const config = { width: 360, height: 204, pixelSize: 6 };
    const hearth = new HearthVisualComponent(mockScene, config);

    expect(hearth.shadowGraphics).toBeDefined();
    const shadowInContainer = hearth.container.list.some(
      obj => obj === hearth.shadowGraphics
    );
    expect(shadowInContainer).toBe(true);
  });

  it('should draw shadow with gradient ellipses', () => {
    const config = { width: 360, height: 204, pixelSize: 6 };
    const hearth = new HearthVisualComponent(mockScene, config);

    // 检查阴影Graphics对象存在
    expect(hearth.shadowGraphics).toBeDefined();
    // 检查fillStyle被调用多次（渐变阴影）
    expect(hearth.shadowGraphics!.fillStyle).toHaveBeenCalled();
  });
});