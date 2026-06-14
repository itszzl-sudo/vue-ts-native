/**
 * @file desktop.ts
 * @desc 桌面 API 封装（通知、消息框、剪贴板、文件对话框）
 */

/**
 * 通知配置
 */
export interface NotificationOptions {
  /** 通知标题 */
  title?: string;
  /** 通知内容 */
  message: string;
}

/**
 * 显示桌面通知
 */
export function showNotification(options: NotificationOptions): void {
  if (typeof js_desktop_show_notification === 'undefined') {
    console.warn('[vue-ts-native] js_desktop_show_notification 不可用');
    return;
  }

  const optionsVal = store_string(JSON.stringify({
    title: options.title || 'Notification',
    message: options.message,
  }));

  js_desktop_show_notification(optionsVal);
}

/**
 * 消息框类型
 */
export type MessageBoxType = 'info' | 'warning' | 'error' | 'question';

/**
 * 消息框配置
 */
export interface MessageBoxOptions {
  /** 消息框类型 */
  type?: MessageBoxType;
  /** 标题 */
  title?: string;
  /** 消息内容 */
  message: string;
}

/**
 * 显示消息框
 */
export function showMessageBox(options: MessageBoxOptions): void {
  if (typeof js_desktop_show_message_box === 'undefined') {
    console.warn('[vue-ts-native] js_desktop_show_message_box 不可用');
    return;
  }

  const optionsVal = store_string(JSON.stringify({
    type: options.type || 'info',
    title: options.title || 'Message',
    message: options.message,
  }));

  js_desktop_show_message_box(optionsVal);
}

/**
 * 写入剪贴板
 */
export function clipboardWriteText(text: string): void {
  if (typeof js_desktop_clipboard_write_text === 'undefined') {
    console.warn('[vue-ts-native] js_desktop_clipboard_write_text 不可用');
    return;
  }

  const textVal = store_string(text);
  js_desktop_clipboard_write_text(textVal);
}

/**
 * 读取剪贴板
 */
export function clipboardReadText(): string {
  if (typeof js_desktop_clipboard_read_text === 'undefined') {
    console.warn('[vue-ts-native] js_desktop_clipboard_read_text 不可用');
    return '';
  }

  const result = js_desktop_clipboard_read_text();
  return get_string(result);
}

/**
 * 文件对话框配置
 */
export interface OpenDialogOptions {
  /** 对话框标题 */
  title?: string;
  /** 默认路径 */
  defaultPath?: string;
  /** 文件过滤器 */
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  /** 是否允许多选 */
  multiple?: boolean;
}

/**
 * 显示打开文件对话框
 */
export function showOpenDialog(options: OpenDialogOptions = {}): string[] {
  if (typeof js_desktop_show_open_dialog === 'undefined') {
    console.warn('[vue-ts-native] js_desktop_show_open_dialog 不可用');
    return [];
  }

  const optionsVal = store_string(JSON.stringify(options));
  const result = js_desktop_show_open_dialog(optionsVal);
  
  // 解析返回的文件路径数组
  const resultStr = get_string(result);
  try {
    return JSON.parse(resultStr);
  } catch {
    return [];
  }
}

/**
 * 保存文件对话框配置
 */
export interface SaveDialogOptions {
  /** 对话框标题 */
  title?: string;
  /** 默认路径 */
  defaultPath?: string;
  /** 文件过滤器 */
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

/**
 * 显示保存文件对话框
 */
export function showSaveDialog(options: SaveDialogOptions = {}): string {
  if (typeof js_desktop_show_save_dialog === 'undefined') {
    console.warn('[vue-ts-native] js_desktop_show_save_dialog 不可用');
    return '';
  }

  const optionsVal = store_string(JSON.stringify(options));
  const result = js_desktop_show_save_dialog(optionsVal);
  
  return get_string(result);
}
