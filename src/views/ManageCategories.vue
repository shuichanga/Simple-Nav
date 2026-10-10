<template>
  <div class="h-screen flex flex-col">
    <div class="flex flex-1 overflow-hidden relative">
      <Sidebar
        :category-tree="tree"
        :counts="counts"
        :favorites-count="favoritesCount"
        :uncategorized-count="uncategorizedCount"
        :isCollapsed="isSidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
        @select-category="goHome"
      />
      <main class="flex-1 flex flex-col p-4 overflow-y-auto">
        <Navbar :darkMode="darkMode" @toggle-dark-mode="toggleDarkMode" class="mb-6"/>

        <div class="max-w-3xl mx-auto">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-semibold dark:text-gray-200">
              <i class="fas fa-sitemap text-blue-500 mr-2"></i>分类管理
            </h2>
            <router-link
              to="/"
              class="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400"
            >
              <i class="fas fa-arrow-left mr-1"></i>返回首页
            </router-link>
          </div>

          <div v-if="warning" class="mb-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 rounded-lg px-4 py-2 text-sm">
            <i class="fas fa-exclamation-triangle mr-2"></i>{{ warning }}
          </div>

          <!-- 密码验证门槛 -->
          <div v-if="!passwordOk" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <i class="fas fa-lock text-gray-400 text-3xl mb-3"></i>
            <p class="mb-4 text-gray-600 dark:text-gray-300">分类管理会修改维基云网站数据，请先验证密码</p>
            <button
              @click="showPasswordDialog = true"
              class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
            >
              验证密码
            </button>
          </div>

          <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
              二级分类以「一级/二级」形式写入网站的分类字段，例如 <code class="bg-gray-100 dark:bg-gray-700 rounded px-1">开发/前端</code>。分类图标与排序保存在设置同步中，可在设置页配置设置表实现跨设备同步。
            </p>

          <!-- 添加一级分类 -->
          <div class="flex gap-2 mb-6">
            <input
              v-model="newRootName"
              type="text"
              placeholder="新的一级分类名称"
              class="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @keyup.enter="addRoot"
            >
            <button
              @click="addRoot"
              :disabled="loading"
              class="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded whitespace-nowrap"
            >
              <i class="fas fa-plus mr-1"></i>添加一级分类
            </button>
          </div>

          <div v-if="loading" class="text-center py-8 text-gray-500">
            <i class="fas fa-spinner fa-spin mr-2"></i>加载中...
          </div>

          <div v-else>
            <div v-for="(node, idx) in tree" :key="node.category.id" class="mb-1">
              <!-- 一级行 -->
              <div class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                <CategoryIcon :category="node.category" />
                <template v-if="editingId === node.category.id">
                  <input
                    v-model="editingName"
                    type="text"
                    class="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 border border-gray-300 dark:border-gray-600"
                    @keyup.enter="saveRename(node.category)"
                  >
                  <button @click="saveRename(node.category)" class="action-link text-green-600">保存</button>
                  <button @click="editingId = null" class="action-link text-gray-400">取消</button>
                </template>
                <template v-else>
                  <span class="flex-1 font-medium dark:text-gray-200">{{ node.category.name }}</span>
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{ node.totalCount }} 个网站</span>
                  <button @click="openIconPicker(node.category)" class="action-link" title="设置图标">
                    <i class="fas fa-icons"></i><span>图标</span>
                  </button>
                  <button @click="startRename(node.category)" class="action-link" title="重命名">
                    <i class="fas fa-pen"></i><span>改名</span>
                  </button>
                  <button @click="startAddChild(node.category)" class="action-link" title="添加子分类">
                    <i class="fas fa-plus"></i><span>子分类</span>
                  </button>
                  <button @click="move(node.category, -1)" :disabled="idx === 0" class="action-link disabled:opacity-30" title="上移">
                    <i class="fas fa-arrow-up"></i>
                  </button>
                  <button @click="move(node.category, 1)" :disabled="idx === tree.length - 1" class="action-link disabled:opacity-30" title="下移">
                    <i class="fas fa-arrow-down"></i>
                  </button>
                  <button @click="remove(node.category)" class="action-link text-red-500" title="删除">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </template>
              </div>

              <!-- 二级行 -->
              <div v-for="(child, cIdx) in node.children" :key="child.id" class="flex items-center gap-2 p-2 pl-8 rounded ml-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                <CategoryIcon :category="child" size="sm" />
                <template v-if="editingId === child.id">
                  <input
                    v-model="editingName"
                    type="text"
                    class="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 border border-gray-300 dark:border-gray-600"
                    @keyup.enter="saveRename(child)"
                  >
                  <button @click="saveRename(child)" class="action-link text-green-600">保存</button>
                  <button @click="editingId = null" class="action-link text-gray-400">取消</button>
                </template>
                <template v-else>
                  <span class="flex-1 text-sm dark:text-gray-300">{{ child.name }}</span>
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{ counts[child.id] || 0 }} 个网站</span>
                  <button @click="openIconPicker(child)" class="action-link" title="设置图标">
                    <i class="fas fa-icons"></i><span>图标</span>
                  </button>
                  <button @click="startRename(child)" class="action-link" title="重命名">
                    <i class="fas fa-pen"></i><span>改名</span>
                  </button>
                  <button @click="move(child, -1)" :disabled="cIdx === 0" class="action-link disabled:opacity-30" title="上移">
                    <i class="fas fa-arrow-up"></i>
                  </button>
                  <button @click="move(child, 1)" :disabled="cIdx === node.children.length - 1" class="action-link disabled:opacity-30" title="下移">
                    <i class="fas fa-arrow-down"></i>
                  </button>
                  <button @click="remove(child)" class="action-link text-red-500" title="删除">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </template>
              </div>

              <!-- 添加子分类输入行 -->
              <div v-if="addingChildParent === node.category.id" class="flex gap-2 p-2 ml-6">
                <input
                  v-model="newChildName"
                  type="text"
                  :placeholder="`在「${node.category.name}」下添加二级分类`"
                  class="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 border border-gray-300 dark:border-gray-600"
                  @keyup.enter="confirmAddChild"
                >
                <button @click="confirmAddChild" :disabled="loading" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">添加</button>
                <button @click="addingChildParent = null" class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-800 dark:text-gray-200 px-4 py-2 rounded">取消</button>
              </div>
            </div>

            <div v-if="tree.length === 0" class="text-center py-8 text-gray-500">
              暂无分类，请在上方添加
            </div>
          </div>
          </div>
        </div>

        <Footer class="mt-8" />
      </main>
    </div>

    <!-- 密码验证 -->
    <Teleport to="body">
      <PasswordDialog
        :visible="showPasswordDialog"
        @close="showPasswordDialog = false"
        @password-validated="passwordOk = true"
      />
    </Teleport>

    <!-- 图标选择弹窗 -->
    <Teleport to="body">
      <div
        v-if="iconPickerCat"
        class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50"
        @click.self="iconPickerCat = null"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-bold mb-4 dark:text-gray-200">
            选择「{{ iconPickerCat.name }}」的图标
          </h3>
          <input
            v-model="iconSearch"
            type="text"
            placeholder="搜索图标（如：代码 / film / 购物）"
            class="w-full bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 border border-gray-300 dark:border-gray-600 mb-4"
          >
          <div class="mb-4">
            <button
              @click="pickIcon('')"
              class="w-full h-10 rounded border border-gray-200 dark:border-gray-600 hover:border-blue-400 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2"
            >
              <span class="category-avatar inline-flex items-center justify-center rounded font-medium w-5 h-5 text-xs" style="background:#e5e7eb;color:#374151">无</span>
              无图标（使用字母头像）
            </button>
          </div>

          <template v-for="group in filteredIconGroups" :key="group.label">
            <div class="text-xs text-gray-400 dark:text-gray-500 mb-1 mt-2">{{ group.label }}</div>
            <div class="grid grid-cols-6 gap-2 mb-3">
              <button
                v-for="icon in group.icons"
                :key="icon.class"
                @click="pickIcon(icon.class)"
                class="h-10 rounded border border-gray-200 dark:border-gray-600 hover:border-blue-400 flex items-center justify-center dark:text-gray-300"
                :title="`${icon.name} (${icon.class})`"
              >
                <i :class="icon.class"></i>
              </button>
            </div>
          </template>
          <div v-if="filteredIconGroups.length === 0" class="text-center text-sm text-gray-400 py-6">
            没有匹配的图标，可直接使用下方自定义类名
          </div>

          <div class="flex gap-2 mt-2">
            <input
              v-model="customIconClass"
              type="text"
              placeholder="自定义 Font Awesome 类名，如：fab fa-github"
              class="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 border border-gray-300 dark:border-gray-600"
              @keyup.enter="pickIcon(customIconClass.trim())"
            >
            <button
              @click="pickIcon(customIconClass.trim())"
              class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded whitespace-nowrap"
            >
              使用
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import Sidebar from '../components/Sidebar.vue';
import Navbar from '../components/Navbar.vue';
import Footer from '../components/Footer.vue';
import CategoryIcon from '../components/CategoryIcon.vue';
import PasswordDialog from '../components/PasswordDialog.vue';
import { getDarkMode, toggleDarkMode } from '../utils/theme';
import { loadNavData } from '../utils/category';
import { pullSettings } from '../api/settingsApi';
import {
  addCategoryPath, setCategoryIcon, setCategoryOrder,
  renameCategoryPath, deleteCategoryPath, rewriteSiteCategories
} from '../api/categoryApi';
import { isPasswordValidated } from '../utils/auth';

