// src/systems/SceneManager.ts
import Phaser from 'phaser';

export interface DoorInfo {
  targetScene: string;
  spawnPoint: { x: number; y: number };      // 从室内返回时的室外出生点
  indoorSpawnPoint: { x: number; y: number }; // 进入室内后的出生点
}

export class SceneManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  checkDoorInteraction(
    playerTileX: number,
    playerTileY: number,
    doorTiles: Map<string, DoorInfo>
  ): DoorInfo | null {
    // Phase 1.5修复: 扩大门检测范围到2格，让玩家更容易触发门交互
    // 修复：检查±2格范围内的所有位置（包括对角），而不是只检查上下左右
    const key = `${playerTileX},${playerTileY}`;

    // 首先检查玩家是否精确在门上
    if (doorTiles.has(key)) {
      return doorTiles.get(key) || null;
    }

    // 检查±2格范围内的所有位置（包括对角位置）
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        // 跳过玩家当前位置（已检查）
        if (dx === 0 && dy === 0) continue;

        const nearbyKey = `${playerTileX + dx},${playerTileY + dy}`;
        if (doorTiles.has(nearbyKey)) {
          return doorTiles.get(nearbyKey) || null;
        }
      }
    }

    return null;
  }

  changeScene(targetScene: string, spawnPoint?: { x: number; y: number }): void {
    // 存储出生点数据
    if (spawnPoint) {
      this.scene.registry.set('spawnPoint', spawnPoint);
    }

    this.scene.scene.start(targetScene);
  }

  getSpawnPoint(): { x: number; y: number } | undefined {
    return this.scene.registry.get('spawnPoint');
  }

  clearSpawnPoint(): void {
    this.scene.registry.remove('spawnPoint');
  }
}