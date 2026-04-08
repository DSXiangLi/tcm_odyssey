// tests/visual/phase1-5/performance/load-time.spec.ts
/**
 * Phase 1.5 Layer 4: 性能测试
 *
 * 性能测试不阻断执行，仅记录结果
 * 测试用例:
 * - P-001: 背景图加载时间 ≤ 3秒
 * - P-002: 游戏帧率 ≥ 30fps
 * - P-003: 内存占用 ≤ 200MB
 */

import { test, expect } from '@playwright/test';
import { GameLauncher } from '../../utils/game-launcher';

/**
 * 性能测试结果记录
 */
interface PerformanceResult {
  testId: string;
  testName: string;
  actualValue: number;
  threshold: number;
  passed: boolean;
  unit: string;
  timestamp: number;
  message: string;
}

/**
 * 性能指标收集器
 */
class PerformanceCollector {
  private results: PerformanceResult[] = [];

  /**
   * 记录测试结果
   */
  recordResult(result: PerformanceResult): void {
    this.results.push(result);
    console.log(`[${result.testId}] ${result.passed ? 'PASS' : 'FAIL'}: ${result.actualValue}${result.unit} (threshold: ${result.threshold}${result.unit})`);
  }

  /**
   * 获取所有结果
   */
  getResults(): PerformanceResult[] {
    return this.results;
  }

  /**
   * 生成报告摘要
   */
  generateSummary(): string {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    return `
Performance Test Summary:
- Total: ${total}
- Passed: ${passed}
- Failed: ${failed}
- Pass Rate: ${((passed / total) * 100).toFixed(1)}%

Details:
${this.results.map(r =>
  `${r.testId}: ${r.passed ? '✓' : '✗'} ${r.actualValue}${r.unit} vs ${r.threshold}${r.unit} - ${r.message}`
).join('\n')}
`;
  }
}

/**
 * 性能阈值配置
 */
const PERFORMANCE_THRESHOLDS = {
  LOAD_TIME_MAX: 3000,      // 3秒
  FPS_MIN: 30,              // 30fps
  MEMORY_MAX: 200,          // 200MB
};

