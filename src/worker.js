const UPSTREAM = "https://api.unsplash.com";

// 每个端点允许透传的参数白名单
const ROUTES = {
  "/api/random": {
    path: "/photos/random",
    params: ["query", "orientation", "topics", "collections", "content_filter"],
  },
  "/api/search": {
    path: "/search/photos",
    params: ["query", "color", "orientation", "collections", "content_filter", "page", "per_page"],
  },
  "/api/topics": {
    path: "/topics",
    params: ["per_page"],
    cacheTtl: 3600, // 主题列表几乎不变，边缘缓存 1 小时
  },
};

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function proxyToUnsplash(env, route, searchParams) {
  const key = env.UNSPLASH_ACCESS_KEY;
  if (!key) return jsonError(500, "服务端未配置 UNSPLASH_ACCESS_KEY");

  const qs = new URLSearchParams();
  for (const name of route.params) {
    const v = searchParams.get(name);
    if (v) qs.set(name, v);
  }
  const upstream = `${UPSTREAM}${route.path}?${qs.toString()}`;

  const resp = await fetch(upstream, {
    headers: {
      Authorization: `Client-ID ${key}`,
      "Accept-Version": "v1",
    },
  });

  const body = await resp.text();
  if (!resp.ok) {
    let msg = `Unsplash 错误（${resp.status}）`;
    try {
      const data = JSON.parse(body);
      if (data && data.errors && data.errors.length) msg = data.errors.join("；");
    } catch (_) { /* 非 JSON 响应，用默认文案 */ }
    return jsonError(resp.status, msg);
  }
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleApi(request, env, route) {
  const url = new URL(request.url);

  // 带缓存的端点（topics）：先查边缘缓存
  if (route.cacheTtl) {
    const cache = caches.default;
    const cacheKey = new Request(url.origin + url.pathname, request);
    const hit = await cache.match(cacheKey);
    if (hit) return hit;

    const resp = await proxyToUnsplash(env, route, url.searchParams);
    if (resp.ok) {
      const cached = new Response(resp.body, resp);
      cached.headers.set("Cache-Control", `public, max-age=${route.cacheTtl}`);
      await cache.put(cacheKey, cached.clone());
      return cached;
    }
    return resp;
  }

  return proxyToUnsplash(env, route, url.searchParams);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = ROUTES[url.pathname];

    if (route) {
      if (request.method !== "GET") return jsonError(405, "Method Not Allowed");
      return handleApi(request, env, route);
    }
    // 其余路径交给静态资产（index.html 等）
    return env.ASSETS.fetch(request);
  },
};
