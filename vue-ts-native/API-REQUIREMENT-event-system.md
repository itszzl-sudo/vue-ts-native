# 事件系统 API 需求文档

> **文档说明：** 本文档描述 vue-ts-native 框架的事件系统 API 需求，供 ts-native 编译器和业务项目参考。

---

## 📦 包信息

```json
{
  "name": "vue-ts-native-event",
  "version": "^1.0.0",
  "description": "Vue 原生画布事件系统（替代 DOM 事件）",
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

提供**无 DOM 依赖的原生事件系统**，实现：
- Tauri 窗口事件捕获
- 坐标矫正（DPR 适配）
- 命中测试（Hit Test）
- 事件分发和桥接
- 事件缓存和清理

---

## 📋 API 清单

### 一、事件对象定义

#### NativeUIEvent

**原生标准化事件对象**

```typescript
interface NativeUIEvent {
  type: string;              // 事件类型：click / mousedown / keydown 等
  target: NativeCanvasNode | null;  // 触发节点
  timeStamp: number;         // 触发时间戳
  x: number;                 // 画布坐标 X
  y: number;                 // 画布坐标 Y
  stopped: boolean;          // 事件是否已终止
}
```

**属性说明：**

| 属性 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `type` | `string` | 事件类型（小写） | `"click"`, `"mousedown"` |
| `target` | `NativeCanvasNode \| null` | 触发事件的画布节点 | `{ nodeId: "btn_001", ... }` |
| `timeStamp` | `number` | Unix 时间戳（毫秒） | `1706764800000` |
| `x` | `number` | 画布坐标 X（已矫正 DPR） | `75` |
| `y` | `number` | 画布坐标 Y（已矫正 DPR） | `52.5` |
| `stopped` | `boolean` | 是否已终止 | `false` |

---

#### NativeMouseEvent

**归一化鼠标事件结构**

```typescript
interface NativeMouseEvent {
  x: number;            // 画布坐标 X（DPR 矫正后）
  y: number;            // 画布坐标 Y（DPR 矫正后）
  clientX: number;      // 同 x（兼容 Vue 事件）
  clientY: number;      // 同 y（兼容 Vue 事件）
  screenX: number;      // 屏幕坐标 X（未矫正）
  screenY: number;      // 屏幕坐标 Y（未矫正）
  button: number;       // 鼠标按键（0=左, 1=中, 2=右）
  ctrlKey: boolean;     // Ctrl 键是否按下
  altKey: boolean;      // Alt 键是否按下
  shiftKey: boolean;    // Shift 键是否按下
  metaKey: boolean;     // Meta 键是否按下（Mac=Cmd, Win=Win）
}
```

**使用示例：**

```typescript
function handleClick(event: NativeMouseEvent) {
  console.log('点击位置:', event.x, event.y);
  console.log('是否按住 Ctrl:', event.ctrlKey);
}
```

---

#### NativeKeyboardEvent

**归一化键盘事件结构**

```typescript
interface NativeKeyboardEvent {
  key: string;          // 按键名称（"a", "Enter", "Escape" 等）
  code: string;         // 物理按键代码（"KeyA", "Enter", "Escape" 等）
  ctrlKey: boolean;     // Ctrl 键是否按下
  altKey: boolean;      // Alt 键是否按下
  shiftKey: boolean;    // Shift 键是否按下
  metaKey: boolean;     // Meta 键是否按下
}
```

**使用示例：**

```typescript
function handleKeydown(event: NativeKeyboardEvent) {
  if (event.key === 'Enter') {
    console.log('按下回车键');
  }
  if (event.ctrlKey && event.key === 's') {
    console.log('Ctrl+S 保存');
  }
}
```

---

#### NodeHitEvent

**命中节点事件数据**

```typescript
interface NodeHitEvent {
  node: NativeCanvasNode | null;  // 命中的节点
  event: NativeMouseEvent;        // 鼠标事件
}
```

---

### 二、事件创建 API

#### createNativeEvent

**创建标准化事件对象**

```typescript
function createNativeEvent(
  type: string,
  target: NativeCanvasNode | null,
  x?: number,
  y?: number
): NativeUIEvent;
```

**参数：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `type` | `string` | ✅ | - | 事件类型 |
| `target` | `NativeCanvasNode \| null` | ✅ | - | 触发节点 |
| `x` | `number` | ❌ | `0` | 画布坐标 X |
| `y` | `number` | ❌ | `0` | 画布坐标 Y |

**返回值：** `NativeUIEvent`

**实现示例：**

```typescript
export function createNativeEvent(
  type: string,
  target: NativeCanvasNode | null,
  x = 0,
  y = 0,
): NativeUIEvent {
  return {
    type,
    target,
    timeStamp: Date.now(),
    x,
    y,
    stopped: false,
  };
}
```

**使用示例：**

```typescript
const event = createNativeEvent('click', buttonNode, 75, 52.5);
triggerNodeEvent(buttonNode, event);
```

---

#### stopNativeEvent

**终止事件执行**

```typescript
function stopNativeEvent(event: NativeUIEvent): void;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `event` | `NativeUIEvent` | ✅ | 要终止的事件 |

