// src/systems/HermesManager.ts
/**
 * Hermes服务管理器（浏览器端）
 * 负责：健康检查、状态管理、API调用
 *
 * 注意：实际的Hermes进程启动需要在Node.js环境中完成
 * （例如通过Vite dev server插件或手动启动）
 */

export interface HermesConfig {
  baseUrl: string;          // Hermes API地址
  port: number;             // API端口
  startupTimeout: number;   // 连接超时（秒）
}

export interface HermesStatus {
  available: boolean;
  port?: number;
  error?: string;
  lastCheck?: number;       // 上次检查时间戳
}

export class HermesManager {
  private config: HermesConfig;
  private status: HermesStatus = { available: false };
  private checkInterval: number | null = null;

  constructor(config: HermesConfig) {
    this.config = config;
  }

  /**
   * 检查Hermes服务是否可用
   */
  async checkAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.baseUrl}:${this.config.port}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.status.available = response.ok;
      this.status.port = this.config.port;
      this.status.lastCheck = Date.now();
      this.status.error = undefined;
      return response.ok;
    } catch (error) {
      this.status.available = false;
      this.status.error = error instanceof Error ? error.message : String(error);
      this.status.lastCheck = Date.now();
      return false;
    }
  }

  /**
   * 启动定期健康检查
   */
  startHealthCheck(intervalMs: number = 30000): void {
    if (this.checkInterval !== null) {
      this.stopHealthCheck();
    }

    // 立即检查一次
    this.checkAvailable();

    // 定期检查
    this.checkInterval = window.setInterval(() => {
      this.checkAvailable();
      this.exposeStatus();
    }, intervalMs);
  }

  /**
   * 停止定期健康检查
   */
  stopHealthCheck(): void {
    if (this.checkInterval !== null) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * 等待Hermes就绪（用于游戏启动）
   */
  async waitForReady(): Promise<HermesStatus> {
    console.log('[HermesManager] Waiting for Hermes to be ready...');

    const startTime = Date.now();
    const timeout = this.config.startupTimeout * 1000;

    while (Date.now() - startTime < timeout) {
      if (await this.checkAvailable()) {
        console.log('[HermesManager] Hermes is ready');
        this.exposeStatus();
        return this.status;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 超时
    this.status.error = 'Hermes connection timeout';
    console.warn('[HermesManager] Hermes not available:', this.status.error);
    this.exposeStatus();
    return this.status;
  }

  /**
   * 获取当前状态
   */
  getStatus(): HermesStatus {
    return { ...this.status };
  }

  /**
   * 更新状态并暴露到全局（供测试访问）
   */
  exposeStatus(): void {
    if (typeof window !== 'undefined') {
      (window as any).__HERMES_STATUS__ = this.getStatus();
    }
  }

  /**
   * 发送测试消息验证连接
   */
  async testConnection(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}:${this.config.port}/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npc_id: 'test',
          player_id: 'test_player',
          user_message: 'ping'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, message: data.response || 'Connection OK' };
      } else {
        return { success: false, message: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  /**
   * 销毁管理器（清理资源）
   */
  destroy(): void {
    this.stopHealthCheck();
    this.status = { available: false };
  }
}

/**
 * 默认配置
 */
export const DEFAULT_HERMES_CONFIG: HermesConfig = {
  baseUrl: 'http://localhost',
  port: 8642,
  startupTimeout: 30
};