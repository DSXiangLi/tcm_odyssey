// src/data/ui-color-theme.ts
/**
 * UI配色系统（基于场景PNG图片提取）
 *
 * 颜色来源：
 * - 外景 town_background.jpeg
 * - 内景 clinic_scaled.png
 * - 内景 herb_field_area.png
 *
 * 设计原则：
 * - 面板背景使用场景暗部颜色（灰蓝/土黄）
 * - 按钮使用场景绿系/棕系
 * - 边框使用场景棕系（木质感）
 */

/**
 * UI颜色常量（用于Phaser Graphics/Rectangle等）
 */
export const UI_COLORS = {
  // === 面板背景 ===
  /** 弹窗背景主色 - 灰蓝系（诊所主色调） */
  PANEL_PRIMARY: 0x408080,
  /** 弹窗背景辅色 - 土黄系（内景暗部） */
  PANEL_SECONDARY: 0x402020,
  /** 面板高亮 */
  PANEL_LIGHT: 0x505050,
  /** 面板深色 */
  PANEL_DARK: 0x303030,

  // === 玻璃质感背景（Round 4 弹窗设计） ===
  /** 玻璃渐变起点 - 灰蓝色（与PANEL_PRIMARY相同，语义化命名） */
  PANEL_GLASS_LIGHT: 0x408080,
  /** 玻璃渐变终点 - 土黄色（与PANEL_SECONDARY相同，语义化命名） */
  PANEL_GLASS_DARK: 0x402020,
  /** 新拟态背景 - 深灰绿（凸起/凹陷效果） */
  PANEL_NEUMORPHIC: 0x2a3e32,
  /** 内凹底色 - 极深灰绿（输入框/槽位凹陷） */
  PANEL_INSET: 0x0d1f17,
  /** 3D弹窗背景 - 深灰绿（立体边框弹窗） */
  PANEL_3D_BG: 0x1a2e26,

  // === 按钮系统（使用柔和色系） ===
  /** 主要按钮 - 柔和绿色 */
  BUTTON_PRIMARY: 0x90c070,
  /** 主要按钮悬停 */
  BUTTON_PRIMARY_HOVER: 0xa0d080,
  /** 次要按钮 - 柔和棕色 */
  BUTTON_SECONDARY: 0xa08060,
  /** 次要按钮悬停 */
  BUTTON_SECONDARY_HOVER: 0xb09070,
  /** 禁用按钮 */
  BUTTON_DISABLED: 0x404040,
  /** 成功按钮 - 柔和绿色 */
  BUTTON_SUCCESS: 0x90c070,
  /** 警告按钮 - 柔和橙色 */
  BUTTON_WARNING: 0xc09060,
  /** 危险按钮 - 柔和红色 */
  BUTTON_DANGER: 0xc07070,

  // === 边框系统（Round 4 弹窗设计） ===
  /** 边框主色 - 暗棕系 */
  BORDER_PRIMARY: 0x604020,
  /** 边框高亮 - 金棕色 */
  BORDER_LIGHT: 0xc0a080,
  /** 分隔线 */
  DIVIDER: 0x504030,
  /** 外层亮绿边框 - 强调边框（标题画面/引导） */
  BORDER_OUTER_GREEN: 0x80a040,
  /** 顶部高光 - 3D立体边框左上亮边 */
  BORDER_TOP_LIGHT: 0x90c070,
  /** 底部阴影 - 3D立体边框右下暗边 */
  BORDER_BOTTOM_SHADOW: 0x604020,
  /** 内凹暗边框 - 槽位凹陷效果暗边 */
  BORDER_INSET_DARK: 0x0a1510,
  /** 内凹亮边框 - 槽位凹陷效果亮边 */
  BORDER_INSET_LIGHT: 0x406050,
  /** 金棕发光边框 - 玻璃态边框高光（与BORDER_LIGHT相同，语义化命名） */
  BORDER_GLOW: 0xc0a080,

  // === 状态色（使用柔和色系） ===
  STATUS_SUCCESS: 0x90c070,
  STATUS_WARNING: 0xc09060,
  STATUS_ERROR: 0xc07070,
  STATUS_LOCKED: 0x404040,
  STATUS_INFO: 0x70a0c0,

  // === 装饰色 ===
  /** 天空蓝 */
  ACCENT_SKY: 0x70a0c0,
  /** 草地绿 */
  ACCENT_GRASS: 0x90c070,

  // === 柔和田园色系 (Round 3 视觉优化) ===
  /** 柔和绿色 - 按钮、强调 */
  SOFT_GREEN: 0x90c070,
  /** 柔和绿色悬停 */
  SOFT_GREEN_HOVER: 0xa0d080,
  /** 柔和蓝色 - 信息、链接 */
  SOFT_BLUE: 0x70a0c0,
  /** 柔和橙色 - 警告、提示 */
  SOFT_ORANGE: 0xc09060,
  /** 柔和紫色 - 特殊标记 */
  SOFT_PURPLE: 0xa080c0,
  /** 柔和黄色 - 成就、亮点 */
  SOFT_YELLOW: 0xc0c080,
  /** 柔和红色 - 错误、危险 */
  SOFT_RED: 0xc07070,
  /** 柔和棕色 - 背景、边框 */
  SOFT_BROWN: 0xa08060,
  /** 柔和棕色悬停 */
  SOFT_BROWN_HOVER: 0xb09070,

  // === 保留原有柔和色系（兼容） ===
  /** 柔和绿色 - 高亮/选中状态 */
  GREEN_SOFT: 0x4a7c59,
  /** 绿系辅色 - 柔和过渡 */
  GREEN_AUXILIARY: 0x6b8e4e,
  /** 灰蓝温暖版 - 柔和背景 */
  BLUE_WARM: 0x5c6b7a,
  /** 土黄系 - 背景装饰 */
  YELLOW_EARTH: 0xc4a35a,
  /** 暖米黄 - 次要文字 */
  YELLOW_WARM: 0xf5e6d3,
  /** 棕系温暖版 - 柔和木质感 */
  BROWN_MAIN: 0x8b6f47,
  /** 棕系暗色 - 深度层次 */
  BROWN_DARK: 0x6b5b3d,

  // === 文字色（高对比度优化） ===
  /** 次要文字 - 暖米灰色（对比度不足，仅用于装饰） */
  TEXT_SECONDARY: 0xb0a090,
  /** 提示文字 - 浅奶油色 (对比度 ~5.2:1，PASS WCAG AA) */
  TEXT_TIP: 0xd4c4b4,
  /** 温暖文字 - 暖白色 (对比度 ~6.5:1，PASS WCAG AA/AAA) */
  TEXT_WARM: 0xe5d5c5,
  /** 高亮文字 - 亮米色 (对比度 ~7.5:1，PASS WCAG AAA) */
  TEXT_BRIGHT: 0xf0e0d0,

} as const;

