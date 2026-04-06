// tests/visual/ai/report-generator.ts
import fs from 'fs';
import path from 'path';

/**
 * 测试结果
 */
export interface TestResult {
  testCaseId: string;
  testCaseName: string;
  category: string;
  passed: boolean;
  judgmentType: string;
  confidence: number;
  executionTime: number;
  issues: string[];
}

/**
 * 测试报告
 */
export interface TestReport {
  meta: {
    phase: string;
    timestamp: string;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    overallPassed: boolean;
  };
  results: TestResult[];
  summary: {
    byCategory: Record<string, { passed: number; failed: number }>;
    criticalFailures: string[];
  };
  aiFeedback?: {
    diagnosis: string;
    suggestions: string[];
  };
}

/**
 * 报告生成器
 */
export class ReportGenerator {
  private outputDirectory: string;

  constructor(outputDirectory: string = 'tests/visual/reports') {
    this.outputDirectory = outputDirectory;
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }
  }

  /**
   * 生成JSON报告
   */
  generateJsonReport(results: TestResult[], phase: string = 'Phase 1'): string {
    const report: TestReport = {
      meta: {
        phase,
        timestamp: new Date().toISOString(),
        totalTests: results.length,
        passedTests: results.filter(r => r.passed).length,
        failedTests: results.filter(r => !r.passed).length,
        overallPassed: results.every(r => r.passed)
      },
      results,
      summary: this.generateSummary(results)
    };

    const filename = `${phase.toLowerCase().replace(' ', '-')}-report-${Date.now()}.json`;
    const filepath = path.join(this.outputDirectory, filename);
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    return filepath;
  }

  /**
   * 生成Markdown报告
   */
  generateMarkdownReport(results: TestResult[], phase: string = 'Phase 1'): string {
    const lines: string[] = [];

    // 标题
    lines.push(`# ${phase} AI端到端测试报告`);
    lines.push('');
    lines.push(`**生成时间**: ${new Date().toISOString()}`);
    lines.push('');

    // 汇总
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    lines.push('## 测试汇总');
    lines.push('');
    lines.push('| 指标 | 数值 |');
    lines.push('|------|------|');
    lines.push(`| 总测试数 | ${total} |`);
    lines.push(`| 通过 | ${passed} |`);
    lines.push(`| 失败 | ${failed} |`);
    lines.push(`| 通过率 | ${((passed / total) * 100).toFixed(1)}% |`);
    lines.push('');

    // 按类别分组
    lines.push('## 分类结果');
    lines.push('');

    const categories = [...new Set(results.map(r => r.category))];
    for (const category of categories) {
      const categoryResults = results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.passed).length;

      lines.push(`### ${category}`);
      lines.push('');
      lines.push('| 测试用例 | 判定类型 | 置信度 | 结果 |');
      lines.push('|----------|----------|--------|------|');

      for (const result of categoryResults) {
        const status = result.passed ? '✅ 通过' : '❌ 失败';
        lines.push(`| ${result.testCaseName} | ${result.judgmentType} | ${(result.confidence * 100).toFixed(0)}% | ${status} |`);
      }
      lines.push('');
    }

    // 失败详情
    if (failed > 0) {
      lines.push('## 失败详情');
      lines.push('');

      for (const result of results.filter(r => !r.passed)) {
        lines.push(`### ${result.testCaseName}`);
        lines.push('');
        lines.push(`- **判定类型**: ${result.judgmentType}`);
        lines.push(`- **置信度**: ${(result.confidence * 100).toFixed(0)}%`);
        lines.push(`- **问题**: ${result.issues.join(', ')}`);
        lines.push('');
      }
    }

    // 结论
    lines.push('## 结论');
    lines.push('');
    if (failed === 0) {
      lines.push('✅ **所有测试通过**，Phase 1 验收完成。');
    } else {
      lines.push(`❌ **${failed} 项测试失败**，需要修复后再进行验收。`);
    }

    const filename = `${phase.toLowerCase().replace(' ', '-')}-report-${Date.now()}.md`;
    const filepath = path.join(this.outputDirectory, filename);
    fs.writeFileSync(filepath, lines.join('\n'));

    return filepath;
  }

  /**
   * 生成汇总数据
   */
  private generateSummary(results: TestResult[]): TestReport['summary'] {
    const byCategory: Record<string, { passed: number; failed: number }> = {};

    for (const result of results) {
      if (!byCategory[result.category]) {
        byCategory[result.category] = { passed: 0, failed: 0 };
      }
      if (result.passed) {
        byCategory[result.category].passed++;
      } else {
        byCategory[result.category].failed++;
      }
    }

    const criticalFailures = results
      .filter(r => !r.passed && r.judgmentType === 'hard')
      .map(r => r.testCaseName);

    return { byCategory, criticalFailures };
  }

  /**
   * 添加AI反馈
   */
  addAiFeedback(jsonReportPath: string, diagnosis: string, suggestions: string[]): void {
    const report: TestReport = JSON.parse(fs.readFileSync(jsonReportPath, 'utf-8'));
    report.aiFeedback = { diagnosis, suggestions };
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));
  }
}

export const reportGenerator = new ReportGenerator();