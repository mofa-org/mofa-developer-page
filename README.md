# MoFA 开发者个人页面系统

基于子域名路由自动生成 MoFA 开发者个人页面的系统。

该项目为每位开发者创建可通过 `username.mofa.ai` 子域名访问的个人页面。

## 系统架构

### 核心组件

1. **GitHub 仓库**: `mofa-org/mofa-developer-page`
   - 包含所有开发者配置文件
   - 存储用户名到配置文件的映射关系
   - 托管 Cloudflare Worker 代码

2. **Cloudflare Workers**: 处理子域名路由和页面生成
   - 监听 `*.mofa.ai` 的请求
   - 动态从 GitHub 获取开发者配置文件
   - 渲染 HTML 页面

3. **DNS 配置**:
   - 生产环境: `*.mofa.ai` 指向 Cloudflare Workers

### 文件结构

```
mofa-developer-page/
├── README.md                 # 项目文档
├── developers.md            # 用户名到配置文件的映射表
├── worker.js               # Cloudflare Worker 代码
├── ICON_REFERENCE.md       # 图标链接大全
├── username-mofa-links/
    └── username-links.md # 开发者配置文件
    └── username-links.md # 开发者配置文件
```

## 工作原理

1. 用户访问 `username.mofa.ai`
2. Cloudflare Worker 提取子域名 `username`
3. Worker 获取 `developers.md` 找到 `username` 对应的配置文件 URL
4. Worker 获取链接的配置文件（例如来自开发者的个人仓库）
5. Worker 解析 markdown 内容并生成 HTML 页面

## 开发者配置文件格式

每位开发者维护自己的配置文件，格式如下：

```markdown
[Github][https://github.com/username] [https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/github.svg]
[LinkedIn][https://linkedin.com/in/username] [https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg]
[Twitter][https://twitter.com/username] [https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/x.svg]
[Email][mailto:user@example.com] [https://cdn.jsdelivr.net/npm/lucide@latest/dist/esm/icons/mail.svg]
```

### 链接格式
- `[显示名称][URL] [图标URL]`
- 图标 URL 使用完整的 CDN 链接，参考 `ICON_REFERENCE.md`
- 开发者可以添加任意数量的链接

## 添加新开发者

1. 创建或更新你的个人配置文件（可以在你自己的仓库中）
2. 在 `developers.md` 中添加从你的用户名到配置文件 URL 的映射（文件可以放在你自己的仓库，也可以放在username-mofa-links/ 下）
3. 提交 pull request
4. 合并后，你的页面将在 `username.mofa.ai` 上线
