<!--
  @file examples/demo.vue
  @desc 原生Skia渲染架构演示Demo
  @feature 无DOM、纯Yoga布局、Skia绘制、原生事件交互、状态响应式更新
  @use 测试整套自定义渲染链路、布局计算、重绘机制、事件捕获
-->
<script setup lang="ts">
import { ref } from 'vue'
import { runtimeWarn } from '@/utils/error-handle'
import { nextTick } from '@/utils/next-tick'

// 响应式状态
const count = ref(0)
const boxBgColor = ref('#409eff')
const textTip = ref('原生 Skia + Yoga 渲染架构')

// 点击计数事件
const handleClick = async () => {
  count.value++
  // 动态切换背景色，触发样式更新 & 局部重绘
  boxBgColor.value = count.value % 2 === 0 ? '#409eff' : '#67c23a'
  textTip.value = `点击次数：${count.value}`

  await nextTick()
  runtimeWarn('组件状态更新完成，触发重绘', 'demo-component')
}

// 空事件测试（鼠标移入）
const handleMouseEnter = () => {
  textTip.value = '鼠标悬浮容器'
}

const handleMouseLeave = () => {
  textTip.value = `点击次数：${count.value}`
}
</script>

<template>
  <!-- 根容器 - Yoga弹性布局居中 -->
  <view class="root-container">
    <!-- 卡片容器 - 圆角、阴影、纯色背景 -->
    <view
      class="card-box"
      :style="{ backgroundColor: boxBgColor }"
      @click="handleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <!-- 文本节点 - 自定义字体、颜色、字号 -->
      <text class="card-text">{{ textTip }}</text>
    </view>
  </view>
</template>

<style scoped>
/* 完全适配自定义渲染器样式规则，纯Yoga布局+Skia绘制 */
.root-container {
  /* Yoga布局属性 */
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
}

.card-box {
  /* 盒模型布局 */
  width: 320px;
  height: 180px;
  border-radius: 16px;
  /* 边框 */
  border-width: 2px;
  border-color: #ffffff;
  /* 内边距 */
  padding: 20px;
  /* 弹性居中 */
  flex-direction: row;
  align-items: center;
  justify-content: center;
  /* 透明度 */
  opacity: 0.95;
}

.card-text {
  /* 文本样式 */
  font-size: 18px;
  font-family: sans-serif;
  color: #ffffff;
  font-weight: 500;
}
</style>
