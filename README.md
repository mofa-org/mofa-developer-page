# MoFA Developer Personal Pages

为 MoFA 开发者提供个人链接页面服务，基于 Cloudflare Worker 构建。

## 功能

- **YAML配置**：配置链接和图标
- **响应式设计**：适配移动端和桌面端
- **快速访问**：通过 `用户名.mofa.ai` 访问个人页面

## 快速开始

### 1. 创建配置文件

创建你的配置文件，支持三种图标模式：

```yaml
# 自动识别（推荐）
github:
  url: https://github.com/yourusername
  icon:

# 使用内置图标名
homepage:
  url: https://yoursite.com
  icon: home

# 使用完整图标URL
custom:
  url: https://example.com
  icon: https://example.com/icon.svg
```

### 2. 添加到映射文件

在 `developers.md` 中添加你的配置：

```
[yourusername][https://raw.githubusercontent.com/your-repo/config.md]
```

### 3. 访问你的页面

页面将在 `yourusername.mofa.ai` 可用。

## 📂 示例配置

- [完整示例](examples/example-mofa-links.md) - 展示所有支持的平台和功能
- [简单示例](examples/simple-example.md) - 快速入门模板

## 🎨 支持的图标

### 热门平台
`github`, `linkedin`, `x`, `telegram`, `discord`, `youtube`, `spotify`, `instagram`, `facebook`, `tiktok`, `reddit`, `medium`, `notion`

### 中文平台
`wechat`, `weibo`, `bilibili`, `xiaohongshu`, `zhihu`, `qq`, `dingtalk`, `douyin`

### 通讯工具
`line`, `whatsapp`, `skype`, `signal`, `slack`, `zoom`, `teams`, `feishu`

### 音乐媒体
`spotify`, `youtube`, `soundcloud`, `applemusic`, `netease`, `twitch`

### 通用图标
`home`, `mail`, `music`, `message-square`

### 支付平台
`paypal`, `patreon`, `kofi`

## 🔧 配置格式

### YAML 结构

```yaml
linkname:
  url: https://example.com    # 必需：链接地址
  icon: iconname             # 可选：图标（留空自动识别）
```

### 图标使用方式

1. **留空自动识别**（推荐）
   ```yaml
   github:
     url: https://github.com/username
     icon:  # 留空，系统自动识别为GitHub图标
   ```

2. **使用内置图标名**
   ```yaml
   blog:
     url: https://myblog.com
     icon: home  # 使用内置的home图标
   ```

3. **自定义图标URL**
   ```yaml
   myservice:
     url: https://myservice.com
     icon: https://myservice.com/icon.svg
   ```

## 🌍 智能域名识别

系统自动识别常见域名并选择合适图标：

- `github.com` → GitHub图标
- `linkedin.com` → LinkedIn图标
- `x.com`, `twitter.com` → X图标
- `youtube.com` → YouTube图标
- `bilibili.com` → Bilibili图标
- 还有40+其他平台...

## 📱 页面特性

- **响应式设计**：完美适配手机和电脑
- **MoFA 品牌风格**：渐变色彩和现代设计
- **二维码分享**：一键生成页面二维码
- **快速加载**：优化的图标和缓存策略
- **无障碍支持**：支持屏幕阅读器

## 🛠️ 技术架构

- **Cloudflare Workers**：全球边缘计算
- **GitHub Pages**：配置文件托管
- **SVG图标**：矢量图标支持缩放
- **智能缓存**：提升加载速度

## 📖 开发文档

### 文件结构

```
mofa-developer-page/
├── README.md                    # 项目文档
├── developers.md               # 用户名到配置文件的映射表
├── worker.js                  # Cloudflare Worker 代码
├── examples/                  # 示例配置文件
│   ├── example-mofa-links.md  # 完整示例
│   └── simple-example.md      # 简单示例
├── resources/
│   └── icons/                 # 图标资源库
│       ├── ICON_REFERENCE.md  # 图标参考文档
│       └── *.svg              # SVG图标文件
└── username-mofa-links/       # 开发者配置文件
    └── *.md                   # 各开发者的配置
```

### 添加新图标

1. 将SVG文件添加到 `resources/icons/`
2. 在 `worker.js` 的 `ICONS` 映射中添加图标名
3. 在 `DOMAIN_TO_ICON` 中添加域名映射（如需要）

### 本地测试

```bash
# 安装依赖
npm install -g wrangler

# 本地开发
wrangler dev

# 部署到Cloudflare
wrangler publish
```

## 🤝 贡献指南

1. Fork 此仓库
2. 创建你的配置文件
3. 提交 Pull Request
4. 等待审核和合并

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [MoFA 官网](https://mofa.ai)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [图标库参考](resources/icons/ICON_REFERENCE.md)

---

由 [MoFA](https://mofa.ai) ❤️ 强力驱动
