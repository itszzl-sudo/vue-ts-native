# vue-ts-native Node.js 底座实施计划

> **创建日期：** 2026-06-11  
> **目标：** 基于 Node.js 实现完整的 vue-ts-native 运行环境

---

## 🎯 核心思路

```
Node.js 环境
    ↓
C++ Addon（窗口和事件）
    ↓
vue-ts-native 框架（6 个 npm 包）
    ↓
完整的、可交互的应用程序
```

---

## 📦 6 个核心包

### 包清单

| # | 包名 | 职责 | 状态 | 依赖 |
|---|------|------|------|------|
| 1 | vue-ts-native-render | 渲染系统（节点操作） | ✅ 已完成 | @vue/runtime-core |
| 2 | vue-ts-native-layout | 布局系统（Yoga） | 📋 待创建 | yoga-layout |
| 3 | vue-ts-native-skia | 绘制系统（Skia） | 📋 待创建 | skia-canvas |
| 4 | vue-ts-native-event | 事件系统 | 📋 待创建 | - |
| 5 | vue-ts-native-template | 模板系统（SFC） | 📋 待创建 | @vue/compiler-sfc |
| 6 | vue-ts-native-shell | 窗口壳程序 | 📋 待创建 | node-glfw 或 sdl2 |

---

## 🛠️ 技术方案

### 窗口和事件方案

**选择：** node-glfw（OpenGL 窗口）

**理由：**
- ✅ 轻量级，专注窗口和事件
- ✅ 支持 OpenGL，可以直接用 skia-canvas 的 OpenGL 后端
- ✅ 事件系统完整（鼠标、键盘）
- ✅ C++ Addon，ts-native 可以 FFI 桥接

**备选：** node-sdl2

---

### 绘制方案

**skia-canvas OpenGL 后端**

```typescript
import { SkiaCanvas } from 'skia-canvas';

// 创建 OpenGL 画布
const canvas = new SkiaCanvas(800, 600, 'webgl');

// 绘制
const ctx = canvas.getContext('2d');
ctx.fillRect(10, 10, 100, 50);

// 渲染到窗口
canvas.present();
```

---

## 📋 实施步骤

### 阶段 1：完成核心包（1-2 周）

**任务：**
1. ✅ vue-ts-native-render（已完成）
2. ⏳ vue-ts-native-layout
3. ⏳ vue-ts-native-skia
4. ⏳ vue-ts-native-event
5. ⏳ vue-ts-native-template

**验收标准：**
- ✅ 每个包都可以 `npm install`
- ✅ 每个包都可以 `npm run build`
- ✅ TypeScript 类型完整

---

### 阶段 2：开发窗口壳程序（1 周）

**任务：**
1. 创建 vue-ts-native-shell 包
2. 集成 node-glfw
3. 集成 skia-canvas OpenGL
4. 实现事件循环
5. 对接 vue-ts-native-event

**验收标准：**
- ✅ 可以创建窗口
- ✅ 可以绘制内容
- ✅ 可以响应事件

---

### 阶段 3：整合测试（1 周）

**任务：**
1. 创建测试项目
2. 编写测试组件
3. 运行完整应用
4. 验证渲染和交互

**验收标准：**
- ✅ 窗口正常显示
- ✅ 组件正确渲染
- ✅ 事件正常响应
- ✅ 布局计算准确

---

## 💻 运行方式

### 开发环境

```bash
# 安装依赖
npm install

# 运行测试项目
npm run dev
```

**效果：**
- 弹出 GLFW 窗口
- 显示 Vue 组件渲染结果
- 支持鼠标和键盘交互

---

### 生产环境（未来）

```bash
# 使用 ts-native 编译
ts-native build

# 运行（需要对接 Tauri 或其他窗口系统）
./dist/app.exe
```

---

## 📁 项目结构

```
vue-ts-native/
├── packages/
│   ├── vue-ts-native-render/      ✅ 渲染系统
│   ├── vue-ts-native-layout/      📋 布局系统
│   ├── vue-ts-native-skia/        📋 绘制系统
│   ├── vue-ts-native-event/       📋 事件系统
│   ├── vue-ts-native-template/    📋 模板系统
│   └── vue-ts-native-shell/       📋 窗口壳程序
├── examples/
│   └── test-app/                  📋 测试项目
├── docs/
│   └── README.md                  本文档
└── package.json                   monorepo 配置
```

---

## 🎯 关键决策

### 1. 不使用 Electron

**原因：**
- Electron 太重
- ts-native 编译后无法使用
- 增加不必要的依赖

**替代方案：**
- node-glfw（轻量级 OpenGL 窗口）
- 或 node-sdl2

---

### 2. 核心逻辑与窗口解耦

**架构：**
```
核心渲染逻辑（不依赖窗口）
    ↓
窗口适配层（可替换）
    ↓
┌──────────┬──────────┐
│ GLFW     │ Tauri    │
│ 开发环境 │ 生产环境 │
└──────────┴──────────┘
```

**好处：**
- 开发阶段用 GLFW
- 生产阶段用 Tauri
- 核心代码不需要改

---

### 3. Node.js 能实现的，ts-native 也能实现

**原则：**
- 如果 Node.js 通过 C++ Addon 实现
- ts-native 可以通过 FFI 桥接实现
- 不依赖 Node.js 运行时

---

## 📚 参考文档

- API-REQUIREMENT-vue-runtime-core.md
- API-REQUIREMENT-event-system.md
- API-REQUIREMENT-render-system.md
- Vue 原生画布渲染方案（脱离DOM架构设计文档）_v2.md
- ts-native-vue-ts-native-SUPPORT-GUIDE.md