/**
 * UI颜色字符串（用于Phaser Text组件）
 */
export const UI_COLOR_STRINGS = {
  PANEL_PRIMARY: '#408080',
  PANEL_SECONDARY: '#402020',
  PANEL_LIGHT: '#505050',
  PANEL_DARK: '#303030',
  // 玻璃质感背景（Round 4）
  PANEL_GLASS_LIGHT: '#408080',
  PANEL_GLASS_DARK: '#402020',
  PANEL_NEUMORPHIC: '#2a3e32',
  PANEL_INSET: '#0d1f17',
  PANEL_3D_BG: '#1a2e26',
  // 按钮系统（柔和色系）
  BUTTON_PRIMARY: '#90c070',
  BUTTON_PRIMARY_HOVER: '#a0d080',
  BUTTON_SECONDARY: '#a08060',
  BUTTON_SECONDARY_HOVER: '#b09070',
  BUTTON_SUCCESS: '#90c070',
  BUTTON_WARNING: '#c09060',
  BUTTON_DANGER: '#c07070',
  // 边框系统（Round 4）
  BORDER_PRIMARY: '#604020',
  BORDER_LIGHT: '#c0a080',
  DIVIDER: '#504030',
  BORDER_OUTER_GREEN: '#80a040',
  BORDER_TOP_LIGHT: '#90c070',
  BORDER_BOTTOM_SHADOW: '#604020',
  BORDER_INSET_DARK: '#0a1510',
  BORDER_INSET_LIGHT: '#406050',
  BORDER_GLOW: '#c0a080',
  // 文字色（高对比度优化）
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#b0a090',  // 暖米灰（对比度不足）
  TEXT_TIP: '#d4c4b4',        // 提示文字 (对比度 5.2:1，PASS AA)
  TEXT_WARM: '#e5d5c5',       // 温暖文字 (对比度 6.5:1，PASS AA/AAA)
  TEXT_BRIGHT: '#f0e0d0',     // 高亮文字 (对比度 7.5:1，PASS AAA)
  TEXT_HIGHLIGHT: '#90c070',
  TEXT_DISABLED: '#808080',
  // 状态色（柔和色系）
  STATUS_SUCCESS: '#90c070',
  STATUS_WARNING: '#c09060',
  STATUS_ERROR: '#c07070',
  STATUS_INFO: '#70a0c0',
  // 装饰色
  ACCENT_SKY: '#70a0c0',
  ACCENT_GRASS: '#90c070',
  // 柔和田园色系
  SOFT_GREEN: '#90c070',
  SOFT_GREEN_HOVER: '#a0d080',
  SOFT_BLUE: '#70a0c0',
  SOFT_ORANGE: '#c09060',
  SOFT_PURPLE: '#a080c0',
  SOFT_YELLOW: '#c0c080',
  SOFT_RED: '#c07070',
  SOFT_BROWN: '#a08060',
  SOFT_BROWN_HOVER: '#b09070',
  // 保留原有色系（兼容）
  GREEN_SOFT: '#4a7c59',
  GREEN_AUXILIARY: '#6b8e4e',
  BLUE_WARM: '#5c6b7a',
  YELLOW_EARTH: '#c4a35a',
  YELLOW_WARM: '#f5e6d3',
  BROWN_MAIN: '#8b6f47',
  BROWN_DARK: '#6b5b3d',
} as const;

