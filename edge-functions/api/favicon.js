// EdgeOne Pages Edge Functions 适配器
// 目录约定：edge-functions/api/favicon.js → 线上路径 /api/favicon
import { handleFavicon } from '../../shared/favicon-core.js';

export default function onRequest(context) {
  return handleFavicon(context.request, context);
}
