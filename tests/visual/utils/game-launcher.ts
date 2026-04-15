// tests/visual/utils/game-launcher.ts
import { Page } from '@playwright/test';

/**
 * 游戏启动器
 * 负责启动浏览器和游戏
 */
export class GameLauncher {
  private page: Page;
  private baseUrl: string;

  constructor(page: Page, baseUrl: string = 'http://localhost:3000') {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  /**
   * 导航到游戏页面
   */
  async navigateToGame(): Promise<void> {
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 等待游戏就绪
   */
  async waitForGameReady(timeout: number = 10000): Promise<void> {
    await this.page.waitForFunction(
      () => typeof (window as unknown as Record<string, unknown>).__GAME_STATE__ === 'function',
      { timeout }
    );
  }

  /**
   * 点击开始按钮
   * TitleScene中"开始游戏"按钮位置: GAME_HEIGHT/2 + 20 = 320
   * 相对于canvas中心(300)偏移+20
   */
  async clickStartButton(): Promise<void> {
    // Phaser游戏中的按钮是Canvas元素，需要点击特定坐标
    // 开始按钮位置在 (GAME_WIDTH/2, GAME_HEIGHT/2 + 20) = (400, 320)
    const canvas = this.page.locator('#game-container canvas');
    const box = await canvas.boundingBox();

    if (box) {
      // 计算按钮位置（相对于canvas中心偏移+20）
      const buttonX = box.x + box.width / 2;
      const buttonY = box.y + box.height / 2 + 20;  // 修正：从+50改为+20

      await this.page.mouse.click(buttonX, buttonY);
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * 获取游戏状态
   */
  async getGameState(): Promise<Record<string, unknown> | null> {
    return await this.page.evaluate(() => {
      const getState = (window as unknown as Record<string, unknown>).__GAME_STATE__;
      if (typeof getState === 'function') {
        return getState() as Record<string, unknown>;
      }
      return null;
    });
  }

  /**
   * 检查是否在标题画面
   */
  async isOnTitleScene(): Promise<boolean> {
    const state = await this.getGameState();
    return state?.currentScene === 'TitleScene';
  }

  /**
   * 检查是否在游戏场景
   */
  async isInGameScene(): Promise<boolean> {
    const state = await this.getGameState();
    const gameScenes = ['TownOutdoorScene', 'ClinicScene', 'GardenScene', 'HomeScene'];
    return gameScenes.includes(state?.currentScene as string);
  }

  /**
   * 关闭页面
   */
  async close(): Promise<void> {
    await this.page.close();
  }
}