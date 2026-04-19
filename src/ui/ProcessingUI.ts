// src/ui/ProcessingUI.ts
/**
 * 炮制游戏UI组件
 *
 * Phase 2 S10.3 实现
 * Phase 2.5 UI组件系统统一化 Task 15: 使用ItemSlotComponent和SelectionButtonComponent
 *
 * 功能:
 * - 药材选择界面（使用ItemSlotComponent网格布局）
 * - 方法选择界面（使用SelectionButtonComponent，炒/炙/煅/蒸/煮）
 * - 辅料选择界面（使用SelectionButtonComponent）
 * - 预处理界面（简化，使用ItemSlotComponent显示已选择药材/辅料）
 * - 炮制进度界面
 * - 结果评分界面
 */

import Phaser from 'phaser';
import { EventBus, EventData } from '../systems/EventBus';
import {
  ProcessingManager,
  ProcessingEvent
} from '../systems/ProcessingManager';
import {
  getProcessingMethodConfig,
  getAdjuvantConfig,
  getHerbProcessingParams,
  getMethodsByCategory,
  type ProcessingPhase,
  type ProcessingScoreResult,
  type ProcessingMethodCategory,
  type ProcessingMethodType,
  type AdjuvantType,
} from '../data/processing-data';
import { getHerbById } from '../data/inventory-data';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
import ItemSlotComponent, {
  ItemSlotContent,
} from './components/ItemSlotComponent';
import SelectionButtonComponent, {
  SelectionButtonContent,
} from './components/SelectionButtonComponent';

/**
 * UI配置
 */
interface ProcessingUIConfig {
  scene: Phaser.Scene;
  width: number;
  height: number;
}

/**
 * 炮制UI组件
 * Round 4 视觉优化: 3D立体边框(方案B)
 */
export class ProcessingUI {
  private scene: Phaser.Scene;
  private manager: ProcessingManager;
  private eventBus: EventBus;

  private container: Phaser.GameObjects.Container;
  private width: number;
  private height: number;
  private backgroundGraphics: Phaser.GameObjects.Graphics | null = null;

  // UI元素
  private titleText: Phaser.GameObjects.Text | null = null;
  private phaseText: Phaser.GameObjects.Text | null = null;
  private contentContainer: Phaser.GameObjects.Container | null = null;
  private progressFill: Phaser.GameObjects.Rectangle | null = null;
  private timeText: Phaser.GameObjects.Text | null = null;

  // Phase 2.5: 新组件实例
  private herbSlots: ItemSlotComponent[] = [];           // 药材选择格子
  private selectedHerbSlot: ItemSlotComponent | null = null;  // 已选药材格子
  private selectedAdjuvantSlot: ItemSlotComponent | null = null; // 已选辅料格子
  private methodButtons: SelectionButtonComponent[] = [];    // 方法选择按钮
  private adjuvantButtons: SelectionButtonComponent[] = [];  // 辅料选择按钮

  // 样式配置（Round 4 3D边框设计 - 方案B）
  private readonly PROCESSING_UI_COLORS = {
    outerBorder: UI_COLORS.BORDER_OUTER_GREEN,      // 亮绿边框 0x80a040
    panelBg: UI_COLORS.PANEL_3D_BG,                 // 深绿背景 0x1a2e26
    topLight: UI_COLORS.BORDER_TOP_LIGHT,           // 顶部高光 0x90c070
    bottomShadow: UI_COLORS.BORDER_BOTTOM_SHADOW,   // 底部阴影 0x604020
  };

  // 事件监听器引用（用于正确清理）
  private phaseChangedHandler!: (data: EventData) => void;
  private herbSelectedHandler!: (data: EventData) => void;
  private methodSelectedHandler!: (data: EventData) => void;
  private adjuvantSelectedHandler!: (data: EventData) => void;
  private processingTickHandler!: (data: EventData) => void;
  private scoreCalculatedHandler!: (data: EventData) => void;

