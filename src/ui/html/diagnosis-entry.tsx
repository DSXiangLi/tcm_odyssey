// src/ui/html/diagnosis-entry.tsx
/**
 * 诊断 UI React 入口
 *
 * Phase 2.5 诊断游戏 HTML 直接迁移
 *
 * 提供 mountDiagnosisUI 函数供 Phaser DiagnosisScene 调用
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { DiagnosisUI, DiagnosisUIProps, DiagnosisResult } from './DiagnosisUI';
import { DiagnosisCase } from './data/diagnosis-cases';
import { DIAGNOSIS_EVENTS } from './bridge/diagnosis-events';

/**
 * 诊断 UI Props（扩展版，用于入口函数）
 */
export interface DiagnosisEntryProps extends DiagnosisUIProps {
  caseData: DiagnosisCase;
}

/**
 * 挂载诊断 UI 到指定容器
 */
export function mountDiagnosisUI(
  container: HTMLElement,
  props: DiagnosisEntryProps
): Root {
  const root = createRoot(container);

  // 包装 onComplete 和 onClose 以发送桥接事件
  const wrappedProps: DiagnosisUIProps = {
    caseData: props.caseData,
    onComplete: (result: DiagnosisResult) => {
      // 发送完成事件
      window.dispatchEvent(new CustomEvent(DIAGNOSIS_EVENTS.COMPLETE, {
        detail: result
      }));

      // 调用原始回调
      if (props.onComplete) {
        props.onComplete(result);
      }
    },
    onClose: () => {
      // 发送关闭事件
      window.dispatchEvent(new CustomEvent(DIAGNOSIS_EVENTS.CLOSE));

      // 调用原始回调
      if (props.onClose) {
        props.onClose();
      }
    }
  };

  root.render(
    <React.StrictMode>
      <DiagnosisUI {...wrappedProps} />
    </React.StrictMode>
  );

  return root;
}

/**
 * 卸载诊断 UI
 */
export function unmountDiagnosisUI(root: Root): void {
  root.unmount();
}

// 导出类型供外部使用
export type { DiagnosisUIProps, DiagnosisResult };
export type { DiagnosisCase };
export { DIAGNOSIS_EVENTS };
export { getCaseById, getCaseCategories, getCasesByCategory, DIAGNOSIS_CASES } from './data/diagnosis-cases';