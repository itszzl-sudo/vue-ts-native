/**
 * @file menu.ts
 * @desc Menu 模块（对齐 Electron Menu/MenuItem）
 */

/**
 * 菜单项配置
 */
export interface MenuItemConstructorOptions {
  label?: string;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  click?: (menuItem: MenuItem, browserWindow: any) => void;
  submenu?: (MenuItemConstructorOptions | MenuItem)[];
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
  accelerator?: string;
}

/**
 * MenuItem 类
 */
export class MenuItem {
  label: string;
  type: string;
  enabled: boolean;
  visible: boolean;
  checked: boolean;
  submenu: Menu | null = null;
  private clickHandler?: (menuItem: MenuItem, browserWindow: any) => void;

  constructor(options: MenuItemConstructorOptions) {
    this.label = options.label || '';
    this.type = options.type || 'normal';
    this.enabled = options.enabled !== false;
    this.visible = options.visible !== false;
    this.checked = options.checked || false;
    this.clickHandler = options.click;

    if (options.submenu) {
      this.submenu = Menu.buildFromTemplate(options.submenu);
    }
  }

  /**
   * 点击
   */
  click(browserWindow?: any): void {
    if (this.clickHandler) {
      this.clickHandler(this, browserWindow);
    }
  }
}

/**
 * Menu 类
 */
export class Menu {
  private items: MenuItem[] = [];

  constructor() {}

  /**
   * 从模板构建菜单
   */
  static buildFromTemplate(template: (MenuItemConstructorOptions | MenuItem)[]): Menu {
    const menu = new Menu();
    template.forEach(item => {
      if (item instanceof MenuItem) {
        menu.items.push(item);
      } else {
        menu.items.push(new MenuItem(item));
      }
    });
    return menu;
  }

  /**
   * 追加菜单项
   */
  append(menuItem: MenuItem): void {
    this.items.push(menuItem);
  }

  /**
   * 插入菜单项
   */
  insert(pos: number, menuItem: MenuItem): void {
    this.items.splice(pos, 0, menuItem);
  }

  /**
   * 弹出上下文菜单
   */
  popup(options?: { x?: number; y?: number }): void {
    console.log('[Menu] popup:', options);
    // TODO: 对接 ts-native
  }

  /**
   * 设置为应用菜单（macOS）
   */
  static setApplicationMenu(menu: Menu | null): void {
    console.log('[Menu] setApplicationMenu');
  }

  /**
   * 获取应用菜单
   */
  static getApplicationMenu(): Menu | null {
    return null;
  }

  /**
   * 发送点击事件
   */
  static sendActionToFirstResponder(action: string): void {
    console.log('[Menu] sendActionToFirstResponder:', action);
  }
}
