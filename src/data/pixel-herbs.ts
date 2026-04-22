// src/data/pixel-herbs.ts
/**
 * 像素药材数据定义
 *
 * Phase 2.5 煎药小游戏UI重构 Task 5
 *
 * 内容:
 * - 像素栅格数据 (grid: string[])
 * - 颜色调色板 (palette: Record<string, string>)
 * - 22种药材像素图标数据
 * - getPixelHerbById() 查询函数
 *
 * 数据来源: docs/ui/煎药小游戏/herb-icons.jsx
 */

// ===== 像素药材数据接口 =====

/**
 * 像素药材数据接口
 *
 * 与 HerbTagComponent.HerbData 接口保持一致
 */
export interface PixelHerbData {
  /** 药材ID */
  id: string;
  /** 药材名称 */
  name: string;
  /** 药材功效属性 */
  prop: string;
  /** 药材数量 */
  count: number;
  /** 像素栅格数据 (10行 × 可变宽度) */
  grid: string[];
  /** 颜色调色板 (字符键 → 十六进制颜色值) */
  palette: Record<string, string>;
}

// ===== 基础栅格定义 =====

/** 当归栅格 - 紫粉色根 */
const GRID_DANGGUI: string[] = [
  '   aa    ',
  '  abba   ',
  '  abba   ',
  '   aa    ',
  '   cc    ',
  '  cddc   ',
  ' cdeedc  ',
  'cdeeeeedc',
  ' cdeedc  ',
  '  cddc   ',
];

/** 黄芪栅格 - 金色根条 */
const GRID_HUANGQI: string[] = [
  '  a      ',
  ' aba     ',
  ' abba    ',
  '  aba a  ',
  '  abaaba ',
  '   ababba',
  '   abbba ',
  '   abba  ',
  '   aba   ',
  '   ba    ',
];

/** 人参栅格 - 人形根 */
const GRID_RENSHEN: string[] = [
  '   aa    ',
  '  abba   ',
  '  abba   ',
  '  abba   ',
  ' abbbba  ',
  ' abbbba  ',
  '  abba   ',
  '  a  a   ',
  ' a    a  ',
  'a      a ',
];

/** 甘草栅格 - 黄色茎 */
const GRID_GANCAO: string[] = [
  '   a     ',
  '   aa    ',
  '  aba    ',
  '  aba    ',
  '  aba    ',
  ' abba    ',
  ' abba a  ',
  ' abbaaba ',
  ' abbbbba ',
  '  aaaaa  ',
];

/** 枸杞栅格 - 红色果实 */
const GRID_GOUQI: string[] = [
  '  b  b   ',
  ' bab bab ',
  ' baa baa ',
  '  b   b  ',
  '    c    ',
  '   ccc   ',
  '   bbb   ',
  '   bab   ',
  '   bab   ',
  '    b    ',
];

/** 菊花栅格 - 花朵 */
const GRID_JUHUA: string[] = [
  ' b  b  b ',
  '  bbbbb  ',
  ' bbaaabb ',
  ' baccab  ',
  ' bacccab ',
  ' bacccab ',
  ' baccabb ',
  ' bbaaabb ',
  '  bbbbb  ',
  ' b  b  b ',
];

/** 陈皮栅格 - 干橘皮卷条 */
const GRID_CHENPI: string[] = [
  ' aaa     ',
  'abbba ab ',
  'abcba abb',
  'abbba bba',
  ' aaa abcb',
  '   abbba ',
  '  abcba  ',
  ' abbba   ',
  ' aaa     ',
  '         ',
];

/** 茯苓栅格 - 白色菌块 */
const GRID_FULING: string[] = [
  '   aaa   ',
  '  abbba  ',
  ' abcccba ',
  ' abcccba ',
  'abbcccbba',
  'abcccccba',
  ' abcccba ',
  '  abbba  ',
  '   aaa   ',
  '         ',
];

