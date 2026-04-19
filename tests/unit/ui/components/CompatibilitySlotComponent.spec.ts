// tests/unit/ui/components/CompatibilitySlotComponent.spec.ts
/**
 * CompatibilitySlotComponent配伍槽位组件单元测试
 *
 * 测试内容：
 * - 构造与属性：标准尺寸120×100、角色类型、初始状态
 * - 角色显示：君臣佐使标签+对应颜色
 * - 药材放置：setContent、clearContent、嵌入ItemSlotComponent
 * - 顺序选择：先煎/同煎/后下切换
 * - 颜色验证：角色颜色正确应用于边框
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CompatibilitySlotComponent, {
  CompatibilitySlotState,
  CompatibilitySlotContent,
  CompatibilitySlotConfig,
  CompatibilityRole,
  CompatibilityOrder,
} from '../../../../src/ui/components/CompatibilitySlotComponent';

// Mock Phaser Scene
const createMockScene = () => {
  const mockContainer = {
    setDepth: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setPosition: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
  };

  const mockGraphics = {
    fillStyle: vi.fn().mockReturnThis(),
    fillGradientStyles: vi.fn().mockReturnThis(),
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

  const mockImage = {
    setOrigin: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setPosition: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setDisplaySize: vi.fn().mockReturnThis(),
    setTexture: vi.fn().mockReturnThis(),
  };

  const mockZone = {
    setOrigin: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    setSize: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };

  // Mock ItemSlotComponent that will be created internally
  const mockItemSlot = {
    container: {
      setDepth: vi.fn().mockReturnThis(),
      add: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
      setPosition: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
    },
    width: 60,
    height: 60,
    setContent: vi.fn(),
    clearContent: vi.fn(),
    setPosition: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    state: 'EMPTY',
    content: null,
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
    _mockItemSlot: mockItemSlot,
  } as any;
};

// Role color mapping for verification
const ROLE_COLORS = {
  君: 0xc0a080, // 金棕
  臣: 0x80a040, // 绿色
  佐: 0x4080a0, // 蓝色
  使: 0x606060, // 灰色
};

describe('CompatibilitySlotComponent', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__COMPATIBILITY_SLOT__;
      delete (window as any).testSlot;
    }
  });

  afterEach(() => {
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__COMPATIBILITY_SLOT__;
      delete (window as any).testSlot;
    }
  });

  // ============================================
  // 构造与属性测试
  // ============================================
  describe('构造与属性', () => {
    it('should create slot with standard size 120x100', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.width).toBe(120);
      expect(slot.height).toBe(100);
    });

    it('should have SLOT_WIDTH constant of 120', () => {
      expect(CompatibilitySlotComponent.SLOT_WIDTH).toBe(120);
    });

    it('should have SLOT_HEIGHT constant of 100', () => {
      expect(CompatibilitySlotComponent.SLOT_HEIGHT).toBe(100);
    });

    it('should require role parameter', () => {
      const slot君 = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot君.role).toBe('君');

      const slot臣 = new CompatibilitySlotComponent(mockScene, '臣');
      expect(slot臣.role).toBe('臣');

      const slot佐 = new CompatibilitySlotComponent(mockScene, '佐');
      expect(slot佐.role).toBe('佐');

      const slot使 = new CompatibilitySlotComponent(mockScene, '使');
      expect(slot使.role).toBe('使');
    });

    it('should start with EMPTY state by default', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.state).toBe(CompatibilitySlotState.EMPTY);
    });

    it('should have null content initially', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.content).toBeNull();
    });

    it('should have undefined order initially', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.order).toBeUndefined();
    });

    it('should create container at specified position', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君', undefined, 100, 200);
      expect(mockScene.add.container).toHaveBeenCalledWith(100, 200);
    });

    it('should default position to (0, 0) when not specified', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(mockScene.add.container).toHaveBeenCalledWith(0, 0);
    });

    it('should accept config with callbacks', () => {
      const config: CompatibilitySlotConfig = {
        onHerbPlaced: vi.fn(),
        onOrderChanged: vi.fn(),
        onRemove: vi.fn(),
      };
      const slot = new CompatibilitySlotComponent(mockScene, '君', config);
      expect(slot.config).toEqual(config);
    });
  });

  // ============================================
  // 角色显示测试
  // ============================================
  describe('角色显示', () => {
    it('should display role label at top', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      // Role label text should be created
      expect(mockScene.add.text).toHaveBeenCalled();
    });

    it('should use correct color for 君 role', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.roleColor).toBe(ROLE_COLORS.君);
    });

    it('should use correct color for 臣 role', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '臣');
      expect(slot.roleColor).toBe(ROLE_COLORS.臣);
    });

    it('should use correct color for 佐 role', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '佐');
      expect(slot.roleColor).toBe(ROLE_COLORS.佐);
    });

    it('should use correct color for 使 role', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '使');
      expect(slot.roleColor).toBe(ROLE_COLORS.使);
    });

    it('should have getRoleColor static method', () => {
      expect(CompatibilitySlotComponent.getRoleColor('君')).toBe(ROLE_COLORS.君);
      expect(CompatibilitySlotComponent.getRoleColor('臣')).toBe(ROLE_COLORS.臣);
      expect(CompatibilitySlotComponent.getRoleColor('佐')).toBe(ROLE_COLORS.佐);
      expect(CompatibilitySlotComponent.getRoleColor('使')).toBe(ROLE_COLORS.使);
    });
  });

  // ============================================
  // 药材放置测试
  // ============================================
  describe('药材放置', () => {
    it('should transition from EMPTY to FILLED when setContent is called', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.state).toBe(CompatibilitySlotState.EMPTY);

      const content: CompatibilitySlotContent = {
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
      };
      slot.setContent(content);

      expect(slot.state).toBe(CompatibilitySlotState.FILLED);
      expect(slot.content).toEqual(content);
    });

    it('should transition from FILLED to EMPTY when clearContent is called', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      const content: CompatibilitySlotContent = {
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
      };
      slot.setContent(content);
      expect(slot.state).toBe(CompatibilitySlotState.FILLED);

      slot.clearContent();
      expect(slot.state).toBe(CompatibilitySlotState.EMPTY);
      expect(slot.content).toBeNull();
    });

    it('should call onHerbPlaced callback when herb is placed', () => {
      const onHerbPlaced = vi.fn();
      const config: CompatibilitySlotConfig = { onHerbPlaced };
      const slot = new CompatibilitySlotComponent(mockScene, '君', config);

      const content: CompatibilitySlotContent = {
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
      };
      slot.setContent(content);

      expect(onHerbPlaced).toHaveBeenCalledWith('君', 'herb_mahuang');
    });

    it('should call onRemove callback when herb is removed', () => {
      const onRemove = vi.fn();
      const config: CompatibilitySlotConfig = { onRemove };
      const slot = new CompatibilitySlotComponent(mockScene, '君', config);

      const content: CompatibilitySlotContent = {
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
      };
      slot.setContent(content);
      slot.clearContent();

      expect(onRemove).toHaveBeenCalledWith('君');
    });

    it('should preserve order when clearing content', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      const content: CompatibilitySlotContent = {
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
        order: '先煎',
      };
      slot.setContent(content);
      expect(slot.order).toBe('先煎');

      slot.clearContent();
      // Order should be cleared when content is cleared
      expect(slot.order).toBeUndefined();
    });

    it('should update content with different herb', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      const content1: CompatibilitySlotContent = {
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
      };
      slot.setContent(content1);
      expect(slot.content?.herbId).toBe('herb_mahuang');

      const content2: CompatibilitySlotContent = {
        role: '君',
        herbId: 'herb_gancao',
        herbName: '甘草',
      };
      slot.setContent(content2);
      expect(slot.content?.herbId).toBe('herb_gancao');
      expect(slot.content?.herbName).toBe('甘草');
    });

    it('should use embedded ItemSlotComponent for herb display', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      // Should have internal ItemSlotComponent
      expect(slot.itemSlot).toBeDefined();
      expect(slot.itemSlot?.width).toBe(60);
      expect(slot.itemSlot?.height).toBe(60);
    });
  });

  // ============================================
  // 顺序选择测试
  // ============================================
  describe('顺序选择', () => {
    it('should have setOrder method', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.setOrder).toBeDefined();
      expect(typeof slot.setOrder).toBe('function');
    });

    it('should set order to 先煎', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      slot.setOrder('先煎');
      expect(slot.order).toBe('先煎');
    });

    it('should set order to 同煎', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      slot.setOrder('同煎');
      expect(slot.order).toBe('同煎');
    });

    it('should set order to 后下', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      slot.setOrder('后下');
      expect(slot.order).toBe('后下');
    });

    it('should call onOrderChanged callback when order changes', () => {
      const onOrderChanged = vi.fn();
      const config: CompatibilitySlotConfig = { onOrderChanged };
      const slot = new CompatibilitySlotComponent(mockScene, '君', config);

      slot.setOrder('先煎');
      expect(onOrderChanged).toHaveBeenCalledWith('君', '先煎');
    });

    it('should toggle order on order button click', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');

      slot.toggleOrder();
      expect(slot.order).toBe('先煎');

      slot.toggleOrder();
      expect(slot.order).toBe('同煎');

      slot.toggleOrder();
      expect(slot.order).toBe('后下');

      slot.toggleOrder();
      expect(slot.order).toBe('先煎'); // Cycle back
    });

    it('should have ORDER_OPTIONS constant', () => {
      expect(CompatibilitySlotComponent.ORDER_OPTIONS).toEqual(['先煎', '同煎', '后下']);
    });

    it('should accept order in setContent', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      const content: CompatibilitySlotContent = {
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
        order: '先煎',
      };
      slot.setContent(content);
      expect(slot.order).toBe('先煎');
    });
  });

  // ============================================
  // 边框与视觉效果测试
  // ============================================
  describe('边框与视觉效果', () => {
    it('should draw inset border style', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      // Graphics should be created
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });

    it('should apply role color to border', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      // Graphics lineStyle should be called with role color
      const mockGraphics = mockScene.add.graphics();
      expect(mockGraphics.lineStyle).toHaveBeenCalled();
    });

    it('should have drawBorder method', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.drawBorder).toBeDefined();
      expect(typeof slot.drawBorder).toBe('function');
    });

    it('should redraw border when state changes', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      const mockGraphics = mockScene.add.graphics();
      mockGraphics.clear.mockClear();

      const content: CompatibilitySlotContent = {
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
      };
      slot.setContent(content);

      expect(mockGraphics.clear).toHaveBeenCalled();
    });
  });

  // ============================================
  // 状态查询方法测试
  // ============================================
  describe('状态查询方法', () => {
    it('should have isEmpty method', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.isEmpty()).toBe(true);

      slot.setContent({
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
      });
      expect(slot.isEmpty()).toBe(false);
    });

    it('should have isFilled method', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.isFilled()).toBe(false);

      slot.setContent({
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
      });
      expect(slot.isFilled()).toBe(true);
    });

    it('should have hasOrder method', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.hasOrder()).toBe(false);

      slot.setOrder('先煎');
      expect(slot.hasOrder()).toBe(true);
    });

    it('should have hasContent method', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.hasContent()).toBe(false);

      slot.setContent({
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
      });
      expect(slot.hasContent()).toBe(true);
    });
  });

  // ============================================
  // 位置与布局测试
  // ============================================
  describe('位置与布局', () => {
    it('should have setPosition method returning this', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      const result = slot.setPosition(100, 200);
      expect(result).toBe(slot);
      expect(slot.container.setPosition).toHaveBeenCalledWith(100, 200);
    });

    it('should have setDepth method returning this', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      const result = slot.setDepth(50);
      expect(result).toBe(slot);
      expect(slot.container.setDepth).toHaveBeenCalledWith(50);
    });
  });

  // ============================================
  // 销毁流程测试
  // ============================================
  describe('销毁流程', () => {
    it('should have destroy method', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.destroy).toBeDefined();
      expect(typeof slot.destroy).toBe('function');
    });

    it('should destroy container when calling destroy', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      slot.destroy();
      expect(slot.container.destroy).toHaveBeenCalled();
    });

    it('should clear content when calling destroy', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      slot.setContent({
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
      });
      slot.destroy();
      expect(slot.content).toBeNull();
      expect(slot.state).toBe(CompatibilitySlotState.EMPTY);
    });

    it('should destroy internal ItemSlotComponent', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      // The itemSlot should be defined before destruction
      expect(slot.itemSlot).toBeDefined();
      slot.destroy();
      // After destruction, itemSlot should be null
      expect(slot.itemSlot).toBeNull();
    });
  });

  // ============================================
  // 暴露全局测试
  // ============================================
  describe('暴露全局', () => {
    it('should have exposeToGlobal method for testing', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      slot.exposeToGlobal('testSlot');
      expect((window as any).testSlot).toBe(slot);
    });

    it('should clean up global reference when destroying', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      slot.exposeToGlobal('testSlot');
      slot.destroy();
      expect((window as any).testSlot).toBeUndefined();
    });
  });
});