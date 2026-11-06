<div align="center">
<a href="https://nav.shuichanga.cn"><img height="100px" alt="logo" src="https://nav.shuichanga.cn/img/logo.png"></a>
  <p style="color:blue;font-size:20px;">Simple NAV</p>
  <p><em>自用简约的网址导航站，完全用AI采用Vue框架开发。导航数据通过维基云表格编辑，无需数据库，无需后端，简单且方便。</em></p>
  <div>
    <img src="https://img.shields.io/github/stars/jianzhugo/Simple-Nav?style=flat-square&color=yellow" alt="GitHub Stars">
    <img src="https://img.shields.io/github/forks/jianzhugo/Simple-Nav?style=flat-square&color=green" alt="GitHub Forks">    
    <img src="https://img.shields.io/badge/built%20with-Vue%203-green?style=flat-square" alt="Built with Vue 3">
    <img src="https://img.shields.io/badge/tailwindcss-v2.2.19-blue?style=flat-square" alt="Tailwind CSS">
  </div>
</div>

***

## 功能特点

- [x] 智能本地搜索功能（百度/Bing/谷歌/站内）
- [x] 响应式侧边栏布局，支持折叠/展开，图标全列对齐
- [x] 双主题系统（默认主题 + 液态玻璃主题），均支持深色模式
- [x] 每个主题独立配置背景（纯色/渐变预设/自定义渐变/背景图片）
- [x] 右下角悬浮工具条（主页/图片预览/主题切换）
- [x] 网站卡片预览图（懒加载 + 请求队列 + 7天缓存）
- [x] 二级分类支持：分类字段写「一级/二级」即可，侧边栏手风琴展开、聚合浏览
- [x] 独立分类管理页：增删改、上移/下移排序、图标配置（密码保护）
- [x] 163 个精选分组图标 + 中英文搜索，未配置图标自动显示字母头像
- [x] 网站图标多级获取与兜底（手填地址 → favicon.ico → 同源边缘函数解析 → 图标服务 → 字母色块），带失败缓存与指数退避
- [x] 数据备份：全量导出 JSON、本地自动快照、按记录 ID 合并恢复
- [x] 设置表同步（可选）：设置项存维基云，跨设备自动同步
- [x] 站点标题/副标题自定义
- [x] 从维基云表格获取数据，无需数据库
- [x] 网站收藏功能，支持快速访问常用网站
- [x] 直接增加/编辑/删除网址，密码保护
- [x] 配置导入导出功能，支持选择导入导出项
- [x] 自定义背景颜色/渐变/图片/卡片列数

## 演示站

<https://nav.shuichanga.cn>

