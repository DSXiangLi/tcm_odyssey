// src/entities/Player.ts
import Phaser from 'phaser';
import { TILE_SIZE } from '../data/constants';
import { EventBus, GameEvents } from '../systems/EventBus';
import { BootScene } from '../scenes/BootScene';

export interface PlayerConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  public speed: number = 150;
  private lastDirection: { x: number; y: number } = { x: 0, y: 1 }; // 默认向下
  private eventBus: EventBus;
  private lastPosition: { x: number; y: number };
  private wasMoving: boolean = false;
  private playerScale: number;

  constructor(config: PlayerConfig) {
    // 使用向下方向的第一帧作为初始sprite
    super(config.scene, config.x, config.y, 'player_down', 0);

    this.eventBus = EventBus.getInstance();
    this.lastPosition = { x: config.x, y: config.y };
    this.playerScale = BootScene.getPlayerScale();

    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);

    this.init();
  }

  private init(): void {
    // 设置深度（确保玩家在场景上层）
    this.setDepth(10);

    // 设置碰撞边界
    this.setCollideWorldBounds(true);

    // 先设置缩放
    this.setScale(this.playerScale);

    // 设置碰撞体尺寸（缩放后Phaser会自动调整）
    const body = this.body as Phaser.Physics.Arcade.Body;

    // 碰撞体目标显示尺寸（屏幕上的实际大小）
    const targetDisplayWidth = PLAYER_FRAME_WIDTH * this.playerScale * 0.3;   // 约19像素
    const targetDisplayHeight = PLAYER_FRAME_HEIGHT * this.playerScale * 0.2; // 约13像素

    // setSize参数会被scale缩放，所以传入显示尺寸
    body.setSize(targetDisplayWidth, targetDisplayHeight);

    // offset也需要是显示尺寸
    const spriteDisplayWidth = PLAYER_FRAME_WIDTH * this.playerScale;
    const spriteDisplayHeight = PLAYER_FRAME_HEIGHT * this.playerScale;

    // 碰撞体底部居中
    const offsetDisplayX = (spriteDisplayWidth - targetDisplayWidth) / 2;
    const offsetDisplayY = spriteDisplayHeight - targetDisplayHeight;

    body.setOffset(offsetDisplayX, offsetDisplayY);

    // 初始动画：静止向下
    this.play('player_idle_down');
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

    // 更新动画和方向
    if (direction.x !== 0 || direction.y !== 0) {
      this.lastDirection = { ...direction };
      this.updateWalkAnimation(direction);
      this.wasMoving = true;
    }

    // 发送移动事件
    if (direction.x !== 0 || direction.y !== 0) {
      this.eventBus.emit(GameEvents.PLAYER_MOVE, {
        direction: { ...direction },
        velocity: { x: velocityX, y: velocityY },
        position: { x: this.x, y: this.y }
      });
    }
  }

  stop(): this {
    this.setVelocity(0, 0);

    // 切换到静止动画
    this.updateIdleAnimation();

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
   * 根据方向更新行走动画
   */
  private updateWalkAnimation(direction: { x: number; y: number }): void {
    // 判断主要方向（优先水平方向）
    if (direction.x < 0) {
      this.play('player_walk_left', true);
    } else if (direction.x > 0) {
      this.play('player_walk_right', true);
    } else if (direction.y < 0) {
      this.play('player_walk_up', true);
    } else if (direction.y > 0) {
      this.play('player_walk_down', true);
    }
  }

  /**
   * 根据最后方向更新静止动画
   */
  private updateIdleAnimation(): void {
    if (this.lastDirection.x < 0) {
      this.play('player_idle_left', true);
    } else if (this.lastDirection.x > 0) {
      this.play('player_idle_right', true);
    } else if (this.lastDirection.y < 0) {
      this.play('player_idle_up', true);
    } else {
      this.play('player_idle_down', true);
    }
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

// 帧尺寸常量（与BootScene保持一致）- user2正确配置
const PLAYER_FRAME_WIDTH = 298;
const PLAYER_FRAME_HEIGHT = 298;