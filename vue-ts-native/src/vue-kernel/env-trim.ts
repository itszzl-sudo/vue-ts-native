/**
 * @file vue-kernel/env-trim.ts
 * @desc 全局环境裁剪、无用环境分支剔除、平台能力禁用
 * @note 纯编译期/运行时环境固化逻辑，无 RuntimeCall 底层依赖
 * @ability 彻底屏蔽浏览器、Node、WebWorker 环境分支，裁剪DOM相关冗余逻辑
 */

/**
 * 固化所有平台环境变量
 * 强制统一为非浏览器、非Node、非Web运行环境
 */
export function trimVueRuntimeEnv() {
  // 覆盖Vue内核环境判断变量，永久禁用Web/Node环境分支
  (globalThis as any).__VUE_BROWSER__ = false;
  (globalThis as any).__VUE_NODE__ = false;
  (globalThis as any).__VUE_WEB_WORKER__ = false;

  // 清空DOM全局对象引用，杜绝隐式DOM调用
  delete (globalThis as any).window;
  delete (globalThis as any).document;
  delete (globalThis as any).navigator;
}

/**
 * 裁剪编译器冗余环境逻辑
 * 移除SFC编译、模板编译中所有浏览器环境兼容分支
 */
export function trimCompilerEnv() {
  // 禁用编译器资源路径浏览器解析、Asset Web资源处理逻辑
  (globalThis as any).__VUE_COMPILER_BROWSER_ENV__ = false;
}

/**
 * 裁剪平台专属指令能力
 * 移除HTML/DOM专属无效指令，适配纯画布渲染架构
 */
export function trimDomSpecificDirectives() {
  // 禁用DOM专属指令标识
  (globalThis as any).VUE_DISABLE_HTML_DIRECTIVES = true;
}

/**
 * 统一环境初始化入口
 * 项目启动前置执行，完成所有环境裁剪与固化
 */
export function setupPureNativeEnv() {
  trimVueRuntimeEnv();
  trimCompilerEnv();
  trimDomSpecificDirectives();
}

```

### 2\. 模板转换核心源码（内置编译能力）

#### template\-transform/sfc\-parser\.ts

```typescript
/**
 * @file template-transform/sfc-parser.ts
 * @desc 专属架构SFC单文件解析器、源码标准化预处理、区块拆分
 * @note 纯上层编译适配逻辑，无RuntimeCall、无DOM、无Web环境依赖
 * @ability 标准化.vue文件源码，清洗无效字符、拆分三大核心区块、输出结构化原始区块数据
 */
import { parseVueSFC } from '../vue-kernel/compiler-inject';
import type { SFCDescriptor, SFCBlock } from '@vue/compiler-sfc';

/**
 * 标准化SFC原始文件源码
 * 清除空白首尾、统一换行符、去除无用注释，保证编译一致性
 * @param source 原始.vue文件文本
 * @returns 标准化后源码字符串
 */
export function normalizeSfcSource(source: string): string {
  return source
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/^\s+|\s+$/g, '');
}

/**
 * SFC结构化解析结果类型
 */
export interface SFCParseResult {
  rawDescriptor: SFCDescriptor;
  template: SFCBlock | null;
  script: SFCBlock | null;
  styles: SFCBlock[];
  customBlocks: SFCBlock[];
  hasTemplate: boolean;
  hasScript: boolean;
  hasStyle: boolean;
}

/**
 * 解析.vue单文件，输出结构化、标准化区块数据
 * 架构专属统一解析入口，所有SFC编译流程必须走此方法
 * @param source 原始.vue文件源码
 * @returns 结构化解析结果
 */
export function parseSfcFile(source: string): SFCParseResult {
  // 源码预处理标准化
  const normalizedSource = normalizeSfcSource(source);

  // 内核SFC解析
  const descriptor = parseVueSFC(normalizedSource);

  // 提取核心区块
  const { template, script, styles, customBlocks } = descriptor;

  return {
    rawDescriptor: descriptor,
    template: template ?? null,
    script: script ?? null,
    styles,
    customBlocks,
    hasTemplate: !!template?.content,
    hasScript: !!script?.content,
    hasStyle: styles.length > 0
  };
}

