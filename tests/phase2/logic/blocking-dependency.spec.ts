// tests/phase2/logic/blocking-dependency.spec.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

describe('Blocking Dependency Logic Tests (S2-L001~L003)', () => {
  const tasksPath = path.join(projectRoot, 'hermes/npcs/qingmu/TASKS.json');
  const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf-8'));

  it('S2-L001: No circular dependencies in blocked_by', () => {
    const visited = new Set<string>();
    const checkCircular = (taskId: string, chain: string[]): boolean => {
      if (chain.includes(taskId)) return true; // 循环依赖
      if (visited.has(taskId)) return false;
      visited.add(taskId);

      const task = tasks.tasks.find(t => t.task_id === taskId);
      if (task?.blocked_by) {
        return checkCircular(task.blocked_by, [...chain, taskId]);
      }
      return false;
    };

    for (const task of tasks.tasks) {
      expect(checkCircular(task.task_id, [])).toBe(false);
    }
  });

  it('S2-L002: All blocked_by references exist', () => {
    const taskIds = new Set(tasks.tasks.map(t => t.task_id));

    for (const task of tasks.tasks) {
      if (task.blocked_by) {
        expect(taskIds.has(task.blocked_by)).toBe(true);
      }
    }
  });

  it('S2-L003: statistics fields match actual data', () => {
    const actualCompleted = tasks.tasks.filter(t => t.status === 'completed').length;
    const actualInProgress = tasks.tasks.filter(t => t.status === 'in_progress').length;
    const actualPending = tasks.tasks.filter(t => t.status === 'pending').length;

    expect(tasks.statistics.completed).toBe(actualCompleted);
    expect(tasks.statistics.in_progress).toBe(actualInProgress);
    expect(tasks.statistics.pending).toBe(actualPending);
    expect(tasks.statistics.total_tasks).toBe(tasks.tasks.length);
  });
});