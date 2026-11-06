// 图标抓取核心：只使用标准 Web API（Request / Response / fetch / AbortController / Cache）
// EdgeOne Pages 与 Cloudflare Pages 的运行时都支持这些 API，因此两个平台共用同一份实现。
// 平台适配器只负责把各自的 context.request 传进来，见 functions/api/favicon.js 与 edge-functions/api/favicon.js。

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const HTML_TIMEOUT_MS = 5000;
const IMAGE_TIMEOUT_MS = 4000;
const MANIFEST_TIMEOUT_MS = 3000;
const TOTAL_BUDGET_MS = 9000;

// Cloudflare Pages Functions 免费版只有 10ms CPU，HTML 只解析 head 前缀，避免大页面拖垮 CPU
const MAX_HTML_BYTES = 64 * 1024;
const MAX_MANIFEST_BYTES = 64 * 1024;
const MAX_IMAGE_BYTES = 256 * 1024;
const MAX_IMAGE_CANDIDATES = 5;
const MAX_REDIRECTS = 3;

const CACHE_OK = 'public, max-age=604800, s-maxage=2592000, immutable';
const CACHE_MISS = 'public, max-age=3600';
const CACHE_NONE = 'no-store';

const INSPECT_TIMEOUT_MS = 4000;

function textResponse(message, status, cacheControl) {
  return new Response(message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': cacheControl
    }
  });
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': CACHE_NONE,
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function isPrivateHost(host) {
  const h = String(host || '').toLowerCase();
  if (!h) return true;
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '[::1]' || h === '::1' || h === '0.0.0.0') return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) {
    const parts = h.split('.').map(Number);
    if (parts.some((n) => n > 255)) return true;
    if (parts[0] === 10 || parts[0] === 127 || parts[0] === 0) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
  }
  return false;
}

// 只允许 http/https 公网地址，阻断 SSRF（内网、localhost、userinfo）
function isAllowedUrl(raw) {
  try {
    const u = new URL(raw);
    if (!/^https?:$/.test(u.protocol)) return false;
    if (u.username || u.password) return false;
    if (isPrivateHost(u.hostname)) return false;
    return true;
  } catch (e) {
    return false;
  }
}

function normalizeTarget(raw) {
  let value = String(raw || '').trim();
  if (!value) return '';
  if (value.startsWith('//')) value = 'https:' + value;
  else if (!/^https?:\/\//i.test(value)) value = 'https://' + value;
  try {
    const u = new URL(value);
    if (!/^https?:$/.test(u.protocol)) return '';
    if (u.username || u.password) return '';
    if (isPrivateHost(u.hostname)) return '';
    // 统一到 origin，图标按站点缓存，避免同一站点不同路径重复抓取
    return u.origin;
  } catch (e) {
    return '';
  }
}

// 巡检需要完整路径（图片地址可能在子目录），因此不能用只保留 origin 的 normalizeTarget
function normalizeRemoteUrl(raw) {
  let value = String(raw || '').trim();
  if (!value) return '';
  if (value.startsWith('//')) value = 'https:' + value;
  else if (!/^https?:\/\//i.test(value)) value = 'https://' + value;
  try {
    const u = new URL(value);
    if (!/^https?:$/.test(u.protocol)) return '';
    if (u.username || u.password) return '';
    if (isPrivateHost(u.hostname)) return '';
    return u.toString();
  } catch (e) {
    return '';
  }
}

// 手动跟随重定向，每一跳都重新校验，避免合法站点 302 到内网地址
async function safeFetch(rawUrl, init, deadline, timeoutMs) {
  let current = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isAllowedUrl(current)) return null;
    const remaining = Math.min(timeoutMs, deadline - Date.now());
    if (remaining <= 0) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);
    let res;
    try {
      res = await fetch(current, { ...init, redirect: 'manual', signal: controller.signal });
    } catch (e) {
      return null;
    } finally {
      clearTimeout(timer);
    }
    if (res.status === 301 || res.status === 302 || res.status === 303 || res.status === 307 || res.status === 308) {
      const location = res.headers.get('location');
      if (!location) return null;
      try {
        current = new URL(location, current).toString();
      } catch (e) {
        return null;
      }
      continue;
    }
    return { res, finalUrl: current };
  }
  return null;
}

