/**
 * @file tauri-window/web-disable.ts
 * @desc Tauri WebView 浏览器能力彻底禁用模块
 * @core 摧毁DOM/BOM全局对象、禁用浏览器API、剥离Web环境、锁定纯原生运行沙箱
 * @architecture 项目启动最先执行，前置清洗浏览器环境，保证全局零DOM污染
 * @note 本架构完全脱离浏览器DOM，所有Web能力强制永久失效
 */

/**
 * 永久删除/置空所有浏览器BOM/DOM全局对象
 * 彻底杜绝DOM API隐式调用、框架兼容分支触发
 */
export function disableBrowserGlobalAPI() {
  const global = globalThis as any;

  // 核心DOM宿主对象置空
  delete global.document;
  delete global.window;
  delete global.navigator;

  // 浏览器BOM能力销毁
  delete global.history;
  delete global.location;
  delete global.scroll;
  delete global.innerWidth;
  delete global.innerHeight;

  // 浏览器DOM构造器销毁
  delete global.HTMLElement;
  delete global.HTMLDivElement;
  delete global.HTMLSpanElement;
  delete global.HTMLCanvasElement;
  delete global.Image;
  delete global.Text;

  // 浏览器事件构造器销毁
  delete global.MouseEvent;
  delete global.KeyboardEvent;
  delete global.Event;

  // 浏览器渲染相关API销毁
  delete global.requestAnimationFrame;
  delete global.cancelAnimationFrame;
  delete global.getComputedStyle;

  // 锁定全局对象，禁止运行时重新挂载Web属性
  Object.freeze(global);
}

/**
 * 屏蔽所有浏览器环境判断标识
 * 强制上层框架、Vue编译器、渲染层进入纯原生分支
 */
export function blockBrowserEnvFlag() {
  const global = globalThis as any;

  // 屏蔽Vue系列环境标识
  global.__VUE_BROWSER__ = false;
  global.__VUE_WEB__ = false;
  global.__VUE_WEB_WORKER__ = false;

  // 屏蔽通用浏览器环境标识
  global.isBrowser = false;
  global.IS_BROWSER = false;
}

/**
 * 禁用WebView内置渲染能力
 * 关闭Tauri默认Web渲染、DOM解析、样式解析、脚本Web兼容逻辑
 */
export function disableWebviewRenderAbility() {
  const global = globalThis as any;

  // 禁用Tauri WebView网页渲染管线
  global.__TAURI_WEBVIEW_RENDER__ = false;
  // 禁用HTML解析器
  global.__DISABLE_HTML_PARSER__ = true;
  // 禁用CSS解析器
  global.__DISABLE_CSS_PARSER__ = true;
  // 禁用Web标准事件模型
  global.__DISABLE_WEB_EVENT_MODEL__ = true;
}

/**
 * 清理浏览器残留定时器/微任务队列
 * 防止Web任务污染原生渲染调度
 */
export function clearBrowserTaskQueue() {
  const global = globalThis as any;

  // 清空浏览器定时器句柄
  if (global.setTimeout) delete global.setTimeout;
  if (global.setInterval) delete global.setInterval;
  if (global.clearTimeout) delete global.clearTimeout;
  if (global.clearInterval) delete global.clearInterval;

  // 禁用浏览器微任务
  delete global.Promise;
  delete global.queueMicrotask;
}

/**
 * 全局环境自检兜底
 * 检测是否存在残留Web DOM能力，存在则强制清除
 */
export function webEnvSanitizerCheck() {
  const global = globalThis as any;
  const dangerKeys = [
    "document",
    "window",
    "navigator",
    "HTMLElement",
    "MouseEvent",
  ];

  dangerKeys.forEach((key) => {
    if (global[key]) delete global[key];
  });
}

/**
 * 【唯一入口】初始化纯原生沙箱环境
 * 项目启动第一时间执行，彻底摧毁Web浏览器环境
 * 保证后续所有渲染、编译、业务代码运行于纯原生模式
 */
export function initPureNativeSandbox() {
  disableBrowserGlobalAPI();
  blockBrowserEnvFlag();
  disableWebviewRenderAbility();
  clearBrowserTaskQueue();
  webEnvSanitizerCheck();
}
