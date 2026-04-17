# visual_evaluator/prompt_template.py
"""
Prompt Template Generator for Qwen VL Visual Evaluation

Generates structured prompts for multi-dimensional visual quality assessment.
"""

from typing import Dict, Any


class PromptTemplate:
    """Generates evaluation prompts for Qwen VL model."""

    @staticmethod
    def get_visual_spec_summary() -> Dict[str, Any]:
        """
        Get visual specification summary for evaluation context.

        Returns:
            Dict containing color spec and UI design principles.
        """
        return {
            "color_spec": {
                "场景提取色系": {
                    "绿系": {"主色": "#4a7c59", "辅色": "#6b8e4e", "暗色": "#3d5c3f"},
                    "棕系": {"主色": "#8b6f47", "辅色": "#a68b5b", "暗色": "#6b5b3d"},
                    "灰蓝系": {"主色": "#5c6b7a", "辅色": "#7a8a9a", "暗色": "#4a5b6a"},
                    "土黄系": {"主色": "#c4a35a", "辅色": "#d4b36a", "暗色": "#9a8a4a"}
                }
            },
            "ui_design_principles": [
                "UI颜色来自场景PNG提取色系",
                "按钮颜色使用场景绿系/棕系",
                "面板背景使用场景灰蓝/土黄系",
                "边框装饰使用场景棕系",
                "主要文字高对比白色，次要文字暖米黄色",
                "元素对齐整齐，层级关系清晰",
                "间距合理，不拥挤不稀疏",
                "UI与场景PNG自然融合，无突兀硬对比"
            ],
            "ui_color_harmony": {
                "按钮样式": "场景绿系/棕系提取色 + 半透明背景",
                "面板背景": "场景灰蓝/土黄系提取色 + 0.85透明度",
                "边框装饰": "场景棕系提取色 + 1px描边",
                "文字颜色": "主要白色(#fff)，次要暖米黄(#f5e6d3)"
            }
        }

    @staticmethod
    def generate_evaluation_prompt(
        scene_id: str,
        scene_context: Dict[str, Any],
        visual_spec_summary: Dict[str, Any] = None
    ) -> str:
        """
        Generate evaluation prompt for Qwen VL.

        Args:
            scene_id: Scene identifier (e.g., "town_outdoor_panorama")
            scene_context: Scene-specific context (description, expected elements)
            visual_spec_summary: Visual specification (optional, uses default if None)

        Returns:
            Structured prompt string for Qwen VL evaluation.
        """
        if visual_spec_summary is None:
            visual_spec_summary = PromptTemplate.get_visual_spec_summary()

        # Build scene description
        scene_description = scene_context.get("description", "未知场景")
        expected_elements = scene_context.get("expected_elements", [])
        atmosphere_target = scene_context.get("atmosphere", "田园治愈")

        # Build element list string
        elements_str = "\n".join([f"- {elem}" for elem in expected_elements]) if expected_elements else "- 无特定元素要求"

        prompt = f"""你是一个专业的游戏UI视觉评审专家。请对以下游戏场景截图进行多维度质量评估。

## 评估场景
**场景ID**: {scene_id}
**场景描述**: {scene_description}
**氛围定位**: {atmosphere_target}

## 预期元素
{elements_str}

## 视觉设计规范
### 场景提取色系
- 绿系: 主色#4a7c59, 辅色#6b8e4e, 暗色#3d5c3f (用于按钮、植物元素)
- 棕系: 主色#8b6f47, 辅色#a68b5b, 暗色#6b5b3d (用于边框、装饰)
- 灰蓝系: 主色#5c6b7a, 辅色#7a8a9a, 暗色#4a5b6a (用于面板背景)
- 土黄系: 主色#c4a35a, 辅色#d4b36a, 暗色#9a8a4a (用于次级面板)

### UI颜色协调原则
- UI颜色应来自场景PNG提取色系
- 按钮使用场景绿系/棕系提取色
- 面板背景使用场景灰蓝/土黄系提取色
- 边框装饰使用场景棕系提取色
- 主要文字白色(#fff)，次要文字暖米黄(#f5e6d3)

### UI设计原则
- 元素对齐整齐，层级关系清晰
- 间距合理，不拥挤不稀疏
- UI与场景PNG自然融合，无突兀硬对比

## 评估维度
请对以下5个维度进行评分(0-100分)并提供详细分析:

1. **配色协调度** (权重30%, 阈值80分)
   - UI颜色是否来自场景PNG提取色系
   - 按钮颜色是否使用场景绿系/棕系
   - 面板背景是否使用场景灰蓝/土黄系
   - 边框装饰是否使用场景棕系

2. **UI布局清晰度** (权重20%, 阈值85分)
   - 元素对齐是否整齐
   - 层级关系是否清晰
   - 间距是否合理
   - 按钮位置明确，操作路径清晰

3. **文字可读性** (权重15%, 阈值90分)
   - 字体大小是否适中
   - 颜色对比是否清晰
   - 主要文字高对比白，次要文字暖米黄

4. **视觉融合度** (权重20%, 阈值75分)
   - UI是否与场景PNG自然融合
   - 弹窗背景与场景暗部色调协调
   - 无突兀的硬对比
   - 半透明效果自然过渡

5. **整体游戏体验** (权重15%, 阈值80分)
   - 界面响应感强
   - 视觉舒适度
   - 交互反馈明确

## 输出格式要求
请严格按照以下JSON格式输出评估结果，不要添加任何其他文字:

```json
{{"dimensions": {{
  "配色协调度": {{
    "score": "<0-100>",
    "analysis": "<详细分析>",
    "issues": ["<问题列表>"],
    "suggestions": ["<改进建议>"]
  }},
  "UI布局清晰度": {{
    "score": "<0-100>",
    "analysis": "<详细分析>",
    "issues": ["<问题列表>"],
    "suggestions": ["<改进建议>"]
  }},
  "文字可读性": {{
    "score": "<0-100>",
    "analysis": "<详细分析>",
    "issues": ["<问题列表>"],
    "suggestions": ["<改进建议>"]
  }},
  "视觉融合度": {{
    "score": "<0-100>",
    "analysis": "<详细分析>",
    "issues": ["<问题列表>"],
    "suggestions": ["<改进建议>"]
  }},
  "整体游戏体验": {{
    "score": "<0-100>",
    "analysis": "<详细分析>",
    "issues": ["<问题列表>"],
    "suggestions": ["<改进建议>"]
  }}
}},
"overall_assessment": "<整体评价摘要>",
"pass": "<true/false>",
"confidence": "<0-100>"
}}
```

请分析截图并输出JSON格式的评估结果。"""

        return prompt