// tests/visual/phase1-5/utils/report-generator.ts
import fs from 'fs';
import path from 'path';

/**
 * 单个测试结果
 */
export interface TestResult {
  testId: string;
  testName: string;
  layer: string; // 'layer1-state', 'layer2-visual', 'layer3-ai'
  status: 'PASS' | 'FAIL' | 'SKIP' | 'ERROR';
  confidence?: number; // 0-1, AI判定置信度
  executionTime: number; // 毫秒
  actualValue?: unknown; // 实际值
  expectedValue?: unknown; // 期望值
  errorMessage?: string; // 错误信息
  screenshot?: string; // 截图路径
  aiAnalysis?: string; // AI分析结果
  issues?: string[]; // 发现的问题
}

/**
 * Layer测试结果
 */
export interface LayerResult {
  layerName: string; // 'layer1-state', 'layer2-visual', 'layer3-ai'
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  errorTests: number;
  passRate: number; // 百分比
  averageExecutionTime: number; // 平均执行时间(ms)
  results: TestResult[];
  criticalFailures: TestResult[]; // 关键失败
  summary: string; // Layer摘要
}

/**
 * 完整测试结果
 */
export interface TestResults {
  meta: {
    phase: string; // 'Phase 1.5'
    timestamp: string; // ISO时间
    duration: number; // 总执行时间(ms)
    environment: {
      browser: string;
      os: string;
      nodeVersion: string;
    };
  };
  overall: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    errorTests: number;
    overallPassed: boolean;
    passRate: number;
  };
  layers: LayerResult[];
  recommendations?: string[]; // AI推荐
  diagnosis?: string; // AI诊断
}

/**
 * 报告生成器
 * 用于生成Phase 1.5测试报告
 */
export class ReportGenerator {
  private outputDir: string;

  /**
   * 初始化报告生成器
   * @param outputDir 输出目录路径
   */
  constructor(outputDir: string = 'tests/visual/phase1-5/reports') {
    this.outputDir = outputDir;
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  /**
   * 生成JSON报告
   * @param results 完整测试结果
   * @returns 生成的JSON文件路径
   */
  generateJsonReport(results: TestResults): string {
    const filename = `phase1-5-report-${Date.now()}.json`;
    const filepath = path.join(this.outputDir, filename);

    const jsonData = JSON.stringify(results, null, 2);
    fs.writeFileSync(filepath, jsonData, 'utf-8');

    return filepath;
  }

  /**
   * 生成Markdown报告
   * @param results 完整测试结果
   * @returns 生成的Markdown文件路径
   */
  generateMarkdownReport(results: TestResults): string {
    const lines: string[] = [];

    // 标题
    lines.push('# Phase 1.5 AI端到端视觉验收测试报告');
    lines.push('');
    lines.push(`**生成时间**: ${results.meta.timestamp}`);
    lines.push(`**总执行时间**: ${(results.meta.duration / 1000).toFixed(2)}秒`);
    lines.push('');

    // 环境信息
    lines.push('## 测试环境');
    lines.push('');
    lines.push('| 项目 | 值 |');
    lines.push('|------|-----|');
    lines.push(`| 浏览器 | ${results.meta.environment.browser} |`);
    lines.push(`| 操作系统 | ${results.meta.environment.os} |`);
    lines.push(`| Node版本 | ${results.meta.environment.nodeVersion} |`);
    lines.push('');

    // 总体结果
    lines.push('## 总体测试结果');
    lines.push('');
    lines.push('| 指标 | 数值 |');
    lines.push('|------|------|');
    lines.push(`| 总测试数 | ${results.overall.totalTests} |`);
    lines.push(`| 通过 | ${results.overall.passedTests} |`);
    lines.push(`| 失败 | ${results.overall.failedTests} |`);
    lines.push(`| 跳过 | ${results.overall.skippedTests} |`);
    lines.push(`| 错误 | ${results.overall.errorTests} |`);
    lines.push(`| 通过率 | ${results.overall.passRate.toFixed(1)}% |`);
    lines.push(`| 总体判定 | ${this.getStatusEmoji(results.overall.overallPassed ? 'PASS' : 'FAIL')} |`);
    lines.push('');

    // 各Layer结果
    lines.push('## 分层测试结果');
    lines.push('');

    for (const layer of results.layers) {
      lines.push(`### ${layer.layerName}`);
      lines.push('');
      lines.push('| 指标 | 数值 |');
      lines.push('|------|------|');
      lines.push(`| 测试数 | ${layer.totalTests} |`);
      lines.push(`| 通过 | ${layer.passedTests} |`);
      lines.push(`| 失败 | ${layer.failedTests} |`);
      lines.push(`| 通过率 | ${layer.passRate.toFixed(1)}% |`);
      lines.push(`| 平均执行时间 | ${layer.averageExecutionTime.toFixed(0)}ms |`);
      lines.push('');

      // 测试详情表格
      if (layer.results.length > 0) {
        lines.push('| 测试ID | 测试名称 | 状态 | 置信度 | 执行时间 |');
        lines.push('|--------|----------|------|--------|----------|');

        for (const result of layer.results) {
          const statusEmoji = this.getStatusEmoji(result.status);
          const confidence = result.confidence !== undefined
            ? `${(result.confidence * 100).toFixed(0)}%`
            : '-';
          const execTime = `${result.executionTime}ms`;
          lines.push(`| ${result.testId} | ${result.testName} | ${statusEmoji} | ${confidence} | ${execTime} |`);
        }
        lines.push('');
      }

      // 关键失败
      if (layer.criticalFailures.length > 0) {
        lines.push('#### 关键失败项');
        lines.push('');
        for (const failure of layer.criticalFailures) {
          lines.push(`- **${failure.testName}** (${failure.testId})`);
          if (failure.errorMessage) {
            lines.push(`  - 错误: ${failure.errorMessage}`);
          }
          if (failure.issues && failure.issues.length > 0) {
            lines.push(`  - 问题: ${failure.issues.join(', ')}`);
          }
        }
        lines.push('');
      }

      // Layer摘要
      lines.push(`> ${layer.summary}`);
      lines.push('');
    }

    // AI诊断和建议
    if (results.diagnosis) {
      lines.push('## AI诊断分析');
      lines.push('');
      lines.push(results.diagnosis);
      lines.push('');
    }

    if (results.recommendations && results.recommendations.length > 0) {
      lines.push('## AI推荐行动');
      lines.push('');
      for (const rec of results.recommendations) {
        lines.push(`- ${rec}`);
      }
      lines.push('');
    }

    // 结论
    lines.push('## 结论');
    lines.push('');
    if (results.overall.overallPassed) {
      lines.push('**所有测试通过**, Phase 1.5 视觉验收完成, 可以进入下一阶段开发。');
    } else {
      lines.push(`**${results.overall.failedTests}项测试失败**, 需要修复问题后再进行验收。`);
      lines.push('');
      lines.push('建议优先处理关键失败项, 确保核心功能正常运行。');
    }

    const filename = `phase1-5-report-${Date.now()}.md`;
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, lines.join('\n'), 'utf-8');

    return filepath;
  }