  constructor(config: ProcessingUIConfig) {
    this.scene = config.scene;
    this.width = config.width;
    this.height = config.height;

    this.manager = ProcessingManager.getInstance();
    this.eventBus = EventBus.getInstance();

    // 创建主容器
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(100);

    // 创建3D立体边框背景（方案B）
    this.backgroundGraphics = this.scene.add.graphics();
    this.draw3DBorder(this.backgroundGraphics, 0, 0, this.width, this.height);
    this.container.add(this.backgroundGraphics);

    // 监听事件
    this.setupEventListeners();

    // 初始显示
    this.showHerbSelection();
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
    // 1. 外层边框（亮绿色，4px）
    graphics.lineStyle(4, this.PROCESSING_UI_COLORS.outerBorder);
    graphics.strokeRect(x, y, width, height);

    // 2. 主背景（深绿色，完全不透明）
    graphics.fillStyle(this.PROCESSING_UI_COLORS.panelBg, 1.0);
    graphics.fillRect(x + 2, y + 2, width - 4, height - 4);

    // 3. 顶部/左侧高光边框（亮绿，2px）
    graphics.lineStyle(2, this.PROCESSING_UI_COLORS.topLight);
    graphics.beginPath();
    graphics.moveTo(x + 2, y + height - 2);
    graphics.lineTo(x + 2, y + 2);
    graphics.lineTo(x + width - 2, y + 2);
    graphics.strokePath();

    // 4. 底部/右侧阴影边框（暗棕，2px）
    graphics.lineStyle(2, this.PROCESSING_UI_COLORS.bottomShadow);
    graphics.beginPath();
    graphics.moveTo(x + width - 2, y + 2);
    graphics.lineTo(x + width - 2, y + height - 2);
    graphics.lineTo(x + 2, y + height - 2);
    graphics.strokePath();
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    this.phaseChangedHandler = (data: EventData) => {
      const newPhase = data.new_phase as ProcessingPhase;
      this.updateUIForPhase(newPhase);
    };
    this.eventBus.on(ProcessingEvent.PHASE_CHANGED, this.phaseChangedHandler);

    this.herbSelectedHandler = (_data: EventData) => {
      // 药材选择后自动进入方法选择（通过PHASE_CHANGED处理）
    };
    this.eventBus.on(ProcessingEvent.HERB_SELECTED, this.herbSelectedHandler);

    this.methodSelectedHandler = (_data: EventData) => {
      // 方法选择后自动进入辅料选择或预处理（通过PHASE_CHANGED处理）
    };
    this.eventBus.on(ProcessingEvent.METHOD_SELECTED, this.methodSelectedHandler);

    this.adjuvantSelectedHandler = (_data: EventData) => {
      // 辅料选择后自动进入预处理（通过PHASE_CHANGED处理）
    };
    this.eventBus.on(ProcessingEvent.ADJUVANT_SELECTED, this.adjuvantSelectedHandler);

    this.processingTickHandler = (data: EventData) => {
      const currentTime = data.current_time as number;
      const targetTime = data.target_time as number;
      const progress = data.progress as number;
      this.updateProcessingProgress(currentTime, targetTime, progress);
    };
    this.eventBus.on(ProcessingEvent.PROCESSING_TICK, this.processingTickHandler);

    this.scoreCalculatedHandler = (data: EventData) => {
      const result = data as unknown as ProcessingScoreResult;
      this.showEvaluation(result);
    };
    this.eventBus.on(ProcessingEvent.SCORE_CALCULATED, this.scoreCalculatedHandler);
  }

