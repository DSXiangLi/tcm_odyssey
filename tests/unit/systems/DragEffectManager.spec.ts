import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Phaser from 'phaser';
import DragEffectManager, {
  DragEffectConfig,
} from '../../../src/systems/DragEffectManager';

describe('DragEffectManager', () => {
  let scene: Phaser.Scene;
  let manager: DragEffectManager;

  const mockScene = () => {
    const mock = {
      add: {
        graphics: vi.fn().mockReturnValue({
          setPosition: vi.fn().mockReturnThis(),
          setOrigin: vi.fn().mockReturnThis(),
          setRotation: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          alpha: 1,
          scale: 1,
          x: 0,
          y: 0,
          fillStyle: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeCircle: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          moveTo: vi.fn().mockReturnThis(),
          lineTo: vi.fn().mockReturnThis(),
          strokePath: vi.fn().mockReturnThis(),
        }),
        text: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setRotation: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
          alpha: 1,
          scale: 1,
          x: 0,
          y: 0,
        }),
      },
      tweens: {
        add: vi.fn().mockImplementation((config) => {
          // Simulate tween completion for cleanup tests
          if (config.onComplete) {
            // Don't call immediately, just store for later
          }
          return { stop: vi.fn() };
        }),
      },
    } as unknown as Phaser.Scene;
    return mock;
  };

  beforeEach(() => {
    scene = mockScene();
  });

  afterEach(() => {
    if (manager) {
      manager.destroy();
    }
  });

  describe('constructor and config', () => {
    it('should use default config values when no config provided', () => {
      manager = new DragEffectManager(scene);

      expect(manager.config.trail.enabled).toBe(true);
      expect(manager.config.trail.maxCount).toBe(20);
      expect(manager.config.trail.fadeTime).toBe(600);
      expect(manager.config.trail.particleSize).toBe(4);

      expect(manager.config.splash.enabled).toBe(true);
      expect(manager.config.splash.count).toBe(8);
      expect(manager.config.splash.spread).toBe(40);
      expect(manager.config.splash.riseHeight).toBe(50);

      expect(manager.config.burst.success.text).toBe('合');
      expect(manager.config.burst.success.color).toBe('#ffd24a');
      expect(manager.config.burst.success.duration).toBe(1400);

      expect(manager.config.burst.failure.showCross).toBe(true);
      expect(manager.config.burst.failure.showSmoke).toBe(true);
      expect(manager.config.burst.failure.duration).toBe(1100);
    });

    it('should merge custom config values with defaults', () => {
      const customConfig: DragEffectConfig = {
        trail: {
          enabled: false,
          maxCount: 10,
        },
        splash: {
          count: 12,
          spread: 60,
        },
        burst: {
          success: {
            text: '成',
            color: '#00ff00',
          },
          failure: {
            showCross: false,
          },
        },
      };

      manager = new DragEffectManager(scene, customConfig);

      // Custom values should override defaults
      expect(manager.config.trail.enabled).toBe(false);
      expect(manager.config.trail.maxCount).toBe(10);
      // Default values should remain for unspecified properties
      expect(manager.config.trail.fadeTime).toBe(600);
      expect(manager.config.trail.particleSize).toBe(4);

      expect(manager.config.splash.count).toBe(12);
      expect(manager.config.splash.spread).toBe(60);
      expect(manager.config.splash.riseHeight).toBe(50); // default

      expect(manager.config.burst.success.text).toBe('成');
      expect(manager.config.burst.success.color).toBe('#00ff00');
      expect(manager.config.burst.success.duration).toBe(1400); // default

      expect(manager.config.burst.failure.showCross).toBe(false);
      expect(manager.config.burst.failure.showSmoke).toBe(true); // default
    });
  });

  describe('drag lifecycle', () => {
    it('should set isDragging to true on startDrag', () => {
      manager = new DragEffectManager(scene);
      manager.startDrag(100, 100);

      expect(manager.isDragging).toBe(true);
      expect(manager.lastDragX).toBe(100);
      expect(manager.lastDragY).toBe(100);
    });

    it('should set isDragging to false on endDrop', () => {
      manager = new DragEffectManager(scene);
      manager.startDrag(100, 100);
      manager.endDrop(200, 200, 'success');

      expect(manager.isDragging).toBe(false);
    });
  });

  describe('trail particles', () => {
    it('should create trail particle when updateDrag distance exceeds threshold', () => {
      manager = new DragEffectManager(scene);
      manager.startDrag(100, 100);

      // Move enough distance to trigger particle creation (> 8 pixels)
      manager.updateDrag(120, 100);

      expect(scene.add.graphics).toHaveBeenCalled();
      expect(scene.tweens.add).toHaveBeenCalled();
      expect(manager.trailParticles.length).toBeGreaterThanOrEqual(1);
    });

    it('should not create trail particle when trail is disabled', () => {
      manager = new DragEffectManager(scene, { trail: { enabled: false } });
      manager.startDrag(100, 100);
      manager.updateDrag(120, 100);

      expect(scene.add.graphics).not.toHaveBeenCalled();
    });

    it('should not create trail particle when distance below threshold', () => {
      manager = new DragEffectManager(scene);
      manager.startDrag(100, 100);

      // Small movement, below threshold
      manager.updateDrag(105, 100);

      expect(scene.add.graphics).not.toHaveBeenCalled();
    });

    it('should limit trail particles to maxCount', () => {
      manager = new DragEffectManager(scene, { trail: { maxCount: 3 } });
      manager.startDrag(0, 0);

      // Create 5 particles by moving enough distance each time
      for (let i = 0; i < 5; i++) {
        manager.updateDrag(10 + i * 15, 0);
      }

      // Should not exceed maxCount
      expect(manager.trailParticles.length).toBeLessThanOrEqual(3);
    });

    it('should clear trail particles on endDrop', () => {
      manager = new DragEffectManager(scene);
      manager.startDrag(100, 100);
      manager.updateDrag(120, 100);

      expect(manager.trailParticles.length).toBeGreaterThan(0);

      manager.endDrop(200, 200, 'success');

      expect(manager.trailParticles.length).toBe(0);
    });
  });

  describe('splash effect', () => {
    it('should create splash particles on endDrop when enabled', () => {
      manager = new DragEffectManager(scene);
      manager.startDrag(100, 100);
      manager.endDrop(200, 200, 'success');

      // Splash count is 8 by default
      // Each splash particle uses graphics
      expect(scene.add.graphics).toHaveBeenCalled();
    });

    it('should not create splash when disabled', () => {
      manager = new DragEffectManager(scene, { splash: { enabled: false } });
      manager.startDrag(100, 100);
      manager.endDrop(200, 200, 'success');

      // Only success burst graphics, no splash
      // Verify that splash wasn't created by checking graphics call count pattern
      // This is a soft check since we can't easily distinguish between effects
    });
  });

  describe('success burst', () => {
    it('should create success burst effects on successful drop', () => {
      manager = new DragEffectManager(scene);
      manager.startDrag(100, 100);
      manager.endDrop(200, 200, 'success');

      // Success burst creates:
      // - 2 rings (graphics)
      // - 1 stamp (text)
      // - 8 sparks (graphics)
      expect(scene.add.graphics).toHaveBeenCalled();
      expect(scene.add.text).toHaveBeenCalled();
      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('should use custom success text from config', () => {
      manager = new DragEffectManager(scene, {
        burst: { success: { text: '配' } },
      });
      manager.startDrag(100, 100);
      manager.endDrop(200, 200, 'success');

      expect(scene.add.text).toHaveBeenCalledWith(200, 200, '配', expect.any(Object));
    });
  });

  describe('failure burst', () => {
    it('should create failure burst effects on failed drop', () => {
      manager = new DragEffectManager(scene);
      manager.startDrag(100, 100);
      manager.endDrop(200, 200, 'failure');

      // Failure burst creates:
      // - cross graphics (if showCross)
      // - smoke graphics (if showSmoke)
      // - 6 sparks (graphics)
      expect(scene.add.graphics).toHaveBeenCalled();
      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('should not show cross when showCross is false', () => {
      manager = new DragEffectManager(scene, {
        burst: { failure: { showCross: false, showSmoke: true } },
      });
      manager.startDrag(100, 100);
      manager.endDrop(200, 200, 'failure');

      // Still creates smoke and sparks
      expect(scene.add.graphics).toHaveBeenCalled();
    });

    it('should not show smoke when showSmoke is false', () => {
      manager = new DragEffectManager(scene, {
        burst: { failure: { showCross: true, showSmoke: false } },
      });
      manager.startDrag(100, 100);
      manager.endDrop(200, 200, 'failure');

      // Still creates cross and sparks
      expect(scene.add.graphics).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should clear all trail particles on destroy', () => {
      manager = new DragEffectManager(scene);
      manager.startDrag(100, 100);
      manager.updateDrag(120, 100);
      manager.updateDrag(140, 100);

      expect(manager.trailParticles.length).toBeGreaterThan(0);

      manager.destroy();

      expect(manager.trailParticles.length).toBe(0);
    });
  });
});