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
            placeholder="留空 = 自动获取；填 none = 不显示；或填图片地址"
            @input="scheduleIconProbe"
          />
          <div class="icon-preview">
            <div class="icon-preview-box">
              <img
                v-if="iconPreviewUrl"
                :src="iconPreviewUrl"
                alt="图标预览"
                referrerpolicy="no-referrer"
              />
              <span v-else>{{ iconPreviewChar }}</span>
            </div>
            <p class="icon-preview-hint" :class="'is-' + iconProbeState">
              {{ iconProbeMessage }}
            </p>
          </div>
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
      loading: false,
      iconPreviewUrl: '',
      iconProbeState: 'idle',
      iconProbeMessage: '留空 = 自动获取图标；填 none / off = 只显示首字母色块',
      iconProbeTimer: null,
      iconProbeWatchdog: null,
      iconProbeToken: 0
    };
  },
  computed: {
    iconPreviewChar() {
      const name = String(this.formData.name || '').trim();
      return name ? Array.from(name)[0].toUpperCase() : '?';
    }
  },
  watch: {
    visible(newVal) {
      if (newVal && this.websiteData) {
        this.populateForm();
      } else if (!newVal) {
        this.clearIconProbe();
        this.iconProbeToken += 1;
      }
    },
    websiteData(newVal) {
      if (newVal && this.visible) {
        this.populateForm();
      }
    }
  },
  beforeUnmount() {
    this.clearIconProbe();
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
      this.scheduleIconProbe();
    },

    clearIconProbe() {
      if (this.iconProbeTimer) {
        clearTimeout(this.iconProbeTimer);
        this.iconProbeTimer = null;
      }
      if (this.iconProbeWatchdog) {
        clearTimeout(this.iconProbeWatchdog);
        this.iconProbeWatchdog = null;
      }
    },

    // 输入图标地址后就地预览；失败或尺寸过小只提示，不阻止保存
    scheduleIconProbe() {
      this.clearIconProbe();
      const token = ++this.iconProbeToken;
      const raw = String(this.formData.icon || '').trim();
      this.iconPreviewUrl = '';

      if (!raw || raw === '/default.ico') {
        this.iconProbeState = 'idle';
        this.iconProbeMessage = '留空 = 自动获取图标；失败时显示首字母色块';
        return;
      }
      if (/^(none|off)$/i.test(raw)) {
        this.iconProbeState = 'idle';
        this.iconProbeMessage = '已设为不显示图标，仅显示首字母色块';
        return;
      }

      this.iconProbeState = 'loading';
      this.iconProbeMessage = '正在检查图标…';
      this.iconProbeTimer = setTimeout(() => {
        this.iconProbeTimer = null;
        this.probeIconPreview(raw, token);
      }, 500);
    },

    probeIconPreview(raw, token) {
      const apply = (state, message, url) => {
        if (token !== this.iconProbeToken) return;
        this.clearIconProbe();
        this.iconProbeState = state;
        this.iconProbeMessage = message;
        this.iconPreviewUrl = url || '';
      };

      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      this.iconProbeWatchdog = setTimeout(() => {
        apply('warn', '图标加载超时，卡片会自动降级到自动获取或字母色块（仍可保存）');
      }, 8000);

      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        if (width > 0 && height > 0 && (width < 16 || height < 16)) {
          apply('warn', `图标尺寸过小（${width}×${height}），卡片会自动降级（仍可保存）`);
          return;
        }
        const sizeText = width > 0 && height > 0 ? `（${width}×${height}）` : '';
        apply('ok', `图标可正常加载${sizeText}`, raw);
      };
      img.onerror = () => {
        apply('warn', '图标加载失败（404 / 超时 / 不是图片），卡片会自动降级（仍可保存）');
      };
      img.src = raw;
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

<style scoped>
.icon-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.icon-preview-box {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #f8f9fa;
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
}

.icon-preview-box img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.icon-preview-hint {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #6b7280;
}

.icon-preview-hint.is-ok {
  color: #15803d;
}

.icon-preview-hint.is-warn {
  color: #b45309;
}

.icon-preview-hint.is-loading {
  color: #1d4ed8;
}

:global(.dark) .icon-preview-box {
  border-color: #4b5563;
  background-color: #374151;
  color: #9ca3af;
}
</style>
