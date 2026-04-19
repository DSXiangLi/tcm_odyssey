// tests/integration/ui/compatibility-slot-smoke.spec.ts
/**
 * CompatibilitySlotComponent集成冒烟测试
 *
 * 验证组件在真实Phaser场景中的基本功能，不崩溃
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CompatibilitySlotComponent, {
  CompatibilitySlotState,
  CompatibilityRole,
} from '../../../src/ui/components/CompatibilitySlotComponent';

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
    setColor: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
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

describe('CompatibilitySlotComponent Integration Smoke Tests', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
  });

  afterEach(() => {
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__COMPATIBILITY_SLOT__;
      delete (window as any).testSlot;
    }
  });

  describe('基本生存测试', () => {
    it('should create CompatibilitySlotComponent without crashing', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot).toBeDefined();
      expect(slot.width).toBe(120);
      expect(slot.height).toBe(100);
    });

    it('should create for all roles without crashing', () => {
      const roles: CompatibilityRole[] = ['君', '臣', '佐', '使'];
      roles.forEach((role) => {
        const slot = new CompatibilitySlotComponent(mockScene, role);
        expect(slot).toBeDefined();
        expect(slot.role).toBe(role);
      });
    });

    it('should create with config without crashing', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君', {
        onHerbPlaced: vi.fn(),
        onOrderChanged: vi.fn(),
        onRemove: vi.fn(),
      });
      expect(slot).toBeDefined();
    });

    it('should create at specified position without crashing', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君', undefined, 100, 200);
      expect(slot).toBeDefined();
      expect(mockScene.add.container).toHaveBeenCalledWith(100, 200);
    });
  });

  describe('内容操作测试', () => {
    it('should setContent and clearContent without crashing', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');

      slot.setContent({
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
      });
      expect(slot.state).toBe(CompatibilitySlotState.FILLED);

      slot.clearContent();
      expect(slot.state).toBe(CompatibilitySlotState.EMPTY);
    });

    it('should setContent with order without crashing', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');

      slot.setContent({
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
        order: '先煎',
      });
      expect(slot.order).toBe('先煎');
    });

    it('should update content without crashing', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');

      slot.setContent({
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
      });

      slot.setContent({
        role: '君',
        herbId: 'herb_gancao',
        herbName: '甘草',
      });

      expect(slot.content?.herbId).toBe('herb_gancao');
    });
  });

  describe('顺序选择测试', () => {
    it('should setOrder without crashing', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');

      slot.setOrder('先煎');
      expect(slot.order).toBe('先煎');

      slot.setOrder('同煎');
      expect(slot.order).toBe('同煎');

      slot.setOrder('后下');
      expect(slot.order).toBe('后下');
    });

    it('should toggleOrder without crashing', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');

      slot.toggleOrder();
      expect(slot.order).toBe('先煎');

      slot.toggleOrder();
      expect(slot.order).toBe('同煎');

      slot.toggleOrder();
      expect(slot.order).toBe('后下');

      slot.toggleOrder();
      expect(slot.order).toBe('先煎');
    });
  });

  describe('销毁测试', () => {
    it('should destroy without crashing', () => {
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

    it('should handle multiple destroy calls without crashing', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');

      slot.destroy();
      slot.destroy(); // Second destroy should not crash

      expect(slot.state).toBe(CompatibilitySlotState.EMPTY);
    });

    it('should destroy slots for all roles without crashing', () => {
      const roles: CompatibilityRole[] = ['君', '臣', '佐', '使'];
      roles.forEach((role) => {
        const slot = new CompatibilitySlotComponent(mockScene, role);
        slot.setContent({
          role,
          herbId: `herb_${role}`,
          herbName: `药材${role}`,
        });
        slot.destroy();
        expect(slot.state).toBe(CompatibilitySlotState.EMPTY);
      });
    });
  });

  describe('链式调用测试', () => {
    it('should support chaining setPosition and setDepth without crashing', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');

      slot.setPosition(100, 200).setDepth(50);

      expect(slot.container.setPosition).toHaveBeenCalledWith(100, 200);
      expect(slot.container.setDepth).toHaveBeenCalledWith(50);
    });
  });

  describe('回调测试', () => {
    it('should call onHerbPlaced callback without crashing', () => {
      const onHerbPlaced = vi.fn();
      const slot = new CompatibilitySlotComponent(mockScene, '君', { onHerbPlaced });

      slot.setContent({
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
      });

      expect(onHerbPlaced).toHaveBeenCalledWith('君', 'herb_mahuang');
    });

    it('should call onOrderChanged callback without crashing', () => {
      const onOrderChanged = vi.fn();
      const slot = new CompatibilitySlotComponent(mockScene, '君', { onOrderChanged });

      slot.setOrder('先煎');

      expect(onOrderChanged).toHaveBeenCalledWith('君', '先煎');
    });

    it('should call onRemove callback without crashing', () => {
      const onRemove = vi.fn();
      const slot = new CompatibilitySlotComponent(mockScene, '君', { onRemove });

      slot.setContent({
        role: '君',
        herbId: 'herb_mahuang',
        herbName: '麻黄',
      });

      slot.clearContent();

      expect(onRemove).toHaveBeenCalledWith('君');
    });
  });

  describe('尺寸验证', () => {
    it('should have correct dimensions 120x100', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.width).toBe(120);
      expect(slot.height).toBe(100);
    });

    it('should have correct inner slot size 60x60', () => {
      const slot = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot.itemSlot?.width).toBe(60);
      expect(slot.itemSlot?.height).toBe(60);
    });
  });

  describe('颜色验证', () => {
    it('should have correct role colors', () => {
      const slot君 = new CompatibilitySlotComponent(mockScene, '君');
      expect(slot君.roleColor).toBe(0xc0a080); // 金棕

      const slot臣 = new CompatibilitySlotComponent(mockScene, '臣');
      expect(slot臣.roleColor).toBe(0x80a040); // 绿色

      const slot佐 = new CompatibilitySlotComponent(mockScene, '佐');
      expect(slot佐.roleColor).toBe(0x4080a0); // 蓝色

      const slot使 = new CompatibilitySlotComponent(mockScene, '使');
      expect(slot使.roleColor).toBe(0x606060); // 灰色
    });

    it('should use static getRoleColor method', () => {
      expect(CompatibilitySlotComponent.getRoleColor('君')).toBe(0xc0a080);
      expect(CompatibilitySlotComponent.getRoleColor('臣')).toBe(0x80a040);
      expect(CompatibilitySlotComponent.getRoleColor('佐')).toBe(0x4080a0);
      expect(CompatibilitySlotComponent.getRoleColor('使')).toBe(0x606060);
    });
  });
});