  /**
   * 生成汇总报告
   * @param layerResults 各Layer测试结果
   * @returns 生成的汇总Markdown文件路径
   */
  generateSummaryReport(layerResults: LayerResult[]): string {
    const lines: string[] = [];

    lines.push('# Phase 1.5 测试汇总报告');
    lines.push('');
    lines.push(`**生成时间**: ${new Date().toISOString()}`);
    lines.push('');

    // Layer汇总表
    lines.push('## Layer测试汇总');
    lines.push('');
    lines.push('| Layer | 总测试 | 通过 | 失败 | 通过率 | 平均耗时 |');
    lines.push('|-------|--------|------|------|--------|----------|');

    for (const layer of layerResults) {
      const statusEmoji = layer.passRate >= 80 ? '✅' : (layer.passRate >= 50 ? '⚠️' : '❌');
      lines.push(
        `| ${layer.layerName} | ${layer.totalTests} | ${layer.passedTests} | ${layer.failedTests} | ` +
        `${layer.passRate.toFixed(1)}% ${statusEmoji} | ${layer.averageExecutionTime.toFixed(0)}ms |`
      );
    }
    lines.push('');

    // 总计
    const totalTests = layerResults.reduce((sum, l) => sum + l.totalTests, 0);
    const totalPassed = layerResults.reduce((sum, l) => sum + l.passedTests, 0);
    const totalFailed = layerResults.reduce((sum, l) => sum + l.failedTests, 0);
    const totalRate = (totalPassed / totalTests) * 100;

    lines.push('## 总体汇总');
    lines.push('');
    lines.push(`- **总测试数**: ${totalTests}`);
    lines.push(`- **通过数**: ${totalPassed}`);
    lines.push(`- **失败数**: ${totalFailed}`);
    lines.push(`- **通过率**: ${totalRate.toFixed(1)}%`);
    lines.push('');

    // 快速状态判定
    lines.push('## 状态判定');
    lines.push('');
    if (totalFailed === 0) {
      lines.push('✅ **全部通过** - Phase 1.5验收完成');
    } else if (totalRate >= 80) {
      lines.push('⚠️ **大部分通过** - 有少量失败需要关注');
    } else if (totalRate >= 50) {
      lines.push('⚠️ **半数通过** - 需要重点修复失败项');
    } else {
      lines.push('❌ **大量失败** - 需要全面检查和修复');
    }

    // 关键问题汇总
    lines.push('');
    lines.push('## 关键问题汇总');
    lines.push('');

    const allCriticalFailures = layerResults.flatMap(l => l.criticalFailures);
    if (allCriticalFailures.length === 0) {
      lines.push('无关键失败项');
    } else {
      for (const failure of allCriticalFailures) {
        lines.push(`- **${failure.layer}**: ${failure.testName} (${failure.testId})`);
      }
    }

    const filename = `phase1-5-summary-${Date.now()}.md`;
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, lines.join('\n'), 'utf-8');

    return filepath;
  }

  /**
   * 获取状态表情符号
   * @param status 测试状态
   * @returns 状态表情符号字符串
   */
  private getStatusEmoji(status: 'PASS' | 'FAIL' | 'SKIP' | 'ERROR'): string {
    switch (status) {
      case 'PASS':
        return '✅ 通过';
      case 'FAIL':
        return '❌ 失败';
      case 'SKIP':
        return '⏭️ 跳过';
      case 'ERROR':
        return '⚠️ 错误';
      default:
        return '❓ 未知';
    }
  }
}

/**
 * 默认报告生成器实例
 */
export const reportGenerator = new ReportGenerator();