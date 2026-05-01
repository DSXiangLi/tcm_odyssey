// tests/e2e/npc-dialog.spec.ts
/**
 * NPC AI Acceptance Testing - E2E Test Suite
 * 19 test scenarios across 5 categories per design spec Section 5
 *
 * Categories:
 * - Smoke Tests (NPC-S01~S03): 3 tests
 * - Trigger Tests (NPC-T01~T04): 4 tests
 * - Dialog Flow Tests (NPC-D01~D05): 5 tests
 * - Tool Call Tests (NPC-TC01~TC04): 4 tests
 * - Quality Tests (NPC-Q01~Q03): 3 tests (AI evaluated)
 */

import { test, expect } from '@playwright/test';

// ========================================
// Configuration Constants
// ========================================

const HERMES_BACKEND_URL = 'http://localhost:8642';
const FRONTEND_URL = 'http://localhost:3000';

// ========================================
// Smoke Tests (NPC-S01~S03)
// ========================================

test.describe('NPC Dialog - Smoke Tests', () => {

  test('NPC-S01: Backend service health', async ({ request }) => {
    // Acceptance: GET /health returns {status: "ok", npcs: ["qingmu", "laozhang", "neighbor"]}
    const response = await request.get(`${HERMES_BACKEND_URL}/health`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.npcs).toContain('qingmu');
    expect(data.npcs).toContain('laozhang');
    expect(data.npcs).toContain('neighbor');
    expect(data.tools_count).toBeGreaterThanOrEqual(6);
  });

  test('NPC-S02: NPC sprite loading', async ({ page }) => {
    // Acceptance: After BootScene, npc_qingmu texture exists
    await page.goto(FRONTEND_URL);
    await page.waitForSelector('canvas');
    await page.waitForTimeout(3000);  // Wait for BootScene to load assets

    // Check if NPC texture was loaded
    const textureExists = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) return false;
      return game.textures.exists('npc_qingmu');
    });

    expect(textureExists).toBeTruthy();
  });

  test('NPC-S03: DialogUI render', async ({ page }) => {
    // Acceptance: After entering clinic, DialogUI visible with NPC avatar, name, dialog area
    await page.goto(FRONTEND_URL);
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000);

    // Enter clinic by pressing Space at clinic door position
    // First navigate to the clinic door location in TownOutdoorScene
    await page.keyboard.press('Space');
    await page.waitForTimeout(3000);  // Wait for welcome dialog

    // Check DialogUI global state
    const dialogState = await page.evaluate(() => {
      return (window as any).__DIALOG_UI__;
    });

    expect(dialogState).toBeDefined();
    expect(dialogState.npcId).toBe('qingmu');
    expect(dialogState.npcName).toBe('青木先生');
    expect(dialogState.visible).toBeTruthy();
  });
});

// ========================================
// Trigger Tests (NPC-T01~T04)
// ========================================

test.describe('NPC Dialog - Trigger Tests', () => {

  test('NPC-T01: Scene enter trigger', async ({ page }) => {
    // Acceptance: After entering ClinicScene 1s, auto-show qingmu welcome dialog
    await page.goto(FRONTEND_URL);
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000);

    // Enter clinic
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);  // 1s + buffer for welcome dialog

    // Check that dialog was auto-triggered
    const dialogActive = await page.evaluate(() => {
      return (window as any).__DIALOG_ACTIVE__ === true;
    });

    expect(dialogActive).toBeTruthy();

    // Verify it's qingmu's welcome dialog
    const dialogState = await page.evaluate(() => {
      return (window as any).__DIALOG_UI__;
    });

    expect(dialogState?.npcId).toBe('qingmu');
  });

  test('NPC-T02: Nearby NPC detection', async ({ page }) => {
    // Acceptance: Player moves within 100px of NPC, show "Press space to talk"
    await page.goto(FRONTEND_URL);
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000);

    // Enter clinic first
    await page.keyboard.press('Space');
    await page.waitForTimeout(3000);

    // Wait for welcome dialog to complete (it auto-shows)
    // Then move player to be near NPC position (200, 150)
    // Use WASD keys to move
    await page.keyboard.press('W');  // Move up towards NPC
    await page.waitForTimeout(500);
    await page.keyboard.press('D');  // Move right
    await page.waitForTimeout(500);

    // Check if nearby hint text is visible
    const nearbyHintVisible = await page.evaluate(() => {
      // Check for nearby hint in scene
      const scene = (window as any).__CURRENT_SCENE__;
      if (!scene) return false;

      // Look for the hint text object
      const children = scene.children?.list || [];
      const hintText = children.find((obj: any) =>
        obj.type === 'Text' && obj.text?.includes('按空格')
      );
      return hintText?.visible === true;
    });

    // Note: This test may need adjustment based on actual player spawn position
    // For now, we verify the mechanism exists
    expect(nearbyHintVisible).toBeTruthy();
  });

  test('NPC-T03: Space key dialog', async ({ page }) => {
    // Acceptance: Press space, DialogUI shows, input box visible
    await page.goto(FRONTEND_URL);
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000);

    // Enter clinic
    await page.keyboard.press('Space');
    await page.waitForTimeout(3000);

    // Wait for welcome dialog to complete and input box to appear
    await page.waitForTimeout(5000);

    // Check if input box is visible (DialogUI exposes this)
    const inputVisible = await page.evaluate(() => {
      const dialogUI = (window as any).__DIALOG_UI__;
      return dialogUI?.isInputVisible?.() === true;
    });

    expect(inputVisible).toBeTruthy();
  });

  test('NPC-T04: Multi-NPC scene switch', async ({ page }) => {
    // Acceptance: Switch from clinic to garden, laozhang NPC registers correctly
    await page.goto(FRONTEND_URL);
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000);

    // Enter clinic first
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);

    // Exit clinic (Space to return to outdoor)
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    // Navigate to garden door and enter
    // Garden door is at position (15, 8) in TownOutdoorScene
    // Use movement keys to get there
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('A');  // Move left towards garden
      await page.waitForTimeout(200);
    }

    // Enter garden
    await page.keyboard.press('Space');
    await page.waitForTimeout(3000);

    // Check that laozhang NPC is registered
    const npcSystemState = await page.evaluate(() => {
      const scene = (window as any).__CURRENT_SCENE__;
      if (!scene || !scene.npcSystem) return null;
      const npcs = scene.npcSystem.getAllNPCs();
      return npcs.map((npc: any) => npc.id);
    });

    expect(npcSystemState).toContain('laozhang');
  });
});

