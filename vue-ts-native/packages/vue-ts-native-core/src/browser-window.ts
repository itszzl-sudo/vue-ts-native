/**
 * @file browser-window.ts
 * @desc BrowserWindow 模块 - 窗口管理（对齐 Electron BrowserWindow）
 */

/**
 * 窗口配置
 */
export interface BrowserWindowOptions {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  title?: string;
  resizable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  closable?: boolean;
  webPreferences?: {
    nodeIntegration?: boolean;
    contextIsolation?: boolean;
  };
}

/**
 * 加载 URL 选项
 */
export interface LoadURLOptions {
  extraHeaders?: string;
}

/**
 * BrowserWindow 类
 */
export class BrowserWindow {
  private _id: number;
  private options: BrowserWindowOptions;
  private static instances = new Map<number, BrowserWindow>();
  private static idCounter = 0;

  constructor(options: BrowserWindowOptions = {}) {
    this._id = ++BrowserWindow.idCounter;
    this.options = {
      width: 800,
      height: 600,
      title: 'Window',
      resizable: true,
      ...options,
    };

    BrowserWindow.instances.set(this._id, this);
  }

  /**
   * 窗口 ID
   */
  get id(): number {
    return this._id;
  }

  /**
   * 加载 URL
   */
  loadURL(url: string, options?: LoadURLOptions): Promise<void> {
    // TODO: 对接 ts-native js_desktop_show_window
    console.log(`[BrowserWindow ${this.id}] loadURL: ${url}`);
    return Promise.resolve();
  }

  /**
   * 加载 HTML 文件
   */
  loadFile(filePath: string): Promise<void> {
    return this.loadURL(`file://${filePath}`);
  }

  /**
   * 显示窗口
   */
  show(): void {
    console.log(`[BrowserWindow ${this.id}] show`);
  }

  /**
   * 隐藏窗口
   */
  hide(): void {
    console.log(`[BrowserWindow ${this.id}] hide`);
  }

  /**
   * 关闭窗口
   */
  close(): void {
    console.log(`[BrowserWindow ${this.id}] close`);
    BrowserWindow.instances.delete(this.id);
  }

  /**
   * 最小化
   */
  minimize(): void {
    console.log(`[BrowserWindow ${this.id}] minimize`);
  }

  /**
   * 最大化
   */
  maximize(): void {
    console.log(`[BrowserWindow ${this.id}] maximize`);
  }

  /**
   * 还原
   */
  restore(): void {
    console.log(`[BrowserWindow ${this.id}] restore`);
  }

  /**
   * 聚焦
   */
  focus(): void {
    console.log(`[BrowserWindow ${this.id}] focus`);
  }

  /**
   * 是否聚焦
   */
  isFocused(): boolean {
    return true;
  }

  /**
   * 设置标题
   */
  setTitle(title: string): void {
    this.options.title = title;
    console.log(`[BrowserWindow ${this.id}] setTitle: ${title}`);
  }

  /**
   * 获取标题
   */
  getTitle(): string {
    return this.options.title || '';
  }

  /**
   * 获取所有窗口实例
   */
  static getAllWindows(): BrowserWindow[] {
    return Array.from(BrowserWindow.instances.values());
  }

  /**
   * 获取焦点窗口
   */
  static getFocusedWindow(): BrowserWindow | undefined {
    return BrowserWindow.instances.values().next().value;
  }

  /**
   * 从 ID 获取窗口
   */
  static fromId(id: number): BrowserWindow | undefined {
    return BrowserWindow.instances.get(id);
  }
}
