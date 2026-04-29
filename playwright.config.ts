import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载.env文件中的环境变量
dotenv.config({ path: resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  fullyParallel: false, // 游戏测试有状态依赖，需要串行执行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 单线程执行避免状态竞争
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }  // 匹配诊断游戏设计尺寸
      }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});