// src/utils/sseClient.ts
/**
 * SSE流式输出客户端
 * 参考: hermes-agent gateway/stream_consumer.py
 */

export interface SSEOptions {
  url: string;
  body: object;
  onChunk: (text: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

export interface ChatRequest {
  npc_id: string;
  player_id: string;
  user_message: string;
}

export class SSEClient {
  private abortController: AbortController | null = null;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8642') {
    this.baseUrl = baseUrl;
  }

  /**
   * 发送聊天请求，流式接收响应
   */
  async chatStream(
    request: ChatRequest,
    onChunk: (text: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.baseUrl}/v1/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 解析SSE格式: "data: {text}\n\n"
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete(fullResponse);
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullResponse += parsed.text;
                onChunk(parsed.text);
              }
            } catch {
              // 非JSON格式，直接作为文本
              fullResponse += data;
              onChunk(data);
            }
          }
        }
      }

      onComplete(fullResponse);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 用户主动中断，不算错误
        const partialResponse = ''; // 可以保存部分响应
        onComplete(partialResponse);
      } else {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      this.abortController = null;
    }
  }

  /**
   * 发送非流式聊天请求
   */
  async chat(request: ChatRequest): Promise<{ response: string; tool_calls: unknown[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        response: data.response || '',
        tool_calls: data.tool_calls || []
      };
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * 停止生成
   */
  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * 检查是否正在生成
   */
  isGenerating(): boolean {
    return this.abortController !== null;
  }

  /**
   * 检查连接是否可用
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 获取当前baseUrl
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * 设置baseUrl（用于动态切换服务器）
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
}

/**
 * 创建默认的SSE客户端
 */
export function createSSEClient(baseUrl?: string): SSEClient {
  return new SSEClient(baseUrl || 'http://localhost:8642');
}