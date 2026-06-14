import { WebSocket } from 'ws';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

console.log('========================================');
console.log('🔄 自主循环迭代开发系统');
console.log('========================================');
console.log('');

// 测试场景配置
const testScenarios = [
  {
    name: '基础 Column 布局',
    root: { width: 760, height: 560, flexDirection: 'COLUMN', padding: 20, gap: 10 },
    children: [
      { width: 720, height: 100 },
      { flexDirection: 'ROW', gap: 10, children: [
        { flex: 1, height: 150 },
        { flex: 2, height: 150 }
      ]},
      { flexDirection: 'COLUMN', flex: 1, gap: 5, children: [
        { height: 50, widthPercent: 100 },
        { flex: 1 }
      ]}
    ]
  },
  {
    name: '嵌套 Row 布局',
    root: { width: 800, height: 600, flexDirection: 'ROW', padding: 30, gap: 15 },
    children: [
      { flex: 1, flexDirection: 'COLUMN', gap: 10, children: [
        { height: 200 },
        { flex: 1 }
      ]},
      { flex: 2, flexDirection: 'COLUMN', gap: 20, children: [
        { height: 100 },
        { height: 150 },
        { flex: 1 }
      ]}
    ]
  },
  {
    name: '绝对定位测试',
    root: { width: 600, height: 400, padding: 0 },
    children: [
      { width: 200, height: 200, position: 'absolute', left: 50, top: 50 },
      { width: 150, height: 150, position: 'absolute', right: 30, bottom: 30 }
    ]
  },
  {
    name: '百分比 + flex 混合',
    root: { width: 1000, height: 800, flexDirection: 'COLUMN' },
    children: [
      { widthPercent: 50, height: 200 },
      { widthPercent: 75, height: 300 },
      { flex: 1, flexDirection: 'ROW', children: [
        { flex: 1 },
        { flex: 1 },
        { flex: 1 }
      ]}
    ]
  }
];

let currentScenario = 0;
let iterationCount = 0;
const results = [];

// 连接 WebSocket
const ws = new WebSocket('ws://localhost:3001');

ws.on('open', async () => {
  console.log('[WS] 已连接到控制服务器');
  console.log('');
  console.log('📋 测试场景数:', testScenarios.length);
  console.log('🔄 开始自主迭代...');
  console.log('');
  
  // 开始迭代循环
  startIteration();
});

ws.on('message', async (data) => {
  try {
    const msg = JSON.parse(data);
    if (msg.type === 'log' && msg.message.includes('=== 测试完成 ===')) {
      // 测试完成，准备下一次迭代
      setTimeout(() => {
        nextIteration();
      }, 1000);
    }
  } catch (error) {
    // 忽略
  }
});

async function startIteration() {
  const scenario = testScenarios[currentScenario];
  iterationCount++;
  
  console.log(`========================================`);
  console.log(`📝 迭代 #${iterationCount} - ${scenario.name}`);
  console.log(`========================================`);
  console.log('');
  
  // 生成测试代码
  const testCode = generateTestCode(scenario);
  
  // 更新 test-simple.html
  await updateTestFile(testCode);
  
  console.log('✅ 测试文件已更新');
  console.log('等待测试执行...');
  console.log('');
}

function nextIteration() {
  currentScenario = (currentScenario + 1) % testScenarios.length;
  
  // 记录结果
  results.push({
    iteration: iterationCount,
    scenario: testScenarios[currentScenario].name,
    timestamp: new Date().toISOString()
  });
  
  console.log('');
  console.log(`✅ 迭代 #${iterationCount} 完成`);
  console.log(`📊 已完成: ${results.length} 次`);
  console.log('');
  
  // 继续下一次
  startIteration();
}

