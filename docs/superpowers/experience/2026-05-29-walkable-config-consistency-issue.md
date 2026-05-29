# 可行走区域配置不一致问题复盘

**日期**: 2026-05-29
**问题**: 人物可行走区域与遮罩层定义完全不一致
**严重级别**: HIGH - 影响核心游戏机制

---

## 1. 问题发现

### 用户反馈

> "是的行走域还是不对，当前几乎多数区域都能行走"

### 现象

- **遮罩层定义**: 919个可行走瓦片（22.3%占比）
- **实际配置**: 1837个可行走瓦片（44.5%占比）
- **可行走区域翻倍**，几乎整个地图都能行走

---

## 2. 根本原因分析

### Phase 1: 数据源不一致

**遮罩层分析结果存储位置**：
```
tests/visual/asset-test/ai-generated/town_new/mask_analysis/
├── town-walkable-config.ts (3775行，完整)
├── analysis_report.json
└── map_config.json

tests/visual/asset-test/ai-generated/clinic/mask_analysis/
├── clinic-walkable-config.ts (4309行，完整)
└── clinic_walkable_config.json
```

**实际使用的配置位置**：
```
src/data/
├── town-walkable-data.ts (3777行，完整) ✓
├── clinic-walkable-config.ts (1077行，不完整) ❌
├── clinic-scaled-walkable-config.ts (279行，手动创建) ❌
└── garden-walkable-config.ts (182行，手动创建) ❌
```

**问题**: tests目录有完整分析结果，但src/data没有正确复制使用。

### Phase 2: 手动修改配置

**map-config.ts中的手动添加**（第196-230行）：
```typescript
// 添加从出生点到各门的连接路径
// 路径1: (45,8)到(63,24)整个矩形 → 323瓦片
// 路径2: (13,8)到(47,24)整个矩形 → 595瓦片
// 路径3: 更多矩形区域...
```

**手动添加原因**（推测）：
1. **路径不连通问题**: 遮罩层分析发现出生点到门的路径不连通
2. **临时修复心态**: "先手动添加路径让玩家能移动"
3. **缺乏系统思维**: 没有意识到手动添加会破坏整个系统
4. **文档缺失**: 没有明确说明"遮罩层是唯一数据源"

---

## 3. 问题根源：为何会出现多处维护？

### 3.1 数据源定义不明确

**问题**: 没有明确文档说明"可行走配置的唯一数据源是什么"

**结果**: 开发者不知道：
- 遮罩层分析结果是权威数据源
- src/data只是使用位置，不应手动修改
- 手动添加会导致数据不一致

### 3.2 分析流程与使用流程分离

**遮罩层分析流程**（Phase 1.5早期）：
```
tests/visual/asset-test/
├── mask_to_config.py → 生成town-walkable-config.ts
└── indoor_mask_analyzer.py → 生成clinic-walkable-config.ts
```

**配置使用流程**（Phase 1.5后期）：
```
src/data/
├── town-walkable-data.ts → TownOutdoorScene使用
└── clinic-walkable-config.ts → ClinicScene使用
```

**问题**: 两个流程独立，没有明确的"复制→使用"规范。

### 3.3 缺乏自动化同步机制

**问题**: tests目录的分析结果没有自动同步到src/data

**结果**:
- tests目录生成新配置
- src/data继续使用旧配置
- 开发者手动修改src/data（而非更新tests分析）

### 3.4 问题修复心态错误

**临时修复心态**:
```
问题: 路径不连通，玩家无法从出生点移动到门
方案: 手动添加路径矩形区域 ❌
正确: 重新分析遮罩层或调整遮罩层本身 ✓
```

**错误思维**:
- "遮罩层分析有问题，我手动修复一下"
- "先让玩家能移动，遮罩层以后再说"
- "路径连通是设计问题，手动添加更快"

---

## 4. 如何避免这种情况？

### 4.1 明确数据源定义（最关键）

**方案**: 创建明确的文档说明：

