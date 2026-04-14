// tests/unit/data-structure.spec.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

describe('TASKS.json Functional Tests (S2-F001~F005)', () => {
  const tasksPath = path.join(projectRoot, 'hermes/npcs/qingmu/TASKS.json');
  const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));

  it('S2-F001: should have task_id, todos, blocked_by fields', () => {
    const task = tasks.tasks[0];
    expect(task.task_id).toBeDefined();
    expect(Array.isArray(task.todos)).toBe(true);
    expect(task.blocked_by).toBeDefined();
  });

  it('S2-F002: Todo status should be valid', () => {
    const validStatuses = ['pending', 'in_progress', 'completed'];
    for (const task of tasks.tasks) {
      for (const todo of task.todos) {
        expect(validStatuses).toContain(todo.status);
      }
    }
  });

  it('S2-F003: mastery should be in range 0-1', () => {
    for (const task of tasks.tasks) {
      for (const todo of task.todos) {
        expect(todo.mastery).toBeGreaterThanOrEqual(0);
        expect(todo.mastery).toBeLessThanOrEqual(1);
      }
    }
  });

  it('S2-F004: core_cases should have required fields', () => {
    const casesPath = path.join(projectRoot, 'src/data/cases/core_cases.json');
    const casesData = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));

    for (const case_ of casesData.cases) {
      expect(case_.case_id).toBeDefined();
      expect(case_.syndrome.type).toBeDefined();
      expect(Array.isArray(case_.clues.required)).toBe(true);
    }
  });

  it('S2-F005: Patient templates should have required fields', () => {
    const templatesDir = path.join(projectRoot, 'src/data/patient-templates');
    const templates = ['farmer', 'merchant', 'scholar', 'elder', 'child'];

    for (const t of templates) {
      const template = JSON.parse(fs.readFileSync(path.join(templatesDir, `${t}.json`), 'utf-8'));
      expect(template.template_id).toBe(t);
      expect(template.speaking_style).toBeDefined();
      expect(template.example_phrases.greeting).toBeDefined();
    }
  });
});