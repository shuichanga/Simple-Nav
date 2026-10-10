import { fetchData, addWebsite, updateWebsite } from '../api/fetchData';

const SNAPSHOT_KEY = 'navBackupSnapshots';
const FAVORITES_KEY = 'favoriteItems';
const MAX_SNAPSHOTS = 3;

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
  } catch {
    return [];
  }
}

export function getSnapshots() {
  try {
    return JSON.parse(localStorage.getItem(SNAPSHOT_KEY)) || [];
  } catch {
    return [];
  }
}

// 数据变更后调用，滚动保留最近 MAX_SNAPSHOTS 份快照；内容无变化时跳过
export async function saveSnapshot(preloadedItems) {
  try {
    const items = Array.isArray(preloadedItems) ? preloadedItems : await fetchData();
    const favorites = getFavorites();
    const snapshots = getSnapshots();
    if (snapshots.length) {
      const last = snapshots[0];
      if (JSON.stringify([last.items, last.favorites]) === JSON.stringify([items, favorites])) {
        return;
      }
    }
    snapshots.unshift({
      date: new Date().toISOString(),
      count: items.length,
      items,
      favorites
    });
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots.slice(0, MAX_SNAPSHOTS)));
  } catch (error) {
    // 快照失败不影响主流程
    console.warn('本地快照保存失败:', error);
  }
}

export function buildBackup(items, favorites, settings) {
  return {
    version: '1.0',
    type: 'nav-full-backup',
    exportDate: new Date().toISOString(),
    items,
    favorites,
    settings: settings || {}
  };
}

export function downloadBackup(backup) {
  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nav-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function toWebsiteFields(item) {
  return {
    category: item.category,
    name: item.name,
    url: item.url,
    icon: item.icon,
    description: item.description || '',
    order: item.sortOrder || 0
  };
}

// 恢复：按记录 ID 合并到维基云，已存在的更新、缺失的新增，不删除现有记录
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const API_INTERVAL_MS = 550; // 维基云免费版限流 2 QPS，逐条间隔避免 429

export async function restoreFromBackup(backup, onProgress) {
  if (!Array.isArray(backup.items)) {
    throw new Error('备份文件中没有网站数据');
  }
  const current = await fetchData();
  const currentIds = new Set(current.map(i => i.id));
  let added = 0;
  let updated = 0;
  let failed = 0;
  for (let i = 0; i < backup.items.length; i++) {
    if (i > 0) await sleep(API_INTERVAL_MS);
    const item = backup.items[i];
    try {
      const fields = toWebsiteFields(item);
      if (currentIds.has(item.id)) {
        await updateWebsite(item.id, fields);
        updated++;
      } else {
        await addWebsite(fields);
        added++;
      }
      if (onProgress) onProgress(added + updated, backup.items.length);
    } catch (error) {
      failed++;
      console.warn(`恢复记录失败(${item.name}):`, error);
    }
  }
  if (Array.isArray(backup.favorites)) {
    const merged = [...new Set([...getFavorites(), ...backup.favorites])];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(merged));
  }
  return { added, updated, failed, total: backup.items.length };
}
