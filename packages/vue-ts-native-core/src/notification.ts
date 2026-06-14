/**
 * @file notification.ts
 * @desc Notification 模块（对齐 Electron Notification）
 */

/**
 * 通知配置
 */
export interface NotificationOptions {
  title?: string;
  body?: string;
  icon?: string;
  urgency?: 'normal' | 'critical';
}

/**
 * Notification 类
 */
export class Notification {
  private options: NotificationOptions;

  constructor(options: NotificationOptions) {
    this.options = options;
  }

  /**
   * 显示通知
   */
  show(): void {
    console.log('[Notification] show:', this.options);
    // TODO: 对接 ts-native js_desktop_show_notification
    if (typeof js_desktop_show_notification !== 'undefined') {
      js_desktop_show_notification(store_string(JSON.stringify(this.options)));
    }
  }

  /**
   * 关闭通知
   */
  close(): void {
    console.log('[Notification] close');
  }

  /**
   * 点击事件
   */
  on(event: 'click' | 'close' | 'error', listener: () => void): void {
    console.log(`[Notification] on ${event}`);
  }
}
