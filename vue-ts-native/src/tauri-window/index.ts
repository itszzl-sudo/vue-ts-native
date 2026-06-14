/**
 * @file tauri-window/index.ts
 * @desc Tauri 原生窗口适配层
 * @core 纯原生窗口管理、画布初始化、窗口尺寸监听、事件转发、对接Skia画布渲染
 * @architecture 承接上层Vue渲染链路、下层Skia分层渲染，作为整套架构窗口基座
 * @note 禁用Tauri Webview DOM能力、零浏览器依赖、纯原生窗口+离屏画布运行
 */

import { appWindow, WebviewWindow } from "@tauri-apps/api/window";
import { listen, type EventCallback } from "@tauri-apps/api/event";
import type { SkiaCanvas } from "../render-skia/draw-core";
import { triggerLayerRender } from "../render-skia/layer-render";

// ====================== 窗口全局私有状态 ======================
// 全局单例画布实例
let globalNativeCanvas: SkiaCanvas | null = null;
// 窗口默认尺寸
const DEFAULT_WIN_WIDTH = 1280;
const DEFAULT_WIN_HEIGHT = 720;
// 窗口设备像素比
let windowDevicePixelRatio = 1;

// ====================== 类型定义 ======================
/**
 * 原生窗口配置项
 */
export interface NativeWindowOptions {
  title?: string;
  width?: number;
  height?: number;
  resizable?: boolean;
  transparent?: boolean;
  decorations?: boolean;
}

/**
 * 窗口尺寸变更事件参数
 */
export interface WindowResizePayload {
  width: number;
  height: number;
  dpr: number;
}

// ====================== 私有工具方法 ======================
/**
 * 创建Tauri纯原生画布实例（模拟Skia标准画布结构）
 * 完全脱离Web Canvas DOM对象，纯内存画布
 */
function createNativeSkiaCanvas(width: number, height: number): SkiaCanvas {
  return {
    width,
    height,
    getContext() {
      // 返回Skia原生渲染上下文，由底层Tauri-Skia绑定实现
      return (globalThis as any).__SKIA_NATIVE_CONTEXT__;
    },
  };
}

/**
 * 更新画布尺寸并重绘
 */
async function resizeCanvas(width: number, height: number) {
  windowDevicePixelRatio = window.devicePixelRatio || 1;
  const realWidth = Math.floor(width * windowDevicePixelRatio);
  const realHeight = Math.floor(height * windowDevicePixelRatio);

  if (globalNativeCanvas) {
    globalNativeCanvas.width = realWidth;
    globalNativeCanvas.height = realHeight;
  } else {
    globalNativeCanvas = createNativeSkiaCanvas(realWidth, realHeight);
  }

  // 触发分层重绘
  triggerLayerRender();
}

// ====================== 对外核心API ======================
/**
 * 初始化原生主窗口
 * 关闭Webview冗余能力、初始化画布、绑定窗口监听事件
 */
export async function initNativeWindow(options: NativeWindowOptions = {}) {
  const {
    title = "Vue-Native-Skia",
    width = DEFAULT_WIN_WIDTH,
    height = DEFAULT_WIN_HEIGHT,
    resizable = true,
    transparent = false,
    decorations = true,
  } = options;

  // 窗口基础配置
  await appWindow.setTitle(title);
  await appWindow.setResizable(resizable);
  await appWindow.setTransparent(transparent);
  await appWindow.setDecorations(decorations);
  await appWindow.setSize({ width, height });

  // 禁用Webview DOM渲染能力，彻底剥离浏览器环境
  (globalThis as any).document = null;
  (globalThis as any).window = null;

  // 初始化全局Skia画布
  await resizeCanvas(width, height);

  // 绑定窗口尺寸监听
  bindWindowResizeEvent();

  // 窗口聚焦/失焦刷新
  bindWindowFocusEvent();

  return appWindow;
}

/**
 * 获取全局原生Skia画布实例
 * 供Skia渲染层、图层管理器调用
 */
export function getTauriWindowCanvas(): SkiaCanvas | null {
  return globalNativeCanvas;
}

/**
 * 获取当前窗口真实像素尺寸（适配DPR）
 */
export function getWindowPixelRect() {
  return {
    width: globalNativeCanvas?.width || DEFAULT_WIN_WIDTH,
    height: globalNativeCanvas?.height || DEFAULT_WIN_HEIGHT,
    dpr: windowDevicePixelRatio,
  };
}

// ====================== 窗口事件监听 ======================
/**
 * 绑定窗口尺寸变化事件
 */
export function bindWindowResizeEvent() {
  listen("tauri://resize", async (event) => {
    const payload = event.payload as { width: number; height: number };
    await resizeCanvas(payload.width, payload.height);
  });
}

/**
 * 绑定窗口聚焦/失焦事件
 * 窗口重新聚焦时强制刷新画面，防止画面冻结
 */
export function bindWindowFocusEvent() {
  listen("tauri://focus", () => {
    triggerLayerRender();
  });
}

/**
 * 通用窗口自定义事件监听
 * 承接上层Vue组件事件转发
 */
export function onWindowEvent<T = any>(
  eventName: string,
  callback: EventCallback<T>,
) {
  return listen(eventName, callback);
}

// ====================== 窗口快捷操作API ======================
/**
 * 最小化窗口
 */
export async function windowMinimize() {
  await appWindow.minimize();
}

/**
 * 最大化/还原窗口
 */
export async function windowToggleMaximize() {
  const isMax = await appWindow.isMaximized();
  isMax ? await appWindow.unmaximize() : await appWindow.maximize();
}

/**
 * 关闭窗口
 */
export async function windowClose() {
  await appWindow.close();
}

/**
 * 清空画布并重置窗口渲染状态
 */
export function resetWindowRender() {
  globalNativeCanvas = null;
}
