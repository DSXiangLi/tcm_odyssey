// tests/phase2/logic/npc-trigger.spec.ts
/**
 * NPC触发逻辑测试 (S3-L001~L003)
 *
 * 验证：
 * - isGenerating状态匹配
 * - eventHistory记录
 * - checkTrigger距离判断
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NPCInteractionSystem, NPCConfig } from '../../../src/systems/NPCInteraction';

describe('NPC Trigger Logic Tests (S3-L001~L003)', () => {
  let npcSystem: NPCInteractionSystem;

  beforeEach(() => {
    npcSystem = new NPCInteractionSystem('test_player');
  });

  it('S3-L001: isDialogActive returns correct state', () => {
    // 初始状态应该是false
    expect(npcSystem.isDialogActive()).toBe(false);

    // 注册NPC后仍然是false
    const qingmuConfig: NPCConfig = {
      id: 'qingmu',
      name: '青木先生',
      sceneId: 'ClinicScene',
      position: { x: 200, y: 150 },
      triggerDistance: 50
    };
    npcSystem.registerNPC(qingmuConfig);

    expect(npcSystem.isDialogActive()).toBe(false);
  });

  it('S3-L002: eventHistory records enter/dialog/leave', () => {
    // 记录进入
    npcSystem.recordEnter('qingmu');
    const history1 = npcSystem.getHistory();
    expect(history1.length).toBe(1);
    expect(history1[0].type).toBe('enter');
    expect(history1[0].npcId).toBe('qingmu');
    expect(history1[0].playerId).toBe('test_player');

    // 记录离开
    npcSystem.recordLeave('qingmu');
    const history2 = npcSystem.getHistory();
    expect(history2.length).toBe(2);
    expect(history2[1].type).toBe('leave');

    // 清空历史
    npcSystem.clearHistory();
    expect(npcSystem.getHistory().length).toBe(0);
  });

  it('S3-L003: checkTrigger returns correct NPC at distance', () => {
    const qingmuConfig: NPCConfig = {
      id: 'qingmu',
      name: '青木先生',
      sceneId: 'ClinicScene',
      position: { x: 200, y: 150 },
      triggerDistance: 50
    };
    npcSystem.registerNPC(qingmuConfig);

    // 在触发范围内（距离小于50）
    const triggered1 = npcSystem.checkTrigger({ x: 210, y: 160 }, 'ClinicScene');
    expect(triggered1).not.toBeNull();
    expect(triggered1?.id).toBe('qingmu');

    // 在触发范围边界（刚好50距离）
    const triggered2 = npcSystem.checkTrigger({ x: 250, y: 150 }, 'ClinicScene');
    expect(triggered2?.id).toBe('qingmu');

    // 在触发范围外（距离大于50）
    const triggered3 = npcSystem.checkTrigger({ x: 300, y: 200 }, 'ClinicScene');
    expect(triggered3).toBeNull();

    // 在不同场景（即使位置相同）
    const triggered4 = npcSystem.checkTrigger({ x: 210, y: 160 }, 'TownOutdoorScene');
    expect(triggered4).toBeNull();
  });

  it('S3-L004: registerNPC and getNPCConfig work correctly', () => {
    const qingmuConfig: NPCConfig = {
      id: 'qingmu',
      name: '青木先生',
      sceneId: 'ClinicScene',
      position: { x: 200, y: 150 },
      triggerDistance: 50
    };

    // 注册NPC
    npcSystem.registerNPC(qingmuConfig);

    // 获取配置
    const config = npcSystem.getNPCConfig('qingmu');
    expect(config).not.toBeUndefined();
    expect(config?.name).toBe('青木先生');
    expect(config?.sceneId).toBe('ClinicScene');

    // 获取所有NPC
    const allNpcs = npcSystem.getAllNPCs();
    expect(allNpcs.length).toBe(1);
    expect(allNpcs[0].id).toBe('qingmu');

    // 获取不存在的NPC
    const missingConfig = npcSystem.getNPCConfig('unknown');
    expect(missingConfig).toBeUndefined();
  });

  it('S3-L005: multiple NPCs registered correctly', () => {
    // 注册多个NPC
    npcSystem.registerNPC({
      id: 'qingmu',
      name: '青木先生',
      sceneId: 'ClinicScene',
      position: { x: 200, y: 150 },
      triggerDistance: 50
    });

    npcSystem.registerNPC({
      id: 'zhangsan',
      name: '老张',
      sceneId: 'GardenScene',
      position: { x: 300, y: 200 },
      triggerDistance: 60
    });

    // 验证数量
    expect(npcSystem.getAllNPCs().length).toBe(2);

    // 验证分别触发
    const triggeredClinic = npcSystem.checkTrigger({ x: 210, y: 160 }, 'ClinicScene');
    expect(triggeredClinic?.id).toBe('qingmu');

    const triggeredGarden = npcSystem.checkTrigger({ x: 310, y: 210 }, 'GardenScene');
    expect(triggeredGarden?.id).toBe('zhangsan');
  });

  it('S3-L006: destroy cleans up all resources', () => {
    // 注册NPC并添加历史记录
    npcSystem.registerNPC({
      id: 'qingmu',
      name: '青木先生',
      sceneId: 'ClinicScene',
      position: { x: 200, y: 150 },
      triggerDistance: 50
    });
    npcSystem.recordEnter('qingmu');

    // 销毁系统
    npcSystem.destroy();

    // 验证清理完成
    expect(npcSystem.getAllNPCs().length).toBe(0);
    expect(npcSystem.getHistory().length).toBe(0);
    expect(npcSystem.isDialogActive()).toBe(false);
    expect(npcSystem.getCurrentDialogNpcId()).toBeNull();
  });
});