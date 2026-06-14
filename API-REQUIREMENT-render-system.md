# 渲染系统 API 需求文档

> **文档说明：** 本文档描述 vue-ts-native 框架的渲染系统 API 需求，供 ts-native 编译器和业务项目参考。

---

## 📦 包信息

```json
{
  "name": "vue-ts-native-render",
  "version": "^1.0.0",
  "description": "Vue 原生画布渲染系统（节点操作 + 差分更新）",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

---

## 🎯 核心定位

提供**无 DOM 依赖的原生渲染系统**，实现：
- 画布节点创建和管理
- 节点池复用机制
- 差分更新（Patch）
- 属性/样式/布局更新分发
- Skia 绘制对接

---

## 📋 API 清单

### 一、节点类型定义

#### NativeCanvasNode

**原生画布节点**

```typescript
interface NativeCanvasNode {
  // 基础信息
  nodeId: string;                     // 唯一标识
  tag: string;                        // 节点类型（button/view/text 等）
  nodeType: number;                   // 节点类型（1=元素, 3=文本, 8=注释）
  
  // 树结构
  children: NativeCanvasNode[];       // 子节点列表
  parentNode: NativeCanvasNode | null; // 父节点
  
  // VNode 关联
  vnode: VNode | null;                // 关联的 VNode
  
  // 布局信息
  layoutRect: {                       // 布局矩形（由 Yoga 计算）
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // 样式和属性
  props: Record<string, any>;         // 通用属性
  styles: NativeStyleObject | null;   // 样式对象
  
  // 绘制相关
  isDirty: boolean;                   // 是否脏节点（需要重绘）
  renderOrder: number;                // 渲染层级（z-index）
  
  // 文本节点专用
  text: string | null;                // 文本内容（nodeType=3）
}
```

**属性详细说明：**

| 属性 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `nodeId` | `string` | ✅ | 节点唯一标识 | `"node_xxx"` |
| `tag` | `string` | ✅ | 节点类型 | `"button"`, `"view"`, `"text"` |
| `nodeType` | `number` | ✅ | 节点类型（标准 DOM 规范） | `1=元素`, `3=文本`, `8=注释` |
| `children` | `NativeCanvasNode[]` | ✅ | 子节点列表 | `[]` |
| `parentNode` | `NativeCanvasNode \| null` | ✅ | 父节点引用 | `null`（根节点） |
| `vnode` | `VNode \| null` | ✅ | 关联的 Vue VNode | `{ type: 'button', ... }` |
| `layoutRect` | `Object` | ✅ | 布局矩形 | `{ x: 10, y: 20, width: 100, height: 40 }` |
| `props` | `Record<string, any>` | ✅ | 通用属性 | `{ disabled: true }` |
| `styles` | `NativeStyleObject` | ❌ | 样式对象 | `{ backgroundColor: "#FF0000" }` |
| `isDirty` | `boolean` | ✅ | 脏节点标志 | `false` |
| `renderOrder` | `number` | ✅ | 渲染层级 | `0` |
| `text` | `string \| null` | ❌ | 文本内容 | `"Hello"` |

---

#### NativeStyleObject

**原生样式对象**

```typescript
interface NativeStyleObject {
  // 背景
  backgroundColor?: string;
  backgroundImage?: string;
  
  // 边框
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  
  // 文本
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  
  // 布局（与 LAYOUT_PROP_WHITELIST 对应）
  width?: number | string;
  height?: number | string;
  margin?: number | string;
  padding?: number | string;
  
