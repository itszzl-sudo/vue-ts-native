/**
 * @file template-transform/to-tsx.ts
 * @desc Vue模板转标准TSX代码核心转换器
 * @note 无DOM、无Web、无RuntimeCall底层依赖，纯上层模板转译逻辑
 * @core 承接SFC解析结果，调用内核编译能力，输出可直接被Runtime-Core执行的TSX渲染代码
 * @ability 抹平模板语法差异、过滤DOM专属属性、适配原生画布渲染规范
 */
import { compileSfcTemplate } from "../vue-kernel/compiler-inject";
import type { SFCParseResult } from "./sfc-parser";

/**
 * TSX转换结果结构
 */
export interface TsxTransformResult {
  // 最终可执行TSX渲染函数代码
  renderCode: string;
  // 是否存在有效模板内容
  hasTemplate: boolean;
  // 转换过程错误信息
  errors: string[];
}

/**
 * 过滤模板中DOM专属、浏览器专属无效属性
 * 适配纯原生画布渲染架构，剔除无用Web属性
 * @param rawTsxCode 编译器原始输出TSX代码
 * @returns 清洗后纯净TSX代码
 */
function cleanDomSpecificAttrs(rawTsxCode: string): string {
  if (!rawTsxCode) return "";

  const cleanCode = rawTsxCode
    // 移除浏览器DOM事件兼容修饰、DOM专属属性
    .replace(/\.(native|exact|passive|capture)/g, "")
    // 移除v-html、v-text等DOM专属指令编译产物
    .replace(/vHtml|vText/g, "")
    // 清空web平台专属属性节点
    .replace(/attrs\.((?:innerHTML|outerHTML|textContent|innerText))/g, "")
    // 剔除浏览器表单、DOM专属属性
    .replace(/(readOnly|disabled|checked|selected)\s*=/g, "");

  return cleanCode;
}

/**
 * 标准化TSX渲染函数
 * 修正编译器默认输出格式，适配原生渲染器调用规范
 * @param rawRenderCode 原始编译产出渲染代码
 * @returns 标准化渲染函数
 */
function normalizeRenderFunction(rawRenderCode: string): string {
  if (!rawRenderCode) return "";

  // 固定渲染函数名称为 render，统一框架调用入口
  let finalCode = rawRenderCode.replace(
    /function\s+.+?\s*\(/,
    "function render(",
  );

  // 剔除编译器自带web平台适配代码
  finalCode = finalCode.replace(/\n*const _ctx = .+?\n/, "\n");
  finalCode = finalCode.replace(/\n*_ctx\./g, "\n");

  return finalCode;
}

/**
 * 核心入口：SFC模板区块转TSX渲染代码
 * @param parseResult SFC结构化解析结果
 * @returns TSX转换结果
 */
export function transformTemplateToTsx(
  parseResult: SFCParseResult,
): TsxTransformResult {
  const { template, hasTemplate, rawDescriptor } = parseResult;

  // 无模板直接返回空
  if (!hasTemplate || !template) {
    return {
      renderCode: "",
      hasTemplate: false,
      errors: [],
    };
  }

  // 内核编译模板产出原始TSX
  const compileRes = compileSfcTemplate(rawDescriptor);
  let { code: rawTsxCode, errors } = compileRes;

  // 清洗DOM专属语法、属性、指令产物
  let cleanCode = cleanDomSpecificAttrs(rawTsxCode);

  // 标准化渲染函数格式
  let renderCode = normalizeRenderFunction(cleanCode);

  return {
    renderCode,
    hasTemplate: true,
    errors,
  };
}
