// src/ui/StreamingText.ts
/**
 * 流式文字显示组件
 * 逐字显示文字，带动画效果
 * 参考: hermes-agent agent/display.py KawaiiSpinner
 *
 * Phase 2 S3 实现
 */

import Phaser from 'phaser';

export interface StreamingTextConfig {
  x: number;
  y: number;
  width: number;
  fontSize: string;
  color: string;
  charInterval: number;  // 字符显示间隔(ms)
}

export class StreamingText extends Phaser.GameObjects.Text {
  private targetText: string = '';
  private displayIndex: number = 0;
  private timerEvent: Phaser.Time.TimerEvent | null = null;
  private charInterval: number;
  private onComplete?: () => void;

  constructor(scene: Phaser.Scene, config: StreamingTextConfig) {
    super(scene, config.x, config.y, '', {
      fontSize: config.fontSize,
      color: config.color,
      wordWrap: { width: config.width }
    });
    this.charInterval = config.charInterval;
    scene.add.existing(this);
  }

  /**
   * 开始流式显示
   */
  startStream(text: string, onComplete?: () => void): void {
    this.targetText = text;
    this.displayIndex = 0;
    this.onComplete = onComplete;

    // 清除之前的timer
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    // 创建新的timer
    this.timerEvent = this.scene.time.addEvent({
      delay: this.charInterval,
      callback: this.showNextChar,
      callbackScope: this,
      repeat: text.length - 1
    });
  }

  private showNextChar(): void {
    this.displayIndex++;
    const displayText = this.targetText.substring(0, this.displayIndex);
    this.setText(displayText + '|');  // 添加光标效果

    if (this.displayIndex >= this.targetText.length) {
      // 完成后移除光标
      this.setText(this.targetText);
      if (this.onComplete) {
        this.onComplete();
      }
      this.timerEvent = null;
    }
  }

  /**
   * 停止流式显示，立即显示全部
   */
  stop(): void {
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = null;
    }
    this.setText(this.targetText);
  }

  /**
   * 清空
   */
  clear(): void {
    this.stop();
    this.targetText = '';
    this.setText('');
  }

  /**
   * 是否正在显示
   */
  isStreaming(): boolean {
    return this.timerEvent !== null;
  }

  /**
   * 获取目标文本
   */
  getTargetText(): string {
    return this.targetText;
  }

  /**
   * 获取当前显示进度
   */
  getProgress(): number {
    return this.displayIndex / this.targetText.length;
  }
}