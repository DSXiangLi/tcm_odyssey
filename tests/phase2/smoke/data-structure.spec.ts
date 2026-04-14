// tests/phase2/smoke/data-structure.spec.ts
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

test.describe('Data Structure Smoke Tests (S2-S001~S003)', () => {
  test('S2-S001: All JSON files exist', async ({ page }) => {
    // 检查关键JSON文件存在
    const files = [
      'hermes/npcs/qingmu/TASKS.json',
      'src/data/cases/core_cases.json',
      'src/data/patient-templates/farmer.json',
      'src/data/patient-templates/merchant.json',
      'src/data/patient-templates/scholar.json',
      'src/data/patient-templates/elder.json',
      'src/data/patient-templates/child.json'
    ];

    for (const file of files) {
      const fullPath = path.join(projectRoot, file);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  test('S2-S002: All JSON files are valid syntax', async ({ page }) => {
    const files = [
      'hermes/npcs/qingmu/TASKS.json',
      'src/data/cases/core_cases.json'
    ];

    for (const file of files) {
      const fullPath = path.join(projectRoot, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toBeDefined();
    }
  });

  test('S2-S003: NPC directory structure complete', async ({ page }) => {
    const requiredFiles = [
      'hermes/npcs/qingmu/SOUL.md',
      'hermes/npcs/qingmu/MEMORY.md',
      'hermes/npcs/qingmu/USER.md',
      'hermes/npcs/qingmu/SYLLABUS.md',
      'hermes/npcs/qingmu/TASKS.json'
    ];

    for (const file of requiredFiles) {
      const fullPath = path.join(projectRoot, file);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });
});