  /**
   * 创建退出按钮（右上角）
   */
  private createExitButton(): Phaser.GameObjects.Text {
    const exitButton = this.scene.add.text(
      this.width - 60,
      30,
      '[退出]',
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
   * 处理退出
   */
  private handleExit(): void {
    this.manager.reset();
    this.destroy();
    this.scene.scene.stop('ProcessingScene');
    this.scene.scene.start('ClinicScene');
  }

  /**
   * 清除内容容器
   */
  private clearContent(): void {
    if (this.contentContainer) {
      this.contentContainer.removeAll(true);
      this.contentContainer.destroy();
      this.contentContainer = null;
    }
  }

  /**
   * 清除组件引用（Phase 2.5）
   * 清理ItemSlotComponent和SelectionButtonComponent实例
   */
  private clearComponentReferences(): void {
    // 清理药材选择格子
    this.herbSlots.forEach(slot => slot.destroy());
    this.herbSlots = [];

    // 清理已选药材格子
    if (this.selectedHerbSlot) {
      this.selectedHerbSlot.destroy();
      this.selectedHerbSlot = null;
    }

    // 清理已选辅料格子
    if (this.selectedAdjuvantSlot) {
      this.selectedAdjuvantSlot.destroy();
      this.selectedAdjuvantSlot = null;
    }

    // 清理方法选择按钮
    this.methodButtons.forEach(btn => btn.destroy());
    this.methodButtons = [];

    // 清理辅料选择按钮
    this.adjuvantButtons.forEach(btn => btn.destroy());
    this.adjuvantButtons = [];
  }

  /**
   * 创建文本按钮
   */
  private createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void,
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ): Phaser.GameObjects.Text {
    const defaultStyle = {
      fontSize: '18px',
      color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
      backgroundColor: UI_COLOR_STRINGS.PANEL_PRIMARY,
      padding: { x: 15, y: 8 }
    };

    const button = this.scene.add.text(x, y, text, style || defaultStyle)
      .setOrigin(0.5)
      .setInteractive();

    button.on('pointerover', () => {
      button.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
    });

    button.on('pointerout', () => {
      button.setColor(style?.color || UI_COLOR_STRINGS.BUTTON_SUCCESS);
    });

    button.on('pointerdown', callback);

    return button;
  }

  /**
   * 创建文本对象
   */
  private createText(
    x: number,
    y: number,
    text: string,
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ): Phaser.GameObjects.Text {
    const defaultStyle = {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY
    };

    return this.scene.add.text(x, y, text, style || defaultStyle).setOrigin(0.5);
  }

  /**
   * 显示药材选择界面
   * Phase 2.5: 使用ItemSlotComponent网格布局
   */
  private showHerbSelection(): void {
    this.clearContent();
    this.clearComponentReferences();

    // 标题
    this.titleText = this.createText(this.width / 2, 50, '选择炮制药材', {
      fontSize: '24px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY
    });
    this.container.add(this.titleText);

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 获取可用药材列表
    const availableHerbs = this.manager.getAvailableHerbs();

    if (availableHerbs.length === 0) {
      const hintText = this.createText(this.width / 2, 150, '背包中没有可炮制的药材', {
        fontSize: '18px',
        color: '#f44336'
      });
      this.contentContainer!.add(hintText);
    } else {
      // 提示文字
      const hintText = this.createText(this.width / 2, 100, '请选择要炮制的药材', {
        fontSize: '16px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY
      });
      this.contentContainer!.add(hintText);

      // Phase 2.5: 使用ItemSlotComponent网格布局
      // 每行显示4个药材格子
      const slotSize = ItemSlotComponent.SLOT_SIZE;
      const cols = 4;
      const gridStartX = (this.width - cols * slotSize - (cols - 1) * 20) / 2 + slotSize / 2;
      const gridStartY = 150;
      const spacingX = slotSize + 20;
      const spacingY = slotSize + 40; // 额留空间显示推荐方法提示

      availableHerbs.forEach((herbId, index) => {
        const herb = getHerbById(herbId);
        const params = getHerbProcessingParams(herbId);
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = gridStartX + col * spacingX;
        const y = gridStartY + row * spacingY;

        // 创建ItemSlotComponent
        const slotContent: ItemSlotContent = {
          itemId: herbId,
          name: herb?.name || herbId,
          quantity: 1, // 炮制每次选一个
        };

        const slot = new ItemSlotComponent(this.scene, {
          selectable: true,
          onClick: () => {
            this.manager.selectHerb(herbId);
          },
        }, x, y);

        slot.setContent(slotContent);
        this.herbSlots.push(slot);
        this.contentContainer!.add(slot.container);

        // 推荐方法提示（在格子下方）
        if (params) {
          const methodConfig = getProcessingMethodConfig(params.default_method);
          const methodHint = this.scene.add.text(x, y + slotSize / 2 + 15,
            `推荐: ${methodConfig?.name || params.default_method}`,
            { fontSize: '12px', color: UI_COLOR_STRINGS.STATUS_WARNING }
          ).setOrigin(0.5);
          this.contentContainer!.add(methodHint);
        }
      });
    }

    // 返回按钮
    const backButton = this.createButton(this.width / 2, this.height - 80, '返回', () => {
      this.manager.reset();
      this.destroy();
      this.scene.scene.stop('ProcessingScene');
      this.scene.scene.start('ClinicScene');
    }, {
      fontSize: '18px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
      padding: { x: 20, y: 10 }
    });
    this.contentContainer!.add(backButton);

    // 阶段指示
    this.phaseText = this.createText(this.width / 2, this.height - 50, '阶段: 选择药材', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.STATUS_WARNING
    });
    this.container.add(this.phaseText);
  }

