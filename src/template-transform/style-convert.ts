/**
 * @file template-transform/style-convert.ts
 * @desc SFC样式区块解析、清洗、转为Vue标准内联样式对象
 * @note 无DOM、无浏览器CSS解析器、无RuntimeCall依赖
 * @rule 架构禁止外部CSS、选择器、伪类、继承，仅产出可被渲染器识别的扁平样式对象
 * @ability 过滤非法样式、统一单位、剔除浏览器专属样式、输出纯JS样式字典
 */
import type { SFCParseResult } from "./sfc-parser";

/**
 * 可被原生渲染链路识别的标准样式结构
 * 仅保留架构允许的视觉样式字段
 */
export interface NativeStyleObject {
  // 文本颜色
  color?: string;
  // 背景色
  backgroundColor?: string;
  // 字体尺寸
  fontSize?: string | number;
  // 字体家族
  fontFamily?: string;
  // 字重
  fontWeight?: string | number;
  // 圆角
  borderRadius?: string | number;
  // 边框宽度
  borderWidth?: string | number;
  // 边框颜色
  borderColor?: string;
  // 透明度
  opacity?: string | number;
}

/**
 * 白名单：架构支持的有效样式字段
 * 不在此列表的样式全部直接丢弃
 */
const STYLE_WHITELIST: (keyof NativeStyleObject)[] = [
  "color",
  "backgroundColor",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "borderRadius",
  "borderWidth",
  "borderColor",
  "opacity",
];

/**
 * 清洗样式单位，统一数值格式
 * 无单位数值默认补 px，适配 Skia 绘制
 * @param value 原始样式值
 * @returns 标准化样式值
 */
function normalizeStyleValue(value: string | number): string | number {
  if (typeof value === "number") return value;
  // 纯数字补 px
  if (/^\d+(\.\d+)?$/.test(value)) {
    return `${value}px`;
  }
  // 仅允许 px / em / % / 无单位透明度
  if (/^(px|em|%)$/.test(value.replace(/[\d.]/g, ""))) {
    return value;
  }
  // 非法单位直接原值返回，交由上层校验器拦截
  return value;
}

/**
 * 单条CSS样式键名转驼峰
 * @param key 短横线样式名
 * @returns 驼峰命名字段
 */
function camelCaseStyleKey(key: string): string {
  return key.replace(/-(\w)/g, (_, char) => char.toUpperCase());
}

/**
 * 解析原始行内CSS文本，输出架构标准样式对象
 * @param cssText 原始css单行样式文本
 * @returns 清洗后的NativeStyleObject
 */
export function parseInlineStyleText(cssText: string): NativeStyleObject {
  const styleObj: NativeStyleObject = {};
  if (!cssText) return styleObj;

  // 拆分样式键值对
  const ruleList = cssText
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const rule of ruleList) {
    const [rawKey, rawValue] = rule.split(":").map((s) => s.trim());
    if (!rawKey || !rawValue) continue;

    // 转驼峰
    const camelKey = camelCaseStyleKey(rawKey) as keyof NativeStyleObject;
    // 仅保留白名单字段
    if (!STYLE_WHITELIST.includes(camelKey)) continue;

    // 标准化数值
    styleObj[camelKey] = normalizeStyleValue(rawValue);
  }

  return styleObj;
}

/**
 * 批量解析SFC所有style区块，合并为全局组件内联样式
 * 架构规则：不支持样式隔离、scoped、样式覆盖、权重叠加
 * @param parseResult SFC解析结果
 * @returns 合并后的纯净样式对象
 */
export function convertSfcStyleToInline(
  parseResult: SFCParseResult,
): NativeStyleObject {
  const { styles } = parseResult;
  const finalStyle: NativeStyleObject = {};

  for (const styleBlock of styles) {
    // 禁用 scoped、module 样式，架构不支持
    if (styleBlock.scoped || styleBlock.module) continue;

    const blockCssText = styleBlock.content || "";
    // 只解析行内样式格式，不解析CSS选择器层级
    const inlineStyle = parseInlineStyleText(blockCssText);

    // 单层合并，后定义覆盖前定义
    Object.assign(finalStyle, inlineStyle);
  }

  return finalStyle;
}
