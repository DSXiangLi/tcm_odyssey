// src/ui/SaveUI.ts
/**
 * 存档界面组件
 *
 * 功能:
 * - 存档列表显示（槽位、时间、进度）
 * - 存档按钮
 * - 加载按钮
 * - 删除按钮
 * - 自动存档状态显示
 *
 * Phase 2 S7 实现
 */

import Phaser from 'phaser';
import { SaveManager, SaveSlotInfo } from '../systems/SaveManager';
import { EventBus, EventData } from '../systems/EventBus';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';

// 存档UI配置
export interface SaveUIConfig {
  scene: Phaser.Scene;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  mode?: 'save' | 'load';  // 存档模式或加载模式
  onClose?: () => void;
}

// 存档槽位UI状态
interface SlotUIState {
  container: Phaser.GameObjects.Container;
  info: SaveSlotInfo;
  saveButton?: Phaser.GameObjects.Text;
  loadButton?: Phaser.GameObjects.Text;
  deleteButton?: Phaser.GameObjects.Text;
  isSelected: boolean;
}

/**
 * 存档界面类
 */
export class SaveUI {
  private scene: Phaser.Scene;
  private saveManager: SaveManager;
  private eventBus: EventBus;

  private container!: Phaser.GameObjects.Container;
  private background!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private slotsContainer!: Phaser.GameObjects.Container;
  private closeButton!: Phaser.GameObjects.Text;

  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private mode: 'save' | 'load';

  private slotUIs: SlotUIState[] = [];
  private selectedSlot: number = 1;
  private onClose?: () => void;

  // 自动存档状态显示
  private autoSaveIndicator!: Phaser.GameObjects.Text;

  // 事件监听器引用
  private saveSuccessListener: (data: EventData) => void;
  private saveAutoListener: (data: EventData) => void;

  // 样式配置（基于场景PNG配色）
  private readonly SaveUI_COLORS = {
    background: { fillColor: UI_COLORS.PANEL_PRIMARY, alpha: 0.95 },
    title: { fontSize: '24px', color: UI_COLOR_STRINGS.TEXT_PRIMARY, fontStyle: 'bold' },
    slotEmpty: { fillColor: UI_COLORS.PANEL_LIGHT, alpha: 1 },
    slotExists: { fillColor: UI_COLORS.PANEL_PRIMARY, alpha: 1 },
    slotSelected: { fillColor: UI_COLORS.BUTTON_PRIMARY, alpha: 1 },
    slotText: { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_PRIMARY },
    slotInfoText: { fontSize: '12px', color: UI_COLOR_STRINGS.TEXT_SECONDARY },
    button: { fontSize: '16px', color: UI_COLOR_STRINGS.TEXT_PRIMARY, backgroundColor: UI_COLOR_STRINGS.BUTTON_PRIMARY },
    buttonHover: { backgroundColor: UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER },
    buttonDisabled: { backgroundColor: '#555555', color: UI_COLOR_STRINGS.TEXT_DISABLED },
    closeButton: { fontSize: '14px', color: '#ff6b6b' }
  };

  constructor(config: SaveUIConfig) {
    this.scene = config.scene;
    this.saveManager = SaveManager.getInstance();
    this.eventBus = EventBus.getInstance();

    this.x = config.x ?? 100;
    this.y = config.y ?? 50;
    this.width = config.width ?? 600;
    this.height = config.height ?? 450;
    this.mode = config.mode ?? 'save';
    this.onClose = config.onClose;

    // 创建监听器函数引用
    this.saveSuccessListener = (_data: EventData) => {
      this.updateAutoSaveIndicator();
    };
    this.saveAutoListener = (_data: EventData) => {
      this.updateAutoSaveIndicator();
    };

    this.createUI();
    this.loadSlots();
    this.registerEvents();
  }

