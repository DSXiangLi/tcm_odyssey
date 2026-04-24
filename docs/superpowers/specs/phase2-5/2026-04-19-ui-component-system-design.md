# UI组件系统统一化设计文档

**版本**: v1.0
**日期**: 2026-04-19
**状态**: 设计阶段

---

## 一、设计目标

### 1.1 核心问题

当前项目中各UI组件存在以下问题：

| 问题类型 | 具体表现 | 影响 |
|---------|---------|------|
| **弹窗尺寸不一致** | 诊断类720×420/480, 问诊类640×420, 其他动态计算 | 视觉混乱，难以统一美化 |
| **退出按钮位置混乱** | 有的在右上角(-250/-200), 有的动态计算(width-60, 30) | 用户操作习惯无法形成 |
| **边框绘制代码重复** | draw3DBorder方法在每个UI中重复实现 | 维护成本高，修改一处需改多处 |
| **内部组件风格不统一** | InventoryUI用Neumorphism 60×60格子, 其他用纯文字按钮 | 风格割裂，学习成本高 |
| **选中状态表示混乱** | ○/●符号 vs Neumorphism凸起 vs 颜色变化 | 用户认知负担重 |
| **无统一基类** | 每个UI组件独立实现createButton/ItemSlot等方法 | 无法统一修改，扩展困难 |

### 1.2 设计目标

1. **统一弹窗规范** - 标准尺寸、标准退出机制、标准边框风格
2. **统一内部组件** - 物品格子、选择按钮、信息卡片使用统一组件
3. **创建基类架构** - BaseUIComponent抽象基类，ModalUI弹窗基类
4. **降低维护成本** - 边框绘制、按钮创建等通用方法集中管理
5. **易于美化迭代** - 统一替换整套UI组件风格只需修改基类

---

## 二、组件层级架构

### 2.1 层级结构

