# Vue TS Native

> Vue 原生渲染框架底座 - 脱离 DOM，基于 Skia + Yoga + Tauri

## 🎯 项目定位

**Vue TS Native 是 Vue 的原生版本**，让你能用标准 Vue 开发原生桌面应用，零学习成本！

```
标准 Vue → 运行在浏览器（DOM）
Vue TS Native → 运行在原生桌面（Skia 画布）
```

## ✨ 核心特性

- ✅ **零学习成本** - 完全兼容 Vue 标准 API
- ✅ **脱离 DOM** - 无浏览器、无 WebView、纯原生渲染
- ✅ **高性能** - AOT 编译为原生二进制
- ✅ **跨平台** - 基于 Tauri，支持 Windows/macOS/Linux
- ✅ **类型安全** - 完整 TypeScript 支持

## 🚀 快速开始

### 1. 安装

```bash
npm install vue-ts-native
```

### 2. 创建项目

```typescript
// main.ts - 和标准 Vue 项目完全一样！
import { createApp, ref } from 'vue-ts-native';
import App from './App.vue';

const app = createApp(App);
app.mount('#app');
```

### 3. 编写组件

```vue
<!-- App.vue - 标准 Vue 组件 -->
<template>
  <div>
    <h1>{{ message }}</h1>
    <button @click="count++">计数：{{ count }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue-ts-native';

const message = ref('Hello Vue TS Native!');
const count = ref(0);
</script>
```

### 4. 编译运行

```bash
# 编译为原生二进制
npm run build

# 或开发模式
npm run dev
```

## 📦 技术栈

- **Vue Runtime-Core** - Vue 响应式核心
- **Skia** - 2D 绘制引擎
- **Yoga** - Flexbox 布局引擎
- **Tauri** - 原生窗口框架
- **TS Native** - TypeScript AOT 编译器

## 🏗️ 架构说明

```
业务代码（标准 Vue）
    ↓
vue-ts-native (替换 runtime-dom)
    ├── 自定义渲染器
    ├── Yoga 布局
    └── Skia 绘制
    ↓
Tauri 原生窗口
    ↓
TS Native AOT 编译
    ↓
原生可执行文件（.exe）
```

## 📖 文档

- [架构设计文档](./Vue%20原生画布渲染方案（脱离DOM架构设计文档）_v2.md) - 完整架构设计
- [实施计划](./IMPLEMENTATION_PLAN.md) - Node.js 底座实施计划
- [支持指南](./ts-native-vue-ts-native-SUPPORT-GUIDE.md) - ts-native + vue-ts-native 完整使用指南
- [API 需求文档](./API-REQUIREMENT-*.md) - 详细 API 需求说明

## 🎓 示例

查看 `examples/` 目录：

- `demo.vue` - SFC 组件示例
- `demo-tsx.tsx` - TSX 示例
- `render-fn-demo.ts` - 渲染函数示例

## 🔧 开发

```bash
# 安装依赖
npm install

# 类型检查
npm run check

# 代码检查
npm run lint

# 编译
npm run build
```

## 📝 版本历史

### v1.0.0 (2026-06-11)

- ✅ 初始版本
- ✅ 完整渲染链路
- ✅ Yoga + Skia + Tauri 集成
- ✅ 模板转换能力

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🌟 生态愿景

```
ts-native (山 - 编译器基础设施)
    ↓
vue-ts-native (第一棵树 - Vue 原生版)
    ↓
更多框架 (React/Angular/Svelte 原生版)
    ↓
繁荣生态 (树叶 - 各类原生应用)
```

---

**让 Vue 运行在原生环境，脱离浏览器！** 🚀
