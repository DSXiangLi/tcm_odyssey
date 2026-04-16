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

  // === 按钮系统 ===
  /** 主要按钮 - 暗绿系（外景/药园主色） */
  BUTTON_PRIMARY: 0x80a040,
  /** 主要按钮悬停 */
  BUTTON_PRIMARY_HOVER: 0x90b050,
  /** 次要按钮 - 暗棕系 */
  BUTTON_SECONDARY: 0x604020,
  /** 次要按钮悬停 */
  BUTTON_SECONDARY_HOVER: 0x704030,
  /** 禁用按钮 */
  BUTTON_DISABLED: 0x404040,
  /** 成功按钮 - 中绿 */
  BUTTON_SUCCESS: 0x60a040,
  /** 警告按钮 */
  BUTTON_WARNING: 0xe0c040,

  // === 边框/装饰 ===
  /** 边框主色 - 暗棕系 */
  BORDER_PRIMARY: 0x604020,
  /** 边框高亮 */
  BORDER_LIGHT: 0xc0a080,
  /** 分隔线 */
  DIVIDER: 0x504030,

  // === 状态色 ===
  STATUS_SUCCESS: 0x60a040,
  STATUS_WARNING: 0xe0c040,
  STATUS_ERROR: 0x402020,
  STATUS_LOCKED: 0x404040,

  // === 装饰色 ===
  /** 天空蓝 */
  ACCENT_SKY: 0x40a0c0,
  /** 草地绿 */
  ACCENT_GRASS: 0x80a040,

} as const;

/**
 * UI颜色字符串（用于Phaser Text组件）
 */
export const UI_COLOR_STRINGS = {
  PANEL_PRIMARY: '#408080',
  PANEL_SECONDARY: '#402020',
  BUTTON_PRIMARY: '#80a040',
  BUTTON_PRIMARY_HOVER: '#90b050',
  BUTTON_SECONDARY: '#604020',
  BUTTON_SECONDARY_HOVER: '#704030',
  BUTTON_SUCCESS: '#60a040',
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#c0a080',
  TEXT_HIGHLIGHT: '#80a040',
  TEXT_DISABLED: '#808080',
  STATUS_SUCCESS: '#60a040',
  STATUS_WARNING: '#e0c040',
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

  // 旧按钮色 → 新按钮色
  0x4a7c59: UI_COLORS.BUTTON_SUCCESS,
  0x6a8c49: UI_COLORS.BUTTON_PRIMARY,
  0x555555: UI_COLORS.BUTTON_SECONDARY,
  0x666666: UI_COLORS.BUTTON_SECONDARY_HOVER,
};