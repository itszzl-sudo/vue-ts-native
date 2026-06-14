/**
 * @file shell.ts
 * @desc shell 模块（对齐 Electron shell）
 */

/**
 * 打开外部链接选项
 */
export interface OpenExternalOptions {
  activate?: boolean;
  workingDirectory?: string;
}

/**
 * shell 模块
 */
class Shell {
  /**
   * 在默认浏览器中打开 URL
   */
  openExternal(url: string, options?: OpenExternalOptions): Promise<void> {
    // 在 WebView2 环境中，可以直接使用 window.open
    window.open(url, '_blank');
    return Promise.resolve();
  }

  /**
   * 打开本地文件
   */
  openPath(filePath: string): Promise<string> {
    // TODO: 对接 ts-native ShellExecuteW
    console.log(`[shell] openPath: ${filePath}`);
    return Promise.resolve('');
  }

  /**
   * 显示文件所在文件夹
   */
  showItemInFolder(fullPath: string): void {
    console.log(`[shell] showItemInFolder: ${fullPath}`);
  }

  /**
   * 移动文件到回收站
   */
  trashItem(path: string): Promise<void> {
    console.log(`[shell] trashItem: ${path}`);
    return Promise.resolve();
  }
}

export const shell = new Shell();
