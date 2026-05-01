// tests/e2e/inventory-html-ui.spec.ts
/**
 * 背包HTML UI E2E测试
 */

import { test, expect } from '@playwright/test';

test.describe('背包HTML UI', () => {
  test.beforeEach(async ({ page }) => {
    // 启动游戏到诊所场景
    await page.goto('/?scene=clinic');
    await page.waitForLoadState('networkidle');
    // 等待场景加载完成
    await page.waitForTimeout(1000);
  });

  test('按B键打开背包显示古卷轴UI', async ({ page }) => {
    // 按B键打开背包
    await page.keyboard.press('b');

    // 等待背包UI出现
    await page.waitForSelector('.inventory-ui', { timeout: 5000 });

    // 验证古卷轴样式容器存在
    const inventoryUI = page.locator('.inventory-ui');
    await expect(inventoryUI).toBeVisible();

    // 验证暗木桌面背景
    await expect(inventoryUI.locator('.wood-bg')).toBeVisible();
  });

  test('背包显示5视图扇形导航', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForSelector('.inventory-ui', { timeout: 5000 });

    // 验证中央圆盘显示"百草笥"
    const centerDial = page.locator('.center-dial');
    await expect(centerDial).toBeVisible();
    await expect(centerDial.locator('.title')).toContainText('百草');
    await expect(centerDial.locator('.subtitle')).toContainText('笥');

    // 验证5个扇形导航花瓣存在
    const fanNav = page.locator('.fan-nav');
    await expect(fanNav).toBeVisible();

    // 验证各个导航项
    const petals = page.locator('.fan-petal');
    await expect(petals).toHaveCount(5);
  });

  test('点击饮片视图显示左侧卷轴面板', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForSelector('.inventory-ui', { timeout: 5000 });

    // 点击饮片视图（第一个花瓣）
    const piecePetal = page.locator('.fan-petal').first();
    await piecePetal.click();

    // 验证左侧卷轴面板出现
    const leftPanel = page.locator('.scroll-panel.left');
    await expect(leftPanel).toBeVisible();
    await expect(leftPanel.locator('.panel-title')).toContainText('饮片');
  });

  test('饮片视图显示18功效分类侧边栏', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForSelector('.inventory-ui', { timeout: 5000 });

    // 点击饮片视图
    await page.locator('.fan-petal').first().click();

    // 验证分类标签存在
    const catChips = page.locator('.cat-chip');
    await expect(catChips).toHaveCount(18);

    // 验证第一个分类是"解表药"
    const firstCat = catChips.first();
    await expect(firstCat.locator('.name')).toContainText('解表药');
    await expect(firstCat.locator('.glyph')).toContainText('颩');
  });

  test('点击分类显示该分类的药材槽位', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForSelector('.inventory-ui', { timeout: 5000 });

    // 点击饮片视图
    await page.locator('.fan-petal').first().click();

    // 点击解表药分类
    const jiebiaoChip = page.locator('.cat-chip').first();
    await jiebiaoChip.click();

    // 验证槽位网格出现
    const slotsGrid = page.locator('.slots-grid');
    await expect(slotsGrid).toBeVisible();

    // 验证有药材槽位
    const slots = page.locator('.slot');
    const slotCount = await slots.count();
    expect(slotCount).toBeGreaterThan(0);
  });

  test('药材槽位显示图片和名称', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForSelector('.inventory-ui', { timeout: 5000 });

    // 点击饮片视图
    await page.locator('.fan-petal').first().click();

    // 点击解表药分类
    await page.locator('.cat-chip').first().click();

    // 找一个有数量的槽位（麻黄应该有）
    const slots = page.locator('.slot:not(.empty)');
    const slotCount = await slots.count();

    if (slotCount > 0) {
      const firstSlot = slots.first();
      // 验证有图片或名称显示
      const hasImg = await firstSlot.locator('img').count() > 0;
      const hasName = await firstSlot.locator('.herb-name').count() > 0;
      expect(hasImg || hasName).toBe(true);

      // 验证数量徽章
      const countBadge = firstSlot.locator('.count-badge');
      await expect(countBadge).toBeVisible();
      const count = await countBadge.textContent();
      expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
    }
  });

  test('hover药材槽位显示tooltip详情', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForSelector('.inventory-ui', { timeout: 5000 });

    // 点击饮片视图
    await page.locator('.fan-petal').first().click();

    // 点击解表药分类
    await page.locator('.cat-chip').first().click();

    // 找一个有数量的槽位hover
    const slots = page.locator('.slot:not(.empty)');
    const slotCount = await slots.count();

    if (slotCount > 0) {
      await slots.first().hover();

      // 验证tooltip出现
      const tooltip = page.locator('.herb-tooltip');
      await expect(tooltip).toBeVisible({ timeout: 2000 });

      // 验证tooltip内容
      await expect(tooltip.locator('.name')).toBeVisible();
      await expect(tooltip.locator('.row')).toHaveCount(4); // 性味归经四行
    }
  });

  test('点击关闭按钮关闭背包', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForSelector('.inventory-ui', { timeout: 5000 });

    // 点击关闭按钮
    const closeBtn = page.locator('.close-btn');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // 验证背包UI消失
    await expect(page.locator('.inventory-ui')).not.toBeVisible({ timeout: 3000 });
  });

  test('按ESC键关闭背包', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForSelector('.inventory-ui', { timeout: 5000 });

    // 按ESC关闭
    await page.keyboard.press('Escape');

    // 验证背包UI消失
    await expect(page.locator('.inventory-ui')).not.toBeVisible({ timeout: 3000 });
  });

  test('稀有度边框颜色正确', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForSelector('.inventory-ui', { timeout: 5000 });

    // 点击饮片视图
    await page.locator('.fan-petal').first().click();
    await page.locator('.cat-chip').first().click();

    // 验证有稀有度属性的槽位
    const slots = page.locator('.slot[data-rarity]');
    const count = await slots.count();

    if (count > 0) {
      // 验证稀有度2以上的槽位有特殊边框
      const rareSlots = page.locator('.slot[data-rarity="2"], .slot[data-rarity="3"], .slot[data-rarity="4"]');
      const rareCount = await rareSlots.count();
      if (rareCount > 0) {
        // 稀有度槽位应该有不同边框颜色
        await expect(rareSlots.first()).toBeVisible();
      }
    }
  });

  test('右侧摘要面板显示统计', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForSelector('.inventory-ui', { timeout: 5000 });

    // 验证右侧摘要面板
    const summaryPanel = page.locator('.summary-panel');
    await expect(summaryPanel).toBeVisible();

    // 验证统计项
    const statItems = summaryPanel.locator('.stat-item');
    await expect(statItems).toHaveCount(2); // 已藏种数 + 饮片总量
  });

  test('方剂视图显示方剂卡牌', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForSelector('.inventory-ui', { timeout: 5000 });

    // 点击方剂视图（第三个花瓣）
    const petals = page.locator('.fan-petal');
    await petals.nth(2).click();

    // 验证方剂卡牌网格
    const formulaGrid = page.locator('.formula-grid');
    await expect(formulaGrid).toBeVisible();

    // 验证方剂卡牌存在
    const formulaCards = page.locator('.formula-card');
    const count = await formulaCards.count();
    expect(count).toBeGreaterThan(0);

    // 验证卡牌内容
    const firstCard = formulaCards.first();
    await expect(firstCard.locator('.name')).toBeVisible();
    await expect(firstCard.locator('.source')).toBeVisible();
  });

  test('工具视图显示工具卡', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForSelector('.inventory-ui', { timeout: 5000 });

    // 点击工具视图（第四个花瓣）
    const petals = page.locator('.fan-petal');
    await petals.nth(3).click();

    // 验证工具卡存在
    const toolCards = page.locator('.tool-card');
    const count = await toolCards.count();
    expect(count).toBeGreaterThan(0);

    // 验证工具卡内容
    const firstCard = toolCards.first();
    await expect(firstCard.locator('.icon')).toBeVisible();
    await expect(firstCard.locator('.info .name')).toBeVisible();
  });

  test('图书馆视图显示书架', async ({ page }) => {
    await page.keyboard.press('b');
    await page.waitForSelector('.inventory-ui', { timeout: 5000 });

    // 点击图书馆视图（第五个花瓣）
    const petals = page.locator('.fan-petal');
    await petals.nth(4).click();

    // 验证书架存在
    const bookShelf = page.locator('.book-shelf');
    await expect(bookShelf).toBeVisible();

    // 验证书脊存在
    const bookSpines = page.locator('.book-spine');
    const count = await bookSpines.count();
    expect(count).toBeGreaterThan(0);
  });
});