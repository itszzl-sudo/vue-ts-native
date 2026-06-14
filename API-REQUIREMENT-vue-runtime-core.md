# @vue/runtime-core API 需求文档

> **文档说明：** 本文档描述 vue-ts-native 框架对 @vue/runtime-core 包的 API 依赖需求，供 ts-native 编译器兼容性参考。

---

## 📦 包信息

```json
{
  "name": "@vue/runtime-core",
  "version": "^3.4.27",
  "description": "Vue 运行时核心（平台无关）",
  "type": "module"
}
```

---

## 🎯 核心定位

`@vue/runtime-core` 提供**平台无关的 Vue 运行时核心**，包括：
- 组件生命周期管理
- 响应式系统集成
- **自定义渲染器工厂**（核心！）
- VNode 创建和操作

**vue-ts-native 用它替代浏览器的 @vue/runtime-dom，实现原生渲染。**

---

## 📋 API 清单

### 一、渲染器核心 API

#### 1. createRenderer

**创建自定义渲染器**

```typescript
function createRenderer<HostNode, HostElement>(
  options: RendererOptions<HostNode, HostElement>
): Renderer<HostElement>;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `options` | `RendererOptions` | ✅ | 渲染器配置项（见下方详细说明） |

**返回值：**

```typescript
interface Renderer<HostElement> {
  render: (vnode: VNode | null, container: HostElement) => void;
  createApp: (rootComponent: Component, rootProps?: Data) => App;
}
```

**使用示例：**

```typescript
import { createRenderer } from '@vue/runtime-core';
import { nativeRenderOptions } from './render-adapter';

// 创建原生渲染器
export const nativeRenderer = createRenderer(nativeRenderOptions);

// 导出 createApp
export const createApp = nativeRenderer.createApp;
```

---

#### 2. RendererOptions（渲染器配置项）

**完整接口定义：**

```typescript
interface RendererOptions<HostNode, HostElement> {
  // ========== 节点操作 ==========
  insert: (child: HostNode, parent: HostElement, anchor?: HostNode | null) => void;
  remove: (child: HostNode) => void;
  createElement: (type: string, isCustomizedBuiltIn?: string) => HostElement;
  createText: (text: string) => HostNode;
  createComment: (text: string) => HostNode;
  setText: (node: HostNode, text: string) => void;
  setElementText: (el: HostElement, text: string) => void;
  parentNode: (node: HostNode) => HostElement | null;
  nextSibling: (node: HostNode) => HostNode | null;
  
  // ========== 属性更新 ==========
  patchProp: (
    el: HostElement,
    key: string,
    prevValue: any,
    nextValue: any,
    isSVG?: boolean,
    prevChildren?: VNode<HostNode, HostElement>[],
    parentComponent?: ComponentInternalInstance | null,
    parentSuspense?: SuspenseBoundary | null,
    unmountChildren?: Function
  ) => void;
  
  // ========== 查询（可选） ==========
  querySelector?: (selector: string) => HostElement | null;
  setScopeId?: (el: HostElement, id: string) => void;
  cloneNode?: (node: HostNode) => HostNode;
  insertStaticContent?: (
    html: string,
    parent: HostElement,
    anchor: HostNode | null,
    start: HostNode | null,
    end: HostNode | null
  ) => [HostNode, HostNode];
}
```

---

### 二、节点操作 API（必须实现）

#### 1. insert

**插入子节点**

```typescript
insert: (
  child: NativeCanvasNode,
  parent: NativeCanvasNode,
  anchor?: NativeCanvasNode | null
) => void;
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `child` | `NativeCanvasNode` | 要插入的子节点 |
| `parent` | `NativeCanvasNode` | 父节点 |
| `anchor` | `NativeCanvasNode \| null` | 锚点节点（插入位置） |

**实现示例：**

