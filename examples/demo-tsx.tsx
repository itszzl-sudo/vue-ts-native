/**
 * @file examples/demo-tsx.tsx
 * @desc 原生Skia渲染架构 TSX 演示Demo
 * @feature 无DOM、TSX语法、Yoga纯布局、Skia绘制、原生事件响应
 * @consistent 功能与demo.vue完全对齐，适配JSX/TSX编译渲染链路
 * @note 专属自定义渲染器标签：<view /> <text />
 */

import { ref } from "vue";
import { runtimeWarn } from "@/utils/error-handle";
import { nextTick } from "@/utils/next-tick";

export default defineComponent({
  name: "NativeTsxDemo",
  setup() {
    // 响应式状态（与Vue Demo保持一致）
    const count = ref(0);
    const boxBgColor = ref("#409eff");
    const textTip = ref("原生 Skia + Yoga 渲染架构");

    // 点击交互事件
    const handleClick = async () => {
      count.value++;
      boxBgColor.value = count.value % 2 === 0 ? "#409eff" : "#67c23a";
      textTip.value = `点击次数：${count.value}`;

      await nextTick();
      runtimeWarn("TSX组件状态更新完成，触发重绘", "tsx-demo-component");
    };

    // 鼠标悬浮事件
    const handleMouseEnter = () => {
      textTip.value = "鼠标悬浮容器";
    };

    const handleMouseLeave = () => {
      textTip.value = `点击次数：${count.value}`;
    };

    // TSX 渲染函数
    return () => (
      <view
        style={{
          flex: 1,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#f5f7fa",
        }}
      >
        <view
          onClick={handleClick}
          onMouseenter={handleMouseEnter}
          onMouseleave={handleMouseLeave}
          style={{
            width: 320,
            height: 180,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: "#ffffff",
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.95,
            backgroundColor: boxBgColor.value,
          }}
        >
          <text
            style={{
              fontSize: 18,
              fontFamily: "sans-serif",
              color: "#ffffff",
              fontWeight: 500,
            }}
          >
            {textTip.value}
          </text>
        </view>
      </view>
    );
  },
});
