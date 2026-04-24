// src/ui/ProcessingUI.ts
/**
 * 炮制游戏UI组件
 *
 * Phase 2 S10.3 实现
 * Phase 2.5 UI组件系统统一化 Task 15: 使用ItemSlotComponent和SelectionButtonComponent
 * Phase 2.5 小游戏改造 Task 6: 统一场景布局（左侧动画区+右侧背包区）
 * Phase 2.5 小游戏改造 Task 3: 右侧背包区容器实现
 *
 * 功能:
 * - 统一场景布局 (800×600 MINIGAME_MODAL)
 * - 左侧动画区 (480×600): 炮制灶台动画 + 当前药材标签 + 药材变换展示
 * - 右侧背包区 (320×600): 待炮制药材列表 + 方法选择 + 辅料选择 + 开始按钮
 * - 成品区域: 底部成品卡片，点击收取进背包
 *
 * 评分维度: 方法40% + 辅料40% + 时间20%
 */

import Phaser from 'phaser';
import { EventBus, EventData } from '../systems/EventBus';
import {
  ProcessingManager,
  ProcessingEvent
} from '../systems/ProcessingManager';
import {
  getProcessingMethodConfig,
  getMethodsByCategory,
  getAdjuvantConfig,
  type ProcessingPhase,
  type ProcessingScoreResult,
  type ProcessingMethodType,
  type AdjuvantType,
  ADJUVANTS,
} from '../data/processing-data';
import { getHerbById } from '../data/inventory-data';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
import ItemSlotComponent from './components/ItemSlotComponent';
import SelectionButtonComponent from './components/SelectionButtonComponent';
import ProgressBarComponent from './components/ProgressBarComponent';
import ModalUI from './base/ModalUI';

/**
 * 布局常量定义
 * MINIGAME_MODAL: 800×600
 */
const LAYOUT = {
  /** 左侧动画区宽度 */
  LEFT_AREA_WIDTH: 480,
  /** 左侧动画区高度 */
  LEFT_AREA_HEIGHT: 600,
  /** 右侧背包区宽度 */
  RIGHT_AREA_WIDTH: 320,
  /** 右侧背包区高度 */
  RIGHT_AREA_HEIGHT: 600,

  /** 炮制灶台动画尺寸 */
  HEARTH_WIDTH: 240,
  HEARTH_HEIGHT: 300,

  /** 当前药材标签尺寸 */
  LABEL_WIDTH: 480,
  LABEL_HEIGHT: 40,

  /** 药材变换展示区尺寸 */
  TRANSFORM_WIDTH: 480,
  TRANSFORM_HEIGHT: 120,

  /** 物品格子尺寸 */
  SLOT_SIZE: 60,

  /** 分割线偏移（左侧区域宽度） */
  DIVIDER_OFFSET: 480,

  /** 成品区域高度 */
  PRODUCT_AREA_HEIGHT: 80,

  // ===== 右侧背包区布局 =====

  /** 药材背包区域高度 */
  HERB_INVENTORY_HEIGHT: 100,

  /** 方法选择区域高度 */
  METHOD_SELECTION_HEIGHT: 180,

  /** 辅料选择区域高度 */
  ADJUVANT_SELECTION_HEIGHT: 120,

  /** 开始按钮区域高度 */
  START_BUTTON_HEIGHT: 60,

  /** 区域间距 */
  AREA_SPACING: 10,

  /** 药材格子内边距 */
  HERB_SLOT_PADDING: 10,

  /** 每行药材格子数量 */
  HERBS_PER_ROW: 5,

  /** 炮制进度时长(秒) */
  PROCESSING_DURATION: 3,

  /** 变换动画时长(毫秒) */
  TRANSFORM_DURATION: 2000,
};

/**
 * 炮制UI组件
 * Phase 2.5: 继承ModalUI基类，使用统一场景布局
 */
export class ProcessingUI extends ModalUI {
  private manager: ProcessingManager;
  private eventBus: EventBus;

  // 左侧动画区元素
  private leftAreaContainer: Phaser.GameObjects.Container | null = null;
  private hearthPlaceholder: Phaser.GameObjects.Graphics | null = null;
  private hearthText: Phaser.GameObjects.Text | null = null;
  private currentHerbLabel: Phaser.GameObjects.Text | null = null;
  private transformContainer: Phaser.GameObjects.Container | null = null;
  private originalHerbSlot: ItemSlotComponent | null = null;
  private transformArrow: Phaser.GameObjects.Text | null = null;
  private transformFlicker: Phaser.GameObjects.Text | null = null;
  private processedHerbSlot: ItemSlotComponent | null = null;

  // 右侧背包区元素
  private rightAreaContainer: Phaser.GameObjects.Container | null = null;
  private herbInventoryContainer: Phaser.GameObjects.Container | null = null;
  private methodSelectionContainer: Phaser.GameObjects.Container | null = null;
  private adjuvantSelectionContainer: Phaser.GameObjects.Container | null = null;
  private herbInventoryTitle: Phaser.GameObjects.Text | null = null;
  private methodTitle: Phaser.GameObjects.Text | null = null;
  private adjuvantTitle: Phaser.GameObjects.Text | null = null;

  // 状态显示元素
  private progressBar: ProgressBarComponent | null = null;
  private productAreaContainer: Phaser.GameObjects.Container | null = null;
  private productCard: Phaser.GameObjects.Container | null = null;
  private productHint: Phaser.GameObjects.Text | null = null;

  // 炮制状态
  private isProcessing: boolean = false;
  private processingComplete: boolean = false;
  private processingTimer: Phaser.Time.TimerEvent | null = null;
  private currentScoreResult: ProcessingScoreResult | null = null;

  // Phase 2.5: 新组件实例
  private herbSlots: ItemSlotComponent[] = [];           // 药材选择格子
  private methodButtons: SelectionButtonComponent[] = [];    // 方法选择按钮
  private adjuvantButtons: SelectionButtonComponent[] = [];  // 辅料选择按钮
  private startButton: Phaser.GameObjects.Text | null = null;

  // 当前选择状态（用于控制开始按钮）
  private selectedHerbId: string | null = null;
  private selectedMethod: ProcessingMethodType | null = null;
  private selectedAdjuvant: AdjuvantType | null = null;

  // 闪烁动画状态
  private flickerTimer: Phaser.Time.TimerEvent | null = null;
  private flickerVisible: boolean = true;

  // 事件监听器引用（用于正确清理）
  private phaseChangedHandler!: (data: EventData) => void;
  private herbSelectedHandler!: (data: EventData) => void;
  private methodSelectedHandler!: (data: EventData) => void;
  private adjuvantSelectedHandler!: (data: EventData) => void;
  private processingTickHandler!: (data: EventData) => void;
  private scoreCalculatedHandler!: (data: EventData) => void;

  constructor(scene: Phaser.Scene) {
    // 调用ModalUI构造函数，使用MINIGAME_MODAL尺寸
    super(
      scene,
      'MINIGAME_MODAL',
      '[退出]',
      () => {
        this.handleExit();
      }
    );

    // 使用基类的尺寸
    // Note: width and height are inherited from BaseUIComponent

    this.manager = ProcessingManager.getInstance();
    this.eventBus = EventBus.getInstance();

    // 创建统一场景布局
    this.createUnifiedLayout();

    // 监听事件
    this.setupEventListeners();

    // 初始显示
    this.updateCurrentHerbLabel();
  }