function generateTestCode(scenario) {
  // 生成 Yoga 布局代码
  let code = `
        // 测试场景: ${scenario.name}
        const root = yoga.Node.create();
        root.setWidth(${scenario.root.width});
        root.setHeight(${scenario.root.height});
        root.setFlexDirection(yoga.FLEX_DIRECTION_${scenario.root.flexDirection || 'COLUMN'});
  `;
  
  if (scenario.root.padding) {
    code += `        root.setPadding(yoga.EDGE_ALL, ${scenario.root.padding});\n`;
  }
  if (scenario.root.gap) {
    code += `        root.setGap(yoga.GUTTER_ALL, ${scenario.root.gap});\n`;
  }
  
  code += `        log('  - 场景: ${scenario.name}', 'log-tree');\n`;
  
  // 递归生成子节点
  code += generateChildrenCode('root', scenario.children, 1);
  
  return code;
}

function generateChildrenCode(parentName, children, depth) {
  let code = '';
  
  children.forEach((child, index) => {
    const childName = `${parentName}_child${index}`;
    const indent = '  '.repeat(depth + 1);
    
    code += `\n${indent}const ${childName} = yoga.Node.create();\n`;
    
    if (child.width) code += `${indent}${childName}.setWidth(${child.width});\n`;
    if (child.height) code += `${indent}${childName}.setHeight(${child.height});\n`;
    if (child.widthPercent) code += `${indent}${childName}.setWidthPercent(${child.widthPercent});\n`;
    if (child.heightPercent) code += `${indent}${childName}.setHeightPercent(${child.heightPercent});\n`;
    if (child.flex !== undefined) code += `${indent}${childName}.setFlex(${child.flex});\n`;
    if (child.flexDirection) code += `${indent}${childName}.setFlexDirection(yoga.FLEX_DIRECTION_${child.flexDirection});\n`;
    if (child.gap) code += `${indent}${childName}.setGap(yoga.GUTTER_ALL, ${child.gap});\n`;
    if (child.position) code += `${indent}${childName}.setPositionType(yoga.POSITION_TYPE_${child.position.toUpperCase()});\n`;
    if (child.left !== undefined) code += `${indent}${childName}.setPosition(yoga.EDGE_LEFT, ${child.left});\n`;
    if (child.right !== undefined) code += `${indent}${childName}.setPosition(yoga.EDGE_RIGHT, ${child.right});\n`;
    if (child.top !== undefined) code += `${indent}${childName}.setPosition(yoga.EDGE_TOP, ${child.top});\n`;
    if (child.bottom !== undefined) code += `${indent}${childName}.setPosition(yoga.EDGE_BOTTOM, ${child.bottom});\n`;
    
    code += `${indent}${parentName}.insertChild(${childName}, ${index});\n`;
    code += `${indent}log('    - ${childName}: ${describeNode(child)}', 'log-tree');\n`;
    
    // 递归子节点
    if (child.children) {
      code += generateChildrenCode(childName, child.children, depth + 1);
    }
  });
  
  return code;
}

function describeNode(node) {
  const parts = [];
  if (node.width) parts.push(`w=${node.width}`);
  if (node.height) parts.push(`h=${node.height}`);
  if (node.flex !== undefined) parts.push(`flex=${node.flex}`);
  if (node.flexDirection) parts.push(node.flexDirection);
  return parts.join(', ') || 'empty';
}

async function updateTestFile(testCode) {
  const filePath = join('test-simple.html');
  let content = await readFile(filePath, 'utf-8');
  
  // 找到布局树创建部分并替换
  const startMarker = "log('[2/4] 创建布局树...', 'log-info');";
  const endMarker = "log('[2/4] ✅ 布局树创建成功', 'log-success');";
  
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    console.error('❌ 未找到替换标记');
    return;
  }
  
  // 构建新的内容
  const before = content.substring(0, startIndex + startMarker.length);
  const after = content.substring(endIndex);
  
  const newContent = before + '\n' + testCode + '\n        ' + after;
  
  await writeFile(filePath, newContent);
}

ws.on('error', (error) => {
  console.error('❌ WebSocket 错误:', error.message);
  console.log('请确保 ws-server.mjs 已启动');
  process.exit(1);
});
