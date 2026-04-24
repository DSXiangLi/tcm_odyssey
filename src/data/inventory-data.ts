// src/data/inventory-data.ts
/**
 * 背包系统数据定义
 *
 * Phase 2 S8.1 实现
 *
 * 内容:
 * - 药材数据定义 (HerbData)
 * - 药袋分类定义 (HerbBag)
 * - 背包类型定义 (InventoryType)
 * - 种子数据定义 (SeedData)
 * - 工具数据定义 (ToolData)
 * - 知识卡片定义 (KnowledgeCardData)
 */

// ===== 药材数据 =====

/**
 * 药材性味归经
 */
export interface HerbProperties {
  nature: string;      // 四气: 温/寒/平/凉/热
  flavor: string;      // 五味: 辛/甘/酸/苦/咸/淡
  meridian: string;    // 归经: 肺/脾/肝/心/肾等
}

/**
 * 单个药材数据
 */
export interface HerbData {
  id: string;          // 药材ID: "mahuang"
  name: string;        // 中文名: "麻黄"
  category: string;    // 功效分类: "jiebiao" (解表)
  bag_id: string;      // 所属药袋ID: "jiebiao_bag"
  properties: HerbProperties;
  description: string; // 简要描述
  source?: string;     // 获取来源: "planting"(种植), "npc_gift"(NPC赠送)
  icon?: string;       // 图标路径: "assets/herbs/1_麻黄.png"
}

/**
 * 药袋分类
 */
export interface HerbBag {
  id: string;          // 药袋ID: "jiebiao_bag"
  name: string;        // 药袋名: "解表袋"
  category: string;    // 功效分类: "jiebiao"
  description: string; // 药袋描述
  herbs: string[];     // 包含的药材ID列表
  color: string;       // UI显示颜色 (hex)
}

// ===== 背包类型 =====

/**
 * 背包类型枚举
 */
export type InventoryType = 'herbs' | 'seeds' | 'tools' | 'knowledge';

/**
 * 背包类型配置
 */
export interface InventoryTypeConfig {
  id: InventoryType;
  name: string;
  icon: string;        // 图标名称
  description: string;
  has_subcategories: boolean;  // 是否有子分类(如药袋)
}

// ===== 种子数据 =====

/**
 * 种子数据
 */
export interface SeedData {
  id: string;          // 种子ID: "mahuang_seed"
  name: string;        // 种子名: "麻黄种子"
  herb_id: string;     // 对应药材ID
  growth_time: number; // 生长周期(游戏内天数)
  season: string;      // 适宜季节: "spring/summer/autumn/winter"
  water_need: string;  // 水源需求(四气): "warm/cool"
  fertilizer_need: string; // 肥料需求(五味): "sweet/bitter"
}

// ===== 工具数据 =====

/**
 * 工具数据
 */
export interface ToolData {
  id: string;          // 工具ID: "sickle"
  name: string;        // 工具名: "镰刀"
  icon: string;        // 图标名称
  description: string;
  unlock_condition: string; // 解锁条件
  usage_scene: string[];    // 使用场景
}

// ===== 知识卡片数据 =====

/**
 * 知识卡片数据
 */
export interface KnowledgeCardData {
  id: string;          // 卡片ID: "mahuang-tang_card"
  name: string;        // 卡片名: "麻黄汤方剂卡"
  type: 'prescription' | 'syndrome' | 'herb'; // 卡片类型
  related_id: string;  // 关联ID(方剂/证型/药材)
  unlock_task: string; // 解锁Task ID
  description: string;
}

// ===== 一期药材数据 =====