```markdown
# 可行走配置数据源定义

## 唯一数据源
遮罩层分析结果（tests目录）是唯一权威数据源：
- tests/visual/asset-test/ai-generated/town_new/mask_analysis/
- tests/visual/asset-test/ai-generated/clinic/mask_analysis/

## 使用位置
src/data/只是使用位置，**严禁手动修改**：
- town-walkable-data.ts
- clinic-walkable-config.ts
- garden-walkable-config.ts

## 修改流程
发现问题 → 修改遮罩层 → 重新运行分析脚本 → 更新src/data
**严禁**: 直接修改src/data中的配置文件
```

### 4.2 自动化同步机制

**方案**: 创建自动化脚本：

```python
# scripts/sync_walkable_configs.py
"""
自动同步遮罩层分析结果到src/data
"""

import shutil
from pathlib import Path

# 小镇室外
shutil.copy(
    'tests/visual/asset-test/ai-generated/town_new/mask_analysis/town-walkable-config.ts',
    'src/data/town-walkable-data.ts'
)

# 诊所
shutil.copy(
    'tests/visual/asset-test/ai-generated/clinic/mask_analysis/clinic-walkable-config.ts',
    'src/data/clinic-walkable-config.ts'
)

# 药园（如果没有mask_analysis目录，运行分析）
garden_analysis_dir = Path('tests/visual/asset-test/ai-generated/herb_field_area/mask_analysis')
if not garden_analysis_dir.exists():
    # 运行遮罩层分析脚本
    ...
```

**使用场景**:
- 每次遮罩层更新后运行同步脚本
- CI/CD流程中自动同步
- git pre-commit hook检查是否需要同步

### 4.3 集中管理配置生成

**方案**: 将所有遮罩层分析和配置生成集中在同一个流程：

```bash
# scripts/generate_all_walkable_configs.sh
#!/bin/bash
# 生成所有场景的可行走配置

echo "=== 1. 分析小镇遮罩层 ==="
python3 tests/visual/asset-test/mask_to_config.py town_new

echo "=== 2. 分析诊所遮罩层 ==="
python3 tests/visual/asset-test/indoor_mask_analyzer.py clinic

echo "=== 3. 分析药园遮罩层 ==="
python3 tests/visual/asset-test/indoor_mask_analyzer.py herb_field_area

echo "=== 4. 同步到src/data ==="
python3 scripts/sync_walkable_configs.py

echo "=== 5. 验证配置一致性 ==="
python3 scripts/verify_config_consistency.py
```

### 4.4 配置验证机制

**方案**: 创建配置一致性检查脚本：

```python
# scripts/verify_config_consistency.py
"""
验证src/data的配置与tests分析结果是否一致
"""

def verify_consistency():
    # 检查小镇
    test_config = read_config('tests/.../town-walkable-config.ts')
    src_config = read_config('src/data/town-walkable-data.ts')
    
    if test_config != src_config:
        raise Error("小镇配置不一致！需要运行sync脚本")
    
    # 检查其他场景...
```

**使用场景**:
- CI/CD流程中自动检查
- git pre-commit hook
- 开发过程中定期运行

### 4.5 问题修复流程规范化

**方案**: 创建明确的问题修复流程文档：

```markdown
# 可行走区域问题修复流程

## 发现问题
玩家无法移动到某个区域

## 错误方案 ❌
- 手动添加可行走瓦片到src/data
- 在map-config.ts中添加矩形路径
- 临时修改代码逻辑

## 正确方案 ✓
1. **分析原因**: 是遮罩层定义错误？还是分析脚本错误？
2. **修改遮罩层**: 如果遮罩层定义错误，重新绘制遮罩层
3. **重新分析**: 运行遮罩层分析脚本生成新配置
4. **同步配置**: 运行sync脚本更新src/data
5. **验证结果**: 测试游戏确保可行走区域正确
```

---

## 5. 具体实施建议

### 5.1 立即行动（已完成）

✅ 修复当前配置不一致问题：
- 复制完整遮罩层分析结果到src/data
- 删除map-config.ts中手动添加的路径
- 确保所有配置基于遮罩层分析

### 5.2 短期行动（本周内）

