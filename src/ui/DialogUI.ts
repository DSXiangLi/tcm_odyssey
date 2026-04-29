// src/ui/DialogUI.ts
/**
 * NPC对话界面组件
 * 显示流式对话文字，支持停止生成
 *
 * Phase 2 S3 实现
 * Phase 4 P1-1 视觉优化：方案D悬浮卡片背景
 */

import Phaser from 'phaser';
import { SSEClient, ToolCallCallback } from '../utils/sseClient';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';

/**
 * 创建悬浮卡片背景Graphics对象（方案D）
 *
 * 设计特征:
 * - 底部悬浮阴影: 黑色(0x000000, 0.5) 8px高度
 * - 边缘阴影: 黑色(0x000000, 0.3) 4px偏移
 * - 主背景渐变: 灰蓝(0x406050) → 暗绿(0x304030)
 * - 顶部光带: 金棕(0xc0a080, 0.3) 2px
 * - 顶部高光: 白色(0xffffff, 0.1) 1px
 * - 边框: 2px 金棕(0xc0a080, 0.5)
 *
 * @param scene Phaser场景
 * @param x 绘制起点X（左上角）
 * @param y 绘制起点Y（左上角）
 * @param width 宽度
 * @param height 高度
 * @returns Graphics对象
 */
function createFloatingCardBackground(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();

  // 1. 底部悬浮阴影（模拟卡片悬浮感）
  graphics.fillStyle(0x000000, 0.5);
  graphics.fillRect(x + 4, y + height + 4, width, 8);

  // 2. 边缘阴影（卡片四周的柔和阴影）
  graphics.fillStyle(0x000000, 0.3);
  graphics.fillRect(x + 4, y + 4, width, height);

  // 3. 主背景渐变（灰蓝到暗绿，从上到下）
  graphics.fillGradientStyle(
    0x406050, 1,  // 左上: 灰蓝
    0x406050, 1,  // 右上: 灰蓝
    0x304030, 1,  // 左下: 暗绿
    0x304030, 1   // 右下: 暗绿
  );
  graphics.fillRect(x, y, width, height);

  // 4. 顶部光带（金棕色装饰，2px高度）
  graphics.fillStyle(UI_COLORS.BORDER_GLOW, 0.3);
  graphics.fillRect(x, y, width, 2);

  // 5. 顶部微弱高光（1px白色高光）
  graphics.fillStyle(0xffffff, 0.1);
  graphics.fillRect(x, y, width, 1);

  // 6. 金棕边框（2px）
  graphics.lineStyle(2, UI_COLORS.BORDER_GLOW, 0.5);
  graphics.strokeRect(x, y, width, height);

  return graphics;
}

export interface DialogUIConfig {
  npcId: string;
  npcName: string;
  npcSpriteKey: string;        // Phaser纹理key (renamed from npcAvatarKey)
  playerId: string;
  onToolCall?: ToolCallCallback;  // Tool call callback for NPC tool invocations
  onComplete?: () => void;
}

