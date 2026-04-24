#!/usr/bin/env python3
"""
中药标本生成一键脚本
整合生图+切分+识别命名流程
只支持1、4、9三种药材数量（保证正方形切分）
"""

import sys
import argparse
from pathlib import Path
from typing import List

# 导入子模块
sys.path.insert(0, str(Path(__file__).parent))
from generate_herb_image import main as generate_main, suggest_batches
from crop_and_identify import main as crop_main


def full_workflow(
    herb_names: List[str],
    raw_dir: Path = None,
    skip_generation: bool = False
):
    """
    完整工作流程：生成图片 → 切分 → 识别命名

    Args:
        herb_names: 药材名称列表
        raw_dir: 原始图片临时目录
        skip_generation: 是否跳过生图（直接处理现有图片）
    """
    # 固定输出目录（项目根目录下的tests/assets）
    output_dir = Path(__file__).parent.parent.parent.parent / "tests/assets/herb_processed"

    if not raw_dir:
        raw_dir = Path(__file__).parent.parent.parent.parent / "tests/assets/herb_raw"

    print("=" * 70)
    print("中药植物标本生成器 - 完整流程")
    print("=" * 70)
    print()

    # Step 1: 生成图片（可选）
    if not skip_generation:
        print("【步骤1】生成中药材复合图片")
        print("-" * 70)

        # 校验药材数量
        total_count = len(herb_names)

        if total_count in [1, 4, 9]:
            # 单批生成
            herb_counts = [total_count]
            generate_main(herb_names, raw_dir)

        elif total_count > 9:
            # 多批生成（建议分批）
            batches = suggest_batches(herb_names)
            herb_counts = [len(batch) for batch in batches]

            print(f"药材数量: {total_count}，建议分 {len(batches)} 批处理")

            # 批量生成
            for i, batch in enumerate(batches, 1):
                print()
                print(f"=== 第 {i} 批 ({len(batch)}种) ===")
                print(f"药材: {', '.join(batch)}")
                generate_main(batch, raw_dir)

        else:
            # 无效数量（2, 3, 5-8）
            raise ValueError(
                f"药材数量必须为1、4或9种。当前{total_count}种无法生成正方形切分图。"
                f"请调整为4种，或增加到9种药材。"
            )

        print()
        print("✓ 图片生成完成")
        print()

    else:
        # 跳过生图，直接处理现有图片
        print("【跳过步骤1】使用现有图片")
        print("-" * 70)

        # 从raw目录推断药材数量（支持两种命名格式）
        raw_files = sorted(raw_dir.glob("*_raw.png"))

        # 如果没有找到_raw格式，尝试查找数字命名的文件
        if not raw_files:
            raw_files = sorted(raw_dir.glob("[0-9].png"))

        if raw_files:
            # 简单策略：默认每张都是四宫格
            herb_counts = [4] * len(raw_files)
        else:
            print(f"⚠ 未找到现有图片: {raw_dir}")
            return

    # Step 2: 切分和识别命名
    print()
    print("【步骤2】切分图片并AI识别命名")
    print("-" * 70)

    crop_main(raw_dir, output_dir, herb_counts)

    print()
    print("=" * 70)
    print("✓ 全流程完成！")
    print(f"最终输出目录: {output_dir}")
    print("=" * 70)


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="中药植物标本图生成器（支持1、4、9种药材）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  # 生成1种中药标本图（单图，4096×4096）
  python generate_specimen.py --herbs 人参

  # 生成4种中药标本图（2×2网格，每个2048×2048）
  python generate_specimen.py --herbs 葱白 薄荷 牛蒡子 蝉蜕

  # 生成9种中药标本图（3×3网格，每个1365×1365）
  python generate_specimen.py --herbs 麬 桂枝 紫苏叶 生姜 荆芥 防风 白芷 细辛 苍耳子

  # 生成13种中药（自动分批：第1批9种，第2批4种）
  python generate_specimen.py --herbs 麬 桂枝 紫苏叶 生姜 荆芥 防风 白芷 细辛 苍耳子 辛夷 桑叶 菊花 蔓荆子

  # 只处理现有图片（跳过生图，仅切分+识别）
  python generate_specimen.py --skip-generation

注意：
  ⚠ 药材数量必须为1、4、9，或组合为这些数量的批次（如13=9+4）
  ⚠ 不支持2、3、5-8种药材（无法生成正方形切分图，无法适配游戏UI的60×60格子）
        """
    )

    parser.add_argument(
        "--herbs", "-H",
        nargs="+",
        help="药材名称列表（空格分隔，数量必须为1、4或9）"
    )

    parser.add_argument(
        "--raw-dir", "-r",
        type=Path,
        help="原始图片临时目录（默认 tests/assets/herb_raw/）"
    )

    parser.add_argument(
        "--skip-generation", "-s",
        action="store_true",
        help="跳过生图步骤，只处理现有图片"
    )

    args = parser.parse_args()

    # 如果没有提供药材且不跳过生图，显示帮助
    if not args.herbs and not args.skip_generation:
        parser.print_help()
        print()
        print("⚠ 请提供药材名称列表，或使用 --skip-generation 处理现有图片")
        return

    # 执行工作流程
    try:
        full_workflow(
            herb_names=args.herbs or [],
            raw_dir=args.raw_dir,
            skip_generation=args.skip_generation
        )
    except ValueError as e:
        print()
        print(f"错误: {e}")
        print()
        parser.print_help()


if __name__ == "__main__":
    main()