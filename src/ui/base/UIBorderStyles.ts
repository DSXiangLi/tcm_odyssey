// src/ui/base/UIBorderStyles.ts
/**
 * UI边框样式定义
 *
 * 提供5种标准化边框样式，用于BaseUIComponent和ModalUI：
 * - glass: 玻璃态边框（渐变背景+金棕高光）
 * - 3d: 3D立体边框（凸起效果，左上亮边+右下暗边）
 * - traditional: 传统边框（单色边框）
 * - neumorphic: 新拟态边框（柔和凸起/凹陷）
 * - inset: 内凹边框（槽位、输入框凹陷效果）
 */

import Phaser from 'phaser';
import { UI_COLORS } from '../../data/ui-color-theme';

/**
 * 边框样式类型定义
 */
export type BorderStyleType = 'glass' | '3d' | 'traditional' | 'neumorphic' | 'inset';

/**
 * 边框样式配置接口
 */
export interface BorderStyleConfig {
  // 通用属性
  background?: number;
  borderWidth?: number;

  // 3D立体边框属性
  outerColor?: number;
  topLight?: number;
  bottomShadow?: number;

  // 新拟态边框属性
  shadowOffset?: number;
  shadowBlur?: number;

  // 内凹边框属性
  darkBorder?: number;
  lightBorder?: number;

  // 玻璃态边框属性
  glassLight?: number;
  glassDark?: number;
  glowColor?: number;
}

/**
 * 边框样式配置字典
 * 使用UI_COLORS中的标准颜色值
 */
export const BORDER_STYLE_CONFIGS: Record<BorderStyleType, BorderStyleConfig> = {
  glass: {
    glassLight: UI_COLORS.PANEL_GLASS_LIGHT,
    glassDark: UI_COLORS.PANEL_GLASS_DARK,
    glowColor: UI_COLORS.BORDER_GLOW,
    borderWidth: 3,
  },

  '3d': {
    outerColor: UI_COLORS.BORDER_OUTER_GREEN,
    topLight: UI_COLORS.BORDER_TOP_LIGHT,
    bottomShadow: UI_COLORS.BORDER_BOTTOM_SHADOW,
    background: UI_COLORS.PANEL_3D_BG,
    borderWidth: 4,
  },

  traditional: {
    background: UI_COLORS.PANEL_PRIMARY,
    borderWidth: 2,
    outerColor: UI_COLORS.BORDER_PRIMARY,
  },

  neumorphic: {
    background: UI_COLORS.PANEL_NEUMORPHIC,
    shadowOffset: 4,
    shadowBlur: 8,
  },

  inset: {
    darkBorder: UI_COLORS.BORDER_INSET_DARK,
    lightBorder: UI_COLORS.BORDER_INSET_LIGHT,
    background: UI_COLORS.PANEL_INSET,
    borderWidth: 2,
  },
};

/**
 * 绘制3D立体边框
 * 凸起效果：左上亮边 + 右下暗边 + 外层绿边
 *
 * @param graphics - Phaser Graphics对象
 * @param x - 左上角X坐标
 * @param y - 左上角Y坐标
 * @param width - 边框宽度
 * @param height - 边框高度
 * @param config - 边框配置（可选，默认使用BORDER_STYLE_CONFIGS['3d']）
 */
export function draw3DBorder(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  config?: BorderStyleConfig
): void {
  const cfg = config ?? BORDER_STYLE_CONFIGS['3d'];
  const borderWidth = cfg.borderWidth ?? 4;

  // 绘制背景
  if (cfg.background !== undefined) {
    graphics.fillStyle(cfg.background, 1);
    graphics.fillRect(x, y, width, height);
  }

  // 绘制外层边框
  if (cfg.outerColor !== undefined) {
    graphics.lineStyle(borderWidth, cfg.outerColor, 1);
    graphics.strokeRect(x, y, width, height);
  }

  // 绘制左上亮边（内层）
  if (cfg.topLight !== undefined) {
    graphics.lineStyle(2, cfg.topLight, 1);
    // 顶部线
    graphics.beginPath();
    graphics.moveTo(x + borderWidth, y + borderWidth);
    graphics.lineTo(x + width - borderWidth, y + borderWidth);
    graphics.strokePath();
    // 左侧线
    graphics.beginPath();
    graphics.moveTo(x + borderWidth, y + borderWidth);
    graphics.lineTo(x + borderWidth, y + height - borderWidth);
    graphics.strokePath();
  }

  // 绘制右下暗边（内层）
  if (cfg.bottomShadow !== undefined) {
    graphics.lineStyle(2, cfg.bottomShadow, 1);
    // 底部线
    graphics.beginPath();
    graphics.moveTo(x + borderWidth, y + height - borderWidth);
    graphics.lineTo(x + width - borderWidth, y + height - borderWidth);
    graphics.strokePath();
    // 右侧线
    graphics.beginPath();
    graphics.moveTo(x + width - borderWidth, y + borderWidth);
    graphics.lineTo(x + width - borderWidth, y + height - borderWidth);
    graphics.strokePath();
  }
}