export const HERBS_DATA: HerbData[] = [
  // 解表药 - 辛温解表
  {
    id: 'mahuang',
    name: '麻黄',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '温', flavor: '辛', meridian: '肺' },
    description: '宣肺解表，发汗散寒，利水消肿',
    source: 'planting',
    icon: 'herbs/mahuang'
  },
  {
    id: 'guizhi',
    name: '桂枝',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '温', flavor: '辛甘', meridian: '心、肺' },
    description: '解肌发表，温通经脉，助阳化气',
    source: 'planting',
    icon: 'herbs/guizhi'
  },
  {
    id: 'jingjie',
    name: '荆芥',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '温', flavor: '辛', meridian: '肺、肝' },
    description: '祛风解表，透疹止痒',
    source: 'planting',
    icon: 'herbs/jingjie'
  },
  {
    id: 'shengjiang',
    name: '生姜',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '温', flavor: '辛', meridian: '肺、脾、胃' },
    description: '解表散寒，温中止呕，化痰止咳',
    source: 'planting',
    icon: 'herbs/shengjiang'
  },
  {
    id: 'zisuye',
    name: '紫苏叶',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '温', flavor: '辛', meridian: '肺、脾' },
    description: '解表散寒，行气和胃',
    source: 'planting',
    icon: 'herbs/zisuye'
  },
  {
    id: 'baizhi',
    name: '白芷',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '温', flavor: '辛', meridian: '肺、胃' },
    description: '祛风散寒，通窍止痛，燥湿止带',
    source: 'planting',
    icon: 'herbs/baizhi'
  },
  {
    id: 'xixin',
    name: '细辛',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '温', flavor: '辛', meridian: '肺、肾' },
    description: '祛风散寒，通窍止痛，温肺化饮',
    source: 'planting',
    icon: 'herbs/xixin'
  },
  {
    id: 'xinyi',
    name: '辛夷',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '温', flavor: '辛', meridian: '肺、胃' },
    description: '散风寒，通鼻窍',
    source: 'planting',
    icon: 'herbs/xinyi'
  },
  {
    id: 'cangerzi',
    name: '苍耳子',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '温', flavor: '辛苦', meridian: '肺' },
    description: '散风寒，通鼻窍，祛风湿',
    source: 'planting',
    icon: 'herbs/cangerzi'
  },
  {
    id: 'fangfeng',
    name: '防风',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '温', flavor: '辛甘', meridian: '膀胱、肝、脾' },
    description: '祛风解表，胜湿止痛',
    source: 'planting',
    icon: 'herbs/fangfeng'
  },
  {
    id: 'qianghuo',
    name: '羌活',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '温', flavor: '辛苦', meridian: '膀胱、肾' },
    description: '解表散寒，祛风胜湿，止痛',
    source: 'planting',
    icon: 'herbs/qianghuo'
  },
  {
    id: 'xiangru',
    name: '香薷',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '温', flavor: '辛', meridian: '肺、胃' },
    description: '发汗解表，化湿和中，利水消肿',
    source: 'planting',
    icon: 'herbs/xiangru'
  },

  // 解表药 - 辛凉解表
  {
    id: 'bohe',
    name: '薄荷',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '凉', flavor: '辛', meridian: '肺、肝' },
    description: '疏散风热，清利头目，利咽透疹',
    source: 'planting',
    icon: 'herbs/bohe'
  },
  {
    id: 'sangye',
    name: '桑叶',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '寒', flavor: '苦甘', meridian: '肺、肝' },
    description: '疏散风热，清肺润燥，平肝明目',
    source: 'planting',
    icon: 'herbs/sangye'
  },
  {
    id: 'juhua',
    name: '菊花',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '微寒', flavor: '辛甘苦', meridian: '肺、肝' },
    description: '疏散风热，清肝明目，清热解毒',
    source: 'planting',
    icon: 'herbs/juhua'
  },
  {
    id: 'niubangzi',
    name: '牛蒡子',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '寒', flavor: '辛苦', meridian: '肺、胃' },
    description: '疏散风热，宣肺利咽，解毒透疹',
    source: 'npc_gift',
    icon: 'herbs/niubangzi'
  },
  {
    id: 'chantui',
    name: '蝉蜕',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '寒', flavor: '甘', meridian: '肺、肝' },
    description: '疏散风热，透疹止痒，明目退翳',
    source: 'planting',
    icon: 'herbs/chantui'
  },
  {
    id: 'congbai',
    name: '葱白',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '温', flavor: '辛', meridian: '肺、胃' },
    description: '发散风寒，通阳止痛',
    source: 'planting',
    icon: 'herbs/congbai'
  },
  {
    id: 'douchi',
    name: '豆豉',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '凉', flavor: '辛', meridian: '肺、胃' },
    description: '解表除烦，宣发郁热',
    source: 'npc_gift',
    icon: 'herbs/douchi'
  },
  {
    id: 'manjingzi',
    name: '蔓荆子',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '寒', flavor: '辛苦', meridian: '膀胱、肝、胃' },
    description: '疏散风热，清利头目',
    source: 'planting',
    icon: 'herbs/manjingzi'
  },

  // 解表药 - 其他解表
  {
    id: 'chaihu',
    name: '柴胡',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '寒', flavor: '辛苦', meridian: '肝、胆' },
    description: '疏散退热，疏肝解郁，升举阳气',
    source: 'planting',
    icon: 'herbs/chaihu'
  },
  {
    id: 'gegen',
    name: '葛根',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '凉', flavor: '辛甘', meridian: '脾、胃' },
    description: '解肌退热，透疹，生津止渴',
    source: 'planting',
    icon: 'herbs/gegen'
  },
  {
    id: 'shengma',
    name: '升麻',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '寒', flavor: '辛甘', meridian: '肺、脾、胃' },
    description: '发表透疹，清热解毒，升举阳气',
    source: 'planting',
    icon: 'herbs/shengma'
  },
  {
    id: 'jianghuang',
    name: '姜黄',
    category: 'jiebiao',
    bag_id: 'jiebiao_bag',
    properties: { nature: '温', flavor: '辛苦', meridian: '脾、肝' },
    description: '活血行气，通经止痛',
    source: 'planting',
    icon: 'herbs/jianghuang'
  },

  // 清热药
  {
    id: 'jinyinhua',
    name: '金银花',
    category: 'qingre',
    bag_id: 'qingre_bag',
    properties: { nature: '寒', flavor: '甘', meridian: '肺、心、胃' },
    description: '清热解毒，疏散风热',
    source: 'planting'
  },
  {
    id: 'lianqiao',
    name: '连翘',
    category: 'qingre',
    bag_id: 'qingre_bag',
    properties: { nature: '寒', flavor: '苦', meridian: '肺、心、小肠' },
    description: '清热解毒，消肿散结，疏散风热',
    source: 'planting'
  },
  {
    id: 'zhuye',
    name: '竹叶',
    category: 'qingre',
    bag_id: 'qingre_bag',
    properties: { nature: '寒', flavor: '甘淡', meridian: '心、胃' },
    description: '清热除烦，生津利尿',
    source: 'npc_gift'
  },
  {
    id: 'lugen',
    name: '芦根',
    category: 'qingre',
    bag_id: 'qingre_bag',
    properties: { nature: '寒', flavor: '甘', meridian: '肺、胃' },
    description: '清热生津，除烦止呕',
    source: 'npc_gift'
  },

  // 止咳平喘药
  {
    id: 'xingren',
    name: '杏仁',
    category: 'zhike',
    bag_id: 'zhike_bag',
    properties: { nature: '温', flavor: '苦', meridian: '肺、大肠' },
    description: '降气止咳平喘，润肠通便',
    source: 'planting'
  },
  {
    id: 'jiegeng',
    name: '桔梗',
    category: 'zhike',
    bag_id: 'zhike_bag',
    properties: { nature: '平', flavor: '辛苦', meridian: '肺' },
    description: '宣肺利咽，祛痰排脓',
    source: 'planting'
  },

  // 补益调和药
  {
    id: 'gancao',
    name: '甘草',
    category: 'buyi',
    bag_id: 'buyi_bag',
    properties: { nature: '平', flavor: '甘', meridian: '心、肺、脾、胃' },
    description: '补脾益气，清热解毒，祛痰止咳，调和诸药',
    source: 'planting'
  },
  {
    id: 'shaoyao',
    name: '芍药',
    category: 'buyi',
    bag_id: 'buyi_bag',
    properties: { nature: '微寒', flavor: '苦酸', meridian: '肝、脾' },
    description: '养血敛阴，柔肝止痛',
    source: 'planting'
  },
  {
    id: 'dazao',
    name: '大枣',
    category: 'buyi',
    bag_id: 'buyi_bag',
    properties: { nature: '温', flavor: '甘', meridian: '脾、胃' },
    description: '补中益气，养血安神',
    source: 'planting'
  }
];

