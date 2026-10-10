<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 overflow-y-auto max-h-[90vh]">
      <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        <i class="fas fa-plus-circle mr-2"></i> 网址添加
      </h2>
      
      <!-- 错误提示 -->
      <div v-if="error" class="mb-4 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
        <i class="fas fa-times-circle text-red-500 mr-2"></i>
        <span class="text-red-700 dark:text-red-300">{{ error }}</span>
      </div>
      
      <!-- 成功提示 -->
      <div v-if="success" class="mb-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
        <i class="fas fa-check-circle text-green-500 mr-2"></i>
        <span class="text-green-700 dark:text-green-300">{{ success }}</span>
      </div>
      
      <form @submit.prevent="submitWebsite">
        <!-- 分类选择（两级，值为完整路径 "一级" 或 "一级/二级"） -->
        <div class="mb-4">
          <label for="category" class="block text-gray-700 dark:text-gray-300 mb-2">
            分类 <span class="text-red-500">*</span>
          </label>
          <select
            id="category"
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
        
        <!-- 名称输入 -->
        <div class="mb-4">
          <label for="name" class="block text-gray-700 dark:text-gray-300 mb-2">
            名称 <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            v-model="formData.name"
            class="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入网站名称"
            required
          />
        </div>
        
        <!-- 网址输入 -->
        <div class="mb-4">
          <label for="url" class="block text-gray-700 dark:text-gray-300 mb-2">
            网址 <span class="text-red-500">*</span>
          </label>
          <input
            type="url"
            id="url"
            v-model="formData.url"
            class="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入网站URL，如：https://example.com"
            required
            pattern="https?://.+"
          />
        </div>
        
        <!-- 图标输入 -->
        <div class="mb-4">
          <label for="icon" class="block text-gray-700 dark:text-gray-300 mb-2">
            图标
          </label>
          <input
            type="text"
            id="icon"
            v-model="formData.icon"
            class="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入图标URL（可选）"
          />
        </div>
        
        <!-- 描述输入 -->
        <div class="mb-4">
          <label for="description" class="block text-gray-700 dark:text-gray-300 mb-2">
            描述
          </label>
          <textarea
            id="description"
            v-model="formData.description"
            class="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入网站描述（可选）"
            rows="3"
          ></textarea>
        </div>
        
        <!-- 排序输入 -->
        <div class="mb-4">
          <label for="sort" class="block text-gray-700 dark:text-gray-300 mb-2">
            排序
          </label>
          <input
            type="number"
            id="sort"
            v-model.number="formData.sortOrder"
            class="w-full bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入排序值（可选，数字越大越靠前）"
            min="0"
          />
        </div>
        
        <!-- 按钮区域 -->
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
            提交
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
    defaultCategoryId: {
      type: String,
      default: null
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
  computed: {
    // 全部可选分类路径
    allCategoryIds() {
      const ids = [];
      for (const node of this.categoryTree) {
        ids.push(node.category.id);
        ids.push(...node.children.map(c => c.id));
      }
      return ids;
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm();
      }
    }
  },
  methods: {
    // 重置表单（分类默认带出当前筛选的分类）
    resetForm() {
      this.formData = {
        category: this.defaultCategoryId && this.allCategoryIds.includes(this.defaultCategoryId)
          ? this.defaultCategoryId
          : '',
        name: '',
        url: '',
        icon: '',
        description: '',
        sortOrder: 0
      };
      this.error = '';
      this.success = '';
    },

    // 提交网站
    async submitWebsite() {
      this.loading = true;
      this.error = '';
      this.success = '';

      try {
        if (!this.formData.category || !this.formData.name || !this.formData.url) {
          this.error = '请填写所有必填字段';
          return;
        }

        // 网址格式验证
        const urlPattern = /^https?:\/\//;
        if (!urlPattern.test(this.formData.url)) {
          this.error = '网址格式不正确，请以http://或https://开头';
          return;
        }

        // 构造提交数据
        const websiteData = {
          category: this.formData.category,
          name: this.formData.name,
          url: this.formData.url,
          icon: this.formData.icon || '',
          description: this.formData.description || '',
          order: this.formData.sortOrder || 0
        };

        // 调用父组件传递的提交方法
        await this.$emit('submit', websiteData);

        // 显示成功信息
        this.success = '网址提交成功！';

        // 重置表单
        setTimeout(() => {
          this.resetForm();
          this.$emit('close');
        }, 1500);
      } catch (err) {
        this.error = err.message || '提交失败，请稍后重试';
        console.error('提交网站错误:', err);
      } finally {
        this.loading = false;
      }
    },

    // 取消
    cancel() {
      this.$emit('close');
      this.resetForm();
    }
  }
};
</script>