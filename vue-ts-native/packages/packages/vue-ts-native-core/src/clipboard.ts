/**
 * @file clipboard.ts
 * @desc clipboard 模块（对齐 Electron clipboard）
 */

/**
 * clipboard 模块
 */
class Clipboard {
  /**
   * 读取文本
   */
  readText(type?: 'selection' | 'clipboard'): string {
    if (typeof js_desktop_clipboard_read_text === 'undefined') {
      console.warn('[vue-ts-native] clipboard API 不可用');
      return '';
    }
    return get_string(js_desktop_clipboard_read_text());
  }

  /**
   * 写入文本
   */
  writeText(text: string, type?: 'selection' | 'clipboard'): void {
    if (typeof js_desktop_clipboard_write_text === 'undefined') {
      console.warn('[vue-ts-native] clipboard API 不可用');
      return;
    }
    js_desktop_clipboard_write_text(store_string(text));
  }

  /**
   * 读取 HTML
   */
  readHTML(): string {
    return '';
  }

  /**
   * 写入 HTML
   */
  writeHTML(html: string): void {
    // TODO: 对接 ts-native
  }

  /**
   * 清空剪贴板
   */
  clear(type?: 'selection' | 'clipboard'): void {
    this.writeText('');
  }
}

export const clipboard = new Clipboard();