**实现示例：**

```typescript
export function stopNativeEvent(event: NativeUIEvent): void {
  event.stopped = true;
}
```

**使用示例：**

```typescript
function handleClick(event: NativeUIEvent) {
  // 终止后续回调执行
  stopNativeEvent(event);
}
```

---

### 三、事件绑定 API

#### hostPatchEvent

**绑定/移除节点事件**

```typescript
function hostPatchEvent(
  node: NativeCanvasNode,
  eventName: string,
  handler: Function | null
): void;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `node` | `NativeCanvasNode` | ✅ | 画布节点 |
| `eventName` | `string` | ✅ | 事件名（不含 on 前缀，小写） |
| `handler` | `Function \| null` | ✅ | 回调函数（null=移除） |

**实现示例：**

```typescript
const nodeEventMap = new WeakMap<
  NativeCanvasNode,
  Record<string, Function | Function[]>
>();

export function hostPatchEvent(
  node: NativeCanvasNode,
  eventName: string,
  handler: Function | null,
): void {
  // 初始化节点事件存储容器
  if (!nodeEventMap.has(node)) {
    nodeEventMap.set(node, {});
  }
  const eventCache = nodeEventMap.get(node)!;

  // 空 handler 代表移除事件
  if (!handler) {
    delete eventCache[eventName];
    return;
  }

  // 支持同一事件多回调绑定
  if (eventCache[eventName]) {
    const exist = eventCache[eventName];
    if (Array.isArray(exist)) {
      exist.push(handler);
    } else {
      eventCache[eventName] = [exist, handler];
    }
  } else {
    eventCache[eventName] = handler;
  }
}
```

**使用示例：**

```typescript
// 绑定事件
hostPatchEvent(buttonNode, 'click', handleClick);

// 绑定多个回调
hostPatchEvent(buttonNode, 'click', handleAnother);

// 移除事件
hostPatchEvent(buttonNode, 'click', null);
```

---

### 四、事件触发 API

#### triggerNodeEvent

**触发节点事件**

```typescript
function triggerNodeEvent(
  node: NativeCanvasNode,
  event: NativeUIEvent
): void;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `node` | `NativeCanvasNode` | ✅ | 目标节点 |
| `event` | `NativeUIEvent` | ✅ | 标准化事件对象 |

**实现示例：**

```typescript
export function triggerNodeEvent(
  node: NativeCanvasNode,
  event: NativeUIEvent,
): void {
  const eventCache = nodeEventMap.get(node);
  if (!eventCache || event.stopped) return;

  const handlers = eventCache[event.type];
  if (!handlers) return;

  // 执行单回调 / 多回调
  if (Array.isArray(handlers)) {
    handlers.forEach((fn) => {
      if (!event.stopped) fn(event);
    });
  } else {
    handlers(event);
  }
}
```

**使用示例：**

