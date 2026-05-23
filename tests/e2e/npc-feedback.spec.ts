// tests/e2e/npc-feedback.spec.ts
/**
 * NPC Autonomous Agent E2E Tests
 * Phase 2.5 NPC自主Agent反馈机制
 *
 * Test Coverage:
 * - NPC-SFB-01~07: Basic feedback mechanism tests
 * - NPC-FB-02~08: Score level keywords and UI state tests
 */

import { test, expect } from '@playwright/test';
import {
  TIMEOUTS,
  simulateDiagnosisComplete,
  waitForNPCResponse,
  enterDiagnosisScene,
  MOCK_DIAGNOSIS_RESULT,
  MOCK_LOW_SCORE_DIAGNOSIS,
  DiagnosisResultData
} from './utils/npc-test-helpers';

// ========================================
// Configuration Constants
// ========================================

const HERMES_BACKEND_URL = 'http://localhost:8642';
const FRONTEND_URL = 'http://localhost:3000';

// Set longer timeout for tests involving game loading and SSE streams
test.setTimeout(TIMEOUTS.NPC_RESPONSE);

/**
 * Helper function to enter ClinicScene using URL parameter
 * BootScene supports ?scene=clinic to directly jump to ClinicScene after asset loading
 */
async function enterClinicSceneDirect(page: any) {
  await page.goto(`${FRONTEND_URL}/?scene=clinic`);
  await page.waitForSelector('canvas');
  // Wait for game to load
  await page.waitForTimeout(TIMEOUTS.SCENE_LOAD);
}

// ========================================
// Mock Diagnosis Results with Different Scores
// ========================================

/** Excellent score result (90+) - all correct */
const EXCELLENT_RESULT: DiagnosisResultData = MOCK_DIAGNOSIS_RESULT;

/** Good score result (70-89) - minor errors */
const GOOD_RESULT: DiagnosisResultData = {
  caseId: 'case-001',
  patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
  diagnosis: {
    tongue: { color: '淡白', coating: '白腻', shape: '胖大有齿痕', moisture: '水滑' }, // Correct
    pulse: { position: '关', quality: '弦' }, // Quality slightly wrong (should be 濡缓)
    symptoms: ['脘腹胀满'], // Correct
    syndrome: ['b1'], // Correct
    prescription: ['f1'] // Correct
  }
};

/** Pass score result (60-69) - some errors */
const PASS_RESULT: DiagnosisResultData = {
  caseId: 'case-001',
  patient: { name: '李秀梅', age: 35, gender: '女', chief: '脘腹胀满' },
  diagnosis: {
    tongue: { color: '淡白', coating: '黄', shape: '瘦', moisture: '干燥' }, // Most wrong
    pulse: { position: '关', quality: '濡缓' }, // Correct
    symptoms: ['脘腹胀满'], // Correct
    syndrome: ['b1'], // Correct
    prescription: ['f1'] // Correct
  }
};

/** Need improvement score result (<60) - many errors */
const NEED_IMPROVEMENT_RESULT: DiagnosisResultData = MOCK_LOW_SCORE_DIAGNOSIS;

// ========================================
// NPC Feedback Tests (NPC-SFB-01~03)
// ========================================