```
BaseUIComponent (抽象基类)
├── 属性
│   ├── scene: Phaser.Scene
│   ├── container: Phaser.GameObjects.Container
│   ├── width: number
│   ├── height: number
│   └── depth: number = 100
│
├── 方法
│   ├── drawBorder(style: BorderStyle): Graphics       # 绘制边框
│   ├── createExitButton(): Text                        # 标准退出按钮
│   ├── createTitle(text: string): Text                 # 标准标题
│   ├── createButton(config: ButtonConfig): Container   # 标准按钮
│   ├── createText(config: TextConfig): Text            # 标准文本
│   ├── destroy(): void                                 # 标准销毁流程
│   └── exposeToGlobal(): void                          # 全局暴露(测试用)
│
└── 子类

    ├── ModalUI (弹窗基类)
    │   ├── 标准尺寸定义
    │   │   ├── DIAGNOSIS_MODAL: 720×480 (诊断类：脉诊/舌诊/辨证/选方)
    │   │   ├── INQUIRY_MODAL: 640×420 (问诊类)
    │   │   ├── MINIGAME_MODAL: 800×600 (小游戏：煎药/炮制/种植)
    │   │   └── FULLSCREEN_MODAL: 1024×768 (全屏：背包/存档)
    │   │
    │   ├── 边框方案
    │   │   ├── 方案A: 玻璃态边框 (透明度渐变 + 金棕发光)
    │   │   ├── 方案B: 3D立体边框 (外层亮绿 + 顶部高光 + 底部阴影) ← 默认
    │   │   └── 方案C: 传统边框 (棕系边框 + 暗背景)
    │   │
    │   ├── 退出按钮位置: 固定右上角
    │   │   ├── DIAGNOSIS_MODAL: (340, -250)
    │   │   ├── INQUIRY_MODAL: (300, -200)
    │   │   ├── MINIGAME_MODAL: (380, -290)
    │   │   └── FULLSCREEN_MODAL: (492, -384)
    │   │
    │   └── 子类
    │       ├── DialogUI
    │       ├── InquiryUI
    │       ├── PulseUI
    │       ├── TongueUI
    │       ├── SyndromeUI
    │       ├── PrescriptionUI
    │       ├── DecoctionUI
    │       ├── ProcessingUI
    │       ├── PlantingUI
    │       ├── InventoryUI
    │       ├── SaveUI
    │       └── CasesListUI

    ├── ItemSlotComponent (物品格子组件)
    │   ├── 标准尺寸: 60×60
    │   ├── 边框方案: 方案4(Neumorphism凸起/凹陷)
    │   ├── 内容布局
    │   │   ├── 图标区域: 40×40 (中央)
    │   │   ├── 数量角标: 12×12 (右下角)
    │   │   └── 选中指示: 4px边框高亮 (选中时)
    │   │
    │   ├── 交互
    │   │   ├── 点击: 选择/取消选择
    │   │   ├── hover: 凸起效果(未选中时)
    │   │   └── 选中状态: 凸起 + 高亮边框
    │   │
    │   └── 使用场景
    │       ├── InventoryUI.slots      # 背包物品格子
    │       ├── DecoctionUI.herbSlots  # 煎药药材格子
    │       ├── ProcessingUI.herbSlots # 炮制药材格子
    │       └── PlantingUI.seedSlots   # 种子格子

    ├── SelectionButtonComponent (选择按钮组件)
    │   ├── 尺寸: 固定宽度(选项文字自适应)
    │   ├── 边框方案: 方案8(内凹槽位)或方案4(Neumorphism)
    │   ├── 选中状态
    │   │   ├── ○→● 符号切换 (方案A)
    │   │   ├── 凸起效果 (方案B)
    │   │   └── 颜色高亮 (方案C)
    │   │
    │   ├── 交互
    │   │   ├── 点击: 切换选中状态
    │   │   ├── hover: 高亮颜色
    │   │   └── 多选支持: 可配置为多选模式
    │   │
    │   └── 使用场景
    │       ├── PulseUI.options       # 脉位/脉势选择
    │       ├── TongueUI.options      # 舌象属性选择
    │       ├── SyndromeUI.options    # 证型选择
    │       ├── PrescriptionUI.options # 方剂选择
    │       ├── DecoctionUI.fireButtons # 火候选择
    │       ├── ProcessingUI.methodButtons # 方法选择
    │       └── PlantingUI.waterButtons # 水源选择

    ├── InfoCardComponent (信息卡片组件)
    │   ├── 尺寸: 自适应(内容决定)
    │   ├── 边框方案: 方案B(3D立体)
    │   ├── 内容布局
    │   │   ├── 标题区: 顶部20px
    │   │   ├── 内容区: 自适应高度
    │   │   └── 底部区: 可选按钮
    │   │
    │   └── 使用场景
    │       ├── TongueUI.tongueImageCard # 舌象图片卡片
    │       ├── PrescriptionUI.detailCard # 方剂详情卡片
    │       ├── DecoctionUI.progressCard # 煎药进度卡片
    │       └── ProcessingUI.qualityCard # 质量判断卡片

    ├── CompatibilitySlotComponent (配伍槽位组件)
    │   ├── 尺寸: 120×100 (修正：与game-interaction-design.md一致)
    │   ├── 边框方案: 方案8(内凹槽位)
    │   ├── 内容布局
    │   │   ├── 角色标签: 君/臣/佐/使 (顶部)
    │   │   ├── 药材槽位: ItemSlot 60×60 (中央)
    │   │   └── 顺序标签: 先煎/同煎/后下 (底部)
    │   │
    │   └── 使用场景
    │       ├── DecoctionUI.compatibilitySlots # 煎药配伍放置
    │       └── PrescriptionUI.roleSlots        # 选方角色槽位(可选)

    └── ProgressBarComponent (进度条组件)
        ├── 尺寸: 宽度自适应, 高度20px
        ├── 边框方案: 方案8(内凹槽位)
        ├── 内容布局
        │   ├── 背景槽位: 凹陷效果
        │   ├── 进度填充: 渐变色(低→高)
        │   └── 时间文本: 右侧显示
        │
        └── 使用场景
            ├── DecoctionUI.progressBar # 煎药进度
            ├── ProcessingUI.progressBar # 炝制进度
            └── PlantingUI.growthBar # 生长进度
```

---

## 三、边框风格规范

### 3.1 边框方案定义

| 方案ID | 名称 | 颜色配置 | 适用场景 |
|-------|------|---------|---------|
| 方案A | 玻璃态边框 | PANEL_GLASS_LIGHT → PANEL_GLASS_DARK + BORDER_GLOW | 现代感弹窗 |
| 方案B | 3D立体边框 | BORDER_OUTER_GREEN + BORDER_TOP_LIGHT + BORDER_BOTTOM_SHADOW | **默认弹窗** |
| 方案C | 传统边框 | BORDER_PRIMARY + PANEL_SECONDARY | 复古风格 |
| 方案4 | Neumorphism | PANEL_NEUMORPHIC + 凸起阴影 + 凹陷阴影 | 物品格子 |
| 方案8 | 内凹槽位 | BORDER_INSET_DARK + BORDER_INSET_LIGHT + PANEL_INSET | 输入框/槽位 |

### 3.2 边框绘制API

