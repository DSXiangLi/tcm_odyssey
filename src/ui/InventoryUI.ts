// src/ui/InventoryUI.ts
/**
 * 背包界面组件
 *
 * 功能:
 * - 4类背包Tab切换（药材/种植/工具/知识）
 * - 药材背包的药袋分类显示
 * - 物品数量显示
 * - 物品详情查看
 * - 快捷键触发（B键）
 *
 * Phase 2 S8.3 实现
 */

import Phaser from 'phaser';
import { InventoryManager } from '../systems/InventoryManager';
import { EventBus } from '../systems/EventBus';
import {
  INVENTORY_TYPES,
  HERB_BAGS,
  HerbBag,
  InventoryTypeConfig
} from '../data/inventory-data';

// 背包UI配置
export interface InventoryUIConfig {
  scene: Phaser.Scene;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onClose?: () => void;
}

// Tab类型
export type InventoryTabType = 'herbs' | 'seeds' | 'tools' | 'knowledge';

// 物品格子UI状态
interface ItemSlotUI {
  container: Phaser.GameObjects.Container;
  icon?: Phaser.GameObjects.Text;  // 使用文字代替图标（暂时）
  quantityText?: Phaser.GameObjects.Text;
  itemId: string;
  isSelected: boolean;
}

// Tab按钮UI状态
interface TabButtonUI {
  button: Phaser.GameObjects.Text;
  type: InventoryTabType;
  isSelected: boolean;
}

// 药袋按钮UI状态
interface BagButtonUI {
  button: Phaser.GameObjects.Text;
  bagId: string;
  isSelected: boolean;
}

/**
 * 背包界面类
 */
export class InventoryUI {
  private scene: Phaser.Scene;
  private inventoryManager: InventoryManager;
  private eventBus: EventBus;

  private container!: Phaser.GameObjects.Container;
  private background!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private closeButton!: Phaser.GameObjects.Text;

  // Tab区域
  private tabsContainer!: Phaser.GameObjects.Container;
  private tabButtons: TabButtonUI[] = [];
  private currentTab: InventoryTabType = 'herbs';

  // 内容区域
  private contentContainer!: Phaser.GameObjects.Container;

  // 药袋区域（仅药材Tab显示）
  private bagsContainer!: Phaser.GameObjects.Container;
  private bagButtons: BagButtonUI[] = [];
  private currentBag: string = 'jiebiao_bag';

  // 物品格子
  private itemSlots: ItemSlotUI[] = [];

  // 位置和尺寸
  private x: number;
  private y: number;
  private width: number;
  private height: number;

  private onClose?: () => void;
  private isVisible: boolean = true;