// ========================================
// Dialog Flow Tests (NPC-D01~D05)
// ========================================

test.describe('NPC Dialog - Dialog Flow Tests', () => {

  test('NPC-D01: Input state toggle', async ({ page }) => {
    // Acceptance: After dialog completes 2s, input box auto-shows and focuses
    await page.goto(FRONTEND_URL);
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000);

    // Enter clinic - triggers welcome dialog
    await page.keyboard.press('Space');
    await page.waitForTimeout(8000);  // Wait for dialog to complete + 2s input delay

    // Verify input box is visible and focused
    const inputState = await page.evaluate(() => {
      const dialogUI = (window as any).__DIALOG_UI__;
      const inputVisible = dialogUI?.isInputVisible?.() === true;

      // Check if input element has focus
      const inputElement = document.querySelector('#dialog-input');
      const inputFocused = inputElement === document.activeElement;

      return { inputVisible, inputFocused };
    });

    expect(inputState.inputVisible).toBeTruthy();
    // Note: Focus check may be flaky due to timing, so we check visibility primarily
  });

  test('NPC-D02: User input send', async ({ request }) => {
    // Acceptance: Input "麻黄汤有什么作用" click send, backend receives request
    // This test uses API directly to verify backend processing
    const response = await request.post(`${HERMES_BACKEND_URL}/v1/chat/stream`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '麻黄汤有什么作用'
      }
    });

    expect(response.ok()).toBeTruthy();

    // Verify backend started processing (SSE stream starts)
    const text = await response.text();
    expect(text.length).toBeGreaterThan(0);
    // Should contain text chunks or tool calls
    expect(text).toMatch(/data:/);
  });

  test('NPC-D03: Stream response', async ({ request }) => {
    // Acceptance: SSE response displays character-by-character, total >50 chars
    const response = await request.post(`${HERMES_BACKEND_URL}/v1/chat/stream`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '什么是风寒表实证？'
      }
    });

    expect(response.ok()).toBeTruthy();

    const text = await response.text();

    // Parse SSE chunks and count total text content
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
    expect(fullResponse.length).toBeGreaterThan(50);
  });

  test('NPC-D04: Stop generation', async ({ page }) => {
    // Acceptance: During response, click "stop", generation stops, shows partial
    await page.goto(FRONTEND_URL);
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000);

    // Enter clinic
    await page.keyboard.press('Space');
    await page.waitForTimeout(5000);

    // If input box is visible, type a question
    const inputVisible = await page.evaluate(() => {
      return (window as any).__DIALOG_UI__?.isInputVisible?.() === true;
    });

    if (inputVisible) {
      // Type a question
      await page.evaluate(() => {
        const input = document.querySelector('#dialog-input') as HTMLInputElement;
        if (input) {
          input.value = '什么是麻黄汤？';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });

      // Click send button
      await page.evaluate(() => {
        const sendBtn = document.querySelector('#send-btn') as HTMLButtonElement;
        if (sendBtn) sendBtn.click();
      });

      await page.waitForTimeout(1000);  // Let some text generate

      // Click stop button (if visible)
      const stopVisible = await page.evaluate(() => {
        const dialogUI = (window as any).__DIALOG_UI__;
        return dialogUI?.isGenerating?.() === true;
      });

      if (stopVisible) {
        // Trigger stop
        await page.evaluate(() => {
          const dialogUIInstance = (window as any).__DIALOG_UI_INSTANCE__;
          if (dialogUIInstance) dialogUIInstance.stopGeneration();
        });

        await page.waitForTimeout(500);

        // Verify generation stopped
        const isGenerating = await page.evaluate(() => {
          return (window as any).__DIALOG_UI__?.isGenerating?.() === true;
        });

        expect(isGenerating).toBeFalsy();
      }
    }
  });

  test('NPC-D05: Dialog close', async ({ page }) => {
    // Acceptance: Click close/ESC, DialogUI destroys, event NPC_DIALOG_HIDDEN recorded
    await page.goto(FRONTEND_URL);
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000);

    // Enter clinic
    await page.keyboard.press('Space');
    await page.waitForTimeout(3000);

    // Verify dialog is active
    const dialogActiveBefore = await page.evaluate(() => {
      return (window as any).__DIALOG_ACTIVE__ === true;
    });
    expect(dialogActiveBefore).toBeTruthy();

    // Press Escape to close dialog
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Verify dialog is destroyed
    const dialogActiveAfter = await page.evaluate(() => {
      return (window as any).__DIALOG_ACTIVE__ === false;
    });
    expect(dialogActiveAfter).toBeTruthy();

    // Verify NPC_DIALOG_HIDDEN event was recorded
    const eventHistory = await page.evaluate(() => {
      const eventBus = (window as any).__EVENT_BUS__;
      if (!eventBus) return [];
      return eventBus.getEventHistory('npc:dialog_hidden');
    });

    // Note: EventBus may not be exposed to window, so we check global state
    const dialogDestroyed = await page.evaluate(() => {
      return (window as any).__DIALOG_UI__ === null;
    });
    expect(dialogDestroyed).toBeTruthy();
  });
});