```typescript
const event = createNativeEvent('click', buttonNode, 75, 52.5);
triggerNodeEvent(buttonNode, event);
```

---

#### emitNodeVueEvent

**触发 Vue 组件事件**

```typescript
function emitNodeVueEvent(
  node: NativeCanvasNode | null,
  eventName: string,
  event: NativeMouseEvent | NativeKeyboardEvent
): void;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `node` | `NativeCanvasNode \| null` | ✅ | 目标节点 |
| `eventName` | `string` | ✅ | Vue 事件名（不含 on，如 "Click"） |
| `event` | `NativeMouseEvent \| NativeKeyboardEvent` | ✅ | 事件数据 |

**实现示例：**

```typescript
function emitNodeVueEvent(
  node: NativeCanvasNode | null,
  eventName: string,
  event: NativeMouseEvent | NativeKeyboardEvent,
) {
  if (!node || !node.vnode || !node.vnode.props) return;

  // 匹配 Vue 标准事件名（onClick / onMousedown / onMouseup 等）
  const vueEventKey = `on${eventName}`;
  const handler = node.vnode.props[vueEventKey] || node.vnode.props[eventName];

  if (typeof handler === "function") {
    handler(event);
  }
}
```

**使用示例：**

```typescript
// 触发 Click 事件
emitNodeVueEvent(buttonNode, 'Click', mouseEvent);

// 触发 Mousedown 事件
emitNodeVueEvent(buttonNode, 'Mousedown', mouseEvent);
```

---

### 五、坐标处理 API

#### normalizePointerCoordinate

**坐标矫正（DPR 适配）**

```typescript
function normalizePointerCoordinate(
  rawX: number,
  rawY: number
): { x: number; y: number };
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `rawX` | `number` | ✅ | 原始坐标 X（屏幕坐标） |
| `rawY` | `number` | ✅ | 原始坐标 Y（屏幕坐标） |

**返回值：** `{ x: number; y: number }`（矫正后的画布坐标）

**实现示例：**

```typescript
export function normalizePointerCoordinate(
  rawX: number,
  rawY: number,
): { x: number; y: number } {
  const { dpr } = getWindowPixelRect();
  return {
    x: rawX * dpr,
    y: rawY * dpr,
  };
}
```

**使用示例：**

```typescript
// 屏幕坐标 {50, 35}，DPR=1.5
const { x, y } = normalizePointerCoordinate(50, 35);
// 画布坐标 {75, 52.5}
```

---

#### pointInRect

**矩形区域点检测**

```typescript
function pointInRect(
  px: number,
  py: number,
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
): boolean;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `px` | `number` | ✅ | 点 X 坐标 |
| `py` | `number` | ✅ | 点 Y 坐标 |
| `rect` | `Object` | ✅ | 矩形区域 |
| `rect.x` | `number` | ✅ | 矩形左上角 X |
| `rect.y` | `number` | ✅ | 矩形左上角 Y |
| `rect.width` | `number` | ✅ | 矩形宽度 |
| `rect.height` | `number` | ✅ | 矩形高度 |

**返回值：** `boolean`（点是否在矩形内）

**实现示例：**

```typescript
export function pointInRect(
  px: number,
  py: number,
  rect: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}
```

**使用示例：**

```typescript
const rect = { x: 10, y: 20, width: 100, height: 40 };

console.log(pointInRect(50, 30, rect));  // true
console.log(pointInRect(200, 30, rect)); // false
```

---

### 六、命中测试 API

#### hitTestNodeTree

**递归遍历节点树，命中最顶层可视节点**

```typescript
function hitTestNodeTree(
  root: NativeCanvasNode | null,
  x: number,
  y: number
): NativeCanvasNode | null;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `root` | `NativeCanvasNode \| null` | ✅ | 根节点 |
| `x` | `number` | ✅ | 画布坐标 X |
| `y` | `number` | ✅ | 画布坐标 Y |

**返回值：** 命中的节点或 null

**实现示例：**

