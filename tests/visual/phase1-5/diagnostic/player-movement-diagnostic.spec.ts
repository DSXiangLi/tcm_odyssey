// tests/visual/phase1-5/diagnostic/player-movement-diagnostic.spec.ts
/**
 * Phase 1.5 玩家移动诊断测试
 *
 * 诊断用户反馈的问题：
 * 1. "人物移动很奇怪，左右跳来跳去"
 * 2. "只走了几步就卡住了"
 *
 * 诊断维度：
 * - D-001: 玩家动画方向映射验证
 * - D-002: 碰撞检测系统异常检测
 * - D-003: 玩家位置跳跃检测
 * - D-004: 频繁停止事件检测
 * - D-005: 可行走区域边界问题
 * - D-006: enforceWalkablePosition频繁触发检测
 */

import { test, expect } from '@playwright/test';
import { GameLauncher } from '../../utils/game-launcher';
import { StateExtractor, PlayerState } from '../../utils/state-extractor';

const TILE_SIZE = 32;
const PLAYER_SPEED = 150; // 像素/秒
const EXPECTED_TILE_PER_SECOND = PLAYER_SPEED / TILE_SIZE; // 约4.7瓦片/秒

// 诊断报告数据结构
interface DiagnosticReport {
  testId: string;
  testName: string;
  issues: Array<{
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    evidence: string;
    suggestedFix: string;
  }>;
  rawData: Array<{
    time: number;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    tilePos: { x: number; y: number };
  }>;
  summary: string;
}

// 生成诊断报告
function generateReport(reports: DiagnosticReport[]): string {
  let output = '\n========================================\n';
  output += '       玩家移动诊断报告\n';
  output += '========================================\n\n';

  const allIssues = reports.flatMap(r => r.issues);
  const criticalCount = allIssues.filter(i => i.severity === 'CRITICAL').length;
  const highCount = allIssues.filter(i => i.severity === 'HIGH').length;
  const mediumCount = allIssues.filter(i => i.severity === 'MEDIUM').length;

  output += `问题统计: CRITICAL=${criticalCount}, HIGH=${highCount}, MEDIUM=${mediumCount}\n\n`;

  for (const report of reports) {
    output += `--- ${report.testId}: ${report.testName} ---\n`;
    output += `摘要: ${report.summary}\n`;

    if (report.issues.length > 0) {
      output += '发现的问题:\n';
      for (const issue of report.issues) {
        output += `  [${issue.severity}] ${issue.description}\n`;
        output += `    证据: ${issue.evidence}\n`;
        output += `    建议: ${issue.suggestedFix}\n`;
      }
    } else {
      output += '  无问题发现\n';
    }
    output += '\n';
  }

  output += '========================================\n';
  output += '       根因分析与修复建议\n';
  output += '========================================\n\n';

  // 根因分析
  if (criticalCount > 0 || highCount > 0) {
    output += '【根因分析】\n';

    // 检查是否有位置跳跃问题
    const jumpIssues = allIssues.filter(i => i.description.includes('跳跃') || i.description.includes('跳来跳去'));
    if (jumpIssues.length > 0) {
      output += '1. "左右跳来跳去"问题根因:\n';
      output += '   - enforceWalkablePosition()在每帧执行\n';
      output += '   - 玩家在可行走区域边界时被频繁推回\n';
      output += '   - canMoveInDirection()检测不够精确\n';
      output += '   建议:\n';
      output += '   - 调整enforceWalkablePosition的触发阈值\n';
      output += '   - 改进边界检测逻辑\n';
      output += '   - 添加平滑过渡而非硬性推回\n\n';
    }

    // 检查是否有卡住问题
    const stuckIssues = allIssues.filter(i => i.description.includes('卡住') || i.description.includes('无法继续'));
    if (stuckIssues.length > 0) {
      output += '2. "只走了几步就卡住"问题根因:\n';
      output += '   - 碰撞检测过于严格\n';
      output += '   - 出生点周围可行走区域狭窄\n';
      output += '   - canMoveInDirection检查距离设置不当\n';
      output += '   建议:\n';
      output += '   - 扩大出生点周围的可行走区域\n';
      output += '   - 调整checkDistance参数\n';
      output += '   - 添加更宽松的滑墙逻辑\n\n';
    }
  } else {
    output += '未发现严重问题，玩家移动功能正常\n';
  }

  return output;
}

