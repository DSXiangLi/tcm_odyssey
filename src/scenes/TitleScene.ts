// src/scenes/TitleScene.ts
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../data/constants';
import { SaveManager, SaveSlotInfo } from '../systems/SaveManager';
import { EventBus } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
import { TutorialManager } from '../systems/TutorialManager';
import { TutorialUI, createCentralTutorialUI } from '../ui/TutorialUI';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';

/**
 * 3D按钮配置
 */
interface Button3DConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: string;
  /** 主要颜色（渐变起点） */
  colorPrimary: number;
  /** 次要颜色（渐变终点） */
  colorSecondary: number;
  /** 边框颜色 */
  borderColor: number;
  /** 边框宽度 */
  borderWidth: number;
  /** hover边框颜色 */
  borderHoverColor: number;
  /** 圆角半径 */
  radius: number;
  onClick: () => void;
}

export class TitleScene extends Phaser.Scene {
  private saveManager: SaveManager;
  private eventBus: EventBus;
  private gameStateBridge: GameStateBridge;
  private tutorialManager: TutorialManager;  // S13.4: 新手引导管理器
  private tutorialUI: TutorialUI | null = null;  // S13.4: 新手引导UI
  private hasSave: boolean = false;
  private latestSave: SaveSlotInfo | null = null;

  constructor() {
    super({ key: SCENES.TITLE });
    this.saveManager = SaveManager.getInstance();
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();
    this.tutorialManager = TutorialManager.getInstance();  // S13.4

    // Phase 2 S7: 暴露SaveManager到全局（供测试访问）
    this.saveManager.exposeToWindow();

    // S13.4: 暴露TutorialManager到全局（供测试访问）
    this.tutorialManager.exposeToWindow();
  }

  /**
   * 创建3D立体按钮（方案A：渐变玻璃 + 金棕边框 + 顶部光带）
   */
  private createButton3D(config: Button3DConfig): Phaser.GameObjects.Container {
    const container = this.add.container(config.x, config.y);

    // 计算按钮左上角坐标（相对于容器中心）
    const left = -config.width / 2;
    const top = -config.height / 2;

    // 绘制按钮背景（Graphics）
    const graphics = this.add.graphics();

    // 绘制正常状态的按钮
    this.drawButton3DState(graphics, left, top, config.width, config.height, config, false);

    container.add(graphics);

    // 添加文字
    const textObj = this.add.text(0, 0, config.text, {
      fontSize: config.fontSize,
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(textObj);

    // 创建透明交互区域
    const hitArea = this.add.rectangle(0, 0, config.width, config.height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    container.add(hitArea);

    // hover效果
    hitArea.on('pointerover', () => {
      graphics.clear();
      this.drawButton3DState(graphics, left, top, config.width, config.height, config, true);
    });

    hitArea.on('pointerout', () => {
      graphics.clear();
      this.drawButton3DState(graphics, left, top, config.width, config.height, config, false);
    });

    hitArea.on('pointerdown', config.onClick);

    return container;
  }

  /**
   * 绘制按钮3D状态
   */
  private drawButton3DState(
    graphics: Phaser.GameObjects.Graphics,
    left: number,
    top: number,
    width: number,
    height: number,
    config: Button3DConfig,
    isHover: boolean
  ): void {
    // 1. 渐变背景（从左上到右下）
    graphics.fillGradientStyle(
      config.colorPrimary, 1,    // 左上
      config.colorSecondary, 1,  // 右上
      config.colorPrimary, 1,    // 左下
      config.colorSecondary, 1,  // 右下
    );
    graphics.fillRoundedRect(left, top, width, height, config.radius);

    // 2. 边框（hover时变亮）
    const borderColor = isHover ? config.borderHoverColor : config.borderColor;
    graphics.lineStyle(config.borderWidth, borderColor, 1);
    graphics.strokeRoundedRect(left, top, width, height, config.radius);

    // 3. 顶部高光（白色半透明，高度为高度的15%）
    const highlightHeight = Math.max(4, height * 0.15);
    graphics.fillStyle(0xffffff, isHover ? 0.25 : 0.15);
    graphics.fillRoundedRect(left, top, width, highlightHeight, {
      tl: config.radius,
      tr: config.radius,
      bl: 0,
      br: 0
    });

    // 4. 底部阴影（黑色半透明）
    const shadowHeight = Math.max(4, height * 0.1);
    graphics.fillStyle(0x000000, 0.2);
    graphics.fillRoundedRect(left, top + height - shadowHeight, width, shadowHeight, {
      tl: 0,
      tr: 0,
      bl: config.radius,
      br: config.radius
    });
  }

  create(): void {
    // 更新状态桥接器 - 标识当前场景
    this.gameStateBridge.updateCurrentScene(SCENES.TITLE);
    // 检查存档
    this.hasSave = this.saveManager.hasAnySave();
    this.latestSave = this.saveManager.getLatestSave();

    // 背景：使用场景灰蓝系（更协调）
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, UI_COLORS.PANEL_PRIMARY);

    // 标题
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, '药灵山谷', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 副标题
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3 + 60, 'v3.0 - Phase 2 NPC Agent', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_TIP  // 高对比度提示文字
    }).setOrigin(0.5);

    // 主按钮 - 3D渐变按钮（绿色渐变 + 3px边框 + 高光阴影）
    this.createButton3D({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 + 20,
      width: 160,
      height: 44,
      text: '开始游戏',
      fontSize: '24px',
      colorPrimary: UI_COLORS.BUTTON_PRIMARY,        // 0x90c070
      colorSecondary: 0x70a050,                       // 略深绿色（渐变终点）
      borderColor: UI_COLORS.BUTTON_PRIMARY,          // 亮绿边框
      borderWidth: 3,
      borderHoverColor: UI_COLORS.BUTTON_PRIMARY_HOVER, // hover变亮绿
      radius: 12,
      onClick: () => {
        // 如果有存档，提示加载
        if (this.hasSave) {
          this.showLoadPrompt();
        } else {
          this.startNewGame();
        }
      }
    });

    // 继续游戏按钮（如果有存档）- 3D渐变按钮（绿色渐变）
    if (this.hasSave) {
      this.createButton3D({
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT / 2 + 80,
        width: 160,
        height: 44,
        text: '继续游戏',
        fontSize: '24px',
        colorPrimary: UI_COLORS.BUTTON_SUCCESS,       // 0x90c070
        colorSecondary: 0x70a050,
        borderColor: UI_COLORS.BUTTON_SUCCESS,
        borderWidth: 2,
        borderHoverColor: UI_COLORS.BUTTON_PRIMARY_HOVER,
        radius: 12,
        onClick: () => {
          this.loadLatestSave();
        }
      });

      // 存档信息提示
      if (this.latestSave) {
        const savedTime = new Date(this.latestSave.saved_at!).toLocaleString('zh-CN');
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, `最近存档: ${savedTime}`, {
          fontSize: '12px',
          color: UI_COLOR_STRINGS.TEXT_TIP  // 高对比度提示文字
        }).setOrigin(0.5);
      }
    }

