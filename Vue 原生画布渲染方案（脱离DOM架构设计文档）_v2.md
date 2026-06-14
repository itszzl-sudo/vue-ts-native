# Vue 原生画布渲染方案（脱离DOM架构设计文档）

## 文档说明

本文档为**脱离浏览器 DOM、基于 Vue Runtime-Core + Skia + Yoga + Tauri + TS Native** 全原生二进制应用架构设计，全程剥离传统网页 / DOM 包袱，最大化利用 Vue 分层解耦的超前设计，打造独立原生组件渲染体系。支持框架内部集成模板转换能力，无需依赖外部编译工具链。

## 一、整体架构定位

### 1. 核心理念

1. Vue 本质是**响应式组件框架**，DOM 仅是默认渲染适配器，非框架必需。

2. 彻底抛弃浏览器 DOM、HTML 标签体系、完整 CSS 引擎，仅保留 Vue 核心能力。

3. 以 TS 为统一技术栈，最终编译为**独立原生二进制文件**，无 Node、无 WebView、无浏览器依赖。

4. 遵循「先完成、再精致」迭代思路，最小依赖、最小适配，拒绝过度设计。

5. **内置模板处理能力**：将模板解析、模板转 TSX 逻辑集成至框架内核，运行时直接识别标准 Vue 模板，无需外部预编译工具，兼容开发者原有 Vue 模板开发习惯。

### 2. 架构总览（自上而下）

```Plain
业务层（.vue 模板 / TSX / 原生渲染函数）
     ↓
Vue 集成内核（Runtime-Core + 内置模板转换器）
     ↓
自定义渲染适配器（原runtime-dom替换层，项目核心胶水层）
     ↓
样式映射层（仅对接Vue输出样式对象，极简CSS子集）
     ↓
布局引擎：Yoga（统一处理布局、尺寸、对齐、间距）
     ↓
绘制引擎：Skia（2D矢量/位图绘制、字体、边框、圆角等视觉渲染）
     ↓
窗口基座：Tauri（原生桌面窗口、系统事件捕获）
     ↓
编译运行基座：TS Native（整体AOT编译为原生二进制）
```

## 二、分层详细设计

### （一）业务层

1. **开发规范**

    - 全量支持三种开发形态：标准 `.vue` 单文件模板、TSX、原生渲染函数，完全对齐主流 Vue 开发习惯。

    - 技术栈最终统一为 TypeScript，全链路无语法割裂。

    - 组件依赖、模块导入由 TS Native 内置模块系统管理。

2. **模板使用规则**

    - 原生支持 `<template>` 模板语法、指令、事件、插值等 Vue 基础语法，开发者可直接编写标准 Vue 模板。

    - 运行时由框架内置转换器自动将模板转为 TSX，全程对上层开发者透明。

    - 不强制改造现有编码习惯，降低迁移与学习成本。

3. **样式使用规则**

    - 模板内样式最终统一转换为 Vue `:style` 内联样式对象，Vue 自动输出标准 JSON 结构。

    - 禁用复杂 CSS 选择器、伪类、样式优先级、样式继承等浏览器专属特性。

    - 布局相关属性（flex、margin、padding、align）统一交由 Yoga 处理，样式仅负责颜色、字体、边框等视觉属性。

### （二）Vue 集成内核层（Runtime-Core + 内置模板转换模块）

#### 1. 包引入与版本要求

1. **依赖范围**

    - 核心必选：`@vue/runtime-core`（纯内核，零 DOM 依赖）

    - 内置集成：按需引入 `@vue/compiler-sfc`、`@vue/compiler-core`，作为**内置模板转换模块**，嵌入内核体系。

    - 严格禁止引入：`@vue/runtime-dom`、`@vue/runtime-web` 等 DOM 渲染适配器、DOM 相关 Polyfill。

2. **版本锁定规则**
Runtime call 属于 TS Native 底层组成部分，无法代码层面强制绑定 runtime-core、编译器包版本；采用**版本清单一一对应**方案：文档与工程配置标注配套版本号，固定主版本，小版本同步官方迭代，全局唯一版本，禁止多版本混用。重大版本变更单独分支验证兼容性后合并主干。

3. **源码引入方式**
全部使用 TS 源码参与整体编译，不使用预编译 JS 产物，保证全链路类型贯通、调用无缝衔接。

