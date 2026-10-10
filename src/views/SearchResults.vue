<template>
  <div class="h-screen flex flex-col">
    <div class="flex flex-1 overflow-hidden relative">
      <Sidebar
        :category-tree="categoryTree"
        :isCollapsed="isSidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
        @select-category="selectCategory"
      />
      <main class="flex-1 flex flex-col p-4 overflow-y-auto">
        <Navbar :darkMode="darkMode" @toggle-dark-mode="toggleDarkMode" class="mb-6"/>
        
        <div class="flex-grow">
          <h2 class="text-2xl mb-4 dark:text-gray-200">搜索：{{ searchQuery }}</h2>
          
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
            <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <Card 
                v-for="item in searchResults" 
                :key="item.id" 
                :item="item"
              />
              <div v-if="searchResults.length === 0" class="col-span-full text-center text-gray-500">
                没有找到相关结果
              </div>
            </div>
          </div>
        </div>

        <Footer class="mt-8" />
      </main>
    </div>
  </div>
</template>

<script>
import { getDarkMode, toggleDarkMode } from '../utils/theme';
import { loadNavData } from '../utils/category';
import { pullSettings } from '../api/settingsApi';
import Navbar from '../components/Navbar.vue';
import Sidebar from '../components/Sidebar.vue';
import Card from '../components/Card.vue';
import Footer from '../components/Footer.vue';

export default {
  components: { Navbar, Sidebar, Card, Footer },
  data() {
    return {
      loading: true,
      searchQuery: '',
      allItems: [],
      darkMode: getDarkMode(),
      isSidebarCollapsed: window.innerWidth < 768,
      categoryTree: [],
      error: null
    }
  },
  computed: {
    searchResults() {
      const query = this.searchQuery.toLowerCase();
      return this.allItems.filter(item =>
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }
  },
  watch: {
    '$route.query.q': {
      immediate: true,
      handler(newVal) {
        this.handleSearch(newVal);
      }
    }
  },
  methods: {
    async handleSearch(query) {
      this.loading = true;
      this.searchQuery = query || '';
      this.error = null;

      try {
        await pullSettings();
        const data = await loadNavData();
        this.allItems = data.items;
        this.categoryTree = data.tree;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    toggleDarkMode() {
      this.darkMode = toggleDarkMode();
    },
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },
    selectCategory(categoryId) {
      this.$router.push({ path: '/', query: { category: categoryId || undefined } });
    }
  },
  async created() {
    await this.handleSearch(this.$route.query.q);
  }
};
</script>
