# Phase 2 S10-S13 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现炮制游戏、种植游戏、经验值框架、新手引导四个独立模块，完善Phase 2 NPC Agent系统

**Architecture:** 四个模块可独立开发并行执行。炮制游戏参考S9煎药系统架构（数据层→系统层→UI层→场景层），种植游戏在GardenScene基础上扩展，经验值框架集成到SaveManager，新手引导通过TitleScene和各场景首次进入触发。

**Tech Stack:** Phaser 3 + TypeScript + Vitest (单元测试) + Playwright (E2E测试)

---

## 文件结构设计

### 新增文件

```
src/
├── data/
│   ├── processing-data.ts       # S10 炮制数据定义
│   ├── planting-data.ts         # S11 种植数据定义
│   ├── experience-data.ts       # S12 经验值数据定义
│   └── tutorial-data.ts         # S13 新手引导数据定义
│
├── systems/
│   ├── ProcessingManager.ts     # S10 炮制管理器
│   ├── PlantingManager.ts       # S11 种植管理器
│   ├── ExperienceManager.ts     # S12 经验值管理器
│   └── TutorialManager.ts       # S13 新手引导管理器
│
├── ui/
│   ├── ProcessingUI.ts          # S10 炮制UI
│   ├── PlantingUI.ts            # S11 种植UI
│   ├── ExperienceUI.ts          # S12 经验值显示UI
│   └── TutorialUI.ts            # S13 新手引导UI
│
├── scenes/
│   ├── ProcessingScene.ts       # S10 炮制场景
│   └── PlantingScene.ts         # S11 种植场景（可选，或集成到GardenScene）
│
tests/
├── unit/
│   ├── processing-data.spec.ts  # S10 数据测试
│   ├── processing-manager.spec.ts
│   ├── planting-data.spec.ts    # S11 数据测试
│   ├── planting-manager.spec.ts
│   ├── experience-data.spec.ts  # S12 数据测试
│   ├── experience-manager.spec.ts
│   ├── tutorial-data.spec.ts    # S13 数据测试
│   ├── tutorial-manager.spec.ts
│
├── e2e/
│   ├── processing.spec.ts       # S10 E2E测试
│   ├── planting.spec.ts         # S11 E2E测试
│   ├── experience.spec.ts       # S12 E2E测试
│   └ tutorial.spec.ts           # S13 E2E测试
```

### 修改文件

```
src/systems/SaveManager.ts       # S12 集成经验值存储
src/scenes/TitleScene.ts         # S13 添加新手引导入口
src/scenes/GardenScene.ts        # S11 添加种植入口
src/scenes/ClinicScene.ts        # S10 添加炮制入口
src/ui/index.ts                  # 导出新UI组件
src/data/constants.ts            # 添加新场景常量
```

---

## 模块依赖关系

```
S10 炮制游戏 ─────依赖─────→ S8 背包系统 (✅已完成)
                              ↓
S11 种植游戏 ─────依赖─────→ S7 存档系统 (✅已完成)
                              ↓
S12 经验值框架 ───依赖─────→ S7 存档系统 (✅已完成)
                              ↓
S13 新手引导 ─────依赖─────→ S3 对话基础 (✅已完成)

并行执行：四个模块可同时开发，无相互依赖
```

---

## S10: 炮制游戏

### 设计概述

炮制是药材加工的重要环节，通过不同方法改变药材性能。

**炮制方法分类**:
| 方法 | 操作 | 代表药材 |
|-----|------|---------|
| 炒 | 清炒/麸炒/土炒 | 白术、山药 |
| 炙 | 蜜炙/酒炙/醋炙/盐炙 | 黄芪、当归 |
| 煅 | 明煅/煅淬 | 牡蛎、龙骨 |
| 蒸 | 清蒸/酒蒸 | 熟地、黄精 |
| 煮 | 水煮/醋煮 | 川乌、附子 |

**流程**: 选择药材 → 选择方法 → 配料 → 预处理 → 炮制操作 → 判断终点 → 质量评价 + 考教

---

### Task S10.1: 炮制数据结构定义

**Files:**
- Create: `src/data/processing-data.ts`
- Test: `tests/unit/processing-data.spec.ts`

- [ ] **Step 1: 创建炮制类型定义**

