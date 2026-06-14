/**
 * @file vue-kernel/version-manage.ts
 * @desc 架构内核版本管理器
 * @core 统一管控自定义渲染架构版本、编译校验、兼容性锁定、构建强校验
 * @use build-config/compile-rule.ts 编译阶段读取、阻止版本不匹配编译
 * @purpose 防止混用 web runtime-dom / 原生渲染内核，保证架构一致性
 */

/**
 * 架构核心版本信息
 * 主版本不兼容变更、次版本功能迭代、修订版本bug修复
 */
export const ARCH_VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  tag: "native-skia-release",
};

/**
 * 依赖版本白名单
 * 仅允许以下版本编译，防止vue版本错乱导致渲染器报错
 */
export const ALLOW_VUE_VERSION = {
  runtimeCore: "^3.3.0 || ^3.4.0 || ^3.5.0",
  tauriApi: "^2.0.0",
  typescript: "^5.0.0",
};

/**
 * 当前架构运行模式
 * 永久锁定 native 无 DOM 模式
 */
export const RUNTIME_MODE = "native-skia-yoga";

/**
 * 编译架构唯一标识
 * 用于 tree-shaking / module-resolve 识别当前架构
 */
export const ARCH_UNIQUE_FLAG = "VUE_NATIVE_SKIA_ARCH";

/**
 * 获取完整版本号字符串
 */
export function getVersionString(): string {
  const { major, minor, patch, tag } = ARCH_VERSION;
  return `${major}.${minor}.${patch}-${tag}`;
}

/**
 * 获取完整版本清单（供编译规则读取）
 */
export function getFullVersionManifest() {
  return {
    archVersion: ARCH_VERSION,
    runtimeMode: RUNTIME_MODE,
    uniqueFlag: ARCH_UNIQUE_FLAG,
    depsVersion: ALLOW_VUE_VERSION,
    buildTime: new Date().toISOString(),
  };
}

/**
 * 版本一致性校验
 * 编译期、运行期双重校验，防止架构污染
 */
export function assertVersionValid() {
  // 禁止浏览器环境运行原生架构
  if ((globalThis as any).isBrowser) {
    throw new Error(
      `[VersionError] 当前架构 ${getVersionString()} 不支持浏览器环境运行`,
    );
  }

  // 校验环境标识是否合法
  if ((globalThis as any).__VUE_WEB__ || (globalThis as any).__VUE_BROWSER__) {
    throw new Error(`[VersionError] 检测到Web环境残留，原生架构启动失败`);
  }
}
