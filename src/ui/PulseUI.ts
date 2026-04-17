// src/ui/PulseUI.ts
/**
 * 脉诊界面组件
 * 功能:
 * - 显示古文脉象描述（《脉经》原文）
 * - 玩家选择脉位和脉势
 * - 确认判断后进入下一环节
 *
 * Phase 2 S6a 实现
 */

import Phaser from 'phaser';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
import pulseDescriptions from '../data/pulse_descriptions.json';

export interface PulseUIConfig {
  correctPosition: string;    // 正确脉位
  correctTension: string;     // 正确脉势
  pulseDescription: string;   // 脉象古文描述
  onConfirm: (position: string, tension: string) => void;  // 确认回调
}

export class PulseUI extends Phaser.GameObjects.Container {
  // 界面元素
  private background!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private descriptionText!: Phaser.GameObjects.Text;
  private sourceText!: Phaser.GameObjects.Text;
  private positionOptions: Phaser.GameObjects.Text[] = [];
  private tensionOptions: Phaser.GameObjects.Text[] = [];
  private confirmButton!: Phaser.GameObjects.Text;

  // 状态
  private config: PulseUIConfig;
  private selectedPosition: string = '';
  private selectedTension: string = '';

  constructor(scene: Phaser.Scene, x: number, y: number, config: PulseUIConfig) {
    super(scene, x, y);
    this.config = config;

    // 创建主背景
    this.background = scene.add.rectangle(0, 0, 720, 420, UI_COLORS.PANEL_PRIMARY, 0.85);
    this.background.setOrigin(0.5);
    this.add(this.background);

    // 创建标题
    this.createTitle(scene);

    // 创建脉象描述区域
    this.createDescriptionArea(scene);

    // 创建脉位选择区域
    this.createPositionOptions(scene);

    // 创建脉势选择区域
    this.createTensionOptions(scene);

    // 创建确认按钮
    this.createConfirmButton(scene);

    // 设置深度
    this.setDepth(100);
    this.setScrollFactor(0);

    // 添加到场景
    scene.add.existing(this);

    // 暴露到全局供测试访问
    this.exposeToGlobal();
  }

