/**
 * @file app.ts
 * @desc app 模块 - 应用生命周期（对齐 Electron app）
 */

/**
 * 应用就绪回调
 */
export type AppReadyCallback = () => void;

/**
 * app 模块
 */
class App {
  private readyCallbacks: AppReadyCallback[] = [];
  private isReady = false;

  constructor() {
    // 模拟应用就绪
    setTimeout(() => {
      this.isReady = true;
      this.readyCallbacks.forEach(cb => cb());
    }, 0);
  }

  /**
   * 应用就绪时回调
   */
  whenReady(callback: AppReadyCallback): void {
    if (this.isReady) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
  }

  /**
   * 退出应用
   */
  exit(exitCode?: number): void {
    if (typeof process !== 'undefined') {
      process.exit(exitCode);
    }
  }

  /**
   * 获取应用路径
   */
  getPath(name: string): string {
    // TODO: 对接 ts-native API
    return '';
  }

  /**
   * 获取应用版本
   */
  getVersion(): string {
    return '1.0.0';
  }

  /**
   * 设置应用名称
   */
  getName(): string {
    return 'vue-ts-native-app';
  }

  /**
   * 是否为打包应用
   */
  isPackaged(): boolean {
    return true;
  }
}

export const app = new App();
