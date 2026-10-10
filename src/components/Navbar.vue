<template>
  <nav class="h-12 sticky top-0 z-30 bg-white rounded-xl dark:bg-gray-800 shadow-md px-4 py-2 flex justify-between items-center">
    <router-link to="/" class="text-xl font-bold text-blue-500 truncate max-w-[10rem] sm:max-w-xs">
      <i class="fas fa-heart"></i>{{ siteSubtitle ? ' ' + siteSubtitle : '' }}
    </router-link>
    
    <div class="hidden md:flex items-center gap-2 flex-1 max-w-2xl mx-4">
      <div class="relative">
        <a href="javascript:;" 
          class="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1 flex items-center min-w-[120px]"
          @click="showEngines = !showEngines">
          <i :class="engineIcons[selectedEngine]" class="mr-2 text-sm w-4"></i>
          <span class="truncate">{{ engines[selectedEngine].name }}</span>
        </a>
        
        <div v-show="showEngines" 
          class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg min-w-[160px] z-50">
          <a 
            v-for="(engine, key) in engines" 
            href="javascript:;" 
            class="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
            @click="selectedEngine = key; showEngines = false"
          >
            <i :class="engineIcons[key]" class="mr-3 w-4 text-center"></i>
            <span class="truncate">{{ engine.name }}</span>
          </a>
        </div>
      </div>

      <input
        type="text"
        v-model="searchQuery"
        :placeholder="engines[selectedEngine].placeholder"
        class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-1"
        @keyup.enter="search"
      />
      <button 
        @click="search"
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-lg"
      >
        <i class="fas fa-search"></i>
      </button>
    </div>
    
    <div class="flex items-center gap-0">
      <div class="relative group w-8 h-8 flex items-center justify-center">
        <button
          @click="handleAddClick"
          class="w-full h-full flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300"
        >
          <i class="fas fa-plus-circle hover:scale-110 transition-transform duration-300"></i>
        </button>
        <span class="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-center">添加网站</span>
      </div>
      
      <div class="relative group w-8 h-8 flex items-center justify-center">
        <router-link 
          to="/settings"
          class="w-full h-full flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300"
        >
          <i class="fas fa-cog hover:rotate-90 transition-transform duration-300"></i>
        </router-link>
        <span class="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-center">设置</span>
      </div>
      
      <div class="relative group w-8 h-8 flex items-center justify-center">
        <a 
          href="https://github.com/jianzhugo/Simple-Nav" 
          target="_blank"
          class="w-full h-full flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300"
        >
          <i class="fab fa-github hover:rotate-12 transition-transform"></i>
        </a>
        <span class="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-center">GitHub</span>
      </div>
      
      <div class="relative group w-8 h-8 flex items-center justify-center">
        <button 
          @click="$emit('toggle-dark-mode')"
          class="w-full h-full flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-300"
        >
          <i class="fas transition-transform duration-300" :class="darkMode ? 'fa-sun' : 'fa-moon'"></i>
        </button>
        <span class="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-center">{{ darkMode ? '浅色模式' : '深色模式' }}</span>
      </div>
    </div>
    
    <Teleport to="body">
      <PasswordDialog
        :visible="showPasswordDialog"
        @close="showPasswordDialog = false"
        @password-validated="showAddWebsiteDialog = true"
      />
    </Teleport>

    <Teleport to="body">
      <AddWebsiteDialog
        :visible="showAddWebsiteDialog"
        :category-tree="categoryTree"
        :default-category-id="defaultCategoryId"
        @close="showAddWebsiteDialog = false"
        @submit="handleSubmitWebsite"
      />
    </Teleport>
  </nav>
</template>

<script>
import PasswordDialog from './PasswordDialog.vue';
import AddWebsiteDialog from './AddWebsiteDialog.vue';
import { isPasswordValidated } from '../utils/auth';
import { getSiteSubtitle } from '../api/settingsApi';

export default {
  components: {
    PasswordDialog,
    AddWebsiteDialog
  },
  emits: ['toggle-dark-mode', 'submit-website'],
  props: {
    darkMode: { type: Boolean, default: false },
    // 树节点: { category, children, directCount, totalCount }
    categoryTree: { type: Array, default: () => [] },
    defaultCategoryId: { type: String, default: null }
  },
  computed: {
    siteSubtitle() {
      return getSiteSubtitle();
    }
  },
  data() {
    return {
      showEngines: false,
      searchQuery: '',
      selectedEngine: 'baidu',
      engines: {
        bing: { 
          name: 'Bing', 
          url: 'https://www.bing.com/search?q=', 
          placeholder: '必应搜索...' 
        },
        baidu: { 
          name: '百度', 
          url: 'https://www.baidu.com/s?wd=', 
          placeholder: '百度一下...' 
        },
        google: { 
          name: '谷歌', 
          url: 'https://www.google.com/search?q=',
          placeholder: 'Google搜索...' 
        },
        local: { 
          name: '本地', 
          url: '/search?q=',
          placeholder: '站内搜索...' 
        }
      },
      engineIcons: {
        bing: 'fab fa-microsoft',
        baidu: 'fas fa-paw',
        google: 'fab fa-google', 
        local: 'fas fa-search'
      },
      showPasswordDialog: false,
      showAddWebsiteDialog: false
    };
  },
  methods: {
    handleAddClick() {
      if (isPasswordValidated()) {
        this.showAddWebsiteDialog = true;
      } else {
        this.showPasswordDialog = true;
      }
    },
    search() {
      if (this.searchQuery.trim()) {
        if (this.selectedEngine === 'local') {
          this.$router.push({ 
            path: '/search',
            query: { q: this.searchQuery.trim() }
          });
        } else {
          const url = this.engines[this.selectedEngine].url + encodeURIComponent(this.searchQuery);
          window.open(url, '_blank');
        }
      }
    },
    handleSubmitWebsite(websiteData) {
      this.$emit('submit-website', websiteData);
    }
  }
};
</script>
