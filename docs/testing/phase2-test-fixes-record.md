# Phase 2 测试修复记录

> **目的**: 记录Phase 2每个测试问题的诊断过程、根本原因和修复方案，避免反复修改同一问题

> **文档位置**: `docs/testing/phase2-test-fixes-record.md`

---

## BUG-001: Phaser场景切换返回错误场景 (2026-04-16)

### 问题表现

- 测试调用 `navigateToScene('ClinicScene')` 后
- `getGameState()` 返回 `TitleScene` 而非预期的 `ClinicScene`
- 所有等待条件都通过，无异常抛出
- 测试日志显示：`executeOperations completed successfully`，但状态仍是 `TitleScene`

### 诊断过程

**Step 1: 添加诊断日志**
```typescript
// 在 navigateToScene 中添加场景状态检查
const beforeState = await this.page.evaluate(() => {
  const game = (window as any).__PHASER_GAME__;
  return game.scene.scenes.map((s: any) => ({
    key: s.scene?.key || s.key,
    isActive: game.scene.isActive(s.scene?.key || s.key)
  }));
});
console.log('[DEBUG] Before scene.start:', JSON.stringify(beforeState));
```

**Step 2: 分析诊断输出**
```
Before: TitleScene isActive:true, ClinicScene isActive:false
After:  TitleScene isActive:true, ClinicScene isActive:true  ← 关键发现！
```

**Step 3: 关键发现**
- `game.scene.start('ClinicScene')` 启动了 ClinicScene
- 但 TitleScene **仍然保持 isActive=true**
- **Phaser允许多个场景同时 isActive=true**

### 根本原因

**Phaser场景管理机制**:
- `game.scene.start()` 不自动停止之前活跃的场景
- Phaser设计允许多个场景并行运行（用于UI层、背景层等）
- `getGameState()` 遍历场景数组返回第一个 `isActive=true` 的场景
- TitleScene 在数组中排在 ClinicScene 前面，所以总是返回 TitleScene

**相关Phaser文档**:
- Phaser Scene Manager可以同时运行多个场景
- 使用 `scene.stop()` 显式停止场景
- 使用 `scene.switch()` 自动停止当前场景并启动新场景

### 修复方案

**方案选择**: 使用 `stop()` + `start()` 组合，而非 `switch()`
- `switch()` 只停止"当前"场景，不确定哪个是当前
- `stop()` + `start()` 更可控，明确停止所有活跃场景

**代码实现**:
```typescript
// tests/visual_acceptance/scene_operations.ts:71-93

async navigateToScene(sceneName: string): Promise<void> {
  // 重置全局状态
  await this.page.evaluate(() => {
    (window as any).__SCENE_READY__ = false;
    (window as any).__GAME_READY__ = false;
    (window as any).__DIALOG_ACTIVE__ = false;
    (window as any).__STREAMING__ = false;
  });

  // 【关键修复】先停止所有活跃场景
  await this.page.evaluate(() => {
    const game = (window as any).__PHASER_GAME__;
    if (game) {
      for (const s of game.scene.scenes) {
        const key = s.scene?.key || s.key;
        if (key && game.scene.isActive(key)) {
          game.scene.stop(key);  // 停止旧场景
        }
      }
    }
  });

  // 等待旧场景完全停止
  await this.page.waitForTimeout(300);

  // 启动目标场景
  await this.page.evaluate((name) => {
    const game = (window as any).__PHASER_GAME__;
    if (game) {
      game.scene.start(name);
    }
  }, sceneName);

  // 等待场景激活
  await this.page.waitForFunction(
    (key) => {
      const game = (window as any).__PHASER_GAME__;
      if (!game) return false;
      return game.scene.isActive(key);
    },
    sceneName,
    { timeout: 15000 }
  );

  // 等待场景完全创建
  await this.page.waitForFunction(
    () => (window as any).__SCENE_READY__ === true,
    { timeout: 15000 }
  );
}
```

### 修改文件

| 文件 | 修改内容 |
|-----|---------|
| `tests/visual_acceptance/scene_operations.ts` | navigateToScene 添加 stop 活跃场景逻辑 |

### 验证结果

| 测试 | 修复前 | 修复后 |
|-----|-------|-------|
| SCENE-02 | ❌ 返回 TitleScene | ✅ 返回 ClinicScene |
| NPC-01 | ❌ 场景切换失败 | ✅ 场景切换成功 |

### 相关知识点

**Phaser场景API对比**:
| API | 行为 | 适用场景 |
|-----|------|---------|
| `start(key)` | 启动场景，不停止其他场景 | 多场景并行（UI层） |
| `stop(key)` | 停止指定场景 | 显式清理 |
| `switch(key)` | 停止当前场景，启动新场景 | 单场景切换 |
| `launch(key)` | 并行启动场景（不停止其他） | 弹窗、覆盖层 |
| `sleep(key)` | 暂停场景（保留状态） | 暂时隐藏 |
| `wake(key)` | 恢复暂停的场景 | 从暂停恢复 |

**测试场景切换最佳实践**:
- 停止所有活跃场景 → 确保干净状态
- 等待300ms → 确保完全停止
- 启动目标场景
- 等待 isActive → 确保启动完成
- 等待 __SCENE_READY__ → 确保create()完成

---

## 记录模板

每次修复测试问题后，按以下模板记录：

```markdown
## BUG-XXX: [问题名称] (日期)

### 问题表现
- [具体的错误信息、测试失败表现]
- [错误日志关键片段]

### 诊断过程
**Step 1**: [第一个诊断步骤]
**Step 2**: [第二个诊断步骤]
**Step N**: [关键发现]

### 根本原因
- [深入分析后的根本原因]
- [相关技术知识点]

### 修复方案
**方案选择**: [为什么选择这个方案]
**代码实现**: [具体的代码修改片段]

### 修改文件
| 文件 | 修改内容 |
|-----|---------|

### 验证结果
| 测试 | 修复前 | 修复后 |
|-----|-------|-------|

### 相关知识点
[与该问题相关的技术知识、API文档、最佳实践]
```

---

*本文档由 Claude Code 维护，用于记录测试修复经验*