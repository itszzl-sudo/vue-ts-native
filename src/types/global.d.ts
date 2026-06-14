/**
 * @file types/global.d.ts
 * @desc 项目全局类型声明 & 环境补齐 & 模块兜底
 * @core 适配无DOM、Tauri+Skia+Vue原生渲染架构
 * @fix 消除TS全局类型缺失、Web模块不存在、全局变量未定义报错
 * @scope 全局环境、自定义模块、渲染内核、编译环境、全局挂载API
 */

/// <reference types="vite/client" />
/// <reference types="@tauri-apps/api" />

// ====================== 1. 全局环境变量类型声明（编译/运行时） ======================
declare global {
  /** 全局Skia原生渲染上下文（底层Tauri-Skia绑定） */
  var __SKIA_NATIVE_CONTEXT__: import("../render-skia/draw-core").SkiaRenderContext;

  /** 编译环境标识：纯原生Native模式 */
  var __VUE_NATIVE__: boolean;
  var __VUE_BROWSER__: boolean;
  var __VUE_WEB__: boolean;

  /** Tauri WebView渲染能力开关 */
  var __TAURI_WEBVIEW_RENDER__: boolean;
  var __DISABLE_HTML_PARSER__: boolean;
  var __DISABLE_CSS_PARSER__: boolean;
  var __DISABLE_WEB_EVENT_MODEL__: boolean;

  /** 渲染调度全局变量 */
  var renderTimer: number | null;
  var isRenderError: boolean;

  /** NextTick任务队列全局挂载 */
  var tickQueue: Array<(...args: any[]) => void | Promise<void>>;

  /** 全局nextTick方法 */
  var nextTick: typeof import("../utils/next-tick").nextTick;

  /** 平台环境标识 */
  var isBrowser: boolean;
  var IS_BROWSER: boolean;
  var isNative: boolean;
}

// ====================== 2. 原生架构缺失Web API空声明（消除TS报错） ======================
/**
 * 彻底屏蔽DOM/BOM原生类型，覆盖TS默认内置声明
 * 适配纯原生脱离浏览器环境
 */
declare interface Window {}
declare interface Document {}
declare interface HTMLElement {}
declare interface HTMLCanvasElement {}
declare interface MouseEvent {}
declare interface KeyboardEvent {}
declare interface Event {}

// 空接口兜底，防止第三方库依赖DOM类型报错
declare var window: undefined;
declare var document: undefined;
declare var navigator: undefined;

// ====================== 3. 自定义模块类型声明 ======================
/** Yoga 布局核心模块 */
declare module "../layout-yoga/index" {
  import type { NativeCanvasNode } from "../render-adapter/node-operate";
  export function createYogaNode(): any;
  export function applyYogaLayout(node: NativeCanvasNode): void;
}

/** Skia 绘制核心模块 */
declare module "../render-skia/draw-core" {
  export interface SkiaCanvas {
    width: number;
    height: number;
    getContext(): SkiaRenderContext;
  }
  export interface SkiaRenderContext {
    clearRect(x: number, y: number, w: number, h: number): void;
    fillStyle(color: string): void;
    strokeStyle(color: string): void;
    lineWidth(width: number): void;
    globalAlpha(alpha: number): void;
    fillRect(x: number, y: number, w: number, h: number): void;
    strokeRect(x: number, y: number, w: number, h: number): void;
    fillText(text: string, x: number, y: number): void;
    font(fontStr: string): void;
    save(): void;
    restore(): void;
    beginPath(): void;
    roundRect(x: number, y: number, w: number, h: number, radius: number): void;
    fill(): void;
    stroke(): void;
  }
  export function skiaClearCanvas(canvas: SkiaCanvas): void;
  export function skiaDrawNode(canvas: SkiaCanvas, node: any): void;
  export function parseSizeVal(val: string | number | undefined): number;
}

/** Skia 分层渲染模块 */
declare module "../render-skia/layer-render" {
  export class SkiaLayerManager {
    constructor();
    bindMainCanvas(canvas: import("../render-skia/draw-core").SkiaCanvas): void;
    createLayer(zIndex?: number): any;
    bindNodeToLayer(layer: any, node: any): void;
    markLayerDirty(layerId: string): void;
    markAllLayerDirty(): void;
    renderComposite(): void;
  }
  export const globalLayerManager: SkiaLayerManager;
  export function initLayerRender(rootNode: any, canvas: any): void;
  export function triggerLayerRender(): void;
}

/** Tauri 窗口适配模块 */
declare module "../tauri-window/index" {
  export interface NativeWindowOptions {
    title?: string;
    width?: number;
    height?: number;
    resizable?: boolean;
    transparent?: boolean;
    decorations?: boolean;
  }
  export function initNativeWindow(options?: NativeWindowOptions): Promise<any>;
  export function getTauriWindowCanvas():
    | import("../render-skia/draw-core").SkiaCanvas
    | null;
  export function getWindowPixelRect(): {
    width: number;
    height: number;
    dpr: number;
  };
  export function windowMinimize(): Promise<void>;
  export function windowToggleMaximize(): Promise<void>;
  export function windowClose(): Promise<void>;
  export function resetWindowRender(): void;
}

