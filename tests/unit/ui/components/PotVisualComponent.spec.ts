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
    fillRoundedRect: vi.fn().mockReturnThis(),
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

  // Task 7: 测试药罐形状绘制
  it('should draw pot body with horizontal gradient fillStyle calls', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    // 检查罐身Graphics存在
    expect(pot.bodyGraphics).toBeDefined();
    const bodyInContainer = pot.container.list.some(obj => obj === pot.bodyGraphics);
    expect(bodyInContainer).toBe(true);

    // 检查渐变色调用 - 应使用COLORS常量中的颜色
    expect(pot.bodyGraphics.fillStyle).toHaveBeenCalled();
    // 检查填充矩形绘制
    expect(pot.bodyGraphics.fillRect).toHaveBeenCalled();
  });

  it('should draw pot rim with vertical gradient', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot.rimGraphics).toBeDefined();
    const rimInContainer = pot.container.list.some(obj => obj === pot.rimGraphics);
    expect(rimInContainer).toBe(true);

    // 检查边缘渐变绘制
    expect(pot.rimGraphics.fillStyle).toHaveBeenCalled();
    expect(pot.rimGraphics.fillRect).toHaveBeenCalled();
  });

  it('should draw pot handles on both sides with border stroke', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot.handleGraphics).toBeDefined();
    const handleInContainer = pot.container.list.some(obj => obj === pot.handleGraphics);
    expect(handleInContainer).toBe(true);

    // 检查把手绘制（应包含fillRect和strokeRect）
    expect(pot.handleGraphics.fillRect).toHaveBeenCalled();
    expect(pot.handleGraphics.lineStyle).toHaveBeenCalled();
    expect(pot.handleGraphics.strokeRect).toHaveBeenCalled();
  });

  it('should draw liquid surface with gradient', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot.liquidGraphics).toBeDefined();
    const liquidInContainer = pot.container.list.some(obj => obj === pot.liquidGraphics);
    expect(liquidInContainer).toBe(true);

    // 检查药液渐变绘制
    expect(pot.liquidGraphics.fillStyle).toHaveBeenCalled();
    expect(pot.liquidGraphics.fillRect).toHaveBeenCalled();
  });

  it('should use COLORS constants for pot body gradient', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    // 检查fillStyle调用中使用了COLORS.potDark, potMid, potLight
    const fillStyleCalls = pot.bodyGraphics.fillStyle.mock.calls;
    const usedColors = fillStyleCalls.map(call => call[0]);

    // 确保使用了关键的渐变色
    expect(usedColors).toContain(PotVisualComponent.COLORS.potDark);
    expect(usedColors).toContain(PotVisualComponent.COLORS.potMid);
    expect(usedColors).toContain(PotVisualComponent.COLORS.potLight);
  });

  it('should use COLORS constants for rim gradient', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    const fillStyleCalls = pot.rimGraphics.fillStyle.mock.calls;
    const usedColors = fillStyleCalls.map(call => call[0]);

    // 确保使用了边缘的渐变色
    expect(usedColors).toContain(PotVisualComponent.COLORS.rimTop);
    expect(usedColors).toContain(PotVisualComponent.COLORS.rimMid);
    expect(usedColors).toContain(PotVisualComponent.COLORS.rimBot);
  });

  it('should draw multiple gradient steps for pot body (8 steps)', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    // 8步渐变 + 圆底填充 + 内阴影 = 多次fillRect调用
    const fillRectCalls = pot.bodyGraphics.fillRect.mock.calls;
    expect(fillRectCalls.length).toBeGreaterThan(8);
  });

  it('should draw handles with potDark color and border', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    const fillStyleCalls = pot.handleGraphics.fillStyle.mock.calls;
    const usedColors = fillStyleCalls.map(call => call[0]);

    // 把手应使用potDark颜色
    expect(usedColors).toContain(PotVisualComponent.COLORS.potDark);

    // 检查边框绘制（lineStyle和strokeRect）
    expect(pot.handleGraphics.lineStyle).toHaveBeenCalled();
    expect(pot.handleGraphics.strokeRect).toHaveBeenCalled();
  });
});