// src/ui/DecoctionUI.ts
/**
 * 煎药游戏UI组件
 *
 * Phase 2 S9.3 实现
 * Phase 2.5 UI组件系统统一化 Task 8 - 重构为统一场景布局
 * Phase 2.5 煎药小游戏UI重构 Task 6 - 使用新组件重构
 *
 * 继承 ScrollModalUI (卷轴风格弹窗)
 * 使用 HerbTagComponent (药牌组件) 显示药材
 * 使用 DragEffectManager (拖拽动效) 提供视觉反馈
 *
 * 卷轴风格布局:
 * ┌──────────────────────────────────────────────────────────────┐
 * │  [卷轴木轴]  标题: 煎药  副标题: 壬寅春  [×]               │
 * ├──────────────────────────────────────────────────────────────┤
 * │  [左印章: 杏林]                                               │
 * │                                                              │
 * │      左侧动画区 (煎药炉灶)     │    右侧药材区 (药牌网格)    │
 * │                                                              │
 * │  [右印章: 煎煮]                                               │
 * └──────────────────────────────────────────────────────────────┘
 */

import Phaser from 'phaser';
import ScrollModalUI from './base/ScrollModalUI';
import { EventBus, EventData } from '../systems/EventBus';
import {
  DecoctionManager,
  DecoctionEvent
} from '../systems/DecoctionManager';
import {
  getDecoctionParams,
  type FireLevel,
  type DecoctionPhase,
  type DecoctionScoreResult
} from '../data/decoction-data';
import prescriptionsData from '../data/prescriptions.json';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';

// Phase 2.5 新组件导入
import HerbTagComponent, { HerbData } from './components/HerbTagComponent';
import ProgressBarComponent from './components/ProgressBarComponent';
import SelectionButtonComponent, {
  SelectionButtonContent
} from './components/SelectionButtonComponent';
import DragEffectManager from '../systems/DragEffectManager';
import { getPixelHerbById } from '../data/pixel-herbs';

// Phase 2.5 视觉组件导入 (Task 10)
import HearthVisualComponent from './components/HearthVisualComponent';
import PotVisualComponent from './components/PotVisualComponent';

/**
 * 布局常量定义 (MINIGAME_MODAL 800×600)
 */
const LAYOUT = {
  // 左侧动画区尺寸
  LEFT_AREA_WIDTH: 480,
  LEFT_AREA_HEIGHT: 600,

  // 右侧背包区尺寸
  RIGHT_AREA_WIDTH: 320,
  RIGHT_AREA_HEIGHT: 600,

  // 煎药炉灶动画尺寸
  HEARTH_WIDTH: 240,
  HEARTH_HEIGHT: 300,

  // 药牌布局 (84x78 木牌 + 14px 绳子)
  HERB_TAG_WIDTH: 84,
  HERB_TAG_HEIGHT: 92, // 木牌高度 + 绳子
  HERB_TAG_SPACING: 12,
  HERB_COLS: 3, // 右侧区域一行3个药牌
  HERB_ROWS: 4, // 最多显示4行

  // 成品区域尺寸
  PRODUCT_AREA_HEIGHT: 80,

  // 相对于容器中心的偏移量 (ScrollModalUI 内容容器偏移 y=30)
  CONTENT_OFFSET_Y: 30,
};

/**
 * 煎药UI组件
 *
 * Phase 2.5 卷轴风格改造:
 * - 继承 ScrollModalUI (卷轴边框 + 印章装饰)
 * - 左侧动画区: 炉灶动画 + 已选药材
 * - 右侧药材区: 药牌网格 + 火候选择
 * - 药牌可拖拽到炉灶区域
 */
export class DecoctionUI extends ScrollModalUI {
  // 系统组件
  private manager: DecoctionManager;
  private eventBus: EventBus;
  private dragManager: DragEffectManager;

  // 区域容器
  private leftAreaContainer: Phaser.GameObjects.Container | null = null;
  private rightAreaContainer: Phaser.GameObjects.Container | null = null;
  private productAreaContainer: Phaser.GameObjects.Container | null = null;

  // 左侧动画区元素
  private hearthContainer: Phaser.GameObjects.Container | null = null;
  private hearthGraphics: Phaser.GameObjects.Graphics | null = null; // 用于高亮overlay
  private hearthText: Phaser.GameObjects.Text | null = null;
  private hearthDropZone: Phaser.GameObjects.Zone | null = null;

  // Phase 2.5 视觉组件 (Task 10)
  public hearthVisual: HearthVisualComponent | null = null;
  public potVisual: PotVisualComponent | null = null;

  // 已选药材显示 (药牌)
  private selectedHerbTags: Map<string, HerbTagComponent> = new Map();

  // 右侧药材区元素
  private prescriptionInfoContainer: Phaser.GameObjects.Container | null = null;
  private herbSelectionContainer: Phaser.GameObjects.Container | null = null;
  private fireSelectionContainer: Phaser.GameObjects.Container | null = null;
  private startButton: Phaser.GameObjects.Text | null = null;

