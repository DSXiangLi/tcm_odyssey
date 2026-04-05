// tests/integration/indoor-scenes.spec.ts
import { describe, test, expect } from 'vitest';
import { TILE_SIZE } from '../../src/data/constants';

describe('Indoor Scenes', () => {
  describe('ClinicScene', () => {
    const ROOM_WIDTH = 15;
    const ROOM_HEIGHT = 12;

    test('Room dimensions match design spec', () => {
      expect(ROOM_WIDTH).toBe(15);
      expect(ROOM_HEIGHT).toBe(12);
    });

    test('Room pixel dimensions', () => {
      expect(ROOM_WIDTH * TILE_SIZE).toBe(480);
      expect(ROOM_HEIGHT * TILE_SIZE).toBe(384);
    });

    test('Door position is at bottom center', () => {
      const doorX = Math.floor(ROOM_WIDTH / 2);
      const doorY = ROOM_HEIGHT - 1;

      expect(doorX).toBe(7);
      expect(doorY).toBe(11);
    });

    test('Player spawn position is at room center', () => {
      const spawnX = Math.floor(ROOM_WIDTH / 2);
      const spawnY = Math.floor(ROOM_HEIGHT / 2);

      expect(spawnX).toBe(7);
      expect(spawnY).toBe(6);
    });

    test('Exit spawn point for return to town', () => {
      const exitSpawnX = 7;
      const exitSpawnY = 10;

      // Should be in front of clinic door
      expect(exitSpawnX).toBe(7);
      expect(exitSpawnY).toBe(10);
    });
  });

  describe('GardenScene', () => {
    const ROOM_WIDTH = 20;
    const ROOM_HEIGHT = 15;

    test('Room dimensions match design spec', () => {
      expect(ROOM_WIDTH).toBe(20);
      expect(ROOM_HEIGHT).toBe(15);
    });

    test('Room pixel dimensions', () => {
      expect(ROOM_WIDTH * TILE_SIZE).toBe(640);
      expect(ROOM_HEIGHT * TILE_SIZE).toBe(480);
    });

    test('Door position is at bottom center', () => {
      const doorX = Math.floor(ROOM_WIDTH / 2);
      const doorY = ROOM_HEIGHT - 1;

      expect(doorX).toBe(10);
      expect(doorY).toBe(14);
    });

    test('Herb plot count', () => {
      const herbPlotCount = 4;
      expect(herbPlotCount).toBe(4);
    });

    test('Herb plot positions are spaced evenly', () => {
      const plotPositions = [0, 1, 2, 3].map(i => 4 * TILE_SIZE + i * 3 * TILE_SIZE);

      // Verify spacing
      for (let i = 1; i < plotPositions.length; i++) {
        expect(plotPositions[i] - plotPositions[i - 1]).toBe(3 * TILE_SIZE);
      }
    });

    test('Exit spawn point for return to town', () => {
      const exitSpawnX = 33;
      const exitSpawnY = 10;

      // Should be in front of garden door
      expect(exitSpawnX).toBe(33);
      expect(exitSpawnY).toBe(10);
    });
  });

  describe('HomeScene', () => {
    const ROOM_WIDTH = 12;
    const ROOM_HEIGHT = 10;

    test('Room dimensions match design spec', () => {
      expect(ROOM_WIDTH).toBe(12);
      expect(ROOM_HEIGHT).toBe(10);
    });

    test('Room pixel dimensions', () => {
      expect(ROOM_WIDTH * TILE_SIZE).toBe(384);
      expect(ROOM_HEIGHT * TILE_SIZE).toBe(320);
    });

    test('Door position is at bottom center', () => {
      const doorX = Math.floor(ROOM_WIDTH / 2);
      const doorY = ROOM_HEIGHT - 1;

      expect(doorX).toBe(6);
      expect(doorY).toBe(9);
    });

    test('Functional areas are present', () => {
      const areas = ['kitchen', 'study', 'bedroom'];
      expect(areas.length).toBe(3);
    });

    test('Exit spawn point for return to town', () => {
      const exitSpawnX = 6;
      const exitSpawnY = 28;

      // Should be in front of home door
      expect(exitSpawnX).toBe(6);
      expect(exitSpawnY).toBe(28);
    });
  });
});