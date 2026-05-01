# E2E 测试核心教训汇总

**日期**: 2026-04-29
**关键词**: E2E测试陷阱、CSS加载验证、真实用户路径、弹窗尺寸

---

## 1. E2E测试陷阱：`toBeVisible()` 只检查DOM存在

**问题**: CSS未导入导致UI空白，但测试报告100%通过。

**根本原因**: `toBeVisible()` 只检查元素在DOM中存在，不验证实际渲染尺寸和样式。

**正确做法**:
```typescript
// ❌ 错误：只检查DOM存在
await expect(element).toBeVisible();

// ✅ 正确：必须验证尺寸和样式
await expect(element).toBeAttached();
const box = await element.boundingBox();
expect(box?.width).toBeGreaterThan(100);  // 尺寸验证
const bg = await element.evaluate(el => getComputedStyle(el).background);
expect(bg).not.toBe('none');  // 样式验证
```

---

## 2. CSS加载验证强制

**问题**: CSS文件导入缺失，UI完全空白。

**正确做法**:
```typescript
// 必须检查CSS是否实际加载
const styleSheets = await page.evaluate(() => document.styleSheets.length);
expect(styleSheets).toBeGreaterThan(1);

// 或检查CSS变量生效
const paperColor = await page.evaluate(() =>
  getComputedStyle(document.documentElement).getPropertyValue('--paper')
);
expect(paperColor.trim()).toBeTruthy();
```

---

## 3. 真实用户路径

**问题**: 测试直接跳转场景，绕过了真实游戏流程，隐藏了入口触发问题。

**正确做法**:
```typescript
// ❌ 错误：直接跳转场景
await page.evaluate(() => game.scene.start('DiagnosisScene', { caseId }));

// ✅ 正确：模拟真实操作
await page.goto('/');
await page.waitForTimeout(2000);
await page.keyboard.press('z');  // 真实按键触发
```

---

## 4. 弹窗尺寸规范

**问题**: 弹窗与游戏视窗同尺寸，视觉上没有边距感。

**正确做法**:
```css
/* ❌ 错误：弹窗与游戏视窗同尺寸 */
.modal { width: 1280px; height: 720px; }

/* ✅ 正确：弹窗比游戏视窗小10-15% */
.modal { width: 1020px; height: 640px; }  /* 留边距 */
```

---

## 5. 功能合并后清理

**问题**: 功能合并后旧场景残留，导致代码混乱。

**正确做法**:
```typescript
// 功能合并后必须：
// 1. 从 game.config.ts 移除旧场景
// 2. 更新入口场景引用
// 3. 在旧文件添加 @deprecated 注释
```

---

## 一句话总结

**测试通过了≠用户能用了。必须验证尺寸、样式、真实路径。**