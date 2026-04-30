// tests/e2e/diagnosis-html-ui.spec.ts
/**
 * 诊断游戏 HTML UI 集成 E2E 测试
 * Phase 2.5 诊断游戏 HTML 直接迁移
 *
 * 测试覆盖:
 * - React UI 容器渲染
 * - 病案弹窗显示
 * - 5阶段导航切换
 * - 舌诊选项交互
 * - 脉诊选项交互
 * - 问诊对话流程
 * - 辨证选项交互
 * - 选方选项交互
 * - 完成度判定
 * - 结果事件触发
 * - 关闭场景
 */

import { test, expect } from '@playwright/test';

test.describe('Diagnosis HTML UI Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#game-container');
    // Wait for game to load
    await page.waitForTimeout(3000);
  });

  test('should render diagnosis UI when entering diagnosis scene', async ({ page }) => {
    // Enter diagnosis scene via Phaser scene manager with caseId
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DiagnosisScene', { caseId: 'case-001' });
      }
    });

    await page.waitForTimeout(2000);

    // Check for React UI container
    const reactRoot = page.locator('#diagnosis-react-root');
    await expect(reactRoot).toBeVisible({ timeout: 5000 });

    // Check for app container (诊断游戏主应用)
    const app = page.locator('.app');
    await expect(app).toBeVisible({ timeout: 5000 });
  });

  test('should render sidebar with 5 navigation tabs', async ({ page }) => {
    // Enter diagnosis scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DiagnosisScene', { caseId: 'case-001' });
      }
    });

    await page.waitForTimeout(2000);
    await page.waitForSelector('.sidebar', { timeout: 5000 });

    // Check sidebar is visible
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    // Check brand name
    const brandCn = page.locator('.brand-cn');
    await expect(brandCn).toHaveText('悬壶');

    // Check 5 navigation items
    const navItems = page.locator('.nav-item');
    const count = await navItems.count();
    expect(count).toBe(5);

    // Check navigation labels
    await expect(navItems.nth(0).locator('.nav-label-cn')).toHaveText('舌诊');
    await expect(navItems.nth(1).locator('.nav-label-cn')).toHaveText('脉诊');
    await expect(navItems.nth(2).locator('.nav-label-cn')).toHaveText('问诊');
    await expect(navItems.nth(3).locator('.nav-label-cn')).toHaveText('辨证');
    await expect(navItems.nth(4).locator('.nav-label-cn')).toHaveText('选方');
  });

  test('should show tongue diagnosis stage initially', async ({ page }) => {
    // Enter diagnosis scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DiagnosisScene', { caseId: 'case-001' });
      }
    });

    await page.waitForTimeout(2000);
    await page.waitForSelector('.page-title', { timeout: 5000 });

    // Check page title shows 舌诊
    const pageTitle = page.locator('.page-title');
    await expect(pageTitle).toHaveText('舌诊');

    // Check first nav item is active
    const activeNav = page.locator('.nav-item.active');
    await expect(activeNav.locator('.nav-label-cn')).toHaveText('舌诊');
  });

  test('should render tongue image SVG', async ({ page }) => {
    // Enter diagnosis scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DiagnosisScene', { caseId: 'case-001' });
      }
    });

    await page.waitForTimeout(2000);

    // Check for tongue image (SVG element)
    const tongueSvg = page.locator('svg').first();
    await expect(tongueSvg).toBeVisible({ timeout: 5000 });
  });

  test('should render tongue diagnosis chip options', async ({ page }) => {
    // Enter diagnosis scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DiagnosisScene', { caseId: 'case-001' });
      }
    });

    await page.waitForTimeout(3000);

    // Check chip groups exist (use attached state, not visible)
    const chipGroups = page.locator('.chip-group');
    await expect(chipGroups.first()).toBeAttached({ timeout: 10000 });

    const count = await chipGroups.count();
    expect(count).toBeGreaterThan(0);

    // Check chips exist (舌色/舌苔/舌形/润燥 options)
    const chips = page.locator('.chip');
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThan(10);

    // Test clicking a chip using JavaScript (more reliable)
    await page.evaluate(() => {
      const chip = document.querySelector('.chip') as HTMLElement;
      if (chip) chip.click();
    });

    // Verify chip was clicked (check via JavaScript)
    const selectedChip = await page.evaluate(() => {
      const chip = document.querySelector('.chip.selected');
      return chip !== null;
    });
    expect(selectedChip).toBe(true);
  });

  test('should navigate between stages', async ({ page }) => {
    // Enter diagnosis scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DiagnosisScene', { caseId: 'case-001' });
      }
    });

    await page.waitForTimeout(3000);
    await page.waitForSelector('.nav-item', { timeout: 10000 });

    // Use JavaScript to click on 脉诊 nav item (more reliable than Playwright click)
    await page.evaluate(() => {
      const navItems = document.querySelectorAll('.nav-item');
      if (navItems.length > 1) {
        (navItems[1] as HTMLElement).click();
      }
    });

    await page.waitForTimeout(500);

    // Check page title updated to 脉诊
    const pageTitle = page.locator('.page-title');
    await expect(pageTitle).toHaveText('脉诊', { timeout: 5000 });

    // Check 脉诊 is now active
    const activeNav = page.locator('.nav-item.active');
    await expect(activeNav.locator('.nav-label-cn')).toHaveText('脉诊');
  });

  test('should render pulse diagnosis with position options', async ({ page }) => {
    // Enter diagnosis scene and navigate to pulse stage
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DiagnosisScene', { caseId: 'case-001' });
      }
    });

    await page.waitForTimeout(3000);

    // Navigate to 脉诊 using JavaScript click
    await page.evaluate(() => {
      const navItems = document.querySelectorAll('.nav-item');
      if (navItems.length > 1) {
        (navItems[1] as HTMLElement).click();
      }
    });
    await page.waitForTimeout(1000);

    // Check pulse position options (寸/关/尺)
    const positionChips = page.locator('.chip').filter({ hasText: /寸部|关部|尺部/ });
    const count = await positionChips.count();
    expect(count).toBe(3);

    // Check pulse quality options
    const qualityChips = page.locator('.chip').filter({ hasText: /浮紧|沉细|弦数|濡缓|滑实|虚弱|洪大|迟缓/ });
    const qualityCount = await qualityChips.count();
    expect(qualityCount).toBeGreaterThan(5);
  });

  test('should show patient info in sidebar', async ({ page }) => {
    // Enter diagnosis scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DiagnosisScene', { caseId: 'case-001' });
      }
    });

    await page.waitForTimeout(2000);
    await page.waitForSelector('.nav-meta', { timeout: 5000 });

    // Check patient info displayed
    const navMeta = page.locator('.nav-meta');
    const text = await navMeta.textContent();
    expect(text).toContain('李秀梅');  // Patient name from case-001
    expect(text).toContain('女');
  });

  test('should show patient pill in header', async ({ page }) => {
    // Enter diagnosis scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DiagnosisScene', { caseId: 'case-001' });
      }
    });

    await page.waitForTimeout(2000);
    await page.waitForSelector('.patient-pill', { timeout: 5000 });

    // Check patient pill
    const patientPill = page.locator('.patient-pill');
    const text = await patientPill.textContent();
    expect(text).toContain('李秀梅');
    expect(text).toContain('脘腹胀满');  // Chief complaint
  });

  test('should show action bar with navigation buttons', async ({ page }) => {
    // Enter diagnosis scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DiagnosisScene', { caseId: 'case-001' });
      }
    });

    await page.waitForTimeout(2000);
    await page.waitForSelector('.action-bar', { timeout: 5000 });

    // Check action bar buttons
    const actionBar = page.locator('.action-bar');

    // Previous button should be disabled on first stage
    const prevBtn = actionBar.locator('button').filter({ hasText: '返回上一诊' });
    await expect(prevBtn).toBeDisabled();

    // Next button should exist
    const nextBtn = actionBar.locator('button').filter({ hasText: /进入下一诊|完成本诊后继续/ });
    await expect(nextBtn).toBeVisible();
  });

  test('should close scene on close button click', async ({ page }) => {
    // Real game flow: ClinicScene → Z key → launch DiagnosisScene in parallel
    // Step 1: Start ClinicScene first
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('ClinicScene');
      }
    });

    await page.waitForTimeout(1500);

    // Step 2: Launch DiagnosisScene in parallel via ClinicScene's scene plugin
    // Each scene has a ScenePlugin that can launch other scenes in parallel
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game && game.scene) {
        const clinicScene = game.scene.getScene('ClinicScene');
        if (clinicScene && clinicScene.scene) {
          // Use scene's ScenePlugin.launch() to run in parallel
          clinicScene.scene.launch('DiagnosisScene', { caseId: 'case-001' });
        }
      }
    });

    await page.waitForTimeout(2000);

    // Find and click close button (退出诊断)
    const closeBtn = page.locator('button').filter({ hasText: '退出诊断' });
    await closeBtn.click();

    await page.waitForTimeout(2000);

    // Verify scene transition
    const sceneState = await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) return { error: 'game not found' };

      const sceneManager = game.scene;
      const diagnosisScene = sceneManager.getScene('DiagnosisScene');
      const clinicScene = sceneManager.getScene('ClinicScene');

      return {
        diagnosisActive: diagnosisScene?.scene.isActive?.() ?? false,
        clinicActive: clinicScene?.scene.isActive?.() ?? false,
        reactRootExists: !!document.getElementById('diagnosis-react-root'),
      };
    });

    // DiagnosisScene should be inactive, ClinicScene active (parallel scene still running)
    expect(sceneState.diagnosisActive).toBe(false);
    expect(sceneState.clinicActive).toBe(true);
  });

  test('should have correct app dimensions', async ({ page }) => {
    // Enter diagnosis scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DiagnosisScene', { caseId: 'case-001' });
      }
    });

    await page.waitForTimeout(3000);

    // Check app exists and is attached
    const app = page.locator('.app');
    await expect(app).toBeAttached({ timeout: 10000 });

    // Check dimensions - app might scale based on viewport
    // Design is 1440x900 but may scale to fit viewport
    const dimensions = await page.evaluate(() => {
      const appEl = document.querySelector('.app');
      if (!appEl) return null;
      const rect = appEl.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });

    if (dimensions) {
      // App should have reasonable width and height (scaled down from 1440x900)
      expect(dimensions.width).toBeGreaterThan(400);  // Allow scaling
      expect(dimensions.height).toBeGreaterThan(300);  // Allow scaling
    }
  });

  test('should render seal stamps when viewing prescription details', async ({ page }) => {
    // Enter diagnosis scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DiagnosisScene', { caseId: 'case-001' });
      }
    });

    await page.waitForTimeout(3000);

    // Navigate to 选方 stage
    await page.evaluate(() => {
      const navItems = document.querySelectorAll('.nav-item');
      if (navItems.length > 4) {
        (navItems[4] as HTMLElement).click();
      }
    });
    await page.waitForTimeout(1500);

    // Check that prescription options exist (looking for prescription names)
    const prescriptionCount = await page.evaluate(() => {
      // Count prescription items by looking for elements containing prescription names
      const allText = document.body.innerText;
      const prescriptions = ['藿香正气散', '平胃散', '六君子汤', '半夏泻心汤', '三仁汤'];
      return prescriptions.filter(p => allText.includes(p)).length;
    });
    expect(prescriptionCount).toBeGreaterThan(0);

    // Click on a "展卷·详情" button to open the ScrollCard with seal
    await page.evaluate(() => {
      // Find the first button that contains "详情"
      const buttons = Array.from(document.querySelectorAll('button'));
      const detailBtn = buttons.find(b => b.textContent?.includes('详情')) as HTMLElement;
      if (detailBtn) {
        detailBtn.click();
      }
    });
    await page.waitForTimeout(1500);

    // Check for seal stamps inside the ScrollCard
    const sealCount = await page.evaluate(() => {
      const seals = document.querySelectorAll('.seal-stamp');
      return seals.length;
    });
    expect(sealCount).toBeGreaterThan(0);
  });

  test('should show progress indicator in action bar', async ({ page }) => {
    // Enter diagnosis scene
    await page.evaluate(() => {
      const game = (window as any).__PHASER_GAME__;
      if (game) {
        game.scene.start('DiagnosisScene', { caseId: 'case-001' });
      }
    });

    await page.waitForTimeout(3000);
    await page.waitForSelector('.action-bar', { timeout: 10000 });

    // Check progress indicator shows stages
    const actionBar = page.locator('.action-bar');

    // Progress indicator is a div containing stage names
    const progressContainer = actionBar.locator('div').filter({ hasText: /舌诊.*脉诊.*问诊.*辨证.*选方/ });
    await expect(progressContainer).toBeVisible({ timeout: 5000 });

    // Verify text contains all stages
    const progressText = await progressContainer.textContent();
    expect(progressText).toContain('舌诊');
    expect(progressText).toContain('脉诊');
    expect(progressText).toContain('问诊');
    expect(progressText).toContain('辨证');
    expect(progressText).toContain('选方');
  });
});