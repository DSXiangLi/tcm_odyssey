// src/ui/components/CompatibilitySlotComponent.ts
/**
 * CompatibilitySlotComponent配伍槽位组件
 *
 * 120×100尺寸配伍槽位，用于煎药和选方游戏。
 * 内凹边框风格，角色颜色标识（君臣佐使）。
 *
 * 视觉规范:
 * - 尺寸: 120×100
 * - 边框风格: inset（内凹槽位）
 * - 角色颜色: 君=#c0a080(金棕), 臣=#80a040(绿色), 佐=#4080a0(蓝色), 使=#606060(灰色)
 * - 内部使用ItemSlotComponent(60×60)放置药材
 *
 * 角色标签:
 * - 君臣佐使 (顶部显示)
 * - 角色颜色应用于槽位边框
 *
 * 顺序选项:
 * - 先煎/同煎/后下 (底部，用于煎药)
 * - 可toggle顺序选择
 *
 * 状态管理:
 * - EMPTY → FILLED (当药材放置)
 * - 可以有顺序选择（先煎/同煎/后下）
 *
 * Phase 2.5 UI组件系统统一化 Task 10
 */

import Phaser from 'phaser';
import { drawInsetSlotBorder } from '../base/UIBorderStyles';
import { UI_COLOR_STRINGS } from '../../data/ui-color-theme';
import ItemSlotComponent, { ItemSlotContent } from './ItemSlotComponent';

/**
 * 配伍槽位状态枚举
 */
export enum CompatibilitySlotState {
  /** 空状态 - 无药材 */
  EMPTY = 'EMPTY',
  /** 已填充 - 有药材 */
  FILLED = 'FILLED',
}

/**
 * 配伍角色类型
 */
export type CompatibilityRole = '君' | '臣' | '佐' | '使';

/**
 * 配伍顺序类型
 */
export type CompatibilityOrder = '先煎' | '同煎' | '后下';

/**
 * 配伍槽位内容接口
 */
export interface CompatibilitySlotContent {
  /** 角色 */
  role: CompatibilityRole;
  /** 药材ID */
  herbId?: string;
  /** 药材名称 */
  herbName?: string;
  /** 煎药顺序 */
  order?: CompatibilityOrder;
}

/**
 * 配伍槽位配置接口
 */
export interface CompatibilitySlotConfig {
  /** 放置药材回调 */
  onHerbPlaced?: (role: string, herbId: string) => void;
  /** 顺序变更回调 */
  onOrderChanged?: (role: string, order: string) => void;
  /** 移除药材回调 */
  onRemove?: (role: string) => void;
}

/**
 * 角色颜色映射
 */
const ROLE_COLOR_MAP: Record<CompatibilityRole, number> = {
  君: 0xc0a080, // 金棕
  臣: 0x80a040, // 绿色
  佐: 0x4080a0, // 蓝色
  使: 0x606060, // 灰色
};

/**
 * 角色颜色字符串映射
 */
const ROLE_COLOR_STRING_MAP: Record<CompatibilityRole, string> = {
  君: '#c0a080',
  臣: '#80a040',
  佐: '#4080a0',
  使: '#606060',
};

/**
 * CompatibilitySlotComponent配伍槽位组件类
 *
 * 使用方式:
 * ```typescript
 * const slot = new CompatibilitySlotComponent(scene, '君');
 * slot.setContent({ role: '君', herbId: 'herb_mahuang', herbName: '麻黄' });
 * slot.setOrder('先煎');
 * slot.clearContent();
 * ```
 */
export default class CompatibilitySlotComponent {
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

  /** 角色标签文本 */
  protected roleLabel: Phaser.GameObjects.Text | null = null;

  /** 顺序按钮数组 */
  protected orderButtons: Phaser.GameObjects.Text[] = [];

  /** 内嵌ItemSlotComponent */
  public itemSlot: ItemSlotComponent | null = null;

  /** 当前角色 */
  public role: CompatibilityRole;

  /** 角色颜色 */
  public roleColor: number;

  /** 角色颜色字符串 */
  public roleColorString: string;

  /** 当前状态 */
  public state: CompatibilitySlotState;

  /** 当前内容 */
  public content: CompatibilitySlotContent | null = null;