```typescript
interface BorderStyle {
  type: 'glass' | '3d' | 'traditional' | 'neumorphic' | 'inset';
  width: number;
  height: number;
  baseColor?: number;
  borderColor?: number;
  shadowOffset?: number;
  highlightAlpha?: number;
  shadowAlpha?: number;
}

class BaseUIComponent {
  /**
   * 绘制边框
   * @param graphics Phaser Graphics对象
   * @param style 边框样式配置
   */
  protected drawBorder(graphics: Graphics, style: BorderStyle): void {
    switch(style.type) {
      case '3d':
        this.draw3DBorder(graphics, style);
        break;
      case 'neumorphic':
        this.drawNeumorphicBorder(graphics, style);
        break;
      case 'inset':
        this.drawInsetBorder(graphics, style);
        break;
      // ... 其他方案
    }
  }
}
```

---

## 四、弹窗尺寸与退出规范

### 4.1 标准弹窗尺寸

| 弹窗类型 | 尺寸 | 适用场景 | 边框方案 |
|---------|------|---------|---------|
| DIAGNOSIS_MODAL | 720×480 | 脉诊/舌诊/辨证/选方 | 方案B(3D) |
| INQUIRY_MODAL | 640×420 | 问诊界面 | 方案B(3D) + 方案8槽位 |
| MINIGAME_MODAL | 800×600 | 煎药/炮制/种植 | 方案B(3D) |
| FULLSCREEN_MODAL | 1024×768 | 背包/存档/病案 | 方案B(3D) |
| DIALOG_MODAL | 500×300 | NPC对话 | 方案A(玻璃态) |

### 4.2 退出按钮规范

| 弹窗类型 | 退出按钮位置 | 文字 | 快捷键 |
|---------|------------|------|-------|
| DIAGNOSIS_MODAL | (340, -250) 相对中心 | [退出诊断] | ESC |
| INQUIRY_MODAL | (300, -200) 相对中心 | [退出问诊] | ESC |
| MINIGAME_MODAL | (380, -290) 相对中心 | [退出] | ESC |
| FULLSCREEN_MODAL | (492, -384) 相对中心 | [关闭] 或 ✕ | ESC / B键 |
| DIALOG_MODAL | (240, -150) 相对中心 | [结束对话] | ESC |

### 4.3 退出按钮样式

```typescript
interface ExitButtonConfig {
  text: string;
  position: { x: number; y: number };  // 相对弹窗中心
  style: {
    fontSize: '16px';
    color: UI_COLOR_STRINGS.TEXT_PRIMARY;
    backgroundColor: UI_COLOR_STRINGS.PANEL_DARK;
    padding: { x: 10, y: 5 };
  };
  hoverColor: UI_COLOR_STRINGS.BUTTON_PRIMARY_HOVER;
  action: () => void;  // 退出回调
}
```

---

## 五、内部组件规范

### 5.1 物品格子 (ItemSlot)

```typescript
interface ItemSlotConfig {
  width: 60;
  height: 60;
  borderStyle: 'neumorphic';
  content: {
    icon?: string | Phaser.GameObjects.Image;  // 图标
    quantity?: number;                          // 数量
    itemId: string;                             // 物品ID
  };
  interaction: {
    selectable: boolean;    // 是否可选择
    draggable: boolean;     // 是否可拖拽
    onClick?: () => void;   // 点击回调
  };
}
```

**选中状态**:
- 未选中: 凹陷效果 + 灰色边框
- 已选中: 凸起效果 + 高亮边框(BUTTON_PRIMARY)
- Hover: 凸起效果(临时)

### 5.2 选择按钮 (SelectionButton)

```typescript
interface SelectionButtonConfig {
  width: 'auto' | number;  // 固定宽度或自适应
  height: 32;
  borderStyle: 'inset' | 'neumorphic';
  content: {
    label: string;          // 显示文字
    value: string;          // 选择值
    symbol?: '○' | '●';     // 选中符号(可选)
  };
  interaction: {
    multiSelect: boolean;   // 是否支持多选
    selected: boolean;      // 当前选中状态
    onSelect?: () => void;  // 选择回调
  };
}
```

**选中状态表示**:
- 方案A(符号): ○ → ● 切换
- 方案B(Neumorphism): 凹陷 → 凸起
- 方案C(颜色): 默认色 → BUTTON_PRIMARY

### 5.3 配伍槽位 (CompatibilitySlot)

```typescript
interface CompatibilitySlotConfig {
  width: 120;
  height: 80;
  borderStyle: 'inset';
  content: {
    role: '君' | '臣' | '佐' | '使';  // 角色
    herbSlot?: ItemSlot;               // 药材格子
    order?: '先煎' | '同煎' | '后下';  // 顺序
  };
}
```

