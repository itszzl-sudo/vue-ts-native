import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 确保截图目录存在
await mkdir(join(__dirname, 'screenshots'), { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox']
});

const page = await browser.newPage();

// 捕获控制台日志
page.on('console', msg => {
  const type = msg.type();
  const text = msg.text();
  if (text.startsWith('[PAGE]')) {
    console.log(text.replace('[PAGE] ', ''));
  }
});

// 捕获页面错误
page.on('pageerror', error => {
  console.log('❌ 页面错误:', error.message);
});

console.log('========================================');
console.log('开始测试 Yoga + Canvas2D');
console.log('========================================');
console.log('');

try {
  // Hook Canvas2D API
  await page.evaluateOnNewDocument(() => {
    const originalFillRect = CanvasRenderingContext2D.prototype.fillRect;
    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    const originalStrokeRect = CanvasRenderingContext2D.prototype.strokeRect;
    
    let renderCount = 0;
    let lastRenderTime = Date.now();
    
    CanvasRenderingContext2D.prototype.fillRect = function(...args) {
      renderCount++;
      lastRenderTime = Date.now();
      console.log(`[CANVAS] fillRect #${renderCount} (${args.join(', ')})`);
      return originalFillRect.apply(this, args);
    };
    
    CanvasRenderingContext2D.prototype.fillText = function(...args) {
      renderCount++;
      lastRenderTime = Date.now();
      console.log(`[CANVAS] fillText #${renderCount} (${args[0]})`);
      return originalFillText.apply(this, args);
    };
    
    CanvasRenderingContext2D.prototype.strokeRect = function(...args) {
      renderCount++;
      lastRenderTime = Date.now();
      console.log(`[CANVAS] strokeRect #${renderCount}`);
      return originalStrokeRect.apply(this, args);
    };
    
    // 暴露渲染统计
    window.__canvasStats = {
      getRenderCount: () => renderCount,
      getLastRenderTime: () => lastRenderTime,
      reset: () => { renderCount = 0; }
    };
  });

  let testRound = 0;
  const MAX_ROUNDS = 12; // 12个测试场景
  
  // 测试场景列表
  const scenarios = [
    { name: '基础 Column 布局', param: 'scenario=column' },
    { name: '嵌套 Row 布局', param: 'scenario=row' },
    { name: '绝对定位测试', param: 'scenario=absolute' },
    { name: '百分比 + flex 混合', param: 'scenario=percent' },
    { name: 'flex-wrap + align', param: 'scenario=wrap' },
    { name: 'align + justify', param: 'scenario=align' },
    { name: 'border + margin', param: 'scenario=border' },
    { name: '多层嵌套混合', param: 'scenario=nested' },
    { name: '装饰属性', param: 'scenario=decor' },
    { name: '字体/文本', param: 'scenario=text' },
    { name: 'measureFunc 文本尺寸', param: 'scenario=measure' },
    { name: '文本换行', param: 'scenario=wrap-text' }
  ];
  
  while (testRound < MAX_ROUNDS) {
    const scenario = scenarios[testRound];
    testRound++;
    console.log(`\n=== 第 ${testRound} 轮测试: ${scenario.name} ===`);
    
    await page.goto(`http://localhost:3000/test-simple.html?${scenario.param}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // 等待渲染完成（Canvas API 调用停止 500ms）
    await page.waitForFunction(() => {
      const stats = window.__canvasStats;
      if (!stats) return false;
      
      const count = stats.getRenderCount();
      const lastTime = stats.getLastRenderTime();
      
      // 至少有一次渲染，且 500ms 内没有新调用
      return count > 0 && (Date.now() - lastTime > 500);
    }, { timeout: 10000 }).catch(() => {
      console.log('⚠️  渲染超时');
    });

    // 截图保存（只截 Canvas，加时间戳）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = join(__dirname, 'screenshots', `test-round-${testRound}-${timestamp}.png`);
    const canvasElement = await page.$('canvas');
    if (canvasElement) {
      await canvasElement.screenshot({ path: screenshotPath });
      console.log(`📸 Canvas 截图已保存: ${screenshotPath}`);
    } else {
      await page.screenshot({ path: screenshotPath });
      console.log(`📸 页面截图已保存: ${screenshotPath} (未找到 Canvas)`);
    }

    // 获取布局结果
    const layoutResult = await page.evaluate(() => {
      const terminal = document.getElementById('terminal');
      if (!terminal) return null;
      
      const text = terminal.innerText;
      const layoutSection = text.split('=== 布局结果 ===')[1];
      if (!layoutSection) return null;
      
      return layoutSection.split('=== Canvas')[0].trim();
    });

    // 获取 Canvas 像素数据（检查是否有内容）
    const canvasStats = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // 统计非空像素
      let nonEmptyPixels = 0;
      let colorPixels = 0;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a > 0) {
          nonEmptyPixels++;
          // 检测是否有颜色（不是纯灰）
          if (r !== g || g !== b) {
            colorPixels++;
          }
        }
      }
      
      return {
        totalPixels: canvas.width * canvas.height,
        nonEmptyPixels,
        colorPixels,
        width: canvas.width,
        height: canvas.height
      };
    });

    // 获取渲染统计
    const stats = await page.evaluate(() => {
      return {
        renderCount: window.__canvasStats?.getRenderCount() || 0,
        terminalLines: document.getElementById('terminal')?.innerText?.split('\n').length || 0
      };
    });

    console.log(`✅ 渲染完成: ${stats.renderCount} 次 Canvas 调用, ${stats.terminalLines} 行日志`);
    
    // 验证 Canvas 内容
    if (canvasStats) {
      console.log(`📊 Canvas 统计:`);
      console.log(`   - 尺寸: ${canvasStats.width}×${canvasStats.height}`);
      console.log(`   - 非空像素: ${canvasStats.nonEmptyPixels} (${((canvasStats.nonEmptyPixels / canvasStats.totalPixels) * 100).toFixed(1)}%)`);
      console.log(`   - 彩色像素: ${canvasStats.colorPixels}`);
      
      if (canvasStats.nonEmptyPixels === 0) {
        console.log('❌ Canvas 为空，渲染可能失败');
      } else if (canvasStats.colorPixels === 0) {
        console.log('⚠️  无彩色像素，可能只有边框');
      }
    }

    // 判断是否成功
    const terminalContent = await page.evaluate(() => {
      return document.getElementById('terminal')?.innerText || '';
    });

    if (terminalContent.includes('✅ Canvas 渲染完成')) {
      console.log('✅ 测试通过');
    } else if (terminalContent.includes('❌')) {
      console.log('❌ 测试失败');
      console.log(terminalContent.split('\n').filter(l => l.includes('❌')).join('\n'));
    }

    // 等待 3 秒后下一轮
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log(`\n=== 测试完成（${MAX_ROUNDS} 轮）===`);
} catch (error) {
  console.error('❌ 测试失败:', error.message);
} finally {
  await browser.close();
}
