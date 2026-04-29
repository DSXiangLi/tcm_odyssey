// src/data/npc-config.ts
/**
 * NPC配置注册表
 * 定义所有NPC的基本属性、位置、触发条件
 */

import { SCENES } from './constants';

export interface NPCConfig {
  id: string;                    // NPC唯一标识
  name: string;                  // 显示名称
  sceneId: string;               // 所在场景ID
  position: { x: number; y: number };  // 像素坐标
  triggerDistance: number;       // 触发距离(像素)
  spriteKey: string;             // 像素精灵图key
  welcomeMessage?: string;       // 进入场景欢迎语(可选)
  teachingStyle: string[];       // 教学风格关键词(用于Skills加载)
}

/**
 * NPC注册表
 */
export const NPC_REGISTRY: NPCConfig[] = [
  {
    id: 'qingmu',
    name: '青木先生',
    sceneId: SCENES.CLINIC,
    position: { x: 200, y: 150 },
    triggerDistance: 100,
    spriteKey: 'npc_qingmu',
    welcomeMessage: '欢迎来到青木诊所。',
    teachingStyle: ['引导式教学', '经典引用', '案例驱动']
  },
  {
    id: 'laozhang',
    name: '老张',
    sceneId: SCENES.GARDEN,
    position: { x: 180, y: 120 },
    triggerDistance: 80,
    spriteKey: 'npc_laozhang',
    welcomeMessage: '药园里的事情问我。',
    teachingStyle: ['实践指导', '药材辨识']
  },
  {
    id: 'neighbor',
    name: '邻居阿姨',
    sceneId: SCENES.HOME,
    position: { x: 150, y: 100 },
    triggerDistance: 60,
    spriteKey: 'npc_neighbor',
    welcomeMessage: '今天天气不错。',
    teachingStyle: ['日常对话', '药膳介绍']
  }
];

/**
 * 根据场景获取NPC配置
 */
export function getNPCsByScene(sceneId: string): NPCConfig[] {
  return NPC_REGISTRY.filter(npc => npc.sceneId === sceneId);
}

/**
 * 根据ID获取NPC配置
 */
export function getNPCById(npcId: string): NPCConfig | undefined {
  return NPC_REGISTRY.find(npc => npc.id === npcId);
}