    // 存档管理按钮 - 3D渐变按钮（棕色渐变 + 2px边框）
    this.createButton3D({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 + (this.hasSave ? 160 : 80),
      width: 130,
      height: 34,
      text: '存档管理',
      fontSize: '18px',
      colorPrimary: UI_COLORS.BUTTON_SECONDARY,       // 0xa08060 柔和棕色
      colorSecondary: 0x806050,                        // 略深棕色
      borderColor: UI_COLORS.BUTTON_SECONDARY,
      borderWidth: 2,
      borderHoverColor: UI_COLORS.BUTTON_SECONDARY_HOVER,
      radius: 10,
      onClick: () => {
        this.openSaveManagement();
      }
    });

    // 操作提示
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '方向键/WASD移动 | 空格交互 | B背包', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_WARM  // 高对比度操作提示
    }).setOrigin(0.5);

    // 版本信息
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Phase 2 S7: 存档系统', {
      fontSize: '12px',
      color: UI_COLOR_STRINGS.TEXT_TIP  // 高对比度版本信息
    }).setOrigin(0.5);

    // 淡入效果
    this.cameras.main.fadeIn(500);

    // 暴露存档状态到全局（供测试访问）
    this.exposeSaveStatus();

    // 标记场景已准备好（供测试等待）
    (window as any).__SCENE_READY__ = true;
  }

  /**
   * 显示加载提示
   */
  private showLoadPrompt(): void {
    // 创建提示容器
    const promptContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    promptContainer.setDepth(100);

    // 背景 - 使用方案B（3D立体边框）
    const bgWidth = 400;
    const bgHeight = 200;
    const bgGraphics = this.add.graphics();

    // 渐变背景
    bgGraphics.fillGradientStyle(
      UI_COLORS.PANEL_PRIMARY, 1,
      UI_COLORS.PANEL_SECONDARY, 1,
      UI_COLORS.PANEL_PRIMARY, 1,
      UI_COLORS.PANEL_SECONDARY, 1
    );
    bgGraphics.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 16);

    // 金棕边框（顶层弹窗使用强金棕边框）
    bgGraphics.lineStyle(3, UI_COLORS.BORDER_LIGHT, 1);
    bgGraphics.strokeRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 16);

    // 顶部高光
    bgGraphics.fillStyle(0xffffff, 0.15);
    bgGraphics.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, 8, {
      tl: 16, tr: 16, bl: 0, br: 0
    });

    promptContainer.add(bgGraphics);

    // 提示文本
    const promptText = this.add.text(0, -50, '发现存档，是否加载？', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    promptContainer.add(promptText);

    // 存档信息
    if (this.latestSave) {
      const savedTime = new Date(this.latestSave.saved_at!).toLocaleString('zh-CN');
      const infoText = this.add.text(0, -20, `槽位 ${this.latestSave.slot_id} | ${savedTime}`, {
        fontSize: '14px',
        color: UI_COLOR_STRINGS.TEXT_TIP
      }).setOrigin(0.5);
      promptContainer.add(infoText);
    }

    // 加载按钮 - 3D按钮（绿色）
    this.createButtonInContainer(promptContainer, {
      x: -80,
      y: 50,
      width: 100,
      height: 32,
      text: '加载存档',
      fontSize: '16px',
      colorPrimary: UI_COLORS.BUTTON_PRIMARY,
      colorSecondary: 0x70a050,
      borderColor: UI_COLORS.BUTTON_PRIMARY,
      borderWidth: 2,
      borderHoverColor: UI_COLORS.BUTTON_PRIMARY_HOVER,
      radius: 8,
      onClick: () => {
        promptContainer.destroy();
        this.loadLatestSave();
      }
    });

    // 新游戏按钮 - 3D按钮（棕色）
    this.createButtonInContainer(promptContainer, {
      x: 80,
      y: 50,
      width: 80,
      height: 32,
      text: '新游戏',
      fontSize: '16px',
      colorPrimary: UI_COLORS.BUTTON_SECONDARY,
      colorSecondary: 0x806050,
      borderColor: UI_COLORS.BUTTON_SECONDARY,
      borderWidth: 2,
      borderHoverColor: UI_COLORS.BUTTON_SECONDARY_HOVER,
      radius: 8,
      onClick: () => {
        promptContainer.destroy();
        this.startNewGame();
      }
    });

    // 取消按钮 - 简洁文字按钮
    const cancelBtn = this.add.text(0, 85, '取消', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.TEXT_TIP
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    cancelBtn.on('pointerover', () => cancelBtn.setStyle({ color: UI_COLOR_STRINGS.TEXT_WARM }));
    cancelBtn.on('pointerout', () => cancelBtn.setStyle({ color: UI_COLOR_STRINGS.TEXT_TIP }));
    cancelBtn.on('pointerdown', () => promptContainer.destroy());
    promptContainer.add(cancelBtn);
  }

  /**
   * 在容器内创建3D按钮
   */
  private createButtonInContainer(container: Phaser.GameObjects.Container, config: Button3DConfig): void {
    const left = config.x - config.width / 2;
    const top = config.y - config.height / 2;

    // 绘制按钮背景
    const graphics = this.add.graphics();
    this.drawButton3DState(graphics, left, top, config.width, config.height, config, false);
    container.add(graphics);

    // 文字
    const textObj = this.add.text(config.x, config.y, config.text, {
      fontSize: config.fontSize,
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    container.add(textObj);

    // 交互区域
    const hitArea = this.add.rectangle(config.x, config.y, config.width, config.height, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerover', () => {
      graphics.clear();
      this.drawButton3DState(graphics, left, top, config.width, config.height, config, true);
    });

    hitArea.on('pointerout', () => {
      graphics.clear();
      this.drawButton3DState(graphics, left, top, config.width, config.height, config, false);
    });

    hitArea.on('pointerdown', config.onClick);
  }

  /**
   * 开始新游戏
   * S13.4: 新游戏时检查是否需要显示新手引导
   */
  private startNewGame(): void {
    // S13.4: 重置TutorialManager状态（新游戏）
    this.tutorialManager.reset();

    // S13.4: 检查是否需要显示新手引导
    if (!this.tutorialManager.isComplete()) {
      // 显示集中引导
      this.showTutorial();
    } else {
      // 直接进入游戏
      this.proceedToGame();
    }
  }

  /**
   * S13.4: 显示新手引导
   */
  private showTutorial(): void {
    if (this.tutorialUI) {
      this.tutorialUI.destroy();
      this.tutorialUI = null;
    }

    // 开始引导流程
    this.tutorialManager.startTutorial();

    // 创建集中引导UI
    this.tutorialUI = createCentralTutorialUI(
      this,
      () => {
        // onClose: 引导完成，进入游戏
        console.log('[TitleScene] Tutorial complete, entering game');
        this.tutorialUI = null;
        this.proceedToGame();
      },
      () => {
        // onSkip: 跳过引导，进入游戏
        console.log('[TitleScene] Tutorial skipped, entering game');
        this.tutorialUI = null;
        this.proceedToGame();
      },
      () => {
        // onNext: 步骤完成（UI内部处理）
        console.log('[TitleScene] Tutorial step completed');
      }
    );

    console.log('[TitleScene] Tutorial UI created');
  }

  /**
   * S13.4: 进入游戏（引导完成或跳过后）
   */
  private proceedToGame(): void {
    this.cameras.main.fade(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.eventBus.emit('game:new_start', { timestamp: Date.now() });
      this.scene.start(SCENES.BOOT);
    });
  }

  /**
   * 加载最新存档
   */
  private async loadLatestSave(): Promise<void> {
    if (!this.latestSave) {
      this.startNewGame();
      return;
    }

    console.log(`[TitleScene] Loading save slot ${this.latestSave.slot_id}`);

    // 显示加载提示
    const loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '正在加载存档...', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(200);

    try {
      const saveData = await this.saveManager.load(this.latestSave.slot_id);

      if (saveData) {
        loadingText.setText('加载成功!');
        loadingText.setStyle({ color: '#4a9c59' });

        // 发送加载事件
        this.eventBus.emit('game:load_complete', {
          slot_id: this.latestSave.slot_id,
          scene: saveData.scene_state.current_scene
        });

        // ⭐ 关键修复：存档加载时必须经过BootScene进行资源预加载
        // 将存档目标场景存入registry，BootScene会读取并跳转到正确场景
        this.game.registry.set('savedTargetScene', saveData.scene_state.current_scene);
        this.game.registry.set('savedPlayerPosition', saveData.scene_state.player_position);

        console.log(`[TitleScene] Saved target scene to registry: ${saveData.scene_state.current_scene}`);

        // 等待一小段时间后切换到BootScene（资源加载）
        this.time.delayedCall(500, () => {
          this.cameras.main.fade(500, 0, 0, 0);
          this.time.delayedCall(500, () => {
            // 跳转到BootScene进行资源加载，而非直接跳转到存档场景
            this.scene.start(SCENES.BOOT);
          });
        });
      } else {
        loadingText.setText('加载失败，开始新游戏');
        loadingText.setStyle({ color: '#c75050' });

        this.time.delayedCall(1000, () => {
          this.startNewGame();
        });
      }
    } catch (error) {
      console.error('[TitleScene] Load error:', error);
      loadingText.setText('加载出错，开始新游戏');
      loadingText.setStyle({ color: '#c75050' });

      this.time.delayedCall(1000, () => {
        this.startNewGame();
      });
    }
  }

  /**
   * 打开存档管理
   * Phase 2.5: SaveUI使用FULLSCREEN_MODAL标准尺寸(1024×768)
   */
  private openSaveManagement(): void {
    // 动态导入SaveUI（避免循环依赖）
    import('../ui/SaveUI').then(({ SaveUI }) => {
      new SaveUI({
        scene: this,
        mode: 'load',
        onClose: () => {
          // 刷新存档状态
          this.hasSave = this.saveManager.hasAnySave();
          this.latestSave = this.saveManager.getLatestSave();
        }
      });
    });
  }

  /**
   * 暴露存档状态到全局
   * S13.4: 同时暴露新手引导状态
   */
  private exposeSaveStatus(): void {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__TITLE_SAVE_STATUS__ = {
        hasSave: this.hasSave,
        latestSave: this.latestSave
      };
      // S13.4: 暴露新手引导状态
      (window as unknown as Record<string, unknown>).__TITLE_TUTORIAL_STATUS__ = {
        tutorialComplete: this.tutorialManager.isComplete(),
        tutorialPhase: this.tutorialManager.getState().phase,
        tutorialUIVisible: this.tutorialUI !== null
      };
    }
  }
}