  /**
   * 显示方法选择界面
   * Phase 2.5: 使用SelectionButtonComponent（○→●符号切换）
   */
  private showMethodSelection(): void {
    this.clearContent();
    this.clearComponentReferences();

    const state = this.manager.getState();
    const herb = getHerbById(state.herb_id || '');
    const params = getHerbProcessingParams(state.herb_id || '');

    // 标题
    this.titleText?.setText(`选择炮制方法 - ${herb?.name || ''}`);
    this.container.add(this.titleText!);

    // Phase 2.5: 显示已选药材格子
    if (state.herb_id) {
      const herbSlotX = 100;
      const herbSlotY = 90;
      const herbContent: ItemSlotContent = {
        itemId: state.herb_id,
        name: herb?.name || state.herb_id,
        quantity: 1,
      };
      this.selectedHerbSlot = new ItemSlotComponent(this.scene, {
        selectable: false,
      }, herbSlotX, herbSlotY);
      this.selectedHerbSlot.setContent(herbContent);
      this.container.add(this.selectedHerbSlot.container);
    }

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 提示文字
    const hintText = this.createText(this.width / 2, 100, '选择合适的炮制方法', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY
    });
    this.contentContainer!.add(hintText);

    // Phase 2.5: 方法分类显示，使用SelectionButtonComponent
    const categories: ProcessingMethodCategory[] = ['chao', 'zhi', 'duan', 'zheng', 'zhu'];
    const categoryNames: Record<ProcessingMethodCategory, string> = {
      'chao': '炒法',
      'zhi': '炙法',
      'duan': '煅法',
      'zheng': '蒸法',
      'zhu': '煮法'
    };

    const startY = 150;
    const categorySpacing = 80;
    const buttonWidth = 100;

    categories.forEach((category, catIndex) => {
      const y = startY + catIndex * categorySpacing;

      // 分类标题
      const categoryTitle = this.createText(100, y, categoryNames[category], {
        fontSize: '18px',
        color: UI_COLOR_STRINGS.STATUS_WARNING
      }).setOrigin(0, 0.5);
      this.contentContainer!.add(categoryTitle);

      // Phase 2.5: 该分类下的方法，使用SelectionButtonComponent
      const methods = getMethodsByCategory(category);

      methods.forEach((method, methodIndex) => {
        const x = 200 + methodIndex * (buttonWidth + 15);
        const isRecommended = params?.suitable_methods.includes(method.id);
        const isSelected = state.method === method.id;

        const buttonContent: SelectionButtonContent = {
          label: method.name,
          value: method.id,
        };

        const button = new SelectionButtonComponent(this.scene, buttonContent, {
          selected: isSelected,
          width: buttonWidth,
          onSelect: (value: string) => {
            // 取消其他按钮选中状态
            this.methodButtons.forEach(btn => {
              if (btn.content.value !== value) {
                btn.deselect();
              }
            });
            this.manager.selectMethod(value as ProcessingMethodType);
          },
        }, x, y);

        // 推荐方法使用特殊颜色（通过hover提示）
        if (isRecommended && !isSelected) {
          // 推荐提示：添加小标记
          const recommendMark = this.scene.add.text(x + buttonWidth / 2, y - 20, '★推荐', {
            fontSize: '10px',
            color: UI_COLOR_STRINGS.STATUS_WARNING,
          }).setOrigin(0.5);
          this.contentContainer!.add(recommendMark);
        }

        this.methodButtons.push(button);
        this.contentContainer!.add(button.container);
      });
    });