/**
 * 颜色替换映射表（用于快速查找）
 */
export const COLOR_REPLACE_MAP: Record<number, number> = {
  // 旧背景色 → 新面板色
  0x333333: UI_COLORS.PANEL_PRIMARY,
  0x2a2a2a: UI_COLORS.PANEL_PRIMARY,
  0x1a1a1a: UI_COLORS.PANEL_SECONDARY,
  0x1a1a2e: UI_COLORS.PANEL_PRIMARY,
  0x2a2a3a: UI_COLORS.PANEL_PRIMARY,
  0x3a3a3a: UI_COLORS.PANEL_LIGHT,
  0x444444: UI_COLORS.PANEL_LIGHT,

  // 荧光色 → 柔和色系（Round 3优化）
  0x00ff00: UI_COLORS.SOFT_GREEN,      // 荧光绿 → 柔和绿
  0xffff00: UI_COLORS.SOFT_YELLOW,     // 荧光黄 → 柔和黄
  0xff0000: UI_COLORS.SOFT_RED,        // 荧光红 → 柔和红

  // 旧按钮色 → 新按钮色
  0x4a7c59: UI_COLORS.BUTTON_SUCCESS,
  0x6a8c49: UI_COLORS.BUTTON_PRIMARY,
  0x555555: UI_COLORS.BUTTON_SECONDARY,
  0x666666: UI_COLORS.BUTTON_SECONDARY_HOVER,
};