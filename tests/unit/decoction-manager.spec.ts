// tests/unit/decoction-manager.spec.ts
/**
 * 煎药管理系统单元测试
 *
 * Phase 2 S9.2 实现
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DecoctionManager, DecoctionEvent } from '../../src/systems/DecoctionManager';
import { EventBus } from '../../src/systems/EventBus';
import { InventoryManager } from '../../src/systems/InventoryManager';

describe('S9.2: DecoctionManager 系统', () => {
  let manager: DecoctionManager;
  let eventBus: EventBus;
  let inventoryManager: InventoryManager;

  beforeEach(() => {
    // 确保先实例化EventBus
    const tempEventBus = EventBus.getInstance();
    tempEventBus.clearAll();

    // 重置所有单例
    try {
      DecoctionManager.resetInstance();
    } catch (e) {
      // resetInstance可能因为EventBus未准备好而失败
    }

    InventoryManager.resetInstance();

    manager = DecoctionManager.getInstance();
    eventBus = EventBus.getInstance();
    inventoryManager = InventoryManager.getInstance();

    // 初始化背包（添加测试药材）
    inventoryManager.addHerb('mahuang', 5);
    inventoryManager.addHerb('guizhi', 5);
    inventoryManager.addHerb('xingren', 5);
    inventoryManager.addHerb('gancao', 5);
    inventoryManager.addHerb('jinyinhua', 3);
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
    }
    if (eventBus) {
      eventBus.destroy();
    }
    if (inventoryManager) {
      inventoryManager.destroy();
    }
  });

  describe('单例模式', () => {
    it('should return same instance', () => {
      const instance1 = DecoctionManager.getInstance();
      const instance2 = DecoctionManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create instance with config', () => {
      DecoctionManager.resetInstance();
      const customManager = DecoctionManager.getInstance({
        autoConsumeHerbs: false,
        passThreshold: 80
      });
      expect(customManager).toBeDefined();
    });
  });

  describe('状态管理', () => {
    it('should have initial state', () => {
      const state = manager.getState();
      expect(state.phase).toBe('select_prescription');
      expect(state.prescription_id).toBeNull();
      expect(state.selected_herbs).toEqual([]);
    });

    it('should return current phase', () => {
      expect(manager.getPhase()).toBe('select_prescription');
    });

    it('should return available actions for current phase', () => {
      const actions = manager.getAvailableActions();
      expect(actions).toContain('select_prescription');
    });
  });

  describe('选择方剂', () => {
    it('should select prescription correctly', () => {
      const result = manager.selectPrescription('mahuang-tang');
      expect(result).toBe(true);

      const state = manager.getState();
      expect(state.prescription_id).toBe('mahuang-tang');
      expect(state.phase).toBe('select_herbs');
      expect(state.target_time).toBe(600);
      expect(state.fire_level).toBe('wu');
    });

    it('should emit PRESCRIPTION_SELECTED event', () => {
      const handler = vi.fn();
      eventBus.on(DecoctionEvent.PRESCRIPTION_SELECTED, handler);

      manager.selectPrescription('mahuang-tang');

      expect(handler).toHaveBeenCalledWith({
        prescription_id: 'mahuang-tang',
        target_time: 600,
        default_fire: 'wu'
      });
    });

    it('should return false for invalid prescription', () => {
      const result = manager.selectPrescription('invalid');
      expect(result).toBe(false);

      const state = manager.getState();
      expect(state.prescription_id).toBeNull();
    });

    it('should reset state when selecting new prescription', () => {
      manager.selectPrescription('mahuang-tang');
      manager.addHerb('mahuang');

      manager.selectPrescription('guizhi-tang');

      const state = manager.getState();
      expect(state.selected_herbs).toEqual([]);
    });
  });

  describe('药材选择', () => {
    beforeEach(() => {
      manager.selectPrescription('mahuang-tang');
    });

    it('should add herb correctly', () => {
      const result = manager.addHerb('mahuang');
      expect(result).toBe(true);

      const state = manager.getState();
      expect(state.selected_herbs).toContain('mahuang');
    });

    it('should emit HERB_ADDED event', () => {
      const handler = vi.fn();
      eventBus.on(DecoctionEvent.HERB_ADDED, handler);

      manager.addHerb('mahuang');

      expect(handler).toHaveBeenCalledWith({
        herb_id: 'mahuang',
        herb_name: '麻黄'
      });
    });

    it('should not add herb without prescription', () => {
      manager.reset();
      const result = manager.addHerb('mahuang');
      expect(result).toBe(false);
    });

    it('should not add herb in wrong phase', () => {
      // 先添加药材，才能进入下一阶段
      manager.addHerb('mahuang');
      manager.proceedToNextPhase(); // 进入配伍阶段
      // 在配伍阶段不能添加药材
      const result = manager.addHerb('guizhi');
      expect(result).toBe(false);
    });

    it('should not add duplicate herb', () => {
      manager.addHerb('mahuang');
      const result = manager.addHerb('mahuang');
      expect(result).toBe(false);
    });

    it('should not add herb not in inventory', () => {
      const result = manager.addHerb('unknown_herb');
      expect(result).toBe(false);
    });

    it('should remove herb correctly', () => {
      manager.addHerb('mahuang');
      const result = manager.removeHerb('mahuang');
      expect(result).toBe(true);

      const state = manager.getState();
      expect(state.selected_herbs).not.toContain('mahuang');
    });

    it('should emit HERB_REMOVED event', () => {
      manager.addHerb('mahuang');

      const handler = vi.fn();
      eventBus.on(DecoctionEvent.HERB_REMOVED, handler);

      manager.removeHerb('mahuang');

      expect(handler).toHaveBeenCalled();
    });

    it('should not remove herb not in selection', () => {
      const result = manager.removeHerb('mahuang');
      expect(result).toBe(false);
    });
  });

  describe('配伍放置', () => {
    beforeEach(() => {
      manager.selectPrescription('mahuang-tang');
      manager.addHerb('mahuang');
      manager.addHerb('guizhi');
      manager.proceedToNextPhase(); // 进入配伍阶段
    });

    it('should place role correctly', () => {
      const result = manager.placeRole('mahuang', '君');
      expect(result).toBe(true);

      const state = manager.getState();
      expect(state.compatibility_placement.get('mahuang')).toBe('君');
    });

    it('should emit ROLE_PLACED event', () => {
      const handler = vi.fn();
      eventBus.on(DecoctionEvent.ROLE_PLACED, handler);

      manager.placeRole('mahuang', '君');

      expect(handler).toHaveBeenCalledWith({
        herb_id: 'mahuang',
        herb_name: '麻黄',
        role: '君'
      });
    });

    it('should not place role for unselected herb', () => {
      const result = manager.placeRole('xingren', '佐');
      expect(result).toBe(false);
    });

    it('should not place role in wrong phase', () => {
      // 先放置所有已选药材的角色才能进入下一阶段
      manager.placeRole('mahuang', '君');
      manager.placeRole('guizhi', '臣');
      manager.proceedToNextPhase(); // 进入顺序阶段
      // 在顺序阶段不能放置角色
      const result = manager.placeRole('mahuang', '臣'); // 尝试改变角色
      expect(result).toBe(false);
    });
  });

  describe('顺序设置', () => {
    beforeEach(() => {
      manager.selectPrescription('mahuang-tang');
      manager.addHerb('mahuang');
      manager.addHerb('guizhi');
      manager.proceedToNextPhase(); // 配伍阶段
      manager.placeRole('mahuang', '君');
      manager.placeRole('guizhi', '臣');
      manager.proceedToNextPhase(); // 顺序阶段
    });

    it('should set order correctly', () => {
      const result = manager.setOrder('mahuang', 'first');
      expect(result).toBe(true);

      const state = manager.getState();
      expect(state.order_settings.get('mahuang')).toBe('first');
    });

    it('should emit ORDER_SET event', () => {
      const handler = vi.fn();
      eventBus.on(DecoctionEvent.ORDER_SET, handler);

      manager.setOrder('mahuang', 'first');

      expect(handler).toHaveBeenCalled();
    });

    it('should not set order in wrong phase', () => {
      manager.proceedToNextPhase(); // 进入火候阶段
      const result = manager.setOrder('mahuang', 'first');
      expect(result).toBe(false);
    });
  });

  describe('火候设置', () => {
    beforeEach(() => {
      manager.selectPrescription('mahuang-tang');
      manager.addHerb('mahuang');
      manager.addHerb('guizhi');
      manager.addHerb('xingren');
      manager.addHerb('gancao');

      // 快速进入火候阶段
      manager.proceedToNextPhase(); // 配伍
      manager.placeRole('mahuang', '君');
      manager.placeRole('guizhi', '臣');
      manager.placeRole('xingren', '佐');
      manager.placeRole('gancao', '使');
      manager.proceedToNextPhase(); // 顺序
      manager.proceedToNextPhase(); // 火候
    });

    it('should set fire level correctly', () => {
      const result = manager.setFireLevel('wu');
      expect(result).toBe(true);

      const state = manager.getState();
      expect(state.fire_level).toBe('wu');
    });

    it('should emit FIRE_SET event', () => {
      const handler = vi.fn();
      eventBus.on(DecoctionEvent.FIRE_SET, handler);

      manager.setFireLevel('wu');

      expect(handler).toHaveBeenCalled();
    });

    it('should not set fire in wrong phase', () => {
      manager.reset();
      manager.selectPrescription('mahuang-tang');
      const result = manager.setFireLevel('wu');
      expect(result).toBe(false);
    });
  });

  describe('煎煮过程', () => {
    beforeEach(() => {
      manager.selectPrescription('mahuang-tang');
      manager.addHerb('mahuang');
      manager.addHerb('guizhi');
      manager.addHerb('xingren');
      manager.addHerb('gancao');

      // 快速进入煎煮阶段
      manager.proceedToNextPhase(); // 配伍
      manager.placeRole('mahuang', '君');
      manager.placeRole('guizhi', '臣');
      manager.placeRole('xingren', '佐');
      manager.placeRole('gancao', '使');
      manager.proceedToNextPhase(); // 顺序
      manager.proceedToNextPhase(); // 火候
      manager.setFireLevel('wu');
    });

    it('should start decoction', () => {
      const result = manager.startDecoction();
      expect(result).toBe(true);

      const state = manager.getState();
      expect(state.phase).toBe('decocting');
    });

    it('should emit DECOCTION_STARTED event', () => {
      const handler = vi.fn();
      eventBus.on(DecoctionEvent.DECOCTION_STARTED, handler);

      manager.startDecoction();

      expect(handler).toHaveBeenCalled();
    });

    it('should tick decoction time', (done) => {
      manager.startDecoction();

      const handler = vi.fn();
      eventBus.on(DecoctionEvent.DECOCTION_TICK, handler);

      // 等待1秒后检查
      setTimeout(() => {
        expect(handler).toHaveBeenCalled();
        done();
      }, 1100);
    });

    it('should complete decoction', () => {
      manager.startDecoction();

      // 等待几秒后完成
      const result = manager.completeDecoction();
      expect(result).toBe(true);

      const state = manager.getState();
      expect(state.phase).toBe('evaluate');
    });

    it('should emit DECOCTION_COMPLETE event', () => {
      manager.startDecoction();

      const handler = vi.fn();
      eventBus.on(DecoctionEvent.DECOCTION_COMPLETE, handler);

      manager.completeDecoction();

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('评分计算', () => {
    beforeEach(() => {
      manager.selectPrescription('mahuang-tang');
      manager.addHerb('mahuang');
      manager.addHerb('guizhi');
      manager.addHerb('xingren');
      manager.addHerb('gancao');

      // 配伍
      manager.proceedToNextPhase();
      manager.placeRole('mahuang', '君');
      manager.placeRole('guizhi', '臣');
      manager.placeRole('xingren', '佐');
      manager.placeRole('gancao', '使');

      // 顺序
      manager.proceedToNextPhase();

      // 火候
      manager.proceedToNextPhase();
      manager.setFireLevel('wu');

      // 煎煮
      manager.startDecoction();
    });

    it('should calculate score correctly', () => {
      // 煎煮到目标时间
      manager.completeDecoction();

      const state = manager.getState();
      expect(state.score).toBeDefined();
      expect(state.score?.passed).toBe(true);
    });

    it('should emit SCORE_CALCULATED event', () => {
      const handler = vi.fn();
      eventBus.on(DecoctionEvent.SCORE_CALCULATED, handler);

      manager.completeDecoction();

      expect(handler).toHaveBeenCalled();
      const scoreResult = handler.mock.calls[0][0];
      expect(scoreResult.total_score).toBeDefined();
      expect(scoreResult.dimension_scores).toBeDefined();
    });

    it('should auto consume herbs on pass', () => {
      manager.completeDecoction();

      // 检查药材是否被消耗
      const herbs = inventoryManager.getAllHerbs();
      const mahuangItem = herbs.find(h => h.herb?.id === 'mahuang');
      expect(mahuangItem?.quantity).toBe(4); // 原本5，消耗1

      const guizhiItem = herbs.find(h => h.herb?.id === 'guizhi');
      expect(guizhiItem?.quantity).toBe(4);
    });
  });

  describe('阶段流转', () => {
    it('should check canProceedToNextPhase', () => {
      manager.selectPrescription('mahuang-tang');

      // 没有选择药材时不能进入下一阶段
      expect(manager.canProceedToNextPhase()).toBe(false);

      manager.addHerb('mahuang');
      manager.addHerb('guizhi');
      manager.addHerb('xingren');
      manager.addHerb('gancao');

      expect(manager.canProceedToNextPhase()).toBe(true);
    });

    it('should proceed to next phase', () => {
      manager.selectPrescription('mahuang-tang');
      manager.addHerb('mahuang');
      manager.addHerb('guizhi');
      manager.addHerb('xingren');
      manager.addHerb('gancao');

      const result = manager.proceedToNextPhase();
      expect(result).toBe(true);
      expect(manager.getPhase()).toBe('place_compatibility');
    });

    it('should emit PHASE_CHANGED event', () => {
      manager.selectPrescription('mahuang-tang');

      const handler = vi.fn();
      eventBus.on(DecoctionEvent.PHASE_CHANGED, handler);

      manager.addHerb('mahuang');
      manager.proceedToNextPhase();

      expect(handler).toHaveBeenCalledWith({
        old_phase: 'select_herbs',
        new_phase: 'place_compatibility'
      });
    });
  });

  describe('重置和销毁', () => {
    it('should reset game', () => {
      manager.selectPrescription('mahuang-tang');
      manager.addHerb('mahuang');

      manager.reset();

      const state = manager.getState();
      expect(state.phase).toBe('select_prescription');
      expect(state.prescription_id).toBeNull();
      expect(state.selected_herbs).toEqual([]);
    });

    it('should expose to window', () => {
      manager.exposeToWindow();
      expect((window as any).__DECOCTION_MANAGER__).toBe(manager);
    });

    it('should destroy properly', () => {
      manager.exposeToWindow();
      manager.startDecoction(); // 启动计时器

      manager.destroy();

      expect((window as any).__DECOCTION_MANAGER__).toBeUndefined();
    });
  });
});