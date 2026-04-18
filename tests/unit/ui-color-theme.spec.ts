// tests/unit/ui-color-theme.spec.ts
/**
 * UI配色主题单元测试
 *
 * 测试内容：
 * - 7个新柔和田园色常量
 * - TEXT_SECONDARY更新验证
 * - 数字/字符串一致性验证
 */

import { describe, it, expect } from 'vitest';
import { UI_COLORS, UI_COLOR_STRINGS } from '../../src/data/ui-color-theme';

describe('UI_COLORS - 新柔和田园色系', () => {
  describe('新颜色常量存在性验证', () => {
    it('应包含 GREEN_SOFT 常量 (柔和绿色)', () => {
      expect(UI_COLORS.GREEN_SOFT).toBeDefined();
      expect(UI_COLORS.GREEN_SOFT).toBe(0x4a7c59);
    });

    it('应包含 GREEN_AUXILIARY 常量 (绿系辅色)', () => {
      expect(UI_COLORS.GREEN_AUXILIARY).toBeDefined();
      expect(UI_COLORS.GREEN_AUXILIARY).toBe(0x6b8e4e);
    });

    it('应包含 BLUE_WARM 常量 (灰蓝温暖版)', () => {
      expect(UI_COLORS.BLUE_WARM).toBeDefined();
      expect(UI_COLORS.BLUE_WARM).toBe(0x5c6b7a);
    });

    it('应包含 YELLOW_EARTH 常量 (土黄背景装饰)', () => {
      expect(UI_COLORS.YELLOW_EARTH).toBeDefined();
      expect(UI_COLORS.YELLOW_EARTH).toBe(0xc4a35a);
    });

    it('应包含 YELLOW_WARM 常量 (暖米黄次要文字)', () => {
      expect(UI_COLORS.YELLOW_WARM).toBeDefined();
      expect(UI_COLORS.YELLOW_WARM).toBe(0xf5e6d3);
    });

    it('应包含 BROWN_MAIN 常量 (棕系温暖版)', () => {
      expect(UI_COLORS.BROWN_MAIN).toBeDefined();
      expect(UI_COLORS.BROWN_MAIN).toBe(0x8b6f47);
    });

    it('应包含 BROWN_DARK 常量 (棕系暗色)', () => {
      expect(UI_COLORS.BROWN_DARK).toBeDefined();
      expect(UI_COLORS.BROWN_DARK).toBe(0x6b5b3d);
    });
  });

  describe('数字/字符串一致性验证', () => {
    it('GREEN_SOFT 数字和字符串值应一致', () => {
      expect(UI_COLORS.GREEN_SOFT).toBeDefined();
      expect(UI_COLOR_STRINGS.GREEN_SOFT).toBeDefined();
      // 转换数字为十六进制字符串格式验证
      const hexString = '#' + UI_COLORS.GREEN_SOFT.toString(16).padStart(6, '0');
      expect(hexString).toBe(UI_COLOR_STRINGS.GREEN_SOFT);
    });

    it('YELLOW_WARM 数字和字符串值应一致', () => {
      expect(UI_COLORS.YELLOW_WARM).toBeDefined();
      expect(UI_COLOR_STRINGS.YELLOW_WARM).toBeDefined();
      const hexString = '#' + UI_COLORS.YELLOW_WARM.toString(16).padStart(6, '0');
      expect(hexString).toBe(UI_COLOR_STRINGS.YELLOW_WARM);
    });
  });
});

describe('UI_COLOR_STRINGS - 高对比度文字色（Round 4）', () => {
  it('TEXT_SECONDARY保留为暖米灰色 #b0a090（对比度不足，仅用于装饰）', () => {
    expect(UI_COLOR_STRINGS.TEXT_SECONDARY).toBeDefined();
    expect(UI_COLOR_STRINGS.TEXT_SECONDARY).toBe('#b0a090');
  });

  it('TEXT_TIP应为浅奶油色 #d4c4b4 (对比度 5.2:1，PASS WCAG AA)', () => {
    expect(UI_COLOR_STRINGS.TEXT_TIP).toBeDefined();
    expect(UI_COLOR_STRINGS.TEXT_TIP).toBe('#d4c4b4');
  });

  it('TEXT_WARM应为暖白色 #e5d5c5 (对比度 6.5:1，PASS WCAG AA/AAA)', () => {
    expect(UI_COLOR_STRINGS.TEXT_WARM).toBeDefined();
    expect(UI_COLOR_STRINGS.TEXT_WARM).toBe('#e5d5c5');
  });

  it('TEXT_BRIGHT应为亮米色 #f0e0d0 (对比度 7.5:1，PASS WCAG AAA)', () => {
    expect(UI_COLOR_STRINGS.TEXT_BRIGHT).toBeDefined();
    expect(UI_COLOR_STRINGS.TEXT_BRIGHT).toBe('#f0e0d0');
  });
});