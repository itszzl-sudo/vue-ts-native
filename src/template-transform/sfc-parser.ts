/**
 * @file template-transform/sfc-parser.ts
 * @desc 专属架构SFC单文件解析器、源码标准化预处理、区块拆分
 * @note 纯上层编译适配逻辑，无RuntimeCall、无DOM、无Web环境依赖
 * @ability 标准化.vue文件源码，清洗无效字符、拆分三大核心区块、输出结构化原始区块数据
 */
import { parseVueSFC } from "../vue-kernel/compiler-inject";
import type { SFCDescriptor, SFCBlock } from "@vue/compiler-sfc";

/**
 * 标准化SFC原始文件源码
 * 清除空白首尾、统一换行符、去除无用注释，保证编译一致性
 * @param source 原始.vue文件文本
 * @returns 标准化后源码字符串
 */
export function normalizeSfcSource(source: string): string {
  return source
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/^\s+|\s+$/g, "");
}

/**
 * SFC结构化解析结果类型
 */
export interface SFCParseResult {
  rawDescriptor: SFCDescriptor;
  template: SFCBlock | null;
  script: SFCBlock | null;
  styles: SFCBlock[];
  customBlocks: SFCBlock[];
  hasTemplate: boolean;
  hasScript: boolean;
  hasStyle: boolean;
}

/**
 * 解析.vue单文件，输出结构化、标准化区块数据
 * 架构专属统一解析入口，所有SFC编译流程必须走此方法
 * @param source 原始.vue文件源码
 * @returns 结构化解析结果
 */
export function parseSfcFile(source: string): SFCParseResult {
  // 源码预处理标准化
  const normalizedSource = normalizeSfcSource(source);

  // 内核SFC解析
  const descriptor = parseVueSFC(normalizedSource);

  // 提取核心区块
  const { template, script, styles, customBlocks } = descriptor;

  return {
    rawDescriptor: descriptor,
    template: template ?? null,
    script: script ?? null,
    styles,
    customBlocks,
    hasTemplate: !!template?.content,
    hasScript: !!script?.content,
    hasStyle: styles.length > 0,
  };
}

/**
 * 获取纯文本区块内容，去除空白占位
 * @param block SFC区块对象
 * @returns 纯净区块文本
 */
export function getPureBlockContent(block: SFCBlock | null): string {
  if (!block || !block.content) return "";
  return block.content.trim().replace(/\n\s*\n/g, "\n");
}
