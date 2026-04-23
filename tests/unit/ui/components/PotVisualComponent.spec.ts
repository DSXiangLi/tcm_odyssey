// tests/unit/ui/components/PotVisualComponent.spec.ts
/**
 * PotVisualComponent药罐视觉组件单元测试
 *
 * 测试内容：
 * - 构造与属性：容器创建、尺寸设置、Graphics对象初始化
 * - 颜色常量：静态COLORS定义
 * - 配置选项：showSteam、showLadle默认值
 * - 销毁清理：资源释放
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PotVisualComponent from '../../../../src/ui/components/PotVisualComponent';

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
    scene: null as any,
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

  return {
    add: {
      container: vi.fn().mockReturnValue(mockContainer),
      graphics: vi.fn().mockReturnValue(mockGraphics),
      existing: vi.fn(),
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
    scene: { key: 'testScene' },
    scale: {
      width: 800,
      height: 600,
    },
  } as any;
};

describe('PotVisualComponent', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
  });

  afterEach(() => {
    // Cleanup
  });

  it('should create container with correct dimensions', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot.container).toBeDefined();
    expect(pot.width).toBe(264);
    expect(pot.height).toBe(168);
  });

  it('should create bodyGraphics object', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot.bodyGraphics).toBeDefined();
    expect(mockScene.add.graphics).toHaveBeenCalled();
  });

  it('should create rimGraphics object', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot.rimGraphics).toBeDefined();
  });

  it('should have color constants accessible', () => {
    expect(PotVisualComponent.COLORS).toBeDefined();
    expect(PotVisualComponent.COLORS.potDark).toBe(0x3a1a0a);
    expect(PotVisualComponent.COLORS.potMid).toBe(0x5a2e18);
    expect(PotVisualComponent.COLORS.potLight).toBe(0x7a4422);
  });

  it('should create liquidGraphics object', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot.liquidGraphics).toBeDefined();
  });

  it('should create handleGraphics object', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot.handleGraphics).toBeDefined();
  });

  it('should default showSteam to true when not specified', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot['showSteam']).toBe(true);
  });

  it('should default showLadle to true when not specified', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot['showLadle']).toBe(true);
  });

  it('should respect showSteam=false in config', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showSteam: false };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot['showSteam']).toBe(false);
  });

  it('should respect showLadle=false in config', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showLadle: false };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot['showLadle']).toBe(false);
  });

  it('should have destroy method that cleans up', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot.destroy).toBeDefined();
    pot.destroy();
    expect(pot.container.destroy).toHaveBeenCalled();
  });

  it('should use default pixelSize when not specified', () => {
    const config = { width: 264, height: 168 };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot['pixelSize']).toBe(6);
  });

  it('should add graphics to container', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    // Each graphics should be added to container
    expect(pot.container.add).toHaveBeenCalled();
  });
});