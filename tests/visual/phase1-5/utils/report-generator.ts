// tests/visual/phase1-5/utils/report-generator.ts
import fs from 'fs';
import path from 'path';

/**
 * 单个测试结果
 */
export interface TestResult {
  testId: string;
  testName: string;
  layer: 'smoke' | 'functional' | 'deep-validation' | 'performance' | 'user';
  passed: boolean;
  judgmentType: 'hard' | 'soft' | 'visual' | 'threshold' | 'user-score';
  confidence?: number;
  score?: number;
  executionTime: number;
  expected?: unknown;
  actual?: unknown;
  issues: string[];
  evidence?: {
    stateVerification?: string;
    logValidation?: string;
    screenshotAnalysis?: string;
    performanceMetric?: string;
  };
}

/**
 * Layer测试结果
 */
export interface LayerResult {
  layer: 'smoke' | 'functional' | 'deep-validation' | 'performance' | 'user';
  layerName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;
  score?: number;
  executionTime: number;
  status: 'passed' | 'failed' | 'blocked' | 'pending';
  results: TestResult[];
  blockingReason?: string;
}

/**
 * 完整测试结果
 */
export interface TestResults {
  phase: string;
  testType: string;
  timestamp: string;
  totalExecutionTime: number;
  overallPassed: boolean;
  layerResults: LayerResult[];
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    overallPassRate: number;
    overallScore?: number;
  };
  scores?: {
    atmosphere?: {
      pastoral_healing?: number;
      tcm_culture?: number;
      exploration_guide?: number;
      style_consistency?: number;
    };
    technical?: {
      layer_architecture?: number;
      color_match?: number;
    };
  };
  aiFeedback?: {
    summary: string;
    strengths: string[];
    improvements: string[];
  };
  screenshots?: string[];
}

/**
 * 报告生成器
 */
export class ReportGenerator {
  private outputDirectory: string;

