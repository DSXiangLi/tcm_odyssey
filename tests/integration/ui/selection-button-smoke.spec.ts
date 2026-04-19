// tests/integration/ui/selection-button-smoke.spec.ts
/**
 * SelectionButtonComponent集成冒烟测试
 *
 * 验证组件在真实Phaser场景中的基本功能，不崩溃
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SelectionButtonComponent, {
  SelectionButtonState,
} from '../../../src/ui/components/SelectionButtonComponent';

// Create mock scene factory
const createMockScene = () => {
  const mockContainer = {
    setDepth: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setPosition: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
  };

  const mockGraphics = {
    clear: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    beginPath: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    strokePath: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };

  const mockText = {
    setOrigin: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };

  const mockZone = {
    setOrigin: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    setSize: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };

  return {
    add: {
      container: vi.fn().mockReturnValue(mockContainer),
      graphics: vi.fn().mockReturnValue(mockGraphics),
      text: vi.fn().mockReturnValue(mockText),
      zone: vi.fn().mockReturnValue(mockZone),
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
    scale: {
      width: 800,
      height: 600,
    },
    scene: { key: 'integrationTestScene' },
  } as any;
};

describe('SelectionButtonComponent Integration Smoke Tests', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
  });

  afterEach(() => {
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__SELECTION_BUTTON__;
      delete (window as any).testButton;
    }
  });

  describe('基本生存测试', () => {
    it('should create SelectionButtonComponent without crashing', () => {
      const button = new SelectionButtonComponent(mockScene, {
        label: '脉浮',
        value: 'mai_fu',
      });
      expect(button).toBeDefined();
      expect(button.height).toBe(32);
    });

    it('should create with config without crashing', () => {
      const button = new SelectionButtonComponent(
        mockScene,
        { label: '脉浮', value: 'mai_fu' },
        { multiSelect: true, selected: false }
      );
      expect(button).toBeDefined();
      expect(button.multiSelect).toBe(true);
    });

    it('should create at specified position without crashing', () => {
      const button = new SelectionButtonComponent(
        mockScene,
        { label: '脉浮', value: 'mai_fu' },
        undefined,
        100,
        200
      );
      expect(button).toBeDefined();
      expect(mockScene.add.container).toHaveBeenCalledWith(100, 200);
    });

    it('should create with initial selected state without crashing', () => {
      const button = new SelectionButtonComponent(
        mockScene,
        { label: '脉浮', value: 'mai_fu' },
        { selected: true }
      );
      expect(button).toBeDefined();
      expect(button.state).toBe(SelectionButtonState.SELECTED);
      expect(button.getSymbol()).toBe('●');
    });

    it('should create with fixed width without crashing', () => {
      const button = new SelectionButtonComponent(
        mockScene,
        { label: '脉浮', value: 'mai_fu' },
        { width: 150 }
      );
      expect(button).toBeDefined();
      expect(button.width).toBe(150);
    });
  });

  describe('○→●符号切换测试', () => {
    it('should show ○ symbol by default', () => {
      const button = new SelectionButtonComponent(mockScene, {
        label: '脉浮',
        value: 'mai_fu',
      });
      expect(button.getSymbol()).toBe('○');
      expect(button.getText()).toBe('○ 脉浮');
    });

    it('should switch to ● symbol when selected', () => {
      const button = new SelectionButtonComponent(mockScene, {
        label: '脉浮',
        value: 'mai_fu',
      });

      button.select();
      expect(button.getSymbol()).toBe('●');
      expect(button.getText()).toBe('● 脉浮');
    });

    it('should toggle symbol on click', () => {
      const button = new SelectionButtonComponent(mockScene, {
        label: '脉浮',
        value: 'mai_fu',
      });

      button.handleClick();
      expect(button.getSymbol()).toBe('●');

      button.handleClick();
      expect(button.getSymbol()).toBe('○');
    });
  });

  describe('状态切换测试', () => {
    it('should select and deselect without crashing', () => {
      const button = new SelectionButtonComponent(mockScene, {
        label: '脉浮',
        value: 'mai_fu',
      });

      button.select();
      expect(button.state).toBe(SelectionButtonState.SELECTED);

      button.deselect();
      expect(button.state).toBe(SelectionButtonState.UNSELECTED);
    });

    it('should toggle state with handleClick without crashing', () => {
      const button = new SelectionButtonComponent(mockScene, {
        label: '脉浮',
        value: 'mai_fu',
      });

      button.handleClick();
      expect(button.state).toBe(SelectionButtonState.SELECTED);

      button.handleClick();
      expect(button.state).toBe(SelectionButtonState.UNSELECTED);
    });
  });

  describe('回调测试', () => {
    it('should call onSelect callback without crashing', () => {
      const onSelect = vi.fn();
      const button = new SelectionButtonComponent(
        mockScene,
        { label: '脉浮', value: 'mai_fu' },
        { onSelect }
      );

      button.handleClick();
      expect(onSelect).toHaveBeenCalledWith('mai_fu');
    });

    it('should call onHover callback without crashing', () => {
      const onHover = vi.fn();
      const button = new SelectionButtonComponent(
        mockScene,
        { label: '脉浮', value: 'mai_fu' },
        { onHover }
      );

      button.handleHover(true);
      expect(onHover).toHaveBeenCalled();
    });
  });

  describe('多选模式测试', () => {
    it('should support multiSelect mode without crashing', () => {
      const button1 = new SelectionButtonComponent(
        mockScene,
        { label: '脉浮', value: 'mai_fu' },
        { multiSelect: true }
      );
      const button2 = new SelectionButtonComponent(
        mockScene,
        { label: '脉沉', value: 'mai_chen' },
        { multiSelect: true }
      );

      button1.handleClick();
      button2.handleClick();

      // Both should be selected in multiSelect mode
      expect(button1.isSelected()).toBe(true);
      expect(button2.isSelected()).toBe(true);
    });
  });

  describe('销毁测试', () => {
    it('should destroy without crashing', () => {
      const button = new SelectionButtonComponent(mockScene, {
        label: '脉浮',
        value: 'mai_fu',
      });

      button.destroy();
      expect(button.state).toBe(SelectionButtonState.UNSELECTED);
    });

    it('should handle multiple destroy calls without crashing', () => {
      const button = new SelectionButtonComponent(mockScene, {
        label: '脉浮',
        value: 'mai_fu',
      });

      button.destroy();
      button.destroy(); // Second destroy should not crash

      expect(button.state).toBe(SelectionButtonState.UNSELECTED);
    });

    it('should destroy selected button without crashing', () => {
      const button = new SelectionButtonComponent(
        mockScene,
        { label: '脉浮', value: 'mai_fu' },
        { selected: true }
      );

      button.destroy();
      expect(button.state).toBe(SelectionButtonState.UNSELECTED);
    });
  });

  describe('链式调用测试', () => {
    it('should support chaining setPosition and setDepth without crashing', () => {
      const button = new SelectionButtonComponent(mockScene, {
        label: '脉浮',
        value: 'mai_fu',
      });

      button.setPosition(100, 200).setDepth(50);

      expect(button.container.setPosition).toHaveBeenCalledWith(100, 200);
      expect(button.container.setDepth).toHaveBeenCalledWith(50);
    });
  });

  describe('Hover效果测试', () => {
    it('should handle hover in and out without crashing', () => {
      const button = new SelectionButtonComponent(mockScene, {
        label: '脉浮',
        value: 'mai_fu',
      });

      button.handleHover(true);
      button.handleHover(false);

      // Graphics should be redrawn
      const mockGraphics = mockScene.add.graphics();
      expect(mockGraphics.clear).toHaveBeenCalled();
    });
  });

  describe('常量测试', () => {
    it('should have correct static constants', () => {
      expect(SelectionButtonComponent.BUTTON_HEIGHT).toBe(32);
      expect(SelectionButtonComponent.SYMBOL_UNSELECTED).toBe('○');
      expect(SelectionButtonComponent.SYMBOL_SELECTED).toBe('●');
    });
  });
});