```typescript
// src/data/processing-data.ts
/**
 * 炮制游戏数据定义
 *
 * Phase 2 S10.1 实现
 *
 * 内容:
 * - 炮制方法类型定义 (ProcessingMethod)
 * - 炮制辅料定义 (ProcessingAdjuvant)
 * - 炮制参数定义 (ProcessingParams)
 * - 炮制评分规则 (ProcessingScoreRule)
 */

// ===== 炮制方法类型 =====

/**
 * 炮制方法大类
 */
export type ProcessingMethodCategory = 'chao' | 'zhi' | 'duan' | 'zheng' | 'zhu';

/**
 * 具体炮制方法
 */
export type ProcessingMethodType =
  | 'qing-chao'    // 清炒
  | 'fu-chao'      // 麸炒
  | 'tu-chao'      // 土炒
  | 'mi-zhi'       // 蜜炙
  | 'jiu-zhi'      // 酒炙
  | 'cu-zhi'       // 醋炙
  | 'yan-zhi'      // 盐炙
  | 'ming-duan'    // 明煅
  | 'duan-zi'      // 煅淬
  | 'qing-zheng'   // 清蒸
  | 'jiu-zheng'    // 酒蒸
  | 'shui-zhu'     // 水煮
  | 'cu-zhu';      // 醋煮

/**
 * 炮制方法配置
 */
export interface ProcessingMethodConfig {
  id: ProcessingMethodType;
  category: ProcessingMethodCategory;
  name: string;              // 中文名
  description: string;       // 描述
  requires_adjuvant: boolean; // 是否需要辅料
  adjuvant_types?: string[]; // 可用辅料类型
  temperature_range: string; // 温度范围
  time_range: number[];      // 时间范围(秒) [min, max]
  visual_effect: string;     // 视觉效果描述
}

/**
 * 炮制方法数据
 */
export const PROCESSING_METHODS: ProcessingMethodConfig[] = [
  // 炒类
  {
    id: 'qing-chao',
    category: 'chao',
    name: '清炒',
    description: '直接加热翻炒，不加辅料',
    requires_adjuvant: false,
    temperature_range: '中火',
    time_range: [60, 180],
    visual_effect: '药材颜色加深，散发香气'
  },
  {
    id: 'fu-chao',
    category: 'chao',
    name: '麸炒',
    description: '用麦麸作为辅料翻炒',
    requires_adjuvant: true,
    adjuvant_types: ['麦麸'],
    temperature_range: '中火',
    time_range: [90, 240],
    visual_effect: '药材表面附着麦麸，色泽金黄'
  },
  {
    id: 'tu-chao',
    category: 'chao',
    name: '土炒',
    description: '用灶心土作为辅料翻炒',
    requires_adjuvant: true,
    adjuvant_types: ['灶心土'],
    temperature_range: '中火',
    time_range: [120, 300],
    visual_effect: '药材表面附着土粉，增强健脾功效'
  },

  // 炙类
  {
    id: 'mi-zhi',
    category: 'zhi',
    name: '蜜炙',
    description: '用蜂蜜作为辅料炙制',
    requires_adjuvant: true,
    adjuvant_types: ['蜂蜜'],
    temperature_range: '文火',
    time_range: [180, 360],
    visual_effect: '药材表面光亮，蜜香浓郁'
  },
  {
    id: 'jiu-zhi',
    category: 'zhi',
    name: '酒炙',
    description: '用黄酒作为辅料炙制',
    requires_adjuvant: true,
    adjuvant_types: ['黄酒'],
    temperature_range: '文火',
    time_range: [120, 300],
    visual_effect: '药材表面微湿，酒香散发'
  },
  {
    id: 'cu-zhi',
    category: 'zhi',
    name: '醋炙',
    description: '用米醋作为辅料炙制',
    requires_adjuvant: true,
    adjuvant_types: ['米醋'],
    temperature_range: '文火',
    time_range: [90, 240],
    visual_effect: '药材表面醋香，增强入肝功效'
  },
  {
    id: 'yan-zhi',
    category: 'zhi',
    name: '盐炙',
    description: '用盐水作为辅料炙制',
    requires_adjuvant: true,
    adjuvant_types: ['盐水'],
    temperature_range: '文火',
    time_range: [60, 180],
    visual_effect: '药材表面微咸，增强入肾功效'
  },

  // 煅类
  {
    id: 'ming-duan',
    category: 'duan',
    name: '明煅',
    description: '直接高温煅烧',
    requires_adjuvant: false,
    temperature_range: '武火',
    time_range: [300, 600],
    visual_effect: '药材颜色灰白，质地酥脆'
  },
  {
    id: 'duan-zi',
    category: 'duan',
    name: '煅淬',
    description: '高温煅烧后迅速冷却',
    requires_adjuvant: true,
    adjuvant_types: ['水', '醋', '酒'],
    temperature_range: '武火',
    time_range: [240, 480],
    visual_effect: '药材质地酥脆，易于粉碎'
  },

  // 蒸类
  {
    id: 'qing-zheng',
    category: 'zheng',
    name: '清蒸',
    description: '水蒸气蒸制',
    requires_adjuvant: false,
    temperature_range: '文火',
    time_range: [600, 1200],
    visual_effect: '药材质地软化，色泽加深'
  },
  {
    id: 'jiu-zheng',
    category: 'zheng',
    name: '酒蒸',
    description: '用黄酒蒸制',
    requires_adjuvant: true,
    adjuvant_types: ['黄酒'],
    temperature_range: '文火',
    time_range: [480, 960],
    visual_effect: '药材酒香浓郁，增强活血功效'
  },

  // 煮类
  {
    id: 'shui-zhu',
    category: 'zhu',
    name: '水煮',
    description: '水煮制',
    requires_adjuvant: false,
    temperature_range: '文火',
    time_range: [480, 1200],
    visual_effect: '药材质地软化，毒性降低'
  },
  {
    id: 'cu-zhu',
    category: 'zhu',
    name: '醋煮',
    description: '用醋水煮制',
    requires_adjuvant: true,
    adjuvant_types: ['米醋'],
    temperature_range: '文火',
    time_range: [360, 720],
    visual_effect: '药材醋香，增强入肝功效'
  }
];

// ===== 炮制辅料 =====

/**
 * 辅料类型
 */
export type AdjuvantType = 'mai-fu' | 'zao-xin-tu' | 'feng-mi' | 'huang-jiu' | 'mi-cu' | 'yan-shui' | 'shui';

/**
 * 辅料配置
 */
export interface AdjuvantConfig {
  id: AdjuvantType;
  name: string;
  description: string;
  effect: string;          // 功效影响
  inventory_item?: string; // 背包物品ID
}

/**
 * 辅料数据
 */
export const ADJUVANTS: AdjuvantConfig[] = [
  {
    id: 'mai-fu',
    name: '麦麸',
    description: '小麦磨粉后的副产品',
    effect: '增强健脾消食功效',
    inventory_item: 'mai-fu'
  },
  {
    id: 'zao-xin-tu',
    name: '灶心土',
    description: '灶内经久烧制的黄土',
    effect: '增强健脾止泻功效',
    inventory_item: 'zao-xin-tu'
  },
  {
    id: 'feng-mi',
    name: '蜂蜜',
    description: '蜜蜂酿造的蜜',
    effect: '增强润肺补气功效',
    inventory_item: 'feng-mi'
  },
  {
    id: 'huang-jiu',
    name: '黄酒',
    description: '传统酿造米酒',
    effect: '增强活血通络功效',
    inventory_item: 'huang-jiu'
  },
  {
    id: 'mi-cu',
    name: '米醋',
    description: '传统酿造醋',
    effect: '增强入肝止痛功效',
    inventory_item: 'mi-cu'
  },
  {
    id: 'yan-shui',
    name: '盐水',
    description: '食盐溶解的水溶液',
    effect: '增强入肾补肾功效',
    inventory_item: null  // 可现场配制
  },
  {
    id: 'shui',
    name: '清水',
    description: '普通清水',
    effect: '基础辅料',
    inventory_item: null
  }
];

// ===== 药材炮制参数 =====

/**
 * 药材炮制参数
 */
export interface HerbProcessingParams {
  herb_id: string;
  suitable_methods: ProcessingMethodType[];  // 适用方法
  default_method: ProcessingMethodType;      // 推荐方法
  default_adjuvant?: AdjuvantType;           // 推荐辅料
  endpoint_indicator: string;                 // 终点判断指标
  quality_check: string[];                    // 质量检查要点
}

/**
 * 药材炮制参数数据
 */
export const HERB_PROCESSING_PARAMS: HerbProcessingParams[] = [
  {
    herb_id: 'gancao',
    suitable_methods: ['mi-zhi'],
    default_method: 'mi-zhi',
    default_adjuvant: 'feng-mi',
    endpoint_indicator: '表面金黄光亮，不粘手',
    quality_check: ['色泽均匀', '蜜香浓郁', '不焦不糊']
  },
  {
    herb_id: 'mahuang',
    suitable_methods: ['mi-zhi'],
    default_method: 'mi-zhi',
    default_adjuvant: 'feng-mi',
    endpoint_indicator: '表面微黄，蜜香散发',
    quality_check: ['蜜量适中', '发汗解表力减弱', '止咳力增强']
  },
  // 后续扩展其他药材...
];

// ===== 炮制游戏状态 =====

/**
 * 炮制游戏阶段
 */
export type ProcessingPhase =
  | 'select_herb'       // 选择药材
  | 'select_method'     // 选择方法
  | 'select_adjuvant'   // 选择辅料
  | 'preprocess'        // 预处理
  | 'processing'        // 炮制操作
  | 'check_endpoint'    // 判断终点
  | 'evaluate';         // 评分

/**
 * 炮制游戏状态
 */
export interface ProcessingState {
  phase: ProcessingPhase;
  herb_id: string | null;
  method: ProcessingMethodType | null;
  adjuvant: AdjuvantType | null;
  processing_time: number;       // 已炮制时间(秒)
  target_time: number;           // 目标时间(秒)
  temperature: string;           // 当前温度
  quality_indicators: string[];  // 质量指标记录
  score?: ProcessingScoreResult; // 评分结果
}

/**
 * 炮制评分结果
 */
export interface ProcessingScoreResult {
  total_score: number;           // 总分 (0-100)
  method_score: number;          // 方法选择分 (30分)
  adjuvant_score: number;        // 辅料选择分 (20分)
  time_score: number;            // 时间掌握分 (30分)
  quality_score: number;         // 质量判断分 (20分)
  passed: boolean;
  feedback: string;
}

// ===== 辅助函数 =====

/**
 * 获取炮制方法配置
 */
export function getProcessingMethodConfig(methodId: ProcessingMethodType): ProcessingMethodConfig | undefined {
  return PROCESSING_METHODS.find(m => m.id === methodId);
}

/**
 * 获取方法大类配置列表
 */
export function getMethodsByCategory(category: ProcessingMethodCategory): ProcessingMethodConfig[] {
  return PROCESSING_METHODS.filter(m => m.category === category);
}

/**
 * 获取辅料配置
 */
export function getAdjuvantConfig(adjuvantId: AdjuvantType): AdjuvantConfig | undefined {
  return ADJUVANTS.find(a => a.id === adjuvantId);
}

/**
 * 获取药材炮制参数
 */
export function getHerbProcessingParams(herbId: string): HerbProcessingParams | undefined {
  return HERB_PROCESSING_PARAMS.find(p => p.herb_id === herbId);
}

/**
 * 计算炮制评分
 */
export function calculateProcessingScore(
  herbId: string,
  method: ProcessingMethodType,
  adjuvant: AdjuvantType | null,
  processingTime: number,
  qualityIndicators: string[]
): ProcessingScoreResult {
  const params = getHerbProcessingParams(herbId);
  const methodConfig = getProcessingMethodConfig(method);

  if (!params || !methodConfig) {
    return {
      total_score: 0,
      method_score: 0,
      adjuvant_score: 0,
      time_score: 0,
      quality_score: 0,
      passed: false,
      feedback: '药材或方法参数缺失'
    };
  }

  let methodScore = 0;
  let adjuvantScore = 0;
  let timeScore = 0;
  let qualityScore = 0;

  // 1. 方法选择评分 (30分)
  if (params.suitable_methods.includes(method)) {
    methodScore = method === params.default_method ? 30 : 20;
  } else {
    methodScore = 0;
  }

  // 2. 辅料选择评分 (20分)
  if (methodConfig.requires_adjuvant) {
    if (adjuvant === params.default_adjuvant) {
      adjuvantScore = 20;
    } else if (methodConfig.adjuvant_types?.some(t => {
      const adjConfig = ADJUVANTS.find(a => a.name === t);
      return adjConfig?.id === adjuvant;
    })) {
      adjuvantScore = 10;
    } else {
      adjuvantScore = 0;
    }
  } else {
    // 不需要辅料时，未选择辅料得满分
    adjuvantScore = adjuvant === null ? 20 : 10;
  }

  // 3. 时间评分 (30分)
  const [minTime, maxTime] = methodConfig.time_range;
  const optimalTime = (minTime + maxTime) / 2;
  const timeDiff = Math.abs(processingTime - optimalTime);

  if (timeDiff <= 30) {
    timeScore = 30;
  } else if (timeDiff <= 60) {
    timeScore = 20;
  } else if (processingTime >= minTime && processingTime <= maxTime) {
    timeScore = 15;
  } else {
    timeScore = 0;
  }

  // 4. 质量判断评分 (20分)
  const expectedChecks = params.quality_check;
  const matchedChecks = qualityIndicators.filter(ind =>
    expectedChecks.some(check => ind.includes(check) || check.includes(ind))
  );
  qualityScore = (matchedChecks.length / expectedChecks.length) * 20;

  const totalScore = Math.round(methodScore + adjuvantScore + timeScore + qualityScore);

  let feedback = '';
  if (totalScore >= 80) {
    feedback = '优秀！炮制方法正确，时间掌握精准，质量判断准确。';
  } else if (totalScore >= 60) {
    feedback = '良好，基本掌握炮制方法，部分细节需要注意。';
  } else if (totalScore >= 40) {
    feedback = '还需加强练习，重点关注方法选择和时间掌握。';
  } else {
    feedback = '炮制方法掌握不足，建议重新学习药材炮制要求。';
  }

  return {
    total_score: totalScore,
    method_score: Math.round(methodScore),
    adjuvant_score: Math.round(adjuvantScore),
    time_score: Math.round(timeScore),
    quality_score: Math.round(qualityScore),
    passed: totalScore >= 60,
    feedback
  };
}
```

