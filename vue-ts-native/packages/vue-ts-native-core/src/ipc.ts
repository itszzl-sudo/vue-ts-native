/**
 * @file ipc.ts
 * @desc ipc 模块 - 进程间通信（对齐 Electron ipcMain/ipcRenderer）
 */

/**
 * IPC 事件处理器
 */
export type IpcMainInvokeHandler<T = any> = (...args: any[]) => Promise<T> | T;

/**
 * IPC 调用选项
 */
export interface IpcRendererInvokeOptions {
  timeout?: number;
}

/**
 * ipcMain 模块（主进程）
 */
class IpcMain {
  private handlers = new Map<string, IpcMainInvokeHandler>();

  /**
   * 注册处理器
   */
  handle(channel: string, handler: IpcMainInvokeHandler): void {
    this.handlers.set(channel, handler);
  }

  /**
   * 移除处理器
   */
  removeHandler(channel: string): void {
    this.handlers.delete(channel);
  }

  /**
   * 触发处理器（内部使用）
   */
  async invoke(channel: string, ...args: any[]): Promise<any> {
    const handler = this.handlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for '${channel}'`);
    }
    return await handler(...args);
  }
}

/**
 * ipcRenderer 模块（渲染进程）
 */
class IpcRenderer {
  private listeners = new Map<string, Array<(...args: any[]) => void>>();

  /**
   * 发送消息
   */
  send(channel: string, ...args: any[]): void {
    console.log(`[ipcRenderer] send ${channel}:`, args);
  }

  /**
   * invoke 调用
   */
  async invoke(channel: string, ...args: any[]): Promise<any> {
    console.log(`[ipcRenderer] invoke ${channel}:`, args);
    // TODO: 实际对接到主进程
    return null;
  }

  /**
   * 监听事件
   */
  on(channel: string, listener: (...args: any[]) => void): void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    this.listeners.get(channel)!.push(listener);
  }

  /**
   * 移除监听器
   */
  removeListener(channel: string, listener: (...args: any[]) => void): void {
    const listeners = this.listeners.get(channel);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 一次性监听
   */
  once(channel: string, listener: (...args: any[]) => void): void {
    const onceListener = (...args: any[]) => {
      listener(...args);
      this.removeListener(channel, onceListener);
    };
    this.on(channel, onceListener);
  }
}

export const ipcMain = new IpcMain();
export const ipcRenderer = new IpcRenderer();
