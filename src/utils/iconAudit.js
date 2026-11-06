// 手动图标巡检（只读）：检查表格 icon 字段里手填的图片地址是否还能用。
// 不写回维基云，不调用任何更新接口；结果只用于展示与人工确认。

const LEGACY_DEFAULT_ICON = '/default.ico';
const DISABLED_ICON_VALUES = ['none', 'off'];
const MIN_ICON_PX = 16;
const DEFAULT_TIMEOUT = 8000;
const DEFAULT_CONCURRENCY = 4;

const REASON_TEXT = {
  'not-found': '404 不存在',
  timeout: '超时',
  'not-image': '返回内容不是图片',
  'too-small': '尺寸过小',
  'http-error': 'HTTP 错误',
  'invalid-image': '图片无法解码',
  blocked: '无法连接（网络/防盗链）',
  'invalid-url': '地址格式无效'
};

// 只有真正的手动图片地址才需要巡检；留空 / none / off / 历史默认图都跳过
export function getManualIconUrl(icon) {
  const raw = String(icon || '').trim();
  if (!raw || raw === LEGACY_DEFAULT_ICON) return '';
  if (DISABLED_ICON_VALUES.includes(raw.toLowerCase())) return '';
  return raw;
}

function probeImage(url, timeout) {
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    let timer = null;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve(result);
    };

    timer = setTimeout(() => finish({ result: 'timeout' }), timeout);
    img.onload = () => finish({ result: 'load', width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => finish({ result: 'error' });
    img.referrerPolicy = 'no-referrer';
    img.src = url;
  });
}

// 同源代理可用时，用它拿 HTTP 状态与 content-type，才能区分 404 和「不是图片」。
// 未部署函数时返回 null，回退到纯前端判断。
async function inspectWithProxy(url) {
  try {
    const res = await fetch(`/api/favicon?inspect=1&url=${encodeURIComponent(url)}`, {
      headers: { Accept: 'application/json' }
    });
    const type = (res.headers.get('content-type') || '').toLowerCase();
    if (!type.includes('application/json')) return null;
    const data = await res.json();
    return data && typeof data === 'object' ? data : null;
  } catch (e) {
    return null;
  }
}

// no-cors 只能判断「请求能不能发出去」：能发出去但 <img> 解码失败，多半不是图片
async function isReachable(url) {
  try {
    await fetch(url, { mode: 'no-cors', cache: 'no-store' });
    return true;
  } catch (e) {
    return false;
  }
}

function describeResult(result) {
  let text = REASON_TEXT[result.reason] || '加载失败';
  if ((result.reason === 'http-error' || result.reason === 'not-found') && result.status) {
    text += `（HTTP ${result.status}）`;
  }
  if (result.reason === 'not-image' && result.contentType) {
    text += `（${result.contentType}）`;
  }
  if (result.reason === 'too-small' && result.width && result.height) {
    text += `（${result.width}×${result.height}）`;
  }
  return text;
}

export async function auditIconUrl(url, timeout = DEFAULT_TIMEOUT) {
  const probe = await probeImage(url, timeout);

  if (probe.result === 'load') {
    const { width, height } = probe;
    // 1×1 追踪像素或宽高 < 16px 视为不可用；0×0 的 SVG 无法判断，按有效处理
    if (width > 0 && height > 0 && (width < MIN_ICON_PX || height < MIN_ICON_PX)) {
      return { ok: false, reason: 'too-small', width, height };
    }
    return { ok: true, width, height };
  }

  if (probe.result === 'timeout') {
    return { ok: false, reason: 'timeout' };
  }

  const info = await inspectWithProxy(url);
  if (info) {
    if (info.ok) {
      // 服务端确认是图片但 <img> 解码失败：内容损坏或被防盗链拦截
      return {
        ok: false,
        reason: 'invalid-image',
        status: info.status,
        contentType: info.contentType
      };
    }
    return {
      ok: false,
      reason: info.reason || 'blocked',
      status: info.status,
      contentType: info.contentType
    };
  }

  const reachable = await isReachable(url);
  return { ok: false, reason: reachable ? 'invalid-image' : 'blocked' };
}

export async function auditManualIcons(items, options = {}) {
  const list = Array.isArray(items) ? items : [];
  const concurrency = Math.max(1, options.concurrency || DEFAULT_CONCURRENCY);
  const timeout = options.timeout || DEFAULT_TIMEOUT;
  const onProgress = options.onProgress;

  const targets = [];
  for (const item of list) {
    const url = getManualIconUrl(item && item.icon);
    if (url) targets.push({ item, url });
  }

  const invalid = [];
  let done = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < targets.length) {
      const target = targets[cursor++];
      const result = await auditIconUrl(target.url, timeout);
      done += 1;
      if (!result.ok) {
        invalid.push({
          id: target.item.id || '',
          name: target.item.name || '',
          siteUrl: target.item.url || '',
          icon: target.url,
          reason: result.reason,
          detail: describeResult(result)
        });
      }
      if (typeof onProgress === 'function') onProgress(done, targets.length);
    }
  }

  const workers = Math.min(concurrency, targets.length);
  await Promise.all(Array.from({ length: workers }, worker));

  invalid.sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-CN'));

  return {
    total: list.length,
    checked: targets.length,
    skipped: list.length - targets.length,
    invalid
  };
}