  /** 当前顺序 */
  public order: CompatibilityOrder | undefined;

  /** 配置 */
  public config: CompatibilitySlotConfig;

  /** 标准尺寸常量 */
  public static readonly SLOT_WIDTH = 120;

  public static readonly SLOT_HEIGHT = 100;

  /** 内嵌槽位尺寸 */
  public static readonly INNER_SLOT_SIZE = 60;

  /** 顺序选项 */
  public static readonly ORDER_OPTIONS: CompatibilityOrder[] = ['先煎', '同煎', '后下'];

  /**
   * 构造函数
   * @param scene Phaser场景
   * @param role 角色类型（君臣佐使）
   * @param config 配置选项
   * @param x 位置X，默认0
   * @param y 位置Y，默认0
   */
  constructor(
    scene: Phaser.Scene,
    role: CompatibilityRole,
    config?: CompatibilitySlotConfig,
    x: number = 0,
    y: number = 0
  ) {
    this.scene = scene;
    this.role = role;
    this.config = config ?? {};
    this.roleColor = ROLE_COLOR_MAP[role];
    this.roleColorString = ROLE_COLOR_STRING_MAP[role];
    this.state = CompatibilitySlotState.EMPTY;
    this.width = CompatibilitySlotComponent.SLOT_WIDTH;
    this.height = CompatibilitySlotComponent.SLOT_HEIGHT;

    // 创建容器
    this.container = scene.add.container(x, y);

    // 创建Graphics
    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    // 创建角色标签
    this.createRoleLabel();

    // 创建内嵌ItemSlotComponent
    this.createInnerSlot();

    // 创建顺序按钮
    this.createOrderButtons();

    // 绘制初始边框
    this.drawBorder();

    // 添加到场景
    scene.add.existing(this.container);
  }

  /**
   * 获取角色颜色
   * @param role 角色类型
   * @returns 颜色数值
   */
  public static getRoleColor(role: CompatibilityRole): number {
    return ROLE_COLOR_MAP[role];
  }

  /**
   * 创建角色标签
   */
  protected createRoleLabel(): void {
    // 角色标签位于顶部
    const labelY = -this.height / 2 + 15; // 顶部偏移15像素

    this.roleLabel = this.scene.add.text(0, labelY, this.role, {
      fontSize: '16px',
      color: this.roleColorString,
      fontStyle: 'bold',
    });
    this.roleLabel.setOrigin(0.5, 0.5);
    this.container.add(this.roleLabel);
  }

  /**
   * 创建内嵌ItemSlotComponent
   */
  protected createInnerSlot(): void {
    // 内嵌槽位位于中央偏上
    const innerY = 0; // 中央位置

    this.itemSlot = new ItemSlotComponent(this.scene, { selectable: false }, 0, innerY);
    this.container.add(this.itemSlot.container);
  }

  /**
   * 创建顺序按钮
   */
  protected createOrderButtons(): void {
    const options = CompatibilitySlotComponent.ORDER_OPTIONS;
    const buttonY = this.height / 2 - 20; // 底部偏移20像素
    const buttonWidth = 35;
    const startX = -((options.length * buttonWidth) / 2) + buttonWidth / 2;

    options.forEach((orderOption, index) => {
      const buttonX = startX + index * buttonWidth;

      const button = this.scene.add.text(buttonX, buttonY, orderOption, {
        fontSize: '12px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
        backgroundColor: '#303030',
        padding: { x: 4, y: 2 },
      });
      button.setOrigin(0.5, 0.5);
      button.setInteractive({ useHandCursor: true });

      // 点击事件
      button.on('pointerdown', () => {
        this.setOrder(orderOption);
      });

      // Hover效果
      button.on('pointerover', () => {
        button.setColor(UI_COLOR_STRINGS.TEXT_WARM);
      });

      button.on('pointerout', () => {
        // 如果是当前选中的顺序，保持高亮色
        if (this.order === orderOption) {
          button.setColor(this.roleColorString);
        } else {
          button.setColor(UI_COLOR_STRINGS.TEXT_SECONDARY);
        }
      });

      this.orderButtons.push(button);
      this.container.add(button);
    });
  }