- [ ] **Step 2: 创建炮制数据单元测试**

```typescript
// tests/unit/processing-data.spec.ts
/**
 * 炮制数据结构单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  PROCESSING_METHODS,
  ADJUVANTS,
  HERB_PROCESSING_PARAMS,
  getProcessingMethodConfig,
  getMethodsByCategory,
  getAdjuvantConfig,
  getHerbProcessingParams,
  calculateProcessingScore,
  type ProcessingMethodType,
  type AdjuvantType,
  type ProcessingMethodCategory
} from '../../src/data/processing-data';

describe('Processing Data', () => {
  describe('炮制方法数据', () => {
    it('应包含5大类炮制方法', () => {
      const categories: ProcessingMethodCategory[] = ['chao', 'zhi', 'duan', 'zheng', 'zhu'];
      categories.forEach(cat => {
        const methods = getMethodsByCategory(cat);
        expect(methods.length).toBeGreaterThan(0);
      });
    });

    it('炒类应包含3种方法', () => {
      const chaoMethods = getMethodsByCategory('chao');
      expect(chaoMethods.length).toBe(3);
      expect(chaoMethods.map(m => m.id)).toContain('qing-chao');
      expect(chaoMethods.map(m => m.id)).toContain('fu-chao');
      expect(chaoMethods.map(m => m.id)).toContain('tu-chao');
    });

    it('炙类应包含4种方法', () => {
      const zhiMethods = getMethodsByCategory('zhi');
      expect(zhiMethods.length).toBe(4);
    });

    it('每个方法应有完整配置', () => {
      PROCESSING_METHODS.forEach(method => {
        expect(method.id).toBeDefined();
        expect(method.name).toBeDefined();
        expect(method.description).toBeDefined();
        expect(method.time_range).toBeDefined();
        expect(method.time_range.length).toBe(2);
      });
    });

    it('getProcessingMethodConfig应返回正确配置', () => {
      const config = getProcessingMethodConfig('mi-zhi');
      expect(config).toBeDefined();
      expect(config?.name).toBe('蜜炙');
      expect(config?.requires_adjuvant).toBe(true);
    });

    it('getProcessingMethodConfig对无效ID应返回undefined', () => {
      const config = getProcessingMethodConfig('invalid-method' as ProcessingMethodType);
      expect(config).toBeUndefined();
    });
  });

  describe('辅料数据', () => {
    it('应包含常用辅料', () => {
      expect(ADJUVANTS.length).toBeGreaterThan(5);
      expect(ADJUVANTS.map(a => a.id)).toContain('feng-mi');
      expect(ADJUVANTS.map(a => a.id)).toContain('huang-jiu');
    });

    it('每个辅料应有功效描述', () => {
      ADJUVANTS.forEach(adj => {
        expect(adj.effect).toBeDefined();
      });
    });

    it('getAdjuvantConfig应返回正确配置', () => {
      const config = getAdjuvantConfig('feng-mi');
      expect(config).toBeDefined();
      expect(config?.name).toBe('蜂蜜');
    });
  });

  describe('药材炮制参数', () => {
    it('甘草应有炮制参数', () => {
      const params = getHerbProcessingParams('gancao');
      expect(params).toBeDefined();
      expect(params?.suitable_methods).toContain('mi-zhi');
    });

    it('每种药材应有推荐方法', () => {
      HERB_PROCESSING_PARAMS.forEach(params => {
        expect(params.default_method).toBeDefined();
      });
    });
  });

  describe('评分计算', () => {
    it('正确炮制甘草应得高分', () => {
      const score = calculateProcessingScore(
        'gancao',
        'mi-zhi',
        'feng-mi',
        270,  // 接近最优时间
        ['色泽均匀', '蜜香浓郁', '不焦不糊']
      );
      expect(score.total_score).toBeGreaterThanOrEqual(80);
      expect(score.passed).toBe(true);
    });

    it('错误方法应得低分', () => {
      const score = calculateProcessingScore(
        'gancao',
        'qing-chao',  // 甘草不适合清炒
        null,
        120,
        []
      );
      expect(score.method_score).toBe(0);
      expect(score.passed).toBe(false);
    });

    it('时间超出范围应扣分', () => {
      const score = calculateProcessingScore(
        'gancao',
        'mi-zhi',
        'feng-mi',
        600,  // 远超出时间范围
        ['色泽均匀']
      );
      expect(score.time_score).toBeLessThan(30);
    });
  });
});
```

