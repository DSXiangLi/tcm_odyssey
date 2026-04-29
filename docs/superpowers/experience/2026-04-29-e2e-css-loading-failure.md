# 自动化测试防坑原则

**创建日期**: 2026-04-29
**触发事件**: 诊断游戏CSS未导入，UI完全不可见，但E2E测试报告100%通过

---

## 核心教训

**现象**: 诊断游戏CSS文件未在React组件中导入(`import './diagnosis.css'`)，导致：
- 用户看到：只显示"退出诊断"4个字，其他UI完全不可见
- 测试报告：14/14测试通过，AI视觉验收82.5分

**根本原因**: `toBeVisible()` 和 `toBeAttached()` 只检查DOM存在，不检查元素实际渲染状态。

---

## 一、E2E测试陷阱识别

### 陷阱1: `toBeVisible()` 的误解

| 方法 | 实际检查 | 不检查 |
|------|---------|--------|
| `toBeVisible()` | 元素在DOM中 + 无hidden属性 | 元素尺寸、颜色、位置 |
| `toBeAttached()` | 元素在DOM中 | 任何渲染属性 |
| `toBeEnabled()` | 元素无disabled属性 | 是否可交互 |

**结论**: 元素"存在" ≠ 元素"可见" ≠ 元素"可交互"

### 陷阱2: CSS加载验证缺失

测试通常检查：
```typescript
await expect(element).toBeVisible();  // ✅ DOM存在
```

测试很少检查：
```typescript
const box = await element.boundingBox();
expect(box?.width).toBeGreaterThan(100);  // ❌ 未检查实际尺寸
```

### 陷阱3: 依赖设计稿而非实际渲染

AI视觉验收基于：
- CSS样式代码分析 → 假设"代码存在=效果生效"
- 截图分析 → 但截图可能捕获的是空白状态

---

## 二、测试原则（强制执行）

### 原则1: 尺寸验证强制

**每个视觉元素测试必须包含尺寸验证**：

```typescript
// ❌ 错误写法
await expect(element).toBeVisible();

// ✅ 正确写法
await expect(element).toBeVisible();
const box = await element.boundingBox();
expect(box?.width).toBeGreaterThan(50);
expect(box?.height).toBeGreaterThan(30);
```

**阈值参考**：
| 元素类型 | 最小宽度 | 最小高度 |
|---------|---------|---------|
| 容器(.app) | 400px | 300px |
| 导航栏(.sidebar) | 150px | 200px |
| 按钮(.btn) | 50px | 30px |
| 文本(.page-title) | 100px | 20px |

### 原则2: CSS加载验证

**必须验证CSS文件已加载**：

```typescript
// 方法A: 检查关键样式属性
const bgColor = await element.evaluate(el =>
  window.getComputedStyle(el).backgroundColor
);
expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');  // 非透明

// 方法B: 检查CSS变量生效
const paperColor = await page.evaluate(() =>
  getComputedStyle(document.documentElement).getPropertyValue('--paper')
);
expect(paperColor.trim()).toBe('#f1e6cc');

// 方法C: 检查样式表数量
const styleSheets = await page.evaluate(() =>
  document.styleSheets.length
);
expect(styleSheets).toBeGreaterThan(1);
```

### 原则3: 截图质量验证

**截图验收必须验证非空白**：

```typescript
// 截图后检查是否有内容
const screenshot = await page.screenshot();
const buffer = screenshot;

// 检查截图非全黑/全白（简单像素分析）
const hasContent = await page.evaluate(() => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // ... 分析像素分布
  return true;
});
expect(hasContent).toBe(true);
```

### 原则4: 真实用户路径测试

**测试必须模拟真实用户操作路径**：

```typescript
// ❌ 错误：直接跳转到场景
await page.evaluate(() => {
  game.scene.start('DiagnosisScene', { caseId: 'case-001' });
});

// ✅ 正确：模拟真实入口
await page.goto('/');
await page.waitForTimeout(2000);  // 等待游戏加载
await page.keyboard.press('ArrowDown');  // 移动到诊所门
await page.keyboard.press('Enter');  // 进入诊所
await page.keyboard.press('z');  // Z键触发诊断
await page.waitForTimeout(2000);  // 等待React渲染
```

