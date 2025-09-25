# MoFA 成就展示系统

记录和展示 MoFA 开发者贡献、获奖和项目的系统。

## 成就档案结构

每个成就文件 (`{username}-achievements.md`) 包含三个展示部分：

### 1. GitHub Activity
手动配置的最近GitHub活动：
```markdown
## GitHub Activity
- 推送代码 in username/project (2小时前)
- 创建仓库 in username/new-repo (1天前)
- 关注仓库 in popular/project (2天前)
```

### 2. Awards  
获奖信息和成就：
```markdown
## Awards

### 比赛名称 2024
- **Award**: 获奖等级
- **Project**: 项目描述
- **Team**: 团队成员
- **Date**: 获奖日期
```

### 3. Repository Showcase
精选仓库展示：
```markdown
## Repository Showcase

- **username/project-name**
  - Description: 项目描述
  - Language: 编程语言
  - Stars: Star数量
```

## 文件格式示例

完整的成就文件结构：

```markdown
# username - MoFA Achievements

## GitHub Activity
- 推送代码 in username/awesome-project (3小时前)
- 创建仓库 in username/new-tool (1天前)

## Awards

### AI Hackathon 2024
- **Award**: First Place Winner
- **Project**: Smart automation system
- **Team**: username, teammate1, teammate2
- **Date**: October 2024

## Repository Showcase

- **username/project**
  - Description: Project description
  - Language: Python
  - Stars: 42

---
*Last updated: January 2025*
*Maintained by: MoFA Core Team*
```

## 申请流程

1. **准备材料**：整理GitHub贡献、获奖证书、项目信息
2. **创建文件**：按照格式创建 `{username}-achievements.md`
3. **提交PR**：或通过GitHub Issue提交申请
4. **审核批准**：Core Team审核后合并

## 展示效果

成就信息会在个人页面右侧展示：
- 左侧：社交链接流式卡片布局
- 右侧：三部分成就展示（GitHub Activity、Awards、Repository Showcase）

详细系统说明请参考主 [README.md](../README.md)。

---
*由 MoFA Core Team 维护*