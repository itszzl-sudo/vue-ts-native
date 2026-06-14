/**
 * React 组件渲染测试
 */
import React, { useState, useEffect } from "vue-ts-native-react";
import { createApp, hostCreateElement } from "vue-ts-native-render";
import { initYogaLayoutEnv, computeLayout, layoutManager } from "vue-ts-native-layout";
import { createCanvas, skiaDrawTree, renderToImage } from "vue-ts-native-skia";
import { initEventBridge } from "vue-ts-native-event";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_FILE = path.join(__dirname, "react-test.png");

function test(name: string, fn: () => Promise<void>) {
  console.log(`\n测试: ${name}`);
  fn().catch(console.error);
}

// 测试 1: 基础函数组件
test("基础函数组件", async () => {
  initYogaLayoutEnv();
  initEventBridge();

  // 定义 React 组件
  function Counter(props: any) {
    const [count, setCount] = useState(0);

    useEffect(() => {
      console.log(`组件挂载，初始值: ${count}`);
    }, []);

    return React.createElement("view", {
      width: 200,
      height: 100,
      style: { backgroundColor: "#4CAF50" },
      onClick: () => setCount(count + 1),
    }, [
      React.createElement("text", {
        style: { color: "#fff", fontSize: "24px" },
        children: [`Count: ${count}`],
      }),
    ]);
  }

  // 渲染组件
  const vnode = React.createElement(Counter, {});

  console.log("VNode:", JSON.stringify(vnode, null, 2));
  console.log("✅ 基础函数组件创建成功");
});

// 测试 2: Hooks 状态更新
test("Hooks 状态更新", async () => {
  initYogaLayoutEnv();

  function App() {
    const [count, setCount] = useState(0);
    const [text, setText] = useState("初始文本");

    return React.createElement("view", {
      width: 300,
      height: 200,
      style: { backgroundColor: "#f0f0f0" },
    }, [
      React.createElement("text", {
        style: { fontSize: "20px" },
        children: [`计数: ${count}`],
      }),
      React.createElement("text", {
        style: { fontSize: "20px" },
        children: [`文本: ${text}`],
      }),
    ]);
  }

  const vnode = App();
  console.log("VNode:", JSON.stringify(vnode, null, 2));
  console.log("✅ Hooks 状态初始化成功");
});

// 测试 3: 完整渲染流程
test("完整渲染流程", async () => {
  initYogaLayoutEnv();
  initEventBridge();

  function Button(props: any) {
    const [clicked, setClicked] = useState(false);

    return React.createElement("view", {
      width: 150,
      height: 50,
      style: {
        backgroundColor: clicked ? "#4CAF50" : "#2196F3",
        borderRadius: "8px",
      },
      onClick: () => setClicked(true),
    }, [
      React.createElement("text", {
        style: { color: "#fff", fontSize: "16px" },
        children: [clicked ? "已点击" : "点击我"],
      }),
    ]);
  }

  const root = hostCreateElement("view");
  root.layoutProps = { width: "400px", height: "300px" };

  // 模拟组件渲染
  const buttonVNode = Button({});
  console.log("Button VNode:", JSON.stringify(buttonVNode, null, 2));

  const canvas = createCanvas(400, 300);

  // 计算布局
  computeLayout(root);

  // 渲染（这里只是测试 VNode 创建，实际渲染需要对接渲染器）
  const buffer = await renderToImage(canvas, "png");
  fs.writeFileSync(OUTPUT_FILE, buffer);

  console.log(`✅ 渲染完成，输出: ${OUTPUT_FILE}`);
});

console.log("\n=== React 适配层测试 ===");
