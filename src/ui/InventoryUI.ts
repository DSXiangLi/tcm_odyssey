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
 * Round 4 视觉优化: Neumorphism新拟态设计
 * Phase 2.5 UI组件系统统一化: 使用ItemSlotComponent
 */

import Phaser from 'phaser';
import { InventoryManager } from '../systems/InventoryManager';
import { EventBus } from '../systems/EventBus';
import {
  INVENTORY_TYPES,
  HERB_BAGS,
  HerbBag,
  InventoryTypeConfig,
  getHerbById
} from '../data/inventory-data';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
import ItemSlotComponent, { ItemSlotContent } from './components/ItemSlotComponent';

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

// Tab按钮UI状态
interface TabButtonUI {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  type: InventoryTabType;
  isSelected: boolean;
}

// 药袋按钮UI状态
interface BagButtonUI {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  bagId: string;
  isSelected: boolean;
}

// Neumorphism效果参数
interface NeumorphicConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  baseColor: number;
}

/**
 * 背包界面类
 */
export class InventoryUI {
  private scene: Phaser.Scene;
  private inventoryManager: InventoryManager;
  private eventBus: EventBus;

  private container!: Phaser.GameObjects.Container;
  private backgroundGraphics!: Phaser.GameObjects.Graphics;
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

  // 物品格子 - 使用统一的ItemSlotComponent
  private itemSlots: ItemSlotComponent[] = [];

  // 位置和尺寸
  private x: number;
  private y: number;
  private width: number;
  private height: number;

  private onClose?: () => void;
  private isVisible: boolean = true;

  // Neumorphism常量
  private readonly NEUMORPHIC = {
    BASE_COLOR: UI_COLORS.PANEL_NEUMORPHIC,
    SHADOW_OFFSET: 4,
    SHADOW_ALPHA: 0.3,
    HIGHLIGHT_ALPHA: 0.05,
    INSET_SHADOW_ALPHA: 0.2,
    INSET_HIGHLIGHT_ALPHA: 0.05,
    INSET_SHADOW_OFFSET: 2
  };

