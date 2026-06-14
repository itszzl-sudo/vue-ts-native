/**
 * @file render-adapter/node-operate.ts
 * @desc 自定义画布节点基础操作实现，替代DOM节点操作API
 * @note 无DOM、无Web、无RuntimeCall依赖，纯上层节点树管理逻辑
 * @core 完整实现Vue RenderOptions节点生命周期接口，接管节点增删改、挂载、文本设置能力
 * @ability 内置节点对象池复用，减少频繁创建销毁开销，提升渲染性能
 */
import type { NativeVNodeExtend } from "./vnode-extend";

/**
 * 自定义原生画布节点类型
 * 完全替代DOM Element / Text节点，适配Yoga+Skia渲染链路
 */
export interface NativeCanvasNode {
  // 节点唯一ID
  nodeId: string;
  // 节点类型：element / text
  nodeType: "element" | "text";
  // 节点标签名（自定义语义，无HTML约束）
  tag: string;
  // 父节点引用
  parent: NativeCanvasNode | null;
  // 子节点列表
  children: NativeCanvasNode[];
  // 文本内容（仅文本节点生效）
  textContent: string;
  // 样式属性（架构白名单样式）
  style: Record<string, string | number>;
  // 布局属性（对接Yoga）
  layoutProps: Record<string, string | number>;
  // 布局计算结果（Yoga输出）
  layoutRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // 自定义扩展字段（图层、绘制参数等）
  extend: Record<string, any>;
  // 是否为已挂载状态
  mounted: boolean;
  // 绑定的VNode引用（反向引用）
  el: any | null;
}

/**
 * 节点缓存池，复用闲置节点，减少GC开销
 */
const nodePool: NativeCanvasNode[] = [];
// 节点池最大缓存数量
const MAX_POOL_SIZE = 30;

/**
 * 生成唯一节点ID
 */
function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 从节点池获取闲置节点或新建节点
 * @param type 节点类型
 * @param tag 标签名
 * @returns 可用画布节点实例
 */
function getOrCreateNode(
  type: "element" | "text",
  tag: string,
): NativeCanvasNode {
  // 优先复用同类型闲置节点
  const poolIndex = nodePool.findIndex((node) => node.nodeType === type);
  if (poolIndex > -1) {
    const reuseNode = nodePool.splice(poolIndex, 1)[0];
    // 重置节点基础状态（保留内存空间，清空业务数据）
    reuseNode.tag = tag;
    reuseNode.parent = null;
    reuseNode.children = [];
    reuseNode.textContent = "";
    reuseNode.style = {};
    reuseNode.layoutProps = {};
    reuseNode.layoutRect = { x: 0, y: 0, width: 0, height: 0 };
    reuseNode.extend = {};
    reuseNode.mounted = false;
    reuseNode.el = null;
    return reuseNode;
  }

  // 无可用缓存，新建节点
  return {
    nodeId: generateNodeId(),
    nodeType: type,
    tag,
    parent: null,
    children: [],
    textContent: "",
    style: {},
    layoutProps: {},
    layoutRect: { x: 0, y: 0, width: 0, height: 0 },
    extend: {},
    mounted: false,
    el: null,
  };
}

/**
 * 回收闲置节点至节点池
 * @param node 待回收节点
 */
function recycleNode(node: NativeCanvasNode): void {
  if (nodePool.length >= MAX_POOL_SIZE) return;
  // 递归回收子节点
  node.children.forEach((child) => recycleNode(child));
  nodePool.push(node);
}

/**
 * 初始化节点池
 * 项目启动时调用，预创建空节点缓存
 */
export function initNodePool(): void {
  nodePool.length = 0;
}

/**
 * 清空节点池，释放所有缓存内存
 * 应用销毁时调用
 */
export function clearNodePool(): void {
  nodePool.length = 0;
}

/**
 * 创建自定义元素节点（替代DOM.createElement）
 * @param tag 自定义标签名
 * @returns 画布元素节点
 */
export function hostCreateElement(tag: string): NativeCanvasNode {
  return getOrCreateNode("element", tag);
}

/**
 * 创建自定义文本节点（替代DOM.createTextNode）
 * @param text 初始文本内容
 * @returns 画布文本节点
 */
export function hostCreateTextNode(text: string): NativeCanvasNode {
  const textNode = getOrCreateNode("text", "text-node");
  textNode.textContent = text;
  return textNode;
}

/**
 * 挂载节点至父节点（替代DOM.appendChild / insertBefore）
 * @param newNode 待插入新节点
 * @param parent 父节点
 * @param anchor 锚点节点（为空则尾部插入）
 */
export function hostInsert(
  newNode: NativeCanvasNode,
  parent: NativeCanvasNode,
  anchor: NativeCanvasNode | null,
): void {
  // 防止重复挂载
  if (newNode.mounted) return;

  newNode.parent = parent;
  const children = parent.children;

  if (!anchor) {
    // 尾部插入
    children.push(newNode);
  } else {
    // 锚点位置插入
    const anchorIndex = children.findIndex(
      (item) => item.nodeId === anchor.nodeId,
    );
    if (anchorIndex > -1) {
      children.splice(anchorIndex, 0, newNode);
    } else {
      children.push(newNode);
    }
  }

  newNode.mounted = true;
}

/**
 * 移除指定节点（替代DOM.removeChild）
 * @param node 待移除节点
 */
export function hostRemove(node: NativeCanvasNode): void {
  if (!node.parent || !node.mounted) return;

  const parentChildren = node.parent.children;
  const delIndex = parentChildren.findIndex(
    (item) => item.nodeId === node.nodeId,
  );
  if (delIndex > -1) {
    parentChildren.splice(delIndex, 1);
    node.parent = null;
    node.mounted = false;
    // 回收节点至缓存池
    recycleNode(node);
  }
}

/**
 * 移动节点位置（同树内节点位移）
 * @param node 待移动节点
 * @param parent 目标父节点
 * @param anchor 锚点节点
 */
export function hostMove(
  node: NativeCanvasNode,
  parent: NativeCanvasNode,
  anchor: NativeCanvasNode | null,
): void {
  // 先移除原位置
  hostRemove(node);
  // 插入新位置
  hostInsert(node, parent, anchor);
}

/**
 * 设置节点文本内容
 * @param node 目标节点
 * @param text 新文本内容
 */
export function hostSetText(node: NativeCanvasNode, text: string): void {
  if (node.nodeType === "text") {
    node.textContent = text;
  }
}

/**
 * 获取父节点
 * @param node 目标节点
 * @returns 父节点
 */
export function hostParentNode(
  node: NativeCanvasNode,
): NativeCanvasNode | null {
  return node.parent;
}

/**
 * 获取下一个兄弟节点
 * @param node 目标节点
 * @returns 下一个兄弟节点 / null
 */
export function hostNextSibling(
  node: NativeCanvasNode,
): NativeCanvasNode | null {
  if (!node.parent) return null;
  const siblings = node.parent.children;
  const index = siblings.findIndex((item) => item.nodeId === node.nodeId);
  return index > -1 && index < siblings.length - 1 ? siblings[index + 1] : null;
}