/** Tauri 事件捕获模块 */
declare module "../tauri-window/event-capture" {
  export interface NativeMouseEvent {
    x: number;
    y: number;
    clientX: number;
    clientY: number;
    screenX: number;
    screenY: number;
    button: number;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
  }
  export function initWindowEventCapture(): void;
  export function hitTestNodeTree(root: any, x: number, y: number): any | null;
  export function normalizePointerCoordinate(
    rawX: number,
    rawY: number,
  ): { x: number; y: number };
  export function setFocusNode(node: any | null): void;
  export function getFocusNode(): any | null;
}

/** Web环境禁用模块 */
declare module "../tauri-window/web-disable" {
  export function initPureNativeSandbox(): void;
  export function disableBrowserGlobalAPI(): void;
  export function blockBrowserEnvFlag(): void;
  export function disableWebviewRenderAbility(): void;
  export function clearBrowserTaskQueue(): void;
}

/** 渲染适配器核心模块 */
declare module "../render-adapter/index" {
  export interface NativeCanvasNode {
    id: string;
    type: string;
    parent: NativeCanvasNode | null;
    children: NativeCanvasNode[];
    textContent: string;
    layoutProps: Record<string, any>;
    layoutRect: { x: number; y: number; width: number; height: number };
    style: Record<string, any>;
    vnode: any | null;
    dirty: boolean;
  }
  export function createNativeNode(type?: string): NativeCanvasNode;
  export function setRootCanvasNode(node: NativeCanvasNode): void;
  export function getRootCanvasNode(): NativeCanvasNode | null;
  export function triggerRenderUpdate(): void;
  export function renderFullTree(): void;
  export const render: any;
  export const createApp: any;
  export const unmount: any;
  export const patch: any;
}

/** 工具类模块 */
declare module "../utils/next-tick" {
  export function nextTick(fn?: () => void): Promise<void>;
  export function flushTickQueue(): void;
  export function isTickFlushing(): boolean;
}

declare module "../utils/error-handle" {
  export enum ErrorLevel {
    WARN = "warn",
    ERROR = "error",
    FATAL = "fatal",
  }
  export interface NativeRuntimeError {
    message: string;
    stack?: string;
    module: string;
    level: ErrorLevel;
    timestamp: number;
    extra?: Record<string, any>;
  }
  export function formatRuntimeError(
    err: unknown,
    module: string,
    level?: ErrorLevel,
    extra?: Record<string, any>,
  ): NativeRuntimeError;
  export function pushErrorQueue(error: NativeRuntimeError): void;
  export function flushErrorQueue(): void;
  export function withErrorCatch<T extends (...args: any[]) => any>(
    fn: T,
    module: string,
    level?: ErrorLevel,
  ): T;
  export function withAsyncErrorCatch<T>(
    fn: () => Promise<T>,
    module: string,
    level?: ErrorLevel,
  ): Promise<T | undefined>;
  export function initGlobalErrorHandler(): void;
  export function runtimeWarn(
    message: string,
    module: string,
    extra?: Record<string, any>,
  ): void;
  export function runtimeError(
    message: string,
    module: string,
    extra?: Record<string, any>,
  ): void;
  export function runtimeFatal(
    message: string,
    module: string,
    extra?: Record<string, any>,
  ): void;
}

/** 编译配置模块 */
declare module "../build-config/compile-rule" {
  export const COMPILE_PLATFORM_LOCK: string;
  export const OUTPUT_BUNDLE_MODE: string;
  export const COMPILE_STRATEGY: string;
  export const COMPILE_BLACK_LIST: string[];
  export const SYNTAX_BLACK_LIST: string[];
  export const COMPILE_WHITE_LIST_FEATURE: string[];
  export const COMPILE_OPTIMIZE_RULE: Record<string, boolean>;
  export const COMPILE_TRIM_ENV_BRANCH: string[];
  export function getCompileVersionRule(): any;
  export function getGlobalCompileRule(): any;
}

declare module "../build-config/tree-shaking" {
  export const TREE_SHAKE_STRICT_MODE: boolean;
  export const ENABLE_CONST_FOLD: boolean;
  export const ENABLE_MODULE_SWEEP: boolean;
  export const STATIC_DEAD_BRANCH_RULES: RegExp[];
  export const VUE_DEAD_FEATURE_SWEEP: string[];
  export function isDropableModule(moduleId: string): boolean;
  export function isStaticDeadCode(lineSource: string): boolean;
  export function resolveStaticBranch(code: string): string;
  export function sweepVueDeadFeature(code: string): string;
  export function sweepDeadModuleImport(code: string): string;
  export function applyStrictTreeShaking(sourceCode: string): string;
  export function getTreeShakingConfig(): any;
}

declare module "../build-config/module-resolve" {
  export const STRICT_MODULE_RESOLVE: boolean;
  export const ENABLE_EMPTY_MODULE_PATCH: boolean;
  export const MODULE_ALIAS_MAP: Record<string, string>;
  export const RESOLVE_BLOCK_LIST: string[];
  export function isBlockModule(moduleId: string): boolean;
  export function getModuleRealPath(moduleId: string): string;
  export function generateEmptyModuleCode(): string;
  export function resolveCustomModule(moduleId: string): any;
  export function filterModuleImportSource(code: string): string;
  export function getModuleResolveConfig(): any;
}

// ====================== 4. 兜底空模块声明（解决第三方Web模块缺失报错） ======================
declare module "@vue/runtime-dom" {}
declare module "@vue/compiler-dom" {}
declare module "css-layout" {}
declare module "core-js" {}

// ====================== 5. 导出全局类型 ======================
export {};