---

## 六、迁移计划

### 6.1 阶段划分

| 阶段 | 内容 | 影响范围 |
|-----|------|---------|
| Phase 1 | 创建BaseUIComponent抽象基类 | 新增文件，不影响现有代码 |
| Phase 2 | 创建ModalUI弹窗基类 | 新增文件，不影响现有代码 |
| Phase 3 | 创建ItemSlotComponent组件 | 新增文件，不影响现有代码 |
| Phase 4 | 创建SelectionButtonComponent组件 | 新增文件，不影响现有代码 |
| Phase 5 | 重构InventoryUI使用新组件 | InventoryUI.ts |
| Phase 6 | 重构诊断类UI(Pulse/Tongue/Syndrome/Prescription) | 4个文件 |
| Phase 7 | 重构小游戏UI(Decoction/Processing/Planting) | 3个文件 |
| Phase 8 | 重构问诊UI(Inquiry) | InquiryUI.ts |
| Phase 9 | 重构其他UI(Dialog/Save/CasesList) | 3个文件 |
| Phase 10 | 清理旧代码，更新测试 | 全局 |

### 6.2 文件结构

```
src/ui/
├── base/
│   ├── BaseUIComponent.ts      # 抽象基类
│   ├── ModalUI.ts              # 弹窗基类
│   └── UIBorderStyles.ts       # 边框样式定义
│
├── components/
│   ├── ItemSlotComponent.ts    # 物品格子组件
│   ├── SelectionButtonComponent.ts  # 选择按钮组件
│   ├── InfoCardComponent.ts    # 信息卡片组件
│   ├── CompatibilitySlotComponent.ts # 配伍槽位组件
│   └── ProgressBarComponent.ts # 进度条组件
│
├── modals/
│   ├── DialogUI.ts             # NPC对话
│   ├── InquiryUI.ts            # 问诊界面
│   ├── PulseUI.ts              # 脉诊
│   ├── TongueUI.ts             # 舌诊
│   ├── SyndromeUI.ts           # 辨证
│   ├── PrescriptionUI.ts       # 选方
│   ├── DecoctionUI.ts          # 煎药
│   ├── ProcessingUI.ts         # 炝制
│   ├── PlantingUI.ts           # 种植
│   ├── InventoryUI.ts          # 背包
│   ├── SaveUI.ts               # 存档
│   └── CasesListUI.ts          # 病案列表
│
└── index.ts                    # 导出所有UI组件
```

---

## 七、测试验收标准

### 7.1 单元测试覆盖

| 测试项 | 测试内容 |
|-------|---------|
| BaseUIComponent | drawBorder各方案绘制正确 |
| ModalUI | 标准尺寸、退出按钮位置、边框绘制 |
| ItemSlotComponent | 尺寸、选中状态、hover效果、数量显示 |
| SelectionButtonComponent | 尺寸、选中切换、多选模式、hover效果 |
| CompatibilitySlotComponent | 角色、药材放置、顺序显示 |

### 7.2 集成测试覆盖

| 测试项 | 测试内容 |
|-------|---------|
| InventoryUI重构 | 使用ItemSlotComponent，功能不变 |
| PulseUI重构 | 使用SelectionButtonComponent，功能不变 |
| DecoctionUI重构 | 使用ItemSlot + CompatibilitySlot，功能不变 |

### 7.3 视觉验收

| 检查项 | 标准 |
|-------|------|
| 弹窗尺寸一致性 | 同类型弹窗尺寸完全一致 |
| 退出按钮位置 | 固定右上角，位置精确 |
| 边框风格统一 | 同类型组件边框风格一致 |
| 选中状态清晰 | 未选中/选中/Hover状态区分明显 |

---

## 九、统一化套件化规范（强制执行）

### 9.1 选中状态强制规范

| 场景类型 | 必须使用方案 | 禁止使用方案 | 典型应用 |
|---------|-------------|-------------|---------|
| 单选文字选项 | 方案A(○→●) | 方案B/C | 脉位/脉势/舌象属性 |
| 物品格子选择 | 方案B(Neumorphism凹陷→凸起) | 方案A/C | 药材/种子/辅料格子 |
| 卡片选择 | 方案C(颜色高亮) | 方案A | 证型/方剂/方法卡片 |
| 槽位填充状态 | 方案B(Neumorphism) + 满足绿条 | 方案A/C | 配伍槽/合成槽/地块 |

### 9.2 物品格子统一复用规范

