// src/scenes/TitleScene.ts
import Phaser from 'phaser';
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../data/constants';
import { SaveManager, SaveSlotInfo } from '../systems/SaveManager';
import { EventBus } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
import { TutorialManager } from '../systems/TutorialManager';
import { TutorialUI, createCentralTutorialUI } from '../ui/TutorialUI';

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

  create(): void {
    // 更新状态桥接器 - 标识当前场景
    this.gameStateBridge.updateCurrentScene(SCENES.TITLE);
    // 检查存档
    this.hasSave = this.saveManager.hasAnySave();
    this.latestSave = this.saveManager.getLatestSave();

    // 背景
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2d5a27);

    // 标题
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, '药灵山谷', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 副标题
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3 + 60, 'v3.0 - Phase 2 NPC Agent', {
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    // 开始按钮
    const startButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, '开始游戏', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#4a7c59',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    startButton.on('pointerover', () => {
      startButton.setStyle({ backgroundColor: '#5a8c69' });
    });

    startButton.on('pointerout', () => {
      startButton.setStyle({ backgroundColor: '#4a7c59' });
    });

    startButton.on('pointerdown', () => {
      // 如果有存档，提示加载
      if (this.hasSave) {
        this.showLoadPrompt();
      } else {
        this.startNewGame();
      }
    });

    // 继续游戏按钮（如果有存档）
    if (this.hasSave) {
      const continueButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, '继续游戏', {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: '#6a8c49',
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setInteractive();

      continueButton.on('pointerover', () => {
        continueButton.setStyle({ backgroundColor: '#7a9c59' });
      });

      continueButton.on('pointerout', () => {
        continueButton.setStyle({ backgroundColor: '#6a8c49' });
      });

      continueButton.on('pointerdown', () => {
        this.loadLatestSave();
      });

      // 存档信息提示
      if (this.latestSave) {
        const savedTime = new Date(this.latestSave.saved_at!).toLocaleString('zh-CN');
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 130, `最近存档: ${savedTime}`, {
          fontSize: '12px',
          color: '#888888'
        }).setOrigin(0.5);
      }
    }

    // 存档管理按钮
    const saveManageButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + (this.hasSave ? 160 : 80), '存档管理', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#555555',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setInteractive();

    saveManageButton.on('pointerover', () => {
      saveManageButton.setStyle({ backgroundColor: '#666666' });
    });

    saveManageButton.on('pointerout', () => {
      saveManageButton.setStyle({ backgroundColor: '#555555' });
    });

    saveManageButton.on('pointerdown', () => {
      this.openSaveManagement();
    });

    // 操作提示
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 60, '方向键/WASD移动 | 空格交互 | B背包', {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);

    // 版本信息
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'Phase 2 S7: 存档系统', {
      fontSize: '12px',
      color: '#666666'
    }).setOrigin(0.5);

    // 淡入效果
    this.cameras.main.fadeIn(500);

    // 暴露存档状态到全局（供测试访问）
    this.exposeSaveStatus();
  }

  /**
   * 显示加载提示
   */
  private showLoadPrompt(): void {
    // 创建提示容器
    const promptContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    promptContainer.setDepth(100);

    // 背景
    const bg = this.add.rectangle(0, 0, 400, 200, 0x1a1a2e, 0.95);
    promptContainer.add(bg);

    // 提示文本
    const promptText = this.add.text(0, -50, '发现存档，是否加载？', {
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
    promptContainer.add(promptText);

    // 存档信息
    if (this.latestSave) {
      const savedTime = new Date(this.latestSave.saved_at!).toLocaleString('zh-CN');
      const infoText = this.add.text(0, -20, `槽位 ${this.latestSave.slot_id} | ${savedTime}`, {
        fontSize: '14px',
        color: '#aaaaaa'
      }).setOrigin(0.5);
      promptContainer.add(infoText);
    }

    // 加载按钮
    const loadBtn = this.add.text(-80, 50, '加载存档', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#4a7c59',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setInteractive();
    loadBtn.on('pointerdown', () => {
      promptContainer.destroy();
      this.loadLatestSave();
    });
    promptContainer.add(loadBtn);

    // 新游戏按钮
    const newBtn = this.add.text(80, 50, '新游戏', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#555555',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5).setInteractive();
    newBtn.on('pointerdown', () => {
      promptContainer.destroy();
      this.startNewGame();
    });
    promptContainer.add(newBtn);

    // 取消按钮
    const cancelBtn = this.add.text(0, 80, '取消', {
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5).setInteractive();
    cancelBtn.on('pointerdown', () => {
      promptContainer.destroy();
    });
    promptContainer.add(cancelBtn);
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

        // 等待一小段时间后切换场景
        this.time.delayedCall(500, () => {
          this.cameras.main.fade(500, 0, 0, 0);
          this.time.delayedCall(500, () => {
            this.scene.start(saveData.scene_state.current_scene);
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
   */
  private openSaveManagement(): void {
    // 动态导入SaveUI（避免循环依赖）
    import('../ui/SaveUI').then(({ SaveUI }) => {
      new SaveUI({
        scene: this,
        x: (GAME_WIDTH - 600) / 2,
        y: 50,
        width: 600,
        height: 450,
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