/**
 * 绘制新拟态凸起边框
 * 柔和凸起效果：左上亮阴影 + 右下暗阴影
 *
 * @param graphics - Phaser Graphics对象
 * @param x - 左上角X坐标
 * @param y - 左上角Y坐标
 * @param width - 边框宽度
 * @param height - 边框高度
 * @param config - 边框配置（可选，默认使用BORDER_STYLE_CONFIGS['neumorphic']）
 */
export function drawNeumorphicBorderRaised(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  config?: BorderStyleConfig
): void {
  const cfg = config ?? BORDER_STYLE_CONFIGS['neumorphic'];
  const offset = cfg.shadowOffset ?? 4;

  // 绘制背景
  if (cfg.background !== undefined) {
    graphics.fillStyle(cfg.background, 1);
    graphics.fillRect(x, y, width, height);
  }

  // 绘制左上亮阴影（高光）
  const lightShadow = cfg.topLight ?? 0x4a5a4a; // 默认略亮于背景
  graphics.lineStyle(offset, lightShadow, 0.6);
  graphics.beginPath();
  graphics.moveTo(x, y + height);
  graphics.lineTo(x, y);
  graphics.lineTo(x + width, y);
  graphics.strokePath();

  // 绘制右下暗阴影
  const darkShadow = cfg.bottomShadow ?? 0x1a2a1a; // 默认略暗于背景
  graphics.lineStyle(offset, darkShadow, 0.6);
  graphics.beginPath();
  graphics.moveTo(x + width, y);
  graphics.lineTo(x + width, y + height);
  graphics.lineTo(x, y + height);
  graphics.strokePath();
}

/**
 * 绘制新拟态凹陷边框
 * 柔和凹陷效果：左上暗阴影 + 右下亮阴影
 *
 * @param graphics - Phaser Graphics对象
 * @param x - 左上角X坐标
 * @param y - 左上角Y坐标
 * @param width - 边框宽度
 * @param height - 边框高度
 * @param config - 边框配置（可选，默认使用BORDER_STYLE_CONFIGS['neumorphic']）
 */
export function drawNeumorphicBorderInset(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  config?: BorderStyleConfig
): void {
  const cfg = config ?? BORDER_STYLE_CONFIGS['neumorphic'];
  const offset = cfg.shadowOffset ?? 4;

  // 绘制背景（内凹更暗）
  const insetBg = cfg.darkBorder ?? cfg.background ?? UI_COLORS.PANEL_INSET;
  graphics.fillStyle(insetBg, 1);
  graphics.fillRect(x + offset, y + offset, width - 2 * offset, height - 2 * offset);

  // 绘制左上暗阴影（凹陷高光）
  const darkShadow = cfg.bottomShadow ?? 0x1a2a1a;
  graphics.lineStyle(offset, darkShadow, 0.6);
  graphics.beginPath();
  graphics.moveTo(x, y + height);
  graphics.lineTo(x, y);
  graphics.lineTo(x + width, y);
  graphics.strokePath();

  // 绘制右下亮阴影（凹陷暗边）
  const lightShadow = cfg.topLight ?? 0x4a5a4a;
  graphics.lineStyle(offset, lightShadow, 0.6);
  graphics.beginPath();
  graphics.moveTo(x + width, y);
  graphics.lineTo(x + width, y + height);
  graphics.lineTo(x, y + height);
  graphics.strokePath();
}

/**
 * 绘制内凹槽位边框
 * 用于输入框、槽位等凹陷元素
 *
 * @param graphics - Phaser Graphics对象
 * @param x - 左上角X坐标
 * @param y - 左上角Y坐标
 * @param width - 边框宽度
 * @param height - 边框高度
 * @param config - 边框配置（可选，默认使用BORDER_STYLE_CONFIGS['inset']）
 */
export function drawInsetSlotBorder(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  config?: BorderStyleConfig
): void {
  const cfg = config ?? BORDER_STYLE_CONFIGS['inset'];
  const borderWidth = cfg.borderWidth ?? 2;

  // 绘制背景（极深灰绿）
  if (cfg.background !== undefined) {
    graphics.fillStyle(cfg.background, 1);
    graphics.fillRect(x + borderWidth, y + borderWidth, width - 2 * borderWidth, height - 2 * borderWidth);
  }

  // 绘制外层暗边框
  if (cfg.darkBorder !== undefined) {
    graphics.lineStyle(borderWidth, cfg.darkBorder, 1);
    graphics.strokeRect(x, y, width, height);
  }

  // 绘制内层亮边框（高光）
  if (cfg.lightBorder !== undefined) {
    graphics.lineStyle(1, cfg.lightBorder, 0.8);
    // 顶部和左侧亮边
    graphics.beginPath();
    graphics.moveTo(x + borderWidth + 1, y + borderWidth + 1);
    graphics.lineTo(x + width - borderWidth - 1, y + borderWidth + 1);
    graphics.strokePath();
    graphics.beginPath();
    graphics.moveTo(x + borderWidth + 1, y + borderWidth + 1);
    graphics.lineTo(x + borderWidth + 1, y + height - borderWidth - 1);
    graphics.strokePath();
  }
}