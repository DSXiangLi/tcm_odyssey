// src/ui/PrescriptionUI.ts
/**
 * 选方界面组件
 * 功能:
 * - 显示方剂列表（麻黄汤/桂枝汤/银翘散/桑菊饮）
 * - 显示方剂详情（组成、功效）
 * - 方剂加减按钮（未解锁时锁定）
 * - 确认选择后进入评分环节
 *
 * Phase 2 S6d 实现
 */

import Phaser from 'phaser';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
import prescriptionsData from '../data/prescriptions.json';

export interface PrescriptionUIConfig {
  correctPrescription: string;   // 正确方剂
  onConfirm: (prescription: string) => void;  // 确认回调
}

export class PrescriptionUI extends Phaser.GameObjects.Container {
  // 界面元素
  private background!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private prescriptionOptions: Phaser.GameObjects.Text[] = [];
  private detailBox!: Phaser.GameObjects.Rectangle;
  private detailText!: Phaser.GameObjects.Text;
  private adjustmentButton!: Phaser.GameObjects.Text;  // 方剂加减按钮（锁定）
  private confirmButton!: Phaser.GameObjects.Text;

  // 状态
  private config: PrescriptionUIConfig;
  private selectedPrescription: string = '';
  private selectedPrescriptionData: any = null;

  constructor(scene: Phaser.Scene, x: number, y: number, config: PrescriptionUIConfig) {
    super(scene, x, y);
    this.config = config;

    // 创建主背景
    this.background = scene.add.rectangle(0, 0, 720, 480, UI_COLORS.PANEL_PRIMARY, 0.85);
    this.background.setOrigin(0.5);
    this.add(this.background);

    // 创建标题
    this.createTitle(scene);

    // 创建方剂选择区域
    this.createPrescriptionOptions(scene);

    // 创建方剂详情区域
    this.createDetailArea(scene);

    // 创建方剂加减按钮（锁定）
    this.createAdjustmentButton(scene);

    // 创建确认按钮
    this.createConfirmButton(scene);

    // 设置深度
    this.setDepth(100);
    this.setScrollFactor(0);

    // 添加到场景
    scene.add.existing(this);

    // 暴露到全局
    this.exposeToGlobal();
  }