  // 样式配置
  private readonly styles = {
    background: { fillColor: 0x1a1a2e, alpha: 0.95 },
    title: { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' },
    tab: { fontSize: '14px', color: '#aaaaaa', padding: { x: 10, y: 5 } },
    tabSelected: { color: '#ffffff', backgroundColor: '#4a7c59' },
    tabHover: { backgroundColor: '#3d5c49' },
    bag: { fontSize: '12px', color: '#888888', padding: { x: 8, y: 4 } },
    bagSelected: { color: '#ffffff', backgroundColor: '#3a5a3a' },
    itemSlot: {
      width: 60,
      height: 60,
      fillColor: 0x2d2d44,
      borderColor: 0x4a4a6a,
      borderWidth: 2
    },
    itemSlotSelected: { borderColor: 0x7cb342, borderWidth: 3 },
    itemText: { fontSize: '10px', color: '#ffffff' },
    quantityText: { fontSize: '12px', color: '#ffcc00', fontStyle: 'bold' },
    closeButton: { fontSize: '16px', color: '#ff6b6b' }
  };

  constructor(config: InventoryUIConfig) {
    this.scene = config.scene;
    this.inventoryManager = InventoryManager.getInstance();
    this.eventBus = EventBus.getInstance();

    this.x = config.x ?? 100;
    this.y = config.y ?? 50;
    this.width = config.width ?? 500;
    this.height = config.height ?? 400;

    this.onClose = config.onClose;

    this.createUI();
    this.selectTab('herbs');
  }

  /**
   * 创建UI元素
   */
  private createUI(): void {
    // 主容器
    this.container = this.scene.add.container(this.x, this.y);
    this.container.setDepth(1000);
    this.container.setScrollFactor(0);

    // 背景
    this.background = this.scene.add.rectangle(
      this.width / 2,
      this.height / 2,
      this.width,
      this.height,
      this.styles.background.fillColor,
      this.styles.background.alpha
    );
    this.container.add(this.background);

    // 标题
    this.titleText = this.scene.add.text(
      this.width / 2,
      20,
      '背包',
      this.styles.title
    ).setOrigin(0.5);
    this.container.add(this.titleText);

    // 关闭按钮
    this.closeButton = this.scene.add.text(
      this.width - 20,
      20,
      '✕',
      this.styles.closeButton
    ).setOrigin(0.5);
    this.closeButton.setInteractive({ useHandCursor: true });
    this.closeButton.on('pointerdown', () => this.hide());
    this.closeButton.on('pointerover', () => this.closeButton.setColor('#ff9999'));
    this.closeButton.on('pointerout', () => this.closeButton.setColor('#ff6b6b'));
    this.container.add(this.closeButton);

    // Tab容器
    this.tabsContainer = this.scene.add.container(20, 50);
    this.container.add(this.tabsContainer);
    this.createTabs();

    // 药袋容器（仅药材Tab显示）
    this.bagsContainer = this.scene.add.container(20, 80);
    this.container.add(this.bagsContainer);
    this.createBagButtons();

    // 内容容器
    this.contentContainer = this.scene.add.container(20, 110);
    this.container.add(this.contentContainer);

    // 初始显示
    this.updateContent();
  }

  /**
   * 创建Tab按钮
   */
  private createTabs(): void {
    const tabWidth = 80;
    const spacing = 10;

    INVENTORY_TYPES.forEach((typeConfig: InventoryTypeConfig, index: number) => {
      const xPos = index * (tabWidth + spacing);

      const button = this.scene.add.text(
        xPos,
        0,
        typeConfig.name,
        this.styles.tab
      );
      button.setInteractive({ useHandCursor: true });
      button.setBackgroundColor('#2d2d44');

      button.on('pointerdown', () => this.selectTab(typeConfig.id as InventoryTabType));
      button.on('pointerover', () => {
        if (!this.tabButtons.find(t => t.type === typeConfig.id)?.isSelected) {
          button.setBackgroundColor('#3d3d5c');
        }
      });
      button.on('pointerout', () => {
        const tab = this.tabButtons.find(t => t.type === typeConfig.id);
        if (!tab?.isSelected) {
          button.setBackgroundColor('#2d2d44');
        }
      });

      this.tabsContainer.add(button);

      this.tabButtons.push({
        button,
        type: typeConfig.id as InventoryTabType,
        isSelected: false
      });
    });
  }

  /**
   * 创建药袋按钮
   */
  private createBagButtons(): void {
    const buttonWidth = 70;
    const spacing = 8;

    HERB_BAGS.forEach((bag: HerbBag, index: number) => {
      const xPos = index * (buttonWidth + spacing);

      const button = this.scene.add.text(
        xPos,
        0,
        bag.name,
        this.styles.bag
      );
      button.setInteractive({ useHandCursor: true });
      button.setBackgroundColor('#2d2d44');

      button.on('pointerdown', () => this.selectBag(bag.id));
      button.on('pointerover', () => {
        if (!this.bagButtons.find(b => b.bagId === bag.id)?.isSelected) {
          button.setBackgroundColor('#3a4a4a');
        }
      });
      button.on('pointerout', () => {
        const bagUI = this.bagButtons.find(b => b.bagId === bag.id);
        if (!bagUI?.isSelected) {
          button.setBackgroundColor('#2d2d44');
        }
      });

      this.bagsContainer.add(button);

      this.bagButtons.push({
        button,
        bagId: bag.id,
        isSelected: false
      });
    });
  }

  /**
   * 选择Tab
   */
  selectTab(tabType: InventoryTabType): void {
    // 更新Tab按钮状态
    this.tabButtons.forEach(tab => {
      tab.isSelected = tab.type === tabType;
      if (tab.isSelected) {
        tab.button.setColor(this.styles.tabSelected.color);
        tab.button.setBackgroundColor(this.styles.tabSelected.backgroundColor);
      } else {
        tab.button.setColor(this.styles.tab.color);
        tab.button.setBackgroundColor('#2d2d44');
      }
    });

    this.currentTab = tabType;

    // 显示/隐藏药袋区域
    this.bagsContainer.setVisible(tabType === 'herbs');

    // 更新标题
    const typeConfig = INVENTORY_TYPES.find(t => t.id === tabType);
    this.titleText.setText(typeConfig?.name ?? '背包');

    // 更新内容
    this.updateContent();
  }

  /**
   * 选择药袋
   */
  selectBag(bagId: string): void {
    // 更新药袋按钮状态
    this.bagButtons.forEach(bag => {
      bag.isSelected = bag.bagId === bagId;
      if (bag.isSelected) {
        bag.button.setColor(this.styles.bagSelected.color);
        bag.button.setBackgroundColor(this.styles.bagSelected.backgroundColor);
      } else {
        bag.button.setColor(this.styles.bag.color);
        bag.button.setBackgroundColor('#2d2d44');
      }
    });

    this.currentBag = bagId;
    this.updateContent();
  }

  /**
   * 更新内容区域
   */
  private updateContent(): void {
    // 清除现有格子
    this.clearItemSlots();

    // 根据当前Tab获取数据
    switch (this.currentTab) {
      case 'herbs':
        this.displayHerbs();
        break;
      case 'seeds':
        this.displaySeeds();
        break;
      case 'tools':
        this.displayTools();
        break;
      case 'knowledge':
        this.displayKnowledge();
        break;
    }
  }

  /**
   * 显示药材
   */
  private displayHerbs(): void {
    const herbsInBag = this.inventoryManager.getHerbsInBag(this.currentBag);

    // 如果药袋内没有药材，显示空提示
    if (herbsInBag.length === 0) {
      const emptyText = this.scene.add.text(
        100,
        50,
        '此药袋内暂无药材',
        { fontSize: '14px', color: '#888888' }
      ).setOrigin(0.5);
      this.contentContainer.add(emptyText);
      return;
    }

    // 创建药材格子
    const cols = 6;
    const slotWidth = this.styles.itemSlot.width;
    const slotHeight = this.styles.itemSlot.height;
    const spacing = 10;

    herbsInBag.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const xPos = col * (slotWidth + spacing);
      const yPos = row * (slotHeight + spacing);

      this.createItemSlot(item.herb.id, item.herb.name, item.quantity, xPos, yPos);
    });
  }

  /**
   * 显示种子
   */
  private displaySeeds(): void {
    const seeds = this.inventoryManager.getAllSeeds();

    if (seeds.length === 0) {
      const emptyText = this.scene.add.text(
        100,
        50,
        '暂无种子',
        { fontSize: '14px', color: '#888888' }
      ).setOrigin(0.5);
      this.contentContainer.add(emptyText);
      return;
    }

    const cols = 6;
    const slotWidth = this.styles.itemSlot.width;
    const slotHeight = this.styles.itemSlot.height;
    const spacing = 10;

    seeds.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const xPos = col * (slotWidth + spacing);
      const yPos = row * (slotHeight + spacing);

      this.createItemSlot(item.seed.id, item.seed.name, item.quantity, xPos, yPos);
    });
  }

  /**
   * 显示工具
   */
  private displayTools(): void {
    const tools = this.inventoryManager.getAllTools();

    if (tools.length === 0) {
      const emptyText = this.scene.add.text(
        100,
        50,
        '暂无工具',
        { fontSize: '14px', color: '#888888' }
      ).setOrigin(0.5);
      this.contentContainer.add(emptyText);
      return;
    }

    const cols = 6;
    const slotWidth = this.styles.itemSlot.width;
    const slotHeight = this.styles.itemSlot.height;
    const spacing = 10;

    tools.forEach((tool, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const xPos = col * (slotWidth + spacing);
      const yPos = row * (slotHeight + spacing);

      this.createItemSlot(tool.id, tool.name, 1, xPos, yPos, false);
    });
  }

  /**
   * 显示知识卡片
   */
  private displayKnowledge(): void {
    const cards = this.inventoryManager.getAllKnowledgeCards();

    if (cards.length === 0) {
      const emptyText = this.scene.add.text(
        100,
        50,
        '暂无知识卡片',
        { fontSize: '14px', color: '#888888' }
      ).setOrigin(0.5);
      this.contentContainer.add(emptyText);
      return;
    }

    const cols = 6;
    const slotWidth = this.styles.itemSlot.width;
    const slotHeight = this.styles.itemSlot.height;
    const spacing = 10;

    cards.forEach((card, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const xPos = col * (slotWidth + spacing);
      const yPos = row * (slotHeight + spacing);

      this.createItemSlot(card.id, card.name, 1, xPos, yPos, false);
    });
  }

  /**
   * 创建物品格子
   */
  private createItemSlot(
    itemId: string,
    itemName: string,
    quantity: number,
    x: number,
    y: number,
    showQuantity: boolean = true
  ): void {
    const slotContainer = this.scene.add.container(x, y);

    // 格子背景
    const bg = this.scene.add.rectangle(
      this.styles.itemSlot.width / 2,
      this.styles.itemSlot.height / 2,
      this.styles.itemSlot.width,
      this.styles.itemSlot.height,
      this.styles.itemSlot.fillColor
    );
    bg.setStrokeStyle(this.styles.itemSlot.borderWidth, this.styles.itemSlot.borderColor);
    slotContainer.add(bg);

    // 物品名称（暂用文字代替图标）
    const icon = this.scene.add.text(
      this.styles.itemSlot.width / 2,
      this.styles.itemSlot.height / 2 - 10,
      itemName.substring(0, 3),  // 只显示前3个字
      this.styles.itemText
    ).setOrigin(0.5);
    slotContainer.add(icon);

    // 数量（如果需要显示）
    if (showQuantity && quantity > 0) {
      const quantityText = this.scene.add.text(
        this.styles.itemSlot.width - 5,
        this.styles.itemSlot.height - 5,
        String(quantity),
        this.styles.quantityText
      ).setOrigin(1, 1);
      slotContainer.add(quantityText);
    }

    // 交互
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => this.selectItem(itemId));
    bg.on('pointerover', () => bg.setFillStyle(0x3d3d5c));
    bg.on('pointerout', () => bg.setFillStyle(this.styles.itemSlot.fillColor));

    this.contentContainer.add(slotContainer);

    this.itemSlots.push({
      container: slotContainer,
      icon,
      quantityText: showQuantity ? slotContainer.getAt(2) as Phaser.GameObjects.Text : undefined,
      itemId,
      isSelected: false
    });
  }

  /**
   * 选择物品
   */
  private selectItem(itemId: string): void {
    // 发送事件（供其他系统响应）
    this.eventBus.emit('inventory:item_selected', {
      item_id: itemId,
      tab_type: this.currentTab
    });

    console.log(`[InventoryUI] Selected item: ${itemId} in tab: ${this.currentTab}`);
  }

  /**
   * 清除物品格子
   */
  private clearItemSlots(): void {
    this.itemSlots.forEach(slot => {
      slot.container.destroy();
    });
    this.itemSlots = [];

    // 清除其他内容（如空提示文字）
    this.contentContainer.removeAll(true);
  }

  /**
   * 显示背包
   */
  show(): void {
    this.container.setVisible(true);
    this.isVisible = true;
    this.updateContent();  // 刷新内容
  }

  /**
   * 隐藏背包
   */
  hide(): void {
    this.container.setVisible(false);
    this.isVisible = false;

    if (this.onClose) {
      this.onClose();
    }
  }

  /**
   * 切换显示/隐藏
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 检查是否可见
   */
  isShowing(): boolean {
    return this.isVisible;
  }

  /**
   * 刷新内容（外部调用）
   */
  refresh(): void {
    if (this.isVisible) {
      this.updateContent();
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.clearItemSlots();
    this.container.destroy();
    this.tabButtons = [];
    this.bagButtons = [];
    this.itemSlots = [];
  }
}

/**
 * 创建背包UI
 */
export function createInventoryUI(scene: Phaser.Scene, onClose?: () => void): InventoryUI {
  return new InventoryUI({
    scene,
    onClose
  });
}