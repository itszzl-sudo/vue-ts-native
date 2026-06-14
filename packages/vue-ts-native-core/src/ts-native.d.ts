/**
 * ts-native FFI 类型声明
 * 这些函数由 ts-native runtime 提供，在编译后的二进制中可用
 */

declare global {
  // === 窗口管理 ===
  function js_desktop_show_window(options: number): number;
  function js_desktop_show_tray(options: number): number;
  function js_desktop_remove_tray(trayId: number): number;

  // === 通知/消息框 ===
  function js_desktop_show_notification(options: number): number;
  function js_desktop_show_message_box(options: number): number;

  // === 剪贴板 ===
  function js_desktop_clipboard_write_text(text: number): number;
  function js_desktop_clipboard_read_text(): number;

  // === 文件对话框 ===
  function js_desktop_show_open_dialog(options: number): number;
  function js_desktop_show_save_dialog(options: number): number;

  // === QuickJS 基础 API ===
  function store_string(str: string): number;
  function get_string(val: number): string;
  function is_number(val: number): boolean;
  function js_object_get(obj: number, key: number): number;
  function js_array_new(len: number): number;
  function js_array_push(arr: number, val: number): number;
}

export {};