    // 确认按钮
    const confirmButton = this.createButton(this.width / 2, this.height - 120, '确认方法', () => {
      if (state.method) {
        // 方法选择已在selectMethod中自动进入下一阶段
      }
    }, {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
      backgroundColor: '#1B5E20',
      padding: { x: 30, y: 15 }
    });
    this.contentContainer!.add(confirmButton);

    // 退出按钮
    const exitButton = this.createExitButton();
    this.contentContainer!.add(exitButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 选择方法');
  }

  /**
   * 显示辅料选择界面
   * Phase 2.5: 使用SelectionButtonComponent和ItemSlotComponent
   */
  private showAdjuvantSelection(): void {
    this.clearContent();
    this.clearComponentReferences();

    const state = this.manager.getState();
    const methodConfig = state.method ? getProcessingMethodConfig(state.method) : null;
    const availableAdjuvants = this.manager.getAvailableAdjuvants();

    // 标题
    this.titleText?.setText(`选择辅料 - ${methodConfig?.name || ''}`);
    this.container.add(this.titleText!);

    // Phase 2.5: 显示已选药材格子
    if (state.herb_id) {
      const herb = getHerbById(state.herb_id);
      const herbSlotX = 100;
      const herbSlotY = 90;
      const herbContent: ItemSlotContent = {
        itemId: state.herb_id,
        name: herb?.name || state.herb_id,
        quantity: 1,
      };
      this.selectedHerbSlot = new ItemSlotComponent(this.scene, {
        selectable: false,
      }, herbSlotX, herbSlotY);
      this.selectedHerbSlot.setContent(herbContent);
      this.container.add(this.selectedHerbSlot.container);
    }

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 提示文字
    const hintText = this.createText(this.width / 2, 100, '选择炮制辅料', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY
    });
    this.contentContainer!.add(hintText);

    // Phase 2.5: 辅料列表，使用SelectionButtonComponent
    const startY = 150;
    const spacing = 70;
    const buttonWidth = 200;

    availableAdjuvants.forEach((adjuvantId, index) => {
      const adjuvantConfig = getAdjuvantConfig(adjuvantId);
      const params = getHerbProcessingParams(state.herb_id || '');
      const isRecommended = adjuvantId === params?.default_adjuvant;
      const isSelected = state.adjuvant === adjuvantId;
      const y = startY + index * spacing;

      const buttonContent: SelectionButtonContent = {
        label: adjuvantConfig?.name || adjuvantId,
        value: adjuvantId,
      };

      const button = new SelectionButtonComponent(this.scene, buttonContent, {
        selected: isSelected,
        width: buttonWidth,
        onSelect: (value: string) => {
          // 取消其他按钮选中状态
          this.adjuvantButtons.forEach(btn => {
            if (btn.content.value !== value) {
              btn.deselect();
            }
          });
          this.manager.selectAdjuvant(value as AdjuvantType);
        },
      }, this.width / 2, y);

      // 推荐辅料使用特殊标记
      if (isRecommended && !isSelected) {
        const recommendMark = this.scene.add.text(this.width / 2 + buttonWidth / 2 + 10, y, '★推荐', {
          fontSize: '10px',
          color: UI_COLOR_STRINGS.STATUS_WARNING,
        }).setOrigin(0, 0.5);
        this.contentContainer!.add(recommendMark);
      }

      this.adjuvantButtons.push(button);
      this.contentContainer!.add(button.container);

      // 辅料功效说明
      if (adjuvantConfig) {
        const effectText = this.scene.add.text(this.width / 2, y + 25, adjuvantConfig.effect, {
          fontSize: '14px',
          color: UI_COLOR_STRINGS.TEXT_SECONDARY,
          wordWrap: { width: this.width - 80 }
        }).setOrigin(0.5);
        this.contentContainer!.add(effectText);
      }
    });

