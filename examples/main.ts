/**
 * @file main.ts
 * @desc 项目全局唯一启动入口
 * @core 串联内核初始化、窗口创建、渲染挂载、示例加载
 * @runOrder 项目启动最先执行 -> 初始化沙箱环境 -> 内核启动 -> 挂载Demo页面
 * @architecture 纯原生Tauri+Skia+Yoga+Vue脱离DOM渲染架构
 */

// 引入架构内核启动器（全局顶层唯一入口）
import setupNativeKernel from '../src/vue-kernel/index';
// 引入Vue核心
import { createApp } from 'vue';
// 引入演示组件
import DemoVue from './demo.vue';
import DemoTsx from './demo-tsx';
import { mountRenderDemo } from './render-fn-demo';
// 引入渲染适配器根节点工具
import { setRootCanvasNode, createNativeNode } from '../src/render-adapter/index';
// 引入分层渲染初始化
import { initLayerRender } from '../src/render-skia/layer-render';
// 引入画布获取工具
import { getTauriWindowCanvas } from '../src/tauri-window/index';
// 工具方法
import { runtimeFatal } from '../src/utils/error-handle';

/**
 * 全局启动主函数
 * 严格执行启动顺序，禁止乱序调用
 */
async function bootstrap() {
  try {
    // 1. 初始化整套原生架构内核（环境隔离、版本校验、窗口、事件、异常体系）
    await setupNativeKernel();

    // 2. 创建全局根画布节点（渲染树根节点）
    const rootNode = createNativeNode('root');
    setRootCanvasNode(rootNode);

    // 3. 获取全局Skia画布，初始化分层渲染体系
    const canvas = getTauriWindowCanvas();
    if (!canvas) throw new Error('Skia画布初始化失败');
    initLayerRender(rootNode, canvas);

    // 4. 方式一：挂载SFC Demo组件（默认启用）
    const app = createApp(DemoVue);
    app.mount(rootNode as unknown as Element);

    // 5. 可选：挂载TSX Demo / 原生Render函数Demo（按需开启）
    // createApp(DemoTsx).mount(rootNode as unknown as Element);
    // mountRenderDemo(rootNode);

    console.log('🚀 项目启动完成，渲染链路正常运行');
  } catch (err) {
    runtimeFatal('项目启动失败，架构初始化异常', 'bootstrap-entry');
    console.error('❌ 启动异常：', err);
  }
}

// 执行全局启动
bootstrap();
