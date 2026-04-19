// src/ui/TongueUI.ts
/**
 * 舌诊界面组件
 * 功能:
 * - 显示舌象描述（或舌象图片占位）
 * - 玩家选择舌体颜色、舌苔、舌形、润燥
 * - 确认观察结果后进入下一环节
 *
 * Phase 2 S6b 实现
 * Round 4 视觉优化: 3D立体边框(方案B)
 * Phase 2.5 UI统一化: 使用SelectionButtonComponent (Task 11)
 */

import Phaser from 'phaser';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
import tongueDescriptions from '../data/tongue_descriptions.json';
import SelectionButtonComponent, { SelectionButtonContent } from './components/SelectionButtonComponent';

export interface TongueUIConfig {
  correctBodyColor: string;   // 正确舌体颜色
  correctCoating: string;     // 正确舌苔
  correctShape: string;       // 正确舌形
  correctMoisture: string;    // 正确润燥
  onConfirm: (bodyColor: string, coating: string, shape: string, moisture: string) => void;  // 确认回调
}

export class TongueUI extends Phaser.GameObjects.Container {
  // 界面元素
  private backgroundGraphics!: Phaser.GameObjects.Graphics;  // 使用Graphics替代Rectangle
  private titleText!: Phaser.GameObjects.Text;
  private tongueImagePlaceholder!: Phaser.GameObjects.Rectangle;
  private tongueImageText!: Phaser.GameObjects.Text;
  private bodyColorButtons: SelectionButtonComponent[] = [];
  private coatingButtons: SelectionButtonComponent[] = [];
  private shapeButtons: SelectionButtonComponent[] = [];
  private moistureButtons: SelectionButtonComponent[] = [];
  private confirmButton!: Phaser.GameObjects.Text;

  // 状态
  private config: TongueUIConfig;
  private selectedBodyColor: string = '';
  private selectedCoating: string = '';
  private selectedShape: string = '';
  private selectedMoisture: string = '';

  // 3D边框样式配置（方案B）
  private readonly BORDER_COLORS = {
    outerBorder: UI_COLORS.BORDER_OUTER_GREEN,      // 亮绿边框 0x80a040
    panelBg: UI_COLORS.PANEL_3D_BG,                 // 深绿背景 0x1a2e26
    topLight: UI_COLORS.BORDER_TOP_LIGHT,           // 顶部高光 0x90c070
    bottomShadow: UI_COLORS.BORDER_BOTTOM_SHADOW,   // 底部阴影 0x604020
  };

  constructor(scene: Phaser.Scene, x: number, y: number, config: TongueUIConfig) {
    super(scene, x, y);
    this.config = config;

    // 创建主背景 - 使用Graphics绘制3D立体边框（方案B）
    this.backgroundGraphics = scene.add.graphics();
    this.draw3DBorder(this.backgroundGraphics, 0, 0, 720, 480);
    this.add(this.backgroundGraphics);

    // 创建标题
    this.createTitle(scene);

    // 创建舌象图片区域（占位）
    this.createTongueImageArea(scene);

    // 创建舌体颜色选择区域
    this.createBodyColorOptions(scene);

    // 创建舌苔选择区域
    this.createCoatingOptions(scene);

    // 创建舌形选择区域
    this.createShapeOptions(scene);

    // 创建润燥选择区域
    this.createMoistureOptions(scene);

    // 创建确认按钮
    this.createConfirmButton(scene);

    // 设置深度
    this.setDepth(100);
    this.setScrollFactor(0);

    // 添加到场景
    scene.add.existing(this);

    // 创建退出按钮
    const exitButton = this.createExitButton();
    this.add(exitButton);

    // 暴露到全局供测试访问
    this.exposeToGlobal();
  }

  /**
   * 创建标题
   */
  private createTitle(scene: Phaser.Scene): void {
    this.titleText = scene.add.text(0, -250, '舌诊 - 观察舌象', {
      fontSize: '24px',
      color: '#a08060',  // SOFT_BROWN
      fontStyle: 'bold'
    });
    this.titleText.setOrigin(0.5);
    this.add(this.titleText);
  }

