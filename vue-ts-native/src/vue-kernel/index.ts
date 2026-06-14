/**
 * @file vue-kernel/index.ts
 * @desc 【架构内核入口】Vue 原生 Skia 渲染内核总出口
 * @core 统一初始化架构、版本校验、环境锁定、内核能力汇总导出
 * @position 整个项目最早执行的内核文件，架构启动入口
 * @function
 *  1. 全局版本合法性校验
 *  2. 锁定 Native 运行模式
 *  3. 汇总所有内核、渲染、工具能力
 *  4. 对外暴露统一架构 API
 */

// 版本校验 & 架构标识
import {
  assertVersionValid,
  getVersionString,
  getFullVersionManifest,
  RUNTIME_MODE,
  ARCH_UNIQUE_FLAG
} from './version-manage';

// 全局环境初始化（禁用Web DOM）
import { initPureNativeSandbox } from '../tauri-window/web-disable';

// 全局异常体系初始化
import { initGlobalErrorHandler } from '../utils/error-handle';

// 渲染器核心能力
import { createApp, render, unmount, patch } from '../render-adapter/index';

// 窗口 & 事件体系
import { initNativeWindow } from '../tauri-window/index';
import { initWindowEventCapture } from '../tauri-window/event-capture';

// 分层渲染
import { initLayerRender } from '../render-skia/layer-render';

/**
 * 架构内核启动初始化
 * 项目启动第一时间执行，顺序严格锁定
 */
export async function setupNativeKernel() {
  // 1. 优先摧毁浏览器环境，杜绝DOM污染
  initPureNativeSandbox();

  // 2. 架构版本 & 环境强校验（不合法直接报错终止）
  assertVersionValid();

  // 3. 初始化全局异常捕获体系
  initGlobalErrorHandler();

  // 4. 初始化Tauri原生窗口 & Skia画布
  const window = await initNativeWindow();

  // 5. 初始化全局原生事件捕获体系
  initWindowEventCapture();

  // 6. 输出内核启动日志
  console.log(`✅ Vue-Native-Skia 内核启动成功 | 版本: ${getVersionString()}`);
  console.log(`📦 运行模式: ${RUNTIME_MODE}`);

  return {
    window,
    version: getVersionString(),
    manifest: getFullVersionManifest()
  };
}

/**
 * 内核能力统一导出
 * 替代 Vue 官方 runtime-dom 全部能力
 * 项目全局统一从 @/vue-kernel 引入，不直接引 render-adapter
 */
export * from './version-manage';

// 渲染核心
export { createApp, render, unmount, patch };

// 全局工具
export { nextTick, flushTickQueue } from '../utils/next-tick';
export * from '../utils/error-handle';

// 窗口与事件
export * from '../tauri-window/index';
export * from '../tauri-window/event-capture';

// 渲染层
export * from '../render-skia/draw-core';
export * from '../render-skia/layer-render';

// 渲染适配器
export * from '../render-adapter/index';

// 架构全局标识挂载
globalThis.__VUE_NATIVE__ = true;
globalThis.__VUE_BROWSER__ = false;
globalThis.__VUE_WEB__ = false;
globalThis.__ARCH_FLAG__ = ARCH_UNIQUE_FLAG;

// 默认导出内核启动器
export default setupNativeKernel;