  /**
   * 创建UI元素
   */
  private createUI(): void {
    // 初始化容器
    this.container = this.scene.add.container(this.x, this.y);
    this.container.setDepth(1000);  // 确保在最上层
    this.container.setScrollFactor(0);  // 不跟随相机

    // 背景
    this.background = this.scene.add.rectangle(
      this.width / 2,
      this.height / 2,
      this.width,
      this.height,
      this.SaveUI_COLORS.background.fillColor,
      this.SaveUI_COLORS.background.alpha
    );
    this.container.add(this.background);

    // 标题
    const titleText = this.mode === 'save' ? '存档管理' : '加载存档';
    this.titleText = this.scene.add.text(
      this.width / 2,
      30,
      titleText,
      this.SaveUI_COLORS.title
    ).setOrigin(0.5);
    this.container.add(this.titleText);

    // 槽位容器
    this.slotsContainer = this.scene.add.container(20, 70);
    this.container.add(this.slotsContainer);

    // 自动存档状态指示
    this.autoSaveIndicator = this.scene.add.text(
      this.width - 20,
      30,
      '',
      { fontSize: '12px', color: UI_COLOR_STRINGS.TEXT_DISABLED }
    ).setOrigin(1, 0.5);
    this.container.add(this.autoSaveIndicator);
    this.updateAutoSaveIndicator();

    // 关闭按钮
    this.closeButton = this.scene.add.text(
      this.width - 20,
      this.height - 20,
      '关闭 [ESC]',
      this.SaveUI_COLORS.closeButton
    ).setOrigin(1);
    this.closeButton.setInteractive({ useHandCursor: true });
    this.closeButton.on('pointerover', () => {
      this.closeButton.setStyle({ color: '#ff8b8b' });
    });
    this.closeButton.on('pointerout', () => {
      this.closeButton.setStyle({ color: '#ff6b6b' });
    });
    this.closeButton.on('pointerdown', () => {
      this.destroy();
    });
    this.container.add(this.closeButton);

    // 快捷存档按钮（存档模式）
    if (this.mode === 'save') {
      const quickSaveButton = this.scene.add.text(
        this.width / 2,
        this.height - 50,
        '快速存档 [当前槽位]',
        {
          fontSize: '18px',
          color: UI_COLOR_STRINGS.TEXT_PRIMARY,
          backgroundColor: UI_COLOR_STRINGS.BUTTON_PRIMARY,
          padding: { x: 15, y: 8 }
        }
      ).setOrigin(0.5);
      quickSaveButton.setInteractive({ useHandCursor: true });
      quickSaveButton.on('pointerover', () => {
        quickSaveButton.setStyle({ backgroundColor: UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER });
      });
      quickSaveButton.on('pointerout', () => {
        quickSaveButton.setStyle({ backgroundColor: UI_COLOR_STRINGS.BUTTON_PRIMARY });
      });
      quickSaveButton.on('pointerdown', () => {
        this.performSave(this.selectedSlot);
      });
      this.container.add(quickSaveButton);
    }
  }

