<template>
  <div class="relative h-full" ref="sidebar">
    <aside
      class="sidebar-container bg-white dark:bg-gray-800 rounded-lg shadow-lg h-full overflow-y-auto transition-all duration-300"
      :class="{
        'w-34 p-4': !isCollapsed,
        'min-w-[4rem] max-w-[4rem] px-2': isCollapsed
      }"
      @mouseenter="showToggle = true"
      @mouseleave="showToggle = false">

      <!-- 站点标题 -->
      <div class="flex items-center" :class="{'mb-4 pl-2': !isCollapsed, 'py-3 px-2': isCollapsed}">
        <span class="w-3 flex-shrink-0" :class="{ 'hidden': isCollapsed }"></span>
        <router-link
          to="/"
          class="w-5 h-5 flex items-center justify-center flex-shrink-0"
          @click="resetCategory"
        >
          <i class="fas fa-globe text-blue-500 text-base"></i>
        </router-link>
        <router-link
          v-if="siteTitle"
          to="/"
          class="ml-2 flex-1 min-w-0 font-bold text-blue-600 dark:text-blue-400 truncate"
          :class="{ 'hidden': isCollapsed }"
          @click="resetCategory"
        >
          {{ siteTitle }}
        </router-link>
      </div>

      <ul>
        <!-- 我的收藏（伪分类，常驻首位） -->
        <li class="mb-2">
          <button
            @click="select('favorites')"
            class="flex items-center w-full p-2 rounded transition-colors"
            :class="selectedId === 'favorites' ? 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'"
            @mouseenter="showTooltip('我的收藏', $event)"
            @mouseleave="hideTooltip"
          >
            <span class="w-3 flex-shrink-0" :class="{ 'hidden': isCollapsed }"></span>
            <span class="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-star"></i>
            </span>
            <span class="ml-2 flex-1 text-left truncate" :class="{ 'hidden': isCollapsed }">我的收藏</span>
            <span
              v-if="!isCollapsed && favoritesCount > 0"
              class="text-xs text-gray-400 dark:text-gray-500"
            >{{ favoritesCount }}</span>
          </button>
        </li>

        <!-- 一级分类 -->
        <li v-for="node in categoryTree" :key="node.category.id" class="mb-2">
          <button
            @click="toggleNode(node)"
            class="flex items-center w-full p-2 rounded transition-colors"
            :class="selectedId === node.category.id ? 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'"
            @mouseenter="showTooltip(node.category.name, $event)"
            @mouseleave="hideTooltip"
          >
            <span class="w-3 flex-shrink-0 text-center" :class="{ 'hidden': isCollapsed }">
              <i
                v-if="node.children.length"
                class="fas fa-chevron-right text-[10px] text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-90': isExpanded(node.category.id) }"
              ></i>
            </span>
            <span class="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <CategoryIcon :category="node.category" />
            </span>
            <span class="ml-2 flex-1 text-left truncate" :class="{ 'hidden': isCollapsed }">{{ node.category.name }}</span>
            <span
              v-if="!isCollapsed && node.totalCount > 0"
              class="text-xs text-gray-400 dark:text-gray-500"
            >{{ node.totalCount }}</span>
          </button>

          <!-- 二级分类（手风琴展开） -->
          <ul v-if="!isCollapsed && isExpanded(node.category.id)">
            <li v-for="child in node.children" :key="child.id">
              <button
                @click="select(child.id)"
                class="flex items-center w-full p-2 pl-7 rounded ml-2 transition-colors"
                :class="selectedId === child.id ? 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'"
              >
                <span class="w-5 h-5 flex items-center justify-center flex-shrink-0">
                  <CategoryIcon :category="child" size="sm" />
                </span>
                <span class="ml-2 flex-1 text-left truncate text-sm">{{ child.name }}</span>
                <span v-if="(counts[child.id] || 0) > 0" class="text-xs text-gray-400 dark:text-gray-500">{{ counts[child.id] }}</span>
              </button>
            </li>
          </ul>
        </li>

        <!-- 未分类（仅有未归属网站时显示） -->
        <li v-if="uncategorizedCount > 0" class="mb-2">
          <button
            @click="select('uncategorized')"
            class="flex items-center w-full p-2 rounded transition-colors"
            :class="selectedId === 'uncategorized' ? 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'"
            @mouseenter="showTooltip('未分类', $event)"
            @mouseleave="hideTooltip"
          >
            <span class="w-3 flex-shrink-0" :class="{ 'hidden': isCollapsed }"></span>
            <span class="w-5 h-5 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-inbox"></i>
            </span>
            <span class="ml-2 flex-1 text-left truncate" :class="{ 'hidden': isCollapsed }">未分类</span>
            <span v-if="!isCollapsed" class="text-xs text-gray-400 dark:text-gray-500">{{ uncategorizedCount }}</span>
          </button>
        </li>
      </ul>

      <!-- 收缩按钮 -->
      <button
        v-if="showToggle"
        @click="$emit('toggle-sidebar')"
        class="absolute bottom-2 left-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200"
      >
        <i class="fas" :class="isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
      </button>

      <!-- 底部导航 -->
      <div class="mt-auto">
        <router-link
          to="/manage-categories"
          class="flex items-center w-full p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200"
        >
          <span class="w-3 flex-shrink-0" :class="{ 'hidden': isCollapsed }"></span>
          <span class="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <i class="fas fa-sitemap"></i>
          </span>
          <span class="ml-2 truncate" :class="{ 'hidden': isCollapsed }">分类管理</span>
        </router-link>
        <router-link
          to="/about"
          class="flex items-center w-full p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200"
        >
          <span class="w-3 flex-shrink-0" :class="{ 'hidden': isCollapsed }"></span>
          <span class="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <i class="fas fa-info-circle"></i>
          </span>
          <span class="ml-2 truncate" :class="{ 'hidden': isCollapsed }">关于本站</span>
        </router-link>
      </div>

      <!-- 折叠态悬浮提示 -->
      <div
        v-if="hoveredCategory && isCollapsed"
        class="absolute left-full ml-2 px-2 py-1 bg-gray-600 dark:bg-gray-200 text-white dark:text-gray-800 text-sm rounded-md shadow-md z-50 whitespace-nowrap"
        :style="{ top: tooltipPosition }"
      >
        <div class="relative">
          {{ hoveredCategory }}
          <div class="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-600 dark:bg-gray-200 transform rotate-45"></div>
        </div>
      </div>
    </aside>
  </div>
