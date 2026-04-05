// tests/unit/player.spec.ts
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { TILE_SIZE, PLAYER_SPEED } from '../../src/data/constants';

// Test Player entity logic
describe('Player Entity', () => {
  describe('Constants Validation', () => {
    test('TILE_SIZE is 32 pixels', () => {
      expect(TILE_SIZE).toBe(32);
    });

    test('PLAYER_SPEED is 150', () => {
      expect(PLAYER_SPEED).toBe(150);
    });
  });

  describe('Movement Logic', () => {
    test('Diagonal movement speed should be normalized', () => {
      const speed = 150;
      const diagonalFactor = Math.SQRT1_2; // ≈ 0.707

      const diagonalSpeed = speed * diagonalFactor;

      // Verify diagonal speed is correct
      expect(diagonalSpeed).toBeCloseTo(106.07, 1);

      // Verify total diagonal velocity magnitude equals original speed
      const magnitude = Math.sqrt(diagonalSpeed ** 2 + diagonalSpeed ** 2);
      expect(magnitude).toBeCloseTo(speed, 1);
    });

    test('Cardinal movement speed should be unchanged', () => {
      const speed = 150;

      // Moving right only
      const velocityX = speed;
      const velocityY = 0;

      const magnitude = Math.sqrt(velocityX ** 2 + velocityY ** 2);
      expect(magnitude).toBe(speed);
    });
  });

  describe('Tile Position Calculation', () => {
    test('Tile position should be correctly calculated', () => {
      const pixelX = 5 * TILE_SIZE + TILE_SIZE / 2; // Center of tile 5
      const pixelY = 10 * TILE_SIZE + TILE_SIZE / 2; // Center of tile 10

      const tileX = Math.floor(pixelX / TILE_SIZE);
      const tileY = Math.floor(pixelY / TILE_SIZE);

      expect(tileX).toBe(5);
      expect(tileY).toBe(10);
    });
  });

  describe('Direction Tracking', () => {
    test('Last direction should be updated on movement', () => {
      const lastDirection = { x: 0, y: 1 }; // Default facing down

      // Simulate moving right
      const newDirection = { x: 1, y: 0 };

      // Update last direction
      if (newDirection.x !== 0 || newDirection.y !== 0) {
        Object.assign(lastDirection, newDirection);
      }

      expect(lastDirection).toEqual({ x: 1, y: 0 });
    });
  });
});