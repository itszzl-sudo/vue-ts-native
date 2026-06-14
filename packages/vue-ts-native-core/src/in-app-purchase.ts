/**
 * @file in-app-purchase.ts
 * @desc inAppPurchase 模块（对齐 Electron inAppPurchase - macOS）
 */

/**
 * inAppPurchase 模块（macOS 专属，Windows 返回空实现）
 */
class InAppPurchase {
  /**
   * 是否可以付款
   */
  canMakePayments(): boolean {
    console.log('[inAppPurchase] canMakePayments');
    return false;
  }

  /**
   * 购买产品
   */
  purchaseProduct(productId: string, quantity?: number): Promise<boolean> {
    console.log('[inAppPurchase] purchaseProduct:', productId);
    return Promise.resolve(false);
  }

  /**
   * 恢复已完成购买
   */
  restoreCompletedTransactions(): void {
    console.log('[inAppPurchase] restoreCompletedTransactions');
  }

  /**
   * 完成交易
   */
  finishTransactionByDate(date: string): void {
    console.log('[inAppPurchase] finishTransactionByDate:', date);
  }

  /**
   * 获取购买记录
   */
  getReceiptURL(): string {
    return '';
  }

  /**
   * 监听事件
   */
  on(event: string, listener: (...args: any[]) => void): void {
    console.log(`[inAppPurchase] on ${event}`);
  }
}

export const inAppPurchase = new InAppPurchase();
