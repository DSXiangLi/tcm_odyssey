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

describe('UI_COLOR_STRINGS - TEXT_SECONDARY更新', () => {
  it('TEXT_SECONDARY应更新为暖米黄色 #f5e6d3', () => {
    expect(UI_COLOR_STRINGS.TEXT_SECONDARY).toBeDefined();
    expect(UI_COLOR_STRINGS.TEXT_SECONDARY).toBe('#f5e6d3');
  });

  it('TEXT_SECONDARY不应为旧值 #c0a080', () => {
    expect(UI_COLOR_STRINGS.TEXT_SECONDARY).toBeDefined();
    expect(UI_COLOR_STRINGS.TEXT_SECONDARY).not.toBe('#c0a080');
  });
});