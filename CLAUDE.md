# DailyUnplash — CLAUDE.md

Logseq banner 图片选取器。Cloudflare Workers 部署：静态前端 + Unsplash API 代理。

- 仓库：https://github.com/oliwill/DailyUnplash
- 线上：https://banner-image.lizhewei.workers.dev

## 结构

| 文件 | 职责 |
|---|---|
| `public/index.html` | 零依赖单文件前端：刷新换图、右键复制原图/Banner 裁剪地址、双图源 + Unsplash 筛选 |
| `src/worker.js` | `/api/random` `/api/search` `/api/topics` 代理；参数白名单在 `ROUTES` 表 |
| `wrangler.toml` | Workers 配置（静态资产绑定 `ASSETS`） |

## 命令

```bash
npx wrangler dev          # 本地开发，需 .dev.vars 里有 UNSPLASH_ACCESS_KEY
npx wrangler secret put UNSPLASH_ACCESS_KEY
npx wrangler deploy
```

## 约定

- Unsplash key 只允许存在于 Workers secret / 本地 `.dev.vars`（gitignored），**禁止写进任何入库文件**
- 前端不直连 api.unsplash.com，一律走同源 `/api/*`
- 新增上游参数：先加进 `worker.js` 的 `ROUTES` 白名单，再加前端控件
- 预设合集 ID 硬编码在 `index.html` 的 `ucollection` 下拉里，改之前先用 `/api/topics` 或合集页 URL 验证 ID 有效

## 坑

- demo 级 Unsplash key 50 次/小时，403 后等一小时
- 本机 Clash fake-ip 会把 workers.dev 解析到假地址导致 SSL 失败——本地打不开先查代理规则，不是部署问题
- 颜色筛选强制走 `/api/search`（Unsplash 限制：color 只在 search 端点且必须有 query）；选了颜色后主题筛选不生效
