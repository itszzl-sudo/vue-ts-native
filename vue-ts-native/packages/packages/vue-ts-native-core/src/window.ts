/**
 * @file window.ts
 * @desc 窗口管理 API 封装
 */

/**
 * 窗口配置选项
 */
export interface WindowOptions {
  /** 窗口标题 */
  title?: string;
  /** 窗口 URL（HTML 文件路径） */
  url?: string;
  /** 窗口宽度 */
  width?: number;
  /** 窗口高度 */
  height?: number;
  /** 是否可调整大小 */
  resizable?: boolean;
  /** 文件拖入回调 */
  onDrop?: (files: string[]) => void;
}

/**
 * 创建桌面窗口
 * 
 * @example
 * ```ts
 * import { showWindow } from 'vue-ts-native-core';
 * 
 * showWindow({
 *   title: '我的应用',
 *   url: './index.html',
 *   width: 1024,
 *   height: 768,
 * });
 * ```
 */
export function showWindow(options: WindowOptions = {}): void {
  if (typeof js_desktop_show_window === 'undefined') {
    console.warn('[vue-ts-native] js_desktop_show_window 不可用（非 ts-native 环境）');
    return;
  }

  const {
    title = 'Application',
    url = '',
    width = 1024,
    height = 768,
    resizable = true,
    onDrop,
  } = options;

  // 构造 options 对象（QuickJS 格式）
  const optionsVal = store_string(JSON.stringify({
    title,
    url,
    width,
    height,
    resizable,
  }));

  // 注册拖拽回调
  if (onDrop) {
    // 保存回调到全局映射
    window.__tsn_drop_callbacks = window.__tsn_drop_callbacks || new Map();
    const cbId = Date.now();
    window.__tsn_drop_callbacks.set(cbId, onDrop);
    
    // TODO: 将回调 ID 传递给 runtime
  }

  js_desktop_show_window(optionsVal);
}

/**
 * 系统托盘配置
 */
export interface TrayOptions {
  /** 提示文本 */
  tooltip: string;
  /** 图标路径（.ico 文件） */
  icon?: string;
  /** 左键点击回调 */
  onClick?: () => void;
  /** 右键菜单 */
  menu?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

/**
 * 创建系统托盘图标
 */
export function showTray(options: TrayOptions): number {
  if (typeof js_desktop_show_tray === 'undefined') {
    console.warn('[vue-ts-native] js_desktop_show_tray 不可用');
    return 0;
  }

  const optionsVal = store_string(JSON.stringify({
    tooltip: options.tooltip,
    icon: options.icon || '',
  }));

  const trayId = js_desktop_show_tray(optionsVal);
  return trayId;
}

/**
 * 移除系统托盘
 */
export function removeTray(trayId: number): void {
  if (typeof js_desktop_remove_tray === 'undefined') return;
  js_desktop_remove_tray(trayId);
}

/**
 * 全局回调存储（内部使用）
 */
declare global {
  interface Window {
    __tsn_drop_callbacks?: Map<number, (files: string[]) => void>;
  }
}