// 精选图标池：[完整类名, 中文名]，支持 fab 品牌图标
const ICON_GROUPS = [
  { label: '常用', icons: [
    ['fas fa-home', '首页'], ['fas fa-star', '星标'], ['fas fa-heart', '喜欢'], ['fas fa-link', '链接'],
    ['fas fa-globe', '网址'], ['fas fa-compass', '探索'], ['fas fa-rocket', '火箭'], ['fas fa-fire', '热门'],
    ['fas fa-bolt', '闪电'], ['fas fa-magic', '魔法'], ['fas fa-cog', '设置'], ['fas fa-cogs', '配置'],
    ['fas fa-tools', '工具'], ['fas fa-wrench', '扳手'], ['fas fa-th-large', '宫格'], ['fas fa-list', '列表'],
    ['fas fa-folder', '文件夹'], ['fas fa-archive', '归档'], ['fas fa-box', '盒子'], ['fas fa-inbox', '收件箱'],
    ['fas fa-tag', '标签'], ['fas fa-thumbtack', '图钉'], ['fas fa-search', '搜索'], ['fas fa-eye', '查看'],
    ['fas fa-bell', '通知'], ['fas fa-filter', '筛选'],
  ]},
  { label: '开发/技术', icons: [
    ['fas fa-code', '代码'], ['fas fa-terminal', '终端'], ['fas fa-code-branch', '分支'], ['fas fa-bug', '调试'],
    ['fas fa-database', '数据库'], ['fas fa-server', '服务器'], ['fas fa-cloud', '云'], ['fas fa-cloud-upload-alt', '云上传'],
    ['fas fa-cloud-download-alt', '云下载'], ['fas fa-download', '下载'], ['fas fa-upload', '上传'], ['fas fa-key', '密钥'],
    ['fas fa-lock', '锁'], ['fas fa-unlock', '解锁'], ['fas fa-shield-alt', '安全'], ['fas fa-network-wired', '网络'],
    ['fas fa-microchip', '芯片'], ['fas fa-hdd', '硬盘'], ['fas fa-desktop', '桌面'], ['fas fa-laptop-code', '笔记本'],
    ['fas fa-plug', '插件'], ['fas fa-file-code', '代码文件'], ['fas fa-layer-group', '图层'], ['fas fa-sync', '同步'],
    ['fas fa-sitemap', '结构'],
  ]},
  { label: '设计/创意', icons: [
    ['fas fa-palette', '调色板'], ['fas fa-paint-brush', '画笔'], ['fas fa-image', '图片'], ['fas fa-images', '图库'],
    ['fas fa-camera', '相机'], ['fas fa-camera-retro', '复古相机'], ['fas fa-pen', '笔'], ['fas fa-pencil-alt', '铅笔'],
    ['fas fa-pen-nib', '钢笔尖'], ['fas fa-crop', '裁剪'], ['fas fa-shapes', '形状'], ['fas fa-bezier-curve', '曲线'],
    ['fas fa-vector-square', '矢量'], ['fas fa-swatchbook', '色卡'], ['fas fa-lightbulb', '灵感'], ['fas fa-gem', '宝石'],
    ['fas fa-cube', '立方'], ['fas fa-cubes', '立方体'], ['fas fa-ruler-combined', '标尺'], ['fas fa-fill-drip', '填充'],
  ]},
  { label: '影音/娱乐', icons: [
    ['fas fa-film', '影视'], ['fas fa-video', '视频'], ['fas fa-photo-video', '图文'], ['fas fa-music', '音乐'],
    ['fas fa-headphones', '耳机'], ['fas fa-microphone-alt', '麦克风'], ['fas fa-play', '播放'], ['fas fa-play-circle', '播放按钮'],
    ['fas fa-tv', '电视'], ['fas fa-podcast', '播客'], ['fas fa-gamepad', '游戏'], ['fas fa-vr-cardboard', 'VR'],
    ['fas fa-satellite-dish', '天线'], ['fas fa-record-vinyl', '唱片'],
  ]},
  { label: '办公/文档', icons: [
    ['fas fa-file-alt', '文档'], ['fas fa-file-pdf', 'PDF'], ['fas fa-file-word', 'Word'], ['fas fa-file-excel', 'Excel'],
    ['fas fa-file-powerpoint', 'PPT'], ['fas fa-file-archive', '压缩包'], ['fas fa-edit', '编辑'], ['fas fa-copy', '复制'],
    ['fas fa-clipboard-list', '清单'], ['fas fa-table', '表格'], ['fas fa-print', '打印'], ['fas fa-save', '保存'],
    ['fas fa-briefcase', '公文包'], ['fas fa-calendar-alt', '日历'], ['fas fa-clock', '时钟'], ['fas fa-tasks', '任务'],
    ['fas fa-chart-bar', '柱状图'], ['fas fa-chart-line', '折线图'], ['fas fa-chart-pie', '饼图'],
  ]},
  { label: '电商/金融', icons: [
    ['fas fa-shopping-cart', '购物车'], ['fas fa-shopping-bag', '购物袋'], ['fas fa-store', '商店'], ['fas fa-credit-card', '银行卡'],
    ['fas fa-money-bill-wave', '现金'], ['fas fa-coins', '金币'], ['fas fa-percent', '折扣'], ['fas fa-gift', '礼物'],
    ['fas fa-truck', '物流'], ['fas fa-box-open', '开箱'], ['fas fa-cash-register', '收银'],
  ]},
  { label: '社交/沟通', icons: [
    ['fas fa-comments', '评论'], ['fas fa-comment', '对话'], ['fas fa-envelope', '邮件'], ['fas fa-paper-plane', '发送'],
    ['fas fa-rss', '订阅'], ['fas fa-share-alt', '分享'], ['fas fa-users', '群组'], ['fas fa-user', '用户'],
    ['fas fa-user-friends', '好友'], ['fas fa-at', '提及'], ['fas fa-bullhorn', '广播'], ['fas fa-handshake', '合作'],
  ]},
  { label: 'AI/数据', icons: [
    ['fas fa-brain', '大脑'], ['fas fa-robot', '机器人'], ['fas fa-project-diagram', '关系图'], ['fas fa-atom', '原子'],
    ['fas fa-flask', '实验'], ['fas fa-wave-square', '波形'], ['fas fa-random', '随机'], ['fas fa-stream', '数据流'],
  ]},
  { label: '生活/出行', icons: [
    ['fas fa-utensils', '餐饮'], ['fas fa-coffee', '咖啡'], ['fas fa-plane', '飞机'], ['fas fa-car', '汽车'],
    ['fas fa-bicycle', '骑行'], ['fas fa-bed', '住宿'], ['fas fa-book', '书籍'], ['fas fa-graduation-cap', '教育'],
    ['fas fa-football-ball', '体育'], ['fas fa-dumbbell', '健身'], ['fas fa-leaf', '自然'], ['fas fa-sun', '晴天'],
    ['fas fa-moon', '夜间'], ['fas fa-umbrella-beach', '度假'], ['fas fa-ticket-alt', '票务'], ['fas fa-map-marked-alt', '地图'],
  ]},
  { label: '品牌', icons: [
    ['fab fa-github', 'GitHub'], ['fab fa-git-alt', 'Git'], ['fab fa-python', 'Python'],
    ['fab fa-windows', 'Windows'], ['fab fa-apple', 'Apple'], ['fab fa-android', 'Android'],
    ['fab fa-chrome', 'Chrome'], ['fab fa-docker', 'Docker'], ['fab fa-steam', 'Steam'],
    ['fab fa-qq', 'QQ'], ['fab fa-weixin', '微信'], ['fab fa-weibo', '微博'],
  ]},
].map(group => ({
  label: group.label,
  icons: group.icons.map(([cls, name]) => ({ class: cls, name }))
}));