```typescript
export function hitTestNodeTree(
  root: NativeCanvasNode | null,
  x: number,
  y: number,
): NativeCanvasNode | null {
  if (!root) return null;

  // 倒序遍历（顶层节点优先命中）
  for (let i = root.children.length - 1; i >= 0; i--) {
    const child = root.children[i];
    const hitChild = hitTestNodeTree(child, x, y);
    if (hitChild) return hitChild;
  }

  // 当前节点命中检测
  if (pointInRect(x, y, root.layoutRect)) {
    return root;
  }

  return null;
}
```

**使用示例：**

```typescript
const rootNode = getRootCanvasNode();
const hitNode = hitTestNodeTree(rootNode, 75, 52.5);

if (hitNode) {
  console.log('命中节点:', hitNode.tag);
}
```

---

### 七、事件监听注册 API

#### registerAllMouseEvent

**注册全部鼠标事件监听**

```typescript
function registerAllMouseEvent(): void;
```

**实现示例：**

```typescript
export function registerAllMouseEvent() {
  // 鼠标点击
  listen("mouse_click", (res) => {
    const { node, event } = handleMousePointerEvent(res.payload);
    emitNodeVueEvent(node, "Click", event);
  });

  // 鼠标按下
  listen("mouse_down", (res) => {
    const { node, event } = handleMousePointerEvent(res.payload);
    emitNodeVueEvent(node, "Mousedown", event);
  });

  // 鼠标抬起
  listen("mouse_up", (res) => {
    const { node, event } = handleMousePointerEvent(res.payload);
    emitNodeVueEvent(node, "Mouseup", event);
  });

  // 鼠标移动
  listen("mouse_move", (res) => {
    const { node, event } = handleMousePointerEvent(res.payload);
    emitNodeVueEvent(node, "Mousemove", event);
  });
}
```

---

#### registerAllKeyboardEvent

**注册全部键盘事件监听**

```typescript
function registerAllKeyboardEvent(): void;
```

**实现示例：**

```typescript
export function registerAllKeyboardEvent() {
  listen("key_down", (res) => {
    const payload = res.payload as NativeKeyboardEvent;
    const rootNode = getRootCanvasNode();
    emitNodeVueEvent(rootNode, "Keydown", payload);
  });

  listen("key_up", (res) => {
    const payload = res.payload as NativeKeyboardEvent;
    const rootNode = getRootCanvasNode();
    emitNodeVueEvent(rootNode, "Keyup", payload);
  });
}
```

---

#### initWindowEventCapture

**初始化全局所有原生事件捕获**

```typescript
function initWindowEventCapture(): void;
```

**实现示例：**

```typescript
export function initWindowEventCapture() {
  registerAllMouseEvent();
  registerAllKeyboardEvent();
}
```

**使用示例：**

```typescript
// 应用启动时调用
initWindowEventCapture();
```

---

### 八、事件桥接初始化 API

#### initEventBridge

**初始化全局事件桥接**

```typescript
function initEventBridge(): void;
```

**实现示例：**

```typescript
let globalEventInited = false;

export function initEventBridge(): void {
  if (globalEventInited) return;
  globalEventInited = true;

  // 此处预留底层原生事件订阅入口
  // 由窗口层/绘制层触发 triggerNodeEvent 完成事件闭环
}
```

---

#### destroyEventBridge

**销毁全局事件桥接**

```typescript
function destroyEventBridge(): void;
```

**实现示例：**

```typescript
export function destroyEventBridge(): void {
  nodeEventMap.clear();
  globalEventInited = false;
}
```

---

#### clearNodeEvent

**销毁节点所有绑定事件**

