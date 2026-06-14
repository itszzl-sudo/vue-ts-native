/**
 * @file crash-reporter.ts
 * @desc crashReporter 模块（对齐 Electron crashReporter）
 */

/**
 * crashReporter 配置
 */
export interface CrashReporterOptions {
  productName?: string;
  companyName?: string;
  submitURL: string;
  uploadToServer?: boolean;
  ignoreSystemCrashHandler?: boolean;
  rateLimit?: boolean;
}

/**
 * crashReporter 模块
 */
class CrashReporter {
  /**
   * 启动崩溃报告器
   */
  start(options: CrashReporterOptions): void {
    console.log('[crashReporter] start:', options);
  }

  /**
   * 获取最后崩溃报告
   */
  getLastCrashReport(): any {
    console.log('[crashReporter] getLastCrashReport');
    return null;
  }

  /**
   * 获取所有崩溃报告
   */
  getReports(): any[] {
    console.log('[crashReporter] getReports');
    return [];
  }

  /**
   * 设置额外参数
   */
  addExtraParameter(key: string, value: string): void {
    console.log(`[crashReporter] addExtraParameter: ${key}=${value}`);
  }

  /**
   * 移除额外参数
   */
  removeExtraParameter(key: string): void {
    console.log(`[crashReporter] removeExtraParameter: ${key}`);
  }

  /**
   * 获取上传状态
   */
  getUploadToServer(): boolean {
    return true;
  }

  /**
   * 设置上传状态
   */
  setUploadToServer(upload: boolean): void {
    console.log('[crashReporter] setUploadToServer:', upload);
  }
}

export const crashReporter = new CrashReporter();
