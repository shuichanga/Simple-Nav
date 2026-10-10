// 分类通用工具：字母头像配色、两级树构建、统一数据加载
// 单表方案：二级分类用 category 字段的 "一级/二级" 路径表达
import { fetchData } from '../api/fetchData';
import { getCategoryList, getCategoryIcons, getCategoryOrders } from '../api/categoryApi';

// 低饱和粉彩色板，按分类名哈希取色，同一分类永远同色
const AVATAR_PALETTE = [
  { bg: '#dbeafe', text: '#1e40af' }, // 蓝
  { bg: '#d1fae5', text: '#065f46' }, // 绿
  { bg: '#fef3c7', text: '#92400e' }, // 黄褐
  { bg: '#e0f2fe', text: '#075985' }, // 天蓝
  { bg: '#fce7f3', text: '#9d174d' }, // 粉
  { bg: '#ccfbf1', text: '#115e59' }, // 青绿
  { bg: '#e0e7ff', text: '#3730a3' }, // 靛蓝
  { bg: '#e5e7eb', text: '#374151' }  // 灰
];

// 返回 { bg, text, initial }：无配置图标时的字母头像兜底
export function getCategoryAvatar(name) {
  let hash = 0;
  const str = String(name || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  const palette = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  const initial = str.trim().charAt(0).toUpperCase();
  return { bg: palette.bg, text: palette.text, initial: initial || '?' };
}

// 从网站数据 + localStorage 元数据派生扁平分类列表
// 分类对象: { id: 完整路径, name: 末级名, parentId: 父路径或'', order, icon }
export function deriveCategories(items) {
  const paths = new Set();
  for (const item of items) {
    const cat = String(item.category || '').trim();
    // 仅支持两级："一级" 或 "一级/二级"
    if (cat && cat.split('/').length <= 2) {
      paths.add(cat);
    }
  }
  for (const p of getCategoryList()) {
    if (typeof p === 'string' && p && p.split('/').length <= 2) {
      paths.add(p);
    }
  }

  const icons = getCategoryIcons();
  const orders = getCategoryOrders();

  // 收集需要补齐的一级分类（网站只写了二级、无对应一级时）
  // 必须先去重：多个二级路径共享同一缺失一级时只生成一个，否则树里出现重复分类
  const missingRoots = new Set();
  for (const path of paths) {
    const segments = path.split('/');
    if (segments.length === 2 && !paths.has(segments[0])) {
      missingRoots.add(segments[0]);
    }
  }

  const list = [];
  for (const root of missingRoots) {
    list.push({
      id: root,
      name: root,
      parentId: '',
      order: orders[root] ?? 0,
      icon: icons[root] || ''
    });
  }
  for (const path of paths) {
    const segments = path.split('/');
    list.push({
      id: path,
      name: segments[segments.length - 1],
      parentId: segments.length === 2 ? segments[0] : '',
      order: orders[path] ?? 0,
      icon: icons[path] || ''
    });
  }
  return list;
}

// 把扁平分类列表 + 网站列表构建为两级树
// 返回 { tree, counts }；节点: { category, children, directCount, totalCount }；counts: { 分类id: 直属网站数 }
export function buildCategoryTree(categories, items) {
  const idSet = new Set(categories.map(c => c.id));
  const sorted = [...categories].sort((a, b) =>
    (a.order - b.order) || a.name.localeCompare(b.name, 'zh-CN')
  );

  const byParent = new Map();
  for (const cat of sorted) {
    // 父级不存在（被删或数据异常）的分类按一级处理
    const key = cat.parentId && idSet.has(cat.parentId) ? cat.parentId : '__root__';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(cat);
  }

  const counts = {};
  for (const item of items) {
    if (item.categoryId) {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
    }
  }

  const tree = (byParent.get('__root__') || []).map(cat => {
    const children = byParent.get(cat.id) || [];
    const directCount = counts[cat.id] || 0;
    const childCount = children.reduce((sum, c) => sum + (counts[c.id] || 0), 0);
    return { category: cat, children, directCount, totalCount: directCount + childCount };
  });

  return { tree, counts };
}

// 统一数据加载：网站 + 分类树
// 返回 { items, categoryList, tree, counts }
export async function loadNavData() {
  let items = await fetchData();
  items = items.map(i => ({ ...i, categoryId: i.category || '' }));

  const categoryList = deriveCategories(items);
  const built = buildCategoryTree(categoryList, items);
  return {
    items,
    categoryList,
    tree: built.tree,
    counts: built.counts
  };
}
