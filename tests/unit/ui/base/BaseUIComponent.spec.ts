// tests/unit/ui/base/BaseUIComponent.spec.ts
/**
 * BaseUIComponent抽象基类单元测试
 *
 * 测试内容：
 * - 容器管理（创建、销毁）
 * - 边框绘制（drawBorder方法）
 * - 退出按钮创建（createExitButton方法）
 * - 深度设置（setDepth方法）
 * - 全局暴露（exposeToGlobal方法）
 * - 销毁流程
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BaseUIComponent from '../../../../src/ui/base/BaseUIComponent';
import { BorderStyleType } from '../../../../src/ui/base/UIBorderStyles';

// Mock Phaser Scene
const createMockScene = () => {
  const mockContainer = {
    setDepth: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setX: vi.fn().mockReturnThis(),
    setY: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
  };

  const mockGraphics = {
    fillStyle: vi.fn().mockReturnThis(),
    fillGradientStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    beginPath: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    strokePath: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    clear: vi.fn().mockReturnThis(),
  };

  const mockText = {
    setOrigin: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setText: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
  };

  return {
    add: {
      container: vi.fn().mockReturnValue(mockContainer),
      graphics: vi.fn().mockReturnValue(mockGraphics),
      text: vi.fn().mockReturnValue(mockText),
      existing: vi.fn(),
    },
    cameras: {
      main: {
        centerX: 400,
        centerY: 300,
        width: 800,
        height: 600,
      },
    },
    scene: { key: 'testScene' },
    scale: {
      width: 800,
      height: 600,
    },
  } as any;
};

describe('BaseUIComponent', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__BASE_UI__;
      delete (window as any).testUI;
    }
  });

  afterEach(() => {
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__BASE_UI__;
      delete (window as any).testUI;
    }
  });

  describe('基础功能', () => {
    it('should create container with specified dimensions', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      expect(mockScene.add.container).toHaveBeenCalled();
      expect(component.width).toBe(720);
      expect(component.height).toBe(480);
    });

    it('should have default depth of 100', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      expect(component.depth).toBe(100);
    });

    it('should create container at screen center', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      // Container should be created at centerX, centerY
      expect(mockScene.add.container).toHaveBeenCalledWith(
        mockScene.cameras.main.centerX,
        mockScene.cameras.main.centerY
      );
    });

    it('should have destroy method that cleans up', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      component.destroy();
      expect(component.container.destroy).toHaveBeenCalled();
    });

    it('should have exposeToGlobal method for testing', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      component.exposeToGlobal('testUI');
      expect((window as any).testUI).toBe(component);
    });

    it('should have setDepth method', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      component.setDepth(200);
      expect(component.container.setDepth).toHaveBeenCalledWith(200);
      expect(component.depth).toBe(200);
    });
  });

  describe('drawBorder方法', () => {
    it('should have drawBorder method', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      expect(component.drawBorder).toBeDefined();
      expect(typeof component.drawBorder).toBe('function');
    });

    it('should draw border with 3d style by default', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      component.drawBorder();
      // Should call graphics methods for 3d border style
      expect(mockScene.add.graphics).toHaveBeenCalled();
      expect(component.graphics).toBeDefined();
    });

    it('should support different border styles', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);

      // Test with different border styles
      const styles: BorderStyleType[] = ['glass', '3d', 'traditional', 'neumorphic', 'inset'];

      for (const style of styles) {
        component.drawBorder(style);
        expect(mockScene.add.graphics).toHaveBeenCalled();
      }
    });
  });

  describe('createExitButton方法', () => {
    it('should have createExitButton method', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      expect(component.createExitButton).toBeDefined();
      expect(typeof component.createExitButton).toBe('function');
    });

    it('should create exit button with text', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      const exitButton = component.createExitButton('退出', { x: 10, y: 10 });

      expect(mockScene.add.text).toHaveBeenCalled();
      expect(exitButton).toBeDefined();
    });

    it('should create interactive exit button', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      const mockAction = vi.fn();
      const exitButton = component.createExitButton('退出', { x: 10, y: 10 }, mockAction);

      expect(mockScene.add.text).toHaveBeenCalled();
      // The text should have setInteractive called
      const mockText = mockScene.add.text();
      expect(mockText.setInteractive).toHaveBeenCalled();
    });

    it('should have default position for exit button (top-right corner)', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      // Default position should be at top-right corner relative to container
      const exitButton = component.createExitButton('退出');

      expect(mockScene.add.text).toHaveBeenCalled();
    });
  });

  describe('属性访问', () => {
    it('should have scene property', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      expect(component.scene).toBe(mockScene);
    });

    it('should have container property', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      expect(component.container).toBeDefined();
    });

    it('should have graphics property after drawBorder', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      expect(component.graphics).toBeNull(); // Initially null

      component.drawBorder();
      expect(component.graphics).toBeDefined();
    });
  });

  describe('销毁流程', () => {
    it('should destroy graphics when calling destroy', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      component.drawBorder();
      const graphicsRef = component.graphics;
      component.destroy();

      // Graphics should be destroyed (check the reference we captured before destroy set it to null)
      expect(graphicsRef?.destroy).toHaveBeenCalled();
    });

    it('should clean up global reference when destroying', () => {
      const component = new BaseUIComponent(mockScene, 720, 480);
      component.exposeToGlobal('testUI');
      component.destroy();

      expect((window as any).testUI).toBeUndefined();
    });
  });
});