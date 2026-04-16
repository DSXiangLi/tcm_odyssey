// src/ui/DecoctionUI.ts
/**
 * 煎药游戏UI组件
 *
 * Phase 2 S9.3 实现
 *
 * 功能:
 * - 方剂选择界面
 * - 药材选择界面
 * - 配伍放置界面（君臣佐使）
 * - 顺序设置界面（先煎/后下）
 * - 火候控制界面（武火/文火）
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
 */
export class DecoctionUI {
  private scene: Phaser.Scene;
  private manager: DecoctionManager;
  private eventBus: EventBus;

  private container: Phaser.GameObjects.Container;
  private width: number;
  private height: number;

  // UI元素
  private titleText: Phaser.GameObjects.Text | null = null;
  private phaseText: Phaser.GameObjects.Text | null = null;
  private contentContainer: Phaser.GameObjects.Container | null = null;

  // 当前选择的元素
  private selectedPrescriptionId: string | null = null;
  private selectedHerbs: string[] = [];
  private compatibilitySlots: Map<string, Phaser.GameObjects.Container> = new Map();

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

    // 监听事件
    this.setupEventListeners();

    // 初始显示
    this.showPrescriptionSelection();
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
   * 清除内容容器
   */
  private clearContent(): void {
    if (this.contentContainer) {
      this.contentContainer.removeAll(true);
      this.contentContainer.destroy();
      this.contentContainer = null;
    }
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
      { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_SECONDARY }
    ).setOrigin(0.5);
    this.contentContainer.add(hintText);

    // 药材列表
    const startY = 120;
    const spacing = 50;
    const colWidth = this.width / 3;

