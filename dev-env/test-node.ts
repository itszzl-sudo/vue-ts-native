/**
 * 服务端测试脚本 - 不依赖浏览器
 * 直接在 Node.js 终端运行，打印 Yoga 布局结果
 */

import initYoga from 'yoga-wasm-web';

async function test() {
  console.log('========================================');
  console.log('开始测试 Yoga 布局引擎');
  console.log('========================================\n');

  try {
    // 加载 Yoga
    console.log('[1/3] 加载 Yoga WASM...');
    const yoga = await initYoga();
    console.log('[1/3] ✅ Yoga 加载成功\n');

    // 创建布局树
    console.log('[2/3] 创建布局树...');
    const root = yoga.Node.create();
    root.setWidth(760);
    root.setHeight(560);
    root.setFlexDirection(yoga.FLEX_DIRECTION_COLUMN);
    root.setPadding(yoga.EDGE_ALL, 20);
    root.setGap(yoga.GUTTER_ALL, 10);

    const child1 = yoga.Node.create();
    child1.setWidth(720);
    child1.setHeight(100);
    child1.setBackgroundColor('#1e88e5');
    child1.setBorderRadius(12);
    root.insert(child1, 0);

    const child2 = yoga.Node.create();
    child2.setFlexDirection(yoga.FLEX_DIRECTION_ROW);
    child2.setGap(yoga.GUTTER_ALL, 10);

    const child2_1 = yoga.Node.create();
    child2_1.setFlex(1);
    child2_1.setHeight(150);
    child2_1.setBackgroundColor('#43a047');
    child2.insert(child2_1, 0);

    const child2_2 = yoga.Node.create();
    child2_2.setFlex(2);
    child2_2.setHeight(150);
    child2_2.setBackgroundColor('#e53935');
    child2_2.setBorderRadius(20);
    child2.insert(child2_2, 1);

    root.insert(child2, 1);
    console.log('[2/3] ✅ 布局树创建成功\n');

    // 计算布局
    console.log('[3/3] 计算布局...');
    root.calculateLayout(760, 560, yoga.DIRECTION_LTR);
    console.log('[3/3] ✅ 布局计算完成\n');

    // 打印结果
    console.log('=== 布局结果 ===');
    printLayoutTree(root, 'root', 0);

    console.log('\n=== 测试完成 ===');
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

function printLayoutTree(yogaNode, name, depth) {
  const layout = yogaNode.getComputedLayout();
  const indent = '  '.repeat(depth);
  const bgColor = yogaNode.backgroundColor || 'none';
  const radius = yogaNode.borderRadius || 0;
  
  console.log(`${indent}${name}`);
  console.log(`${indent}  尺寸: ${Math.round(layout.width)} × ${Math.round(layout.height)}`);
  console.log(`${indent}  位置: (${Math.round(layout.left)}, ${Math.round(layout.top)})`);
  console.log(`${indent}  背景: ${bgColor}, 圆角: ${radius}`);
  
  const childCount = yogaNode.getChildCount();
  if (childCount > 0) {
    console.log(`${indent}  子节点: ${childCount} 个`);
    for (let i = 0; i < childCount; i++) {
      const child = yogaNode.getChild(i);
      printLayoutTree(child, `child[${i}]`, depth + 1);
    }
  }
}

test();
