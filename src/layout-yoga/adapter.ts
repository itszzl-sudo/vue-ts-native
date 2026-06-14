/**
 * @file layout-yoga/adapter.ts
 * @desc Yoga布局适配桥接层、渲染器联动、布局-绘制链路衔接
 * @note 纯上层适配逻辑，无底层依赖，对接渲染适配器与Skia绘制层
 * @core 承接节点增删改、属性变更事件，自动触发布局更新与重绘闭环
 * @ability 适配Vue渲染器生命周期，打通VNode变更→布局重算→画布重绘完整链路
 */
import type { NativeCanvasNode } from "../render-adapter/node-operate";
import type { NativeVNodeExtend } from "../render-adapter/vnode-extend";
import { layoutManager } from "./index";
import {
  clearVNodeLayoutCache,
  markVNodeNeedRepaint,
} from "../render-adapter/vnode-extend";

/**
 * 节点挂载布局适配
 * 节点插入树时绑定布局关系、同步初始布局
 * @param node 目标画布节点
 * @param vnode 对应扩展VNode
 * @param parent 父画布节点
 * @param index 挂载索引
 */
export function adaptNodeMountLayout(
  node: NativeCanvasNode,
  vnode: NativeVNodeExtend,
  parent: NativeCanvasNode,
  index: number,
) {
  // 初始化节点布局实例
  layoutManager.createNodeLayout(node);
  // 同步初始布局属性
  layoutManager.syncNodeLayoutProps(node, vnode);
  // 挂载父子布局关系
  layoutManager.attachChildLayout(parent, node, index);
  // 初始化布局缓存
  clearVNodeLayoutCache(vnode);
}

/**
 * 节点更新布局适配
 * 布局属性变更时触发局部布局重算
 * @param node 目标画布节点
 * @param vnode 对应扩展VNode
 */
export function adaptNodeUpdateLayout(
  node: NativeCanvasNode,
  vnode: NativeVNodeExtend,
) {
  // 清空旧布局缓存
  clearVNodeLayoutCache(vnode);
  // 同步最新布局属性并触发重算
  layoutManager.syncNodeLayoutProps(node, vnode);
  // 标记重绘
  markVNodeNeedRepaint(vnode);
}

/**
 * 节点移除布局适配
 * 节点卸载时解绑布局关系、释放布局实例
 * @param node 待移除画布节点
 */
export function adaptNodeRemoveLayout(node: NativeCanvasNode) {
  layoutManager.detachChildLayout(node);
  layoutManager.destroyNodeLayout(node);
}

/**
 * 批量刷新全局布局
 * 特殊场景（窗口resize、全局样式变更）手动触发全局重算
 */
export function refreshGlobalLayout() {
  layoutManager.calcAllLayout();
}

/**
 * 获取节点最终计算后的布局坐标尺寸
 * @param vnode 目标扩展VNode
 * @returns 标准化布局坐标尺寸
 */
export function getNodeFinalLayout(vnode: NativeVNodeExtend) {
  const { layoutCache } = vnode;
  return {
    x: layoutCache.computedX,
    y: layoutCache.computedY,
    width: layoutCache.computedWidth,
    height: layoutCache.computedHeight,
  };
}