  /**
   * 加载存档槽位列表
   */
  private loadSlots(): void {
    // 清除现有槽位UI
    this.slotsContainer.removeAll(true);
    this.slotUIs = [];

    const slots = this.saveManager.getSaveSlots();
    const slotHeight = 100;
    const slotWidth = this.width - 40;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const yOffset = i * (slotHeight + 10);

      const slotContainer = this.scene.add.container(0, yOffset);
      this.slotsContainer.add(slotContainer);

      // 槽位背景
      const bgColor = slot.exists
        ? (slot.slot_id === this.selectedSlot ? this.SaveUI_COLORS.slotSelected.fillColor : this.SaveUI_COLORS.slotExists.fillColor)
        : this.SaveUI_COLORS.slotEmpty.fillColor;

      const slotBackground = this.scene.add.rectangle(
        slotWidth / 2,
        slotHeight / 2,
        slotWidth,
        slotHeight,
        bgColor,
        1
      );
      slotContainer.add(slotBackground);

      // 槽位标题
      const slotTitle = this.scene.add.text(
        15,
        15,
        `存档槽位 ${slot.slot_id}`,
        this.SaveUI_COLORS.slotText
      );
      slotContainer.add(slotTitle);

      // 槽位信息
      if (slot.exists) {
        // 存档时间
        const savedTime = new Date(slot.saved_at!).toLocaleString('zh-CN');
        const timeText = this.scene.add.text(
          15,
          40,
          `保存时间: ${savedTime}`,
          this.SaveUI_COLORS.slotInfoText
        );
        slotContainer.add(timeText);

        // 进度信息
        const progressText = this.scene.add.text(
          15,
          60,
          `经验: ${slot.player_experience} | 完成病案: ${slot.completed_cases}`,
          this.SaveUI_COLORS.slotInfoText
        );
        slotContainer.add(progressText);

        // 场景信息
        const sceneText = this.scene.add.text(
          15,
          80,
          `当前位置: ${this.formatSceneName(slot.current_scene)}`,
          this.SaveUI_COLORS.slotInfoText
        );
        slotContainer.add(sceneText);
      } else {
        // 空槽位提示
        const emptyText = this.scene.add.text(
          15,
          50,
          '— 空槽位 —',
          { fontSize: '16px', color: UI_COLOR_STRINGS.TEXT_DISABLED }
        );
        slotContainer.add(emptyText);
      }

      // 按钮
      const buttonY = slotHeight - 25;
      const buttonSpacing = 80;
      const buttonsStartX = slotWidth - 240;

      // 存档按钮（存档模式）
      if (this.mode === 'save') {
        const saveBtn = this.scene.add.text(
          buttonsStartX,
          buttonY,
          '存档',
          {
            fontSize: '14px',
            color: UI_COLOR_STRINGS.TEXT_PRIMARY,
            backgroundColor: UI_COLOR_STRINGS.BUTTON_PRIMARY,
            padding: { x: 10, y: 5 }
          }
        ).setOrigin(0.5);
        saveBtn.setInteractive({ useHandCursor: true });
        saveBtn.on('pointerover', () => saveBtn.setStyle({ backgroundColor: UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER }));
        saveBtn.on('pointerout', () => saveBtn.setStyle({ backgroundColor: UI_COLOR_STRINGS.BUTTON_PRIMARY }));
        saveBtn.on('pointerdown', () => this.performSave(slot.slot_id));
        slotContainer.add(saveBtn);
      }

      // 加载按钮（加载模式或有存档时）
      if (this.mode === 'load' && slot.exists) {
        const loadBtn = this.scene.add.text(
          buttonsStartX,
          buttonY,
          '加载',
          {
            fontSize: '14px',
            color: UI_COLOR_STRINGS.TEXT_PRIMARY,
            backgroundColor: UI_COLOR_STRINGS.BUTTON_PRIMARY,
            padding: { x: 10, y: 5 }
          }
        ).setOrigin(0.5);
        loadBtn.setInteractive({ useHandCursor: true });
        loadBtn.on('pointerover', () => loadBtn.setStyle({ backgroundColor: UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER }));
        loadBtn.on('pointerout', () => loadBtn.setStyle({ backgroundColor: UI_COLOR_STRINGS.BUTTON_PRIMARY }));
        loadBtn.on('pointerdown', () => this.performLoad(slot.slot_id));
        slotContainer.add(loadBtn);
      }

      // 删除按钮（有存档时）
      if (slot.exists) {
        const deleteBtn = this.scene.add.text(
          buttonsStartX + buttonSpacing,
          buttonY,
          '删除',
          {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#c75050',
            padding: { x: 10, y: 5 }
          }
        ).setOrigin(0.5);
        deleteBtn.setInteractive({ useHandCursor: true });
        deleteBtn.on('pointerover', () => deleteBtn.setStyle({ backgroundColor: '#d76060' }));
        deleteBtn.on('pointerout', () => deleteBtn.setStyle({ backgroundColor: '#c75050' }));
        deleteBtn.on('pointerdown', () => this.performDelete(slot.slot_id));
        slotContainer.add(deleteBtn);
      }

      // 点击选择槽位
      slotBackground.setInteractive({ useHandCursor: true });
      slotBackground.on('pointerdown', () => {
        this.selectSlot(slot.slot_id);
      });

      // 记录槽位UI状态
      this.slotUIs.push({
        container: slotContainer,
        info: slot,
        isSelected: slot.slot_id === this.selectedSlot
      });
    }
  }

  /**
   * 选择槽位
   */
  private selectSlot(slotId: number): void {
    this.selectedSlot = slotId;
    this.saveManager.setCurrentSlot(slotId);

    // 更新UI显示
    for (const slotUI of this.slotUIs) {
      const isSelected = slotUI.info.slot_id === slotId;
      slotUI.isSelected = isSelected;

      // 更新背景颜色
      const background = slotUI.container.getAt(0) as Phaser.GameObjects.Rectangle;
      if (background) {
        const bgColor = slotUI.info.exists
          ? (isSelected ? this.SaveUI_COLORS.slotSelected.fillColor : this.SaveUI_COLORS.slotExists.fillColor)
          : this.SaveUI_COLORS.slotEmpty.fillColor;
        background.setFillStyle(bgColor);
      }
    }

    console.log(`[SaveUI] Selected slot ${slotId}`);
  }

  /**
   * 执行存档
   */
  private async performSave(slotId: number): Promise<void> {
    console.log(`[SaveUI] Saving to slot ${slotId}...`);

    // 显示存档进行中状态
    this.showStatusMessage('正在存档...', UI_COLOR_STRINGS.TEXT_DISABLED);

    const success = await this.saveManager.save(slotId);

    if (success) {
      this.showStatusMessage('存档成功!', UI_COLOR_STRINGS.STATUS_SUCCESS);
      this.loadSlots();  // 刷新槽位列表
    } else {
      this.showStatusMessage('存档失败!', '#c75050');
    }
  }

  /**
   * 执行加载
   */
  private async performLoad(slotId: number): Promise<void> {
    console.log(`[SaveUI] Loading from slot ${slotId}...`);

    // 显示加载进行中状态
    this.showStatusMessage('正在加载...', UI_COLOR_STRINGS.TEXT_DISABLED);

    const saveData = await this.saveManager.load(slotId);

    if (saveData) {
      this.showStatusMessage('加载成功!', UI_COLOR_STRINGS.STATUS_SUCCESS);

      // 等待一小段时间后关闭UI并切换场景
      this.scene.time.delayedCall(500, () => {
        this.destroy();

        // 切换到存档中的场景
        this.scene.scene.start(saveData.scene_state.current_scene);
      });
    } else {
      this.showStatusMessage('加载失败!', '#c75050');
    }
  }

  /**
   * 执行删除
   */
  private async performDelete(slotId: number): Promise<void> {
    // 确认提示
    const confirmContainer = this.createConfirmDialog(
      `确定删除存档槽位 ${slotId}？`,
      async () => {
        const success = await this.saveManager.deleteSave(slotId);

        if (success) {
          this.showStatusMessage('删除成功!', UI_COLOR_STRINGS.STATUS_SUCCESS);
          this.loadSlots();  // 刷新槽位列表
        } else {
          this.showStatusMessage('删除失败!', '#c75050');
        }

        confirmContainer.destroy();
      },
      () => {
        confirmContainer.destroy();
      }
    );
  }

  /**
   * 创建确认对话框
   */
  private createConfirmDialog(
    message: string,
    onConfirm: () => void,
    onCancel: () => void
  ): Phaser.GameObjects.Container {
    const dialogContainer = this.scene.add.container(
      this.width / 2,
      this.height / 2
    );
    dialogContainer.setDepth(1100);
    this.container.add(dialogContainer);

    // 背景
    const dialogBg = this.scene.add.rectangle(0, 0, 300, 150, UI_COLORS.PANEL_PRIMARY, 0.95);
    dialogContainer.add(dialogBg);

    // 消息
    const msgText = this.scene.add.text(0, -30, message, {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY
    }).setOrigin(0.5);
    dialogContainer.add(msgText);

    // 确认按钮（删除操作，使用红色警示）
    const confirmBtn = this.scene.add.text(-60, 40, '确认', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: '#c75050',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    confirmBtn.setInteractive({ useHandCursor: true });
    confirmBtn.on('pointerdown', onConfirm);
    dialogContainer.add(confirmBtn);

    // 取消按钮
    const cancelBtn = this.scene.add.text(60, 40, '取消', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.BUTTON_SECONDARY,
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    cancelBtn.setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerdown', onCancel);
    dialogContainer.add(cancelBtn);

    return dialogContainer;
  }

  /**
   * 显示状态消息
   */
  private showStatusMessage(message: string, color: string): void {
    const statusText = this.scene.add.text(
      this.width / 2,
      this.height - 80,
      message,
      {
        fontSize: '16px',
        color: color
      }
    ).setOrigin(0.5);

    this.container.add(statusText);

    // 2秒后消失
    this.scene.time.delayedCall(2000, () => {
      statusText.destroy();
    });
  }

  /**
   * 更新自动存档状态指示
   */
  private updateAutoSaveIndicator(): void {
    const latestSave = this.saveManager.getLatestSave();

    if (latestSave && latestSave.saved_at) {
      const savedTime = new Date(latestSave.saved_at);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - savedTime.getTime()) / 60000);

      if (diffMinutes < 1) {
        this.autoSaveIndicator.setText('自动存档: 刚刚');
      } else if (diffMinutes < 60) {
        this.autoSaveIndicator.setText(`自动存档: ${diffMinutes}分钟前`);
      } else {
        this.autoSaveIndicator.setText('自动存档: 已开启');
      }
    } else {
      this.autoSaveIndicator.setText('自动存档: 已开启');
    }
  }

  /**
   * 格式化场景名称
   */
  private formatSceneName(sceneName: string): string {
    const sceneNames: Record<string, string> = {
      'TownOutdoorScene': '百草镇',
      'ClinicScene': '青木诊所',
      'GardenScene': '老张药园',
      'HomeScene': '玩家之家',
      'InquiryScene': '问诊',
      'PulseScene': '脉诊',
      'TongueScene': '舌诊',
      'SyndromeScene': '辨证',
      'PrescriptionScene': '选方'
    };

    return sceneNames[sceneName] ?? sceneName;
  }

  /**
   * 注册事件
   */
  private registerEvents(): void {
    // 监听存档事件（使用存储的监听器引用）
    this.eventBus.on('save:success', this.saveSuccessListener);

    this.eventBus.on('save:auto', this.saveAutoListener);

    // ESC键关闭
    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.on('keydown-ESC', () => {
        this.destroy();
      });
    }
  }

  /**
   * 切换存档/加载模式
   */
  setMode(mode: 'save' | 'load'): void {
    this.mode = mode;
    this.titleText.setText(mode === 'save' ? '存档管理' : '加载存档');
    this.loadSlots();
  }

  /**
   * 显示存档界面
   */
  show(): void {
    // 存档UI打开
    if (typeof window !== 'undefined') {
      (window as any).__SAVE_UI_OPEN__ = true;
    }
    this.container.setVisible(true);
    this.loadSlots();
  }

  /**
   * 隐藏存档界面
   */
  hide(): void {
    // 存档UI关闭
    if (typeof window !== 'undefined') {
      (window as any).__SAVE_UI_OPEN__ = false;
    }
    this.container.setVisible(false);
  }

  /**
   * 销毁
   */
  destroy(): void {
    // 取消事件监听（使用存储的监听器引用）
    this.eventBus.off('save:success', this.saveSuccessListener);
    this.eventBus.off('save:auto', this.saveAutoListener);

    if (this.scene.input.keyboard) {
      this.scene.input.keyboard.off('keydown-ESC');
    }

    this.container.destroy();

    if (this.onClose) {
      this.onClose();
    }
  }
}

/**
 * 创建存档UI
 */
export function createSaveUI(config: SaveUIConfig): SaveUI {
  return new SaveUI(config);
}