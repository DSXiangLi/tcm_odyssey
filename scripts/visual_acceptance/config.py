# scripts/visual_acceptance/config.py

import os
from dotenv import load_dotenv

load_dotenv()

# 评估模型配置（从.env读取，使用None作为默认值）
QWEN_VL_API_URL = os.getenv("QWEN_VL_URL") or None
QWEN_VL_API_KEY = os.getenv("QWEN_VL_KEY") or None
QWEN_VL_MODEL = os.getenv("QWEN_VL_MODEL_NAME", "qwen-vl-max")
GLM_API_URL = os.getenv("GLM_API_BASE") or None
GLM_API_KEY = os.getenv("GLM_API_KEY") or None
GLM_MODEL = os.getenv("GLM_MODEL_NAME", "glm-4")

# 验收阈值配置
DIMENSION_THRESHOLDS = {
    "中医风格符合度": 75,
    "AI对话交互适配": 80,
    "UI布局清晰度": 85,
    "颜色风格一致性": 80,
    "文字可读性": 90,
    "场景氛围符合度": 75,
    "Sprite动画质量": 70,
    "整体游戏体验": 80
}

DIMENSION_WEIGHTS = {
    "中医风格符合度": 0.15,
    "AI对话交互适配": 0.15,
    "UI布局清晰度": 0.15,
    "颜色风格一致性": 0.10,
    "文字可读性": 0.10,
    "场景氛围符合度": 0.15,
    "Sprite动画质量": 0.05,
    "整体游戏体验": 0.15
}

TOTAL_PASS_THRESHOLD = 80
MAX_ITERATIONS = 3

# 颜色规范（三色系）
COLOR_SPEC = {
    "田园绿系": {"主色": "#4a9", "辅色": "#6c7", "暗色": "#2d5"},
    "古朴棕系": {"主色": "#865", "辅色": "#a87", "暗色": "#5a3"},
    "自然蓝系": {"主色": "#6a8", "辅色": "#8ca", "暗色": "#3c6"}
}

# 路径配置
SCREENSHOT_DIR = "reports/visual_acceptance/screenshots/"
EVALUATION_DIR = "reports/visual_acceptance/evaluation_reports/"
MODIFICATION_LOG = "reports/visual_acceptance/modification_log.md"
SUMMARY_REPORT = "reports/visual_acceptance/summary_report.md"

# 验证配置是否正确加载
def validate_config():
    """验证必要的环境变量是否配置，缺失时抛出ValueError"""
    missing_vars = []
    if not QWEN_VL_API_URL:
        missing_vars.append("QWEN_VL_URL")
    if not QWEN_VL_API_KEY:
        missing_vars.append("QWEN_VL_KEY")
    if not GLM_API_URL:
        missing_vars.append("GLM_API_BASE")
    if not GLM_API_KEY:
        missing_vars.append("GLM_API_KEY")

    if missing_vars:
        raise ValueError(f"缺少必要的环境变量: {', '.join(missing_vars)}。请在.env文件中配置这些变量。")
    return True

# 权重总和验证（应为1.0）
def validate_weights():
    """验证权重总和是否为1.0"""
    total = sum(DIMENSION_WEIGHTS.values())
    if abs(total - 1.0) > 0.001:
        print(f"警告: 权重总和为 {total}，应为 1.0")
        return False
    return True