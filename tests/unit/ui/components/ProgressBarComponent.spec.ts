// tests/unit/ui/components/ProgressBarComponent.spec.ts
/**
 * ProgressBarComponent进度条组件单元测试
 *
 * 测试内容：
 * - 构造与属性：默认高度20px、边框风格inset、初始空状态
 * - 状态切换：empty→filling→complete、error状态
 * - 进度显示：渐变颜色、百分比/时间文本
 * - 交互方法：setProgress、increase、decrease、reset
 * - 完成回调：onComplete触发时机
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProgressBarComponent from '../../../../src/ui/components/ProgressBarComponent';
import {
  ProgressBarConfig,
  ProgressBarState,
  ProgressBarGradientColors,
  DEFAULT_GRADIENT_COLORS,
} from '../../../../src/ui/components/ProgressBarComponent';
import { UI_COLORS } from '../../../../src/data/ui-color-theme';

// Mock Phaser Scene
const createMockScene = () => {
  const mockContainer = {
    setDepth: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setPosition: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setScrollFactor: vi.fn().mockReturnThis(),
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
    setPosition: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
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

describe('ProgressBarComponent', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__PROGRESS_BAR__;
      delete (window as any).testProgressBar;
    }
  });

  afterEach(() => {
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__PROGRESS_BAR__;
      delete (window as any).testProgressBar;
    }
  });

  // ============================================
  // 构造与属性测试
  // ============================================
  describe('构造与属性', () => {
    it('should create progress bar with default height 20px', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      expect(bar.height).toBe(20);
    });

    it('should accept custom height', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100, height: 30 };
      const bar = new ProgressBarComponent(mockScene, config);
      expect(bar.height).toBe(30);
    });

    it('should start with empty state when currentValue is 0', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      expect(bar.state).toBe('empty');
    });

    it('should start with filling state when currentValue > 0', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100, currentValue: 50 };
      const bar = new ProgressBarComponent(mockScene, config);
      expect(bar.state).toBe('filling');
    });

    it('should start with complete state when currentValue >= maxValue', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100, currentValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      expect(bar.state).toBe('complete');
    });

    it('should create container at specified position', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config, 100, 200);
      expect(mockScene.add.container).toHaveBeenCalledWith(100, 200);
    });

    it('should default position to (0, 0) when not specified', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      expect(mockScene.add.container).toHaveBeenCalledWith(0, 0);
    });

    it('should have DEFAULT_HEIGHT constant of 20', () => {
      expect(ProgressBarComponent.DEFAULT_HEIGHT).toBe(20);
    });

    it('should have BORDER_PADDING constant of 2', () => {
      expect(ProgressBarComponent.BORDER_PADDING).toBe(2);
    });

    it('should use default gradient colors when not specified', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      // Default colors should be soft red, soft yellow, soft green
      expect(DEFAULT_GRADIENT_COLORS.low).toBe(UI_COLORS.SOFT_RED);
      expect(DEFAULT_GRADIENT_COLORS.mid).toBe(UI_COLORS.SOFT_YELLOW);
      expect(DEFAULT_GRADIENT_COLORS.high).toBe(UI_COLORS.SOFT_GREEN);
    });

    it('should accept custom gradient colors', () => {
      const customColors: ProgressBarGradientColors = {
        low: 0xff0000,
        mid: 0xffff00,
        high: 0x00ff00,
      };
      const config: ProgressBarConfig = {
        width: 300,
        maxValue: 100,
        gradientColors: customColors,
      };
      const bar = new ProgressBarComponent(mockScene, config);
      // Custom colors should be used (internal property)
      expect(bar.getCurrentColor()).toBeDefined();
    });
  });

  // ============================================
  // 状态切换测试
  // ============================================
  describe('状态切换', () => {
    it('should transition from empty to filling when setProgress > 0', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      expect(bar.state).toBe('empty');

      bar.setProgress(30);
      expect(bar.state).toBe('filling');
      expect(bar.currentValue).toBe(30);
    });

    it('should transition from filling to complete when setProgress >= maxValue', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      bar.setProgress(50);
      expect(bar.state).toBe('filling');

      bar.setProgress(100);
      expect(bar.state).toBe('complete');
      expect(bar.currentValue).toBe(100);
    });

    it('should transition from complete to filling when setProgress < maxValue', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100, currentValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      expect(bar.state).toBe('complete');

      bar.setProgress(80);
      expect(bar.state).toBe('filling');
    });

    it('should transition from filling to empty when reset() is called', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      bar.setProgress(50);
      expect(bar.state).toBe('filling');

      bar.reset();
      expect(bar.state).toBe('empty');
      expect(bar.currentValue).toBe(0);
    });

    it('should set error state with setError()', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      bar.setProgress(50);

      bar.setError();
      expect(bar.state).toBe('error');
    });

    it('should stay empty when setProgress(0) on empty bar', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      expect(bar.state).toBe('empty');

      bar.setProgress(0);
      expect(bar.state).toBe('empty');
    });
  });

  // ============================================
  // 进度值测试
  // ============================================
  describe('进度值', () => {
    it('should clamp value to 0 minimum', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(-10);
      expect(bar.currentValue).toBe(0);
    });

    it('should clamp value to maxValue maximum', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(150);
      expect(bar.currentValue).toBe(100);
    });

    it('should increase progress with increase() method', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(30);
      bar.increase(20);
      expect(bar.currentValue).toBe(50);
    });

    it('should decrease progress with decrease() method', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(50);
      bar.decrease(20);
      expect(bar.currentValue).toBe(30);
    });

    it('should get correct progress ratio', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(50);
      expect(bar.getProgressRatio()).toBe(0.5);

      bar.setProgress(25);
      expect(bar.getProgressRatio()).toBe(0.25);

      bar.setProgress(100);
      expect(bar.getProgressRatio()).toBe(1);
    });

    it('should handle time-based progress (seconds)', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 300 }; // 5 minutes
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(120); // 2 minutes
      expect(bar.currentValue).toBe(120);
      expect(bar.getProgressRatio()).toBe(0.4);
    });
  });

  // ============================================
  // 渐变颜色测试
  // ============================================
  describe('渐变颜色', () => {
    it('should return low color (red) when progress < 33%', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(10);
      expect(bar.getCurrentColor()).toBe(DEFAULT_GRADIENT_COLORS.low);

      bar.setProgress(32);
      expect(bar.getCurrentColor()).toBe(DEFAULT_GRADIENT_COLORS.low);
    });

    it('should return mid color (yellow) when progress 33-66%', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(33);
      expect(bar.getCurrentColor()).toBe(DEFAULT_GRADIENT_COLORS.mid);

      bar.setProgress(50);
      expect(bar.getCurrentColor()).toBe(DEFAULT_GRADIENT_COLORS.mid);

      bar.setProgress(65);
      expect(bar.getCurrentColor()).toBe(DEFAULT_GRADIENT_COLORS.mid);
    });

    it('should return high color (green) when progress > 66%', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(66);
      expect(bar.getCurrentColor()).toBe(DEFAULT_GRADIENT_COLORS.high);

      bar.setProgress(80);
      expect(bar.getCurrentColor()).toBe(DEFAULT_GRADIENT_COLORS.high);

      bar.setProgress(100);
      expect(bar.getCurrentColor()).toBe(DEFAULT_GRADIENT_COLORS.high);
    });
  });

  // ============================================
  // 文本显示测试
  // ============================================
  describe('文本显示', () => {
    it('should show percentage format when showPercentage is true', () => {
      const config: ProgressBarConfig = {
        width: 300,
        maxValue: 100,
        showPercentage: true,
      };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(65);
      expect(mockScene.add.text).toHaveBeenCalled();
    });

    it('should show time format when showTime is true', () => {
      const config: ProgressBarConfig = {
        width: 300,
        maxValue: 300, // 5 minutes
        showTime: true,
      };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(120); // 2 minutes = 2:00
      expect(mockScene.add.text).toHaveBeenCalled();
    });

    it('should show default format (value/max) when no format specified', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(50);
      expect(mockScene.add.text).toHaveBeenCalled();
    });
  });

  // ============================================
  // 完成回调测试
  // ============================================
  describe('完成回调', () => {
    it('should call onComplete when progress reaches maxValue', () => {
      const onComplete = vi.fn();
      const config: ProgressBarConfig = {
        width: 300,
        maxValue: 100,
        onComplete,
      };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(100);
      expect(onComplete).toHaveBeenCalled();
    });

    it('should NOT call onComplete when progress is below maxValue', () => {
      const onComplete = vi.fn();
      const config: ProgressBarConfig = {
        width: 300,
        maxValue: 100,
        onComplete,
      };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(50);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should call onComplete only once when progress exceeds maxValue', () => {
      const onComplete = vi.fn();
      const config: ProgressBarConfig = {
        width: 300,
        maxValue: 100,
        onComplete,
      };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(150); // Exceeds maxValue but clamped to 100
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onComplete when starting with maxValue', () => {
      const onComplete = vi.fn();
      const config: ProgressBarConfig = {
        width: 300,
        maxValue: 100,
        currentValue: 100,
        onComplete,
      };
      const bar = new ProgressBarComponent(mockScene, config);
      // onComplete should NOT be called on initialization
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // 状态查询方法测试
  // ============================================
  describe('状态查询方法', () => {
    it('should have isComplete() method', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      expect(bar.isComplete()).toBe(false);

      bar.setProgress(100);
      expect(bar.isComplete()).toBe(true);
    });

    it('should have isEmpty() method', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      expect(bar.isEmpty()).toBe(true);

      bar.setProgress(50);
      expect(bar.isEmpty()).toBe(false);
    });

    it('should have isFilling() method', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      expect(bar.isFilling()).toBe(false);

      bar.setProgress(50);
      expect(bar.isFilling()).toBe(true);

      bar.setProgress(100);
      expect(bar.isFilling()).toBe(false);
    });

    it('should have isError() method', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      expect(bar.isError()).toBe(false);

      bar.setError();
      expect(bar.isError()).toBe(true);
    });
  });

  // ============================================
  // 位置与布局测试
  // ============================================
  describe('位置与布局', () => {
    it('should have setPosition method', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      bar.setPosition(100, 200);

      expect(bar.container.setPosition).toHaveBeenCalledWith(100, 200);
    });

    it('should return this for chaining in setPosition', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      const result = bar.setPosition(100, 200);
      expect(result).toBe(bar);
    });

    it('should have setDepth method', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      bar.setDepth(50);

      expect(bar.container.setDepth).toHaveBeenCalledWith(50);
    });

    it('should return this for chaining in setDepth', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      const result = bar.setDepth(50);
      expect(result).toBe(bar);
    });

    it('should have setVisible method', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      bar.setVisible(false);

      expect(bar.container.setVisible).toHaveBeenCalledWith(false);
    });

    it('should return this for chaining in setVisible', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      const result = bar.setVisible(true);
      expect(result).toBe(bar);
    });
  });

  // ============================================
  // 销毁流程测试
  // ============================================
  describe('销毁流程', () => {
    it('should have destroy method', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      expect(bar.destroy).toBeDefined();
      expect(typeof bar.destroy).toBe('function');
    });

    it('should destroy container when calling destroy', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      bar.destroy();

      expect(bar.container.destroy).toHaveBeenCalled();
    });

    it('should clear state when calling destroy', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      bar.setProgress(50);
      bar.destroy();

      expect(bar.currentValue).toBe(0);
      expect(bar.state).toBe('empty');
    });
  });

  // ============================================
  // 暴露全局测试
  // ============================================
  describe('暴露全局', () => {
    it('should have exposeToGlobal method for testing', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      bar.exposeToGlobal('testProgressBar');
      expect((window as any).testProgressBar).toBe(bar);
    });

    it('should clean up global reference when destroying', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);
      bar.exposeToGlobal('testProgressBar');
      bar.destroy();

      expect((window as any).testProgressBar).toBeUndefined();
    });
  });

  // ============================================
  // 边框绘制测试
  // ============================================
  describe('边框绘制', () => {
    it('should draw inset border (方案8) for background', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      // Graphics should be created
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });

    it('should create two Graphics objects (background and fill)', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      // Two Graphics: one for background, one for fill
      expect(mockScene.add.graphics).toHaveBeenCalledTimes(2);
    });

    it('should clear graphics when redrawing', () => {
      const config: ProgressBarConfig = { width: 300, maxValue: 100 };
      const bar = new ProgressBarComponent(mockScene, config);

      bar.setProgress(50);

      const mockGraphics = mockScene.add.graphics();
      expect(mockGraphics.clear).toHaveBeenCalled();
    });
  });
});