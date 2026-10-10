<template>
  <div class="h-screen flex flex-col">
    <div v-if="$route.path === '/'" class="flex flex-1 overflow-hidden relative">
      <Sidebar
        :category-tree="categoryTree"
        :selected-id="selectedCategoryId"
        :counts="counts"
        :favorites-count="favoritesCount"
        :uncategorized-count="uncategorizedCount"
        :is-collapsed="isSidebarCollapsed"
        @select-category="filterByCategory"
        @toggle-sidebar="toggleSidebar"
      />
      <main class="flex-1 flex flex-col p-4 overflow-y-auto">
        <Navbar
          :darkMode="darkMode"
          :category-tree="categoryTree"
          :default-category-id="selectedCategoryId"
          @toggle-dark-mode="toggleDarkMode"
          @submit-website="handleSubmitWebsite"
          class="mb-6"/>

        <div class="flex-grow">
          <div v-if="loading" class="flex items-center justify-center h-64">
            <div class="text-gray-500 dark:text-gray-400">
              <i class="fas fa-spinner fa-spin mr-2"></i>正在加载数据...
            </div>
          </div>
          
          <div v-else-if="error" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center max-w-2xl mx-auto">
            <i class="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
            <h3 class="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">{{ error }}</h3>
            <button 
              @click="$router.push('/settings')"
              class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors mt-4"
            >
              <i class="fas fa-cog mr-2"></i>前往设置页面
            </button>
          </div>
          
          <div v-else>
            <div 
              class="grid gap-3 md:gap-6" 
              :class="{
                'grid-cols-2 md:grid-cols-3': columns === 3,
                'grid-cols-2 md:grid-cols-4': columns === 4,
                'grid-cols-2 md:grid-cols-5': columns === 5,
                'grid-cols-2 md:grid-cols-6': columns === 6,
                'grid-cols-2 md:grid-cols-7': columns === 7,
                'grid-cols-2 md:grid-cols-8': columns === 8
              }"
            >
              <template v-for="(item, index) in filteredItems" :key="item.id">
                <Card :item="item" :showPreview="showPreview" @favorite-changed="handleFavoriteChanged" @edit="handleEditClick" @delete="handleDeleteClick" />
                <AdBanner 
                  v-if="index === 9" 
                  class="hidden sm:block col-span-full h-[120px]"
                />
              </template>
            </div>
          </div>
        </div>

        <Footer class="mt-8" />
      </main>
    </div>
    
    <router-view v-else></router-view>
    
    <FloatingToolbar :theme="theme" :showPreview="showPreview" @change-theme="handleChangeTheme" @toggle-preview="togglePreview" />
    
    <Teleport to="body">
      <PasswordDialog
        :visible="showPasswordDialog"
        @close="showPasswordDialog = false"
        @password-validated="handlePasswordValidated"
      />
    </Teleport>

    <Teleport to="body">
      <EditWebsiteDialog
        :visible="showEditDialog"
        :category-tree="categoryTree"
        :websiteData="editingItem"
        @close="showEditDialog = false"
        @submit="handleEditSubmit"
      />
    </Teleport>
  </div>
</template>

<style>
html, body {
  height: 100%;
  margin: 0;
}
</style>

<script>
import { addWebsite, deleteWebsite, updateWebsite } from './api/fetchData';
import { isPasswordValidated } from './utils/auth';
import { getTheme, setTheme, applyTheme, applyBackground, getDarkMode, toggleDarkMode } from './utils/theme';
import { saveSnapshot } from './utils/backup';
import { loadNavData } from './utils/category';
import { pullSettings, scheduleSettingsSync } from './api/settingsApi';
import Navbar from './components/Navbar.vue';
import Sidebar from './components/Sidebar.vue';
import Card from './components/Card.vue';
import Footer from './components/Footer.vue';
import AdBanner from './components/AdBanner.vue';
import FloatingToolbar from './components/FloatingToolbar.vue';
import PasswordDialog from './components/PasswordDialog.vue';
import EditWebsiteDialog from './components/EditWebsiteDialog.vue';

