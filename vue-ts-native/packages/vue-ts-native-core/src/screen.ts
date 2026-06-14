/**
 * @file screen.ts
 * @desc screen 模块（对齐 Electron screen）
 */

/**
 * 显示器信息
 */
export interface Display {
  id: number;
  rotation: number;
  scaleFactor: number;
  touchSupport: 'none' | 'available' | 'unknown';
  bounds: { x: number; y: number; width: number; height: number };
  size: { width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  workAreaSize: { width: number; height: number };
}

/**
 * screen 模块
 */
class Screen {
  /**
   * 获取所有显示器
   */
  getAllDisplays(): Display[] {
    console.log('[screen] getAllDisplays');
    // TODO: 对接 ts-native
    return [
      {
        id: 1,
        rotation: 0,
        scaleFactor: 1,
        touchSupport: 'none',
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        size: { width: 1920, height: 1080 },
        workArea: { x: 0, y: 0, width: 1920, height: 1040 },
        workAreaSize: { width: 1920, height: 1040 },
      }
    ];
  }

  /**
   * 获取主显示器
   */
  getPrimaryDisplay(): Display {
    return this.getAllDisplays()[0];
  }

  /**
   * 获取鼠标位置的显示器
   */
  getDisplayNearestPoint(point: { x: number; y: number }): Display {
    console.log('[screen] getDisplayNearestPoint:', point);
    return this.getPrimaryDisplay();
  }

  /**
   * 获取鼠标当前位置
   */
  getCursorScreenPoint(): { x: number; y: number } {
    console.log('[screen] getCursorScreenPoint');
    return { x: 0, y: 0 };
  }

  /**
   * 显示器变化事件
   */
  on(event: 'display-added' | 'display-removed' | 'display-metrics-changed', listener: () => void): void {
    console.log(`[screen] on ${event}`);
  }
}

export const screen = new Screen();
