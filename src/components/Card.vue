<template>
  <a :href="item.url" target="_blank" 
     class="card-container flex flex-col bg-white dark:bg-gray-700 rounded-xl shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] border-2 border-transparent relative overflow-hidden">
    
    <div class="flex items-center p-3 sm:items-start sm:p-4">
      <img v-if="iconSrc && !iconFailed" :src="iconSrc" alt="icon" referrerpolicy="no-referrer" class="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 sm:mt-0.5 flex-shrink-0" @load="onIconLoad" @error="onIconError" />
      <span
        v-else
        class="site-icon-fallback w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 sm:mt-0.5 flex-shrink-0"
        :class="'tone-' + placeholderTone"
        aria-hidden="true"
      >{{ placeholderChar }}</span>
      <div class="flex-1 min-w-0">
        <h3 class="text-sm sm:text-base font-bold truncate">{{ item.name }}</h3>
        <p 
          class="desc-text text-xs text-gray-600 dark:text-gray-400"
          :title="item.description"
        >
          {{ item.description }}
        </p>
      </div>
    </div>
    
    <div v-if="previewState !== 'error'" v-show="showPreview" ref="previewArea" class="preview-area relative w-full flex-1 min-h-0 hidden sm:block overflow-hidden">
      <img
        v-if="previewSrc"
        :src="previewSrc"
        alt="preview"
        class="preview-image"
        @load="onPreviewLoad"
        @error="onPreviewError"
      />
      <div v-if="previewState === 'loading'" class="preview-overlay absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-600">
        <i class="fas fa-spinner fa-spin text-gray-400 dark:text-gray-500 text-2xl"></i>
      </div>
    </div>
    
    <div class="card-actions absolute top-1 right-1 flex items-center gap-1 z-10">
      <button 
        @click.prevent.stop="handleEdit"
        class="action-btn cursor-pointer text-gray-400 opacity-0 hover:opacity-100 hover:text-blue-500 transition-all duration-300 hidden sm:inline-flex"
        style="font-size: 14px; padding: 2px;"
      >
        <i class="fas fa-pen"></i>
      </button>
      <button 
        @click.prevent.stop="handleDelete"
        class="action-btn cursor-pointer text-gray-400 opacity-0 hover:opacity-100 hover:text-red-500 transition-all duration-300 hidden sm:inline-flex"
        style="font-size: 14px; padding: 2px;"
      >
        <i class="fas fa-trash-alt"></i>
      </button>
      <button 
        @click.prevent.stop="toggleFavorite" 
        class="action-btn cursor-pointer transition-all duration-300"
        :class="{
          'text-yellow-500 opacity-50': isFavorite,
          'text-gray-400 opacity-0 hover:opacity-100': !isFavorite
        }"
        style="font-size: 16px; padding: 2px;"
      >
        <i class="fas fa-star"></i>
      </button>
    </div>
  </a>
</template>

<style scoped>
.desc-text {
  display: none;
  overflow: hidden;
  line-height: 1.4;
  word-break: break-all;
}

