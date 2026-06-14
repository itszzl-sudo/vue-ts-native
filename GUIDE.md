# vue-ts-native 使用指南

## 概述

vue-ts-native 提供了一套在 ts-native 环境中开发桌面应用的方案。核心思路：

1. 使用 Vue 或 React 编写 UI
2. 通过 vue-ts-native-core 调用桌面 API
3. 在 WebView2 中渲染
4. 使用 ts-native AOT 编译为 .exe

## 环境要求

- Node.js >= 18
- Windows 10/11（自带 WebView2）
- ts-native 编译器

## 完整示例

### React 计数器

```typescript
// src/main.ts
import React, { useState } from 'vue-ts-native-react';
import { showWindow, showNotification } from 'vue-ts-native-core';

function Counter() {
  const [count, setCount] = useState(0);

  return React.createElement('div', {
    style: { padding: '20px', fontFamily: 'Arial' }
  }, [
    React.createElement('h1', { key: 'title' }, '计数器'),
    React.createElement('p', { 
      key: 'count',
      style: { fontSize: '48px' }
    }, `计数: ${count}`),
    React.createElement('button', {
      key: 'btn',
      onClick: () => {
        setCount(count + 1);
        showNotification({
          title: '提示',
          message: `点击了 ${count + 1} 次`,
        });
      },
      style: {
        padding: '10px 20px',
        fontSize: '18px',
        cursor: 'pointer',
      }
    }, '点击+1'),
  ]);
}

// 创建窗口
showWindow({
  title: '计数器应用',
  url: './index.html',
  width: 400,
  height: 300,
});

// 渲染到 DOM
const root = document.getElementById('app');
if (root) {
  const vnode = Counter();
  // 手动创建 DOM（或使用 React DOM）
  root.innerHTML = `
    <div style="padding: 20px; font-family: Arial">
      <h1>计数器</h1>
      <p style="font-size: 48px">计数: 0</p>
      <button onclick="window.handleClick()" style="padding: 10px 20px; font-size: 18px">
        点击+1
      </button>
    </div>
  `;
}
```

### Vue 示例

Vue 代码可以直接使用官方 Vue 包：

```typescript
// src/main.ts
import { createApp } from 'vue';
import { showWindow } from 'vue-ts-native-core';

const App = {
  data() {
    return { count: 0 };
  },
  template: `
    <div>
      <h1>计数器</h1>
      <p style="font-size: 48px">计数: {{ count }}</p>
      <button @click="count++">点击+1</button>
    </div>
  `,
};

showWindow({
  title: 'Vue 应用',
  url: './index.html',
  width: 400,
  height: 300,
});

// 在 index.html 加载后挂载
window.addEventListener('load', () => {
  createApp(App).mount('#app');
});
```

### 剪贴板操作

```typescript
import { clipboardWriteText, clipboardReadText, showNotification } from 'vue-ts-native-core';

// 复制
function copyToClipboard(text: string) {
  clipboardWriteText(text);
  showNotification({ message: '已复制' });
}

// 粘贴
function pasteFromClipboard(): string {
  return clipboardReadText();
}
```

### 文件对话框

```typescript
import { showOpenDialog, showSaveDialog } from 'vue-ts-native-core';

// 打开文件
function openFile() {
  const files = showOpenDialog({
    title: '选择文件',
    filters: [
      { name: '文本文件', extensions: ['txt', 'md'] },
      { name: '所有文件', extensions: ['*'] }
    ],
    multiple: true,
  });
  console.log('选择的文件:', files);
}

// 保存文件
function saveFile() {
  const path = showSaveDialog({
    title: '保存文件',
    defaultPath: './output.txt',
    filters: [
      { name: '文本文件', extensions: ['txt'] }
    ],
  });
  console.log('保存路径:', path);
}
```

### 系统托盘

```typescript
import { showTray, removeTray } from 'vue-ts-native-core';

// 创建托盘
const trayId = showTray({
  tooltip: '我的应用',
  icon: './icon.ico',
  onClick: () => {
    console.log('托盘被点击');
  },
  menu: [
    { label: '打开', onClick: () => console.log('打开') },
    { label: '退出', onClick: () => removeTray(trayId) },
  ],
});
```

## 构建配置

创建 `vue-ts-native.config.ts`：

```typescript
export default {
  app: {
    title: '我的应用',
    width: 1024,
    height: 768,
  },
  framework: 'react', // 或 'vue'
};
```

## HTML 模板

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>我的应用</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

## 调试

在开发阶段，可以直接在浏览器中测试代码：

```bash
# 使用任意静态服务器
npx serve .

# 或使用 VS Code Live Server
```

注意：桌面 API（showWindow、clipboard 等）只在 ts-native 环境中可用。

## 打包为 exe

1. 构建项目：

```bash
vue-ts-native-build build
```

2. 将产物复制到 ts-native 项目：

```bash
cp dist/main.js /path/to/ts-native-project/
cp index.html /path/to/ts-native-project/
```

3. 使用 ts-native 编译：

```bash
cd /path/to/ts-native-project
tsn build
```

4. 运行：

```bash
./dist/output.exe
```

## 常见问题

### Q: 为什么桌面 API 调用后没有效果？

A: 这些 API 只在 ts-native 编译后的二进制中可用。开发时会在控制台看到警告。

### Q: 可以使用 Vue/React 的完整功能吗？

A: 可以。WebView2 提供完整的浏览器环境，Vue/React 的所有功能都可用。

### Q: 如何调试？

A: 
1. 开发时在浏览器中测试 UI
2. 编译为 exe 后，可以使用 WebView2 开发者工具（需要在代码中启用）

### Q: 支持 macOS/Linux 吗？

A: 当前仅支持 Windows（WebView2 是 Windows 专属）。

## 下一步

- 查看 [README.md](./README.md) 了解完整 API
- 查看 examples/ 目录获取示例代码
- 访问 ts-native 仓库了解 AOT 编译
