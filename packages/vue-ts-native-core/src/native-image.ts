/**
 * @file native-image.ts
 * @desc nativeImage 模块（对齐 Electron nativeImage）
 */

/**
 * 图片创建选项
 */
export interface CreateImageOptions {
  width?: number;
  height?: number;
  scaleFactor?: number;
}

/**
 * NativeImage 类
 */
export class NativeImage {
  private data: any;
  private size: { width: number; height: number };

  constructor(data: any, size: { width: number; height: number }) {
    this.data = data;
    this.size = size;
  }

  /**
   * 是否为空
   */
  isEmpty(): boolean {
    return false;
  }

  /**
   * 获取尺寸
   */
  getSize(): { width: number; height: number } {
    return this.size;
  }

  /**
   * 设置模板图片
   */
  setTemplateImage(option: boolean): void {
    console.log('[NativeImage] setTemplateImage:', option);
  }

  /**
   * 是否为模板图片
   */
  isTemplateImage(): boolean {
    return false;
  }

  /**
   * 转换为 PNG Buffer
   */
  toPNG(): Buffer {
    console.log('[NativeImage] toPNG');
    return Buffer.from([]);
  }

  /**
   * 转换为 JPEG Buffer
   */
  toJPEG(quality: number): Buffer {
    console.log('[NativeImage] toJPEG:', quality);
    return Buffer.from([]);
  }

  /**
   * 转换为 Base64
   */
  toDataURL(): string {
    return '';
  }

  /**
   * 获取位图
   */
  getBitmap(): Buffer {
    console.log('[NativeImage] getBitmap');
    return Buffer.from([]);
  }

  /**
   * 获取原生句柄
   */
  getNativeHandle(): Buffer {
    return Buffer.from([]);
  }
}

/**
 * nativeImage 模块
 */
class NativeImageModule {
  /**
   * 从 Buffer 创建
   */
  createFromBuffer(buffer: Buffer, options?: CreateImageOptions): NativeImage {
    console.log('[nativeImage] createFromBuffer');
    return new NativeImage(buffer, { width: 0, height: 0 });
  }

  /**
   * 从 ArrayBuffer 创建
   */
  createFromArrayBuffer(buffer: ArrayBuffer, options?: CreateImageOptions): NativeImage {
    console.log('[nativeImage] createFromArrayBuffer');
    return new NativeImage(buffer, { width: 0, height: 0 });
  }

  /**
   * 从 Base64 创建
   */
  createFromDataURL(dataURL: string): NativeImage {
    console.log('[nativeImage] createFromDataURL');
    return new NativeImage(dataURL, { width: 0, height: 0 });
  }

  /**
   * 从路径创建
   */
  createFromPath(path: string): NativeImage {
    console.log('[nativeImage] createFromPath:', path);
    return new NativeImage('', { width: 0, height: 0 });
  }

  /**
   * 创建空图片
   */
  createEmpty(): NativeImage {
    return new NativeImage('', { width: 0, height: 0 });
  }
}

export const nativeImage = new NativeImageModule();