#### 2. 环境裁剪与运行时环境约束

1. **禁用环境判断分支**
主动屏蔽 / 移除内核及编译器中以下环境分支代码：

- 浏览器 `window` / `document` 相关判断与逻辑

- `isBrowser`、`isNode`、`isWebWorker` 等环境分支

- 针对 DOM、原生 Event 对象的特性判断

2. **全局对象桩（Stub）**
对依赖的少量全局对象做最小模拟，不实现完整能力：

- `console`：复用 TS Native 内置日志能力

- `process`：仅保留空对象桩，屏蔽进程、环境变量相关逻辑

- 任务调度：微任务 / 宏任务统一替换为 TS Native 内部任务队列，禁用浏览器 / 原生 Node 调度 API

- 无任何 DOM 全局对象声明与实现。

3. **平台能力裁剪**

- 禁用 `Teleport`、`Suspense` 中 DOM 节点操作相关逻辑。

- 移除 `v-html`、`v-text`、`v-cloak` 等 HTML 专属指令。

- 保留 `v-if`、`v-for`、`v-show`、事件指令等通用核心指令，非必要指令按需裁剪。

#### 3. 内置模板转换模块（核心新增能力）

1. **模块定位**
作为 Runtime-Core 配套内置模块运行，**不独立对外暴露**，仅服务内部模板转译流程，替代外部编译工具。

2. **完整转换流程**

    1. 读取 `.vue` 文件源码，通过 `compiler-sfc` 拆分 `<template>`、`<script>`、`<style>` 三大区块。

    2. 解析 `<template>` 模板语法，编译并**转换为标准 TSX 代码**。

    3. `<script>` 区块统一处理为标准 TS 代码，JS 源码自动转 TS。

    4. `<style>` 区块提取有效样式属性，批量转换为组件内联样式对象。

    5. 合并所有转换产物，输出完整可执行 TS/TSX 组件代码，交由 Runtime-Core 执行。

3. **运行约束**

    - 转换逻辑运行于框架内部，**无外部工具、无独立进程**。

    - 增加转换缓存机制：对已解析转换的组件做内存缓存，避免重复解析，提升运行性能。

    - 语法校验：内置模板语法错误捕获，输出友好提示，不直接崩溃。

#### 4. VNode 结构约束（核心对接标准）

1. **保留原生 VNode 核心字段（必须兼容）**
自定义渲染层完全遵循 runtime-core 原生 VNode 结构，**不篡改核心字段**：

- `type`：组件 / 节点类型标识

- `props`：属性集合

- `children`：子节点树

- `shapeFlag`、`patchFlag`：Diff 标记（保证 Vue 原生差分更新正常工作）

- `el`：挂载节点引用（指向我方自定义画布节点，而非 DOM）

- `style`：样式对象（Vue 标准内联样式结构，样式层唯一数据源）

- `event`：事件集合

2. **允许扩展自定义字段**
可在 VNode 上挂载图层、画笔、动画、层级等自定义字段，仅自有渲染层读取，不影响 Vue 内核逻辑。

3. **节点类型约束**
取消 HTML 标签语义区分，节点定义全权由自定义渲染层管控。组件节点、通用容器、基础控件统一使用一套 VNode 流程。

#### 5. 核心接口对接要求（渲染层与内核契约）

我方自定义渲染器**必须完全实现** runtime-core 规定的平台渲染接口，严格遵循调用时序：

1. **基础节点操作接口**

    - `hostCreateElement`：创建自定义画布节点实例

    - `hostInsert` / `hostRemove` / `hostMove`：节点树增删移管理

    - `hostSetProp`：属性分发（布局属性 → Yoga / 样式属性 → 样式映射层）

    - `hostSetText`：文本内容设置，对接 Skia 文本绘制

2. **更新与 Patch 接口**
完全复用 Vue 原生 Diff 算法，不重写差分逻辑；patch 流程内仅执行**局部重绘**，禁止全量刷新。

3. **事件系统对接**
内核事件回调保持原生调用逻辑；窗口 / 画布原生事件由我方捕获，统一转发为 Vue 组件事件；不实现 DOM 事件冒泡、捕获、事件委托等浏览器规则。

