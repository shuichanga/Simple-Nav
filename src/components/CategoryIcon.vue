<template>
  <i v-if="category.icon" :class="iconCls" :style="{ fontSize: iconSize }"></i>
  <span
    v-else
    class="category-avatar inline-flex items-center justify-center rounded flex-shrink-0 font-medium"
    :style="{
      width: boxSize,
      height: boxSize,
      fontSize: fontSize,
      backgroundColor: avatar.bg,
      color: avatar.text
    }"
  >{{ avatar.initial }}</span>
</template>

<script>
import { getCategoryAvatar } from '../utils/category';

export default {
  name: 'CategoryIcon',
  props: {
    category: { type: Object, required: true },
    // md: 侧边栏常规行；sm: 二级缩进行/紧凑场景
    size: { type: String, default: 'md' }
  },
  computed: {
    avatar() {
      return getCategoryAvatar(this.category.name);
    },
    // 兼容完整类名（fas/fab 开头）与裸名（自动补 fas）
    iconCls() {
      const icon = String(this.category.icon || '').trim();
      return /^(fas|fab|far|fal)\b/.test(icon) ? icon : `fas ${icon}`;
    },
    boxSize() {
      return this.size === 'sm' ? '1rem' : '1.25rem';
    },
    fontSize() {
      return this.size === 'sm' ? '0.625rem' : '0.75rem';
    },
    iconSize() {
      return this.size === 'sm' ? '0.875rem' : '1rem';
    }
  }
};
</script>