// ===== 药袋分类数据 =====

export const HERB_BAGS: HerbBag[] = [
  {
    id: 'jiebiao_bag',
    name: '解表袋',
    category: 'jiebiao',
    description: '发散风寒、风热，解除表证',
    herbs: [
      // 辛温解表
      'mahuang', 'guizhi', 'jingjie', 'shengjiang', 'zisuye', 'baizhi', 'xixin', 'xinyi', 'cangerzi', 'fangfeng', 'qianghuo', 'xiangru',
      // 辛凉解表
      'bohe', 'sangye', 'juhua', 'niubangzi', 'chantui', 'congbai', 'douchi', 'manjingzi',
      // 其他解表
      'chaihu', 'gegen', 'shengma', 'jianghuang'
    ],
    color: '#4CAF50'  // 绿色
  },
  {
    id: 'qingre_bag',
    name: '清热袋',
    category: 'qingre',
    description: '清解里热，清热解毒',
    herbs: ['jinyinhua', 'lianqiao', 'zhuye', 'lugen'],
    color: '#2196F3'  // 蓝色
  },
  {
    id: 'zhike_bag',
    name: '止咳平喘袋',
    category: 'zhike',
    description: '止咳化痰，平喘利咽',
    herbs: ['xingren', 'jiegeng', 'niubangzi'],
    color: '#FF9800'  // 橙色
  },
  {
    id: 'buyi_bag',
    name: '补益调和袋',
    category: 'buyi',
    description: '补益气血，调和诸药',
    herbs: ['gancao', 'shaoyao', 'shengjiang', 'dazao'],
    color: '#E91E63'  // 玫红色
  }
];

