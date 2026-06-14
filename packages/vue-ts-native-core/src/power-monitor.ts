/**
 * @file power-monitor.ts
 * @desc powerMonitor 模块（对齐 Electron powerMonitor）
 */

/**
 * powerMonitor 模块
 */
class PowerMonitor {
  /**
   * 是否处于电池供电
   */
  isOnBatteryPower(): boolean {
    console.log('[powerMonitor] isOnBatteryPower');
    return false;
  }

  /**
   * 获取系统空闲时间（秒）
   */
  getSystemIdleTime(): number {
    console.log('[powerMonitor] getSystemIdleTime');
    return 0;
  }

  /**
   * 获取系统空闲状态
   */
  getSystemIdleState(threshold: number): 'active' | 'idle' | 'locked' | 'unknown' {
    console.log('[powerMonitor] getSystemIdleState:', threshold);
    return 'active';
  }

  /**
   * 监听事件
   */
  on(event: 'suspend' | 'resume' | 'on-ac' | 'on-battery' | 'speed-limit-change', listener: () => void): void {
    console.log(`[powerMonitor] on ${event}`);
  }

  /**
   * 一次性监听
   */
  once(event: 'suspend' | 'resume' | 'on-ac' | 'on-battery' | 'speed-limit-change', listener: () => void): void {
    this.on(event, listener);
  }
}

export const powerMonitor = new PowerMonitor();