- [ ] **Step 3: 运行测试验证失败**

Run: `npm run test:unit tests/unit/processing-data.spec.ts`
Expected: FAIL (文件不存在)

- [ ] **Step 4: 创建数据文件**

将Step 1的代码写入 `src/data/processing-data.ts`

- [ ] **Step 5: 运行测试验证通过**

Run: `npm run test:unit tests/unit/processing-data.spec.ts`
Expected: PASS (约15个测试)

- [ ] **Step 6: 提交**

```bash
git add src/data/processing-data.ts tests/unit/processing-data.spec.ts
git commit -m "feat(S10.1): 添加炮制数据结构定义和单元测试"
```

---

### Task S10.2: 创建ProcessingManager系统

**Files:**
- Create: `src/systems/ProcessingManager.ts`
- Test: `tests/unit/processing-manager.spec.ts`

- [ ] **Step 1: 创建ProcessingManager**

```typescript
// src/systems/ProcessingManager.ts
/**
 * 炮制管理系统
 *
 * Phase 2 S10.2 实现
 *
 * 功能:
 * - 炮制游戏状态管理
 * - 药材选择验证
 * - 方法/辅料选择管理
 * - 炮制过程控制
 * - 评分计算
 * - 事件发布
 */

import { EventBus, EventData } from './EventBus';
import {
  getProcessingMethodConfig,
  getHerbProcessingParams,
  getAdjuvantConfig,
  calculateProcessingScore,
  type ProcessingMethodType,
  type AdjuvantType,
  type ProcessingPhase,
  type ProcessingState,
  type ProcessingScoreResult
} from '../data/processing-data';
import { InventoryManager } from './InventoryManager';

/**
 * 炮制事件类型
 */
export enum ProcessingEvent {
  HERB_SELECTED = 'processing:herb_selected',
  METHOD_SELECTED = 'processing:method_selected',
  ADJUVANT_SELECTED = 'processing:adjuvant_selected',
  PHASE_CHANGED = 'processing:phase_changed',
  PROCESSING_STARTED = 'processing:started',
  PROCESSING_TICK = 'processing:tick',
  PROCESSING_COMPLETE = 'processing:complete',
  SCORE_CALCULATED = 'processing:score_calculated'
}

/**
 * 炮制管理器配置
 */
export interface ProcessingManagerConfig {
  autoConsumeHerbs?: boolean;  // 完成后是否自动消耗药材
  autoConsumeAdjuvant?: boolean; // 完成后是否自动消耗辅料
  passThreshold?: number;      // 通过阈值 (默认60)
}

/**
 * 炮制管理器
 *
 * 单例模式，管理整个炮制游戏流程
 */
export class ProcessingManager {
  private static instance: ProcessingManager | null = null;

  private state: ProcessingState;
  private config: ProcessingManagerConfig;
  private eventBus: EventBus;
  private inventoryManager: InventoryManager;
  private processingTimer: number | null = null;

  /**
   * 获取单例实例
   */
  static getInstance(config?: ProcessingManagerConfig): ProcessingManager {
    if (!ProcessingManager.instance) {
      ProcessingManager.instance = new ProcessingManager(config);
    }
    return ProcessingManager.instance;
  }

  /**
   * 重置单例（用于测试）
   */
  static resetInstance(): void {
    if (ProcessingManager.instance) {
      ProcessingManager.instance.destroy();
      ProcessingManager.instance = null;
    }
  }

  private constructor(config?: ProcessingManagerConfig) {
    this.config = {
      autoConsumeHerbs: true,
      autoConsumeAdjuvant: true,
      passThreshold: 60,
      ...config
    };

    this.eventBus = EventBus.getInstance();
    this.inventoryManager = InventoryManager.getInstance();

    this.state = this.createInitialState();
  }

  /**
   * 创建初始状态
   */
  private createInitialState(): ProcessingState {
    return {
      phase: 'select_herb',
      herb_id: null,
      method: null,
      adjuvant: null,
      processing_time: 0,
      target_time: 0,
      temperature: '',
      quality_indicators: [],
      score: undefined
    };
  }

  /**
   * 获取当前状态
   */
  getState(): ProcessingState {
    return { ...this.state };
  }

  /**
   * 获取当前阶段
   */
  getPhase(): ProcessingPhase {
    return this.state.phase;
  }

  /**
   * 重置状态
   */
  reset(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
    this.state = this.createInitialState();
    this.eventBus.emit(ProcessingEvent.PHASE_CHANGED, { new_phase: 'select_herb' });
  }

  /**
   * 选择药材
   */
  selectHerb(herbId: string): boolean {
    // 检查药材是否有炮制参数
    const params = getHerbProcessingParams(herbId);
    if (!params) {
      console.warn(`药材 ${herbId} 没有炮制参数`);
      return false;
    }

    // 检查背包中是否有该药材
    const herbCount = this.inventoryManager.getItemCount('herbs', herbId);
    if (herbCount <= 0) {
      console.warn(`背包中没有药材 ${herbId}`);
      return false;
    }

    this.state.herb_id = herbId;
    this.setPhase('select_method');

    this.eventBus.emit(ProcessingEvent.HERB_SELECTED, { herb_id: herbId });
    return true;
  }

  /**
   * 选择炮制方法
   */
  selectMethod(method: ProcessingMethodType): boolean {
    const methodConfig = getProcessingMethodConfig(method);
    if (!methodConfig) {
      console.warn(`无效的炮制方法 ${method}`);
      return false;
    }

    this.state.method = method;
    this.state.target_time = (methodConfig.time_range[0] + methodConfig.time_range[1]) / 2;
    this.state.temperature = methodConfig.temperature_range;

    // 根据是否需要辅料决定下一阶段
    if (methodConfig.requires_adjuvant) {
      this.setPhase('select_adjuvant');
    } else {
      this.state.adjuvant = null;
      this.setPhase('preprocess');
    }

    this.eventBus.emit(ProcessingEvent.METHOD_SELECTED, { method });
    return true;
  }

  /**
   * 选择辅料
   */
  selectAdjuvant(adjuvant: AdjuvantType): boolean {
    const adjuvantConfig = getAdjuvantConfig(adjuvant);
    if (!adjuvantConfig) {
      console.warn(`无效的辅料 ${adjuvant}`);
      return false;
    }

    // 检查辅料是否需要背包物品
    if (adjuvantConfig.inventory_item) {
      const count = this.inventoryManager.getItemCount('materials', adjuvantConfig.inventory_item);
      if (count <= 0) {
        console.warn(`背包中没有辅料 ${adjuvantConfig.name}`);
        return false;
      }
    }

    this.state.adjuvant = adjuvant;
    this.setPhase('preprocess');

    this.eventBus.emit(ProcessingEvent.ADJUVANT_SELECTED, { adjuvant });
    return true;
  }

  /**
   * 开始预处理（简化：直接进入炮制）
   */
  startPreprocess(): void {
    // 一期简化：预处理直接完成
    this.setPhase('processing');
  }

  /**
   * 开始炮制操作
   */
  startProcessing(): void {
    this.state.processing_time = 0;
    this.eventBus.emit(ProcessingEvent.PROCESSING_STARTED, {
      herb_id: this.state.herb_id,
      method: this.state.method
    });

    // 启动计时器
    this.processingTimer = setInterval(() => {
      this.state.processing_time += 1;
      this.eventBus.emit(ProcessingEvent.PROCESSING_TICK, {
        current_time: this.state.processing_time,
        target_time: this.state.target_time
      });
    }, 1000);  // 每秒更新

    this.setPhase('processing');
  }

  /**
   * 停止炮制
   */
  stopProcessing(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
    this.setPhase('check_endpoint');
  }

  /**
   * 记录质量指标
   */
  recordQualityIndicator(indicator: string): void {
    this.state.quality_indicators.push(indicator);
  }

  /**
   * 提交终点判断
   */
  submitEndpoint(indicators: string[]): void {
    this.state.quality_indicators = indicators;
    this.calculateScore();
  }

  /**
   * 计算评分
   */
  calculateScore(): ProcessingScoreResult {
    if (!this.state.herb_id || !this.state.method) {
      return {
        total_score: 0,
        method_score: 0,
        adjuvant_score: 0,
        time_score: 0,
        quality_score: 0,
        passed: false,
        feedback: '缺少必要参数'
      };
    }

    const score = calculateProcessingScore(
      this.state.herb_id,
      this.state.method,
      this.state.adjuvant,
      this.state.processing_time,
      this.state.quality_indicators
    );

    this.state.score = score;
    this.setPhase('evaluate');

    this.eventBus.emit(ProcessingEvent.SCORE_CALCULATED, { score });

    // 消耗药材和辅料
    if (this.config.autoConsumeHerbs && this.state.herb_id) {
      this.inventoryManager.removeItem('herbs', this.state.herb_id, 1);
    }
    if (this.config.autoConsumeAdjuvant && this.state.adjuvant) {
      const adjConfig = getAdjuvantConfig(this.state.adjuvant);
      if (adjConfig?.inventory_item) {
        this.inventoryManager.removeItem('materials', adjConfig.inventory_item, 1);
      }
    }

    return score;
  }

  /**
   * 设置阶段
   */
  private setPhase(phase: ProcessingPhase): void {
    const oldPhase = this.state.phase;
    this.state.phase = phase;
    this.eventBus.emit(ProcessingEvent.PHASE_CHANGED, {
      old_phase: oldPhase,
      new_phase: phase
    });
  }

  /**
   * 获取可用药材列表（从背包）
   */
  getAvailableHerbs(): string[] {
    const herbs = this.inventoryManager.getItemsByCategory('herbs');
    return herbs.filter(herbId => {
      const params = getHerbProcessingParams(herbId);
      return params !== undefined;
    });
  }

  /**
   * 获取可用方法列表（基于当前药材）
   */
  getAvailableMethods(): ProcessingMethodType[] {
    if (!this.state.herb_id) return [];
    const params = getHerbProcessingParams(this.state.herb_id);
    return params?.suitable_methods || [];
  }

  /**
   * 获取可用辅料列表（基于当前方法）
   */
  getAvailableAdjuvants(): AdjuvantType[] {
    if (!this.state.method) return [];
    const methodConfig = getProcessingMethodConfig(this.state.method);
    if (!methodConfig?.adjuvant_types) return [];

    // 辅料名称映射到ID
    return methodConfig.adjuvant_types.map(name => {
      const adjConfig = ADJUVANTS.find(a => a.name === name);
      return adjConfig?.id || name as AdjuvantType;
    });
  }

  /**
   * 暴露到全局（供测试访问）
   */
  exposeToWindow(): void {
    if (typeof window !== 'undefined') {
      (window as any).__PROCESSING_MANAGER__ = {
        getState: this.getState.bind(this),
        getPhase: this.getPhase.bind(this),
        selectHerb: this.selectHerb.bind(this),
        selectMethod: this.selectMethod.bind(this),
        selectAdjuvant: this.selectAdjuvant.bind(this)
      };
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.reset();
    if (typeof window !== 'undefined') {
      (window as any).__PROCESSING_MANAGER__ = undefined;
    }
  }
}

// 导入辅料数据用于映射
import { ADJUVANTS } from '../data/processing-data';
```