async function readBodyCapped(res, maxBytes) {
  if (!res.body) return null;
  const contentLength = Number(res.headers.get('content-length') || 0);
  if (contentLength && contentLength > maxBytes) return null;
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        try {
          await reader.cancel();
        } catch (e) {
          // 忽略取消失败
        }
        return null;
      }
      chunks.push(value);
    }
  } catch (e) {
    return null;
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

// HTML 只需要 head 部分，读满上限即停止，不再下载剩余内容
async function readTextPrefix(res, maxBytes) {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const remaining = maxBytes - total;
      if (value.byteLength >= remaining) {
        chunks.push(value.slice(0, remaining));
        try {
          await reader.cancel();
        } catch (e) {
          // 忽略取消失败
        }
        break;
      }
      chunks.push(value);
      total += value.byteLength;
    }
  } catch (e) {
    return '';
  }
  const used = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const body = new Uint8Array(used);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function parseSize(value) {
  const match = /(\d+)x(\d+)/i.exec(value || '');
  return match ? Math.max(Number(match[1]), Number(match[2])) : 0;
}

const ATTR_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;

function extractAttrs(tag) {
  const attrs = {};
  ATTR_RE.lastIndex = 0;
  let match;
  while ((match = ATTR_RE.exec(tag))) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return attrs;
}

function parseHtmlIcons(html, baseUrl) {
  const headEnd = html.search(/<\/head>/i);
  const head = headEnd >= 0 ? html.slice(0, headEnd) : html;
  const icons = [];
  const appleIcons = [];
  let manifest = '';
  let ogImage = '';

  const linkRe = /<link\b[^>]*>/gi;
  let match;
  while ((match = linkRe.exec(head))) {
    const attrs = extractAttrs(match[0]);
    const rel = (attrs.rel || '').toLowerCase();
    const href = attrs.href || '';
    if (!href) continue;
    if (rel.includes('apple-touch-icon')) {
      appleIcons.push({ href, size: parseSize(attrs.sizes) });
    } else if (rel.includes('icon') && !rel.includes('mask-icon')) {
      icons.push({ href, size: parseSize(attrs.sizes) });
    } else if (rel.split(/\s+/).includes('manifest')) {
      manifest = href;
    }
  }

  const metaRe = /<meta\b[^>]*>/gi;
  while ((match = metaRe.exec(head))) {
    const attrs = extractAttrs(match[0]);
    const key = (attrs.property || attrs.name || '').toLowerCase();
    if (!ogImage && key === 'og:image' && attrs.content) ogImage = attrs.content;
  }

  const resolve = (href) => {
    try {
      return new URL(href, baseUrl).toString();
    } catch (e) {
      return '';
    }
  };

  icons.sort((a, b) => b.size - a.size);
  appleIcons.sort((a, b) => b.size - a.size);

  return {
    icons: icons.map((item) => resolve(item.href)).filter(Boolean),
    appleIcons: appleIcons.map((item) => resolve(item.href)).filter(Boolean),
    manifest: resolve(manifest),
    ogImage: resolve(ogImage)
  };
}

async function fetchHtml(target, deadline) {
  const result = await safeFetch(
    target,
    {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    },
    deadline,
    HTML_TIMEOUT_MS
  );
  if (!result || !result.res.ok) return null;
  const type = (result.res.headers.get('content-type') || '').toLowerCase();
  if (type && !type.includes('html') && !type.includes('xml')) return null;
  const text = await readTextPrefix(result.res, MAX_HTML_BYTES);
  if (!text) return null;
  return { text, finalUrl: result.finalUrl };
}

async function fetchManifestIcons(manifestUrl, deadline) {
  const result = await safeFetch(
    manifestUrl,
    {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/manifest+json,application/json;q=0.9,*/*;q=0.8'
      }
    },
    deadline,
    MANIFEST_TIMEOUT_MS
  );
  if (!result || !result.res.ok) return [];
  const buffer = await readBodyCapped(result.res, MAX_MANIFEST_BYTES);
  if (!buffer) return [];
  let json;
  try {
    json = JSON.parse(new TextDecoder().decode(buffer));
  } catch (e) {
    return [];
  }
  const icons = Array.isArray(json.icons) ? json.icons : [];
  return icons
    .filter((item) => item && typeof item.src === 'string')
    .map((item) => ({ src: item.src, size: parseSize(item.sizes) }))
    .sort((a, b) => b.size - a.size)
    .map((item) => {
      try {
        return new URL(item.src, result.finalUrl).toString();
      } catch (e) {
        return '';
      }
    })
    .filter(Boolean);
}

async function fetchImage(imageUrl, deadline) {
  let referer = '';
  try {
    referer = new URL(imageUrl).origin + '/';
  } catch (e) {
    referer = '';
  }
  const result = await safeFetch(
    imageUrl,
    {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'image/*,image/webp,*/*;q=0.8',
        ...(referer ? { Referer: referer } : {})
      }
    },
    deadline,
    IMAGE_TIMEOUT_MS
  );
  if (!result || !result.res.ok) return null;
  const type = (result.res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!type.startsWith('image/')) return null;
  const body = await readBodyCapped(result.res, MAX_IMAGE_BYTES);
  if (!body || body.byteLength < 16) return null;
  return { body, type };
}

