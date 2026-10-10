<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 overflow-y-auto max-h-[90vh]">
      <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        <i class="fas fa-edit mr-2"></i> 编辑网址
      </h2>
      
      <div v-if="error" class="mb-4 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
        <i class="fas fa-times-circle text-red-500 mr-2"></i>
        <span class="text-red-700 dark:text-red-300">{{ error }}</span>
      </div>
      
      <div v-if="success" class="mb-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
        <i class="fas fa-check-circle text-green-500 mr-2"></i>
        <span class="text-green-700 dark:text-green-300">{{ success }}</span>
      </div>
      
      <form @submit.prevent="submitEdit">
        <div class="mb-4">
          <label for="edit-category" class="block text-gray-700 dark:text-gray-300 mb-2">
            分类 <span class="text-red-500">*</span>
          </label>
          <select
            id="edit-category"
            v-model="formData.category"
            required
            class="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>请选择分类</option>
            <optgroup v-for="node in categoryTree" :key="node.category.id" :label="node.category.name">
              <option :value="node.category.id">{{ node.category.name }}</option>
              <option v-for="child in node.children" :key="child.id" :value="child.id">
                └ {{ child.name }}
              </option>
            </optgroup>
          </select>
        </div>
        
        <div class="mb-4">
          <label for="edit-name" class="block text-gray-700 dark:text-gray-300 mb-2">
            名称 <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="edit-name"
            v-model="formData.name"
            class="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入网站名称"
            required
          />
        </div>
        
        <div class="mb-4">
          <label for="edit-url" class="block text-gray-700 dark:text-gray-300 mb-2">
            网址 <span class="text-red-500">*</span>
          </label>
          <input
            type="url"
            id="edit-url"
            v-model="formData.url"
            class="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入网站URL，如：https://example.com"
            required
            pattern="https?://.+"
          />
        </div>
        
        <div class="mb-4">
          <label for="edit-icon" class="block text-gray-700 dark:text-gray-300 mb-2">
            图标
          </label>
          <input
            type="text"
            id="edit-icon"
            v-model="formData.icon"
            class="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入图标URL（可选）"
          />
        </div>
        
        <div class="mb-4">
          <label for="edit-description" class="block text-gray-700 dark:text-gray-300 mb-2">
            描述
          </label>
          <textarea
            id="edit-description"
            v-model="formData.description"
            class="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入网站描述（可选）"
            rows="3"
          ></textarea>
        </div>
        
        <div class="mb-4">
          <label for="edit-sort" class="block text-gray-700 dark:text-gray-300 mb-2">
            排序
          </label>
          <input
            type="number"
            id="edit-sort"
            v-model.number="formData.sortOrder"
            class="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入排序值（可选，数字越大越靠前）"
            min="0"
          />
        </div>
        
        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="cancel"
            class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg"
          >
            取消
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin mr-2"></i>
            保存
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  emits: ['submit', 'close'],
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    // 树节点: { category, children, directCount, totalCount }
    categoryTree: {
      type: Array,
      default: () => []
    },
    websiteData: {
      type: Object,
      default: () => null
    }
  },
  data() {
    return {
      formData: {
        category: '',
        name: '',
        url: '',
        icon: '',
        description: '',
        sortOrder: 0
      },
      error: '',
      success: '',
      loading: false
    };
  },
  watch: {
    visible(newVal) {
      if (newVal && this.websiteData) {
        this.populateForm();
      }
    },
    websiteData(newVal) {
      if (newVal && this.visible) {
        this.populateForm();
      }
    }
  },
  methods: {
    populateForm() {
      if (!this.websiteData) return;

      this.formData = {
        category: this.websiteData.category || '',
        name: this.websiteData.name || '',
        url: this.websiteData.url || '',
        icon: this.websiteData.icon || '',
        description: this.websiteData.description || '',
        sortOrder: this.websiteData.sortOrder || 0
      };

      this.error = '';
      this.success = '';
    },

    async submitEdit() {
      this.loading = true;
      this.error = '';

      try {
        if (!this.formData.category || !this.formData.name || !this.formData.url) {
          this.error = '请填写所有必填字段';
          return;
        }

        const urlPattern = /^https?:\/\//;
        if (!urlPattern.test(this.formData.url)) {
          this.error = '网址格式不正确，请以http://或https://开头';
          return;
        }

        const websiteData = {
          category: this.formData.category,
          name: this.formData.name,
          url: this.formData.url,
          icon: this.formData.icon || '',
          description: this.formData.description || '',
          order: this.formData.sortOrder || 0
        };

        this.$emit('submit', { recordId: this.websiteData.id, data: websiteData });
      } catch (err) {
        this.error = err.message || '修改失败，请稍后重试';
        console.error('修改网站错误:', err);
      } finally {
        this.loading = false;
      }
    },

    cancel() {
      this.$emit('close');
    }
  }
};
</script>
