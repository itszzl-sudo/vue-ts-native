/**
 * @file style-mapper/rule-limit.ts
 * @desc 样式层全局约束规则、正则常量、默认值、限制策略
 * @note 纯静态规则配置文件，无业务逻辑、无运行时依赖
 * @core 统一全项目样式解析、转换、兜底、禁用规则，保证样式一致性
 */
import type { NativeStyleObject } from "../template-transform/style-convert";

/**
 * 样式数值正则匹配规则
 * 匹配 px/em/% 单位数值，提取纯数字
 */
export const STYLE_UNIT_PATTERN = /^([\d.]+)(px|em|%)?$/;

/**
 * 全局样式默认兜底值
 * 所有样式缺失、非法、空值时统一使用该默认值，避免绘制异常
 */
export const DEFAULT_STYLE_VALUE = Object.freeze({
  // 文本默认黑色
  color: "#000000",
  // 背景默认透明
  backgroundColor: "transparent",
  // 默认字体14px
  fontSize: 14,
  // 默认无衬线字体
  fontFamily: "sans-serif",
  // 默认常规字重
  fontWeight: 400,
  // 默认0圆角
  borderRadius: 0,
  // 默认0边框宽度
  borderWidth: 0,
  // 默认边框透明
  borderColor: "transparent",
  // 默认完全不透明
  opacity: 1,
});

/**
 * 样式数值极值限制规则
 * 防止极端数值导致Skia绘制报错、布局错乱
 */
export const STYLE_EXTREME_LIMIT = Object.freeze({
  // 最小/最大字体
  minFontSize: 8,
  maxFontSize: 512,
  // 最大圆角（避免过度圆角渲染损耗）
  maxBorderRadius: 9999,
  // 最大边框宽度
  maxBorderWidth: 200,
  // 透明度区间 0-1
  minOpacity: 0,
  maxOpacity: 1,
});

/**
 * 校验并截断极值样式数值
 * @param key 样式字段名
 * @param value 原始数值
 * @returns 合规数值
 */
export function clampStyleValue(
  key: keyof NativeStyleObject,
  value: number,
): number {
  switch (key) {
    case "fontSize":
      return Math.max(
        STYLE_EXTREME_LIMIT.minFontSize,
        Math.min(value, STYLE_EXTREME_LIMIT.maxFontSize),
      );
    case "borderRadius":
      return Math.max(0, Math.min(value, STYLE_EXTREME_LIMIT.maxBorderRadius));
    case "borderWidth":
      return Math.max(0, Math.min(value, STYLE_EXTREME_LIMIT.maxBorderWidth));
    case "opacity":
      return Math.max(
        STYLE_EXTREME_LIMIT.minOpacity,
        Math.min(value, STYLE_EXTREME_LIMIT.maxOpacity),
      );
    default:
      return Math.max(0, value);
  }
}

/**
 * 校验颜色值基础合法性
 * 仅拦截明显非法值，不做严格色值解析
 * @param color 颜色字符串
 * @returns 是否为有效颜色
 */
export function isValidColor(color: string): boolean {
  if (!color || typeof color !== "string") return false;
  const trimColor = color.trim();
  // 空字符串判定非法
  if (!trimColor) return false;
  // 支持常规色值、十六进制、rgb、rgba、预设色值、transparent
  return /^(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\()|transparent|white|black|gray|red|green|blue$/.test(
    trimColor,
  );
}

/**
 * 样式合法性全局校验入口
 * 编译期、运行期双校验，提前拦截非法样式
 * @param style 待校验样式对象
 * @returns 校验结果与修正后样式
 */
export function validateStyleRule(style: NativeStyleObject): {
  valid: boolean;
  illegalKeys: string[];
  fixedStyle: NativeStyleObject;
} {
  const illegalKeys: string[] = [];
  const fixedStyle: NativeStyleObject = { ...style };

  // 校验颜色类样式
  (["color", "backgroundColor", "borderColor"] as const).forEach((key) => {
    const val = style[key];
    if (val && !isValidColor(val)) {
      illegalKeys.push(key);
      delete fixedStyle[key];
    }
  });

  // 校验数值类样式并截断极值
  (["fontSize", "borderRadius", "borderWidth", "opacity"] as const).forEach(
    (key) => {
      const val = style[key];
      if (val !== undefined) {
        const numVal = Number(val);
        if (isNaN(numVal)) {
          illegalKeys.push(key);
          delete fixedStyle[key];
        } else {
          (fixedStyle[key] as number) = clampStyleValue(key, numVal);
        }
      }
    },
  );

  return {
    valid: illegalKeys.length === 0,
    illegalKeys,
    fixedStyle,
  };
}
