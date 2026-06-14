/**
 * @file examples/render-fn-demo.ts
 * @desc 底层原生渲染器手写 render 函数 Demo
 * @core 不依赖 SFC/TSX 编译器，直接手写 VNode + 原生渲染器挂载
 * @purpose 验证自定义 render-adapter 完整链路：createVNode -> patch -> Skia绘制
 * @feature 响应式更新、节点diff、样式动态变更、原生事件触发
 */

import { createVNode, ref } from "vue";
import { render } from "@/render-adapter/index";
import type { NativeCanvasNode } from "@/render-adapter/index";
import { runtimeWarn } from "@/utils/error-handle";

// 响应式状态
const count = ref(0);
const bgColor = ref("#1989fa");
const textContent = ref("纯原生 Render 函数渲染");

/**
 * 手写渲染函数
 * 直接输出原生节点 VNode，适配 view / text 自定义标签
 */
function renderVNode() {
  return createVNode(
    "view",
    {
      style: {
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#f0f2f5",
      },
    },
    [
      createVNode(
        "view",
        {
          style: {
            width: 340,
            height: 200,
            borderRadius: 20,
            backgroundColor: bgColor.value,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 3,
            borderColor: "#fff",
            padding: 16,
          },
          onClick: handleBoxClick,
        },
        [
          createVNode(
            "text",
            {
              style: {
                fontSize: 20,
                color: "#ffffff",
                fontWeight: 600,
              },
            },
            textContent.value,
          ),
        ],
      ),
    ],
  );
}

// 点击事件
function handleBoxClick() {
  count.value++;
  // 动态切换颜色，触发diff更新 + 重绘
  bgColor.value = count.value % 2 === 0 ? "#1989fa" : "#00b42a";
  textContent.value = `点击次数：${count.value}`;
  runtimeWarn("底层render函数触发节点更新", "render-fn-demo");
}

// 初始化根VNode
let rootVNode = renderVNode();

/**
 * 绑定响应式自动更新渲染
 * 监听状态变化，重新生成VNode并patch
 */
export function mountRenderDemo(rootEl: NativeCanvasNode) {
  // 首次渲染
  render(rootVNode, rootEl);

  // 监听响应式变量自动重渲染
  const updateRender = () => {
    const newVNode = renderVNode();
    render(newVNode, rootEl);
    rootVNode = newVNode;
  };

  // 依赖追踪触发更新
  count.effect = updateRender;
  bgColor.effect = updateRender;
  textContent.effect = updateRender;

  runtimeWarn("底层Render函数Demo挂载完成", "render-fn-mount");
}

export default {
  mountRenderDemo,
};
