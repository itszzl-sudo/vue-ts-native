/**
 * React + vue-ts-native 完整示例
 */
import React, { useState, useEffect } from 'vue-ts-native-react';
import { showWindow, showNotification, clipboardWriteText, clipboardReadText } from 'vue-ts-native-core';

// React 组件示例
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('组件已挂载');
  }, []);

  return React.createElement('div', {
    style: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
    }
  }, [
    React.createElement('h1', { key: 'title' }, '计数器'),
    React.createElement('p', { key: 'count', style: { fontSize: '48px' } }, `计数: ${count}`),
    React.createElement('button', {
      key: 'btn',
      onClick: () => setCount(count + 1),
      style: {
        padding: '10px 20px',
        fontSize: '18px',
        cursor: 'pointer',
      }
    }, '点击+1'),
  ]);
}

function ClipboardDemo() {
  const [text, setText] = useState('');

  const handleCopy = () => {
    clipboardWriteText(text);
    showNotification({
      title: '提示',
      message: '已复制到剪贴板',
    });
  };

  const handlePaste = async () => {
    const clipboardText = clipboardReadText();
    setText(clipboardText);
  };

  return React.createElement('div', {
    style: { padding: '20px', marginTop: '20px' }
  }, [
    React.createElement('h2', { key: 'title' }, '剪贴板示例'),
    React.createElement('input', {
      key: 'input',
      type: 'text',
      value: text,
      onChange: (e: any) => setText(e.target.value),
      style: { padding: '8px', width: '300px', marginRight: '10px' },
    }),
    React.createElement('button', {
      key: 'copy',
      onClick: handleCopy,
      style: { padding: '8px 16px', marginRight: '10px' }
    }, '复制'),
    React.createElement('button', {
      key: 'paste',
      onClick: handlePaste,
      style: { padding: '8px 16px' }
    }, '粘贴'),
  ]);
}

// 主应用
function App() {
  return React.createElement('div', null, [
    React.createElement(Counter, { key: 'counter' }),
    React.createElement(ClipboardDemo, { key: 'clipboard' }),
  ]);
}

// 创建窗口
showWindow({
  title: 'vue-ts-native 示例',
  url: './index.html',
  width: 800,
  height: 600,
});

// 渲染应用（在 WebView2 的 DOM 中）
const root = document.getElementById('app');
if (root) {
  const vnode = App();
  // TODO: 将 VNode 挂载到 DOM
  // 这里可以直接使用 React DOM 或手动创建 DOM 元素
  root.innerHTML = '<h1>vue-ts-native 应用</h1><p>WebView2 环境</p>';
}
