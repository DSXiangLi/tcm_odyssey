// tests/unit/inventory-manager.spec.ts
/**
 * InventoryManager 单元测试
 * Phase 2 S8.2 验收测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InventoryManager, InventoryState, ItemChangeRecord } from '../../src/systems/InventoryManager';
import { EventBus } from '../../src/systems/EventBus';
import {
  HERBS_DATA,
  HERB_BAGS,
  TOOLS_DATA,
  KNOWLEDGE_CARDS_DATA
} from '../../src/data/inventory-data';

// Mock EventBus
vi.mock('../../src/systems/EventBus', () => {
  const mockEmit = vi.fn();
  const mockOn = vi.fn(() => vi.fn());
  const mockOff = vi.fn();

  return {
    EventBus: {
      getInstance: () => ({
        emit: mockEmit,
        on: mockOn,
        off: mockOff
      })
    }
  };
});

describe('S8.2: InventoryManager 系统', () => {
  let inventoryManager: InventoryManager;
  let mockEventBus: { emit: ReturnType<typeof vi.fn>; on: ReturnType<typeof vi.fn>; off: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // 清除之前的实例
    InventoryManager.instance = null;

    // 创建新的实例
    inventoryManager = InventoryManager.getInstance({
      playerId: 'test_player',
      initialInventory: {
        herbs: {},
        seeds: {},
        tools: [],
        knowledge_cards: []
      }
    });

    // 获取mock EventBus
    mockEventBus = EventBus.getInstance() as unknown as { emit: ReturnType<typeof vi.fn>; on: ReturnType<typeof vi.fn>; off: ReturnType<typeof vi.fn> };
    mockEventBus.emit.mockClear();
  });

  afterEach(() => {
    inventoryManager.destroy();
  });

  describe('单例模式', () => {
    it('should return same instance', () => {
      const instance1 = InventoryManager.getInstance();
      const instance2 = InventoryManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create instance with config', () => {
      InventoryManager.instance = null;
      const manager = new InventoryManager({
        playerId: 'custom_player',
        initialInventory: {
          herbs: { mahuang: 5 },
          seeds: {},
          tools: ['sickle'],
          knowledge_cards: []
        }
      });

      expect(manager.getHerbQuantity('mahuang')).toBe(5);
      expect(manager.hasTool('sickle')).toBe(true);
    });
  });

  describe('药材管理', () => {
    it('should add herb correctly', () => {
      inventoryManager.addHerb('mahuang', 5, 'test');

      expect(inventoryManager.getHerbQuantity('mahuang')).toBe(5);
    });

    it('should emit item:acquire event when adding herb', () => {
      inventoryManager.addHerb('guizhi', 3, 'gift');

      expect(mockEventBus.emit).toHaveBeenCalledWith('item:acquire', {
        item_id: 'guizhi',
        item_type: 'herb',
        item_name: '桂枝',
        quantity: 3,
        total: 3,
        reason: 'gift'
      });
    });

    it('should increase quantity when adding existing herb', () => {
      inventoryManager.addHerb('mahuang', 5, 'first');
      inventoryManager.addHerb('mahuang', 3, 'second');

      expect(inventoryManager.getHerbQuantity('mahuang')).toBe(8);
    });

    it('should remove herb correctly', () => {
      inventoryManager.addHerb('xingren', 10, 'test');
      const result = inventoryManager.removeHerb('xingren', 3, 'used');

      expect(result).toBe(true);
      expect(inventoryManager.getHerbQuantity('xingren')).toBe(7);
    });

    it('should emit item:consume event when removing herb', () => {
      inventoryManager.addHerb('gancao', 10, 'test');
      mockEventBus.emit.mockClear();

      inventoryManager.removeHerb('gancao', 5, 'decoction');

      expect(mockEventBus.emit).toHaveBeenCalledWith('item:consume', {
        item_id: 'gancao',
        item_type: 'herb',
        item_name: '甘草',
        quantity: 5,
        remaining: 5,
        reason: 'decoction'
      });
    });

    it('should return false when removing more than available', () => {
      inventoryManager.addHerb('mahuang', 2, 'test');
      const result = inventoryManager.removeHerb('mahuang', 5, 'used');

      expect(result).toBe(false);
      expect(inventoryManager.getHerbQuantity('mahuang')).toBe(2);
    });

    it('should remove herb record when quantity reaches 0', () => {
      inventoryManager.addHerb('shaoyao', 5, 'test');
      inventoryManager.removeHerb('shaoyao', 5, 'used');

      expect(inventoryManager.getHerbQuantity('shaoyao')).toBe(0);
    });

    it('should handle unknown herb gracefully', () => {
      inventoryManager.addHerb('unknown_herb', 5, 'test');
      expect(inventoryManager.getHerbQuantity('unknown_herb')).toBe(0);
    });

    it('hasHerb should work correctly', () => {
      inventoryManager.addHerb('mahuang', 10, 'test');

      expect(inventoryManager.hasHerb('mahuang', 5)).toBe(true);
      expect(inventoryManager.hasHerb('mahuang', 15)).toBe(false);
      expect(inventoryManager.hasHerb('unknown_herb', 1)).toBe(false);
    });

    it('getAllHerbs should return all herbs with quantities', () => {
      inventoryManager.addHerb('mahuang', 5, 'test');
      inventoryManager.addHerb('guizhi', 3, 'test');

      const herbs = inventoryManager.getAllHerbs();

      expect(herbs.length).toBe(2);
      expect(herbs.find(h => h.herb.id === 'mahuang')?.quantity).toBe(5);
      expect(herbs.find(h => h.herb.id === 'guizhi')?.quantity).toBe(3);
    });
  });

  describe('药袋查询', () => {
    beforeEach(() => {
      // 添加一些药材
      inventoryManager.addHerb('mahuang', 5, 'test');
      inventoryManager.addHerb('guizhi', 3, 'test');
      inventoryManager.addHerb('bohe', 2, 'test');
      inventoryManager.addHerb('jinyinhua', 4, 'test');
    });

    it('should get herbs in specific bag', () => {
      const herbsInJiebiao = inventoryManager.getHerbsInBag('jiebiao_bag');

      expect(herbsInJiebiao.length).toBeGreaterThan(0);
      expect(herbsInJiebiao.find(h => h.herb.id === 'mahuang')?.quantity).toBe(5);
    });

    it('should return empty array for unknown bag', () => {
      const herbs = inventoryManager.getHerbsInBag('unknown_bag');
      expect(herbs).toEqual([]);
    });

    it('getAllBags should return all bags with quantities', () => {
      const bags = inventoryManager.getAllBags();

      expect(bags.length).toBe(HERB_BAGS.length);
      expect(bags.find(b => b.bag.id === 'jiebiao_bag')?.totalQuantity).toBe(10); // 5+3+2
      expect(bags.find(b => b.bag.id === 'qingre_bag')?.totalQuantity).toBe(4);
    });

    it('getNonEmptyBags should only return bags with herbs', () => {
      const bags = inventoryManager.getNonEmptyBags();

      expect(bags.find(b => b.bag.id === 'jiebiao_bag')).toBeDefined();
      expect(bags.find(b => b.bag.id === 'qingre_bag')).toBeDefined();
    });
  });

  describe('种子管理', () => {
    it('should add seed correctly', () => {
      inventoryManager.addSeed('mahuang_seed', 3, 'gift');

      expect(inventoryManager.getSeedQuantity('mahuang_seed')).toBe(3);
    });

    it('should remove seed correctly', () => {
      inventoryManager.addSeed('guizhi_seed', 5, 'test');
      const result = inventoryManager.removeSeed('guizhi_seed', 2, 'planted');

      expect(result).toBe(true);
      expect(inventoryManager.getSeedQuantity('guizhi_seed')).toBe(3);
    });

    it('should emit events for seed operations', () => {
      inventoryManager.addSeed('jinyinhua_seed', 2, 'gift');
      expect(mockEventBus.emit).toHaveBeenCalledWith('item:acquire', expect.objectContaining({
        item_type: 'seed'
      }));

      mockEventBus.emit.mockClear();
      inventoryManager.removeSeed('jinyinhua_seed', 1, 'planted');
      expect(mockEventBus.emit).toHaveBeenCalledWith('item:consume', expect.objectContaining({
        item_type: 'seed'
      }));
    });

    it('getAllSeeds should return all seeds', () => {
      inventoryManager.addSeed('mahuang_seed', 3, 'test');
      inventoryManager.addSeed('guizhi_seed', 2, 'test');

      const seeds = inventoryManager.getAllSeeds();

      expect(seeds.length).toBe(2);
    });
  });

  describe('工具管理', () => {
    it('should unlock tool', () => {
      inventoryManager.unlockTool('medicine_pot', 'task_complete');

      expect(inventoryManager.hasTool('medicine_pot')).toBe(true);
    });

    it('should emit tool:unlock event', () => {
      inventoryManager.unlockTool('cutting_knife', 'gift');

      expect(mockEventBus.emit).toHaveBeenCalledWith('tool:unlock', {
        item_id: 'cutting_knife',
        item_type: 'tool',
        item_name: '切药刀',
        reason: 'gift'
      });
    });

    it('should not duplicate tool unlock', () => {
      inventoryManager.unlockTool('sickle', 'default');
      inventoryManager.unlockTool('sickle', 'default');

      expect(inventoryManager.getAllTools().filter(t => t.id === 'sickle').length).toBe(1);
    });

    it('canUseTool should work for default tools', () => {
      // 默认解锁的工具（镰刀、水桶）
      expect(inventoryManager.canUseTool('sickle')).toBe(true);
      expect(inventoryManager.canUseTool('water_bucket')).toBe(true);
    });

    it('canUseTool should require task for advanced tools', () => {
      // 需要Task解锁的工具
      expect(inventoryManager.canUseTool('medicine_pot')).toBe(false);

      // 设置完成的Task
      inventoryManager.setCompletedTasks(['mahuang-tang-learning']);
      expect(inventoryManager.canUseTool('medicine_pot')).toBe(true);
    });

    it('getAllTools should return unlocked tools', () => {
      inventoryManager.unlockTool('sickle', 'default');

      const tools = inventoryManager.getAllTools();
      expect(tools.find(t => t.id === 'sickle')).toBeDefined();
    });
  });

  describe('知识卡片管理', () => {
    it('should unlock knowledge card', () => {
      inventoryManager.setCompletedTasks(['mahuang-tang-learning']);
      inventoryManager.unlockKnowledgeCard('mahuang-tang_card', 'task_complete');

      expect(inventoryManager.hasKnowledgeCard('mahuang-tang_card')).toBe(true);
    });

    it('should emit knowledge:unlock event', () => {
      inventoryManager.unlockKnowledgeCard('guizhi-tang_card', 'gift');

      expect(mockEventBus.emit).toHaveBeenCalledWith('knowledge:unlock', {
        item_id: 'guizhi-tang_card',
        item_type: 'knowledge_card',
        item_name: '桂枝汤方剂卡',
        reason: 'gift'
      });
    });

    it('getAllKnowledgeCards should return unlocked cards', () => {
      inventoryManager.unlockKnowledgeCard('mahuang-tang_card', 'test');

      const cards = inventoryManager.getAllKnowledgeCards();
      expect(cards.find(c => c.id === 'mahuang-tang_card')).toBeDefined();
    });
  });

  describe('Task完成触发解锁', () => {
    it('should auto-unlock tools when task completes', () => {
      // 直接设置完成的Task
      inventoryManager.setCompletedTasks(['mahuang-tang-learning']);

      expect(inventoryManager.canUseTool('medicine_pot')).toBe(true);
    });

    it('should auto-unlock knowledge cards when task completes', () => {
      inventoryManager.setCompletedTasks(['mahuang-tang-learning']);

      expect(inventoryManager.canUseTool('cutting_knife')).toBe(true);
    });
  });

  describe('存档集成', () => {
    it('exportData should return correct format', () => {
      inventoryManager.addHerb('mahuang', 5, 'test');
      inventoryManager.addSeed('guizhi_seed', 2, 'test');
      inventoryManager.unlockTool('sickle', 'default');

      const data = inventoryManager.exportData();

      expect(data.player_id).toBe('test_player');
      expect(data.inventory.herbs.mahuang).toBe(5);
      expect(data.inventory.seeds.guizhi_seed).toBe(2);
      expect(data.inventory.tools).toContain('sickle');
      expect(data.change_log.length).toBeGreaterThan(0);
    });

    it('importData should restore inventory state', () => {
      const exportData = {
        player_id: 'restore_player',
        last_updated: '2026-04-13T00:00:00Z',
        inventory: {
          herbs: { guizhi: 10, gancao: 5 },
          seeds: { jinyinhua_seed: 3 },
          tools: ['sickle', 'medicine_pot'],
          knowledge_cards: ['mahuang-tang_card']
        },
        change_log: []
      };

      inventoryManager.importData(exportData);

      expect(inventoryManager.getHerbQuantity('guizhi')).toBe(10);
      expect(inventoryManager.hasTool('medicine_pot')).toBe(true);
      expect(inventoryManager.hasKnowledgeCard('mahuang-tang_card')).toBe(true);
    });

    it('getState should return current inventory', () => {
      inventoryManager.addHerb('mahuang', 5, 'test');

      const state = inventoryManager.getState();

      expect(state.herbs.mahuang).toBe(5);
    });
  });

  describe('统计信息', () => {
    it('getStatistics should return correct counts', () => {
      inventoryManager.addHerb('mahuang', 5, 'test');
      inventoryManager.addHerb('guizhi', 3, 'test');
      inventoryManager.addSeed('mahuang_seed', 2, 'test');
      inventoryManager.unlockTool('sickle', 'default');

      const stats = inventoryManager.getStatistics();

      expect(stats.total_herbs).toBe(8);
      expect(stats.unique_herbs).toBe(2);
      expect(stats.total_seeds).toBe(2);
      expect(stats.unique_seeds).toBe(1);
      expect(stats.tools_count).toBe(1);
    });
  });

  describe('清除和销毁', () => {
    it('clear should reset all data', () => {
      inventoryManager.addHerb('mahuang', 5, 'test');
      inventoryManager.clear();

      expect(inventoryManager.getHerbQuantity('mahuang')).toBe(0);
      expect(inventoryManager.getAllTools().length).toBe(0);
    });

    it('destroy should clean up properly', () => {
      inventoryManager.addHerb('mahuang', 5, 'test');
      inventoryManager.destroy();

      expect(InventoryManager.instance).toBeNull();
    });
  });

  describe('全局暴露', () => {
    it('exposeToWindow should set global variable', () => {
      const mockWindow = {};
      vi.stubGlobal('window', mockWindow);

      inventoryManager.exposeToWindow();

      expect((mockWindow as Record<string, unknown>).__INVENTORY_MANAGER__).toBe(inventoryManager);
    });
  });
});