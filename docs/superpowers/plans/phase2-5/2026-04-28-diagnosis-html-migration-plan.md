# 诊断游戏 HTML 直接使用实现计划

**创建日期**: 2026-04-28
**设计文档**: [诊断游戏HTML迁移设计](../specs/phase2-5/2026-04-28-diagnosis-html-migration-design.md)
**核心原则**: 直接使用设计稿，保持原样，只做桥接

---

## 实现原则

**直接使用设计稿，不做拆分重构**
- 设计稿 JSX → 直接合并保留原结构
- 设计稿 CSS → 直接复制使用
- 仅做 Phaser DOM 挂载 + 桥接事件

---

## Phase 1: 设计稿文件复制

### Task 1.1: CSS 直接复制
**源文件**: `docs/ui/诊断游戏/styles.css`
**目标文件**: `src/ui/html/diagnosis.css`
**操作**: 直接复制，删除以下部分：
- `[data-theme="mogreen"]` 主题切换样式
- `[data-theme="blue"]` 主题切换样式
- `[data-fontfamily="kai"]` 字体切换样式
- `[data-fontfamily="fangsong"]` 字体切换样式
- `[data-anim="off"]` 动画切换样式

**保留**: 所有核心样式（导航、布局、chip、输入框、印章、动画等）

---

### Task 1.2: 病案数据直接复制
**源文件**: `docs/ui/诊断游戏/case-data.js`
**目标文件**: `src/ui/html/data/diagnosis-cases.ts`
**操作**:
- 直接复制内容
- 添加 TypeScript 类型定义（参考设计文档数据结构）
- 扩展为 10 个病案（当前只有1个示例）

---

### Task 1.3: Assets 组件直接复制
**源文件**: `docs/ui/诊断游戏/assets.jsx`
**目标文件**: `src/ui/html/components/DiagnosisAssets.tsx`
**操作**:
- 直接复制 JSX 结构
- 将 `window.Seal` 等改为 export 导出
- 保持组件样式不变

---

### Task 1.4: 主应用组件合并复制
**源文件**:
- `docs/ui/诊断游戏/app.jsx`
- `docs/ui/诊断游戏/stage-tongue.jsx`
- `docs/ui/诊断游戏/stage-pulse.jsx`
- `docs/ui/诊断游戏/stage-wenzhen.jsx`
- `docs/ui/诊断游戏/stage-bianzheng.jsx`
- `docs/ui/诊断游戏/stage-xuanfang.jsx`

**目标文件**: `src/ui/html/DiagnosisUI.tsx`
**操作**:
- 将 app.jsx 作为主框架
- 将 5 个 stage-*.jsx 内容直接嵌入（或作为同级组件）
- 保持 JSX 结构不变
- 将 `window.CASE_DATA` 改为从 props 或 import 获取
- 删除 TweaksPanel 相关代码

---

### Task 1.5: 病案弹窗组件复制
**源文件**: `docs/ui/诊断游戏/stage-intro.jsx`（CaseIntroModal 部分）
**目标文件**: `src/ui/html/CaseIntroModal.tsx`
**操作**:
- 直接复制 CaseIntroModal、NpcDoorbell、NpcChat 组件
- NpcDoorbell/NpcChat 暂不使用（门厅背景省略）
- 保持弹窗 JSX 结构不变

---

## Phase 2: Phaser DOM 挂载

### Task 2.1: 诊断场景创建
**文件**: `src/scenes/DiagnosisScene.ts`
**参考**: `src/scenes/DecoctionScene.ts`
**操作**:
- 创建 DOM 容器 `#diagnosis-react-root`
- 挂载 React UI（DiagnosisUI）
- 接收 caseId 参数，传递给 React 组件
- 清理销毁逻辑

---

### Task 2.2: React 入口创建
**文件**: `src/ui/html/diagnosis-entry.tsx`
**参考**: `src/ui/html/decoction-entry.tsx`
**操作**:
- 创建 mountDiagnosisUI / unmountDiagnosisUI 函数
- ReactDOM.createRoot 挂载

---

## Phase 3: 桥接事件

### Task 3.1: 桥接事件定义
**文件**: `src/ui/html/bridge/diagnosis-events.ts`
**内容**:
```typescript
export const DIAGNOSIS_EVENTS = {
  START: 'diagnosis:start',        // 开始诊断（携带 caseId）
  COMPLETE: 'diagnosis:complete',  // 诊断完成（携带结果）
  CLOSE: 'diagnosis:close',        // 关闭诊断游戏
};
```

