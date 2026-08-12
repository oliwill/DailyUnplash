# DailyUnplash

为 [Logseq Banners 插件](https://github.com/yoyurec/logseq-banners-plugin)挑选横幅图片的小工具，部署在 Cloudflare Workers 上。

插件 README 推荐的 `source.unsplash.com` 已下线（见 [issue #94](https://github.com/yoyurec/logseq-banners-plugin/issues/94)），本项目用 Unsplash 官方 API + Lorem Picsum 作为替代图源。

**线上地址**：https://banner-image.lizhewei.workers.dev

## 功能

- 刷新页面 / 点击「换一张」自动请求一张新图
- 在图片上**右键**弹出自定义菜单，一键复制：
  - 原图地址（全分辨率）
  - Banner 尺寸地址（服务端按设定宽高裁剪，直接粘贴到 Logseq 的 `banner::` 属性）
- Banner 宽高可自定义，预览区按真实比例渲染，所见即所得
- 双图源：
  - **Lorem Picsum** — 免 Key 兜底
  - **Unsplash** — 官方 API，支持筛选：关键词、颜色（10 色 + 黑白）、方向（横/纵/方）、主题（动态拉取）、合集（预设 + 自定义 ID）、内容分级

## 架构

```
├── public/index.html   # 前端，零依赖单文件
├── src/worker.js       # /api/random、/api/search、/api/topics 代理
└── wrangler.toml       # Workers 静态资产配置
```

- Unsplash Access Key 只存在 Workers secret 中，前端零暴露
- 代理对上游参数做白名单过滤，外部无法借代理传递任意参数
- `/api/topics` 边缘缓存 1 小时，节省 API 配额（demo 级应用 50 次/小时）

## 本地开发

```bash
# 1. 创建 .dev.vars（已被 .gitignore 排除），写入你的 Unsplash Access Key
echo "UNSPLASH_ACCESS_KEY=你的key" > .dev.vars

# 2. 启动
npx wrangler dev
# 打开 http://127.0.0.1:8787
```

Key 在 https://unsplash.com/developers 免费申请。

## 部署

```bash
npx wrangler login                                # 浏览器 OAuth 授权
npx wrangler secret put UNSPLASH_ACCESS_KEY       # 粘贴 key 回车
npx wrangler deploy
```

改代码后重新 `npx wrangler deploy` 即可。

## 使用

1. 打开网站，选择图源（Unsplash 可设筛选条件）
2. 刷新或点「换一张」直到看到喜欢的图
3. 在图片上右键 → 复制原图地址 / 复制 Banner 尺寸地址
4. 粘贴到 Logseq 页面属性：`banner:: "粘贴的URL"`（加双引号避免 Logseq 在属性区渲染预览）
5. 图片关键部分被裁掉时，用 `banner-align:: 0%`（顶部）或 `100%`（底部）微调

## 说明

- Shift + 右键可打开浏览器原生菜单
- Unsplash demo 级应用限额 50 次/小时，频繁刷新触发 403 后等一小时即可
- 本仓库历史中的 `daily_unsplash_url.py`（旧的定时拉取脚本）已被本工具取代，可从 git 历史中找回
