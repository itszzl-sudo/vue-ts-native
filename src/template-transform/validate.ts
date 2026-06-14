/**
 * @file template-transform/validate.ts
 * @desc SFC模板、样式、语法架构合规校验器
 * @note 无DOM、无Web、无RuntimeCall底层依赖，纯编译期静态规则校验
 * @rule 严格校验架构禁用语法、非法样式、DOM专属特性，提前拦截不兼容代码
 * @ability 编译前置校验、输出标准化错误日志、保障所有组件符合原生画布渲染规范
 */
import type { SFCParseResult } from "./sfc-parser";
import type { NativeStyleObject } from "./style-convert";

/**
 * 单条校验错误信息结构
 */
export interface ValidateErrorItem {
  // 错误类型：template / style / syntax
  type: "template" | "style" | "syntax";
  // 错误详情描述
  message: string;
  // 违规代码片段（可选）
  fragment?: string;
}

/**
 * 全局校验结果结构
 */
export interface ValidateResult {
  // 是否校验通过
  valid: boolean;
  // 错误列表
  errors: ValidateErrorItem[];
}

/**
 * 架构黑名单：禁止使用的DOM专属模板指令/语法
 * 彻底禁用Web端专属能力，适配纯原生渲染架构
 */
const DISABLED_TEMPLATE_ATTRS = [
  "v-html",
  "v-text",
  "v-cloak",
  "v-once",
  "innerHTML",
  "outerHTML",
  "textContent",
];

/**
 * 架构黑名单：禁止使用的复杂CSS样式属性
 * 仅保留极简白名单样式，禁用所有浏览器高级样式能力
 */
const DISABLED_STYLE_ATTRS = [
  "all",
  "position",
  "z-index",
  "float",
  "clear",
  "overflow",
  "cursor",
  "box-shadow",
  "text-shadow",
  "transition",
  "animation",
  "transform",
  "filter",
  "background-image",
];

/**
 * 校验模板内容是否存在违规语法
 * @param source 模板原始源码
 * @returns 模板校验错误列表
 */
function validateTemplateSyntax(source: string): ValidateErrorItem[] {
  const errors: ValidateErrorItem[] = [];
  if (!source) return errors;

  // 校验禁用DOM专属指令/属性
  DISABLED_TEMPLATE_ATTRS.forEach((attr) => {
    if (source.includes(attr)) {
      errors.push({
        type: "template",
        message: `架构禁止使用DOM专属语法【${attr}】，当前纯原生渲染架构不支持Web端DOM能力`,
        fragment: attr,
      });
    }
  });

  // 校验禁止使用模板内联事件修饰符（浏览器DOM专属）
  if (/\.native|\.capture|\.passive|\.exact/.test(source)) {
    errors.push({
      type: "template",
      message: "架构禁止使用浏览器DOM事件修饰符，原生事件系统不兼容该语法",
      fragment: source.match(/\.\w+/)?.[0],
    });
  }

  return errors;
}

/**
 * 校验样式对象是否存在违规样式属性
 * @param styleObj 标准化后的样式对象
 * @returns 样式校验错误列表
 */
function validateStyleRule(styleObj: NativeStyleObject): ValidateErrorItem[] {
  const errors: ValidateErrorItem[] = [];
  const styleKeys = Object.keys(styleObj) as string[];

  // 校验禁用高级样式属性
  styleKeys.forEach((key) => {
    if (DISABLED_STYLE_ATTRS.includes(key)) {
      errors.push({
        type: "style",
        message: `架构禁止使用高级CSS样式属性【${key}】，仅支持基础视觉样式白名单`,
        fragment: key,
      });
    }
  });

  return errors;
}

/**
 * 全局SFC合规校验入口
 * 编译转换前置执行，拦截所有不符合架构规范的代码
 * @param parseResult SFC结构化解析结果
 * @param styleObj 标准化内联样式对象
 * @returns 最终校验结果
 */
export function validateSfcCompliance(
  parseResult: SFCParseResult,
  styleObj: NativeStyleObject,
): ValidateResult {
  const { template } = parseResult;
  const allErrors: ValidateErrorItem[] = [];

  // 校验模板语法
  if (template?.content) {
    const templateErrors = validateTemplateSyntax(template.content);
    allErrors.push(...templateErrors);
  }

  // 校验样式规则
  const styleErrors = validateStyleRule(styleObj);
  allErrors.push(...styleErrors);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * 快速校验并抛出标准化错误（业务快捷调用）
 * 校验不通过直接输出异常信息，中断编译流程
 */
export function assertSfcValid(
  parseResult: SFCParseResult,
  styleObj: NativeStyleObject,
): void {
  const result = validateSfcCompliance(parseResult, styleObj);
  if (!result.valid) {
    const errorMsg = result.errors
      .map(
        (item, index) =>
          `${index + 1}. ${item.message} (片段: ${item.fragment || ""})`,
      )
      .join("\n");
    throw new Error(`【SFC架构合规校验失败】\n${errorMsg}`);
  }
}