- [ ] **Step 2: 创建ProcessingManager单元测试**

```typescript
// tests/unit/processing-manager.spec.ts
/**
 * ProcessingManager单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProcessingManager, ProcessingEvent } from '../../src/systems/ProcessingManager';
import { InventoryManager } from '../../src/systems/InventoryManager';
import { EventBus } from '../../src/systems/EventBus';

describe('ProcessingManager', () => {
  beforeEach(() => {
    ProcessingManager.resetInstance();
    InventoryManager.resetInstance();
    EventBus.resetInstance();

    // 初始化背包，添加测试药材
    const inventory = InventoryManager.getInstance();
    inventory.addItem('herbs', 'gancao', 5);
    inventory.addItem('materials', 'feng-mi', 3);
  });

  afterEach(() => {
    ProcessingManager.resetInstance();
    InventoryManager.resetInstance();
  });

  describe('状态管理', () => {
    it('初始状态应为select_herb阶段', () => {
      const manager = ProcessingManager.getInstance();
      expect(manager.getPhase()).toBe('select_herb');
    });

    it('reset应恢复初始状态', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      expect(manager.getPhase()).toBe('select_method');

      manager.reset();
      expect(manager.getPhase()).toBe('select_herb');
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
    });

    it('选择背包中没有的药材应失败', () => {
      const manager = ProcessingManager.getInstance();
      // 移除甘草
      InventoryManager.getInstance().removeItem('herbs', 'gancao', 5);

      const result = manager.selectHerb('gancao');
      expect(result).toBe(false);
    });
  });

  describe('方法选择', () => {
    it('选择适合的方法应成功', () => {
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
  });

  describe('辅料选择', () => {
    it('选择正确辅料应成功', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('mi-zhi');

      const result = manager.selectAdjuvant('feng-mi');
      expect(result).toBe(true);
      expect(manager.getState().adjuvant).toBe('feng-mi');
    });

    it('选择背包中没有的辅料应失败', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('mi-zhi');

      // 移除蜂蜜
      InventoryManager.getInstance().removeItem('materials', 'feng-mi', 3);

      const result = manager.selectAdjuvant('feng-mi');
      expect(result).toBe(false);
    });
  });

  describe('评分', () => {
    it('正确炮制甘草应得高分', () => {
      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');
      manager.selectMethod('mi-zhi');
      manager.selectAdjuvant('feng-mi');

      // 简化流程：直接提交
      manager.submitEndpoint(['色泽均匀', '蜜香浓郁', '不焦不糊']);

      const state = manager.getState();
      expect(state.score).toBeDefined();
      expect(state.score?.passed).toBe(true);
    });
  });

  describe('事件发布', () => {
    it('选择药材应发布事件', () => {
      const eventBus = EventBus.getInstance();
      let eventReceived = false;

      eventBus.on(ProcessingEvent.HERB_SELECTED, () => {
        eventReceived = true;
      });

      const manager = ProcessingManager.getInstance();
      manager.selectHerb('gancao');

      expect(eventReceived).toBe(true);
    });
  });
});
```

