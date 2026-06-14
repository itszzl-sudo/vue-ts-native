/**
 * @file render-skia/draw-core.ts
 * @desc Skia 核心绘制引擎
 * @core 承接 Yoga 布局坐标 + 样式层参数，完成原生2D画布绘制
 * @ability 矩形、圆角、文本、纯色背景、边框、透明度合成
 * @match 完全适配 NativeCanvasNode 结构，对接渲染适配器
 * @note 零DOM、零浏览器Canvas API，纯原生Skia绘制逻辑
 */

import type { NativeCanvasNode } from "../render-adapter/index";
import type { NativeStyleObject } from "../template-transform/style-convert";

// 原生Skia画布实例类型（Tauri Skia绑定标准类型）
export interface SkiaCanvas {
  width: number;
  height: number;
  getContext(): SkiaRenderContext;
}

// Skia绘制上下文类型
export interface SkiaRenderContext {
  clearRect(x: number, y: number, w: number, h: number): void;
  fillStyle(color: string): void;
  strokeStyle(color: string): void;
  lineWidth(width: number): void;
  globalAlpha(alpha: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  font(fontStr: string): void;
  save(): void;
  restore(): void;
  beginPath(): void;
  roundRect(x: number, y: number, w: number, h: number, radius: number): void;
  fill(): void;
  stroke(): void;
}

/**
 * 颜色默认值兜底
 */
const DEFAULT_COLOR = "#000000";
const DEFAULT_BG_COLOR = "#ffffff";

/**
 * 统一解析尺寸数值（兼容数字/字符串带单位）
 */
export function parseSizeVal(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return val;
  return parseFloat(val) || 0;
}

/**
 * 解析字体配置，输出Skia标准font字符串
 */
function parseFontStyle(style: NativeStyleObject): string {
  const size = parseSizeVal(style.fontSize) || 14;
  const family = style.fontFamily || "sans-serif";
  const weight = style.fontWeight || "normal";
  return `${weight} ${size}px ${family}`;
}

/**
 * 清空整个画布
 */
export function skiaClearCanvas(canvas: SkiaCanvas): void {
  const ctx = canvas.getContext();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * 核心绘制单节点入口
 * 根据节点类型分发不同绘制逻辑
 */
export function skiaDrawNode(canvas: SkiaCanvas, node: NativeCanvasNode): void {
  const ctx = canvas.getContext();
  const { x, y, width, height } = node.layoutRect;
  const { style, type, textContent } = node;

  // 无尺寸节点不绘制
  if (width <= 0 || height <= 0) return;

  ctx.save();

  // 全局透明度
  if (style.opacity !== undefined) {
    ctx.globalAlpha(Math.max(0, Math.min(1, style.opacity)));
  }

  // 分发绘制类型
  switch (type) {
    case "text":
      drawTextNode(ctx, node, x, y);
      break;
    case "container":
    default:
      drawContainerNode(ctx, node, x, y, width, height);
      break;
  }

  ctx.restore();
}

/**
 * 绘制容器节点（背景、圆角、边框）
 */
function drawContainerNode(
  ctx: SkiaRenderContext,
  node: NativeCanvasNode,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const { style } = node;
  const radius = parseSizeVal(style.borderRadius);

  // 绘制圆角背景
  if (style.backgroundColor) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle(style.backgroundColor || DEFAULT_BG_COLOR);
    ctx.fill();
  }

  // 绘制边框
  const borderWidth = parseSizeVal(style.borderWidth);
  if (borderWidth > 0) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.strokeStyle(style.borderColor || DEFAULT_COLOR);
    ctx.lineWidth(borderWidth);
    ctx.stroke();
  }
}

/**
 * 绘制文本节点
 */
function drawTextNode(
  ctx: SkiaRenderContext,
  node: NativeCanvasNode,
  x: number,
  y: number,
): void {
  const { style, textContent } = node;
  if (!textContent) return;

  // 字体样式
  ctx.font(parseFontStyle(style));
  ctx.fillStyle(style.color || DEFAULT_COLOR);

  // 文本绘制原点偏移，居中对齐
  const fontSize = parseSizeVal(style.fontSize) || 14;
  ctx.fillText(textContent, x, y + fontSize);
}
