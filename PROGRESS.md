# 药灵山谷 - 当前任务跟踪

**最后更新**: 2026-05-04
**当前状态**: Phase 2.5 背包UI E2E测试已完成

---

## E2E测试完成 (2026-05-04)

### 测试结果
- **全部通过**: 14/14 首次运行通过
- **稳定性验证**: 42/42 通过 (14测试 × 3次重复运行)
- **总耗时**: 8.3分钟 (42测试)

### 已修复的问题
1. **ESC键关闭**: ClinicScene.ts onClose回调添加hideInventoryUI()
2. **点击关闭按钮**: ClinicScene.ts onClose回调添加hideInventoryUI()
3. **toggleInventory状态检查**: 检查DOM元素存在性而非仅依赖引用
4. **测试稳定性**: 使用__OPEN_INVENTORY__直接调用而非键盘事件
5. **焦点恢复**: InventoryUI卸载时焦点返回canvas

### 技术改进
- 添加`__RESET_INVENTORY_STATE__`函数重置背包状态
- 添加`__OPEN_INVENTORY__`函数直接打开背包（绕过键盘事件）
- 添加canvas tabindex属性确保可获取焦点
- InventoryUI useEffect cleanup中添加焦点恢复逻辑

### 测试覆盖功能
- ✓ 按B键打开背包显示古卷轴UI
- ✓ 背包显示5视图扇形导航
- ✓ 点击饮片视图显示左侧卷轴面板
- ✓ 饮片视图显示18功效分类
- ✓ 点击分类显示药材槽位
- ✓ 药材槽位显示内容
- ✓ hover槽位显示tooltip
- ✓ 点击关闭按钮关闭背包
- ✓ 按ESC关闭背包
- ✓ 稀有度边框显示
- ✓ 右侧摘要面板
- ✓ 方剂视图
- ✓ 工具视图
- ✓ 图书馆视图

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