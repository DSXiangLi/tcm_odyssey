// tests/e2e/npc-dialog.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Hermes NPC Dialog Integration', () => {

  test('NPC-001: Backend health check', async ({ request }) => {
    const response = await request.get('http://localhost:8642/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.npcs).toContain('qingmu');
    expect(data.tools_count).toBeGreaterThanOrEqual(6);
  });

  test('NPC-003: Enter trigger shows welcome dialog', async ({ page }) => {
    // Start game
    await page.goto('http://localhost:5173');
    await page.waitForSelector('canvas');

    // Enter clinic (space key)
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);

    // Check dialog appears
    const dialogVisible = await page.evaluate(() => {
      return (window as any).__DIALOG_ACTIVE__ === true;
    });
    expect(dialogVisible).toBeTruthy();
  });

  test('NPC-005: Free input dialog available', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('canvas');

    // Trigger dialog
    await page.keyboard.press('Space');
    await page.waitForTimeout(2000);

    // Check input element exists
    const inputExists = await page.evaluate(() => {
      const dialogUI = (window as any).__DIALOG_UI__;
      return dialogUI && dialogUI.isInputVisible === true;
    });
    expect(inputExists).toBeTruthy();
  });

  test('NPC-007: Tool call triggered by question', async ({ request }) => {
    const response = await request.post('http://localhost:8642/v1/chat/stream', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '我学到哪了？'
      }
    });

    expect(response.ok()).toBeTruthy();

    // Read SSE stream
    const text = await response.text();
    expect(text).toContain('tool_call');
    expect(text).toContain('get_learning_progress');
  });

  test('NPC-008: trigger_minigame tool works', async ({ request }) => {
    const response = await request.post('http://localhost:8642/v1/chat/stream', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        npc_id: 'qingmu',
        player_id: 'player_001',
        user_message: '我想试试煎药'
      }
    });

    expect(response.ok()).toBeTruthy();
    const text = await response.text();
    expect(text).toContain('trigger_minigame');
  });
});