// ===== 背包类型配置 =====

export const INVENTORY_TYPES: InventoryTypeConfig[] = [
  {
    id: 'herbs',
    name: '药材背包',
    icon: 'herb_bag',
    description: '存放各种药材，按功效分类于药袋中',
    has_subcategories: true
  },
  {
    id: 'seeds',
    name: '种植背包',
    icon: 'seed_bag',
    description: '存放种子、肥料、水源等种植材料',
    has_subcategories: false
  },
  {
    id: 'tools',
    name: '工具背包',
    icon: 'tool_bag',
    description: '存放镰刀、水桶、药罐等工具',
    has_subcategories: false
  },
  {
    id: 'knowledge',
    name: '知识背包',
    icon: 'book',
    description: '存放方剂卡片、医书等知识资料',
    has_subcategories: false
  }
];

// ===== 种子数据 (一期) =====

export const SEEDS_DATA: SeedData[] = [
  {
    id: 'mahuang_seed',
    name: '麻黄种子',
    herb_id: 'mahuang',
    growth_time: 5,
    season: 'spring',
    water_need: 'warm',
    fertilizer_need: 'bitter'
  },
  {
    id: 'guizhi_seed',
    name: '桂枝种子',
    herb_id: 'guizhi',
    growth_time: 7,
    season: 'spring',
    water_need: 'warm',
    fertilizer_need: 'sweet'
  },
  {
    id: 'jinyinhua_seed',
    name: '金银花种子',
    herb_id: 'jinyinhua',
    growth_time: 6,
    season: 'summer',
    water_need: 'cool',
    fertilizer_need: 'sweet'
  },
  {
    id: 'lianqiao_seed',
    name: '连翘种子',
    herb_id: 'lianqiao',
    growth_time: 6,
    season: 'spring',
    water_need: 'cool',
    fertilizer_need: 'bitter'
  }
];

// ===== 工具数据 =====