- [ ] **Step 3: 运行测试验证失败**

Run: `npm run test:unit tests/unit/processing-manager.spec.ts`
Expected: FAIL (文件不存在)

- [ ] **Step 4: 创建系统文件**

将Step 1的代码写入 `src/systems/ProcessingManager.ts`

- [ ] **Step 5: 运行测试验证通过**

Run: `npm run test:unit tests/unit/processing-manager.spec.ts`
Expected: PASS (约12个测试)

- [ ] **Step 6: 提交**

```bash
git add src/systems/ProcessingManager.ts tests/unit/processing-manager.spec.ts
git commit -m "feat(S10.2): 添加ProcessingManager系统和单元测试"
```

---

### Task S10.3: 创建炮制UI

**Files:**
- Create: `src/ui/ProcessingUI.ts`
- Test: `tests/e2e/processing.spec.ts` (基础渲染测试)

（由于篇幅限制，后续任务将在实际执行时补充完整代码）

---

### Task S10.4: 创建炮制场景

**Files:**
- Create: `src/scenes/ProcessingScene.ts`
- Modify: `src/data/constants.ts` (添加PROCESSING场景常量)
- Modify: `src/scenes/ClinicScene.ts` (添加炮制入口)

---

### Task S10.5: 炮制E2E测试验收

