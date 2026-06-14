import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
      'vue-ts-native-core': resolve(__dirname, '../src'),
      // 使用完整版 Vue（支持运行时编译 template）
      'vue': 'vue/dist/vue.esm-bundler.js',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  // 注入 Canvas 渲染后端
  define: {
    __RENDER_BACKEND__: JSON.stringify('canvas2d'),
  },
});
