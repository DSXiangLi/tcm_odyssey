#!/usr/bin/env python3
"""
诊断游戏视觉验收自动化脚本
Phase 2.5 诊断游戏 HTML 直接迁移

功能：
1. 启动游戏服务器
2. 进入诊断场景 (case-001)
3. 截取舌诊/脉诊/问诊/辨证/选方5个阶段截图
4. 生成视觉验收报告
"""

from playwright.sync_api import sync_playwright
import os
import time

# 截图保存目录
SCREENSHOT_DIR = '/tmp/diagnosis-visual-review'

def ensure_dir(path):
    """确保目录存在"""
    if not os.path.exists(path):
        os.makedirs(path)

def capture_diagnosis_stages():
    """捕获诊断游戏5个阶段截图"""

    ensure_dir(SCREENSHOT_DIR)

    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1440, 'height': 900}
        )
        page = context.new_page()

        print('[诊断游戏视觉验收] 开始测试...')

        # 1. 导航到游戏
        print('[1/6] 导航到游戏首页...')
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(3000)  # 等待游戏加载

        # 检查游戏容器
        game_container = page.locator('#game-container')
        if game_container.is_visible():
            print('  ✓ 游戏容器可见')

        # 2. 进入诊断场景
        print('[2/6] 进入诊断场景 (case-001)...')
        page.evaluate('''() => {
            const game = window.__PHASER_GAME__;
            if (game) {
                game.scene.start('DiagnosisScene', { caseId: 'case-001' });
            }
        }''')
        page.wait_for_timeout(3000)

        # 检查React UI
        react_root = page.locator('#diagnosis-react-root')
        if react_root.is_visible():
            print('  ✓ React UI容器可见')

        # 3. 截取舌诊阶段
        print('[3/6] 截取舌诊阶段...')
        page.wait_for_selector('.page-title', timeout=10000)
        page.screenshot(path=f'{SCREENSHOT_DIR}/01-tongue-stage.png', full_page=False)
        print(f'  ✓ 保存: {SCREENSHOT_DIR}/01-tongue-stage.png')

        # 4. 截取脉诊阶段
        print('[4/6] 截取脉诊阶段...')
        page.evaluate('''() => {
            const navItems = document.querySelectorAll('.nav-item');
            if (navItems.length > 1) {
                navItems[1].click();
            }
        }''')
        page.wait_for_timeout(1500)
        page.screenshot(path=f'{SCREENSHOT_DIR}/02-pulse-stage.png', full_page=False)
        print(f'  ✓ 保存: {SCREENSHOT_DIR}/02-pulse-stage.png')

        # 5. 截取问诊阶段
        print('[5/6] 截取问诊阶段...')
        page.evaluate('''() => {
            const navItems = document.querySelectorAll('.nav-item');
            if (navItems.length > 2) {
                navItems[2].click();
            }
        }''')
        page.wait_for_timeout(1500)
        page.screenshot(path=f'{SCREENSHOT_DIR}/03-wenzhen-stage.png', full_page=False)
        print(f'  ✓ 保存: {SCREENSHOT_DIR}/03-wenzhen-stage.png')

        # 6. 截取辨证阶段
        print('[6/6] 截取辨证/选方阶段...')
        page.evaluate('''() => {
            const navItems = document.querySelectorAll('.nav-item');
            if (navItems.length > 3) {
                navItems[3].click();
            }
        }''')
        page.wait_for_timeout(1500)
        page.screenshot(path=f'{SCREENSHOT_DIR}/04-bianzheng-stage.png', full_page=False)
        print(f'  ✓ 保存: {SCREENSHOT_DIR}/04-bianzheng-stage.png')

        # 7. 截取选方阶段
        page.evaluate('''() => {
            const navItems = document.querySelectorAll('.nav-item');
            if (navItems.length > 4) {
                navItems[4].click();
            }
        }''')
        page.wait_for_timeout(1500)
        page.screenshot(path=f'{SCREENSHOT_DIR}/05-xuanfang-stage.png', full_page=False)
        print(f'  ✓ 保存: {SCREENSHOT_DIR}/05-xuanfang-stage.png')

        # 8. 收集页面元素信息
        print('[分析] 收集UI元素信息...')

        elements_info = page.evaluate('''() => {
            return {
                sidebar: !!document.querySelector('.sidebar'),
                navItems: document.querySelectorAll('.nav-item').length,
                chipGroups: document.querySelectorAll('.chip-group').length,
                pageTitle: document.querySelector('.page-title')?.textContent,
                patientName: document.querySelector('.patient-pill')?.textContent,
                sealStamps: document.querySelectorAll('.seal-stamp').length,
                appDimensions: (() => {
                    const app = document.querySelector('.app');
                    if (!app) return null;
                    const rect = app.getBoundingClientRect();
                    return { width: rect.width, height: rect.height };
                })()
            };
        }''')

        print(f'  侧边栏: {elements_info["sidebar"]}')
        print(f'  导航项: {elements_info["navItems"]}个')
        print(f'  Chip组: {elements_info["chipGroups"]}个')
        print(f'  当前页面: {elements_info["pageTitle"]}')
        print(f'  患者: {elements_info["patientName"]}')
        print(f'  印章数: {elements_info["sealStamps"]}个')
        print(f'  应用尺寸: {elements_info["appDimensions"]}')

        browser.close()

        print('\n[完成] 截图保存目录:', SCREENSHOT_DIR)
        return elements_info

if __name__ == '__main__':
    capture_diagnosis_stages()