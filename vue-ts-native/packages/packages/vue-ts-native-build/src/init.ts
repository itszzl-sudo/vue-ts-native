/**
 * @file init.ts
 * @desc 项目初始化
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

/**
 * 初始化项目
 */
export async function init(): Promise<void> {
  console.log('初始化 vue-ts-native 项目...\n');

  const cwd = process.cwd();

  // 创建目录
  const srcDir = resolve(cwd, 'src');
  if (!existsSync(srcDir)) {
    mkdirSync(srcDir, { recursive: true });
  }

  // 创建配置文件
  const configContent = `// vue-ts-native.config.ts
export default {
  // 应用配置
  app: {
    title: 'My App',
    width: 1024,
    height: 768,
  },
  
  // 框架选择: 'vue' | 'react'
  framework: 'react',
};
`;

  const configPath = resolve(cwd, 'vue-ts-native.config.ts');
  if (!existsSync(configPath)) {
    writeFileSync(configPath, configContent);
    console.log('✓ 创建配置文件: vue-ts-native.config.ts');
  }

  // 创建入口文件
  const mainContent = `// src/main.ts
import { showWindow } from 'vue-ts-native-core';

// 创建窗口
showWindow({
  title: 'My App',
  url: './index.html',
  width: 1024,
  height: 768,
});
`;

  const mainPath = resolve(srcDir, 'main.ts');
  if (!existsSync(mainPath)) {
    writeFileSync(mainPath, mainContent);
    console.log('✓ 创建入口文件: src/main.ts');
  }

  // 创建 HTML 文件
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
`;

  const htmlPath = resolve(cwd, 'index.html');
  if (!existsSync(htmlPath)) {
    writeFileSync(htmlPath, htmlContent);
    console.log('✓ 创建 HTML 文件: index.html');
  }

  // 创建 package.json
  const packageJson = {
    name: 'vue-ts-native-app',
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vue-ts-native-build build',
      build: 'vue-ts-native-build build',
    },
    dependencies: {
      'vue-ts-native-core': 'latest',
    },
  };

  const packagePath = resolve(cwd, 'package.json');
  if (!existsSync(packagePath)) {
    writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✓ 创建 package.json');
  }

  console.log('\n初始化完成！');
  console.log('下一步:');
  console.log('  npm install');
  console.log('  npm run build');
}