```typescript
function clearNodeEvent(node: NativeCanvasNode): void;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `node` | `NativeCanvasNode` | ✅ | 目标画布节点 |

**实现示例：**

```typescript
export function clearNodeEvent(node: NativeCanvasNode): void {
  if (nodeEventMap.has(node)) {
    nodeEventMap.delete(node);
  }
}
```

---

### 九、焦点节点管理 API

#### setFocusNode

**设置当前焦点节点**

```typescript
function setFocusNode(node: NativeCanvasNode | null): void;
```

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `node` | `NativeCanvasNode \| null` | ✅ | 焦点节点 |

---

#### getFocusNode

**获取当前焦点节点**

```typescript
function getFocusNode(): NativeCanvasNode | null;
```

**返回值：** 当前焦点节点或 null

---

### 十、事件选项对象

#### eventBridgeOptions

**渲染器事件适配配置**

```typescript
const eventBridgeOptions: {
  patchEvent: typeof hostPatchEvent;
  initEventBridge: typeof initEventBridge;
  destroyEventBridge: typeof destroyEventBridge;
};
```

**实现示例：**

```typescript
export const eventBridgeOptions = {
  patchEvent: hostPatchEvent,
  initEventBridge: initEventBridge,
  destroyEventBridge: destroyEventBridge,
};
```

---

## 📊 事件类型对照表

### Tauri 原生事件 → Vue 组件事件

| Tauri 事件 | Vue 事件 | 事件数据类型 | 说明 |
|-----------|---------|-------------|------|
| `mouse_click` | `@click` | `NativeMouseEvent` | 鼠标点击 |
| `mouse_down` | `@mousedown` | `NativeMouseEvent` | 鼠标按下 |
| `mouse_up` | `@mouseup` | `NativeMouseEvent` | 鼠标抬起 |
| `mouse_move` | `@mousemove` | `NativeMouseEvent` | 鼠标移动 |
| `key_down` | `@keydown` | `NativeKeyboardEvent` | 键盘按下 |
| `key_up` | `@keyup` | `NativeKeyboardEvent` | 键盘抬起 |

---

## 🔄 完整事件流转示例

```
1. 用户点击鼠标
   ↓
2. Tauri 窗口捕获原生事件
   listen("mouse_click") → { x: 50, y: 35, button: 0 }
   ↓
3. 坐标矫正（DPR = 1.5）
   normalizePointerCoordinate(50, 35)
   → { x: 75, y: 52.5 }
   ↓
4. 创建标准化鼠标事件
   NativeMouseEvent {
     x: 75, y: 52.5,
     clientX: 75, clientY: 52.5,
     screenX: 50, screenY: 35,
     button: 0
   }
   ↓
5. 命中测试（递归遍历节点树）
   hitTestNodeTree(root, 75, 52.5)
   → 倒序遍历子节点
   → 找到 button 节点（layoutRect 包含该坐标）
   ↓
6. 触发 Vue 组件事件
   emitNodeVueEvent(buttonNode, "Click", mouseEvent)
   → 查找 buttonNode.vnode.props.onClick
   ↓
7. 执行组件方法
   handleClick(mouseEvent)
   → 输出: "Clicked at 75, 52.5"
```

---

## 📝 业务项目使用示例

### Vue 组件中使用

```vue
<template>
  <button @click="handleClick" @mousedown="handleMouseDown">
    点击我
  </button>
  
  <input 
    @keydown="handleKeydown"
    @keyup="handleKeyup"
  />
</template>

<script setup>
function handleClick(event) {
  console.log('Clicked at:', event.x, event.y);
}

function handleMouseDown(event) {
  console.log('Mouse button:', event.button);
}

function handleKeydown(event) {
  console.log('Key pressed:', event.key);
}
</script>
```

---

## 🎯 ts-native 编译要求

### 兼容性要求

1. **无 DOM 依赖**
   - 不使用 `addEventListener`
   - 不使用 `Event`、`MouseEvent`
   - 纯自定义事件对象

2. **无浏览器 API**
   - 不使用 `window`、`document`
   - 不使用 `window.addEventListener`
   - 通过 Tauri `listen()` API

3. **支持 AOT 编译**
   - 静态类型完整
   - 无动态事件绑定
   - 明确的函数签名

---

## 📚 源码参考

**vue-ts-native 实现：**
- `src/tauri-window/event-capture.ts` - 窗口事件捕获
- `src/render-adapter/event-bridge.ts` - 事件桥接
