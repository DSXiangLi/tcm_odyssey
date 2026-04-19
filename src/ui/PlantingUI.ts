// src/ui/PlantingUI.ts
/**
 * 种植游戏UI组件
 *
 * Phase 2 S11.3 实现
 * Phase 2.5 UI组件系统统一化 Task 16 重构
 *
 * 功能:
 * - 种子选择界面
 * - 地块选择界面
 * - 水源选择界面（四气）
 * - 肥料选择界面（五味）
 * - 生长进度界面
 * - 收获考教界面
 *
 * 组件使用:
 * - SelectionButtonComponent: 种子/地块/水源/肥料/考教选项 (方案A: ○→●)
 * - ItemSlotComponent: 生长进度地块展示 (方案B: Neumorphism)
 */

import Phaser from 'phaser';
import { EventBus, EventData } from '../systems/EventBus';
import {
  PlantingManager,
  PlantingEvent
} from '../systems/PlantingManager';
import {
  getSeedData,
  getPlotData,
  getGrowthStageConfig,
  type PlantingPhase,
  type PlotState
} from '../data/planting-data';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';
import SelectionButtonComponent, {
  SelectionButtonContent,
  SelectionButtonConfig
} from './components/SelectionButtonComponent';
import ItemSlotComponent, {
  ItemSlotContent
} from './components/ItemSlotComponent';

/**
 * UI配置
 */
interface PlantingUIConfig {
  scene: Phaser.Scene;
  width: number;
  height: number;
}

/**
 * 种植UI组件
 */
export class PlantingUI {
  private scene: Phaser.Scene;
  private manager: PlantingManager;
  private eventBus: EventBus;

  private container: Phaser.GameObjects.Container;
  private width: number;
  private height: number;

  // UI元素
  private titleText: Phaser.GameObjects.Text | null = null;
  private phaseText: Phaser.GameObjects.Text | null = null;
  private contentContainer: Phaser.GameObjects.Container | null = null;

  // 组件引用（用于清理）
  private selectionButtons: SelectionButtonComponent[] = [];
  private itemSlots: ItemSlotComponent[] = [];

  // 事件监听器引用（用于正确清理）
  private phaseChangedHandler!: (data: EventData) => void;
  private seedSelectedHandler!: (data: EventData) => void;
  private plotSelectedHandler!: (data: EventData) => void;
  private waterSelectedHandler!: (data: EventData) => void;
  private fertilizerSelectedHandler!: (data: EventData) => void;
  private growthUpdatedHandler!: (data: EventData) => void;
  private quizStartedHandler!: (data: EventData) => void;
  private harvestCompleteHandler!: (data: EventData) => void;

  constructor(config: PlantingUIConfig) {
    this.scene = config.scene;
    this.width = config.width;
    this.height = config.height;

    this.manager = PlantingManager.getInstance();
    this.eventBus = EventBus.getInstance();

    // 创建主容器
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(100);

    // 创建半透明背景
    const background = this.scene.add.rectangle(
      this.width / 2,
      this.height / 2,
      this.width,
      this.height,
      UI_COLORS.PANEL_PRIMARY,
      0.85
    );
    this.container.add(background);

    // 监听事件
    this.setupEventListeners();

    // 初始显示
    this.showSeedSelection();
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    this.phaseChangedHandler = (data: EventData) => {
      const newPhase = data.new_phase as PlantingPhase;
      this.updateUIForPhase(newPhase);
    };
    this.eventBus.on(PlantingEvent.PHASE_CHANGED, this.phaseChangedHandler);

    this.seedSelectedHandler = (_data: EventData) => {
      // 种子选择后自动进入地块选择（通过PHASE_CHANGED处理）
    };
    this.eventBus.on(PlantingEvent.SEED_SELECTED, this.seedSelectedHandler);

    this.plotSelectedHandler = (_data: EventData) => {
      // 地块选择后自动进入水源选择
    };
    this.eventBus.on(PlantingEvent.PLOT_SELECTED, this.plotSelectedHandler);

    this.waterSelectedHandler = (_data: EventData) => {
      // 水源选择后自动进入肥料选择
    };
    this.eventBus.on(PlantingEvent.WATER_SELECTED, this.waterSelectedHandler);

    this.fertilizerSelectedHandler = (_data: EventData) => {
      // 肥料选择后进入种植阶段
    };
    this.eventBus.on(PlantingEvent.FERTILIZER_SELECTED, this.fertilizerSelectedHandler);

    this.growthUpdatedHandler = (data: EventData) => {
      this.updateGrowthProgress(data);
    };
    this.eventBus.on(PlantingEvent.GROWTH_UPDATED, this.growthUpdatedHandler);

    this.quizStartedHandler = (data: EventData) => {
      this.showQuiz(data);
    };
    this.eventBus.on(PlantingEvent.QUIZ_STARTED, this.quizStartedHandler);

    this.harvestCompleteHandler = (data: EventData) => {
      this.showHarvestResult(data);
    };
    this.eventBus.on(PlantingEvent.HARVEST_COMPLETE, this.harvestCompleteHandler);
  }

