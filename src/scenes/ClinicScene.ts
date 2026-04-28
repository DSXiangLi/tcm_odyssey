// src/scenes/ClinicScene.ts
/**
 * 青木诊所场景
 *
 * Phase 1.5 更新:
 * - 使用缩放后的诊所全景图（44×24瓦片，与药园尺寸一致）
 * - 基于可行走瓦片实现碰撞检测
 * - 玩家缩放与药园一致（0.35）
 *
 * Phase 2 S3 更新:
 * - 添加青木先生NPC交互
 * - 支持流式对话输出
 *
 * Phase 2 S4 更新:
 * - 添加问诊入口按钮
 * - 支持开始问诊流程
 *
 * Phase 2 S5 更新:
 * - 添加病案查看入口
 * - 支持病案列表和详情界面
 */
import Phaser from 'phaser';
import { SCENES, TILE_SIZE } from '../data/constants';
import { CLINIC_SCALED_CONFIG } from '../data/clinic-scaled-walkable-config';
import { UI_COLOR_STRINGS } from '../data/ui-color-theme';
import { Player } from '../entities/Player';
import { EventBus, GameEvents } from '../systems/EventBus';
import { GameStateBridge } from '../utils/GameStateBridge';
import { DialogUI, DialogUIConfig } from '../ui/DialogUI';
import { NPCInteractionSystem, NPCConfig } from '../systems/NPCInteraction';
// Phase 2 S5: 病案系统
import { CaseManager, createCaseManager } from '../systems/CaseManager';
import { CasesListUI, CasesListUIConfig } from '../ui/CasesListUI';
import { CaseDetailUI, CaseDetailUIConfig } from '../ui/CaseDetailUI';
// Phase 2 S8: 背包系统
import { InventoryManager, createInventoryManager } from '../systems/InventoryManager';
import { InventoryUI, createInventoryUI } from '../ui/InventoryUI';
// Phase 2 S13.4: 新手引导系统
import { TutorialManager } from '../systems/TutorialManager';
import { createSceneTipUI, TutorialUI } from '../ui/TutorialUI';

interface MapData {
  width: number;
  height: number;
  walkableTiles: Set<string>;
}

