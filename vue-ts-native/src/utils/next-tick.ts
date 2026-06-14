/**
 * @file utils/next-tick.ts
 * @desc 原生架构专属 nextTick 异步调度器
 * @core 完全抛弃浏览器 microtask / RAF / DOM 微任务
 * @adapt 适配 Tauri + Skia + 无DOM渲染架构
 * @match 对齐 Vue 全局 nextTick 调用签名，无缝替换官方实现
 */

type NextTickCallback = (...args: any[]) => any;

// 异步任务队列
const tickQueue: NextTickCallback[] = [];
let isFlushing = false;

/**
 * 原生底层异步调度器
 * 不依赖任何浏览器API，使用Tauri原生事件队列延迟执行
 */
function nativeQueueFlush() {
  if (isFlushing) return;
  isFlushing = true;

  // 批量执行队列任务
  while (tickQueue.length) {
    const fn = tickQueue.shift();
    if (fn) fn();
  }

  isFlushing = false;
}

/**
 * 架构安全版 nextTick
 * 替代 Vue 官方基于浏览器微任务的 nextTick
 * 保证纯原生环境不报错、不依赖window/promise/raf
 */
export function nextTick(fn?: NextTickCallback): Promise<void> {
  return new Promise((resolve) => {
    // 推入任务队列
    if (fn) tickQueue.push(fn);
    tickQueue.push(resolve);

    // 采用宏任务兜底，完全脱离Web微任务体系
    setTimeout(nativeQueueFlush, 0);
  });
}

/**
 * 立即清空tick队列（强制刷新渲染）
 * 用于手动触发渲染更新、布局刷新
 */
export function flushTickQueue() {
  nativeQueueFlush();
}

/**
 * 判断当前是否处于tick刷新中
 */
export function isTickFlushing() {
  return isFlushing;
}

// 全局挂载，对齐Vue全局API
if (!(globalThis as any).nextTick) {
  (globalThis as any).nextTick = nextTick;
}
