/**
 * @file style-mapper/index.ts
 * @desc 样式映射层核心入口、Vue样式对象转Skia原生绘制参数
 * @note 无DOM、无CSS解析器、无Web环境依赖、无RuntimeCall底层绑定
 * @core 架构唯一样式中转层，承接上层标准化内联样式，输出Skia可直接使用的绘制配置
 * @ability 严格遵循样式白名单、单位标准化、参数适配，隔离Vue样式与底层绘制差异
 */
import type { NativeStyleObject } from "../template-transform/style-convert";
import { STYLE_UNIT_PATTERN, DEFAULT_STYLE_VALUE } from "./rule-limit";

/**
 * Skia标准绘制样式参数结构
 * 所有样式最终统一转为该结构，直接供给Skia绘制引擎使用
 */
export interface SkiaPaintStyle {
  // 文本颜色
  textColor: string;
  // 背景填充颜色
  bgColor: string;
  // 文本字体配置
  font: {
    size: number;
    family: string;
    weight: number | string;
  };
  // 圆角尺寸
  borderRadius: number;
  // 边框配置
  border: {
    width: number;
    color: string;
  };
  // 全局透明度
  opacity: number;
}

/**
 * 标准化样式数值，统一转为像素数值
 * 适配Skia仅识别像素数值的绘制规则
 * @param value 原始样式数值/带单位字符串
 * @param defaultValue 默认兜底数值
 * @returns 纯像素数字
 */
export function normalizeStylePixelValue(
  value: string | number | undefined,
  defaultValue: number,
): number {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  // 纯数字直接返回
  if (typeof value === "number") {
    return value;
  }

  // 匹配数值部分，剔除单位
  const matchRes = value.match(STYLE_UNIT_PATTERN);
  if (!matchRes) {
    return defaultValue;
  }

  const numVal = parseFloat(matchRes[1]);
  return isNaN(numVal) ? defaultValue : numVal;
}

/**
 * 颜色值标准化兜底
 * @param color 原始颜色值
 * @param defaultColor 默认兜底色值
 * @returns 合规颜色字符串
 */
export function normalizeColorValue(
  color: string | undefined,
  defaultColor: string,
): string {
  if (!color) return defaultColor;
  // 简单过滤非法空颜色
  return color.trim() || defaultColor;
}

/**
 * 核心样式映射方法：Vue标准样式对象 => Skia绘制样式参数
 * @param vueStyle 上层解析完成的Vue内联样式对象
 * @returns 标准化Skia绘制样式
 */
export function mapVueStyleToSkia(vueStyle: NativeStyleObject): SkiaPaintStyle {
  const {
    color,
    backgroundColor,
    fontSize,
    fontFamily,
    fontWeight,
    borderRadius,
    borderWidth,
    borderColor,
    opacity,
  } = vueStyle;

  return {
    // 文本颜色
    textColor: normalizeColorValue(color, DEFAULT_STYLE_VALUE.color),
    // 背景颜色
    bgColor: normalizeColorValue(
      backgroundColor,
      DEFAULT_STYLE_VALUE.backgroundColor,
    ),
    // 字体配置标准化
    font: {
      size: normalizeStylePixelValue(fontSize, DEFAULT_STYLE_VALUE.fontSize),
      family: fontFamily || DEFAULT_STYLE_VALUE.fontFamily,
      weight: fontWeight || DEFAULT_STYLE_VALUE.fontWeight,
    },
    // 圆角尺寸
    borderRadius: normalizeStylePixelValue(
      borderRadius,
      DEFAULT_STYLE_VALUE.borderRadius,
    ),
    // 边框配置
    border: {
      width: normalizeStylePixelValue(
        borderWidth,
        DEFAULT_STYLE_VALUE.borderWidth,
      ),
      color: normalizeColorValue(borderColor, DEFAULT_STYLE_VALUE.borderColor),
    },
    // 透明度
    opacity: normalizeStylePixelValue(opacity, DEFAULT_STYLE_VALUE.opacity),
  };
}

/**
 * 增量更新Skia样式配置
 * 仅更新变更样式字段，避免全量重绘计算
 * @param oldSkiaStyle 旧的Skia样式配置
 * @param newVueStyle 新的Vue样式对象
 * @returns 更新后的Skia样式
 */
export function updateSkiaStyle(
  oldSkiaStyle: SkiaPaintStyle,
  newVueStyle: NativeStyleObject,
): SkiaPaintStyle {
  // 无新样式直接返回旧样式
  if (!Object.keys(newVueStyle).length) {
    return { ...oldSkiaStyle };
  }

  // 增量合并更新
  return {
    ...oldSkiaStyle,
    textColor: newVueStyle.color
      ? normalizeColorValue(newVueStyle.color, oldSkiaStyle.textColor)
      : oldSkiaStyle.textColor,
    bgColor: newVueStyle.backgroundColor
      ? normalizeColorValue(newVueStyle.backgroundColor, oldSkiaStyle.bgColor)
      : oldSkiaStyle.bgColor,
    font: {
      ...oldSkiaStyle.font,
      size: newVueStyle.fontSize
        ? normalizeStylePixelValue(newVueStyle.fontSize, oldSkiaStyle.font.size)
        : oldSkiaStyle.font.size,
      family: newVueStyle.fontFamily || oldSkiaStyle.font.family,
      weight: newVueStyle.fontWeight || oldSkiaStyle.font.weight,
    },
    borderRadius: newVueStyle.borderRadius
      ? normalizeStylePixelValue(
          newVueStyle.borderRadius,
          oldSkiaStyle.borderRadius,
        )
      : oldSkiaStyle.borderRadius,
    border: {
      ...oldSkiaStyle.border,
      width: newVueStyle.borderWidth
        ? normalizeStylePixelValue(
            newVueStyle.borderWidth,
            oldSkiaStyle.border.width,
          )
        : oldSkiaStyle.border.width,
      color: newVueStyle.borderColor
        ? normalizeColorValue(
            newVueStyle.borderColor,
            oldSkiaStyle.border.color,
          )
        : oldSkiaStyle.border.color,
    },
    opacity: newVueStyle.opacity
      ? normalizeStylePixelValue(newVueStyle.opacity, oldSkiaStyle.opacity)
      : oldSkiaStyle.opacity,
  };
}

/**
 * 获取默认Skia绘制样式
 * 用于节点初始化、样式重置兜底
 * @returns 初始化默认样式配置
 */
export function getDefaultSkiaStyle(): SkiaPaintStyle {
  return mapVueStyleToSkia({});
}