/** 生姜栅格 - 姜 */
const GRID_SHENGJIANG: string[] = [
  '   aa    ',
  '  abba a ',
  ' abbba ab',
  ' abbba bb',
  'abbbba ab',
  'abbbbba  ',
  ' abbbba  ',
  '  abbba  ',
  '   aab   ',
  '    a    ',
];

/** 肉桂栅格 - 桂皮卷 */
const GRID_ROUGUI: string[] = [
  ' aaaaaa  ',
  'abbbbba  ',
  'abccccba ',
  'abc  cba ',
  'abc  cba ',
  'abc  cba ',
  'abccccba ',
  'abbbbba  ',
  ' aaaaaa  ',
  '         ',
];

/** 薄荷栅格 - 薄荷叶 */
const GRID_BOHE: string[] = [
  '   bb    ',
  '  bbba   ',
  ' bbabba  ',
  'babaabba ',
  'babaabba ',
  'babaabb  ',
  ' bbabb   ',
  '  bbb    ',
  '   bb    ',
  '    b    ',
];

/** 金银花栅格 - 黄白花 */
const GRID_JINYINHUA: string[] = [
  '  a  a   ',
  ' aba aba ',
  ' aba aba ',
  '  a   a  ',
  '   bbb   ',
  '  bcccb  ',
  '  bcccb  ',
  '   bbb   ',
  '    b    ',
  '    b    ',
];

// ===== 基础调色板定义 =====

/** 当归调色板 */
const PAL_DANGGUI: Record<string, string> = {
  a: '#6a8c78',
  b: '#8ab098',
  c: '#8a4a2a',
  d: '#b86a3a',
  e: '#d9955a',
};

/** 黄芪调色板 */
const PAL_HUANGQI: Record<string, string> = {
  a: '#c89550',
  b: '#8a5a2a',
};

/** 人参调色板 */
const PAL_RENSHEN: Record<string, string> = {
  a: '#3a2418',
  b: '#c89550',
};

/** 甘草调色板 */
const PAL_GANCAO: Record<string, string> = {
  a: '#8a5a2a',
  b: '#e8c991',
};

/** 枸杞调色板 */
const PAL_GOUQI: Record<string, string> = {
  a: '#ffd24a',
  b: '#b8322c',
  c: '#6a8c78',
};

/** 菊花调色板 */
const PAL_JUHUA: Record<string, string> = {
  a: '#ffd24a',
  b: '#e8c991',
  c: '#c89550',
};

/** 陈皮调色板 */
const PAL_CHENPI: Record<string, string> = {
  a: '#8a4a2a',
  b: '#d9955a',
  c: '#ffae2a',
};

/** 茯苓调色板 */
const PAL_FULING: Record<string, string> = {
  a: '#8a6a3a',
  b: '#d9c49a',
  c: '#f4ead5',
};

/** 生姜调色板 */
const PAL_SHENGJIANG: Record<string, string> = {
  a: '#8a5a2a',
  b: '#e8c991',
};

/** 肉桂调色板 */
const PAL_ROUGUI: Record<string, string> = {
  a: '#3a1a0a',
  b: '#8a4a2a',
  c: '#c89550',
};

/** 薄荷调色板 */
const PAL_BOHE: Record<string, string> = {
  a: '#b8d0a0',
  b: '#4a7a3a',
};

/** 金银花调色板 */
const PAL_JINYINHUA: Record<string, string> = {
  a: '#f4ead5',
  b: '#4a7a3a',
  c: '#ffd24a',
};

// ===== 衍生调色板定义 =====

/** 川芎调色板 (共享当归栅格) */
const PAL_CHUANXIONG: Record<string, string> = {
  a: '#4a7a3a',
  b: '#6a8c78',
  c: '#8a4a2a',
  d: '#b86a3a',
  e: '#d9955a',
};

