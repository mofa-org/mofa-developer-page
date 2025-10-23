# MoFA Developer Personal Pages

为 MoFA 开发者提供个人链接页面服务，每位开发者都可以拥有自己的专属子域名展示页面。

## 🚀 快速添加你的页面

想要创建你自己的开发者页面？只需 3 步：

1. **📝 准备配置** - 创建链接和成就两个 YAML 文件
2. **🔀 提交 PR** - Fork 仓库并提交配置
3. **✨ 上线** - 审核通过后，你的页面将在 `你的用户名.mofa.ai` 上线

**👉 查看完整指南**：[CONTRIBUTING.md](CONTRIBUTING.md)

---

## 系统架构

本平台使用三个核心配置文件：

### 1. 开发者映射文件 (`developers.md`)
将用户名映射到其配置文件：
```markdown
[username][配置文件URL]
```
例如：`[bh3gei][https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/username-mofa-links/bh3gei-mofa-links.yml]`

### 2. 链接配置文件 (`username-mofa-links/username-mofa-links.yml`)
定义个人社交链接和作品集，采用YAML格式：
```yaml
github:
  url: https://github.com/username
  icon: github

portfolio:
  url: https://yoursite.com
  icon: home
```

### 3. 成就档案文件 (`achievements/username-achievements.yml`)
包含右侧边栏展示的三个主要部分：
- **GitHub Activity**：最近的GitHub活动（手动配置）
- **Awards**：获奖信息和成就
- **Repository Showcase**：精选项目仓库展示

## 快速开始

```bash

sudo nohup NODE_ENV=production node server.js > logs/server.log 2>&1 &

```

```bash
sudo pm2 start server.js --name mofa-developer-page --env production
sudo pm2 save
```
