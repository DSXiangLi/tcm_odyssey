#!/usr/bin/env python3
"""
E2E Test: Hermes WebUI Integration for NPC Qingmu

验证 NPC 配置加载、工具注册、Skills 加载的核心功能。
"""

import os
import sys
import json
import yaml
from pathlib import Path
from typing import Dict, List, Any

class HermesWebUIIntegrationTest:
    """Hermes WebUI 集成测试套件"""

    def __init__(self, npc_name: str = "qingmu"):
        self.npc_name = npc_name
        # Path: tests/e2e -> project_root (需要往上两级)
        self.base_dir = Path(__file__).parent.parent.parent / "hermes" / "npcs" / npc_name
        self.results = {"passed": [], "failed": [], "warnings": []}

    def run_all_tests(self) -> Dict[str, Any]:
        """运行所有测试并返回结果"""
        print(f"\n{'='*60}")
        print(f"🧪 Hermes WebUI Integration Test: {self.npc_name}")
        print(f"{'='*60}\n")

        # Test 1: NPC配置文件完整性
        self.test_npc_config_files()

        # Test 2: Skills目录结构
        self.test_skills_structure()

        # Test 3: Plugins目录结构
        self.test_plugins_structure()

        # Test 4: plugin.yaml内容验证
        self.test_plugin_manifest()

        # Test 5: 工具schemas定义验证
        self.test_tool_schemas()

        # Test 6: Handler实现验证
        self.test_handlers()

        # Test 7: 注册函数验证
        self.test_registration()

        # Test 8: Mock handler调用测试
        self.test_mock_handlers()

        # 输出结果
        self.print_results()

        return self.results

    def test_npc_config_files(self):
        """Test 1: NPC配置文件完整性"""
        test_name = "NPC配置文件完整性"
        required_files = ["SOUL.md", "USER.md", "MEMORY.md"]

        print(f"📋 {test_name}")

        missing_files = []
        for file in required_files:
            file_path = self.base_dir / file
            if file_path.exists():
                content_size = file_path.stat().st_size
                print(f"  ✅ {file} exists ({content_size} bytes)")
            else:
                missing_files.append(file)
                print(f"  ❌ {file} missing")

        if not missing_files:
            self.results["passed"].append(test_name)
        else:
            self.results["failed"].append(f"{test_name} - missing: {', '.join(missing_files)}")

    def test_skills_structure(self):
        """Test 2: Skills目录结构"""
        test_name = "Skills目录结构"
        required_skills = [
            "teaching_syllabus/SKILL.md",
            "guided_questioning/SKILL.md",
            "case_analysis/SKILL.md",
            "feedback_evaluation/SKILL.md"
        ]
        optional_skills = [
            "tcm-knowledge/herbs",
            "tcm-knowledge/formulas",
            "tcm-knowledge/syndromes"
        ]

        print(f"📚 {test_name}")

        missing_skills = []
        for skill in required_skills:
            skill_path = self.base_dir / "skills" / skill
            if skill_path.exists():
                print(f"  ✅ {skill} exists")
                # 检查元数据头
                content = skill_path.read_text()
                if content.startswith("---"):
                    print(f"     ✅ Skill metadata header present")
                else:
                    print(f"     ⚠️  Warning: No skill metadata header")
            else:
                missing_skills.append(skill)
                print(f"  ❌ {skill} missing")

        # 检查可选目录
        for dir_path in optional_skills:
            path = self.base_dir / "skills" / dir_path
            if path.exists():
                print(f"  ✅ {dir_path} directory exists")
            else:
                print(f"  ⚠️  {dir_path} not found (optional)")

        if not missing_skills:
            self.results["passed"].append(test_name)
        else:
            self.results["failed"].append(f"{test_name} - missing: {', '.join(missing_skills)}")

    def test_plugins_structure(self):
        """Test 3: Plugins目录结构"""
        test_name = "Plugins目录结构"
        required_files = [
            "plugins/tcm-game/plugin.yaml",
            "plugins/tcm-game/schemas.py",
            "plugins/tcm-game/handlers.py",
            "plugins/tcm-game/__init__.py"
        ]

        print(f"🔌 {test_name}")

        missing_files = []
        for file in required_files:
            file_path = self.base_dir / file
            if file_path.exists():
                print(f"  ✅ {file} exists")
            else:
                missing_files.append(file)
                print(f"  ❌ {file} missing")

        if not missing_files:
            self.results["passed"].append(test_name)
        else:
            self.results["failed"].append(f"{test_name} - missing: {', '.join(missing_files)}")

    def test_plugin_manifest(self):
        """Test 4: plugin.yaml内容验证"""
        test_name = "plugin.yaml内容验证"
        yaml_path = self.base_dir / "plugins" / "tcm-game" / "plugin.yaml"

        print(f"📄 {test_name}")

        if not yaml_path.exists():
            print(f"  ❌ plugin.yaml not found")
            self.results["failed"].append(f"{test_name} - file not found")
            return

        try:
            with open(yaml_path) as f:
                manifest = yaml.safe_load(f)

            # 验证必要字段
            required_fields = ["name", "version", "description", "provides_tools"]
            missing_fields = []
            for field in required_fields:
                if field not in manifest:
                    missing_fields.append(field)
                    print(f"  ❌ Missing field: {field}")
                else:
                    print(f"  ✅ {field}: {manifest[field]}")

            # 验证工具数量
            if "provides_tools" in manifest:
                tools = manifest["provides_tools"].get("tools", [])
                expected_tools = [
                    "get_inventory",
                    "get_learning_progress",
                    "get_case_progress",
                    "trigger_minigame",
                    "record_weakness",
                    "get_npc_memory"
                ]

                missing_tools = []
                for tool in expected_tools:
                    if tool in tools:
                        print(f"     ✅ Tool: {tool}")
                    else:
                        missing_tools.append(tool)
                        print(f"     ❌ Missing tool: {tool}")

                if missing_tools:
                    self.results["warnings"].append(f"{test_name} - missing tools: {', '.join(missing_tools)}")

            if not missing_fields:
                self.results["passed"].append(test_name)
            else:
                self.results["failed"].append(f"{test_name} - missing fields: {', '.join(missing_fields)}")

        except Exception as e:
            print(f"  ❌ YAML parse error: {e}")
            self.results["failed"].append(f"{test_name} - parse error: {str(e)}")

    def test_tool_schemas(self):
        """Test 5: 工具schemas定义验证"""
        test_name = "工具schemas定义验证"
        schemas_path = self.base_dir / "plugins" / "tcm-game" / "schemas.py"

        print(f"🛠️  {test_name}")

        if not schemas_path.exists():
            print(f"  ❌ schemas.py not found")
            self.results["failed"].append(f"{test_name} - file not found")
            return

        try:
            # 导入 schemas 模块
            sys.path.insert(0, str(schemas_path.parent))
            import schemas

            # 检查 ALL_SCHEMAS
            if hasattr(schemas, "ALL_SCHEMAS"):
                print(f"  ✅ ALL_SCHEMAS found with {len(schemas.ALL_SCHEMAS)} schemas")

                expected_schemas = [
                    "get_learning_progress",
                    "get_case_progress",
                    "get_inventory",
                    "trigger_minigame",
                    "record_weakness",
                    "get_npc_memory"
                ]

                missing_schemas = []
                for schema_name in expected_schemas:
                    found = any(s["name"] == schema_name for s in schemas.ALL_SCHEMAS)
                    if found:
                        print(f"     ✅ Schema: {schema_name}")
                    else:
                        missing_schemas.append(schema_name)
                        print(f"     ❌ Missing schema: {schema_name}")

                if missing_schemas:
                    self.results["failed"].append(f"{test_name} - missing schemas: {', '.join(missing_schemas)}")
                else:
                    self.results["passed"].append(f"{test_name} ({len(schemas.ALL_SCHEMAS)} schemas)")
            else:
                print(f"  ❌ ALL_SCHEMAS not defined")
                self.results["failed"].append(f"{test_name} - ALL_SCHEMAS not defined")

        except Exception as e:
            print(f"  ❌ Import error: {e}")
            self.results["failed"].append(f"{test_name} - import error: {str(e)}")

    def test_handlers(self):
        """Test 6: Handler实现验证"""
        test_name = "Handler实现验证"
        handlers_path = self.base_dir / "plugins" / "tcm-game" / "handlers.py"

        print(f"⚙️  {test_name}")

        if not handlers_path.exists():
            print(f"  ❌ handlers.py not found")
            self.results["failed"].append(f"{test_name} - file not found")
            return

        try:
            sys.path.insert(0, str(handlers_path.parent))
            import handlers

            if hasattr(handlers, "ALL_HANDLERS"):
                print(f"  ✅ ALL_HANDLERS found with {len(handlers.ALL_HANDLERS)} handlers")
                self.results["passed"].append(f"{test_name} ({len(handlers.ALL_HANDLERS)} handlers)")
            else:
                print(f"  ❌ ALL_HANDLERS not defined")
                self.results["failed"].append(f"{test_name} - ALL_HANDLERS not defined")

        except Exception as e:
            print(f"  ❌ Import error: {e}")
            self.results["failed"].append(f"{test_name} - import error: {str(e)}")

    def test_registration(self):
        """Test 7: 注册函数验证"""
        test_name = "注册函数验证"
        init_path = self.base_dir / "plugins" / "tcm-game" / "__init__.py"

        print(f"📝 {test_name}")

        if not init_path.exists():
            print(f"  ❌ __init__.py not found")
            self.results["failed"].append(f"{test_name} - file not found")
            return

        try:
            content = init_path.read_text()

            # 检查关键元素
            checks = [
                ("register function", "def register(ctx)"),
                ("TOOLS list", "_TOOLS ="),
                ("register_tool call", "ctx.register_tool")
            ]

            missing = []
            for check_name, check_str in checks:
                if check_str in content:
                    print(f"  ✅ {check_name} found")
                else:
                    missing.append(check_name)
                    print(f"  ❌ {check_name} missing")

            if not missing:
                self.results["passed"].append(test_name)
            else:
                self.results["failed"].append(f"{test_name} - missing: {', '.join(missing)}")

        except Exception as e:
            print(f"  ❌ Read error: {e}")
            self.results["failed"].append(f"{test_name} - read error: {str(e)}")

    def test_mock_handlers(self):
        """Test 8: Mock handler调用测试"""
        test_name = "Mock handler调用测试"

        print(f"🎮 {test_name}")

        try:
            sys.path.insert(0, str(self.base_dir / "plugins" / "tcm-game"))
            import handlers

            # 测试每个 handler
            test_cases = [
                ("get_learning_progress", {"player_id": "test_player"}),
                ("get_case_progress", {"player_id": "test_player", "case_id": "all"}),
                ("get_inventory", {"player_id": "test_player", "category": "herbs"}),
                ("trigger_minigame", {"game_type": "diagnosis", "case_id": "case_001"}),
                ("record_weakness", {"player_id": "test_player", "task_id": "task_001", "weakness_type": "辨证思路", "details": "test"}),
                ("get_npc_memory", {"npc_id": "qingmu", "player_id": "test_player"})
            ]

            failed_tests = []
            for handler_name, args in test_cases:
                handler_func = getattr(handlers, f"{handler_name}_handler", None)
                if handler_func:
                    result = handler_func(args)
                    if result and isinstance(result, dict):
                        print(f"  ✅ {handler_name} returns valid dict")
                    else:
                        failed_tests.append(handler_name)
                        print(f"  ❌ {handler_name} returns invalid result")
                else:
                    failed_tests.append(handler_name)
                    print(f"  ❌ {handler_name}_handler not found")

            if not failed_tests:
                self.results["passed"].append(test_name)
            else:
                self.results["failed"].append(f"{test_name} - failed: {', '.join(failed_tests)}")

        except Exception as e:
            print(f"  ❌ Test execution error: {e}")
            self.results["failed"].append(f"{test_name} - execution error: {str(e)}")

    def print_results(self):
        """输出测试结果"""
        print(f"\n{'='*60}")
        print(f"📊 Test Results Summary")
        print(f"{'='*60}\n")

        passed_count = len(self.results["passed"])
        failed_count = len(self.results["failed"])
        warning_count = len(self.results["warnings"])

        print(f"✅ Passed: {passed_count}")
        for test in self.results["passed"]:
            print(f"   - {test}")

        print(f"\n❌ Failed: {failed_count}")
        for test in self.results["failed"]:
            print(f"   - {test}")

        print(f"\n⚠️  Warnings: {warning_count}")
        for test in self.results["warnings"]:
            print(f"   - {test}")

        print(f"\n{'='*60}")
        if failed_count == 0:
            print(f"🎉 All tests passed!")
        else:
            print(f"❌ {failed_count} tests failed")
        print(f"{'='*60}\n")


def main():
    """主函数"""
    npc_name = sys.argv[1] if len(sys.argv) > 1 else "qingmu"

    tester = HermesWebUIIntegrationTest(npc_name)
    results = tester.run_all_tests()

    # 返回退出码
    if results["failed"]:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()