// src/ui/html/decoction-entry.ts
/**
 * 煎药 UI React 入口
 *
 * 提供 mountDecoctionUI 函数供 Phaser DecoctionScene 调用
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import DecoctionUI from './DecoctionUI';
import { DecoctionUIProps } from './types/index';

/**
 * 挂载煎药 UI 到指定容器
 */
export function mountDecoctionUI(
  container: HTMLElement,
  props: DecoctionUIProps
): Root {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <DecoctionUI {...props} />
    </React.StrictMode>
  );
  return root;
}

/**
 * 卸载煎药 UI
 */
export function unmountDecoctionUI(root: Root): void {
  root.unmount();
}

// 导出类型供外部使用
export { DecoctionUIProps, HerbPixelData, FormulaData, VialData } from './types/index';
export { DECOCTION_EVENTS } from './bridge/events';