/**
 * 获取纯文本区块内容，去除空白占位
 * @param block SFC区块对象
 * @returns 纯净区块文本
 */
export function getPureBlockContent(block: SFCBlock | null): string {
  if (!block || !block.content) return '';
  return block.content.trim().replace(/\n\s*\n/g, '\n');
}

```

#### template\-transform/to\-tsx\.ts

```typescript
/**
 * @file template-transform/to-tsx.ts
 * @desc Vue模板转标准TSX代码核心转换器
 * @note 无DOM、无Web、无RuntimeCall底层依赖，纯上层模板转译逻辑
 * @core 承接SFC解析结果，调用内核编译能力，输出可直接被Runtime-Core执行的TSX渲染代码
 * @ability 抹平模板语法差异、过滤DOM专属属性、适配原生画布渲染规范
 */
import { compileSfcTemplate } from '../vue-kernel/compiler-inject';
import type { SFCParseResult } from './sfc-parser';

/**
 * TSX转换结果结构
 */
export interface TsxTransformResult {
  // 最终可执行TSX渲染函数代码
  renderCode: string;
  // 是否存在有效模板内容
  hasTemplate: boolean;
  // 转换过程错误信息
  errors: string[];
}

/**
 * 过滤模板中DOM专属、浏览器专属无效属性
 * 适配纯原生画布渲染架构，剔除无用Web属性
 * @param rawTsxCode 编译器原始输出TSX代码
 * @returns 清洗后纯净TSX代码
 */
function cleanDomSpecificAttrs(rawTsxCode: string): string {
  if (!rawTsxCode) return '';

  const cleanCode = rawTsxCode
    // 移除浏览器DOM事件兼容修饰、DOM专属属性
    .replace(/\.(native|exact|passive|capture)/g, '')
    // 移除v-html、v-text等DOM专属指令编译产物
    .replace(/vHtml|vText/g, '')
    // 清空web平台专属属性节点
    .replace(/attrs\.((?:innerHTML|outerHTML|textContent|innerText))/g, '')
    // 剔除浏览器表单、DOM专属属性
    .replace(/(readOnly|disabled|checked|selected)\s*=/g, '');

  return cleanCode;
}

/**
 * 标准化TSX渲染函数
 * 修正编译器默认输出格式，适配原生渲染器调用规范
 * @param rawRenderCode 原始编译产出渲染代码
 * @returns 标准化渲染函数
 */
function normalizeRenderFunction(rawRenderCode: string): string {
  if (!rawRenderCode) return '';

  // 固定渲染函数名称为 render，统一框架调用入口
  let finalCode = rawRenderCode.replace(/function\s+.+?\s*\(/, 'function render(');

  // 剔除编译器自带web平台适配代码
  finalCode = finalCode.replace(/\n*const _ctx = .+?\n/, '\n');
  finalCode = finalCode.replace(/\n*_ctx\./g, '\n');

  return finalCode;
}

/**
 * 核心入口：SFC模板区块转TSX渲染代码
 * @param parseResult SFC结构化解析结果
 * @returns TSX转换结果
 */
export function transformTemplateToTsx(parseResult: SFCParseResult): TsxTransformResult {
  const { template, hasTemplate, rawDescriptor } = parseResult;

  // 无模板直接返回空
  if (!hasTemplate || !template) {
    return {
      renderCode: '',
      hasTemplate: false,
      errors: []
    };
  }

  // 内核编译模板产出原始TSX
  const compileRes = compileSfcTemplate(rawDescriptor);
  let { code: rawTsxCode, errors } = compileRes;

  // 清洗DOM专属语法、属性、指令产物
  let cleanCode = cleanDomSpecificAttrs(rawTsxCode);

  // 标准化渲染函数格式
  let renderCode = normalizeRenderFunction(cleanCode);

  return {
    renderCode,
    hasTemplate: true,
    errors
  };
}
