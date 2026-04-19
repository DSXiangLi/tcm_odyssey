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
 * Phase 2.5 UI统一化: 继承ModalUI基类，使用FULLSCREEN_MODAL标准尺寸
 */

import Phaser from 'phaser';
import { SaveManager, SaveSlotInfo } from '../systems/SaveManager';
import { EventBus, EventData } from '../systems/EventBus';
import ModalUI from './base/ModalUI';
import { drawInsetSlotBorder } from './base/UIBorderStyles';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';

// 存档UI配置
export interface SaveUIConfig {
  scene: Phaser.Scene;
  mode?: 'save' | 'load';  // 存档模式或加载模式
  onClose?: () => void;
}

// 存档槽位UI状态
interface SlotUIState {
  container: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  info: SaveSlotInfo;
  saveButton?: Phaser.GameObjects.Text;
  loadButton?: Phaser.GameObjects.Text;
  deleteButton?: Phaser.GameObjects.Text;
  isSelected: boolean;
}

/**
 * 存档界面类
 * 继承ModalUI，使用FULLSCREEN_MODAL标准尺寸(1024×768)
 */
export class SaveUI extends ModalUI {
  private saveManager: SaveManager;
  private eventBus: EventBus;

  private titleText!: Phaser.GameObjects.Text;
  private slotsContainer!: Phaser.GameObjects.Container;

  private mode: 'save' | 'load';

  private slotUIs: SlotUIState[] = [];
  private selectedSlot: number = 1;

  // 自动存档状态显示
  private autoSaveIndicator!: Phaser.GameObjects.Text;

  // 事件监听器引用
  private saveSuccessListener: (data: EventData) => void;
  private saveAutoListener: (data: EventData) => void;

  // 样式配置（基于场景PNG配色）
  private readonly SaveUI_COLORS = {
    // 槽位状态色
    slotSelectedHighlight: 0x304030,                // 选中高亮（稍亮）
    // 文字
    title: { fontSize: '24px', color: UI_COLOR_STRINGS.TEXT_BRIGHT, fontStyle: 'bold' },
    slotText: { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_BRIGHT },
    slotInfoText: { fontSize: '12px', color: UI_COLOR_STRINGS.TEXT_TIP },
    button: { fontSize: '16px', color: UI_COLOR_STRINGS.TEXT_BRIGHT, backgroundColor: UI_COLOR_STRINGS.BUTTON_PRIMARY },
    buttonHover: { backgroundColor: UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER },
    closeButton: { fontSize: '14px', color: '#ff6b6b' }
  };

  constructor(config: SaveUIConfig) {
    // 调用父类构造函数
    // FULLSCREEN_MODAL: 1024×768
    super(
      config.scene,
      'FULLSCREEN_MODAL',
      '关闭 [ESC]',
      () => {
        // 清理事件监听
        this.eventBus.off('save:success', this.saveSuccessListener);
        this.eventBus.off('save:auto', this.saveAutoListener);

        // 调用外部onClose回调
        if (config.onClose) {
          config.onClose();
        }

        // 存档UI关闭标记
        if (typeof window !== 'undefined') {
          (window as any).__SAVE_UI_OPEN__ = false;
        }

        // 调用父类destroy
        super.destroy();
      },
      1000  // 深度层级
    );

    this.saveManager = SaveManager.getInstance();
    this.eventBus = EventBus.getInstance();

    this.mode = config.mode ?? 'save';

    // 创建监听器函数引用
    this.saveSuccessListener = (_data: EventData) => {
      this.updateAutoSaveIndicator();
    };
    this.saveAutoListener = (_data: EventData) => {
      this.updateAutoSaveIndicator();
    };

    // 创建内部UI元素
    this.createInternalUI();
    this.loadSlots();
    this.registerEvents();

    // 存档UI打开标记
    if (typeof window !== 'undefined') {
      (window as any).__SAVE_UI_OPEN__ = true;
    }

    // 暴露到全局（供测试访问）
    this.exposeToGlobal('__SAVE_UI__');
  }