  constructor(outputDirectory: string = 'tests/visual/reports/phase1-5') {
    this.outputDirectory = outputDirectory;
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }
  }

  /**
   * 生成JSON报告
   * @param results 完整测试结果
   * @returns 生成的报告文件路径
   */
  generateJsonReport(results: TestResults): string {
    const report: TestResults = {
      phase: results.phase || 'Phase 1.5',
      testType: results.testType || '视觉验收',
      timestamp: results.timestamp || new Date().toISOString(),
      totalExecutionTime: results.totalExecutionTime,
      overallPassed: results.overallPassed,
      layerResults: results.layerResults,
      summary: results.summary,
      scores: results.scores,
      aiFeedback: results.aiFeedback,
      screenshots: results.screenshots
    };

    const filename = `phase1-5-report-${Date.now()}.json`;
    const filepath = path.join(this.outputDirectory, filename);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    return filepath;
  }

  /**
   * 生成Markdown报告
   * @param results 完整测试结果
   * @returns 生成的报告文件路径
   */
  generateMarkdownReport(results: TestResults): string {
    const lines: string[] = [];

    // 标题
    lines.push(`# ${results.phase} 测试报告`);
    lines.push('');
    lines.push(`**测试类型**: ${results.testType}`);
    lines.push(`**执行时间**: ${results.timestamp}`);
    lines.push(`**总耗时**: ${(results.totalExecutionTime / 1000).toFixed(1)}秒`);
    lines.push(`**总体结果**: ${results.overallPassed ? 'PASS' : 'FAIL'}`);
    lines.push('');

    // 测试结果概览
    lines.push('## 测试结果概览');
    lines.push('');
    lines.push('| Layer | 通过率 | 状态 | 说明 |');
    lines.push('|-------|--------|------|------|');

    for (const layer of results.layerResults) {
      const statusIcon = this.getStatusIcon(layer.status);
      const passRateDisplay = layer.score !== undefined
        ? `${layer.score.toFixed(1)}/5`
        : `${(layer.passRate * 100).toFixed(0)}%`;
      const note = layer.blockingReason || '';
      lines.push(`| ${layer.layerName} | ${passRateDisplay} | ${statusIcon} | ${note} |`);
    }
    lines.push('');

    // 总体统计
    lines.push('## 总体统计');
    lines.push('');
    lines.push('| 指标 | 数值 |');
    lines.push('|------|------|');
    lines.push(`| 总测试数 | ${results.summary.totalTests} |`);
    lines.push(`| 通过数 | ${results.summary.totalPassed} |`);
    lines.push(`| 失败数 | ${results.summary.totalFailed} |`);
    if (results.summary.overallScore !== undefined) {
      lines.push(`| 总体评分 | ${results.summary.overallScore.toFixed(1)}/5 |`);
    } else {
      lines.push(`| 通过率 | ${(results.summary.overallPassRate * 100).toFixed(1)}% |`);
    }
    lines.push('');

    // 各Layer详细结果
    lines.push('## 详细测试结果');
    lines.push('');

    for (const layer of results.layerResults) {
      lines.push(`### ${layer.layerName}`);
      lines.push('');
      lines.push(`- **通过率**: ${(layer.passRate * 100).toFixed(0)}%`);
      lines.push(`- **通过/失败**: ${layer.passedTests}/${layer.failedTests}`);
      lines.push(`- **执行时间**: ${(layer.executionTime / 1000).toFixed(1)}秒`);
      lines.push('');

      if (layer.results.length > 0) {
        lines.push('| 测试ID | 测试项 | 判定类型 | 结果 | 详情 |');
        lines.push('|--------|--------|----------|------|------|');

        for (const result of layer.results) {
          const status = result.passed ? 'PASS' : 'FAIL';
          const detail = result.issues.length > 0 ? result.issues[0] : '-';
          lines.push(`| ${result.testId} | ${result.testName} | ${result.judgmentType} | ${status} | ${detail} |`);
        }
        lines.push('');
      }

      // 失败详情
      const failedResults = layer.results.filter(r => !r.passed);
      if (failedResults.length > 0) {
        lines.push('#### 失败项详情');
        lines.push('');
        for (const result of failedResults) {
          lines.push(`**${result.testId}: ${result.testName}**`);
          lines.push('');
          if (result.issues.length > 0) {
            lines.push(`- 问题: ${result.issues.join(', ')}`);
          }
          lines.push('');
        }
      }
    }

    // AI反馈（如果有）
    if (results.aiFeedback) {
      lines.push('## AI反馈');
      lines.push('');
      lines.push('### 总结');
      lines.push(results.aiFeedback.summary);
      lines.push('');
      if (results.aiFeedback.strengths.length > 0) {
        lines.push('### 优点');
        lines.push('');
        for (const strength of results.aiFeedback.strengths) {
          lines.push(`- ${strength}`);
        }
        lines.push('');
      }
      if (results.aiFeedback.improvements.length > 0) {
        lines.push('### 改进建议');
        lines.push('');
        for (const improvement of results.aiFeedback.improvements) {
          lines.push(`- ${improvement}`);
        }
        lines.push('');
      }
    }

    // 结论
    lines.push('## 结论');
    lines.push('');
    if (results.overallPassed) {
      lines.push('**所有测试通过**，Phase 1.5 验收完成。');
    } else {
      lines.push(`**${results.summary.totalFailed} 项测试失败**，需要修复后再进行验收。`);
    }
    lines.push('');

    const filename = `phase1-5-report-${Date.now()}.md`;
    const filepath = path.join(this.outputDirectory, filename);
    fs.writeFileSync(filepath, lines.join('\n'));

    return filepath;
  }

  /**
   * 生成汇总报告
   * @param layerResults 各Layer测试结果
   * @returns 生成的汇总报告文件路径
   */
  generateSummaryReport(layerResults: LayerResult[]): string {
    const lines: string[] = [];

    const timestamp = new Date().toISOString();
    const totalExecutionTime = layerResults.reduce((sum, l) => sum + l.executionTime, 0);
    const totalTests = layerResults.reduce((sum, l) => sum + l.totalTests, 0);
    const totalPassed = layerResults.reduce((sum, l) => sum + l.passedTests, 0);
    const totalFailed = layerResults.reduce((sum, l) => sum + l.failedTests, 0);
    const overallPassRate = totalTests > 0 ? totalPassed / totalTests : 0;

    const scoredLayers = layerResults.filter(l => l.score !== undefined);
    const overallScore = scoredLayers.length > 0
      ? scoredLayers.reduce((sum, l) => sum + (l.score || 0), 0) / scoredLayers.length
      : undefined;

    const overallPassed = this.determineOverallPassed(layerResults);

    // 标题
    lines.push('# Phase 1.5 测试汇总报告');
    lines.push('');
    lines.push(`**执行时间**: ${timestamp}`);
    lines.push(`**总耗时**: ${(totalExecutionTime / 1000).toFixed(1)}秒`);
    lines.push(`**总体结果**: ${overallPassed ? 'PASS' : 'FAIL'}`);
    lines.push('');

    // 测试结果概览
    lines.push('## 测试结果概览');
    lines.push('');
    lines.push('| Layer | 通过率 | 通过/总数 | 状态 | 阻断原因 |');
    lines.push('|-------|--------|-----------|------|----------|');

    for (const layer of layerResults) {
      const statusIcon = this.getStatusIcon(layer.status);
      const passRateDisplay = layer.score !== undefined
        ? `${layer.score.toFixed(1)}/5`
        : `${(layer.passRate * 100).toFixed(0)}%`;
      const passCount = `${layer.passedTests}/${layer.totalTests}`;
      const blocking = layer.blockingReason || '-';
      lines.push(`| ${layer.layerName} | ${passRateDisplay} | ${passCount} | ${statusIcon} | ${blocking} |`);
    }
    lines.push('');

    // 总体统计
    lines.push('## 总体统计');
    lines.push('');
    lines.push('| 指标 | 数值 |');
    lines.push('|------|------|');
    lines.push(`| 总测试数 | ${totalTests} |`);
    lines.push(`| 通过数 | ${totalPassed} |`);
    lines.push(`| 失败数 | ${totalFailed} |`);
    if (overallScore !== undefined) {
      lines.push(`| 总体评分 | ${overallScore.toFixed(1)}/5 |`);
    } else {
      lines.push(`| 通过率 | ${(overallPassRate * 100).toFixed(1)}% |`);
    }
    lines.push('');

    // 阻断分析
    const blockedLayers = layerResults.filter(l => l.status === 'blocked' || l.status === 'failed');
    if (blockedLayers.length > 0) {
      lines.push('## 阻断分析');
      lines.push('');
      for (const layer of blockedLayers) {
        lines.push(`### ${layer.layerName}`);
        lines.push('');
        if (layer.blockingReason) {
          lines.push(`- **阻断原因**: ${layer.blockingReason}`);
        }
        const failedTests = layer.results.filter(r => !r.passed);
        if (failedTests.length > 0) {
          lines.push(`- **失败测试项**: ${failedTests.map(r => r.testId).join(', ')}`);
        }
        lines.push('');
      }
    }

    // 失败项汇总
    const allFailedTests = layerResults.flatMap(l => l.results.filter(r => !r.passed));
    if (allFailedTests.length > 0) {
      lines.push('## 失败项汇总');
      lines.push('');
      lines.push('| Layer | 测试ID | 测试项 | 问题 |');
      lines.push('|-------|--------|--------|------|');
      for (const result of allFailedTests) {
        const layer = layerResults.find(l => l.results.includes(result));
        const layerName = layer?.layerName || '-';
        const issue = result.issues.length > 0 ? result.issues[0] : '-';
        lines.push(`| ${layerName} | ${result.testId} | ${result.testName} | ${issue} |`);
      }
      lines.push('');
    }

    // 建议改进
    lines.push('## 建议改进');
    lines.push('');
    if (allFailedTests.length > 0) {
      const suggestions = this.generateSuggestions(allFailedTests);
      for (const suggestion of suggestions) {
        lines.push(`- ${suggestion}`);
      }
    } else {
      lines.push('- 无需要改进的项，所有测试已通过。');
    }
    lines.push('');

    // 结论
    lines.push('## 结论');
    lines.push('');
    if (overallPassed) {
      lines.push('**Phase 1.5 测试验收完成**。');
      lines.push('');
      lines.push('下一步：');
      lines.push('- 执行用户验收测试（Layer 5）');
      lines.push('- 收集用户反馈问卷');
      lines.push('- 根据反馈进行优化调整');
    } else {
      lines.push(`**Phase 1.5 测试未通过**，共 ${allFailedTests.length} 项失败。`);
      lines.push('');
      lines.push('下一步：');
      lines.push('- 分析失败项的根因');
      lines.push('- 补充必要的日志和截图');
      lines.push('- 修复问题后重新执行测试');
    }
    lines.push('');

    const filename = `summary-report-${Date.now()}.md`;
    const filepath = path.join(this.outputDirectory, filename);
    fs.writeFileSync(filepath, lines.join('\n'));

    return filepath;
  }

  /**
   * 获取状态图标
   */
  private getStatusIcon(status: 'passed' | 'failed' | 'blocked' | 'pending'): string {
    switch (status) {
      case 'passed':
        return 'PASS';
      case 'failed':
        return 'FAIL';
      case 'blocked':
        return 'BLOCKED';
      case 'pending':
        return 'PENDING';
      default:
        return '-';
    }
  }

  /**
   * 判断总体是否通过
   */
  private determineOverallPassed(layerResults: LayerResult[]): boolean {
    // Layer 1 (smoke) 必须100%通过
    const smokeLayer = layerResults.find(l => l.layer === 'smoke');
    if (smokeLayer && smokeLayer.passRate < 1) {
      return false;
    }

    // Layer 2 (functional) 必须>=90%通过
    const functionalLayer = layerResults.find(l => l.layer === 'functional');
    if (functionalLayer && functionalLayer.passRate < 0.9) {
      return false;
    }

    // Layer 3 (deep-validation) 评分>=3.5/5
    const deepLayer = layerResults.find(l => l.layer === 'deep-validation');
    if (deepLayer && deepLayer.score !== undefined && deepLayer.score < 3.5) {
      return false;
    }

    // 没有阻断的Layer
    const blockedLayers = layerResults.filter(l => l.status === 'blocked');
    if (blockedLayers.length > 0) {
      return false;
    }

    return true;
  }

  /**
   * 基于失败项生成建议
   */
  private generateSuggestions(failedTests: TestResult[]): string[] {
    const suggestions: string[] = [];

    const hardFailures = failedTests.filter(r => r.judgmentType === 'hard');
    const softFailures = failedTests.filter(r => r.judgmentType === 'soft');
    const visualFailures = failedTests.filter(r => r.judgmentType === 'visual');
    const thresholdFailures = failedTests.filter(r => r.judgmentType === 'threshold');

    if (hardFailures.length > 0) {
      suggestions.push(`有 ${hardFailures.length} 项硬性标准未通过，需要精确修复数值匹配问题`);
    }
    if (softFailures.length > 0) {
      suggestions.push(`有 ${softFailures.length} 项软性标准未通过，需要检查误差范围是否合理`);
    }
    if (visualFailures.length > 0) {
      suggestions.push(`有 ${visualFailures.length} 项视觉验证未通过，需要检查素材质量或调整AI判定阈值`);
    }
    if (thresholdFailures.length > 0) {
      suggestions.push(`有 ${thresholdFailures.length} 项阈值判定未通过，需要检查性能指标是否达标`);
    }

    const collisionFailures = failedTests.filter(r =>
      r.testId.includes('F-001') || r.testId.includes('F-002') || r.testId.includes('collision')
    );
    if (collisionFailures.length > 0) {
      suggestions.push('碰撞检测存在问题，建议检查可行走瓦片数据配置');
    }

    const doorFailures = failedTests.filter(r =>
      r.testId.includes('F-007') || r.testId.includes('F-008') || r.testId.includes('F-009') ||
      r.testName.includes('门')
    );
    if (doorFailures.length > 0) {
      suggestions.push('门交互存在问题，建议检查门坐标配置和场景切换逻辑');
    }

    const performanceFailures = failedTests.filter(r => r.layer === 'performance');
    if (performanceFailures.length > 0) {
      suggestions.push('性能指标未达标，建议优化背景图加载或减少渲染负载');
    }

    if (suggestions.length === 0) {
      suggestions.push('请分析具体失败项的详细信息进行针对性修复');
    }

    return suggestions;
  }

  /**
   * 添加AI反馈到JSON报告
   */
  addAiFeedback(jsonReportPath: string, summary: string, strengths: string[], improvements: string[]): void {
    const report: TestResults = JSON.parse(fs.readFileSync(jsonReportPath, 'utf-8'));
    report.aiFeedback = { summary, strengths, improvements };
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  }
}

// 默认实例
export const reportGenerator = new ReportGenerator();
