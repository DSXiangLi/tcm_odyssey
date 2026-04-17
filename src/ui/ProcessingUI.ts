// src/ui/ProcessingUI.ts
/**
 * 炮制游戏UI组件
 *
 * Phase 2 S10.3 实现
 *
 * 功能:
 * - 药材选择界面
 * - 方法选择界面（炒/炙/煅/蒸/煮）
 * - 辅料选择界面
 * - 预处理界面（简化）
 * - 炮制进度界面
 * - 结果评分界面
 */

import Phaser from 'phaser';
import { EventBus, EventData } from '../systems/EventBus';
import {
  ProcessingManager,
  ProcessingEvent
} from '../systems/ProcessingManager';
import {
  getProcessingMethodConfig,
  getAdjuvantConfig,
  getHerbProcessingParams,
  getMethodsByCategory,
  type ProcessingPhase,
  type ProcessingScoreResult,
  type ProcessingMethodCategory
} from '../data/processing-data';
import { getHerbById } from '../data/inventory-data';
import { UI_COLORS, UI_COLOR_STRINGS } from '../data/ui-color-theme';

/**
 * UI配置
 */
interface ProcessingUIConfig {
  scene: Phaser.Scene;
  width: number;
  height: number;
}

/**
 * 炮制UI组件
 */
export class ProcessingUI {
  private scene: Phaser.Scene;
  private manager: ProcessingManager;
  private eventBus: EventBus;

  private container: Phaser.GameObjects.Container;
  private width: number;
  private height: number;

  // UI元素
  private titleText: Phaser.GameObjects.Text | null = null;
  private phaseText: Phaser.GameObjects.Text | null = null;
  private contentContainer: Phaser.GameObjects.Container | null = null;
  private progressFill: Phaser.GameObjects.Rectangle | null = null;
  private timeText: Phaser.GameObjects.Text | null = null;

  // 事件监听器引用（用于正确清理）
  private phaseChangedHandler!: (data: EventData) => void;
  private herbSelectedHandler!: (data: EventData) => void;
  private methodSelectedHandler!: (data: EventData) => void;
  private adjuvantSelectedHandler!: (data: EventData) => void;
  private processingTickHandler!: (data: EventData) => void;
  private scoreCalculatedHandler!: (data: EventData) => void;

  constructor(config: ProcessingUIConfig) {
    this.scene = config.scene;
    this.width = config.width;
    this.height = config.height;

    this.manager = ProcessingManager.getInstance();
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
    this.showHerbSelection();
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    this.phaseChangedHandler = (data: EventData) => {
      const newPhase = data.new_phase as ProcessingPhase;
      this.updateUIForPhase(newPhase);
    };
    this.eventBus.on(ProcessingEvent.PHASE_CHANGED, this.phaseChangedHandler);

    this.herbSelectedHandler = (_data: EventData) => {
      // 药材选择后自动进入方法选择（通过PHASE_CHANGED处理）
    };
    this.eventBus.on(ProcessingEvent.HERB_SELECTED, this.herbSelectedHandler);

    this.methodSelectedHandler = (_data: EventData) => {
      // 方法选择后自动进入辅料选择或预处理（通过PHASE_CHANGED处理）
    };
    this.eventBus.on(ProcessingEvent.METHOD_SELECTED, this.methodSelectedHandler);

    this.adjuvantSelectedHandler = (_data: EventData) => {
      // 辅料选择后自动进入预处理（通过PHASE_CHANGED处理）
    };
    this.eventBus.on(ProcessingEvent.ADJUVANT_SELECTED, this.adjuvantSelectedHandler);

    this.processingTickHandler = (data: EventData) => {
      const currentTime = data.current_time as number;
      const targetTime = data.target_time as number;
      const progress = data.progress as number;
      this.updateProcessingProgress(currentTime, targetTime, progress);
    };
    this.eventBus.on(ProcessingEvent.PROCESSING_TICK, this.processingTickHandler);

    this.scoreCalculatedHandler = (data: EventData) => {
      const result = data as unknown as ProcessingScoreResult;
      this.showEvaluation(result);
    };
    this.eventBus.on(ProcessingEvent.SCORE_CALCULATED, this.scoreCalculatedHandler);
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
   * 创建文本按钮
   */
  private createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void,
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ): Phaser.GameObjects.Text {
    const defaultStyle = {
      fontSize: '18px',
      color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
      backgroundColor: UI_COLOR_STRINGS.PANEL_PRIMARY,
      padding: { x: 15, y: 8 }
    };

    const button = this.scene.add.text(x, y, text, style || defaultStyle)
      .setOrigin(0.5)
      .setInteractive();

    button.on('pointerover', () => {
      button.setColor(UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER);
    });

    button.on('pointerout', () => {
      button.setColor(style?.color || UI_COLOR_STRINGS.BUTTON_SUCCESS);
    });

    button.on('pointerdown', callback);

    return button;
  }