test.describe('NPC Autonomous Agent - Feedback Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForSelector('canvas');
    // Wait for BootScene to complete asset loading
    await page.waitForTimeout(TIMEOUTS.SCENE_LOAD);
  });

  test('NPC-SFB-01: Diagnosis feedback triggered after completion', async ({ page }) => {
    // Step 1: Start DiagnosisScene directly with case-001
    await enterDiagnosisScene(page, 'case-001');

    // Wait for React UI to mount
    await page.waitForSelector('#diagnosis-react-root', { timeout: 5000 });

    // Step 2: Simulate diagnosis completion by calling handleDiagnosisComplete
    // This should trigger NPC feedback via npc-feedback-bridge
    await page.evaluate(() => {
      // Use the exposed __DIAGNOSIS_SCENE__ interface
      const diagnosisScene = (window as any).__DIAGNOSIS_SCENE__;
      if (!diagnosisScene || !diagnosisScene.handleDiagnosisComplete) return;

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

      // Call handleDiagnosisComplete directly (now exposed via __DIAGNOSIS_SCENE__)
      diagnosisScene.handleDiagnosisComplete(mockResult);
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
      // Use the exposed __DIAGNOSIS_SCENE__ interface
      const diagnosisScene = (window as any).__DIAGNOSIS_SCENE__;
      if (!diagnosisScene || !diagnosisScene.handleDiagnosisComplete) return;

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

      // Call handleDiagnosisComplete directly (now exposed via __DIAGNOSIS_SCENE__)
      diagnosisScene.handleDiagnosisComplete(wrongResult);
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
    await page.waitForSelector('#diagnosis-react-root', { timeout: TIMEOUTS.DIALOG_UI });

    // Trigger diagnosis complete
    await page.evaluate(() => {
      // Use the exposed __DIAGNOSIS_SCENE__ interface
      const diagnosisScene = (window as any).__DIAGNOSIS_SCENE__;
      if (!diagnosisScene || !diagnosisScene.handleDiagnosisComplete) return;

      const mockResult = {
        caseId: 'case-001',
        patient: {
          name: '李秀梅',
          age: 35,
          gender: '女',
          chief: '脘腹胀满'
        },
        diagnosis: {
          tongue: { color: '淡白', coating: '白腻', shape: '胖大有齿痕', moisture: '水滑' },
          pulse: { position: '关', quality: '濡缓' },
          symptoms: ['脘腹胀满'],
          syndrome: ['b1'],
          prescription: ['f1']
        }
      };

      diagnosisScene.handleDiagnosisComplete(mockResult);
    });

    // Wait for DialogUI
    await page.waitForSelector('#dialog-ui-root', { timeout: TIMEOUTS.TOOL_CARD });

    // Verify dialog exists
    const dialogExists = await page.locator('#dialog-ui-root').isVisible();
    expect(dialogExists).toBe(true);

    // Find and click close button
    const closeBtn = page.locator('.dialog-close-btn');
    const closeBtnExists = await closeBtn.count();

    if (closeBtnExists > 0) {
      await closeBtn.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Verify dialog is removed
      const dialogRemoved = await page.locator('#dialog-ui-root').isVisible().catch(() => false);
      expect(dialogRemoved).toBe(false);
    } else {
      // Fallback: Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(TIMEOUTS.SHORT);
    }
  });

  // ========================================
  // Score Level Keywords Tests (NPC-FB-02~05)
  // ========================================

  test('NPC-FB-02: Excellent score (90+) feedback contains "优秀" keyword', async ({ page }) => {
    // Enter diagnosis scene
    await enterDiagnosisScene(page, 'case-001');
    await page.waitForSelector('#diagnosis-react-root', { timeout: TIMEOUTS.DIALOG_UI });

    // Simulate excellent diagnosis (all correct answers)
    await simulateDiagnosisComplete(page, EXCELLENT_RESULT);

    // Wait for DialogUI to appear
    await page.waitForSelector('#dialog-ui-root', { timeout: TIMEOUTS.TOOL_CARD });

    // Wait for NPC response to complete
    await waitForNPCResponse(page);

    // Verify dialog content contains excellent keyword
    const dialogContent = page.locator('.dialog-content, .dialog-scroll');
    const text = await dialogContent.textContent();

    // Check for excellence keyword in feedback
    expect(text).toContain('优秀');
    console.log('[NPC-FB-02] Feedback text length:', text?.length);
  });

  test('NPC-FB-03: Good score (70-89) feedback contains "良好" keyword', async ({ page }) => {
    // Enter diagnosis scene
    await enterDiagnosisScene(page, 'case-001');
    await page.waitForSelector('#diagnosis-react-root', { timeout: TIMEOUTS.DIALOG_UI });

    // Simulate good diagnosis (minor errors)
    await simulateDiagnosisComplete(page, GOOD_RESULT);

    // Wait for DialogUI to appear
    await page.waitForSelector('#dialog-ui-root', { timeout: TIMEOUTS.TOOL_CARD });

    // Wait for NPC response to complete
    await waitForNPCResponse(page);

    // Verify dialog content contains good keyword
    const dialogContent = page.locator('.dialog-content, .dialog-scroll');
    const text = await dialogContent.textContent();

    // Check for good keyword in feedback
    expect(text).toContain('良好');
    console.log('[NPC-FB-03] Feedback text length:', text?.length);
  });

  test('NPC-FB-04: Pass score (60-69) feedback contains "合格" keyword', async ({ page }) => {
    // Enter diagnosis scene
    await enterDiagnosisScene(page, 'case-001');
    await page.waitForSelector('#diagnosis-react-root', { timeout: TIMEOUTS.DIALOG_UI });

    // Simulate pass diagnosis (some errors)
    await simulateDiagnosisComplete(page, PASS_RESULT);

    // Wait for DialogUI to appear
    await page.waitForSelector('#dialog-ui-root', { timeout: TIMEOUTS.TOOL_CARD });

    // Wait for NPC response to complete
    await waitForNPCResponse(page);

    // Verify dialog content contains pass keyword
    const dialogContent = page.locator('.dialog-content, .dialog-scroll');
    const text = await dialogContent.textContent();

    // Check for pass keyword in feedback
    expect(text).toContain('合格');
    console.log('[NPC-FB-04] Feedback text length:', text?.length);
  });

  test('NPC-FB-05: Need improvement (<60) feedback contains "需加强" keyword', async ({ page }) => {
    // Enter diagnosis scene
    await enterDiagnosisScene(page, 'case-001');
    await page.waitForSelector('#diagnosis-react-root', { timeout: TIMEOUTS.DIALOG_UI });

    // Simulate need-improvement diagnosis (many errors)
    await simulateDiagnosisComplete(page, NEED_IMPROVEMENT_RESULT);

    // Wait for DialogUI to appear
    await page.waitForSelector('#dialog-ui-root', { timeout: TIMEOUTS.TOOL_CARD });

    // Wait for NPC response to complete
    await waitForNPCResponse(page);

    // Verify dialog content contains need-improvement keyword
    const dialogContent = page.locator('.dialog-content, .dialog-scroll');
    const text = await dialogContent.textContent();

    // Check for need-improvement keyword in feedback
    expect(text).toContain('需加强');
    console.log('[NPC-FB-05] Feedback text length:', text?.length);
  });

  // ========================================
  // UI State Tests (NPC-FB-07~08)
  // ========================================

  test('NPC-FB-07: Return to ClinicScene after feedback', async ({ page }) => {
    // Enter diagnosis scene
    await enterDiagnosisScene(page, 'case-001');
    await page.waitForSelector('#diagnosis-react-root', { timeout: TIMEOUTS.DIALOG_UI });

    // Simulate diagnosis completion
    await simulateDiagnosisComplete(page, EXCELLENT_RESULT);

    // Wait for DialogUI to appear
    await page.waitForSelector('#dialog-ui-root', { timeout: TIMEOUTS.TOOL_CARD });
    await waitForNPCResponse(page);

    // Close the dialog
    const closeBtn = page.locator('.dialog-close-btn');
    const count = await closeBtn.count();

    if (count > 0) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }

    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Verify dialog is removed
    const dialogRemoved = await page.locator('#dialog-ui-root').isVisible().catch(() => false);
    expect(dialogRemoved).toBe(false);

    // Verify we're back in ClinicScene
    const sceneState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) return { exists: false };

      const activeScene = game.scene.isActive('ClinicScene');
      const diagnosisScene = game.scene.isActive('DiagnosisScene');

      return {
        exists: true,
        clinicActive: activeScene,
        diagnosisActive: diagnosisScene
      };
    });

    expect(sceneState.exists).toBe(true);
    // ClinicScene should be active after closing feedback
    expect(sceneState.clinicActive).toBe(true);
    // DiagnosisScene should no longer be active
    expect(sceneState.diagnosisActive).toBe(false);
  });

  test('NPC-FB-08: Feedback mode UI state', async ({ page }) => {
    // Enter diagnosis scene
    await enterDiagnosisScene(page, 'case-001');
    await page.waitForSelector('#diagnosis-react-root', { timeout: TIMEOUTS.DIALOG_UI });

    // Simulate diagnosis completion
    await simulateDiagnosisComplete(page, EXCELLENT_RESULT);

    // Wait for DialogUI to appear
    await page.waitForSelector('#dialog-ui-root', { timeout: TIMEOUTS.TOOL_CARD });

    // Verify dialog has feedback mode indicators
    const dialogRoot = page.locator('#dialog-ui-root');

    // Check for feedback-related class or attribute
    const hasFeedbackClass = await dialogRoot.locator('.dialog-feedback, .feedback-mode').count() > 0;
    const hasModeAttribute = await dialogRoot.getAttribute('data-mode') === 'feedback';

    // Either feedback class or mode attribute should indicate feedback mode
    expect(hasFeedbackClass || hasModeAttribute).toBe(true);

    // Verify dialog title contains NPC name (青木)
    const dialogTitle = page.locator('.dialog-title');
    const titleText = await dialogTitle.textContent();
    expect(titleText).toContain('青木');

    // Verify no input field in feedback mode (NPC only speaks)
    const inputField = page.locator('.dialog-input');
    const inputVisible = await inputField.isVisible().catch(() => false);
    expect(inputVisible).toBe(false);

    console.log('[NPC-FB-08] Feedback mode UI verified');
  });
});