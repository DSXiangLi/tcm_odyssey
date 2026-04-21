// tests/unit/ui/components/PixelSpriteComponent.spec.ts
/**
 * PixelSpriteComponent像素图标绘制组件单元测试
 *
 * 测试内容：
 * - 构造与属性：grid/palette配置、默认pixelSize、自定义pixelSize、宽高计算
 * - 像素绘制：非空字符绘制、空格跳过、颜色映射
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import PixelSpriteComponent from '../../../../src/ui/components/PixelSpriteComponent';

const createMockScene = () => {
  const mockContainer = {
    add: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  const mockGraphics = {
    clear: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  return {
    add: {
      container: vi.fn().mockReturnValue(mockContainer),
      graphics: vi.fn().mockReturnValue(mockGraphics),
      existing: vi.fn(),
    },
  } as any;
};

describe('PixelSpriteComponent', () => {
  describe('构造与属性', () => {
    it('should create component with grid and palette', () => {
      const scene = createMockScene();
      const grid = ['  aa  ', ' abba ', '  aa  '];
      const palette = { a: '#6a8c78', b: '#8ab098' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });

      expect(sprite.grid).toEqual(grid);
      expect(sprite.palette).toEqual(palette);
      expect(scene.add.graphics).toHaveBeenCalled();
    });

    it('should use default pixelSize of 3', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });

      expect(sprite.pixelSize).toBe(3);
    });

    it('should accept custom pixelSize', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette, pixelSize: 4 });

      expect(sprite.pixelSize).toBe(4);
    });

    it('should calculate width and height from grid', () => {
      const scene = createMockScene();
      const grid = ['  aa  ', ' abba ']; // 6 chars wide, 2 rows
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette, pixelSize: 3 });

      expect(sprite.width).toBe(6 * 3); // 18
      expect(sprite.height).toBe(2 * 3); // 6
    });
  });

  describe('像素绘制', () => {
    it('should call fillStyle and fillRect for each non-space character', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });
      const mockGraphics = scene.add.graphics();

      // 4 non-space chars: a(0,0), a(1,0), b(0,1), b(1,1)
      expect(mockGraphics.fillStyle).toHaveBeenCalled();
      expect(mockGraphics.fillRect).toHaveBeenCalled();
    });

    it('should skip space characters', () => {
      const scene = createMockScene();
      const grid = ['a a', ' b ']; // has spaces
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });
      const mockGraphics = scene.add.graphics();

      // Only 3 non-space chars: a(0,0), a(2,0), b(1,1)
      expect(mockGraphics.fillRect).toHaveBeenCalledTimes(3);
    });

    it('should handle empty palette gracefully', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = {}; // empty palette

      // Should not throw error
      const sprite = new PixelSpriteComponent(scene, { grid, palette });
      const mockGraphics = scene.add.graphics();

      // No colors defined, so no pixels drawn
      expect(mockGraphics.fillRect).toHaveBeenCalledTimes(0);
    });

    it('should handle undefined characters in palette', () => {
      const scene = createMockScene();
      const grid = ['ab', 'cd']; // 'c' and 'd' not in palette
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });
      const mockGraphics = scene.add.graphics();

      // Only 2 chars have colors: a(0,0), b(1,0)
      expect(mockGraphics.fillRect).toHaveBeenCalledTimes(2);
    });
  });

  describe('位置与布局', () => {
    it('should have setPosition method', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });
      sprite.setPosition(100, 200);

      expect(sprite.container.setPosition).toHaveBeenCalledWith(100, 200);
    });

    it('should return this for chaining in setPosition', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });
      const result = sprite.setPosition(100, 200);

      expect(result).toBe(sprite);
    });

    it('should have setDepth method', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });
      sprite.setDepth(50);

      expect(sprite.container.setDepth).toHaveBeenCalledWith(50);
    });

    it('should return this for chaining in setDepth', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });
      const result = sprite.setDepth(50);

      expect(result).toBe(sprite);
    });

    it('should create container at specified position', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette }, 100, 200);

      expect(scene.add.container).toHaveBeenCalledWith(100, 200);
    });

    it('should default position to (0, 0) when not specified', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });

      expect(scene.add.container).toHaveBeenCalledWith(0, 0);
    });
  });

  describe('销毁流程', () => {
    it('should have destroy method', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });
      expect(sprite.destroy).toBeDefined();
      expect(typeof sprite.destroy).toBe('function');
    });

    it('should destroy container when calling destroy', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });
      sprite.destroy();

      expect(sprite.container.destroy).toHaveBeenCalled();
    });

    it('should destroy graphics when calling destroy', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });
      const mockGraphics = scene.add.graphics();
      sprite.destroy();

      expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it('should set graphics to null after destroy', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });
      sprite.destroy();

      expect(sprite.graphics).toBeNull();
    });
  });

  describe('动画属性', () => {
    it('should have animated property default to false', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette });

      expect(sprite.animated).toBe(false);
    });

    it('should accept animated config', () => {
      const scene = createMockScene();
      const grid = ['aa', 'bb'];
      const palette = { a: '#ff0000', b: '#00ff00' };

      const sprite = new PixelSpriteComponent(scene, { grid, palette, animated: true });

      expect(sprite.animated).toBe(true);
    });
  });
});