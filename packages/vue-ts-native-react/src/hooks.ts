/**
 * @file hooks.ts
 * @desc React Hooks 调度系统
 * @core 实现 useState、useEffect、useRef、useMemo、useCallback
 */

type EffectCallback = () => void | (() => void);
type DependencyList = ReadonlyArray<any> | undefined;

/**
 * Hook 类型
 */
enum HookType {
  STATE,
  EFFECT,
  REF,
  MEMO,
  CALLBACK,
}

/**
 * Hook 实例
 */
interface HookInstance {
  type: HookType;
  value: any;
  deps?: DependencyList;
  cleanup?: (() => void) | null;
}

/**
 * 组件 Fiber 节点
 */
interface ComponentFiber {
  id: number;
  hooks: HookInstance[];
  hookIndex: number;
  isMounting: boolean;
}

/**
 * 当前正在执行的组件 Fiber
 */
let currentFiber: ComponentFiber | null = null;

/**
 * Fiber ID 计数器
 */
let fiberIdCounter = 0;

/**
 * Fiber 存储
 */
const fiberMap = new Map<number, ComponentFiber>();

/**
 * 创建 Fiber 节点
 */
function createFiber(): ComponentFiber {
  const id = ++fiberIdCounter;
  const fiber: ComponentFiber = {
    id,
    hooks: [],
    hookIndex: 0,
    isMounting: true,
  };
  fiberMap.set(id, fiber);
  return fiber;
}

/**
 * 获取或创建当前 Fiber
 */
function getCurrentFiber(): ComponentFiber {
  if (!currentFiber) {
    currentFiber = createFiber();
  }
  return currentFiber;
}

/**
 * 设置当前 Fiber 上下文
 */
export function setCurrentFiber(fiber: ComponentFiber | null): void {
  currentFiber = fiber;
}

/**
 * 获取 Fiber
 */
export function getFiber(id: number): ComponentFiber | undefined {
  return fiberMap.get(id);
}

/**
 * useState - 状态 Hook
 */
export function useState<S>(
  initialState: S | (() => S),
): [S, (newValue: S | ((prev: S) => S)) => void] {
  const fiber = getCurrentFiber();
  const index = fiber.hookIndex++;

  // Mount 阶段
  if (fiber.isMounting) {
    const stateValue =
      typeof initialState === "function"
        ? (initialState as () => S)()
        : initialState;

    const hook: HookInstance = {
      type: HookType.STATE,
      value: stateValue,
    };
    fiber.hooks[index] = hook;

    const setState = (newValue: S | ((prev: S) => S)) => {
      const currentValue = hook.value;
      const resolvedValue =
        typeof newValue === "function"
          ? (newValue as (prev: S) => S)(currentValue)
          : newValue;

      if (hook.value !== resolvedValue) {
        hook.value = resolvedValue;
        // 触发重新渲染
        scheduleUpdate(fiber.id);
      }
    };

    return [stateValue, setState];
  }

  // Update 阶段
  const hook = fiber.hooks[index];
  if (!hook) {
    throw new Error("useState: Hook index out of bounds");
  }

  const setState = (newValue: S | ((prev: S) => S)) => {
    const currentValue = hook.value;
    const resolvedValue =
      typeof newValue === "function"
        ? (newValue as (prev: S) => S)(currentValue)
        : newValue;

    if (hook.value !== resolvedValue) {
      hook.value = resolvedValue;
      scheduleUpdate(fiber.id);
    }
  };

  return [hook.value as S, setState];
}

/**
 * useEffect - 副作用 Hook
 */
export function useEffect(
  callback: EffectCallback,
  deps?: DependencyList,
): void {
  const fiber = getCurrentFiber();
  const index = fiber.hookIndex++;

  if (fiber.isMounting) {
    const hook: HookInstance = {
      type: HookType.EFFECT,
      value: callback,
      deps,
      cleanup: null,
    };
    fiber.hooks[index] = hook;

    // Mount 阶段执行 effect
    scheduleEffect(hook);
    return;
  }

  const hook = fiber.hooks[index];
  if (!hook) {
    throw new Error("useEffect: Hook index out of bounds");
  }

  // 检查依赖是否变化
  const depsChanged = hasDepsChanged(hook.deps, deps);
  if (depsChanged) {
    // 执行清理
    if (hook.cleanup) {
      hook.cleanup();
      hook.cleanup = null;
    }

    hook.value = callback;
    hook.deps = deps;

    // 调度 effect
    scheduleEffect(hook);
  }
}