---

### Task 3.2: React 端事件监听
**文件**: `src/ui/html/DiagnosisUI.tsx`（修改）
**操作**:
- 选方完成时 dispatch CustomEvent `diagnosis:complete`
- 关闭按钮 dispatch CustomEvent `diagnosis:close`
- 监听 `diagnosis:start` 获取 caseId

---

### Task 3.3: Phaser 端事件处理
**文件**: `src/scenes/DiagnosisScene.ts`（修改）
**操作**:
- 监听 `diagnosis:complete` → 存储结果 → 触发 NPC 对话
- 监听 `diagnosis:close` → 清理 UI → 返回场景

---

## Phase 4: 入口集成

### Task 4.1: 病案列表入口
**文件**: `src/ui/CasesListUI.ts`
**操作**:
- 添加"诊断"按钮
- 点击 → EventBus.emit(`diagnosis:start`, { caseId })
- 场景切换到 DiagnosisScene

---

### Task 4.2: NPC 工具入口
**文件**: `gateway/platforms/game_adapter.py`
**操作**:
- 添加 `start_diagnosis` 工具
- 参数: `case_id`
- 调用 → EventBus.emit → 场景切换

---

## Phase 5: 清理废弃

### Task 5.1: 标记废弃文件
**文件**:
- `src/scenes/InquiryScene.ts`
- `src/scenes/PulseScene.ts`
- `src/scenes/TongueScene.ts`
- `src/scenes/DiagnosisPrescriptionScene.ts`

**操作**: 添加 `@deprecated` 注释

---

### Task 5.2: 移除快捷键入口
**文件**: `src/scenes/ClinicScene.ts`
**操作**: 移除问诊快捷键（如有）

---

## Phase 6: E2E 测试

### Task 6.1: 诊断游戏测试
**文件**: `tests/e2e/diagnosis-html-ui.spec.ts`
**测试内容**:
- 病案弹窗显示
- 5阶段导航切换
- 各阶段选项交互
- 完成度判定
- 结果事件触发
- 清理销毁

---

## Phase 7: 文档更新

### Task 7.1: 进度文档更新
**文件**: `PROGRESS.md`, `CLAUDE.md`

---

## 执行顺序

```
Phase 1: 设计稿复制
  Task 1.1 (CSS) → Task 1.2 (数据) → Task 1.3 (Assets) → Task 1.4 (主应用) → Task 1.5 (弹窗)

Phase 2: Phaser 挂载
  Task 2.1 (场景) → Task 2.2 (入口)

Phase 3: 桥接事件
  Task 3.1 (定义) → Task 3.2 (React端) → Task 3.3 (Phaser端)

Phase 4: 入口集成
  Task 4.1 (病案列表) → Task 4.2 (NPC工具)

Phase 5: 清理废弃
  Task 5.1 → Task 5.2

Phase 6: E2E 测试
  Task 6.1

Phase 7: 文档更新
  Task 7.1
```

---

## 文件清单

| 操作 | 源文件 | 目标文件 |
|------|--------|----------|
| 复制 | `docs/ui/诊断游戏/styles.css` | `src/ui/html/diagnosis.css` |
| 复制+扩展 | `docs/ui/诊断游戏/case-data.js` | `src/ui/html/data/diagnosis-cases.ts` |
| 复制 | `docs/ui/诊断游戏/assets.jsx` | `src/ui/html/components/DiagnosisAssets.tsx` |
| 合并复制 | `app.jsx` + 5个stage-* | `src/ui/html/DiagnosisUI.tsx` |
| 复制 | `stage-intro.jsx` (弹窗部分) | `src/ui/html/CaseIntroModal.tsx` |
| 新建 | - | `src/ui/html/diagnosis-entry.tsx` |
| 新建 | - | `src/ui/html/bridge/diagnosis-events.ts` |
| 新建 | - | `src/scenes/DiagnosisScene.ts` |

---

## 验收标准

1. 设计稿 CSS/JXS 结构完整保留
2. 病案弹窗正确显示
3. 5阶段导航切换正确
4. 各阶段选项交互正确
5. 选方完成触发 `diagnosis:complete` 事件
6. 病案列表入口正确触发
7. E2E 测试通过

---

*本文档由 Claude Code 维护，创建于 2026-04-28*