    // 退出按钮
    const exitButton = this.createExitButton();
    this.contentContainer!.add(exitButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 选择辅料');
  }

  /**
   * 显示预处理界面（简化）
   * Phase 2.5: 使用ItemSlotComponent显示已选药材和辅料
   */
  private showPreprocess(): void {
    this.clearContent();
    this.clearComponentReferences();

    const state = this.manager.getState();
    const herb = getHerbById(state.herb_id || '');
    const methodConfig = state.method ? getProcessingMethodConfig(state.method) : null;
    const adjuvantConfig = state.adjuvant ? getAdjuvantConfig(state.adjuvant) : null;

    // 标题
    this.titleText?.setText('预处理准备');
    this.container.add(this.titleText!);

    // Phase 2.5: 显示已选药材格子
    if (state.herb_id) {
      const herbSlotX = 200;
      const herbSlotY = 100;
      const herbContent: ItemSlotContent = {
        itemId: state.herb_id,
        name: herb?.name || state.herb_id,
        quantity: 1,
      };
      this.selectedHerbSlot = new ItemSlotComponent(this.scene, {
        selectable: false,
      }, herbSlotX, herbSlotY);
      this.selectedHerbSlot.setContent(herbContent);
      this.container.add(this.selectedHerbSlot.container);

      // 药材名称标签
      const herbLabel = this.scene.add.text(herbSlotX, herbSlotY + 35, '药材', {
        fontSize: '12px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
      }).setOrigin(0.5);
      this.container.add(herbLabel);
    }

    // Phase 2.5: 显示已选辅料格子
    if (state.adjuvant) {
      const adjuvantSlotX = 300;
      const adjuvantSlotY = 100;
      const adjuvantContent: ItemSlotContent = {
        itemId: state.adjuvant,
        name: adjuvantConfig?.name || state.adjuvant,
        quantity: 1,
      };
      this.selectedAdjuvantSlot = new ItemSlotComponent(this.scene, {
        selectable: false,
      }, adjuvantSlotX, adjuvantSlotY);
      this.selectedAdjuvantSlot.setContent(adjuvantContent);
      this.container.add(this.selectedAdjuvantSlot.container);

      // 辅料名称标签
      const adjuvantLabel = this.scene.add.text(adjuvantSlotX, adjuvantSlotY + 35, '辅料', {
        fontSize: '12px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
      }).setOrigin(0.5);
      this.container.add(adjuvantLabel);
    }

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 当前选择摘要（方法信息）
    const summaryText = this.createText(this.width / 2, 160,
      `方法: ${methodConfig?.name || ''}`,
      { fontSize: '18px', color: UI_COLOR_STRINGS.BUTTON_SUCCESS }
    );
    this.contentContainer!.add(summaryText);

    // 预处理说明（简化）
    const hintText = this.createText(this.width / 2, 200,
      '预处理步骤已自动完成（一期简化）',
      { fontSize: '16px', color: UI_COLOR_STRINGS.TEXT_SECONDARY }
    );
    this.contentContainer!.add(hintText);

    // 开始炮制按钮
    const startButton = this.createButton(this.width / 2, this.height - 120, '开始炮制', () => {
      this.manager.startPreprocess();
      this.manager.startProcessing();
    }, {
      fontSize: '20px',
      color: '#ff5722',
      backgroundColor: '#bf360c',
      padding: { x: 30, y: 15 }
    });
    this.contentContainer!.add(startButton);

    // 退出按钮
    const exitButton = this.createExitButton();
    this.contentContainer!.add(exitButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 预处理');
  }

  /**
   * 显示炮制进度界面
   * Phase 2.5: 使用ItemSlotComponent显示已选药材和辅料
   */
  private showProcessingProgress(): void {
    this.clearContent();
    this.clearComponentReferences();

    const state = this.manager.getState();
    const methodConfig = state.method ? getProcessingMethodConfig(state.method) : null;
    const herb = getHerbById(state.herb_id || '');
    const adjuvantConfig = state.adjuvant ? getAdjuvantConfig(state.adjuvant) : null;

    // 标题
    this.titleText?.setText('炮制进行中...');
    this.container.add(this.titleText!);

    // Phase 2.5: 显示已选药材格子
    if (state.herb_id) {
      const herbSlotX = 150;
      const herbSlotY = 80;
      const herbContent: ItemSlotContent = {
        itemId: state.herb_id,
        name: herb?.name || state.herb_id,
        quantity: 1,
      };
      this.selectedHerbSlot = new ItemSlotComponent(this.scene, {
        selectable: false,
      }, herbSlotX, herbSlotY);
      this.selectedHerbSlot.setContent(herbContent);
      this.container.add(this.selectedHerbSlot.container);

      // 药材名称标签
      const herbLabel = this.scene.add.text(herbSlotX, herbSlotY + 35, '药材', {
        fontSize: '12px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
      }).setOrigin(0.5);
      this.container.add(herbLabel);
    }

    // Phase 2.5: 显示已选辅料格子
    if (state.adjuvant) {
      const adjuvantSlotX = 250;
      const adjuvantSlotY = 80;
      const adjuvantContent: ItemSlotContent = {
        itemId: state.adjuvant,
        name: adjuvantConfig?.name || state.adjuvant,
        quantity: 1,
      };
      this.selectedAdjuvantSlot = new ItemSlotComponent(this.scene, {
        selectable: false,
      }, adjuvantSlotX, adjuvantSlotY);
      this.selectedAdjuvantSlot.setContent(adjuvantContent);
      this.container.add(this.selectedAdjuvantSlot.container);

      // 辅料名称标签
      const adjuvantLabel = this.scene.add.text(adjuvantSlotX, adjuvantSlotY + 35, '辅料', {
        fontSize: '12px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
      }).setOrigin(0.5);
      this.container.add(adjuvantLabel);
    }

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 进度条背景
    const progressBg = this.scene.add.rectangle(
      this.width / 2, 200, 400, 30, UI_COLORS.PANEL_LIGHT
    ).setOrigin(0.5);

    // 进度条填充
    this.progressFill = this.scene.add.rectangle(
      this.width / 2 - 200, 200, 0, 26, UI_COLORS.BUTTON_SUCCESS
    ).setOrigin(0, 0.5);
    this.progressFill.setName('progressFill');

    this.contentContainer!.add([progressBg, this.progressFill]);

    // 时间文字
    this.timeText = this.createText(this.width / 2, 250, '0 / 0 秒', {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY
    });
    this.timeText.setName('timeText');
    this.contentContainer!.add(this.timeText);

    // 温度显示
    const tempText = this.createText(this.width / 2, 300,
      `温度: ${state.temperature || methodConfig?.temperature_range || ''}`,
      { fontSize: '18px', color: '#ff5722' }
    );
    this.contentContainer!.add(tempText);

    // 完成按钮
    const completeButton = this.createButton(this.width / 2, this.height - 100, '完成炮制', () => {
      this.manager.stopProcessing();
      // 进入终点判断（简化：直接提交）
      const params = getHerbProcessingParams(state.herb_id || '');
      if (params) {
        this.manager.submitEndpoint(params.quality_check);
      } else {
        this.manager.submitEndpoint(['色泽均匀']);
      }
    }, {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.STATUS_WARNING,
      backgroundColor: '#e65100',
      padding: { x: 30, y: 15 }
    });
    this.contentContainer!.add(completeButton);

    // 退出按钮
    const exitButton = this.createExitButton();
    this.contentContainer!.add(exitButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 炮制进行中');
  }

  /**
   * 更新炮制进度
   */
  private updateProcessingProgress(currentTime: number, targetTime: number, progress: number): void {
    if (!this.contentContainer) return;

    // 更新进度条
    if (this.progressFill) {
      this.progressFill.width = 400 * Math.min(progress, 1);
    }

    // 更新时间文字
    if (this.timeText) {
      this.timeText.setText(`${currentTime} / ${targetTime} 秒`);
    }
  }

  /**
   * 显示评分结果界面
   */
  private showEvaluation(result: ProcessingScoreResult): void {
    this.clearContent();

    // 标题
    this.titleText?.setText(result.passed ? '炮制成功！' : '炮制失败');
    this.container.add(this.titleText!);

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 总分显示
    const scoreText = this.createText(this.width / 2, 100,
      `总分: ${result.total_score}`,
      { fontSize: '32px', color: result.passed ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#f44336' }
    );
    this.contentContainer!.add(scoreText);

    // 各维度分数
    const dimensionY = 150;
    const dimensionSpacing = 40;
    const dimensions = [
      { name: '方法选择', score: result.method_score, weight: 30 },
      { name: '辅料选择', score: result.adjuvant_score, weight: 20 },
      { name: '时间掌握', score: result.time_score, weight: 30 },
      { name: '质量判断', score: result.quality_score, weight: 20 }
    ];

    dimensions.forEach((dim, index) => {
      const y = dimensionY + index * dimensionSpacing;
      const color = dim.score >= dim.weight * 0.8 ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#f44336';

      const dimText = this.createText(this.width / 2, y,
        `${dim.name}: ${dim.score}/${dim.weight}`,
        { fontSize: '18px', color: color }
      );
      this.contentContainer!.add(dimText);
    });

    // 反馈文字
    const feedbackText = this.scene.add.text(this.width / 2, 350,
      result.feedback,
      {
        fontSize: '16px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
        wordWrap: { width: this.width - 60 }
      }
    ).setOrigin(0.5);
    this.contentContainer!.add(feedbackText);

    // 返回按钮
    const backButton = this.createButton(this.width / 2, this.height - 80, '返回', () => {
      this.manager.reset();
      this.destroy();
      this.scene.scene.stop('ProcessingScene');
      this.scene.scene.start('ClinicScene');
    }, {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_PRIMARY,
      padding: { x: 30, y: 15 }
    });
    this.contentContainer!.add(backButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 结果评分');
  }

  /**
   * 根据阶段更新UI
   */
  private updateUIForPhase(phase: ProcessingPhase): void {
    switch (phase) {
      case 'select_herb':
        this.showHerbSelection();
        break;
      case 'select_method':
        this.showMethodSelection();
        break;
      case 'select_adjuvant':
        this.showAdjuvantSelection();
        break;
      case 'preprocess':
        this.showPreprocess();
        break;
      case 'processing':
        this.showProcessingProgress();
        break;
      case 'check_endpoint':
        // 简化：直接进入评分
        break;
      case 'evaluate':
        // 等待SCORE_CALCULATED事件
        break;
    }
  }

  /**
   * 销毁UI
   */
  destroy(): void {
    // 移除事件监听（使用保存的引用正确清理）
    this.eventBus.off(ProcessingEvent.PHASE_CHANGED, this.phaseChangedHandler);
    this.eventBus.off(ProcessingEvent.HERB_SELECTED, this.herbSelectedHandler);
    this.eventBus.off(ProcessingEvent.METHOD_SELECTED, this.methodSelectedHandler);
    this.eventBus.off(ProcessingEvent.ADJUVANT_SELECTED, this.adjuvantSelectedHandler);
    this.eventBus.off(ProcessingEvent.PROCESSING_TICK, this.processingTickHandler);
    this.eventBus.off(ProcessingEvent.SCORE_CALCULATED, this.scoreCalculatedHandler);

    // Phase 2.5: 清理组件引用
    this.clearComponentReferences();

    // 清除内容
    this.clearContent();

    // 销毁背景Graphics
    if (this.backgroundGraphics) {
      this.backgroundGraphics.destroy();
      this.backgroundGraphics = null;
    }

    // 销毁标题和阶段文本
    if (this.titleText) {
      this.titleText.destroy();
      this.titleText = null;
    }
    if (this.phaseText) {
      this.phaseText.destroy();
      this.phaseText = null;
    }

    // 销毁主容器
    this.container.removeAll(true);
    this.container.destroy();

    // 清理引用
    this.progressFill = null;
    this.timeText = null;
  }
}