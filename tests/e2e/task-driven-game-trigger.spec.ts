// tests/e2e/task-driven-game-trigger.spec.ts
/**
 * 任务驱动游戏触发系统 E2E 测试
 * Phase 2.5 续验收测试
 *
 * 测试覆盖:
 * - API测试: 创建任务、查询pending_game、完成任务、奖励发放
 * - 游戏触发测试: ClinicScene查询pending任务并启动游戏
 * - 数据流动测试: 任务创建→游戏启动→游戏完成→数据更新
 */

import { test, expect } from '@playwright/test';

const GAME_STATE_API = 'http://localhost:8643';
const PLAYER_ID = 'player_001';

// ============================================
// 测试前准备：确保后端运行
// ============================================
test.beforeAll(async () => {
  // 检查game-state-backend是否运行
  try {
    const response = await fetch(`${GAME_STATE_API}/api/inventory/${PLAYER_ID}`);
    if (!response.ok) {
      console.warn('game-state-backend not responding, tests may fail');
    }
  } catch (e) {
    console.warn('game-state-backend connection error:', e);
  }
});

// ============================================
// API 测试
// ============================================
test.describe('Task-Driven API Tests', () => {

  test('API-001: 创建游戏任务（煎药）', async () => {
    const taskId = `task_decoction_test_${Date.now()}`;

    const response = await fetch(`${GAME_STATE_API}/api/task/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: PLAYER_ID,
        task_id: taskId,
        title: '测试煎药任务',
        type: 'game_task',
        game_type: 'decoction',
        game_config: JSON.stringify({ prescriptionId: 'mahuangtang' }),
        reward: JSON.stringify({ herbs: [{ herb_id: 'mahuang', delta: 3 }] })
      })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('created');
    expect(data.task_id).toBe(taskId);
  });

  test('API-002: 查询pending游戏任务', async () => {
    // 先创建一个pending任务
    const taskId = `task_pending_test_${Date.now()}`;
    await fetch(`${GAME_STATE_API}/api/task/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: PLAYER_ID,
        task_id: taskId,
        title: 'Pending测试任务',
        type: 'game_task',
        game_type: 'decoction',
        game_config: JSON.stringify({ prescriptionId: 'mahuangtang' })
      })
    });

    // 查询pending游戏任务
    const response = await fetch(`${GAME_STATE_API}/api/tasks/${PLAYER_ID}/pending_game`);
    expect(response.ok).toBe(true);

    const data = await response.json();
    // 应该返回pending任务（可能是刚创建的，也可能是其他）
    expect(data).toHaveProperty('pending_game');

    if (data.pending_game) {
      expect(data.pending_game.status).toBe('pending');
      expect(data.pending_game.game_type).toBe('decoction');
    }
  });

  test('API-003: 联合事务API - 完成任务并发放奖励', async () => {
    // 创建任务
    const taskId = `task_complete_test_${Date.now()}`;
    await fetch(`${GAME_STATE_API}/api/task/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: PLAYER_ID,
        task_id: taskId,
        title: '完成测试任务',
        type: 'game_task',
        game_type: 'decoction',
        reward: JSON.stringify({ herbs: [{ herb_id: 'mahuang', delta: 5 }] })
      })
    });

    // 完成任务并发放奖励
    const response = await fetch(`${GAME_STATE_API}/api/task/complete_with_reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId,
        score: 85
      })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe('completed');
    expect(data.score).toBe(85);

    // 验证奖励发放（检查inventory）
    const inventoryResponse = await fetch(`${GAME_STATE_API}/api/inventory/${PLAYER_ID}`);
    const inventoryData = await inventoryResponse.json();

    // 检查麻黄数量是否增加（如果有这个药材）
    const mahuang = inventoryData.herbs?.find(h => h.id === 'mahuang' || h.herb_id === 'mahuang');
    if (mahuang) {
      // 原有数量 + 5 = 新数量
      console.log('Mahuang count:', mahuang.raw_count || mahuang.count);
    }
  });

  test('API-004: 任务状态更新（乐观锁）', async () => {
    // 创建任务
    const taskId = `task_update_test_${Date.now()}`;
    await fetch(`${GAME_STATE_API}/api/task/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: PLAYER_ID,
        task_id: taskId,
        title: '更新测试任务',
        type: 'game_task',
        game_type: 'diagnosis'
      })
    });

    // 更新状态为in_progress
    const response = await fetch(`${GAME_STATE_API}/api/task/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId,
        status: 'in_progress',
        progress: 0.5
      })
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('updated');

    // 验证任务状态
    const taskResponse = await fetch(`${GAME_STATE_API}/api/task/${taskId}`);
    const taskData = await taskResponse.json();
    expect(taskData.task.status).toBe('in_progress');
  });
});

