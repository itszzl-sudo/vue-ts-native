/**
 * vue-ts-native-core API 测试
 */
import {
  showWindow,
  showNotification,
  showMessageBox,
  clipboardWriteText,
  clipboardReadText,
} from 'vue-ts-native-core';

console.log('=== vue-ts-native-core API 测试 ===\n');

// 测试 1: 类型检查
console.log('测试 1: API 导入');
console.log('- showWindow:', typeof showWindow);
console.log('- showNotification:', typeof showNotification);
console.log('- showMessageBox:', typeof showMessageBox);
console.log('- clipboardWriteText:', typeof clipboardWriteText);
console.log('- clipboardReadText:', typeof clipboardReadText);
console.log('✅ API 导入成功\n');

// 测试 2: 调用 API（非 ts-native 环境会警告）
console.log('测试 2: 调用 API（预期警告）');
showWindow({
  title: '测试窗口',
  width: 800,
  height: 600,
});

showNotification({
  title: '测试通知',
  message: '这是一条测试通知',
});

clipboardWriteText('测试文本');
const text = clipboardReadText();
console.log('- 剪贴板读取:', text || '(空)');

console.log('\n✅ 测试完成');