  /**
   * 创建统一场景布局
   * 左侧动画区 (480×600) + 右侧背包区 (320×600) + 底部成品区
   */
  private createUnifiedLayout(): void {
    // 计算相对位置（相对于容器中心 -400, -300）
    const leftAreaX = -this.width / 2;  // -400 (左边缘)
    const leftAreaY = -this.height / 2; // -300 (顶部边缘)
    // 右侧背包区位置
    const rightAreaX = LAYOUT.DIVIDER_OFFSET - this.width / 2;  // 480 - 400 = 80
    const rightAreaY = -this.height / 2; // -300

    // 创建左侧动画区容器
    this.createLeftAnimationArea(leftAreaX, leftAreaY);

    // 创建分割线
    this.createDivider();

    // 创建右侧背包区容器
    this.createRightBackpackArea(rightAreaX, rightAreaY);

    // 创建底部成品区容器
    this.createProductAreaContainer();
  }

  /**
   * 创建左侧动画区容器 (480×600)
   * 包含: HearthAnimation (240×300) + CurrentHerbLabel (480×40) + HerbTransformationDisplay (480×120)
   */
  private createLeftAnimationArea(x: number, y: number): void {
    // 创建左侧区域容器
    this.leftAreaContainer = this.scene.add.container(x, y);
    this.container.add(this.leftAreaContainer);

    // 1. 创建炮制灶台动画占位符 (240×300)
    this.createHearthPlaceholder(x + LAYOUT.LEFT_AREA_WIDTH / 2 - LAYOUT.HEARTH_WIDTH / 2, y + 20);

    // 2. 创建当前药材标签 (480×40)
    this.createCurrentHerbLabel(x, y + LAYOUT.HEARTH_HEIGHT + 40);

    // 3. 创建药材变换展示区 (480×120)
    this.createHerbTransformationDisplay(x, y + LAYOUT.HEARTH_HEIGHT + LAYOUT.LABEL_HEIGHT + 60);
  }

  /**
   * 创建炮制灶台动画占位符 (240×300)
   * AI生图占位符，大铁锅+炉灶+火焰
   */
  private createHearthPlaceholder(x: number, y: number): void {
    // 创建Graphics占位符
    this.hearthPlaceholder = this.scene.add.graphics();

    // 绘制占位符边框（淡绿色虚线效果）
    this.hearthPlaceholder.lineStyle(2, UI_COLORS.BUTTON_PRIMARY, 0.5);
    this.hearthPlaceholder.strokeRect(x, y, LAYOUT.HEARTH_WIDTH, LAYOUT.HEARTH_HEIGHT);

    // 绘制占位符背景（淡色填充）
    this.hearthPlaceholder.fillStyle(UI_COLORS.PANEL_LIGHT, 0.3);
    this.hearthPlaceholder.fillRect(x, y, LAYOUT.HEARTH_WIDTH, LAYOUT.HEARTH_HEIGHT);

    // 绘制简单的铁锅轮廓（示意）
    const centerX = x + LAYOUT.HEARTH_WIDTH / 2;
    const centerY = y + LAYOUT.HEARTH_HEIGHT / 2;
    const potRadius = 80;

    // 铁锅轮廓
    this.hearthPlaceholder.lineStyle(3, UI_COLORS.SOFT_BROWN, 0.8);
    this.hearthPlaceholder.strokeCircle(centerX, centerY + 20, potRadius);

    // 火焰示意（三角形）
    this.hearthPlaceholder.fillStyle(UI_COLORS.SOFT_RED, 0.6);
    this.hearthPlaceholder.fillTriangle(
      centerX - 30, centerY + 100,
      centerX + 30, centerY + 100,
      centerX, centerY + 60
    );
    this.hearthPlaceholder.fillTriangle(
      centerX - 15, centerY + 80,
      centerX + 15, centerY + 80,
      centerX, centerY + 50
    );

    this.leftAreaContainer!.add(this.hearthPlaceholder);

    // 占位符文字说明
    this.hearthText = this.scene.add.text(
      x + LAYOUT.HEARTH_WIDTH / 2,
      y + 20,
      '[炮制灶台]\n大铁锅+炉灶+火焰\n(AI生图占位符)',
      {
        fontSize: '14px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
        align: 'center',
      }
    ).setOrigin(0.5, 0);
    this.leftAreaContainer!.add(this.hearthText);
  }

  /**
   * 创建当前药材标签 (480×40)
   * 显示: "当前药材: XX"
   */
  private createCurrentHerbLabel(x: number, y: number): void {
    // 创建背景条
    const labelBg = this.scene.add.graphics();
    labelBg.fillStyle(UI_COLORS.PANEL_PRIMARY, 0.8);
    labelBg.fillRect(x, y, LAYOUT.LABEL_WIDTH, LAYOUT.LABEL_HEIGHT);
    this.leftAreaContainer!.add(labelBg);

    // 创建标签文字
    this.currentHerbLabel = this.scene.add.text(
      x + LAYOUT.LABEL_WIDTH / 2,
      y + LAYOUT.LABEL_HEIGHT / 2,
      '当前药材: 未选择',
      {
        fontSize: '18px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      }
    ).setOrigin(0.5);
    this.leftAreaContainer!.add(this.currentHerbLabel);
  }

  /**
   * 创建药材变换展示区 (480×120)
   * 显示: 原始药材(60×60) → 闪烁动效 → 饮片(60×60)
   */
  private createHerbTransformationDisplay(x: number, y: number): void {
    // 创建变换容器
    this.transformContainer = this.scene.add.container(x, y);
    this.leftAreaContainer!.add(this.transformContainer);

    // 创建背景
    const transformBg = this.scene.add.graphics();
    transformBg.fillStyle(UI_COLORS.PANEL_DARK, 0.5);
    transformBg.fillRect(0, 0, LAYOUT.TRANSFORM_WIDTH, LAYOUT.TRANSFORM_HEIGHT);
    this.transformContainer.add(transformBg);

    // 计算三个元素的位置
    const centerY = LAYOUT.TRANSFORM_HEIGHT / 2;
    const spacing = 150;

    // 1. 原始药材格子 (左侧)
    const originalX = 60;
    this.originalHerbSlot = new ItemSlotComponent(this.scene, {
      selectable: false,
    }, originalX, centerY);
    this.originalHerbSlot.setContent({
      itemId: 'placeholder_original',
      name: '原始药材',
    });
    this.transformContainer.add(this.originalHerbSlot.container);

    // 原始药材标签
    const originalLabel = this.scene.add.text(originalX, centerY + 35, '原始药材', {
      fontSize: '12px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY,
    }).setOrigin(0.5);
    this.transformContainer.add(originalLabel);

    // 2. 变换箭头 + 闪烁动效 (中间)
    const arrowX = originalX + spacing;
    this.transformArrow = this.scene.add.text(arrowX, centerY - 20, '──▶', {
      fontSize: '24px',
      color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
    }).setOrigin(0.5);
    this.transformContainer.add(this.transformArrow);

    // 闪烁动效文字（炮制进行中时显示）
    this.transformFlicker = this.scene.add.text(arrowX, centerY + 20, '炮制中...', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.STATUS_WARNING,
    }).setOrigin(0.5);
    this.transformFlicker.setVisible(false); // 默认隐藏
    this.transformContainer.add(this.transformFlicker);

    // 3. 饮片格子 (右侧)
    const processedX = originalX + spacing * 2;
    this.processedHerbSlot = new ItemSlotComponent(this.scene, {
      selectable: false,
    }, processedX, centerY);
    this.processedHerbSlot.setContent({
      itemId: 'placeholder_processed',
      name: '炮制饮片',
    });
    this.transformContainer.add(this.processedHerbSlot.container);

    // 饮片标签
    const processedLabel = this.scene.add.text(processedX, centerY + 35, '炮制饮片', {
      fontSize: '12px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY,
    }).setOrigin(0.5);
    this.transformContainer.add(processedLabel);
  }