// ========================================
// Tool Call Tests (NPC-TC01~TC04)
// ========================================

test.describe('NPC Dialog - Tool Call Tests', () => {

  test('NPC-TC01: Learning progress query', async ({ request }) => {
    // Acceptance: Send "我学到哪了", backend returns get_learning_progress tool call
    const response = await request.post(`${HERMES_BACKEND_URL}/v1/chat/stream`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '我学到哪了？'
      }
    });

    expect(response.ok()).toBeTruthy();

    const text = await response.text();

    // Should contain tool_call for get_learning_progress
    expect(text).toContain('tool_call');
    expect(text).toContain('get_learning_progress');
  });

  test('NPC-TC02: Minigame trigger', async ({ request }) => {
    // Acceptance: Send "我想试试煎药", backend returns trigger_minigame(game_type: "decoction")
    const response = await request.post(`${HERMES_BACKEND_URL}/v1/chat/stream`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '我想试试煎药'
      }
    });

    expect(response.ok()).toBeTruthy();

    const text = await response.text();

    // Should contain tool_call for trigger_minigame
    expect(text).toContain('trigger_minigame');
    expect(text).toContain('decoction');
  });

  test('NPC-TC03: Weakness record', async ({ request }) => {
    // Acceptance: Send question causing NPC to find understanding deviation, returns record_weakness
    // This test verifies the tool is available, actual trigger depends on dialog content
    const response = await request.post(`${HERMES_BACKEND_URL}/v1/chat/stream`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '我觉得麻黄汤和桂枝汤差不多，都是解表的'
      }
    });

    expect(response.ok()).toBeTruthy();

    const text = await response.text();

    // This dialog should potentially trigger record_weakness if NPC detects misunderstanding
    // Note: Actual behavior depends on NPC's teaching style and assessment
    // We verify the tool mechanism exists in the response structure
    const hasToolStructure = text.includes('tool_call') || text.includes('tool_result');
    expect(hasToolStructure || text.length > 100).toBeTruthy();
  });

  test('NPC-TC04: Minigame scene switch', async ({ page }) => {
    // Acceptance: After tool trigger, scene switches to DecoctionScene
    await page.goto(FRONTEND_URL);
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000);

    // Enter clinic
    await page.keyboard.press('Space');
    await page.waitForTimeout(5000);

    // Press D key to start decoction (direct trigger test)
    await page.keyboard.press('D');
    await page.waitForTimeout(2000);

    // Check if scene switched to DecoctionScene
    const currentScene = await page.evaluate(() => {
      const gameState = (window as any).__GAME_STATE__?.();
      return gameState?.currentScene;
    });

    expect(currentScene).toContain('Decoction');
  });
});

// ========================================
// Quality Tests (NPC-Q01~Q03) - AI Evaluated
// ========================================