test.describe('Phase 1.5 玩家移动诊断测试', () => {
  test.setTimeout(120000);

  const reports: DiagnosticReport[] = [];

  /**
   * D-001: 玩家动画方向映射验证
   * 验证按下左键时播放正确的"向左"动画，右键同理
   */
  test('D-001: 玩家动画方向映射验证', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const initialState = await stateExtractor.getPlayerState(page);
    expect(initialState).not.toBeNull();

    const report: DiagnosticReport = {
      testId: 'D-001',
      testName: '玩家动画方向映射验证',
      issues: [],
      rawData: [],
      summary: ''
    };

    if (!initialState) {
      report.summary = '无法获取初始状态';
      reports.push(report);
      return;
    }

    // 测试左方向移动
    console.log('\n--- 测试左方向移动 ---');
    const beforeLeft = await stateExtractor.getPlayerState(page);
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(500);
    const afterLeft = await stateExtractor.getPlayerState(page);
    await page.keyboard.up('ArrowLeft');
    await page.waitForTimeout(200);

    if (afterLeft && beforeLeft) {
      const deltaX = beforeLeft.x - afterLeft.x; // 左移动应该是正值
      console.log(`左移动: deltaX=${deltaX.toFixed(1)}, velocity.x=${afterLeft.velocity.x}`);

      report.rawData.push({
        time: 500,
        position: { x: afterLeft.x, y: afterLeft.y },
        velocity: { x: afterLeft.velocity.x, y: afterLeft.velocity.y },
        tilePos: { x: afterLeft.tileX, y: afterLeft.tileY }
      });

      // 检查是否向左移动（velocity.x应该是负值）
      if (afterLeft.velocity.x > 0) {
        report.issues.push({
          severity: 'HIGH',
          description: '按下左键时velocity.x为正值，动画方向可能错误',
          evidence: `velocity.x=${afterLeft.velocity.x} > 0`,
          suggestedFix: '检查Player.ts中move()方法的velocity计算逻辑'
        });
      }
    }

    // 测试右方向移动
    console.log('\n--- 测试右方向移动 ---');
    const beforeRight = await stateExtractor.getPlayerState(page);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(500);
    const afterRight = await stateExtractor.getPlayerState(page);
    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(200);

    if (afterRight && beforeRight) {
      const deltaX = afterRight.x - beforeRight.x; // 右移动应该是正值
      console.log(`右移动: deltaX=${deltaX.toFixed(1)}, velocity.x=${afterRight.velocity.x}`);

      report.rawData.push({
        time: 1000,
        position: { x: afterRight.x, y: afterRight.y },
        velocity: { x: afterRight.velocity.x, y: afterRight.velocity.y },
        tilePos: { x: afterRight.tileX, y: afterRight.tileY }
      });

      // 检查是否向右移动（velocity.x应该是正值）
      if (afterRight.velocity.x < 0) {
        report.issues.push({
          severity: 'HIGH',
          description: '按下右键时velocity.x为负值，动画方向可能错误',
          evidence: `velocity.x=${afterRight.velocity.x} < 0`,
          suggestedFix: '检查Player.ts中move()方法的velocity计算逻辑'
        });
      }
    }

    // 测试上方向移动
    console.log('\n--- 测试上方向移动 ---');
    const beforeUp = await stateExtractor.getPlayerState(page);
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(500);
    const afterUp = await stateExtractor.getPlayerState(page);
    await page.keyboard.up('ArrowUp');
    await page.waitForTimeout(200);

    if (afterUp && beforeUp) {
      const deltaY = beforeUp.y - afterUp.y; // 上移动应该是正值（Y减少）
      console.log(`上移动: deltaY=${deltaY.toFixed(1)}, velocity.y=${afterUp.velocity.y}`);

      report.rawData.push({
        time: 1500,
        position: { x: afterUp.x, y: afterUp.y },
        velocity: { x: afterUp.velocity.x, y: afterUp.velocity.y },
        tilePos: { x: afterUp.tileX, y: afterUp.tileY }
      });
    }

    // 测试下方向移动
    console.log('\n--- 测试下方向移动 ---');
    const beforeDown = await stateExtractor.getPlayerState(page);
    await page.keyboard.down('ArrowDown');
    await page.waitForTimeout(500);
    const afterDown = await stateExtractor.getPlayerState(page);
    await page.keyboard.up('ArrowDown');
    await page.waitForTimeout(200);

    if (afterDown && beforeDown) {
      const deltaY = afterDown.y - beforeDown.y; // 下移动应该是正值（Y增加）
      console.log(`下移动: deltaY=${deltaY.toFixed(1)}, velocity.y=${afterDown.velocity.y}`);

      report.rawData.push({
        time: 2000,
        position: { x: afterDown.x, y: afterDown.y },
        velocity: { x: afterDown.velocity.x, y: afterDown.velocity.y },
        tilePos: { x: afterDown.tileX, y: afterDown.tileY }
      });
    }

    report.summary = report.issues.length > 0
      ? `发现${report.issues.length}个动画方向问题`
      : '动画方向映射正确';

    console.log(`\nD-001总结: ${report.summary}`);
    reports.push(report);
  });

  /**
   * D-002: 碰撞检测系统异常检测
   * 检测玩家是否被错误地推回原位
   */
  test('D-002: 碰撞检测系统异常检测', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const report: DiagnosticReport = {
      testId: 'D-002',
      testName: '碰撞检测系统异常检测',
      issues: [],
      rawData: [],
      summary: ''
    };

    // 持续向右移动5秒，记录位置变化
    console.log('\n--- 持续向右移动5秒 ---');
    const positions: Array<{ time: number; x: number; y: number; tileX: number; tileY: number }> = [];

    const initialState = await stateExtractor.getPlayerState(page);
    expect(initialState).not.toBeNull();

    if (!initialState) {
      report.summary = '无法获取初始状态';
      reports.push(report);
      return;
    }

    positions.push({
      time: 0,
      x: initialState.x,
      y: initialState.y,
      tileX: initialState.tileX,
      tileY: initialState.tileY
    });

    await page.keyboard.down('ArrowRight');

    for (let i = 0; i < 50; i++) { // 5秒，每100ms采样
      await page.waitForTimeout(100);
      const state = await stateExtractor.getPlayerState(page);
      if (state) {
        positions.push({
          time: (i + 1) * 100,
          x: state.x,
          y: state.y,
          tileX: state.tileX,
          tileY: state.tileY
        });

        report.rawData.push({
          time: (i + 1) * 100,
          position: { x: state.x, y: state.y },
          velocity: { x: state.velocity.x, y: state.velocity.y },
          tilePos: { x: state.tileX, y: state.tileY }
        });
      }
    }

    await page.keyboard.up('ArrowRight');

    // 分析位置变化
    console.log('\n位置变化轨迹:');
    let reversalCount = 0; // 位置回退次数
    let stuckCount = 0; // 卡住次数（连续无移动）
    let jumpCount = 0; // 异常跳跃次数

    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      const deltaX = curr.x - prev.x;

      // 检测位置回退（向右移动时突然向左跳）
      if (deltaX < -10) { // 10像素以上的回退
        reversalCount++;
        console.log(`  [回退] ${curr.time}ms: x从${prev.x.toFixed(1)}跳到${curr.x.toFixed(1)}, delta=${deltaX.toFixed(1)}`);
      }

      // 检测卡住（连续2次无移动）
      if (i >= 2 && deltaX === 0 && positions[i - 1].x - positions[i - 2].x === 0) {
        stuckCount++;
      }

      // 检测异常跳跃（超过正常速度的移动）
      // 正常速度150像素/秒，100ms应该移动15像素，超过30像素为异常
      if (Math.abs(deltaX) > 30) {
        jumpCount++;
        console.log(`  [跳跃] ${curr.time}ms: x变化${deltaX.toFixed(1)}px超过正常范围`);
      }
    }

    // 添加问题到报告
    if (reversalCount > 5) {
      report.issues.push({
        severity: 'CRITICAL',
        description: '频繁的位置回退，导致"左右跳来跳去"',
        evidence: `${reversalCount}次回退事件（向右移动时突然向左跳超过10像素）`,
        suggestedFix: 'enforceWalkablePosition()推回逻辑过于激进，建议调整阈值或改为平滑过渡'
      });
    } else if (reversalCount > 0) {
      report.issues.push({
        severity: 'HIGH',
        description: '偶发的位置回退',
        evidence: `${reversalCount}次回退事件`,
        suggestedFix: '检查边界碰撞检测逻辑'
      });
    }

    if (stuckCount > 10) {
      report.issues.push({
        severity: 'CRITICAL',
        description: '频繁卡住，导致"只走了几步就卡住"',
        evidence: `${stuckCount}次连续无移动事件`,
        suggestedFix: '碰撞检测过于严格或可行走区域不足'
      });
    } else if (stuckCount > 3) {
      report.issues.push({
        severity: 'HIGH',
        description: '偶发卡住',
        evidence: `${stuckCount}次连续无移动事件`,
        suggestedFix: '检查canMoveInDirection()检测逻辑'
      });
    }

    if (jumpCount > 0) {
      report.issues.push({
        severity: 'MEDIUM',
        description: '异常跳跃（帧率不稳定可能导致）',
        evidence: `${jumpCount}次异常跳跃`,
        suggestedFix: '检查帧率稳定性或添加帧率补偿'
      });
    }

    // 计算总移动距离
    const totalMovement = positions[positions.length - 1].x - positions[0].x;
    console.log(`\n总移动距离: ${totalMovement.toFixed(1)}px`);
    console.log(`回退次数: ${reversalCount}`);
    console.log(`卡住次数: ${stuckCount}`);
    console.log(`跳跃次数: ${jumpCount}`);

    report.summary = `总移动${totalMovement.toFixed(1)}px, 回退${reversalCount}次, 卡住${stuckCount}次, 跳跃${jumpCount}次`;
    console.log(`\nD-002总结: ${report.summary}`);
    reports.push(report);
  });

  /**
   * D-003: 玩家位置跳跃检测（四方向）
   * 向四个方向分别移动，检测是否有异常跳跃
   */
  test('D-003: 玩家位置跳跃检测（四方向）', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const report: DiagnosticReport = {
      testId: 'D-003',
      testName: '玩家位置跳跃检测（四方向）',
      issues: [],
      rawData: [],
      summary: ''
    };

    const directions = [
      { name: '右', key: 'ArrowRight', axis: 'x', sign: 1 },
      { name: '左', key: 'ArrowLeft', axis: 'x', sign: -1 },
      { name: '下', key: 'ArrowDown', axis: 'y', sign: 1 },
      { name: '上', key: 'ArrowUp', axis: 'y', sign: -1 }
    ];

    const results: Array<{ direction: string; issues: string[] }> = [];

    for (const dir of directions) {
      console.log(`\n--- 测试${dir.name}方向移动 ---`);

      const positions: Array<{ time: number; x: number; y: number }> = [];
      const initialState = await stateExtractor.getPlayerState(page);

      if (!initialState) continue;

      positions.push({ time: 0, x: initialState.x, y: initialState.y });

      await page.keyboard.down(dir.key);
      for (let i = 0; i < 20; i++) {
        await page.waitForTimeout(100);
        const state = await stateExtractor.getPlayerState(page);
        if (state) {
          positions.push({ time: (i + 1) * 100, x: state.x, y: state.y });
        }
      }
      await page.keyboard.up(dir.key);
      await page.waitForTimeout(300);

      // 分析该方向的移动
      const dirIssues: string[] = [];
      let reversalCount = 0;
      let stuckCount = 0;

      for (let i = 1; i < positions.length; i++) {
        const prev = positions[i - 1];
        const curr = positions[i];
        const delta = dir.axis === 'x' ? curr.x - prev.x : curr.y - prev.y;

        // 检测方向回退
        if (delta * dir.sign < -10) {
          reversalCount++;
          dirIssues.push(`${curr.time}ms回退${delta.toFixed(1)}px`);
        }

        // 检测卡住
        if (delta === 0 && i >= 2) {
          stuckCount++;
        }
      }

      const totalMovement = dir.axis === 'x'
        ? positions[positions.length - 1].x - positions[0].x
        : positions[positions.length - 1].y - positions[0].y;

      console.log(`${dir.name}方向: 总移动${totalMovement.toFixed(1)}px, 回退${reversalCount}次, 卡住${stuckCount}次`);

      if (reversalCount > 3) {
        report.issues.push({
          severity: 'HIGH',
          description: `${dir.name}方向频繁回退`,
          evidence: `${reversalCount}次回退: ${dirIssues.slice(0, 5).join(', ')}`,
          suggestedFix: `检查${dir.name}方向的碰撞检测逻辑`
        });
      }

      if (stuckCount > 5) {
        report.issues.push({
          severity: 'HIGH',
          description: `${dir.name}方向频繁卡住`,
          evidence: `${stuckCount}次连续无移动`,
          suggestedFix: `检查${dir.name}方向的可行走区域`
        });
      }

      results.push({ direction: dir.name, issues: dirIssues });
    }

    report.summary = report.issues.length > 0
      ? `发现${report.issues.length}个方向移动问题`
      : '四方向移动正常';

    console.log(`\nD-003总结: ${report.summary}`);
    reports.push(report);
  });

  /**
   * D-004: 频繁停止事件检测
   * 检测PLAYER_STOP事件是否频繁触发
   */
  test('D-004: 频繁停止事件检测', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const report: DiagnosticReport = {
      testId: 'D-004',
      testName: '频繁停止事件检测',
      issues: [],
      rawData: [],
      summary: ''
    };

    // 获取事件历史（通过EventBus）
    const eventHistory = await page.evaluate(() => {
      // EventBus暴露在window.__EVENT_BUS__或通过GameStateBridge
      const bus = (window as any).__EVENT_BUS__;
      if (bus && bus.getEventHistory) {
        return bus.getEventHistory('player:stop');
      }
      return [];
    });

    console.log('\nEventBus PLAYER_STOP事件历史:');
    console.log(JSON.stringify(eventHistory, null, 2));

    // 由于EventBus可能不直接暴露，我们通过velocity检测停止
    console.log('\n--- 通过velocity检测停止 ---');
    const velocitySamples: Array<{ time: number; velocity: { x: number; y: number }; isMoving: boolean }> = [];

    const initialState = await stateExtractor.getPlayerState(page);
    expect(initialState).not.toBeNull();

    if (!initialState) {
      report.summary = '无法获取初始状态';
      reports.push(report);
      return;
    }

    await page.keyboard.down('ArrowRight');

    for (let i = 0; i < 50; i++) {
      await page.waitForTimeout(100);
      const state = await stateExtractor.getPlayerState(page);
      if (state) {
        const isMoving = Math.abs(state.velocity.x) > 0 || Math.abs(state.velocity.y) > 0;
        velocitySamples.push({
          time: (i + 1) * 100,
          velocity: { x: state.velocity.x, y: state.velocity.y },
          isMoving
        });

        report.rawData.push({
          time: (i + 1) * 100,
          position: { x: state.x, y: state.y },
          velocity: { x: state.velocity.x, y: state.velocity.y },
          tilePos: { x: state.tileX, y: state.tileY }
        });
      }
    }

    await page.keyboard.up('ArrowRight');

    // 检测频繁停止（按住右键期间velocity突然变为0）
    let frequentStopCount = 0;
    let lastMoving = true;

    for (let i = 0; i < velocitySamples.length; i++) {
      const sample = velocitySamples[i];

      // 如果之前在移动，突然停止，然后又移动，说明有频繁停止问题
      if (i > 0) {
        const prev = velocitySamples[i - 1];
        if (prev.isMoving && !sample.isMoving) {
          frequentStopCount++;
          console.log(`  [停止] ${sample.time}ms: velocity变为0`);
        }
      }
    }

    console.log(`\n频繁停止次数: ${frequentStopCount}`);

    if (frequentStopCount > 10) {
      report.issues.push({
        severity: 'CRITICAL',
        description: '按住方向键期间频繁停止，导致"左右跳来跳去"',
        evidence: `${frequentStopCount}次velocity突然变为0`,
        suggestedFix: 'enforceWalkablePosition()或canMoveInDirection()导致频繁调用stop()'
      });
    } else if (frequentStopCount > 3) {
      report.issues.push({
        severity: 'HIGH',
        description: '偶发频繁停止',
        evidence: `${frequentStopCount}次velocity突然变为0`,
        suggestedFix: '检查碰撞检测逻辑'
      });
    }

    report.summary = `检测到${frequentStopCount}次频繁停止事件`;
    console.log(`\nD-004总结: ${report.summary}`);
    reports.push(report);
  });

  /**
   * D-005: 可行走区域边界问题
   * 检查出生点周围的可行走瓦片数量
   */
  test('D-005: 可行走区域边界问题', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const report: DiagnosticReport = {
      testId: 'D-005',
      testName: '可行走区域边界问题',
      issues: [],
      rawData: [],
      summary: ''
    };

    // 获取地图配置
    const mapConfig = await page.evaluate(() => {
      return (window as any).__MAP_CONFIG__;
    });

    console.log('\n地图配置:');
    console.log(`  尺寸: ${mapConfig?.width}x${mapConfig?.height}`);
    console.log(`  可行走瓦片数: ${mapConfig?.walkableTiles?.size}`);

    // 检查出生点周围的可行走情况
    const spawnPoint = { x: 47, y: 24 };
    console.log(`\n出生点: (${spawnPoint.x}, ${spawnPoint.y})`);

    // 检查出生点本身是否可行走
    const spawnKey = `${spawnPoint.x},${spawnPoint.y}`;
    const spawnWalkable = mapConfig?.walkableTiles?.has(spawnKey);
    console.log(`  出生点可行走: ${spawnWalkable}`);

    if (!spawnWalkable) {
      report.issues.push({
        severity: 'CRITICAL',
        description: '出生点不在可行走区域',
        evidence: `出生点(${spawnPoint.x},${spawnPoint.y})不在walkableTiles集合中`,
        suggestedFix: '更新town-walkable-data.ts，添加出生点坐标'
      });
    }

    // 检查出生点周围8个方向的可行走情况
    const directions = [
      { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 0 },                  { dx: 1, dy: 0 },
      { dx: -1, dy: 1 },  { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
    ];

    let walkableAround = 0;
    console.log('\n出生点周围可行走检查:');
    for (const dir of directions) {
      const checkX = spawnPoint.x + dir.dx;
      const checkY = spawnPoint.y + dir.dy;
      const key = `${checkX},${checkY}`;
      const walkable = mapConfig?.walkableTiles?.has(key);
      console.log(`  (${checkX},${checkY}): ${walkable ? '可行走' : '不可行走'}`);
      if (walkable) walkableAround++;
    }

    console.log(`\n出生点周围可行走瓦片数: ${walkableAround}`);

    if (walkableAround < 4) {
      report.issues.push({
        severity: 'HIGH',
        description: '出生点周围可行走区域狭窄，可能导致卡住',
        evidence: `只有${walkableAround}个可行走瓦片`,
        suggestedFix: '扩大出生点周围的可行走区域'
      });
    }

    // 检查玩家当前位置
    const currentState = await stateExtractor.getPlayerState(page);
    if (currentState) {
      const currentKey = `${currentState.tileX},${currentState.tileY}`;
      const currentWalkable = mapConfig?.walkableTiles?.has(currentKey);
      console.log(`\n玩家当前位置: (${currentState.tileX}, ${currentState.tileY})`);
      console.log(`  当前位置可行走: ${currentWalkable}`);

      if (!currentWalkable) {
        report.issues.push({
          severity: 'CRITICAL',
          description: '玩家当前位置不在可行走区域',
          evidence: `玩家位置(${currentState.tileX},${currentState.tileY})不可行走`,
          suggestedFix: 'enforceWalkablePosition()应该已将玩家推回，检查该逻辑是否正常工作'
        });
      }
    }

    report.summary = `出生点周围${walkableAround}个可行走瓦片`;
    console.log(`\nD-005总结: ${report.summary}`);
    reports.push(report);
  });

  /**
   * D-006: enforceWalkablePosition频繁触发检测
   * 通过碰撞事件检测推回逻辑是否过于激进
   */
  test('D-006: enforceWalkablePosition频繁触发检测', async ({ page }) => {
    const launcher = new GameLauncher(page);
    const stateExtractor = new StateExtractor();

    await launcher.navigateToGame();
    await launcher.waitForGameReady();
    await launcher.clickStartButton();
    await page.waitForTimeout(2000);

    const report: DiagnosticReport = {
      testId: 'D-006',
      testName: 'enforceWalkablePosition频繁触发检测',
      issues: [],
      rawData: [],
      summary: ''
    };

    // 获取碰撞事件历史
    const collisionHistory = await page.evaluate(() => {
      const bus = (window as any).__EVENT_BUS__;
      if (bus && bus.getEventHistory) {
        return bus.getEventHistory('player:collide');
      }
      return [];
    });

    console.log('\n碰撞事件历史:');
    console.log(JSON.stringify(collisionHistory, null, 2));

    // 检查unwalkable_correction事件数量
    const correctionEvents = collisionHistory.filter(
      (e: any) => e.data?.collisionWith === 'unwalkable_correction'
    );

    console.log(`\n位置修正事件数: ${correctionEvents.length}`);

    // 如果无法获取EventBus，通过位置变化检测
    console.log('\n--- 通过位置变化检测推回 ---');
    const positions: Array<{ time: number; x: number; y: number }> = [];

    const initialState = await stateExtractor.getPlayerState(page);
    expect(initialState).not.toBeNull();

    if (!initialState) {
      report.summary = '无法获取初始状态';
      reports.push(report);
      return;
    }

    // 模拟用户行为：随机移动10秒
    const movements = [
      { key: 'ArrowRight', duration: 2000 },
      { key: 'ArrowLeft', duration: 1500 },
      { key: 'ArrowDown', duration: 2000 },
      { key: 'ArrowUp', duration: 1500 },
      { key: 'ArrowRight', duration: 1500 },
      { key: 'ArrowLeft', duration: 1000 }
    ];

    let totalTime = 0;
    for (const move of movements) {
      await page.keyboard.down(move.key);
      const startPos = await stateExtractor.getPlayerState(page);

      for (let i = 0; i < move.duration / 100; i++) {
        await page.waitForTimeout(100);
        totalTime += 100;
        const state = await stateExtractor.getPlayerState(page);
        if (state) {
          positions.push({ time: totalTime, x: state.x, y: state.y });

          report.rawData.push({
            time: totalTime,
            position: { x: state.x, y: state.y },
            velocity: { x: state.velocity.x, y: state.velocity.y },
            tilePos: { x: state.tileX, y: state.tileY }
          });
        }
      }

      await page.keyboard.up(move.key);
      await page.waitForTimeout(200);
    }

    // 分析位置变化，检测推回模式
    let pushBackCount = 0;
    for (let i = 2; i < positions.length; i++) {
      const prev2 = positions[i - 2];
      const prev1 = positions[i - 1];
      const curr = positions[i];

      // 推回模式：位置移动了一段距离，然后突然回到之前的位置
      const delta1 = prev1.x - prev2.x;
      const delta2 = curr.x - prev1.x;

      // 如果先移动了10像素以上，然后回退10像素以上，说明有推回
      if (Math.abs(delta1) > 10 && Math.abs(delta2) > 10 && delta1 * delta2 < 0) {
        pushBackCount++;
        console.log(`  [推回] ${curr.time}ms: 先移动${delta1.toFixed(1)}px，后回退${delta2.toFixed(1)}px`);
      }
    }

    console.log(`\n推回事件数: ${pushBackCount}`);

    if (pushBackCount > 5) {
      report.issues.push({
        severity: 'CRITICAL',
        description: 'enforceWalkablePosition频繁推回玩家位置',
        evidence: `${pushBackCount}次推回事件`,
        suggestedFix: '调整enforceWalkablePosition触发条件，或改为平滑过渡而非硬性setPosition'
      });
    } else if (pushBackCount > 0) {
      report.issues.push({
        severity: 'MEDIUM',
        description: '偶发的位置推回',
        evidence: `${pushBackCount}次推回事件`,
        suggestedFix: '检查边界检测逻辑'
      });
    }

    report.summary = `检测到${pushBackCount}次推回事件`;
    console.log(`\nD-006总结: ${report.summary}`);
    reports.push(report);
  });

  /**
   * 生成最终诊断报告
   */
  test('生成诊断报告', async ({ page }) => {
    // 此测试仅用于生成报告，不需要实际运行游戏
    console.log(generateReport(reports));

    // 输出报告到文件
    const reportContent = generateReport(reports);
    console.log('\n完整诊断报告已生成');
    console.log(reportContent);

    // 标记测试通过（诊断测试总是通过，问题在报告中呈现）
    expect(true).toBe(true);
  });
});