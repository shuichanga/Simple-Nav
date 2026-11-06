<template>
  <div class="h-screen flex flex-col">
    <div class="flex flex-1 overflow-hidden relative">
      <main class="flex-1 flex flex-col p-4 overflow-y-auto">
        <div class="flex-grow">
          <div class="max-w-4xl mx-auto space-y-8">
            <h2 
              class="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-8 text-center hover:text-purple-800 dark:hover:text-purple-300 transition-colors cursor-pointer"
              @click="$router.push('/')"
            >
              系统设置
            </h2>
            
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 class="text-xl font-semibold mb-4 flex items-center">
                <i class="fas fa-palette text-blue-500 mr-2"></i>
                界面外观
              </h3>
              
              <div class="mb-8">
                <h4 class="text-lg font-medium mb-4">主题风格</h4>
                <div class="grid grid-cols-2 gap-4">
                  <button
                    v-for="t in themes"
                    :key="t.key"
                    @click="changeTheme(t.key)"
                    class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all cursor-pointer"
                    :class="currentTheme === t.key ? 'border-blue-500 scale-105 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'"
                  >
                    <i :class="'fas ' + t.icon" class="text-2xl" :style="t.key === 'glass' ? 'color: #818cf8' : ''"></i>
                    <span class="text-sm font-medium">{{ t.label }}</span>
                  </button>
                </div>
              </div>
              
              <div class="mb-8">
                <h4 class="text-lg font-medium mb-4">背景预设</h4>
                <div class="grid grid-cols-3 md:grid-cols-4 gap-4">
                  <div 
                    v-for="preset in backgroundPresets" 
                    :key="preset.value"
                    class="h-20 rounded-lg cursor-pointer border-2 transition-all"
                    :class="{ 'border-blue-500 scale-105': selectedBg === preset.value }"
                    :style="{ background: preset.value }"
                    :title="preset.label"
                    @click="changeBackground(preset.value)"
                  ></div>
                </div>
              </div>
              
              <div class="mb-8">
                <h4 class="text-lg font-medium mb-4">自定义颜色</h4>
                <div class="space-y-4">
                  <div class="flex items-center gap-4">
                    <label class="text-sm text-gray-600 dark:text-gray-400 w-16">起始色</label>
                    <input 
                      type="color"
                      v-model="gradientStart"
                      class="w-12 h-10 rounded cursor-pointer"
                    >
                    <input 
                      type="text" 
                      v-model="gradientStart"
                      class="w-28 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 text-sm"
                    >
                  </div>
                  <div class="flex items-center gap-4">
                    <label class="text-sm text-gray-600 dark:text-gray-400 w-16">结束色</label>
                    <input 
                      type="color"
                      v-model="gradientEnd"
                      class="w-12 h-10 rounded cursor-pointer"
                    >
                    <input 
                      type="text" 
                      v-model="gradientEnd"
                      class="w-28 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 text-sm"
                    >
                  </div>
                  <div class="flex items-center gap-4">
                    <label class="text-sm text-gray-600 dark:text-gray-400 w-16">方向</label>
                    <select v-model="gradientDirection" class="bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 text-sm">
                      <option value="135deg">左上→右下</option>
                      <option value="45deg">左下→右上</option>
                      <option value="90deg">左→右</option>
                      <option value="180deg">上→下</option>
                      <option value="to right">水平</option>
                    </select>
                  </div>
                  <div class="flex items-center gap-4">
                    <div class="h-12 flex-1 rounded-lg border" :style="{ background: gradientPreview }"></div>
                    <button 
                      @click="applyGradient"
                      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      应用渐变
                    </button>
                  </div>
                  <p class="text-xs text-gray-400">提示：起始色和结束色相同时为纯色背景</p>
                </div>
              </div>
              
              <div>
                <h4 class="text-lg font-medium mb-4">自定义背景图</h4>
                <div class="flex items-center gap-4">
                  <input
                    type="url"
                    v-model="backgroundImage"
                    placeholder="输入在线图片URL (支持jpg/png/svg)"
                    class="flex-1 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2"
                    @keyup.enter="applyBackgroundImage"
                  >
                  <button
                    @click="applyBackgroundImage"
                    class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    应用
                  </button>
                </div>
                <p class="text-sm text-gray-500 mt-2">
                  提示：建议使用高分辨率图片（1920x1080以上）
                </p>
              </div>
            </div>
            
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 class="text-xl font-semibold mb-4 flex items-center">
                <i class="fas fa-key text-purple-500 mr-2"></i>
                数据源配置
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API密钥</label>
                  <input 
                    type="password"
                    v-model="apiKey"
                    placeholder="请输入维基云表格API密钥"
                    class="w-full bg-gray-100 dark:bg-gray-700 rounded px-3 py-2"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">表格ID (datasheetId)</label>
                  <input 
                    type="text"
                    v-model="datasheetId"
                    placeholder="请输入维基云表格ID"
                    class="w-full bg-gray-100 dark:bg-gray-700 rounded px-3 py-2"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">视图ID (viewId)</label>
                  <input
                    type="text"
                    v-model="viewId"
                    placeholder="请输入表格视图ID"
                    class="w-full bg-gray-100 dark:bg-gray-700 rounded px-3 py-2"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">设置表ID (settingsDatasheetId，跨设备同步设置)</label>
                  <input
                    type="text"
                    v-model="settingsDatasheetId"
                    placeholder="设置表的 datasheetId，留空则不同步"
                    class="w-full bg-gray-100 dark:bg-gray-700 rounded px-3 py-2"
                  >
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    需手动在维基云创建设置表（含 key / value 两个文本字段），将 ID 填入此处。同步范围：主题、背景、布局、预览开关、分类层级/图标/排序（深色模式跟随各设备本地）。
                  </p>
                </div>
                <div class="flex gap-4">
                  <button
                    @click="saveApiConfig"
                    class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                  >
                    保存配置
                  </button>
                  <button
                    @click="resetApiConfig"
                    class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded"
                  >
                    重置
                  </button>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                 <li> 配置说明：登录维基云表格，在「设置」-「API」中获取API密钥；表格ID和视图ID可在表格URL中找到。</li>
                 <li> 环境变量配置：除了在页面上配置外，还可以通过环境变量进行配置，优先级：本地存储 > 环境变量（页面上保存过的配置优先生效）。</li>
                </p>
              </div>
            </div>
            
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 class="text-xl font-semibold mb-4 flex items-center">
                <i class="fas fa-th-large text-green-500 mr-2"></i>
                布局设置
              </h3>
              <div class="flex items-center gap-4">
                <label class="text-gray-700 dark:text-gray-300">每行显示：</label>
                <select 
                  v-model.number="columns" 
                  class="bg-gray-100 dark:bg-gray-700 rounded px-3 py-2"
                  @change="saveSettings"
                >
                  <option v-for="n in [3,4,5,6,7,8]" :key="n" :value="n">{{ n }} 列</option>
                </select>
              </div>
            </div>
            
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 class="text-xl font-semibold mb-4 flex items-center">
                <i class="fas fa-heading text-purple-500 mr-2"></i>
                站点信息
              </h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">网站标题（侧边栏与浏览器标签页）</label>
                  <input
                    type="text"
                    v-model="siteTitle"
                    placeholder="Simple NAV"
                    class="w-full bg-gray-100 dark:bg-gray-700 rounded px-3 py-2"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">副标题（顶部导航）</label>
                  <input
                    type="text"
                    v-model="siteSubtitle"
                    placeholder="少即是多"
                    class="w-full bg-gray-100 dark:bg-gray-700 rounded px-3 py-2"
                  >
                </div>
                <button
                  @click="saveSiteInfo"
                  class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                >
                  保存站点信息
                </button>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 class="text-xl font-semibold mb-4 flex items-center">
                <i class="fas fa-exchange-alt text-green-500 mr-2"></i>
                配置导入导出
              </h3>
              <div class="space-y-4">
                <div>
                  <h4 class="text-lg font-medium mb-2">选择要导入/导出的配置项：</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label class="flex items-center gap-2">
                      <input v-model="exportOptions.theme" type="checkbox" class="rounded text-blue-500">
                      <span class="text-sm text-gray-700 dark:text-gray-300">主题设置</span>
                    </label>
                    <label class="flex items-center gap-2">
                      <input v-model="exportOptions.columns" type="checkbox" class="rounded text-blue-500">
                      <span class="text-sm text-gray-700 dark:text-gray-300">布局列数</span>
                    </label>
                    <label class="flex items-center gap-2">
                      <input v-model="exportOptions.background" type="checkbox" class="rounded text-blue-500">
                      <span class="text-sm text-gray-700 dark:text-gray-300">背景设置</span>
                    </label>
                    <label class="flex items-center gap-2">
                      <input v-model="exportOptions.categoryIcons" type="checkbox" class="rounded text-blue-500">
                      <span class="text-sm text-gray-700 dark:text-gray-300">分类图标</span>
                    </label>
                    <label class="flex items-center gap-2">
                      <input v-model="exportOptions.apiConfig" type="checkbox" class="rounded text-blue-500">
                      <span class="text-sm text-gray-700 dark:text-gray-300">API配置</span>
                    </label>
                  </div>
                </div>
                
                <div class="flex gap-4">
                  <button
                    @click="exportConfig"
                    class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded"
                  >
                    <i class="fas fa-download mr-2"></i>导出配置
                  </button>
                  
                  <div class="relative">
                    <input
                      type="file"
                      ref="fileInput"
                      accept=".json"
                      class="absolute inset-0 opacity-0 cursor-pointer"
                      @change="importConfig"
                    >
                    <button
                      class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
                    >
                      <i class="fas fa-upload mr-2"></i>导入配置
                    </button>
                  </div>
                </div>
                
                <div v-if="importMessage" class="p-3 rounded-lg" :class="importMessageType === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'">
                  <i :class="importMessageType === 'success' ? 'fas fa-check-circle mr-2' : 'fas fa-exclamation-circle mr-2'"></i>
                  {{ importMessage }}
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 class="text-xl font-semibold mb-4 flex items-center">
                <i class="fas fa-sitemap text-blue-500 mr-2"></i>
                分类管理
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                维护分类层级（一级/二级）、排序与图标。二级分类以「一级/二级」形式写入网站的分类字段，无需额外配置。
              </p>
              <router-link
                to="/manage-categories"
                class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
              >
                <i class="fas fa-arrow-right mr-2"></i>前往分类管理
              </router-link>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 class="text-xl font-semibold mb-4 flex items-center">
                <i class="fas fa-image text-blue-500 mr-2"></i>
                图标巡检
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                检查表格中手动填写的图标地址，列出失效清单。只读操作，不会修改维基云数据。
                图标字段留空表示自动获取；填 none / off 表示不显示图标。
              </p>
              <div class="flex flex-wrap gap-4 items-center">
                <button
                  @click="runIconAudit"
                  :disabled="iconAuditLoading"
                  class="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2 rounded"
                >
                  <i class="fas fa-search mr-2"></i>{{ iconAuditLoading ? '巡检中…' : '扫描手动图标' }}
                </button>
                <span v-if="iconAuditProgress" class="text-sm text-gray-500 dark:text-gray-400">
                  <i class="fas fa-spinner fa-spin mr-2"></i>{{ iconAuditProgress }}
                </span>
              </div>

              <div v-if="iconAuditMessage" class="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                <i class="fas fa-exclamation-circle mr-2"></i>{{ iconAuditMessage }}
              </div>

              <div v-if="iconAuditResult" class="icon-audit-result">
                <p class="icon-audit-summary">
                  共 {{ iconAuditResult.total }} 个网站，检查 {{ iconAuditResult.checked }} 个手动图标，发现
                  {{ iconAuditResult.invalid.length }} 个失效；其余 {{ iconAuditResult.skipped }} 个未配置手动图标。
                </p>
                <table v-if="iconAuditResult.invalid.length" class="icon-audit-table">
                  <thead>
                    <tr>
                      <th class="icon-audit-check">
                        <input
                          type="checkbox"
                          :checked="allIconAuditSelected"
                          aria-label="全选失效图标"
                          @change="toggleSelectAllIconAudit"
                        />
                      </th>
                      <th>记录名</th>
                      <th>原地址</th>
                      <th>失败原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in iconAuditResult.invalid" :key="row.id + row.icon">
                      <td class="icon-audit-check">
                        <input
                          type="checkbox"
                          :value="row.id"
                          v-model="iconAuditSelected"
                          :aria-label="'选择 ' + row.name"
                        />
                      </td>
                      <td>
                        {{ row.name }}
                        <span v-if="iconAuditClearedIds.includes(row.id)" class="icon-audit-cleared">已清理</span>
                      </td>
                      <td class="icon-audit-url">{{ row.icon }}</td>
                      <td>{{ row.detail }}</td>
                    </tr>
                  </tbody>
                </table>
                <p v-else class="icon-audit-empty">未发现失效的手动图标。</p>

                <div v-if="iconAuditResult.invalid.length" class="icon-audit-actions">
                  <p class="icon-audit-selected">
                    已选择 {{ iconAuditSelectedCount }} / {{ iconAuditResult.invalid.length }} 条。
                    清理会把这些记录的 icon 写成空字符串（回到自动获取）；none / off 不会出现在清单里。
                  </p>
                  <button
                    @click="startIconAuditTrial"
                    :disabled="iconAuditClearing || iconAuditSelectedCount === 0"
                    class="icon-audit-btn icon-audit-btn-primary"
                  >
                    <i class="fas fa-download mr-2"></i>
                    备份并试写前 {{ iconAuditTrialSize }} 条
                  </button>

                  <div v-if="iconAuditTrial" class="icon-audit-trial">
                    <p class="icon-audit-trial-result">
                      试写结果：成功 {{ iconAuditTrial.done }} 条{{ iconAuditTrial.failed ? `，失败 ${iconAuditTrial.failed} 条` : '' }}。
                      <span v-if="iconAuditTrial.error">最后错误：{{ iconAuditTrial.error }}</span>
                    </p>
                    <label class="icon-audit-confirm">
                      <input type="checkbox" v-model="iconAuditTrialConfirmed" />
                      我已核对试写结果，确认继续全量清理
                    </label>
                    <button
                      @click="runIconAuditFullClear"
                      :disabled="iconAuditClearing || !iconAuditTrialConfirmed || iconAuditRemainingCount === 0"
                      class="icon-audit-btn icon-audit-btn-danger"
                    >
                      <i class="fas fa-eraser mr-2"></i>
                      确认全量清理剩余 {{ iconAuditRemainingCount }} 条
                    </button>
                  </div>

                  <p v-if="iconAuditClearProgress" class="icon-audit-progress">
                    <i class="fas fa-spinner fa-spin mr-2"></i>{{ iconAuditClearProgress }}
                  </p>

                  <div
                    v-if="iconAuditClearMessage"
                    class="icon-audit-clear-message"
                    :class="'is-' + iconAuditClearMessageType"
                  >
                    {{ iconAuditClearMessage }}
                  </div>
                </div>

                <button v-if="iconAuditResult.invalid.length" @click="copyIconAuditReport" class="icon-audit-copy">
                  <i class="fas fa-copy mr-2"></i>复制清单
                </button>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 class="text-xl font-semibold mb-4 flex items-center">
                <i class="fas fa-database text-red-500 mr-2"></i>
                数据备份
              </h3>
              <div class="space-y-4">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  完整备份包含全部网站数据、收藏和偏好设置。恢复时按记录 ID 合并到维基云（已存在的更新、缺失的新增，不会删除现有记录），执行前需确认。
                </p>
                <div class="flex flex-wrap gap-4">
                  <button
                    @click="exportBackup"
                    :disabled="backupLoading"
                    class="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-6 py-2 rounded"
                  >
                    <i class="fas fa-download mr-2"></i>导出完整备份
                  </button>
                  <div class="relative">
                    <input
                      type="file"
                      ref="backupFileInput"
                      accept=".json"
                      class="absolute inset-0 opacity-0 cursor-pointer"
                      @change="restoreBackup"
                    >
                    <button
                      :disabled="backupLoading"
                      class="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2 rounded"
                    >
                      <i class="fas fa-upload mr-2"></i>从备份文件恢复
                    </button>
                  </div>
                </div>
                <div v-if="backupLoading" class="text-sm text-gray-500 dark:text-gray-400">
                  <i class="fas fa-spinner fa-spin mr-2"></i>{{ backupProgress }}
                </div>
                <div v-if="backupMessage" class="p-3 rounded-lg" :class="backupMessageType === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'">
                  <i :class="backupMessageType === 'success' ? 'fas fa-check-circle mr-2' : 'fas fa-exclamation-circle mr-2'"></i>
                  {{ backupMessage }}
                </div>
                <div>
                  <h4 class="text-base font-medium mb-2">本地自动快照（滚动保留最近 3 份，浏览或修改数据后自动生成）：</h4>
                  <div v-if="snapshots.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
                    暂无快照
                  </div>
                  <div
                    v-for="snap in snapshots"
                    :key="snap.date"
                    class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700"
                  >
                    <span class="text-sm text-gray-600 dark:text-gray-300">
                      {{ formatSnapshotDate(snap.date) }} · {{ snap.count }} 个网站
                    </span>
                    <button
                      @click="restoreSnapshot(snap)"
                      :disabled="backupLoading"
                      class="text-sm text-blue-500 hover:text-blue-700 disabled:opacity-50"
                    >
                      恢复此快照
                    </button>
                  </div>
                </div>
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
import Footer from '../components/Footer.vue'
import { fetchData, batchUpdateWebsiteRecords } from '../api/fetchData'
import { auditManualIcons, getManualIconUrl } from '../utils/iconAudit'
import { THEMES, getTheme, setTheme, applyTheme, getDarkMode, getThemeBackground, setThemeBackground, getThemeBackgroundImage, setThemeBackgroundImage, applyBackground } from '../utils/theme'
import { buildBackup, downloadBackup, saveSnapshot, getSnapshots, restoreFromBackup } from '../utils/backup'
import { scheduleSettingsSync, applySiteMeta, getSiteTitle, getSiteSubtitle, getSettingsDatasheetId } from '../api/settingsApi'

