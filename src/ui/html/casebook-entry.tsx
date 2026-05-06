// src/ui/html/casebook-entry.tsx
/**
 * 病案集 UI React 入口
 *
 * 提供 mountCasebookUI 函数供 Phaser CasebookScene 调用
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import CasebookUI from './CasebookUI';
import { CASEBOOK_EVENTS } from './bridge/casebook-events';

export interface CasebookUIProps {
  onClose: () => void;
  initialCaseId?: string;
  progress: Record<string, string[]>;
}

/**
 * 挂载病案集 UI 到指定容器
 */
export function mountCasebookUI(
  container: HTMLElement,
  props: CasebookUIProps
): Root {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <CasebookUI {...props} />
    </React.StrictMode>
  );
  return root;
}

/**
 * 卸载病案集 UI
 */
export function unmountCasebookUI(root: Root): void {
  root.unmount();
}

// 导出事件常量
export { CASEBOOK_EVENTS } from './bridge/casebook-events';