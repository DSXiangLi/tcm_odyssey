// tests/visual_acceptance/scene_operations.ts

import { Page } from '@playwright/test';
import { OperationStep } from './screenshot_config';

/**
 * 游戏操作模拟器
 * 复用tests/e2e/utils/phaser-helper.ts的基础能力
 */
export class SceneOperations {
  private page: Page;
  private baseUrl: string;

  constructor(page: Page, baseUrl: string = 'http://localhost:5173') {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  /**
   * 等待游戏初始化完成
   */
  async waitForGameReady(): Promise<void> {
    await this.page.waitForSelector('#game-container canvas', { timeout: 15000 });

    // 等待游戏实例暴露到全局
    await this.page.waitForFunction(
      () => (window as any).__PHASER_GAME__ !== undefined,
      { timeout: 15000 }
    );

    // 等待游戏场景数组有内容
    await this.page.waitForFunction(
      () => {
        const game = (window as any).__PHASER_GAME__;
        if (!game) return false;
        const sceneManager = game.scene;
        return sceneManager.scenes && sceneManager.scenes.length > 0;
      },
      { timeout: 15000 }
    );

    // 额外等待确保场景完全初始化
    await this.page.waitForTimeout(500);
  }

  /**
   * 等待场景就绪
   */
  async waitForSceneReady(): Promise<void> {
    await this.page.waitForFunction(() => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) return false;
      // 检查是否有活跃场景 - 使用 Phaser 正确的 active 属性
      const scenes = game.scene.scenes;
      return scenes.some((s: any) => s.active === true);
    }, { timeout: 10000 });
  }

  /**
   * 导航到指定场景（通过Phaser游戏API）
   */
  async navigateToScene(sceneName: string): Promise<void> {
    // 在启动新场景前重置全局状态变量，避免测试状态污染
    await this.page.evaluate(() => {
      (window as any).__SCENE_READY__ = false;
      (window as any).__GAME_READY__ = false;
      (window as any).__DIALOG_ACTIVE__ = false;
      (window as any).__STREAMING__ = false;
    });

    // 先停止当前活跃的场景（Phaser 允许多个场景同时活跃，但我们需要干净的切换）
    await this.page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        // 找到当前活跃的场景并停止它们
        for (const s of game.scene.scenes) {
          const key = s.scene?.key || s.key;
          if (key && game.scene.isActive(key)) {
            game.scene.stop(key);
          }
        }
      }
    });

    // 等待旧场景完全停止
    await this.page.waitForTimeout(300);

    // 启动目标场景
    await this.page.evaluate((name) => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start(name);
      }
    }, sceneName);

    // 等待场景激活
    await this.page.waitForFunction(
      (key) => {
        const game = (window as any).__PHASER_GAME__;
        if (!game) return false;
        return game.scene.isActive(key);
      },
      sceneName,
      { timeout: 15000 }
    );

    // 等待场景完全创建（__SCENE_READY__ 被设置）
    await this.page.waitForFunction(
      () => (window as any).__SCENE_READY__ === true,
      { timeout: 15000 }
    );

    // 额外等待确保场景完全初始化
    await this.page.waitForTimeout(500);
  }

  /**
   * 执行玩家移动操作
   */
  async movePlayer(direction: 'up' | 'down' | 'left' | 'right', duration: number = 1000): Promise<void> {
    const keyMap = {
      'up': 'ArrowUp',
      'down': 'ArrowDown',
      'left': 'ArrowLeft',
      'right': 'ArrowRight',
    };

    await this.page.keyboard.down(keyMap[direction]);
    await this.page.waitForTimeout(duration);
    await this.page.keyboard.up(keyMap[direction]);
  }

  /**
   * 触发NPC交互（空格键）
   */
  async interactNPC(): Promise<void> {
    await this.page.keyboard.press('Space');
    await this.page.waitForFunction(() => {
      return (window as any).__DIALOG_ACTIVE__ === true;
    }, { timeout: 10000 });
  }

  /**
   * 触发快捷键
   */
  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
    await this.page.waitForTimeout(500);
  }

  /**
   * 点击Canvas坐标
   */
  async clickCanvas(x: number, y: number): Promise<void> {
    await this.page.click('#game-container canvas', { position: { x, y } });
  }

  /**
   * 等待特定状态标志
   */
  async waitForCondition(condition: string, timeout: number = 10000): Promise<void> {
    // 处理带__前缀的全局变量名
    const varName = condition.startsWith('__') ? condition : `__${condition}__`;

    await this.page.waitForFunction(
      (name) => {
        const value = (window as any)[name];
        return value === true || value !== undefined && value !== null;
      },
      varName,
      { timeout }
    );
  }

  /**
   * 获取当前游戏状态
   */
  async getGameState(): Promise<Record<string, any>> {
    // 短暂等待确保场景状态稳定
    await this.page.waitForTimeout(500);

    return await this.page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      let currentScene = null;

      if (game) {
        const scenes = game.scene.scenes;
        // 使用 Phaser 的 isActive 方法检测活跃场景
        for (const s of scenes) {
          const key = s.scene?.key || s.key;
          if (key && game.scene.isActive(key)) {
            currentScene = key;
            break;
          }
        }
      }

      return {
        currentScene,
        dialogActive: (window as any).__DIALOG_ACTIVE__,
        streaming: (window as any).__STREAMING__,
        inventoryOpen: (window as any).__INVENTORY_OPEN__,
        saveUIOpen: (window as any).__SAVE_UI_OPEN__,
        tutorialActive: (window as any).__TUTORIAL_ACTIVE__,
        gameReady: (window as any).__PHASER_GAME__ !== undefined,
      };
    });
  }

  /**
   * 执行操作步骤序列
   */
  async executeOperations(steps: OperationStep[]): Promise<void> {
    for (const step of steps) {
      switch (step.type) {
        case 'navigate':
          await this.navigateToScene(step.params.scene);
          break;
        case 'move':
          await this.movePlayer(step.params.direction, step.params.duration || 1000);
          break;
        case 'interact':
          await this.interactNPC();
          break;
        case 'keypress':
          await this.pressKey(step.params.key);
          break;
        case 'click':
          await this.clickCanvas(step.params.x, step.params.y);
          break;
        case 'wait':
          if (step.params.condition) {
            await this.waitForCondition(step.params.condition, step.params.timeout || 10000);
          } else {
            await this.page.waitForTimeout(step.params.duration || 1000);
          }
          break;
      }

      if (step.delayAfter) {
        await this.page.waitForTimeout(step.delayAfter);
      }
    }
  }

  /**
   * 从标题画面开始游戏
   */
  async startFromTitle(): Promise<void> {
    // 导航到标题场景
    await this.navigateToScene('TitleScene');

    // 点击"开始游戏"按钮
    await this.clickCanvas(400, 350);

    // 等待游戏进入主场景
    await this.waitForCondition('__GAME_READY__', 10000);
  }
}