export class ClinicScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private isTransitioning: boolean = false;
  private eventBus!: EventBus;
  private gameStateBridge!: GameStateBridge;
  private mapData!: MapData;
  private background!: Phaser.GameObjects.Image;
  // 地图居中偏移量（当视口 > 地图时）
  private mapOffsetX: number = 0;
  private mapOffsetY: number = 0;
  // Phase 2 S3: NPC交互系统
  private dialogUI: DialogUI | null = null;
  private npcSystem!: NPCInteractionSystem;
  private npcSprite!: Phaser.GameObjects.Image;
  private dialogShown: boolean = false;
  // Phase 2 S4: 问诊入口
  private inquiryButton!: Phaser.GameObjects.Text;
  private inquiryStartKey!: Phaser.Input.Keyboard.Key;
  // Phase 2 S5: 病案系统
  private caseManager!: CaseManager;
  private casesButton!: Phaser.GameObjects.Text;
  private casesOpenKey!: Phaser.Input.Keyboard.Key;
  private casesListUI: CasesListUI | null = null;
  private caseDetailUI: CaseDetailUI | null = null;
  private casesInitialized: boolean = false;
  // Phase 2 S8: 背包系统
  private inventoryManager!: InventoryManager;
  private inventoryKey!: Phaser.Input.Keyboard.Key;
  private inventoryUI: InventoryUI | null = null;
  // Phase 2 S9: 煎药系统
  private decoctionButton!: Phaser.GameObjects.Text;
  private decoctionKey!: Phaser.Input.Keyboard.Key;
  // Phase 2.5: 诊断系统
  private diagnosisButton!: Phaser.GameObjects.Text;
  private diagnosisKey!: Phaser.Input.Keyboard.Key;
  // Phase 2 S13.4: 新手引导系统
  private tutorialManager!: TutorialManager;
  private sceneTipUI: TutorialUI | null = null;

  constructor() {
    super({ key: SCENES.CLINIC });
    // Phase 2 S3: 初始化NPC交互系统
    this.npcSystem = new NPCInteractionSystem('player_001');
    // Phase 2 S5: 初始化病案管理器
    this.caseManager = createCaseManager('player_001', 'qingmu');
    // Phase 2 S8: 初始化背包管理器
    this.inventoryManager = createInventoryManager('player_001');
  }

  create(): void {
    // ⭐ 关键修复：显式重置isTransitioning，确保create()时状态正确
    // Phaser场景reuse时，类字段可能保留旧值
    this.isTransitioning = false;

    // 初始化事件系统
    this.eventBus = EventBus.getInstance();
    this.gameStateBridge = GameStateBridge.getInstance();
    this.tutorialManager = TutorialManager.getInstance();  // S13.4

    this.eventBus.emit(GameEvents.SCENE_CREATE, { sceneName: SCENES.CLINIC });

    // S13.4: 检查是否应该显示场景提示
    this.checkAndShowSceneTip();

    // ⭐ 关键修复：订阅wake事件，确保从sleep状态唤醒时重置isTransitioning
    this.events.on('wake', () => {
      this.isTransitioning = false;
      this.gameStateBridge.updateCurrentScene(SCENES.CLINIC);
      console.log('[ClinicScene] wake event received, isTransitioning reset to false');
    });

    // Phase 1.5: 加载背景图
    this.createBackground();

    // 创建地图数据
    this.mapData = {
      width: CLINIC_SCALED_CONFIG.width,
      height: CLINIC_SCALED_CONFIG.height,
      walkableTiles: CLINIC_SCALED_CONFIG.walkableTiles
    };

    // 更新状态桥接器
    this.gameStateBridge.updateCurrentScene(SCENES.CLINIC);
    this.gameStateBridge.updateSceneSize({
      width: this.mapData.width,
      height: this.mapData.height
    });

    // 创建玩家
    this.createPlayer();

    // 设置相机
    this.setupCamera();

    // 设置输入
    this.setupInput();

    // 添加UI提示
    this.add.text(10, 10, '青木诊所 (Phase 1.5)', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 }
    }).setScrollFactor(0);

    this.add.text(10, 40, '按空格键返回室外', {
      fontSize: '12px',
      color: '#aaaaaa'
    }).setScrollFactor(0);

    // Phase 2 S4: 创建问诊入口按钮
    this.createInquiryButton();

    // Phase 2 S5: 创建病案查看入口按钮
    this.createCasesButton();

    // Phase 2 S8: 创建背包入口按钮
    this.createInventoryButton();

    // Phase 2 S9: 创建煎药入口按钮
    this.createDecoctionButton();

    // Phase 2.5: 创建诊断入口按钮
    this.createDiagnosisButton();

    // Phase 2.5: 监听诊断开始事件
    this.setupDiagnosisEventListener();

    // Phase 2 S5: 初始化病案管理器
    this.initializeCaseManager();

    // Phase 2 S3: 创建NPC
    this.createNPC();

    this.eventBus.emit(GameEvents.SCENE_READY, { sceneName: SCENES.CLINIC });
    (window as any).__SCENE_READY__ = true;
  }

  /**
   * Phase 2 S3: 创建NPC
   */
  private createNPC(): void {
    // 注册青木先生NPC
    const qingmuConfig: NPCConfig = {
      id: 'qingmu',
      name: '青木先生',
      sceneId: SCENES.CLINIC,
      position: { x: 200, y: 150 },  // NPC位置（像素坐标）
      triggerDistance: 100
    };
    this.npcSystem.registerNPC(qingmuConfig);

    // 创建NPC sprite（占位图形）
    // 使用简单的圆形作为NPC占位符
    this.npcSprite = this.add.image(200, 150, '__DEFAULT');
    this.npcSprite.setDisplaySize(64, 64);
    this.npcSprite.setTint(0x8B4513);  // 古朴棕色
    this.npcSprite.setDepth(5);

    // 添加NPC名字标签
    const nameLabel = this.add.text(200, 200, '青木先生', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#333333aa',
      padding: { x: 4, y: 2 }
    });
    nameLabel.setOrigin(0.5);
    nameLabel.setDepth(5);

    // 进入触发
    this.npcSystem.recordEnter('qingmu');

    // 显示欢迎对话（延迟1秒，等待场景完全加载）
    this.time.delayedCall(1000, () => {
      this.showWelcomeDialog();
    });
  }

  /**
   * Phase 2 S3: 显示欢迎对话
   */
  private async showWelcomeDialog(): Promise<void> {
    if (this.dialogShown) return;
    this.dialogShown = true;

    // 检查Hermes服务是否可用
    const isAvailable = await this.npcSystem.checkConnection();

    if (!isAvailable) {
      // Hermes服务不可用，显示占位文字
      console.warn('[ClinicScene] Hermes service not available, showing placeholder dialog');
      this.showPlaceholderDialog();
      return;
    }

    // 创建DialogUI
    const dialogConfig: DialogUIConfig = {
      npcId: 'qingmu',
      npcName: '青木先生',
      npcAvatarKey: 'avatar_qingmu',
      playerId: 'player_001',
      onComplete: () => {
        console.log('[ClinicScene] Welcome dialog complete');
      }
    };

    // DialogUI位置：屏幕底部中央
    const dialogX = this.cameras.main.width / 2;
    const dialogY = this.cameras.main.height - 120;

    this.dialogUI = new DialogUI(this, dialogX, dialogY, dialogConfig);
    this.dialogUI.setScrollFactor(0);  // 固定在屏幕上

    // 暴露DialogUI状态到全局（供测试访问）
    this.exposeDialogUIToGlobal();

    // 发送欢迎消息
    try {
      await this.dialogUI.sendMessage('你好，我是新来的学生');
    } catch (error) {
      console.error('[ClinicScene] Dialog error:', error);
      this.showPlaceholderDialog();
    }
  }

  /**
   * Phase 2 S3: 显示占位对话（当Hermes不可用时）
   */
  private showPlaceholderDialog(): void {
    const placeholderText = '你好，欢迎来到青木诊所。\n我是一名老中医，愿意传授你中医知识。\n请多多学习，勤加练习。';

    // 创建简单的文本框
    const dialogBg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height - 120,
      600, 200, 0x333333, 0.9
    );
    dialogBg.setOrigin(0.5);
    dialogBg.setScrollFactor(0);
    dialogBg.setDepth(100);

    const nameText = this.add.text(
      this.cameras.main.width / 2 - 250,
      this.cameras.main.height - 180,
      '青木先生',
      { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }
    );
    nameText.setScrollFactor(0);
    nameText.setDepth(100);

    const contentText = this.add.text(
      this.cameras.main.width / 2 - 250,
      this.cameras.main.height - 150,
      placeholderText,
      { fontSize: '16px', color: '#ffffff', wordWrap: { width: 500 } }
    );
    contentText.setScrollFactor(0);
    contentText.setDepth(100);

    // 添加提示文字
    const hintText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 40,
      '[Hermes服务未连接，显示占位对话]',
      { fontSize: '12px', color: '#ff6600' }
    );
    hintText.setOrigin(0.5);
    hintText.setScrollFactor(0);
    hintText.setDepth(100);

    // 暴露占位对话状态到全局（供测试访问）
    this.exposePlaceholderDialogToGlobal(placeholderText);
  }

  /**
   * Phase 2 S3: 暴露DialogUI状态到全局（供测试访问）
   * 注意：DialogUI 自己也会暴露状态，这里只是确保在创建后立即可用
   */
  private exposeDialogUIToGlobal(): void {
    if (typeof window !== 'undefined' && this.dialogUI) {
      const status = this.dialogUI.getStatus();
      (window as any).__DIALOG_UI__ = {
        npcId: status.npcId,
        npcName: status.npcName,
        visible: true,
        isGenerating: status.isGenerating,
        currentText: () => status.currentText
      };
    }
  }

  /**
   * Phase 2 S3: 暴露占位对话状态到全局（供测试访问）
   */
  private exposePlaceholderDialogToGlobal(text: string): void {
    if (typeof window !== 'undefined') {
      (window as any).__DIALOG_UI__ = {
        npcId: 'qingmu',
        npcName: '青木先生',
        visible: true,
        currentText: () => text,
        isPlaceholder: true
      };
    }
  }

  /**
   * Phase 1.5: 加载背景图
   * 当视口 > 地图时，背景居中显示
   */
  private createBackground(): void {
    const config = CLINIC_SCALED_CONFIG;
    const mapPixelWidth = config.width * TILE_SIZE;
    const mapPixelHeight = config.height * TILE_SIZE;

    // 计算视口中地图居中的偏移量
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;
    const offsetX = Math.max(0, (gameWidth - mapPixelWidth) / 2);
    const offsetY = Math.max(0, (gameHeight - mapPixelHeight) / 2);

    // 背景放在视口中心
    this.background = this.add.image(
      offsetX + mapPixelWidth / 2,
      offsetY + mapPixelHeight / 2,
      'clinic_background'
    );

    this.background.setDisplaySize(mapPixelWidth, mapPixelHeight);
    this.background.setOrigin(0.5);
    this.background.setDepth(0);

    // 存储偏移量供后续使用
    this.mapOffsetX = offsetX;
    this.mapOffsetY = offsetY;
  }

  private createPlayer(): void {
    let spawnX: number;
    let spawnY: number;

    const registrySpawnPoint = this.registry.get('spawnPoint');
    if (registrySpawnPoint) {
      spawnX = registrySpawnPoint.x * TILE_SIZE + TILE_SIZE / 2;
      spawnY = registrySpawnPoint.y * TILE_SIZE + TILE_SIZE / 2;
      this.registry.remove('spawnPoint');
    } else {
      const configSpawn = CLINIC_SCALED_CONFIG.playerSpawnPoint;
      spawnX = configSpawn.x * TILE_SIZE + TILE_SIZE / 2;
      spawnY = configSpawn.y * TILE_SIZE + TILE_SIZE / 2;
    }

    // 更新物理世界边界（相对于偏移量）
    const mapPixelWidth = this.mapData.width * TILE_SIZE;
    const mapPixelHeight = this.mapData.height * TILE_SIZE;
    this.physics.world.setBounds(this.mapOffsetX, this.mapOffsetY, mapPixelWidth, mapPixelHeight);

    // 玩家位置加上偏移量（地图居中时）
    this.player = new Player({
      scene: this,
      x: spawnX + this.mapOffsetX,
      y: spawnY + this.mapOffsetY
    });
    this.player.setDepth(10);

    // Phase 1.5: 诊所缩放后与药园尺寸一致，玩家缩放也保持一致
    // 44×24瓦片场景，玩家缩放0.35（与药园相同）
    this.player.setScale(0.35);

    this.gameStateBridge.updatePlayerState({
      x: this.player.x,
      y: this.player.y,
      tileX: Math.floor((this.player.x - this.mapOffsetX) / TILE_SIZE),
      tileY: Math.floor((this.player.y - this.mapOffsetY) / TILE_SIZE),
      speed: this.player.speed,
      velocity: { x: 0, y: 0 }
    });
  }

  private setupCamera(): void {
    const mapPixelWidth = this.mapData.width * TILE_SIZE;
    const mapPixelHeight = this.mapData.height * TILE_SIZE;

    // 当视口 > 地图时，地图居中显示
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;

    if (gameWidth > mapPixelWidth || gameHeight > mapPixelHeight) {
      // 计算地图居中的偏移量
      const offsetX = (gameWidth - mapPixelWidth) / 2;
      const offsetY = (gameHeight - mapPixelHeight) / 2;

      // 相机边界：以地图居中位置为基准
      this.cameras.main.setBounds(offsetX, offsetY, mapPixelWidth, mapPixelHeight);

      // 相机居中在地图中心，不跟随玩家
      this.cameras.main.centerOn(offsetX + mapPixelWidth / 2, offsetY + mapPixelHeight / 2);
    } else {
      // 视口 <= 地图，正常边界和跟随
      this.cameras.main.setBounds(0, 0, mapPixelWidth, mapPixelHeight);
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.inquiryStartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
      // Phase 2 S5: 病案查看快捷键
      this.casesOpenKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
      // Phase 2 S8: 背包快捷键
      this.inventoryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
      // Phase 2 S9: 煎药快捷键
      this.decoctionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.input.keyboard.addKeys('W,A,S,D');
    }
  }

  /**
   * Phase 2 S4: 创建问诊入口按钮
   */
  private createInquiryButton(): void {
    this.inquiryButton = this.add.text(10, 70, '[按 I 开始问诊]', {
      fontSize: '14px',
      color: UI_COLOR_STRINGS.BUTTON_SUCCESS,  // #60a040 场景提取绿
      backgroundColor: '#333333aa',
      padding: { x: 8, y: 4 }
    });
    this.inquiryButton.setScrollFactor(0);
    this.inquiryButton.setInteractive({ useHandCursor: true });
    this.inquiryButton.on('pointerdown', () => this.startInquiry());
  }

  /**
   * Phase 2 S5: 创建病案查看入口按钮
   */
  private createCasesButton(): void {
    this.casesButton = this.add.text(10, 100, '[按 C 查看病案]', {
      fontSize: '14px',
      color: '#ffcc00',
      backgroundColor: '#333333aa',
      padding: { x: 8, y: 4 }
    });
    this.casesButton.setScrollFactor(0);
    this.casesButton.setInteractive({ useHandCursor: true });
    this.casesButton.on('pointerdown', () => this.showCasesList());
  }

  /**
   * Phase 2 S8: 创建背包入口按钮
   */
  private createInventoryButton(): void {
    const inventoryButton = this.add.text(10, 130, '[按 B 打开背包]', {
      fontSize: '14px',
      color: '#4a7c59',
      backgroundColor: '#333333aa',
      padding: { x: 8, y: 4 }
    });
    inventoryButton.setScrollFactor(0);
    inventoryButton.setInteractive({ useHandCursor: true });
    inventoryButton.on('pointerdown', () => this.toggleInventory());
  }

  /**
   * Phase 2 S9: 创建煎药入口按钮
   */
  private createDecoctionButton(): void {
    this.decoctionButton = this.add.text(10, 160, '[按 D 开始煎药]', {
      fontSize: '14px',
      color: '#d4a574',  // 古朴金色
      backgroundColor: '#333333aa',
      padding: { x: 8, y: 4 }
    });
    this.decoctionButton.setScrollFactor(0);
    this.decoctionButton.setInteractive({ useHandCursor: true });
    this.decoctionButton.on('pointerdown', () => this.startDecoction());
  }

  /**
   * Phase 2.5: 创建诊断入口按钮
   */
  private createDiagnosisButton(): void {
    this.diagnosisButton = this.add.text(10, 190, '[按 Z 开始诊断]', {
      fontSize: '14px',
      color: '#80c0a0',  // 青绿色
      backgroundColor: '#333333aa',
      padding: { x: 8, y: 4 }
    });
    this.diagnosisButton.setScrollFactor(0);
    this.diagnosisButton.setInteractive({ useHandCursor: true });
    this.diagnosisButton.on('pointerdown', () => this.startDiagnosis('case-001'));

    // 设置快捷键
    this.diagnosisKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
  }

  /**
   * Phase 2.5: 监听诊断开始事件
   */
  private setupDiagnosisEventListener(): void {
    // 监听 diagnosis:start 事件（来自 CasesListUI 或 NPC 系统）
    window.addEventListener('diagnosis:start', ((e: CustomEvent) => {
      const caseId = e.detail?.caseId || 'case-001';
      console.log('[ClinicScene] Received diagnosis:start event, caseId:', caseId);
      this.startDiagnosis(caseId);
    }) as EventListener);
  }

  /**
   * Phase 2.5: 开始诊断
   */
  private startDiagnosis(caseId: string): void {
    if (this.isTransitioning) return;

    console.log('[ClinicScene] Starting diagnosis with case:', caseId);

    // 发送事件
    this.eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: SCENES.CLINIC,
      to: SCENES.DIAGNOSIS,
      data: { caseId }
    });

    this.isTransitioning = true;

    // 切换到诊断场景
    this.scene.start(SCENES.DIAGNOSIS, { caseId, returnScene: SCENES.CLINIC });
  }

  /**
   * Phase 2 S5: 初始化病案管理器
   */
  private async initializeCaseManager(): Promise<void> {
    try {
      await this.caseManager.initialize();
      this.casesInitialized = true;
      console.log('[ClinicScene] Case manager initialized');

      // 暴露病案状态到全局（供测试访问）
      this.exposeCasesToGlobal();
    } catch (error) {
      console.error('[ClinicScene] Failed to initialize case manager:', error);
    }
  }

  /**
   * Phase 2 S5: 显示病案列表
   */
  private showCasesList(): void {
    if (this.casesListUI) {
      this.casesListUI.destroy();
      this.casesListUI = null;
      return;
    }

    if (!this.casesInitialized) {
      console.warn('[ClinicScene] Case manager not initialized');
      return;
    }

    // 创建病案列表UI
    const config: CasesListUIConfig = {
      caseManager: this.caseManager,
      onCaseSelect: (caseId: string) => {
        this.startCaseInquiry(caseId);
      },
      onCaseDetail: (caseId: string) => {
        this.showCaseDetail(caseId);
      },
      onClose: () => {
        this.casesListUI?.destroy();
        this.casesListUI = null;
      }
    };

    // Phase 2.5 UI统一化: ModalUI自动放置在屏幕中央
    this.casesListUI = new CasesListUI(this, config);
    this.casesListUI.setScrollFactor(0);

    console.log('[ClinicScene] Cases list shown');
  }

  /**
   * Phase 2 S5: 显示病案详情
   */
  private showCaseDetail(caseId: string): void {
    // 关闭病案列表
    if (this.casesListUI) {
      this.casesListUI.destroy();
      this.casesListUI = null;
    }

    if (!this.casesInitialized) {
      console.warn('[ClinicScene] Case manager not initialized');
      return;
    }

    // 创建病案详情UI
    const config: CaseDetailUIConfig = {
      caseId,
      caseManager: this.caseManager,
      onStartCase: (caseId: string) => {
        this.startCaseInquiry(caseId);
      },
      onClose: () => {
        this.caseDetailUI?.destroy();
        this.caseDetailUI = null;
        // 返回病案列表
        this.showCasesList();
      }
    };

    // Phase 2.5 UI统一化: ModalUI自动放置在屏幕中央
    this.caseDetailUI = new CaseDetailUI(this, config);
    this.caseDetailUI.setScrollFactor(0);

    console.log(`[ClinicScene] Case detail shown for ${caseId}`);
  }

  /**
   * Phase 2 S5: 开始特定病案的问诊
   */
  private startCaseInquiry(caseId: string): void {
    if (this.isTransitioning) return;

    // 检查病案是否可以开始
    if (!this.caseManager.canStartCase(caseId)) {
      console.warn(`[ClinicScene] Case ${caseId} cannot be started`);
      // 显示解锁条件
      const unlockCondition = this.caseManager.getUnlockCondition(caseId);
      console.log(`[ClinicScene] Unlock condition: ${unlockCondition}`);
      return;
    }

    // 开始病案
    this.caseManager.startCase(caseId);

    // 关闭UI
    if (this.casesListUI) {
      this.casesListUI.destroy();
      this.casesListUI = null;
    }
    if (this.caseDetailUI) {
      this.caseDetailUI.destroy();
      this.caseDetailUI = null;
    }

    console.log(`[ClinicScene] Starting inquiry for case ${caseId}`);

    // 发送事件
    this.eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: SCENES.CLINIC,
      to: SCENES.INQUIRY,
      data: { caseId }
    });

    this.isTransitioning = true;

    // 切换到问诊场景
    this.scene.start(SCENES.INQUIRY, { caseId });
  }

  /**
   * Phase 2 S5: 暴露病案状态到全局（供测试访问）
   */
  private exposeCasesToGlobal(): void {
    if (typeof window !== 'undefined') {
      // 暴露完整的CaseManager实例（供测试调用方法）
      (window as any).__CASE_MANAGER__ = this.caseManager;

      // 同时暴露统计数据快照（方便快速检查）
      const stats = this.caseManager.getStatistics();
      (window as any).__CASE_STATISTICS__ = {
        initialized: this.casesInitialized,
        totalCases: stats.total,
        completedCases: stats.completed,
        lockedCases: stats.locked,
        unlockedCases: stats.unlocked,
        inProgressCases: stats.in_progress,
        averageScore: stats.average_score
      };
    }
  }

  /**
   * Phase 2 S4: 开始问诊
   */
  private startInquiry(): void {
    if (this.isTransitioning) return;

    console.log('[ClinicScene] Starting inquiry...');

    // 发送事件
    this.eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: SCENES.CLINIC,
      to: SCENES.INQUIRY,
      data: { caseId: 'case_001' }
    });

    this.isTransitioning = true;

    // 切换到问诊场景
    this.scene.start(SCENES.INQUIRY, { caseId: 'case_001' });
  }

  /**
   * Phase 2 S9: 开始煎药
   */
  private startDecoction(): void {
    if (this.isTransitioning) return;

    console.log('[ClinicScene] Starting decoction...');

    // 发送事件
    this.eventBus.emit(GameEvents.SCENE_SWITCH, {
      from: SCENES.CLINIC,
      to: SCENES.DECOCTION,
      data: {}
    });

    this.isTransitioning = true;

    // 切换到煎药场景
    this.scene.start(SCENES.DECOCTION, {});
  }

  /**
   * 检查目标位置是否可行走
   */
  private canMoveTo(x: number, y: number): boolean {
    // 减去偏移量得到地图内的相对坐标
    const tileX = Math.floor((x - this.mapOffsetX) / TILE_SIZE);
    const tileY = Math.floor((y - this.mapOffsetY) / TILE_SIZE);
    return this.mapData.walkableTiles.has(`${tileX},${tileY}`);
  }

  /**
   * 确保玩家位置在可行走区域
   */
  private enforceWalkablePosition(): void {
    const currentTileX = Math.floor((this.player.x - this.mapOffsetX) / TILE_SIZE);
    const currentTileY = Math.floor((this.player.y - this.mapOffsetY) / TILE_SIZE);
    const currentKey = `${currentTileX},${currentTileY}`;

    if (!this.mapData.walkableTiles.has(currentKey)) {
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: -1, dy: -1 },
        { dx: 1, dy: -1 },
        { dx: -1, dy: 1 },
        { dx: 1, dy: 1 },
      ];

      for (const dir of directions) {
        const checkX = currentTileX + dir.dx;
        const checkY = currentTileY + dir.dy;
        const checkKey = `${checkX},${checkY}`;

        if (this.mapData.walkableTiles.has(checkKey)) {
          const newX = checkX * TILE_SIZE + TILE_SIZE / 2;
          const newY = checkY * TILE_SIZE + TILE_SIZE / 2;
          this.player.setPosition(newX, newY);
          this.player.stop();
          return;
        }
      }

      // 推回出生点
      const spawnX = CLINIC_SCALED_CONFIG.playerSpawnPoint.x * TILE_SIZE + TILE_SIZE / 2;
      const spawnY = CLINIC_SCALED_CONFIG.playerSpawnPoint.y * TILE_SIZE + TILE_SIZE / 2;
      this.player.setPosition(spawnX, spawnY);
      this.player.stop();
    }
  }

  update(): void {
    if (!this.player || !this.cursors) {
      return;
    }

    // 确保玩家位置在可行走区域
    this.enforceWalkablePosition();

    const direction = { x: 0, y: 0 };

    if (this.cursors.left.isDown || this.input.keyboard?.addKey('A').isDown) {
      direction.x = -1;
    } else if (this.cursors.right.isDown || this.input.keyboard?.addKey('D').isDown) {
      direction.x = 1;
    }

    if (this.cursors.up.isDown || this.input.keyboard?.addKey('W').isDown) {
      direction.y = -1;
    } else if (this.cursors.down.isDown || this.input.keyboard?.addKey('S').isDown) {
      direction.y = 1;
    }

    // 检查目标位置是否可行走
    if (direction.x !== 0 || direction.y !== 0) {
      let velocityX = direction.x * this.player.speed;
      let velocityY = direction.y * this.player.speed;

      if (velocityX !== 0 && velocityY !== 0) {
        velocityX *= 0.707;
        velocityY *= 0.707;
      }

      const predictedX = this.player.x + velocityX * 0.016;
      const predictedY = this.player.y + velocityY * 0.016;

      if (this.canMoveTo(predictedX, predictedY)) {
        this.player.move(direction);
      } else {
        const predictedXOnly = this.player.x + velocityX * 0.016;
        const predictedYOnly = this.player.y + velocityY * 0.016;

        if (direction.x !== 0 && this.canMoveTo(predictedXOnly, this.player.y)) {
          this.player.move({ x: direction.x, y: 0 });
        } else if (direction.y !== 0 && this.canMoveTo(this.player.x, predictedYOnly)) {
          this.player.move({ x: 0, y: direction.y });
        } else {
          this.player.stop();
        }
      }
    } else {
      this.player.stop();
    }

    this.player.updatePositionTracking();

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.gameStateBridge.updatePlayerState({
      x: this.player.x,
      y: this.player.y,
      tileX: Math.floor((this.player.x - this.mapOffsetX) / TILE_SIZE),
      tileY: Math.floor((this.player.y - this.mapOffsetY) / TILE_SIZE),
      speed: this.player.speed,
      velocity: { x: body.velocity.x, y: body.velocity.y }
    });

    // 空格键返回室外
    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isTransitioning) {
      this.eventBus.emit(GameEvents.SCENE_SWITCH, {
        from: SCENES.CLINIC,
        to: SCENES.TOWN_OUTDOOR
      });

      this.isTransitioning = true;
      this.registry.set('spawnPoint', { x: 60, y: 10 });
      this.scene.start(SCENES.TOWN_OUTDOOR);
    }

    // Phase 2 S4: I键开始问诊
    if (Phaser.Input.Keyboard.JustDown(this.inquiryStartKey) && !this.isTransitioning) {
      this.startInquiry();
    }

    // Phase 2 S5: C键打开病案列表
    if (Phaser.Input.Keyboard.JustDown(this.casesOpenKey) && !this.isTransitioning) {
      this.showCasesList();
    }

    // Phase 2 S8: B键打开背包
    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.toggleInventory();
    }

    // Phase 2 S9: D键开始煎药
    if (Phaser.Input.Keyboard.JustDown(this.decoctionKey) && !this.isTransitioning) {
      this.startDecoction();
    }

    // Phase 2.5: Z键开始诊断
    if (Phaser.Input.Keyboard.JustDown(this.diagnosisKey) && !this.isTransitioning) {
      this.startDiagnosis('case-001');
    }
  }

  shutdown(): void {
    // Phase 2 S3: 清理NPC系统
    if (this.dialogUI) {
      this.dialogUI.destroy();
      this.dialogUI = null;
    }
    if (this.npcSystem) {
      this.npcSystem.destroy();
    }
    // Phase 2 S5: 清理病案系统
    if (this.casesListUI) {
      this.casesListUI.destroy();
      this.casesListUI = null;
    }
    if (this.caseDetailUI) {
      this.caseDetailUI.destroy();
      this.caseDetailUI = null;
    }
    if (this.caseManager) {
      this.caseManager.destroy();
    }
    // Phase 2 S8: 清理背包系统
    if (this.inventoryUI) {
      this.inventoryUI.destroy();
      this.inventoryUI = null;
    }
    if (this.inventoryManager) {
      this.inventoryManager.destroy();
    }
    // Phase 2 S9: 煎药按钮会随场景自动销毁
    this.dialogShown = false;
    this.casesInitialized = false;

    // S13.4: 清理场景提示UI
    if (this.sceneTipUI) {
      this.sceneTipUI.destroy();
      this.sceneTipUI = null;
    }

    // ⭐ 关键修复：重置 isTransitioning 状态，确保再次进入时能触发门交互
    this.isTransitioning = false;

    // 清理全局引用
    if (typeof window !== 'undefined') {
      (window as any).__CASE_MANAGER__ = null;
      (window as any).__DIALOG_UI__ = null;
    }

    this.eventBus.emit(GameEvents.SCENE_DESTROY, { sceneName: SCENES.CLINIC });
  }

  /**
   * Phase 2 S8: 切换背包显示
   */
  private toggleInventory(): void {
    if (!this.inventoryUI) {
      // 创建背包UI
      this.inventoryUI = createInventoryUI(this, () => {
        console.log('[ClinicScene] Inventory closed');
      });
      this.inventoryManager.exposeToWindow();
      console.log('[ClinicScene] Inventory UI created');
    }

    if (this.inventoryUI.isShowing()) {
      this.inventoryUI.hide();
    } else {
      this.inventoryUI.show();
    }
  }

  // ⭐ 关键修复：当场景从sleep状态唤醒时，重置isTransitioning
  // Phaser场景生命周期：sleep → wake() 而非 shutdown() → create()
  wake(): void {
    this.isTransitioning = false;
    console.log('[ClinicScene] wake() called, isTransitioning reset to false');
  }

  /**
   * S13.4: 检查并显示场景提示
   */
  private checkAndShowSceneTip(): void {
    const sceneKey = SCENES.CLINIC;

    if (this.tutorialManager.shouldShowSceneTip(sceneKey)) {
      // 获取场景提示配置
      const tipConfig = this.tutorialManager.getSceneTipInfo(sceneKey);

      if (tipConfig) {
        console.log(`[ClinicScene] Showing scene tip for ${sceneKey}`);

        // 创建场景提示UI
        this.sceneTipUI = createSceneTipUI(
          this,
          tipConfig,
          () => {
            // onClose: 提示关闭后标记已显示
            this.tutorialManager.markSceneTipShown(sceneKey);
            this.sceneTipUI = null;
            console.log(`[ClinicScene] Scene tip shown and marked for ${sceneKey}`);
          }
        );
      }
    }
  }
}