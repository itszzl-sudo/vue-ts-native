/**
 * @file src/index.ts
 * @desc Vue TS Native 框架统一导出入口
 * @core 导出标准 Vue API + 原生渲染器，用户零学习成本
 * @usage 
 *   import { createApp, ref, computed } from 'vue-ts-native';
 *   // 或配置别名后：import { createApp, ref, computed } from 'vue';
 */

// ========================================
// 1. 导出 Vue 核心 API（来自 @vue/runtime-core）
// ========================================
export {
  // 应用创建
  createApp,
  createSSRApp,
  
  // 响应式 API
  ref,
  reactive,
  computed,
  watch,
  watchEffect,
  watchPostEffect,
  watchSyncEffect,
  toRef,
  toRefs,
  toValue,
  unref,
  proxyRefs,
  shallowRef,
  shallowReactive,
  shallowReadonly,
  triggerRef,
  isRef,
  isReactive,
  isReadonly,
  isShallow,
  isProxy,
  
  // 组件 API
  defineComponent,
  defineAsyncComponent,
  defineEmits,
  defineExpose,
  defineProps,
  defineSlots,
  withDefaults,
  
  // 生命周期
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onErrorCaptured,
  onRenderTracked,
  onRenderTriggered,
  onActivated,
  onDeactivated,
  onServerPrefetch,
  
  // 工具函数
  nextTick,
  mergeProps,
  cloneVNode,
  isVNode,
  resolveComponent,
  resolveDirective,
  withDirectives,
  withModifiers,
  withCtx,
  createVNode,
  createTextVNode,
  createCommentVNode,
  createBlock,
  openBlock,
  createElementBlock,
  renderSlot,
  renderList,
  toHandlers,
  
  // 高级 API
  h,
  inject,
  provide,
  getCurrentInstance,
  useSlots,
  useAttrs,
  useCssModule,
  useCssVars,
  useTransitionState,
  
  // 类型导出
  type App,
  type Component,
  type ComponentPublicInstance,
  type ComputedRef,
  type Ref,
  type VNode,
  type WritableComputedRef,
} from '@vue/runtime-core';

// ========================================
// 2. 导出原生渲染器（替换 @vue/runtime-dom）
// ========================================
export {
  createApp as createNativeApp,
  render,
  unmount,
  patch,
  initNativeRenderEnv,
  destroyNativeRenderEnv,
} from './render-adapter/index';

// ========================================
// 3. 导出框架核心能力
// ========================================

// 版本管理
export {
  ARCH_VERSION,
  ALLOW_VUE_VERSION,
  RUNTIME_MODE,
  ARCH_UNIQUE_FLAG,
  getVersionString,
  getFullVersionManifest,
  assertVersionValid,
} from './vue-kernel/version-manage';

// 内核启动
export {
  setupNativeKernel,
} from './vue-kernel/index';

// 模板转换
export {
  parseSfcFile,
  getPureBlockContent,
} from './template-transform/sfc-parser';

export {
  transformTemplateToTsx,
} from './template-transform/to-tsx';

export {
  convertSfcStyleToInline,
} from './template-transform/style-convert';

// 布局引擎
export {
  layoutManager,
  initYogaLayoutEnv,
  destroyYogaLayoutEnv,
} from './layout-yoga/index';

export {
  adaptNodeMountLayout,
  adaptNodeUpdateLayout,
  adaptNodeRemoveLayout,
  refreshGlobalLayout,
  getNodeFinalLayout,
} from './layout-yoga/adapter';

// 绘制引擎
export {
  initLayerRender,
  SkiaLayerManager,
} from './render-skia/layer-render';

// 窗口管理
export {
  initNativeWindow,
  getTauriWindowCanvas,
} from './tauri-window/index';

export {
  initWindowEventCapture,
} from './tauri-window/event-capture';

// 样式映射
export {
  mapVueStyleToSkia,
  updateSkiaStyle,
  getDefaultSkiaStyle,
} from './style-mapper/index';

// 工具函数
export {
  nextTick as frameworkNextTick,
  flushTickQueue,
} from './utils/next-tick';

export {
  initGlobalErrorHandler,
  runtimeFatal,
  runtimeWarn,
} from './utils/error-handle';

// ========================================
// 4. 导出类型定义
// ========================================
export type {
  NativeCanvasNode,
} from './render-adapter/node-operate';

export type {
  NativeVNodeExtend,
  NativeVNodeProps,
} from './render-adapter/vnode-extend';

export type {
  SkiaPaintStyle,
} from './style-mapper/index';

export type {
  NativeUIEvent,
} from './render-adapter/event-bridge';

// ========================================
// 5. 全局标识
// ========================================
(globalThis as any).__VUE_NATIVE__ = true;
(globalThis as any).__VUE_BROWSER__ = false;
(globalThis as any).__VUE_WEB__ = false;

// ========================================
// 默认导出
// ========================================
import { setupNativeKernel } from './vue-kernel/index';
import { initNativeRenderEnv } from './render-adapter/index';

export default {
  setupNativeKernel,
  initNativeRenderEnv,
  RUNTIME_MODE: 'native-skia-yoga',
};
