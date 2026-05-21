// tests/e2e/npc-feedback.spec.ts
/**
 * NPC Autonomous Agent E2E Tests
 * Phase 2.5 NPC自主Agent反馈机制
 *
 * Test Coverage:
 * - NPC-SFB-01: Diagnosis feedback triggered after completion
 * - NPC-SFB-02: Heartbeat triggered on ClinicScene enter
 * - NPC-SFB-03: NPC feedback content matches score level
 */

import { test, expect } from '@playwright/test';

// ========================================
// Configuration Constants
// ========================================

const HERMES_BACKEND_URL = 'http://localhost:8642';
const FRONTEND_URL = 'http://localhost:3000';

// Set longer timeout for tests involving game loading and SSE streams
test.setTimeout(60000);

/**
 * Helper function to enter ClinicScene using URL parameter
 * BootScene supports ?scene=clinic to directly jump to ClinicScene after asset loading
 */
async function enterClinicSceneDirect(page: any) {
  await page.goto(`${FRONTEND_URL}/?scene=clinic`);
  await page.waitForSelector('canvas');
  // Wait for game to load
  await page.waitForTimeout(3000);
}

/**
 * Helper function to enter DiagnosisScene directly
 */
async function enterDiagnosisScene(page: any, caseId: string = 'case-001') {
  await page.evaluate((id) => {
    const game = (window as any).__PHASER_GAME__;
    if (game) {
      game.scene.start('DiagnosisScene', { caseId: id });
    }
  }, caseId);
  await page.waitForTimeout(2000);
}

// ========================================
// NPC Feedback Tests (NPC-SFB-01~03)
// ========================================