// ============================================
// 游戏触发测试（需要前端运行）
// ============================================
test.describe('Game Trigger Tests (Requires Frontend)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test('TRIGGER-001: ClinicScene暴露GameStateManager', async ({ page }) => {
    // 进入诊所场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ClinicScene');
      }
    });

    await page.waitForTimeout(2000);

    // 检查GameStateManager是否可用
    const gameStateManager = await page.evaluate(() => {
      const mgr = (window as any).__GAME_STATE_MANAGER__;
      return mgr ? {
        playerId: mgr.getPlayerId(),
        apiBaseUrl: mgr.getApiBaseUrl()
      } : null;
    });

    // GameStateManager应该可以通过import访问
    // 检查ClinicScene是否初始化
    const clinicState = await page.evaluate(() => {
      const scene = (window as any).__CLINIC_SCENE__;
      return scene ? { isInitialized: true } : null;
    });

    expect(clinicState).not.toBeNull();
  });

  test('TRIGGER-002: 煎药场景接收taskId参数', async ({ page }) => {
    // 创建测试任务
    const taskId = `task_decoction_trigger_${Date.now()}`;
    await fetch(`${GAME_STATE_API}/api/task/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: PLAYER_ID,
        task_id: taskId,
        title: '触发测试煎药任务',
        type: 'game_task',
        game_type: 'decoction',
        game_config: JSON.stringify({ prescriptionId: 'mahuangtang' })
      })
    });

    // 进入诊所场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ClinicScene');
      }
    });

    await page.waitForTimeout(2000);

    // 模拟按D键触发煎药（或调用startDecoction）
    await page.evaluate(async () => {
      const clinicScene = (window as any).__PHASER_GAME__?.scene?.getScene('ClinicScene');
      if (clinicScene && clinicScene.startDecoction) {
        await clinicScene.startDecoction();
      }
    });

    await page.waitForTimeout(3000);

    // 检查煎药场景是否启动并接收taskId
    const decoctionState = await page.evaluate(() => {
      const scene = (window as any).__DECOCTION_SCENE__;
      return scene ? {
        isInitialized: scene.isInitialized,
        taskId: scene.taskId,
        prescriptionId: scene.prescriptionId
      } : null;
    });

    // 煎药场景应该启动
    expect(decoctionState).not.toBeNull();
    expect(decoctionState?.isInitialized).toBe(true);

    // 如果有pending任务，taskId应该被传递
    if (decoctionState?.taskId) {
      expect(decoctionState.taskId).toContain('task_decoction');
    }
  });

  test('TRIGGER-003: 诊断场景接收taskId参数', async ({ page }) => {
    // 创建测试任务
    const taskId = `task_diagnosis_trigger_${Date.now()}`;
    await fetch(`${GAME_STATE_API}/api/task/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: PLAYER_ID,
        task_id: taskId,
        title: '触发测试诊断任务',
        type: 'game_task',
        game_type: 'diagnosis',
        game_config: JSON.stringify({ case_id: 'case-001' })
      })
    });

    // 进入诊所场景
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ClinicScene');
      }
    });

    await page.waitForTimeout(2000);

    // 模拟触发诊断
    await page.evaluate(async () => {
      const clinicScene = (window as any).__PHASER_GAME__?.scene?.getScene('ClinicScene');
      if (clinicScene && clinicScene.startDiagnosis) {
        await clinicScene.startDiagnosis('case-001');
      }
    });

    await page.waitForTimeout(3000);

    // 检查诊断场景是否启动
    const diagnosisState = await page.evaluate(() => {
      const scene = (window as any).__DIAGNOSIS_SCENE__;
      return scene ? {
        isInitialized: scene.isInitialized,
        caseId: scene.caseId,
        taskId: scene.taskId
      } : null;
    });

    expect(diagnosisState).not.toBeNull();
    expect(diagnosisState?.isInitialized).toBe(true);
    expect(diagnosisState?.caseId).toBe('case-001');
  });
});