  // 样式配置
  private readonly styles = {
    title: { fontSize: '20px', color: UI_COLOR_STRINGS.TEXT_PRIMARY, fontStyle: 'bold' },
    tab: { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_SECONDARY },
    tabSelected: { color: UI_COLOR_STRINGS.TEXT_PRIMARY },
    bag: { fontSize: '12px', color: UI_COLOR_STRINGS.TEXT_DISABLED },
    bagSelected: { color: UI_COLOR_STRINGS.TEXT_PRIMARY },
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
   * 绘制凸起效果（Raised Neumorphism）
   * 用于选中状态的元素
   */
  private drawRaisedEffect(graphics: Phaser.GameObjects.Graphics, config: NeumorphicConfig): void {
    const { x, y, width, height, baseColor } = config;
    const { SHADOW_OFFSET, SHADOW_ALPHA, HIGHLIGHT_ALPHA } = this.NEUMORPHIC;

    graphics.clear();

    // 1. 外阴影（右下）
    graphics.fillStyle(0x000000, SHADOW_ALPHA);
    graphics.fillRect(x + SHADOW_OFFSET, y + SHADOW_OFFSET, width, height);

    // 2. 主背景
    graphics.fillStyle(baseColor, 1);
    graphics.fillRect(x, y, width, height);

    // 3. 外高光（左上）
    graphics.fillStyle(0xffffff, HIGHLIGHT_ALPHA);
    // 顶部高光
    graphics.fillRect(x, y, width, 2);
    // 左侧高光
    graphics.fillRect(x, y, 2, height);

    // 4. 内阴影（底部边缘，增加立体感）
    graphics.fillStyle(0x000000, 0.1);
    graphics.fillRect(x + 2, y + height - 2, width - 4, 2);
    graphics.fillRect(x + width - 2, y + 2, 2, height - 4);
  }

  /**
   * 绘制凹陷效果（Inset Neumorphism）
   * 用于未选中状态的元素
   */
  private drawInsetEffect(graphics: Phaser.GameObjects.Graphics, config: NeumorphicConfig): void {
    const { x, y, width, height, baseColor } = config;
    const { INSET_SHADOW_OFFSET, INSET_SHADOW_ALPHA, INSET_HIGHLIGHT_ALPHA } = this.NEUMORPHIC;

    graphics.clear();

    // 1. 主背景（略微变暗）
    graphics.fillStyle(baseColor, 1);
    graphics.fillRect(x, y, width, height);

    // 2. 内阴影（右下）
    graphics.fillStyle(0x000000, INSET_SHADOW_ALPHA);
    // 底部内阴影
    graphics.fillRect(x + INSET_SHADOW_OFFSET, y + height - INSET_SHADOW_OFFSET, width - INSET_SHADOW_OFFSET * 2, INSET_SHADOW_OFFSET);
    // 右侧内阴影
    graphics.fillRect(x + width - INSET_SHADOW_OFFSET, y + INSET_SHADOW_OFFSET, INSET_SHADOW_OFFSET, height - INSET_SHADOW_OFFSET * 2);

    // 3. 内高光（左上）
    graphics.fillStyle(0xffffff, INSET_HIGHLIGHT_ALPHA);
    // 顶部高光
    graphics.fillRect(x, y, width - INSET_SHADOW_OFFSET, 1);
    // 左侧高光
    graphics.fillRect(x, y, 1, height - INSET_SHADOW_OFFSET);
  }

  /**
   * 绘制主面板背景（带外阴影的凸起效果）
   */
  private drawMainPanelBackground(graphics: Phaser.GameObjects.Graphics, config: NeumorphicConfig): void {
    const { x, y, width, height, baseColor } = config;

    graphics.clear();

    // 1. 外阴影（右下，更大偏移）
    graphics.fillStyle(0x000000, 0.35);
    graphics.fillRect(x + 6, y + 6, width, height);

    // 2. 主背景
    graphics.fillStyle(baseColor, 1);
    graphics.fillRect(x, y, width, height);

    // 3. 外高光（左上）
    graphics.fillStyle(0xffffff, 0.08);
    graphics.fillRect(x, y, width, 3);
    graphics.fillRect(x, y, 3, height);
  }

  /**
   * 创建UI元素
   */
  private createUI(): void {
    // 主容器
    this.container = this.scene.add.container(this.x, this.y);
    this.container.setDepth(1000);
    this.container.setScrollFactor(0);

    // 背景（使用Graphics实现Neumorphism）
    this.backgroundGraphics = this.scene.add.graphics();
    this.drawMainPanelBackground(this.backgroundGraphics, {
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
      baseColor: this.NEUMORPHIC.BASE_COLOR
    });
    this.container.add(this.backgroundGraphics);

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
   * 创建Tab按钮（Neumorphism风格）
   */
  private createTabs(): void {
    const tabWidth = 80;
    const tabHeight = 28;
    const spacing = 10;

    INVENTORY_TYPES.forEach((typeConfig: InventoryTypeConfig, index: number) => {
      const xPos = index * (tabWidth + spacing);

      // 创建容器
      const tabContainer = this.scene.add.container(xPos, 0);
      this.tabsContainer.add(tabContainer);

      // 创建Graphics背景
      const graphics = this.scene.add.graphics();
      this.drawInsetEffect(graphics, {
        x: 0,
        y: 0,
        width: tabWidth,
        height: tabHeight,
        baseColor: this.NEUMORPHIC.BASE_COLOR
      });
      tabContainer.add(graphics);

      // 创建文字
      const text = this.scene.add.text(
        tabWidth / 2,
        tabHeight / 2,
        typeConfig.name,
        this.styles.tab
      ).setOrigin(0.5);
      tabContainer.add(text);

      // 交互区域（使用透明Rectangle）
      const hitArea = this.scene.add.rectangle(
        tabWidth / 2,
        tabHeight / 2,
        tabWidth,
        tabHeight,
        0x000000,
        0
      );
      hitArea.setInteractive({ useHandCursor: true });
      tabContainer.add(hitArea);

      hitArea.on('pointerdown', () => this.selectTab(typeConfig.id as InventoryTabType));
      hitArea.on('pointerover', () => {
        // 悬停效果：略微凸起
        if (!this.tabButtons.find(t => t.type === typeConfig.id)?.isSelected) {
          this.drawRaisedEffect(graphics, {
            x: 0,
            y: 0,
            width: tabWidth,
            height: tabHeight,
            baseColor: this.NEUMORPHIC.BASE_COLOR
          });
        }
      });
      hitArea.on('pointerout', () => {
        // 恢复原状态
        const tab = this.tabButtons.find(t => t.type === typeConfig.id);
        if (tab?.isSelected) {
          this.drawRaisedEffect(graphics, {
            x: 0,
            y: 0,
            width: tabWidth,
            height: tabHeight,
            baseColor: this.NEUMORPHIC.BASE_COLOR
          });
        } else {
          this.drawInsetEffect(graphics, {
            x: 0,
            y: 0,
            width: tabWidth,
            height: tabHeight,
            baseColor: this.NEUMORPHIC.BASE_COLOR
          });
        }
      });

      this.tabButtons.push({
        container: tabContainer,
        graphics,
        text,
        type: typeConfig.id as InventoryTabType,
        isSelected: false
      });
    });
  }

  /**
   * 创建药袋按钮（Neumorphism风格）
   */
  private createBagButtons(): void {
    const buttonWidth = 70;
    const buttonHeight = 24;
    const spacing = 8;

    HERB_BAGS.forEach((bag: HerbBag, index: number) => {
      const xPos = index * (buttonWidth + spacing);

      // 创建容器
      const bagContainer = this.scene.add.container(xPos, 0);
      this.bagsContainer.add(bagContainer);

      // 创建Graphics背景
      const graphics = this.scene.add.graphics();
      this.drawInsetEffect(graphics, {
        x: 0,
        y: 0,
        width: buttonWidth,
        height: buttonHeight,
        baseColor: this.NEUMORPHIC.BASE_COLOR
      });
      bagContainer.add(graphics);

      // 创建文字
      const text = this.scene.add.text(
        buttonWidth / 2,
        buttonHeight / 2,
        bag.name,
        this.styles.bag
      ).setOrigin(0.5);
      bagContainer.add(text);

      // 交互区域（使用透明Rectangle）
      const hitArea = this.scene.add.rectangle(
        buttonWidth / 2,
        buttonHeight / 2,
        buttonWidth,
        buttonHeight,
        0x000000,
        0
      );
      hitArea.setInteractive({ useHandCursor: true });
      bagContainer.add(hitArea);

      hitArea.on('pointerdown', () => this.selectBag(bag.id));
      hitArea.on('pointerover', () => {
        if (!this.bagButtons.find(b => b.bagId === bag.id)?.isSelected) {
          this.drawRaisedEffect(graphics, {
            x: 0,
            y: 0,
            width: buttonWidth,
            height: buttonHeight,
            baseColor: this.NEUMORPHIC.BASE_COLOR
          });
        }
      });
      hitArea.on('pointerout', () => {
        const bagUI = this.bagButtons.find(b => b.bagId === bag.id);
        if (bagUI?.isSelected) {
          this.drawRaisedEffect(graphics, {
            x: 0,
            y: 0,
            width: buttonWidth,
            height: buttonHeight,
            baseColor: this.NEUMORPHIC.BASE_COLOR
          });
        } else {
          this.drawInsetEffect(graphics, {
            x: 0,
            y: 0,
            width: buttonWidth,
            height: buttonHeight,
            baseColor: this.NEUMORPHIC.BASE_COLOR
          });
        }
      });

      this.bagButtons.push({
        container: bagContainer,
        graphics,
        text,
        bagId: bag.id,
        isSelected: false
      });
    });
  }

  /**
   * 选择Tab
   */
  selectTab(tabType: InventoryTabType): void {
    const tabWidth = 80;
    const tabHeight = 28;

    // 更新Tab按钮状态
    this.tabButtons.forEach(tab => {
      tab.isSelected = tab.type === tabType;
      if (tab.isSelected) {
        // 选中状态：凸起效果
        this.drawRaisedEffect(tab.graphics, {
          x: 0,
          y: 0,
          width: tabWidth,
          height: tabHeight,
          baseColor: this.NEUMORPHIC.BASE_COLOR
        });
        tab.text.setColor(this.styles.tabSelected.color);
      } else {
        // 未选中状态：凹陷效果
        this.drawInsetEffect(tab.graphics, {
          x: 0,
          y: 0,
          width: tabWidth,
          height: tabHeight,
          baseColor: this.NEUMORPHIC.BASE_COLOR
        });
        tab.text.setColor(this.styles.tab.color);
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
    const buttonWidth = 70;
    const buttonHeight = 24;

    // 更新药袋按钮状态
    this.bagButtons.forEach(bag => {
      bag.isSelected = bag.bagId === bagId;
      if (bag.isSelected) {
        // 选中状态：凸起效果
        this.drawRaisedEffect(bag.graphics, {
          x: 0,
          y: 0,
          width: buttonWidth,
          height: buttonHeight,
          baseColor: this.NEUMORPHIC.BASE_COLOR
        });
        bag.text.setColor(this.styles.bagSelected.color);
      } else {
        // 未选中状态：凹陷效果
        this.drawInsetEffect(bag.graphics, {
          x: 0,
          y: 0,
          width: buttonWidth,
          height: buttonHeight,
          baseColor: this.NEUMORPHIC.BASE_COLOR
        });
        bag.text.setColor(this.styles.bag.color);
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

    // 创建药材格子（使用统一尺寸）
    const cols = 6;
    const slotSize = ItemSlotComponent.SLOT_SIZE;
    const spacing = 10;

    herbsInBag.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const xPos = col * (slotSize + spacing);
      const yPos = row * (slotSize + spacing);

      // 获取药材的icon字段
      const herbData = getHerbById(item.herb.id);
      const iconPath = herbData?.icon;

      this.createItemSlot(item.herb.id, item.herb.name, item.quantity, xPos, yPos, true, iconPath);
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
    const slotSize = ItemSlotComponent.SLOT_SIZE;
    const spacing = 10;

    seeds.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const xPos = col * (slotSize + spacing);
      const yPos = row * (slotSize + spacing);

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
    const slotSize = ItemSlotComponent.SLOT_SIZE;
    const spacing = 10;

    tools.forEach((tool, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const xPos = col * (slotSize + spacing);
      const yPos = row * (slotSize + spacing);

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
    const slotSize = ItemSlotComponent.SLOT_SIZE;
    const spacing = 10;

    cards.forEach((card, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const xPos = col * (slotSize + spacing);
      const yPos = row * (slotSize + spacing);

      this.createItemSlot(card.id, card.name, 1, xPos, yPos, false);
    });
  }

  /**
   * 创建物品格子（使用统一的ItemSlotComponent）
   */
  private createItemSlot(
    itemId: string,
    itemName: string,
    quantity: number,
    x: number,
    y: number,
    showQuantity: boolean = true,
    icon?: string
  ): void {
    // ItemSlotComponent使用中心定位（origin 0.5），需要调整位置
    const slotSize = ItemSlotComponent.SLOT_SIZE;
    const centerX = x + slotSize / 2;
    const centerY = y + slotSize / 2;

    // 创建ItemSlotComponent
    const slot = new ItemSlotComponent(this.scene, {
      selectable: true,
      onClick: () => this.selectItem(itemId)
    }, centerX, centerY);

    // 设置内容
    const content: ItemSlotContent = {
      itemId: itemId,
      name: itemName,
      quantity: showQuantity ? quantity : undefined,
      icon: icon  // 传递icon路径
    };
    slot.setContent(content);

    // 添加到内容容器
    this.contentContainer.add(slot.container);

    // 存储引用
    this.itemSlots.push(slot);
  }

  /**
   * 选择物品
   */
  private selectItem(itemId: string): void {
    // 更新所有物品格子的状态
    this.itemSlots.forEach(slot => {
      if (slot.content && slot.content.itemId === itemId) {
        // 选中该格子
        slot.select();
      } else {
        // 取消选中其他格子
        slot.deselect();
      }
    });

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
    // 销毁所有ItemSlotComponent
    this.itemSlots.forEach(slot => {
      slot.destroy();
    });
    this.itemSlots = [];

    // 清除其他内容（如空提示文字）
    this.contentContainer.removeAll(true);
  }

  /**
   * 显示背包
   */
  show(): void {
    // 背包UI打开
    if (typeof window !== 'undefined') {
      (window as any).__INVENTORY_OPEN__ = true;
    }
    this.container.setVisible(true);
    this.isVisible = true;
    this.updateContent();  // 刷新内容
  }

  /**
   * 隐藏背包
   */
  hide(): void {
    // 背包UI关闭
    if (typeof window !== 'undefined') {
      (window as any).__INVENTORY_OPEN__ = false;
    }
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