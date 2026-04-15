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
                "田园绿系": {"主色": "#4a9", "辅色": "#6c7", "暗色": "#2d5"},
                "古朴棕系": {"主色": "#865", "辅色": "#a87", "暗色": "#5a3"},
                "自然蓝系": {"主色": "#6a8", "辅色": "#8ca", "暗色": "#3c6"}
            },
            "ui_design_principles": [
                "元素对齐整齐，层级关系清晰",
                "间距合理，不拥挤不稀疏",
                "文字大小适中，颜色对比清晰",
                "颜色过渡自然，风格统一",
                "中医元素古朴呈现，不现代化失真",
                "AI对话区域宽敞，流式输出展示流畅",
                "整体界面响应感强，交互反馈明确"
            ],
            "scene_atmosphere": {
                "百草镇室外": "田园治愈为主，中医文化点缀，神秘探索引导",
                "青木诊所": "温馨小诊所，中医专业感+传承感",
                "老张药园": "规整+自然野趣，老张个人风格",
                "玩家之家": "温馨+成长记录+个性化"
            },
            "sprite_requirements": {
                "帧率": "流畅，无明显卡顿",
                "方向切换": "正确，无错位",
                "动画连贯性": "动作过渡自然"
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
### 颜色体系
- 田园绿系: 主色#4a9, 辅色#6c7, 暗色#2d5 (用于室外草地、药园)
- 古朴棕系: 主色#865, 辅色#a87, 暗色#5a3 (用于诊所建筑、药柜)
- 自然蓝系: 主色#6a8, 辅色#8ca, 暗色#3c6 (用于远景山脉、溪流)

### UI设计原则
- 元素对齐整齐，层级关系清晰
- 间距合理，不拥挤不稀疏
- 文字大小适中，颜色对比清晰
- 颜色过渡自然，风格统一
- 中医元素古朴呈现，不现代化失真
- AI对话区域宽敞，流式输出展示流畅

## 评估维度
请对以下8个维度进行评分(0-100分)并提供详细分析:

1. **中医风格符合度** (权重15%)
   - 古朴配色运用是否恰当
   - 中医元素符号呈现是否准确
   - 传统文化美学是否符合

2. **AI对话交互适配** (权重15%)
   - 对话面板空间是否宽敞
   - 流式输出展示区域是否合理
   - NPC状态反馈是否清晰

3. **UI布局清晰度** (权重15%)
   - 元素对齐是否整齐
   - 层级关系是否清晰
   - 间距是否合理

4. **颜色风格一致性** (权重10%)
   - 三色系规范符合度
   - 颜色过渡是否自然
   - 整体风格是否统一

5. **文字可读性** (权重10%)
   - 字体大小是否适中
   - 颜色对比是否清晰
   - 文字排版是否合理

6. **场景氛围符合度** (权重15%)
   - 场景定位是否符合设计
   - 元素布局是否合理
   - 氛围传达是否到位

7. **Sprite动画质量** (权重5%)
   - 帧率是否流畅
   - 方向切换是否正确
   - 动画连贯性

8. **整体游戏体验** (权重15%)
   - 界面响应感
   - 视觉舒适度
   - 交互反馈明确性

## 输出格式要求
请严格按照以下JSON格式输出评估结果，不要添加任何其他文字:

```json
{{"dimensions": {{
  "中医风格符合度": {{
    "score": "<0-100>",
    "analysis": "<详细分析>",
    "issues": ["<问题列表>"],
    "suggestions": ["<改进建议>"]
  }},
  "AI对话交互适配": {{
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
  "颜色风格一致性": {{
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
  "场景氛围符合度": {{
    "score": "<0-100>",
    "analysis": "<详细分析>",
    "issues": ["<问题列表>"],
    "suggestions": ["<改进建议>"]
  }},
  "Sprite动画质量": {{
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