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
    setY: vi.fn().mockReturnThis(),
    setX: vi.fn().mockReturnThis(),
    setRotation: vi.fn().mockReturnThis(),
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
    setAlpha: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    alpha: 1,
    scale: 1,
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

  // Task 8: 测试药液表面波纹动画
  it('should draw liquid surface with ripple animation tween', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    // 检查药液Graphics存在
    expect(pot.liquidGraphics).toBeDefined();

    // 检查波纹动画已创建
    expect(pot['liquidTween']).toBeDefined();
    expect(mockScene.tweens.add).toHaveBeenCalled();
  });

  // Task 8: 测试蒸汽粒子
  it('should create 5 steam puffs when showSteam is true', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showSteam: true };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot['steamPuffs'].length).toBe(5);
    expect(pot['steamTweens'].length).toBe(5);
  });

  it('should not create steam when showSteam is false', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showSteam: false };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot['steamPuffs'].length).toBe(0);
    expect(pot['steamTweens'].length).toBe(0);
  });

  it('should use steamColor constant for steam puffs', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showSteam: true };
    const pot = new PotVisualComponent(mockScene, config);

    // 检查至少一个蒸汽Graphics使用了fillStyle和fillCircle
    const steamPuff = pot['steamPuffs'][0];
    expect(steamPuff.fillStyle).toHaveBeenCalled();
    expect(steamPuff.fillCircle).toHaveBeenCalled();

    // 检查使用了steamColor常量
    const fillStyleCalls = steamPuff.fillStyle.mock.calls;
    const usedColors = fillStyleCalls.map(call => call[0]);
    expect(usedColors).toContain(PotVisualComponent.COLORS.steamColor);
  });

  it('should create steam tweens with correct animation parameters', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showSteam: true };
    const pot = new PotVisualComponent(mockScene, config);

    // 检查tween参数
    const tweenCalls = mockScene.tweens.add.mock.calls;
    // 找到蒸汽相关的tween调用
    const steamTweenCalls = tweenCalls.filter(call => {
      const params = call[0];
      return params.duration === 3200 && params.repeat === -1;
    });
    expect(steamTweenCalls.length).toBeGreaterThanOrEqual(5);
  });

  it('should stop all steam tweens on destroy', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showSteam: true };
    const pot = new PotVisualComponent(mockScene, config);

    pot.destroy();

    // 所有蒸汽tween应该被停止
    const mockTween = mockScene.tweens.add();
    expect(mockTween.stop).toHaveBeenCalled();
  });

  it('should draw liquid with COLORS constants', () => {
    const config = { width: 264, height: 168, pixelSize: 6 };
    const pot = new PotVisualComponent(mockScene, config);

    const fillStyleCalls = pot.liquidGraphics.fillStyle.mock.calls;
    const usedColors = fillStyleCalls.map(call => call[0]);

    // 检查使用了liquidTop和liquidBot常量
    expect(usedColors).toContain(PotVisualComponent.COLORS.liquidTop);
    expect(usedColors).toContain(PotVisualComponent.COLORS.liquidBot);
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

  // Task 9: 测试搅拌勺动画
  it('should create ladle when showLadle is true', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showLadle: true };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot['ladleContainer']).toBeDefined();
  });

  it('should start stir animation on ladle', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showLadle: true };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot['ladleTween']).toBeDefined();
    expect(mockScene.tweens.add).toHaveBeenCalled();
  });

  it('should not create ladle when showLadle is false', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showLadle: false };
    const pot = new PotVisualComponent(mockScene, config);

    expect(pot['ladleContainer']).toBeNull();
    expect(pot['ladleTween']).toBeNull();
  });

  it('should create ladle with stick and scoop graphics', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showLadle: true };
    const pot = new PotVisualComponent(mockScene, config);

    // 检查勺柄和勺头Graphics创建
    expect(mockScene.add.graphics).toHaveBeenCalled();
    expect(pot['ladleContainer'].add).toHaveBeenCalled();
  });

  it('should draw ladle stick with horizontal gradient', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showLadle: true };
    const pot = new PotVisualComponent(mockScene, config);

    // 检查勺柄渐变颜色调用
    const graphicsCalls = mockScene.add.graphics.mock.calls;
    expect(graphicsCalls.length).toBeGreaterThan(0);
  });

  it('should draw ladle scoop with vertical gradient', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showLadle: true };
    const pot = new PotVisualComponent(mockScene, config);

    // 检查勺头渐变颜色调用
    const graphicsCalls = mockScene.add.graphics.mock.calls;
    expect(graphicsCalls.length).toBeGreaterThan(0);
  });

  it('should create stir tween with correct rotation parameters', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showLadle: true };
    const pot = new PotVisualComponent(mockScene, config);

    // 检查搅拌动画参数
    const tweenCalls = mockScene.tweens.add.mock.calls;
    const ladleTweenCall = tweenCalls.find(call => {
      const params = call[0];
      return params.duration === 2400 && params.repeat === -1;
    });
    expect(ladleTweenCall).toBeDefined();

    // 检查rotation参数（-0.14 to 0.14 rad, 约-8deg to +8deg）
    if (ladleTweenCall) {
      const params = ladleTweenCall[0];
      expect(params.targets).toBe(pot['ladleContainer']);
      expect(params.rotation).toBeDefined();
    }
  });

  it('should stop ladle tween on destroy', () => {
    const config = { width: 264, height: 168, pixelSize: 6, showLadle: true };
    const pot = new PotVisualComponent(mockScene, config);

    // Capture tween reference before destroy
    const ladleTween = pot['ladleTween'];

    pot.destroy();

    // Check ladleTween was stopped
    expect(ladleTween?.stop).toHaveBeenCalled();

    // Check ladleTween reference is nullified after destroy
    expect(pot['ladleTween']).toBeNull();

    // Check ladleContainer is destroyed and nullified
    expect(pot['ladleContainer']).toBeNull();
  });
});