  // 背包药牌
  private backpackHerbTags: Map<string, HerbTagComponent> = new Map();

  // 火候选择按钮
  private fireButtons: Map<string, SelectionButtonComponent> = new Map();

  // 进度条
  private progressBar: ProgressBarComponent | null = null;

  // 当前选择状态
  private selectedPrescriptionId: string | null = null;
  private selectedHerbs: string[] = [];
  private selectedFire: FireLevel = 'wu';

  // 煎煮状态
  private isDecocting: boolean = false;
  private decoctionComplete: boolean = false;

  // 拖拽状态 (internal tracking)

  /**
   * 获取是否正在煎煮
   */
  public getIsDecocting(): boolean {
    return this.isDecocting;
  }

  /**
   * 获取煎煮是否完成
   */
  public getDecoctionComplete(): boolean {
    return this.decoctionComplete;
  }

  // 事件监听器引用
  private phaseChangedHandler!: (data: EventData) => void;
  private herbAddedHandler!: (data: EventData) => void;
  private herbRemovedHandler!: (data: EventData) => void;
  private decoctionTickHandler!: (data: EventData) => void;
  private scoreCalculatedHandler!: (data: EventData) => void;

  /**
   * 构造函数
   * @param scene Phaser场景
   */
  constructor(scene: Phaser.Scene) {
    // 调用ScrollModalUI构造函数 (卷轴风格)
    super(scene, {
      title: '煎药',
      subtitle: '壬寅春',
      sealMain: '杏林',
      sealCorner: '煎煮',
      modalType: 'MINIGAME_MODAL',
      onExit: () => {
        this.handleExit();
      },
    });

    // 初始化系统组件
    this.manager = DecoctionManager.getInstance();
    this.eventBus = EventBus.getInstance();
    this.dragManager = new DragEffectManager(scene);

    // 创建卷轴内容布局
    this.createScrollContent();

    // 设置事件监听
    this.setupEventListeners();

    // 初始化显示
    this.initializeDisplay();
  }

  /**
   * 创建卷轴内容布局
   * 在 getContentContainer() 中添加左侧动画区 + 右侧药材区
   */
  private createScrollContent(): void {
    const contentContainer = this.getContentContainer();

    // 创建左侧动画区容器
    this.createLeftAreaContainer(contentContainer);

    // 创建右侧药材区容器
    this.createRightAreaContainer(contentContainer);

    // 创建底部成品区容器
    this.createProductAreaContainer(contentContainer);
  }

  /**
   * 创建左侧动画区容器
   * 包含: 煎药炉灶动画 + 已选药材展示 + 拖拽目标区域
   */
  private createLeftAreaContainer(parent: Phaser.GameObjects.Container): void {
    const areaCenterX = -this.width / 2 + LAYOUT.LEFT_AREA_WIDTH / 2;
    const areaCenterY = LAYOUT.CONTENT_OFFSET_Y;

    this.leftAreaContainer = this.scene.add.container(areaCenterX, areaCenterY);
    parent.add(this.leftAreaContainer);

    // 创建煎药炉灶动画容器
    this.createHearthContainer();

    // 创建拖拽目标区域 (炉灶区域)
    this.createDropZone();
  }

  /**
   * 创建煎药炉灶动画容器 (240×300)
   */
  private createHearthContainer(): void {
    const hearthX = 0;
    const hearthY = -LAYOUT.LEFT_AREA_HEIGHT / 2 + LAYOUT.HEARTH_HEIGHT / 2 + 20;

    this.hearthContainer = this.scene.add.container(hearthX, hearthY);
    this.leftAreaContainer?.add(this.hearthContainer);

    // Phase 2.5: 使用新视觉组件 (Task 10)
    this.createHearthVisual();
    this.createPotVisual();
  }

  /**
   * 创建炉灶视觉组件 (HearthVisualComponent)
   * 尺寸: 360×204, pixelSize: 6
   * 包含: 砖墙纹理、炉灶顶板、火焰开口、火焰动画、火星粒子
   */
  private createHearthVisual(): void {
    this.hearthVisual = new HearthVisualComponent(this.scene, {
      width: 360,      // 60px * 6 = 360
      height: 204,     // 34px * 6 = 204
      pixelSize: 6,    // 像素尺寸
      animated: true,  // 启用火焰动画
    });
    this.hearthContainer?.add(this.hearthVisual.container);

    // 创建高亮overlay (用于拖拽时显示)
    this.hearthGraphics = this.scene.add.graphics();
    this.hearthGraphics.setVisible(false); // 默认隐藏
    this.hearthContainer?.add(this.hearthGraphics);
  }