  /**
   * 创建分割线
   * 位于左侧480像素处，垂直分割
   */
  private createDivider(): void {
    const dividerX = LAYOUT.DIVIDER_OFFSET - this.width / 2;  // 480 - 400 = 80
    const dividerY = -this.height / 2; // -300

    const divider = this.scene.add.graphics();
    divider.lineStyle(2, UI_COLORS.BORDER_OUTER_GREEN, 0.6);
    divider.beginPath();
    divider.moveTo(dividerX, dividerY);
    divider.lineTo(dividerX, dividerY + this.height);
    divider.strokePath();

    this.container.add(divider);
  }

  /**
   * 创建右侧背包区容器 (320×600)
   * 包含: HerbInventory (320×100) + MethodSelection (320×180) + AdjuvantSelection (320×120) + StartButton (320×60)
   */
  private createRightBackpackArea(x: number, y: number): void {
    // 创建右侧区域容器
    this.rightAreaContainer = this.scene.add.container(x, y);
    this.container.add(this.rightAreaContainer);

    // 当前Y位置（累加区域高度）
    let currentY = 0;

    // 1. 创建药材背包区 (320×100)
    this.createHerbInventoryArea(0, currentY);
    currentY += LAYOUT.HERB_INVENTORY_HEIGHT + LAYOUT.AREA_SPACING;

    // 2. 创建方法选择区 (320×180)
    this.createMethodSelectionArea(0, currentY);
    currentY += LAYOUT.METHOD_SELECTION_HEIGHT + LAYOUT.AREA_SPACING;

    // 3. 创建辅料选择区 (320×120)
    this.createAdjuvantSelectionArea(0, currentY);
    currentY += LAYOUT.ADJUVANT_SELECTION_HEIGHT + LAYOUT.AREA_SPACING;

    // 4. 创建开始按钮区 (320×60)
    this.createStartButtonArea(0, currentY);
  }

  /**
   * 创建药材背包区 (320×100)
   * 待炮制药材网格(使用ItemSlotComponent)
   */
  private createHerbInventoryArea(x: number, y: number): void {
    // 创建区域容器
    this.herbInventoryContainer = this.scene.add.container(x, y);
    this.rightAreaContainer!.add(this.herbInventoryContainer);

    // 创建背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(UI_COLORS.PANEL_PRIMARY, 0.8);
    bg.fillRect(0, 0, LAYOUT.RIGHT_AREA_WIDTH, LAYOUT.HERB_INVENTORY_HEIGHT);
    this.herbInventoryContainer.add(bg);

    // 创建标题
    this.herbInventoryTitle = this.scene.add.text(
      LAYOUT.RIGHT_AREA_WIDTH / 2,
      15,
      '待炮制药材',
      {
        fontSize: '14px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
      }
    ).setOrigin(0.5);
    this.herbInventoryContainer.add(this.herbInventoryTitle);

    // 获取可用药材列表
    const availableHerbs = this.manager.getAvailableHerbs();

    // 创建药材格子网格
    const startX = LAYOUT.HERB_SLOT_PADDING;
    const startY = 35;
    const slotSpacing = LAYOUT.SLOT_SIZE + LAYOUT.HERB_SLOT_PADDING;

    // 每行5个格子，最多显示两行
    const maxSlots = 10;
    const herbsToShow = availableHerbs.slice(0, maxSlots);

    herbsToShow.forEach((herbId, index) => {
      const herb = getHerbById(herbId);
      if (!herb) return;

      const row = Math.floor(index / LAYOUT.HERBS_PER_ROW);
      const col = index % LAYOUT.HERBS_PER_ROW;
      const slotX = startX + col * slotSpacing;
      const slotY = startY + row * slotSpacing;

      const slot = new ItemSlotComponent(this.scene, {
        selectable: true,
        onClick: () => this.handleHerbSelection(herbId),
      }, slotX, slotY);

      slot.setContent({
        itemId: herbId,
        name: herb.name,
      });

      this.herbSlots.push(slot);
      this.herbInventoryContainer!.add(slot.container);
    });
  }

  /**
   * 创建方法选择区 (320×180)
   * 炙类: 蜜炙/酒炙/醋炙/盐炙
   * 炒类: 清炒/麸炒/土炒
   */
  private createMethodSelectionArea(x: number, y: number): void {
    // 创建区域容器
    this.methodSelectionContainer = this.scene.add.container(x, y);
    this.rightAreaContainer!.add(this.methodSelectionContainer);

    // 创建背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(UI_COLORS.PANEL_PRIMARY, 0.8);
    bg.fillRect(0, 0, LAYOUT.RIGHT_AREA_WIDTH, LAYOUT.METHOD_SELECTION_HEIGHT);
    this.methodSelectionContainer.add(bg);

    // 创建标题
    this.methodTitle = this.scene.add.text(
      LAYOUT.RIGHT_AREA_WIDTH / 2,
      10,
      '炮制方法选择',
      {
        fontSize: '14px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
      }
    ).setOrigin(0.5);
    this.methodSelectionContainer.add(this.methodTitle);

    // 炙类方法标签
    const zhiLabel = this.scene.add.text(20, 30, '炙类:', {
      fontSize: '12px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
    });
    this.methodSelectionContainer.add(zhiLabel);

    // 获取炙类方法（zhi category）
    const zhiMethods = getMethodsByCategory('zhi');
    const zhiStartY = 50;
    const buttonSpacing = 28;

    zhiMethods.forEach((method, index) => {
      const button = new SelectionButtonComponent(this.scene, {
        label: method.name,
        value: method.id,
      }, {
        onSelect: (value) => this.handleMethodSelection(value as ProcessingMethodType),
        width: 140,
      }, 30, zhiStartY + index * buttonSpacing);

      this.methodButtons.push(button);
      this.methodSelectionContainer!.add(button.container);
    });

    // 炒类方法标签
    const chaoLabel = this.scene.add.text(160, 30, '炒类:', {
      fontSize: '12px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
    });
    this.methodSelectionContainer.add(chaoLabel);

    // 获取炒类方法（chao category）
    const chaoMethods = getMethodsByCategory('chao');
    const chaoStartY = 50;

    chaoMethods.forEach((method, index) => {
      const button = new SelectionButtonComponent(this.scene, {
        label: method.name,
        value: method.id,
      }, {
        onSelect: (value) => this.handleMethodSelection(value as ProcessingMethodType),
        width: 140,
      }, 170, chaoStartY + index * buttonSpacing);

      this.methodButtons.push(button);
      this.methodSelectionContainer!.add(button.container);
    });
  }

