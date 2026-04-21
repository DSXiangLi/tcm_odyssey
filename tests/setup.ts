// tests/setup.ts
import { vi } from 'vitest';

// Mock Phaser for unit tests
vi.mock('phaser', () => {
  const mockScene = {
    add: {
      existing: vi.fn(),
      sprite: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      rectangle: vi.fn().mockReturnThis(),
      graphics: vi.fn().mockReturnThis()
    },
    physics: {
      add: {
        existing: vi.fn(),
        sprite: vi.fn().mockReturnThis(),
        staticGroup: vi.fn().mockReturnThis(),
        collider: vi.fn()
      }
    },
    input: {
      keyboard: {
        createCursorKeys: vi.fn().mockReturnValue({
          up: { isDown: false },
          down: { isDown: false },
          left: { isDown: false },
          right: { isDown: false },
          space: { isDown: false }
        }),
        addKey: vi.fn().mockReturnValue({ isDown: false }),
        addKeys: vi.fn()
      }
    },
    cameras: {
      main: {
        setBounds: vi.fn(),
        startFollow: vi.fn(),
        fadeIn: vi.fn(),
        fade: vi.fn()
      }
    },
    scene: {
      start: vi.fn(),
      isActive: vi.fn().mockReturnValue(true)
    },
    registry: {
      set: vi.fn(),
      get: vi.fn(),
      remove: vi.fn()
    },
    children: {
      list: []
    },
    time: {
      delayedCall: vi.fn()
    },
    load: {
      on: vi.fn(),
      tilemapTiledJSON: vi.fn(),
      image: vi.fn(),
      spritesheet: vi.fn()
    },
    game: {
      loop: {
        tick: vi.fn()
      }
    }
  };

  return {
    default: {
      Game: vi.fn().mockImplementation(() => ({
        scene: {
          getScene: vi.fn().mockReturnValue(mockScene),
          start: vi.fn()
        },
        isRunning: true,
        destroy: vi.fn(),
        loop: { tick: vi.fn() }
      })),
      Scene: vi.fn().mockImplementation(() => mockScene),
      Physics: {
        Arcade: {
          Sprite: vi.fn().mockImplementation(() => ({
            ...mockScene,
            x: 0,
            y: 0,
            setVelocity: vi.fn(),
            setDepth: vi.fn(),
            setCollideWorldBounds: vi.fn(),
            body: {
              setSize: vi.fn(),
              setOffset: vi.fn(),
              velocity: { x: 0, y: 0 }
            }
          })),
          StaticGroup: vi.fn()
        }
      },
      Scale: {
        FIT: 'FIT',
        CENTER_BOTH: 'CENTER_BOTH'
      },
      Input: {
        Keyboard: {
          JustDown: vi.fn().mockReturnValue(false),
          KeyCodes: {
            SPACE: 'SPACE'
          }
        }
      },
      Display: {
        Color: {
          HexStringToColor: vi.fn().mockImplementation((hex: string) => {
            // Convert hex string like '#ff0000' to number 0xff0000
            const hexNum = parseInt(hex.replace('#', ''), 16);
            return { color: hexNum };
          })
        }
      },
      AUTO: 'AUTO'
    }
  };
});

// Global test utilities
globalThis.sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));