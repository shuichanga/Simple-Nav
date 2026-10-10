// 单表方案：二级分类用现有 category 字段表达（"一级" 或 "一级/二级"）
// 分类的图标/排序/空分类列表存 localStorage；改名/删除时批量改写维基云网站记录
import { batchUpdateWebsiteRecords } from './fetchData';
import { scheduleSettingsSync } from './settingsApi';

const LIST_KEY = 'categoryList';   // 显式创建过的分类路径（让空分类不消失）
const ICONS_KEY = 'categoryIcons'; // 分类图标（复用旧键）
const ORDER_KEY = 'categoryOrder'; // 分类排序

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getCategoryList() {
  return readJson(LIST_KEY, []);
}

export function getCategoryIcons() {
  return readJson(ICONS_KEY, {});
}

export function getCategoryOrders() {
  return readJson(ORDER_KEY, {});
}

// 新增分类路径（"一级" 或 "一级/二级"），返回完整路径
export async function addCategoryPath(path, order = 0) {
  const list = getCategoryList();
  if (!list.includes(path)) {
    list.push(path);
    writeJson(LIST_KEY, list);
  }
  const orders = getCategoryOrders();
  if (orders[path] === undefined) {
    orders[path] = order;
    writeJson(ORDER_KEY, orders);
  }
  scheduleSettingsSync();
  return path;
}

// 设置分类图标
export function setCategoryIcon(path, icon) {
  const icons = getCategoryIcons();
  if (icon) {
    icons[path] = icon;
  } else {
    delete icons[path];
  }
  writeJson(ICONS_KEY, icons);
  scheduleSettingsSync();
}

// 重排同级分类（传重排后的完整路径数组，按索引写 order）
export function setCategoryOrder(paths) {
  const orders = getCategoryOrders();
  paths.forEach((path, i) => {
    orders[path] = i;
  });
  writeJson(ORDER_KEY, orders);
  scheduleSettingsSync();
}

// 重命名分类（含子分类联动，只更新 localStorage 元数据；网站记录由调用方批量改写）
export function renameCategoryPath(oldPath, newPath) {
  const affected = p => p === oldPath || p.startsWith(oldPath + '/');
  const remap = p => newPath + p.slice(oldPath.length);

  const list = getCategoryList();
  writeJson(LIST_KEY, list.map(p => affected(p) ? remap(p) : p));

  const icons = getCategoryIcons();
  for (const p of Object.keys(icons)) {
    if (affected(p)) {
      icons[remap(p)] = icons[p];
      delete icons[p];
    }
  }
  writeJson(ICONS_KEY, icons);

  const orders = getCategoryOrders();
  for (const p of Object.keys(orders)) {
    if (affected(p)) {
      orders[remap(p)] = orders[p];
      delete orders[p];
    }
  }
  writeJson(ORDER_KEY, orders);
  scheduleSettingsSync();
}

// 批量改写网站的 category 字段，pairs: [{ recordId, category }]
export async function rewriteSiteCategories(pairs) {
  if (!pairs.length) return;
  await batchUpdateWebsiteRecords(
    pairs.map(({ recordId, category }) => ({ recordId, fields: { category } }))
  );
}

// 删除分类（调用方保证已无子分类）：localStorage 移除 + 网站移入未分类
export async function deleteCategoryPath(path) {
  const affected = p => p === path || p.startsWith(path + '/');

  writeJson(LIST_KEY, getCategoryList().filter(p => !affected(p)));

  const icons = getCategoryIcons();
  for (const p of Object.keys(icons)) {
    if (affected(p)) delete icons[p];
  }
  writeJson(ICONS_KEY, icons);

  const orders = getCategoryOrders();
  for (const p of Object.keys(orders)) {
    if (affected(p)) delete orders[p];
  }
  writeJson(ORDER_KEY, orders);
  scheduleSettingsSync();
}
