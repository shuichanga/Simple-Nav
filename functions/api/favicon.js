// Cloudflare Pages Functions 适配器
// 目录约定：functions/api/favicon.js → 线上路径 /api/favicon
import { handleFavicon } from '../../shared/favicon-core.js';

export function onRequestGet(context) {
  return handleFavicon(context.request, context);
}