/** 白术调色板 (共享茯苓栅格) */
const PAL_BAIZHU: Record<string, string> = {
  a: '#6a4a2a',
  b: '#d9c49a',
  c: '#f4ead5',
};

/** 熟地调色板 (共享人参栅格) */
const PAL_SHUDI: Record<string, string> = {
  a: '#1a0a04',
  b: '#4a2818',
};

/** 白芍调色板 (共享黄芪栅格) */
const PAL_BAISHAO: Record<string, string> = {
  a: '#f4ead5',
  b: '#c89550',
};

/** 大枣调色板 (共享枸杞栅格) */
const PAL_DAZAO: Record<string, string> = {
  a: '#ffd24a',
  b: '#8a1f1a',
  c: '#6a8c78',
};

/** 半夏调色板 (共享茯苓栅格) */
const PAL_BANXIA: Record<string, string> = {
  a: '#3a2418',
  b: '#8a6a3a',
  c: '#c89550',
};

/** 黄连调色板 (共享黄芪栅格) */
const PAL_HUANGLIAN: Record<string, string> = {
  a: '#ffd24a',
  b: '#b8633a',
};

/** 麻黄调色板 (共享薄荷栅格) */
const PAL_MAHUANG: Record<string, string> = {
  a: '#a2d090',
  b: '#2a4a1a',
};

/** 石斛调色板 (共享薄荷栅格) */
const PAL_SHIHU: Record<string, string> = {
  a: '#c8e0a0',
  b: '#6a8a3a',
};

/** 附子调色板 (共享人参栅格) */
const PAL_FUZI: Record<string, string> = {
  a: '#3a1a0a',
  b: '#8a4a2a',
};

// ===== 像素药材数据数组 =====

/**
 * 22种像素药材数据
 *
 * 栅格共享说明:
 * - 川芎 (chuanxiong) → 当归栅格
 * - 白术 (baizhu) → 茯苓栅格
 * - 熟地 (shudi) → 人参栅格
 * - 白芍 (baishao) → 黄芪栅格
 * - 大枣 (dazao) → 枸杞栅格
 * - 半夏 (banxia) → 茯苓栅格
 * - 黄连 (huanglian) → 黄芪栅格
 * - 麻黄 (mahuang) → 薄荷栅格
 * - 石斛 (shihu) → 薄荷栅格
 * - 附子 (fuzi) → 人参栅格
 */