export default {
  components: { Footer },
  data() {
    const theme = getTheme()
    const savedBg = getThemeBackground(theme)
    return {
      currentTheme: theme,
      themes: THEMES,
      gradientStart: savedBg || '#ffffff',
      gradientEnd: savedBg || '#ffffff',
      gradientDirection: '135deg',
      backgroundImage: getThemeBackgroundImage(theme),
      backgroundPresets: [
        { label: '纯白', value: '#ffffff' },
        { label: '浅灰', value: '#f3f4f6' },
        { label: '暖黄', value: '#fef3c7' },
        { label: '浅绿', value: '#f0fdf4' },
        { label: '冷灰蓝', value: '#bfc9df' },
        { label: '淡彩渐变', value: 'linear-gradient(135deg, #e0e7ff, #fce7f3, #e0f2fe)' },
        { label: '暖阳渐变', value: 'linear-gradient(135deg, #fef3c7, #fed7aa, #fecaca)' },
        { label: '薄荷渐变', value: 'linear-gradient(135deg, #d1fae5, #a7f3d0, #6ee7b7)' },
        { label: '深海渐变', value: 'linear-gradient(135deg, #0f172a, #1e3a5f, #1e1b4b)' },
        { label: '暗夜渐变', value: 'linear-gradient(135deg, #0c1222, #1a1a2e, #0d1117)' },
        { label: '极光渐变', value: 'linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95)' },
        { label: '暮色渐变', value: 'linear-gradient(135deg, #1e3a5f, #3b1f5e, #1a1a2e)' },
      ],
      selectedBg: savedBg,
      columns: parseInt(localStorage.getItem('columns')) || 5,
      // 数据源配置只显示本地存储的值；未在页面上配置时输入框留空（此时由环境变量生效，但不回显）
      apiKey: localStorage.getItem('apiKey') || '',
      datasheetId: localStorage.getItem('datasheetId') || '',
      viewId: localStorage.getItem('viewId') || '',
      settingsDatasheetId: localStorage.getItem('settingsDatasheetId') || '',
      siteTitle: getSiteTitle(),
      siteSubtitle: getSiteSubtitle(),
      exportOptions: {
        theme: true,
        columns: true,
        background: true,
        categoryIcons: true,
        apiConfig: false
      },
      importMessage: '',
      importMessageType: '',
      backupLoading: false,
      backupProgress: '',
      backupMessage: '',
      backupMessageType: '',
      snapshots: getSnapshots(),
      iconAuditLoading: false,
      iconAuditProgress: '',
      iconAuditMessage: '',
      iconAuditResult: null,
      iconAuditSelected: [],
      iconAuditClearing: false,
      iconAuditClearProgress: '',
      iconAuditClearMessage: '',
      iconAuditClearMessageType: 'success',
      iconAuditTrial: null,
      iconAuditTrialConfirmed: false,
      iconAuditClearedIds: []
    }
  },
  computed: {
    gradientPreview() {
      return `linear-gradient(${this.gradientDirection}, ${this.gradientStart}, ${this.gradientEnd})`
    },
    selectedIconAuditRows() {
      if (!this.iconAuditResult) return [];
      const selected = this.iconAuditSelected;
      return this.iconAuditResult.invalid.filter(row => selected.includes(row.id));
    },
    iconAuditSelectedCount() {
      return this.selectedIconAuditRows.length;
    },
    iconAuditTrialSize() {
      return Math.min(5, this.iconAuditSelectedCount);
    },
    iconAuditRemainingRows() {
      return this.selectedIconAuditRows.filter(row => !this.iconAuditClearedIds.includes(row.id));
    },
    iconAuditRemainingCount() {
      return this.iconAuditRemainingRows.length;
    },
    allIconAuditSelected() {
      if (!this.iconAuditResult || !this.iconAuditResult.invalid.length) return false;
      return this.iconAuditSelectedCount === this.iconAuditResult.invalid.length;
    }
  },
  methods: {
    changeTheme(themeKey) {
      this.currentTheme = themeKey;
      setTheme(themeKey);
      
      const bg = getThemeBackground(themeKey)
      const bgImage = getThemeBackgroundImage(themeKey)
      this.selectedBg = bg
      this.gradientStart = bg || '#ffffff'
      this.gradientEnd = bg || '#ffffff'
      this.backgroundImage = bgImage
    },
    exportConfig() {
      try {
        const config = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          settings: {}
        };
        
        if (this.exportOptions.theme) {
          config.settings.theme = localStorage.getItem('theme');
        }
        
        if (this.exportOptions.columns) {
          config.settings.columns = localStorage.getItem('columns');
        }
        
        if (this.exportOptions.background) {
          config.settings.backgrounds = {};
          for (const { key } of THEMES) {
            const bg = getThemeBackground(key);
            const bgImage = getThemeBackgroundImage(key);
            if (bg || bgImage) {
              config.settings.backgrounds[key] = { background: bg, backgroundImage: bgImage };
            }
          }
        }
        
        if (this.exportOptions.categoryIcons) {
          config.settings.categoryIcons = JSON.parse(localStorage.getItem('categoryIcons') || '{}');
        }
        
        if (this.exportOptions.apiConfig) {
          config.settings.apiKey = localStorage.getItem('apiKey');
          config.settings.datasheetId = localStorage.getItem('datasheetId');
          config.settings.viewId = localStorage.getItem('viewId');
        }
        
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nav-settings-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (error) {
        this.importMessage = '导出配置失败，请重试';
        this.importMessageType = 'error';
        setTimeout(() => {
          this.importMessage = '';
        }, 3000);
      }
    },
    
    importConfig(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result);
          if (!config.settings) {
            throw new Error('无效的配置文件格式');
          }
          
          const { settings } = config;
          
          if (settings.theme !== undefined) {
            localStorage.setItem('theme', settings.theme);
            this.currentTheme = settings.theme;
            applyTheme(settings.theme, getDarkMode());
          }

          if (settings.columns) {
            localStorage.setItem('columns', settings.columns);
            this.columns = parseInt(settings.columns);
          }

          if (settings.backgrounds) {
            for (const [theme, val] of Object.entries(settings.backgrounds)) {
              setThemeBackground(theme, val.background || '');
              setThemeBackgroundImage(theme, val.backgroundImage || '');
            }
          }
          
          if (settings.categoryIcons) {
            localStorage.setItem('categoryIcons', JSON.stringify(settings.categoryIcons));
          }
          if (settings.categoryList) {
            localStorage.setItem('categoryList', JSON.stringify(settings.categoryList));
          }
          if (settings.categoryOrder) {
            localStorage.setItem('categoryOrder', JSON.stringify(settings.categoryOrder));
          }
          
          if (settings.apiKey) {
            localStorage.setItem('apiKey', settings.apiKey);
            this.apiKey = settings.apiKey;
          }
          
          if (settings.datasheetId) {
            localStorage.setItem('datasheetId', settings.datasheetId);
            this.datasheetId = settings.datasheetId;
          }
          
          if (settings.viewId) {
            localStorage.setItem('viewId', settings.viewId);
            this.viewId = settings.viewId;
          }

          applyBackground(getTheme(), getDarkMode());
          scheduleSettingsSync();

          this.importMessage = '配置导入成功！页面将刷新以应用新配置';
          this.importMessageType = 'success';
          
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } catch (error) {
          this.importMessage = '导入配置失败，请检查文件格式';
          this.importMessageType = 'error';
          setTimeout(() => {
            this.importMessage = '';
          }, 3000);
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    },
    applyGradient() {
      const value = `linear-gradient(${this.gradientDirection}, ${this.gradientStart}, ${this.gradientEnd})`
      this.changeBackground(value)
    },
    
    applyBackgroundImage() {
      const imageRegex = /\.(jpeg|jpg|png|svg)(\?.*)?$/i
      if (imageRegex.test(this.backgroundImage)) {
        setThemeBackground(this.currentTheme, '')
        setThemeBackgroundImage(this.currentTheme, this.backgroundImage)
        this.selectedBg = ''
        applyBackground(this.currentTheme, getDarkMode())
      } else {
        alert('请输入有效的图片URL，支持jpg/png/svg格式')
      }
    },
    
    changeBackground(value) {
      this.selectedBg = value
      setThemeBackground(this.currentTheme, value)
      setThemeBackgroundImage(this.currentTheme, '')
      applyBackground(this.currentTheme, getDarkMode())
    },
    saveSettings() {
      // 列数跟随各设备屏幕，仅存本地，不参与设置表同步
      localStorage.setItem('columns', this.columns)
    },
    saveSiteInfo() {
      localStorage.setItem('siteTitle', this.siteTitle.trim());
      localStorage.setItem('siteSubtitle', this.siteSubtitle.trim());
      applySiteMeta();
      scheduleSettingsSync();
      alert('站点信息已保存');
    },
    saveApiConfig() {
      if (!this.apiKey.trim() || !this.datasheetId.trim() || !this.viewId.trim()) {
        alert('请填写完整的API配置信息');
        return;
      }

      localStorage.setItem('apiKey', this.apiKey);
      localStorage.setItem('datasheetId', this.datasheetId);
      localStorage.setItem('viewId', this.viewId);
      localStorage.setItem('settingsDatasheetId', this.settingsDatasheetId.trim());

      alert('API配置已保存，页面将刷新以应用新配置');
      window.location.reload();
    },
    resetApiConfig() {
      this.apiKey = '';
      this.datasheetId = '';
      this.viewId = '';
      this.settingsDatasheetId = '';

      localStorage.removeItem('apiKey');
      localStorage.removeItem('datasheetId');
      localStorage.removeItem('viewId');
      localStorage.removeItem('settingsDatasheetId');

      alert('API配置已重置');
    },

    // 只读巡检：拉取全部网站记录，检查手填的图标地址，不做任何写回
    async runIconAudit() {
      if (this.iconAuditLoading) return;
      this.iconAuditLoading = true;
      this.iconAuditMessage = '';
      this.iconAuditResult = null;
      this.iconAuditProgress = '正在获取网站数据...';

      try {
        const items = await fetchData();
        this.iconAuditResult = await auditManualIcons(items, {
          concurrency: 4,
          onProgress: (done, total) => {
            this.iconAuditProgress = `正在检查手动图标 ${done}/${total}...`;
          }
        });
        // 默认全选，用户可取消勾选；每次重新扫描都重置试写与清理状态
        this.iconAuditSelected = this.iconAuditResult.invalid.map(row => row.id);
        this.iconAuditClearedIds = [];
        this.iconAuditTrial = null;
        this.iconAuditTrialConfirmed = false;
        this.iconAuditClearMessage = '';
        this.iconAuditClearMessageType = 'success';
      } catch (error) {
        this.iconAuditMessage = '巡检失败：' + error.message;
      } finally {
        this.iconAuditLoading = false;
        this.iconAuditProgress = '';
      }
    },

    copyIconAuditReport() {
      if (!this.iconAuditResult || !this.iconAuditResult.invalid.length) return;
      const lines = ['记录名\t原地址\t失败原因'];
      for (const row of this.iconAuditResult.invalid) {
        lines.push(`${row.name}\t${row.icon}\t${row.detail}`);
      }
      const text = lines.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => alert('清单已复制到剪贴板'))
          .catch(() => this.fallbackCopyIconAudit(text));
      } else {
        this.fallbackCopyIconAudit(text);
      }
    },

    fallbackCopyIconAudit(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        alert('清单已复制到剪贴板');
      } catch (e) {
        alert('复制失败，请手动选择表格内容');
      }
      document.body.removeChild(textarea);
    },

    toggleSelectAllIconAudit(event) {
      if (!this.iconAuditResult) return;
      this.iconAuditSelected = event.target.checked
        ? this.iconAuditResult.invalid.map(row => row.id)
        : [];
    },

    // 执行前备份：导出记录名与 icon 原值，供用户留存/回滚
    downloadIconAuditBackup(rows) {
      const payload = {
        type: 'icon-audit-backup',
        exportedAt: new Date().toISOString(),
        items: rows.map(row => ({
          recordId: row.id,
          name: row.name,
          url: row.siteUrl,
          icon: row.icon
        }))
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `icon-audit-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },

    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    // 429 / 5xx 按 1s → 2s → 4s 退避；其他错误直接抛出
    async writeChunkWithRetry(chunk) {
      let attempt = 0;
      while (true) {
        try {
          await batchUpdateWebsiteRecords(chunk);
          return;
        } catch (error) {
          const status = error && error.status;
          const retriable = status === 429 || (status >= 500 && status < 600);
          if (!retriable || attempt >= 3) throw error;
          await this.sleep(1000 * Math.pow(2, attempt));
          attempt += 1;
        }
      }
    },

    // 第一步：备份 + 试写前 5 条，逐条写入便于准确回报
    async startIconAuditTrial() {
      if (this.iconAuditClearing) return;
      const selected = this.selectedIconAuditRows.filter(row => getManualIconUrl(row.icon));
      if (!selected.length) return;
      const trialRows = selected.slice(0, 5);

      this.downloadIconAuditBackup(selected);

      this.iconAuditClearing = true;
      this.iconAuditTrial = null;
      this.iconAuditTrialConfirmed = false;
      this.iconAuditClearMessage = '';
      this.iconAuditClearMessageType = 'success';

      let done = 0;
      let failed = 0;
      let consecutive = 0;
      let lastError = '';

      for (let i = 0; i < trialRows.length; i++) {
        this.iconAuditClearProgress = `正在试写 ${i + 1}/${trialRows.length}...`;
        try {
          await this.writeChunkWithRetry([{ recordId: trialRows[i].id, fields: { icon: '' } }]);
          done += 1;
          consecutive = 0;
          if (!this.iconAuditClearedIds.includes(trialRows[i].id)) {
            this.iconAuditClearedIds.push(trialRows[i].id);
          }
        } catch (error) {
          failed += 1;
          consecutive += 1;
          lastError = error.message || '写入失败';
          // 连续 3 条失败即停止，避免把问题放大
          if (consecutive >= 3) break;
        }
        if (i < trialRows.length - 1) await this.sleep(500);
      }

      this.iconAuditTrial = {
        attempted: done + failed,
        done,
        failed,
        error: lastError
      };
      this.iconAuditClearing = false;
      this.iconAuditClearProgress = '';
      if (failed) {
        this.iconAuditClearMessageType = 'error';
        this.iconAuditClearMessage = `试写完成：成功 ${done} 条，失败 ${failed} 条${lastError ? `（${lastError}）` : ''}。请核对后再决定是否全量清理。`;
      } else {
        this.iconAuditClearMessageType = 'success';
        this.iconAuditClearMessage = `试写完成：${done} 条全部成功。确认无误后可继续全量清理。`;
      }
    },

    // 第二步：用户勾选确认后，分块清理剩余记录（每块 ≤100，块间 ≥500ms）
    async runIconAuditFullClear() {
      if (this.iconAuditClearing || !this.iconAuditTrialConfirmed) return;
      const rows = this.iconAuditRemainingRows.filter(row => getManualIconUrl(row.icon));
      if (!rows.length) return;

      this.downloadIconAuditBackup(rows);

      this.iconAuditClearing = true;
      this.iconAuditClearMessage = '';
      this.iconAuditClearMessageType = 'success';

      let processed = 0;
      try {
        const patches = rows.map(row => ({ recordId: row.id, fields: { icon: '' } }));
        for (let i = 0; i < patches.length; i += 100) {
          const chunk = patches.slice(i, i + 100);
          this.iconAuditClearProgress = `正在清理 ${i + chunk.length}/${patches.length}...`;
          await this.writeChunkWithRetry(chunk);
          processed += chunk.length;
          for (const row of rows.slice(i, i + chunk.length)) {
            if (!this.iconAuditClearedIds.includes(row.id)) {
              this.iconAuditClearedIds.push(row.id);
            }
          }
          if (i + 100 < patches.length) await this.sleep(500);
        }
        this.iconAuditClearMessageType = 'success';
        this.iconAuditClearMessage = `全量清理完成：共处理 ${processed} 条，图标已回到自动获取。`;
      } catch (error) {
        this.iconAuditClearMessageType = 'error';
        this.iconAuditClearMessage = `清理中断：已成功处理 ${processed} 条，第 ${processed + 1} 条所在批次失败（${error.message || '请求失败'}）。`;
      } finally {
        this.iconAuditClearing = false;
        this.iconAuditClearProgress = '';
      }
    },

    collectSettings() {
      const settings = {};
      settings.theme = localStorage.getItem('theme');
      settings.columns = localStorage.getItem('columns');
      settings.categoryIcons = JSON.parse(localStorage.getItem('categoryIcons') || '{}');
      settings.categoryList = JSON.parse(localStorage.getItem('categoryList') || '[]');
      settings.categoryOrder = JSON.parse(localStorage.getItem('categoryOrder') || '{}');
      settings.backgrounds = {};
      for (const { key } of THEMES) {
        const bg = getThemeBackground(key);
        const bgImage = getThemeBackgroundImage(key);
        if (bg || bgImage) {
          settings.backgrounds[key] = { background: bg, backgroundImage: bgImage };
        }
      }
      return settings;
    },

    async exportBackup() {
      try {
        this.backupLoading = true;
        this.backupProgress = '正在获取网站数据...';
        const items = await fetchData();
        const favorites = JSON.parse(localStorage.getItem('favoriteItems')) || [];
        this.backupProgress = '正在生成备份文件...';
        downloadBackup(buildBackup(items, favorites, this.collectSettings()));
        this.backupMessage = `备份已导出，包含 ${items.length} 个网站`;
        this.backupMessageType = 'success';
      } catch (error) {
        this.backupMessage = '导出备份失败：' + error.message;
        this.backupMessageType = 'error';
      } finally {
        this.backupLoading = false;
        this.backupProgress = '';
        setTimeout(() => { this.backupMessage = ''; }, 3000);
      }
    },

    async restoreBackup(event) {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const backup = JSON.parse(await file.text());
        if (backup.type !== 'nav-full-backup' || !Array.isArray(backup.items)) {
          throw new Error('不是有效的备份文件');
        }
        const date = backup.exportDate ? new Date(backup.exportDate).toLocaleString() : '未知时间';
        const ok = confirm(
          `备份时间：${date}\n包含 ${backup.items.length} 个网站、${(backup.favorites || []).length} 个收藏\n\n` +
          '恢复方式：按记录ID合并到维基云，已存在的更新、缺失的新增，不会删除现有记录。\n\n确定继续吗？'
        );
        if (!ok) return;
        await this.performRestore(backup);
      } catch (error) {
        alert('恢复失败：' + error.message);
      } finally {
        event.target.value = '';
      }
    },

    async restoreSnapshot(snap) {
      const date = new Date(snap.date).toLocaleString();
      const ok = confirm(
        `将快照恢复到维基云：\n快照时间：${date}\n包含 ${snap.count} 个网站\n\n` +
        '按记录ID合并不删除，确定继续吗？'
      );
      if (!ok) return;
      await this.performRestore({ items: snap.items, favorites: snap.favorites });
    },

    async performRestore(backup) {
      try {
        this.backupLoading = true;
        const result = await restoreFromBackup(backup, (done, total) => {
          this.backupProgress = `正在恢复 ${done}/${total}...`;
        });
        this.snapshots = getSnapshots();
        const failedText = result.failed ? `，失败 ${result.failed}（详情见控制台）` : '';
        alert(`恢复完成：新增 ${result.added}，更新 ${result.updated}${failedText}`);
      } catch (error) {
        alert('恢复失败：' + error.message);
      } finally {
        this.backupLoading = false;
        this.backupProgress = '';
      }
    },

    formatSnapshotDate(iso) {
      const d = new Date(iso);
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    },
  }
}
</script>

<style scoped>
.icon-audit-result {
  margin-top: 16px;
}

.icon-audit-summary {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #6b7280;
}

.icon-audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  line-height: 1.5;
}

.icon-audit-table th,
.icon-audit-table td {
  padding: 8px 12px;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid #e5e7eb;
  color: #111827;
}

.icon-audit-table th {
  font-weight: 600;
  color: #6b7280;
}

.icon-audit-url {
  word-break: break-all;
  color: #6b7280;
}

.icon-audit-empty {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #15803d;
}

.icon-audit-copy {
  margin-top: 12px;
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: #ffffff;
  color: #111827;
  font-size: 14px;
  cursor: pointer;
}

.icon-audit-copy:hover {
  background-color: #f3f4f6;
}

:global(.dark) .icon-audit-summary {
  color: #9ca3af;
}

:global(.dark) .icon-audit-table th,
:global(.dark) .icon-audit-table td {
  border-bottom-color: #4b5563;
  color: #f3f4f6;
}

:global(.dark) .icon-audit-table th,
:global(.dark) .icon-audit-url {
  color: #9ca3af;
}

:global(.dark) .icon-audit-empty {
  color: #86efac;
}

:global(.dark) .icon-audit-copy {
  border-color: #4b5563;
  background-color: #374151;
  color: #f3f4f6;
}

:global(.dark) .icon-audit-copy:hover {
  background-color: #4b5563;
}

.icon-audit-check {
  width: 32px;
  text-align: center;
}

.icon-audit-cleared {
  display: inline-block;
  margin-left: 8px;
  padding: 0 8px;
  border-radius: 4px;
  background-color: #f0fdf4;
  color: #15803d;
  font-size: 12px;
  line-height: 1.5;
}

:global(.dark) .icon-audit-cleared {
  background-color: #052e16;
  color: #86efac;
}

.icon-audit-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.icon-audit-selected {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #6b7280;
}

.icon-audit-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
  cursor: pointer;
  border: 1px solid transparent;
}

.icon-audit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-audit-btn-primary {
  background-color: #1d4ed8;
  color: #ffffff;
}

.icon-audit-btn-primary:hover:not(:disabled) {
  background-color: #1e40af;
}

.icon-audit-btn-danger {
  margin-left: 12px;
  background-color: #ffffff;
  color: #b91c1c;
  border-color: #fca5a5;
}

.icon-audit-btn-danger:hover:not(:disabled) {
  background-color: #fef2f2;
}

.icon-audit-trial {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #f8f9fa;
}

.icon-audit-trial-result {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #111827;
}

.icon-audit-confirm {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-right: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #111827;
  cursor: pointer;
}

.icon-audit-progress {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: #6b7280;
}

.icon-audit-clear-message {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
}

.icon-audit-clear-message.is-success {
  background-color: #f0fdf4;
  color: #15803d;
}

.icon-audit-clear-message.is-error {
  background-color: #fef2f2;
  color: #b91c1c;
}

:global(.dark) .icon-audit-actions {
  border-top-color: #4b5563;
}

:global(.dark) .icon-audit-selected,
:global(.dark) .icon-audit-progress {
  color: #9ca3af;
}

:global(.dark) .icon-audit-trial {
  border-color: #4b5563;
  background-color: #374151;
}

:global(.dark) .icon-audit-trial-result,
:global(.dark) .icon-audit-confirm {
  color: #f3f4f6;
}

:global(.dark) .icon-audit-btn-danger {
  background-color: #374151;
  color: #fca5a5;
  border-color: #7f1d1d;
}

:global(.dark) .icon-audit-clear-message.is-success {
  background-color: #052e16;
  color: #86efac;
}

:global(.dark) .icon-audit-clear-message.is-error {
  background-color: #450a0a;
  color: #fca5a5;
}
</style>
