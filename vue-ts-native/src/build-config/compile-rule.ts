/**
 * @file build-config/compile-rule.ts
 * @desc 项目全局编译规则、裁剪规则、AOT打包约束、依赖黑名单配置
 * @core 专属【Vue脱离DOM + Skia渲染 + Tauri原生二进制】架构编译策略
 * @rule 所有编译强制禁用Web产物、DOM模块、浏览器垫片、开启Tree-Shaking、锁定版本
 * @note 本文件为工程编译最高优先级规则，全局编译均以此文件为准
 */

import { getFullVersionManifest } from "../vue-kernel/version-manage";

// ====================== 编译阶段常量定义 ======================
/**
 * 编译环境锁定：强制纯原生Native模式
 * 禁止切换为web / browser / node 编译模式
 */
export const COMPILE_PLATFORM_LOCK = "native-binary";

/**
 * 产物输出模式：固定单文件二进制
 */
export const OUTPUT_BUNDLE_MODE = "single-binary";

/**
 * 编译运行模式：强制AOT预编译，禁止JIT/运行时编译
 */
export const COMPILE_STRATEGY = "aot";

// ====================== 依赖黑名单（强制剔除） ======================
/**
 * 彻底禁止参与编译的Web/DOM相关依赖
 * 出现即直接剔除、不打包、不解析、不兼容
 */
export const COMPILE_BLACK_LIST = [
  // Vue DOM 渲染层
  "@vue/runtime-dom",
  "@vue/platform-web-runtime",
  "@vue/compiler-dom",
  // 浏览器Web基础库
  "domhandler",
  "dom-serializer",
  "htmlparser2",
  // Web垫片、Web兼容层
  "core-js",
  "regenerator-runtime",
  // Web动画、Web布局库
  "css-layout",
  "web-animations-js",
];

/**
 * 编译语法黑名单
 * 禁止出现DOM/BOM浏览器语法，编译报错拦截
 */
export const SYNTAX_BLACK_LIST = [
  "document.",
  "window.",
  "navigator.",
  "HTMLElement",
  "HTMLDivElement",
  "addEventListener",
  "removeEventListener",
  "requestAnimationFrame",
];

// ====================== 编译开启能力白名单 ======================
/**
 * 仅允许的编译能力集合
 * 最小能力集，杜绝冗余打包
 */
export const COMPILE_WHITE_LIST_FEATURE = [
  // TS 标准语法
  "typescript",
  // Vue 内核响应式、组件、生命周期
  "vue-runtime-core",
  "vue-sfc-compile",
  // 原生布局、绘制
  "yoga-layout",
  "skia-render",
  // Tauri 原生窗口能力
  "tauri-window",
  "tauri-event",
];

// ====================== 编译优化规则 ======================
/**
 * 全局编译优化配置
 */
export const COMPILE_OPTIMIZE_RULE = {
  // 开启严格Tree-Shaking
  treeShaking: true,
  // 清除死代码、环境分支代码
  eliminateDeadCode: true,
  // 禁用代码压缩混淆（可生产环境开启）
  minify: false,
  // 禁用sourceMap（二进制产物无需调试映射）
  sourceMap: false,
  // 强制变量内联、常量折叠
  constantFolding: true,
  // 剔除无用模块导入
  removeUnusedImport: true,
};

// ====================== 环境编译裁剪规则 ======================
/**
 * 编译期强制裁剪的环境分支
 * 所有Web/Node环境分支编译阶段直接抹除
 */
export const COMPILE_TRIM_ENV_BRANCH = [
  "isBrowser",
  "isWebWorker",
  "isNode",
  "__VUE_BROWSER__",
  "__VUE_WEB__",
];

// ====================== 版本锁定编译规则 ======================
/**
 * 编译前置版本强校验
 * 不匹配架构标准版本直接终止编译
 */
export function getCompileVersionRule() {
  return {
    strictVersionLock: true,
    allowMinorVersionDiff: false,
    manifest: getFullVersionManifest(),
  };
}

// ====================== 对外统一编译配置入口 ======================
/**
 * 全局编译规则总配置
 * 工程编译、TS编译、AOT打包统一读取此配置
 */
export function getGlobalCompileRule() {
  return {
    // 基础编译模式
    platform: COMPILE_PLATFORM_LOCK,
    outputMode: OUTPUT_BUNDLE_MODE,
    compileStrategy: COMPILE_STRATEGY,

    // 黑白名单
    blackListDeps: COMPILE_BLACK_LIST,
    blackListSyntax: SYNTAX_BLACK_LIST,
    whiteListFeature: COMPILE_WHITE_LIST_FEATURE,

    // 优化策略
    optimize: COMPILE_OPTIMIZE_RULE,

    // 环境裁剪
    trimBranch: COMPILE_TRIM_ENV_BRANCH,

    // 版本锁定
    versionRule: getCompileVersionRule(),
  };
}
