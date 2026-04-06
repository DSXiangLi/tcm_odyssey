// tests/visual/utils/screenshot-capture.ts
import { Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export interface ScreenshotOptions {
  directory: string;
  filename: string;
  fullPage?: boolean;
}

export interface ScreenshotResult {
  path: string;
  filename: string;
  timestamp: number;
}

/**
 * 截图采集器
 */
export class ScreenshotCapture {
  private baseDirectory: string;
  private timestamp: string;

  constructor(baseDirectory: string = 'tests/visual/screenshots') {
    this.baseDirectory = baseDirectory;
    this.timestamp = this.formatTimestamp(new Date());
    this.ensureDirectoryExists(baseDirectory);
  }

  private formatTimestamp(date: Date): string {
    return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 截取Canvas截图
   */
  async captureCanvas(page: Page, options: ScreenshotOptions): Promise<ScreenshotResult> {
    const { directory, filename, fullPage = false } = options;
    const fullPath = path.join(directory, filename);

    this.ensureDirectoryExists(directory);

    const canvas = page.locator('#game-container canvas');

    if (fullPage) {
      await page.screenshot({ path: fullPath, fullPage: true });
    } else {
      await canvas.screenshot({ path: fullPath });
    }

    return {
      path: fullPath,
      filename,
      timestamp: Date.now()
    };
  }

  /**
   * 截取场景截图
   */
  async captureScene(page: Page, sceneName: string): Promise<ScreenshotResult> {
    const filename = `${sceneName}-${this.timestamp}.png`;
    return await this.captureCanvas(page, { directory: this.baseDirectory, filename });
  }

  /**
   * 截取动作序列帧
   */
  async captureSequence(
    page: Page,
    sequenceName: string,
    frameIndex: number
  ): Promise<ScreenshotResult> {
    const directory = path.join(this.baseDirectory, 'sequences');
    const filename = `${sequenceName}-${frameIndex.toString().padStart(3, '0')}.png`;
    return await this.captureCanvas(page, { directory, filename });
  }

  /**
   * 获取时间戳
   */
  getTimestamp(): string {
    return this.timestamp;
  }
}

export const screenshotCapture = new ScreenshotCapture();