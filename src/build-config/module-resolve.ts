/**
 * @file build-config/module-resolve.ts
 * @desc 编译期模块解析 & 重定向规则
 * @core 拦截Web DOM模块、重定向Vue平台模块、优先加载原生渲染模块、杜绝浏览器垫片
 * @match 联动 compile-rule.ts / tree-shaking.ts 编译体系
 * @ability 模块黑名单拦截、路径别名强制映射、Vue平台覆盖、空模块垫片替换
 */

import { COMPILE_BLACK_LIST } from "./compile-rule";

// ====================== 解析核心开关 ======================
/**
 * 开启严格模块解析模式
 * 拦截所有不兼容原生架构的Web模块
 */
export const STRICT_MODULE_RESOLVE = true;

/**
 * 开启空模块垫片替换
 * 对黑名单模块返回空安全模块，避免编译报错
 */
export const ENABLE_EMPTY_MODULE_PATCH = true;

// ====================== 路径别名强制映射 ======================
/**
 * 全局模块别名重定向表
 * 将Vue Web平台模块强制替换为自定义原生渲染模块
 */
export const MODULE_ALIAS_MAP: Record<string, string> = {
  // 覆盖Vue默认DOM渲染器 -> 自定义Skia渲染器
  "@vue/runtime-dom": "@/render-adapter/index",
  "@vue/platform-web-runtime": "@/render-adapter/index",
  // 覆盖DOM编译器 -> 原生模板转换器
  "@vue/compiler-dom": "@/template-transform/index",
  // 替换web布局库 -> Yoga原生布局
  "css-layout": "@/layout-yoga/index",
  // 替换浏览器画布 -> Tauri Skia画布
  canvas: "@/render-skia/draw-core",
};

// ====================== 强制屏蔽模块列表 ======================
/**
 * 完全禁止解析、直接拦截的模块
 * 比黑名单优先级更高，直接终止解析
 */
export const RESOLVE_BLOCK_LIST = ["window", "document", "browser", "web-dom"];

// ====================== 工具方法 ======================
/**
 * 判断模块是否需要被拦截
 */
export function isBlockModule(moduleId: string): boolean {
  if (!STRICT_MODULE_RESOLVE) return false;
  // 匹配精准拦截列表
  if (RESOLVE_BLOCK_LIST.some((item) => moduleId === item)) return true;
  // 匹配编译黑名单
  if (COMPILE_BLACK_LIST.some((item) => moduleId.includes(item))) return true;
  return false;
}

/**
 * 获取模块重定向真实路径
 * 未命中映射则返回原路径
 */
export function getModuleRealPath(moduleId: string): string {
  // 优先匹配完整别名映射
  if (MODULE_ALIAS_MAP[moduleId]) {
    return MODULE_ALIAS_MAP[moduleId];
  }

  // 模糊匹配兜底替换
  for (const key in MODULE_ALIAS_MAP) {
    if (moduleId.includes(key)) {
      return MODULE_ALIAS_MAP[key];
    }
  }

  return moduleId;
}

/**
 * 生成安全空模块代码
 * 用于替换被拦截的Web无效模块，防止编译报错
 */
export function generateEmptyModuleCode(): string {
  return `
// Empty patched module (native skia render replace web dom module)
export * from '';
export default undefined;
  `.trim();
}

// ====================== 核心解析处理器 ======================
/**
 * 自定义模块解析钩子
 * @param moduleId 原始导入模块ID
 * @returns resolveResult 解析结果
 */
export function resolveCustomModule(moduleId: string) {
  // 1. 拦截黑名单模块
  if (isBlockModule(moduleId)) {
    return {
      blocked: true,
      redirect: "",
      code: ENABLE_EMPTY_MODULE_PATCH ? generateEmptyModuleCode() : null,
    };
  }

  // 2. 执行模块重定向
  const realPath = getModuleRealPath(moduleId);
  const isRedirect = realPath !== moduleId;

  return {
    blocked: false,
    redirect: isRedirect ? realPath : "",
    code: null,
  };
}

// ====================== 批量过滤导入语句 ======================
/**
 * 源码级过滤非法模块导入
 * 移除、替换源码中所有Web非法导入
 */
export function filterModuleImportSource(code: string): string {
  let result = code;

  // 批量替换别名导入
  Object.keys(MODULE_ALIAS_MAP).forEach((origin) => {
    const target = MODULE_ALIAS_MAP[origin];
    const reg = new RegExp(`from ['"](.*?)${origin}(.*?)['"]`, "g");
    result = result.replace(reg, `from '${target}'`);
  });

  // 批量删除黑名单导入
  COMPILE_BLACK_LIST.forEach((blackDep) => {
    const importReg = new RegExp(
      `import[\\s\\S]*?from ['"].*?${blackDep}.*?['"]\\n`,
      "g",
    );
    result = result.replace(importReg, "");
  });

  return result;
}

// ====================== 统一导出配置 ======================
/**
 * 获取完整模块解析配置
 * 供Vite/Rollup/Tauri编译引擎读取
 */
export function getModuleResolveConfig() {
  return {
    strict: STRICT_MODULE_RESOLVE,
    emptyPatch: ENABLE_EMPTY_MODULE_PATCH,
    aliasMap: MODULE_ALIAS_MAP,
    blockList: RESOLVE_BLOCK_LIST,
    blackList: COMPILE_BLACK_LIST,
  };
}
