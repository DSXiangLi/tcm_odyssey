// src/entities/Player.ts
import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';

export interface PlayerConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  public speed: number = 150;
  private lastDirection: { x: number; y: number } = { x: 0, y: 1 };

  constructor(config: PlayerConfig) {
    super(config.scene, config.x, config.y, 'player');

    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);

    this.init();
  }

  private init(): void {
    this.setDepth(1);
    this.setCollideWorldBounds(true);

    // 设置碰撞体
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(TILE_SIZE - 4, TILE_SIZE - 4);
    body.setOffset(2, 2);
  }

  move(direction: { x: number; y: number }): void {
    let velocityX = direction.x * this.speed;
    let velocityY = direction.y * this.speed;

    // 对角线移动标准化
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707;
      velocityY *= 0.707;
    }

    this.setVelocity(velocityX, velocityY);

    // 记录最后移动方向（用于面向）
    if (direction.x !== 0 || direction.y !== 0) {
      this.lastDirection = { ...direction };
    }
  }

  stop(): this {
    this.setVelocity(0, 0);
    return this;
  }

  getLastDirection(): { x: number; y: number } {
    return { ...this.lastDirection };
  }

  getTilePosition(): { x: number; y: number } {
    return {
      x: Math.floor(this.x / TILE_SIZE),
      y: Math.floor(this.y / TILE_SIZE)
    };
  }
}