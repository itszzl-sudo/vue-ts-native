/**
 * @file render-adapter/event-bridge.ts
 * @desc 原生画布事件桥接层、Vue组件事件适配、系统事件转发器
 * @note 无DOM事件模型、无冒泡/捕获、无Web事件依赖
 * @core 抹平Tauri原生窗口事件 & Skia画布事件差异，对齐Vue组件事件调用契约
 * @ability 实现渲染器事件接口、事件缓存、解绑清理、事件防抖适配
 */
import type { NativeCanvasNode } from "./node-operate";

/**
 * 原生标准化事件对象
 * 替代DOM Event，统一画布/窗口原生事件结构
 */
export interface NativeUIEvent {
  // 事件类型：click / touch / move / resize 等
  type: string;
  // 触发节点
  target: NativeCanvasNode | null;
  // 触发时间戳
  timeStamp: number;
  // 画布坐标
  x: number;
  y: number;
  // 事件是否已终止
  stopped: boolean;
}

/**
 * 节点事件缓存映射
 * 存储VNode绑定的事件回调，避免重复绑定、支持批量销毁
 */
const nodeEventMap = new WeakMap<
  NativeCanvasNode,
  Record<string, Function | Function[]>
>();

/**
 * 全局事件监听状态
 */
let globalEventInited = false;

/**
 * 标准化原生事件对象
 * @param type 事件类型
 * @param target 触发节点
 * @param x 坐标X
 * @param y 坐标Y
 * @returns 标准化事件实例
 */
export function createNativeEvent(
  type: string,
  target: NativeCanvasNode | null,
  x = 0,
  y = 0,
): NativeUIEvent {
  return {
    type,
    target,
    timeStamp: Date.now(),
    x,
    y,
    stopped: false,
  };
}

/**
 * 终止事件执行（替代 event.stopPropagation）
 * 架构不支持冒泡，仅终止当前后续回调执行
 */
export function stopNativeEvent(event: NativeUIEvent): void {
  event.stopped = true;
}

/**
 * 绑定节点事件
 * 对齐 Vue renderOptions 事件挂载接口
 * @param node 画布节点
 * @param eventName 事件名（不含on前缀，小写）
 * @param handler 事件回调函数
 */
export function hostPatchEvent(
  node: NativeCanvasNode,
  eventName: string,
  handler: Function | null,
): void {
  // 初始化节点事件存储容器
  if (!nodeEventMap.has(node)) {
    nodeEventMap.set(node, {});
  }
  const eventCache = nodeEventMap.get(node)!;

  // 空handler代表移除事件
  if (!handler) {
    delete eventCache[eventName];
    return;
  }

  // 支持同一事件多回调绑定
  if (eventCache[eventName]) {
    const exist = eventCache[eventName];
    if (Array.isArray(exist)) {
      exist.push(handler);
    } else {
      eventCache[eventName] = [exist, handler];
    }
  } else {
    eventCache[eventName] = handler;
  }
}

/**
 * 触发节点对应事件
 * @param node 目标节点
 * @param event 标准化原生事件
 */
export function triggerNodeEvent(
  node: NativeCanvasNode,
  event: NativeUIEvent,
): void {
  const eventCache = nodeEventMap.get(node);
  if (!eventCache || event.stopped) return;

  const handlers = eventCache[event.type];
  if (!handlers) return;

  // 执行单回调 / 多回调
  if (Array.isArray(handlers)) {
    handlers.forEach((fn) => {
      if (!event.stopped) fn(event);
    });
  } else {
    handlers(event);
  }
}

/**
 * 初始化全局事件桥接
 * 对接底层Tauri窗口、Skia画布原生事件分发
 * 项目启动时统一注册
 */
export function initEventBridge(): void {
  if (globalEventInited) return;
  globalEventInited = true;

  // 此处预留底层原生事件订阅入口
  // 由窗口层/绘制层触发 triggerNodeEvent 完成事件闭环
}

/**
 * 销毁节点所有绑定事件
 * @param node 目标画布节点
 */
export function clearNodeEvent(node: NativeCanvasNode): void {
  if (nodeEventMap.has(node)) {
    nodeEventMap.delete(node);
  }
}

/**
 * 销毁全局事件桥接、清空事件缓存
 * 应用卸载时调用
 */
export function destroyEventBridge(): void {
  nodeEventMap.clear();
  globalEventInited = false;
}

/**
 * 对外暴露的渲染器事件适配配置
 * 完全对齐 Vue RenderOptions 事件接口规范
 */
export const eventBridgeOptions = {
  // 事件更新补丁方法
  patchEvent: hostPatchEvent,
  // 初始化全局事件桥接
  initEventBridge,
  // 销毁事件系统
  destroyEventBridge,
};
