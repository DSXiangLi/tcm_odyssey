// src/ui/base/ModalUI.ts
/**
 * ModalUI弹窗基类
 *
 * 继承BaseUIComponent，提供标准化弹窗尺寸和退出按钮位置。
 * 用于所有游戏弹窗的统一基类。
 *
 * Phase 2.5 UI Core Infrastructure Task 3
 */

import Phaser from 'phaser';
import BaseUIComponent from './BaseUIComponent';

/**
 * 标准弹窗尺寸定义
 * - DIAGNOSIS_MODAL: 720×480 (脉诊/舌诊/辨证/选方)
 * - INQUIRY_MODAL: 640×420 (问诊)
 * - MINIGAME_MODAL: 800×600 (煎药/炮制/种植)
 * - FULLSCREEN_MODAL: 1024×768 (背包/存档)
 * - DIALOG_MODAL: 500×300 (NPC对话)
 */
export const MODAL_SIZES = {
  DIAGNOSIS_MODAL: { width: 720, height: 480 },
  INQUIRY_MODAL: { width: 640, height: 420 },
  MINIGAME_MODAL: { width: 800, height: 600 },
  FULLSCREEN_MODAL: { width: 1024, height: 768 },
  DIALOG_MODAL: { width: 500, height: 300 },
} as const;

/**
 * 弹窗类型（MODAL_SIZES的键）
 */
export type ModalType = keyof typeof MODAL_SIZES;

/**
 * 退出按钮位置（相对于弹窗中心）
 * 计算公式：x = width/2 - 20, y = -height/2 + 10
 *
 * 示例：
 * - DIAGNOSIS_MODAL (720x480): x=340, y=-250
 * - MINIGAME_MODAL (800x600): x=380, y=-290
 */
export const EXIT_BUTTON_POSITIONS: Record<ModalType, { x: number; y: number }> = {
  DIAGNOSIS_MODAL: { x: 340, y: -250 },
  INQUIRY_MODAL: { x: 300, y: -200 },
  MINIGAME_MODAL: { x: 380, y: -290 },
  FULLSCREEN_MODAL: { x: 492, y: -384 },
  DIALOG_MODAL: { x: 240, y: -150 },
} as const;

/**
 * ModalUI弹窗基类
 * 继承BaseUIComponent，提供：
 * - 标准化弹窗尺寸
 * - 标准化退出按钮位置
 * - 默认3D边框样式
 * - ESC快捷键退出
 */
export default class ModalUI extends BaseUIComponent {
  /** 弹窗类型 */
  public modalType: ModalType;

  /** 退出回调函数 */
  protected onExit: () => void;

  /** ESC键处理函数引用（用于销毁时移除） */
  protected escHandler: (() => void) | null = null;

  /**
   * 构造函数
   * @param scene Phaser场景
   * @param modalType 弹窗类型
   * @param exitText 退出按钮文字
   * @param onExit 退出回调函数
   * @param depth 可选的深度层级，默认100
   */
  constructor(
    scene: Phaser.Scene,
    modalType: ModalType,
    exitText: string = '[退出]',
    onExit: () => void,
    depth: number = 100
  ) {
    // 获取弹窗尺寸
    const size = MODAL_SIZES[modalType];

    // 调用父类构造函数
    super(scene, size.width, size.height, depth);

    // 存储弹窗类型
    this.modalType = modalType;
    this.onExit = onExit;

    // 绘制默认3D边框
    this.drawBorder('3d');

    // 创建退出按钮
    const exitPosition = EXIT_BUTTON_POSITIONS[modalType];
    this.createExitButton(exitText, exitPosition, onExit);

    // 设置ESC快捷键
    this.setupEscapeKey();
  }

  /**
   * 设置ESC快捷键退出
   */
  protected setupEscapeKey(): void {
    if (this.scene.input.keyboard) {
      this.escHandler = () => {
        if (this.onExit) {
          this.onExit();
        }
      };

      this.scene.input.keyboard.on('keydown-ESC', this.escHandler);
    }
  }

  /**
   * 销毁弹窗
   * 移除ESC监听器，然后调用父类销毁方法
   */
  destroy(): void {
    // 移除ESC键监听
    if (this.scene.input.keyboard && this.escHandler) {
      this.scene.input.keyboard.off('keydown-ESC', this.escHandler);
      this.escHandler = null;
    }

    // 调用父类销毁方法
    super.destroy();
  }

  /**
   * 静态方法：获取指定弹窗类型的尺寸
   * @param modalType 弹窗类型
   * @returns 弹窗尺寸 {width, height}
   */
  static getSize(modalType: ModalType): { width: number; height: number } {
    return MODAL_SIZES[modalType];
  }

  /**
   * 静态方法：获取指定弹窗类型的退出按钮位置
   * @param modalType 弹窗类型
   * @returns 退出按钮位置 {x, y}
   */
  static getExitPosition(modalType: ModalType): { x: number; y: number } {
    return EXIT_BUTTON_POSITIONS[modalType];
  }
}