@media (min-width: 640px) {
  .desc-text {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
}

.card-container:hover {
  animation: borderPulse 2s infinite;
}

@keyframes borderPulse {
  0% { border-color: rgba(216, 180, 254, 0.5); }
  50% { border-color: rgba(184, 61, 143, 0.8); }
  100% { border-color: rgba(216, 180, 254, 0.5); }
}

:global(.dark) .card-container:hover {
  animation: borderPulseDark 2s infinite;
}

@keyframes borderPulseDark {
  0% { border-color: rgba(147, 51, 234, 0.5); }
  50% { border-color: rgba(168, 85, 247, 0.8); }
  100% { border-color: rgba(147, 51, 234, 0.5); }
}

.action-btn {
  cursor: pointer;
  background: none;
  border: none;
  z-index: 10;
  position: relative;
}

.card-container:hover .card-actions .action-btn:not(.text-yellow-500) {
  opacity: 1 !important;
}

.preview-area {
  background: inherit;
}

.preview-image {
  width: 100%;
  height: 100%;
  margin-left: 15%;
  margin-top: 1%;
  transform: rotate(-3deg);
  transform-origin: top right;
  object-fit: cover;
  border: 1px solid #dadada;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

:global(.dark) .preview-image {
  border-color: #555;
}

.preview-overlay {
  z-index: 5;
}

/* 图标占位：首字母 + 域名色块（同一域名颜色固定） */
.site-icon-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  user-select: none;
}

@media (min-width: 640px) {
  .site-icon-fallback {
    font-size: 14px;
  }
}

.tone-0 { background-color: #475569; }
.tone-1 { background-color: #0f766e; }
.tone-2 { background-color: #b45309; }
.tone-3 { background-color: #9f1239; }
.tone-4 { background-color: #1d4ed8; }
.tone-5 { background-color: #3f6212; }
</style>

<script>
import { getPreviewUrl, isPreviewCached, markPreviewCached } from '../utils/previewCache';

let globalLoadQueue = [];
let isProcessingQueue = false;

function processQueue() {
  if (isProcessingQueue || globalLoadQueue.length === 0) return;
  isProcessingQueue = true;
  const item = globalLoadQueue.shift();
  item.callback();
  setTimeout(() => {
    isProcessingQueue = false;
    processQueue();
  }, 800);
}

function enqueueLoad(callback) {
  globalLoadQueue.push({ callback });
  processQueue();
}

// 图标获取策略（表格 icon 字段用同一个字段表达三种意图，不新增字段）：
// - 留空 = 自动获取
// - 填 URL = 优先使用；加载失败或尺寸无效时立即降级到自动链
// - 填 none / off（大小写不敏感）= 不显示图标，只显示首字母色块
//
// 自动链顺序：
// 1. 站点自身 /favicon.ico
// 2. 同源 /api/favicon 代理（部署了 EdgeOne / Cloudflare 函数时可用，会解析 HTML 图标声明）
// 3. favicon.im（服务端抓取页面，解析 link rel=icon / apple-touch-icon / manifest）
// 4. www 与裸域互换后的另一个 /favicon.ico
// 5. /apple-touch-icon.png
// 6. 首字母 + 域名色块占位
// 浏览器直连无法读取跨域 HTML（CORS），因此「解析 <link rel="icon">」交给同源代理或第三方服务。
const LEGACY_DEFAULT_ICON = '/default.ico';
const ICON_PROXY_PATH = '/api/favicon';
const ICON_DISABLED_VALUES = ['none', 'off'];
// 图片解码后宽或高小于该值（含 1×1 追踪像素）视为无效图标
const MIN_ICON_PX = 16;

// 手动图标的失败缓存只保留 10 分钟：改完表格后很快就能重新尝试，不必等自动链的指数退避
const MANUAL_ICON_FAIL_KEY = 'siteIconManualFailV1';
const MANUAL_ICON_FAIL_TTL = 10 * 60 * 1000;

let iconProxyPromise = null;
let iconProxyAvailable = false;
let iconProxyChecked = false;
let manualFailData = null;

function parseIconSetting(icon) {
  const raw = String(icon || '').trim();
  // 历史数据可能把默认图写进了 icon 字段，视为未配置
  if (!raw || raw === LEGACY_DEFAULT_ICON) return { mode: 'auto', url: '' };
  if (ICON_DISABLED_VALUES.includes(raw.toLowerCase())) return { mode: 'none', url: '' };
  return { mode: 'manual', url: raw };
}

function normalizeManualIcon(icon) {
  return parseIconSetting(icon).url;
}

function getManualFailCache() {
  if (!manualFailData) {
    try {
      manualFailData = JSON.parse(localStorage.getItem(MANUAL_ICON_FAIL_KEY)) || {};
    } catch (e) {
      manualFailData = {};
    }
  }
  return manualFailData;
}

function saveManualFailCache() {
  const now = Date.now();
  Object.keys(manualFailData).forEach((key) => {
    if (now - (manualFailData[key].at || 0) >= MANUAL_ICON_FAIL_TTL) {
      delete manualFailData[key];
    }
  });
  try {
    localStorage.setItem(MANUAL_ICON_FAIL_KEY, JSON.stringify(manualFailData));
  } catch (e) {
    // 存储不可用时忽略，不影响显示
  }
}

function isManualIconCoolingDown(url) {
  if (!url) return false;
  const entry = getManualFailCache()[url];
  return !!(entry && Date.now() - (entry.at || 0) < MANUAL_ICON_FAIL_TTL);
}

function rememberManualIconFailure(url) {
  if (!url) return;
  getManualFailCache()[url] = { at: Date.now() };
  saveManualFailCache();
}

function parseSite(url) {
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return { origins: [], hostname: '' };
    const host = u.hostname;
    const origins = [u.origin];
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
    if (!isIp && host !== 'localhost') {
      const altHost = /^www\./i.test(host) ? host.replace(/^www\./i, '') : `www.${host}`;
      origins.push(`${u.protocol}//${altHost}`);
    }
    return { origins, hostname: host.replace(/^www\./i, '') };
  } catch (e) {
    return { origins: [], hostname: '' };
  }
}

function iconProxyUrl(item) {
  const { origins } = parseSite(item.url);
  if (!origins[0]) return '';
  return `${ICON_PROXY_PATH}?url=${encodeURIComponent(origins[0])}`;
}

// 探测当前部署是否挂了 /api/favicon：fork 用户没部署函数时，请求会落到 index.html，
// content-type 不是 JSON，探测失败，图标链自动退回纯前端方案，不会报错或卡住。
function probeIconProxy() {
  if (iconProxyPromise) return iconProxyPromise;
  iconProxyPromise = fetch(`${ICON_PROXY_PATH}?probe=1`, { headers: { Accept: 'application/json' } })
    .then((res) => res.ok && (res.headers.get('content-type') || '').toLowerCase().includes('application/json'))
    .catch(() => false)
    .then((ok) => {
      iconProxyAvailable = ok;
      iconProxyChecked = true;
      return ok;
    });
  return iconProxyPromise;
}

function iconCandidates(item) {
  const list = [];
  const add = (value) => {
    if (value && !list.includes(value)) list.push(value);
  };
  const setting = parseIconSetting(item.icon);
  // none/off：完全不要图标，直接走字母占位
  if (setting.mode === 'none') return list;
  // 手动地址在 10 分钟失败窗口内先跳过，直接走自动链；窗口结束后会重新尝试
  if (setting.mode === 'manual' && !isManualIconCoolingDown(setting.url)) {
    add(setting.url);
  }
  const { origins, hostname } = parseSite(item.url);
  if (origins[0]) {
    add(`${origins[0]}/favicon.ico`);
    if (iconProxyAvailable) add(iconProxyUrl(item));
  }
  if (hostname) add(`https://favicon.im/${hostname}`);
  if (origins[1]) add(`${origins[1]}/favicon.ico`);
  if (origins[0]) add(`${origins[0]}/apple-touch-icon.png`);
  if (origins[1]) add(`${origins[1]}/apple-touch-icon.png`);
  return list;
}

// 探测在模块加载时就开始，尽量在第一批卡片创建前拿到结果
probeIconProxy();

// 图标解析缓存：成功缓存 30 天；失败按 6h → 7d 指数退避，避免每次打开都重跑失败链
const ICON_CACHE_KEY = 'siteIconCacheV2';
const LEGACY_ICON_CACHE_KEY = 'siteIconCache';
const ICON_OK_TTL = 30 * 24 * 60 * 60 * 1000;
const ICON_FAIL_BASE = 6 * 60 * 60 * 1000;
const ICON_FAIL_MAX = 7 * 24 * 60 * 60 * 1000;
const ICON_CACHE_LIMIT = 500;
const ICON_TIMEOUT = 10 * 1000;

let iconCacheData = null;
let legacyIconCache = null;

function getIconCache() {
  if (!iconCacheData) {
    try {
      iconCacheData = JSON.parse(localStorage.getItem(ICON_CACHE_KEY)) || {};
    } catch (e) {
      iconCacheData = {};
    }
  }
  return iconCacheData;
}

function saveIconCache() {
  const entries = Object.entries(iconCacheData);
  if (entries.length > ICON_CACHE_LIMIT) {
    entries.sort((a, b) => (a[1].at || 0) - (b[1].at || 0));
    for (let i = 0; i < entries.length - ICON_CACHE_LIMIT; i++) {
      delete iconCacheData[entries[i][0]];
    }
  }
  try {
    localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(iconCacheData));
  } catch (e) {
    // 存储满时放弃缓存，不影响显示
  }
}

// 兼容旧缓存（原始 icon URL → 已解析 URL），命中后自动迁移到新结构
function getLegacyIconCache() {
  if (!legacyIconCache) {
    try {
      legacyIconCache = JSON.parse(localStorage.getItem(LEGACY_ICON_CACHE_KEY)) || {};
    } catch (e) {
      legacyIconCache = {};
    }
  }
  return legacyIconCache;
}

// 缓存键包含网址与手动图标，编辑网址/图标后不会复用旧的失败结果
function iconCacheKey(item) {
  return `${item.id || item.url}|${item.url || ''}|${normalizeManualIcon(item.icon)}`;
}

function rememberIconSuccess(item, src) {
  const key = iconCacheKey(item);
  const cache = getIconCache();
  const prev = cache[key] || {};
  const now = Date.now();
  // TTL 内命中同一结果不重复写，避免每次加载都写 localStorage
  if (prev.src === src && prev.fail === 0 && now - (prev.at || 0) < ICON_OK_TTL) return;
  cache[key] = { src, at: now, fail: 0, nextAt: 0 };
  saveIconCache();
}

function rememberIconFailure(item) {
  const key = iconCacheKey(item);
  const cache = getIconCache();
  const prev = cache[key] || {};
  const fail = (prev.fail || 0) + 1;
  const now = Date.now();
  const delay = Math.min(ICON_FAIL_MAX, ICON_FAIL_BASE * Math.pow(2, fail - 1));
  cache[key] = { src: null, at: now, fail, nextAt: now + delay };
  saveIconCache();
}

function resolveInitialIcon(item) {
  const setting = parseIconSetting(item.icon);
  const candidates = iconCandidates(item);
  const now = Date.now();
  if (setting.mode === 'none') {
    return { candidates, src: null, step: 0, failed: true, disabled: true };
  }
  if (!candidates.length) {
    return { candidates, src: null, step: 0, failed: true };
  }
  // 手动地址可用时始终先试它：即使缓存里存的是上次自动链成功的结果，
  // 也要给用户新填/改好的地址一个机会；失败后再由 onIconError 自动降级。
  if (setting.mode === 'manual' && !isManualIconCoolingDown(setting.url)) {
    return { candidates, src: candidates[0], step: 1, failed: false };
  }
  const entry = getIconCache()[iconCacheKey(item)];
  if (entry) {
    if (entry.src && now - (entry.at || 0) < ICON_OK_TTL) {
      const idx = candidates.indexOf(entry.src);
      // 缓存里的地址已不在候选链（例如手动地址进入失败窗口），就从当前候选链从头开始
      if (idx >= 0) return { candidates, src: entry.src, step: idx + 1, failed: false };
      return { candidates, src: candidates[0], step: 1, failed: false };
    }
    // 失败退避期未到，直接显示占位，不再重抓
    if (!entry.src && entry.nextAt && entry.nextAt > now) {
      return { candidates, src: null, step: candidates.length, failed: true };
    }
  }
  const legacy = getLegacyIconCache()[normalizeManualIcon(item.icon)];
  if (legacy && candidates.includes(legacy)) {
    const idx = candidates.indexOf(legacy);
    return { candidates, src: legacy, step: idx + 1, failed: false };
  }
  return { candidates, src: candidates[0], step: 1, failed: false };
}

// 域名色块：同一域名始终同色
function siteTone(url) {
  const seed = parseSite(url).hostname || String(url || '');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return hash % 6;
}

export default {
  emits: ['favorite-changed', 'edit', 'delete'],
  props: ['item', 'showPreview'],
  data() {
    const iconState = resolveInitialIcon(this.item);
    return {
      favoriteItems: JSON.parse(localStorage.getItem('favoriteItems')) || [],
      previewState: 'idle',
      previewSrc: null,
      observer: null,
      iconCandidates: iconState.candidates,
      iconSrc: iconState.src,
      iconStep: iconState.step,
      iconFailed: iconState.failed,
      iconLoaded: false,
      iconTimer: null
    };
  },
  computed: {
    isFavorite() {
      return this.favoriteItems.includes(this.item.id);
    },
    placeholderChar() {
      const name = String(this.item.name || '').trim();
      return name ? Array.from(name)[0].toUpperCase() : '?';
    },
    placeholderTone() {
      return siteTone(this.item.url);
    }
  },
  mounted() {
    this.startIconTimer();
    // 探测晚于卡片创建时，把代理插到当前待试位置，后续失败会自动走到它
    if (!iconProxyChecked) {
      probeIconProxy().then((ok) => {
        if (ok) this.maybeAddProxyCandidate();
      });
    } else {
      this.maybeAddProxyCandidate();
    }
    if (this.showPreview) {
      this.setupLazyLoad();
    }
  },
  beforeUnmount() {
    this.clearIconTimer();
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  watch: {
    // 编辑后图标或网址可能变化，重新生成候选链
    'item.icon'() {
      this.resetIcon();
    },
    'item.url'() {
      this.resetIcon();
    },
    showPreview(val) {
      if (val) {
        this.$nextTick(() => {
          this.setupLazyLoad();
        });
      } else {
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }
        this.previewState = 'idle';
        this.previewSrc = null;
      }
    }
  },
  methods: {
    resetIcon() {
      const state = resolveInitialIcon(this.item);
      this.iconCandidates = state.candidates;
      this.iconSrc = state.src;
      this.iconStep = state.step;
      this.iconFailed = state.failed;
      this.iconLoaded = false;
      this.startIconTimer();
    },
    // <img> 本身没有超时控制，用看门狗避免单级请求一直挂起
    startIconTimer() {
      this.clearIconTimer();
      if (!this.iconSrc || this.iconFailed || this.iconLoaded) return;
      this.iconTimer = setTimeout(() => {
        this.iconTimer = null;
        this.onIconError();
      }, ICON_TIMEOUT);
    },
    clearIconTimer() {
      if (this.iconTimer) {
        clearTimeout(this.iconTimer);
        this.iconTimer = null;
      }
    },
    maybeAddProxyCandidate() {
      const proxy = iconProxyUrl(this.item);
      if (!proxy || this.iconCandidates.includes(proxy)) return;
      this.iconCandidates.splice(this.iconStep, 0, proxy);
    },
    onIconError() {
      this.clearIconTimer();
      // 手动地址失败：只记 10 分钟短缓存，然后立刻降级到自动链
      const manualUrl = normalizeManualIcon(this.item.icon);
      if (this.iconSrc && this.iconSrc === manualUrl) {
        rememberManualIconFailure(manualUrl);
      }
      this.maybeAddProxyCandidate();
      while (this.iconStep < this.iconCandidates.length) {
        const next = this.iconCandidates[this.iconStep++];
        if (next && next !== this.iconSrc) {
          this.iconFailed = false;
          this.iconSrc = next;
          this.startIconTimer();
          return;
        }
      }
      this.iconFailed = true;
      this.iconSrc = null;
      // 自动链整体失败才进入指数退避，手动地址的失败不会拖慢自动链
      rememberIconFailure(this.item);
    },
    onIconLoad(event) {
      this.clearIconTimer();
      const img = event && event.target;
      const width = img ? img.naturalWidth : 0;
      const height = img ? img.naturalHeight : 0;
      // 「加载成功但内容无效」：1×1 追踪像素或宽高 < 16px，按失败处理并继续降级。
      // 部分 SVG 没有固有尺寸（0×0），无法判断时按有效处理。
      if (width > 0 && height > 0 && (width < MIN_ICON_PX || height < MIN_ICON_PX)) {
        this.onIconError();
        return;
      }
      this.iconLoaded = true;
      if (!this.iconSrc || this.iconFailed) return;
      rememberIconSuccess(this.item, this.iconSrc);
    },
    setupLazyLoad() {
      const previewArea = this.$refs.previewArea;
      if (!previewArea) return;
      
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.observer.disconnect();
            if (isPreviewCached(this.item.url)) {
              this.previewSrc = getPreviewUrl(this.item.url);
              this.previewState = 'loading';
            } else {
              enqueueLoad(() => {
                this.previewSrc = getPreviewUrl(this.item.url);
                this.previewState = 'loading';
              });
            }
          }
        });
      }, {
        rootMargin: '200px'
      });
      
      this.observer.observe(previewArea);
    },
    onPreviewLoad() {
      this.previewState = 'loaded';
      markPreviewCached(this.item.url);
    },
    onPreviewError() {
      this.previewState = 'error';
      this.previewSrc = null;
    },
    toggleFavorite() {
      let favorites = JSON.parse(localStorage.getItem('favoriteItems')) || [];
      const itemId = this.item.id;
      
      if (favorites.includes(itemId)) {
        favorites = favorites.filter(id => id !== itemId);
      } else {
        favorites.push(itemId);
      }
      
      localStorage.setItem('favoriteItems', JSON.stringify(favorites));
      this.favoriteItems = favorites;
      
      this.$emit('favorite-changed');
    },
    handleEdit() {
      this.$emit('edit', this.item);
    },
    handleDelete() {
      this.$emit('delete', this.item);
    }
  }
};
</script>
