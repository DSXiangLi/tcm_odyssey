// src/entities/Player.ts
import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';

export interface PlayerConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  public speed: number = 150;
  private lastDirection: { x: number; y: number } = { x: 0, y: 1 };
  private eventBus: EventBus;
  private lastPosition: { x: number; y: number };
  private wasMoving: boolean = false;

  constructor(config: PlayerConfig) {
    super(config.scene, config.x, config.y, 'player');

    this.eventBus = EventBus.getInstance();
    this.lastPosition = { x: config.x, y: config.y };

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

    // 发送移动事件
    if (direction.x !== 0 || direction.y !== 0) {
      this.eventBus.emit(GameEvents.PLAYER_MOVE, {
        direction: { ...direction },
        velocity: { x: velocityX, y: velocityY },
        position: { x: this.x, y: this.y }
      });
      this.wasMoving = true;
    }
  }

  stop(): this {
    this.setVelocity(0, 0);

    // 发送停止事件
    if (this.wasMoving) {
      this.eventBus.emit(GameEvents.PLAYER_STOP, {
        position: { x: this.x, y: this.y }
      });
      this.wasMoving = false;
    }

    return this;
  }

  /**
   * 报告碰撞事件
   */
  reportCollision(collisionWith: string): void {
    this.eventBus.emit(GameEvents.PLAYER_COLLIDE, {
      collisionWith,
      position: { x: this.x, y: this.y }
    });
  }

  /**
   * 更新位置追踪（在scene update中调用）
   */
  updatePositionTracking(): void {
    const moved = Math.abs(this.x - this.lastPosition.x) > 1 ||
                  Math.abs(this.y - this.lastPosition.y) > 1;

    if (moved) {
      this.eventBus.emit(GameEvents.PLAYER_POSITION, {
        position: { x: this.x, y: this.y },
        tilePosition: this.getTilePosition()
      });
      this.lastPosition = { x: this.x, y: this.y };
    }
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