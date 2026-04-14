// tests/unit/hermes.spec.ts
/**
 * HermesManager和SSEClient单元测试
 *
 * 测试范围:
 * - HermesManager: 配置验证、状态管理、健康检查逻辑
 * - SSEClient: 连接管理、流式处理、请求构建
 *
 * 注意: 实际HTTP请求使用mock，不依赖真实Hermes服务
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { HermesManager, DEFAULT_HERMES_CONFIG, HermesConfig, HermesStatus } from '../../src/systems/HermesManager';
import { SSEClient, ChatRequest } from '../../src/utils/sseClient';

// Mock fetch for unit tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('HermesManager', () => {
  let manager: HermesManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new HermesManager(DEFAULT_HERMES_CONFIG);
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('配置验证', () => {
    test('默认配置应包含必要字段', () => {
      expect(DEFAULT_HERMES_CONFIG.baseUrl).toBe('http://localhost');
      expect(DEFAULT_HERMES_CONFIG.port).toBe(8642);
      expect(DEFAULT_HERMES_CONFIG.startupTimeout).toBeGreaterThan(0);
    });

    test('自定义配置应正确应用', () => {
      const customConfig: HermesConfig = {
        baseUrl: 'http://custom-host',
        port: 9999,
        startupTimeout: 60
      };
      const customManager = new HermesManager(customConfig);
      expect(customManager).toBeDefined();
      customManager.destroy();
    });
  });

  describe('状态管理', () => {
    test('初始状态应为不可用', () => {
      const status = manager.getStatus();
      expect(status.available).toBe(false);
    });

    test('exposeStatus应更新全局window对象', () => {
      manager.exposeStatus();
      const windowStatus = (window as any).__HERMES_STATUS__;
      expect(windowStatus).toBeDefined();
      expect(windowStatus.available).toBe(false);
    });
  });

  describe('健康检查逻辑', () => {
    test('checkAvailable在服务可用时应返回true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const result = await manager.checkAvailable();
      expect(result).toBe(true);

      const status = manager.getStatus();
      expect(status.available).toBe(true);
      expect(status.port).toBe(DEFAULT_HERMES_CONFIG.port);
      expect(status.error).toBeUndefined();
    });

    test('checkAvailable在服务不可用时应返回false', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await manager.checkAvailable();
      expect(result).toBe(false);

      const status = manager.getStatus();
      expect(status.available).toBe(false);
      expect(status.error).toBeDefined();
    });

    test('checkAvailable在HTTP错误时应返回false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await manager.checkAvailable();
      expect(result).toBe(false);

      const status = manager.getStatus();
      expect(status.available).toBe(false);
    });

    test('checkAvailable应记录lastCheck时间戳', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await manager.checkAvailable();
      const status = manager.getStatus();
      expect(status.lastCheck).toBeDefined();
      expect(status.lastCheck).toBeGreaterThan(0);
    });
  });

  describe('waitForReady逻辑', () => {
    test('waitForReady在连接成功时应返回可用状态', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const status = await manager.waitForReady();
      expect(status.available).toBe(true);
    });

    test('waitForReady在超时时应返回错误状态', async () => {
      // 创建一个超短超时的配置
      const quickTimeoutConfig: HermesConfig = {
        baseUrl: 'http://localhost',
        port: 8642,
        startupTimeout: 1 // 1秒超时
      };
      const quickManager = new HermesManager(quickTimeoutConfig);

      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const status = await quickManager.waitForReady();
      expect(status.available).toBe(false);
      expect(status.error).toBeDefined();

      quickManager.destroy();
    });
  });

  describe('testConnection逻辑', () => {
    test('testConnection在成功时应返回成功结果', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ response: 'Connection OK' })
      });

      const result = await manager.testConnection();
      expect(result.success).toBe(true);
    });

    test('testConnection在失败时应返回失败结果', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await manager.testConnection();
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('定期健康检查', () => {
    test('startHealthCheck应启动定期检查', () => {
      vi.useFakeTimers();

      mockFetch.mockResolvedValue({ ok: true });

      manager.startHealthCheck(1000);

      // 验证立即检查一次
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // 验证定时器设置
      vi.advanceTimersByTime(1000);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      manager.stopHealthCheck();
      vi.useRealTimers();
    });

    test('stopHealthCheck应停止定期检查', () => {
      vi.useFakeTimers();

      mockFetch.mockResolvedValue({ ok: true });

      manager.startHealthCheck(1000);
      manager.stopHealthCheck();

      vi.advanceTimersByTime(5000);
      expect(mockFetch).toHaveBeenCalledTimes(1); // 只有初始检查

      vi.useRealTimers();
    });
  });

  describe('资源清理', () => {
    test('destroy应清理所有资源', () => {
      vi.useFakeTimers();
      mockFetch.mockResolvedValue({ ok: true });

      manager.startHealthCheck(1000);
      manager.destroy();

      // 验证定时器已清理
      vi.advanceTimersByTime(5000);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // 验证状态已重置
      const status = manager.getStatus();
      expect(status.available).toBe(false);

      vi.useRealTimers();
    });
  });
});

describe('SSEClient', () => {
  let client: SSEClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new SSEClient('http://localhost:8642');
  });

  afterEach(() => {
    client.stop();
  });

  describe('配置验证', () => {
    test('默认baseUrl应为localhost:8642', () => {
      const defaultClient = new SSEClient();
      expect(defaultClient.getBaseUrl()).toBe('http://localhost:8642');
    });

    test('自定义baseUrl应正确应用', () => {
      expect(client.getBaseUrl()).toBe('http://localhost:8642');
    });

    test('setBaseUrl应更新baseUrl', () => {
      client.setBaseUrl('http://custom-host:9999');
      expect(client.getBaseUrl()).toBe('http://custom-host:9999');
    });
  });

  describe('连接检查', () => {
    test('checkConnection在服务可用时应返回true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const result = await client.checkConnection();
      expect(result).toBe(true);
    });

    test('checkConnection在服务不可用时应返回false', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.checkConnection();
      expect(result).toBe(false);
    });
  });

  describe('非流式聊天', () => {
    test('chat应正确构建请求并返回响应', async () => {
      const mockResponse = {
        response: '你好，我是青木先生',
        tool_calls: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const request: ChatRequest = {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '你好'
      };

      const result = await client.chat(request);
      expect(result.response).toBe('你好，我是青木先生');
      expect(result.tool_calls).toEqual([]);
    });

    test('chat在HTTP错误时应抛出异常', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const request: ChatRequest = {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '你好'
      };

      await expect(client.chat(request)).rejects.toThrow();
    });

    test('chat在网络错误时应抛出异常', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const request: ChatRequest = {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '你好'
      };

      await expect(client.chat(request)).rejects.toThrow('Network error');
    });
  });

  describe('流式聊天', () => {
    test('chatStream应正确处理SSE数据流', async () => {
      // Mock SSE response
      const mockSSEData = 'data: {"text":"你"}\n\ndata: {"text":"好"}\n\ndata: [DONE]\n\n';
      const mockReader = {
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(mockSSEData) })
          .mockResolvedValueOnce({ done: true, value: undefined })
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader
        }
      });

      const chunks: string[] = [];
      let fullResponse = '';

      const request: ChatRequest = {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '你好'
      };

      await client.chatStream(
        request,
        (text) => chunks.push(text),
        (response) => fullResponse = response,
        (error) => console.error(error)
      );

      expect(chunks).toEqual(['你', '好']);
      expect(fullResponse).toBe('你好');
    });

    test('chatStream在HTTP错误时应调用onError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const request: ChatRequest = {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '你好'
      };

      let errorThrown: Error | null = null;

      await client.chatStream(
        request,
        () => {},
        () => {},
        (error) => errorThrown = error
      );

      expect(errorThrown).toBeDefined();
      expect(errorThrown?.message).toContain('500');
    });

    test('chatStream应能被stop中断', async () => {
      // Mock a slow response
      const mockReader = {
        read: vi.fn()
          .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader
        }
      });

      const request: ChatRequest = {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '你好'
      };

      // Start streaming
      const streamPromise = client.chatStream(
        request,
        () => {},
        () => {},
        () => {}
      );

      // Immediately stop
      client.stop();

      // Should complete without error (AbortError is handled)
      await expect(streamPromise).resolves.toBeUndefined();
    });
  });

  describe('生成状态管理', () => {
    test('isGenerating在未生成时应返回false', () => {
      expect(client.isGenerating()).toBe(false);
    });

    test('isGenerating在生成中时应返回true', async () => {
      // Mock a slow response
      const mockReader = {
        read: vi.fn()
          .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ done: true }), 500)))
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: {
          getReader: () => mockReader
        }
      });

      const request: ChatRequest = {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '你好'
      };

      // Start streaming
      client.chatStream(request, () => {}, () => {}, () => {});

      // Wait a bit for the request to start
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(client.isGenerating()).toBe(true);

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 600));
      expect(client.isGenerating()).toBe(false);
    });

    test('stop后isGenerating应返回false', () => {
      client.stop();
      expect(client.isGenerating()).toBe(false);
    });
  });
});

describe('HermesManager + SSEClient 集成', () => {
  test('管理器和客户端应使用相同的baseUrl', () => {
    const manager = new HermesManager(DEFAULT_HERMES_CONFIG);
    const client = new SSEClient(`${DEFAULT_HERMES_CONFIG.baseUrl}:${DEFAULT_HERMES_CONFIG.port}`);

    expect(client.getBaseUrl()).toBe(`${DEFAULT_HERMES_CONFIG.baseUrl}:${DEFAULT_HERMES_CONFIG.port}`);

    manager.destroy();
  });

  test('当Hermes不可用时，SSEClient请求应失败', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'));

    const manager = new HermesManager(DEFAULT_HERMES_CONFIG);
    const available = await manager.checkAvailable();
    expect(available).toBe(false);

    const client = new SSEClient(`${DEFAULT_HERMES_CONFIG.baseUrl}:${DEFAULT_HERMES_CONFIG.port}`);
    await expect(client.checkConnection()).resolves.toBe(false);

    manager.destroy();
  });
});