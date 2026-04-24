// tests/unit/constants.spec.ts
import { describe, test, expect } from 'vitest';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  TILE_SIZE,
  SCENES,
  PLAYER_SPEED,
  ASSETS
} from '../../src/data/constants';

describe('Game Constants', () => {
  describe('Game Dimensions', () => {
    test('Game width is 1280 pixels (16:9 720p)', () => {
      expect(GAME_WIDTH).toBe(1280);
    });

    test('Game height is 720 pixels (16:9 720p)', () => {
      expect(GAME_HEIGHT).toBe(720);
    });

    test('Tile size is 32 pixels', () => {
      expect(TILE_SIZE).toBe(32);
    });
  });

  describe('Scene Names', () => {
    test('SCENES object contains all required scenes', () => {
      expect(SCENES.TITLE).toBe('TitleScene');
      expect(SCENES.BOOT).toBe('BootScene');
      expect(SCENES.TOWN_OUTDOOR).toBe('TownOutdoorScene');
      expect(SCENES.CLINIC).toBe('ClinicScene');
      expect(SCENES.GARDEN).toBe('GardenScene');
      expect(SCENES.HOME).toBe('HomeScene');
    });

    test('SCENES is readonly (as const)', () => {
      // TypeScript will enforce this at compile time
      // Runtime check that all keys exist
      const sceneKeys = Object.keys(SCENES);
      expect(sceneKeys).toContain('TITLE');
      expect(sceneKeys).toContain('BOOT');
      expect(sceneKeys).toContain('TOWN_OUTDOOR');
      expect(sceneKeys).toContain('CLINIC');
      expect(sceneKeys).toContain('GARDEN');
      expect(sceneKeys).toContain('HOME');
    });
  });

  describe('Player Settings', () => {
    test('Player speed is 150', () => {
      expect(PLAYER_SPEED).toBe(150);
    });
  });

  describe('Asset Paths', () => {
    test('ASSETS object has correct structure', () => {
      expect(ASSETS.MAPS).toBeDefined();
      expect(ASSETS.TILES).toBeDefined();
      expect(ASSETS.SPRITES).toBeDefined();
    });

    test('Map paths are defined', () => {
      expect(ASSETS.MAPS.TOWN_OUTDOOR).toBe('maps/town-outdoor');
      expect(ASSETS.MAPS.CLINIC).toBe('maps/clinic');
      expect(ASSETS.MAPS.GARDEN).toBe('maps/garden');
      expect(ASSETS.MAPS.HOME).toBe('maps/home');
    });

    test('Tile paths are defined', () => {
      expect(ASSETS.TILES.OUTDOOR).toBe('tiles/tileset');
    });

    test('Sprite paths are defined', () => {
      expect(ASSETS.SPRITES.PLAYER).toBe('sprites/player');
    });
  });
});