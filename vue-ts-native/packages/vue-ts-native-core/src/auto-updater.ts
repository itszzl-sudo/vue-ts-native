/**
 * @file auto-updater.ts
 * @desc autoUpdater 模块（对齐 Electron autoUpdater）
 */

/**
 * autoUpdater 模块
 */
class AutoUpdater {
  /**
   * 设置 feed URL
   */
  setFeedURL(options: { url: string; headers?: Record<string, string> }): void {
    console.log('[autoUpdater] setFeedURL:', options.url);
  }

  /**
   * 检查更新
   */
  checkForUpdates(): void {
    console.log('[autoUpdater] checkForUpdates');
  }

  /**
   * 下载更新
   */
  downloadUpdate(): void {
    console.log('[autoUpdater] downloadUpdate');
  }

  /**
   * 安装更新并重启
   */
  quitAndInstall(): void {
    console.log('[autoUpdater] quitAndInstall');
  }

  /**
   * 自动下载更新
   */
  autoDownload: boolean = true;

  /**
   * 自动安装更新
   */
  autoInstallOnAppQuit: boolean = true;

  /**
   * 监听事件
   */
  on(event: 'update-available' | 'update-not-available' | 'update-downloaded' | 'error', listener: (...args: any[]) => void): void {
    console.log(`[autoUpdater] on ${event}`);
  }
}

export const autoUpdater = new AutoUpdater();