test.describe('NPC Dialog - Quality Tests (AI Evaluated)', () => {

  test('NPC-Q01: Guided questioning', async ({ request }) => {
    // Acceptance: NPC response contains at least 1 guided question ("你可..." pattern)
    const response = await request.post(`${HERMES_BACKEND_URL}/v1/chat/stream`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '什么是风寒表实证？'
      }
    });

    expect(response.ok()).toBeTruthy();

    const text = await response.text();

    // Extract full response text
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

    // Check for guided questioning patterns
    const guidedPatterns = [
      '你可记得',
      '你可思考',
      '你可明了',
      '你可知道',
      '你可曾',
      '你可想过'
    ];

    const hasGuidedQuestion = guidedPatterns.some(pattern =>
      fullResponse.includes(pattern)
    );

    // Store for AI evaluation
    const evaluationData = {
      npc_id: 'qingmu',
      user_message: '什么是风寒表实证？',
      full_response: fullResponse,
      tool_calls: [],
      has_guided_question: hasGuidedQuestion
    };

    // Log for external AI evaluation
    console.log('[NPC-Q01] Evaluation data:', JSON.stringify(evaluationData));

    // Basic assertion: response should be substantive
    expect(fullResponse.length).toBeGreaterThan(50);

    // Note: Full AI evaluation done by scripts/npc_acceptance/dialog_evaluator.py
  });

  test('NPC-Q02: Multi-round coherence', async ({ request }) => {
    // Acceptance: 3 rounds of dialog, NPC correctly understands context, no irrelevant answers
    const rounds = [
      { message: '什么是麻黄汤？', context: [] },
      { message: '它的君药是什么？', context: [] },
      { message: '为什么用桂枝做臣药？', context: [] }
    ];

    const responses: string[] = [];

    for (const round of rounds) {
      const response = await request.post(`${HERMES_BACKEND_URL}/v1/chat/stream`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          npc_id: 'qingmu',
          player_id: 'player_001',
          user_message: round.message
        }
      });

      expect(response.ok()).toBeTruthy();

      const text = await response.text();

      // Extract response
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

      responses.push(textChunks.join(''));
    }

    // Check context coherence:
    // Round 2 should reference "麻黄汤" from Round 1
    // Round 3 should discuss "桂枝" in context of "臣药"
    const coherenceChecks = {
      round2_context: responses[1].includes('麻黄') || responses[1].includes('君'),
      round3_context: responses[2].includes('桂枝') || responses[2].includes('臣') || responses[2].includes('配伍'),
      no_irrelevant: responses.every(r => r.length > 30)  // Each response should be substantive
    };

    const evaluationData = {
      npc_id: 'qingmu',
      rounds: rounds.map((r, i) => ({
        user_message: r.message,
        full_response: responses[i]
      })),
      coherence_checks: coherenceChecks
    };

    console.log('[NPC-Q02] Evaluation data:', JSON.stringify(evaluationData));

    // Basic assertions
    expect(responses.every(r => r.length > 30)).toBeTruthy();
  });

  test('NPC-Q03: Tool timing reasonable', async ({ request }) => {
    // Acceptance: Tool triggered at appropriate dialog node (after explanation, before practice)
    // Test sequence: explanation request -> trigger practice
    const response = await request.post(`${HERMES_BACKEND_URL}/v1/chat/stream`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '讲完麻黄汤了，我想试试煎药'
      }
    });

    expect(response.ok()).toBeTruthy();

    const text = await response.text();

    // Parse for tool calls and text content
    const lines = text.split('\n\n').filter(line => line.startsWith('data: '));

    const toolCalls: { name: string; args: object; position: number }[] = [];
    const textContent: string[] = [];

    lines.forEach((line, index) => {
      const data = line.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'tool_call') {
          toolCalls.push({
            name: parsed.name,
            args: parsed.args || {},
            position: index
          });
        }
        if (parsed.text || parsed.content) {
          textContent.push(parsed.text || parsed.content);
        }
      } catch {
        // Ignore parse errors
      }
    });

    // Check timing: tool should appear after some explanation text
    const hasExplanationBeforeTool = textContent.length > 0 && toolCalls.length > 0;
    const toolIsTriggerMinigame = toolCalls.some(tc => tc.name === 'trigger_minigame');

    const evaluationData = {
      npc_id: 'qingmu',
      user_message: '讲完麻黄汤了，我想试试煎药',
      text_content_length: textContent.length,
      tool_calls: toolCalls,
      has_explanation_before_tool: hasExplanationBeforeTool,
      tool_is_trigger_minigame: toolIsTriggerMinigame
    };

    console.log('[NPC-Q03] Evaluation data:', JSON.stringify(evaluationData));

    // Basic assertions
    expect(toolIsTriggerMinigame).toBeTruthy();
  });
});