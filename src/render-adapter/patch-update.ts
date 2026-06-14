/**
 * @file render-adapter/patch-update.ts
 * @desc 渲染器差分更新补丁逻辑、属性/样式/自定义Props更新处理器
 * @note 无DOM、无Web、无RuntimeCall依赖，纯VNode差分适配层
 * @core 承接Vue原生Diff结果，实现原生画布节点的局部更新、局部重绘
 * @ability 区分布局属性、样式属性、通用属性，分别分发至Yoga/Skia渲染链路
 */
import type { NativeCanvasNode } from "./node-operate";
import type { NativeStyleObject } from "../template-transform/style-convert";
import { DISABLED_STYLE_ATTRS } from "../template-transform/validate";

/**
 * 布局属性白名单（交由Yoga引擎处理）
 * 所有尺寸、弹性、间距、对齐相关属性统一走布局计算层
 */
export const LAYOUT_PROP_WHITELIST = [
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "flex",
  "flexDirection",
  "flexWrap",
  "flexGrow",
  "flexShrink",
  "justifyContent",
  "alignItems",
  "alignSelf",
  "alignContent",
  "gap",
  "rowGap",
  "columnGap",
  "position",
  "top",
  "left",
  "right",
  "bottom",
];

/**
 * 通用自定义属性白名单（业务自定义属性）
 * 不参与布局、不参与样式，仅挂载节点扩展字段
 */
export const CUSTOM_PROP_WHITELIST = [
  "id",
  "className",
  "name",
  "disabled",
  "visible",
];

/**
 * 标准化样式键名，过滤禁用样式
 * @param key 样式属性名
 * @param value 样式值
 * @returns 合规样式键值对｜null
 */
function normalizePatchStyle(
  key: string,
  value: any,
): [string, string | number] | null {
  // 过滤架构禁用高级样式
  if (DISABLED_STYLE_ATTRS.includes(key)) return null;
  // 空值直接丢弃
  if (value === undefined || value === null || value === "") return null;

  let safeValue: string | number = value;
  // 纯数字自动补px单位
  if (typeof value === "number" || /^\d+(\.\d+)?$/.test(value)) {
    safeValue = `${value}px`;
  }

  return [key, safeValue];
}

/**
 * 更新节点样式属性
 * @param node 画布原生节点
 * @param newStyle 新样式对象
 * @param oldStyle 旧样式对象
 */
function patchNodeStyle(
  node: NativeCanvasNode,
  newStyle: NativeStyleObject = {},
  oldStyle: NativeStyleObject = {},
): void {
  // 清理旧样式中不存在的属性
  Object.keys(oldStyle).forEach((key) => {
    if (!(key in newStyle)) {
      delete node.style[key];
    }
  });

  // 增量更新新样式
  Object.entries(newStyle).forEach(([key, value]) => {
    const normalized = normalizePatchStyle(key, value);
    if (normalized) {
      const [validKey, validVal] = normalized;
      node.style[validKey] = validVal;
    } else {
      delete node.style[key];
    }
  });
}

/**
 * 更新节点布局属性
 * @param node 画布原生节点
 * @param key 属性名
 * @param value 属性值
 */
function patchNodeLayoutProp(
  node: NativeCanvasNode,
  key: string,
  value: any,
): void {
  if (value === undefined || value === null || value === "") {
    delete node.layoutProps[key];
    return;
  }

  // 布局数值统一单位处理
  let safeValue: string | number = value;
  if (typeof value === "number" || /^\d+(\.\d+)?$/.test(value)) {
    safeValue = `${value}px`;
  }

  node.layoutProps[key] = safeValue;
}

/**
 * 更新节点自定义通用属性
 * @param node 画布原生节点
 * @param key 属性名
 * @param value 属性值
 */
function patchNodeCustomProp(
  node: NativeCanvasNode,
  key: string,
  value: any,
): void {
  if (value === undefined || value === null || value === "") {
    delete node.extend[key];
    return;
  }
  node.extend[key] = value;
}

/**
 * 统一属性补丁入口
 * 完全对齐Vue renderOptions.patchProps 契约
 * 自动分发：布局属性→Yoga、样式属性→Skia、自定义属性→节点扩展
 * @param node 目标画布节点
 * @param key 属性键名
 * @param newValue 新属性值
 * @param oldValue 旧属性值
 */
export function patchProps(
  node: NativeCanvasNode,
  key: string,
  newValue: any,
  oldValue: any,
): void {
  // 新旧值一致直接跳过，避免无效重绘
  if (newValue === oldValue) return;

  // 样式对象特殊处理（Vue 统一style props）
  if (key === "style") {
    patchNodeStyle(node, newValue || {}, oldValue || {});
    return;
  }

  // 布局属性分流更新
  if (LAYOUT_PROP_WHITELIST.includes(key)) {
    patchNodeLayoutProp(node, key, newValue);
    return;
  }

  // 自定义通用属性分流更新
  if (CUSTOM_PROP_WHITELIST.includes(key)) {
    patchNodeCustomProp(node, key, newValue);
    return;
  }

  // 未知属性直接丢弃，不挂载、不报错
}
