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

  // === 边框/装饰 ===
  /** 边框主色 - 暗棕系 */
  BORDER_PRIMARY: 0x604020,
  /** 边框高亮 */
  BORDER_LIGHT: 0xc0a080,
  /** 分隔线 */
  DIVIDER: 0x504030,

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

  // === 文字色 ===
  /** 次要文字 - 暖米灰色 */
  TEXT_SECONDARY: 0xb0a090,

} as const;

/**
 * UI颜色字符串（用于Phaser Text组件）
 */
export const UI_COLOR_STRINGS = {
  PANEL_PRIMARY: '#408080',
  PANEL_SECONDARY: '#402020',
  PANEL_LIGHT: '#505050',
  PANEL_DARK: '#303030',
  // 按钮系统（柔和色系）
  BUTTON_PRIMARY: '#90c070',
  BUTTON_PRIMARY_HOVER: '#a0d080',
  BUTTON_SECONDARY: '#a08060',
  BUTTON_SECONDARY_HOVER: '#b09070',
  BUTTON_SUCCESS: '#90c070',
  BUTTON_WARNING: '#c09060',
  BUTTON_DANGER: '#c07070',
  // 文字色
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#b0a090',  // 暖米灰
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