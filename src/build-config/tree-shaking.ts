/**
 * @file build-config/tree-shaking.ts
 * @desc 架构专属精准 Tree-Shaking 清扫规则
 * @core 针对 Vue 脱离DOM、Skia、Tauri、Yoga 架构做精准死代码剔除、模块清扫、分支裁剪
 * @match 联动 compile-rule.ts 全局编译配置，实现极致二进制瘦身
 * @ability 静态分支消除、无效模块剔除、环境死代码剪枝、Vue冗余能力清扫
 */

import { COMPILE_BLACK_LIST, COMPILE_TRIM_ENV_BRANCH } from "./compile-rule";

// ====================== 树摇核心开关常量 ======================
/**
 * 全局树摇严格模式
 * 生产/开发环境统一开启，不允许关闭
 */
export const TREE_SHAKE_STRICT_MODE = true;

/**
 * 开启常量折叠静态推导
 * 可在编译期直接替换静态布尔、字符串、数字常量
 */
export const ENABLE_CONST_FOLD = true;

/**
 * 开启模块级别精准清扫
 * 对黑名单依赖做全量模块剔除
 */
export const ENABLE_MODULE_SWEEP = true;

// ====================== 静态死代码分支匹配规则 ======================
/**
 * 编译期可安全剔除的静态判断分支
 * 全部为 Web/DOM/浏览器/Node 环境无效分支
 */
export const STATIC_DEAD_BRANCH_RULES = [
  // 环境布尔判断
  /if \(isBrowser\)/,
  /if \(isNode\)/,
  /if \(isWebWorker\)/,
  /if \(__VUE_BROWSER__\)/,
  /if \(__VUE_WEB__\)/,
  // 浏览器API存在性判断
  /if \(window\)/,
  /if \(document\)/,
  /if \(navigator\)/,
  // 运行时环境特征判断
  /process\.browser/,
  /typeof window !== 'undefined'/,
  /typeof document !== 'undefined'/,
];

// ====================== Vue 内核专属冗余清扫规则 ======================
/**
 * Vue Runtime-Core 可安全剔除的冗余能力
 * 纯原生画布架构无需这些Web专属能力
 */
export const VUE_DEAD_FEATURE_SWEEP = [
  // DOM 专属指令逻辑
  "vHtml",
  "vText",
  "vClk",
  // Web 专属组件
  "Teleport",
  "SuspenseDOM",
  // DOM 事件兼容逻辑
  "normalizeEvent",
  "delegateEvent",
  // DOM 属性修补逻辑
  "patchDOMAttr",
  "patchDOMClass",
  "patchDOMStyle",
];

// ====================== 模块清扫过滤规则 ======================
/**
 * 模块导入清扫校验
 * 匹配黑名单依赖直接标记为可丢弃模块
 */
export function isDropableModule(moduleId: string): boolean {
  return COMPILE_BLACK_LIST.some((blackItem) => moduleId.includes(blackItem));
}

/**
 * 判定当前代码行是否为静态死分支
 */
export function isStaticDeadCode(lineSource: string): boolean {
  return STATIC_DEAD_BRANCH_RULES.some((reg) => reg.test(lineSource));
}

// ====================== 编译期树摇处理器 ======================
/**
 * 处理静态常量分支消除
 * 对已知固定环境变量直接抹平分支
 */
export function resolveStaticBranch(code: string): string {
  if (!ENABLE_CONST_FOLD) return code;

  let result = code;

  // 批量抹除所有Web环境为true的无效分支
  COMPILE_TRIM_ENV_BRANCH.forEach((envKey) => {
    // 消除 if (xxx) 分支
    const trueReg = new RegExp(
      `if \\(${envKey}\\)[\\s\\S]*?\\{[\\s\\S]*?\\}`,
      "g",
    );
    result = result.replace(trueReg, "");
    // 消除 if (!xxx) 分支
    const falseReg = new RegExp(
      `if \\(!${envKey}\\)[\\s\\S]*?\\{[\\s\\S]*?\\}`,
      "g",
    );
    result = result.replace(falseReg, "");
  });

  return result;
}

/**
 * 清扫Vue内核冗余Web能力代码
 */
export function sweepVueDeadFeature(code: string): string {
  let result = code;
  VUE_DEAD_FEATURE_SWEEP.forEach((feature) => {
    // 移除无效函数定义、变量、分支
    const reg = new RegExp(
      `(function ${feature}|const ${feature}|let ${feature})[\\s\\S]*?\\n`,
      "g",
    );
    result = result.replace(reg, "");
  });
  return result;
}

/**
 * 清扫无效 import / require 模块
 */
export function sweepDeadModuleImport(code: string): string {
  if (!ENABLE_MODULE_SWEEP) return code;

  let result = code;
  COMPILE_BLACK_LIST.forEach((blackDep) => {
    // 清除 import 导入
    const importReg = new RegExp(
      `import[\\s\\S]*?from ['"].*?${blackDep}.*?['"]\\n`,
      "g",
    );
    result = result.replace(importReg, "");
    // 清除 require 导入
    const requireReg = new RegExp(
      `require\\(['"].*?${blackDep}.*?['"]\\)`,
      "g",
    );
    result = result.replace(requireReg, "");
  });

  return result;
}

// ====================== 统一树摇执行入口 ======================
/**
 * 全局编译树摇流水线
 * 按顺序执行：模块清扫 -> 常量分支消除 -> 冗余能力清扫
 */
export function applyStrictTreeShaking(sourceCode: string): string {
  if (!TREE_SHAKE_STRICT_MODE) return sourceCode;

  let code = sourceCode;
  // 1. 剔除黑名单无效模块导入
  code = sweepDeadModuleImport(code);
  // 2. 消除静态环境死分支
  code = resolveStaticBranch(code);
  // 3. 清扫Vue冗余Web能力
  code = sweepVueDeadFeature(code);

  return code;
}

// ====================== 树摇校验导出 ======================
/**
 * 获取完整树摇配置参数
 * 供编译引擎读取校验
 */
export function getTreeShakingConfig() {
  return {
    strict: TREE_SHAKE_STRICT_MODE,
    constFold: ENABLE_CONST_FOLD,
    moduleSweep: ENABLE_MODULE_SWEEP,
    deadBranchRules: STATIC_DEAD_BRANCH_RULES,
    vueDeadFeatures: VUE_DEAD_FEATURE_SWEEP,
  };
}