test.describe('Phase 1.5 Layer 4: 性能测试', () => {
  test('P-001: 背景图加载时间 ≤ 3秒', async ({ page }) => {
    const collector = new PerformanceCollector();
    const launcher = new GameLauncher(page);

    // 记录开始时间
    const startTime = Date.now();

    // 导航到游戏页面
    await launcher.navigateToGame();

    // 等待游戏状态接口就绪
    await launcher.waitForGameReady(15000);

    // 记录游戏就绪时间
    const gameReadyTime = Date.now();

    // 计算加载时间
    const loadTime = gameReadyTime - startTime;

    // 验证加载时间
    const passed = loadTime <= PERFORMANCE_THRESHOLDS.LOAD_TIME_MAX;

    collector.recordResult({
      testId: 'P-001',
      testName: '背景图加载时间',
      actualValue: loadTime,
      threshold: PERFORMANCE_THRESHOLDS.LOAD_TIME_MAX,
      passed,
      unit: 'ms',
      timestamp: Date.now(),
      message: passed
        ? `加载时间${loadTime}ms符合要求`
        : `加载时间${loadTime}ms超过阈值${PERFORMANCE_THRESHOLDS.LOAD_TIME_MAX}ms`
    });

    // 记录结果但不阻断
    console.log(collector.generateSummary());

    // 性能测试记录结果，不强制要求通过（仅记录）
    // 但我们仍然用expect来标记测试状态
    expect.soft(loadTime).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.LOAD_TIME_MAX);
  });

  test('P-002: 游戏帧率 ≥ 30fps', async ({ page }) => {
    const collector = new PerformanceCollector();
    const launcher = new GameLauncher(page);

    // 启动游戏
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();

    // 等待场景稳定
    await page.waitForTimeout(2000);

    // 测量帧率（连续测量5秒）
    const fpsResults = await page.evaluate(async () => {
      return new Promise<number[]>((resolve) => {
        const fpsSamples: number[] = [];
        const measurementDuration = 5000; // 5秒
        const sampleInterval = 1000; // 每秒采样一次

        let lastFrameTime = performance.now();
        let frameCount = 0;
        let elapsedMs = 0;

        const measureFrame = () => {
          const currentTime = performance.now();
          const delta = currentTime - lastFrameTime;

          if (delta >= sampleInterval) {
            // 计算每秒帧数
            const fps = Math.round((frameCount / delta) * 1000);
            fpsSamples.push(fps);

            frameCount = 0;
            lastFrameTime = currentTime;
            elapsedMs += delta;

            if (elapsedMs >= measurementDuration) {
              resolve(fpsSamples);
              return;
            }
          }

          frameCount++;
          requestAnimationFrame(measureFrame);
        };

        requestAnimationFrame(measureFrame);
      });
    });

    // 计算平均帧率
    const averageFps = fpsResults.reduce((a, b) => a + b, 0) / fpsResults.length;
    const minFps = Math.min(...fpsResults);
    const maxFps = Math.max(...fpsResults);

    // 验证帧率
    const passed = averageFps >= PERFORMANCE_THRESHOLDS.FPS_MIN;

    collector.recordResult({
      testId: 'P-002',
      testName: '游戏帧率',
      actualValue: Math.round(averageFps),
      threshold: PERFORMANCE_THRESHOLDS.FPS_MIN,
      passed,
      unit: 'fps',
      timestamp: Date.now(),
      message: passed
        ? `平均帧率${averageFps.toFixed(1)}fps，范围[${minFps}-${maxFps}]符合要求`
        : `平均帧率${averageFps.toFixed(1)}fps低于阈值${PERFORMANCE_THRESHOLDS.FPS_MIN}fps`
    });

    console.log(`FPS samples: ${fpsResults.join(', ')}`);
    console.log(collector.generateSummary());

    expect.soft(averageFps).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLDS.FPS_MIN);
  });

  test('P-003: 内存占用 ≤ 200MB', async ({ page }) => {
    const collector = new PerformanceCollector();
    const launcher = new GameLauncher(page);

    // 启动游戏
    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();

    // 等待场景稳定
    await page.waitForTimeout(3000);

    // 获取内存使用情况（仅Chrome支持）
    const memoryInfo = await page.evaluate(() => {
      // performance.memory API仅在Chrome中可用
      const memory = (performance as unknown as { memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      } }).memory;

      if (memory) {
        return {
          available: true,
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usedMB: Math.round(memory.usedJSHeapSize / (1024 * 1024))
        };
      }

      // 如果API不可用，尝试使用其他方法估算
      return {
        available: false,
        usedMB: 0,
        message: 'performance.memory API not available (requires Chrome)'
      };
    });

    // 验证内存使用
    let passed = false;
    let actualMemory = 0;

    if (memoryInfo.available) {
      actualMemory = memoryInfo.usedMB;
      passed = actualMemory <= PERFORMANCE_THRESHOLDS.MEMORY_MAX;
    } else {
      // API不可用时，标记为未知状态（不阻断）
      passed = true; // 不因API限制而失败
      actualMemory = 0;
    }

    collector.recordResult({
      testId: 'P-003',
      testName: '内存占用',
      actualValue: actualMemory,
      threshold: PERFORMANCE_THRESHOLDS.MEMORY_MAX,
      passed,
      unit: 'MB',
      timestamp: Date.now(),
      message: memoryInfo.available
        ? passed
          ? `内存使用${actualMemory}MB符合要求`
          : `内存使用${actualMemory}MB超过阈值${PERFORMANCE_THRESHOLDS.MEMORY_MAX}MB`
        : 'performance.memory API不可用（仅在Chrome中支持）'
    });

    console.log('Memory info:', JSON.stringify(memoryInfo));
    console.log(collector.generateSummary());

    // 如果API可用才进行严格验证
    if (memoryInfo.available) {
      expect.soft(actualMemory).toBeLessThanOrEqual(PERFORMANCE_THRESHOLDS.MEMORY_MAX);
    }
  });
});

// 导出用于报告汇总
export { PerformanceCollector, PerformanceResult };