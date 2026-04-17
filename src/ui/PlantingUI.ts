// src/ui/PlantingUI.ts
/**
 * 种植游戏UI组件
 *
 * Phase 2 S11.3 实现
 *
 * 功能:
 * - 种子选择界面
 * - 地块选择界面
 * - 水源选择界面（四气）
 * - 肥料选择界面（五味）
 * - 生长进度界面
 * - 收获考教界面
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
    if (this.contentContainer) {
      this.contentContainer.destroy();
    }
    this.contentContainer = this.scene.add.container(0, 80);
    this.container.add(this.contentContainer);
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

    // 种子选项
    const startY = 60;
    const itemHeight = 50;

    availableSeeds.forEach((seed, index) => {
      const y = startY + index * itemHeight;

      // 种子按钮背景
      const bg = this.scene.add.rectangle(
        this.width / 2,
        y,
        300,
        40,
        UI_COLORS.BUTTON_PRIMARY
      ).setInteractive({ useHandCursor: true });

      // 种子名称
      const nameText = this.scene.add.text(
        this.width / 2 - 120,
        y - 10,
        seed.name,
        { fontSize: '16px', color: UI_COLOR_STRINGS.TEXT_PRIMARY }
      );

      // 归经信息
      const meridianText = this.scene.add.text(
        this.width / 2 + 80,
        y - 10,
        `归${seed.meridian}经`,
        { fontSize: '12px', color: UI_COLOR_STRINGS.TEXT_SECONDARY }
      );

      // 需求信息
      const reqText = this.scene.add.text(
        this.width / 2 - 120,
        y + 10,
        `需: ${seed.required_water}水 + ${seed.required_fertilizer}肥`,
        { fontSize: '12px', color: UI_COLOR_STRINGS.TEXT_DISABLED }
      );

      this.contentContainer!.add([bg, nameText, meridianText, reqText]);

      // 点击选择
      bg.on('pointerdown', () => {
        this.manager.selectSeed(seed.id);
      });

      // 悬停效果
      bg.on('pointerover', () => {
        bg.setFillStyle(UI_COLORS.BUTTON_PRIMARY_HOVER);
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(UI_COLORS.BUTTON_PRIMARY);
      });
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

    // 地块选项
    const startY = 60;
    const itemHeight = 50;

    availablePlots.forEach((plot, index) => {
      const y = startY + index * itemHeight;

      // 判断地块是否匹配
      const isMatch = selectedSeed && (plot.meridian === selectedSeed.meridian || plot.meridian === 'general');
      const bgColor = isMatch ? UI_COLORS.BUTTON_SUCCESS : UI_COLORS.BUTTON_PRIMARY;

      // 地块按钮背景
      const bg = this.scene.add.rectangle(
        this.width / 2,
        y,
        300,
        40,
        bgColor
      ).setInteractive({ useHandCursor: true });

      // 地块名称
      const nameText = this.scene.add.text(
        this.width / 2 - 120,
        y,
        plot.name,
        { fontSize: '16px', color: UI_COLOR_STRINGS.TEXT_PRIMARY }
      );

      // 归经信息
      const meridianText = this.scene.add.text(
        this.width / 2 + 80,
        y,
        plot.meridian === 'general' ? '通用' : `归${plot.meridian}经`,
        { fontSize: '12px', color: UI_COLOR_STRINGS.TEXT_SECONDARY }
      );

      // 匹配提示
      if (isMatch) {
        const matchText = this.scene.add.text(
          this.width / 2 + 50,
          y + 10,
          '✓ 匹配',
          { fontSize: '12px', color: UI_COLOR_STRINGS.BUTTON_SUCCESS }
        );
        this.contentContainer!.add(matchText);
      }

      this.contentContainer!.add([bg, nameText, meridianText]);

      // 点击选择
      bg.on('pointerdown', () => {
        this.manager.selectPlot(plot.id);
      });

      bg.on('pointerover', () => {
        bg.setFillStyle(isMatch ? UI_COLORS.BUTTON_PRIMARY_HOVER : UI_COLORS.BUTTON_PRIMARY_HOVER);
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(bgColor);
      });
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

    // 水源选项
    const startY = 60;
    const itemHeight = 40;

    waters.forEach((water: { id: string; name: string; qi_type: string }, index: number) => {
      const y = startY + index * itemHeight;

      // 判断水源是否匹配
      const isMatch = selectedSeed && (water.qi_type === selectedSeed.required_water || water.qi_type === 'neutral');
      const bgColor = isMatch ? UI_COLORS.BUTTON_SUCCESS : UI_COLORS.BUTTON_PRIMARY;

      // 水源按钮
      const bg = this.scene.add.rectangle(
        this.width / 2,
        y,
        280,
        30,
        bgColor
      ).setInteractive({ useHandCursor: true });

      const nameText = this.scene.add.text(
        this.width / 2 - 120,
        y,
        water.name,
        { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_PRIMARY }
      );

      const qiText = this.scene.add.text(
        this.width / 2 + 80,
        y,
        water.qi_type,
        { fontSize: '12px', color: UI_COLOR_STRINGS.TEXT_SECONDARY }
      );

      this.contentContainer!.add([bg, nameText, qiText]);

      bg.on('pointerdown', () => {
        this.manager.selectWater(water.id);
      });

      bg.on('pointerover', () => bg.setFillStyle(UI_COLORS.BUTTON_PRIMARY_HOVER));
      bg.on('pointerout', () => bg.setFillStyle(bgColor));
    });
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

    // 肥料选项
    const startY = 60;
    const itemHeight = 40;

    fertilizers.forEach((fertilizer: { id: string; name: string; flavor_type: string }, index: number) => {
      const y = startY + index * itemHeight;

      // 判断肥料是否匹配
      const isMatch = selectedSeed && fertilizer.flavor_type === selectedSeed.required_fertilizer;
      const bgColor = isMatch ? UI_COLORS.BUTTON_SUCCESS : UI_COLORS.BUTTON_PRIMARY;

      // 肥料按钮
      const bg = this.scene.add.rectangle(
        this.width / 2,
        y,
        280,
        30,
        bgColor
      ).setInteractive({ useHandCursor: true });

      const nameText = this.scene.add.text(
        this.width / 2 - 120,
        y,
        fertilizer.name,
        { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_PRIMARY }
      );

      const flavorText = this.scene.add.text(
        this.width / 2 + 80,
        y,
        fertilizer.flavor_type,
        { fontSize: '12px', color: UI_COLOR_STRINGS.TEXT_SECONDARY }
      );

      this.contentContainer!.add([bg, nameText, flavorText]);

      bg.on('pointerdown', () => {
        this.manager.selectFertilizer(fertilizer.id);
      });

      bg.on('pointerover', () => bg.setFillStyle(UI_COLORS.BUTTON_PRIMARY_HOVER));
      bg.on('pointerout', () => bg.setFillStyle(bgColor));
    });

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
    const itemHeight = 60;

    plantedPlots.forEach((plot: PlotState, index: number) => {
      const y = startY + index * itemHeight;
      const seed = plot.seed_id ? getSeedData(plot.seed_id) : null;

      // 地块背景
      const bg = this.scene.add.rectangle(
        this.width / 2,
        y,
        280,
        50,
        UI_COLORS.PANEL_SECONDARY
      );

      // 药材名称
      const nameText = this.scene.add.text(
        this.width / 2 - 120,
        y - 15,
        seed?.name || '未知',
        { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_PRIMARY }
      );

      // 生长进度条背景
      const progressBg = this.scene.add.rectangle(
        this.width / 2,
        y + 10,
        200,
        10,
        UI_COLORS.PANEL_DARK
      );

      // 生长进度条填充
      const progressFill = this.scene.add.rectangle(
        this.width / 2 - 100 + plot.growth_progress * 2,
        y + 10,
        plot.growth_progress * 2,
        10,
        plot.is_ready ? UI_COLORS.BUTTON_SUCCESS : UI_COLORS.BUTTON_PRIMARY
      ).setOrigin(0, 0.5);

      // 阶段文字
      const stageConfig = getGrowthStageConfig(plot.current_stage);
      const stageText = this.scene.add.text(
        this.width / 2 + 60,
        y - 15,
        stageConfig?.name || '',
        { fontSize: '12px', color: UI_COLOR_STRINGS.TEXT_DISABLED }
      );

      // 收获按钮
      if (plot.is_ready) {
        const harvestBtn = this.scene.add.rectangle(
          this.width / 2 + 100,
          y,
          60,
          30,
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

      this.contentContainer!.add([bg, nameText, progressBg, progressFill, stageText]);
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

    // 选项按钮
    const startY = 80;
    const optionHeight = 45;

    options.forEach((option, index) => {
      const y = startY + index * optionHeight;

      const bg = this.scene.add.rectangle(
        this.width / 2,
        y,
        200,
        35,
        UI_COLORS.BUTTON_PRIMARY
      ).setInteractive({ useHandCursor: true });

      const optText = this.scene.add.text(
        this.width / 2,
        y,
        option,
        { fontSize: '14px', color: UI_COLOR_STRINGS.TEXT_PRIMARY }
      ).setOrigin(0.5);

      this.contentContainer!.add([bg, optText]);

      bg.on('pointerdown', () => {
        this.manager.submitQuiz(option);
      });

      bg.on('pointerover', () => bg.setFillStyle(UI_COLORS.BUTTON_PRIMARY_HOVER));
      bg.on('pointerout', () => bg.setFillStyle(UI_COLORS.BUTTON_PRIMARY));
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

    // 销毁容器
    this.container.destroy();
  }
}