  /**
   * 绘制顶层确认弹窗边框（方案C）
   * 强边框顶层 - 完全不透明 + 金棕边框 + 外发光
   *
   * 设计特征:
   * - 强阴影（8px偏移，alpha 0.6）
   * - 外发光（2px金棕，alpha 0.4）
   * - 主背景完全不透明（alpha 1.0）
   * - 强边框（4px金棕色）
   */
  private drawTopLevelConfirmBorder(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // 1. 强阴影（8px偏移，alpha 0.6）
    graphics.fillStyle(0x000000, 0.6);
    graphics.fillRect(x + 8, y + 16, width, height);

    // 2. 外发光（2px金棕，alpha 0.4）- 在弹窗外围
    graphics.lineStyle(2, UI_COLORS.BORDER_GLOW, 0.4);
    graphics.strokeRect(x - 2, y - 2, width + 4, height + 4);

    // 3. 主背景（完全不透明！灰蓝色）
    graphics.fillStyle(UI_COLORS.PANEL_PRIMARY, 1.0);
    graphics.fillRect(x, y, width, height);

    // 4. 强边框（4px金棕色）- 与主面板绿色边框不同！
    graphics.lineStyle(4, UI_COLORS.BORDER_GLOW, 1);
    graphics.strokeRect(x, y, width, height);
  }

  /**
   * 绘制内凹槽位（用于存档槽位）
   * 使用UIBorderStyles的drawInsetSlotBorder
   *
   * @param isSelected 是否选中，选中时背景稍亮
   */
  private drawSlotInset(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    isSelected: boolean = false
  ): void {
    // 如果选中，背景稍亮
    if (isSelected) {
      // 先绘制选中高亮背景
      graphics.fillStyle(this.SaveUI_COLORS.slotSelectedHighlight, 1);
      graphics.fillRect(x + 2, y + 2, width - 4, height - 4);
    }

    // 使用标准内凹边框绘制函数
    drawInsetSlotBorder(graphics, x, y, width, height);
  }

