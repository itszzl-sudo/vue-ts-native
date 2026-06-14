/**
 * @file layout-yoga/index.ts
 * @desc Yoga布局引擎核心适配入口、布局计算统一调度层
 * @note 无DOM、无Web环境依赖、无RuntimeCall底层强绑定
 * @core 承接渲染适配器分发的布局属性，基于Yoga引擎完成节点坐标、尺寸、弹性布局计算
 * @ability 统一初始化布局实例、批量计算布局、缓存刷新、布局变更联动重绘，对接Skia绘制层坐标标准
 */
import Yoga, {
  YogaNode,
  YogaAlign,
  YogaJustifyContent,
  YogaFlexDirection,
  YogaFlexWrap,
} from "yoga-layout";
import type { NativeCanvasNode } from "../render-adapter/node-operate";
import type { NativeVNodeExtend } from "../render-adapter/vnode-extend";
import { LAYOUT_PROP_WHITELIST } from "../render-adapter/patch-update";

/**
 * 全局Yoga布局单例管理器
 * 统一管理所有节点布局实例、计算调度、缓存更新
 */
class YogaLayoutManager {
  // 全局Yoga根节点（布局计算入口）
  private rootNode: YogaNode | null = null;
  // 画布节点与Yoga节点映射缓存
  private nodeMap: WeakMap<NativeCanvasNode, YogaNode> = new WeakMap();
  // 是否开启布局计算防抖
  private layoutDirty: boolean = false;

  /**
   * 初始化全局Yoga布局环境
   * 应用启动时统一调用，创建根布局节点、初始化全局配置
   */
  initLayoutEnv() {
    if (this.rootNode) return;
    // 创建根布局节点，适配全屏画布
    this.rootNode = Yoga.Node.create();
    // 根节点默认铺满窗口
    this.rootNode.setWidth("100%");
    this.rootNode.setHeight("100%");
    this.rootNode.setFlexDirection(YogaFlexDirection.Row);
    this.rootNode.setJustifyContent(YogaJustifyContent.FlexStart);
    this.rootNode.setAlignItems(YogaAlign.FlexStart);
  }

  /**
   * 为画布节点创建绑定Yoga布局实例
   * @param node 原生画布节点
   * @returns 绑定的Yoga节点
   */
  createNodeLayout(node: NativeCanvasNode): YogaNode {
    // 存在缓存直接复用
    const existNode = this.nodeMap.get(node);
    if (existNode) return existNode;

    // 新建Yoga布局节点，初始化默认布局参数
    const yogaNode = Yoga.Node.create();
    yogaNode.setFlexDirection(YogaFlexDirection.Column);
    yogaNode.setJustifyContent(YogaJustifyContent.FlexStart);
    yogaNode.setAlignItems(YogaAlign.FlexStart);
    yogaNode.setFlexWrap(YogaFlexWrap.NoWrap);

    // 建立双向映射缓存
    this.nodeMap.set(node, yogaNode);
    return yogaNode;
  }

  /**
   * 批量同步节点布局属性至Yoga实例
   * @param node 原生画布节点
   * @param vnode 扩展VNode实例
   */
  syncNodeLayoutProps(node: NativeCanvasNode, vnode: NativeVNodeExtend) {
    const yogaNode = this.createNodeLayout(node);
    const { layoutProps } = node;

    // 遍历白名单布局属性，批量同步至Yoga节点
    Object.entries(layoutProps).forEach(([key, value]) => {
      this.applyYogaProp(yogaNode, key, value);
    });

    // 标记布局脏数据，触发下次重计算
    this.markLayoutDirty();
  }

