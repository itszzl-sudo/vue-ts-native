/**
 * @file template-transform/cache.ts
 * @desc SFC模板转换缓存管理器、避免重复解析编译、提升渲染加载性能
 * @note 无DOM、无Web、无RuntimeCall底层依赖，纯内存缓存上层逻辑
 * @ability 对已编译SFC组件做缓存命中、过期清理、增量刷新，减少重复CPU计算
 */
import type { SFCParseResult } from "./sfc-parser";
import type { TsxTransformResult } from "./to-tsx";

/**
 * 单组件缓存单元结构
 */
export interface TemplateCacheItem {
  // 组件唯一标识（文件路径/唯一key）
  key: string;
  // SFC结构化解析结果缓存
  parseResult: SFCParseResult;
  // TSX转换编译结果缓存
  tsxResult: TsxTransformResult;
  // 缓存创建时间戳
  createTime: number;
  // 最后访问时间戳
  lastAccessTime: number;
  // 是否为常驻缓存（不被自动清理）
  persistent: boolean;
}

/**
 * 模板转换全局缓存管理器
 * 单例全局生效，服务所有SFC编译转换流程
 */
class TemplateTransformCache {
  // 缓存存储Map
  private cacheMap: Map<string, TemplateCacheItem> = new Map();
  // 最大缓存数量阈值（超出自动淘汰冷门缓存）
  private readonly MAX_CACHE_SIZE = 50;
  // 缓存过期时长：5分钟（毫秒）
  private readonly EXPIRE_TIME = 5 * 60 * 1000;

  /**
   * 获取缓存数据
   * @param key 组件唯一标识
   * @returns 缓存单元｜undefined
   */
  get(key: string): TemplateCacheItem | undefined {
    const item = this.cacheMap.get(key);
    if (!item) return undefined;

    // 过期判定
    const now = Date.now();
    if (now - item.createTime > this.EXPIRE_TIME) {
      this.remove(key);
      return undefined;
    }

    // 更新最后访问时间
    item.lastAccessTime = now;
    return item;
  }

  /**
   * 写入/更新缓存
   * @param key 组件唯一标识
   * @param parseResult SFC解析结果
   * @param tsxResult TSX转换结果
   * @param persistent 是否常驻缓存
   */
  set(
    key: string,
    parseResult: SFCParseResult,
    tsxResult: TsxTransformResult,
    persistent = false,
  ): void {
    const now = Date.now();

    // 缓存容量超限，清理非常驻冷门缓存
    if (this.cacheMap.size >= this.MAX_CACHE_SIZE) {
      this.clearColdCache();
    }

    // 覆写/新增缓存
    this.cacheMap.set(key, {
      key,
      parseResult,
      tsxResult,
      createTime: now,
      lastAccessTime: now,
      persistent,
    });
  }

  /**
   * 删除指定缓存
   * @param key 组件唯一标识
   */
  remove(key: string): void {
    this.cacheMap.delete(key);
  }

  /**
   * 清空全部非常驻缓存
   */
  clear(): void {
    for (const [key, item] of this.cacheMap) {
      if (!item.persistent) {
        this.cacheMap.delete(key);
      }
    }
  }

  /**
   * 淘汰冷门缓存（最久未访问、非常驻）
   */
  private clearColdCache(): void {
    const coldKeys: string[] = [];

    // 筛选可淘汰的冷门缓存
    for (const [key, item] of this.cacheMap) {
      if (!item.persistent) {
        coldKeys.push(key);
      }
    }

    // 按最后访问时间升序排序，淘汰最久未使用
    coldKeys.sort((a, b) => {
      const itemA = this.cacheMap.get(a)!;
      const itemB = this.cacheMap.get(b)!;
      return itemA.lastAccessTime - itemB.lastAccessTime;
    });

    // 淘汰前1/3冷门缓存
    const removeCount = Math.max(1, Math.floor(coldKeys.length / 3));
    coldKeys.slice(0, removeCount).forEach((key) => this.cacheMap.delete(key));
  }

  /**
   * 获取当前缓存统计信息
   */
  getCacheStats() {
    return {
      total: this.cacheMap.size,
      maxSize: this.MAX_CACHE_SIZE,
    };
  }
}

// 全局单例导出
export const templateCache = new TemplateTransformCache();

/**
 * 快捷缓存命中工具方法
 * @param key 组件唯一标识
 * @returns 缓存命中状态与数据
 */
export function hitTemplateCache(key: string): TemplateCacheItem | undefined {
  return templateCache.get(key);
}

/**
 * 快捷缓存写入工具方法
 */
export function saveTemplateCache(
  key: string,
  parseResult: SFCParseResult,
  tsxResult: TsxTransformResult,
  persistent = false,
): void {
  templateCache.set(key, parseResult, tsxResult, persistent);
}