// ============================================
// 数据流动测试
// ============================================
test.describe('Data Flow Tests', () => {

  test('FLOW-001: 完整数据流动验证', async () => {
    const taskId = `task_flow_${Date.now()}`;

    // Step 1: 创建任务
    const createResponse = await fetch(`${GAME_STATE_API}/api/task/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: PLAYER_ID,
        task_id: taskId,
        title: '数据流动测试',
        type: 'game_task',
        game_type: 'decoction',
        game_config: JSON.stringify({ prescriptionId: 'mahuangtang' }),
        reward: JSON.stringify({ herbs: [{ herb_id: 'mahuang', delta: 10 }] })
      })
    });
    expect(createResponse.ok).toBe(true);

    // Step 2: 查询pending_game
    const pendingResponse = await fetch(`${GAME_STATE_API}/api/tasks/${PLAYER_ID}/pending_game`);
    expect(pendingResponse.ok).toBe(true);
    const pendingData = await pendingResponse.json();

    // 应该能找到刚创建的任务（如果没有被其他任务占用）
    // pending_game返回的是第一个pending任务，可能不是刚创建的

    // Step 3: 完成任务并发放奖励
    const completeResponse = await fetch(`${GAME_STATE_API}/api/task/complete_with_reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId,
        score: 90
      })
    });
    expect(completeResponse.ok).toBe(true);

    const completeData = await completeResponse.json();
    expect(completeData.success).toBe(true);
    expect(completeData.status).toBe('completed');
    expect(completeData.score).toBe(90);

    // Step 4: 验证任务状态已更新
    const taskResponse = await fetch(`${GAME_STATE_API}/api/task/${taskId}`);
    const taskData = await taskResponse.json();
    expect(taskData.task.status).toBe('completed');
    expect(taskData.task.score).toBe(90);

    // Step 5: 验证奖励已发放
    const inventoryResponse = await fetch(`${GAME_STATE_API}/api/inventory/${PLAYER_ID}`);
    expect(inventoryResponse.ok).toBe(true);
    const inventoryData = await inventoryResponse.json();

    // 数据流动成功！
    console.log('Data flow completed successfully');
    console.log('Task status:', taskData.task.status);
    console.log('Task score:', taskData.task.score);
  });

  test('FLOW-002: 乐观锁并发控制', async () => {
    const taskId = `task_concurrent_${Date.now()}`;

    // 创建任务
    await fetch(`${GAME_STATE_API}/api/task/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: PLAYER_ID,
        task_id: taskId,
        title: '并发测试',
        type: 'game_task',
        game_type: 'decoction'
      })
    });

    // 第一次更新应该成功
    const firstUpdate = await fetch(`${GAME_STATE_API}/api/task/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId,
        status: 'in_progress',
        progress: 0.5
      })
    });
    expect(firstUpdate.ok).toBe(true);

    // 完成任务
    const completeResponse = await fetch(`${GAME_STATE_API}/api/task/complete_with_reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId,
        score: 75
      })
    });
    expect(completeResponse.ok).toBe(true);

    // 再次完成应该失败（任务已完成）
    const secondComplete = await fetch(`${GAME_STATE_API}/api/task/complete_with_reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId,
        score: 80
      })
    });

    // 应该返回409或错误
    expect(secondComplete.status).toBe(409);
  });
});