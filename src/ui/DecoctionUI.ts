// src/ui/DecoctionUI.ts
/**
 * 煎药游戏UI组件
 *
 * Phase 2 S9.3 实现
 * Phase 2.5 UI组件系统统一化 Task 14 - 重构使用新组件
 *
 * 功能:
 * - 方剂选择界面
 * - 药材选择界面（使用ItemSlotComponent 60×60）
 * - 配伍放置界面（使用CompatibilitySlotComponent 120×100）
 * - 顺序设置界面（使用SelectionButtonComponent）
 * - 火候控制界面（使用SelectionButtonComponent）
 * - 煎药进度界面
 * - 结果评分界面
 */

import Phaser from 'phaser';
import { EventBus, EventData } from '../systems/EventBus';
import {
  DecoctionManager,
  DecoctionEvent
} from '../systems/DecoctionManager';
import {
  getFireLevelConfig,
  getDecoctionOrderConfig,
  getDecoctionParams,
  type FireLevel,
  type DecoctionOrderType,
  type DecoctionPhase,
  type DecoctionScoreResult
} from '../data/decoction-data';
import {
  getHerbById,
  HERBS_DATA
} from '../data/inventory-data';
import prescriptionsData from '../data/prescriptions.json';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';

// Phase 2.5 新组件导入
import ItemSlotComponent, {
  ItemSlotContent
} from './components/ItemSlotComponent';
import SelectionButtonComponent from './components/SelectionButtonComponent';
import CompatibilitySlotComponent, {
  CompatibilityRole
} from './components/CompatibilitySlotComponent';

/**
 * UI配置
 */
interface DecoctionUIConfig {
  scene: Phaser.Scene;
  width: number;
  height: number;
}

/**
 * 煎药UI组件
 * Round 4 视觉优化: 3D立体边框(方案B)
 * Phase 2.5: 使用ItemSlotComponent、CompatibilitySlotComponent、SelectionButtonComponent
 */
export class DecoctionUI {
  private scene: Phaser.Scene;
  private manager: DecoctionManager;
  private eventBus: EventBus;

  private container: Phaser.GameObjects.Container;
  private width: number;
  private height: number;
  private backgroundGraphics: Phaser.GameObjects.Graphics | null = null;

  // UI元素
  private titleText: Phaser.GameObjects.Text | null = null;
  private phaseText: Phaser.GameObjects.Text | null = null;
  private contentContainer: Phaser.GameObjects.Container | null = null;

  // 当前选择的元素
  private selectedPrescriptionId: string | null = null;
  private selectedHerbs: string[] = [];

  // Phase 2.5: 使用新组件存储
  private herbSlots: Map<string, ItemSlotComponent> = new Map();
  private compatibilitySlots: Map<CompatibilityRole, CompatibilitySlotComponent> = new Map();
  private orderButtons: Map<string, SelectionButtonComponent[]> = new Map();
  private fireButtons: SelectionButtonComponent[] = [];

  // 样式配置（Round 4 3D边框设计 - 方案B）
  private readonly DECOCTION_UI_COLORS = {
    outerBorder: UI_COLORS.BORDER_OUTER_GREEN,      // 亮绿边框 0x80a040
    panelBg: UI_COLORS.PANEL_3D_BG,                 // 深绿背景 0x1a2e26
    topLight: UI_COLORS.BORDER_TOP_LIGHT,           // 顶部高光 0x90c070
    bottomShadow: UI_COLORS.BORDER_BOTTOM_SHADOW,   // 底部阴影 0x604020
  };

  // 事件监听器引用（用于正确清理）
  private phaseChangedHandler!: (data: EventData) => void;
  private herbAddedHandler!: (data: EventData) => void;
  private herbRemovedHandler!: (data: EventData) => void;
  private decoctionTickHandler!: (data: EventData) => void;
  private scoreCalculatedHandler!: (data: EventData) => void;