  /**
   * 创建药罐视觉组件 (PotVisualComponent)
   * 尺寸: 264×168, pixelSize: 6
   * 包含: 罐身、罐口边缘、药液表面、把手、蒸汽、搅拌勺
   * 位置: 炉灶上方 (Y offset: -204 - 48)
   */
  private createPotVisual(): void {
    this.potVisual = new PotVisualComponent(this.scene, {
      width: 264,       // 44px * 6 = 264
      height: 168,      // 28px * 6 = 168
      pixelSize: 6,     // 像素尺寸
      showSteam: true,  // 显示蒸汽
      showLadle: true,  // 显示搅拌勺
    });
    // 药罐位于炉灶上方，Y偏移: -204(炉灶高度) - 48(间距)
    this.potVisual.container.setY(-204 - 48);
    this.hearthContainer?.add(this.potVisual.container);

    // 添加状态文字 (位于药罐上方)
    const statusText = this.scene.add.text(0, -204 - 48 - 168 / 2 - 30, '拖入药材', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY,
    }).setOrigin(0.5);
    statusText.setName('hearthStatusText');
    this.hearthContainer?.add(statusText);
  }

  /**
   * 创建拖拽目标区域
   */
  private createDropZone(): void {
    const dropX = 0;
    const dropY = -LAYOUT.LEFT_AREA_HEIGHT / 2 + LAYOUT.HEARTH_HEIGHT / 2 + 20;

    this.hearthDropZone = this.scene.add.zone(
      dropX,
      dropY,
      LAYOUT.HEARTH_WIDTH,
      LAYOUT.HEARTH_HEIGHT
    );
    this.hearthDropZone.setRectangleDropZone(LAYOUT.HEARTH_WIDTH, LAYOUT.HEARTH_HEIGHT);

    this.leftAreaContainer?.add(this.hearthDropZone);

    // 设置拖拽进入/离开事件
    this.scene.input.on('dragenter', (_pointer: any, _gameObject: any, dropZone: any) => {
      if (dropZone === this.hearthDropZone) {
        this.highlightDropZone(true);
      }
    });

    this.scene.input.on('dragleave', (_pointer: any, _gameObject: any, dropZone: any) => {
      if (dropZone === this.hearthDropZone) {
        this.highlightDropZone(false);
      }
    });
  }

  /**
   * 高亮拖拽目标区域
   */
  private highlightDropZone(highlight: boolean): void {
    if (!this.hearthGraphics) return;

    if (highlight) {
      // 显示高亮overlay (金色边框)
      this.hearthGraphics.setVisible(true);
      this.hearthGraphics.clear();
      this.hearthGraphics.lineStyle(4, 0xffd24a, 1); // 金色
      // 高亮区域覆盖炉灶和药罐区域
      const x = -180; // 360/2
      const y = -204 - 48 - 168 / 2 - 30; // 从状态文字顶部开始
      const width = 360;
      const height = 204 + 48 + 168 + 60; // 炉灶 + 间距 + 药罐 + 状态文字空间
      this.hearthGraphics.strokeRect(x, y, width, height);
    } else {
      // 隐藏高亮overlay
      this.hearthGraphics.setVisible(false);
      this.hearthGraphics.clear();
    }
  }

  /**
   * 创建右侧药材区容器
   * 包含: 方剂提示 + 药牌网格 + 火候选择 + 开始按钮
   */
  private createRightAreaContainer(parent: Phaser.GameObjects.Container): void {
    const areaCenterX = this.width / 2 - LAYOUT.RIGHT_AREA_WIDTH / 2;
    const areaCenterY = LAYOUT.CONTENT_OFFSET_Y;

    this.rightAreaContainer = this.scene.add.container(areaCenterX, areaCenterY);
    parent.add(this.rightAreaContainer);

    // 创建方剂提示容器
    this.createPrescriptionInfoContainer();

    // 创建药材选择容器
    this.createHerbSelectionContainer();

    // 创建火候选择容器
    this.createFireSelectionContainer();

    // 创建开始按钮
    this.createStartButton();
  }

  /**
   * 创建方剂提示容器
   */
  private createPrescriptionInfoContainer(): void {
    const containerY = -LAYOUT.RIGHT_AREA_HEIGHT / 2 + 40;

    this.prescriptionInfoContainer = this.scene.add.container(0, containerY);
    this.rightAreaContainer?.add(this.prescriptionInfoContainer);

    // 方剂名称标题
    const titleText = this.scene.add.text(0, 0, '当前方剂', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
    }).setOrigin(0.5);
    this.prescriptionInfoContainer?.add(titleText);

    // 方剂名称 (动态更新)
    const nameText = this.scene.add.text(0, 20, '请选择方剂', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
    }).setOrigin(0.5);
    nameText.setName('prescriptionName');
    this.prescriptionInfoContainer?.add(nameText);

    // 组成提示 (动态更新)
    const compositionText = this.scene.add.text(0, 40, '拖入药材开始煎煮', {
      fontSize: '12px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY,
      wordWrap: { width: LAYOUT.RIGHT_AREA_WIDTH - 20 },
    }).setOrigin(0.5);
    compositionText.setName('prescriptionComposition');
    this.prescriptionInfoContainer?.add(compositionText);
  }

  /**
   * 创建药材选择容器
   * 使用 HerbTagComponent 药牌组件
   */
  private createHerbSelectionContainer(): void {
    const containerY = -LAYOUT.RIGHT_AREA_HEIGHT / 2 + 100;

    this.herbSelectionContainer = this.scene.add.container(0, containerY);
    this.rightAreaContainer?.add(this.herbSelectionContainer);

    // 药材选择提示
    const hintText = this.scene.add.text(0, 0, '拖拽药材到炉灶', {
      fontSize: '12px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY,
    }).setOrigin(0.5);
    this.herbSelectionContainer?.add(hintText);
  }

  /**
   * 创建火候选择容器
   */
  private createFireSelectionContainer(): void {
    const containerY = LAYOUT.RIGHT_AREA_HEIGHT / 2 - 120;

    this.fireSelectionContainer = this.scene.add.container(0, containerY);
    this.rightAreaContainer?.add(this.fireSelectionContainer);

    // 火候选择标题
    const titleText = this.scene.add.text(0, 0, '火候选择', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
    }).setOrigin(0.5);
    this.fireSelectionContainer?.add(titleText);

    // 武火按钮
    const wuFireContent: SelectionButtonContent = {
      label: '武火',
      value: 'wu',
    };

    const wuFireButton = new SelectionButtonComponent(
      this.scene,
      wuFireContent,
      {
        selected: this.selectedFire === 'wu',
        onSelect: (value: string) => this.selectFire(value as FireLevel),
        width: 100,
      },
      -60,
      35
    );
    wuFireButton.container.setName('fireWu');
    this.fireButtons.set('wu', wuFireButton);
    this.fireSelectionContainer?.add(wuFireButton.container);

    // 文火按钮
    const wenFireContent: SelectionButtonContent = {
      label: '文火',
      value: 'wen',
    };

    const wenFireButton = new SelectionButtonComponent(
      this.scene,
      wenFireContent,
      {
        selected: this.selectedFire === 'wen',
        onSelect: (value: string) => this.selectFire(value as FireLevel),
        width: 100,
      },
      60,
      35
    );
    wenFireButton.container.setName('fireWen');
    this.fireButtons.set('wen', wenFireButton);
    this.fireSelectionContainer?.add(wenFireButton.container);

    // 初始化选中状态
    this.updateFireButtonState();
  }

  /**
   * 创建开始煎煮按钮
   */
  private createStartButton(): void {
    const buttonY = LAYOUT.RIGHT_AREA_HEIGHT / 2 - 60;

    this.startButton = this.scene.add.text(0, buttonY, '[开始煎煮]', {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.TEXT_DISABLED,
      backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startButton.on('pointerover', () => {
      if (this.startButton) {
        this.startButton.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
      }
    });
    this.startButton.on('pointerout', () => {
      this.updateStartButtonState();
    });
    this.startButton.on('pointerdown', () => {
      this.startDecoction();
    });

    this.rightAreaContainer?.add(this.startButton);
  }

  /**
   * 创建底部成品区容器
   */
  private createProductAreaContainer(parent: Phaser.GameObjects.Container): void {
    const areaY = this.height / 2 - LAYOUT.PRODUCT_AREA_HEIGHT / 2 - 10;

    this.productAreaContainer = this.scene.add.container(0, areaY);
    parent.add(this.productAreaContainer);

    // 成品提示文字
    const productHint = this.scene.add.text(0, 0, '成品区域: 煎煮完成后点击收取', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY,
    }).setOrigin(0.5);
    productHint.setName('productHint');
    this.productAreaContainer?.add(productHint);

    // 成品卡片容器 (初始隐藏)
    const productCard = this.scene.add.container(0, 0);
    productCard.setName('productCard');
    productCard.setVisible(false);
    this.productAreaContainer?.add(productCard);
  }

  /**
   * 创建药牌组件
   */
  private createHerbTag(herbId: string, x: number, y: number, draggable: boolean): HerbTagComponent | null {
    const pixelHerb = getPixelHerbById(herbId);
    if (!pixelHerb) return null;

    const herbData: HerbData = {
      id: pixelHerb.id,
      name: pixelHerb.name,
      prop: pixelHerb.prop,
      count: pixelHerb.count,
      grid: pixelHerb.grid,
      palette: pixelHerb.palette,
    };

    const tag = new HerbTagComponent(this.scene, {
      herb: herbData,
      draggable,
      onDragStart: () => {
        this.dragManager.startDrag(tag.container.x, tag.container.y);
      },
      onDragEnd: () => {
        this.handleHerbDrop(herbId, tag);
      },
    }, x, y);

    return tag;
  }

  /**
   * 处理药材拖拽投放
   */
  private handleHerbDrop(herbId: string, tag: HerbTagComponent): void {
    // 检查是否投放到炉灶区域
    const dropZone = this.hearthDropZone;
    if (!dropZone) {
      this.dragManager.endDrop(tag.container.x, tag.container.y, 'failure');
      return;
    }

    // 获取投放位置
    const dropX = tag.container.x;
    const dropY = tag.container.y;

    // 检查是否在炉灶区域内
    const zoneBounds = {
      x: dropZone.x - LAYOUT.HEARTH_WIDTH / 2,
      y: dropZone.y - LAYOUT.HEARTH_HEIGHT / 2,
      width: LAYOUT.HEARTH_WIDTH,
      height: LAYOUT.HEARTH_HEIGHT,
    };

    const isInZone = dropX >= zoneBounds.x && dropX <= zoneBounds.x + zoneBounds.width &&
                     dropY >= zoneBounds.y && dropY <= zoneBounds.y + zoneBounds.height;

    if (isInZone && this.selectedPrescriptionId) {
      // 检查是否是必需药材
      const requiredHerbs = this.getRequiredHerbIds(
        prescriptionsData.prescriptions.find(p => p.id === this.selectedPrescriptionId)
      );

      if (requiredHerbs.includes(herbId)) {
        // 成功投放 - 添加药材
        if (!this.selectedHerbs.includes(herbId)) {
          this.manager.addHerb(herbId);
        }
        this.dragManager.endDrop(dropX, dropY, 'success');

        // 恢复药牌位置
        this.resetHerbTagPosition(herbId, tag);
      } else {
        // 不是必需药材 - 失败
        this.dragManager.endDrop(dropX, dropY, 'failure');
        this.resetHerbTagPosition(herbId, tag);
      }
    } else {
      // 未投放到炉灶区域 - 失败
      this.dragManager.endDrop(dropX, dropY, 'failure');
      this.resetHerbTagPosition(herbId, tag);
    }
  }

  /**
   * 恢复药牌位置
   */
  private resetHerbTagPosition(herbId: string, tag: HerbTagComponent): void {
    // 计算原始位置
    const originalIndex = Array.from(this.backpackHerbTags.keys()).indexOf(herbId);
    if (originalIndex >= 0) {
      const col = originalIndex % LAYOUT.HERB_COLS;
      const row = Math.floor(originalIndex / LAYOUT.HERB_COLS);
      const startX = -(LAYOUT.HERB_COLS * (LAYOUT.HERB_TAG_WIDTH + LAYOUT.HERB_TAG_SPACING) - LAYOUT.HERB_TAG_SPACING) / 2;
      const startY = 30;
      const x = startX + col * (LAYOUT.HERB_TAG_WIDTH + LAYOUT.HERB_TAG_SPACING);
      const y = startY + row * (LAYOUT.HERB_TAG_HEIGHT + LAYOUT.HERB_TAG_SPACING);

      // 动画恢复位置
      this.scene.tweens.add({
        targets: tag.container,
        x,
        y,
        duration: 200,
        ease: 'Power2',
      });
    }
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    this.phaseChangedHandler = (data: EventData) => {
      const newPhase = data.new_phase as DecoctionPhase;
      this.handlePhaseChange(newPhase);
    };
    this.eventBus.on(DecoctionEvent.PHASE_CHANGED, this.phaseChangedHandler);

    this.herbAddedHandler = (_data: EventData) => {
      this.updateSelectedHerbsDisplay();
    };
    this.eventBus.on(DecoctionEvent.HERB_ADDED, this.herbAddedHandler);

    this.herbRemovedHandler = (_data: EventData) => {
      this.updateSelectedHerbsDisplay();
    };
    this.eventBus.on(DecoctionEvent.HERB_REMOVED, this.herbRemovedHandler);

    this.decoctionTickHandler = (data: EventData) => {
      const currentTime = data.current_time as number;
      const targetTime = data.target_time as number;
      const progress = data.progress as number;
      this.updateDecoctionProgress(currentTime, targetTime, progress);
    };
    this.eventBus.on(DecoctionEvent.DECOCTION_TICK, this.decoctionTickHandler);

    this.scoreCalculatedHandler = (data: EventData) => {
      const result = data as unknown as DecoctionScoreResult;
      this.handleDecoctionComplete(result);
    };
    this.eventBus.on(DecoctionEvent.SCORE_CALCULATED, this.scoreCalculatedHandler);
  }

  /**
   * 初始化显示
   */
  private initializeDisplay(): void {
    // 显示方剂选择
    this.showPrescriptionSelection();
  }

  /**
   * 显示方剂选择
   */
  private showPrescriptionSelection(): void {
    // 清空方剂信息
    this.updatePrescriptionInfo(null);

    // 清空药牌
    this.clearHerbTags();

    // 创建方剂选择按钮
    const prescriptions = prescriptionsData.prescriptions;
    const startY = 50;
    const spacing = 50;

    prescriptions.forEach((prescription, index) => {
      const y = startY + index * spacing;

      const button = this.scene.add.text(0, y, prescription.name, {
        fontSize: '16px',
        color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
        backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
        padding: { x: 15, y: 8 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      button.on('pointerover', () => button.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER));
      button.on('pointerout', () => button.setColor(UI_COLOR_STRINGS.BUTTON_SUCCESS));
      button.on('pointerdown', () => this.selectPrescription(prescription.id));

      this.herbSelectionContainer?.add(button);

      // 方剂信息提示
      const infoText = this.scene.add.text(0, y + 22, `${prescription.syndrome}`, {
        fontSize: '11px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
      }).setOrigin(0.5);
      this.herbSelectionContainer?.add(infoText);
    });
  }

  /**
   * 选择方剂
   */
  private selectPrescription(prescriptionId: string): void {
    this.selectedPrescriptionId = prescriptionId;
    this.manager.selectPrescription(prescriptionId);

    // 更新方剂信息显示
    this.updatePrescriptionInfo(prescriptionId);

    // 切换到药材选择界面
    this.showHerbSelection();
  }

  /**
   * 更新方剂信息显示
   */
  private updatePrescriptionInfo(prescriptionId: string | null): void {
    const nameText = this.prescriptionInfoContainer?.getByName('prescriptionName') as Phaser.GameObjects.Text;
    const compositionText = this.prescriptionInfoContainer?.getByName('prescriptionComposition') as Phaser.GameObjects.Text;

    if (!prescriptionId) {
      if (nameText) nameText.setText('请选择方剂');
      if (compositionText) compositionText.setText('拖入药材开始煎煮');
      return;
    }

    const prescription = prescriptionsData.prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) return;

    if (nameText) nameText.setText(prescription.name);
    if (compositionText) {
      const herbs = prescription.composition.map(c => c.herb).join(' + ');
      compositionText.setText(`需要: ${herbs}`);
    }
  }

  /**
   * 显示药材选择界面
   */
  private showHerbSelection(): void {
    // 清空旧的药牌
    this.clearHerbTags();

    if (!this.selectedPrescriptionId) return;

    const prescription = prescriptionsData.prescriptions.find(p => p.id === this.selectedPrescriptionId);
    if (!prescription) return;

    // 获取必需药材ID列表
    const requiredHerbIds = this.getRequiredHerbIds(prescription);

    // 创建药牌网格布局
    const cols = LAYOUT.HERB_COLS;
    const startX = -(cols * (LAYOUT.HERB_TAG_WIDTH + LAYOUT.HERB_TAG_SPACING) - LAYOUT.HERB_TAG_SPACING) / 2;
    const startY = 30;

    requiredHerbIds.forEach((herbId, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (LAYOUT.HERB_TAG_WIDTH + LAYOUT.HERB_TAG_SPACING);
      const y = startY + row * (LAYOUT.HERB_TAG_HEIGHT + LAYOUT.HERB_TAG_SPACING);

      // 创建可拖拽药牌
      const tag = this.createHerbTag(herbId, x, y, true);
      if (tag) {
        this.backpackHerbTags.set(herbId, tag);
        this.herbSelectionContainer?.add(tag.container);
      }
    });

    // 更新开始按钮状态
    this.updateStartButtonState();

    // 更新炉灶状态提示
    this.updateHearthStatus('拖入药材');
  }

  /**
   * 获取必需药材ID列表
   */
  private getRequiredHerbIds(prescription: any): string[] {
    const herbNameToId: Record<string, string> = {
      '麻黄': 'mahuang', '桂枝': 'guizhi', '杏仁': 'xingren', '甘草': 'gancao',
      '芍药': 'shaoyao', '生姜': 'shengjiang', '大枣': 'dazao',
      '金银花': 'jinyinhua', '连翘': 'lianqiao', '薄荷': 'bohe', '荆芥': 'jingjie',
      '牛蒡子': 'niubangzi', '豆豉': 'douchi', '竹叶': 'zhuye', '桔梗': 'jiegeng',
      '桑叶': 'sangye', '菊花': 'juhua', '芦根': 'lugen',
      '当归': 'danggui', '黄芪': 'huangqi', '人参': 'renshen', '枸杞': 'gouqi',
      '陈皮': 'chenpi', '茯苓': 'fuling', '肉桂': 'rougui', '川芎': 'chuanxiong',
      '白术': 'baizhu', '熟地': 'shudi', '白芍': 'baishao', '半夏': 'banxia',
      '黄连': 'huanglian', '石斛': 'shihu', '附子': 'fuzi',
    };
    return prescription.composition.map((c: { herb: string }) => herbNameToId[c.herb] || c.herb);
  }

  /**
   * 清空药牌
   */
  private clearHerbTags(): void {
    // 移除旧的药牌
    if (this.herbSelectionContainer) {
      const children = this.herbSelectionContainer.getAll();
      children.forEach(child => {
        this.herbSelectionContainer?.remove(child, true);
      });
    }

    // 销毁药牌组件
    this.backpackHerbTags.forEach(tag => tag.destroy());
    this.backpackHerbTags.clear();

    this.selectedHerbTags.forEach(tag => tag.destroy());
    this.selectedHerbTags.clear();
  }

  /**
   * 更新已选药材显示
   */
  private updateSelectedHerbsDisplay(): void {
    const state = this.manager.getState();
    this.selectedHerbs = state.selected_herbs;

    // 更新炉灶区域的已选药材显示
    // 在炉灶下方显示已选药材名称
    const selectedHerbsText = this.selectedHerbs.length > 0
      ? `已放入: ${this.selectedHerbs.map(id => getPixelHerbById(id)?.name || id).join('、')}`
      : '拖入药材';

    this.updateHearthStatus(selectedHerbsText);

    // 更新开始按钮状态
    this.updateStartButtonState();
  }

  /**
   * 选择火候
   */
  private selectFire(fire: FireLevel): void {
    this.selectedFire = fire;
    this.manager.setFireLevel(fire);
    this.updateFireButtonState();
  }

  /**
   * 更新火候按钮状态
   */
  private updateFireButtonState(): void {
    const wuButton = this.fireButtons.get('wu');
    if (wuButton) {
      if (this.selectedFire === 'wu') {
        wuButton.select(true);
      } else {
        wuButton.deselect();
      }
    }

    const wenButton = this.fireButtons.get('wen');
    if (wenButton) {
      if (this.selectedFire === 'wen') {
        wenButton.select(true);
      } else {
        wenButton.deselect();
      }
    }
  }

  /**
   * 更新开始按钮状态
   */
  private updateStartButtonState(): void {
    if (!this.startButton) return;

    const requiredHerbs = this.selectedPrescriptionId ?
      this.getRequiredHerbIds(prescriptionsData.prescriptions.find(p => p.id === this.selectedPrescriptionId)) : [];

    const allSelected = requiredHerbs.every(herbId => this.selectedHerbs.includes(herbId));

    if (allSelected) {
      this.startButton.setColor(UI_COLOR_STRINGS.BUTTON_SUCCESS);
      this.startButton.setText('[开始煎煮]');
    } else {
      this.startButton.setColor(UI_COLOR_STRINGS.TEXT_DISABLED);
      this.startButton.setText('[药材未齐]');
    }
  }

  /**
   * 开始煎煮
   */
  private startDecoction(): void {
    if (!this.manager.canProceedToNextPhase()) {
      return;
    }

    this.isDecocting = true;

    // 更新炉灶状态
    this.updateHearthStatus('煎药进行中...');

    // 创建进度条
    this.createProgressBar();

    // 开始煎煮
    this.manager.startDecoction();

    // 禁用开始按钮
    if (this.startButton) {
      this.startButton.setText('[煎煮中]');
      this.startButton.disableInteractive();
    }

    // 禁用药牌拖拽
    this.backpackHerbTags.forEach(tag => {
      tag.container.disableInteractive();
    });
  }

  /**
   * 创建进度条
   */
  private createProgressBar(): void {
    const params = getDecoctionParams(this.selectedPrescriptionId || '');
    const targetTime = params?.total_time || 60;

    this.progressBar = new ProgressBarComponent(this.scene, {
      width: 200,
      maxValue: targetTime,
      showTime: true,
    }, 0, LAYOUT.HEARTH_HEIGHT / 2 + 20);

    this.hearthContainer?.add(this.progressBar.container);
  }

  /**
   * 更新炉灶状态文字
   */
  private updateHearthStatus(status: string): void {
    const statusText = this.hearthContainer?.getByName('hearthStatusText') as Phaser.GameObjects.Text;
    if (statusText) {
      statusText.setText(status);
      statusText.setColor(UI_COLOR_STRINGS.SOFT_ORANGE);
    }
  }

  /**
   * 更新煎药进度
   */
  private updateDecoctionProgress(currentTime: number, targetTime: number, _progress: number): void {
    if (this.progressBar) {
      this.progressBar.setProgress(currentTime);
    }

    const remaining = targetTime - currentTime;
    this.updateHearthStatus(`煎药进行中... ${remaining}秒`);
  }

  /**
   * 处理阶段变化
   */
  private handlePhaseChange(phase: DecoctionPhase): void {
    switch (phase) {
      case 'select_prescription':
        this.showPrescriptionSelection();
        break;
      case 'select_herbs':
        this.showHerbSelection();
        break;
      case 'decocting':
        this.startDecoction();
        break;
      case 'evaluate':
        // 等待SCORE_CALCULATED事件
        break;
    }
  }

  /**
   * 处理煎药完成
   */
  private handleDecoctionComplete(result: DecoctionScoreResult): void {
    this.isDecocting = false;
    this.decoctionComplete = true;

    this.updateHearthStatus(result.passed ? '煎药成功!' : '煎药失败');

    this.showProductCard(result);
    this.showScoreResult(result);
  }

  /**
   * 显示成品卡片
   */
  private showProductCard(result: DecoctionScoreResult): void {
    const productCard = this.productAreaContainer?.getByName('productCard') as Phaser.GameObjects.Container;
    if (!productCard) return;

    productCard.removeAll(true);

    const cardBg = this.scene.add.rectangle(0, 0, 100, 50, UI_COLORS.BUTTON_SUCCESS);
    productCard.add(cardBg);

    const cardText = this.scene.add.text(0, 0, '煎好药汤', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
    }).setOrigin(0.5);
    productCard.add(cardText);

    cardBg.setInteractive({ useHandCursor: true });
    cardBg.on('pointerdown', () => {
      this.collectProduct(result);
    });

    productCard.setVisible(true);

    const hint = this.productAreaContainer?.getByName('productHint') as Phaser.GameObjects.Text;
    if (hint) hint.setVisible(false);
  }

  /**
   * 显示评分结果
   */
  private showScoreResult(result: DecoctionScoreResult): void {
    const scoreContainer = this.scene.add.container(0, LAYOUT.HEARTH_HEIGHT / 2 + 40);
    scoreContainer.setName('scoreContainer');
    this.hearthContainer?.add(scoreContainer);

    const totalScoreText = this.scene.add.text(0, 0, `总分: ${result.total_score}`, {
      fontSize: '18px',
      color: result.passed ? UI_COLOR_STRINGS.BUTTON_SUCCESS : UI_COLOR_STRINGS.SOFT_RED,
    }).setOrigin(0.5);
    scoreContainer.add(totalScoreText);

    const dimensionY = 25;
    const dimensionScores = [
      { name: '组成', score: result.dimension_scores.composition, max: 50 },
      { name: '火候', score: result.dimension_scores.fire, max: 30 },
      { name: '时间', score: result.dimension_scores.time, max: 20 },
    ];

    dimensionScores.forEach((dim, index) => {
      const dimText = this.scene.add.text(0, dimensionY + index * 20,
        `${dim.name}: ${dim.score}/${dim.max}`, {
          fontSize: '14px',
          color: dim.score === dim.max ? UI_COLOR_STRINGS.BUTTON_SUCCESS : UI_COLOR_STRINGS.TEXT_PRIMARY,
        }).setOrigin(0.5);
      scoreContainer.add(dimText);
    });

    const feedbackText = this.scene.add.text(0, dimensionY + 60, result.feedback, {
      fontSize: '12px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY,
      wordWrap: { width: LAYOUT.HEARTH_WIDTH },
    }).setOrigin(0.5);
    scoreContainer.add(feedbackText);

    const passStatus = this.scene.add.text(0, dimensionY + 80,
      result.passed ? '[煎药成功]' : '[煎药失败]', {
        fontSize: '16px',
        color: result.passed ? UI_COLOR_STRINGS.BUTTON_SUCCESS : UI_COLOR_STRINGS.SOFT_RED,
      }).setOrigin(0.5);
    scoreContainer.add(passStatus);
  }

  /**
   * 收取成品
   */
  private collectProduct(_result: DecoctionScoreResult): void {
    this.handleExit();
  }

  /**
   * 处理退出
   */
  private handleExit(): void {
    this.manager.reset();
    this.destroy();
    this.scene.scene.stop('DecoctionScene');
    this.scene.scene.start('ClinicScene');
  }

  /**
   * 销毁UI
   */
  destroy(): void {
    // 移除事件监听
    this.eventBus.off(DecoctionEvent.PHASE_CHANGED, this.phaseChangedHandler);
    this.eventBus.off(DecoctionEvent.HERB_ADDED, this.herbAddedHandler);
    this.eventBus.off(DecoctionEvent.HERB_REMOVED, this.herbRemovedHandler);
    this.eventBus.off(DecoctionEvent.DECOCTION_TICK, this.decoctionTickHandler);
    this.eventBus.off(DecoctionEvent.SCORE_CALCULATED, this.scoreCalculatedHandler);

    // 移除拖拽事件
    this.scene.input.off('dragenter');
    this.scene.input.off('dragleave');

    // 销毁药牌组件
    this.selectedHerbTags.forEach(tag => tag.destroy());
    this.selectedHerbTags.clear();

    this.backpackHerbTags.forEach(tag => tag.destroy());
    this.backpackHerbTags.clear();

    // 销毁火候选择按钮
    this.fireButtons.forEach(button => button.destroy());
    this.fireButtons.clear();

    // 销毁进度条
    if (this.progressBar) {
      this.progressBar.destroy();
      this.progressBar = null;
    }

    // Phase 2.5: 销毁视觉组件 (Task 10)
    if (this.hearthVisual) {
      this.hearthVisual.destroy();
      this.hearthVisual = null;
    }
    if (this.potVisual) {
      this.potVisual.destroy();
      this.potVisual = null;
    }

    // 销毁高亮overlay graphics
    if (this.hearthGraphics) {
      this.hearthGraphics.destroy();
      this.hearthGraphics = null;
    }

    // 销毁拖拽效果管理器
    this.dragManager.destroy();

    // 调用父类销毁方法
    super.destroy();
  }
}