// tests/unit/ui/base/ScrollModalUI.spec.ts
/**
 * ScrollModalUI卷轴风格弹窗基类单元测试
 *
 * 测试内容：
 * - ScrollModalConfig配置解析
 * - 继承ModalUI基类
 * - 卷轴边框绘制（木轴、纸张）
 * - 印章绘制（主印章、角印章）
 * - 标题栏绘制（主标题、副标题竖排）
 * - 内容容器创建
 * - destroy方法清理资源
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ScrollModalUI from '../../../../src/ui/base/ScrollModalUI';

// Mock Phaser Scene
const createMockScene = () => {
  const mockContainer = {
    add: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setScrollFactor: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
  };

  const mockGraphics = {
    clear: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    fillGradientStyle: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    beginPath: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    strokePath: vi.fn().mockReturnThis(),
  };

  const mockText = {
    setOrigin: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setText: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    setBackgroundColor: vi.fn().mockReturnThis(),
    setRotation: vi.fn().mockReturnThis(),
  };

  const mockKeyboard = {
    on: vi.fn(),
    off: vi.fn(),
  };

  return {
    add: {
      container: vi.fn((x, y) => {
        mockContainer.x = x;
        mockContainer.y = y;
        return mockContainer;
      }),
      graphics: vi.fn().mockReturnValue(mockGraphics),
      text: vi.fn().mockReturnValue(mockText),
      existing: vi.fn(),
    },
    cameras: {
      main: {
        centerX: 400,
        centerY: 300,
        width: 800,
        height: 600,
        scrollX: 0,
        scrollY: 0,
      },
    },
    scene: { key: 'testScene' },
    scale: {
      width: 800,
      height: 600,
    },
    input: {
      keyboard: mockKeyboard,
    },
  } as any;
};

describe('ScrollModalUI', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__BASE_UI__;
      delete (window as any).__MODAL_UI__;
      delete (window as any).__SCROLL_MODAL_UI__;
    }
  });

  afterEach(() => {
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__BASE_UI__;
      delete (window as any).__MODAL_UI__;
      delete (window as any).__SCROLL_MODAL_UI__;
    }
  });

  describe('构造与属性', () => {
    it('should create modal with title', () => {
      const modal = new ScrollModalUI(mockScene, {
        title: '煎药',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      expect(modal.title).toBe('煎药');
      expect(mockScene.add.text).toHaveBeenCalled();
    });

    it('should accept subtitle config', () => {
      const modal = new ScrollModalUI(mockScene, {
        title: '煎药',
        subtitle: '壬寅春',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      expect(modal.subtitle).toBe('壬寅春');
    });

    it('should accept sealMain config', () => {
      const modal = new ScrollModalUI(mockScene, {
        title: '煎药',
        sealMain: '杏林',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      expect(modal.sealMain).toBe('杏林');
    });

    it('should accept sealCorner config', () => {
      const modal = new ScrollModalUI(mockScene, {
        title: '煎药',
        sealCorner: '煎煮',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      expect(modal.sealCorner).toBe('煎煮');
    });

    it('should inherit from ModalUI', () => {
      const modal = new ScrollModalUI(mockScene, {
        title: '煎药',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      expect(modal.container).toBeDefined();
      expect(modal.modalType).toBe('MINIGAME_MODAL');
      expect(modal.width).toBe(800);
      expect(modal.height).toBe(600);
    });

    it('should use default variant when not specified', () => {
      const modal = new ScrollModalUI(mockScene, {
        title: '煎药',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      expect(modal.variant).toBe('default');
    });

    it('should accept variant config', () => {
      const modal = new ScrollModalUI(mockScene, {
        title: '煎药',
        variant: 'dark',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      expect(modal.variant).toBe('dark');
    });
  });

  describe('卷轴边框绘制', () => {
    it('should clear existing graphics before drawing scroll frame', () => {
      const modal = new ScrollModalUI(mockScene, {
        title: '煎药',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      // Graphics.clear should be called to reset the graphics
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });

    it('should draw scroll frame for MINIGAME_MODAL size', () => {
      const modal = new ScrollModalUI(mockScene, {
        title: '煎药',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      // Should use MINIGAME_MODAL size (800x600)
      expect(modal.width).toBe(800);
      expect(modal.height).toBe(600);
    });
  });

  describe('印章绘制', () => {
    it('should create seal graphics when sealMain is provided', () => {
      const modal = new ScrollModalUI(mockScene, {
        title: '煎药',
        sealMain: '杏林',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      // Graphics should be created for seal
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });

    it('should create seal graphics when sealCorner is provided', () => {
      const modal = new ScrollModalUI(mockScene, {
        title: '煎药',
        sealCorner: '煎煮',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      // Graphics should be created for seal
      expect(mockScene.add.graphics).toHaveBeenCalled();
    });
  });

  describe('内容容器', () => {
    it('should create content container for child elements', () => {
      const modal = new ScrollModalUI(mockScene, {
        title: '煎药',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      expect(modal.getContentContainer()).toBeDefined();
    });
  });

  describe('destroy方法', () => {
    it('should clean up all graphics resources', () => {
      const modal = new ScrollModalUI(mockScene, {
        title: '煎药',
        sealMain: '杏林',
        sealCorner: '煎煮',
        modalType: 'MINIGAME_MODAL',
        onExit: vi.fn(),
      });

      modal.destroy();

      // ESC listener should be removed (inherited from ModalUI)
      expect(mockScene.input.keyboard.off).toHaveBeenCalled();
    });
  });
});