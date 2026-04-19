// tests/integration/ui/item-slot-smoke.spec.ts
/**
 * ItemSlotComponent集成冒烟测试
 *
 * 验证组件在真实Phaser场景中的基本功能，不崩溃
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ItemSlotComponent from '../../../src/ui/components/ItemSlotComponent';
import { ItemSlotState } from '../../../src/ui/components/ItemSlotComponent';

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
    setPosition: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };

  const mockImage = {
    setDisplaySize: vi.fn().mockReturnThis(),
    setTexture: vi.fn().mockReturnThis(),
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
    scale: {
      width: 800,
      height: 600,
    },
    scene: { key: 'integrationTestScene' },
  } as any;
};

describe('ItemSlotComponent Integration Smoke Tests', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
  });

  afterEach(() => {
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__ITEM_SLOT__;
      delete (window as any).testSlot;
    }
  });

  describe('基本生存测试', () => {
    it('should create ItemSlotComponent without crashing', () => {
      const slot = new ItemSlotComponent(mockScene);
      expect(slot).toBeDefined();
      expect(slot.width).toBe(60);
      expect(slot.height).toBe(60);
    });

    it('should create with config without crashing', () => {
      const slot = new ItemSlotComponent(mockScene, {
        selectable: true,
        draggable: false,
      });
      expect(slot).toBeDefined();
      expect(slot.selectable).toBe(true);
      expect(slot.draggable).toBe(false);
    });

    it('should create at specified position without crashing', () => {
      const slot = new ItemSlotComponent(mockScene, undefined, 100, 200);
      expect(slot).toBeDefined();
      expect(mockScene.add.container).toHaveBeenCalledWith(100, 200);
    });
  });

  describe('内容操作测试', () => {
    it('should setContent and clearContent without crashing', () => {
      const slot = new ItemSlotComponent(mockScene);

      slot.setContent({
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      });
      expect(slot.state).toBe(ItemSlotState.FILLED);

      slot.clearContent();
      expect(slot.state).toBe(ItemSlotState.EMPTY);
    });

    it('should update quantity without crashing', () => {
      const slot = new ItemSlotComponent(mockScene);

      slot.setContent({
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      });

      slot.setContent({
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 10,
      });

      expect(slot.content?.quantity).toBe(10);
    });
  });

  describe('状态切换测试', () => {
    it('should select and deselect without crashing', () => {
      const slot = new ItemSlotComponent(mockScene);

      slot.setContent({
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      });

      slot.select();
      expect(slot.state).toBe(ItemSlotState.SELECTED);

      slot.deselect();
      expect(slot.state).toBe(ItemSlotState.FILLED);
    });

    it('should toggle selection with handleClick without crashing', () => {
      const slot = new ItemSlotComponent(mockScene);

      slot.setContent({
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      });

      slot.handleClick();
      expect(slot.state).toBe(ItemSlotState.SELECTED);

      slot.handleClick();
      expect(slot.state).toBe(ItemSlotState.FILLED);
    });
  });

  describe('销毁测试', () => {
    it('should destroy without crashing', () => {
      const slot = new ItemSlotComponent(mockScene);

      slot.setContent({
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      });

      slot.destroy();
      expect(slot.content).toBeNull();
      expect(slot.state).toBe(ItemSlotState.EMPTY);
    });

    it('should handle multiple destroy calls without crashing', () => {
      const slot = new ItemSlotComponent(mockScene);

      slot.destroy();
      slot.destroy(); // Second destroy should not crash

      expect(slot.state).toBe(ItemSlotState.EMPTY);
    });
  });

  describe('链式调用测试', () => {
    it('should support chaining setPosition and setDepth without crashing', () => {
      const slot = new ItemSlotComponent(mockScene);

      slot.setPosition(100, 200).setDepth(50);

      expect(slot.container.setPosition).toHaveBeenCalledWith(100, 200);
      expect(slot.container.setDepth).toHaveBeenCalledWith(50);
    });
  });

  describe('onClick回调测试', () => {
    it('should call onClick callback without crashing', () => {
      const onClick = vi.fn();
      const slot = new ItemSlotComponent(mockScene, { onClick });

      slot.setContent({
        itemId: 'herb_gancao',
        name: '甘草',
        quantity: 5,
      });

      slot.handleClick();
      expect(onClick).toHaveBeenCalled();
    });
  });
});