  constructor(config: DecoctionUIConfig) {
    this.scene = config.scene;
    this.width = config.width;
    this.height = config.height;

    this.manager = DecoctionManager.getInstance();
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
    this.showPrescriptionSelection();
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
    graphics.lineStyle(4, this.DECOCTION_UI_COLORS.outerBorder);
    graphics.strokeRect(x, y, width, height);

    // 2. 主背景（深绿色，完全不透明）
    graphics.fillStyle(this.DECOCTION_UI_COLORS.panelBg, 1.0);
    graphics.fillRect(x + 2, y + 2, width - 4, height - 4);

    // 3. 顶部/左侧高光边框（亮绿，2px）
    graphics.lineStyle(2, this.DECOCTION_UI_COLORS.topLight);
    graphics.beginPath();
    graphics.moveTo(x + 2, y + height - 2);
    graphics.lineTo(x + 2, y + 2);
    graphics.lineTo(x + width - 2, y + 2);
    graphics.strokePath();

    // 4. 底部/右侧阴影边框（暗棕，2px）
    graphics.lineStyle(2, this.DECOCTION_UI_COLORS.bottomShadow);
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
      const newPhase = data.new_phase as DecoctionPhase;
      this.updateUIForPhase(newPhase);
    };
    this.eventBus.on(DecoctionEvent.PHASE_CHANGED, this.phaseChangedHandler);

    this.herbAddedHandler = (_data: EventData) => {
      this.updateHerbSelection();
    };
    this.eventBus.on(DecoctionEvent.HERB_ADDED, this.herbAddedHandler);

