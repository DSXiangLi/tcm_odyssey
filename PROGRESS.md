# 药灵山谷 - 当前任务跟踪

**最后更新**: 2026-05-04
**当前状态**: Phase 2.5 背包已完成，等待下一步任务

---

## 下一步行动建议

1. 实现 neighbor NPC (HomeScene集成)
2. 开始 Phase 2.5 种植小游戏
3. 开始 Phase 2.5 炮制小游戏
4. 生产环境替换 MockGameStore 为真实数据库

---

## 已完成：背包UI (Phase 2.5)

### E2E测试完成 (2026-05-04)

**测试结果**: 14/14 首次运行通过，42/42稳定性验证 (3次重复)

**技术改进**:
- 添加`__RESET_INVENTORY_STATE__`函数重置背包状态
- 添加`__OPEN_INVENTORY__`函数直接打开背包
- 添加canvas tabindex属性确保可获取焦点
- InventoryUI卸载时焦点返回canvas

**测试覆盖功能**: B键打开、5视图导航、18功效分类、药材槽位、tooltip、ESC/点击关闭等14项

### 背包UI迁移 (2026-05-01)

**实现内容**:
- 古卷轴风格React组件（透明背景嵌入主游戏）
- 5视图扇形导航（饮片/原药/方剂/工具/图书馆）
- 18功效分类侧边栏 + 86味药材数据
- 稀有度边框样式 + Tooltip详情

**新增文件**: `src/ui/html/inventory.css`, `InventoryUI.tsx`, `inventory-entry.tsx`, `inventory-herbs.ts`, `inventory-events.ts`

---

*本文档由 Claude Code 维护*