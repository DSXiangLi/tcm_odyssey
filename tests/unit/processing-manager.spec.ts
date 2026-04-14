// tests/unit/processing-manager.spec.ts
/**
 * ProcessingManager单元测试
 *
 * Phase 2 S10.2 实现
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProcessingManager, ProcessingEvent } from '../../src/systems/ProcessingManager';
import { InventoryManager } from '../../src/systems/InventoryManager';
import { EventBus } from '../../src/systems/EventBus';

describe('ProcessingManager', () => {
  beforeEach(() => {
    // 重置所有单例
    ProcessingManager.resetInstance();
    InventoryManager.resetInstance();
    EventBus.resetInstance();

    // 初始化背包，添加测试药材
    const inventory = InventoryManager.getInstance();
    inventory.addHerb('gancao', 5, 'test');
    inventory.addHerb('mahuang', 3, 'test');
  });

  afterEach(() => {
    ProcessingManager.resetInstance();
    InventoryManager.resetInstance();
    EventBus.resetInstance();
  });

  describe('单例模式', () => {
    it('getInstance应返回单例实例', () => {
      const manager1 = ProcessingManager.getInstance();
      const manager2 = ProcessingManager.getInstance();
      expect(manager1).toBe(manager2);
    });

    it('resetInstance应清除单例', () => {
      const manager1 = ProcessingManager.getInstance();
      ProcessingManager.resetInstance();
      const manager2 = ProcessingManager.getInstance();
      expect(manager1).not.toBe(manager2);
    });
  });

  describe('状态管理', () => {
    it('初始状态应为select_herb阶段', () => {
      const manager = ProcessingManager.getInstance();
      expect(manager.getPhase()).toBe('select_herb');
    });

    it('getState应返回完整状态副本', () => {
      const manager = ProcessingManager.getInstance();
      const state = manager.getState();
      expect(state.phase).toBe('select_herb');
      expect(state.herb_id).toBeNull();
      expect(state.method).toBeNull();
      expect(state.adjuvant).toBeNull();
      expect(state.processing_time).toBe(0);
      expect(state.quality_indicators).toEqual([]);
    });

    it('reset应恢复初始状态', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      expect(manager.getPhase()).toBe('select_method');

      manager.reset();
      expect(manager.getPhase()).toBe('select_herb');
      expect(manager.getState().herb_id).toBeNull();
    });
  });

  describe('药材选择', () => {
    it('选择有炮制参数的药材应成功', () => {
      const manager = ProcessingManager.getInstance();
      const result = manager.selectHerb('gancao');
      expect(result).toBe(true);
      expect(manager.getState().herb_id).toBe('gancao');
      expect(manager.getPhase()).toBe('select_method');
    });

    it('选择无炮制参数的药材应失败', () => {
      const manager = ProcessingManager.getInstance();
      const result = manager.selectHerb('unknown_herb');
      expect(result).toBe(false);
      expect(manager.getState().herb_id).toBeNull();
      expect(manager.getPhase()).toBe('select_herb');
    });

    it('选择背包中没有的药材应失败', () => {
      const manager = ProcessingManager.getInstance();
      // 移除甘草
      InventoryManager.getInstance().removeHerb('gancao', 5, 'test');

      const result = manager.selectHerb('gancao');
      expect(result).toBe(false);
      expect(manager.getState().herb_id).toBeNull();
    });

    it('选择药材应发布HERB_SELECTED事件', () => {
      const eventBus = EventBus.getInstance();
      let eventReceived = false;
      let eventData: any = null;

      eventBus.on(ProcessingEvent.HERB_SELECTED, (data) => {
        eventReceived = true;
        eventData = data;
      });

      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');

      expect(eventReceived).toBe(true);
      expect(eventData?.herb_id).toBe('gancao');
    });
  });

  describe('方法选择', () => {
    it('选择有效方法应成功', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');

      const result = manager.selectMethod('mi-zhi');
      expect(result).toBe(true);
      expect(manager.getState().method).toBe('mi-zhi');
    });

    it('蜜炙需要辅料，应进入select_adjuvant阶段', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('mi-zhi');

      expect(manager.getPhase()).toBe('select_adjuvant');
    });

    it('清炒不需要辅料，应跳过select_adjuvant阶段', () => {
      const manager = ProcessingManager.getInstance();
      // 注意：甘草不适合清炒，这里用mahuang测试（mahuang也不适合清炒）
      // 使用一个通用的测试：qing-chao不需要辅料
      manager.selectHerb('gancao');
      manager.selectMethod('qing-chao');

      expect(manager.getState().adjuvant).toBeNull();
      expect(manager.getPhase()).toBe('preprocess');
    });

    it('选择方法应设置目标时间', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('mi-zhi');

      // 蜜炙时间范围 [180, 360]，最优时间应为270
      expect(manager.getState().target_time).toBe(270);
    });

    it('选择无效方法应失败', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');

      const result = manager.selectMethod('invalid-method' as any);
      expect(result).toBe(false);
      expect(manager.getState().method).toBeNull();
    });

    it('选择方法应发布METHOD_SELECTED事件', () => {
      const eventBus = EventBus.getInstance();
      let eventReceived = false;

      eventBus.on(ProcessingEvent.METHOD_SELECTED, () => {
        eventReceived = true;
      });

      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('mi-zhi');

      expect(eventReceived).toBe(true);
    });
  });

  describe('辅料选择', () => {
    beforeEach(() => {
      // 添加辅料到背包（简化处理：当作药材存储）
      const inventory = InventoryManager.getInstance();
      inventory.addHerb('feng-mi', 3, 'test');
    });

    it('选择有效辅料应成功', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('mi-zhi');

      const result = manager.selectAdjuvant('feng-mi');
      expect(result).toBe(true);
      expect(manager.getState().adjuvant).toBe('feng-mi');
      expect(manager.getPhase()).toBe('preprocess');
    });

    it('选择辅料应发布ADJUVANT_SELECTED事件', () => {
      const eventBus = EventBus.getInstance();
      let eventReceived = false;

      eventBus.on(ProcessingEvent.ADJUVANT_SELECTED, () => {
        eventReceived = true;
      });

      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('mi-zhi');
      manager.selectAdjuvant('feng-mi');

      expect(eventReceived).toBe(true);
    });

    it('选择无效辅料应失败', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('mi-zhi');

      const result = manager.selectAdjuvant('invalid-adjuvant' as any);
      expect(result).toBe(false);
    });
  });

  describe('炮制流程', () => {
    it('startPreprocess应进入processing阶段', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('qing-chao'); // 不需要辅料

      manager.startPreprocess();
      expect(manager.getPhase()).toBe('processing');
    });

    it('startProcessing应启动计时器', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('qing-chao');
      manager.startPreprocess();

      manager.startProcessing();
      expect(manager.getPhase()).toBe('processing');

      // 停止计时器避免测试后继续运行
      manager.stopProcessing();
    });

    it('炮制应发布PROCESSING_STARTED事件', () => {
      const eventBus = EventBus.getInstance();
      let eventReceived = false;

      eventBus.on(ProcessingEvent.PROCESSING_STARTED, () => {
        eventReceived = true;
      });

      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('qing-chao');
      manager.startPreprocess();
      manager.startProcessing();

      expect(eventReceived).toBe(true);
      manager.stopProcessing();
    });

    it('stopProcessing应停止计时器并进入check_endpoint阶段', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('qing-chao');
      manager.startPreprocess();
      manager.startProcessing();

      manager.stopProcessing();
      expect(manager.getPhase()).toBe('check_endpoint');
    });
  });

  describe('评分计算', () => {
    it('正确炮制甘草应得高分', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('mi-zhi');
      manager.selectAdjuvant('feng-mi');

      // 提交质量指标
      manager.submitEndpoint(['色泽均匀', '蜜香浓郁', '不焦不糊']);

      const state = manager.getState();
      expect(state.score).toBeDefined();
      expect(state.score?.passed).toBe(true);
      expect(state.score?.total_score).toBeGreaterThanOrEqual(60);
    });

    it('错误方法应得低分', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('qing-chao'); // 甘草不适合清炒

      manager.submitEndpoint([]);

      const state = manager.getState();
      expect(state.score?.method_score).toBe(0);
      expect(state.score?.passed).toBe(false);
    });

    it('评分应发布SCORE_CALCULATED事件', () => {
      const eventBus = EventBus.getInstance();
      let eventReceived = false;

      eventBus.on(ProcessingEvent.SCORE_CALCULATED, () => {
        eventReceived = true;
      });

      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('mi-zhi');
      manager.selectAdjuvant('feng-mi');
      manager.submitEndpoint(['色泽均匀']);

      expect(eventReceived).toBe(true);
    });

    it('评分通过后应自动消耗药材', () => {
      const inventory = InventoryManager.getInstance();
      const initialCount = inventory.getHerbQuantity('gancao');

      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('mi-zhi');
      manager.selectAdjuvant('feng-mi');
      manager.submitEndpoint(['色泽均匀', '蜜香浓郁', '不焦不糊']);

      // 检查药材是否被消耗
      const finalCount = inventory.getHerbQuantity('gancao');
      expect(finalCount).toBeLessThan(initialCount);
    });
  });

  describe('辅助方法', () => {
    it('getAvailableHerbs应返回背包中可炮制的药材', () => {
      const manager = ProcessingManager.getInstance();
      const herbs = manager.getAvailableHerbs();

      expect(herbs).toContain('gancao');
      expect(herbs).toContain('mahuang');
    });

    it('getAvailableMethods应基于当前药材返回可用方法', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');

      const methods = manager.getAvailableMethods();
      expect(methods).toContain('mi-zhi');
    });

    it('getAvailableMethods未选择药材时应返回空数组', () => {
      const manager = ProcessingManager.getInstance();
      const methods = manager.getAvailableMethods();
      expect(methods).toEqual([]);
    });

    it('getAvailableAdjuvants应基于当前方法返回可用辅料', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('mi-zhi');

      const adjuvants = manager.getAvailableAdjuvants();
      expect(adjuvants).toContain('feng-mi');
    });

    it('getAvailableAdjuvants未选择方法时应返回空数组', () => {
      const manager = ProcessingManager.getInstance();
      const adjuvants = manager.getAvailableAdjuvants();
      expect(adjuvants).toEqual([]);
    });
  });

  describe('阶段切换', () => {
    it('setPhase应发布PHASE_CHANGED事件', () => {
      const eventBus = EventBus.getInstance();
      let eventData: any = null;

      eventBus.on(ProcessingEvent.PHASE_CHANGED, (data) => {
        eventData = data;
      });

      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');

      expect(eventData?.old_phase).toBe('select_herb');
      expect(eventData?.new_phase).toBe('select_method');
    });
  });

  describe('暴露全局', () => {
    it('exposeToWindow应暴露方法到window对象', () => {
      const manager = ProcessingManager.getInstance();
      manager.exposeToWindow();

      // 检查window对象（在测试环境中可能不存在）
      if (typeof window !== 'undefined') {
        const exposed = (window as any).__PROCESSING_MANAGER__;
        expect(exposed).toBeDefined();
        expect(exposed.getState).toBeDefined();
        expect(exposed.selectHerb).toBeDefined();
      }
    });

    it('destroy应清理资源', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('mi-zhi');

      manager.destroy();

      // 检查状态已重置
      const state = manager.getState();
      expect(state.phase).toBe('select_herb');
      expect(state.herb_id).toBeNull();
    });
  });
});