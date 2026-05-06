// src/ui/html/paozhi-entry.tsx
/**
 * 炮制 UI React 入口
 *
 * 提供 mountPaozhiUI 函数供 Phaser PaozhiScene 调用
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import PaozhiUI, { PaozhiUIProps } from './PaozhiUI';

// 导入CSS
import './paozhi.css';

export interface PaozhiEntryProps extends PaozhiUIProps {
  initialRecipeId?: string;
}

/**
 * 挂载炮制 UI 到指定容器
 */
export function mountPaozhiUI(
  container: HTMLElement,
  props: PaozhiEntryProps
): Root {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <PaozhiUI {...props} />
    </React.StrictMode>
  );
  return root;
}

/**
 * 卸载炮制 UI
 */
export function unmountPaozhiUI(root: Root): void {
  root.unmount();
}

// 导出事件常量
export { PAOZHI_EVENTS } from './bridge/paozhi-events';