export const TOOLS_DATA: ToolData[] = [
  {
    id: 'sickle',
    name: '镰刀',
    icon: 'sickle',
    description: '用于收割药材',
    unlock_condition: 'default',  // 默认解锁
    usage_scene: ['GardenScene']
  },
  {
    id: 'water_bucket',
    name: '水桶',
    icon: 'bucket',
    description: '用于浇灌药材',
    unlock_condition: 'default',
    usage_scene: ['GardenScene']
  },
  {
    id: 'medicine_pot',
    name: '药罐',
    icon: 'pot',
    description: '用于煎药',
    unlock_condition: 'task:mahuang-tang-learning',
    usage_scene: ['ClinicScene']
  },
  {
    id: 'cutting_knife',
    name: '切药刀',
    icon: 'knife',
    description: '用于切制药材',
    unlock_condition: 'task:mahuang-tang-learning',
    usage_scene: ['ClinicScene']
  }
];

// ===== 知识卡片数据 =====

export const KNOWLEDGE_CARDS_DATA: KnowledgeCardData[] = [
  {
    id: 'mahuang-tang_card',
    name: '麻黄汤方剂卡',
    type: 'prescription',
    related_id: 'mahuang-tang',
    unlock_task: 'mahuang-tang-learning',
    description: '发汗解表，宣肺平喘'
  },
  {
    id: 'guizhi-tang_card',
    name: '桂枝汤方剂卡',
    type: 'prescription',
    related_id: 'guizhi-tang',
    unlock_task: 'guizhi-tang-learning',
    description: '解肌发表，调和营卫'
  },
  {
    id: 'yin-qiao-san_card',
    name: '银翘散方剂卡',
    type: 'prescription',
    related_id: 'yin-qiao-san',
    unlock_task: 'yin-qiao-san-learning',
    description: '辛凉解表，清热解毒'
  },
  {
    id: 'sang-ju-yin_card',
    name: '桑菊饮方剂卡',
    type: 'prescription',
    related_id: 'sang-ju-yin',
    unlock_task: 'sang-ju-yin-learning',
    description: '疏风清热，宣肺止咳'
  }
];

// ===== 辅助函数 =====

/**
 * 根据药材ID获取药材数据
 */
export function getHerbById(id: string): HerbData | undefined {
  return HERBS_DATA.find(h => h.id === id);
}

/**
 * 根据药袋ID获取药袋数据
 */
export function getHerbBagById(id: string): HerbBag | undefined {
  return HERB_BAGS.find(b => b.id === id);
}

/**
 * 根据功效分类获取药袋
 */
export function getHerbBagByCategory(category: string): HerbBag | undefined {
  return HERB_BAGS.find(b => b.category === category);
}

/**
 * 获取药材所属药袋
 */
export function getHerbBag(herbId: string): HerbBag | undefined {
  const herb = getHerbById(herbId);
  if (!herb) return undefined;
  return getHerbBagById(herb.bag_id);
}

/**
 * 获取药袋内所有药材
 */
export function getHerbsInBag(bagId: string): HerbData[] {
  const bag = getHerbBagById(bagId);
  if (!bag) return [];
  return bag.herbs.map(id => getHerbById(id)!).filter(Boolean);
}

/**
 * 根据工具ID获取工具数据
 */
export function getToolById(id: string): ToolData | undefined {
  return TOOLS_DATA.find(t => t.id === id);
}

/**
 * 根据种子ID获取种子数据
 */
export function getSeedById(id: string): SeedData | undefined {
  return SEEDS_DATA.find(s => s.id === id);
}

/**
 * 根据知识卡片ID获取卡片数据
 */
export function getKnowledgeCardById(id: string): KnowledgeCardData | undefined {
  return KNOWLEDGE_CARDS_DATA.find(k => k.id === id);
}

/**
 * 检查工具是否解锁
 */
export function isToolUnlocked(toolId: string, completedTasks: string[]): boolean {
  const tool = getToolById(toolId);
  if (!tool) return false;

  if (tool.unlock_condition === 'default') return true;

  // 格式: "task:xxx"
  if (tool.unlock_condition.startsWith('task:')) {
    const taskId = tool.unlock_condition.replace('task:', '');
    return completedTasks.includes(taskId);
  }

  return false;
}

/**
 * 检查知识卡片是否解锁
 */
export function isKnowledgeCardUnlocked(cardId: string, completedTasks: string[]): boolean {
  const card = getKnowledgeCardById(cardId);
  if (!card) return false;
  return completedTasks.includes(card.unlock_task);
}