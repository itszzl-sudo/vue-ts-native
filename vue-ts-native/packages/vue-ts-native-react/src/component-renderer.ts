/**
 * @file component-renderer.ts
 * @desc React 组件渲染器
 * @core 组件生命周期管理、Props 更新、渲染调度
 */

import type { NativeCanvasNode } from "vue-ts-native-render";
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  setCurrentFiber,
  resetFiberForUpdate,
  finishFiberUpdate,
  getFiber,
} from "./hooks";

/**
 * React 组件类型
 */
type ReactComponent = (props: any) => any;

/**
 * 组件实例
 */
interface ComponentInstance {
  fiberId: number;
  component: ReactComponent;
  props: Record<string, any>;
  vnode: any | null;
}

/**
 * 组件实例存储
 */
const componentMap = new Map<number, ComponentInstance>();

/**
 * 渲染 React 组件
 */
export function renderReactComponent(
  Component: ReactComponent,
  props: Record<string, any>,
  parentNode?: NativeCanvasNode,
): any {
  // 创建或获取 Fiber
  const fiberId = props.__fiberId || createFiberId();
  resetFiberForUpdate(fiberId);

  // 设置 Fiber 上下文
  setCurrentFiber(getFiber(fiberId)!);

  try {
    // 执行组件函数
    const vnode = Component(props);

    // 保存组件实例
    const instance: ComponentInstance = {
      fiberId,
      component: Component,
      props,
      vnode,
    };
    componentMap.set(fiberId, instance);

    return vnode;
  } finally {
    finishFiberUpdate();
    setCurrentFiber(null);
  }
}

/**
 * 更新 React 组件
 */
export function updateReactComponent(
  fiberId: number,
  newProps: Record<string, any>,
): any {
  const instance = componentMap.get(fiberId);
  if (!instance) {
    throw new Error(`Component fiber ${fiberId} not found`);
  }

  // 重置 Fiber 用于更新
  resetFiberForUpdate(fiberId);
  setCurrentFiber(getFiber(fiberId)!);

  try {
    // 执行组件函数（传入新 props）
    const vnode = instance.component(newProps);

    // 更新实例
    instance.props = newProps;
    instance.vnode = vnode;

    return vnode;
  } finally {
    finishFiberUpdate();
    setCurrentFiber(null);
  }
}

/**
 * 卸载组件
 */
export function unmountComponent(fiberId: number): void {
  const instance = componentMap.get(fiberId);
  if (!instance) return;

  // 清理所有 effects
  const fiber = getFiber(fiberId);
  if (fiber) {
    for (const hook of fiber.hooks) {
      if (hook.cleanup) {
        hook.cleanup();
      }
    }
  }

  componentMap.delete(fiberId);
}

/**
 * 创建 Fiber ID
 */
let fiberIdCounter = 10000;
function createFiberId(): number {
  return ++fiberIdCounter;
}

/**
 * React createElement 兼容函数
 */
export function createElement(
  type: string | ReactComponent,
  props: Record<string, any> = {},
  ...children: any[]
): any {
  // 归一化事件名称：onClick → click
  const normalizedProps: Record<string, any> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("on") && typeof value === "function") {
      // onClick → click, onMouseDown → mousedown
      const eventName = key.slice(2).toLowerCase();
      normalizedProps[eventName] = value;
    } else {
      normalizedProps[key] = value;
    }
  }

  // 如果是函数组件，直接调用
  if (typeof type === "function") {
    const componentProps = { ...normalizedProps, children };
    return type(componentProps);
  }

  // 原生元素（view、text 等）
  return {
    type,
    props: normalizedProps,
    children,
  };
}

/**
 * Fragment 组件
 */
export function Fragment({ children }: { children: any[] }): any[] {
  return children;
}

/**
 * 导出 Hooks（供开发者使用）
 */
export { useState, useEffect, useRef, useMemo, useCallback };

/**
 * React 兼容对象
 */
export const React = {
  createElement,
  Fragment,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
};
