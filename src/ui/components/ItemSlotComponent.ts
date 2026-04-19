// src/ui/components/ItemSlotComponent.ts
/**
 * ItemSlotComponent物品格子组件
 *
 * 60×60标准尺寸物品格子，使用Neumorphism边框风格
 *
 * 视觉规范:
 * - 尺寸: 60×60
 * - 边框风格: Neumorphism (凹陷=空, 凸起=选中)
 * - 内部布局: 40×40图标区 + 12×12右下角数量角标
 * - 选中边框: BUTTON_PRIMARY(#90c070) 4px高亮
 *
 * 状态管理:
 * - EMPTY → FILLED → SELECTED
 * - 支持 DISABLED 状态
 *
 * Phase 2.5 UI组件系统统一化 Task 6
 */

import Phaser from 'phaser';
import {
  drawNeumorphicBorderInset,
  drawNeumorphicBorderRaised,
} from '../base/UIBorderStyles';
import { UI_COLORS, UI_COLOR_STRINGS } from '../../data/ui-color-theme';

/**
 * 物品格子状态枚举
 */
export enum ItemSlotState {
  /** 空状态 - 无物品 */
  EMPTY = 'EMPTY',
  /** 已填充 - 有物品 */
  FILLED = 'FILLED',
  /** 已选中 - 有物品且被选中 */
  SELECTED = 'SELECTED',
  /** 已禁用 - 不可交互 */
  DISABLED = 'DISABLED',
}

/**
 * 物品格子内容接口
 */
export interface ItemSlotContent {
  /** 物品ID */
  itemId: string;
  /** 物品名称 */
  name: string;
  /** 数量（可选，>1时显示数量角标） */
  quantity?: number;
  /** 图标路径（可选） */
  icon?: string;
}

/**
 * 物品格子配置接口
 */
export interface ItemSlotConfig {
  /** 是否可选中，默认true */
  selectable?: boolean;
  /** 是否可拖拽，默认false */
  draggable?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 拖拽开始回调 */
  onDragStart?: () => void;
  /** 拖拽结束回调 */
  onDragEnd?: () => void;
}

/**
 * ItemSlotComponent物品格子组件类
 *
 * 使用方式:
 * ```typescript
 * const slot = new ItemSlotComponent(scene, { selectable: true });
 * slot.setContent({ itemId: 'herb_gancao', name: '甘草', quantity: 5 });
 * slot.select(); // 选中
 * slot.deselect(); // 取消选中
 * ```
 */
export default class ItemSlotComponent {
  /** Phaser场景引用 */
  protected scene: Phaser.Scene;

  /** 容器对象 */
  public container: Phaser.GameObjects.Container;

  /** 组件宽度 */
  public width: number;

  /** 组件高度 */
  public height: number;

  /** Graphics对象（用于绘制边框） */
  protected graphics: Phaser.GameObjects.Graphics | null = null;

  /** 数量角标文本 */
  protected quantityText: Phaser.GameObjects.Text | null = null;

  /** 物品图标 */
  protected itemIcon: Phaser.GameObjects.Image | null = null;

  /** 交互区域 */
  protected hitArea: Phaser.GameObjects.Zone | null = null;

  /** 当前状态 */
  public state: ItemSlotState;

  /** 是否可选中 */
  public selectable: boolean;

  /** 是否可拖拽 */
  public draggable: boolean;

  /** 当前内容 */
  public content: ItemSlotContent | null = null;

  /** 配置 */
  protected config: ItemSlotConfig;

  /** 标准尺寸常量 */
  public static readonly SLOT_SIZE = 60;

  /** 图标区域尺寸 */
  public static readonly ICON_SIZE = 40;

  /** 数量角标尺寸 */
  public static readonly QUANTITY_BADGE_SIZE = 12;

  /** 选中边框宽度 */
  public static readonly SELECTION_BORDER_WIDTH = 4;

  /**
   * 构造函数
   * @param scene Phaser场景
   * @param config 配置选项
   * @param x 位置X，默认0
   * @param y 位置Y，默认0
   */
  constructor(
    scene: Phaser.Scene,
    config?: ItemSlotConfig,
    x: number = 0,
    y: number = 0
  ) {
    this.scene = scene;
    this.config = config ?? {};
    this.selectable = this.config.selectable ?? true;
    this.draggable = this.config.draggable ?? false;
    this.state = ItemSlotState.EMPTY;
    this.width = ItemSlotComponent.SLOT_SIZE;
    this.height = ItemSlotComponent.SLOT_SIZE;

    // 创建容器
    this.container = scene.add.container(x, y);

    // 创建Graphics
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    // 创建交互区域
    this.hitArea = scene.add.zone(0, 0, this.width, this.height);
    this.hitArea.setOrigin(0.5, 0.5);
    this.hitArea.setInteractive({ useHandCursor: this.selectable });
    this.container.add(this.hitArea);

    // 设置交互事件
    this.setupInteraction();

    // 绘制初始边框（空状态）
    this.drawBorder();

    // 添加到场景
    scene.add.existing(this.container);
  }