  /**
   * 创建辅料选择区 (320×120)
   * 辅料: 蜂蜜/黄酒/米醋/盐水
   */
  private createAdjuvantSelectionArea(x: number, y: number): void {
    // 创建区域容器
    this.adjuvantSelectionContainer = this.scene.add.container(x, y);
    this.rightAreaContainer!.add(this.adjuvantSelectionContainer);

    // 创建背景
    const bg = this.scene.add.graphics();
    bg.fillStyle(UI_COLORS.PANEL_PRIMARY, 0.8);
    bg.fillRect(0, 0, LAYOUT.RIGHT_AREA_WIDTH, LAYOUT.ADJUVANT_SELECTION_HEIGHT);
    this.adjuvantSelectionContainer.add(bg);

    // 创建标题
    this.adjuvantTitle = this.scene.add.text(
      LAYOUT.RIGHT_AREA_WIDTH / 2,
      10,
      '辅料选择',
      {
        fontSize: '14px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
      }
    ).setOrigin(0.5);
    this.adjuvantSelectionContainer.add(this.adjuvantTitle);

    // 常用辅料列表（蜂蜜/黄酒/米醋/盐水）
    const commonAdjuvants: AdjuvantType[] = ['feng-mi', 'huang-jiu', 'mi-cu', 'yan-shui'];

    const startX = 40;
    const startY = 40;
    const buttonSpacing = 28;

    commonAdjuvants.forEach((adjuvantId, index) => {
      const adjuvant = getAdjuvantConfig(adjuvantId);
      if (!adjuvant) return;

      const row = Math.floor(index / 2);
      const col = index % 2;
      const buttonX = startX + col * 140;
      const buttonY = startY + row * buttonSpacing;

      const button = new SelectionButtonComponent(this.scene, {
        label: adjuvant.name,
        value: adjuvant.id,
      }, {
        onSelect: (value) => this.handleAdjuvantSelection(value as AdjuvantType),
        width: 130,
      }, buttonX, buttonY);

      this.adjuvantButtons.push(button);
      this.adjuvantSelectionContainer!.add(button.container);
    });
  }

  /**
   * 创建开始按钮区 (320×60)
   * "开始炮制"按钮
   */
  private createStartButtonArea(_x: number, y: number): void {
    // 创建开始按钮（初始禁用状态）
    this.startButton = this.scene.add.text(
      LAYOUT.RIGHT_AREA_WIDTH / 2,
      y + LAYOUT.START_BUTTON_HEIGHT / 2,
      '开始炮制',
      {
        fontSize: '18px',
        color: UI_COLOR_STRINGS.TEXT_DISABLED,
        backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
        padding: { x: 20, y: 10 },
      }
    ).setOrigin(0.5);

    // 初始状态：禁用
    this.startButton.setInteractive({ useHandCursor: false });

    this.startButton.on('pointerdown', () => {
      if (this.canStartProcessing()) {
        this.handleStartProcessing();
      }
    });

    this.rightAreaContainer!.add(this.startButton);
  }

  /**
   * 创建底部成品区容器
   * 成品卡片显示区，点击收取进背包
   */
  private createProductAreaContainer(): void {
    // 成品区域位置：相对于容器底部
    const areaY = this.height / 2 - LAYOUT.PRODUCT_AREA_HEIGHT / 2 - 10;

    this.productAreaContainer = this.scene.add.container(0, areaY);
    this.container.add(this.productAreaContainer);

    // 成品提示文字（初始显示）
    this.productHint = this.scene.add.text(0, 0, '成品区域: 炮制完成后点击收取', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY,
    }).setOrigin(0.5);
    this.productAreaContainer.add(this.productHint);

