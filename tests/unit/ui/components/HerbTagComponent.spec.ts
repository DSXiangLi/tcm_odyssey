// tests/unit/ui/components/HerbTagComponent.spec.ts
/**
 * HerbTagComponent药牌组件单元测试
 *
 * 测试内容:
 * - 构造与属性: herb数据、标准尺寸、draggable配置
 * - 像素图标: PixelSpriteComponent集成
 * - 文本显示: 药名/属性/数量角标
 * - 交互功能: 拖拽/点击
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import HerbTagComponent from '../../../../src/ui/components/HerbTagComponent';

const createMockScene = () => {
  const mockContainer = {
    add: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setSize: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
  };
  const mockGraphics = {
    clear: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };
  const mockText = {
    setOrigin: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setText: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
  };
  return {
    add: {
      container: vi.fn().mockReturnValue(mockContainer),
      graphics: vi.fn().mockReturnValue(mockGraphics),
      text: vi.fn().mockReturnValue(mockText),
      existing: vi.fn(),
    },
    input: {
      setDraggable: vi.fn(),
    },
  } as any;
};

describe('HerbTagComponent', () => {
  describe('构造与属性', () => {
    it('should create component with herb data', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 6,
        grid: ['  aa  ', ' abba '],
        palette: { a: '#6a8c78', b: '#8ab098' },
      };

      const tag = new HerbTagComponent(scene, { herb });

      expect(tag.herb.name).toBe('当归');
      expect(tag.herb.count).toBe(6);
    });

    it('should have standard plank size 84x78', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 6,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });

      expect(tag.plankWidth).toBe(84);
      expect(tag.plankHeight).toBe(78);
    });

    it('should accept draggable config', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 6,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb, draggable: true });

      expect(tag.draggable).toBe(true);
    });
  });

  describe('数据克隆防护', () => {
    it('should clone herb data to prevent external mutation', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 6,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });

      // Modify original data
      herb.name = '川芎';
      herb.count = 10;
      herb.grid[0] = 'cc';

      // Component data should not be affected
      expect(tag.herb.name).toBe('当归');
      expect(tag.herb.count).toBe(6);
      expect(tag.herb.grid[0]).toBe('aa');
    });

    it('should clone palette to prevent external mutation', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 6,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });

      // Modify original palette
      herb.palette.a = '#000000';

      // Component palette should not be affected
      expect(tag.herb.palette.a).toBe('#ff0000');
    });
  });

  describe('像素图标集成', () => {
    it('should create PixelSpriteComponent with herb grid/palette', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 6,
        grid: ['  aa  ', ' abba '],
        palette: { a: '#6a8c78', b: '#8ab098' },
      };

      const tag = new HerbTagComponent(scene, { herb });

      // Verify graphics were created (PixelSpriteComponent uses graphics)
      expect(scene.add.graphics).toHaveBeenCalled();
    });

    it('should accept custom pixelSize', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 6,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb, pixelSize: 4 });

      expect(tag.pixelSize).toBe(4);
    });
  });

  describe('文本显示', () => {
    it('should create name text with herb name', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 1,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });

      expect(scene.add.text).toHaveBeenCalled();
      // First call should be for name - check style at index 3
      const firstTextCall = scene.add.text.mock.calls[0];
      expect(firstTextCall[3]).toEqual(expect.objectContaining({
        color: '#2a1810',
      }));
    });

    it('should create prop text with herb property', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 1,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });

      // Should create at least 2 texts (name and prop)
      expect(scene.add.text.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('should create count badge when count > 1', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 6,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });

      // Should create 3 texts (name, prop, count)
      expect(scene.add.text.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    it('should not create count badge when count = 1', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 1,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });

      // Should create only 2 texts (name and prop)
      expect(scene.add.text.mock.calls.length).toBe(2);
    });
  });

  describe('交互功能', () => {
    it('should setup draggable when draggable is true', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 1,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb, draggable: true });

      expect(scene.input.setDraggable).toHaveBeenCalled();
      expect(tag.container.setInteractive).toHaveBeenCalled();
    });

    it('should setup click handler when onClick is provided', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 1,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };
      const onClick = vi.fn();

      const tag = new HerbTagComponent(scene, { herb, onClick });

      expect(tag.container.setInteractive).toHaveBeenCalled();
      expect(tag.container.on).toHaveBeenCalledWith('pointerdown', onClick);
    });

    it('should not setup interaction when neither draggable nor onClick', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 1,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });

      expect(tag.container.setInteractive).not.toHaveBeenCalled();
    });
  });

  describe('位置与深度', () => {
    it('should have setPosition method returning this', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 1,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });
      const result = tag.setPosition(100, 200);

      expect(tag.container.setPosition).toHaveBeenCalledWith(100, 200);
      expect(result).toBe(tag);
    });

    it('should have setDepth method returning this', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 1,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });
      const result = tag.setDepth(50);

      expect(tag.container.setDepth).toHaveBeenCalledWith(50);
      expect(result).toBe(tag);
    });

    it('should create container at specified position', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 1,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb }, 100, 200);

      expect(scene.add.container).toHaveBeenCalledWith(100, 200);
    });
  });

  describe('销毁流程', () => {
    it('should have destroy method', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 1,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });
      expect(tag.destroy).toBeDefined();
      expect(typeof tag.destroy).toBe('function');
    });

    it('should destroy all graphics and container', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 1,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });
      tag.destroy();

      expect(tag.container.destroy).toHaveBeenCalled();
      // Graphics should be destroyed and nullified
      expect(tag.plankGraphics).toBeNull();
      expect(tag.stringGraphics).toBeNull();
    });

    it('should destroy pixelSprite', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 1,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });
      tag.destroy();

      expect(tag.pixelSprite).toBeNull();
    });

    it('should destroy text objects', () => {
      const scene = createMockScene();
      const herb = {
        id: 'danggui',
        name: '当归',
        prop: '补血',
        count: 1,
        grid: ['aa', 'bb'],
        palette: { a: '#ff0000', b: '#00ff00' },
      };

      const tag = new HerbTagComponent(scene, { herb });
      tag.destroy();

      expect(tag.nameText).toBeNull();
      expect(tag.propText).toBeNull();
      expect(tag.countText).toBeNull();
    });
  });
});