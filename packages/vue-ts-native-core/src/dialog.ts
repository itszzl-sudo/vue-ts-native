/**
 * @file dialog.ts
 * @desc dialog 模块（对齐 Electron dialog）
 */

/**
 * 打开对话框选项
 */
export interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
}

/**
 * 打开对话框返回值
 */
export interface OpenDialogReturnValue {
  canceled: boolean;
  filePaths: string[];
}

/**
 * 保存对话框选项
 */
export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

/**
 * 保存对话框返回值
 */
export interface SaveDialogReturnValue {
  canceled: boolean;
  filePath?: string;
}

/**
 * 消息框选项
 */
export interface MessageBoxOptions {
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
  title?: string;
  message: string;
  detail?: string;
  buttons?: string[];
  defaultId?: number;
  cancelId?: number;
}

/**
 * 消息框返回值
 */
export interface MessageBoxReturnValue {
  response: number;
  checkboxChecked: boolean;
}

/**
 * dialog 模块
 */
class Dialog {
  /**
   * 显示打开文件对话框
   */
  showOpenDialog(options: OpenDialogOptions = {}): OpenDialogReturnValue {
    if (typeof js_desktop_show_open_dialog === 'undefined') {
      console.warn('[vue-ts-native] dialog API 不可用');
      return { canceled: true, filePaths: [] };
    }

    const result = js_desktop_show_open_dialog(store_string(JSON.stringify(options)));
    const filePaths = JSON.parse(get_string(result)) as string[];

    return {
      canceled: filePaths.length === 0,
      filePaths,
    };
  }

  /**
   * 显示保存文件对话框
   */
  showSaveDialog(options: SaveDialogOptions = {}): SaveDialogReturnValue {
    if (typeof js_desktop_show_save_dialog === 'undefined') {
      console.warn('[vue-ts-native] dialog API 不可用');
      return { canceled: true };
    }

    const result = js_desktop_show_save_dialog(store_string(JSON.stringify(options)));
    const filePath = get_string(result);

    return {
      canceled: !filePath,
      filePath,
    };
  }

  /**
   * 显示消息框
   */
  showMessageBox(options: MessageBoxOptions): MessageBoxReturnValue {
    if (typeof js_desktop_show_message_box === 'undefined') {
      console.warn('[vue-ts-native] dialog API 不可用');
      return { response: 0, checkboxChecked: false };
    }

    js_desktop_show_message_box(store_string(JSON.stringify(options)));
    return { response: 0, checkboxChecked: false };
  }

  /**
   * 显示错误消息框
   */
  showErrorBox(title: string, content: string): void {
    this.showMessageBox({
      type: 'error',
      title,
      message: content,
    });
  }
}

export const dialog = new Dialog();