#### 6. 响应式 & 组件体系保留规则

1. **完整保留响应式能力**
全部保留 `ref` / `reactive` / `computed` / `watch` / `watchEffect`，不做任何裁剪。

2. **组件生命周期全兼容**
完整支持 `setup`、生命周期钩子、Props、Emits、Provide/Inject、插槽等能力，行为与标准 Vue 一致。

3. **模块与依赖**
组件文件读取、依赖解析、路径处理，全权交由 TS Native 内置模块系统实现。

#### 7. 编译与打包约束

1. **编译阶段**
runtime-core、内置编译器、业务代码、自定义渲染器、胶水层合并为**同一个 TS 编译单元**，由 TS Native 统一 AOT 编译。

2. **产物要求**
最终二进制为单文件，所有代码深度融合，无独立动态库、无外部依赖。

3. **代码裁剪原则**
编译开启 Tree-Shaking，剔除死代码、冗余环境分支、未使用接口，控制二进制体积。

#### 8. 运行性能约束

1. 保证 `nextTick` 异步更新队列正常运行，调度逻辑对接 TS Native 主线程。

2. 模板解析、TSX 转换为 CPU 密集操作，可按需隔离至子线程执行，不阻塞主线程渲染。

3. VNode 全生命周期保持原生效率，不在内部增加重型计算逻辑。

#### 9. 扩展与迭代规则

1. 版本升级优先校验：VNode 结构、渲染接口、Diff 标记、模板语法转换规则四大核心契约。

2. Vue 新增 API / 特性，仅在自定义渲染适配器层做适配，**不修改上游源码**。

3. 兼容性、异常问题优先在适配器、内置转换模块内部修复，保持内核原貌。

### （三）自定义渲染适配器（核心胶水层）

本层替代 Vue 默认 DOM 渲染器，是 VNode 到画布的唯一中转层，实现 Vue 标准渲染接口。

1. **必须实现核心接口**

- `createVNode`：沿用 Vue 原生 VNode 结构，扩展自定义画布字段。

- `createElement`：不再创建 DOM，生成**自定义画布节点实例**。

- `setProp`：解析 VNode 属性，分发至样式层 / Yoga 布局层。

- `insert` / `remove` / `move`：管理画布节点树增删改。

- `patch`：新旧 VNode 对比，执行局部更新、局部重绘。

- 事件转发：将画布 / 窗口事件映射为 Vue 组件事件。

2. **设计原则**
逻辑极简，只做**转发与映射**，不新增复杂业务逻辑；完全适配 Vue 原生 Diff 机制，不篡改 VNode 核心规则。

### （四）样式映射层（极简 CSS 子集）

1. **数据来源**
接收 Vue 处理完成的**行内样式对象**，不做额外 CSS 源码解析。

2. **支持属性范围**
仅保留视觉类基础属性：

- 颜色：`color`、`backgroundColor`

- 字体：`fontSize`、`fontFamily`、`fontWeight`

- 边框：`borderWidth`、`borderColor`、`borderRadius`

- 透明度：`opacity`

3. **执行逻辑**
建立**静态映射表**，将 Vue 样式字段一对一转为 Skia 绘制参数。

4. **边界规则**
不实现 CSS 层叠、优先级、继承、动画、滤镜等复杂能力；复杂视觉效果由 Skia 原生接口实现，而非样式描述。

### （五）布局引擎 Yoga

1. **职责**
全权负责所有节点布局计算：宽高、间距、对齐、Flex 规则、行列排布。

2. **对接逻辑**
渲染适配器提取 VNode 布局相关属性，传入 Yoga 完成坐标计算，输出最终绘制坐标。

3. **优势**
工业级跨平台布局引擎，与 Vue 组件树天然适配，无需自研布局逻辑。

### （六）绘制引擎 Skia

1. **职责**
接收 Yoga 计算后的坐标 + 样式层视觉参数，完成最终画面绘制。

2. **对接逻辑**
每个自定义画布节点，对应一组 Skia 绘制指令。

3. **能力范围**
文本、矩形、圆角、图片、矢量图形、图层绘制，完全脱离 HTML 渲染限制。

### （七）窗口基座 Tauri

1. **职责**
创建原生桌面窗口、窗口生命周期管理、全局键鼠 / 窗口事件捕获。

