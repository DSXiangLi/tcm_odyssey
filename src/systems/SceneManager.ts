// src/systems/SceneManager.ts
import Phaser from 'phaser';

export interface DoorInfo {
  targetScene: string;
  spawnPoint: { x: number; y: number };
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
    const key = `${playerTileX},${playerTileY}`;
    return doorTiles.get(key) || null;
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