  /**
   * 创建文本对象
   */
  private createText(
    x: number,
    y: number,
    text: string,
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ): Phaser.GameObjects.Text {
    const defaultStyle = {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY
    };

    return this.scene.add.text(x, y, text, style || defaultStyle).setOrigin(0.5);
  }

  /**
   * 显示药材选择界面
   */
  private showHerbSelection(): void {
    this.clearContent();

    // 标题
    this.titleText = this.createText(this.width / 2, 50, '选择炮制药材', {
      fontSize: '24px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY
    });
    this.container.add(this.titleText);

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 获取可用药材列表
    const availableHerbs = this.manager.getAvailableHerbs();

    if (availableHerbs.length === 0) {
      const hintText = this.createText(this.width / 2, 150, '背包中没有可炮制的药材', {
        fontSize: '18px',
        color: '#f44336'
      });
      this.contentContainer!.add(hintText);
    } else {
      // 提示文字
      const hintText = this.createText(this.width / 2, 100, '请选择要炮制的药材', {
        fontSize: '16px',
        color: UI_COLOR_STRINGS.TEXT_SECONDARY
      });
      this.contentContainer!.add(hintText);

      // 药材列表
      const startY = 150;
      const spacing = 60;

      availableHerbs.forEach((herbId, index) => {
        const herb = getHerbById(herbId);
        const params = getHerbProcessingParams(herbId);
        const y = startY + index * spacing;

        // 药材按钮
        const button = this.createButton(this.width / 2, y, herb?.name || herbId, () => {
          this.manager.selectHerb(herbId);
        });

        // 推荐方法提示
        if (params) {
          const methodConfig = getProcessingMethodConfig(params.default_method);
          const methodHint = this.createText(this.width / 2, y + 25,
            `推荐方法: ${methodConfig?.name || params.default_method}`,
            { fontSize: '14px', color: UI_COLOR_STRINGS.STATUS_WARNING }
          );
          this.contentContainer!.add(methodHint);
        }

        this.contentContainer!.add(button);
      });
    }

    // 返回按钮
    const backButton = this.createButton(this.width / 2, this.height - 80, '返回', () => {
      this.manager.reset();
      this.destroy();
      this.scene.scene.stop('ProcessingScene');
      this.scene.scene.start('ClinicScene');
    }, {
      fontSize: '18px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_DARK,
      padding: { x: 20, y: 10 }
    });
    this.contentContainer!.add(backButton);

    // 阶段指示
    this.phaseText = this.createText(this.width / 2, this.height - 50, '阶段: 选择药材', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.STATUS_WARNING
    });
    this.container.add(this.phaseText);
  }

  /**
   * 显示方法选择界面
   */
  private showMethodSelection(): void {
    this.clearContent();

    const state = this.manager.getState();
    const herb = getHerbById(state.herb_id || '');
    const params = getHerbProcessingParams(state.herb_id || '');

    // 标题
    this.titleText?.setText(`选择炮制方法 - ${herb?.name || ''}`);
    this.container.add(this.titleText!);

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 提示文字
    const hintText = this.createText(this.width / 2, 100, '选择合适的炮制方法', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY
    });
    this.contentContainer!.add(hintText);

    // 方法分类显示
    const categories: ProcessingMethodCategory[] = ['chao', 'zhi', 'duan', 'zheng', 'zhu'];
    const categoryNames: Record<ProcessingMethodCategory, string> = {
      'chao': '炒法',
      'zhi': '炙法',
      'duan': '煅法',
      'zheng': '蒸法',
      'zhu': '煮法'
    };

    const startY = 150;
    const categorySpacing = 100;

    categories.forEach((category, catIndex) => {
      const y = startY + catIndex * categorySpacing;

      // 分类标题
      const categoryTitle = this.createText(100, y, categoryNames[category], {
        fontSize: '18px',
        color: UI_COLOR_STRINGS.STATUS_WARNING
      }).setOrigin(0, 0.5);
      this.contentContainer!.add(categoryTitle);

      // 该分类下的方法
      const methods = getMethodsByCategory(category);
      const methodButtons: Phaser.GameObjects.Text[] = [];

      methods.forEach((method, methodIndex) => {
        const x = 200 + methodIndex * 120;
        const isRecommended = params?.suitable_methods.includes(method.id);
        const isSelected = state.method === method.id;

        const btn = this.createButton(x, y, method.name, () => {
          this.manager.selectMethod(method.id);
        }, {
          fontSize: '14px',
          color: isSelected ? UI_COLOR_STRINGS.BUTTON_SUCCESS : (isRecommended ? UI_COLOR_STRINGS.STATUS_WARNING : UI_COLOR_STRINGS.TEXT_PRIMARY),
          backgroundColor: isSelected ? '#2E7D32' : UI_COLOR_STRINGS.PANEL_PRIMARY,
          padding: { x: 10, y: 5 }
        });

        methodButtons.push(btn);
      });

      this.contentContainer!.add(methodButtons);
    });

    // 确认按钮
    const confirmButton = this.createButton(this.width / 2, this.height - 120, '确认方法', () => {
      if (state.method) {
        // 方法选择已在selectMethod中自动进入下一阶段
      }
    }, {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.BUTTON_SUCCESS,
      backgroundColor: '#1B5E20',
      padding: { x: 30, y: 15 }
    });
    this.contentContainer!.add(confirmButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 选择方法');
  }

  /**
   * 显示辅料选择界面
   */
  private showAdjuvantSelection(): void {
    this.clearContent();

    const state = this.manager.getState();
    const methodConfig = state.method ? getProcessingMethodConfig(state.method) : null;
    const availableAdjuvants = this.manager.getAvailableAdjuvants();

    // 标题
    this.titleText?.setText(`选择辅料 - ${methodConfig?.name || ''}`);
    this.container.add(this.titleText!);

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 提示文字
    const hintText = this.createText(this.width / 2, 100, '选择炮制辅料', {
      fontSize: '16px',
      color: UI_COLOR_STRINGS.TEXT_SECONDARY
    });
    this.contentContainer!.add(hintText);

    // 辅料列表
    const startY = 150;
    const spacing = 70;

    availableAdjuvants.forEach((adjuvantId, index) => {
      const adjuvantConfig = getAdjuvantConfig(adjuvantId);
      const params = getHerbProcessingParams(state.herb_id || '');
      const isRecommended = adjuvantId === params?.default_adjuvant;
      const isSelected = state.adjuvant === adjuvantId;
      const y = startY + index * spacing;

      // 辅料按钮
      const button = this.createButton(this.width / 2, y, adjuvantConfig?.name || adjuvantId, () => {
        this.manager.selectAdjuvant(adjuvantId);
      }, {
        fontSize: '18px',
        color: isSelected ? UI_COLOR_STRINGS.BUTTON_SUCCESS : (isRecommended ? UI_COLOR_STRINGS.STATUS_WARNING : UI_COLOR_STRINGS.TEXT_PRIMARY),
        backgroundColor: isSelected ? '#2E7D32' : UI_COLOR_STRINGS.PANEL_PRIMARY,
        padding: { x: 20, y: 10 }
      });

      // 辅料功效
      if (adjuvantConfig) {
        const effectText = this.scene.add.text(this.width / 2, y + 25, adjuvantConfig.effect, {
          fontSize: '14px',
          color: UI_COLOR_STRINGS.TEXT_SECONDARY,
          wordWrap: { width: this.width - 80 }
        }).setOrigin(0.5);
        this.contentContainer!.add(effectText);
      }

      this.contentContainer!.add(button);
    });

    // 阶段指示
    this.phaseText?.setText('阶段: 选择辅料');
  }

  /**
   * 显示预处理界面（简化）
   */
  private showPreprocess(): void {
    this.clearContent();

    const state = this.manager.getState();
    const herb = getHerbById(state.herb_id || '');
    const methodConfig = state.method ? getProcessingMethodConfig(state.method) : null;

    // 标题
    this.titleText?.setText('预处理准备');
    this.container.add(this.titleText!);

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 当前选择摘要
    const summaryText = this.createText(this.width / 2, 100,
      `药材: ${herb?.name || ''} | 方法: ${methodConfig?.name || ''}`,
      { fontSize: '18px', color: UI_COLOR_STRINGS.BUTTON_SUCCESS }
    );
    this.contentContainer!.add(summaryText);

    // 预处理说明（简化）
    const hintText = this.createText(this.width / 2, 150,
      '预处理步骤已自动完成（一期简化）',
      { fontSize: '16px', color: UI_COLOR_STRINGS.TEXT_SECONDARY }
    );
    this.contentContainer!.add(hintText);

    // 开始炮制按钮
    const startButton = this.createButton(this.width / 2, this.height - 120, '开始炮制', () => {
      this.manager.startPreprocess();
      this.manager.startProcessing();
    }, {
      fontSize: '20px',
      color: '#ff5722',
      backgroundColor: '#bf360c',
      padding: { x: 30, y: 15 }
    });
    this.contentContainer!.add(startButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 预处理');
  }

  /**
   * 显示炮制进度界面
   */
  private showProcessingProgress(): void {
    this.clearContent();

    const state = this.manager.getState();
    const methodConfig = state.method ? getProcessingMethodConfig(state.method) : null;

    // 标题
    this.titleText?.setText('炮制进行中...');
    this.container.add(this.titleText!);

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 进度条背景
    const progressBg = this.scene.add.rectangle(
      this.width / 2, 200, 400, 30, UI_COLORS.PANEL_LIGHT
    ).setOrigin(0.5);

    // 进度条填充
    this.progressFill = this.scene.add.rectangle(
      this.width / 2 - 200, 200, 0, 26, UI_COLORS.BUTTON_SUCCESS
    ).setOrigin(0, 0.5);
    this.progressFill.setName('progressFill');

    this.contentContainer!.add([progressBg, this.progressFill]);

    // 时间文字
    this.timeText = this.createText(this.width / 2, 250, '0 / 0 秒', {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY
    });
    this.timeText.setName('timeText');
    this.contentContainer!.add(this.timeText);

    // 温度显示
    const tempText = this.createText(this.width / 2, 300,
      `温度: ${state.temperature || methodConfig?.temperature_range || ''}`,
      { fontSize: '18px', color: '#ff5722' }
    );
    this.contentContainer!.add(tempText);

    // 完成按钮
    const completeButton = this.createButton(this.width / 2, this.height - 100, '完成炮制', () => {
      this.manager.stopProcessing();
      // 进入终点判断（简化：直接提交）
      const params = getHerbProcessingParams(state.herb_id || '');
      if (params) {
        this.manager.submitEndpoint(params.quality_check);
      } else {
        this.manager.submitEndpoint(['色泽均匀']);
      }
    }, {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.STATUS_WARNING,
      backgroundColor: '#e65100',
      padding: { x: 30, y: 15 }
    });
    this.contentContainer!.add(completeButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 炮制进行中');
  }

  /**
   * 更新炮制进度
   */
  private updateProcessingProgress(currentTime: number, targetTime: number, progress: number): void {
    if (!this.contentContainer) return;

    // 更新进度条
    if (this.progressFill) {
      this.progressFill.width = 400 * Math.min(progress, 1);
    }

    // 更新时间文字
    if (this.timeText) {
      this.timeText.setText(`${currentTime} / ${targetTime} 秒`);
    }
  }

  /**
   * 显示评分结果界面
   */
  private showEvaluation(result: ProcessingScoreResult): void {
    this.clearContent();

    // 标题
    this.titleText?.setText(result.passed ? '炮制成功！' : '炮制失败');
    this.container.add(this.titleText!);

    // 内容容器
    this.contentContainer = this.scene.add.container(0, 0);
    this.container.add(this.contentContainer);

    // 总分显示
    const scoreText = this.createText(this.width / 2, 100,
      `总分: ${result.total_score}`,
      { fontSize: '32px', color: result.passed ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#f44336' }
    );
    this.contentContainer!.add(scoreText);

    // 各维度分数
    const dimensionY = 150;
    const dimensionSpacing = 40;
    const dimensions = [
      { name: '方法选择', score: result.method_score, weight: 30 },
      { name: '辅料选择', score: result.adjuvant_score, weight: 20 },
      { name: '时间掌握', score: result.time_score, weight: 30 },
      { name: '质量判断', score: result.quality_score, weight: 20 }
    ];

    dimensions.forEach((dim, index) => {
      const y = dimensionY + index * dimensionSpacing;
      const color = dim.score >= dim.weight * 0.8 ? UI_COLOR_STRINGS.BUTTON_SUCCESS : '#f44336';

      const dimText = this.createText(this.width / 2, y,
        `${dim.name}: ${dim.score}/${dim.weight}`,
        { fontSize: '18px', color: color }
      );
      this.contentContainer!.add(dimText);
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
    this.contentContainer!.add(feedbackText);

    // 返回按钮
    const backButton = this.createButton(this.width / 2, this.height - 80, '返回', () => {
      this.manager.reset();
      this.destroy();
      this.scene.scene.stop('ProcessingScene');
      this.scene.scene.start('ClinicScene');
    }, {
      fontSize: '20px',
      color: UI_COLOR_STRINGS.TEXT_PRIMARY,
      backgroundColor: UI_COLOR_STRINGS.PANEL_PRIMARY,
      padding: { x: 30, y: 15 }
    });
    this.contentContainer!.add(backButton);

    // 阶段指示
    this.phaseText?.setText('阶段: 结果评分');
  }

  /**
   * 根据阶段更新UI
   */
  private updateUIForPhase(phase: ProcessingPhase): void {
    switch (phase) {
      case 'select_herb':
        this.showHerbSelection();
        break;
      case 'select_method':
        this.showMethodSelection();
        break;
      case 'select_adjuvant':
        this.showAdjuvantSelection();
        break;
      case 'preprocess':
        this.showPreprocess();
        break;
      case 'processing':
        this.showProcessingProgress();
        break;
      case 'check_endpoint':
        // 简化：直接进入评分
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
    this.eventBus.off(ProcessingEvent.PHASE_CHANGED, this.phaseChangedHandler);
    this.eventBus.off(ProcessingEvent.HERB_SELECTED, this.herbSelectedHandler);
    this.eventBus.off(ProcessingEvent.METHOD_SELECTED, this.methodSelectedHandler);
    this.eventBus.off(ProcessingEvent.ADJUVANT_SELECTED, this.adjuvantSelectedHandler);
    this.eventBus.off(ProcessingEvent.PROCESSING_TICK, this.processingTickHandler);
    this.eventBus.off(ProcessingEvent.SCORE_CALCULATED, this.scoreCalculatedHandler);

    // 清除内容
    this.clearContent();

    // 销毁标题和阶段文本
    if (this.titleText) {
      this.titleText.destroy();
      this.titleText = null;
    }
    if (this.phaseText) {
      this.phaseText.destroy();
      this.phaseText = null;
    }

    // 销毁主容器
    this.container.removeAll(true);
    this.container.destroy();

    // 清理引用
    this.progressFill = null;
    this.timeText = null;
  }
}