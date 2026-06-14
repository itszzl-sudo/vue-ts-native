/**
 * @file main.ts
 * @desc Vite 开发环境入口 - Vue + Yoga + Canvas2D
 */

// @ts-nocheck

import { createApp, ref, onMounted } from 'vue';
// 不使用 yoga-wasm-web 的 npm 包，改用动态加载 CDN 版本
// import initYoga from 'yoga-wasm-web';
import { Canvas2DRenderer, LogLevel } from '../src/render-canvas2d';

// 页面日志系统（不依赖浏览器控制台）
const pageLogs: Array<{ message: string; className: string }> = [];

function logToPage(message: string, className: string = 'log-line') {
  pageLogs.push({ message, className });
  const terminal = document.getElementById('terminal');
  if (terminal) {
    const div = document.createElement('div');
    div.className = className;
    div.textContent = message;
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight;
  }
  // 同时输出到控制台（双重保障）
  if (className === 'log-error') {
    console.error(message);
  } else {
    console.log(message);
  }
}

// Vue 根组件
const App = {
  setup() {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const status = ref('初始化中...');
    const stats = ref<any>(null);

    onMounted(async () => {
      // 等待 DOM 更新后再获取 canvas
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = canvasRef.value;
      if (!canvas) {
        logToPage('[Dev] ❌ canvasRef 为 null，无法继续', 'log-error');
        status.value = '❌ Canvas 元素未找到';
        return;
      }

      logToPage('[Dev] ✅ Vue 组件已挂载', 'log-success');
      logToPage('  - Canvas 尺寸: ' + canvas.width + 'x' + canvas.height, 'log-tree');
      logToPage('');
      status.value = '加载 Yoga 引擎...';
      logToPage('[Step 1/4] 开始加载 Yoga WASM...', 'log-info');
      
      try {
        // 使用 initStreaming 加载 WASM
        const wasmResponse = await fetch('/yoga.wasm');
        const yogaModule = await import('yoga-wasm-web');
        const yoga = await yogaModule.initStreaming(wasmResponse);
        logToPage('[Step 1/4] ✅ Yoga WASM 加载成功', 'log-success');
        logToPage('  - 支持的方向: LTR=' + yoga.DIRECTION_LTR + ' RTL=' + yoga.DIRECTION_RTL, 'log-tree');
        logToPage('  - 支持的 Flex 方向: ROW=' + yoga.FLEX_DIRECTION_ROW + ' COLUMN=' + yoga.FLEX_DIRECTION_COLUMN, 'log-tree');
        logToPage('');
        status.value = 'Yoga 就绪，开始渲染...';

        // 创建 Canvas 渲染器（开启 DEBUG 日志）
        logToPage('[Step 2/4] 创建 Canvas2DRenderer...', 'log-info');
        const renderer = new Canvas2DRenderer(canvasRef.value, {
          logLevel: LogLevel.DEBUG
        });
        logToPage('[Step 2/4] ✅ Renderer 创建成功', 'log-success');
        logToPage('  - 日志级别: DEBUG', 'log-tree');
        logToPage('');

        // 创建 Yoga 布局树
        logToPage('[Step 3/4] 创建 Yoga 布局树...', 'log-info');
        
        const root = yoga.Node.create();
        root.setWidth(760);
        root.setHeight(560);
        root.setFlexDirection(yoga.FLEX_DIRECTION_COLUMN);
        root.setPadding(yoga.EDGE_ALL, 20);
        root.setGap(yoga.GUTTER_ALL, 10);
        logToPage('  - 根节点: 760×560, COLUMN, padding=20, gap=10', 'log-tree');

        // 子节点 1: 蓝色容器
        const child1 = yoga.Node.create();
        child1.setWidth(720);
        child1.setHeight(100);
        // Yoga 节点不直接支持样式，使用自定义属性存储
        (child1 as any)._backgroundColor = '#1e88e5';
        (child1 as any)._borderRadius = 12;
        root.insertChild(child1, 0);
        logToPage('  - 子节点1: 720×100, 蓝色 #1e88e5, borderRadius=12', 'log-tree');

        // 子节点 2: 行布局
        const child2 = yoga.Node.create();
        child2.setFlexDirection(yoga.FLEX_DIRECTION_ROW);
        child2.setGap(yoga.GUTTER_ALL, 10);
        logToPage('  - 子节点2: ROW 容器, gap=10', 'log-tree');

        const child2_1 = yoga.Node.create();
        child2_1.setFlex(1);
        child2_1.setHeight(150);
        (child2_1 as any)._backgroundColor = '#43a047';
        child2.insertChild(child2_1, 0);
        logToPage('    - 孙节点1: flex=1, 150高, 绿色 #43a047', 'log-tree');

        const child2_2 = yoga.Node.create();
        child2_2.setFlex(2);
        child2_2.setHeight(150);
        (child2_2 as any)._backgroundColor = '#e53935';
        (child2_2 as any)._borderRadius = 20;
        child2.insertChild(child2_2, 1);
        logToPage('    - 孙节点2: flex=2, 150高, 红色 #e53935, borderRadius=20', 'log-tree');

        root.insertChild(child2, 1);
        logToPage('  - ✅ 布局树创建完成', 'log-success');
        logToPage('');

        // 计算布局
        logToPage('[Step 4/4] 计算 Yoga 布局...', 'log-info');
        root.calculateLayout(760, 560, yoga.DIRECTION_LTR);
        logToPage('[Step 4/4] ✅ 布局计算完成', 'log-success');
        logToPage('');
        
        // 打印布局结果
        logToPage('=== 布局结果 ===', 'log-info');
        printLayoutTree(root, 'root', 0);
        logToPage('');

        // 转换为 Canvas 节点
        logToPage('[转换] Yoga → Canvas 节点...', 'log-info');
        const canvasNodes = convertYogaToCanvasNodes(root);
        const totalNodes = countNodes(canvasNodes);
        logToPage('[转换] ✅ 完成，总节点数: ' + totalNodes, 'log-success');
        logToPage('');

        // 渲染
        logToPage('[渲染] 开始 Canvas2D 渲染...', 'log-info');
        renderer.render(canvasNodes);
        
        // 获取统计信息
        stats.value = renderer.getStats();
        logToPage('');
        logToPage('=== 渲染完成 ===', 'log-success');
        logToPage('统计信息:', 'log-info');
        logToPage('  - 总节点数: ' + stats.value.totalNodes, 'log-tree');
        logToPage('  - 元素节点: ' + stats.value.elementNodes, 'log-tree');
        logToPage('  - 文本节点: ' + stats.value.textNodes, 'log-tree');
        logToPage('  - 渲染时间: ' + stats.value.renderTime.toFixed(2) + 'ms', 'log-tree');
        logToPage('  - 跳过节点: ' + stats.value.skippedNodes, 'log-tree');
        logToPage('  - 错误数: ' + stats.value.errors.length, 'log-tree');
        
        if (stats.value.errors.length > 0) {
          logToPage('  - 错误详情:', 'log-error');
          stats.value.errors.forEach((err: string) => {
            logToPage('    ❌ ' + err, 'log-error');
          });
        }
        
        logToPage('');
        logToPage('=== 测试完成 ===', 'log-success');
        
        status.value = `✅ 渲染完成 - ${stats.value.totalNodes} 个节点 (${stats.value.renderTime.toFixed(2)}ms)`;
        
      } catch (error) {
        logToPage('[Dev] ❌ 初始化失败:', 'log-error');
        logToPage('  错误: ' + error, 'log-error');
        if (error instanceof Error && error.stack) {
          logToPage('  堆栈:', 'log-error');
          error.stack.split('\n').forEach(line => {
            logToPage('    ' + line, 'log-error');
          });
        }
        status.value = `❌ 错误: ${error}`;
      }
    });

    return { canvasRef, status, stats };
  },
  template: `
    <div>
      <p style="text-align: center; margin-bottom: 10px; color: #4fc3f7; font-size: 16px;">{{ status }}</p>
      <canvas ref="canvasRef" width="760" height="560" style="border: 2px solid #333; display: block; margin: 0 auto; background: #f5f5f5;"></canvas>
      <div v-if="stats" style="margin-top: 10px; font-size: 12px; color: #888; text-align: center;">
        元素: {{ stats.elementNodes }} | 文本: {{ stats.textNodes }} | 
        跳过: {{ stats.skippedNodes }} | 错误: {{ stats.errors.length }}
      </div>
      <div id="terminal" style="margin-top: 20px; background: #000; border: 2px solid #333; border-radius: 8px; padding: 20px; max-width: 1200px; margin-left: auto; margin-right: auto; min-height: 400px; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.6; white-space: pre-wrap; overflow-y: auto;"></div>
    </div>
  `,
};