    this.herbRemovedHandler = (_data: EventData) => {
      this.updateHerbSelection();
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
      this.showResult(result);
    };
    this.eventBus.on(DecoctionEvent.SCORE_CALCULATED, this.scoreCalculatedHandler);
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
    this.scene.scene.stop('DecoctionScene');
    this.scene.scene.start('ClinicScene');
  }

  /**
   * 清除内容容器
   * Phase 2.5: 同时清理组件集合
   */
  private clearContent(): void {
    if (this.contentContainer) {
      this.contentContainer.removeAll(true);
      this.contentContainer.destroy();
      this.contentContainer = null;
    }

    // Phase 2.5: 清理组件集合（但保留引用供下次使用）
    this.herbSlots.forEach(slot => slot.destroy());
    this.herbSlots.clear();

    this.compatibilitySlots.forEach(slot => slot.destroy());
    this.compatibilitySlots.clear();

    this.orderButtons.forEach(buttons => buttons.forEach(btn => btn.destroy()));
    this.orderButtons.clear();

    this.fireButtons.forEach(btn => btn.destroy());
    this.fireButtons = [];
  }

  /**
   * 显示方剂选择界面
   */
  private showPrescriptionSelection(): void {
    this.clearContent();

    // 标题
    this.titleText = this.scene.add.text(this.width / 2, 50, '选择方剂', {
      fontSize: '24px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY
    }).setOrigin(0.5);
    this.container.add(this.titleText);

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 退出按钮
    const exitButton = this.createExitButton();
    this.container.add(exitButton);

    // 方剂列表
    const prescriptions = prescriptionsData.prescriptions;
    const startY = 100;
    const spacing = 60;

    prescriptions.forEach((prescription, index) => {
      const y = startY + index * spacing;

      // 方剂按钮
      const button = this.scene.add.text(this.width / 2, y, prescription.name, {
        fontSize: '20px',
        color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
        backgroundColor: UI_COLOR_STRINGS.PANEL_PRIMARY,
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setInteractive();

      button.on('pointerover', () => {
        button.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
      });

      button.on('pointerout', () => {
        button.setColor(UI_COLOR_STRINGS.BUTTON_SUCCESS);
      });

      button.on('pointerdown', () => {
        this.selectPrescription(prescription.id);
      });

      // 方剂信息
      const infoText = this.scene.add.text(this.width / 2, y + 30,
        `${prescription.syndrome} - ${prescription.effect}`, {
          fontSize: '14px',
          color: UI_COLOR_STRINGS.TEXT_SECONDARY
        }).setOrigin(0.5);

      this.contentContainer?.add([button, infoText]);
    });

    // 阶段指示
    this.phaseText = this.scene.add.text(this.width / 2, this.height - 50,
      '阶段: 选择方剂', {
        fontSize: '16px',
        color: UI_COLOR_STRINGS.STATUS_WARNING
      }).setOrigin(0.5);
    this.container.add(this.phaseText);
  }

  /**
   * 选择方剂
   */
  private selectPrescription(prescriptionId: string): void {
    this.selectedPrescriptionId = prescriptionId;
    this.manager.selectPrescription(prescriptionId);
  }

  /**
   * 显示药材选择界面
   * Phase 2.5: 使用ItemSlotComponent (60×60)
   */
  private showHerbSelection(): void {
    this.clearContent();

    if (!this.selectedPrescriptionId) return;

    const prescription = prescriptionsData.prescriptions.find(
      p => p.id === this.selectedPrescriptionId
    );

    // 标题
    this.titleText?.setText(`选择药材 - ${prescription?.name || ''}`);

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 退出按钮
    const exitButton = this.createExitButton();
    this.contentContainer?.add(exitButton);

    // 方剂组成提示
    const requiredHerbs = prescription?.composition.map(c => {
      const herbNameToId: Record<string, string> = {
        '麻黄': 'mahuang', '桂枝': 'guizhi', '杏仁': 'xingren', '甘草': 'gancao',
        '芍药': 'shaoyao', '生姜': 'shengjiang', '大枣': 'dazao',
        '金银花': 'jinyinhua', '连翘': 'lianqiao', '薄荷': 'bohe', '荆芥': 'jingjie',
        '牛蒡子': 'niubangzi', '豆豉': 'douchi', '竹叶': 'zhuye', '桔梗': 'jiegeng',
        '桑叶': 'sangye', '菊花': 'juhua', '芦根': 'lugen'
      };
      return herbNameToId[c.herb] || c.herb;
    }) || [];

    // 提示文字
    const hintText = this.scene.add.text(this.width / 2, 80,
      `需要药材: ${requiredHerbs.map(id => getHerbById(id)?.name || id).join(', ')}`,
      {
        fontSize: '14px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
        wordWrap: { width: this.width - 40 }  // Fit within panel width with margins
      }
    ).setOrigin(0.5);
    this.contentContainer.add(hintText);

    // Phase 2.5: 使用ItemSlotComponent创建药材格子
    // 布局: 每行5个，60×60格子，间距10px
    const slotSize = ItemSlotComponent.SLOT_SIZE; // 60
    const spacing = 10;
    const cols = 5;
    const startY = 120;
    const startX = (this.width - (cols * (slotSize + spacing) - spacing)) / 2;

    // 清空旧的药材格子
    this.herbSlots.forEach(slot => slot.destroy());
    this.herbSlots.clear();

    HERBS_DATA.forEach((herb, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (slotSize + spacing) + slotSize / 2;
      const y = startY + row * (slotSize + spacing) + slotSize / 2;

      const isSelected = this.selectedHerbs.includes(herb.id);

      // 创建ItemSlotComponent
      const slot = new ItemSlotComponent(this.scene, {
        selectable: true,
        onClick: () => {
          if (this.selectedHerbs.includes(herb.id)) {
            this.manager.removeHerb(herb.id);
          } else {
            this.manager.addHerb(herb.id);
          }
        }
      }, x, y);

      // 设置内容
      const content: ItemSlotContent = {
        itemId: herb.id,
        name: herb.name,
      };
      slot.setContent(content);

      // 如果已选中，设置为SELECTED状态
      if (isSelected) {
        slot.select();
      }

      // 必需药材的视觉提示（通过颜色或边框）
      // ItemSlotComponent的SELECTED状态会显示高亮边框

      this.herbSlots.set(herb.id, slot);
      this.contentContainer?.add(slot.container);
    });

    // 确认按钮
    const confirmButton = this.scene.add.text(this.width / 2, this.height - 100,
      '确认选择', {
        fontSize: '20px',
        color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
        backgroundColor: '#1B5E20',
        padding: { x: 30, y: 15 }
      }).setOrigin(0.5).setInteractive();

    confirmButton.on('pointerdown', () => {
      if (this.manager.canProceedToNextPhase()) {
        this.manager.proceedToNextPhase();
      }
    });

    this.contentContainer.add(confirmButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 选择药材');
  }

  /**
   * 更新药材选择显示
   */
  private updateHerbSelection(): void {
    const state = this.manager.getState();
    this.selectedHerbs = state.selected_herbs;
    // 重新渲染
    this.showHerbSelection();
  }

  /**
   * 显示配伍放置界面
   * Phase 2.5: 使用CompatibilitySlotComponent (120×100)
   */
  private showCompatibilityPlacement(): void {
    this.clearContent();

    if (!this.selectedPrescriptionId) return;

    const prescription = prescriptionsData.prescriptions.find(
      p => p.id === this.selectedPrescriptionId
    );

    // 标题
    this.titleText?.setText(`配伍放置 - ${prescription?.name || ''}`);

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 退出按钮
    const exitButton = this.createExitButton();
    this.contentContainer?.add(exitButton);

    // 提示文字
    const hintText = this.scene.add.text(this.width / 2, 80,
      '将药材放置到正确的君臣佐使位置',
      {
        fontSize: '14px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
        wordWrap: { width: this.width - 40 }
      }
    ).setOrigin(0.5);
    this.contentContainer.add(hintText);

    // Phase 2.5: 使用CompatibilitySlotComponent创建角色槽位
    const roles: CompatibilityRole[] = ['君', '臣', '佐', '使'];
    const slotWidth = CompatibilitySlotComponent.SLOT_WIDTH; // 120
    const slotHeight = CompatibilitySlotComponent.SLOT_HEIGHT; // 100
    const slotSpacing = 20;
    const startY = 150;

    // 清空旧的配伍槽位
    this.compatibilitySlots.forEach(slot => slot.destroy());
    this.compatibilitySlots.clear();

    // 布局: 水平排列4个槽位
    const totalWidth = roles.length * slotWidth + (roles.length - 1) * slotSpacing;
    const startX = (this.width - totalWidth) / 2 + slotWidth / 2;

    roles.forEach((role, index) => {
      const x = startX + index * (slotWidth + slotSpacing);
      const y = startY + slotHeight / 2;

      // 创建CompatibilitySlotComponent
      const slot = new CompatibilitySlotComponent(this.scene, role, {
        onHerbPlaced: (placedRole, herbId) => {
          this.manager.placeRole(herbId, placedRole);
          this.updateCompatibilityDisplay();
        },
        onOrderChanged: (placedRole, order) => {
          // 顺序变更回调（在煎药顺序阶段使用）
          const herbId = this.getHerbIdByRole(placedRole);
          if (herbId) {
            const orderType = this.convertOrderToType(order);
            this.manager.setOrder(herbId, orderType);
          }
        },
        onRemove: (placedRole) => {
          // 移除药材回调
          const herbId = this.getHerbIdByRole(placedRole);
          if (herbId) {
            this.manager.removeHerb(herbId);
          }
        }
      }, x, y);

      this.compatibilitySlots.set(role, slot);
      this.contentContainer?.add(slot.container);
    });

    // 已选药材列表（用于放置到槽位）
    const herbListY = 280;
    const herbSpacing = 50;

    this.selectedHerbs.forEach((herbId, index) => {
      const herb = getHerbById(herbId);
      const y = herbListY + index * herbSpacing;

      // 药材名称
      const herbLabel = this.scene.add.text(100, y, herb?.name || herbId, {
        fontSize: '16px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY
      }).setOrigin(0, 0.5);

      // 角色选择按钮（点击放置到对应槽位）
      const roleButtons = roles.map((role, roleIndex) => {
        const x = 250 + roleIndex * 80;
        const btn = this.scene.add.text(x, y, role, {
          fontSize: '14px',
          color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
          backgroundColor: UI_COLOR_STRINGS.PANEL_PRIMARY,
          padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setInteractive();

        btn.on('pointerdown', () => {
          this.manager.placeRole(herbId, role);
          this.updateCompatibilityDisplay();
        });

        return btn;
      });

      this.contentContainer?.add([herbLabel, ...roleButtons]);
    });

    // 确认按钮
    const confirmButton = this.scene.add.text(this.width / 2, this.height - 100,
      '确认配伍', {
        fontSize: '20px',
        color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
        backgroundColor: '#1B5E20',
        padding: { x: 30, y: 15 }
      }).setOrigin(0.5).setInteractive();

    confirmButton.on('pointerdown', () => {
      if (this.manager.canProceedToNextPhase()) {
        this.manager.proceedToNextPhase();
      }
    });

    this.contentContainer.add(confirmButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 配伍放置');
  }

  /**
   * 根据角色获取药材ID
   */
  private getHerbIdByRole(role: string): string | null {
    const state = this.manager.getState();
    for (const [herbId, placedRole] of state.compatibility_placement) {
      if (placedRole === role) {
        return herbId;
      }
    }
    return null;
  }

  /**
   * 将顺序字符串转换为DecoctionOrderType
   */
  private convertOrderToType(order: string): DecoctionOrderType {
    switch (order) {
      case '先煎': return 'first';
      case '同煎': return 'normal';
      case '后下': return 'last';
      default: return 'normal';
    }
  }

  /**
   * 更新配伍显示
   * Phase 2.5: 使用CompatibilitySlotComponent更新
   */
  private updateCompatibilityDisplay(): void {
    const state = this.manager.getState();

    // 更新槽位显示
    this.compatibilitySlots.forEach((slot, role) => {
      // 查找放置在该角色的药材
      let placedHerb: string | null = null;
      state.compatibility_placement.forEach((placedRole, herbId) => {
        if (placedRole === role) {
          placedHerb = herbId;
        }
      });

      if (placedHerb) {
        const herb = getHerbById(placedHerb);
        // 使用CompatibilitySlotComponent的setContent方法
        slot.setContent({
          role: role,
          herbId: placedHerb,
          herbName: herb?.name || placedHerb
        });
      } else {
        // 清空槽位
        slot.clearContent();
      }
    });
  }

  /**
   * 显示顺序设置界面
   * Phase 2.5: 使用SelectionButtonComponent (○→●符号切换)
   */
  private showOrderSetting(): void {
    this.clearContent();

    // 标题
    this.titleText?.setText('设置煎药顺序');

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 退出按钮
    const exitButton = this.createExitButton();
    this.contentContainer?.add(exitButton);

    // 提示文字
    const hintText = this.scene.add.text(this.width / 2, 80,
      '设置每种药材的煎煮顺序',
      {
        fontSize: '14px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
        wordWrap: { width: this.width - 40 }
      }
    ).setOrigin(0.5);
    this.contentContainer.add(hintText);

    // Phase 2.5: 使用SelectionButtonComponent创建顺序选项
    const orders: DecoctionOrderType[] = ['first', 'normal', 'last'];

    // 清空旧的顺序按钮
    this.orderButtons.forEach(buttons => buttons.forEach(btn => btn.destroy()));
    this.orderButtons.clear();

    // 药材列表
    const herbStartY = 130;
    const herbSpacing = 50;
    const buttonWidth = 80;
    const startX = 200;

    this.selectedHerbs.forEach((herbId, index) => {
      const herb = getHerbById(herbId);
      const y = herbStartY + index * herbSpacing;

      // 药材名称
      const herbLabel = this.scene.add.text(100, y, herb?.name || herbId, {
        fontSize: '16px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY
      }).setOrigin(0, 0.5);

      // 使用SelectionButtonComponent创建顺序按钮
      const buttons: SelectionButtonComponent[] = [];
      orders.forEach((order, orderIndex) => {
        const x = startX + orderIndex * buttonWidth + buttonWidth / 2;
        const orderConfig = getDecoctionOrderConfig(order);
        const isSelected = this.manager.getState().order_settings.get(herbId) === order;

        const button = new SelectionButtonComponent(this.scene, {
          label: orderConfig?.name || order,
          value: order
        }, {
          selected: isSelected,
          width: buttonWidth,
          onSelect: (value: string) => {
            const orderType = value as DecoctionOrderType;
            this.manager.setOrder(herbId, orderType);
            // 重新渲染以更新选中状态
            this.showOrderSetting();
          }
        }, x, y);

        buttons.push(button);
        this.contentContainer?.add(button.container);
      });

      this.orderButtons.set(herbId, buttons);
      this.contentContainer?.add(herbLabel);
    });

    // 确认按钮
    const confirmButton = this.scene.add.text(this.width / 2, this.height - 100,
      '确认顺序', {
        fontSize: '20px',
        color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
        backgroundColor: '#1B5E20',
        padding: { x: 30, y: 15 }
      }).setOrigin(0.5).setInteractive();

    confirmButton.on('pointerdown', () => {
      this.manager.proceedToNextPhase();
    });

    this.contentContainer.add(confirmButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 顺序设置');
  }

  /**
   * 显示火候设置界面
   * Phase 2.5: 使用SelectionButtonComponent (○→●符号切换)
   */
  private showFireSetting(): void {
    this.clearContent();

    // 标题
    this.titleText?.setText('设置煎药火候');

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 退出按钮
    const exitButton = this.createExitButton();
    this.contentContainer?.add(exitButton);

    // 提示文字
    const hintText = this.scene.add.text(this.width / 2, 80,
      '选择合适的煎药火候',
      {
        fontSize: '14px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY,
        wordWrap: { width: this.width - 40 }
      }
    ).setOrigin(0.5);
    this.contentContainer.add(hintText);

    // Phase 2.5: 使用SelectionButtonComponent创建火候选项
    const fires: FireLevel[] = ['wu', 'wen'];
    const fireY = 150;
    const fireSpacing = 100;

    // 清空旧的火候按钮
    this.fireButtons.forEach(btn => btn.destroy());
    this.fireButtons = [];

    fires.forEach((fire, index) => {
      const y = fireY + index * fireSpacing;
      const fireConfig = getFireLevelConfig(fire);
      const isSelected = this.manager.getState().fire_level === fire;

      // 使用SelectionButtonComponent
      const button = new SelectionButtonComponent(this.scene, {
        label: fireConfig?.name || fire,
        value: fire
      }, {
        selected: isSelected,
        width: 150, // 固定宽度
        onSelect: (value: string) => {
          const fireLevel = value as FireLevel;
          this.manager.setFireLevel(fireLevel);
          // 重新渲染以更新选中状态
          this.showFireSetting();
        }
      }, this.width / 2, y);

      this.fireButtons.push(button);
      this.contentContainer?.add(button.container);

      // 描述文字（在按钮下方）
      const descText = this.scene.add.text(this.width / 2, y + 40,
        fireConfig?.description || '',
        {
          fontSize: '14px',
          color: UI_COLOR_STRINGS.TEXT_SECONDARY,
          wordWrap: { width: this.width - 80 }
        }
      ).setOrigin(0.5);
      this.contentContainer?.add(descText);
    });

    // 目标时间显示
    const params = getDecoctionParams(this.selectedPrescriptionId || '');
    const timeText = this.scene.add.text(this.width / 2, 350,
      `建议煎煮时间: ${params?.total_time || 0}秒`,
      { fontSize: '16px', color: UI_COLOR_STRINGS.STATUS_WARNING }
    ).setOrigin(0.5);
    this.contentContainer.add(timeText);

    // 开始煎药按钮
    const startButton = this.scene.add.text(this.width / 2, this.height - 100,
      '开始煎药', {
        fontSize: '20px',
        color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
        backgroundColor: '#1B5E20',
        padding: { x: 30, y: 15 }
      }).setOrigin(0.5).setInteractive();

    startButton.on('pointerdown', () => {
      this.manager.startDecoction();
    });

    this.contentContainer.add(startButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 火候设置');
  }

  /**
   * 显示煎药进度界面
   */
  private showDecoctionProgress(): void {
    this.clearContent();

    // 标题
    this.titleText?.setText('煎药进行中...');

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 退出按钮
    const exitButton = this.createExitButton();
    this.contentContainer?.add(exitButton);

    // 进度条背景
    const progressBg = this.scene.add.rectangle(
      this.width / 2, 200, 400, 30, UI_COLORS.PANEL_LIGHT
    ).setOrigin(0.5);

    // 进度条填充
    const progressFill = this.scene.add.rectangle(
      this.width / 2 - 200, 200, 0, 26, UI_COLORS.BUTTON_SUCCESS
    ).setOrigin(0, 0.5);
    progressFill.setName('progressFill');

    this.contentContainer?.add([progressBg, progressFill]);

    // 时间文字
    const timeText = this.scene.add.text(this.width / 2, 250, '0 / 0 秒', {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY
    }).setOrigin(0.5);
    timeText.setName('timeText');
    this.contentContainer?.add(timeText);

    // 火候显示
    const fireConfig = getFireLevelConfig(this.manager.getState().fire_level);
    const fireText = this.scene.add.text(this.width / 2, 300,
      `火候: ${fireConfig?.name || ''}`,
      { fontSize: '18px', color: '#ff5722' }
    ).setOrigin(0.5);
    this.contentContainer?.add(fireText);

    // 完成按钮
    const completeButton = this.scene.add.text(this.width / 2, this.height - 100,
      '完成煎药', {
        fontSize: '20px',
        color: UI_COLOR_STRINGS.STATUS_WARNING,
        backgroundColor: '#e65100',
        padding: { x: 30, y: 15 }
      }).setOrigin(0.5).setInteractive();

    completeButton.on('pointerdown', () => {
      this.manager.completeDecoction();
    });

    this.contentContainer.add(completeButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 煎药进行中');
  }

  /**
   * 更新煎药进度
   */
  private updateDecoctionProgress(currentTime: number, targetTime: number, progress: number): void {
    if (!this.contentContainer) return;

    // 更新进度条
    const progressFill = this.contentContainer.getByName('progressFill') as Phaser.GameObjects.Rectangle;
    if (progressFill) {
      progressFill.width = 400 * Math.min(progress, 1);
    }

    // 更新时间文字
    const timeText = this.contentContainer.getByName('timeText') as Phaser.GameObjects.Text;
    if (timeText) {
      timeText.setText(`${currentTime} / ${targetTime} 秒`);
    }
  }

  /**
   * 显示结果界面
   */
  private showResult(result: DecoctionScoreResult): void {
    this.clearContent();

    // 标题
    this.titleText?.setText(result.passed ? '煎药成功！' : '煎药失败');

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 总分显示
    const scoreText = this.scene.add.text(this.width / 2, 100,
      `总分: ${result.total_score}`,
      { fontSize: '32px', color: result.passed ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#f44336' }
    ).setOrigin(0.5);
    this.contentContainer?.add(scoreText);

    // 各维度分数
    const dimensionY = 150;
    const dimensionSpacing = 40;
    const dimensions = [
      { name: '配伍正确', score: result.dimension_scores.compatibility, weight: 40 },
      { name: '组成正确', score: result.dimension_scores.composition, weight: 20 },
      { name: '顺序正确', score: result.dimension_scores.order, weight: 20 },
      { name: '火候正确', score: result.dimension_scores.fire, weight: 10 },
      { name: '时间正确', score: result.dimension_scores.time, weight: 10 }
    ];

    dimensions.forEach((dim, index) => {
      const y = dimensionY + index * dimensionSpacing;
      const color = dim.score >= dim.weight * 0.8 ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#f44336';

      const dimText = this.scene.add.text(this.width / 2, y,
        `${dim.name}: ${dim.score}/${dim.weight}`,
        { fontSize: '18px', color: color }
      ).setOrigin(0.5);
      this.contentContainer?.add(dimText);
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
    this.contentContainer?.add(feedbackText);

    // 错误详情
    if (result.herb_errors && result.herb_errors.length > 0) {
      const errorsY = 400;
      result.herb_errors.forEach((error, index) => {
        const errorText = this.scene.add.text(this.width / 2, errorsY + index * 25,
          `${error.herb_name}: ${error.error_type}`,
          { fontSize: '14px', color: '#f44336' }
        ).setOrigin(0.5);
        this.contentContainer?.add(errorText);
      });
    }

    // 返回按钮
    const backButton = this.scene.add.text(this.width / 2, this.height - 80,
      '返回', {
        fontSize: '20px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY,
        backgroundColor: UI_COLOR_STRINGS.PANEL_PRIMARY,
        padding: { x: 30, y: 15 }
      }).setOrigin(0.5).setInteractive();

    backButton.on('pointerdown', () => {
      this.manager.reset();
      this.destroy();
      // 返回上一场景
      this.scene.scene.stop('DecoctionScene');
      this.scene.scene.start('ClinicScene');
    });

    this.contentContainer.add(backButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 结果评分');
  }

  /**
   * 根据阶段更新UI
   */
  private updateUIForPhase(phase: DecoctionPhase): void {
    switch (phase) {
      case 'select_prescription':
        this.showPrescriptionSelection();
        break;
      case 'select_herbs':
        this.showHerbSelection();
        break;
      case 'place_compatibility':
        this.showCompatibilityPlacement();
        break;
      case 'set_order':
        this.showOrderSetting();
        break;
      case 'set_fire':
        this.showFireSetting();
        break;
      case 'decocting':
        this.showDecoctionProgress();
        break;
      case 'evaluate':
        // 等待SCORE_CALCULATED事件
        break;
    }
  }

  /**
   * 销毁UI
   * Phase 2.5: 清理新组件类型
   */
  destroy(): void {
    // 移除事件监听（使用保存的引用正确清理）
    this.eventBus.off(DecoctionEvent.PHASE_CHANGED, this.phaseChangedHandler);
    this.eventBus.off(DecoctionEvent.HERB_ADDED, this.herbAddedHandler);
    this.eventBus.off(DecoctionEvent.HERB_REMOVED, this.herbRemovedHandler);
    this.eventBus.off(DecoctionEvent.DECOCTION_TICK, this.decoctionTickHandler);
    this.eventBus.off(DecoctionEvent.SCORE_CALCULATED, this.scoreCalculatedHandler);

    // 清除内容
    this.clearContent();

    // Phase 2.5: 清理新组件
    this.herbSlots.forEach(slot => slot.destroy());
    this.herbSlots.clear();

    this.compatibilitySlots.forEach(slot => slot.destroy());
    this.compatibilitySlots.clear();

    this.orderButtons.forEach(buttons => buttons.forEach(btn => btn.destroy()));
    this.orderButtons.clear();

    this.fireButtons.forEach(btn => btn.destroy());
    this.fireButtons = [];

    // 销毁背景Graphics
    if (this.backgroundGraphics) {
      this.backgroundGraphics.destroy();
      this.backgroundGraphics = null;
    }

    // 销毁主容器
    this.container.removeAll(true);
    this.container.destroy();
  }
}