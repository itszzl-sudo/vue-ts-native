/**
 * @file render-adapter/vnode-extend.ts
 * @desc VNode 自定义扩展定义、画布节点绑定、架构专属字段管理
 * @note 无DOM、无Web、无RuntimeCall底层依赖，纯VNode层扩展适配
 * @core 基于Vue原生VNode结构做安全扩展，挂载原生画布渲染所需专属字段
 * @ability 完全兼容runtime-core原生VNode契约，不污染内核结构、不破坏Diff机制
 */
import type { VNode, VNodeProps } from "@vue/runtime-core";
import type { NativeCanvasNode } from "./node-operate";

/**
 * 原生渲染架构专属VNode扩展字段
 * 在不破坏Vue原生VNode核心结构的前提下，扩展画布渲染能力
 * 仅自定义渲染器识别，内核Diff、响应式逻辑完全不受影响
 */
export interface NativeVNodeExtend extends VNode {
  // 绑定对应的原生画布节点（替代DOM el，完全对齐原生el字段契约）
  el: NativeCanvasNode | null;
  // 图层层级，用于画布层级渲染、覆盖顺序控制
  zLayer?: number;
  // 节点是否参与Skia重绘刷新
  needRepaint?: boolean;
  // 自定义绘制参数，存储Skia专属绘制配置
  drawOptions?: Record<string, string | number | boolean>;
  // 布局计算缓存，避免Yoga重复计算
  layoutCache?: {
    computedWidth: number;
    computedHeight: number;
    computedX: number;
    computedY: number;
  };
  // 节点显隐状态缓存（适配v-show原生实现）
  visible?: boolean;
}

/**
 * 标准化扩展VNode Props类型
 * 合并Vue原生Props + 架构自定义专属Props
 */
export type NativeVNodeProps = VNodeProps & {
  // 自定义层级属性
  zLayer?: number;
  // 显隐控制属性
  visible?: boolean;
  // 自定义绘制配置透传
  drawOptions?: Record<string, string | number | boolean>;
};

/**
 * 初始化VNode自定义扩展字段默认值
 * 保证所有扩展字段初始化统一，避免运行时undefined报错
 * @param vnode 目标扩展VNode实例
 */
export function initVNodeExtendField(vnode: NativeVNodeExtend): void {
  // 初始化图层层级，默认0层
  if (vnode.zLayer === undefined) {
    vnode.zLayer = 0;
  }
  // 默认需要首次重绘
  if (vnode.needRepaint === undefined) {
    vnode.needRepaint = true;
  }
  // 默认节点可见
  if (vnode.visible === undefined) {
    vnode.visible = true;
  }
  // 初始化空绘制参数
  if (!vnode.drawOptions) {
    vnode.drawOptions = {};
  }
  // 初始化空布局缓存
  if (!vnode.layoutCache) {
    vnode.layoutCache = {
      computedWidth: 0,
      computedHeight: 0,
      computedX: 0,
      computedY: 0,
    };
  }
}

/**
 * 同步Props变更至VNode扩展字段
 * 将模板自定义属性映射至VNode扩展属性
 * @param vnode 扩展VNode实例
 * @param props 最新组件Props
 */
export function syncVNodeExtendProps(
  vnode: NativeVNodeExtend,
  props: NativeVNodeProps = {},
): void {
  const { zLayer, visible, drawOptions } = props;

  // 同步层级配置
  if (zLayer !== undefined) {
    vnode.zLayer = zLayer;
    vnode.needRepaint = true;
  }

  // 同步显隐状态
  if (visible !== undefined && visible !== vnode.visible) {
    vnode.visible = visible;
    vnode.needRepaint = true;
  }

  // 同步自定义绘制参数
  if (drawOptions) {
    vnode.drawOptions = { ...vnode.drawOptions, ...drawOptions };
    vnode.needRepaint = true;
  }
}

/**
 * 标记节点需要局部重绘
 * 统一重绘状态标记入口，供patch更新、布局变更、样式变更调用
 * @param vnode 目标VNode
 */
export function markVNodeNeedRepaint(vnode: NativeVNodeExtend): void {
  vnode.needRepaint = true;
}

/**
 * 清空VNode布局缓存
 * 布局属性变更时调用，强制下次Yoga重新计算
 * @param vnode 目标VNode
 */
export function clearVNodeLayoutCache(vnode: NativeVNodeExtend): void {
  if (vnode.layoutCache) {
    vnode.layoutCache = {
      computedWidth: 0,
      computedHeight: 0,
      computedX: 0,
      computedY: 0,
    };
  }
  vnode.needRepaint = true;
}

/**
 * 解绑VNode与原生画布节点关联
 * 节点卸载时清空扩展字段，释放内存
 * @param vnode 目标VNode
 */
export function disposeVNodeExtend(vnode: NativeVNodeExtend): void {
  vnode.el = null;
  vnode.layoutCache = undefined;
  vnode.drawOptions = undefined;
  vnode.needRepaint = false;
}
