/**
 * @file tray.ts
 * @desc Tray 模块（对齐 Electron Tray）
 */

/**
 * Tray 配置
 */
export interface TrayOptions {
  icon?: string;
  tooltip?: string;
}

/**
 * Tray 类
 */
export class Tray {
  private id: number;
  private static idCounter = 0;

  constructor(icon: string | TrayOptions) {
    this.id = ++Tray.idCounter;
    console.log(`[Tray ${this.id}] constructor:`, icon);
    // TODO: 对接 ts-native js_desktop_show_tray
  }

  /**
   * 设置工具提示
   */
  setToolTip(toolTip: string): void {
    console.log(`[Tray ${this.id}] setToolTip: ${toolTip}`);
  }

  /**
   * 设置图标
   */
  setImage(icon: string): void {
    console.log(`[Tray ${this.id}] setImage: ${icon}`);
  }

  /**
   * 点击事件
   */
  on(event: 'click', listener: () => void): void {
    console.log(`[Tray ${this.id}] on click`);
  }

  /**
   * 右键菜单
   */
  setContextMenu(menu: any): void {
    console.log(`[Tray ${this.id}] setContextMenu`);
  }

  /**
   * 销毁
   */
  destroy(): void {
    console.log(`[Tray ${this.id}] destroy`);
  }

  /**
   * 是否销毁
   */
  isDestroyed(): boolean {
    return false;
  }
}
