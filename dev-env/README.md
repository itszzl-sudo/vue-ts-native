# vue-ts-native 开发环境

基于 Vite + Node.js 的快速开发验证环境，替代 ts-native AOT 编译。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 浏览器自动打开 http://localhost:3000
```

## 特性

- ✅ **热更新** - 修改代码即时看到效果
- ✅ **Vue 3** - 完整 Vue 开发体验
- ✅ **Yoga 布局** - 真实布局引擎计算
- ✅ **Canvas 2D** - 浏览器即时预览
- ✅ **TypeScript** - 类型安全

## 开发流程

```
修改 src/ 代码
    ↓
Vite 热更新 (毫秒级)
    ↓
浏览器自动刷新
    ↓
看到布局效果
```

## 与 ts-native 的关系

- **开发阶段**: 使用 Vite + Canvas2D 快速验证
- **生产阶段**: 使用 ts-native AOT 编译为原生二进制
- **代码复用**: 同一套 src/ 代码，只是渲染后端不同

## 目录结构

```
dev-env/
├── index.html          # 入口页面
├── main.ts             # Vue 应用入口
├── vite.config.ts      # Vite 配置
└── package.json        # 依赖配置

../src/                 # 共享源码
├── render-canvas2d.ts  # Canvas 渲染器
├── render-adapter/     # 渲染适配器
├── layout-yoga/        # Yoga 布局
└── ...
```

## 渲染后端切换

开发环境使用 Canvas2D，生产环境使用 Skia：

```typescript
// 开发环境 (Vite)
import { Canvas2DRenderer } from '../src/render-canvas2d';

// 生产环境 (ts-native)
import { SkiaRenderer } from '../src/render-skia/draw-core';
```