// 只读巡检：返回手动图标地址的 HTTP 状态与 content-type，供前端区分 404 / 非图片。
// 不读取图片内容（拿到响应头后立即取消 body），也不写缓存。
async function inspectRemoteIcon(target, deadline) {
  const result = await safeFetch(
    target,
    {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'image/*,image/webp,*/*;q=0.8'
      }
    },
    deadline,
    INSPECT_TIMEOUT_MS
  );
  if (!result) return { ok: false, reason: 'blocked' };

  const { res } = result;
  const status = res.status;
  const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  try {
    if (res.body) await res.body.cancel();
  } catch (e) {
    // 忽略取消失败
  }

  if (status === 404 || status === 410) {
    return { ok: false, reason: 'not-found', status, contentType };
  }
  if (status >= 400) {
    return { ok: false, reason: 'http-error', status, contentType };
  }
  if (contentType && !contentType.startsWith('image/')) {
    return { ok: false, reason: 'not-image', status, contentType };
  }
  return { ok: true, status, contentType };
}

async function resolveFavicon(target) {
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const targetOrigin = new URL(target).origin;
  const html = await fetchHtml(target, deadline);

  const candidates = [];
  let manifestUrl = '';
  let ogImage = '';
  if (html) {
    const parsed = parseHtmlIcons(html.text, html.finalUrl);
    candidates.push(...parsed.icons, ...parsed.appleIcons);
    manifestUrl = parsed.manifest;
    ogImage = parsed.ogImage;
  }

  // 页面没有声明 rel=icon 时，再尝试 Web App Manifest
  if (!candidates.length && manifestUrl) {
    candidates.push(...(await fetchManifestIcons(manifestUrl, deadline)));
  }

  candidates.push(targetOrigin + '/favicon.ico');
  candidates.push(targetOrigin + '/apple-touch-icon.png');

  // 页面可能重定向到另一个主机，补上最终主机的默认路径
  if (html) {
    try {
      const finalOrigin = new URL(html.finalUrl).origin;
      if (finalOrigin !== targetOrigin) {
        candidates.push(finalOrigin + '/favicon.ico');
        candidates.push(finalOrigin + '/apple-touch-icon.png');
      }
    } catch (e) {
      // 忽略解析失败
    }
  }

  // og:image 是最后一档，通常是大图，但比完全没有好
  if (ogImage) candidates.push(ogImage);

  const list = [];
  const seen = new Set();
  for (const candidate of candidates) {
    if (!candidate || seen.has(candidate) || !isAllowedUrl(candidate)) continue;
    seen.add(candidate);
    list.push(candidate);
  }

  for (const candidate of list.slice(0, MAX_IMAGE_CANDIDATES)) {
    if (Date.now() >= deadline) break;
    const image = await fetchImage(candidate, deadline);
    if (image) return image;
  }
  return null;
}

export async function handleFavicon(request, context) {
  const url = new URL(request.url);

  // 前端用它探测当前部署是否挂了 /api/favicon
  if (url.searchParams.get('probe') === '1') {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': CACHE_NONE,
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET', 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  // 只读巡检：检查表格里手填的图标地址，返回状态与类型，不抓取、不缓存
  if (url.searchParams.get('inspect') === '1') {
    const remote = normalizeRemoteUrl(url.searchParams.get('url'));
    if (!remote) return jsonResponse({ ok: false, reason: 'invalid-url' }, 400);
    const info = await inspectRemoteIcon(remote, Date.now() + INSPECT_TIMEOUT_MS + 1000);
    return jsonResponse(info, 200);
  }

  const target = normalizeTarget(url.searchParams.get('url'));
  if (!target) return textResponse('Invalid url', 400, CACHE_NONE);

  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheKey = new Request('https://favicon-cache.internal/?u=' + encodeURIComponent(target));

  if (cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
    } catch (e) {
      // 缓存异常不影响主流程
    }
  }

  const image = await resolveFavicon(target);
  const response = image
    ? new Response(image.body, {
        status: 200,
        headers: {
          'Content-Type': image.type,
          'Cache-Control': CACHE_OK,
          'Access-Control-Allow-Origin': '*',
          'X-Content-Type-Options': 'nosniff'
        }
      })
    : textResponse('Icon not found', 404, CACHE_MISS);

  if (cache) {
    try {
      const put = cache.put(cacheKey, response.clone());
      if (context && typeof context.waitUntil === 'function') context.waitUntil(put);
      else await put;
    } catch (e) {
      // 缓存写入失败不影响响应
    }
  }

  return response;
}