```typescript
insert(child, parent, anchor) {
  if (anchor) {
    // 插入到锚点之前
    const idx = parent.children.indexOf(anchor);
    if (idx !== -1) {
      parent.children.splice(idx, 0, child);
    }
  } else {
    // 追加到末尾
    parent.children.push(child);
  }
  child.parentNode = parent;
}
```

---

#### 2. remove

**移除节点**

```typescript
remove: (child: NativeCanvasNode) => void;
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `child` | `NativeCanvasNode` | 要移除的节点 |

**实现示例：**

```typescript
remove(child) {
  if (child.parentNode) {
    const idx = child.parentNode.children.indexOf(child);
    if (idx !== -1) {
      child.parentNode.children.splice(idx, 1);
    }
    child.parentNode = null;
  }
  
  // 清理节点事件
  clearNodeEvent(child);
  
  // 从节点池移除
  canvasNodePool.delete(child.nodeId);
}
```

---

#### 3. createElement

**创建元素节点**

```typescript
createElement: (
  type: string,
  isCustomizedBuiltIn?: string
) => NativeCanvasNode;
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 元素类型（如 'button', 'view', 'text'） |
| `isCustomizedBuiltIn` | `string` | 自定义内置元素（可选） |

**返回值：** `NativeCanvasNode`

**实现示例：**

```typescript
createElement(type) {
  const node = createNativeCanvasNode(type);
  return node;
}
```

---

#### 4. createText

**创建文本节点**

```typescript
createText: (text: string) => NativeCanvasNode;
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `text` | `string` | 文本内容 |

**返回值：** `NativeCanvasNode`（nodeType = 3）

**实现示例：**

```typescript
createText(text) {
  const node = createNativeCanvasNode('#text');
  node.text = text;
  node.nodeType = 3;
  return node;
}
```

---

#### 5. createComment

**创建注释节点**

```typescript
createComment: (text: string) => NativeCanvasNode;
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `text` | `string` | 注释内容 |

**返回值：** `NativeCanvasNode`（nodeType = 8）

**实现示例：**

```typescript
createComment(text) {
  const node = createNativeCanvasNode('#comment');
  node.text = text;
  node.nodeType = 8;
  return node;
}
```

---

#### 6. setText

**设置文本节点内容**

```typescript
setText: (node: NativeCanvasNode, text: string) => void;
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `node` | `NativeCanvasNode` | 文本节点 |
| `text` | `string` | 新文本内容 |

**实现示例：**

```typescript
setText(node, text) {
  node.text = text;
  markNodeDirty(node);
}
```

---

#### 7. setElementText

**设置元素文本**

```typescript
setElementText: (el: NativeCanvasNode, text: string) => void;
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `el` | `NativeCanvasNode` | 元素节点 |
| `text` | `string` | 文本内容 |

**实现示例：**

```typescript
setElementText(el, text) {
  // 查找或创建文本子节点
  let textNode = el.children.find(c => c.nodeType === 3);
  if (!textNode) {
    textNode = createText(text);
    el.children.push(textNode);
    textNode.parentNode = el;
  } else {
    textNode.text = text;
  }
  markNodeDirty(el);
}
```

---

#### 8. parentNode

**获取父节点**

```typescript
parentNode: (node: NativeCanvasNode) => NativeCanvasNode | null;
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `node` | `NativeCanvasNode` | 子节点 |

**返回值：** 父节点或 null

**实现示例：**

```typescript
parentNode(node) {
  return node.parentNode || null;
}
```

---

#### 9. nextSibling

**获取下一个兄弟节点**

```typescript
nextSibling: (node: NativeCanvasNode) => NativeCanvasNode | null;
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `node` | `NativeCanvasNode` | 当前节点 |

**返回值：** 下一个兄弟节点或 null

**实现示例：**

```typescript
nextSibling(node) {
  if (!node.parentNode) return null;
  
  const idx = node.parentNode.children.indexOf(node);
  if (idx === -1 || idx >= node.parentNode.children.length - 1) {
    return null;
  }
  
  return node.parentNode.children[idx + 1];
}
```

