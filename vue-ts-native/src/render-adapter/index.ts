/**
 * @file render-adapter/index.ts
 * @desc 自定义原生渲染器入口、Vue平台渲染接口统一封装
 * @note 无DOM、无Web、无RuntimeCall底层依赖，纯上层适配胶水层
 * @core 替代官方 runtime-dom 渲染器，对接Yoga布局、Skia绘制、原生事件系统
 * @ability 完整实现Vue Runtime-Core平台渲染契约，打通VNode到原生画布节点的渲染链路
 */
import type { Renderer, RenderOptions } from "@vue/runtime-core";
import { createRenderer } from "@vue/runtime-core";

// 导入节点操作、更新补丁、事件桥接、VNode扩展能力
import * as nodeOps from "./node-operate";
import * as patchOps from "./patch-update";
import { eventBridgeOptions } from "./event-bridge";
import type { NativeVNodeExtend } from "./vnode-extend";

/**
 * 组装原生画布渲染器配置项
 * 完全遵循Vue RenderOptions接口规范，不篡改内核契约
 */
const nativeRenderOptions: RenderOptions<NativeVNodeExtend, NativeVNodeExtend> =
  {
    // 基础节点增删改查操作
    ...nodeOps,
    // 属性、样式、子节点差分更新逻辑
    patchProps: patchOps.patchProps,
    // 事件系统适配
    ...eventBridgeOptions,
    // 自定义文本更新逻辑（对接Skia文本绘制）
    setText: nodeOps.hostSetText,
    // 空节点兜底处理
    createComment: () => null as unknown as NativeVNodeExtend,
    createText: nodeOps.hostCreateTextNode,
  };

/**
 * 创建脱离DOM的纯原生画布自定义渲染器
 * 全局唯一渲染器实例，替代DOM渲染器
 */
export const nativeRenderer: Renderer<NativeVNodeExtend, NativeVNodeExtend> =
  createRenderer(nativeRenderOptions);

/**
 * 对外暴露渲染器核心方法，对齐Vue官方渲染器导出规范
 */
export const { render, createApp, hydrate, unmount, patch } = nativeRenderer;

/**
 * 导出渲染器配置（供高级用户自定义）
 */
export { nativeRenderOptions };

/**
 * 全局初始化原生渲染环境
 * 项目启动前置调用，注册自定义渲染器、初始化节点池
 */
export function initNativeRenderEnv() {
  // 初始化节点操作缓存池
  nodeOps.initNodePool();
  // 初始化事件桥接监听
  eventBridgeOptions.initEventBridge();
}

/**
 * 销毁渲染环境，清空节点与事件监听
 * 应用退出/页面卸载时调用
 */
export function destroyNativeRenderEnv() {
  nodeOps.clearNodePool();
  eventBridgeOptions.destroyEventBridge();
}
