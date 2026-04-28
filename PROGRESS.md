# 药灵山谷 - 当前任务跟踪

**最后更新**: 2026-04-29
**当前状态**: Phase 2.5 诊断游戏 HTML 直接迁移核心任务完成

---

## Phase 2.5: 诊断游戏 HTML 直接迁移 ⏳ (核心完成)

**状态**: Phase 1-3 + Phase 6 核心任务完成
**开始日期**: 2026-04-28
**分支**: master (直接开发，无需 feature 分支)
**设计文档**: [诊断游戏HTML迁移设计](docs/superpowers/specs/phase2-5/2026-04-28-diagnosis-html-migration-design.md)
**实现计划**: [诊断游戏HTML迁移计划](docs/superpowers/plans/phase2-5/2026-04-28-diagnosis-html-migration-plan.md)

### 已创建文件清单

| 文件 | 行数 | 功能 |
|------|------|------|
| `src/ui/html/diagnosis.css` | 350+ | 主样式系统（古朴典雅水墨风格） |
| `src/ui/html/data/diagnosis-cases.ts` | 800+ | 病案数据（10个外感类内科病案） |
| `src/ui/html/components/DiagnosisAssets.tsx` | 200+ | SVG资产组件（舌象、患者立绘、印章） |
| `src/ui/html/DiagnosisUI.tsx` | 1000+ | 主应用组件（5阶段Tab导航） |
| `src/ui/html/CaseIntroModal.tsx` | 150+ | 病案简介弹窗组件 |
| `src/ui/html/diagnosis-entry.tsx` | 50+ | React入口函数 |
| `src/ui/html/bridge/diagnosis-events.ts` | 20+ | 桥接事件常量 |
| `src/scenes/DiagnosisScene.ts` | 200+ | Phaser诊断场景 |
| `tests/e2e/diagnosis-html-ui.spec.ts` | 200+ | E2E测试（14个测试场景） |

### Phase 完成状态

| Phase | 状态 | 说明 |
|-------|------|------|
| Phase 1: 设计稿复制 | ✅ 完成 | CSS、病案数据(10个)、Assets组件、主应用合并、病案弹窗 |
| Phase 2: Phaser挂载 | ✅ 完成 | DiagnosisScene创建、React入口创建 |
| Phase 3: 桥接事件 | ✅ 完成 | 诊断事件定义（START/COMPLETE/CLOSE） |
| Phase 4: 入口集成 | ⏳ 待执行 | 病案列表"诊断"按钮、NPC工具入口 |
| Phase 5: 清理废弃 | ⏳ 待执行 | 标记旧场景@deprecated |
| Phase 6: E2E测试 | ✅ 部分 | 4/14测试通过（UI渲染、sidebar、舌诊阶段、SVG渲染） |
| Phase 7: 文档更新 | ⏳ 待执行 | CLAUDE.md/PROGRESS.md更新 |

### TypeScript 编译状态

✅ 编译通过（无错误）

### E2E 测试状态

通过测试：
- `should render diagnosis UI when entering diagnosis scene` ✅
- `should render sidebar with 5 navigation tabs` ✅
- `should show tongue diagnosis stage initially` ✅
- `should render tongue image SVG` ✅

失败测试（viewport相关问题，需后续优化）：
- `should render tongue diagnosis chip options` - 超时
- `should navigate between stages` - 元素在viewport外
- 其他导航和交互测试

### 剩余任务

1. **Phase 4: 入口集成**
   - CasesListUI添加"诊断"按钮
   - ClinicScene监听`diagnosis:start`事件切换场景
   - NPC工具入口（gateway/platforms/game_adapter.py添加start_diagnosis）

2. **Phase 5: 清理废弃**
   - 标记旧场景@deprecated（InquiryScene、PulseScene、TongueScene等）

3. **Phase 7: 文档更新**
   - 更新CLAUDE.md进度摘要

---

## 下一步行动

继续执行：
1. CasesListUI 添加诊断入口
2. 运行完整测试验证
3. 提交代码并更新文档

---

*本文档由 Claude Code 维护，更新于 2026-04-29*