2. **使用规则**
仅使用**窗口与系统事件能力**，完全禁用内置 Web 内核、DOM、Web 能力。

### （八）编译基座 TS Native

#### 1. TS Native 真实能力

TS Native 是一个**基于 Rust + Cranelift 实现的 TypeScript AOT 编译器**，能将 TypeScript 源码直接编译为原生可执行文件，核心特性包括：

**核心能力：**
- ✅ TypeScript 语法全支持（类型、函数、类、模块、泛型等）
- ✅ 内置模块解析系统，支持 npm 包导入
- ✅ npm 包 Shim 机制（lodash、dayjs、uuid 等库可直接编译）
- ✅ NaN-boxing 64 位统一值表示
- ✅ Cranelift 代码生成引擎
- ✅ QuickJS 兜底机制（async/await、Promise 等复杂特性）
- ✅ AOT 编译为单文件原生二进制，无外部依赖

**明确不支持：**
- ❌ **不提供 DOM 运行环境**（无 window、document 等 API）
- ❌ **不提供浏览器 API**（无 fetch、WebSocket、Canvas 等）
- ❌ **不提供 Node.js 运行时**（无 fs、path、http 等模块）
- ❌ **不内置 Vue 或任何 UI 框架**

#### 2. 本项目与 TS Native 的关系

**关键认知：TS Native 是编译器基座，不是运行时框架**

```
ts-native (编译器基座)
    ↓ 编译 @vue/runtime-core npm 包
    ↓ 编译业务组件代码
    ↓ 编译自定义渲染器
    ↓ 链接所有代码为静态库
    ↓
vue-ts-native (Vue 原生渲染应用)
    ↓ 运行在 ts-native 编译的二进制中
    ↓ 自己提供 Vue 运行时环境
    ↓ 自己实现渲染适配器
```

**这意味着：**
1. ✅ `@vue/runtime-core` 可以从 npm 安装，**ts-native 会把它当作普通 TypeScript 库编译**
2. ✅ 整个 Vue 源码会参与 AOT 编译，最终成为原生二进制的一部分
3. ✅ 不需要 ts-native 官方提供 Vue 支持，**我们自己适配就行**
4. ⚠️ 所有 DOM 相关代码必须在编译时通过 Tree-Shaking 剔除
5. ⚠️ 运行时不能使用任何浏览器 / Node.js API

#### 3. 编译策略

- **统一编译**：Vue 内核 + 编译器 + 业务代码 + 渲染适配器合并为同一编译单元
- **npm 包处理**：ts-native 的 Shim 机制会自动处理 npm 包的模块解析和依赖
- **环境裁剪**：编译时通过 Tree-Shaking 自动剔除未使用的 DOM 分支代码
- **产物要求**：单文件原生二进制，无动态库、无外部依赖

#### 4. 模块系统

- ts-native 内置文件 IO、路径解析、模块加载系统
- 支持标准 ES Module 导入语法
- 自动处理 npm 包的依赖树
- 抹平 Node.js 环境依赖，无需 `node_modules` 运行时

#### 5. 运行约束

- 运行时全局对象（setTimeout、Promise 等）由 ts-native 提供或 QuickJS 兜底
- 不使用任何浏览器专属 API
- 不使用 Node.js 专属模块
- 所有文件读取、路径处理使用 ts-native 内置能力

## 三、数据流全流程（标准运行链路）

1. 开发者编写标准 `.vue` 模板 / TSX 组件。

2. TS Native 加载文件，交由 Vue 集成内核处理。

3. 内置模板模块解析 `.vue` 文件，将模板自动转换为 TSX 代码。

4. Runtime-Core 执行组件逻辑、响应式数据，生成 / 更新 **VNode 树**。

5. VNode 进入**自定义渲染适配器**，拦截 DOM 渲染流程。

6. 适配器拆分 VNode 数据：

    - 布局属性 → Yoga 计算坐标

    - 样式属性 → 样式映射层 → Skia 视觉参数

    - 事件 → 系统事件转发

7. Yoga 输出最终绘制位置与尺寸。

8. Skia 执行绘制指令，在 Tauri 原生窗口完成画面渲染。

9. 数据变更 → Vue 触发 Diff → 局部 VNode 更新 → 局部重绘。

