/**
 * @file vue-kernel/compiler-inject.ts
 * @desc 内置模板转换器注入封装，对接 compiler-sfc / compiler-core
 * @note 无RuntimeCall底层绑定，仅做版本映射、能力封装、转译调度
 */
import {
  parse as parseSFC,
  compileScript,
  compileTemplate,
} from "@vue/compiler-sfc";
import type {
  SFCDescriptor,
  SFCTemplateCompileOptions,
} from "@vue/compiler-sfc";
import { version as runtimeCoreVer } from "./index";
import { getMatchVersion } from "./version-manage";

// 获取配套对齐的编译器版本号
const targetCompilerVersion = getMatchVersion("compiler");

/**
 * 校验编译器包版本是否和runtime-core匹配
 */
export function checkCompilerVersion(pkgVer: string): boolean {
  return pkgVer === targetCompilerVersion;
}

/**
 * 解析完整.vue单文件，输出SFC结构化描述
 * @param source .vue文件原始文本
 */
export function parseVueSFC(source: string): SFCDescriptor {
  const descriptor = parseSFC(source, {
    filename: "internal-component.vue",
    sourceMap: false,
  });
  return descriptor;
}

/**
 * 编译template区块，输出TSX渲染代码
 */
export function compileSfcTemplate(
  descriptor: SFCDescriptor,
  scopeId?: string,
): { code: string; errors: string[] } {
  const template = descriptor.template;
  if (!template?.content) {
    return { code: "", errors: [] };
  }

  const compileOpts: SFCTemplateCompileOptions = {
    source: template.content,
    filename: "template-block",
    id: scopeId || "",
    transformAssetUrls: false,
    isProduction: true,
  };

  const res = compileTemplate(compileOpts);
  return {
    code: res.code,
    errors: res.errors.map((e) => e.message),
  };
}

/**
 * 处理script脚本区块
 */
export function compileSfcScript(descriptor: SFCDescriptor) {
  return compileScript(descriptor, {
    id: "",
    sourceMap: false,
  });
}

/**
 * 统一入口：一整条SFC转TS/TSX组合代码
 */
export function transformFullSFC(source: string) {
  const sfc = parseVueSFC(source);
  const scriptResult = compileSfcScript(sfc);
  const tplResult = compileSfcTemplate(sfc);

  return {
    descriptor: sfc,
    scriptCode: scriptResult.content,
    templateTsx: tplResult.code,
    errors: [
      ...tplResult.errors,
      ...(scriptResult.errors?.map((e) => e.message) || []),
    ],
  };
}
