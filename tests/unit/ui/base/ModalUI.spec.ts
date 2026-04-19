// tests/unit/ui/base/ModalUI.spec.ts
/**
 * ModalUI弹窗基类单元测试
 *
 * 测试内容：
 * - MODAL_SIZES常量定义（5种标准弹窗尺寸）
 * - EXIT_BUTTON_POSITIONS常量定义（各类型标准退出按钮位置）
 * - ModalUI类构造函数
 * - 默认3D边框样式
 * - ESC快捷键退出
 * - 静态方法getSize和getExitPosition
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ModalUI, { MODAL_SIZES, EXIT_BUTTON_POSITIONS, ModalType } from '../../../../src/ui/base/ModalUI';

// Mock Phaser Scene
const createMockScene = () => {
  const mockContainer = {
    setDepth: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setX: vi.fn().mockReturnThis(),
    setY: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
  };

  const mockGraphics = {
    fillStyle: vi.fn().mockReturnThis(),
    fillGradientStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeRect: vi.fn().mockReturnThis(),
    beginPath: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    strokePath: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    clear: vi.fn().mockReturnThis(),
  };

  const mockText = {
    setOrigin: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    setText: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
  };

  const mockKeyboard = {
    on: vi.fn(),
    off: vi.fn(),
  };

  return {
    add: {
      container: vi.fn().mockReturnValue(mockContainer),
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

describe('ModalUI', () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__BASE_UI__;
      delete (window as any).__MODAL_UI__;
    }
  });

  afterEach(() => {
    // Clean up window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__BASE_UI__;
      delete (window as any).__MODAL_UI__;
    }
  });

  describe('MODAL_SIZES常量', () => {
    it('should define DIAGNOSIS_MODAL as 720x480', () => {
      expect(MODAL_SIZES.DIAGNOSIS_MODAL).toEqual({ width: 720, height: 480 });
    });

    it('should define INQUIRY_MODAL as 640x420', () => {
      expect(MODAL_SIZES.INQUIRY_MODAL).toEqual({ width: 640, height: 420 });
    });

    it('should define MINIGAME_MODAL as 800x600', () => {
      expect(MODAL_SIZES.MINIGAME_MODAL).toEqual({ width: 800, height: 600 });
    });

    it('should define FULLSCREEN_MODAL as 1024x768', () => {
      expect(MODAL_SIZES.FULLSCREEN_MODAL).toEqual({ width: 1024, height: 768 });
    });

    it('should define DIALOG_MODAL as 500x300', () => {
      expect(MODAL_SIZES.DIALOG_MODAL).toEqual({ width: 500, height: 300 });
    });

    it('should have 5 modal types defined', () => {
      const keys = Object.keys(MODAL_SIZES);
      expect(keys.length).toBe(5);
      expect(keys).toContain('DIAGNOSIS_MODAL');
      expect(keys).toContain('INQUIRY_MODAL');
      expect(keys).toContain('MINIGAME_MODAL');
      expect(keys).toContain('FULLSCREEN_MODAL');
      expect(keys).toContain('DIALOG_MODAL');
    });
  });

  describe('EXIT_BUTTON_POSITIONS常量', () => {
    it('should have correct exit position for DIAGNOSIS_MODAL', () => {
      // Position relative to modal center: x = width/2 - 20, y = -height/2 + 10
      expect(EXIT_BUTTON_POSITIONS.DIAGNOSIS_MODAL).toEqual({ x: 340, y: -250 });
    });

    it('should have correct exit position for INQUIRY_MODAL', () => {
      expect(EXIT_BUTTON_POSITIONS.INQUIRY_MODAL).toEqual({ x: 300, y: -200 });
    });

    it('should have correct exit position for MINIGAME_MODAL', () => {
      expect(EXIT_BUTTON_POSITIONS.MINIGAME_MODAL).toEqual({ x: 380, y: -290 });
    });

    it('should have correct exit position for FULLSCREEN_MODAL', () => {
      expect(EXIT_BUTTON_POSITIONS.FULLSCREEN_MODAL).toEqual({ x: 492, y: -384 });
    });

    it('should have correct exit position for DIALOG_MODAL', () => {
      expect(EXIT_BUTTON_POSITIONS.DIALOG_MODAL).toEqual({ x: 240, y: -150 });
    });

    it('should have 5 exit positions matching 5 modal types', () => {
      const keys = Object.keys(EXIT_BUTTON_POSITIONS);
      expect(keys.length).toBe(5);
      expect(keys).toContain('DIAGNOSIS_MODAL');
      expect(keys).toContain('INQUIRY_MODAL');
      expect(keys).toContain('MINIGAME_MODAL');
      expect(keys).toContain('FULLSCREEN_MODAL');
      expect(keys).toContain('DIALOG_MODAL');
    });
  });

  describe('ModalType类型', () => {
    it('should be a valid type for all modal types', () => {
      const types: ModalType[] = ['DIAGNOSIS_MODAL', 'INQUIRY_MODAL', 'MINIGAME_MODAL', 'FULLSCREEN_MODAL', 'DIALOG_MODAL'];
      expect(types.length).toBe(5);
    });
  });

  describe('ModalUI类', () => {
    it('should create modal with specified type', () => {
      const modal = new ModalUI(mockScene, 'DIAGNOSIS_MODAL', '[退出]', vi.fn());
      expect(modal.width).toBe(720);
      expect(modal.height).toBe(480);
    });

    it('should create modal with INQUIRY_MODAL type', () => {
      const modal = new ModalUI(mockScene, 'INQUIRY_MODAL', '[退出]', vi.fn());
      expect(modal.width).toBe(640);
      expect(modal.height).toBe(420);
    });

    it('should create modal with MINIGAME_MODAL type', () => {
      const modal = new ModalUI(mockScene, 'MINIGAME_MODAL', '[退出]', vi.fn());
      expect(modal.width).toBe(800);
      expect(modal.height).toBe(600);
    });

    it('should create modal with FULLSCREEN_MODAL type', () => {
      const modal = new ModalUI(mockScene, 'FULLSCREEN_MODAL', '[退出]', vi.fn());
      expect(modal.width).toBe(1024);
      expect(modal.height).toBe(768);
    });

    it('should create modal with DIALOG_MODAL type', () => {
      const modal = new ModalUI(mockScene, 'DIALOG_MODAL', '[退出]', vi.fn());
      expect(modal.width).toBe(500);
      expect(modal.height).toBe(300);
    });

    it('should use 3d border style by default', () => {
      const modal = new ModalUI(mockScene, 'DIAGNOSIS_MODAL', '[退出]', vi.fn());
      // Graphics should be created for border
      expect(mockScene.add.graphics).toHaveBeenCalled();
      expect(modal.graphics).toBeDefined();
    });

    it('should create exit button at standard position', () => {
      const modal = new ModalUI(mockScene, 'DIAGNOSIS_MODAL', '[退出]', vi.fn());
      // Exit button should be created
      expect(mockScene.add.text).toHaveBeenCalled();
    });

    it('should setup ESC key listener', () => {
      const onExit = vi.fn();
      const modal = new ModalUI(mockScene, 'DIAGNOSIS_MODAL', '[退出]', onExit);
      // ESC key listener should be registered
      expect(mockScene.input.keyboard.on).toHaveBeenCalled();
    });

    it('should call onExit callback when ESC pressed', () => {
      const onExit = vi.fn();
      const modal = new ModalUI(mockScene, 'DIAGNOSIS_MODAL', '[退出]', onExit);

      // Get the ESC handler from keyboard.on call
      const keyboardOnCalls = mockScene.input.keyboard.on.mock.calls;
      const escCall = keyboardOnCalls.find(call => call[0] === 'keydown-ESC');
      expect(escCall).toBeDefined();

      // Simulate ESC press
      if (escCall) {
        const handler = escCall[1];
        handler();
        expect(onExit).toHaveBeenCalled();
      }
    });

    it('should have destroy method that removes ESC listener', () => {
      const onExit = vi.fn();
      const modal = new ModalUI(mockScene, 'DIAGNOSIS_MODAL', '[退出]', onExit);
      modal.destroy();

      // ESC listener should be removed
      expect(mockScene.input.keyboard.off).toHaveBeenCalled();
      // Container should be destroyed
      expect(modal.container.destroy).toHaveBeenCalled();
    });
  });

  describe('静态方法', () => {
    it('should have static getSize method', () => {
      expect(ModalUI.getSize).toBeDefined();
      expect(typeof ModalUI.getSize).toBe('function');
    });

    it('should return correct size for DIAGNOSIS_MODAL', () => {
      const size = ModalUI.getSize('DIAGNOSIS_MODAL');
      expect(size).toEqual({ width: 720, height: 480 });
    });

    it('should return correct size for MINIGAME_MODAL', () => {
      const size = ModalUI.getSize('MINIGAME_MODAL');
      expect(size).toEqual({ width: 800, height: 600 });
    });

    it('should have static getExitPosition method', () => {
      expect(ModalUI.getExitPosition).toBeDefined();
      expect(typeof ModalUI.getExitPosition).toBe('function');
    });

    it('should return correct exit position for DIAGNOSIS_MODAL', () => {
      const position = ModalUI.getExitPosition('DIAGNOSIS_MODAL');
      expect(position).toEqual({ x: 340, y: -250 });
    });

    it('should return correct exit position for MINIGAME_MODAL', () => {
      const position = ModalUI.getExitPosition('MINIGAME_MODAL');
      expect(position).toEqual({ x: 380, y: -290 });
    });
  });

  describe('继承BaseUIComponent', () => {
    it('should have container property', () => {
      const modal = new ModalUI(mockScene, 'DIAGNOSIS_MODAL', '[退出]', vi.fn());
      expect(modal.container).toBeDefined();
    });

    it('should have graphics property', () => {
      const modal = new ModalUI(mockScene, 'DIAGNOSIS_MODAL', '[退出]', vi.fn());
      expect(modal.graphics).toBeDefined();
    });

    it('should have depth property', () => {
      const modal = new ModalUI(mockScene, 'DIAGNOSIS_MODAL', '[退出]', vi.fn());
      expect(modal.depth).toBeDefined();
    });

    it('should have setDepth method', () => {
      const modal = new ModalUI(mockScene, 'DIAGNOSIS_MODAL', '[退出]', vi.fn());
      modal.setDepth(200);
      expect(modal.container.setDepth).toHaveBeenCalledWith(200);
    });
  });
});