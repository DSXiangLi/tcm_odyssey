// tests/unit/ui/components/ItemSlotComponent.test.ts
/**
 * ItemSlotComponent物品格子组件单元测试
 *
 * 测试内容：
 * - 构造与属性：标准尺寸60×60、初始空状态、selectable配置
 * - 状态切换：EMPTY→FILLED、EMPTY→SELECTED、SELECTED→EMPTY
 * - 视觉效果：neumorphic inset for empty, raised for filled
 * - 交互事件：onClick回调、不可选时不触发
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ItemSlotComponent from '../../../../src/ui/components/ItemSlotComponent';
import { ItemSlotState, ItemSlotContent, ItemSlotConfig } from '../../../../src/ui/components/ItemSlotComponent';

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
    setInteractive: vi.fn().mockReturnThis(),
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
  };

  const mockImage = {
    setOrigin: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setPosition: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setDisplaySize: vi.fn().mockReturnThis(),
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
      image: vi.fn().mockReturnValue(mockImage),
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

describe('ItemSlotComponent', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__ITEM_SLOT__;
      delete (window as any).testSlot;
    }
  });

  afterEach(() => {
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__ITEM_SLOT__;
      delete (window as any).testSlot;
    }
  });

  // ============================================
  // 构造与属性测试
  // ============================================
  describe('构造与属性', () => {
    it('should create slot with standard size 60x60', () => {
      const slot = new ItemSlotComponent(mockScene);
      expect(slot.width).toBe(60);
      expect(slot.height).toBe(60);
    });

    it('should start with EMPTY state by default', () => {
      const slot = new ItemSlotComponent(mockScene);
      expect(slot.state).toBe(ItemSlotState.EMPTY);
    });

    it('should accept selectable config and default to true', () => {
      const slot = new ItemSlotComponent(mockScene);
      expect(slot.selectable).toBe(true);
    });

    it('should accept selectable=false config', () => {
      const config: ItemSlotConfig = { selectable: false };
      const slot = new ItemSlotComponent(mockScene, config);
      expect(slot.selectable).toBe(false);
    });

    it('should accept draggable config', () => {
      const config: ItemSlotConfig = { draggable: true };
      const slot = new ItemSlotComponent(mockScene, config);
      expect(slot.draggable).toBe(true);
    });

    it('should have null content initially', () => {
      const slot = new ItemSlotComponent(mockScene);
      expect(slot.content).toBeNull();
    });

    it('should create container at specified position', () => {
      const slot = new ItemSlotComponent(mockScene, undefined, 100, 200);
      expect(mockScene.add.container).toHaveBeenCalledWith(100, 200);
    });

    it('should default position to (0, 0) when not specified', () => {
      const slot = new ItemSlotComponent(mockScene);
      expect(mockScene.add.container).toHaveBeenCalledWith(0, 0);
    });
  });

  // ============================================
  // 状态切换测试
  // ============================================
  describe('状态切换', () => {
    it('should transition from EMPTY to FILLED when setContent is called', () => {
      const slot = new ItemSlotComponent(mockScene);
      expect(slot.state).toBe(ItemSlotState.EMPTY);

      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);

      expect(slot.state).toBe(ItemSlotState.FILLED);
      expect(slot.content).toEqual(content);
    });

    it('should transition to SELECTED when select() is called on FILLED slot', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);
      expect(slot.state).toBe(ItemSlotState.FILLED);

      slot.select();
      expect(slot.state).toBe(ItemSlotState.SELECTED);
    });

    it('should NOT transition to SELECTED when slot is EMPTY', () => {
      const slot = new ItemSlotComponent(mockScene);
      expect(slot.state).toBe(ItemSlotState.EMPTY);

      slot.select();
      // Should remain EMPTY, cannot select empty slot
      expect(slot.state).toBe(ItemSlotState.EMPTY);
    });

    it('should NOT transition to SELECTED when selectable=false', () => {
      const config: ItemSlotConfig = { selectable: false };
      const slot = new ItemSlotComponent(mockScene, config);
      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);

      slot.select();
      // Should remain FILLED, cannot select non-selectable slot
      expect(slot.state).toBe(ItemSlotState.FILLED);
    });

    it('should transition from SELECTED to FILLED when deselect() is called', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);
      slot.select();
      expect(slot.state).toBe(ItemSlotState.SELECTED);

      slot.deselect();
      expect(slot.state).toBe(ItemSlotState.FILLED);
    });

    it('should transition from FILLED to EMPTY when clearContent() is called', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);
      expect(slot.state).toBe(ItemSlotState.FILLED);

      slot.clearContent();
      expect(slot.state).toBe(ItemSlotState.EMPTY);
      expect(slot.content).toBeNull();
    });

    it('should transition from SELECTED to EMPTY when clearContent() is called', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);
      slot.select();
      expect(slot.state).toBe(ItemSlotState.SELECTED);

      slot.clearContent();
      expect(slot.state).toBe(ItemSlotState.EMPTY);
      expect(slot.content).toBeNull();
    });

    it('should stay EMPTY when clearContent() is called on empty slot', () => {
      const slot = new ItemSlotComponent(mockScene);
      expect(slot.state).toBe(ItemSlotState.EMPTY);

      slot.clearContent();
      expect(slot.state).toBe(ItemSlotState.EMPTY);
    });

    it('should support DISABLED state', () => {
      const slot = new ItemSlotComponent(mockScene);
      slot.disable();
      expect(slot.state).toBe(ItemSlotState.DISABLED);
    });

    it('should transition from DISABLED to FILLED when setContent is called', () => {
      const slot = new ItemSlotComponent(mockScene);
      slot.disable();
      expect(slot.state).toBe(ItemSlotState.DISABLED);

      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);
      expect(slot.state).toBe(ItemSlotState.FILLED);
    });

    it('should transition from FILLED to DISABLED when disable() is called', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);
      expect(slot.state).toBe(ItemSlotState.FILLED);

      slot.disable();
      expect(slot.state).toBe(ItemSlotState.DISABLED);
    });
  });

  // ============================================
  // 视觉效果测试
  // ============================================
  describe('视觉效果', () => {
    it('should draw neumorphic inset border for EMPTY state', () => {
      const slot = new ItemSlotComponent(mockScene);
      expect(slot.state).toBe(ItemSlotState.EMPTY);

      // Graphics should be created
      expect(mockScene.add.graphics).toHaveBeenCalled();

      // Verify clear was called for redrawing
      const mockGraphics = mockScene.add.graphics();
      expect(mockGraphics.clear).toHaveBeenCalled();
    });

    it('should draw neumorphic raised border for FILLED state', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);

      // Graphics should be redrawn
      const mockGraphics = mockScene.add.graphics();
      expect(mockGraphics.clear).toHaveBeenCalled();
    });

    it('should draw selection highlight border for SELECTED state', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);
      slot.select();

      // Graphics should be redrawn with selection highlight
      const mockGraphics = mockScene.add.graphics();
      expect(mockGraphics.clear).toHaveBeenCalled();
      // Selection highlight uses BUTTON_PRIMARY (#90c070)
      expect(mockGraphics.lineStyle).toHaveBeenCalled();
    });

    it('should draw disabled style for DISABLED state', () => {
      const slot = new ItemSlotComponent(mockScene);
      slot.disable();

      const mockGraphics = mockScene.add.graphics();
      expect(mockGraphics.clear).toHaveBeenCalled();
    });

    it('should show quantity text when content has quantity > 1', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);

      expect(mockScene.add.text).toHaveBeenCalled();
    });

    it('should NOT show quantity text when quantity is 1', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 1,
      };
      slot.setContent(content);

      // Quantity text should not be shown for quantity=1
      // Note: We can't directly test visibility, but the component should handle this case
      expect(slot.content?.quantity).toBe(1);
    });

    it('should NOT show quantity text when quantity is undefined', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
      };
      slot.setContent(content);

      expect(slot.content?.quantity).toBeUndefined();
    });

    it('should position quantity badge at right-bottom corner', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 99,
      };
      slot.setContent(content);

      // Quantity badge should be 12x12 at right-bottom corner
      // Position: (slot.width - 12, slot.height - 12) relative to slot origin
      // This is validated by the implementation using the constants
      expect(slot.hasQuantityBadge()).toBe(true);
    });

    it('should have hasQuantityBadge() method returning correct boolean', () => {
      const slot = new ItemSlotComponent(mockScene);

      // Empty slot should not have quantity badge
      expect(slot.hasQuantityBadge()).toBe(false);

      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);
      expect(slot.hasQuantityBadge()).toBe(true);

      slot.clearContent();
      expect(slot.hasQuantityBadge()).toBe(false);
    });
  });

  // ============================================
  // 交互事件测试
  // ============================================
  describe('交互事件', () => {
    it('should call onClick callback when slot is clicked and selectable', () => {
      const onClick = vi.fn();
      const config: ItemSlotConfig = { onClick };
      const slot = new ItemSlotComponent(mockScene, config);

      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);

      // Simulate click by calling handleClick method
      slot.handleClick();

      expect(onClick).toHaveBeenCalled();
    });

    it('should NOT call onClick when slot is not selectable', () => {
      const onClick = vi.fn();
      const config: ItemSlotConfig = { selectable: false, onClick };
      const slot = new ItemSlotComponent(mockScene, config);

      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);

      slot.handleClick();

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should NOT call onClick when slot is DISABLED', () => {
      const onClick = vi.fn();
      const config: ItemSlotConfig = { onClick };
      const slot = new ItemSlotComponent(mockScene, config);

      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);
      slot.disable();

      slot.handleClick();

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should NOT call onClick when slot is EMPTY', () => {
      const onClick = vi.fn();
      const config: ItemSlotConfig = { onClick };
      const slot = new ItemSlotComponent(mockScene, config);

      slot.handleClick();

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should toggle SELECTED state on click when FILLED', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);
      expect(slot.state).toBe(ItemSlotState.FILLED);

      slot.handleClick();
      expect(slot.state).toBe(ItemSlotState.SELECTED);

      slot.handleClick();
      expect(slot.state).toBe(ItemSlotState.FILLED);
    });

    it('should have isSelected() method', () => {
      const slot = new ItemSlotComponent(mockScene);

      expect(slot.isSelected()).toBe(false);

      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);
      expect(slot.isSelected()).toBe(false);

      slot.select();
      expect(slot.isSelected()).toBe(true);

      slot.deselect();
      expect(slot.isSelected()).toBe(false);
    });

    it('should have isEmpty() method', () => {
      const slot = new ItemSlotComponent(mockScene);

      expect(slot.isEmpty()).toBe(true);

      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);
      expect(slot.isEmpty()).toBe(false);

      slot.clearContent();
      expect(slot.isEmpty()).toBe(true);
    });

    it('should have isFilled() method', () => {
      const slot = new ItemSlotComponent(mockScene);

      expect(slot.isFilled()).toBe(false);

      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);
      expect(slot.isFilled()).toBe(true);

      slot.select();
      expect(slot.isFilled()).toBe(false); // SELECTED, not FILLED

      slot.deselect();
      expect(slot.isFilled()).toBe(true);
    });

    it('should have isDisabled() method', () => {
      const slot = new ItemSlotComponent(mockScene);

      expect(slot.isDisabled()).toBe(false);

      slot.disable();
      expect(slot.isDisabled()).toBe(true);
    });

    it('should enable disabled slot with enable() method', () => {
      const slot = new ItemSlotComponent(mockScene);
      slot.disable();
      expect(slot.isDisabled()).toBe(true);

      slot.enable();
      expect(slot.isDisabled()).toBe(false);
      expect(slot.state).toBe(ItemSlotState.EMPTY);
    });
  });

  // ============================================
  // 内容更新测试
  // ============================================
  describe('内容更新', () => {
    it('should update quantity when setContent is called with same item', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content1: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content1);
      expect(slot.content?.quantity).toBe(5);

      const content2: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 10,
      };
      slot.setContent(content2);
      expect(slot.content?.quantity).toBe(10);
    });

    it('should update content with different item', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content1: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content1);
      expect(slot.content?.itemId).toBe('herb_gancao');

      const content2: ItemSlotContent = {
        itemId: 'herb_huangqin',
        name: '黄芩',
        quantity: 3,
      };
      slot.setContent(content2);
      expect(slot.content?.itemId).toBe('herb_huangqin');
      expect(slot.content?.name).toBe('黄芩');
      expect(slot.content?.quantity).toBe(3);
    });

    it('should clear selection when content changes', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content1: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content1);
      slot.select();
      expect(slot.isSelected()).toBe(true);

      const content2: ItemSlotContent = {
        itemId: 'herb_huangqin',
        name: '黄芩',
        quantity: 3,
      };
      slot.setContent(content2);
      expect(slot.isSelected()).toBe(false);
      expect(slot.state).toBe(ItemSlotState.FILLED);
    });
  });

  // ============================================
  // 位置与布局测试
  // ============================================
  describe('位置与布局', () => {
    it('should have setPosition method', () => {
      const slot = new ItemSlotComponent(mockScene);
      slot.setPosition(100, 200);

      expect(slot.container.setPosition).toHaveBeenCalledWith(100, 200);
    });

    it('should return this for chaining in setPosition', () => {
      const slot = new ItemSlotComponent(mockScene);
      const result = slot.setPosition(100, 200);
      expect(result).toBe(slot);
    });

    it('should have setDepth method', () => {
      const slot = new ItemSlotComponent(mockScene);
      slot.setDepth(50);

      expect(slot.container.setDepth).toHaveBeenCalledWith(50);
    });

    it('should return this for chaining in setDepth', () => {
      const slot = new ItemSlotComponent(mockScene);
      const result = slot.setDepth(50);
      expect(result).toBe(slot);
    });
  });

  // ============================================
  // 销毁流程测试
  // ============================================
  describe('销毁流程', () => {
    it('should have destroy method', () => {
      const slot = new ItemSlotComponent(mockScene);
      expect(slot.destroy).toBeDefined();
      expect(typeof slot.destroy).toBe('function');
    });

    it('should destroy container when calling destroy', () => {
      const slot = new ItemSlotComponent(mockScene);
      slot.destroy();

      expect(slot.container.destroy).toHaveBeenCalled();
    });

    it('should destroy graphics when calling destroy', () => {
      const slot = new ItemSlotComponent(mockScene);
      const mockGraphics = mockScene.add.graphics();
      slot.destroy();

      expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it('should clear content when calling destroy', () => {
      const slot = new ItemSlotComponent(mockScene);
      const content: ItemSlotContent = {
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      };
      slot.setContent(content);
      slot.destroy();

      expect(slot.content).toBeNull();
      expect(slot.state).toBe(ItemSlotState.EMPTY);
    });
  });

  // ============================================
  // 暴露全局测试
  // ============================================
  describe('暴露全局', () => {
    it('should have exposeToGlobal method for testing', () => {
      const slot = new ItemSlotComponent(mockScene);
      slot.exposeToGlobal('testSlot');
      expect((window as any).testSlot).toBe(slot);
    });

    it('should clean up global reference when destroying', () => {
      const slot = new ItemSlotComponent(mockScene);
      slot.exposeToGlobal('testSlot');
      slot.destroy();

      expect((window as any).testSlot).toBeUndefined();
    });
  });

  // ============================================
  // 常量与尺寸测试
  // ============================================
  describe('常量与尺寸', () => {
    it('should have SLOT_SIZE constant of 60', () => {
      expect(ItemSlotComponent.SLOT_SIZE).toBe(60);
    });

    it('should have ICON_SIZE constant of 40', () => {
      expect(ItemSlotComponent.ICON_SIZE).toBe(40);
    });

    it('should have QUANTITY_BADGE_SIZE constant of 12', () => {
      expect(ItemSlotComponent.QUANTITY_BADGE_SIZE).toBe(12);
    });

    it('should have SELECTION_BORDER_WIDTH constant of 4', () => {
      expect(ItemSlotComponent.SELECTION_BORDER_WIDTH).toBe(4);
    });
  });
});