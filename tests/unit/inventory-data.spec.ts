// tests/unit/inventory-data.spec.ts
/**
 * 背包数据结构单元测试
 * Phase 2 S8.1 验收测试
 */

import { describe, it, expect } from 'vitest';
import {
  HERBS_DATA,
  HERB_BAGS,
  INVENTORY_TYPES,
  SEEDS_DATA,
  TOOLS_DATA,
  KNOWLEDGE_CARDS_DATA,
  getHerbById,
  getHerbBagById,
  getHerbBagByCategory,
  getHerbsInBag,
  getToolById,
  getSeedById,
  getKnowledgeCardById,
  isToolUnlocked,
  isKnowledgeCardUnlocked,
  HerbData,
  HerbBag,
  InventoryTypeConfig,
  SeedData,
  ToolData,
  KnowledgeCardData
} from '../../src/data/inventory-data';

describe('S8.1: 背包数据结构', () => {
  describe('HERBS_DATA - 药材数据', () => {
    it('should have correct number of herbs for Phase 1', () => {
      // 一期涉及的药材数量（从prescriptions.json提取）
      expect(HERBS_DATA.length).toBeGreaterThanOrEqual(15);
    });

    it('should have all required fields for each herb', () => {
      HERBS_DATA.forEach((herb: HerbData) => {
        expect(herb.id).toBeDefined();
        expect(herb.name).toBeDefined();
        expect(herb.category).toBeDefined();
        expect(herb.bag_id).toBeDefined();
        expect(herb.properties).toBeDefined();
        expect(herb.properties.nature).toBeDefined();
        expect(herb.properties.flavor).toBeDefined();
        expect(herb.properties.meridian).toBeDefined();
        expect(herb.source).toBeDefined();
      });
    });

    it('should include core herbs from Phase 1 prescriptions', () => {
      // 麻黄汤核心药材
      expect(getHerbById('mahuang')).toBeDefined();
      expect(getHerbById('guizhi')).toBeDefined();
      expect(getHerbById('xingren')).toBeDefined();
      expect(getHerbById('gancao')).toBeDefined();

      // 桂枝汤核心药材
      expect(getHerbById('shaoyao')).toBeDefined();
      expect(getHerbById('shengjiang')).toBeDefined();
      expect(getHerbById('dazao')).toBeDefined();

      // 银翘散核心药材
      expect(getHerbById('jinyinhua')).toBeDefined();
      expect(getHerbById('lianqiao')).toBeDefined();
      expect(getHerbById('bohe')).toBeDefined();
      expect(getHerbById('jingjie')).toBeDefined();

      // 桑菊饮核心药材
      expect(getHerbById('sangye')).toBeDefined();
      expect(getHerbById('juhua')).toBeDefined();
    });

    it('should have correct category mapping', () => {
      // 解表药
      const jiebiaoHerbs = HERBS_DATA.filter(h => h.category === 'jiebiao');
      expect(jiebiaoHerbs.length).toBeGreaterThanOrEqual(6);

      // 清热药
      const qingreHerbs = HERBS_DATA.filter(h => h.category === 'qingre');
      expect(qingreHerbs.length).toBeGreaterThanOrEqual(2);
    });

    it('should have valid bag_id for each herb', () => {
      const bagIds = HERB_BAGS.map(b => b.id);
      HERBS_DATA.forEach((herb: HerbData) => {
        expect(bagIds).toContain(herb.bag_id);
      });
    });
  });

  describe('HERB_BAGS - 药袋分类', () => {
    it('should have correct number of bags for Phase 1', () => {
      expect(HERB_BAGS.length).toBe(4);
    });

    it('should have 解表袋 with correct herbs', () => {
      const bag = getHerbBagById('jiebiao_bag');
      expect(bag).toBeDefined();
      expect(bag?.name).toBe('解表袋');
      expect(bag?.herbs).toContain('mahuang');
      expect(bag?.herbs).toContain('guizhi');
      expect(bag?.herbs).toContain('bohe');
    });

    it('should have 清热袋 with correct herbs', () => {
      const bag = getHerbBagById('qingre_bag');
      expect(bag).toBeDefined();
      expect(bag?.name).toBe('清热袋');
      expect(bag?.herbs).toContain('jinyinhua');
      expect(bag?.herbs).toContain('lianqiao');
    });

    it('should have 止咳平喘袋 with correct herbs', () => {
      const bag = getHerbBagById('zhike_bag');
      expect(bag).toBeDefined();
      expect(bag?.name).toBe('止咳平喘袋');
      expect(bag?.herbs).toContain('xingren');
    });

    it('should have 补益调和袋 with correct herbs', () => {
      const bag = getHerbBagById('buyi_bag');
      expect(bag).toBeDefined();
      expect(bag?.name).toBe('补益调和袋');
      expect(bag?.herbs).toContain('gancao');
    });

    it('should have color defined for each bag', () => {
      HERB_BAGS.forEach((bag: HerbBag) => {
        expect(bag.color).toBeDefined();
        expect(bag.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('getHerbsInBag should return correct herb objects', () => {
      const herbsInJiebiao = getHerbsInBag('jiebiao_bag');
      expect(herbsInJiebiao.length).toBeGreaterThan(0);
      expect(herbsInJiebiao[0].id).toBeDefined();
      expect(herbsInJiebiao[0].name).toBeDefined();
    });
  });

  describe('INVENTORY_TYPES - 背包类型', () => {
    it('should have 4 inventory types', () => {
      expect(INVENTORY_TYPES.length).toBe(4);
    });

    it('should have correct type configurations', () => {
      const types = INVENTORY_TYPES.map(t => t.id);
      expect(types).toContain('herbs');
      expect(types).toContain('seeds');
      expect(types).toContain('tools');
      expect(types).toContain('knowledge');
    });

    it('should have icon for each type', () => {
      INVENTORY_TYPES.forEach((config: InventoryTypeConfig) => {
        expect(config.icon).toBeDefined();
      });
    });

    it('should mark herbs type as having subcategories', () => {
      const herbsConfig = INVENTORY_TYPES.find(t => t.id === 'herbs');
      expect(herbsConfig?.has_subcategories).toBe(true);
    });
  });

  describe('SEEDS_DATA - 种子数据', () => {
    it('should have seeds for core herbs', () => {
      expect(getSeedById('mahuang_seed')).toBeDefined();
      expect(getSeedById('guizhi_seed')).toBeDefined();
      expect(getSeedById('jinyinhua_seed')).toBeDefined();
    });

    it('should have all required fields for each seed', () => {
      SEEDS_DATA.forEach((seed: SeedData) => {
        expect(seed.id).toBeDefined();
        expect(seed.name).toBeDefined();
        expect(seed.herb_id).toBeDefined();
        expect(seed.growth_time).toBeDefined();
        expect(seed.season).toBeDefined();
        expect(seed.water_need).toBeDefined();
        expect(seed.fertilizer_need).toBeDefined();
      });
    });

    it('should reference valid herb_id', () => {
      SEEDS_DATA.forEach((seed: SeedData) => {
        const herb = getHerbById(seed.herb_id);
        expect(herb).toBeDefined();
      });
    });
  });

  describe('TOOLS_DATA - 工具数据', () => {
    it('should have basic tools available', () => {
      expect(getToolById('sickle')).toBeDefined();
      expect(getToolById('water_bucket')).toBeDefined();
    });

    it('should have unlock_condition for each tool', () => {
      TOOLS_DATA.forEach((tool: ToolData) => {
        expect(tool.unlock_condition).toBeDefined();
      });
    });

    it('default tools should have "default" unlock condition', () => {
      const sickle = getToolById('sickle');
      expect(sickle?.unlock_condition).toBe('default');

      const bucket = getToolById('water_bucket');
      expect(bucket?.unlock_condition).toBe('default');
    });

    it('advanced tools should have task unlock condition', () => {
      const pot = getToolById('medicine_pot');
      expect(pot?.unlock_condition).toContain('task:');

      const knife = getToolById('cutting_knife');
      expect(knife?.unlock_condition).toContain('task:');
    });

    it('isToolUnlocked should work correctly', () => {
      // 默认解锁的工具
      expect(isToolUnlocked('sickle', [])).toBe(true);
      expect(isToolUnlocked('water_bucket', [])).toBe(true);

      // 需要任务解锁的工具
      expect(isToolUnlocked('medicine_pot', [])).toBe(false);
      expect(isToolUnlocked('medicine_pot', ['mahuang-tang-learning'])).toBe(true);
    });
  });

  describe('KNOWLEDGE_CARDS_DATA - 知识卡片', () => {
    it('should have cards for Phase 1 prescriptions', () => {
      expect(getKnowledgeCardById('mahuang-tang_card')).toBeDefined();
      expect(getKnowledgeCardById('guizhi-tang_card')).toBeDefined();
      expect(getKnowledgeCardById('yin-qiao-san_card')).toBeDefined();
      expect(getKnowledgeCardById('sang-ju-yin_card')).toBeDefined();
    });

    it('should have correct type for prescription cards', () => {
      const mahuangCard = getKnowledgeCardById('mahuang-tang_card');
      expect(mahuangCard?.type).toBe('prescription');
    });

    it('should have unlock_task for each card', () => {
      KNOWLEDGE_CARDS_DATA.forEach((card: KnowledgeCardData) => {
        expect(card.unlock_task).toBeDefined();
      });
    });

    it('isKnowledgeCardUnlocked should work correctly', () => {
      expect(isKnowledgeCardUnlocked('mahuang-tang_card', [])).toBe(false);
      expect(isKnowledgeCardUnlocked('mahuang-tang_card', ['mahuang-tang-learning'])).toBe(true);
    });
  });

  describe('Helper functions', () => {
    it('getHerbById should return undefined for invalid id', () => {
      expect(getHerbById('invalid_herb')).toBeUndefined();
    });

    it('getHerbBagById should return undefined for invalid id', () => {
      expect(getHerbBagById('invalid_bag')).toBeUndefined();
    });

    it('getHerbBagByCategory should work correctly', () => {
      const bag = getHerbBagByCategory('jiebiao');
      expect(bag).toBeDefined();
      expect(bag?.id).toBe('jiebiao_bag');
    });

    it('getHerbsInBag should return empty array for invalid bag', () => {
      const herbs = getHerbsInBag('invalid_bag');
      expect(herbs).toEqual([]);
    });
  });
});