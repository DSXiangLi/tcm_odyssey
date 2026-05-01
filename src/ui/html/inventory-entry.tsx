// src/ui/html/inventory-entry.tsx
/**
 * 背包UI React入口挂载点
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import InventoryUI from './InventoryUI';
import './inventory.css';

export interface InventoryUIOptions {
  onClose: () => void;
}

let inventoryRoot: createRoot | null = null;
let inventoryContainer: HTMLDivElement | null = null;

/**
 * 创建并挂载背包UI
 */
export function createInventoryUI(options: InventoryUIOptions): () => void {
  // 创建容器
  if (!inventoryContainer) {
    inventoryContainer = document.createElement('div');
    inventoryContainer.id = 'inventory-ui-root';
    document.body.appendChild(inventoryContainer);
  }

  // 创建React root
  if (!inventoryRoot) {
    inventoryRoot = createRoot(inventoryContainer);
  }

  // 渲染组件
  inventoryRoot.render(
    <InventoryUI onClose={options.onClose} />
  );

  // 返回清理函数
  return () => {
    if (inventoryRoot && inventoryContainer) {
      inventoryRoot.unmount();
      inventoryRoot = null;
      document.body.removeChild(inventoryContainer);
      inventoryContainer = null;
    }
  };
}

/**
 * 显示背包UI
 */
export function showInventoryUI(onClose: () => void): () => void {
  return createInventoryUI({ onClose });
}

/**
 * 隐藏背包UI
 */
export function hideInventoryUI(): void {
  if (inventoryRoot && inventoryContainer) {
    inventoryRoot.unmount();
    inventoryRoot = null;
    document.body.removeChild(inventoryContainer);
    inventoryContainer = null;
  }
}

export default createInventoryUI;