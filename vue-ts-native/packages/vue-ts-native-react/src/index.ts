/**
 * @file index.ts
 * @desc vue-ts-native-react 入口
 * @core React 适配层 - Hooks 调度、组件生命周期、事件归一
 */

export {
  // Hooks
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  // 组件渲染
  renderReactComponent,
  updateReactComponent,
  unmountComponent,
  createElement,
  Fragment,
  // React 兼容对象
  React,
} from "./component-renderer";

export { React as default } from "./component-renderer";

export type { NativeCanvasNode } from "vue-ts-native-render";