/**
 * useRef - 引用 Hook
 */
export function useRef<T>(initialValue: T): { current: T } {
  const fiber = getCurrentFiber();
  const index = fiber.hookIndex++;

  if (fiber.isMounting) {
    const ref = { current: initialValue };
    const hook: HookInstance = {
      type: HookType.REF,
      value: ref,
    };
    fiber.hooks[index] = hook;
    return ref;
  }

  const hook = fiber.hooks[index];
  if (!hook) {
    throw new Error("useRef: Hook index out of bounds");
  }

  return hook.value as { current: T };
}

/**
 * useMemo - 记忆化值 Hook
 */
export function useMemo<T>(
  factory: () => T,
  deps: DependencyList,
): T {
  const fiber = getCurrentFiber();
  const index = fiber.hookIndex++;

  if (fiber.isMounting) {
    const value = factory();
    const hook: HookInstance = {
      type: HookType.MEMO,
      value,
      deps,
    };
    fiber.hooks[index] = hook;
    return value;
  }

  const hook = fiber.hooks[index];
  if (!hook) {
    throw new Error("useMemo: Hook index out of bounds");
  }

  const depsChanged = hasDepsChanged(hook.deps, deps);
  if (depsChanged) {
    hook.value = factory();
    hook.deps = deps;
  }

  return hook.value as T;
}

/**
 * useCallback - 记忆化回调 Hook
 */
export function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList,
): T {
  const fiber = getCurrentFiber();
  const index = fiber.hookIndex++;

  if (fiber.isMounting) {
    const hook: HookInstance = {
      type: HookType.CALLBACK,
      value: callback,
      deps,
    };
    fiber.hooks[index] = hook;
    return callback;
  }

  const hook = fiber.hooks[index];
  if (!hook) {
    throw new Error("useCallback: Hook index out of bounds");
  }

  const depsChanged = hasDepsChanged(hook.deps, deps);
  if (depsChanged) {
    hook.value = callback;
    hook.deps = deps;
  }

  return hook.value as T;
}

/**
 * 比较依赖数组是否变化
 */
function hasDepsChanged(
  oldDeps?: DependencyList,
  newDeps?: DependencyList,
): boolean {
  if (!oldDeps || !newDeps) return true;
  if (oldDeps.length !== newDeps.length) return true;

  for (let i = 0; i < oldDeps.length; i++) {
    if (oldDeps[i] !== newDeps[i]) return true;
  }

  return false;
}

/**
 * 调度 Effect 执行
 */
function scheduleEffect(hook: HookInstance): void {
  // 异步执行 effect（模拟 React 行为）
  Promise.resolve().then(() => {
    const cleanup = hook.value();
    if (typeof cleanup === "function") {
      hook.cleanup = cleanup;
    }
  });
}

/**
 * 更新调度器（简化版）
 */
const updateQueue = new Set<number>();
let updateScheduler: ((fiberId: number) => void) | null = null;

/**
 * 注册更新调度器
 */
export function registerUpdateScheduler(
  scheduler: (fiberId: number) => void,
): void {
  updateScheduler = scheduler;
}

/**
 * 调度组件更新
 */
function scheduleUpdate(fiberId: number): void {
  if (updateQueue.has(fiberId)) return;
  updateQueue.add(fiberId);

  if (updateScheduler) {
    updateScheduler(fiberId);
  }
}

/**
 * 重置 Fiber（更新前调用）
 */
export function resetFiberForUpdate(fiberId: number): void {
  const fiber = fiberMap.get(fiberId);
  if (fiber) {
    fiber.hookIndex = 0;
    fiber.isMounting = false;
    currentFiber = fiber;
  }
}

/**
 * 完成 Fiber 更新
 */
export function finishFiberUpdate(): void {
  if (currentFiber) {
    updateQueue.delete(currentFiber.id);
    currentFiber = null;
  }
}
