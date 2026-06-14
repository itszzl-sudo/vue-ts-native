/**
 * @file tauri-window/event-capture.ts
 * @desc Tauri 原生窗口事件捕获 & 适配转发层
 * @core 捕获原生键鼠/窗口事件、坐标DPR矫正、节点命中检测、转发Vue组件事件
 * @architecture 底层Tauri原生事件 -> 坐标归一化 -> 画布节点命中 -> Vue上层事件触发
 * @note 零DOM事件依赖、不使用浏览器事件模型、完全适配纯画布渲染架构
 */

import { listen } from "@tauri-apps/api/event";
import type { NativeCanvasNode } from "../render-adapter/index";
import { getRootCanvasNode } from "../render-adapter/index";
import { getWindowPixelRect } from "./index";

// ====================== 事件基础类型定义 ======================
/**
 * 归一化原生鼠标事件结构（对齐Vue事件规范）
 */
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

/**
 * 归一化键盘事件结构
 */
export interface NativeKeyboardEvent {
  key: string;
  code: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

/**
 * 命中节点事件数据
 */
export interface NodeHitEvent {
  node: NativeCanvasNode | null;
  event: NativeMouseEvent;
}

// ====================== 私有工具方法 ======================
/**
 * 原生坐标矫正：适配DPR缩放，转换画布真实坐标
 */
export function normalizePointerCoordinate(
  rawX: number,
  rawY: number,
): { x: number; y: number } {
  const { dpr } = getWindowPixelRect();
  return {
    x: rawX * dpr,
    y: rawY * dpr,
  };
}

/**
 * 矩形区域点检测：判断坐标是否在节点范围内
 */
export function pointInRect(
  px: number,
  py: number,
  rect: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

/**
 * 递归遍历节点树，命中最顶层可视节点
 * 模拟前端冒泡逻辑：从子节点向父节点匹配
 */
export function hitTestNodeTree(
  root: NativeCanvasNode | null,
  x: number,
  y: number,
): NativeCanvasNode | null {
  if (!root) return null;

  // 倒序遍历（顶层节点优先命中）
  for (let i = root.children.length - 1; i >= 0; i--) {
    const child = root.children[i];
    const hitChild = hitTestNodeTree(child, x, y);
    if (hitChild) return hitChild;
  }

  // 当前节点命中检测
  if (pointInRect(x, y, root.layoutRect)) {
    return root;
  }

  return null;
}

// ====================== 核心事件捕获 & 转发 ======================
/**
 * 处理鼠标事件命中与Vue事件触发
 */
function handleMousePointerEvent(rawEvent: any): NodeHitEvent {
  const { x, y, button, ctrlKey, altKey, shiftKey, metaKey } = rawEvent;
  const { dpr } = getWindowPixelRect();
  const { x: normX, y: normY } = normalizePointerCoordinate(x, y);

  // 构造标准化鼠标事件
  const normalizeEvent: NativeMouseEvent = {
    x: normX,
    y: normY,
    clientX: normX,
    clientY: normY,
    screenX: x,
    screenY: y,
    button,
    ctrlKey,
    altKey,
    shiftKey,
    metaKey,
  };

  // 命中节点检测
  const hitNode = hitTestNodeTree(getRootCanvasNode(), normX, normY);
  return {
    node: hitNode,
    event: normalizeEvent,
  };
}

/**
 * 触发Vue组件绑定事件
 * 匹配节点vnode中的事件回调并执行
 */
function emitNodeVueEvent(
  node: NativeCanvasNode | null,
  eventName: string,
  event: NativeMouseEvent | NativeKeyboardEvent,
) {
  if (!node || !node.vnode || !node.vnode.props) return;

  // 匹配Vue标准事件名（onClick / onMousedown / onMouseup 等）
  const vueEventKey = `on${eventName}`;
  const handler = node.vnode.props[vueEventKey] || node.vnode.props[eventName];

  if (typeof handler === "function") {
    handler(event);
  }
}

// ====================== 全局事件监听注册 ======================
/**
 * 注册全部鼠标事件监听
 */
export function registerAllMouseEvent() {
  // 鼠标点击
  listen("mouse_click", (res) => {
    const { node, event } = handleMousePointerEvent(res.payload);
    emitNodeVueEvent(node, "Click", event);
  });

  // 鼠标按下
  listen("mouse_down", (res) => {
    const { node, event } = handleMousePointerEvent(res.payload);
    emitNodeVueEvent(node, "Mousedown", event);
  });

  // 鼠标抬起
  listen("mouse_up", (res) => {
    const { node, event } = handleMousePointerEvent(res.payload);
    emitNodeVueEvent(node, "Mouseup", event);
  });

  // 鼠标移动
  listen("mouse_move", (res) => {
    const { node, event } = handleMousePointerEvent(res.payload);
    emitNodeVueEvent(node, "Mousemove", event);
  });
}

/**
 * 注册键盘事件监听
 */
export function registerAllKeyboardEvent() {
  listen("key_down", (res) => {
    const payload = res.payload as NativeKeyboardEvent;
    // 全局键盘事件，可按需分发至焦点节点
    const rootNode = getRootCanvasNode();
    emitNodeVueEvent(rootNode, "Keydown", payload);
  });

  listen("key_up", (res) => {
    const payload = res.payload as NativeKeyboardEvent;
    const rootNode = getRootCanvasNode();
    emitNodeVueEvent(rootNode, "Keyup", payload);
  });
}

/**
 * 初始化全局所有原生事件捕获
 * 项目启动时统一调用，接管全部系统事件
 */
export function initWindowEventCapture() {
  registerAllMouseEvent();
  registerAllKeyboardEvent();
}

// ====================== 焦点节点管理扩展 ======================
let currentFocusNode: NativeCanvasNode | null = null;

/**
 * 设置当前焦点节点
 */
export function setFocusNode(node: NativeCanvasNode | null) {
  currentFocusNode = node;
}

/**
 * 获取当前焦点节点
 */
export function getFocusNode() {
  return currentFocusNode;
}