</template>
<script>
import CategoryIcon from './CategoryIcon.vue';
import { getSiteTitle } from '../api/settingsApi';

export default {
  components: { CategoryIcon },
  props: {
    // 树节点: { category, children, directCount, totalCount }
    categoryTree: { type: Array, default: () => [] },
    // null=全部 / 'favorites' / 'uncategorized' / 分类id
    selectedId: { type: String, default: null },
    isCollapsed: { type: Boolean, default: false },
    favoritesCount: { type: Number, default: 0 },
    uncategorizedCount: { type: Number, default: 0 },
    // { 分类id: 直属网站数 }，用于二级分类计数
    counts: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      showToggle: false,
      hoveredCategory: null,
      tooltipPosition: '0px',
      expandedIds: []
    };
  },
  computed: {
    siteTitle() {
      return getSiteTitle();
    },
  },
  watch: {
    // 外部选中一级分类时自动展开其子级
    selectedId: {
      immediate: true,
      handler(val) {
        if (val && this.categoryTree.some(node => node.category.id === val)) {
          this.expand(val);
        }
      }
    }
  },
  methods: {
    isExpanded(id) {
      return this.expandedIds.includes(id);
    },
    expand(id) {
      if (!this.isExpanded(id)) {
        this.expandedIds.push(id);
      }
    },
    collapse(id) {
      this.expandedIds = this.expandedIds.filter(e => e !== id);
    },
    toggleNode(node) {
      const id = node.category.id;
      if (this.selectedId === id) {
        // 再次点击：收起并取消筛选
        this.collapse(id);
        this.select(null);
      } else {
        this.select(id);
        this.expand(id);
      }
    },
    select(id) {
      this.$emit('select-category', id);
    },
    resetCategory() {
      this.$emit('select-category', null);
    },
    showTooltip(name, event) {
      if (this.isCollapsed) {
        this.hoveredCategory = name;
        const rect = event.currentTarget.getBoundingClientRect();
        this.tooltipPosition = `${rect.top + window.scrollY + 8}px`;
      }
    },
    hideTooltip() {
      this.hoveredCategory = null;
    }
  }
};
</script>

<style scoped>
aside {
  transition: width 0.3s ease, box-shadow 0.3s ease;
}

button {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

button:hover {
  transition-delay: 0.1s;
}

div[class*="bg-gray-"] {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-5px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