export default {
  components: { 
    Navbar, 
    Sidebar, 
    Card, 
    Footer,
    AdBanner,
    FloatingToolbar,
    PasswordDialog,
    EditWebsiteDialog
  },
  data() {
    return {
      columns: parseInt(localStorage.getItem('columns')) || 5,
      items: [],
      categoryTree: [],
      counts: {},
      favoriteIds: JSON.parse(localStorage.getItem('favoriteItems')) || [],
      selectedCategoryId: null,
      theme: getTheme(),
      darkMode: getDarkMode(),
      isSidebarCollapsed: window.innerWidth < 768,
      loading: false,
      error: null,
      showPasswordDialog: false,
      passwordAction: null,
      pendingItem: null,
      showEditDialog: false,
      editingItem: null,
      showPreview: localStorage.getItem('showPreview') !== 'false'
    };
  },
  computed: {
    favoritesCount() {
      return this.items.filter(item => this.favoriteIds.includes(item.id)).length;
    },
    uncategorizedCount() {
      return this.items.filter(item => !item.categoryId).length;
    },
    // 当前选中分类及其全部二级分类的 id 集合（聚合过滤用）
    selectedCategoryIds() {
      const id = this.selectedCategoryId;
      if (!id || id === 'favorites' || id === 'uncategorized') return null;
      const node = this.categoryTree.find(n => n.category.id === id);
      if (node) {
        return new Set([node.category.id, ...node.children.map(c => c.id)]);
      }
      return new Set([id]);
    },
    filteredItems() {
      if (!this.selectedCategoryId) return this.items;
      if (this.selectedCategoryId === 'favorites') {
        return this.items.filter(item => this.favoriteIds.includes(item.id));
      }
      if (this.selectedCategoryId === 'uncategorized') {
        return this.items.filter(item => !item.categoryId);
      }
      const ids = this.selectedCategoryIds;
      return ids ? this.items.filter(item => ids.has(item.categoryId)) : this.items;
    }
  },
  methods: {
    async loadData() {
      try {
        this.loading = true;
        this.error = null;
        await pullSettings();
        const data = await loadNavData();
        this.items = data.items;
        this.categoryTree = data.tree;
        this.counts = data.counts;
        this.favoriteIds = JSON.parse(localStorage.getItem('favoriteItems')) || [];
        saveSnapshot(this.items);
        // 首次带分类参数进入时同步选中态
        if (this.$route.query.category !== undefined) {
          this.selectedCategoryId = this.resolveCategoryParam(this.$route.query.category);
        }
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    resolveCategoryParam(val) {
      if (!val) return null;
      if (val === 'favorites' || val === 'uncategorized') return val;
      const flat = this.categoryTree.flatMap(n => [n.category, ...n.children]);
      const found = flat.find(c => c.id === val || c.name === val);
      return found ? found.id : null;
    },
    filterByCategory(categoryId) {
      this.selectedCategoryId = categoryId;
    },
    handleChangeTheme(newTheme) {
      this.theme = newTheme;
      setTheme(newTheme);
    },
    toggleDarkMode() {
      this.darkMode = toggleDarkMode();
    },
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },
    togglePreview() {
      this.showPreview = !this.showPreview;
      localStorage.setItem('showPreview', String(this.showPreview));
      scheduleSettingsSync();
    },
    async handleSubmitWebsite(websiteData) {
      try {
        await addWebsite(websiteData);
        await this.loadData();
      } catch (error) {
        throw error;
      }
    },
    handleResize() {
      this.isSidebarCollapsed = window.innerWidth < 768;
    },
    handleGlobalClick(event) {
      const sidebar = document.querySelector('.sidebar-container');
      const cards = document.querySelectorAll('.card-container');
      if (!sidebar?.contains(event.target) &&
          !Array.from(cards).some(card => card.contains(event.target))) {
        this.selectedCategoryId = null;
      }
    },
    handleFavoriteChanged() {
      this.favoriteIds = JSON.parse(localStorage.getItem('favoriteItems')) || [];
      saveSnapshot(this.items);
    },
    handleEditClick(item) {
      this.passwordAction = 'edit';
      this.pendingItem = item;
      if (isPasswordValidated()) {
        this.handlePasswordValidated();
      } else {
        this.showPasswordDialog = true;
      }
    },
    handleDeleteClick(item) {
      this.passwordAction = 'delete';
      this.pendingItem = item;
      if (isPasswordValidated()) {
        this.handlePasswordValidated();
      } else {
        this.showPasswordDialog = true;
      }
    },
    handlePasswordValidated() {
      if (this.passwordAction === 'edit') {
        this.editingItem = this.pendingItem;
        this.showEditDialog = true;
      } else if (this.passwordAction === 'delete') {
        if (confirm(`确定要删除「${this.pendingItem.name}」吗？`)) {
          this.handleDeleteConfirm(this.pendingItem);
        }
      }
      this.passwordAction = null;
      this.pendingItem = null;
    },
    async handleDeleteConfirm(item) {
      try {
        await deleteWebsite(item.id);
        await this.loadData();
        alert('删除成功！');
      } catch (error) {
        alert('删除失败：' + error.message);
      }
    },
    async handleEditSubmit({ recordId, data }) {
      try {
        await updateWebsite(recordId, data);
        this.showEditDialog = false;
        await this.$nextTick();
        this.editingItem = null;
        await this.loadData();
        alert('修改成功！');
      } catch (error) {
        alert('修改失败：' + error.message);
      }
    }
  },
  watch: {
    '$route.query.category'(newCategory) {
      this.selectedCategoryId = this.resolveCategoryParam(newCategory);
    },
    // 从分类管理/设置页返回首页时刷新数据
    '$route.path'(path) {
      if (path === '/') {
        this.loadData();
      }
    }
  },
  created() {
    this.loadData();
  },
  mounted() {
    applyTheme(this.theme, this.darkMode);
    applyBackground(this.theme, this.darkMode);
    
    window.addEventListener('resize', this.handleResize)
    document.addEventListener('click', this.handleGlobalClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleGlobalClick);
    window.removeEventListener('resize', this.handleResize);
  }
};
</script>