  /**
   * 单条布局属性适配Yoga原生API
   * 映射前端布局字段至Yoga底层布局方法
   * @param yogaNode Yoga布局节点
   * @param key 布局属性名
   * @param value 布局属性值
   */
  private applyYogaProp(
    yogaNode: YogaNode,
    key: string,
    value: string | number,
  ) {
    switch (key) {
      // 尺寸属性
      case "width":
        yogaNode.setWidth(value);
        break;
      case "height":
        yogaNode.setHeight(value);
        break;
      case "minWidth":
        yogaNode.setMinWidth(value);
        break;
      case "minHeight":
        yogaNode.setMinHeight(value);
        break;
      case "maxWidth":
        yogaNode.setMaxWidth(value);
        break;
      case "maxHeight":
        yogaNode.setMaxHeight(value);
        break;

      // 外边距
      case "margin":
        yogaNode.setMarginAll(value);
        break;
      case "marginTop":
        yogaNode.setMarginTop(value);
        break;
      case "marginBottom":
        yogaNode.setMarginBottom(value);
        break;
      case "marginLeft":
        yogaNode.setMarginLeft(value);
        break;
      case "marginRight":
        yogaNode.setMarginRight(value);
        break;

      // 内边距
      case "padding":
        yogaNode.setPaddingAll(value);
        break;
      case "paddingTop":
        yogaNode.setPaddingTop(value);
        break;
      case "paddingBottom":
        yogaNode.setPaddingBottom(value);
        break;
      case "paddingLeft":
        yogaNode.setPaddingLeft(value);
        break;
      case "paddingRight":
        yogaNode.setPaddingRight(value);
        break;

      // 弹性布局
      case "flex":
        yogaNode.setFlex(Number(value));
        break;
      case "flexDirection":
        yogaNode.setFlexDirection(value as unknown as YogaFlexDirection);
        break;
      case "flexWrap":
        yogaNode.setFlexWrap(value as unknown as YogaFlexWrap);
        break;
      case "flexGrow":
        yogaNode.setFlexGrow(Number(value));
        break;
      case "flexShrink":
        yogaNode.setFlexShrink(Number(value));
        break;

      // 对齐方式
      case "justifyContent":
        yogaNode.setJustifyContent(value as unknown as YogaJustifyContent);
        break;
      case "alignItems":
        yogaNode.setAlignItems(value as unknown as YogaAlign);
        break;
      case "alignSelf":
        yogaNode.setAlignSelf(value as unknown as YogaAlign);
        break;
      case "alignContent":
        yogaNode.setAlignContent(value as unknown as YogaAlign);
        break;

      // 间距
      case "gap":
        yogaNode.setGapAll(value);
        break;
      case "rowGap":
        yogaNode.setGapRow(value);
        break;
      case "columnGap":
        yogaNode.setGapColumn(value);
        break;

      // 定位
      case "position":
        yogaNode.setPositionType(value as any);
        break;
      case "top":
        yogaNode.setPositionTop(value);
        break;
      case "left":
        yogaNode.setPositionLeft(value);
        break;
      case "right":
        yogaNode.setPositionRight(value);
        break;
      case "bottom":
        yogaNode.setPositionBottom(value);
        break;
    }
  }

  /**
   * 挂载子节点布局关系
   * 同步画布节点父子关系至Yoga布局树
   * @param parentNode 父画布节点
   * @param childNode 子画布节点
   * @param index 挂载索引
   */
  attachChildLayout(
    parentNode: NativeCanvasNode,
    childNode: NativeCanvasNode,
    index: number,
  ) {
    const parentYoga = this.createNodeLayout(parentNode);
    const childYoga = this.createNodeLayout(childNode);
    // 移除原有父级关联
    childYoga.getParent()?.removeChild(childYoga);
    // 挂载至新父节点
    parentYoga.insertChild(childYoga, index);
    this.markLayoutDirty();
  }

  /**
   * 移除子节点布局关系
   * @param childNode 待移除子画布节点
   */
  detachChildLayout(childNode: NativeCanvasNode) {
    const childYoga = this.nodeMap.get(childNode);
    if (!childYoga) return;
    childYoga.getParent()?.removeChild(childYoga);
    this.markLayoutDirty();
  }

  /**
   * 标记布局需要重新计算（防抖触发）
   */
  private markLayoutDirty() {
    if (this.layoutDirty) return;
    this.layoutDirty = true;
    // 微任务防抖，统一批量计算布局
    Promise.resolve().then(() => {
      this.calcAllLayout();
      this.layoutDirty = false;
    });
  }

  /**
   * 批量执行全局布局计算
   * 计算完成后同步坐标尺寸至VNode布局缓存
   */
  calcAllLayout() {
    if (!this.rootNode) return;
    // 执行全局布局重排计算
    this.rootNode.calculateLayout();
    // 遍历所有已缓存节点，同步计算结果
    this.nodeMap.forEach((yogaNode, canvasNode) => {
      const vnode = canvasNode.el;
      if (!vnode?.layoutCache) return;
      // 同步最终布局坐标与尺寸
      vnode.layoutCache.computedX = yogaNode.getComputedLeft();
      vnode.layoutCache.computedY = yogaNode.getComputedTop();
      vnode.layoutCache.computedWidth = yogaNode.getComputedWidth();
      vnode.layoutCache.computedHeight = yogaNode.getComputedHeight();
      // 标记节点需要重绘
      vnode.needRepaint = true;
    });
  }

  /**
   * 销毁单个节点布局实例
   * @param node 画布节点
   */
  destroyNodeLayout(node: NativeCanvasNode) {
    const yogaNode = this.nodeMap.get(node);
    if (!yogaNode) return;
    yogaNode.getParent()?.removeChild(yogaNode);
    yogaNode.free();
    this.nodeMap.delete(node);
    this.markLayoutDirty();
  }

  /**
   * 清空所有布局实例、重置布局环境
   */
  clearAllLayout() {
    this.nodeMap.forEach((yogaNode) => yogaNode.free());
    this.nodeMap.clear();
    this.rootNode?.free();
    this.rootNode = null;
    this.layoutDirty = false;
  }
}

// 全局唯一布局管理器实例
export const layoutManager = new YogaLayoutManager();

/**
 * 初始化Yoga布局全局环境
 * 项目启动前置调用
 */
export function initYogaLayoutEnv() {
  layoutManager.initLayoutEnv();
}

/**
 * 销毁布局环境、释放内存
 * 应用卸载时调用
 */
export function destroyYogaLayoutEnv() {
  layoutManager.clearAllLayout();
}