  /**
   * 绘制边框
   */
  public drawBorder(): void {
    if (!this.graphics) return;

    this.graphics.clear();

    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    const x = -halfWidth;
    const y = -halfHeight;

    // 绘制内凹槽位边框（带角色颜色）
    const config = {
      darkBorder: this.roleColor,
      lightBorder: this.roleColor,
      background: 0x0d1f17, // 深绿底色
      borderWidth: 3,
    };

    drawInsetSlotBorder(this.graphics, x, y, this.width, this.height, config);
  }

  /**
   * 设置内容
   * @param content 配伍内容
   */
  public setContent(content: CompatibilitySlotContent): void {
    this.state = CompatibilitySlotState.FILLED;
    this.content = content;

    // 设置顺序（如果提供）
    if (content.order) {
      this.order = content.order;
      this.updateOrderButtonHighlight();
    }

    // 更新内嵌槽位
    if (this.itemSlot && content.herbId && content.herbName) {
      const itemContent: ItemSlotContent = {
        itemId: content.herbId,
        name: content.herbName,
      };
      this.itemSlot.setContent(itemContent);
    }

    // 触发回调
    if (this.config.onHerbPlaced && content.herbId) {
      this.config.onHerbPlaced(this.role, content.herbId);
    }

    // 重绘边框
    this.drawBorder();
  }

  /**
   * 清除内容
   */
  public clearContent(): void {
    this.content = null;
    this.state = CompatibilitySlotState.EMPTY;
    this.order = undefined;

    // 清除内嵌槽位
    if (this.itemSlot) {
      this.itemSlot.clearContent();
    }

    // 清除顺序按钮高亮
    this.updateOrderButtonHighlight();

    // 触发回调
    if (this.config.onRemove) {
      this.config.onRemove(this.role);
    }

    // 重绘边框
    this.drawBorder();
  }

  /**
   * 设置顺序
   * @param order 煎药顺序
   */
  public setOrder(order: CompatibilityOrder): void {
    this.order = order;

    // 更新按钮高亮
    this.updateOrderButtonHighlight();

    // 触发回调
    if (this.config.onOrderChanged) {
      this.config.onOrderChanged(this.role, order);
    }
  }

  /**
   * 切换顺序（循环）
   */
  public toggleOrder(): void {
    const options = CompatibilitySlotComponent.ORDER_OPTIONS;
    const currentIndex = this.order ? options.indexOf(this.order) : -1;
    const nextIndex = (currentIndex + 1) % options.length;
    this.setOrder(options[nextIndex]);
  }

  /**
   * 更新顺序按钮高亮
   */
  protected updateOrderButtonHighlight(): void {
    const options = CompatibilitySlotComponent.ORDER_OPTIONS;

    this.orderButtons.forEach((button, index) => {
      if (this.order === options[index]) {
        button.setColor(this.roleColorString);
      } else {
        button.setColor(UI_COLOR_STRINGS.TEXT_SECONDARY);
      }
    });
  }

  /**
   * 是否为空
   */
  public isEmpty(): boolean {
    return this.state === CompatibilitySlotState.EMPTY;
  }

  /**
   * 是否已填充
   */
  public isFilled(): boolean {
    return this.state === CompatibilitySlotState.FILLED;
  }

  /**
   * 是否有顺序设置
   */
  public hasOrder(): boolean {
    return this.order !== undefined;
  }

  /**
   * 是否有内容
   */
  public hasContent(): boolean {
    return this.content !== null;
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
  public exposeToGlobal(name: string = '__COMPATIBILITY_SLOT__'): void {
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

    // 销毁角色标签
    if (this.roleLabel) {
      this.roleLabel.destroy();
      this.roleLabel = null;
    }

    // 销毁顺序按钮
    this.orderButtons.forEach((button) => button.destroy());
    this.orderButtons = [];

    // 销毁内嵌ItemSlotComponent
    if (this.itemSlot) {
      this.itemSlot.destroy();
      this.itemSlot = null;
    }

    // 销毁容器
    this.container.destroy();

    // 清空状态
    this.content = null;
    this.order = undefined;
    this.state = CompatibilitySlotState.EMPTY;

    // 清理全局引用
    if (typeof window !== 'undefined') {
      delete (window as any).__COMPATIBILITY_SLOT__;
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