export const PIXEL_HERBS: PixelHerbData[] = [
  // ===== 独立栅格药材 =====
  {
    id: 'danggui',
    name: '当归',
    prop: '补血',
    count: 6,
    grid: GRID_DANGGUI,
    palette: PAL_DANGGUI,
  },
  {
    id: 'huangqi',
    name: '黄芪',
    prop: '补气',
    count: 4,
    grid: GRID_HUANGQI,
    palette: PAL_HUANGQI,
  },
  {
    id: 'renshen',
    name: '人参',
    prop: '大补',
    count: 1,
    grid: GRID_RENSHEN,
    palette: PAL_RENSHEN,
  },
  {
    id: 'gancao',
    name: '甘草',
    prop: '调和',
    count: 9,
    grid: GRID_GANCAO,
    palette: PAL_GANCAO,
  },
  {
    id: 'gouqi',
    name: '枸杞',
    prop: '明目',
    count: 12,
    grid: GRID_GOUQI,
    palette: PAL_GOUQI,
  },
  {
    id: 'juhua',
    name: '菊花',
    prop: '清热',
    count: 7,
    grid: GRID_JUHUA,
    palette: PAL_JUHUA,
  },
  {
    id: 'chenpi',
    name: '陈皮',
    prop: '理气',
    count: 5,
    grid: GRID_CHENPI,
    palette: PAL_CHENPI,
  },
  {
    id: 'fuling',
    name: '茯苓',
    prop: '利水',
    count: 3,
    grid: GRID_FULING,
    palette: PAL_FULING,
  },
  {
    id: 'shengjiang',
    name: '生姜',
    prop: '发散',
    count: 8,
    grid: GRID_SHENGJIANG,
    palette: PAL_SHENGJIANG,
  },
  {
    id: 'rougui',
    name: '肉桂',
    prop: '温阳',
    count: 2,
    grid: GRID_ROUGUI,
    palette: PAL_ROUGUI,
  },
  {
    id: 'bohe',
    name: '薄荷',
    prop: '清凉',
    count: 5,
    grid: GRID_BOHE,
    palette: PAL_BOHE,
  },
  {
    id: 'jinyinhua',
    name: '金银',
    prop: '解毒',
    count: 4,
    grid: GRID_JINYINHUA,
    palette: PAL_JINYINHUA,
  },

  // ===== 共享栅格药材 =====
  {
    id: 'chuanxiong',
    name: '川芎',
    prop: '活血',
    count: 3,
    grid: GRID_DANGGUI, // 共享当归栅格
    palette: PAL_CHUANXIONG,
  },
  {
    id: 'baizhu',
    name: '白术',
    prop: '健脾',
    count: 5,
    grid: GRID_FULING, // 共享茯苓栅格
    palette: PAL_BAIZHU,
  },
  {
    id: 'shudi',
    name: '熟地',
    prop: '滋阴',
    count: 4,
    grid: GRID_RENSHEN, // 共享人参栅格
    palette: PAL_SHUDI,
  },
  {
    id: 'baishao',
    name: '白芍',
    prop: '柔肝',
    count: 6,
    grid: GRID_HUANGQI, // 共享黄芪栅格
    palette: PAL_BAISHAO,
  },
  {
    id: 'dazao',
    name: '大枣',
    prop: '养血',
    count: 10,
    grid: GRID_GOUQI, // 共享枸杞栅格
    palette: PAL_DAZAO,
  },
  {
    id: 'banxia',
    name: '半夏',
    prop: '化痰',
    count: 3,
    grid: GRID_FULING, // 共享茯苓栅格
    palette: PAL_BANXIA,
  },
  {
    id: 'huanglian',
    name: '黄连',
    prop: '泻火',
    count: 2,
    grid: GRID_HUANGQI, // 共享黄芪栅格
    palette: PAL_HUANGLIAN,
  },
  {
    id: 'mahuang',
    name: '麻黄',
    prop: '发汗',
    count: 3,
    grid: GRID_BOHE, // 共享薄荷栅格
    palette: PAL_MAHUANG,
  },
  {
    id: 'shihu',
    name: '石斛',
    prop: '养胃',
    count: 4,
    grid: GRID_BOHE, // 共享薄荷栅格
    palette: PAL_SHIHU,
  },
  {
    id: 'fuzi',
    name: '附子',
    prop: '回阳',
    count: 1,
    grid: GRID_RENSHEN, // 共享人参栅格
    palette: PAL_FUZI,
  },
];

// ===== 辅助函数 =====

/**
 * 根据药材ID获取像素药材数据
 *
 * @param id 药材ID (如 'danggui', 'huangqi')
 * @returns 像素药材数据，未找到返回 undefined
 *
 * @example
 * const danggui = getPixelHerbById('danggui');
 * console.log(danggui?.name); // '当归'
 */
export function getPixelHerbById(id: string): PixelHerbData | undefined {
  return PIXEL_HERBS.find((herb) => herb.id === id);
}

/**
 * 获取所有像素药材ID列表
 *
 * @returns 药材ID数组
 */
export function getAllPixelHerbIds(): string[] {
  return PIXEL_HERBS.map((herb) => herb.id);
}

/**
 * 检查药材ID是否存在
 *
 * @param id 药材ID
 * @returns 是否存在
 */
export function isValidPixelHerbId(id: string): boolean {
  return PIXEL_HERBS.some((herb) => herb.id === id);
}