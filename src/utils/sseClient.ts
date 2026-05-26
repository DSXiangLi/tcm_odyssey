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

/**
 * Tool call callback interface for handling NPC tool invocations
 * Now includes tid for matching tool_result
 */
export interface ToolCallCallback {
  (name: string, args: object, tid?: string): void;
}

/**
 * Tool result callback interface for handling tool execution results
 * Now includes tid for matching tool_call and snippet for preview
 */
export interface ToolResultCallback {
  (result: unknown, tid?: string, snippet?: string): void;
}

/**
 * Thinking callback interface for handling AI reasoning content
 */
export interface ThinkingCallback {
  (content: string): void;
}

/**
 * Extended chat request with optional context for scene-aware conversations
 */
export interface ChatRequest {
  npc_id: string;
  player_id: string;
  user_message: string;
  context?: {
    scene_id?: string;
    recent_history?: Array<{role: string; content: string}>;
  };
}

export class SSEClient {
  private abortController: AbortController | null = null;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8642') {
    this.baseUrl = baseUrl;
  }

  /**
   * 发送聊天请求，流式接收响应
   * @param request 聊天请求参数
   * @param onChunk 文本块回调
   * @param onComplete 完成回调
   * @param onError 错误回调
   * @param onToolCall 工具调用回调（可选）
   * @param onToolResult 工具结果回调（可选）
   * @param onThinking AI思考内容回调（可选）
   */
  async chatStream(
    request: ChatRequest,
    onChunk: (text: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void,
    onToolCall?: ToolCallCallback,
    onToolResult?: ToolResultCallback,
    onThinking?: ThinkingCallback
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

        // Debug: log raw lines being processed
        if (lines.length > 0) {
          console.log('[SSEClient] Processing lines:', lines.length, 'first line preview:', lines[0]?.slice(0, 80));
        }

        // 为了打字机效果，逐行处理并添加小delay
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // 添加小delay模拟打字机效果（每chunk 20-50ms）
          // 只在thinking/text事件时添加delay，其他事件立即处理
          if (i > 0 && lines.length > 1) {
            // 使用Promise.delay来异步等待
            await new Promise(resolve => setTimeout(resolve, 15));
          }
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete(fullResponse);
              return;
            }
            try {
              const parsed = JSON.parse(data);

              // Handle text chunks (legacy format: parsed.text)
              if (parsed.text) {
                fullResponse += parsed.text;
                onChunk(parsed.text);
              }

              // Handle text chunks (new format: parsed.type === 'text')
              if (parsed.type === 'text' && parsed.content) {
                fullResponse += parsed.content;
                onChunk(parsed.content);
              }

              // Debug log for ALL SSE events (including text/thinking for investigation)
              console.log('[SSEClient] Received event:', parsed.type, {
                ...(parsed.type === 'tool_call' ? { name: parsed.name, tid: parsed.tid, args: parsed.args } : {}),
                ...(parsed.type === 'tool_result' ? { tid: parsed.tid, snippet: parsed.snippet?.slice(0, 50) } : {}),
                ...(parsed.type === 'text' ? { content: parsed.content?.slice(0, 30) } : {}),
                ...(parsed.type === 'thinking' ? { content: parsed.content?.slice(0, 30) } : {}),
                ...(parsed.type === 'session_end' ? { session_id: parsed.session_id } : {}),
              });

              // NEW: Handle thinking/reasoning content
              if (parsed.type === 'thinking' && parsed.content && onThinking) {
                console.log('[SSEClient] Thinking chunk:', parsed.content.slice(0, 50));
                onThinking(parsed.content);
              }

              // NEW: Handle tool calls - pass tid for matching
              if (parsed.type === 'tool_call' && onToolCall) {
                console.log('[SSEClient] Invoking onToolCall:', parsed.name, parsed.tid, parsed.args);
                onToolCall(parsed.name, parsed.args || {}, parsed.tid);
              }

              // NEW: Handle tool results - pass tid and snippet for matching and preview
              if (parsed.type === 'tool_result' && onToolResult) {
                console.log('[SSEClient] Invoking onToolResult:', parsed.tid, parsed.snippet);
                onToolResult(parsed.result, parsed.tid, parsed.snippet);
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