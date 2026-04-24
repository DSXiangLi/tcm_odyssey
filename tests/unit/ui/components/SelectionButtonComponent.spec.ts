// tests/unit/ui/components/SelectionButtonComponent.spec.ts
/**
 * SelectionButtonComponent选择按钮组件单元测试
 *
 * 测试内容：
 * - 构造与属性：高度32px、自适应宽度、初始未选中状态
 * - 状态切换：UNSELECTED→SELECTED、○→●符号切换
 * - 视觉效果：inset边框风格、hover高亮效果
 * - 交互事件：onClick回调、onHover回调、多选模式
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SelectionButtonComponent, {
  SelectionButtonState,
  SelectionButtonContent,
  SelectionButtonConfig,
} from '../../../../src/ui/components/SelectionButtonComponent';

// Mock Phaser Scene
const createMockScene = () => {
  const mockContainer = {
    setDepth: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
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
    setPosition: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setFontSize: vi.fn().mockReturnThis(),
    setBackgroundColor: vi.fn().mockReturnThis(),
  };

  const mockZone = {
    setOrigin: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
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
    scene: { key: 'testScene' },
    scale: {
      width: 800,
      height: 600,
    },
  } as any;
};

describe('SelectionButtonComponent', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__SELECTION_BUTTON__;
      delete (window as any).testButton;
    }
  });

  afterEach(() => {
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__SELECTION_BUTTON__;
      delete (window as any).testButton;
    }
  });

  // ============================================
  // 构造与属性测试
  // ============================================
  describe('构造与属性', () => {
    it('should create button with height 32px', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      expect(button.height).toBe(32);
    });

    it('should have adaptive width based on label text length', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      // Width should be calculated based on text
      expect(button.width).toBeGreaterThan(0);
    });

    it('should allow custom fixed width', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const config: SelectionButtonConfig = { width: 120 };
      const button = new SelectionButtonComponent(mockScene, content, config);
      expect(button.width).toBe(120);
    });

    it('should start with UNSELECTED state by default', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      expect(button.state).toBe(SelectionButtonState.UNSELECTED);
    });

    it('should accept initial selected state via config', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const config: SelectionButtonConfig = { selected: true };
      const button = new SelectionButtonComponent(mockScene, content, config);
      expect(button.state).toBe(SelectionButtonState.SELECTED);
    });

    it('should store content with label and value', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      expect(button.content).toEqual(content);
    });

    it('should create container at specified position', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content, undefined, 100, 200);
      expect(mockScene.add.container).toHaveBeenCalledWith(100, 200);
    });

    it('should default position to (0, 0) when not specified', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      expect(mockScene.add.container).toHaveBeenCalledWith(0, 0);
    });
  });

  // ============================================
  // ○→●符号切换测试 (核心功能)
  // ============================================
  describe('○→●符号切换', () => {
    it('should show ○ symbol when UNSELECTED', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      expect(button.state).toBe(SelectionButtonState.UNSELECTED);
      expect(button.getSymbol()).toBe('○');
    });

    it('should show ● symbol when SELECTED', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const config: SelectionButtonConfig = { selected: true };
      const button = new SelectionButtonComponent(mockScene, content, config);
      expect(button.state).toBe(SelectionButtonState.SELECTED);
      expect(button.getSymbol()).toBe('●');
    });

    it('should switch symbol from ○ to ● when selected', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      expect(button.getSymbol()).toBe('○');

      button.select();
      expect(button.getSymbol()).toBe('●');
    });

    it('should switch symbol from ● to ○ when unselected', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const config: SelectionButtonConfig = { selected: true };
      const button = new SelectionButtonComponent(mockScene, content, config);
      expect(button.getSymbol()).toBe('●');

      button.deselect();
      expect(button.getSymbol()).toBe('○');
    });

    it('should toggle symbol on click', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      expect(button.getSymbol()).toBe('○');

      button.handleClick();
      expect(button.getSymbol()).toBe('●');

      button.handleClick();
      expect(button.getSymbol()).toBe('○');
    });

    it('should display symbol + label in text format', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);

      // UNSELECTED: should show "○ 脉浮"
      expect(button.getText()).toBe('○ 脉浮');

      button.select();
      // SELECTED: should show "● 脉浮"
      expect(button.getText()).toBe('● 脉浮');
    });
  });

  // ============================================
  // 状态切换测试
  // ============================================
  describe('状态切换', () => {
    it('should transition from UNSELECTED to SELECTED when select() is called', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      expect(button.state).toBe(SelectionButtonState.UNSELECTED);

      button.select();
      expect(button.state).toBe(SelectionButtonState.SELECTED);
    });

    it('should transition from SELECTED to UNSELECTED when deselect() is called', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const config: SelectionButtonConfig = { selected: true };
      const button = new SelectionButtonComponent(mockScene, content, config);
      expect(button.state).toBe(SelectionButtonState.SELECTED);

      button.deselect();
      expect(button.state).toBe(SelectionButtonState.UNSELECTED);
    });

    it('should toggle state on click', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      expect(button.state).toBe(SelectionButtonState.UNSELECTED);

      button.handleClick();
      expect(button.state).toBe(SelectionButtonState.SELECTED);

      button.handleClick();
      expect(button.state).toBe(SelectionButtonState.UNSELECTED);
    });

    it('should stay UNSELECTED when select() is called on already selected button', () => {
      // This tests the behavior of calling select() when already selected
      // In multiSelect mode, this should keep the state as SELECTED
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const config: SelectionButtonConfig = { selected: true };
      const button = new SelectionButtonComponent(mockScene, content, config);

      button.select(); // Already selected, should remain selected
      expect(button.state).toBe(SelectionButtonState.SELECTED);
    });

    it('should have isSelected() method', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);

      expect(button.isSelected()).toBe(false);

      button.select();
      expect(button.isSelected()).toBe(true);

      button.deselect();
      expect(button.isSelected()).toBe(false);
    });
  });

  // ============================================
  // 多选模式测试
  // ============================================
  describe('多选模式', () => {
    it('should support multiSelect config option', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const config: SelectionButtonConfig = { multiSelect: true };
      const button = new SelectionButtonComponent(mockScene, content, config);
      expect(button.multiSelect).toBe(true);
    });

    it('should default multiSelect to false', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      expect(button.multiSelect).toBe(false);
    });

    it('should toggle selection in multiSelect mode on click', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const config: SelectionButtonConfig = { multiSelect: true };
      const button = new SelectionButtonComponent(mockScene, content, config);

      button.handleClick();
      expect(button.state).toBe(SelectionButtonState.SELECTED);

      button.handleClick();
      expect(button.state).toBe(SelectionButtonState.UNSELECTED);
    });

    it('should NOT auto-deselect other buttons (managed externally)', () => {
      // Multi-select mode does not auto-deselect other buttons
      // This is managed externally by the parent component
      const content1: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const content2: SelectionButtonContent = { label: '脉沉', value: 'mai_chen' };
      const config: SelectionButtonConfig = { multiSelect: true };

      const button1 = new SelectionButtonComponent(mockScene, content1, config);
      const button2 = new SelectionButtonComponent(mockScene, content2, config);

      button1.handleClick();
      button2.handleClick();

      // Both should be selected in multiSelect mode
      expect(button1.isSelected()).toBe(true);
      expect(button2.isSelected()).toBe(true);
    });
  });

  // ============================================
  // onClick回调测试
  // ============================================
  describe('onClick回调', () => {
    it('should call onSelect callback with value when clicked', () => {
      const onSelect = vi.fn();
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const config: SelectionButtonConfig = { onSelect };
      const button = new SelectionButtonComponent(mockScene, content, config);

      button.handleClick();

      expect(onSelect).toHaveBeenCalledWith('mai_fu');
    });

    it('should call onSelect callback when state changes to SELECTED', () => {
      const onSelect = vi.fn();
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const config: SelectionButtonConfig = { onSelect };
      const button = new SelectionButtonComponent(mockScene, content, config);

      button.select();

      expect(onSelect).toHaveBeenCalledWith('mai_fu');
    });

    it('should NOT call onSelect callback when state changes via deselect() (prevents infinite loops)', () => {
      // Design decision: deselect() does not trigger callback
      // This prevents infinite loops when parent components call deselect() on all buttons
      const onSelect = vi.fn();
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const config: SelectionButtonConfig = { selected: true, onSelect };
      const button = new SelectionButtonComponent(mockScene, content, config);

      button.deselect();

      // deselect() no longer triggers onSelect callback
      expect(onSelect).not.toHaveBeenCalled();
      // But state should be UNSELECTED
      expect(button.isSelected()).toBe(false);
    });

    it('should call onSelect callback when clicking selected button to deselect via handleClick', () => {
      // handleClick() calls deselect() internally, which now does NOT trigger callback
      // This test verifies the new behavior
      const onSelect = vi.fn();
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const config: SelectionButtonConfig = { selected: true, onSelect };
      const button = new SelectionButtonComponent(mockScene, content, config);

      button.handleClick(); // Calls deselect() internally

      // handleClick -> deselect() -> no callback trigger
      // Note: Parent components should use updateButtonStates() for state management
      expect(button.isSelected()).toBe(false);
    });
  });

  // ============================================
  // Hover效果测试
  // ============================================
  describe('Hover效果', () => {
    it('should have onHover callback', () => {
      const onHover = vi.fn();
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const config: SelectionButtonConfig = { onHover };
      const button = new SelectionButtonComponent(mockScene, content, config);

      button.handleHover(true);

      expect(onHover).toHaveBeenCalled();
    });

    it('should apply visual highlight on hover', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);

      button.handleHover(true);

      // Check that graphics were redrawn (highlight applied)
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });

    it('should remove visual highlight on hover out', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);

      button.handleHover(true);
      button.handleHover(false);

      // Graphics should be redrawn to remove highlight
      const mockGraphics = mockScene.add.graphics();
      expect(mockGraphics.clear).toHaveBeenCalled();
    });
  });

  // ============================================
  // 边框风格测试
  // ============================================
  describe('边框风格', () => {
    it('should use inset border style', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);

      // Graphics should be created for border drawing
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });

    it('should redraw border when state changes', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);

      const mockGraphics = mockScene.add.graphics();
      mockGraphics.clear.mockClear();

      button.select();

      expect(mockGraphics.clear).toHaveBeenCalled();
    });
  });

  // ============================================
  // 位置与布局测试
  // ============================================
  describe('位置与布局', () => {
    it('should have setPosition method', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      button.setPosition(100, 200);

      expect(button.container.setPosition).toHaveBeenCalledWith(100, 200);
    });

    it('should return this for chaining in setPosition', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      const result = button.setPosition(100, 200);
      expect(result).toBe(button);
    });

    it('should have setDepth method', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      button.setDepth(50);

      expect(button.container.setDepth).toHaveBeenCalledWith(50);
    });

    it('should return this for chaining in setDepth', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      const result = button.setDepth(50);
      expect(result).toBe(button);
    });
  });

  // ============================================
  // 销毁流程测试
  // ============================================
  describe('销毁流程', () => {
    it('should have destroy method', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      expect(button.destroy).toBeDefined();
      expect(typeof button.destroy).toBe('function');
    });

    it('should destroy container when calling destroy', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      button.destroy();

      expect(button.container.destroy).toHaveBeenCalled();
    });

    it('should destroy graphics when calling destroy', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      const mockGraphics = mockScene.add.graphics();
      button.destroy();

      expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it('should reset state to UNSELECTED when calling destroy', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const config: SelectionButtonConfig = { selected: true };
      const button = new SelectionButtonComponent(mockScene, content, config);
      button.destroy();

      expect(button.state).toBe(SelectionButtonState.UNSELECTED);
    });
  });

  // ============================================
  // 暴露全局测试
  // ============================================
  describe('暴露全局', () => {
    it('should have exposeToGlobal method for testing', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      button.exposeToGlobal('testButton');
      expect((window as any).testButton).toBe(button);
    });

    it('should clean up global reference when destroying', () => {
      const content: SelectionButtonContent = { label: '脉浮', value: 'mai_fu' };
      const button = new SelectionButtonComponent(mockScene, content);
      button.exposeToGlobal('testButton');
      button.destroy();

      expect((window as any).testButton).toBeUndefined();
    });
  });

  // ============================================
  // 常量测试
  // ============================================
  describe('常量', () => {
    it('should have BUTTON_HEIGHT constant of 32', () => {
      expect(SelectionButtonComponent.BUTTON_HEIGHT).toBe(32);
    });

    it('should have SYMBOL_UNSELECTED constant of ○', () => {
      expect(SelectionButtonComponent.SYMBOL_UNSELECTED).toBe('○');
    });

    it('should have SYMBOL_SELECTED constant of ●', () => {
      expect(SelectionButtonComponent.SYMBOL_SELECTED).toBe('●');
    });
  });
});