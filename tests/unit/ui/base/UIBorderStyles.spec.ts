// tests/unit/ui/base/UIBorderStyles.spec.ts
/**
 * UIBorderStyles边框样式定义单元测试
 *
 * 测试内容：
 * - 5种边框样式类型定义
 * - BORDER_STYLE_CONFIGS配置字典
 * - draw3DBorder绘制函数
 * - drawNeumorphicBorderRaised绘制函数
 * - drawNeumorphicBorderInset绘制函数
 * - drawInsetSlotBorder绘制函数
 */

import { describe, it, expect, vi } from 'vitest';
import {
  BorderStyleType,
  BORDER_STYLE_CONFIGS,
  draw3DBorder,
  drawNeumorphicBorderRaised,
  drawNeumorphicBorderInset,
  drawInsetSlotBorder
} from '../../../../src/ui/base/UIBorderStyles';

describe('UIBorderStyles', () => {
  describe('BorderStyleType定义', () => {
    it('should define all 5 border style types', () => {
      const expectedTypes: BorderStyleType[] = ['glass', '3d', 'traditional', 'neumorphic', 'inset'];
      expect(BORDER_STYLE_CONFIGS).toBeDefined();
      expect(Object.keys(BORDER_STYLE_CONFIGS).sort()).toEqual(expectedTypes.sort());
    });
  });

  describe('BORDER_STYLE_CONFIGS配置', () => {
    it('should have correct glass border config', () => {
      const config = BORDER_STYLE_CONFIGS['glass'];
      expect(config.glassLight).toBe(0x408080);
      expect(config.glassDark).toBe(0x402020);
      expect(config.glowColor).toBe(0xc0a080);
      expect(config.borderWidth).toBe(3);
    });

    it('should have correct 3d border config', () => {
      const config = BORDER_STYLE_CONFIGS['3d'];
      expect(config.outerColor).toBe(0x80a040);
      expect(config.topLight).toBe(0x90c070);
      expect(config.bottomShadow).toBe(0x604020);
      expect(config.background).toBe(0x1a2e26);
      expect(config.borderWidth).toBe(4);
    });

    it('should have correct traditional border config', () => {
      const config = BORDER_STYLE_CONFIGS['traditional'];
      expect(config.background).toBe(0x408080);
      expect(config.borderWidth).toBe(2);
      expect(config.outerColor).toBe(0x604020);
    });

    it('should have correct neumorphic border config', () => {
      const config = BORDER_STYLE_CONFIGS['neumorphic'];
      expect(config.background).toBe(0x2a3e32);
      expect(config.shadowOffset).toBe(4);
      expect(config.shadowBlur).toBe(8);
    });

    it('should have correct inset border config', () => {
      const config = BORDER_STYLE_CONFIGS['inset'];
      expect(config.darkBorder).toBe(0x0a1510);
      expect(config.lightBorder).toBe(0x406050);
      expect(config.background).toBe(0x0d1f17);
      expect(config.borderWidth).toBe(2);
    });
  });

  describe('draw3DBorder绘制函数', () => {
    it('should call graphics methods with correct colors', () => {
      const mockGraphics = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        lineStyle: vi.fn(),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        strokePath: vi.fn()
      };

      draw3DBorder(mockGraphics as any, 0, 0, 100, 50);

      // 验证背景绘制
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x1a2e26, 1);
      expect(mockGraphics.fillRect).toHaveBeenCalledWith(0, 0, 100, 50);

      // 验证外层边框
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(4, 0x80a040, 1);
      expect(mockGraphics.strokeRect).toHaveBeenCalledWith(0, 0, 100, 50);
    });

    it('should use custom config when provided', () => {
      const mockGraphics = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        lineStyle: vi.fn(),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        strokePath: vi.fn()
      };

      const customConfig = {
        background: 0x111111,
        outerColor: 0x222222,
        borderWidth: 2
      };

      draw3DBorder(mockGraphics as any, 0, 0, 100, 50, customConfig);

      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x111111, 1);
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(2, 0x222222, 1);
    });
  });

  describe('drawNeumorphicBorderRaised绘制函数', () => {
    it('should call graphics methods for raised effect', () => {
      const mockGraphics = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        lineStyle: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        strokePath: vi.fn()
      };

      drawNeumorphicBorderRaised(mockGraphics as any, 0, 0, 100, 50);

      // 验证背景绘制
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x2a3e32, 1);
      expect(mockGraphics.fillRect).toHaveBeenCalledWith(0, 0, 100, 50);

      // 验证阴影绘制（两次lineStyle调用）
      expect(mockGraphics.lineStyle).toHaveBeenCalled();
      expect(mockGraphics.beginPath).toHaveBeenCalled();
    });
  });

  describe('drawNeumorphicBorderInset绘制函数', () => {
    it('should call graphics methods for inset effect', () => {
      const mockGraphics = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        lineStyle: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        strokePath: vi.fn()
      };

      drawNeumorphicBorderInset(mockGraphics as any, 0, 0, 100, 50);

      // 验证背景绘制（内凹背景更暗）
      expect(mockGraphics.fillStyle).toHaveBeenCalled();
      expect(mockGraphics.fillRect).toHaveBeenCalled();

      // 验证阴影绘制
      expect(mockGraphics.lineStyle).toHaveBeenCalled();
    });
  });

  describe('drawInsetSlotBorder绘制函数', () => {
    it('should call graphics methods for slot inset effect', () => {
      const mockGraphics = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        lineStyle: vi.fn(),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        strokePath: vi.fn()
      };

      drawInsetSlotBorder(mockGraphics as any, 0, 0, 60, 60);

      // 验证背景绘制（考虑边框宽度偏移）
      expect(mockGraphics.fillStyle).toHaveBeenCalledWith(0x0d1f17, 1);
      expect(mockGraphics.fillRect).toHaveBeenCalledWith(2, 2, 56, 56);

      // 验证外层暗边框
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(2, 0x0a1510, 1);
      expect(mockGraphics.strokeRect).toHaveBeenCalledWith(0, 0, 60, 60);
    });

    it('should use custom borderWidth when provided', () => {
      const mockGraphics = {
        fillStyle: vi.fn(),
        fillRect: vi.fn(),
        lineStyle: vi.fn(),
        strokeRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        strokePath: vi.fn()
      };

      const customConfig = {
        background: 0x111111,
        darkBorder: 0x222222,
        borderWidth: 4
      };

      drawInsetSlotBorder(mockGraphics as any, 0, 0, 100, 100, customConfig);

      expect(mockGraphics.fillRect).toHaveBeenCalledWith(4, 4, 92, 92);
      expect(mockGraphics.lineStyle).toHaveBeenCalledWith(4, 0x222222, 1);
    });
  });
});