    // 成品卡片容器（初始隐藏）
    this.productCard = this.scene.add.container(0, 0);
    this.productCard.setVisible(false);
    this.productAreaContainer.add(this.productCard);
  }

  /**
   * 处理药材选择
   */
  private handleHerbSelection(herbId: string): void {
    // 如果点击已选中的药材，取消选中
    if (this.selectedHerbId === herbId) {
      this.selectedHerbId = null;
      this.manager.reset();
      this.updateHerbSlotStates();
      this.updateStartButtonState();
      this.updateCurrentHerbLabel();
      return;
    }

    // 选中新药材
    this.selectedHerbId = herbId;
    this.manager.selectHerb(herbId);

    // 更新格子状态
    this.updateHerbSlotStates();

    // 更新开始按钮状态
    this.updateStartButtonState();

    // 更新左侧标签
    this.updateCurrentHerbLabel();
  }

  /**
   * 处理方法选择
   */
  private handleMethodSelection(method: ProcessingMethodType): void {
    // 如果点击已选中的方法，取消选中
    const methodConfig = getProcessingMethodConfig(method);
    if (!methodConfig) return;

    if (this.selectedMethod === method) {
      this.selectedMethod = null;
      // 取消方法选择，同时清除辅料选择
      this.selectedAdjuvant = null;
      this.updateMethodButtonStates();
      this.updateAdjuvantButtonStates();
      this.updateStartButtonState();
      return;
    }

    // 选中新方法（先设置状态，再更新按钮）
    this.selectedMethod = method;
    this.manager.selectMethod(method);

    // 更新按钮状态（会自动取消其他按钮的选中）
    this.updateMethodButtonStates();

    // 根据方法推荐辅料
    this.recommendAdjuvantForMethod(method);

    // 更新开始按钮状态
    this.updateStartButtonState();
  }

  /**
   * 处理辅料选择
   */
  private handleAdjuvantSelection(adjuvant: AdjuvantType): void {
    // 如果点击已选中的辅料，取消选中
    if (this.selectedAdjuvant === adjuvant) {
      this.selectedAdjuvant = null;
      this.updateAdjuvantButtonStates();
      this.updateStartButtonState();
      return;
    }

    // 选中新辅料（先设置状态，再更新按钮）
    this.selectedAdjuvant = adjuvant;
    this.manager.selectAdjuvant(adjuvant);

    // 更新按钮状态（会自动取消其他按钮的选中）
    this.updateAdjuvantButtonStates();

    // 更新开始按钮状态
    this.updateStartButtonState();
  }

  /**
   * 根据方法推荐辅料
   */
  private recommendAdjuvantForMethod(method: ProcessingMethodType): void {
    const methodConfig = getProcessingMethodConfig(method);
    if (!methodConfig || !methodConfig.requires_adjuvant) {
      // 方法不需要辅料，清除辅料选择
      this.selectedAdjuvant = null;
      this.updateAdjuvantButtonStates();
      return;
    }

    // 查找匹配的辅料
    const adjuvantTypes = methodConfig.adjuvant_types;
    if (adjuvantTypes && adjuvantTypes.length > 0) {
      const firstAdjuvantName = adjuvantTypes[0];
      const matchingAdjuvant = ADJUVANTS.find(a => a.name === firstAdjuvantName);
      if (matchingAdjuvant) {
        // 自动选中推荐辅料
        this.selectedAdjuvant = matchingAdjuvant.id;
        this.updateAdjuvantButtonStates();
      }
    }
  }

  /**
   * 检查是否可以开始炮制
   */
  private canStartProcessing(): boolean {
    return this.selectedHerbId !== null &&
           this.selectedMethod !== null &&
           this.selectedAdjuvant !== null;
  }

  /**
   * 处理开始炮制
   * Step 9: 实现完整炮制流程
   */
  private handleStartProcessing(): void {
    if (!this.canStartProcessing()) return;

    // 设置炮制状态
    this.isProcessing = true;
    this.processingComplete = false;

    // 获取炮制方法配置
    const methodConfig = getProcessingMethodConfig(this.selectedMethod!);
    if (!methodConfig) return;

    // Step 7: 开始药材变换闪烁动画
    this.startHerbTransformAnimation();

    // Step 8: 开始灶台动画（火焰动效）
    this.startHearthAnimation();

    // Step 9: 创建进度条并启动计时
    this.createProgressBar(methodConfig);

    // 调用manager开始预处理
    this.manager.startPreprocess();

    // 禁用开始按钮
    if (this.startButton) {
      this.startButton.setText('[炮制中]');
      this.startButton.setColor(UI_COLOR_STRINGS.TEXT_DISABLED);
      this.startButton.disableInteractive();
    }
  }

  /**
   * Step 7: 开始药材变换动画
   * 原始药材 → 闪烁动效 → 饮片
   */
  private startHerbTransformAnimation(): void {
    // 显示变换区域的闪烁效果
    this.startFlickerAnimation();

    // 原始药材格子闪烁效果（通过alpha变化）
    if (this.originalHerbSlot) {
      this.scene.tweens.add({
        targets: this.originalHerbSlot.container,
        alpha: { from: 1, to: 0.5 },
        duration: 300,
        repeat: 3,
        yoyo: true,
        onComplete: () => {
          // 变换完成，恢复原始格子alpha
          this.originalHerbSlot?.container.setAlpha(1);
        }
      });
    }

    // 箭头颜色闪烁
    if (this.transformArrow) {
      this.scene.tweens.add({
        targets: this.transformArrow,
        alpha: { from: 1, to: 0.3 },
        duration: 200,
        repeat: 5,
        yoyo: true,
      });
    }
  }

  /**
   * Step 8: 开始灶台动画
   * 火焰动效增强
   */
  private startHearthAnimation(): void {
    // 更新灶台文字
    if (this.hearthText) {
      this.hearthText.setText('[炮制进行中]\n🔥 火焰燃烧...');
    }

    // 火焰闪烁效果（通过Graphics重绘模拟）
    if (this.hearthPlaceholder) {
      // 添加火焰闪烁tween
      this.scene.tweens.add({
        targets: this.hearthPlaceholder,
        alpha: { from: 1, to: 0.8 },
        duration: 100,
        repeat: -1,
        yoyo: true,
      });
    }
  }

  /**
   * Step 9: 创建进度条
   * 使用ProgressBarComponent显示炮制进度
   */
  private createProgressBar(methodConfig: ReturnType<typeof getProcessingMethodConfig>): void {
    if (!methodConfig) return;

    // 计算目标时间（取时间范围中间值）
    const targetTime = (methodConfig.time_range[0] + methodConfig.time_range[1]) / 2;

    // 进度条位置：在左侧动画区底部（变换展示区上方）
    const progressX = LAYOUT.LEFT_AREA_WIDTH / 2;
    const progressY = LAYOUT.HEARTH_HEIGHT + LAYOUT.LABEL_HEIGHT + 30;

    // 创建进度条组件
    this.progressBar = new ProgressBarComponent(this.scene, {
      width: 400,
      maxValue: targetTime,
      showTime: true,
      onComplete: () => {
        this.handleProcessingComplete();
      },
    }, progressX, progressY);

    // 添加到左侧容器
    this.leftAreaContainer?.add(this.progressBar.container);

    // 启动炮制计时器
    this.startProcessingTimer(targetTime);
  }

  /**
   * 启动炮制计时器
   * 模拟炮制过程，更新进度条
   */
  private startProcessingTimer(targetTime: number): void {
    // 使用简化的时间（测试用，缩短为实际时间的1/10）
    const scaledTargetTime = targetTime / 10;
    let currentTime = 0;

    this.processingTimer = this.scene.time.addEvent({
      delay: 100, // 每100ms更新一次
      repeat: scaledTargetTime * 10, // 总次数
      callback: () => {
        currentTime += 0.1;
        const progress = currentTime / scaledTargetTime;

        // 更新进度条
        if (this.progressBar) {
          this.progressBar.setProgress(currentTime * 10); // 实际时间显示
        }

        // 进度完成
        if (progress >= 1) {
          this.handleProcessingComplete();
        }
      },
    });
  }

  /**
   * Step 10 & 11: 处理炮制完成
   * 显示成品卡片和评分结果
   */
  private handleProcessingComplete(): void {
    // 停止计时器
    if (this.processingTimer) {
      this.processingTimer.destroy();
      this.processingTimer = null;
    }

    // 停止闪烁动画
    this.stopFlickerAnimation();

    // 停止灶台动画
    this.stopHearthAnimation();

    // 更新状态
    this.isProcessing = false;
    this.processingComplete = true;

    // 计算评分
    this.manager.submitEndpoint(['色泽均匀', '炮制完成']);

    // 获取评分结果
    const state = this.manager.getState();
    this.currentScoreResult = state.score ?? null;

    // Step 10: 显示成品卡片
    this.showProductCard();

    // Step 11: 显示评分结果
    if (this.currentScoreResult) {
      this.showScoreResult(this.currentScoreResult);
    }

    // 更新灶台状态
    if (this.hearthText) {
      this.hearthText.setText(this.currentScoreResult?.passed ? '[炮制成功!]' : '[炮制失败]');
    }
  }

  /**
   * 停止灶台动画
   */
  private stopHearthAnimation(): void {
    // 停止火焰闪烁
    if (this.hearthPlaceholder) {
      this.scene.tweens.killTweensOf(this.hearthPlaceholder);
      this.hearthPlaceholder.setAlpha(1);
    }
  }

  /**
   * Step 10: 显示成品卡片
   * 成品卡片可点击收取进背包
   */
  private showProductCard(): void {
    if (!this.productCard) return;

    // 清空旧内容
    this.productCard.removeAll(true);

    // 获取药材信息
    const herb = this.selectedHerbId ? getHerbById(this.selectedHerbId) : null;
    const methodConfig = this.selectedMethod ? getProcessingMethodConfig(this.selectedMethod) : null;

    // 构建成品名称（如"蜜炙甘草"）
    const productName = methodConfig && herb ? `${methodConfig.name}${herb.name}` : '炮制饮片';

    // 创建成品卡片背景
    const cardBg = this.scene.add.graphics();
    const cardWidth = 140;
    const cardHeight = 60;

    // 绘制卡片背景（成功时绿色，失败时红色）
    const bgColor = this.currentScoreResult?.passed ? UI_COLORS.BUTTON_SUCCESS : UI_COLORS.SOFT_RED;
    cardBg.fillStyle(bgColor, 0.9);
    cardBg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 8);

    // 绘制边框
    cardBg.lineStyle(2, UI_COLORS.BORDER_PRIMARY, 1);
    cardBg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 8);

    this.productCard.add(cardBg);

    // 成品名称
    const nameText = this.scene.add.text(0, -10, productName, {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
    }).setOrigin(0.5);
    this.productCard.add(nameText);

    // 收取提示
    const hintText = this.scene.add.text(0, 15, '[点击收取]', {
      fontSize: '12px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY,
    }).setOrigin(0.5);
    this.productCard.add(hintText);

    // 设置卡片可点击
    const hitArea = this.scene.add.rectangle(0, 0, cardWidth, cardHeight, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      cardBg.clear();
      cardBg.fillStyle(bgColor, 1);
      cardBg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 8);
      cardBg.lineStyle(3, UI_COLORS.SOFT_ORANGE, 1);
      cardBg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 8);
    });

    hitArea.on('pointerout', () => {
      cardBg.clear();
      cardBg.fillStyle(bgColor, 0.9);
      cardBg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 8);
      cardBg.lineStyle(2, UI_COLORS.BORDER_PRIMARY, 1);
      cardBg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 8);
    });

    hitArea.on('pointerdown', () => {
      this.collectProduct();
    });

    this.productCard.add(hitArea);

    // 显示成品卡片
    this.productCard.setVisible(true);

    // 隐藏提示文字
    if (this.productHint) {
      this.productHint.setVisible(false);
    }

    // 更新饮片格子显示
    if (this.processedHerbSlot && herb && methodConfig) {
      this.processedHerbSlot.setContent({
        itemId: `${this.selectedHerbId}_${this.selectedMethod}`,
        name: productName,
      });
    }
  }

  /**
   * Step 11: 显示评分结果
   * 评分维度: 方法40% + 辅料40% + 时间20%
   */
  private showScoreResult(result: ProcessingScoreResult): void {
    // 创建评分显示容器（覆盖在右侧背包区）
    const scoreContainer = this.scene.add.container(0, 0);
    this.container.add(scoreContainer);

    // 半透明背景
    const overlayBg = this.scene.add.graphics();
    overlayBg.fillStyle(UI_COLORS.PANEL_DARK, 0.8);
    overlayBg.fillRect(
      LAYOUT.DIVIDER_OFFSET - this.width / 2,
      -this.height / 2,
      LAYOUT.RIGHT_AREA_WIDTH,
      LAYOUT.RIGHT_AREA_HEIGHT
    );
    scoreContainer.add(overlayBg);

    // 标题
    const titleText = this.scene.add.text(
      LAYOUT.DIVIDER_OFFSET - this.width / 2 + LAYOUT.RIGHT_AREA_WIDTH / 2,
      -this.height / 2 + 30,
      result.passed ? '炮制成功!' : '炮制失败',
      {
        fontSize: '24px',
        color: result.passed ? UI_COLOR_STRINGS.BUTTON_SUCCESS : UI_COLOR_STRINGS.SOFT_RED,
      }
    ).setOrigin(0.5);
    scoreContainer.add(titleText);

    // 总分
    const totalScoreText = this.scene.add.text(
      LAYOUT.DIVIDER_OFFSET - this.width / 2 + LAYOUT.RIGHT_AREA_WIDTH / 2,
      -this.height / 2 + 70,
      `总分: ${result.total_score}/100`,
      {
        fontSize: '20px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      }
    ).setOrigin(0.5);
    scoreContainer.add(totalScoreText);

    // 各维度分数（新评分维度：方法40% + 辅料40% + 时间20%）
    const dimensions = [
      { name: '方法选择', score: result.method_score, weight: 40 },
      { name: '辅料选择', score: result.adjuvant_score, weight: 40 },
      { name: '时间掌握', score: result.time_score, weight: 20 },
    ];

    const startY = -this.height / 2 + 110;
    const spacing = 35;

    dimensions.forEach((dim, index) => {
      const y = startY + index * spacing;
      const passed = dim.score >= dim.weight * 0.6;
      const color = passed ? UI_COLOR_STRINGS.BUTTON_SUCCESS : UI_COLOR_STRINGS.SOFT_RED;

      const dimText = this.scene.add.text(
        LAYOUT.DIVIDER_OFFSET - this.width / 2 + LAYOUT.RIGHT_AREA_WIDTH / 2,
        y,
        `${dim.name}: ${dim.score}/${dim.weight}`,
        {
          fontSize: '16px',
          color: color,
        }
      ).setOrigin(0.5);
      scoreContainer.add(dimText);
    });

    // 反馈文字
    const feedbackText = this.scene.add.text(
      LAYOUT.DIVIDER_OFFSET - this.width / 2 + LAYOUT.RIGHT_AREA_WIDTH / 2,
      startY + 3 * spacing + 20,
      result.feedback,
      {
        fontSize: '14px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
        wordWrap: { width: LAYOUT.RIGHT_AREA_WIDTH - 40 },
      }
    ).setOrigin(0.5);
    scoreContainer.add(feedbackText);

    // 返回按钮
    const backButton = this.scene.add.text(
      LAYOUT.DIVIDER_OFFSET - this.width / 2 + LAYOUT.RIGHT_AREA_WIDTH / 2,
      this.height / 2 - 60,
      '[返回药园]',
      {
        fontSize: '18px',
        color: UI_COLOR_STRINGS.BUTTON_SECONDARY,
        backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
        padding: { x: 20, y: 10 },
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backButton.on('pointerover', () => backButton.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER));
    backButton.on('pointerout', () => backButton.setColor(UI_COLOR_STRINGS.BUTTON_SECONDARY));
    backButton.on('pointerdown', () => {
      scoreContainer.destroy();
      this.handleExit();
    });

    scoreContainer.add(backButton);

    // 保存引用以便清理
    scoreContainer.setName('scoreContainer');
  }

  /**
   * 收取成品进背包
   */
  private collectProduct(): void {
    // 隐藏成品卡片
    if (this.productCard) {
      this.productCard.setVisible(false);
    }

    // 显示收取成功提示
    if (this.productHint) {
      this.productHint.setText('已收取进背包!');
      this.productHint.setColor(UI_COLOR_STRINGS.BUTTON_SUCCESS);
      this.productHint.setVisible(true);
    }

    // 清除评分显示
    const scoreContainer = this.container.getByName('scoreContainer') as Phaser.GameObjects.Container;
    if (scoreContainer) {
      scoreContainer.destroy();
    }

    // 延迟返回
    this.scene.time.delayedCall(1000, () => {
      this.handleExit();
    });
  }

  /**
   * 更新药材格子状态
   */
  private updateHerbSlotStates(): void {
    this.herbSlots.forEach(slot => {
      if (slot.content?.itemId === this.selectedHerbId) {
        slot.select();
      } else {
        slot.deselect();
      }
    });
  }

  /**
   * 更新方法按钮状态
   */
  private updateMethodButtonStates(): void {
    this.methodButtons.forEach(btn => {
      if (btn.content.value === this.selectedMethod) {
        btn.select(true);  // silent=true，不触发回调，避免无限循环
      } else {
        btn.deselect();
      }
    });
  }

  /**
   * 更新辅料按钮状态
   */
  private updateAdjuvantButtonStates(): void {
    this.adjuvantButtons.forEach(btn => {
      if (btn.content.value === this.selectedAdjuvant) {
        btn.select(true);  // silent=true，不触发回调，避免无限循环
      } else {
        btn.deselect();
      }
    });
  }

  /**
   * 更新开始按钮状态
   */
  private updateStartButtonState(): void {
    if (!this.startButton) return;

    if (this.canStartProcessing()) {
      // 可用状态：绿色背景
      this.startButton.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
      this.startButton.setBackgroundColor(UI_COLOR_STRINGS.BUTTON_SUCCESS);
      this.startButton.setInteractive({ useHandCursor: true });
    } else {
      // 禁用状态：灰色背景
      this.startButton.setColor(UI_COLOR_STRINGS.TEXT_DISABLED);
      this.startButton.setBackgroundColor(UI_COLOR_STRINGS.PANEL_DARK);
      this.startButton.setInteractive({ useHandCursor: false });
    }
  }

  /**
   * 更新当前药材标签
   */
  private updateCurrentHerbLabel(): void {
    const state = this.manager.getState();
    const herb = state.herb_id ? getHerbById(state.herb_id) : null;

    if (this.currentHerbLabel) {
      if (herb) {
        this.currentHerbLabel.setText(`当前药材: ${herb.name}`);
        this.currentHerbLabel.setColor(UI_COLOR_STRINGS.BUTTON_SUCCESS);
      } else {
        this.currentHerbLabel.setText('当前药材: 未选择');
        this.currentHerbLabel.setColor(UI_COLOR_STRINGS.TEXT_PRIMARY);
      }
    }

    // 更新变换展示区
    this.updateHerbTransformationDisplay();
  }

  /**
   * 更新药材变换展示
   */
  private updateHerbTransformationDisplay(): void {
    const state = this.manager.getState();
    const herb = state.herb_id ? getHerbById(state.herb_id) : null;

    if (this.originalHerbSlot && herb) {
      this.originalHerbSlot.setContent({
        itemId: state.herb_id!,
        name: herb.name,
      });
    }

    // 炮制完成后更新饮片格子（显示炮制后的药材名）
    if (this.processedHerbSlot && herb && state.method) {
      const methodConfig = getProcessingMethodConfig(state.method);
      const processedName = `${methodConfig?.name || ''}${herb.name}`;
      this.processedHerbSlot.setContent({
        itemId: `${state.herb_id}_${state.method}`,
        name: processedName,
      });
    }
  }

  /**
   * 开始闪烁动画
   */
  private startFlickerAnimation(): void {
    if (this.flickerTimer) {
      this.flickerTimer.destroy();
    }

    this.transformFlicker?.setVisible(true);
    this.flickerVisible = true;

    this.flickerTimer = this.scene.time.addEvent({
      delay: 500,
      callback: () => {
        this.flickerVisible = !this.flickerVisible;
        this.transformFlicker?.setVisible(this.flickerVisible);
        this.transformArrow?.setAlpha(this.flickerVisible ? 1 : 0.5);
      },
      loop: true,
    });
  }

  /**
   * 停止闪烁动画
   */
  private stopFlickerAnimation(): void {
    if (this.flickerTimer) {
      this.flickerTimer.destroy();
      this.flickerTimer = null;
    }
    this.transformFlicker?.setVisible(false);
    this.transformArrow?.setAlpha(1);
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
      this.updateCurrentHerbLabel();
    };
    this.eventBus.on(ProcessingEvent.HERB_SELECTED, this.herbSelectedHandler);

    this.methodSelectedHandler = (_data: EventData) => {
      this.updateHerbTransformationDisplay();
    };
    this.eventBus.on(ProcessingEvent.METHOD_SELECTED, this.methodSelectedHandler);

    this.adjuvantSelectedHandler = (_data: EventData) => {
      // 辅料选择后更新
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
   * 处理退出
   */
  private handleExit(): void {
    this.stopFlickerAnimation();
    this.manager.reset();
    this.destroy();
    this.scene.scene.stop('ProcessingScene');
    this.scene.scene.start('GardenScene');
  }

  /**
   * 清除组件引用
   */
  private clearComponentReferences(): void {
    // 清理药材选择格子
    this.herbSlots.forEach(slot => slot.destroy());
    this.herbSlots = [];

    // 清理方法选择按钮
    this.methodButtons.forEach(btn => btn.destroy());
    this.methodButtons = [];

    // 清理辅料选择按钮
    this.adjuvantButtons.forEach(btn => btn.destroy());
    this.adjuvantButtons = [];

    // 清理进度条
    if (this.progressBar) {
      this.progressBar.destroy();
      this.progressBar = null;
    }

    // 清理开始按钮
    if (this.startButton) {
      this.startButton.destroy();
      this.startButton = null;
    }

    // 清理右侧区域子容器
    if (this.herbInventoryContainer) {
      this.herbInventoryContainer.destroy();
      this.herbInventoryContainer = null;
    }
    if (this.methodSelectionContainer) {
      this.methodSelectionContainer.destroy();
      this.methodSelectionContainer = null;
    }
    if (this.adjuvantSelectionContainer) {
      this.adjuvantSelectionContainer.destroy();
      this.adjuvantSelectionContainer = null;
    }

    // 清理标题文本
    if (this.herbInventoryTitle) {
      this.herbInventoryTitle.destroy();
      this.herbInventoryTitle = null;
    }
    if (this.methodTitle) {
      this.methodTitle.destroy();
      this.methodTitle = null;
    }
    if (this.adjuvantTitle) {
      this.adjuvantTitle.destroy();
      this.adjuvantTitle = null;
    }

    // 重置选择状态
    this.selectedHerbId = null;
    this.selectedMethod = null;
    this.selectedAdjuvant = null;
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
   * 根据阶段更新UI
   * Phase 2.5: 统一场景布局，左侧动画区随状态变化
   */
  private updateUIForPhase(phase: ProcessingPhase): void {
    switch (phase) {
      case 'select_herb':
        // 右侧显示药材选择（Task 3实现）
        this.updateCurrentHerbLabel();
        break;
      case 'select_method':
        // 右侧显示方法选择（Task 4实现）
        break;
      case 'select_adjuvant':
        // 右侧显示辅料选择（Task 5实现）
        break;
      case 'preprocess':
        // 显示预处理准备
        break;
      case 'processing':
        // 开始炮制动画
        this.startFlickerAnimation();
        this.updateHerbTransformationDisplay();
        break;
      case 'check_endpoint':
        // 检查终点
        break;
      case 'evaluate':
        // 显示评分结果
        this.stopFlickerAnimation();
        break;
    }
  }

  /**
   * 更新炮制进度
   */
  private updateProcessingProgress(_currentTime: number, targetTime: number, progress: number): void {
    // 更新进度条（如果存在）
    // currentTime will be used in future tasks for time display
    if (this.progressBar) {
      this.progressBar.setProgress(progress * targetTime);
    }
  }

  /**
   * 显示评分结果界面
   */
  private showEvaluation(result: ProcessingScoreResult): void {
    this.stopFlickerAnimation();

    // 清除右侧区域内容
    this.clearComponentReferences();

    // 创建评分显示（覆盖在左侧动画区上方）
    const evalContainer = this.scene.add.container(0, 0);
    this.container.add(evalContainer);

    // 评分背景
    const evalBg = this.scene.add.graphics();
    evalBg.fillStyle(UI_COLORS.PANEL_DARK, 0.9);
    evalBg.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    evalContainer.add(evalBg);

    // 标题
    const titleText = this.createText(0, -200, result.passed ? '炮制成功！' : '炮制失败', {
      fontSize: '32px',
      color: result.passed ? UI_COLOR_STRINGS.BUTTON_SUCCESS : UI_COLOR_STRINGS.STATUS_ERROR,
    });
    evalContainer.add(titleText);

    // 总分显示
    const scoreText = this.createText(0, -150, `总分: ${result.total_score}`, {
      fontSize: '24px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
    });
    evalContainer.add(scoreText);

    // 各维度分数（新评分维度：方法40% + 辅料40% + 时间20%）
    const dimensionY = -80;
    const dimensionSpacing = 50;
    const dimensions = [
      { name: '方法选择', score: result.method_score, weight: 40 },
      { name: '辅料选择', score: result.adjuvant_score, weight: 40 },
      { name: '时间掌握', score: result.time_score, weight: 20 },
    ];

    dimensions.forEach((dim, index) => {
      const y = dimensionY + index * dimensionSpacing;
      const passed = dim.score >= dim.weight * 0.6;
      const color = passed ? UI_COLOR_STRINGS.BUTTON_SUCCESS : UI_COLOR_STRINGS.STATUS_ERROR;

      const dimText = this.createText(0, y, `${dim.name}: ${dim.score}/${dim.weight}`, {
        fontSize: '18px',
        color: color,
      });
      evalContainer.add(dimText);
    });

    // 反馈文字
    const feedbackText = this.scene.add.text(0, 100, result.feedback, {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY,
      wordWrap: { width: this.width - 100 },
    }).setOrigin(0.5);
    evalContainer.add(feedbackText);

    // 返回按钮
    const backButton = this.createButton(0, this.height / 2 - 80, '返回药园', () => {
      this.manager.reset();
      this.destroy();
      this.scene.scene.stop('ProcessingScene');
      this.scene.scene.start('GardenScene');
    }, {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.BUTTON_SECONDARY,
      padding: { x: 30, y: 15 }
    });
    evalContainer.add(backButton);
  }

  /**
   * 销毁UI
   */
  destroy(): void {
    // 停止闪烁动画
    this.stopFlickerAnimation();

    // 停止灶台动画
    this.stopHearthAnimation();

    // 停止炮制计时器
    if (this.processingTimer) {
      this.processingTimer.destroy();
      this.processingTimer = null;
    }

    // 移除事件监听
    this.eventBus.off(ProcessingEvent.PHASE_CHANGED, this.phaseChangedHandler);
    this.eventBus.off(ProcessingEvent.HERB_SELECTED, this.herbSelectedHandler);
    this.eventBus.off(ProcessingEvent.METHOD_SELECTED, this.methodSelectedHandler);
    this.eventBus.off(ProcessingEvent.ADJUVANT_SELECTED, this.adjuvantSelectedHandler);
    this.eventBus.off(ProcessingEvent.PROCESSING_TICK, this.processingTickHandler);
    this.eventBus.off(ProcessingEvent.SCORE_CALCULATED, this.scoreCalculatedHandler);

    // 清理组件引用
    this.clearComponentReferences();

    // 清理进度条
    if (this.progressBar) {
      this.progressBar.destroy();
      this.progressBar = null;
    }

    // 清理成品区域
    if (this.productCard) {
      this.productCard.destroy();
      this.productCard = null;
    }
    if (this.productHint) {
      this.productHint.destroy();
      this.productHint = null;
    }
    if (this.productAreaContainer) {
      this.productAreaContainer.destroy();
      this.productAreaContainer = null;
    }

    // 清理评分显示容器
    const scoreContainer = this.container?.getByName('scoreContainer') as Phaser.GameObjects.Container;
    if (scoreContainer) {
      scoreContainer.destroy();
    }

    // 清理左侧动画区元素
    if (this.hearthPlaceholder) {
      this.hearthPlaceholder.destroy();
      this.hearthPlaceholder = null;
    }
    if (this.hearthText) {
      this.hearthText.destroy();
      this.hearthText = null;
    }
    if (this.currentHerbLabel) {
      this.currentHerbLabel.destroy();
      this.currentHerbLabel = null;
    }
    if (this.originalHerbSlot) {
      this.originalHerbSlot.destroy();
      this.originalHerbSlot = null;
    }
    if (this.processedHerbSlot) {
      this.processedHerbSlot.destroy();
      this.processedHerbSlot = null;
    }
    if (this.transformArrow) {
      this.transformArrow.destroy();
      this.transformArrow = null;
    }
    if (this.transformFlicker) {
      this.transformFlicker.destroy();
      this.transformFlicker = null;
    }
    if (this.transformContainer) {
      this.transformContainer.destroy();
      this.transformContainer = null;
    }
    if (this.leftAreaContainer) {
      this.leftAreaContainer.destroy();
      this.leftAreaContainer = null;
    }
    if (this.rightAreaContainer) {
      this.rightAreaContainer.destroy();
      this.rightAreaContainer = null;
    }

    // 重置状态
    this.isProcessing = false;
    this.processingComplete = false;
    this.currentScoreResult = null;

    // 调用父类销毁方法
    super.destroy();
  }

  /**
   * 暴露到全局（供测试访问）
   */
  public exposeToGlobalForTest(): void {
    this.exposeToGlobal('__PROCESSING_UI__');
  }

  // ===== 测试辅助方法 =====

  /**
   * 获取左侧动画区容器（测试用）
   */
  public getLeftAreaContainer(): Phaser.GameObjects.Container | null {
    return this.leftAreaContainer;
  }

  /**
   * 获取当前药材标签（测试用）
   */
  public getCurrentHerbLabel(): Phaser.GameObjects.Text | null {
    return this.currentHerbLabel;
  }

  /**
   * 获取炮制灶台占位符（测试用）
   */
  public getHearthPlaceholder(): Phaser.GameObjects.Graphics | null {
    return this.hearthPlaceholder;
  }

  /**
   * 获取变换展示容器（测试用）
   */
  public getTransformContainer(): Phaser.GameObjects.Container | null {
    return this.transformContainer;
  }

  /**
   * 获取原始药材格子（测试用）
   */
  public getOriginalHerbSlot(): ItemSlotComponent | null {
    return this.originalHerbSlot;
  }

  /**
   * 获取炮制饮片格子（测试用）
   */
  public getProcessedHerbSlot(): ItemSlotComponent | null {
    return this.processedHerbSlot;
  }

  // ===== 右侧背包区测试辅助方法 =====

  /**
   * 获取右侧背包区容器（测试用）
   */
  public getRightAreaContainer(): Phaser.GameObjects.Container | null {
    return this.rightAreaContainer;
  }

  /**
   * 获取药材背包容器（测试用）
   */
  public getHerbInventoryContainer(): Phaser.GameObjects.Container | null {
    return this.herbInventoryContainer;
  }

  /**
   * 获取方法选择容器（测试用）
   */
  public getMethodSelectionContainer(): Phaser.GameObjects.Container | null {
    return this.methodSelectionContainer;
  }

  /**
   * 获取辅料选择容器（测试用）
   */
  public getAdjuvantSelectionContainer(): Phaser.GameObjects.Container | null {
    return this.adjuvantSelectionContainer;
  }

  /**
   * 获取药材格子列表（测试用）
   */
  public getHerbSlots(): ItemSlotComponent[] {
    return this.herbSlots;
  }

  /**
   * 获取方法按钮列表（测试用）
   */
  public getMethodButtons(): SelectionButtonComponent[] {
    return this.methodButtons;
  }

  /**
   * 获取辅料按钮列表（测试用）
   */
  public getAdjuvantButtons(): SelectionButtonComponent[] {
    return this.adjuvantButtons;
  }

  /**
   * 获取开始按钮（测试用）
   */
  public getStartButton(): Phaser.GameObjects.Text | null {
    return this.startButton;
  }

  /**
   * 获取当前选中药材ID（测试用）
   */
  public getSelectedHerbId(): string | null {
    return this.selectedHerbId;
  }

  /**
   * 获取当前选中方法（测试用）
   */
  public getSelectedMethod(): ProcessingMethodType | null {
    return this.selectedMethod;
  }

  /**
   * 获取当前选中辅料（测试用）
   */
  public getSelectedAdjuvant(): AdjuvantType | null {
    return this.selectedAdjuvant;
  }

  /**
   * 检查是否可以开始炮制（测试用）
   */
  public canStartProcessingPublic(): boolean {
    return this.canStartProcessing();
  }

  /**
   * 获取是否正在炮制（测试用）
   */
  public getIsProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * 获取炮制是否完成（测试用）
   */
  public getProcessingComplete(): boolean {
    return this.processingComplete;
  }

  /**
   * 获取进度条组件（测试用）
   */
  public getProgressBar(): ProgressBarComponent | null {
    return this.progressBar;
  }

  /**
   * 获取成品卡片容器（测试用）
   */
  public getProductCard(): Phaser.GameObjects.Container | null {
    return this.productCard;
  }

  /**
   * 获取成品区域容器（测试用）
   */
  public getProductAreaContainer(): Phaser.GameObjects.Container | null {
    return this.productAreaContainer;
  }

  /**
   * 获取当前评分结果（测试用）
   */
  public getCurrentScoreResult(): ProcessingScoreResult | null {
    return this.currentScoreResult;
  }

  /**
   * 获取布局常量（测试用）
   */
  public static getLayoutConstants(): typeof LAYOUT {
    return LAYOUT;
  }
}