**Files:**
- Test: `tests/e2e/processing.spec.ts`

**验收标准**:
- 选择药材→选择方法→选择辅料→炮制→评分完整流程可走通
- 得分≥60分显示"通过"
- NPC反馈正确显示

---

## S11: 种植游戏

### 设计概述

种植游戏是药材从"辨识"到"使用"的完整流程体验。

**流程**:
```
阶段1：药材辨识（获得种子）
├── 方式A：老张教学辨识
├── 方式B：图鉴收集
└── 方式C：任务奖励
         ↓
阶段2：种植（学习药材属性）
├── 选择地块（归经）
├── 选择水源（四气）
├── 选择肥料（五味）
└── 等待生长
         ↓
阶段3：收获考教
├── 选择题考教
├── 自由问答考教
└── 放入药袋（分类）
         ↓
阶段4：炮制（可选）→ S10
阶段5：使用（煎药/入库）→ S9/S8
```

---

### Task S11.1: 种植数据结构定义

**Files:**
- Create: `src/data/planting-data.ts`
- Test: `tests/unit/planting-data.spec.ts`

（详细代码将在执行时编写）

---

### Task S11.2: 创建PlantingManager系统

**Files:**
- Create: `src/systems/PlantingManager.ts`
- Test: `tests/unit/planting-manager.spec.ts`