  /**
   * 设置交互事件
   */
  protected setupInteraction(): void {
    if (!this.hitArea) return;

    // 点击事件
    this.hitArea.on('pointerdown', () => {
      this.handleClick();
    });

    // Hover效果
    this.hitArea.on('pointerover', () => {
      this.handleHover(true);
    });

    this.hitArea.on('pointerout', () => {
      this.handleHover(false);
    });
  }

  /**
   * 处理点击
   */
  public handleClick(): void {
    // 禁用状态不可交互
    if (this.state === ItemSlotState.DISABLED) return;

    // 空状态不可点击
    if (this.state === ItemSlotState.EMPTY) return;

    // 不可选中时不触发回调
    if (!this.selectable) return;

    // 切换选中状态
    if (this.state === ItemSlotState.FILLED) {
      this.select();
    } else if (this.state === ItemSlotState.SELECTED) {
      this.deselect();
    }

    // 触发回调
    if (this.config.onClick) {
      this.config.onClick();
    }
  }

  /**
   * 处理Hover效果
   * @param _isHovering 是否Hover中（暂未使用，预留扩展）
   */
  protected handleHover(_isHovering: boolean): void {
    // Hover效果暂时不改变视觉，仅用于后续扩展
    // 可添加：发光效果、轻微放大等
  }

  /**
   * 绘制边框
   */
  protected drawBorder(): void {
    if (!this.graphics) return;

    this.graphics.clear();

    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    const x = -halfWidth;
    const y = -halfHeight;

    switch (this.state) {
      case ItemSlotState.EMPTY:
        drawNeumorphicBorderInset(this.graphics, x, y, this.width, this.height);
        break;

      case ItemSlotState.FILLED:
        drawNeumorphicBorderRaised(this.graphics, x, y, this.width, this.height);
        break;

      case ItemSlotState.SELECTED:
        // 绘制凸起边框
        drawNeumorphicBorderRaised(this.graphics, x, y, this.width, this.height);
        // 绘制选中高亮边框
        this.drawSelectionHighlight(x, y);
        break;

      case ItemSlotState.DISABLED:
        // 禁用状态使用更暗的颜色
        this.graphics.fillStyle(UI_COLORS.BUTTON_DISABLED, 0.5);
        this.graphics.fillRect(x, y, this.width, this.height);
        // 绘制凹陷边框
        drawNeumorphicBorderInset(this.graphics, x, y, this.width, this.height);
        break;
    }
  }

  /**
   * 绘制选中高亮边框
   * @param x 起点X
   * @param y 起点Y
   */
  protected drawSelectionHighlight(x: number, y: number): void {
    if (!this.graphics) return;

    const borderWidth = ItemSlotComponent.SELECTION_BORDER_WIDTH;
    this.graphics.lineStyle(borderWidth, UI_COLORS.BUTTON_PRIMARY, 1);
    this.graphics.strokeRect(x, y, this.width, this.height);
  }

  /**
   * 设置内容
   * @param content 物品内容
   */
  public setContent(content: ItemSlotContent): void {
    // 设置内容时总是回到FILLED状态（如果之前选中，新内容取消选中）
    this.state = ItemSlotState.FILLED;

    this.content = content;

    // 更新数量角标
    this.updateQuantityBadge();

    // 更新图标（如果提供）
    if (content.icon) {
      this.updateIcon(content.icon);
    }

    // 重绘边框
    this.drawBorder();
  }

  /**
   * 清除内容
   */
  public clearContent(): void {
    this.content = null;
    this.state = ItemSlotState.EMPTY;

    // 清除数量角标
    if (this.quantityText) {
      this.quantityText.setVisible(false);
    }

    // 清除图标
    if (this.itemIcon) {
      this.itemIcon.setVisible(false);
    }

    // 重绘边框
    this.drawBorder();
  }

  /**
   * 更新数量角标
   */
  protected updateQuantityBadge(): void {
    if (!this.content || this.content.quantity === undefined || this.content.quantity <= 1) {
      if (this.quantityText) {
        this.quantityText.setVisible(false);
      }
      return;
    }

    // 计算角标位置（右下角）
    const badgeSize = ItemSlotComponent.QUANTITY_BADGE_SIZE;
    const x = this.width / 2 - badgeSize;
    const y = this.height / 2 - badgeSize;

    if (!this.quantityText) {
      this.quantityText = this.scene.add.text(x, y, String(this.content.quantity), {
        fontSize: '10px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY,
        backgroundColor: UI_COLOR_STRINGS.SOFT_BROWN,
        padding: { x: 2, y: 1 },
      });
      this.quantityText.setOrigin(0.5, 0.5);
      this.container.add(this.quantityText);
    } else {
      this.quantityText.setText(String(this.content.quantity));
      this.quantityText.setPosition(x, y);
      this.quantityText.setVisible(true);
    }
  }

