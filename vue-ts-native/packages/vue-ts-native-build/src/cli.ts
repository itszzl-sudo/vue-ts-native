#!/usr/bin/env node

/**
 * @file cli.ts
 * @desc vue-ts-native 构建工具 CLI
 */

import { build } from './builder.js';
import { init } from './init.js';

const command = process.argv[2];

async function main() {
  switch (command) {
    case 'init':
      await init();
      break;
    
    case 'build':
      await build();
      break;
    
    default:
      console.log(`
vue-ts-native 构建工具

用法:
  vue-ts-native-build init    初始化项目
  vue-ts-native-build build   构建项目

示例:
  vue-ts-native-build init
  vue-ts-native-build build
`);
      break;
  }
}

main().catch(console.error);
