# 贡献指南 - 添加你的开发者页面

欢迎加入 MoFA Developer 开发者社区！本指南将帮助你创建并提交自己的个人页面配置。

---

## 🚀 快速开始

### 第一步：准备配置文件

你需要创建两个 YAML 配置文件：

1. **社交链接配置** (`username-mofa-links.yml`)
2. **成就档案配置** (`username-achievements.yml`)

注意：username建议使用你的github username。
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
# 命令仅供示例，可以使用GUI操作

# 创建链接配置文件
touch username-mofa-links/YOUR_USERNAME-mofa-links.yml

# 创建成就配置文件
touch achievements/YOUR_USERNAME-achievements.yml
```

---

#### 📝 配置文件格式

##### 1. 社交链接配置 (`username-mofa-links/username-mofa-links.yml`)

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

###### 支持的平台列表：
- 开发平台：GitHub, GitLab, Bitbucket
- 社交媒体：Twitter, LinkedIn, Facebook, Instagram
- 即时通讯：Telegram, Discord, WeChat, Line, WhatsApp
- 视频平台：YouTube, Bilibili, TikTok
- 音乐平台：Spotify, 网易云音乐, Apple Music
- 其他：Medium, Stack Overflow, Dribbble, Behance


##### 2. 成就档案配置 (`achievements/username-achievements.yml`)

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

```
##### 3. 编辑映射文件

打开 `developers.md`，在 `## 开发者映射表` 部分添加你的映射：

```markdown
[YOUR_USERNAME][https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/username-mofa-links/YOUR_USERNAME-mofa-links.yml]
```

完整示例：

```markdown
## 开发者映射表

[example][https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/username-mofa-links/example-mofa-links.yml]
[YOUR_USERNAME][https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/username-mofa-links/YOUR_USERNAME-mofa-links.yml]

```

---

## 🎯 示例参考


### 📦 示例 1：


**访问地址**：[example1.mofa.ai](https://example1.mofa.ai)

**配置文件**：
- [example1-mofa-links.yml](username-mofa-links/example1-mofa-links.yml)
- [example1-achievements.yml](achievements/example1-achievements.yml)


---

### 🎨 示例 2：

**访问地址**：[example3.mofa.ai](https://example3.mofa.ai)

**配置文件**：
- [example3-mofa-links.yml](username-mofa-links/example3-mofa-links.yml)
- [example3-achievements.yml](achievements/example3-achievements.yml)


---

## 🔄 提交流程


### 1. 创建和修改文件

### 3. 提交更改

```bash
# 添加文件
git add developers.md
git add username-mofa-links/YOUR_USERNAME-mofa-links.yml
git add achievements/YOUR_USERNAME-achievements.yml

# 提交
git commit -m "feat: Add YOUR_USERNAME developer page"

# 推送到你的 Fork
git push origin main

```

### 4. 创建 Pull Request

1. 访问你的 Fork 页面
2. 点击 **Contribute** → **Open pull request**
3. 填写 PR 信息


4. 点击 **Create pull request**

### 5. 等待审核

- 维护者会在 1-3 个工作日内审核你的 PR
- 如有问题会在 PR 中留言
- 审核通过后，你的页面将在 `YOUR_USERNAME.mofa.ai` 上线！

---

## ❓ 常见问题

### Q1: 我的 GitHub 用户名和页面用户名必须一致吗？

**A**: 不必须。`githubUsername` 用于拉取 GitHub 数据（头像、统计），页面用户名在 `developers.md` 中定义，二者可以不同。

### Q2: 我没有奖项和项目，可以只配置链接吗？

**A**: 可以！参考 [example2](https://example2.mofa.ai)，只配置基础链接也完全没问题。系统会自动使用稀疏布局展示。

### Q3: 配置文件可以用中文吗？

**A**: 完全支持！`title`、`description`、`team` 等字段都支持中文。

### Q4: 如何更新我的配置？

**A**: 再次提交 PR，修改你的配置文件即可。维护者审核通过后，页面会自动更新。

### Q5: 多久能看到我的页面？

**A**:
1. PR 合并后立即生效
2. 由于有 10 秒缓存，最多等待 10 秒即可看到更新

### Q6: 我可以使用自己的域名吗？

**A**: 目前仅支持 `*.mofa.ai` 子域名。自定义域名需要联系管理员。

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