// 转换 Yoga 节点为 Canvas 节点
function convertYogaToCanvasNodes(yogaNode: any, offsetX = 0, offsetY = 0) {
  const layout = yogaNode.getComputedLayout();

  const node: any = {
    nodeType: 'element',
    tag: 'view',
    style: {
      backgroundColor: (yogaNode as any)._backgroundColor || 'transparent',
      borderWidth: String(yogaNode.getBorder(0) || 0), // EDGE_LEFT = 0
      borderColor: (yogaNode as any)._borderColor || 'transparent',
      borderRadius: String((yogaNode as any)._borderRadius || 0),
    },
    layoutRect: {
      x: layout.left + offsetX,
      y: layout.top + offsetY,
      width: layout.width,
      height: layout.height,
    },
    children: [],
    extend: {},
  };

  const childCount = yogaNode.getChildCount();
  for (let i = 0; i < childCount; i++) {
    const child = yogaNode.getChild(i);
    node.children.push(
      convertYogaToCanvasNodes(child, node.layoutRect.x, node.layoutRect.y)
    );
  }

  return node;
}

// 统计节点数
function countNodes(node: any): number {
  let count = 1;
  node.children.forEach((child: any) => {
    count += countNodes(child);
  });
  return count;
}

// 打印布局树
function printLayoutTree(yogaNode: any, name: string, depth: number) {
  const layout = yogaNode.getComputedLayout();
  const indent = '  '.repeat(depth);
  const bgColor = yogaNode.backgroundColor || 'transparent';
  const radius = yogaNode.borderRadius || 0;
  
  console.log(`${indent}${name} [${Math.round(layout.width)}×${Math.round(layout.height)} @ (${Math.round(layout.left)}, ${Math.round(layout.top)})] bg=${bgColor} radius=${radius}`);
  
  const childCount = yogaNode.getChildCount();
  for (let i = 0; i < childCount; i++) {
    const child = yogaNode.getChild(i);
    printLayoutTree(child, `child[${i}]`, depth + 1);
  }
}

// 创建 Vue 应用
createApp(App).mount('#app');