---

### 三、属性更新 API

#### patchProp

**更新节点属性**

```typescript
patchProp: (
  el: NativeCanvasNode,
  key: string,
  prevValue: any,
  nextValue: any,
  isSVG?: boolean,
  prevChildren?: VNode[],
  parentComponent?: ComponentInternalInstance | null,
  parentSuspense?: SuspenseBoundary | null,
  unmountChildren?: Function
) => void;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `el` | `NativeCanvasNode` | ✅ | 目标节点 |
| `key` | `string` | ✅ | 属性名（如 'onClick', 'style', 'class'） |
| `prevValue` | `any` | ✅ | 旧值 |
| `nextValue` | `any` | ✅ | 新值 |
| `isSVG` | `boolean` | ❌ | 是否 SVG（原生渲染不使用） |
| `prevChildren` | `VNode[]` | ❌ | 旧子节点（可选） |
| `parentComponent` | `ComponentInternalInstance` | ❌ | 父组件实例 |
| `parentSuspense` | `SuspenseBoundary` | ❌ | Suspense 边界 |
| `unmountChildren` | `Function` | ❌ | 卸载子节点函数 |

**实现示例：**

```typescript
patchProp(el, key, prevValue, nextValue) {
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

### 四、VNode 类型

#### VNode

**虚拟节点接口**

```typescript
interface VNode<HostNode = any, HostElement = any> {
  __v_isVNode: true;
  type: string | Component;
  props: Record<string, any> | null;
  key: any;
  ref: any;
  scopeId: string | null;
  slotScopeIds: string[] | null;
  children: VNode[] | string | null;
  component: ComponentInternalInstance | null;
  el: HostNode | null;           // 关联的真实节点
  anchor: HostNode | null;
  target: HostElement | null;
  shapeFlag: number;
  patchFlag: number;
  dynamicProps: string[] | null;
  appContext: AppContext | null;
}
```

**常用属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `type` | `string \| Component` | 节点类型（'button' 或组件） |
| `props` | `Record<string, any>` | 属性（含事件、样式等） |
| `children` | `VNode[] \| string` | 子节点 |
| `el` | `HostNode` | 关联的真实节点 |
| `shapeFlag` | `number` | 节点标志位（ELEMENT、TEXT、COMPONENT 等） |
| `patchFlag` | `number` | 补丁标志位（TEXT、CLASS、STYLE、EVENT 等） |

---

### 五、Component 类型

#### Component

**组件定义**

```typescript
type Component = {
  name?: string;
  props?: Record<string, any>;
  setup?: (props: any, ctx: SetupContext) => any;
  render?: Function;
  computed?: Record<string, Function>;
  data?: Function;
  methods?: Record<string, Function>;
  components?: Record<string, Component>;
  directives?: Record<string, Function>;
};
```

---

### 六、响应式 API

#### ref

**创建响应式引用**

```typescript
function ref<T>(value: T): Ref<T>;
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `value` | `T` | 初始值 |

**返回值：** `Ref<T>`

**使用示例：**

```typescript
import { ref } from '@vue/runtime-core';

const count = ref(0);
count.value = 1;
```

---

#### reactive

**创建响应式对象**

```typescript
function reactive<T extends object>(target: T): Reactive<T>;
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `target` | `T` | 目标对象 |

**返回值：** `Reactive<T>`

**使用示例：**

```typescript
import { reactive } from '@vue/runtime-core';

const state = reactive({ count: 0 });
state.count = 1;
```

---

#### computed

**创建计算属性**

```typescript
function computed<T>(getter: () => T): ComputedRef<T>;
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `getter` | `() => T` | 计算函数 |

**返回值：** `ComputedRef<T>`

**使用示例：**

```typescript
import { ref, computed } from '@vue/runtime-core';

const count = ref(0);
const double = computed(() => count.value * 2);
```

---

#### watch

**监听响应式数据变化**

```typescript
function watch<T>(
  source: WatchSource<T>,
  cb: WatchCallback<T>,
  options?: WatchOptions
): WatchStopHandle;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `source` | `Ref \| Reactive \| () => T` | ✅ | 监听源 |
| `cb` | `(newVal, oldVal) => void` | ✅ | 回调函数 |
| `options` | `WatchOptions` | ❌ | 配置项 |

**返回值：** `WatchStopHandle`（停止监听的函数）

**使用示例：**

```typescript
import { ref, watch } from '@vue/runtime-core';

const count = ref(0);
watch(count, (newVal, oldVal) => {
  console.log('count changed:', oldVal, '→', newVal);
});
```

---

### 七、生命周期 API

#### onMounted

**组件挂载后**

```typescript
function onMounted(callback: () => void): void;
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `callback` | `() => void` | 回调函数 |

**使用示例：**

```typescript
import { onMounted } from '@vue/runtime-core';

onMounted(() => {
  console.log('Component mounted');
});
```

---

#### onUnmounted

**组件卸载后**

```typescript
function onUnmounted(callback: () => void): void;
```

**参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `callback` | `() => void` | 回调函数 |

**使用示例：**

```typescript
import { onUnmounted } from '@vue/runtime-core';

onUnmounted(() => {
  console.log('Component unmounted');
});
```

---

#### 其他生命周期

```typescript
// 创建前
function onBeforeMount(callback: () => void): void;

// 更新前
function onBeforeUpdate(callback: () => void): void;

// 更新后
function onUpdated(callback: () => void): void;

// 卸载前
function onBeforeUnmount(callback: () => void): void;
```

---

## 📊 API 分类总结

### 必须实现的 API

| API | 用途 | 调用频率 |
|-----|------|----------|
| `createRenderer` | 创建渲染器 | 1次（初始化） |
| `insert` | 插入节点 | 高（创建/移动） |
| `remove` | 移除节点 | 中（销毁） |
| `createElement` | 创建元素 | 高（渲染） |
| `createText` | 创建文本 | 中（渲染） |
| `patchProp` | 更新属性 | 高（更新） |
| `parentNode` | 获取父节点 | 高（遍历） |
| `nextSibling` | 获取兄弟节点 | 中（遍历） |

### 经常使用的 API

| API | 用途 | 使用场景 |
|-----|------|----------|
| `ref` | 响应式引用 | 组件状态 |
| `reactive` | 响应式对象 | 复杂状态 |
| `computed` | 计算属性 | 派生状态 |
| `watch` | 监听变化 | 副作用 |
| `onMounted` | 生命周期 | 初始化 |
| `onUnmounted` | 生命周期 | 清理 |

---

## 🎯 ts-native 编译要求

### 编译阶段

| 阶段 | 处理内容 |
|------|----------|
| 阶段 1 | @vue/runtime-core 作为依赖 lib 编译 |
| 阶段 2 | vue-ts-native 业务代码引用 |
| 阶段 3 | 编译为原生代码 |

### 兼容性要求

1. **纯 TypeScript 实现**
   - 不能依赖 DOM API
   - 不能依赖浏览器 API
   - 必须是纯 JS/TS 逻辑

2. **无平台特定代码**
   - 不能包含 `window`、`document`
   - 不能包含浏览器事件
   - 必须是平台无关的

3. **支持 AOT 编译**
   - 不能有动态 require
   - 不能有 eval/new Function
   - 必须是静态可分析的

---

## 📚 参考源码

**Vue 官方实现：**
- https://github.com/vuejs/core/blob/main/packages/runtime-core/src/renderer.ts
- https://github.com/vuejs/core/blob/main/packages/runtime-core/src/apiCreateRenderer.ts

**vue-ts-native 实现：**
- `src/render-adapter/index.ts` - 渲染器工厂
- `src/render-adapter/node-operate.ts` - 节点操作
- `src/render-adapter/patch-update.ts` - 属性更新