  /**
   * 根据阶段更新UI
   */
  private updateUIForPhase(phase: PlantingPhase): void {
    switch (phase) {
      case 'select_seed':
        this.showSeedSelection();
        break;
      case 'select_plot':
        this.showPlotSelection();
        break;
      case 'select_water':
        this.showWaterSelection();
        break;
      case 'select_fertilizer':
        this.showFertilizerSelection();
        break;
      case 'planting':
        this.showPlantingProgress();
        break;
      case 'waiting':
        this.showGrowthProgress();
        break;
      case 'harvest':
        this.showHarvestPrompt();
        break;
      case 'quiz':
        // Quiz UI通过事件触发
        break;
    }
  }

  /**
   * 清空内容容器
   */
  private clearContent(): void {
    // 清理SelectionButtonComponent
    this.selectionButtons.forEach(btn => btn.destroy());
    this.selectionButtons = [];

    // 清理ItemSlotComponent
    this.itemSlots.forEach(slot => slot.destroy());
    this.itemSlots = [];

    if (this.contentContainer) {
      this.contentContainer.destroy();
    }
    this.contentContainer = this.scene.add.container(0, 80);
    this.container.add(this.contentContainer);
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
   * 处理退出（返回药园）
   */
  private handleExit(): void {
    this.manager.cancelSelection();
    this.destroy();
    this.scene.scene.stop('PlantingScene');
    this.scene.scene.resume('GardenScene');
  }

  /**
   * 显示标题
   */
  private updateTitle(title: string): void {
    if (this.titleText) {
      this.titleText.setText(title);
    } else {
      this.titleText = this.scene.add.text(
        this.width / 2,
        30,
        title,
        {
          fontSize: '24px',
          color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
          fontStyle: 'bold'
        }
      ).setOrigin(0.5);
      this.container.add(this.titleText);
    }
  }

  /**
   * 显示阶段指示
   */
  private updatePhaseIndicator(phase: string): void {
    if (this.phaseText) {
      this.phaseText.setText(`阶段: ${phase}`);
    } else {
      this.phaseText = this.scene.add.text(
        this.width / 2,
        60,
        `阶段: ${phase}`,
        {
          fontSize: '16px',
          color: UI_COLOR_STRINGS.TEXT_DISABLED
        }
      ).setOrigin(0.5);
      this.container.add(this.phaseText);
    }
  }

  /**
   * 显示种子选择界面
   */
  private showSeedSelection(): void {
    this.updateTitle('选择种子');
    this.updatePhaseIndicator('种子选择');
    this.clearContent();

    const availableSeedIds = this.manager.getAvailableSeeds();
    const availableSeeds = availableSeedIds
      .map(id => getSeedData(id))
      .filter(seed => seed !== undefined);

    // 提示文本
    const hintText = this.scene.add.text(
      this.width / 2,
      20,
      '从背包中选择要种植的种子',
      { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_DISABLED }
    ).setOrigin(0.5);
    this.contentContainer!.add(hintText);

    // 种子选项 - 使用SelectionButtonComponent (方案A: ○→●)
    const startY = 60;
    const itemHeight = 50;

    availableSeeds.forEach((seed, index) => {
      const y = startY + index * itemHeight;

      // 构建显示文本：种子名称 + 归经信息
      const labelText = `${seed.name} (归${seed.meridian}经)`;
      const subText = `需: ${seed.required_water}水 + ${seed.required_fertilizer}肥`;

      // 使用SelectionButtonComponent
      const buttonContent: SelectionButtonContent = {
        label: labelText,
        value: seed.id
      };

      const buttonConfig: SelectionButtonConfig = {
        width: 300,
        onSelect: () => {
          this.manager.selectSeed(seed.id);
        }
      };

      const button = new SelectionButtonComponent(
        this.scene,
        buttonContent,
        buttonConfig,
        this.width / 2,
        y
      );

      // 添加需求信息作为子文本（在按钮下方）
      const reqText = this.scene.add.text(
        this.width / 2 - 120,
        y + 20,
        subText,
        { fontSize: '12px', color: UI_COLOR_STRINGS.TEXT_DISABLED }
      );
      this.contentContainer!.add(reqText);

      // 将按钮容器添加到contentContainer
      this.contentContainer!.add(button.container);
      this.selectionButtons.push(button);
    });

    // 添加取消按钮
    this.addCancelButton();
  }

  /**
   * 显示地块选择界面
   */
  private showPlotSelection(): void {
    this.updateTitle('选择地块');
    this.updatePhaseIndicator('地块选择');
    this.clearContent();

    // 退出按钮
    const exitButton = this.createExitButton();
    this.contentContainer?.add(exitButton);

    const availablePlotIds = this.manager.getAvailablePlots();
    const availablePlots = availablePlotIds
      .map(id => getPlotData(id))
      .filter(plot => plot !== undefined);
    const state = this.manager.getState();
    const selectedSeed = state.selected_seed ? getSeedData(state.selected_seed) : null;

    // 提示：显示选中的种子信息
    if (selectedSeed) {
      const seedInfo = this.scene.add.text(
        this.width / 2,
        20,
        `种子: ${selectedSeed.name} (归${selectedSeed.meridian}经)`,
        {
          fontSize: '14px',
          color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
          wordWrap: { width: this.width - 40 }
        }
      ).setOrigin(0.5);
      this.contentContainer!.add(seedInfo);
    }

    // 地块选项 - 使用SelectionButtonComponent (方案A: ○→●)
    const startY = 60;
    const itemHeight = 50;

    availablePlots.forEach((plot, index) => {
      const y = startY + index * itemHeight;

      // 判断地块是否匹配
      const isMatch = selectedSeed && (plot.meridian === selectedSeed.meridian || plot.meridian === 'general');

      // 构建显示文本
      const meridianLabel = plot.meridian === 'general' ? '通用' : `归${plot.meridian}经`;
      const labelText = `${plot.name} (${meridianLabel})`;

      // 匹配提示文本
      const matchText = isMatch ? ' ✓匹配' : '';

      const buttonContent: SelectionButtonContent = {
        label: labelText + matchText,
        value: plot.id
      };

      const buttonConfig: SelectionButtonConfig = {
        width: 300,
        selected: false,
        onSelect: () => {
          this.manager.selectPlot(plot.id);
        }
      };

      const button = new SelectionButtonComponent(
        this.scene,
        buttonContent,
        buttonConfig,
        this.width / 2,
        y
      );

      // 将按钮容器添加到contentContainer
      this.contentContainer!.add(button.container);
      this.selectionButtons.push(button);
    });
  }

  /**
   * 显示水源选择界面
   */
  private showWaterSelection(): void {
    this.updateTitle('选择水源');
    this.updatePhaseIndicator('水源选择（四气）');
    this.clearContent();

    const waters = this.manager.getAllWaters();
    const state = this.manager.getState();
    const selectedSeed = state.selected_seed ? getSeedData(state.selected_seed) : null;

    // 提示
    if (selectedSeed) {
      const seedInfo = this.scene.add.text(
        this.width / 2,
        20,
        `需求: ${selectedSeed.required_water}性水源`,
        {
          fontSize: '14px',
          color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
          wordWrap: { width: this.width - 40 }
        }
      ).setOrigin(0.5);
      this.contentContainer!.add(seedInfo);
    }

    // 水源选项 - 使用SelectionButtonComponent (方案A: ○→●)
    const startY = 60;
    const itemHeight = 40;

    waters.forEach((water: { id: string; name: string; qi_type: string }, index: number) => {
      const y = startY + index * itemHeight;

      // 判断水源是否匹配
      const isMatch = selectedSeed && (water.qi_type === selectedSeed.required_water || water.qi_type === 'neutral');
      const matchText = isMatch ? ' ✓' : '';

      const buttonContent: SelectionButtonContent = {
        label: `${water.name} (${water.qi_type})${matchText}`,
        value: water.id
      };

      const buttonConfig: SelectionButtonConfig = {
        width: 280,
        onSelect: () => {
          this.manager.selectWater(water.id);
        }
      };

      const button = new SelectionButtonComponent(
        this.scene,
        buttonContent,
        buttonConfig,
        this.width / 2,
        y
      );

      // 将按钮容器添加到contentContainer
      this.contentContainer!.add(button.container);
      this.selectionButtons.push(button);
    });

    // 退出按钮
    const exitButton = this.createExitButton();
    this.contentContainer?.add(exitButton);
  }

  /**
   * 显示肥料选择界面
   */
  private showFertilizerSelection(): void {
    this.updateTitle('选择肥料');
    this.updatePhaseIndicator('肥料选择（五味）');
    this.clearContent();

    const fertilizers = this.manager.getAllFertilizers();
    const state = this.manager.getState();
    const selectedSeed = state.selected_seed ? getSeedData(state.selected_seed) : null;

    // 提示
    if (selectedSeed) {
      const seedInfo = this.scene.add.text(
        this.width / 2,
        20,
        `需求: ${selectedSeed.required_fertilizer}味肥料`,
        {
          fontSize: '14px',
          color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
          wordWrap: { width: this.width - 40 }
        }
      ).setOrigin(0.5);
      this.contentContainer!.add(seedInfo);
    }

    // 肥料选项 - 使用SelectionButtonComponent (方案A: ○→●)
    const startY = 60;
    const itemHeight = 40;

    fertilizers.forEach((fertilizer: { id: string; name: string; flavor_type: string }, index: number) => {
      const y = startY + index * itemHeight;

      // 判断肥料是否匹配
      const isMatch = selectedSeed && fertilizer.flavor_type === selectedSeed.required_fertilizer;
      const matchText = isMatch ? ' ✓' : '';

      const buttonContent: SelectionButtonContent = {
        label: `${fertilizer.name} (${fertilizer.flavor_type})${matchText}`,
        value: fertilizer.id
      };

      const buttonConfig: SelectionButtonConfig = {
        width: 280,
        onSelect: () => {
          this.manager.selectFertilizer(fertilizer.id);
        }
      };

      const button = new SelectionButtonComponent(
        this.scene,
        buttonContent,
        buttonConfig,
        this.width / 2,
        y
      );

      // 将按钮容器添加到contentContainer
      this.contentContainer!.add(button.container);
      this.selectionButtons.push(button);
    });

    // 退出按钮
    const exitButton = this.createExitButton();
    this.contentContainer?.add(exitButton);

    // 添加种植按钮
    this.addPlantButton();
  }

  /**
   * 显示种植进度
   */
  private showPlantingProgress(): void {
    this.updateTitle('正在种植...');
    this.updatePhaseIndicator('种植');
    this.clearContent();

    // 执行种植
    this.manager.plant();

    // 显示结果
    const resultText = this.scene.add.text(
      this.width / 2,
      this.height / 2,
      '种子已播种！',
      { fontSize: '20px', color: UI_COLOR_STRINGS.BUTTON_SUCCESS }
    ).setOrigin(0.5);
    this.contentContainer!.add(resultText);

    // 退出按钮
    const exitButton = this.createExitButton();
    this.contentContainer?.add(exitButton);
  }

  /**
   * 显示生长进度
   */
  private showGrowthProgress(): void {
    this.updateTitle('生长中');
    this.updatePhaseIndicator('等待生长');
    this.clearContent();

    // 显示所有地块状态
    const plots = this.manager.getState().plots;
    const plantedPlots = plots.filter((p: PlotState) => p.seed_id);

    const startY = 60;
    const itemHeight = 80;

    plantedPlots.forEach((plot: PlotState, index: number) => {
      const y = startY + index * itemHeight;
      const seed = plot.seed_id ? getSeedData(plot.seed_id) : null;

      // 使用ItemSlotComponent显示药材 (方案B: Neumorphism)
      const slotX = this.width / 2 - 140;
      const slotContent: ItemSlotContent = {
        itemId: plot.seed_id || 'unknown',
        name: seed?.name || '未知',
        quantity: 1
      };

      const slot = new ItemSlotComponent(
        this.scene,
        {
          selectable: false,
          onClick: () => {}
        },
        slotX,
        y
      );
      slot.setContent(slotContent);

      // 将slot容器添加到contentContainer
      this.contentContainer!.add(slot.container);
      this.itemSlots.push(slot);

      // 药材名称文本（在slot右侧）
      const nameText = this.scene.add.text(
        this.width / 2 - 70,
        y - 20,
        seed?.name || '未知',
        { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_PRIMARY }
      );

      // 生长进度条背景
      const progressBg = this.scene.add.rectangle(
        this.width / 2 - 70,
        y + 10,
        180,
        12,
        UI_COLORS.PANEL_DARK
      );

      // 生长进度条填充
      const progressWidth = plot.growth_progress * 1.8;
      const progressFill = this.scene.add.rectangle(
        this.width / 2 - 70 - 90 + progressWidth / 2,
        y + 10,
        progressWidth,
        12,
        plot.is_ready ? UI_COLORS.BUTTON_SUCCESS : UI_COLORS.BUTTON_PRIMARY
      );

      // 阶段文字
      const stageConfig = getGrowthStageConfig(plot.current_stage);
      const stageText = this.scene.add.text(
        this.width / 2 + 40,
        y - 20,
        stageConfig?.name || '',
        { fontSize: '12px', color: UI_COLOR_STRINGS.TEXT_DISABLED }
      );

      // 收获按钮（当ready时）
      if (plot.is_ready) {
        const harvestBtn = this.scene.add.rectangle(
          this.width / 2 + 100,
          y,
          60,
          32,
          UI_COLORS.BUTTON_SUCCESS
        ).setInteractive({ useHandCursor: true });
        harvestBtn.on('pointerdown', () => {
          this.manager.harvest(plot.plot_id);
        });

        const harvestText = this.scene.add.text(
          this.width / 2 + 100,
          y,
          '收获',
          { fontSize: '12px', color: UI_COLOR_STRINGS.TEXT_PRIMARY }
        ).setOrigin(0.5);
        this.contentContainer!.add([harvestBtn, harvestText]);
      }

      this.contentContainer!.add([nameText, progressBg, progressFill, stageText]);
    });

    // 返回按钮
    this.addReturnButton();
  }

  /**
   * 更新生长进度（事件触发）
   */
  private updateGrowthProgress(_data: EventData): void {
    // 简化：重新渲染整个生长界面
    const phase = this.manager.getPhase();
    if (phase === 'waiting' || phase === 'harvest') {
      this.showGrowthProgress();
    }
  }

  /**
   * 显示收获提示
   */
  private showHarvestPrompt(): void {
    this.updateTitle('可以收获！');
    this.updatePhaseIndicator('收获');
    this.clearContent();

    const state = this.manager.getState();
    const readyPlots = state.plots.filter(p => p.is_ready);

    const infoText = this.scene.add.text(
      this.width / 2,
      this.height / 2 - 20,
      `${readyPlots.length} 个地块可以收获`,
      { fontSize: '16px', color: UI_COLOR_STRINGS.BUTTON_SUCCESS }
    ).setOrigin(0.5);
    this.contentContainer!.add(infoText);
  }

  /**
   * 显示考教界面
   */
  private showQuiz(data: EventData): void {
    this.updateTitle('收获考教');
    this.updatePhaseIndicator('答题');
    this.clearContent();

    const question = data.question as string;
    const options = data.options as string[];

    // 问题文本
    const questionText = this.scene.add.text(
      this.width / 2,
      30,
      question,
      {
        fontSize: '16px',
        color: UI_COLOR_STRINGS.TEXT_PRIMARY,
        wordWrap: { width: this.width - 60 }
      }
    ).setOrigin(0.5);
    this.contentContainer!.add(questionText);

    // 选项按钮 - 使用SelectionButtonComponent (方案A: ○→●)
    const startY = 80;
    const optionHeight = 45;

    options.forEach((option, index) => {
      const y = startY + index * optionHeight;

      const buttonContent: SelectionButtonContent = {
        label: option,
        value: option
      };

      const buttonConfig: SelectionButtonConfig = {
        width: 200,
        onSelect: () => {
          this.manager.submitQuiz(option);
        }
      };

      const button = new SelectionButtonComponent(
        this.scene,
        buttonContent,
        buttonConfig,
        this.width / 2,
        y
      );

      // 将按钮容器添加到contentContainer
      this.contentContainer!.add(button.container);
      this.selectionButtons.push(button);
    });
  }

  /**
   * 显示收获结果
   */
  private showHarvestResult(data: EventData): void {
    this.updateTitle('收获成功！');
    this.clearContent();

    const herbName = data.herb_name as string;

    const resultText = this.scene.add.text(
      this.width / 2,
      this.height / 2,
      `获得: ${herbName}`,
      { fontSize: '20px', color: UI_COLOR_STRINGS.BUTTON_SUCCESS }
    ).setOrigin(0.5);
    this.contentContainer!.add(resultText);

    // 短暂显示后返回
    this.scene.time.delayedCall(1500, () => {
      this.showSeedSelection();
    });
  }

  /**
   * 添加种植按钮
   */
  private addPlantButton(): void {
    const btnY = this.height - 80;

    const btn = this.scene.add.rectangle(
      this.width / 2,
      btnY,
      120,
      40,
      UI_COLORS.BUTTON_SUCCESS
    ).setInteractive({ useHandCursor: true });

    const btnText = this.scene.add.text(
      this.width / 2,
      btnY,
      '开始种植',
      { fontSize: '16px', color: UI_COLOR_STRINGS.TEXT_PRIMARY }
    ).setOrigin(0.5);

    this.contentContainer!.add([btn, btnText]);

    btn.on('pointerdown', () => {
      this.manager.plant();
    });
  }

  /**
   * 添加取消按钮
   */
  private addCancelButton(): void {
    const btnY = this.height - 80;

    const btn = this.scene.add.rectangle(
      this.width / 2 - 80,
      btnY,
      80,
      30,
      UI_COLORS.BUTTON_SECONDARY
    ).setInteractive({ useHandCursor: true });

    const btnText = this.scene.add.text(
      this.width / 2 - 80,
      btnY,
      '取消',
      { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_PRIMARY }
    ).setOrigin(0.5);

    this.contentContainer!.add([btn, btnText]);

    btn.on('pointerdown', () => {
      this.manager.cancelSelection();
      // 触发返回场景
      this.scene.scene.stop();
    });
  }

  /**
   * 添加返回按钮
   */
  private addReturnButton(): void {
    const btnY = this.height - 60;

    const btn = this.scene.add.rectangle(
      this.width / 2,
      btnY,
      100,
      35,
      UI_COLORS.BUTTON_SECONDARY
    ).setInteractive({ useHandCursor: true });

    const btnText = this.scene.add.text(
      this.width / 2,
      btnY,
      '返回药园',
      { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_PRIMARY }
    ).setOrigin(0.5);

    this.contentContainer!.add([btn, btnText]);

    btn.on('pointerdown', () => {
      this.manager.cancelSelection();
      this.scene.scene.stop();
    });
  }

  /**
   * 销毁UI
   */
  destroy(): void {
    // 清理事件监听器
    this.eventBus.off(PlantingEvent.PHASE_CHANGED, this.phaseChangedHandler);
    this.eventBus.off(PlantingEvent.SEED_SELECTED, this.seedSelectedHandler);
    this.eventBus.off(PlantingEvent.PLOT_SELECTED, this.plotSelectedHandler);
    this.eventBus.off(PlantingEvent.WATER_SELECTED, this.waterSelectedHandler);
    this.eventBus.off(PlantingEvent.FERTILIZER_SELECTED, this.fertilizerSelectedHandler);
    this.eventBus.off(PlantingEvent.GROWTH_UPDATED, this.growthUpdatedHandler);
    this.eventBus.off(PlantingEvent.QUIZ_STARTED, this.quizStartedHandler);
    this.eventBus.off(PlantingEvent.HARVEST_COMPLETE, this.harvestCompleteHandler);

    // 清理SelectionButtonComponent
    this.selectionButtons.forEach(btn => btn.destroy());
    this.selectionButtons = [];

    // 清理ItemSlotComponent
    this.itemSlots.forEach(slot => slot.destroy());
    this.itemSlots = [];

    // 销毁容器
    this.container.destroy();
  }
}