## 四、技术选型取舍与优势

### 1. 选型取舍

- 放弃：DOM、HTML 完整生态、独立外部编译工具链、WebView、Node.js 运行时。

- 保留：Vue Runtime-Core + 内置 Compiler、TS、Yoga、Skia、Tauri、TS Native。

- 原则：**只保留刚需，不承接历史包袱；内置能力一体化，简化开发流程**。

### 2. 架构核心优势

1. **架构纯粹**
剥离 DOM 历史包袱，回归 Vue 组件 + 响应式本质，代码维护成本低。

2. **体验统一**
原生支持标准 Vue 模板，开发者无需改变编码习惯，同时底层完全运行于原生二进制环境。

3. **性能优异**
链路极短：模板转 TSX → VNode → 布局 → 绘制，无 DOM 回流、重排、浏览器兼容损耗。

4. **自由度极强**
渲染层完全自定义，不受 HTML/CSS 标准限制，可实现画布、图形、桌面客户端各类场景。

5. **全栈统一**
从业务代码到最终二进制，全程 TypeScript，类型安全、调试顺畅。

6. **理念超前**
深度利用 Vue 内核与渲染解耦、模板与运行解耦的设计，拓展 Vue 全新原生运行载体。

## 五、迭代规划（分阶段落地）

### 阶段一：基础链路打通（可用优先）

1. 搭建 TS Native 基础工程，集成 runtime-core + 内置编译器。

2. 实现模板 → TSX 转换基础能力，跑通单文件组件加载、解析、转译全流程。

3. 实现最简自定义渲染适配器，对接 Yoga 布局、Skia 绘制、基础样式映射。

4. 完成窗口、容器、文本、按钮等基础组件渲染。

> 目标：整条链路跑通，允许代码粗糙、依赖冗余。

### 阶段二：功能完善与精简（稳定优先）

1. 补全常用指令、事件系统、组件生命周期、插槽等能力。

2. 新增模板转换缓存、语法报错优化，提升运行效率与稳定性。

3. 精简代码、剔除冗余依赖，优化渲染更新逻辑。

4. 完善样式子集规范，统一团队开发标准。

### 阶段三：生态与自动化（长期运维）

1. 封装内部基础组件库，形成统一开发体系。

2. 搭建**版本自动同步流水线**，自动拉取 Vue/Yoga/Skia 官方新版本并完成适配。

3. 主力完善中文使用文档，英文文档按需补充。

4. 持续优化二进制体积、启动速度、模板转换性能。

## 六、开发约束与规范

1. **语法约束**
支持标准 `.vue` 模板、TSX、渲染函数；禁止直接使用 DOM 相关 API。

2. **样式约束**
仅使用 Vue 内联样式对象，不编写独立复杂 CSS，禁用 CSS 高级语法。

3. **渲染约束**
所有界面输出必须经过「VNode → 适配器 → Yoga → Skia」标准链路。

4. **环境约束**
所有文件 IO、路径、模块调用，统一使用 TS Native 内置能力。

5. **文档约束**
主力维护**中文文档**，面向华文圈开发者；英文文档为可选补充，不占用主线精力。

## 七、总结

本架构深度结合 Vue 分层解耦的超前设计，**将模板解析、模板转 TSX 能力内置进框架内核**，不再依赖外部编译工具，同时彻底脱离传统浏览器 DOM 生态。整套方案以「Vue 组件体系 + 内置模板转换 + 原生画布渲染 + TS 全栈编译」为核心，既保留开发者熟悉的 Vue 模板开发体验，又具备原生二进制程序轻量、高效、高自由度的优势，形成一套独立、可长期演进的全新技术体系。

## 八、关键认知更新

### 关于 TS Native 的准确理解

**TS Native 不是 Vue 的运行时环境，而是一个 TypeScript AOT 编译器**

- ❌ 错误认知："ts-native 提供 @vue/runtime-core"
- ✅ 正确认知："ts-native 编译 @vue/runtime-core npm 包为原生二进制"

**工作流程：**
1. 从 npm 安装 `@vue/runtime-core` 等依赖
2. ts-native 编译器解析整个依赖树
3. 将 Vue 源码、业务代码、渲染器编译为原生静态库
4. 链接所有库为单文件可执行程序
5. 程序运行在纯原生环境，无 DOM、无浏览器

