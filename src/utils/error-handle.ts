/**
 * @file utils/error-handle.ts
 * @desc 原生架构统一异常处理工具
 * @core 无DOM环境容错、Vue渲染异常捕获、Skia绘制异常兜底、Tauri窗口错误上报
 * @adapt 适配纯原生脱离浏览器架构，不依赖 window.onerror / DOM 异常API
 * @ability 错误分级、堆栈收集、渲染降级、全局兜底、异常防抖
 */

/**
 * 异常等级枚举
 */
export enum ErrorLevel {
  // 普通警告，不影响渲染
  WARN = "warn",
  // 功能异常，局部失效
  ERROR = "error",
  // 致命错误，需要重启/重置渲染
  FATAL = "fatal",
}

/**
 * 统一异常对象结构
 */
export interface NativeRuntimeError {
  // 错误信息
  message: string;
  // 错误堆栈
  stack?: string;
  // 错误发生模块
  module: string;
  // 错误等级
  level: ErrorLevel;
  // 错误发生时间戳
  timestamp: number;
  // 附加自定义数据
  extra?: Record<string, any>;
}

// 错误缓存队列（用于批量上报、防抖）
const errorQueue: NativeRuntimeError[] = [];
// 错误防抖定时器
let errorFlushTimer: number | null = null;
// 最大缓存错误数量
const MAX_ERROR_QUEUE_SIZE = 20;

/**
 * 格式化标准化运行时错误
 */
export function formatRuntimeError(
  err: unknown,
  module: string,
  level: ErrorLevel = ErrorLevel.ERROR,
  extra: Record<string, any> = {},
): NativeRuntimeError {
  const error = err as Error;
  return {
    message: error?.message || String(err),
    stack: error?.stack || "no stack trace",
    module,
    level,
    timestamp: Date.now(),
    extra,
  };
}

/**
 * 入队缓存异常（防抖）
 */
export function pushErrorQueue(error: NativeRuntimeError) {
  // 队列溢出时丢弃最早的错误
  if (errorQueue.length >= MAX_ERROR_QUEUE_SIZE) {
    errorQueue.shift();
  }
  errorQueue.push(error);

  triggerFlushErrorQueue();
}

/**
 * 防抖刷新错误队列
 */
function triggerFlushErrorQueue() {
  if (errorFlushTimer) return;
  errorFlushTimer = setTimeout(() => {
    flushErrorQueue();
    errorFlushTimer = null;
  }, 1000) as unknown as number;
}

/**
 * 批量消费错误队列，统一上报/打印
 */
export function flushErrorQueue() {
  while (errorQueue.length) {
    const error = errorQueue.shift();
    if (!error) continue;
    handleSingleError(error);
  }
}

/**
 * 单条错误核心处理逻辑
 */
function handleSingleError(error: NativeRuntimeError) {
  const logPrefix = `[${error.level.toUpperCase()}][${error.module}]`;

  // 控制台分级打印
  switch (error.level) {
    case ErrorLevel.WARN:
      console.warn(logPrefix, error.message, error.extra || "");
      break;
    case ErrorLevel.ERROR:
      console.error(logPrefix, error.message, error.stack, error.extra || "");
      break;
    case ErrorLevel.FATAL:
      console.error(`🔥 FATAL RUNTIME ERROR ${logPrefix}`, error);
      // 致命错误触发渲染重置兜底
      handleFatalErrorFallback();
      break;
  }
}

/**
 * 致命错误兜底降级策略
 * 重置渲染状态、清空脏队列、防止程序卡死
 */
function handleFatalErrorFallback() {
  // 清空渲染定时器
  if ((globalThis as any).renderTimer) {
    clearTimeout((globalThis as any).renderTimer);
    (globalThis as any).renderTimer = null;
  }

  // 清空nextTick任务队列
  const { tickQueue } = globalThis as any;
  if (tickQueue && tickQueue.length) {
    tickQueue.length = 0;
  }

  // 标记渲染可恢复
  (globalThis as any).isRenderError = false;
}

/**
 * 高阶函数：自动捕获函数执行异常
 * @param fn 待执行函数
 * @param module 所属模块名
 * @param level 错误等级
 */
export function withErrorCatch<T extends (...args: any[]) => any>(
  fn: T,
  module: string,
  level: ErrorLevel = ErrorLevel.ERROR,
): T {
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (err) {
      const error = formatRuntimeError(err, module, level, { args });
      pushErrorQueue(error);
      // 报错后返回空兜底，不中断程序
      return undefined;
    }
  }) as T;
}

/**
 * 异步函数异常捕获包装
 */
export async function withAsyncErrorCatch<T>(
  fn: () => Promise<T>,
  module: string,
  level: ErrorLevel = ErrorLevel.ERROR,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (err) {
    const error = formatRuntimeError(err, module, level);
    pushErrorQueue(error);
    return undefined;
  }
}

/**
 * 全局初始化异常监听
 * 适配Tauri原生全局错误，无DOM依赖
 */
export function initGlobalErrorHandler() {
  // 捕获全局未处理 Promise 异常
  (globalThis as any).onunhandledrejection = (event: PromiseRejectionEvent) => {
    const error = formatRuntimeError(
      event.reason,
      "global-promise",
      ErrorLevel.ERROR,
    );
    pushErrorQueue(error);
  };

  // 捕获全局运行时异常
  (globalThis as any).onerror = (
    msg: string,
    url: string,
    line: number,
    col: number,
    err: Error,
  ) => {
    const error = formatRuntimeError(
      err || msg,
      "global-runtime",
      ErrorLevel.ERROR,
      { url, line, col },
    );
    pushErrorQueue(error);
    return true;
  };
}

/**
 * 主动抛出警告信息
 */
export function runtimeWarn(
  message: string,
  module: string,
  extra?: Record<string, any>,
) {
  const error = formatRuntimeError(
    new Error(message),
    module,
    ErrorLevel.WARN,
    extra,
  );
  pushErrorQueue(error);
}

/**
 * 主动抛出运行时错误
 */
export function runtimeError(
  message: string,
  module: string,
  extra?: Record<string, any>,
) {
  const error = formatRuntimeError(
    new Error(message),
    module,
    ErrorLevel.ERROR,
    extra,
  );
  pushErrorQueue(error);
}

/**
 * 主动抛出致命错误
 */
export function runtimeFatal(
  message: string,
  module: string,
  extra?: Record<string, any>,
) {
  const error = formatRuntimeError(
    new Error(message),
    module,
    ErrorLevel.FATAL,
    extra,
  );
  pushErrorQueue(error);
}