export class DialogUI extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;  // 方案D: 悬浮卡片背景（Graphics代替Rectangle）
  private avatar: Phaser.GameObjects.Image;
  private nameText: Phaser.GameObjects.Text;
  private contentText: Phaser.GameObjects.Text;
  private stopButton: Phaser.GameObjects.Text;
  private sseClient: SSEClient;
  private config: DialogUIConfig;
  private currentText: string = '';
  private isGenerating: boolean = false;

  // Input dialog members
  private inputContainer: Phaser.GameObjects.DOMElement | null = null;
  private inputElement: HTMLInputElement | null = null;
  private inputVisible: boolean = false;

  // 弹窗尺寸常量
  private readonly dialogWidth = 600;
  private readonly dialogHeight = 200;

  constructor(scene: Phaser.Scene, x: number, y: number, config: DialogUIConfig) {
    super(scene, x, y);
    this.config = config;
    this.sseClient = new SSEClient();

    // 创建背景 - 方案D悬浮卡片（Graphics绘制，起点为左上角）
    this.background = createFloatingCardBackground(
      scene,
      -this.dialogWidth / 2,  // 容器中心(0,0)，绘制起点为左上角
      -this.dialogHeight / 2,
      this.dialogWidth,
      this.dialogHeight
    );
    this.add(this.background);

    // 创建头像占位（使用默认纹理或创建占位图形）
    if (scene.textures.exists(config.npcSpriteKey)) {
      this.avatar = scene.add.image(-250, 0, config.npcSpriteKey);
      this.avatar.setScale(0.5);
    } else {
      // 创建占位头像
      this.avatar = scene.add.image(-250, 0, '__DEFAULT');
      this.avatar.setScale(0.5);
    }
    this.add(this.avatar);

    // 创建名字
    this.nameText = scene.add.text(-100, -80, config.npcName, {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      fontStyle: 'bold'
    });
    this.add(this.nameText);

    // 创建内容文本（文字宽度约束公式：dialogWidth - 40）
    const textMaxWidth = this.dialogWidth - 40;  // 文字宽度约束
    this.contentText = scene.add.text(-100, -50, '', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      wordWrap: { width: textMaxWidth }
    });
    this.add(this.contentText);

    // 创建停止按钮
    this.stopButton = scene.add.text(250, 80, '[停止生成]', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.STATUS_WARNING
    });
    this.stopButton.setInteractive({ useHandCursor: true });
    this.stopButton.on('pointerdown', () => this.stopGeneration());
    this.add(this.stopButton);

    // 设置深度
    this.setDepth(100);

    // 添加到场景
    scene.add.existing(this);

    // 暴露到全局供测试访问
    this.exposeToGlobal();
    // 对话UI激活
    (window as any).__DIALOG_ACTIVE__ = true;

    // 创建输入对话框
    this.createInputDialog();
  }

  /**
   * 暴露到全局（供测试访问）
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__DIALOG_UI__ = {
        npcId: this.config.npcId,
        npcName: this.config.npcName,
        isGenerating: () => this.isGenerating,
        currentText: () => this.currentText,
        visible: this.visible,
        isInputVisible: () => this.inputVisible
      };
    }
  }

  /**
   * 发送消息并获取流式响应
   */
  async sendMessage(message: string): Promise<void> {
    this.isGenerating = true;
    this.currentText = '';
    this.stopButton.setVisible(true);
    this.contentText.setText('');

    // 更新全局状态
    this.exposeToGlobal();

    await this.sseClient.chatStream(
      {
        npc_id: this.config.npcId,
        player_id: this.config.playerId,
        user_message: message
      },
      (chunk) => this.onChunk(chunk),
      (full) => this.onComplete(full),
      (error) => this.onError(error)
    );
  }

  /**
   * 发送消息并获取流式响应（支持Tool Call回调）
   */
  async sendMessageWithTools(message: string): Promise<void> {
    this.isGenerating = true;
    this.currentText = '';
    this.contentText.setText('');
    this.stopButton.setVisible(true);
    this.exposeToGlobal();

    await this.sseClient.chatStream(
      {
        npc_id: this.config.npcId,
        player_id: this.config.playerId,
        user_message: message
      },
      (chunk) => this.onChunk(chunk),
      (full) => this.onComplete(full),
      (error) => this.onError(error),
      this.config.onToolCall  // Pass tool call callback
    );
  }

  /**
   * 创建HTML输入对话框
   */
  private createInputDialog(): void {
    const html = `
      <div style="display: flex; gap: 8px; width: 500px; align-items: center;">
        <input type="text" id="dialog-input"
               style="width: 400px; padding: 10px 12px;
                      border: 2px solid #80a040;
                      background: #222; color: #fff;
                      font-size: 16px; border-radius: 6px;
                      outline: none;"
               placeholder="输入问题...">
        <button id="send-btn"
                style="padding: 10px 20px;
                       background: #80a040; color: #fff;
                       border: none; border-radius: 6px;
                       cursor: pointer; font-size: 16px;">
          发送
        </button>
      </div>
    `;

    this.inputContainer = this.scene.add.dom(
      0,
      this.dialogHeight / 2 + 40,
      'div',
      html
    );
    this.inputContainer.setOrigin(0.5);
    this.inputContainer.setScrollFactor(0);
    this.inputContainer.setDepth(101);

    // Get DOM element references
    this.inputElement = this.inputContainer.node?.querySelector('#dialog-input');
    const sendBtn = this.inputContainer.node?.querySelector('#send-btn');

    // Bind events
    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.handleSend());
    }
    if (this.inputElement) {
      this.inputElement.addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key === 'Enter') this.handleSend();
      });
    }

    // Default hidden
    this.inputContainer.setVisible(false);
    this.add(this.inputContainer);
  }

  /**
   * 显示输入对话框
   */
  showInputDialog(): void {
    this.inputVisible = true;
    if (this.inputContainer) {
      this.inputContainer.setVisible(true);
    }
    if (this.inputElement) {
      this.inputElement.value = '';
      this.inputElement.focus();
    }
  }

  /**
   * 隐藏输入对话框
   */
  hideInputDialog(): void {
    this.inputVisible = false;
    if (this.inputContainer) {
      this.inputContainer.setVisible(false);
    }
    if (this.inputElement) {
      this.inputElement.value = '';
    }
  }

  /**
   * 处理用户发送消息
   */
  private async handleSend(): Promise<void> {
    if (!this.inputElement) return;

    const message = this.inputElement.value.trim();
    if (!message) return;

    this.hideInputDialog();
    this.contentText.setText('正在思考...');
    this.stopButton.setVisible(true);

    try {
      await this.sendMessageWithTools(message);
    } catch (error) {
      this.contentText.setText(`错误: ${(error as Error).message}`);
      this.scene.time.delayedCall(3000, () => this.showInputDialog());
    }
  }

  private onChunk(chunk: string): void {
    this.currentText += chunk;
    this.contentText.setText(this.currentText);
    // 更新全局状态
    this.exposeToGlobal();
  }

  private onComplete(fullResponse: string): void {
    this.isGenerating = false;
    this.stopButton.setVisible(false);
    this.currentText = fullResponse;
    this.exposeToGlobal();

    // Show input dialog after 2 seconds for user to continue conversation
    this.scene.time.delayedCall(2000, () => {
      this.showInputDialog();
    });

    if (this.config.onComplete) {
      this.config.onComplete();
    }
  }

  private onError(error: Error): void {
    this.isGenerating = false;
    this.stopButton.setVisible(false);
    this.contentText.setText(`错误: ${error.message}`);
    this.exposeToGlobal();
  }

  /**
   * 停止生成
   */
  stopGeneration(): void {
    if (this.isGenerating) {
      this.sseClient.stop();
      this.isGenerating = false;
      this.stopButton.setVisible(false);
      this.exposeToGlobal();
    }
  }

  /**
   * 清空对话
   */
  clear(): void {
    this.currentText = '';
    this.contentText.setText('');
    this.exposeToGlobal();
  }

  /**
   * 获取当前状态
   */
  getStatus(): { isGenerating: boolean; currentText: string; npcId: string; npcName: string; isInputVisible: boolean } {
    return {
      isGenerating: this.isGenerating,
      currentText: this.currentText,
      npcId: this.config.npcId,
      npcName: this.config.npcName,
      isInputVisible: this.inputVisible
    };
  }

  /**
   * 检查输入对话框是否可见
   */
  isInputDialogVisible(): boolean {
    return this.inputVisible;
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    this.sseClient.stop();
    // 清理输入对话框
    this.hideInputDialog();
    if (this.inputContainer) {
      this.inputContainer.destroy();
      this.inputContainer = null;
      this.inputElement = null;
    }
    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__DIALOG_UI__ = null;
      (window as any).__DIALOG_ACTIVE__ = false;
    }
    super.destroy();
  }
}