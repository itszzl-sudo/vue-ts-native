import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';

const PORT = 3001;

// 创建 HTTP 服务器（提供控制页面）
const server = createServer((req, res) => {
  if (req.url === '/control') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(readFileSync(join(__dirname, 'control-panel.html')));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// 创建 WebSocket 服务器
const wss = new WebSocketServer({ server });

// 存储所有连接的客户端
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('[WS] 客户端已连接');
  clients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('[WS] 收到消息:', data);

      // 广播给所有客户端
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error('[WS] 解析消息失败:', error);
    }
  });

  ws.on('close', () => {
    console.log('[WS] 客户端已断开');
    clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`WebSocket 控制服务器已启动`);
  console.log(`========================================`);
  console.log(`控制页面: http://localhost:${PORT}/control`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  console.log('');
  console.log('等待测试页面连接...');
});

// 导出用于其他模块使用
export { wss, clients };
