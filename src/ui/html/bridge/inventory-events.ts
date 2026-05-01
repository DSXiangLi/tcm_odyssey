// src/ui/html/bridge/inventory-events.ts
/**
 * 背包UI事件桥接 - React与Phaser通信
 */

// 事件类型定义
export const INVENTORY_EVENTS = {
  OPEN: 'inventory:open',
  CLOSE: 'inventory:close',
  ITEM_SELECTED: 'inventory:item_selected',
  VIEW_CHANGED: 'inventory:view_changed',
  HERB_CLICK: 'inventory:herb_click',
  FORMULA_CLICK: 'inventory:formula_click',
  TOOL_CLICK: 'inventory:tool_click',
  BOOK_CLICK: 'inventory:book_click',
};

// 事件数据类型
export interface InventoryEventData {
  itemId?: string;
  itemName?: string;
  itemType?: 'herb' | 'formula' | 'tool' | 'book';
  view?: 'piece' | 'raw' | 'formula' | 'tool' | 'book';
  category?: string;
}

/**
 * 从React发送事件到Phaser
 */
export function bridgeToPhaser(eventName: string, data: InventoryEventData): void {
  const event = new CustomEvent(eventName, { detail: data });
  window.dispatchEvent(event);
}

/**
 * 从Phaser监听React事件
 */
export function listenFromPhaser(
  eventName: string,
  handler: (data: InventoryEventData) => void
): () => void {
  const listener = (e: Event) => {
    const customEvent = e as CustomEvent<InventoryEventData>;
    handler(customEvent.detail);
  };
  window.addEventListener(eventName, listener);
  // 返回取消监听函数
  return () => window.removeEventListener(eventName, listener);
}

/**
 * 发送打开背包事件
 */
export function emitInventoryOpen(): void {
  bridgeToPhaser(INVENTORY_EVENTS.OPEN, {});
}

/**
 * 发送关闭背包事件
 */
export function emitInventoryClose(): void {
  bridgeToPhaser(INVENTORY_EVENTS.CLOSE, {});
}

/**
 * 发送药材点击事件
 */
export function emitHerbClick(herbId: string, herbName: string, category: string): void {
  bridgeToPhaser(INVENTORY_EVENTS.HERB_CLICK, {
    itemId: herbId,
    itemName: herbName,
    itemType: 'herb',
    category,
  });
}

/**
 * 发送视图切换事件
 */
export function emitViewChanged(view: 'piece' | 'raw' | 'formula' | 'tool' | 'book'): void {
  bridgeToPhaser(INVENTORY_EVENTS.VIEW_CHANGED, { view });
}

/**
 * 发送方剂点击事件
 */
export function emitFormulaClick(formulaId: string, formulaName: string): void {
  bridgeToPhaser(INVENTORY_EVENTS.FORMULA_CLICK, {
    itemId: formulaId,
    itemName: formulaName,
    itemType: 'formula',
  });
}

/**
 * 发送工具点击事件
 */
export function emitToolClick(toolId: string, toolName: string): void {
  bridgeToPhaser(INVENTORY_EVENTS.TOOL_CLICK, {
    itemId: toolId,
    itemName: toolName,
    itemType: 'tool',
  });
}

/**
 * 发送书籍点击事件
 */
export function emitBookClick(bookId: string, bookName: string): void {
  bridgeToPhaser(INVENTORY_EVENTS.BOOK_CLICK, {
    itemId: bookId,
    itemName: bookName,
    itemType: 'book',
  });
}