// 裸图标名自动补 fas 前缀
function normalizeIconClass(cls) {
  const c = String(cls || '').trim();
  if (!c) return '';
  return /^(fas|fab|far|fal)\b/.test(c) ? c : `fas ${c}`;
}

export default {
  components: { Sidebar, Navbar, Footer, CategoryIcon, PasswordDialog },
  data() {
    return {
      darkMode: getDarkMode(),
      isSidebarCollapsed: window.innerWidth < 768,
      loading: true,
      warning: '',
      tree: [],
      counts: {},
      items: [],
      passwordOk: isPasswordValidated(),
      showPasswordDialog: false,
      newRootName: '',
      addingChildParent: null,
      newChildName: '',
      editingId: null,
      editingName: '',
      iconPickerCat: null,
      customIconClass: '',
      iconSearch: ''
    };
  },
  computed: {
    favoritesCount() {
      const ids = JSON.parse(localStorage.getItem('favoriteItems')) || [];
      return this.items.filter(i => ids.includes(i.id)).length;
    },
    uncategorizedCount() {
      return this.items.filter(i => !i.categoryId).length;
    },
    // 按中文名/类名过滤图标分组
    filteredIconGroups() {
      const q = this.iconSearch.trim().toLowerCase();
      if (!q) return ICON_GROUPS;
      const groups = [];
      for (const group of ICON_GROUPS) {
        const icons = group.icons.filter(icon =>
          icon.name.toLowerCase().includes(q) || icon.class.toLowerCase().includes(q)
        );
        if (icons.length) {
          groups.push({ label: group.label, icons });
        }
      }
      return groups;
    },
    // 全部分类路径，用于重名校验
    allPaths() {
      const paths = [];
      for (const node of this.tree) {
        paths.push(node.category.id);
        paths.push(...node.children.map(c => c.id));
      }
      return paths;
    }
  },
  async created() {
    await this.loadData();
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        await pullSettings();
        const data = await loadNavData();
        this.tree = data.tree;
        this.counts = data.counts;
        this.items = data.items;
        this.warning = '';
      } catch (error) {
        this.warning = '数据加载失败：' + error.message;
      } finally {
        this.loading = false;
      }
    },
    goHome(categoryId) {
      this.$router.push({ path: '/', query: { category: categoryId || undefined } });
    },
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
    },
    toggleDarkMode() {
      this.darkMode = toggleDarkMode();
    },
    validateName(name) {
      if (!name) return '分类名称不能为空';
      if (name.includes('/')) return '分类名称不能包含 /';
      return null;
    },
    // 找到分类所在的同级数组（一级或某个一级的 children）
    siblingsOf(cat) {
      const rootNode = this.tree.find(n => n.category.id === cat.id);
      if (rootNode) {
        return this.tree.map(n => n.category);
      }
      for (const n of this.tree) {
        if (n.children.some(c => c.id === cat.id)) {
          return n.children;
        }
      }
      return null;
    },
    async addRoot() {
      const name = this.newRootName.trim();
      const err = this.validateName(name);
      if (err) { alert(err); return; }
      if (this.allPaths.includes(name)) {
        alert('已存在同名分类');
        return;
      }
      try {
        await addCategoryPath(name, this.tree.length);
        this.newRootName = '';
        await this.loadData();
      } catch (error) {
        alert('添加失败：' + error.message);
      }
    },
    startAddChild(parent) {
      this.addingChildParent = parent.id;
      this.newChildName = '';
    },
    async confirmAddChild() {
      const name = this.newChildName.trim();
      const parent = this.allPaths.find(p => p === this.addingChildParent);
      if (!name || !parent) return;
      const err = this.validateName(name);
      if (err) { alert(err); return; }
      const childPath = `${parent}/${name}`;
      if (this.allPaths.includes(childPath)) {
        alert('同级下已存在同名分类');
        return;
      }
      const siblings = this.siblingsOf({ id: parent, parentId: null }) || [];
      try {
        await addCategoryPath(childPath, siblings.length);
        this.addingChildParent = null;
        this.newChildName = '';
        await this.loadData();
      } catch (error) {
        alert('添加失败：' + error.message);
      }
    },
    startRename(cat) {
      this.editingId = cat.id;
      this.editingName = cat.name;
    },
    async saveRename(cat) {
      const name = this.editingName.trim();
      const err = this.validateName(name);
      if (err) { alert(err); return; }
      const newPath = cat.parentId ? `${cat.parentId}/${name}` : name;
      if (newPath === cat.id) { this.editingId = null; return; }
      if (this.allPaths.includes(newPath)) {
        alert('已存在同名分类');
        return;
      }
      try {
        renameCategoryPath(cat.id, newPath);
        // 批量改写受影响网站的 category 字段
        const pairs = this.items
          .filter(i => i.category === cat.id || i.category.startsWith(cat.id + '/'))
          .map(i => ({ recordId: i.id, category: newPath + i.category.slice(cat.id.length) }));
        await rewriteSiteCategories(pairs);
        this.editingId = null;
        await this.loadData();
      } catch (error) {
        alert('改名失败：' + error.message);
      }
    },
    openIconPicker(cat) {
      this.iconPickerCat = cat;
      this.customIconClass = cat.icon || '';
      this.iconSearch = '';
    },
    async pickIcon(iconClass) {
      if (!this.iconPickerCat) return;
      try {
        setCategoryIcon(this.iconPickerCat.id, normalizeIconClass(iconClass));
        this.iconPickerCat = null;
        await this.loadData();
      } catch (error) {
        alert('图标设置失败：' + error.message);
      }
    },
    // 上移/下移：与相邻同级交换位置，order 重排为 0..n
    async move(cat, dir) {
      const siblings = this.siblingsOf(cat);
      if (!siblings) return;
      const idx = siblings.findIndex(c => c.id === cat.id);
      const target = idx + dir;
      if (target < 0 || target >= siblings.length) return;

      const reordered = [...siblings];
      [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
      try {
        setCategoryOrder(reordered.map(c => c.id));
        await this.loadData();
      } catch (error) {
        alert('排序失败：' + error.message);
      }
    },
    async remove(cat) {
      const node = this.tree.find(n => n.category.id === cat.id);
      if (node && node.children.length) {
        alert('该分类下存在子分类，请先删除子分类');
        return;
      }
      const count = this.counts[cat.id] || 0;
      const msg = count > 0
        ? `「${cat.name}」下有 ${count} 个网站，删除后这些网站将变为未分类。确定删除？`
        : `确定删除分类「${cat.name}」？`;
      if (!confirm(msg)) return;
      try {
        // 分类下的网站移入未分类（清空分类）
        const pairs = this.items
          .filter(i => i.category === cat.id)
          .map(i => ({ recordId: i.id, category: '' }));
        await rewriteSiteCategories(pairs);
        deleteCategoryPath(cat.id);
        await this.loadData();
      } catch (error) {
        alert('删除失败：' + error.message);
      }
    }
  }
};
</script>

<style scoped>
.action-link {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  font-size: 0.75rem;
  color: #6b7280;
  padding: 0.25rem 0.375rem;
  border-radius: 0.375rem;
  transition: color 0.2s ease, background-color 0.2s ease;
}
.action-link:hover {
  color: #2563eb;
  background-color: #eff6ff;
}
.dark .action-link {
  color: #9ca3af;
}
.dark .action-link:hover {
  color: #60a5fa;
  background-color: #374151;
}
</style>