### 原则5: 多维度交叉验证

**单一断言不可信，必须交叉验证**：

```typescript
// 验证同一个元素的多个维度
const sidebar = page.locator('.sidebar');

// 1. DOM存在
await expect(sidebar).toBeAttached();

// 2. 视觉可见
await expect(sidebar).toBeVisible();

// 3. 尺寸正常
const box = await sidebar.boundingBox();
expect(box?.width).toBeGreaterThan(150);

// 4. 样式生效
const bg = await sidebar.evaluate(el =>
  getComputedStyle(el).background
);
expect(bg).toContain('linear-gradient');  // 验证渐变背景

// 5. 内容存在
const text = await sidebar.textContent();
expect(text).toContain('悬壶');
```

---

## 三、AI视觉验收改进

### 现有问题

AI视觉验收只分析了：
1. CSS代码是否存在 → 不等于CSS是否生效
2. 设计规范是否定义 → 不等于实现是否正确

### 改进方案

1. **真实截图分析**: 确保截图是在CSS加载后捕获
2. **像素密度检测**: 检查截图是否有足够的非空白像素
3. **颜色分布分析**: 检查截图是否符合CSS定义的色系

---

## 四、测试报告诚实原则

### 问题

测试报告声称：
- E2E测试: 100%通过 (14/14)
- AI视觉: 82.5分
- 结论: 验收通过

但实际：
- 用户看到空白UI
- CSS未导入
- 测试未发现问题

### 原则

**测试报告必须诚实标注局限性**：

```markdown
## 测试局限性声明

1. 本测试未验证CSS文件是否正确导入
2. 本测试未验证元素实际渲染尺寸
3. 本测试未验证样式属性是否生效
4. AI视觉验收基于CSS代码分析，未验证真实渲染效果

**建议**: 执行真实用户路径手动测试确认
```

---

## 五、测试代码自检清单

每次编写E2E测试时，必须检查：

- [ ] 是否包含`boundingBox()`尺寸验证？
- [ ] 是否验证CSS样式属性生效？
- [ ] 是否模拟真实用户路径（而非直接跳转）？
- [ ] 是否等待足够时间让React完成渲染？
- [ ] 是否交叉验证多个维度？

---

## 六、本次失败复盘

| 问题 | 测试未检测 | 应检测 |
|------|----------|--------|
| CSS未导入 | 未检查样式表加载 | `document.styleSheets.length` |
| 元素无宽度 | 只检查`toBeVisible` | `boundingBox().width > 0` |
| 元素无颜色 | 未检查样式属性 | `getComputedStyle(el).background` |

**一句话总结**: 测试通过了，但测试测的东西和用户看到的东西不是同一件事。

---

## 七、改进后的测试模板

```typescript
test('should render UI correctly', async ({ page }) => {
  // 1. 真实用户路径
  await page.goto('/');
  await simulateUserJourney(page);  // 模拟真实操作

  // 2. 等待渲染完成
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // 3. DOM + 尺寸 + 样式交叉验证
  const element = page.locator('.app');
  await expect(element).toBeAttached();
  const box = await element.boundingBox();
  expect(box?.width, '元素宽度应大于400').toBeGreaterThan(400);
  expect(box?.height, '元素高度应大于300').toBeGreaterThan(300);

  // 4. CSS验证
  const styles = await element.evaluate(el => {
    const computed = getComputedStyle(el);
    return {
      background: computed.background,
      width: computed.width,
      display: computed.display
    };
  });
  expect(styles.display).not.toBe('none');
  expect(styles.width).not.toBe('0px');

  // 5. 截图验证（可选）
  const screenshot = await element.screenshot();
  // 分析截图非空白...
});
```

---

*本文档由 Phase 2.5 诊断游戏验收失败事件触发创建*
*日期: 2026-04-29*