  /**
   * 创建标题
   */
  private createTitle(scene: Phaser.Scene): void {
    this.titleText = scene.add.text(0, -250, '选方 - 选择合适的方剂', {
      fontSize: '24px',
      color: '#8B4513',
      fontStyle: 'bold'
    });
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);
  }

  /**
   * 创建方剂选择区域
   */
  private createPrescriptionOptions(scene: Phaser.Scene): void {
    // 标签
    const label = scene.add.text(-350, -200, '请选择合适的方剂:', {
      fontSize: '18px',
      color: '#ffaa00'
    });
    this.add(label);

    // 获取方剂列表
    const prescriptions = prescriptionsData.prescriptions;

    // 创建方剂选项
    for (let i = 0; i < prescriptions.length; i++) {
      const prescription = prescriptions[i];
      const optionX = -350;
      const optionY = -160 + i * 50;

      const option = scene.add.text(optionX, optionY, `○ ${prescription.name}`, {
        fontSize: '20px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY,
        backgroundColor: UI_COLOR_STRINGS.PANEL_LIGHT,
        padding: { x: 10, y: 5 }
      });
      option.setInteractive({ useHandCursor: true });

      option.on('pointerdown', () => {
        this.selectPrescription(prescription.id, prescription, option);
      });

      option.on('pointerover', () => {
        if (this.selectedPrescription !== prescription.id) {
          option.setColor('#88aaff');
        }
      });
      option.on('pointerout', () => {
        if (this.selectedPrescription !== prescription.id) {
          option.setColor('#ffffff');
        }
      });

      this.add(option);
      this.prescriptionOptions.push(option);

      // 显示方剂简要组成
      const compositionText = prescription.composition.map(c => c.herb).join('、');
      const briefInfo = scene.add.text(150, optionY, `组成: ${compositionText}`, {
        fontSize: '14px',
        color: UI_COLOR_STRINGS.TEXT_DISABLED
      });
      this.add(briefInfo);
    }
  }

  /**
   * 创建方剂详情区域
   */
  private createDetailArea(scene: Phaser.Scene): void {
    // 详情背景
    this.detailBox = scene.add.rectangle(0, 60, 660, 180, UI_COLORS.PANEL_SECONDARY, 0.9);
    this.detailBox.setOrigin(0.5);
    this.add(this.detailBox);

    // 详情标题
    const detailTitle = scene.add.text(0, -30, '方剂详情', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_DISABLED
    });
    detailTitle.setOrigin(0.5);
    this.add(detailTitle);

    // 详情文本
    this.detailText = scene.add.text(-340, -10, '请先选择方剂查看详情', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      wordWrap: { width: 680 },
      lineSpacing: 6
    });
    this.add(this.detailText);
  }

  /**
   * 创建方剂加减按钮（锁定）
   */
  private createAdjustmentButton(scene: Phaser.Scene): void {
    this.adjustmentButton = scene.add.text(0, 170, '[方剂加减] 🔒 未解锁', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_DISABLED,
      backgroundColor: UI_COLOR_STRINGS.PANEL_PRIMARY,
      padding: { x: 10, y: 5 }
    });
    this.adjustmentButton.setOrigin(0.5);
    this.adjustmentButton.setInteractive({ useHandCursor: true });

    this.adjustmentButton.on('pointerdown', () => {
      this.showLockedWarning();
    });

    this.add(this.adjustmentButton);
  }

  /**
   * 创建确认按钮
   */
  private createConfirmButton(scene: Phaser.Scene): void {
    this.confirmButton = scene.add.text(0, 220, '[确认选择]', {
      fontSize: '18px',
      color: UI_COLOR_STRINGS.ACCENT_SKY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_SECONDARY,
      padding: { x: 12, y: 6 }
    });
    this.confirmButton.setOrigin(0.5);
    this.confirmButton.setInteractive({ useHandCursor: true });

    this.confirmButton.on('pointerdown', () => {
      this.handleConfirm();
    });

    this.confirmButton.on('pointerover', () => {
      this.confirmButton.setColor('#00ffaa');
    });
    this.confirmButton.on('pointerout', () => {
      this.confirmButton.setColor('#00aaff');
    });

    this.add(this.confirmButton);
  }

  /**
   * 选择方剂
   */
  private selectPrescription(prescriptionId: string, prescriptionData: any, option: Phaser.GameObjects.Text): void {
    this.selectedPrescription = prescriptionId;
    this.selectedPrescriptionData = prescriptionData;

    // 更新所有选项
    for (const opt of this.prescriptionOptions) {
      const text = opt.text;
      if (text.includes('●')) {
        opt.setText(text.replace('●', '○'));
        opt.setColor('#ffffff');
      }
    }

    // 更新选中
    option.setText(option.text.replace('○', '●'));
    option.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY);

    // 更新详情
    this.updateDetail();

    this.exposeToGlobal();
  }

  /**
   * 更新方剂详情
   */
  private updateDetail(): void {
    if (this.selectedPrescriptionData) {
      const data = this.selectedPrescriptionData;

      // 构建详情文本
      const composition = data.composition.map((c: any) => `${c.herb}(${c.role}): ${c.effect}`).join('\n');
      const detailContent = `
方剂: ${data.name}
类别: ${data.category}
主治证型: ${data.syndrome}

组成配伍:
${composition}

功效: ${data.effect}
主治: ${data.indication}

禁忌: ${data.contraindication}

方歌: ${data.formula_song}
      `.trim();

      this.detailText.setText(detailContent);
    }
  }

  /**
   * 显示锁定提示
   */
  private showLockedWarning(): void {
    const warning = this.scene.add.text(0, 190, '方剂加减功能尚未解锁，需积累经验值', {
      fontSize: '14px',
      color: '#ff6600'
    });
    warning.setOrigin(0.5);
    this.add(warning);

    this.scene.time.delayedCall(2000, () => {
      warning.destroy();
    });
  }

  /**
   * 处理确认
   */
  private handleConfirm(): void {
    if (this.selectedPrescription) {
      const prescriptionName = this.selectedPrescriptionData?.name || this.selectedPrescription;
      this.config.onConfirm(prescriptionName);
    } else {
      this.showWarning('请先选择方剂');
    }
  }

  /**
   * 显示警告
   */
  private showWarning(message: string): void {
    const warning = this.scene.add.text(0, 200, message, {
      fontSize: '14px',
      color: '#ff6600'
    });
    warning.setOrigin(0.5);
    this.add(warning);

    this.scene.time.delayedCall(2000, () => {
      warning.destroy();
    });
  }

  /**
   * 显示结果
   */
  showResult(isCorrect: boolean): void {
    const resultText = isCorrect ? '方剂选择正确!' : '方剂选择有误';
    const resultColor = isCorrect ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#ff6600';

    const result = this.scene.add.text(0, 250, resultText, {
      fontSize: '16px',
      color: resultColor,
      fontStyle: 'bold'
    });
    result.setOrigin(0.5);
    this.add(result);
  }

  /**
   * 获取状态
   */
  getStatus(): {
    selectedPrescription: string;
    selectedPrescriptionName: string;
    isComplete: boolean;
    adjustmentLocked: boolean;
  } {
    return {
      selectedPrescription: this.selectedPrescription,
      selectedPrescriptionName: this.selectedPrescriptionData?.name || '',
      isComplete: this.selectedPrescription !== '',
      adjustmentLocked: true  // 当前始终锁定
    };
  }

  /**
   * 暴露到全局
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__PRESCRIPTION_UI__ = {
        selectedPrescription: this.selectedPrescription,
        selectedPrescriptionName: this.selectedPrescriptionData?.name || '',
        isComplete: this.selectedPrescription !== '',
        adjustmentLocked: true,
        getStatus: () => this.getStatus()
      };
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.prescriptionOptions = [];

    if (typeof window !== 'undefined') {
      (window as any).__PRESCRIPTION_UI__ = null;
    }

    super.destroy();
  }
}