// 设置同步层：设置表（key/value 两个文本字段）↔ localStorage 双向同步
// - localStorage 仍是运行时读取源（同步、零改动）
// - 启动时 pullSettings：设置表有值则覆盖本地，空表则把本地播种上去（每会话仅一次）
// - 任何设置变更后 scheduleSettingsSync：2 秒防抖批量写回设置表
import { baseUrl, apiRequest, getApiKey } from './fetchData';

const SETTINGS_ENV_DS = import.meta.env.VITE_VIKA_SETTINGS_DATASHEET_ID;

// 参与同步的 localStorage 键（深色模式不同步，跟随各设备）
export const SYNC_KEYS = [
  'theme',
  'columns',
  'showPreview',
  'background_default',
  'background_glass',
  'backgroundImage_default',
  'backgroundImage_glass',
  'categoryIcons',
  'categoryList',
  'categoryOrder',
  'siteTitle',
  'siteSubtitle'
];

export function getSettingsDatasheetId() {
  return SETTINGS_ENV_DS || localStorage.getItem('settingsDatasheetId') || '';
}

export function isSettingsSyncEnabled() {
  return !!(getApiKey() && getSettingsDatasheetId());
}

function getSettingsApiConfig() {
  const apiKey = getApiKey();
  const datasheetId = getSettingsDatasheetId();
  if (!apiKey || !datasheetId) {
    throw new Error('设置表未配置');
  }
  return { apiKey, datasheetId };
}

// 读取设置表全部行: [{ recordId, key, value }]
async function fetchSettingRows(apiKey, datasheetId) {
  const url = `${baseUrl}/${datasheetId}/records?fieldKey=name&pageSize=1000`;
  const responseData = await apiRequest(url, { apiKey });
  const records = responseData?.data?.records;
  if (!Array.isArray(records)) {
    throw new Error('设置表返回数据格式不正确');
  }
  return records.map(record => ({
    recordId: record.recordId,
    key: record.fields?.key || '',
    value: record.fields?.value || ''
  })).filter(r => r.key);
}

function collectLocalSettings() {
  const out = {};
  for (const k of SYNC_KEYS) {
    const v = localStorage.getItem(k);
    if (v !== null && v !== undefined) out[k] = v;
  }
  return out;
}

// 站点标题/副标题默认值
export const DEFAULT_SITE_TITLE = 'Simple NAV';
export const DEFAULT_SITE_SUBTITLE = '少即是多';

export function getSiteTitle() {
  const v = localStorage.getItem('siteTitle');
  return v === null ? DEFAULT_SITE_TITLE : v;
}

export function getSiteSubtitle() {
  const v = localStorage.getItem('siteSubtitle');
  return v === null ? DEFAULT_SITE_SUBTITLE : v;
}

// 把站点标题应用到浏览器标签页
export function applySiteMeta() {
  document.title = getSiteTitle();
}

// 启动时拉取：设置表覆盖本地；表为空时把本地播种上去
let pulledThisSession = false;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const API_INTERVAL_MS = 550; // 维基云免费版限流 2 QPS，调用间隔防 429

export async function pullSettings() {
  if (pulledThisSession || !isSettingsSyncEnabled()) return;
  pulledThisSession = true;
  try {
    const { apiKey, datasheetId } = getSettingsApiConfig();
    const rows = await fetchSettingRows(apiKey, datasheetId);
    if (!rows.length) {
      await sleep(API_INTERVAL_MS);
      await pushSettings(rows);
      return;
    }
    for (const row of rows) {
      if (SYNC_KEYS.includes(row.key) && row.value) {
        localStorage.setItem(row.key, row.value);
      }
    }
  } catch (error) {
    console.warn('设置拉取失败（使用本地设置）:', error.message);
  } finally {
    applySiteMeta();
  }
}

// 把本地设置批量写回设置表：变更的 PATCH、缺失的新增、本地已清空的置空
// prefetchedRows: 调用方已拉取的行（避免重复 GET 触发限流）
export async function pushSettings(prefetchedRows) {
  const { apiKey, datasheetId } = getSettingsApiConfig();
  const rows = Array.isArray(prefetchedRows)
    ? prefetchedRows
    : await fetchSettingRows(apiKey, datasheetId);
  const remoteByKey = new Map(rows.map(r => [r.key, r]));

  const local = collectLocalSettings();
  const patches = [];
  const adds = [];
  for (const k of SYNC_KEYS) {
    const v = Object.prototype.hasOwnProperty.call(local, k) ? local[k] : null;
    const row = remoteByKey.get(k);
    if (v === null) {
      // 本地已清空的设置 → 远端置空
      if (row && row.value !== '') {
        patches.push({ recordId: row.recordId, fields: { value: '' } });
      }
    } else if (!row) {
      adds.push({ fields: { key: k, value: v } });
    } else if (row.value !== v) {
      patches.push({ recordId: row.recordId, fields: { value: v } });
    }
  }

  if (patches.length) {
    await apiRequest(`${baseUrl}/${datasheetId}/records?fieldKey=name`, {
      method: 'PATCH',
      apiKey,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: patches, fieldKey: 'name' })
    });
    await sleep(API_INTERVAL_MS);
  }
  if (adds.length) {
    await apiRequest(`${baseUrl}/${datasheetId}/records?fieldKey=name`, {
      method: 'POST',
      apiKey,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: adds, fieldKey: 'name' })
    });
  }
}

// 变更后调用：2 秒防抖写回
let syncTimer = null;
export function scheduleSettingsSync() {
  if (!isSettingsSyncEnabled()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    pushSettings().catch(error => {
      console.warn('设置同步失败:', error.message);
    });
  }, 2000);
}