  /**
   * 创建内部UI元素（标题、槽位容器等）
   */
  private createInternalUI(): void {
    // 计算相对于容器中心的位置
    // FULLSCREEN_MODAL: 1024×768，中心为(0, 0)
    const contentStartX = -this.width / 2 + 20;  // 左侧20px边距
    const contentStartY = -this.height / 2 + 30; // 顶部30px边距（标题区域）

    // 标题 - 使用TEXT_BRIGHT提高对比度
    const titleText = this.mode === 'save' ? '存档管理' : '加载存档';
    this.titleText = this.scene.add.text(
      0,  // 相对中心
      contentStartY,
      titleText,
      this.SaveUI_COLORS.title
    ).setOrigin(0.5, 0);
    this.container.add(this.titleText);

    // 自动存档状态指示（右上角）
    this.autoSaveIndicator = this.scene.add.text(
      this.width / 2 - 20,  // 右侧20px边距
      contentStartY,
      '',
      { fontSize: '12px', color: UI_COLOR_STRINGS.TEXT_DISABLED }
    ).setOrigin(1, 0);
    this.container.add(this.autoSaveIndicator);
    this.updateAutoSaveIndicator();

    // 槽位容器（内容区域，在标题下方）
    const slotsY = contentStartY + 50;  // 标题下方50px
    this.slotsContainer = this.scene.add.container(contentStartX, slotsY);
    this.container.add(this.slotsContainer);

    // 快捷存档按钮（存档模式，底部中央）
    if (this.mode === 'save') {
      const quickSaveButton = this.scene.add.text(
        0,  // 相对中心
        this.height / 2 - 60,  // 底部60px（退出按钮上方）
        '快速存档 [当前槽位]',
        {
          fontSize: '18px',
          color: UI_COLOR_STRINGS.TEXT_BRIGHT,
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
    const slotWidth = this.width - 40;  // 全宽减去左右边距

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const yOffset = i * (slotHeight + 10);
      const isSelected = slot.slot_id === this.selectedSlot;

      const slotContainer = this.scene.add.container(0, yOffset);
      this.slotsContainer.add(slotContainer);

      // 槽位背景 - 使用内凹边框
      const slotGraphics = this.scene.add.graphics();
      this.drawSlotInset(slotGraphics, 0, 0, slotWidth, slotHeight, isSelected);
      slotContainer.add(slotGraphics);

      // 点击区域 - 使用透明Rectangle作为交互区域
      const clickArea = this.scene.add.rectangle(
        slotWidth / 2,
        slotHeight / 2,
        slotWidth,
        slotHeight,
        0x000000,
        0  // 完全透明，仅用于交互
      );
      clickArea.setInteractive({ useHandCursor: true });
      clickArea.on('pointerdown', () => {
        this.selectSlot(slot.slot_id);
      });
      slotContainer.add(clickArea);

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
            color: UI_COLOR_STRINGS.TEXT_BRIGHT,
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
            color: UI_COLOR_STRINGS.TEXT_BRIGHT,
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

      // 记录槽位UI状态
      this.slotUIs.push({
        container: slotContainer,
        graphics: slotGraphics,
        info: slot,
        isSelected: isSelected
      });
    }
  }

  /**
   * 选择槽位
   */
  private selectSlot(slotId: number): void {
    this.selectedSlot = slotId;
    this.saveManager.setCurrentSlot(slotId);

    // 更新UI显示 - 重绘槽位Graphics
    for (const slotUI of this.slotUIs) {
      const isSelected = slotUI.info.slot_id === slotId;
      slotUI.isSelected = isSelected;

      // 清除并重绘Graphics
      slotUI.graphics.clear();
      const slotWidth = this.width - 40;
      const slotHeight = 100;
      this.drawSlotInset(slotUI.graphics, 0, 0, slotWidth, slotHeight, isSelected);
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
    const dialogWidth = 300;
    const dialogHeight = 150;

    // 确认对话框相对于容器中心（居中显示）
    const dialogContainer = this.scene.add.container(0, 0);
    dialogContainer.setDepth(1100);  // 比主弹窗更高的层级
    this.container.add(dialogContainer);

    // 背景 - 使用顶层确认弹窗边框（方案C：金棕边框+完全不透明+外发光）
    const dialogGraphics = this.scene.add.graphics();
    this.drawTopLevelConfirmBorder(dialogGraphics, -dialogWidth / 2, -dialogHeight / 2, dialogWidth, dialogHeight);
    dialogContainer.add(dialogGraphics);

    // 消息 - 使用TEXT_BRIGHT
    const msgText = this.scene.add.text(0, -dialogHeight / 2 + 30, message, {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_BRIGHT
    }).setOrigin(0.5);
    dialogContainer.add(msgText);

    // 确认按钮（删除操作，使用红色警示）
    const confirmBtn = this.scene.add.text(-70, dialogHeight / 2 - 40, '确认', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_BRIGHT,
      backgroundColor: '#c75050',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    confirmBtn.setInteractive({ useHandCursor: true });
    confirmBtn.on('pointerdown', onConfirm);
    dialogContainer.add(confirmBtn);

    // 取消按钮
    const cancelBtn = this.scene.add.text(70, dialogHeight / 2 - 40, '取消', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_BRIGHT,
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
      0,  // 相对中心
      this.height / 2 - 100,  // 底部区域
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
   * 销毁（重写父类destroy，确保清理）
   */
  destroy(): void {
    // 取消事件监听
    this.eventBus.off('save:success', this.saveSuccessListener);
    this.eventBus.off('save:auto', this.saveAutoListener);

    // 存档UI关闭标记
    if (typeof window !== 'undefined') {
      (window as any).__SAVE_UI_OPEN__ = false;
    }

    // 调用父类销毁方法
    super.destroy();
  }
}

/**
 * 创建存档UI
 */
export function createSaveUI(config: SaveUIConfig): SaveUI {
  return new SaveUI(config);
}