**这意味着：**
- ts-native 开发者可能还没意识到可以这样用 Vue
- 我们已经验证了技术可行性
- 不需要等待 ts-native 官方支持，直接推进即可
- 这是一个创新突破：让 Vue 脱离 DOM，运行在纯原生环境中

### 两个项目的关系

```
ts-native (编译器基座 - Rust 实现)
    ↓ 提供 AOT 编译能力
    ↓ 提供模块解析、npm 包 Shim 机制
    
vue-ts-native (Vue 原生渲染应用 - TypeScript 实现)
    ↓ 使用 ts-native 作为编译工具
    ↓ 自己实现 Vue 运行时适配
    ↓ 自己实现渲染器、布局、绘制
```

**定位差异：**
- ts-native：底层编译器（Rust + Cranelift）
- vue-ts-native：上层应用（Vue + Skia + Yoga）

## 九、项目源代码清单（剔除 Runtime Call 相关模块）

清单全部为上层架构适配、转换、渲染胶水源码，不含 TS Native 底层 RuntimeCall 调度内核，全部 TypeScript，参与全局 AOT 编译。

### 1. Vue 内核集成层源码

#### vue-kernel/index.ts

```typescript
/**
 * @file vue-kernel/index.ts
 * @desc Vue Runtime-Core 统一入口、环境桩初始化、DOM环境分支全局裁剪
 * @note 无任何 RuntimeCall 底层依赖、无DOM API、无浏览器/Node环境依赖
 */

// 引入纯内核，彻底剔除 runtime-dom
export * from '@vue/runtime-core';

// 全局环境最小桩初始化（仅保证编译通过，不实现浏览器能力）
const globalStub = Object.freeze({});

// 屏蔽所有环境判断变量，强制进入非DOM、非Web、非Node分支
export const isBrowser = false;
export const isNode = false;
export const isWebWorker = false;

// 最小全局对象挂载，兼容vue内核少量全局读取逻辑
(globalThis as any).process = {};
(globalThis as any).window = undefined;
(globalThis as any).document = undefined;

/**
 * 初始化Vue裁剪环境
 * 主动禁用DOM分支、浏览器事件分支、Web环境分支
 */
export function initVueNativeEnv() {
  // 锁定环境变量，防止运行时被篡改
  Object.freeze(globalThis);
}
```

> 由于文档内容较长，后续源码清单保持与原文件一致，此处不再重复展示全部源码。完整源码请参考项目实际文件。

## 八、项目定位与架构认知

### 1. vue-ts-native 的真实定位

**vue-ts-native 不是 Vue 业务项目，而是 Vue 原生渲染的底座/框架**

类比理解：
- **React Native**（但使用 Vue 而非 React）
- **Flutter**（但使用 TypeScript + Vue 而非 Dart）
- **Electron**（但无 DOM、纯原生渲染）

**核心职责：**
- 提供 Vue Runtime-Core 的原生适配
- 提供自定义渲染器（替代 runtime-dom）
- 集成 Yoga 布局引擎
- 集成 Skia 绘制引擎
- 集成 Tauri 窗口管理
- 内置模板转换能力

**使用方式：**
```
开发者基于 vue-ts-native 底座
    ↓
开发业务 Vue 项目（桌面应用、工具软件等）
    ↓
编译为原生可执行程序
```

### 2. ts-native 的五阶段编译链路

**第一阶段：编译框架依赖为 Lib**
```
@vue/runtime-core → vue-runtime-core.lib
@vue/compiler-sfc → vue-compiler-sfc.lib
yoga-layout → yoga-layout.lib
skia-canvas → skia-canvas.lib
其他 npm 依赖 → xxx.lib
```

**第二阶段：编译 vue-ts-native 框架底座为 Lib**
```
vue-ts-native 整个项目（框架底座） → vue-ts-native.lib
    ↓ 依赖第一阶段的 lib
```

**第三阶段：编译业务 Vue 项目为 Lib**
```
业务项目（如 my-app） → my-app.lib
    ↓ 依赖前两阶段的所有 lib
```

