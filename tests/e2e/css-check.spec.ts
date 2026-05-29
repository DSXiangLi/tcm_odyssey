import { test, expect } from '@playwright/test';

test('Check if dialog.css is loaded', async ({ page }) => {
  await page.goto('http://localhost:3000/?scene=clinic');
  await page.waitForTimeout(5000);
  await page.waitForSelector('.dialog-root', { timeout: 30000 });
  
  // 检查 CSS 变量是否加载
  const cssVars = await page.evaluate(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    return {
      paper: styles.getPropertyValue('--paper'),
      vermilion: styles.getPropertyValue('--vermilion'),
    };
  });
  
  console.log('CSS Variables:', cssVars);
  
  // 检查 .tool-card 样式是否存在
  const toolCardStyles = await page.evaluate(() => {
    // 创建一个测试元素
    const testDiv = document.createElement('div');
    testDiv.className = 'tool-card';
    testDiv.style.display = 'none';
    document.body.appendChild(testDiv);
    
    const styles = getComputedStyle(testDiv);
    const result = {
      background: styles.background,
      border: styles.border,
      borderRadius: styles.borderRadius,
    };
    
    document.body.removeChild(testDiv);
    return result;
  });
  
  console.log('Tool Card CSS styles:', toolCardStyles);
  
  // 验证 CSS 变量存在
  expect(cssVars.paper).toBeTruthy();
});
