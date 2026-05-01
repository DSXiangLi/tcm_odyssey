# 药灵山谷 - 当前任务跟踪

**最后更新**: 2026-05-01
**当前状态**: Phase 2.5 背包UI迁移完成

---

## 已完成：背包UI迁移 (2026-05-01)

### 实现内容
- 古卷轴风格React组件替代Phaser Graphics实现
- 5视图扇形导航（饮片/原药/方剂/工具/图书馆）
- 18功效分类侧边栏
- 86味药材数据（迁移自docs/ui/背包/data.js）
- 25张药材图片嵌入槽位组件
- 稀有度边框样式（常见/精良/珍贵/稀世）
- Tooltip详情显示（性味归经）
- CustomEvent桥接与Phaser通信

### 新增文件
- `src/ui/html/inventory.css` - 古卷轴样式
- `src/ui/html/InventoryUI.tsx` - 主组件（1200行）
- `src/ui/html/inventory-entry.tsx` - React入口
- `src/ui/html/data/inventory-herbs.ts` - 材数据
- `src/ui/html/bridge/inventory-events.ts` - 事件桥接
- `tests/e2e/inventory-html-ui.spec.ts` - E2E测试

### 删除文件
- `src/ui/InventoryUI.ts` - 旧Phaser Graphics实现

---

## 下一步行动建议

1. 运行E2E测试验证背包UI功能
2. 实现 neighbor NPC (HomeScene集成)
3. 开始 Phase 2.5 种植小游戏
4. 生产环境替换 MockGameStore 为真实数据库

---

*本文档由 Claude Code 维护*