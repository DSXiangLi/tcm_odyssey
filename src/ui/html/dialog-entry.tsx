// src/ui/html/dialog-entry.tsx
/**
 * 对话UI React入口挂载点
 */

import { createRoot } from 'react-dom/client';
import { DialogUI, DialogUIOptions } from './DialogUI';
import './dialog.css';

let dialogRoot: ReturnType<typeof createRoot> | null = null;
let dialogContainer: HTMLDivElement | null = null;

/**
 * 创建并挂载对话UI
 */
export function createDialogUI(options: DialogUIOptions): () => void {
  // 创建容器
  if (!dialogContainer) {
    dialogContainer = document.createElement('div');
    dialogContainer.id = 'dialog-ui-root';
    dialogContainer.className = 'dialog-root';  // 添加CSS类
    document.body.appendChild(dialogContainer);
  }

  // 创建React root
  if (!dialogRoot) {
    dialogRoot = createRoot(dialogContainer);
  }

  // 渲染组件
  dialogRoot.render(
    <DialogUI
      npcId={options.npcId}
      npcName={options.npcName}
      playerId={options.playerId}
      gameContext={options.gameContext}
      mode={options.mode}
      onToolCall={options.onToolCall}
      onClose={options.onClose}
    />
  );

  // 返回清理函数
  return () => {
    if (dialogRoot && dialogContainer) {
      dialogRoot.unmount();
      dialogRoot = null;
      document.body.removeChild(dialogContainer);
      dialogContainer = null;
    }
  };
}

/**
 * 显示对话UI
 */
export function showDialogUI(options: DialogUIOptions): () => void {
  return createDialogUI(options);
}

/**
 * 隐藏对话UI
 */
export function hideDialogUI(): void {
  if (dialogRoot && dialogContainer) {
    dialogRoot.unmount();
    dialogRoot = null;
    document.body.removeChild(dialogContainer);
    dialogContainer = null;
  }
}

export default createDialogUI;