1. **创建数据源定义文档**
   - docs/architecture/walkable-config-data-source.md
   - 明确说明唯一数据源和修改流程

2. **创建同步脚本**
   - scripts/sync_walkable_configs.py
   - 自动化tests→src同步

3. **创建验证脚本**
   - scripts/verify_config_consistency.py
   - CI/CD和pre-commit hook集成

### 5.3 中期行动（本月内）

1. **集中管理遮罩层分析**
   - scripts/generate_all_walkable_configs.sh
   - 一键生成所有场景配置

2. **更新CLAUDE.md**
   - 添加可行走配置修改规范
   - 明确禁止手动修改src/data

3. **CI/CD集成**
   - 添加配置一致性检查
   - 添加自动同步机制

---

## 6. 关键教训总结

### E1: 数据源定义不明确导致多处维护

**教训**: 必须明确文档说明"唯一数据源"和"使用位置"的区别，防止开发者手动修改使用位置的数据。

**预防**: 创建数据源定义文档，明确禁止手动修改。

### E2: 分析流程与使用流程分离导致数据不一致

**教训**: tests目录的分析结果和src/data的使用配置必须同步，否则会导致数据不一致。

**预防**: 创建自动化同步脚本，定期或CI触发同步。

### E3: 临时修复心态导致系统性破坏

**教训**: 手动添加可行走路径看似"快速修复"，实际上破坏了整个系统的数据一致性。

**预防**: 创建问题修复流程文档，明确禁止临时手动修复。

### E4: 缺乏配置验证机制

**教训**: 没有自动检查配置一致性，导致问题长期存在。

**预防**: 创建验证脚本，集成CI/CD和pre-commit hook。

---

## 7. 相关文件

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| src/data/clinic-walkable-config.ts | 复制完整遮罩层分析（4309行） |
| src/data/clinic-scaled-walkable-config.ts | 重新生成缩放配置（354行） |
| src/data/garden-walkable-config.ts | 重新分析遮罩层（893行） |
| src/data/map-config.ts | 删除手动添加的路径 |

### 新建文件（建议）

| 文件 | 内容 |
|------|------|
| docs/architecture/walkable-config-data-source.md | 数据源定义文档 |
| scripts/sync_walkable_configs.py | 自动同步脚本 |
| scripts/verify_config_consistency.py | 配置验证脚本 |
| scripts/generate_all_walkable_configs.sh | 集中生成脚本 |

---

## 8. Git提交记录

```bash
git commit -m "fix(phase1.5): 修复可行走区域配置 - 使用完整遮罩层分析结果

问题根本原因:
- src/data中的配置文件没有使用完整的遮罩层分析结果
- map-config.ts中手动添加了约918个可行走瓦片（路径区域）
- 导致可行走区域占比从22.3%（遮罩层定义）增加到44.5%

修复内容:
1. 诊所配置：复制完整遮罩层分析（1070瓦片，4309行）
2. 诊所缩放：基于完整配置重新生成（339瓦片）
3. 药园配置：重新运行遮罩层分析（879瓦片）
4. 小镇室外：删除手动添加的路径，只使用遮罩层分析结果（919瓦片）

关键教训:
- 遮罩层分析生成的配置是唯一正确来源
- 手动修改配置会导致数据不一致
- 应使用自动化脚本生成配置，而非手动添加

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 9. 总结

**问题**: 可行走区域配置不一致，导致可行走区域翻倍（22.3%→44.5%）

**根本原因**:
1. 数据源定义不明确（tests vs src）
2. 缺乏自动化同步机制
3. 手动修复心态导致系统性破坏
4. 缺乏配置验证机制

**解决方案**:
1. 明确数据源定义文档
2. 创建自动化同步脚本
3. 规范问题修复流程
4. 创建配置验证机制
5. CI/CD集成检查

**核心原则**:
- **遮罩层分析是唯一数据源**
- **src/data只是使用位置，严禁手动修改**
- **发现问题→修改遮罩层→重新分析→自动同步**

---

*本经验文档由 Claude Code 维护*