  /**
   * 更新图标
   * @param iconPath 图标路径
   */
  protected updateIcon(iconPath: string): void {
    const iconSize = ItemSlotComponent.ICON_SIZE;

    if (!this.itemIcon) {
      this.itemIcon = this.scene.add.image(0, 0, iconPath);
      this.itemIcon.setDisplaySize(iconSize, iconSize);
      this.container.add(this.itemIcon);
    } else {
      this.itemIcon.setTexture(iconPath);
      this.itemIcon.setDisplaySize(iconSize, iconSize);
      this.itemIcon.setVisible(true);
    }
  }

  /**
   * 选中格子
   */
  public select(): void {
    // 空状态不可选中
    if (this.state === ItemSlotState.EMPTY) return;

    // 不可选中时不操作
    if (!this.selectable) return;

    // 已禁用时不操作
    if (this.state === ItemSlotState.DISABLED) return;

    this.state = ItemSlotState.SELECTED;
    this.drawBorder();
  }

  /**
   * 取消选中
   */
  public deselect(): void {
    // 空状态时无操作
    if (this.state === ItemSlotState.EMPTY) return;

    // 禁用状态时无操作
    if (this.state === ItemSlotState.DISABLED) return;

    // 如果有内容，回到FILLED状态
    if (this.content) {
      this.state = ItemSlotState.FILLED;
    } else {
      this.state = ItemSlotState.EMPTY;
    }
    this.drawBorder();
  }

  /**
   * 禁用格子
   */
  public disable(): void {
    this.state = ItemSlotState.DISABLED;

    // 更新交互区域
    if (this.hitArea) {
      this.hitArea.setInteractive({ useHandCursor: false });
    }

    this.drawBorder();
  }

  /**
   * 启用格子
   */
  public enable(): void {
    if (this.content) {
      this.state = ItemSlotState.FILLED;
    } else {
      this.state = ItemSlotState.EMPTY;
    }

    // 更新交互区域
    if (this.hitArea) {
      this.hitArea.setInteractive({ useHandCursor: this.selectable });
    }

    this.drawBorder();
  }

  /**
   * 是否已选中
   */
  public isSelected(): boolean {
    return this.state === ItemSlotState.SELECTED;
  }

  /**
   * 是否为空
   */
  public isEmpty(): boolean {
    return this.state === ItemSlotState.EMPTY;
  }

  /**
   * 是否已填充（有物品但未选中）
   */
  public isFilled(): boolean {
    return this.state === ItemSlotState.FILLED;
  }

  /**
   * 是否已禁用
   */
  public isDisabled(): boolean {
    return this.state === ItemSlotState.DISABLED;
  }

  /**
   * 是否显示数量角标
   */
  public hasQuantityBadge(): boolean {
    return this.content !== null &&
           this.content.quantity !== undefined &&
           this.content.quantity > 1;
  }

  /**
   * 设置位置
   * @param x X坐标
   * @param y Y坐标
   * @returns this（用于链式调用）
   */
  public setPosition(x: number, y: number): this {
    this.container.setPosition(x, y);
    return this;
  }

  /**
   * 设置深度
   * @param depth 深度值
   * @returns this（用于链式调用）
   */
  public setDepth(depth: number): this {
    this.container.setDepth(depth);
    return this;
  }

  /**
   * 暴露到全局（供测试访问）
   * @param name 全局变量名
   */
  public exposeToGlobal(name: string = '__ITEM_SLOT__'): void {
    if (typeof window !== 'undefined') {
      (window as any)[name] = this;
    }
  }

  /**
   * 销毁组件
   */
  public destroy(): void {
    // 销毁Graphics
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }

    // 销毁数量角标
    if (this.quantityText) {
      this.quantityText.destroy();
      this.quantityText = null;
    }

    // 销毁图标
    if (this.itemIcon) {
      this.itemIcon.destroy();
      this.itemIcon = null;
    }

    // 销毁交互区域
    if (this.hitArea) {
      this.hitArea.destroy();
      this.hitArea = null;
    }

    // 销毁容器
    this.container.destroy();

    // 清空状态
    this.content = null;
    this.state = ItemSlotState.EMPTY;

    // 清理全局引用
    if (typeof window !== 'undefined') {
      delete (window as any).__ITEM_SLOT__;
      // 清理自定义名称的全局引用
      const keys = Object.keys(window);
      for (const key of keys) {
        if ((window as any)[key] === this) {
          delete (window as any)[key];
        }
      }
    }
  }
}