  /**
   * 创建舌象图片区域（占位）
   */
  private createTongueImageArea(scene: Phaser.Scene): void {
    // 图片占位区域
    this.tongueImagePlaceholder = scene.add.rectangle(0, -150, 280, 140, UI_COLORS.PANEL_LIGHT, 0.9);
    this.tongueImagePlaceholder.setOrigin(0.5);
    this.add(this.tongueImagePlaceholder);

    // 占位文字（描述舌象）
    const tongueText = this.getTongueDescription();
    this.tongueImageText = scene.add.text(0, -150, tongueText, {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      wordWrap: { width: 280 },
      lineSpacing: 6,
      align: 'center'
    });
    this.tongueImageText.setOrigin(0.5);
    this.add(this.tongueImageText);
  }

  /**
   * 获取舌象描述文本
   */
  private getTongueDescription(): string {
    return `舌象观察:\n舌体: ${this.config.correctBodyColor}\n舌苔: ${this.config.correctCoating}\n舌形: ${this.config.correctShape}\n润燥: ${this.config.correctMoisture}`;
  }

  /**
   * 创建舌体颜色选择区域
   * 使用SelectionButtonComponent (Phase 2.5 Task 11)
   */
  private createBodyColorOptions(scene: Phaser.Scene): void {
    // 标签
    const label = scene.add.text(-350, -40, '舌体颜色:', {
      fontSize: '16px',
      color: '#c0c080'  // SOFT_YELLOW
    });
    this.add(label);

    // 获取选项
    const colors = tongueDescriptions.body_colors;

    // 创建选项（使用SelectionButtonComponent）
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      const buttonX = -320 + i * 90;  // 调整位置
      const buttonY = -10;

      const content: SelectionButtonContent = {
        label: color.name,
        value: color.id
      };

      const button = new SelectionButtonComponent(
        scene,
        content,
        {
          onSelect: (value: string) => this.selectBodyColor(value)
        },
        buttonX,
        buttonY
      );

      this.add(button.container);
      this.bodyColorButtons.push(button);
    }
  }

  /**
   * 创建舌苔选择区域
   * 使用SelectionButtonComponent (Phase 2.5 Task 11)
   */
  private createCoatingOptions(scene: Phaser.Scene): void {
    // 标签
    const label = scene.add.text(-350, 40, '舌苔:', {
      fontSize: '16px',
      color: '#c0c080'  // SOFT_YELLOW
    });
    this.add(label);

    // 获取选项
    const coatings = tongueDescriptions.coatings;

    // 创建选项（使用SelectionButtonComponent）
    for (let i = 0; i < coatings.length; i++) {
      const coating = coatings[i];
      const buttonX = -320 + i * 90;  // 调整位置
      const buttonY = 70;

      const content: SelectionButtonContent = {
        label: coating.name,
        value: coating.id
      };

      const button = new SelectionButtonComponent(
        scene,
        content,
        {
          onSelect: (value: string) => this.selectCoating(value)
        },
        buttonX,
        buttonY
      );

      this.add(button.container);
      this.coatingButtons.push(button);
    }
  }

  /**
   * 创建舌形选择区域
   * 使用SelectionButtonComponent (Phase 2.5 Task 11)
   */
  private createShapeOptions(scene: Phaser.Scene): void {
    // 标签
    const label = scene.add.text(-350, 120, '舌形:', {
      fontSize: '16px',
      color: '#c0c080'  // SOFT_YELLOW
    });
    this.add(label);

    // 获取选项
    const shapes = tongueDescriptions.shapes;

    // 创建选项（使用SelectionButtonComponent）
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      const buttonX = -320 + i * 100;  // 调整位置
      const buttonY = 150;

      const content: SelectionButtonContent = {
        label: shape.name,
        value: shape.id
      };

      const button = new SelectionButtonComponent(
        scene,
        content,
        {
          onSelect: (value: string) => this.selectShape(value)
        },
        buttonX,
        buttonY
      );

      this.add(button.container);
      this.shapeButtons.push(button);
    }
  }

  /**
   * 创建润燥选择区域
   * 使用SelectionButtonComponent (Phase 2.5 Task 11)
   */
  private createMoistureOptions(scene: Phaser.Scene): void {
    // 标签
    const label = scene.add.text(-350, 200, '润燥:', {
      fontSize: '16px',
      color: '#c0c080'  // SOFT_YELLOW
    });
    this.add(label);

    // 获取选项
    const moistures = tongueDescriptions.moistures;

    // 创建选项（使用SelectionButtonComponent）
    for (let i = 0; i < moistures.length; i++) {
      const moisture = moistures[i];
      const buttonX = -320 + i * 100;  // 调整位置
      const buttonY = 230;

      const content: SelectionButtonContent = {
        label: moisture.name,
        value: moisture.id
      };

      const button = new SelectionButtonComponent(
        scene,
        content,
        {
          onSelect: (value: string) => this.selectMoisture(value)
        },
        buttonX,
        buttonY
      );

      this.add(button.container);
      this.moistureButtons.push(button);
    }
  }

  /**
   * 创建确认按钮
   */
  private createConfirmButton(scene: Phaser.Scene): void {
    this.confirmButton = scene.add.text(0, 250, '[确认观察结果]', {
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
      this.confirmButton.setColor('#90c070');  // SOFT_GREEN
    });
    this.confirmButton.on('pointerout', () => {
      this.confirmButton.setColor('#70a0c0');  // SOFT_BLUE
    });

    this.add(this.confirmButton);
  }

  /**
   * 创建退出按钮
   */
  private createExitButton(): Phaser.GameObjects.Text {
    const exitButton = this.scene.add.text(
      340,  // 右上角（考虑UI宽度720）
      -250,  // 与标题同高度
      '[退出诊断]',
      {
        fontSize: '16px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY,
        backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    exitButton.on('pointerover', () => {
      exitButton.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
    });

    exitButton.on('pointerout', () => {
      exitButton.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
    });

    exitButton.on('pointerdown', () => {
      this.handleExit();
    });

    return exitButton;
  }

  /**
   * 绘制3D立体边框（方案B）
   * 外层边框 + 顶部高光 + 底部阴影
   */
  private draw3DBorder(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // 调整坐标以适应Container中心定位（Container以中心为原点）
    const adjustedX = x - width / 2;
    const adjustedY = y - height / 2;

    // 1. 外层边框（亮绿色，4px）
    graphics.lineStyle(4, this.BORDER_COLORS.outerBorder);
    graphics.strokeRect(adjustedX - 4, adjustedY - 4, width + 8, height + 8);

    // 2. 主背景（深绿色，完全不透明）
    graphics.fillStyle(this.BORDER_COLORS.panelBg, 1.0);
    graphics.fillRect(adjustedX, adjustedY, width, height);

    // 3. 顶部/左侧高光边框（亮绿，2px）
    graphics.lineStyle(2, this.BORDER_COLORS.topLight);
    graphics.beginPath();
    graphics.moveTo(adjustedX, adjustedY + height);
    graphics.lineTo(adjustedX, adjustedY);
    graphics.lineTo(adjustedX + width, adjustedY);
    graphics.strokePath();

    // 4. 底部/右侧阴影边框（暗棕，2px）
    graphics.lineStyle(2, this.BORDER_COLORS.bottomShadow);
    graphics.beginPath();
    graphics.moveTo(adjustedX + width, adjustedY);
    graphics.lineTo(adjustedX + width, adjustedY + height);
    graphics.lineTo(adjustedX, adjustedY + height);
    graphics.strokePath();
  }

  /**
   * 处理退出
   */
  private handleExit(): void {
    this.destroy();
    this.scene.scene.stop('TongueScene');
    this.scene.scene.start('ClinicScene');
  }

  /**
   * 选择舌体颜色
   * 使用SelectionButtonComponent管理选中状态 (Phase 2.5 Task 11)
   */
  private selectBodyColor(colorId: string): void {
    this.selectedBodyColor = colorId;
    // 更新按钮选中状态：先取消所有选中，再选中当前
    for (const button of this.bodyColorButtons) {
      if (button.content.value === colorId) {
        button.select();
      } else {
        button.deselect();
      }
    }
    this.exposeToGlobal();
  }

  /**
   * 选择舌苔
   * 使用SelectionButtonComponent管理选中状态 (Phase 2.5 Task 11)
   */
  private selectCoating(coatingId: string): void {
    this.selectedCoating = coatingId;
    // 更新按钮选中状态：先取消所有选中，再选中当前
    for (const button of this.coatingButtons) {
      if (button.content.value === coatingId) {
        button.select();
      } else {
        button.deselect();
      }
    }
    this.exposeToGlobal();
  }

  /**
   * 选择舌形
   * 使用SelectionButtonComponent管理选中状态 (Phase 2.5 Task 11)
   */
  private selectShape(shapeId: string): void {
    this.selectedShape = shapeId;
    // 更新按钮选中状态：先取消所有选中，再选中当前
    for (const button of this.shapeButtons) {
      if (button.content.value === shapeId) {
        button.select();
      } else {
        button.deselect();
      }
    }
    this.exposeToGlobal();
  }

  /**
   * 选择润燥
   * 使用SelectionButtonComponent管理选中状态 (Phase 2.5 Task 11)
   */
  private selectMoisture(moistureId: string): void {
    this.selectedMoisture = moistureId;
    // 更新按钮选中状态：先取消所有选中，再选中当前
    for (const button of this.moistureButtons) {
      if (button.content.value === moistureId) {
        button.select();
      } else {
        button.deselect();
      }
    }
    this.exposeToGlobal();
  }

  /**
   * 处理确认
   */
  private handleConfirm(): void {
    if (this.selectedBodyColor && this.selectedCoating && this.selectedShape && this.selectedMoisture) {
      this.config.onConfirm(this.selectedBodyColor, this.selectedCoating, this.selectedShape, this.selectedMoisture);
    } else {
      this.showSelectionWarning();
    }
  }

  /**
   * 显示未选择提示
   */
  private showSelectionWarning(): void {
    const missing = [];
    if (!this.selectedBodyColor) missing.push('舌体颜色');
    if (!this.selectedCoating) missing.push('舌苔');
    if (!this.selectedShape) missing.push('舌形');
    if (!this.selectedMoisture) missing.push('润燥');

    const warning = this.scene.add.text(0, 230, `请先选择: ${missing.join(', ')}`, {
      fontSize: '14px',
      color: '#c09060'  // SOFT_ORANGE
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
  showResult(correctCount: number, totalCount: number): void {
    const isAllCorrect = correctCount === totalCount;
    const resultText = isAllCorrect ? `舌象判断全部正确! (${correctCount}/${totalCount})` : `舌象判断部分正确 (${correctCount}/${totalCount})`;
    const resultColor = isAllCorrect ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#c0c080';  // SOFT_YELLOW

    const result = this.scene.add.text(0, 270, resultText, {
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
    selectedBodyColor: string;
    selectedCoating: string;
    selectedShape: string;
    selectedMoisture: string;
    isComplete: boolean;
  } {
    return {
      selectedBodyColor: this.selectedBodyColor,
      selectedCoating: this.selectedCoating,
      selectedShape: this.selectedShape,
      selectedMoisture: this.selectedMoisture,
      isComplete: this.selectedBodyColor !== '' && this.selectedCoating !== '' && this.selectedShape !== '' && this.selectedMoisture !== ''
    };
  }

  /**
   * 暴露到全局
   */
  private exposeToGlobal(): void {
    if (typeof window !== 'undefined') {
      (window as any).__TONGUE_UI__ = {
        selectedBodyColor: this.selectedBodyColor,
        selectedCoating: this.selectedCoating,
        selectedShape: this.selectedShape,
        selectedMoisture: this.selectedMoisture,
        isComplete: this.getStatus().isComplete,
        getStatus: () => this.getStatus()
      };
    }
  }

  /**
   * 销毁
   * 使用SelectionButtonComponent (Phase 2.5 Task 11)
   */
  destroy(): void {
    // 销毁SelectionButtonComponent
    for (const button of this.bodyColorButtons) {
      button.destroy();
    }
    for (const button of this.coatingButtons) {
      button.destroy();
    }
    for (const button of this.shapeButtons) {
      button.destroy();
    }
    for (const button of this.moistureButtons) {
      button.destroy();
    }

    this.bodyColorButtons = [];
    this.coatingButtons = [];
    this.shapeButtons = [];
    this.moistureButtons = [];

    if (typeof window !== 'undefined') {
      (window as any).__TONGUE_UI__ = null;
    }

    super.destroy();
  }
}