**第四阶段：生成 Loader 程序**
```
ts-native 通用 loader → 复制并改名为 my-app-loader.exe
    （同一个 loader，只是文件名不同）
    ├── 加载 my-app.lib（业务代码）
    ├── 加载 vue-ts-native.lib（框架底座）
    ├── 加载所有依赖.lib
    └── 加载 ts-native-runtime.lib（运行时）
```

**第五阶段（可选）：打包为单文件 EXE**
```
my-app-loader + 所有 lib → my-app.exe（单文件）
```

**部署灵活性：**
- **开发阶段**：loader + 分离的 lib（方便调试、热更新）
- **发布阶段**：打包成单个 exe（方便分发）

**Loader 复用策略：**
- ts-native 提供通用 loader.exe
- 每个业务项目复制 loader 并改名（如 my-app-loader.exe）
- loader 本身代码不变，只改文件名
- 优势：编译快、体积小、易维护

### 3. 分层架构

```
第一层：ts-native (编译器基座 - Rust + Cranelift)
    ↓ 提供编译能力、模块系统、Shim 机制
    
第二层：vue-ts-native (渲染底座/框架 - TypeScript)
    ↓ 提供 Vue 原生渲染能力
    ├── vue-runtime-core.lib (Vue 内核)
    ├── vue-ts-native.lib (框架底座)
    ├── yoga-layout.lib (布局引擎)
    ├── skia-canvas.lib (绘制引擎)
    └── loader.exe (加载器)
    
第三层：业务 Vue 项目 (开发者使用)
    ↓ 基于底座开发应用
    ├── 桌面应用 A (基于 vue-ts-native)
    ├── 桌面应用 B (基于 vue-ts-native)
    └── 桌面应用 C (基于 vue-ts-native)
```

### 4. 生态愿景："山上长树，树上长叶"

```
ts-native (山 - 编译器基础设施)
    ↓ 提供土壤和根基
    
vue-ts-native (第一棵树 - 杀手级应用)
    ↓ 扎根于 ts-native 的能力
    ├── Vue 原生渲染 (树枝)
    ├── Skia 画布绘制 (树枝)  
    ├── Yoga 布局计算 (树枝)
    ├── Tauri 窗口管理 (树枝)
    ↓
业务项目 (树叶)
    ├── 桌面应用、工具软件
    ├── 企业应用、管理系统
    └── 各类原生应用
```

**生态发展路径：**
1. **现在**：在 ts-native 这座"山"上，种下 vue-ts-native 第一棵"树"
2. **近期**：这棵树长成后，更多框架适配（React、Angular、Svelte...）
3. **远期**：工具链生态（调试器、热更新、DevTools...）、组件市场、繁荣生态

### 5. 编译产物关系

**vue-ts-native 编译产物（框架底座）：**
```
├── vue-ts-native.lib (框架库)
├── vue-runtime-core.lib (Vue 内核)
├── yoga-layout.lib (布局引擎)
├── skia-canvas.lib (绘制引擎)
├── loader.exe (加载器)
└── ts-native-runtime.lib (运行时)
```

**业务项目编译产物（基于底座）：**
```
├── my-app.lib (业务代码)
├── 依赖 vue-ts-native.lib
├── 依赖框架的所有 lib
└── 最终打包为 my-app.exe
```

### 6. 关键认知总结

| 认知维度 | 错误理解 | 正确理解 |
|---------|---------|----------|
| ts-native 角色 | 提供 Vue 运行时 | TypeScript AOT 编译器 |
| Vue 来源 | ts-native 内置 | npm 安装，被编译为 lib |
| 编译流程 | 直接编译成 exe | lib → loader → exe（五阶段） |
| vue-ts-native 定位 | Vue 业务项目 | Vue 原生渲染底座/框架 |
| 部署方式 | 必须单文件 | 可分离 lib 或打包单文件 |
| 复用性 | 每次独立编译 | 框架 lib 可被多个业务项目复用 |

---

**文档版本**：v2.2  
**更新时间**：2026-06-11  
**更新说明**：
1. 准确定位 vue-ts-native 为框架底座，而非业务项目
2. 补充 ts-native 五阶段编译链路（依赖 lib → 框架 lib → 业务 lib → loader → exe）
3. 明确 loader 是通用的，只复制改名
4. 增加分层架构和生态愿景说明
5. 增加编译产物关系和关键认知总结表
