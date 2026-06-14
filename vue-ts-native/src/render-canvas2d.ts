/**
 * @file render-canvas2d.ts
 * @desc Canvas 2D 渲染模块（开发验证用，脱离 Skia）
 * @note 用于快速验证布局、样式、字体效果，无需配置原生环境
 * @note 此文件仅在浏览器环境运行，不参与 ts-native AOT 编译
 */
// @ts-nocheck

import type { NativeCanvasNode } from "./render-adapter/node-operate";

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * 渲染统计信息
 */
export interface RenderStats {
  totalNodes: number;
  elementNodes: number;
  textNodes: number;
  renderTime: number;
  skippedNodes: number;
  errors: string[];
}

/**
 * Canvas 2D 渲染器
 */
export class Canvas2DRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private logLevel: LogLevel = LogLevel.DEBUG;
  private stats: RenderStats;
  private performanceMark: number;

  constructor(canvas: HTMLCanvasElement, options?: { logLevel?: LogLevel }) {
    this.canvas = canvas;
    this.dpr = window.devicePixelRatio || 1;
    this.ctx = canvas.getContext("2d")!;
    this.logLevel = options?.logLevel ?? LogLevel.DEBUG;
    this.stats = this.resetStats();
    
    // 设置高 DPI
    canvas.width = canvas.offsetWidth * this.dpr;
    canvas.height = canvas.offsetHeight * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    
    this.log(LogLevel.INFO, 'Canvas2DRenderer 初始化', {
      width: canvas.offsetWidth,
      height: canvas.offsetHeight,
      dpr: this.dpr
    });
  }

  /**
   * 重置统计信息
   */
  private resetStats(): RenderStats {
    return {
      totalNodes: 0,
      elementNodes: 0,
      textNodes: 0,
      renderTime: 0,
      skippedNodes: 0,
      errors: []
    };
  }

  /**
   * 日志输出
   */
  private log(level: LogLevel, message: string, data?: any) {
    if (level < this.logLevel) return;
    
    const prefix = `[Canvas2D ${LogLevel[level]}]`;
    const timestamp = new Date().toISOString().substr(11, 12);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`${timestamp} ${prefix}`, message, data || '');
        break;
      case LogLevel.INFO:
        console.info(`${timestamp} ${prefix}`, message, data || '');
        break;
      case LogLevel.WARN:
        console.warn(`${timestamp} ${prefix}`, message, data || '');
        break;
      case LogLevel.ERROR:
        console.error(`${timestamp} ${prefix}`, message, data || '');
        break;
    }
  }

  /**
   * 清空画布
   */
  clear(): void {
    const width = this.canvas.offsetWidth;
    const height = this.canvas.offsetHeight;
    this.ctx.clearRect(0, 0, width, height);
    
    // 绘制背景
    this.ctx.fillStyle = "#f5f5f5";
    this.ctx.fillRect(0, 0, width, height);
    
    this.log(LogLevel.DEBUG, '画布已清空', { width, height });
  }

  /**
   * 渲染节点树
   */
  render(rootNode: NativeCanvasNode): void {
    this.stats = this.resetStats();
    this.performanceMark = performance.now();
    
    this.log(LogLevel.INFO, '=== 开始渲染 ===', {
      rootNode: rootNode.tag,
      logLevel: LogLevel[this.logLevel]
    });
    
    this.clear();
    this.renderNode(rootNode, 0);
    
    const renderTime = performance.now() - this.performanceMark;
    this.stats.renderTime = renderTime;
    
    this.log(LogLevel.INFO, '=== 渲染完成 ===', this.getStats());
    
    // 绘制统计信息到画布
    this.drawStatsOverlay();
  }

  /**
   * 获取统计信息
   */
  getStats(): RenderStats {
    return { ...this.stats };
  }

  /**
   * 在画布上绘制统计信息
   */
  private drawStatsOverlay(): void {
    this.ctx.save();
    
    // 背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 280, 100);
    
    // 文字
    this.ctx.fillStyle = '#4fc3f7';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    const lines = [
      `节点总数: ${this.stats.totalNodes}`,
      `  元素: ${this.stats.elementNodes}`,
      `  文本: ${this.stats.textNodes}`,
      `跳过节点: ${this.stats.skippedNodes}`,
      `渲染时间: ${this.stats.renderTime.toFixed(2)}ms`,
      `错误数: ${this.stats.errors.length}`
    ];
    
    lines.forEach((line, i) => {
      this.ctx.fillText(line, 20, 20 + i * 16);
    });
    
    this.ctx.restore();
  }

  /**
   * 递归渲染节点
   */
  private renderNode(node: NativeCanvasNode, depth: number): void {
    this.stats.totalNodes++;
    
    if (node.nodeType === "element") {
      this.stats.elementNodes++;
      this.log(LogLevel.DEBUG, `[${'  '.repeat(depth)}] 渲染元素 <${node.tag}>`, {
        rect: node.layoutRect,
        style: node.style
      });
      this.renderElement(node);
      // 递归渲染子节点
      node.children.forEach(child => this.renderNode(child, depth + 1));
    } else if (node.nodeType === "text") {
      this.stats.textNodes++;
      this.log(LogLevel.DEBUG, `[${'  '.repeat(depth)}] 渲染文本 "${node.textContent}"`);
      this.renderText(node);
    }
  }

  /**
   * 渲染元素节点
   */
  private renderElement(node: NativeCanvasNode): void {
    const { x, y, width, height } = node.layoutRect;
    
    // 跳过不可见节点
    if (width === 0 || height === 0) {
      this.stats.skippedNodes++;
      this.log(LogLevel.WARN, `跳过不可见节点 <${node.tag}>`, { rect: node.layoutRect });
      return;
    }

    try {
      this.ctx.save();

      // 1. 绘制背景色
      const backgroundColor = node.style.backgroundColor || node.style.background;
      if (backgroundColor) {
        this.ctx.fillStyle = this.parseColor(String(backgroundColor));
        this.ctx.fillRect(x, y, width, height);
      }

      // 2. 绘制边框
      const borderWidth = Number(node.style.borderWidth) || 0;
      const borderColor = node.style.borderColor as string;
      if (borderWidth > 0 && borderColor) {
        this.ctx.strokeStyle = this.parseColor(borderColor);
        this.ctx.lineWidth = borderWidth;
        
        const borderRadius = Number(node.style.borderRadius) || 0;
        if (borderRadius > 0) {
          this.drawRoundRect(x, y, width, height, borderRadius);
          this.ctx.stroke();
        } else {
          this.ctx.strokeRect(x, y, width, height);
        }
      }

      // 3. 绘制圆角背景（如果有圆角）
      const borderRadius = Number(node.style.borderRadius) || 0;
      if (borderRadius > 0 && backgroundColor) {
        this.ctx.fillStyle = this.parseColor(String(backgroundColor));
        this.drawRoundRect(x, y, width, height, borderRadius);
        this.ctx.fill();
      }

      // 4. 绘制调试边框（开发模式）
      if (node.extend.debug) {
        this.ctx.strokeStyle = "#00ff00";
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.setLineDash([]);
      }

      this.ctx.restore();
    } catch (error) {
      const errorMsg = `渲染元素 <${node.tag}> 失败: ${error}`;
      this.stats.errors.push(errorMsg);
      this.log(LogLevel.ERROR, errorMsg, { node, error });
    }
  }

  /**
   * 渲染文本节点
   */
  private renderText(node: NativeCanvasNode): void {
    if (!node.textContent || !node.parent) {
      this.log(LogLevel.WARN, '跳过空文本节点');
      return;
    }

    const { x, y, width, height } = node.parent.layoutRect;
    const style = node.parent.style;

    try {
      this.ctx.save();

      // 设置字体
      const fontSize = Number(style.fontSize) || 14;
      const fontFamily = style.fontFamily || "system-ui, sans-serif";
      const fontWeight = style.fontWeight || "normal";
      this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

      // 设置颜色
      const color = style.color || "#000000";
      this.ctx.fillStyle = this.parseColor(String(color));

      // 文本对齐
      const textAlign = style.textAlign as CanvasTextAlign || "left";
      this.ctx.textAlign = textAlign;

      // 文本基线
      this.ctx.textBaseline = "top";

      // 绘制文本
      let textX = x;
      if (textAlign === "center") {
        textX = x + width / 2;
      } else if (textAlign === "right") {
        textX = x + width;
      }

      this.ctx.fillText(node.textContent, textX, y + 4, width);

      // 调试：绘制文本边界
      if (node.parent.extend.debug) {
        this.ctx.strokeStyle = "#ff00ff";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
      }

      this.ctx.restore();
    } catch (error) {
      const errorMsg = `渲染文本失败: ${error}`;
      this.stats.errors.push(errorMsg);
      this.log(LogLevel.ERROR, errorMsg, { textContent: node.textContent, error });
    }
  }

  /**
   * 绘制圆角矩形
   */
  private drawRoundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    const r = Math.min(radius, width / 2, height / 2);
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + width - r, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    this.ctx.lineTo(x + width, y + height - r);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    this.ctx.lineTo(x + r, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  /**
   * 解析颜色值
   */
  private parseColor(color: string): string {
    // 支持 hex、rgb、rgba、颜色名
    return color;
  }

  /**
   * 渲染布局调试信息
   */
  renderDebugInfo(rootNode: NativeCanvasNode): void {
    this.renderNodeDebug(rootNode);
  }

  private renderNodeDebug(node: NativeCanvasNode): void {
    if (node.nodeType === "element") {
      const { x, y, width, height } = node.layoutRect;
      
      if (width > 0 && height > 0) {
        this.ctx.save();
        
        // 绘制尺寸标签
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        this.ctx.fillRect(x, y - 16, 80, 16);
        
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "10px monospace";
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(
          `${Math.round(width)}×${Math.round(height)}`,
          x + 4,
          y - 8
        );
        
        this.ctx.restore();
      }

      node.children.forEach(child => this.renderNodeDebug(child));
    }
  }
}
