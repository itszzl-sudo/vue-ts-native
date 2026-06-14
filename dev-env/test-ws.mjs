import { WebSocket } from 'ws';

console.log('========================================');
console.log('开始测试 Yoga + Canvas2D (WebSocket 版)');
console.log('========================================');
console.log('');

// 连接 WebSocket 服务器
const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('[WS] 已连接到控制服务器');
  console.log('');
  
  // 打开控制页面（通过 Puppeteer）
  import('puppeteer').then(async ({ default: puppeteer }) => {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    
    const page = await browser.newPage();
    
    // 捕获页面错误
    page.on('pageerror', error => {
      console.log('❌ 页面错误:', error.message);
    });
    
    try {
      await page.goto('http://localhost:3000/test-simple.html', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      console.log('✅ 测试页面已加载');
      console.log('等待日志通过 WebSocket 传输...');
      console.log('');
      
      // 持续运行 60 秒
      await new Promise(resolve => setTimeout(resolve, 60000));
      
      console.log('');
      console.log('=== 测试完成（60秒监控结束）===');
    } catch (error) {
      console.error('❌ 测试失败:', error.message);
    } finally {
      await browser.close();
      ws.close();
    }
  });
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data);
    if (msg.type === 'log') {
      // 直接输出日志（带颜色标记）
      const prefix = msg.className?.includes('error') ? '❌' : 
                     msg.className?.includes('success') ? '✅' :
                     msg.className?.includes('warn') ? '⚠' : 'ℹ';
      console.log(prefix, msg.message);
    }
  } catch (error) {
    // 忽略解析错误
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket 错误:', error.message);
  console.log('请确保 ws-server.mjs 已启动');
});