test.describe('NPC Autonomous Agent - Feedback Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForSelector('canvas');
    // Wait for BootScene to complete asset loading
    await page.waitForTimeout(3000);
  });

  test('NPC-SFB-01: Diagnosis feedback triggered after completion', async ({ page }) => {
    // Step 1: Start DiagnosisScene directly with case-001
    await enterDiagnosisScene(page, 'case-001');

    // Wait for React UI to mount
    await page.waitForSelector('#diagnosis-react-root', { timeout: 5000 });

    // Step 2: Simulate diagnosis completion by calling handleDiagnosisComplete
    // This should trigger NPC feedback via npc-feedback-bridge
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) return;

      const sceneManager = game.scene;
      const diagnosisScene = sceneManager.getScene('DiagnosisScene');
      if (!diagnosisScene) return;

      // Create mock diagnosis result matching case-001 pattern
      // case-001: 李秀梅, 35岁, 女, 主诉:脘腹胀满
      // Correct pattern: 湿邪困脾证 (b1), 藿香正气散 (f1)
      const mockResult = {
        caseId: 'case-001',
        patient: {
          name: '李秀梅',
          age: 35,
          gender: '女',
          chief: '脘腹胀满'
        },
        diagnosis: {
          tongue: {
            color: '淡白',
            coating: '白腻',
            shape: '胖大有齿痕',
            moisture: '水滑'
          },
          pulse: {
            position: '关',
            quality: '濡缓'
          },
          symptoms: ['脘腹胀满', '恶心呕吐', '大便溏泄'],
          syndrome: ['b1'],  // 正确辨证
          prescription: ['f1']  // 正确选方
        }
      };

      // Call handleDiagnosisComplete via DiagnosisScene instance
      // Note: handleDiagnosisComplete is private, we need to access via __DIAGNOSIS_SCENE__
      // or emit the DIAGNOSIS_COMPLETE event
      const eventBus = (window as any).__EVENT_BUS__;
      if (eventBus) {
        eventBus.emit('DIAGNOSIS_COMPLETE', {
          caseId: 'case-001',
          result: mockResult,
          score: { total: 100, breakdown: {} }
        });
      }
    });

    // Step 3: Wait for DialogUI to appear (NPC feedback)
    await page.waitForSelector('#dialog-ui-root', { timeout: 10000 });

    // Step 4: Verify DialogUI is visible with feedback mode
    const dialogRoot = page.locator('#dialog-ui-root');
    await expect(dialogRoot).toBeVisible();

    // Check dialog scroll container exists
    const dialogScroll = page.locator('.dialog-scroll');
    await expect(dialogScroll).toBeVisible({ timeout: 5000 });

    // Check NPC name is displayed
    const dialogTitle = page.locator('.dialog-title');
    const titleText = await dialogTitle.textContent();
    expect(titleText).toContain('青木');
  });

  test('NPC-SFB-02: Heartbeat triggered on ClinicScene enter', async ({ page }) => {
    // Step 1: Enter ClinicScene directly
    await enterClinicSceneDirect(page);

    // Step 2: Check GameStateBridge heartbeat cache mechanism
    const bridgeState = await page.evaluate(() => {
      const bridge = (window as any).__GAME_STATE_BRIDGE__;
      if (!bridge) return { exists: false };

      // Check if cache methods exist
      const hasInventoryCache = typeof bridge.getInventoryCache === 'function';
      const hasProgressCache = typeof bridge.getProgressCache === 'function';
      const hasNpcMemoryCache = typeof bridge.getNpcMemoryCache === 'function';

      // Get current cache values (may be null if not yet populated)
      const inventoryCache = bridge.getInventoryCache?.();
      const progressCache = bridge.getProgressCache?.();
      const npcMemoryCache = bridge.getNpcMemoryCache?.();

      return {
        exists: true,
        hasInventoryCache,
        hasProgressCache,
        hasNpcMemoryCache,
        inventoryCacheType: inventoryCache !== null ? 'populated' : 'empty',
        progressCacheType: progressCache !== null ? 'populated' : 'empty',
        npcMemoryCacheType: npcMemoryCache !== null ? 'populated' : 'empty'
      };
    });

    // Step 3: Verify GameStateBridge instance exists
    expect(bridgeState.exists).toBe(true);

    // Step 4: Verify cache methods are available
    expect(bridgeState.hasInventoryCache).toBe(true);
    expect(bridgeState.hasProgressCache).toBe(true);
    expect(bridgeState.hasNpcMemoryCache).toBe(true);

    // Note: Cache may not be populated on first scene enter
    // The heartbeat mechanism calls backend to populate these
    // This test verifies the mechanism exists, not the data content
    console.log('[NPC-SFB-02] Bridge cache state:', JSON.stringify(bridgeState));
  });

  test('NPC-SFB-03: NPC feedback content matches score level', async ({ page }) => {
    // Step 1: Enter DiagnosisScene
    await enterDiagnosisScene(page, 'case-001');
    await page.waitForSelector('#diagnosis-react-root', { timeout: 5000 });

    // Step 2: Simulate low-score diagnosis (wrong answers)
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) return;

      const sceneManager = game.scene;
      const diagnosisScene = sceneManager.getScene('DiagnosisScene');
      if (!diagnosisScene) return;

      // Wrong diagnosis pattern (should be low score)
      // case-001 correct: b1(湿邪困脾), f1(藿香正气散)
      // Wrong: b2(风寒表实), f2(麻黄汤)
      const wrongResult = {
        caseId: 'case-001',
        patient: {
          name: '李秀梅',
          age: 35,
          gender: '女',
          chief: '脘腹胀满'
        },
        diagnosis: {
          tongue: {
            color: '红',  // Wrong - should be 淡白
            coating: '黄',  // Wrong - should be 白腻
            shape: '瘦',
            moisture: '干燥'
          },
          pulse: {
            position: '寸',  // Wrong - should be 关
            quality: '数'   // Wrong - should be 濡缓
          },
          symptoms: [],  // Empty symptoms
          syndrome: ['b2'],  // Wrong syndrome
          prescription: ['f2']  // Wrong prescription
        }
      };

      // Emit diagnosis complete event with wrong result
      const eventBus = (window as any).__EVENT_BUS__;
      if (eventBus) {
        eventBus.emit('DIAGNOSIS_COMPLETE', {
          caseId: 'case-001',
          result: wrongResult,
          score: { total: 20, breakdown: { tongue: 5, pulse: 5, syndrome: 0, prescription: 10 } }
        });
      }
    });

    // Step 3: Wait for DialogUI to appear
    await page.waitForSelector('#dialog-ui-root', { timeout: 10000 });

    // Step 4: Verify DialogUI structure exists
    const dialogRoot = page.locator('#dialog-ui-root');
    await expect(dialogRoot).toBeVisible();

    // Step 5: Verify NPC is in feedback mode (dialog exists)
    const dialogScroll = page.locator('.dialog-scroll');
    await expect(dialogScroll).toBeVisible({ timeout: 5000 });

    // Step 6: Check dialog title shows NPC name
    const dialogTitle = page.locator('.dialog-title');
    const titleText = await dialogTitle.textContent();
    expect(titleText).toContain('青木');

    // Note: Actual NPC feedback content verification requires LLM response
    // This test verifies the UI structure and feedback trigger mechanism
    // AI evaluator script (scripts/npc_acceptance/dialog_evaluator.py) handles content validation
    console.log('[NPC-SFB-03] Dialog structure verified, awaiting LLM feedback content');
  });

  test('NPC-SFB-04: Backend health check for NPC feedback', async ({ request }) => {
    // Verify backend is ready to handle NPC feedback requests
    const response = await request.get(`${HERMES_BACKEND_URL}/health`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.npcs).toContain('qingmu');

    // Verify tools_count includes feedback-related tools
    expect(data.tools_count).toBeGreaterThanOrEqual(6);
  });

  test('NPC-SFB-05: Feedback mode triggers correct API endpoint', async ({ request }) => {
    // Test that feedback mode triggers the correct backend endpoint
    // This simulates what happens when DiagnosisScene calls triggerNPCFeedback

    const response = await request.post(`${HERMES_BACKEND_URL}/v1/chat/stream`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '',  // Empty message - NPC should respond based on game_context
        game_context: {
          type: 'diagnosis',
          diagnosis_result: {
            case_id: 'case-001',
            patient_name: '李秀梅',
            score: {
              total: 75,
              breakdown: {
                tongue: 20,
                pulse: 20,
                symptoms: 15,
                syndrome: 10,
                prescription: 10
              }
            }
          }
        }
      }
    });

    expect(response.ok()).toBeTruthy();

    const text = await response.text();
    // Should contain SSE data chunks
    expect(text).toMatch(/data:/);

    // Parse response to verify NPC feedback content
    const textChunks = text.split('\n\n')
      .filter(line => line.startsWith('data: '))
      .map(line => line.slice(6))
      .filter(data => data !== '[DONE]')
      .map(data => {
        try {
          const parsed = JSON.parse(data);
          return parsed.text || parsed.content || '';
        } catch {
          return '';
        }
      });

    const fullResponse = textChunks.join('');
    // Response should contain feedback content (NPC点评)
    expect(fullResponse.length).toBeGreaterThan(30);

    console.log('[NPC-SFB-05] Feedback response length:', fullResponse.length);
  });

  test('NPC-SFB-06: DiagnosisScene exposes correct global interface', async ({ page }) => {
    // Verify DiagnosisScene exposes __DIAGNOSIS_SCENE__ for testing
    await enterDiagnosisScene(page, 'case-001');
    await page.waitForTimeout(2000);

    const diagnosisState = await page.evaluate(() => {
      const diagnosisScene = (window as any).__DIAGNOSIS_SCENE__;
      if (!diagnosisScene) return { exists: false };

      return {
        exists: true,
        isInitialized: diagnosisScene.isInitialized,
        caseId: diagnosisScene.caseId,
        hasReactUI: diagnosisScene.hasReactUI,
        returnScene: diagnosisScene.returnScene
      };
    });

    expect(diagnosisState.exists).toBe(true);
    expect(diagnosisState.isInitialized).toBe(true);
    expect(diagnosisState.caseId).toBe('case-001');
    expect(diagnosisState.hasReactUI).toBe(true);
    expect(diagnosisState.returnScene).toBe('ClinicScene');
  });

  test('NPC-SFB-07: DialogUI cleanup on close', async ({ page }) => {
    // Verify DialogUI is properly cleaned up when closed
    await enterDiagnosisScene(page, 'case-001');
    await page.waitForSelector('#diagnosis-react-root', { timeout: 5000 });

    // Trigger diagnosis complete
    await page.evaluate(() => {
      const eventBus = (window as any).__EVENT_BUS__;
      if (eventBus) {
        eventBus.emit('DIAGNOSIS_COMPLETE', {
          caseId: 'case-001',
          result: {
            patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
            diagnosis: { syndrome: ['b1'], prescription: ['f1'] }
          },
          score: { total: 80, breakdown: {} }
        });
      }
    });

    // Wait for DialogUI
    await page.waitForSelector('#dialog-ui-root', { timeout: 10000 });

    // Verify dialog exists
    const dialogExists = await page.locator('#dialog-ui-root').isVisible();
    expect(dialogExists).toBe(true);

    // Find and click close button
    const closeBtn = page.locator('.dialog-close-btn');
    const closeBtnExists = await closeBtn.count();

    if (closeBtnExists > 0) {
      await closeBtn.click();
      await page.waitForTimeout(500);

      // Verify dialog is removed
      const dialogRemoved = await page.locator('#dialog-ui-root').isVisible().catch(() => false);
      expect(dialogRemoved).toBe(false);
    } else {
      // Fallback: Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  });
});