---

### Task S11.3: 创建种植UI

**Files:**
- Create: `src/ui/PlantingUI.ts`

---

### Task S11.4: 集成到GardenScene

**Files:**
- Modify: `src/scenes/GardenScene.ts`

---

### Task S11.5: 种植E2E测试验收

---

## S12: 经验值框架

### 设计概述

经验值系统用于解锁内容，无等级概念。

**获取渠道**:
| 渠道 | 说明 |
|-----|------|
| 完成Task | 每个Task完成时获得经验值 |
| 病案完成得分 | 根据得分计算经验值 |
| 收集辅助线索 | 每条辅助线索获得额外经验值 |
| 每日学习打卡 | 每天首次学习获得奖励 |
| 成就解锁 | 一次性奖励 |

**解锁内容**:
| 解锁内容 | 说明 |
|---------|------|
| 方剂加减功能 | 选方时显示加减按钮 |
| 新区域（药王谷） | 解锁探索区域 |
| 新NPC | 解锁更多导师 |

---

### Task S12.1: 经验值数据结构定义

**Files:**
- Create: `src/data/experience-data.ts`
- Test: `tests/unit/experience-data.spec.ts`

---

### Task S12.2: 创建ExperienceManager系统

**Files:**
- Create: `src/systems/ExperienceManager.ts`
- Test: `tests/unit/experience-manager.spec.ts`

---

### Task S12.3: 集成到SaveManager

**Files:**
- Modify: `src/systems/SaveManager.ts`

---

### Task S12.4: 创建经验值显示UI

**Files:**
- Create: `src/ui/ExperienceUI.ts`

---

### Task S12.5: 经验值E2E测试验收

---

## S13: 新手引导

### 设计概述

采用"可跳过集中引导 + 分散式场景提示"模式。

**集中引导内容**（TitleScene）:
- 移动：方向键或WASD
- 交互：走近NPC按空格
- 背包：按B键

**分散提示**（各场景首次进入）:
- TownOutdoorScene: "这是百草镇，你将在这里学习中医..."
- ClinicScene: "进入诊所后可以与青木先生对话..."
- GardenScene: "药园可以种植药材..."

---

### Task S13.1: 新手引导数据结构定义

**Files:**
- Create: `src/data/tutorial-data.ts`
- Test: `tests/unit/tutorial-data.spec.ts`

---

### Task S13.2: 创建TutorialManager系统

**Files:**
- Create: `src/systems/TutorialManager.ts`
- Test: `tests/unit/tutorial-manager.spec.ts`

---

### Task S13.3: 创建新手引导UI

**Files:**
- Create: `src/ui/TutorialUI.ts`

---

### Task S13.4: 集成到TitleScene和各场景

**Files:**
- Modify: `src/scenes/TitleScene.ts`
- Modify: `src/scenes/TownOutdoorScene.ts`
- Modify: `src/scenes/ClinicScene.ts`
- Modify: `src/scenes/GardenScene.ts`

---

### Task S13.5: 新手引导E2E测试验收

---

## 验收标准汇总

### S10 炮制游戏验收

```
✅ S10.1 数据测试全部通过 (约15个)
✅ S10.2 Manager测试全部通过 (约12个)
✅ S10.5 E2E测试：完整流程可走通，得分显示正确
```

### S11 种植游戏验收

```
✅ S11.1 数据测试全部通过
✅ S11.2 Manager测试全部通过
✅ S11.5 E2E测试：种植→收获→考教流程可走通
```

### S12 经验值框架验收

```
✅ S12.1 数据测试全部通过
✅ S12.2 Manager测试全部通过
✅ S12.5 E2E测试：经验值获取和解锁显示正确
```

### S13 新手引导验收

```
✅ S13.1 数据测试全部通过
✅ S13.2 Manager测试全部通过
✅ S13.5 E2E测试：引导流程可完成，跳过按钮有效
```

---

## 测试汇总

| 步骤 | 数据测试 | Manager测试 | E2E测试 | 总计 |
|-----|---------|-----------|--------|------|
| S10 | 15 | 12 | 5 | 32 |
| S11 | 12 | 10 | 5 | 27 |
| S12 | 10 | 10 | 5 | 25 |
| S13 | 8 | 8 | 5 | 21 |
| **总计** | **45** | **40** | **20** | **105** |

---

## 执行检查清单

每步完成前必须检查：

- [ ] 所有验收测试100%通过
- [ ] 游戏可启动运行
- [ ] 新功能可见可用
- [ ] 无遗留临时文件
- [ ] git commit已完成

---

*本实现计划创建于 2026-04-14*
*基于2026-04-12-phase2-npc-agent-design.md v3.0*
*遵循writing-plans技能格式*
*Co-Authored-By: Claude <noreply@anthropic.com>*