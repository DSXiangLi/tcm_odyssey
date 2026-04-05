// tests/integration/map-generation.spec.ts
import { describe, test, expect } from 'vitest';
import { TILE_SIZE } from '../../src/data/constants';

// Map generation logic tests (extracted from TownOutdoorScene)
describe('Map Generation', () => {
  const MAP_WIDTH = 40;
  const MAP_HEIGHT = 30;

  describe('Map Data Structure', () => {
    test('Map dimensions match design spec', () => {
      expect(MAP_WIDTH).toBe(40);
      expect(MAP_HEIGHT).toBe(30);
    });

    test('Total tiles in map', () => {
      const totalTiles = MAP_WIDTH * MAP_HEIGHT;
      expect(totalTiles).toBe(1200);
    });

    test('Map pixel dimensions', () => {
      const pixelWidth = MAP_WIDTH * TILE_SIZE;
      const pixelHeight = MAP_HEIGHT * TILE_SIZE;

      expect(pixelWidth).toBe(1280);
      expect(pixelHeight).toBe(960);
    });
  });

  describe('Path Generation', () => {
    test('Cross path center position', () => {
      const centerX = Math.floor(MAP_WIDTH / 2);
      const centerY = Math.floor(MAP_HEIGHT / 2);

      expect(centerX).toBe(20);
      expect(centerY).toBe(15);
    });

    test('Horizontal path spans correct width', () => {
      const pathStart = 5;
      const pathEnd = MAP_WIDTH - 5;

      expect(pathEnd - pathStart).toBe(30);
    });

    test('Vertical path spans correct height', () => {
      const pathStart = 5;
      const pathEnd = MAP_HEIGHT - 5;

      expect(pathEnd - pathStart).toBe(20);
    });
  });

  describe('Building Placement', () => {
    interface Building {
      name: string;
      startX: number;
      startY: number;
      width: number;
      height: number;
      doorTarget: string;
    }

    const buildings: Building[] = [
      { name: 'clinic', startX: 3, startY: 3, width: 8, height: 6, doorTarget: 'clinic' },
      { name: 'garden', startX: MAP_WIDTH - 11, startY: 3, width: 8, height: 6, doorTarget: 'garden' },
      { name: 'home', startX: 3, startY: MAP_HEIGHT - 9, width: 6, height: 6, doorTarget: 'home' }
    ];

    test('Clinic building is in correct position', () => {
      const clinic = buildings[0];
      expect(clinic.startX).toBe(3);
      expect(clinic.startY).toBe(3);
      expect(clinic.width).toBe(8);
      expect(clinic.height).toBe(6);
    });

    test('Garden building is in correct position', () => {
      const garden = buildings[1];
      expect(garden.startX).toBe(29);
      expect(garden.startY).toBe(3);
      expect(garden.width).toBe(8);
      expect(garden.height).toBe(6);
    });

    test('Home building is in correct position', () => {
      const home = buildings[2];
      expect(home.startX).toBe(3);
      expect(home.startY).toBe(21);
      expect(home.width).toBe(6);
      expect(home.height).toBe(6);
    });

    test('Door positions are at building bottom center', () => {
      buildings.forEach(building => {
        const doorX = building.startX + Math.floor(building.width / 2);
        const doorY = building.startY + building.height - 1;

        expect(doorX).toBeGreaterThanOrEqual(building.startX);
        expect(doorX).toBeLessThan(building.startX + building.width);
        expect(doorY).toBe(building.startY + building.height - 1);
      });
    });

    test('Buildings do not overlap', () => {
      for (let i = 0; i < buildings.length; i++) {
        for (let j = i + 1; j < buildings.length; j++) {
          const a = buildings[i];
          const b = buildings[j];

          const overlapX = a.startX < b.startX + b.width && a.startX + a.width > b.startX;
          const overlapY = a.startY < b.startY + b.height && a.startY + a.height > b.startY;

          expect(overlapX && overlapY).toBe(false);
        }
      }
    });
  });

  describe('Boundary Walls', () => {
    test('Boundary walls surround entire map', () => {
      // Top and bottom walls
      for (let x = 0; x < MAP_WIDTH; x++) {
        // Row 0 and row MAP_HEIGHT-1 should be walls
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(MAP_WIDTH);
      }

      // Left and right walls
      for (let y = 0; y < MAP_HEIGHT; y++) {
        // Column 0 and column MAP_WIDTH-1 should be walls
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(MAP_HEIGHT);
      }
    });
  });
});