**ItemSlotComponent (60×60)** 必须在以下所有场景复用：
| UI组件 | 使用位置 | 复用规范 |
|-------|---------|---------|
| InventoryUI | slots (药材格子) | ✓ 统一60×60 Neumorphism |
| DecoctionUI | herbSlots (煎药药材格子) | ✓ 统一60×60 Neumorphism |
| ProcessingUI | herbSlots (炮制药材格子) | ✓ 统一60×60 Neumorphism |
| PlantingUI | seedSlots (种子格子) | ✓ 统一60×60 Neumorphism |

**统一视觉规格**:
- 尺寸: 60×60
- 边框风格: Neumorphism (凹陷=空, 凸起=选中)
- 内部布局: 40×40图标区 + 12×12右下角数量角标
- 选中边框: BUTTON_PRIMARY(#90c070) 4px高亮

### 9.3 槽位类型统一规范

| 槽位类型 | 尺寸 | 边框风格 | 复用场景 |
|---------|------|---------|---------|
| CompatibilitySlot | 120×100 | 内凹(inset) | DecoctionUI配伍、PrescriptionUI选方 |
| SynthesisSlot | 100×80 | 内凹(inset) | ProcessingUI炮制合成 |
| PlotSlot | 100×80 | 实线边框 | PlantingUI地块 |
| DiagnosisSlot | 60×60 | 3D边框 | PulseUI/TongueUI/SyndromeUI诊断结果 |
| TimelineSlot | 80×70 | 实线边框 | DecoctionUI时间轴 |

### 9.4 UI组件到基础组件映射表

| UI组件 | ItemSlot | SelectionButton | CompatibilitySlot | SynthesisSlot | PlotSlot | DiagnosisSlot | ProgressBar |
|-------|:--------:|:--------------:|:-----------------:|:-------------:|:-------:|:-------------:|:-----------:|
| InventoryUI | ✓(背包格子) | - | - | - | - | - | - |
| PulseUI | - | ✓(脉位/脉势) | - | - | - | ✓(已选展示) | - |
| TongueUI | - | ✓(舌象属性) | - | - | - | ✓(已选展示) | - |
| SyndromeUI | - | ✓(证型选择) | - | - | - | ✓(已选展示) | - |
| PrescriptionUI | - | ✓(方剂选择) | ✓(可选) | - | - | ✓(已选展示) | - |
| DecoctionUI | ✓(药材格子) | ✓(火候选择) | ✓(配伍槽位) | - | - | - | ✓(煎药进度) |
| ProcessingUI | ✓(药材格子) | ✓(方法选择) | - | ✓(合成槽位) | - | - | ✓(炮制进度) |
| PlantingUI | ✓(种子格子) | ✓(水源/肥料) | - | - | ✓(地块槽位) | - | ✓(生长进度) |

### 9.5 边框方案统一编号

| 编号 | 名称 | 适用场景 | 颜色配置 |
|-----|------|---------|---------|
| B-01 | 3D立体边框 | 弹窗主背景、诊断槽位 | BORDER_OUTER_GREEN + 高光/阴影 |
| B-02 | 玻璃态边框 | NPC对话弹窗 | PANEL_GLASS_LIGHT → DARK + 发光 |
| B-03 | 传统边框 | 复古风格弹窗 | BORDER_PRIMARY + PANEL_SECONDARY |
| B-04 | Neumorphism凸起 | 物品格子(选中状态) | 凸起阴影 + 高亮边框 |
| B-05 | Neumorphism凹陷 | 物品格子(未选中状态) | 凹陷阴影 + 灰色边框 |
| B-06 | 内凹槽位 | 配伍槽位、合成槽位、时间轴槽位 | BORDER_INSET_DARK + LIGHT |
| B-07 | 实线边框 | 地块槽位、进度条背景 | 归经颜色或顺序颜色 |

---

## 十、相关文档

- [脉诊游戏设计文档](./minigames/2026-04-19-pulse-minigame-design.md)
- [舌诊游戏设计文档](./minigames/2026-04-19-tongue-minigame-design.md)
- [辨证游戏设计文档](./minigames/2026-04-19-syndrome-minigame-design.md)
- [选方游戏设计文档](./minigames/2026-04-19-prescription-minigame-design.md)
- [煎药游戏设计文档](./minigames/2026-04-19-decoction-minigame-design.md)
- [炮制游戏设计文档](./minigames/2026-04-19-processing-minigame-design.md)
- [种植游戏设计文档](./minigames/2026-04-19-planting-minigame-design.md)

---

*本文档由 Claude Code 创建，更新于 2026-04-19*