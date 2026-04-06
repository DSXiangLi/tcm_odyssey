// tests/visual/ai/glm-client.ts
/**
 * GLM API配置
 */
interface GLMConfig {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

/**
 * GLM响应
 */
export interface GLMResponse {
  content: string;
  processingTime: number;
  success: boolean;
  error?: string;
}

/**
 * 测试结果
 */
export interface TestResult {
  testCaseId: string;
  testCaseName: string;
  passed: boolean;
  category: string;
  judgmentType: string;
  confidence: number;
  issues: string[];
}

/**
 * GLM API客户端
 */
export class GLMClient {
  private config: GLMConfig;
  private enabled: boolean;

  constructor() {
    this.config = {
      baseUrl: process.env.GLM_API_BASE || 'https://ark.cn-beijing.volces.com/api/v3',
      apiKey: process.env.GLM_API_KEY || '',
      modelName: process.env.GLM_MODEL_NAME || 'glm-4'
    };
    this.enabled = this.config.apiKey.length > 0;
  }

  /**
   * 检查是否配置
   */
  isConfigured(): boolean {
    return this.enabled;
  }

  /**
   * 生成文本
   */
  async generate(prompt: string, context?: string): Promise<GLMResponse> {
    if (!this.enabled) {
      return {
        content: '',
        processingTime: 0,
        success: false,
        error: 'GLM API not configured'
      };
    }

    const startTime = Date.now();

    try {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.modelName,
          messages: [
            { role: 'user', content: fullPrompt }
          ],
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        return {
          content: '',
          processingTime: Date.now() - startTime,
          success: false,
          error: `API error: ${response.status}`
        };
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      return {
        content: data.choices?.[0]?.message?.content || '',
        processingTime: Date.now() - startTime,
        success: true
      };
    } catch (error) {
      return {
        content: '',
        processingTime: Date.now() - startTime,
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * 解读测试结果
   */
  async interpretTestResult(
    testCaseName: string,
    stateData: Record<string, unknown>,
    passed: boolean
  ): Promise<string> {
    const prompt = `测试用例 "${testCaseName}" ${passed ? '通过' : '失败'}。

状态数据：
${JSON.stringify(stateData, null, 2)}

请分析这个测试结果，给出简短的解读。`;

    const response = await this.generate(prompt);
    return response.success ? response.content : '无法解读测试结果';
  }

  /**
   * 生成测试报告
   */
  async generateReport(testResults: TestResult[]): Promise<string> {
    const prompt = `请根据以下测试结果生成一份测试报告：

${testResults.map(r => `- ${r.testCaseName}: ${r.passed ? '通过' : '失败'} (${r.judgmentType}, 置信度: ${r.confidence})`).join('\n')}

总结:
- 总测试数: ${testResults.length}
- 通过: ${testResults.filter(r => r.passed).length}
- 失败: ${testResults.filter(r => !r.passed).length}

请生成Markdown格式的测试报告摘要。`;

    const response = await this.generate(prompt);
    return response.success ? response.content : '无法生成报告';
  }

  /**
   * 提供改进建议
   */
  async suggestImprovements(failedTests: TestResult[]): Promise<string[]> {
    if (failedTests.length === 0) {
      return [];
    }

    const prompt = `以下测试失败，请提供具体的改进建议：

${failedTests.map(t => `- ${t.testCaseName}: ${t.issues.join(', ')}`).join('\n')}

请以数组形式返回具体的改进建议。`;

    const response = await this.generate(prompt);

    if (!response.success) {
      return ['无法生成改进建议'];
    }

    // 简单解析建议
    return response.content.split('\n').filter(line => line.trim().length > 0);
  }
}

export const glmClient = new GLMClient();