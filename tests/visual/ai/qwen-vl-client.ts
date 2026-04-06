// tests/visual/ai/qwen-vl-client.ts
import fs from 'fs';
import path from 'path';

/**
 * QWEN VL API配置
 */
interface QwenVLConfig {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

/**
 * 图像分析响应
 */
export interface ImageAnalysisResponse {
  content: string;
  confidence: number;
  processingTime: number;
  success: boolean;
  error?: string;
}

/**
 * QWEN VL API客户端
 */
export class QwenVLClient {
  private config: QwenVLConfig;
  private enabled: boolean;

  constructor() {
    this.config = {
      baseUrl: process.env.QWEN_VL_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: process.env.QWEN_VL_KEY || '',
      modelName: process.env.QWEN_VL_MODEL_NAME || 'qwen-vl-max'
    };
    this.enabled = this.config.apiKey.length > 0;
  }

  /**
   * 将图片转换为base64
   */
  private imageToBase64(imagePath: string): string {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * 检查是否配置
   */
  isConfigured(): boolean {
    return this.enabled;
  }

  /**
   * 分析图像
   */
  async analyzeImage(imagePath: string, prompt: string): Promise<ImageAnalysisResponse> {
    if (!this.enabled) {
      return {
        content: '',
        confidence: 0,
        processingTime: 0,
        success: false,
        error: 'QWEN VL API not configured'
      };
    }

    const startTime = Date.now();

    try {
      const base64Image = this.imageToBase64(imagePath);

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.modelName,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: base64Image } }
              ]
            }
          ],
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        return {
          content: '',
          confidence: 0,
          processingTime: Date.now() - startTime,
          success: false,
          error: `API error: ${response.status}`
        };
      }

      const data = await response.json() as {
        id?: string;
        choices?: Array<{ message?: { content?: string } }>;
      };

      return {
        content: data.choices?.[0]?.message?.content || '',
        confidence: 0.85,
        processingTime: Date.now() - startTime,
        success: true
      };
    } catch (error) {
      return {
        content: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * 分析布局
   */
  async analyzeLayout(imagePath: string, expectedElements: string[]): Promise<ImageAnalysisResponse> {
    const prompt = `分析这个游戏截图的布局。请检查以下元素是否存在：
${expectedElements.map(e => `- ${e}`).join('\n')}

请以JSON格式返回分析结果，包含：
- elements: 数组，每个元素包含 name, visible, position
- overallLayout: 整体布局评价
- issues: 发现的问题列表`;

    return await this.analyzeImage(imagePath, prompt);
  }

  /**
   * 分析玩家位置
   */
  async analyzePlayerPosition(imagePath: string): Promise<ImageAnalysisResponse> {
    const prompt = `分析这个游戏截图中玩家的位置。请描述：
1. 玩家是否可见
2. 玩家在地图上的大致位置
3. 玩家是否在合理的位置

以JSON格式返回结果。`;

    return await this.analyzeImage(imagePath, prompt);
  }
}

export const qwenVLClient = new QwenVLClient();