开户预览图
![开启](https://nav.shuichanga.cn/img/kaiqi.webp)

关闭预览图
![关闭](https://nav.shuichanga.cn/img/guanbi.webp)

## 维基云表格

[表格链接](https://vika.cn/share/shrxaWuBbbn6cKWBwvXgV/dstfGaY66aN2wyLlmX/viwullRf3ubdS)

![表格](https://nav.shuichanga.cn/img/demo2.png)

## 网站图标

### 表格 icon 字段的三种写法

不新增字段，只用 `icon` 一个文本字段表达三种意图：

| 写法 | 含义 |
| --- | --- |
| 留空（空字符串） | 自动获取图标 |
| 图片 URL | 优先使用该地址；加载失败或尺寸无效时自动降级到自动链 |
| `none` / `off`（大小写不敏感） | 不显示图标，直接显示首字母色块 |

历史数据里的 `/default.ico` 视为「留空」，不会阻止自动获取。

### 自动获取顺序

1. 记录里手填的 `icon` 地址（若可用）
2. 站点自身 `/favicon.ico`
3. 同源 `/api/favicon` 边缘函数（已部署时可用）：解析 HTML 的 `link rel="icon" / shortcut icon / apple-touch-icon`、Web App Manifest、`og:image`
4. `favicon.im` 第三方图标服务
5. `www` 与裸域互换后的另一个 `/favicon.ico`
6. `/apple-touch-icon.png`
7. 首字母 + 域名色块占位

浏览器直连无法读取跨域 HTML（CORS），所以「解析页面里的 `<link rel="icon">`」只能交给同源边缘函数或第三方服务。

### 失败缓存与降级

- **手填 URL 失败**：只缓存 **10 分钟**，窗口内直接跳过该地址；改完表格后很快就能重新生效。
- **自动链失败**：按 6h → 12h → 24h → … → 7d 指数退避，避免每次打开都重跑失败链。
- **成功结果**：缓存 30 天。
- **加载成功但内容无效**：图片解码后 `naturalWidth` / `naturalHeight` 任一小于 **16px**（含 1×1 追踪像素）视为无效，按失败处理并继续降级。`0×0` 的 SVG 无法判断尺寸，按有效处理。
- 手动地址变化、网址变化时缓存键随之变化，不会复用旧的失败结果。

### 图标巡检（只读）

设置页 →「图标巡检」→「扫描手动图标」：

- 拉取全部网站记录，只检查 `icon` 字段里真正填了图片 URL 的记录；
- 输出：记录名、原地址、失败原因（404 / 超时 / 不是图片 / 尺寸过小 / HTTP 错误 / 无法解码 / 无法连接）；
- 可勾选记录、复制清单；
- **只读，不会写回维基云**。

> 部署了 `/api/favicon` 时，巡检通过 `?inspect=1` 获取 HTTP 状态与 `content-type`，能准确区分 404 和「不是图片」。未部署时自动退化为纯前端判断，只能区分超时、尺寸过小、无法解码/无法连接，不会报错。

### 批量清理失效图标

在同一张「图标巡检」卡片里：

1. 先扫描生成清单，勾选或全选需要处理的记录；
2. 点击「备份并试写前 5 条」：会先自动下载一份 JSON 备份（记录名 + `icon` 原值），再试写前 5 条；
3. 试写结果展示后，需勾选「我已核对试写结果」并点击「确认全量清理剩余 N 条」才会继续；
4. 写入内容为空字符串，即「回到自动获取」；`none` / `off` 的记录不会出现在清单里，不会被误清。

限流与重试：

- 复用 `batchUpdateWebsiteRecords` 分块，每块 ≤100 条；
- 块与块之间间隔 ≥500ms，遵守维基云 **2 QPS**；
- 遇 `429` / `5xx` 按 1s → 2s → 4s 退避重试，最多 3 次；
- 连续失败即停止，并明确报告「已成功处理到第几条」。

> 所有写入都由用户在界面上主动点击触发，代码本身不会自动修改线上表格。

### 边缘函数（可选，建议部署）

图标解析能力由两个平台的边缘函数提供，线上路径都是 `/api/favicon`，共享同一份平台无关核心：

| 平台 | 适配器位置 | 导出签名 |
| --- | --- | --- |
| 腾讯 EdgeOne Pages | `edge-functions/api/favicon.js` | `export default function onRequest(context)` |
| Cloudflare Pages | `functions/api/favicon.js` | `export function onRequestGet(context)` |

- 抓取核心在 `shared/favicon-core.js`，只使用标准 `Request` / `Response` / `fetch` / Cache API；
- EdgeOne Pages 会自动识别仓库根目录的 `/edge-functions`，Cloudflare Pages 会自动识别 `/functions`；两个目录可以同时存在，部署到任一平台时只有对应目录生效，互不干扰；
- 函数与站点同域名，**不需要额外服务器或域名**；
- 已内置 SSRF 防护（禁止内网/回环/链路本地地址、逐跳校验重定向）、超时、响应体大小限制与缓存头；
- 成功结果缓存 7 天（边缘 30 天），失败结果缓存 1 小时。

**不部署函数时**：前端启动会探测 `/api/favicon?probe=1`。请求会落到 `index.html`（或 404），`content-type` 不是 JSON，探测自动失败并跳过同源代理，继续走 `favicon.im` 等纯前端链路，不会报错或卡住。Fork 用户无需额外配置即可正常使用。

## 安装部署


> **关于 SPA 路由回退**
>
> 项目使用 Vue Router 的 History 模式，直接访问 `/settings`、`/about`、`/search` 等子路径刷新时，需要服务器把这些路径回退到 `index.html` 交给前端路由处理。
>
> 项目已在 [`public/_redirects`](./public/_redirects) 中内置回退规则：
>
> ```
> /*    /index.html   200
> ```
>
> Cloudflare Pages 与腾讯 EdgeOne Pages 均会自动识别此文件，**无需额外配置**。其它静态托管平台（如 Vercel、Netlify）也兼容此约定。

### 方案一：使用腾讯 EdgeOne Pages 部署

我自己是使用的腾讯 EdgeOne Pages 部署的，免费快速。

1、Fork项目（<https://github.com/jianzhugo/Simple-Nav）>

2、打开下方 EdgeOne Pages 地址

[Pages地址](https://console.cloud.tencent.com/edgeone/pages)

3、点击创建项目，选择"导入Git仓库",选择刚才Fork的仓库

4、在构建部署配置中按下图填写，然后点完成就可以了。

![配置](https://nav.shuichanga.cn/img/demo3.png)

5、在项目设置中，将"环境变量"中的"VITE\_SUBMIT\_PASSWORD"设置为你自己的密码。（用于直接增加网址功能）
![获取](https://nav.shuichanga.cn/img/mima.png)

### 方案二：使用 Cloudflare Pages 部署

[Cloudflare Pages](https://pages.cloudflare.com/) 提供免费的静态站点托管，自带全球 CDN，部署本项目步骤如下。

#### 一、Fork 项目

Fork 仓库：<https://github.com/jianzhugo/Simple-Nav>

#### 二、连接 Git 仓库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，左侧选择 **Workers & Pages**。
2. 点击 **Create application** → **Pages** → **Connect to Git**。
3. 授权 Cloudflare 访问你的 GitHub 账号，选择刚才 Fork 的仓库。

#### 三、填写构建配置

| 配置项 | 值 |
| --- | --- |
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | （留空） |

#### 四、配置环境变量

在 **Settings → Environment variables** 中添加以下变量（Production 和 Preview 环境都建议配置）：

| 变量名 | 说明 |
| --- | --- |
| `VITE_VIKA_API_KEY` | 维格云 API 密钥 |
| `VITE_VIKA_DATASHEET_ID` | 维格云表格 ID |
| `VITE_VIKA_VIEW_ID` | 维格云视图 ID |
| `VITE_VIKA_SETTINGS_DATASHEET_ID` | 设置表 ID（可选，用于设置项跨设备同步） |
| `VITE_SUBMIT_PASSWORD` | 右上角直接增加网址功能的密码 |

> ⚠️ **安全提示**：以 `VITE_` 前缀开头的变量会在构建时被打包进前端 JS，任何访问者都能在浏览器源码中看到。建议只填写**只读权限**的维格云 Token；如需隐藏写操作 Key，可改用 Cloudflare Pages Functions 做一层 API 代理（需自行改造）。

#### 五、部署

点击 **Save and Deploy**，等待构建完成即可获得 `xxx.pages.dev` 的访问域名。

后续每次 push 到默认分支会自动触发部署；也可绑定自定义域名（**Custom domains** 中添加，Cloudflare 会自动签发 SSL 证书）。

#### 六、SPA 路由（已内置，无需操作）

项目根目录的 `public/_redirects` 会在构建时被拷贝到 `dist/_redirects`，Cloudflare Pages 会自动识别并应用其中的回退规则，访问 `/settings`、`/about`、`/search` 直接刷新不会出现 404。

#### 可选：使用 Wrangler 命令行部署

如不想绑定 Git，可本地构建后用 `wrangler` 直接上传：

```bash
# 安装 wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 本地构建
npm run build

# 上传部署
wrangler pages deploy dist
```

### 改数据

1、在维基云注册账号，新建表格。表格格式如下

![格式](https://nav.shuichanga.cn/img/demo4.png)

2、获取表格的APIkey、datasheetId、viewId

![获取](https://nav.shuichanga.cn/img/demo7.png)

### 配置方法

#### 方法一：通过设置界面配置

在设置中填入相应的APIkey、datasheetId、viewId。

![api](https://cdn.jsdmirror.com/gh/jianzhugo/image01/20251217130610676.png)

#### 方法二：通过环境变量配置

可以通过创建 `.env` 文件或在部署平台设置环境变量来配置，变量名如下：

- `VITE_VIKA_API_KEY`：维格云 API 密钥
- `VITE_VIKA_DATASHEET_ID`：维格云表格 ID
- `VITE_VIKA_VIEW_ID`：维格云视图 ID
- `VITE_VIKA_SETTINGS_DATASHEET_ID`：设置表 ID（可选，用于设置项跨设备同步）
- `VITE_SUBMIT_PASSWORD`：右上角直接增加网址功能的密码

**配置示例**（.env 文件）：

```env
VITE_SUBMIT_PASSWORD=你的密码
VITE_VIKA_API_KEY=your_api_key_here
VITE_VIKA_DATASHEET_ID=your_datasheet_id_here
VITE_VIKA_VIEW_ID=your_view_id_here
VITE_VIKA_SETTINGS_DATASHEET_ID=your_settings_datasheet_id_here
```

**优先级说明**：本地存储（设置界面保存的配置）优先于环境变量。环境变量仅作为初始默认值——界面上保存过配置的设备以本地为准。

3、分类与图标

侧边栏底部进入「分类管理」页（需验证密码），即可：

- 添加一级/二级分类、重命名、删除（非空分类的网站自动移入「未分类」）
- 上移/下移调整同级分类顺序
- 为分类配置图标：内置 163 个精选分组图标（支持中英文搜索），也可输入自定义 Font Awesome 类名；未配置图标的分类自动显示字母头像

4、配置导入导出与备份

- 配置导入导出：在设置中选择要导入导出的配置项，生成 JSON 文件，方便在不同电脑间使用相同配置（默认不导出 API 配置，保护敏感信息）
- 数据备份（设置页「数据备份」）：一键导出包含全部网站数据、收藏和偏好的完整 JSON；应用会自动在浏览器保留最近 3 份快照；支持从备份文件恢复，按记录 ID 合并到维基云（不会删除现有记录）

## 二级分类

无需额外的分类表，直接在网站的「分类」字段用路径写法表达层级：

| 写法 | 含义 |
| --- | --- |
| `工具` | 一级分类 |
| `工具/在线工具` | 「工具」下的二级分类 |

- 侧边栏点击一级分类聚合显示其下全部网站，点击二级分类精准筛选
- 维基云表格里手动改成路径写法同样生效，刷新即识别
- 建议配合「分类管理」页维护层级、顺序与图标

## 设置同步（可选）

如果需要在多个设备/浏览器之间同步设置项，可以使用「设置表」：

1. 在维基云同一维格表中**手动新建**一张数据表（如「站点设置」），只包含 `key`、`value` 两个文本字段
2. 将该表的 datasheetId 填入设置页「数据源配置」的「设置表ID」，或配置环境变量 `VITE_VIKA_SETTINGS_DATASHEET_ID`
3. 首次打开应用会自动把当前浏览器的设置播种到设置表；此后任何设置变更都会自动写回，其它设备打开时自动拉取

**同步范围**：主题、背景、分类层级/图标/排序、站点标题/副标题。
**不同步**：布局列数与预览开关（跟随各设备屏幕）、深色模式（跟随各设备系统偏好）、API 数据源配置（涉及密钥安全，仅存本地与部署环境变量）、收藏（随数据备份迁移）。

> 未配置设置表时所有设置仍保存在浏览器本地，功能不受影响。

## 样式说明

Tailwind CSS 已预构建为 `public/tailwind-class.css`（darkMode 为 class 策略）。如果修改代码时用到了新的 Tailwind 类，需要重新生成：

```bash
npx tailwindcss@2.2.19 -c tailwind.config.js -o public/tailwind-class.css --minify
```

## 直接增加网址

点击右上角的"+"号，输入网址和分类，即可直接增加网址。（需验证密码）
![api](https://nav.shuichanga.cn/img/zengjiawangzhi.png)

## 技术栈

- **Vue 3** — Options API
- **Vue Router** — History 模式
- **Tailwind CSS** — 原子化样式
- **Font Awesome** — 图标库
- **Vite** — 构建工具
- **维基云 (Vika)** — 数据源 API

## 其它

根据自己需要修改关于页面及其它界面代码。