  // 其他
  opacity?: number;
  overflow?: 'visible' | 'hidden' | 'scroll';
  display?: 'flex' | 'block' | 'none';
}
```

---

### 二、节点创建 API

#### createNativeCanvasNode

**创建原生画布节点**

```typescript
function createNativeCanvasNode(
  tag: string,
  options?: {
    nodeId?: string;
    nodeType?: number;
  }
): NativeCanvasNode;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tag` | `string` | ✅ | 节点类型 |
| `options.nodeId` | `string` | ❌ | 自定义节点 ID（默认自动生成） |
| `options.nodeType` | `number` | ❌ | 节点类型（默认 1=元素） |

**返回值：** `NativeCanvasNode`

**实现示例：**

```typescript
let nodeIdCounter = 0;

export function createNativeCanvasNode(
  tag: string,
  options: { nodeId?: string; nodeType?: number } = {}
): NativeCanvasNode {
  return {
    nodeId: options.nodeId || `node_${++nodeIdCounter}`,
    tag,
    nodeType: options.nodeType || 1,
    children: [],
    parentNode: null,
    vnode: null,
    layoutRect: { x: 0, y: 0, width: 0, height: 0 },
    props: {},
    styles: null,
    isDirty: true,
    renderOrder: 0,
    text: null,
  };
}
```

**使用示例：**

```typescript
// 创建按钮节点
const buttonNode = createNativeCanvasNode('button');

// 创建文本节点
const textNode = createNativeCanvasNode('#text', {
  nodeType: 3
});
textNode.text = 'Hello World';
```

---

### 三、节点池 API

#### canvasNodePool

**节点池（WeakMap 存储）**

```typescript
const canvasNodePool: Map<string, NativeCanvasNode>;
```

**用途：** 
- 复用已销毁的节点
- 避免频繁创建/销毁
- 提升渲染性能

---

#### recycleNode

**回收节点到节点池**

```typescript
function recycleNode(node: NativeCanvasNode): void;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `node` | `NativeCanvasNode` | ✅ | 要回收的节点 |

**实现示例：**

```typescript
export function recycleNode(node: NativeCanvasNode): void {
  // 清空节点数据
  node.children = [];
  node.parentNode = null;
  node.vnode = null;
  node.props = {};
  node.styles = null;
  node.text = null;
  node.isDirty = true;
  
  // 回收到节点池
  canvasNodePool.set(node.nodeId, node);
}
```

---

#### getNodeFromPool

**从节点池获取节点**

```typescript
function getNodeFromPool(nodeId: string): NativeCanvasNode | null;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `nodeId` | `string` | ✅ | 节点 ID |

**返回值：** 节点或 null

**实现示例：**

```typescript
export function getNodeFromPool(nodeId: string): NativeCanvasNode | null {
  return canvasNodePool.get(nodeId) || null;
}
```

---

### 四、节点查询 API

#### getRootCanvasNode

**获取根画布节点**

```typescript
function getRootCanvasNode(): NativeCanvasNode | null;
```

**返回值：** 根节点或 null

**实现示例：**

```typescript
let rootNode: NativeCanvasNode | null = null;

export function getRootCanvasNode(): NativeCanvasNode | null {
  return rootNode;
}

export function setRootCanvasNode(node: NativeCanvasNode): void {
  rootNode = node;
}
```

---

#### findNodeById

**根据 ID 查找节点**

```typescript
function findNodeById(
  root: NativeCanvasNode,
  nodeId: string
): NativeCanvasNode | null;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `root` | `NativeCanvasNode` | ✅ | 根节点 |
| `nodeId` | `string` | ✅ | 节点 ID |

**返回值：** 节点或 null

**实现示例：**

```typescript
export function findNodeById(
  root: NativeCanvasNode,
  nodeId: string
): NativeCanvasNode | null {
  if (root.nodeId === nodeId) return root;
  
  for (const child of root.children) {
    const found = findNodeById(child, nodeId);
    if (found) return found;
  }
  
  return null;
}
```

---

### 五、差分更新 API

#### patchUpdate

**差分更新节点**

```typescript
function patchUpdate(
  oldNode: NativeCanvasNode | null,
  newNode: NativeCanvasNode,
  parent: NativeCanvasNode
): void;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `oldNode` | `NativeCanvasNode \| null` | ✅ | 旧节点 |
| `newNode` | `NativeCanvasNode` | ✅ | 新节点 |
| `parent` | `NativeCanvasNode` | ✅ | 父节点 |

**实现示例：**

```typescript
export function patchUpdate(
  oldNode: NativeCanvasNode | null,
  newNode: NativeCanvasNode,
  parent: NativeCanvasNode
): void {
  if (!oldNode) {
    // 新增节点
    insertNode(newNode, parent);
  } else if (oldNode.tag !== newNode.tag) {
    // 替换节点
    removeNode(oldNode, parent);
    insertNode(newNode, parent);
  } else {
    // 更新节点
    updateNodeProps(oldNode, newNode);
    patchUpdateChildren(oldNode, newNode);
  }
}
```

---

#### patchProp

**属性差分更新**

```typescript
function patchProp(
  el: NativeCanvasNode,
  key: string,
  prevValue: any,
  nextValue: any
): void;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `el` | `NativeCanvasNode` | ✅ | 目标节点 |
| `key` | `string` | ✅ | 属性名 |
| `prevValue` | `any` | ✅ | 旧值 |
| `nextValue` | `any` | ✅ | 新值 |

**实现示例：**

```typescript
export function patchProp(
  el: NativeCanvasNode,
  key: string,
  prevValue: any,
  nextValue: any
): void {
  // 1. 事件属性
  if (key.startsWith('on')) {
    const eventName = key.slice(2).toLowerCase();
    hostPatchEvent(el, eventName, nextValue);
  }
  // 2. 样式属性
  else if (key === 'style') {
    patchStyleProps(el, nextValue);
  }
  // 3. 布局属性
  else if (LAYOUT_PROP_WHITELIST.includes(key)) {
    patchLayoutProps(el, key, nextValue);
  }
  // 4. 通用属性
  else {
    el.props[key] = nextValue;
  }
  
  markNodeDirty(el);
}
```

---

#### patchStyleProps

**样式属性更新**

```typescript
function patchStyleProps(
  el: NativeCanvasNode,
  styles: NativeStyleObject | string
): void;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `el` | `NativeCanvasNode` | ✅ | 目标节点 |
| `styles` | `NativeStyleObject \| string` | ✅ | 样式对象或 CSS 字符串 |

**实现示例：**

```typescript
export function patchStyleProps(
  el: NativeCanvasNode,
  styles: NativeStyleObject | string
): void {
  if (typeof styles === 'string') {
    // 解析 CSS 字符串
    el.styles = parseCssString(styles);
  } else {
    // 直接使用对象
    el.styles = { ...el.styles, ...styles };
  }
  
  markNodeDirty(el);
}
```

---

#### patchLayoutProps

**布局属性更新**

```typescript
function patchLayoutProps(
  el: NativeCanvasNode,
  key: string,
  value: any
): void;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `el` | `NativeCanvasNode` | ✅ | 目标节点 |
| `key` | `string` | ✅ | 布局属性名 |
| `value` | `any` | ✅ | 属性值 |

**实现示例：**

```typescript
export function patchLayoutProps(
  el: NativeCanvasNode,
  key: string,
  value: any
): void {
  // 设置布局属性（交由 Yoga 引擎处理）
  if (!el.props.layout) {
    el.props.layout = {};
  }
  el.props.layout[key] = value;
  
  // 标记需要重新布局
  markNodeDirty(el, true);
}
```

---

### 六、布局属性白名单

#### LAYOUT_PROP_WHITELIST

**布局属性白名单**

```typescript
const LAYOUT_PROP_WHITELIST: string[] = [
  // 尺寸
  'width', 'height',
  'minWidth', 'minHeight',
  'maxWidth', 'maxHeight',
  
  // 外边距
  'margin', 'marginTop', 'marginBottom',
  'marginLeft', 'marginRight',
  
  // 内边距
  'padding', 'paddingTop', 'paddingBottom',
  'paddingLeft', 'paddingRight',
  
  // Flex 布局
  'flex', 'flexDirection', 'flexWrap',
  'flexGrow', 'flexShrink',
  'justifyContent', 'alignItems',
  'alignSelf', 'alignContent',
  'gap', 'rowGap', 'columnGap',
  
  // 定位
  'position', 'top', 'left', 'right', 'bottom'
];
```

---

### 七、脏节点标记 API

#### markNodeDirty

**标记节点为脏**

```typescript
function markNodeDirty(
  node: NativeCanvasNode,
  needLayout?: boolean
): void;
```

**参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `node` | `NativeCanvasNode` | ✅ | - | 目标节点 |
| `needLayout` | `boolean` | ❌ | `false` | 是否需要重新布局 |

**实现示例：**

```typescript
export function markNodeDirty(
  node: NativeCanvasNode,
  needLayout = false
): void {
  node.isDirty = true;
  
  // 向上传播脏标志
  let parent = node.parentNode;
  while (parent) {
    parent.isDirty = true;
    if (needLayout) {
      parent.props.layoutDirty = true;
    }
    parent = parent.parentNode;
  }
}
```

---

### 八、渲染器工厂 API

#### nativeRenderOptions

**原生渲染器选项**

```typescript
const nativeRenderOptions: RendererOptions<NativeCanvasNode, NativeCanvasNode> = {
  insert: (child, parent, anchor) => void;
  remove: (child) => void;
  createElement: (type) => NativeCanvasNode;
  createText: (text) => NativeCanvasNode;
  createComment: (text) => NativeCanvasNode;
  setText: (node, text) => void;
  setElementText: (el, text) => void;
  parentNode: (node) => NativeCanvasNode | null;
  nextSibling: (node) => NativeCanvasNode | null;
  patchProp: (el, key, prevValue, nextValue) => void;
};
```

**实现示例：**

```typescript
import { createRenderer } from '@vue/runtime-core';

export const nativeRenderOptions = {
  insert,
  remove,
  createElement,
  createText,
  createComment,
  setText,
  setElementText,
  parentNode,
  nextSibling,
  patchProp,
};

export const nativeRenderer = createRenderer(nativeRenderOptions);
export const createApp = nativeRenderer.createApp;
```

---

### 九、渲染执行 API

#### render

**渲染 VNode 到容器**

```typescript
function render(
  vnode: VNode | null,
  container: NativeCanvasNode
): void;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `vnode` | `VNode \| null` | ✅ | 虚拟节点（null=卸载） |
| `container` | `NativeCanvasNode` | ✅ | 容器节点 |

**使用示例：**

```typescript
import { createApp } from 'vue-ts-native';
import App from './App.vue';

const app = createApp(App);
const container = createNativeCanvasNode('root');
app.mount(container);
```

---

#### createApp

**创建应用实例**

```typescript
function createApp(
  rootComponent: Component,
  rootProps?: Record<string, any>
): App;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `rootComponent` | `Component` | ✅ | 根组件 |
| `rootProps` | `Record<string, any>` | ❌ | 根属性 |

**返回值：** `App`

**App 接口：**

```typescript
interface App {
  mount(container: NativeCanvasNode): void;
  unmount(): void;
  provide(key: string, value: any): void;
  use(plugin: Plugin): this;
  component(name: string, component: Component): this;
  directive(name: string, directive: Function): this;
}
```

---

## 📊 节点类型说明

### 元素节点（nodeType = 1）

```typescript
{
  nodeId: "btn_001",
  tag: "button",
  nodeType: 1,
  children: [],
  layoutRect: { x: 10, y: 20, width: 100, height: 40 },
  props: { disabled: false },
  styles: { backgroundColor: "#007BFF" }
}
```

### 文本节点（nodeType = 3）

```typescript
{
  nodeId: "text_002",
  tag: "#text",
  nodeType: 3,
  text: "Hello World",
  children: [],
  layoutRect: { x: 10, y: 20, width: 80, height: 20 }
}
```

### 注释节点（nodeType = 8）

```typescript
{
  nodeId: "comment_003",
  tag: "#comment",
  nodeType: 8,
  text: "v-if condition",
  children: []
}
```

---

## 🔄 完整渲染流程示例

```
1. 创建根节点
   const root = createNativeCanvasNode('root');
   setRootCanvasNode(root);
   ↓
2. 创建应用
   const app = createApp(App);
   ↓
3. 挂载到容器
   app.mount(root);
   ↓
4. Vue 内部调用渲染器
   nativeRenderOptions.createElement('button')
   → 创建 NativeCanvasNode
   ↓
5. 插入子节点
   nativeRenderOptions.insert(child, parent, null)
   → child.parentNode = parent
   → parent.children.push(child)
   ↓
6. 更新属性
   nativeRenderOptions.patchProp(el, 'style', null, { backgroundColor: "#FF0000" })
   → el.styles = { backgroundColor: "#FF0000" }
   → markNodeDirty(el)
   ↓
7. 布局计算（Yoga）
   computeLayout(root)
   → 更新 layoutRect
   ↓
8. Skia 绘制
   drawNode(canvas, root)
   → 绘制到窗口画布
```

---

## 📝 业务项目使用示例

### 自定义渲染器扩展

```typescript
import { createNativeCanvasNode } from 'vue-ts-native-render';

// 创建自定义节点
const customNode = createNativeCanvasNode('custom-view');
customNode.props.customData = { /* ... */ };

// 手动操作节点树
const parent = createNativeCanvasNode('view');
parent.children.push(customNode);
customNode.parentNode = parent;
```

---

## 🎯 ts-native 编译要求

### 兼容性要求

1. **无 DOM 依赖**
   - 不使用 `document.createElement`
   - 不使用 DOM API
   - 纯数据结构节点

2. **类型完整**
   - 所有接口明确定义
   - 无 `any` 类型滥用
   - 支持静态分析

3. **性能优化**
   - 节点池复用
   - WeakMap 缓存
   - 脏节点标记

---

## 📚 源码参考

**vue-ts-native 实现：**
- `src/render-adapter/node-operate.ts` - 节点操作
- `src/render-adapter/patch-update.ts` - 差分更新
- `src/render-adapter/index.ts` - 渲染器工厂
- `src/layout-yoga/adapter.ts` - Yoga 布局适配器
