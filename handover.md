# Handover - 2026-05-31

## 下一步指令（明确todo）

**启动后立即执行**:
1. 检查 Hermes-Agent Azure GPT-Image-2 API 最新请求状态 - `tail -100 /home/lixiang/Desktop/hermes-agent/logs/*.log | grep -E "(error|timeout|200|408)"`
2. 验证前端180秒超时问题根源 - 检查前端与后端 timeout 配置是否一致
3. 如有新错误，使用 `/systematic-debugging` 定位根本原因后再修复

**可选检查**:
- 确认 Hermes 后端运行：`curl http://localhost:8642/health`
- 检查 Hermes WebUI 集成计划执行进度：`cat docs/superpowers/plans/2026-05-30-hermes-webui-integration.md`

---

## 当前进展状态

- Azure GPT-Image-2 API 408超时修复 ✅ 已完成（stream=true + partial_images=1）
- Azure GPT-Image-2 API 404修复 ✅ 已完成（URL格式 `/openai/deployments/<deployment>/images/edits`）
- Azure GPT-Image-2 API 事件解析修复 ✅ 已完成（image_edit.completed + b64_json）
- **前端180秒超时问题** ⏳ 待调查（用户报告前端报错，后端日志13:45显示HTTP 200成功）
- Hermes WebUI 集成计划编写 ✅ 已完成（docs/superpowers/plans/2026-05-30-hermes-webui-integration.md）
- Hermes WebUI 集成执行 ❌ 待开始

---

## 待处理队列

| 优先级 | 任务 | 状态 | 验证方式 |
|--------|------|------|----------|
| P0 | Azure GPT-Image-2 API 前端180秒超时调查 | ⏳ 待处理 | 检查最新日志确认是否有新错误 |
| P0 | Hermes WebUI 集成执行（12 Tasks） | ⏳ 待开始 | 按计划文档逐Task执行 |
| P1 | NPC E2E测试实现 | 待定 | tests/e2e/npc-*.spec.ts 通过 |
| P2 | Phase 2.5 种植小游戏 | 待定 | 设计文档完成，待执行 |

---

## Azure GPT-Image-2 API 已修复问题记录

### 修复内容（2026-05-31）
1. **408 超时** → 使用 `stream=true + partial_images=1` 保持连接活跃
2. **404 错误** → URL格式修正：`/openai/deployments/<deployment>/images/edits`（移除多余 `/v1`）
3. **Header格式** → 使用 `api-key` 而非 `Authorization`（Azure官方规范）
4. **事件解析** → 支持 `image_edit.completed` 类型，`b64_json` 直接在根对象

### 验证结果（13:45日志）
- 13:45:34 → HTTP 200 成功，图片 1024x1024
- 13:45:51 → HTTP 200 成功，图片 768x1024
- 生成的文件：replaced_image.png 存在且有效

### 当前问题
用户报告前端显示 "180秒超时" 错误，需确认：
1. 是新请求还是旧缓存错误？
2. 前端 timeout 配置是否与后端300秒一致？
3. 图像编辑任务 vs 图像生成任务是否有不同表现？

---

## 参考文档链接

- **Hermes WebUI 集成计划**: `docs/superpowers/plans/2026-05-30-hermes-webui-integration.md`
- **Hermes-Agent 位置**: `/home/lixiang/Desktop/hermes-agent`
- **Image Generation Tool**: `/home/lixiang/Desktop/hermes-agent/tools/image_generation_tool.py`
- **NPC E2E测试设计**: `docs/superpowers/specs/phase2.5/2026-05-23-npc-e2e-test-strategy-design.md`

---

## 启动命令

```bash
# 启动 Hermes backend
cd /home/lixiang/Desktop/hermes-agent && python3 main.py

# 启动游戏前端
npm run dev
```