  /**
   * 创建标题
   */
  private createTitle(scene: Phaser.Scene): void {
    this.titleText = scene.add.text(0, -200, '切脉 - 青木先生指导', {
      fontSize: '24px',
      color: '#8B4513',
      fontStyle: 'bold'
    });
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);
  }

  /**
   * 创建脉象描述区域
   */
  private createDescriptionArea(scene: Phaser.Scene): void {
    // 描述背景
    const descBg = scene.add.rectangle(0, -100, 560, 120, UI_COLORS.PANEL_SECONDARY, 0.9);
    descBg.setOrigin(0.5);
    this.add(descBg);

    // 脉象描述文本
    this.descriptionText = scene.add.text(0, -130, this.config.pulseDescription, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'italic',
      wordWrap: { width: 580 },
      lineSpacing: 8
    });
    this.descriptionText.setOrigin(0.5);
    this.add(this.descriptionText);

    // 来源标注
    this.sourceText = scene.add.text(0, -60, '—— 摘自《脉经》', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_DISABLED
    });
    this.sourceText.setOrigin(0.5);
    this.add(this.sourceText);
  }

  /**
   * 创建脉位选择区域
   */
  private createPositionOptions(scene: Phaser.Scene): void {
    // 标签
    const positionLabel = scene.add.text(-280, 20, '脉位选择:', {
      fontSize: '18px',
      color: '#ffaa00'
    });
    this.add(positionLabel);

    // 获取脉位选项
    const positions = pulseDescriptions.pulse_positions;

    // 创建选项
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      const optionX = -280 + i * 150;
      const optionY = 60;

      const option = scene.add.text(optionX, optionY, `○ ${position.name}`, {
        fontSize: '20px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY,
        backgroundColor: UI_COLOR_STRINGS.PANEL_LIGHT,
        padding: { x: 10, y: 5 }
      });
      option.setInteractive({ useHandCursor: true });

      // 点击选择
      option.on('pointerdown', () => {
        this.selectPosition(position.id, option);
      });

      // hover效果
      option.on('pointerover', () => {
        if (this.selectedPosition !== position.id) {
          option.setColor('#88aaff');
        }
      });
      option.on('pointerout', () => {
        if (this.selectedPosition !== position.id) {
          option.setColor('#ffffff');
        }
      });

      this.add(option);
      this.positionOptions.push(option);
    }
  }

  /**
   * 创建脉势选择区域
   */
  private createTensionOptions(scene: Phaser.Scene): void {
    // 标签
    const tensionLabel = scene.add.text(-280, 100, '脉势选择:', {
      fontSize: '18px',
      color: '#ffaa00'
    });
    this.add(tensionLabel);

    // 获取脉势选项
    const tensions = pulseDescriptions.pulse_tensions;

    // 创建选项
    for (let i = 0; i < tensions.length; i++) {
      const tension = tensions[i];
      const optionX = -280 + i * 150;
      const optionY = 140;

      const option = scene.add.text(optionX, optionY, `○ ${tension.name}`, {
        fontSize: '20px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY,
        backgroundColor: UI_COLOR_STRINGS.PANEL_LIGHT,
        padding: { x: 10, y: 5 }
      });
      option.setInteractive({ useHandCursor: true });

      // 点击选择
      option.on('pointerdown', () => {
        this.selectTension(tension.id, option);
      });

      // hover效果
      option.on('pointerover', () => {
        if (this.selectedTension !== tension.id) {
          option.setColor('#88aaff');
        }
      });
      option.on('pointerout', () => {
        if (this.selectedTension !== tension.id) {
          option.setColor('#ffffff');
        }
      });

      this.add(option);
      this.tensionOptions.push(option);
    }
  }

  /**
   * 创建确认按钮
   */
  private createConfirmButton(scene: Phaser.Scene): void {
    this.confirmButton = scene.add.text(0, 200, '[确认判断]', {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.ACCENT_SKY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_SECONDARY,
      padding: { x: 15, y: 8 }
    });
    this.confirmButton.setOrigin(0.5);
    this.confirmButton.setInteractive({ useHandCursor: true });

    // 点击确认
    this.confirmButton.on('pointerdown', () => {
      this.handleConfirm();
    });

    // hover效果
    this.confirmButton.on('pointerover', () => {
      this.confirmButton.setColor('#00ffaa');
    });
    this.confirmButton.on('pointerout', () => {
      this.confirmButton.setColor('#00aaff');
    });

    this.add(this.confirmButton);
  }

  /**
   * 选择脉位
   */
  private selectPosition(positionId: string, option: Phaser.GameObjects.Text): void {
    // 更新选中状态
    this.selectedPosition = positionId;

    // 更新所有选项显示
    for (const opt of this.positionOptions) {
      const text = opt.text;
      if (text.includes('●')) {
        opt.setText(text.replace('●', '○'));
        opt.setColor('#ffffff');
      }
    }

    // 更新当前选中
    option.setText(option.text.replace('○', '●'));
    option.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY);

    this.exposeToGlobal();
  }

  /**
   * 选择脉势
   */
  private selectTension(tensionId: string, option: Phaser.GameObjects.Text): void {
    // 更新选中状态
    this.selectedTension = tensionId;

    // 更新所有选项显示
    for (const opt of this.tensionOptions) {
      const text = opt.text;
      if (text.includes('●')) {
        opt.setText(text.replace('●', '○'));
        opt.setColor('#ffffff');
      }
    }

    // 更新当前选中
    option.setText(option.text.replace('○', '●'));
    option.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY);

    this.exposeToGlobal();
  }

  /**
   * 处理确认
   */
  private handleConfirm(): void {
    if (this.selectedPosition && this.selectedTension) {
      // 调用确认回调
      this.config.onConfirm(this.selectedPosition, this.selectedTension);
    } else {
      // 显示未选择提示
      this.showSelectionWarning();
    }
  }

  /**
   * 显示未选择提示
   */
  private showSelectionWarning(): void {
    const warning = this.scene.add.text(0, 180, '请先选择脉位和脉势', {
      fontSize: '16px',
      color: '#ff6600'
    });
    warning.setOrigin(0.5);
    this.add(warning);

    // 2秒后消失
    this.scene.time.delayedCall(2000, () => {
      warning.destroy();
    });
  }

  /**
   * 显示判断结果
   */
  showResult(isCorrect: boolean): void {
    const resultText = isCorrect ? '脉象判断正确!' : '脉象判断有误';
    const resultColor = isCorrect ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#ff6600';

    const result = this.scene.add.text(0, 220, resultText, {
      fontSize: '18px',
      color: resultColor,
      fontStyle: 'bold'
    });
    result.setOrigin(0.5);
    this.add(result);
  }

  /**
   * 获取当前状态
   */
  getStatus(): {
    selectedPosition: string;
    selectedTension: string;
    isComplete: boolean;
  } {
    return {
      selectedPosition: this.selectedPosition,
      selectedTension: this.selectedTension,
      isComplete: this.selectedPosition !== '' && this.selectedTension !== ''
    };
  }

  /**
   * 暴露到全局（供测试访问）
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__PULSE_UI__ = {
        selectedPosition: this.selectedPosition,
        selectedTension: this.selectedTension,
        isComplete: this.selectedPosition !== '' && this.selectedTension !== '',
        getStatus: () => this.getStatus()
      };
    }
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    this.positionOptions = [];
    this.tensionOptions = [];

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__PULSE_UI__ = null;
    }

    super.destroy();
  }
}