# 贡献指南 - 添加你的开发者页面

欢迎加入 MoFA Developer 开发者社区！本指南将帮助你创建并提交自己的个人页面配置。

## 📋 目录

- [快速开始](#快速开始)
- [配置文件格式](#配置文件格式)
- [示例参考](#示例参考)
- [提交流程](#提交流程)
- [布局说明](#布局说明)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 🚀 快速开始

### 第一步：准备配置文件

你需要创建两个 YAML 配置文件：

1. **社交链接配置** (`username-mofa-links.yml`)
2. **成就档案配置** (`username-achievements.yml`)

### 第二步：Fork 仓库

1. 访问 [mofa-org/mofa-developer-page](https://github.com/mofa-org/mofa-developer-page)
2. 点击右上角 **Fork** 按钮
3. Clone 你的 Fork 到本地

```bash
git clone https://github.com/YOUR_USERNAME/mofa-developer-page.git
cd mofa-developer-page
```

### 第三步：创建配置文件

```bash
# 创建链接配置文件
touch username-mofa-links/YOUR_USERNAME-mofa-links.yml

# 创建成就配置文件
touch achievements/YOUR_USERNAME-achievements.yml
```

---

## 📝 配置文件格式

### 1. 社交链接配置 (`username-mofa-links.yml`)

```yaml
# 必填：GitHub 链接
github:
  url: https://github.com/YOUR_USERNAME
  icon:  # 留空自动识别 GitHub 图标

# 可选：个人主页
homepage:
  url: https://yourwebsite.com
  icon: home

# 可选：邮箱
email:
  url: mailto:your.email@example.com
  icon: mail

# 可选：LinkedIn
linkedin:
  url: https://www.linkedin.com/in/YOUR_USERNAME
  icon:  # 留空自动识别

# 可选：Twitter/X
twitter:
  url: https://twitter.com/YOUR_USERNAME
  icon:

# 可选：其他社交平台
# 支持 40+ 种平台：telegram, discord, youtube, bilibili,
# wechat, line, whatsapp, spotify, 等
```

**支持的平台列表**：
- 开发平台：GitHub, GitLab, Bitbucket
- 社交媒体：Twitter, LinkedIn, Facebook, Instagram
- 即时通讯：Telegram, Discord, WeChat, Line, WhatsApp
- 视频平台：YouTube, Bilibili, TikTok
- 音乐平台：Spotify, 网易云音乐, Apple Music
- 其他：Medium, Stack Overflow, Dribbble, Behance

---

### 2. 成就档案配置 (`username-achievements.yml`)

```yaml
# GitHub 用户名（必填）
githubUsername: YOUR_USERNAME

# 是否显示 GitHub 统计数据（可选，默认 false）
enableGithubStats: false

# 荣誉认证列表（可选）
awards:
  - title: "奖项名称"
    rank: "获奖等级/名次"
    description: "项目描述或获奖原因"
    team: "团队成员"
    date: "获奖日期"
    certNumber: "认证编号"
    image: "证书图片URL（可选）"

# 精选仓库列表（可选）
repositories:
  - name: "username/repo-name"
    description: "项目简介"
    language: "主要编程语言"
    stars: 100
    url: "https://github.com/username/repo-name"

# GitHub 活动（可选，暂未启用）
activities: []
```

---

## 🎯 示例参考

我们提供了多个示例配置，涵盖不同使用场景：

### 📦 示例 1：完整展示 (example1)

**适用场景**：内容丰富的开发者（9个链接 + 2个奖项 + 4个项目）

**访问地址**：[example1.mofa.ai](https://example1.mofa.ai)

**配置文件**：
- [example1-mofa-links.yml](username-mofa-links/example1-mofa-links.yml)
- [example1-achievements.yml](achievements/example1-achievements.yml)

**布局效果**：左右双列布局（0.5:4.5 比例）

---

### 🎨 示例 2：极简风格 (example2)

**适用场景**：简洁至上（2个链接，无成就）

**访问地址**：[example2.mofa.ai](https://example2.mofa.ai)

**配置文件**：
- [example2-mofa-links.yml](username-mofa-links/example2-mofa-links.yml)
- [example2-achievements.yml](achievements/example2-achievements.yml)

**布局效果**：稀疏布局（单屏居中，横向图标）

---

### 🏆 示例 3：精选展示 (example3)

**适用场景**：突出重点（1个链接 + 1个奖项 + 1个项目）

**访问地址**：[example3.mofa.ai](https://example3.mofa.ai)

**配置文件**：
- [example3-mofa-links.yml](username-mofa-links/example3-mofa-links.yml)
- [example3-achievements.yml](achievements/example3-achievements.yml)

**布局效果**：稀疏布局（宽扁卡片设计）

---

### 🔍 示例 4-6：边界测试

- **example4**：4项内容（稀疏布局上限）
- **example5**：6项内容（正常布局下限）
- **example6**：10项内容（中等密度）

---

## 🔄 提交流程

### 1. 编辑映射文件

打开 `developers.md`，在 `## 开发者映射表` 部分添加你的映射：

```markdown
[YOUR_USERNAME][https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/username-mofa-links/YOUR_USERNAME-mofa-links.yml]
```

**完整示例**：

```markdown
## 开发者映射表

[example][https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/username-mofa-links/example-mofa-links.yml]
[bh3gei][https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/username-mofa-links/bh3gei-mofa-links.yml]
[YOUR_USERNAME][https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/username-mofa-links/YOUR_USERNAME-mofa-links.yml]
```

### 2. 本地测试（可选）

如果你想在本地测试配置：

```bash
# 安装依赖（项目无依赖）
npm install

# 启动本地服务器
node server.js

# 访问测试页面
# http://localhost/
```

### 3. 提交更改

```bash
# 添加文件
git add developers.md
git add username-mofa-links/YOUR_USERNAME-mofa-links.yml
git add achievements/YOUR_USERNAME-achievements.yml

# 提交
git commit -m "feat: Add YOUR_USERNAME developer page

- Add social links configuration
- Add achievements profile
- Register in developers.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 推送到你的 Fork
git push origin main
```

### 4. 创建 Pull Request

1. 访问你的 Fork 页面
2. 点击 **Contribute** → **Open pull request**
3. 填写 PR 信息：

**标题格式**：
```
feat: Add [YOUR_USERNAME] developer page
```

**描述模板**：
```markdown
## 添加开发者页面

**用户名**：YOUR_USERNAME

**访问地址**：YOUR_USERNAME.mofa.ai

**配置内容**：
- ✅ 社交链接配置
- ✅ 成就档案配置
- ✅ 映射表注册

**预览截图**（可选）：
[附上页面截图]

---

我已阅读并遵循贡献指南。
```

4. 点击 **Create pull request**

### 5. 等待审核

- 维护者会在 1-3 个工作日内审核你的 PR
- 如有问题会在 PR 中留言
- 审核通过后，你的页面将在 `YOUR_USERNAME.mofa.ai` 上线！

---

## 🎨 布局说明

系统会根据你的内容总量自动选择最佳布局：

### 稀疏布局（≤5 项内容）

**适用条件**：`总项数 = 链接数 + 奖项数 + 项目数 ≤ 5`

**特点**：
- ✨ 单列居中设计
- 📐 宽扁卡片（1080px 宽）
- 🎯 单屏显示，无需滚动
- 🔘 链接显示为横向图标按钮
- 🏅 MoFA 认证印章（36px，不遮挡内容）

**示例**：example2, example3, example4

---

### 正常布局（>5 项内容）

**适用条件**：`总项数 > 5`

**特点**：
- 📊 左右双列布局（0.5:4.5 比例）
- 📱 左侧：用户信息 + 社交链接（可滚动）
- 🏆 右侧：成就展示 + 精选项目（可滚动）
- 🎨 流体网格布局（Pinterest 风格）
- 🌈 马卡龙配色 + 蒙德里安装饰

**示例**：example1, example5, example6, bh3gei

---

## 💡 最佳实践

### 1. 图标选择

**自动识别图标**：
```yaml
github:
  url: https://github.com/username
  icon:  # 留空，自动识别为 GitHub 图标
```

**手动指定内置图标**：
```yaml
homepage:
  url: https://example.com
  icon: home  # 使用内置图标名称
```

**使用自定义图标**：
```yaml
custom:
  url: https://example.com
  icon: https://example.com/icon.svg  # 自定义图标 URL
```

### 2. 链接优先级

建议按重要性排序：
1. GitHub（必填）
2. 个人网站/博客
3. 邮箱
4. LinkedIn
5. 其他社交平台

### 3. 奖项描述

**推荐格式**：
```yaml
awards:
  - title: "比赛/奖项完整名称"
    rank: "获奖等级（第一名/二等奖/优秀奖）"
    description: "项目主题或获奖原因（1-2句话）"
    team: "团队成员姓名"
    date: "YYYY年MM月"
    certNumber: "唯一认证编号"
    image: "高清证书图片 URL"
```

### 4. 项目筛选

**选择标准**：
- ⭐ 优先选择 Star 数较多的项目
- 🎯 代表你技术能力的项目
- 🔥 近期活跃维护的项目
- 💡 有创新性/独特性的项目

**建议数量**：
- 稀疏布局：1-2 个精选项目
- 正常布局：3-5 个代表项目

### 5. 内容精简

**稀疏布局用户**（≤5项）：
- 精选最重要的 1-2 个联系方式
- 突出 1 个最重要的成就
- 展示 1 个最佳项目
- 目标：单屏完整展示

**正常布局用户**（>5项）：
- 可以展示更多链接（建议 ≤10 个）
- 奖项建议 ≤3 个
- 项目建议 ≤5 个

---

## ❓ 常见问题

### Q1: 我的 GitHub 用户名和页面用户名必须一致吗？

**A**: 不必须。`githubUsername` 用于拉取 GitHub 数据（头像、统计），页面用户名在 `developers.md` 中定义，二者可以不同。

### Q2: 我没有奖项和项目，可以只配置链接吗？

**A**: 可以！参考 [example2](https://example2.mofa.ai)，只配置基础链接也完全没问题。系统会自动使用稀疏布局。

### Q3: 配置文件可以用中文吗？

**A**: 完全支持！`title`、`description`、`team` 等字段都支持中文。

### Q4: 如何更新我的配置？

**A**: 再次提交 PR，修改你的配置文件即可。维护者审核通过后，页面会自动更新。

### Q5: 多久能看到我的页面？

**A**:
1. PR 合并后立即生效
2. 由于有 10 秒缓存，最多等待 10 秒即可看到更新

### Q6: 我可以使用自己的域名吗？

**A**: 目前仅支持 `*.mofa.ai` 和 `*.liyao.space` 子域名。自定义域名需要联系管理员。

### Q7: enableGithubStats 有什么用？

**A**: 设置为 `true` 时，会显示你的 GitHub 头像和基础统计（粉丝数、仓库数）。需要你的 GitHub 用户名存在。

### Q8: 支持哪些图片格式？

**A**:
- **图标**：SVG、PNG（推荐 SVG，支持缩放）
- **证书图片**：JPG、PNG、WebP（建议 ≤1MB）

### Q9: 图标没有显示怎么办？

**A**:
1. 检查 URL 是否可公开访问
2. 检查图片格式是否支持
3. 尝试使用内置图标名称（如 `home`、`mail`）

### Q10: 如何查看支持的内置图标？

**A**: 查看 [username-mofa-links/icons/](username-mofa-links/icons/) 目录，或参考 [example1 配置](username-mofa-links/example1-mofa-links.yml)。

---

## 📞 联系我们

如有疑问或建议，欢迎：

- 📧 提交 [Issue](https://github.com/mofa-org/mofa-developer-page/issues)
- 💬 在 PR 中留言
- 🌐 访问 [MoFA 官网](https://mofa.ai)

---

**感谢你加入 MoFA Developer 社区！🎉**

我们期待看到你的精彩页面！
