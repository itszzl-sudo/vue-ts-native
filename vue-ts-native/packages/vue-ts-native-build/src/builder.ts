/**
 * @file builder.ts
 * @desc 构建逻辑
 */

import * as esbuild from 'esbuild';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * 构建项目
 */
export async function build(): Promise<void> {
  console.log('开始构建 vue-ts-native 项目...\n');

  // 读取配置文件
  const configPath = resolve(process.cwd(), 'vue-ts-native.config.ts');
  if (!existsSync(configPath)) {
    console.error('错误: 找不到 vue-ts-native.config.ts');
    console.log('请先运行: vue-ts-native-build init');
    return;
  }

  console.log('✓ 找到配置文件');

  // 构建入口文件
  const entryPoint = resolve(process.cwd(), 'src/main.ts');
  if (!existsSync(entryPoint)) {
    console.error('错误: 找不到 src/main.ts');
    return;
  }

  console.log('✓ 找到入口文件');

  // 使用 esbuild 打包
  const outDir = resolve(process.cwd(), 'dist');
  
  try {
    await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      outfile: resolve(outDir, 'main.js'),
      format: 'esm',
      target: 'es2020',
      platform: 'browser', // WebView2 环境
      minify: true,
      sourcemap: false,
      external: ['vue-ts-native-core'], // ts-native API 在运行时提供
    });

    console.log('✓ 构建完成');
    console.log(`  输出: ${outDir}/main.js`);
    console.log('\n下一步:');
    console.log('  1. 将 dist/main.js 复制到 ts-native 项目');
    console.log('  2. 使用 ts-native 编译为二进制:');
    console.log('     tsn build');
  } catch (error) {
    console.error('构建失败:', error);
    process.exit(1);
  }
}
