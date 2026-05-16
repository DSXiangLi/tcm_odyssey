const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('=== Test 1: URL parameter scene jumping ===');
  await page.goto('http://localhost:3000/?scene=clinic');
  await page.waitForSelector('canvas');

  // Wait for BootScene to load assets + jump to ClinicScene + showWelcomeDialog
  // Timeline: BootScene loads (~2s) + delayedCall(1000ms) + checkConnection(~5s) + DialogUI create
  console.log('Waiting 10s for full flow...');
  await page.waitForTimeout(10000);

  const result = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    const dialogUI = window.__DIALOG_UI__;
    const currentScene = game?.scene?.getActiveScene?.()?.scene?.key;

    return {
      gameExists: Boolean(game),
      currentScene,
      dialogUI,
      dialogUIExists: Boolean(dialogUI),
      textures: game?.textures?.list ? Object.keys(game.textures.list) : []
    };
  });

  console.log('Result:', JSON.stringify(result, null, 2));

  // Test 2: Check Hermes connection
  console.log('\n=== Test 2: Hermes connection ===');
  try {
    const health = await page.evaluate(async () => {
      const response = await fetch('http://localhost:8642/health');
      return response.json();
    });
    console.log('Hermes health:', JSON.stringify(health, null, 2));
  } catch (e) {
    console.log('Hermes error:', e.message);
  }

  await browser.close();
})();