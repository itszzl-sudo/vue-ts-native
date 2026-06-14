/**
 * @file index.ts
 * @desc vue-ts-native-core 入口
 * @core ts-native API 封装（对齐 Electron）
 */

// app 模块
export {
  app,
} from './app';

export type {
  AppReadyCallback,
} from './app';

// BrowserWindow 模块
export {
  BrowserWindow,
} from './browser-window';

export type {
  BrowserWindowOptions,
  LoadURLOptions,
} from './browser-window';

// dialog 模块
export {
  dialog,
} from './dialog';

export type {
  OpenDialogOptions,
  OpenDialogReturnValue,
  SaveDialogOptions,
  SaveDialogReturnValue,
  MessageBoxOptions,
  MessageBoxReturnValue,
} from './dialog';

// clipboard 模块
export {
  clipboard,
} from './clipboard';

// shell 模块
export {
  shell,
} from './shell';

export type {
  OpenExternalOptions,
} from './shell';

// ipc 模块
export {
  ipcMain,
  ipcRenderer,
} from './ipc';

export type {
  IpcMainInvokeHandler,
  IpcRendererInvokeOptions,
} from './ipc';

// Tray 模块
export {
  Tray,
} from './tray';

export type {
  TrayOptions,
} from './tray';

// Notification 模块
export {
  Notification,
} from './notification';

export type {
  NotificationOptions,
} from './notification';

// Menu 模块
export {
  Menu,
  MenuItem,
} from './menu';

export type {
  MenuItemConstructorOptions,
} from './menu';

// screen 模块
export {
  screen,
} from './screen';

export type {
  Display,
} from './screen';

// nativeImage 模块
export {
  nativeImage,
} from './native-image';

export type {
  CreateImageOptions,
} from './native-image';

// powerMonitor 模块
export {
  powerMonitor,
} from './power-monitor';

// autoUpdater 模块
export {
  autoUpdater,
} from './auto-updater';

// crashReporter 模块
export {
  crashReporter,
} from './crash-reporter';

export type {
  CrashReporterOptions,
} from './crash-reporter';

// inAppPurchase 模块
export {
  inAppPurchase,
} from './in-app-purchase';