    HERBS_DATA.forEach((herb, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = colWidth / 2 + col * colWidth;
      const y = startY + row * spacing;

      // 是否是必需药材
      const isRequired = requiredHerbs.includes(herb.id);
      const isSelected = this.selectedHerbs.includes(herb.id);

      // 药材按钮
      const button = this.scene.add.text(x, y, herb.name, {
        fontSize: '16px',
        color: isSelected ? UI_COLOR_STRINGS.BUTTON_SUCCESS : (isRequired ? UI_COLOR_STRINGS.STATUS_WARNING : UI_COLOR_STRINGS.TEXT_PRIMARY),
        backgroundColor: isSelected ? '#2E7D32' : UI_COLOR_STRINGS.PANEL_PRIMARY,
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setInteractive();

      button.on('pointerdown', () => {
        if (isSelected) {
          this.manager.removeHerb(herb.id);
        } else {
          this.manager.addHerb(herb.id);
        }
      });

      this.contentContainer?.add(button);
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

    // 提示文字
    const hintText = this.scene.add.text(this.width / 2, 80,
      '将药材放置到正确的君臣佐使位置',
      { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_SECONDARY }
    ).setOrigin(0.5);
    this.contentContainer.add(hintText);

    // 角色槽位
    const roles = ['君', '臣', '佐', '使'];
    const slotY = 150;
    const slotSpacing = 80;

    roles.forEach((role, index) => {
      const y = slotY + index * slotSpacing;

      // 角色标签
      const roleLabel = this.scene.add.text(100, y, `${role}:`, {
        fontSize: '18px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY
      }).setOrigin(0.5);

      // 槽位容器
      const slotContainer = this.scene.add.container(200, y);

      // 占位文字
      const placeholder = this.scene.add.text(0, 0, '空', {
        fontSize: '16px',
        color: UI_COLOR_STRINGS.TEXT_DISABLED
      }).setOrigin(0, 0.5);

      slotContainer.add(placeholder);
      this.compatibilitySlots.set(role, slotContainer);

      this.contentContainer?.add([roleLabel, slotContainer]);
    });

    // 已选药材列表
    const herbStartY = 450;
    const herbSpacing = 40;

    this.selectedHerbs.forEach((herbId, index) => {
      const herb = getHerbById(herbId);
      const y = herbStartY + index * herbSpacing;

      // 药材名称
      const herbLabel = this.scene.add.text(100, y, herb?.name || herbId, {
        fontSize: '16px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY
      }).setOrigin(0, 0.5);

      // 角色选择按钮
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
   * 更新配伍显示
   */
  private updateCompatibilityDisplay(): void {
    const state = this.manager.getState();

    // 更新槽位显示
    this.compatibilitySlots.forEach((slotContainer, role) => {
      slotContainer.removeAll(true);

      // 查找放置在该角色的药材
      let placedHerb: string | null = null;
      state.compatibility_placement.forEach((placedRole, herbId) => {
        if (placedRole === role) {
          placedHerb = herbId;
        }
      });

      if (placedHerb) {
        const herb = getHerbById(placedHerb);
        const herbText = this.scene.add.text(0, 0, herb?.name || placedHerb, {
          fontSize: '16px',
          color: UI_COLOR_STRINGS.BUTTON_SUCCESS
        }).setOrigin(0, 0.5);
        slotContainer.add(herbText);
      } else {
        const placeholder = this.scene.add.text(0, 0, '空', {
          fontSize: '16px',
          color: UI_COLOR_STRINGS.TEXT_DISABLED
        }).setOrigin(0, 0.5);
        slotContainer.add(placeholder);
      }
    });
  }

  /**
   * 显示顺序设置界面
   */
  private showOrderSetting(): void {
    this.clearContent();

    // 标题
    this.titleText?.setText('设置煎药顺序');

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 提示文字
    const hintText = this.scene.add.text(this.width / 2, 80,
      '设置每种药材的煎煮顺序',
      { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_SECONDARY }
    ).setOrigin(0.5);
    this.contentContainer.add(hintText);

    // 顺序选项
    const orders: DecoctionOrderType[] = ['first', 'normal', 'last'];

    // 药材列表
    const herbStartY = 130;
    const herbSpacing = 50;

    this.selectedHerbs.forEach((herbId, index) => {
      const herb = getHerbById(herbId);
      const y = herbStartY + index * herbSpacing;

      // 药材名称
      const herbLabel = this.scene.add.text(100, y, herb?.name || herbId, {
        fontSize: '16px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY
      }).setOrigin(0, 0.5);

      // 顺序按钮
      const orderButtons = orders.map((order, orderIndex) => {
        const x = 250 + orderIndex * 100;
        const orderConfig = getDecoctionOrderConfig(order);
        const isSelected = this.manager.getState().order_settings.get(herbId) === order;

        const btn = this.scene.add.text(x, y, orderConfig?.name || order, {
          fontSize: '14px',
          color: isSelected ? UI_COLOR_STRINGS.BUTTON_SUCCESS : UI_COLOR_STRINGS.TEXT_PRIMARY,
          backgroundColor: isSelected ? '#2E7D32' : UI_COLOR_STRINGS.PANEL_PRIMARY,
          padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive();

        btn.on('pointerdown', () => {
          this.manager.setOrder(herbId, order);
          this.showOrderSetting(); // 重新渲染
        });

        return btn;
      });

      this.contentContainer?.add([herbLabel, ...orderButtons]);
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
   */
  private showFireSetting(): void {
    this.clearContent();

    // 标题
    this.titleText?.setText('设置煎药火候');

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 提示文字
    const hintText = this.scene.add.text(this.width / 2, 80,
      '选择合适的煎药火候',
      { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_SECONDARY }
    ).setOrigin(0.5);
    this.contentContainer.add(hintText);

    // 火候选项
    const fires: FireLevel[] = ['wu', 'wen'];
    const fireY = 150;
    const fireSpacing = 100;

    fires.forEach((fire, index) => {
      const y = fireY + index * fireSpacing;
      const fireConfig = getFireLevelConfig(fire);
      const isSelected = this.manager.getState().fire_level === fire;

      // 火候按钮
      const button = this.scene.add.text(this.width / 2, y, fireConfig?.name || fire, {
        fontSize: '24px',
        color: isSelected ? '#ff5722' : UI_COLOR_STRINGS.TEXT_PRIMARY,
        backgroundColor: isSelected ? '#bf360c' : UI_COLOR_STRINGS.PANEL_PRIMARY,
        padding: { x: 40, y: 20 }
      }).setOrigin(0.5).setInteractive();

      button.on('pointerdown', () => {
        this.manager.setFireLevel(fire);
        this.showFireSetting(); // 重新渲染
      });

      // 描述文字
      const descText = this.scene.add.text(this.width / 2, y + 40,
        fireConfig?.description || '',
        { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_SECONDARY }
      ).setOrigin(0.5);

      this.contentContainer?.add([button, descText]);
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
      { fontSize: '16px', color: UI_COLOR_STRINGS.TEXT_SECONDARY }
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

    // 销毁主容器
    this.container.removeAll(true);
    this.container.destroy();
  }
}