// tests/visual/phase1-5/utils/visual-analyzer.ts

/**
 * 瓦片位置（如果 walkable-verifier 未实现，使用本地定义）
 */
export interface TilePos {
  x: number;
  y: number;
}

/**
 * 背景图质量结果
 */
export interface QualityResult {
  isNormal: boolean;
  hasBlackScreen: boolean;
  hasCorruption: boolean;
  clarity: number;  // 1-5分
  confidence: number;
  message: string;
}

/**
 * 建筑识别结果
 */
export interface BuildingResult {
  buildingCount: number;
  buildings: Array<{
    position: string;  // 左上/右上/左下/右下/中间
    description: string;
  }>;
  styleConsistent: boolean;
  confidence: number;
  message: string;
}

/**
 * 门区域辨识结果
 */
export interface DoorResult {
  isClear: boolean;
  description: string;
  confidence: number;
  message: string;
}

/**
 * 氛围评分结果
 */
export interface AtmosphereScore {
  pastoralHealing: number;  // 田园治愈感 1-5
  tcmCulture: number;       // 中医文化感 1-5
  explorationGuide: number; // 探索引导感 1-5
  overallHarmony: number;   // 整体和谐度 1-5
  average: number;
  reasons: string[];
  suggestions: string[];
}

/**
 * AI视觉分析器
 * 使用QWEN VL多模态AI进行视觉质量分析
 */
export class VisualAnalyzer {
  private apiKey: string | null = null;
  private apiUrl: string | null = null;
  private modelName: string | null = null;

  constructor() {
    // 从环境变量获取QWEN VL API配置
    this.apiKey = process.env.QWEN_VL_KEY || null;
    this.apiUrl = process.env.QWEN_VL_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    this.modelName = process.env.QWEN_VL_MODEL_NAME || 'qwen-vl-max';
  }

  /**
   * 检查API是否可用
   */
  isApiAvailable(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0;
  }

  /**
   * 调用QWEN VL多模态AI分析图片
   */
  private async analyzeWithAI(imageBase64: string, prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('QWEN VL API key not configured. Please set QWEN_VL_KEY in .env');
    }

    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.modelName,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } }
            ]
          }
        ],
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`QWEN VL API error: ${response.status}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content || '';
  }

  /**
   * 分析背景图质量
   */
  async analyzeBackgroundQuality(imageBase64: string): Promise<QualityResult> {
    const prompt = `请分析这张游戏截图，回答以下问题：

1. 图片是否正常显示？（无黑屏、无破损、无异常色块）
2. 能否识别出游戏场景？（是/否，简述理由）
3. 图片清晰度如何？（1-5分）

请以JSON格式返回结果，格式如下：
{
  "isNormal": true/false,
  "hasBlackScreen": true/false,
  "hasCorruption": true/false,
  "clarity": 1-5,
  "message": "简短描述"
}`;

    try {
      const response = await this.analyzeWithAI(imageBase64, prompt);
      // 尝试解析JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          confidence: 0.85
        };
      }

      // 无法解析JSON时的默认值
      return {
        isNormal: true,
        hasBlackScreen: false,
        hasCorruption: false,
        clarity: 4,
        confidence: 0.5,
        message: 'AI响应无法解析为JSON，使用默认值'
      };
    } catch (error) {
      return {
        isNormal: false,
        hasBlackScreen: false,
        hasCorruption: false,
        clarity: 0,
        confidence: 0,
        message: `分析失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * 识别建筑区域
   */
  async identifyBuildings(imageBase64: string): Promise<BuildingResult> {
    const prompt = `请分析这张游戏截图，识别其中的建筑：

1. 能否看到建筑？有几个？
2. 建筑位置分别在图片的哪个区域？（左上/右上/左下/右下/中间）
3. 建筑风格是否与周围环境协调？

请以JSON格式返回结果，格式如下：
{
  "buildingCount": 数字,
  "buildings": [
    { "position": "位置描述", "description": "简短描述" }
  ],
  "styleConsistent": true/false,
  "message": "简短描述"
}`;

    try {
      const response = await this.analyzeWithAI(imageBase64, prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          confidence: 0.85
        };
      }

      return {
        buildingCount: 0,
        buildings: [],
        styleConsistent: false,
        confidence: 0.5,
        message: 'AI响应无法解析为JSON'
      };
    } catch (error) {
      return {
        buildingCount: 0,
        buildings: [],
        styleConsistent: false,
        confidence: 0,
        message: `分析失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * 分析门区域可辨识度
   */
  async analyzeDoorClarity(imageBase64: string, doorPos: TilePos): Promise<DoorResult> {
    const prompt = `请分析这张游戏截图中坐标(${doorPos.x}, ${doorPos.y})附近的区域：

这个位置应该是一个门入口。请判断：
1. 这个区域是否看起来像一个门/入口？
2. 门区域是否在视觉上清晰可辨认？
3. 玩家能否清楚地知道这里可以进入？

请以JSON格式返回结果，格式如下：
{
  "isClear": true/false,
  "description": "描述",
  "message": "简短描述"
}`;

    try {
      const response = await this.analyzeWithAI(imageBase64, prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          confidence: 0.85
        };
      }

      return {
        isClear: false,
        description: '无法解析AI响应',
        confidence: 0.5,
        message: 'AI响应无法解析为JSON'
      };
    } catch (error) {
      return {
        isClear: false,
        description: '',
        confidence: 0,
        message: `分析失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * 氛围评分
   */
  async rateAtmosphere(imageBase64: string): Promise<AtmosphereScore> {
    const prompt = `作为游戏视觉设计师，请为这张游戏截图评分（1-5分）：

1. 田园治愈感：画面是否传达温馨、放松的氛围？
2. 中医文化感：是否有中医元素、古朴风格？
3. 探索引导感：是否有引导玩家探索的视觉暗示？
4. 整体和谐度：所有元素是否协调统一？

请给出每项评分和简要理由，以及总体评价。

请以JSON格式返回结果，格式如下：
{
  "pastoralHealing": 1-5,
  "tcmCulture": 1-5,
  "explorationGuide": 1-5,
  "overallHarmony": 1-5,
  "reasons": ["理由1", "理由2"],
  "suggestions": ["建议1", "建议2"]
}`;

    try {
      const response = await this.analyzeWithAI(imageBase64, prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const average = (
          (parsed.pastoralHealing + parsed.tcmCulture +
           parsed.explorationGuide + parsed.overallHarmony) / 4
        );
        return {
          ...parsed,
          average
        };
      }

      // 默认值
      return {
        pastoralHealing: 3,
        tcmCulture: 3,
        explorationGuide: 3,
        overallHarmony: 3,
        average: 3,
        reasons: ['AI响应无法解析'],
        suggestions: []
      };
    } catch (error) {
      return {
        pastoralHealing: 0,
        tcmCulture: 0,
        explorationGuide: 0,
        overallHarmony: 0,
        average: 0,
        reasons: [`分析失败: ${error instanceof Error ? error.message : 'Unknown error'}`],
        suggestions: []
      };
    }
  }

  /**
   * 通用图像分析
   */
  async analyzeImage(imageBase64: string, prompt: string): Promise<string> {
    return await this.analyzeWithAI(imageBase64, prompt);
  }
}

// 导出默认实例
export const visualAnalyzer = new VisualAnalyzer();