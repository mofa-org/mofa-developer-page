/**
 * MoFA Developer Personal Pages
 * Node.js HTTP Server for generating developer profile pages
 * 迁移自 Cloudflare Worker 版本
 */

const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

// 配置常量
const CONFIG = {
  GITHUB_API_BASE: "https://api.github.com",
  GITHUB_RAW_BASE: "https://raw.githubusercontent.com",
  REPO_OWNER: "mofa-org", 
  REPO_NAME: "mofa-developer-page",
  DEVELOPERS_FILE: "developers.md",
  CACHE_TTL: 10, // 10秒短缓存（开发模式）
  PRODUCTION_DOMAIN: "mofa.ai",
  TEST_DOMAIN: "liyao.space",
  PORT: process.env.PORT || 80,
  HTTPS_PORT: process.env.HTTPS_PORT || 443,
  SSL_CERT: process.env.SSL_CERT || '/etc/letsencrypt/live/mofa.ai/fullchain.pem',
  SSL_KEY: process.env.SSL_KEY || '/etc/letsencrypt/live/mofa.ai/privkey.pem',
};

// 简单的内存缓存实现
class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  put(key, data, ttl = CONFIG.CACHE_TTL) {
    const expiresAt = Date.now() + (ttl * 1000);
    this.cache.set(key, { data, expiresAt });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new SimpleCache();

// MoFA 品牌颜色 - 与官网完全一致的配置
const COLORS = {
  // 蒙德里安经典色系
  "mondrian-red": "#D32F2F", // 经典红色 - 深度而纯粹
  "mondrian-blue": "#1976D2", // 经典蓝色 - 沉稳而优雅
  "mondrian-yellow": "#FFB300", // 经典黄色 - 明亮而温暖
  "mondrian-black": "#2D3748", // 稍微柔和的深灰色
  "mondrian-white": "#FFFFFF",
  "mondrian-gray": "#E2E8F0", // 更柔和的灰色

  // MoFA 专用四色渐变
  "mofa-gradient-1": "#FB6A58", // 珊瑚橙红
  "mofa-gradient-2": "#FD543F", // 活力红
  "mofa-gradient-3": "#FFC63E", // 明亮黄
  "mofa-gradient-4": "#6DCACE", // 青蓝色

  // 扩展马卡龙色系
  "macaron-peach": "#FFB5A7", // 马卡龙桃粉色，温柔浪漫
  "macaron-lavender": "#C7CEEA", // 马卡龙薰衣草紫，典雅舒缓
  "macaron-mint": "#A8E6CF", // 马卡龙薄荷绿，清新自然
  "macaron-lemon": "#FFE4B3", // 马卡龙柠檬黄，明亮温暖
  "macaron-rose": "#F8BBD9", // 马卡龙玫瑰粉，甜美温馨
  "macaron-sky": "#B3E5FC", // 马卡龙天空蓝，宁静清澈
  "macaron-coral": "#FFAB91", // 马卡龙珊瑚橙，活泼亲和
  "macaron-sage": "#C8E6C9", // 马卡龙鼠尾草绿，自然沉静

  // 主色调简写 (向后兼容)
  red: "#D32F2F",
  blue: "#1976D2",
  yellow: "#FFB300",
  gradient1: "#FB6A58",
  gradient2: "#FD543F",
  gradient3: "#FFC63E",
  gradient4: "#6DCACE",
  black: "#2D3748",
  white: "#FFFFFF",
  gray: "#E2E8F0",
};

// URL域名到图标的智能映射
const DOMAIN_TO_ICON = {
  "github.com": "github",
  "linkedin.com": "linkedin",
  "twitter.com": "x",
  "x.com": "x",
  "t.me": "telegram",
  "telegram.org": "telegram",
  "line.me": "line",
  "web.whatsapp.com": "whatsapp",
  "wa.me": "whatsapp",
  "discord.gg": "discord",
  "discord.com": "discord",
  "steamcommunity.com": "steam",
  "store.steampowered.com": "steam",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "open.spotify.com": "spotify",
  "spotify.com": "spotify",
  "facebook.com": "facebook",
  "fb.com": "facebook",
  "instagram.com": "instagram",
  "tiktok.com": "tiktok",
  "snapchat.com": "snapchat",
  "reddit.com": "reddit",
  "pinterest.com": "pinterest",
  "twitch.tv": "twitch",
  "medium.com": "medium",
  "notion.so": "notion",
  "paypal.com": "paypal",
  "paypal.me": "paypal",
  "patreon.com": "patreon",
  "ko-fi.com": "kofi",
  "mastodon.social": "mastodon",
  "signal.org": "signal",
  "viber.com": "viber",
  "slack.com": "slack",
  "zoom.us": "zoom",
  "teams.microsoft.com": "teams",
  "music.apple.com": "applemusic",
  "soundcloud.com": "soundcloud",
  "music.163.com": "netease",
  // 中文平台
  "weibo.com": "weibo",
  "zhihu.com": "zhihu",
  "douban.com": "douban",
  "qq.com": "qq",
  "dingtalk.com": "dingtalk",
  "douyin.com": "douyin",
  "xiaohongshu.com": "xiaohongshu",
  "bilibili.com": "bilibili",
  "space.bilibili.com": "bilibili",
  "feishu.cn": "message-square",
  "lark.com": "message-square",
  "raw.githubusercontent.com": "home",
};

// 获取远程文件的辅助函数
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const module = url.startsWith('https:') ? https : http;
    
    module.get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ 
        ok: res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        text: () => Promise.resolve(data),
        json: () => Promise.resolve(JSON.parse(data))
      }));
    }).on('error', reject);
  });
}

// 图标处理函数 - 从GitHub raw获取图标文件
async function handleIconRequest(pathname) {
  const iconName = pathname.replace("/icons/", "").replace(".svg", "");

  try {
    const iconUrl = `${CONFIG.GITHUB_RAW_BASE}/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/main/resources/icons/${iconName}.svg`;
    console.log("🎨 Fetching icon from:", iconUrl);
    const response = await fetchUrl(iconUrl);

    if (response.ok) {
      const svg = await response.text();
      console.log("✅ Icon fetched successfully:", iconName);
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400",
        },
        body: svg
      };
    } else {
      console.error("❌ Icon fetch failed:", iconName, response.status);
    }
  } catch (error) {
    console.error("❌ Error fetching icon:", iconName, error);
  }

  // 返回message-square图标作为默认
  const defaultIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
    body: defaultIcon
  };
}

// 智能图标选择函数
function getIconForLink(linkUrl, iconHint) {
  console.log("🔍 getIconForLink called with url:", linkUrl, "iconHint:", iconHint);

  // 1. 如果明确指定了图标
  if (iconHint) {
    console.log("📌 Using specified icon hint:", iconHint);
    // 如果是完整URL，直接返回
    if (iconHint.startsWith("http")) {
      console.log("🌐 Using full URL icon:", iconHint);
      return iconHint;
    }
    // 如果是图标名，返回本地路径
    const iconPath = `/icons/${iconHint}.svg`;
    console.log("📦 Using built-in icon:", iconPath);
    return iconPath;
  }

  // 2. 根据URL域名自动选择图标
  try {
    const urlObj = new URL(linkUrl);
    const domain = urlObj.hostname.toLowerCase();
    const fullUrl = linkUrl.toLowerCase();
    console.log("🌐 Analyzing domain:", domain, "fullUrl:", fullUrl);

    // 特殊处理：根据URL内容判断（不区分大小写）
    if (fullUrl.includes("wechat")) {
      console.log("✅ WeChat detected in URL");
      return `/icons/wechat.svg`;
    }
    if (fullUrl.includes("skype")) {
      console.log("✅ Skype detected in URL");
      return `/icons/skype.svg`;
    }
    if (fullUrl.includes("whatsapp")) {
      console.log("✅ WhatsApp detected in URL");
      return `/icons/whatsapp.svg`;
    }

    // 标准域名匹配
    for (const [domainPattern, iconName] of Object.entries(DOMAIN_TO_ICON)) {
      if (domain.includes(domainPattern)) {
        const iconPath = `/icons/${iconName}.svg`;
        console.log(`✅ Domain match found: ${domain} includes ${domainPattern} → ${iconPath}`);
        return iconPath;
      }
    }
    console.log("❌ No domain match found for:", domain);
  } catch (e) {
    console.error("❌ URL parsing failed:", linkUrl, e);
  }

  // 3. 默认图标
  if (linkUrl.includes("mailto:")) {
    console.log("📧 Using mail icon for mailto");
    return `/icons/mail.svg`;
  }
  if (linkUrl.includes("tel:")) {
    console.log("📞 Using phone icon for tel");
    return `/icons/phone.svg`;
  }

  console.log("🏠 Using default home icon");
  return `/icons/home.svg`;
}

// 检查是否是子域名请求
function isSubdomainRequest(hostname) {
  return (
    hostname.endsWith(`.${CONFIG.PRODUCTION_DOMAIN}`) ||
    hostname.endsWith(`.${CONFIG.TEST_DOMAIN}`)
  );
}

// 提取用户名
function extractUsername(hostname) {
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

// 获取开发者配置
async function getDeveloperConfig(username) {
  console.log("🔍 getDeveloperConfig called with username:", username);
  const cacheKey = `config:${username}`;

  // 尝试从缓存获取
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log("📦 Found cached config");
    console.log("📦 Cached configUrl:", cached.configUrl);
    return cached.configUrl;
  }

  try {
    // 获取 developers.md 文件
    const url = `${CONFIG.GITHUB_RAW_BASE}/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/main/${CONFIG.DEVELOPERS_FILE}`;
    console.log("🌐 Fetching developers mapping from:", url);

    const response = await fetchUrl(url);

    if (!response.ok) {
      console.error("❌ Failed to fetch developers mapping, status:", response.status);
      throw new Error("Failed to fetch developers mapping");
    }

    const content = await response.text();
    console.log("📄 developers.md content length:", content.length);
    console.log("📄 developers.md content preview:", content.substring(0, 200));

    const configUrl = parseUsernameMapping(content, username);
    console.log("🔗 Parsed configUrl for", username, ":", configUrl);

    // 缓存结果
    cache.put(cacheKey, { configUrl });

    return configUrl;
  } catch (error) {
    console.error("❌ Error fetching developer config:", error);
    return null;
  }
}

function parseUsernameMapping(content, username) {
  console.log("🔍 parseUsernameMapping called for username:", username);
  // 解析格式: [username][config-url]
  const lines = content.split("\n");
  console.log("📝 Total lines in developers.md:", lines.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`📝 Line ${i}: "${line}"`);
    const match = line.match(/^\[([^\]]+)\]\[([^\]]+)\]$/);
    if (match) {
      console.log(`✅ Found mapping: "${match[1]}" -> "${match[2]}"`);
      if (match[1] === username) {
        console.log(`🎯 Found match for username: ${username}`);
        return match[2];
      }
    }
  }

  console.log(`❌ No mapping found for username: ${username}`);
  return null;
}

async function parseConfigFile(configUrl) {
  console.log("🔗 parseConfigFile called with URL:", configUrl);
  try {
    const response = await fetchUrl(configUrl);

    if (!response.ok) {
      console.error("❌ Failed to fetch config file, status:", response.status);
      throw new Error("Failed to fetch config file");
    }

    const content = await response.text();
    console.log("📄 Config file content length:", content.length);
    console.log("📄 Config file preview:", content.substring(0, 300));

    const links = parseLinks(content);
    console.log("🔗 Parsed links count:", links.length);
    console.log("🔗 Parsed links:", JSON.stringify(links, null, 2));

    return links;
  } catch (error) {
    console.error("❌ Error parsing config file:", error);
    return [];
  }
}

function parseLinks(content) {
  console.log("📋 parseLinks called");
  // 解析YAML格式配置文件
  const links = [];

  try {
    const lines = content.split("\n");
    console.log("📝 Total lines to process:", lines.length);
    let currentLink = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      console.log(`📝 Line ${i}: "${trimmed}"`);

      if (!trimmed) continue;

      // 匹配主键 (链接名称) - 格式: linkname:
      const keyMatch = trimmed.match(/^([a-zA-Z0-9_-]+):\s*$/);
      if (keyMatch) {
        console.log(`🔑 Found key: "${keyMatch[1]}"`);
        // 保存前一个链接
        if (currentLink.name && currentLink.url) {
          // 使用智能图标选择
          currentLink.icon = getIconForLink(currentLink.url, currentLink.iconHint);
          console.log(`✅ Adding completed link:`, currentLink);
          links.push(currentLink);
        }
        // 开始新的链接，使用首字母大写的显示名称
        currentLink = {
          name: keyMatch[1].charAt(0).toUpperCase() + keyMatch[1].slice(1),
        };
        console.log(`🆕 Started new link: "${currentLink.name}"`);
        continue;
      }

      // 匹配url字段 - 格式: url: https://...
      const urlMatch = trimmed.match(/^url:\s*(.+)$/);
      if (urlMatch && currentLink.name) {
        currentLink.url = urlMatch[1].trim();
        console.log(`🔗 Added URL: "${currentLink.url}"`);
        continue;
      }

      // 匹配icon字段 - 格式: icon: https://... 或 icon: github 或 留空
      const iconMatch = trimmed.match(/^icon:\s*(.*)$/);
      if (iconMatch && currentLink.name) {
        const iconValue = iconMatch[1].trim();
        currentLink.iconHint = iconValue === "" ? null : iconValue; // 空字符串转为null
        console.log(`🎨 Added icon hint: "${iconValue}" (processed: ${currentLink.iconHint})`);
        continue;
      }
    }

    // 添加最后一个链接
    if (currentLink.name && currentLink.url) {
      currentLink.icon = getIconForLink(currentLink.url, currentLink.iconHint);
      console.log(`✅ Adding final link:`, currentLink);
      links.push(currentLink);
    }

    console.log(`📋 Final parsed links count: ${links.length}`);
  } catch (error) {
    console.error("❌ Error parsing YAML config:", error);
  }

  return links;
}

// 获取用户成就数据
async function fetchUserAchievements(username) {
  try {
    const achievementUrl = `https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/achievements/${username}-achievements.yml`;
    console.log("🏆 Fetching achievements from:", achievementUrl);

    const response = await fetchUrl(achievementUrl);
    if (!response.ok) {
      console.log("📝 No achievements file found for user:", username);
      return null;
    }

    const content = await response.text();
    console.log("✅ Achievements loaded successfully");
    return parseAchievements(content);
  } catch (error) {
    console.error("❌ Error fetching achievements:", error);
    return null;
  }
}

// 解析成就YAML文件
function parseAchievements(content) {
  const achievements = {
    githubUsername: null,
    enableGithubStats: true,
    contributions: [],
    hackathons: [],
    recognition: [],
    currentProjects: [],
    repositories: [],
    activities: [],
  };

  // 简单的YAML解析 - awards部分
  const awardsMatch = content.match(/awards:\s*([\s\S]*?)(?=\n\w+:|$)/);
  if (awardsMatch) {
    const awardsText = awardsMatch[1];
    const awardBlocks = awardsText
      .split(/\n  - /)
      .filter((block) => block.trim());

    awardBlocks.forEach((block) => {
      const award = {};
      const lines = block.split("\n");

      lines.forEach((line) => {
        const trimmed = line.trim().replace(/^- /, "");
        if (trimmed.includes(":")) {
          const [key, ...valueParts] = trimmed.split(":");
          const value = valueParts.join(":").trim().replace(/['"]/g, "");
          if (key.trim() && value) {
            award[key.trim()] = value;
          }
        }
      });

      if (award.title) {
        // 转换为原来的格式
        const content = [
          `- **名次**: ${award.rank || ""}`,
          `- **项目介绍**: ${award.description || ""}`,
          `- **获奖人**: ${award.team || ""}`,
          `- **时间**: ${award.date || ""}`,
        ].join("\n");

        achievements.hackathons.push({
          title: award.title,
          content: content,
          image: award.image || null,
          certNumber: award.certNumber || null,
        });
      }
    });
  }

  // 解析githubUsername
  const usernameMatch = content.match(/githubUsername:\s*(.+)/);
  if (usernameMatch) {
    achievements.githubUsername = usernameMatch[1].trim();
  }

  // 解析repositories
  const reposMatch = content.match(/repositories:\s*([\s\S]*?)(?=\n\w+:|$)/);
  if (reposMatch) {
    const reposText = reposMatch[1];
    const repoBlocks = reposText
      .split(/\n  - /)
      .filter((block) => block.trim());

    repoBlocks.forEach((block) => {
      const repo = {};
      const lines = block.split("\n");

      lines.forEach((line) => {
        const trimmed = line.trim().replace(/^- /, "");
        if (trimmed.includes(":")) {
          const [key, ...valueParts] = trimmed.split(":");
          const value = valueParts.join(":").trim().replace(/['"]/g, "");
          if (key.trim() && value) {
            repo[key.trim()] = key.trim() === "stars" ? parseInt(value) || 0 : value;
          }
        }
      });

      if (repo.name) {
        achievements.repositories.push(repo);
      }
    });
  }

  // 解析activities
  const activitiesMatch = content.match(/activities:\s*([\s\S]*?)(?=\n\w+:|$)/);
  if (activitiesMatch) {
    const activitiesText = activitiesMatch[1];
    const activityBlocks = activitiesText
      .split(/\n  - /)
      .filter((block) => block.trim());

    activityBlocks.forEach((block) => {
      const activity = {};
      const lines = block.split("\n");

      lines.forEach((line) => {
        const trimmed = line.trim().replace(/^- /, "");
        if (trimmed.includes(":")) {
          const [key, ...valueParts] = trimmed.split(":");
          const value = valueParts.join(":").trim().replace(/['"]/g, "");
          if (key.trim() && value) {
            activity[key.trim()] = value;
          }
        }
      });

      if (activity.type && activity.repo) {
        achievements.activities.push(activity);
      }
    });
  }

  console.log("🏆 Parsed achievements:", achievements);
  return achievements;
}

// 获取GitHub统计数据
async function fetchGithubStats(username) {
  if (!username) return null;

  try {
    const response = await fetchUrl(`https://api.github.com/users/${username}`);
    if (!response.ok) return null;

    const userData = await response.json();
    return {
      followers: userData.followers,
      following: userData.following,
      publicRepos: userData.public_repos,
      avatarUrl: userData.avatar_url,
      bio: userData.bio,
      location: userData.location,
      company: userData.company,
    };
  } catch (error) {
    console.error("❌ Error fetching GitHub stats:", error);
    return null;
  }
}

// 生成GitHub动态卡片（从MD配置读取）
function generateGithubActivityCard(achievements) {
  if (!achievements.activities || achievements.activities.length === 0)
    return "";

  return `
    <div class="achievement-card github-activity">
      <div class="achievement-header">
        <img src="/icons/github.svg" alt="GitHub" class="achievement-icon">
        <h3>GitHub 动态</h3>
      </div>
      <div class="github-activity-list">
        ${achievements.activities
          .map(
            (activity) => `
          <div class="activity-item">
            <span class="activity-type">${activity.type}</span>
            <span class="activity-repo">${activity.repo}</span>
            <span class="activity-time">${activity.time}</span>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>`;
}

// 生成获奖信息卡片
function generateAwardsCard(achievements) {
  if (!achievements.hackathons || achievements.hackathons.length === 0)
    return "";

  return `
    <div class="achievement-card awards-card">
      <div class="achievement-header">
        <img src="https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/resources/icons/trophy.svg" alt="Trophy" class="achievement-icon">
        <h3>荣誉认证</h3>
      </div>
      <div class="awards-list">
        ${achievements.hackathons
          .slice(0, 3)
          .map(
            (award) => `
          <div class="award-item ${award.image ? "award-with-image" : ""}">
            <!-- MoFA 认证印章 -->
            <div class="award-cert-stamp">
              <img src="https://mofa.ai/mofa-logo.png" alt="MoFA Certified" class="cert-logo">
              ${award.certNumber ? `<div class="cert-number">No.${award.certNumber}</div>` : ''}
            </div>

            ${
              award.image
                ? `
            <div class="award-image">
              <img src="${award.image}" alt="${award.title}" class="award-photo">
            </div>
            `
                : `
            <div class="award-icon">
              <img src="https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/resources/icons/trophy.svg" alt="Award" class="award-mini-icon">
            </div>
            `
            }
            <div class="award-content">
              <div class="award-title">${award.title}</div>
              <div class="award-details">${award.content.replace(/\*\*([^*]+)\*\*:/g, "<strong>$1:</strong>").replace(/\n/g, "<br>")}</div>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>`;
}

// 生成仓库展示卡片
function generateReposCard(achievements) {
  if (!achievements.repositories || achievements.repositories.length === 0)
    return "";

  return `
    <div class="achievement-card repos-card">
      <div class="achievement-header">
        <img src="/icons/github.svg" alt="Repos" class="achievement-icon">
        <h3>精选仓库</h3>
      </div>
      <div class="repos-list">
        ${achievements.repositories
          .map(
            (repo) => `
          <div class="repo-item">
            <div class="repo-name">
              <a href="${repo.url || `https://github.com/${repo.name}`}" target="_blank" rel="noopener noreferrer">
                ${repo.name}
              </a>
            </div>
            <div class="repo-description">${repo.description}</div>
            <div class="repo-meta">
              ${repo.language ? `<span class="repo-language">${repo.language}</span>` : ""}
              ${repo.stars ? `<span class="repo-stars">⭐ ${repo.stars}</span>` : ""}
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>`;
}

// 生成成就展示区域
function generateAchievementsSection(achievements, githubStats) {
  let content = '<div class="achievements-section">';

  // 1. 获奖信息
  content += generateAwardsCard(achievements);

  // 2. 精选仓库
  content += generateReposCard(achievements);

  // 移除 GitHub 动态部分

  content += "</div>";
  return content;
}

// 流体网格布局 - Pinterest瀑布流风格
function assignFluidLayouts(links) {
  const colors = [
    "coral",
    "mint",
    "lavender",
    "peach",
    "sky",
    "sage",
    "rose",
    "lemon",
  ];
  const heights = ["compact", "normal", "tall"]; // 紧凑、正常、高

  return links.map((link, index) => {
    let height;
    // 自然的高度分布：50% normal, 30% compact, 20% tall
    const rand = (index * 13 + 7) % 10;
    if (rand < 5) height = "normal";
    else if (rand < 8) height = "compact";
    else height = "tall";

    return {
      ...link,
      fluidHeight: height,
      fluidColor: colors[index % colors.length],
    };
  });
}

// 主要的 HTML 生成函数
async function generateHTML(username, links, hostname, achievements = null, githubStats = null) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://${hostname}`)}`;
  const fluidLinks = assignFluidLayouts(links);

  // 智能布局判断：计算总项数
  const linksCount = Object.keys(links).length;
  const awardsCount = achievements?.awards?.length || 0;
  const reposCount = achievements?.repositories?.length || 0;
  const totalItems = linksCount + awardsCount + reposCount;

  // 布局类型：sparse（稀疏居中）, normal（正常布局）
  const layoutType = totalItems <= 5 ? 'sparse' : 'normal';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${username} - 魔法师 - MoFA Developer</title>
    <meta name="description" content="${username}的个人链接页面 - MoFA开发者">

    <!-- Google Fonts - 与MoFA官网一致 -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Italiana&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap" rel="stylesheet">

    <style>
        /* 全局重置 - 与MoFA官网一致 */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
            font-family: 'Inter', 'Noto Sans SC', system-ui, sans-serif;
            height: 100%;
            margin: 0;
            padding: 0;
        }

        body {
            line-height: 1.6;
            color: ${COLORS["mondrian-black"]};
            background: #E8F6F7;
            height: 100vh;
            margin: 0;
            padding: 0;
            position: relative;
            overflow: hidden;
        }

        :root {
            --texture-coral:
                linear-gradient(140deg, rgba(254, 106, 91, 0.14), rgba(252, 84, 62, 0.06)),
                radial-gradient(circle at 18% 22%, rgba(254, 106, 91, 0.24) 0%, rgba(254, 106, 91, 0) 58%),
                radial-gradient(circle at 82% 76%, rgba(255, 198, 62, 0.16) 0%, rgba(255, 198, 62, 0) 62%),
                conic-gradient(from 90deg at 50% 50%, rgba(254, 106, 91, 0.18), rgba(254, 106, 91, 0) 240deg);
            --texture-mint:
                linear-gradient(140deg, rgba(109, 202, 208, 0.14), rgba(109, 202, 208, 0.05)),
                radial-gradient(circle at 20% 28%, rgba(109, 202, 208, 0.24) 0%, rgba(109, 202, 208, 0) 56%),
                radial-gradient(circle at 78% 72%, rgba(255, 198, 62, 0.18) 0%, rgba(255, 198, 62, 0) 60%),
                conic-gradient(from 120deg at 45% 55%, rgba(109, 202, 208, 0.18), rgba(109, 202, 208, 0) 250deg);
            --texture-lemon:
                linear-gradient(140deg, rgba(255, 198, 62, 0.16), rgba(255, 198, 62, 0.06)),
                radial-gradient(circle at 22% 24%, rgba(255, 198, 62, 0.26) 0%, rgba(255, 198, 62, 0) 58%),
                radial-gradient(circle at 74% 78%, rgba(253, 84, 63, 0.16) 0%, rgba(253, 84, 63, 0) 62%),
                conic-gradient(from 45deg at 50% 50%, rgba(255, 198, 62, 0.2), rgba(255, 198, 62, 0) 240deg);
            --texture-rose:
                linear-gradient(140deg, rgba(252, 84, 62, 0.16), rgba(252, 84, 62, 0.06)),
                radial-gradient(circle at 18% 25%, rgba(252, 84, 62, 0.25) 0%, rgba(252, 84, 62, 0) 58%),
                radial-gradient(circle at 76% 70%, rgba(254, 106, 91, 0.18) 0%, rgba(254, 106, 91, 0) 62%),
                conic-gradient(from 160deg at 50% 50%, rgba(252, 84, 62, 0.18), rgba(252, 84, 62, 0) 240deg);
        }

        /* 浮动蒙德里安色块装饰 */
        .floating-shapes {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            overflow: hidden;
        }

        .float-shape {
            position: absolute;
            border-radius: 0;
            opacity: 0.08;
        }

        .float-red {
            width: 120px;
            height: 120px;
            background: ${COLORS["mondrian-red"]};
            top: 15%;
            left: 8%;
            animation: float-1 25s ease-in-out infinite;
        }

        .float-blue {
            width: 80px;
            height: 80px;
            background: ${COLORS["mondrian-blue"]};
            top: 60%;
            right: 12%;
            animation: float-2 30s ease-in-out infinite;
        }

        .float-yellow {
            width: 100px;
            height: 100px;
            background: ${COLORS["mondrian-yellow"]};
            bottom: 20%;
            left: 15%;
            animation: float-3 28s ease-in-out infinite;
        }

        .float-black {
            width: 60px;
            height: 60px;
            background: ${COLORS["mondrian-black"]};
            top: 35%;
            right: 20%;
            animation: float-4 32s ease-in-out infinite;
        }

        @keyframes float-1 {
            0%, 100% {
                transform: translate(0, 0) rotate(0deg);
            }
            25% {
                transform: translate(30px, -20px) rotate(5deg);
            }
            50% {
                transform: translate(-20px, 30px) rotate(-3deg);
            }
            75% {
                transform: translate(40px, 10px) rotate(8deg);
            }
        }

        @keyframes float-2 {
            0%, 100% {
                transform: translate(0, 0) rotate(0deg);
            }
            33% {
                transform: translate(-40px, 25px) rotate(-6deg);
            }
            66% {
                transform: translate(20px, -30px) rotate(4deg);
            }
        }

        @keyframes float-3 {
            0%, 100% {
                transform: translate(0, 0) rotate(0deg);
            }
            30% {
                transform: translate(-25px, -35px) rotate(7deg);
            }
            60% {
                transform: translate(35px, 20px) rotate(-5deg);
            }
        }

        @keyframes float-4 {
            0%, 100% {
                transform: translate(0, 0) rotate(0deg);
            }
            40% {
                transform: translate(30px, 40px) rotate(-8deg);
            }
            80% {
                transform: translate(-30px, -20px) rotate(6deg);
            }
        }

        /* 选中文本颜色 - 与MoFA官网一致 */
        ::selection {
            background-color: ${COLORS["mondrian-red"]};
            color: white;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .main-content {
            display: grid;
            grid-template-columns: 0.5fr 4.5fr;
            gap: 40px;
            align-items: start;
            flex: 1;
            overflow: hidden;
            min-height: 0;
        }

        /* 稀疏布局（≤5项）- 单列居中设计 */
        body.layout-sparse .main-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            max-width: 600px;
            margin: 0 auto;
            gap: 32px;
            overflow: visible;
        }

        body.layout-sparse .links-section {
            width: 100%;
            position: static;
            order: 1;
        }

        body.layout-sparse .links-wrapper {
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid rgba(148, 163, 184, 0.2);
            border-radius: 24px;
            padding: 32px 28px;
            box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
            max-height: none;
            height: auto;
        }

        body.layout-sparse .header-in-left {
            text-align: center;
        }

        body.layout-sparse .username {
            justify-content: center;
            font-size: 2.2rem;
        }

        body.layout-sparse .subtitle {
            justify-content: center;
        }

        body.layout-sparse .mini-divider {
            justify-content: center;
            margin: 20px auto;
        }

        body.layout-sparse .links-scroll {
            overflow: visible;
            padding: 0;
        }

        body.layout-sparse .fluid-container {
            column-count: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
        }

        body.layout-sparse .fluid-card {
            width: 100%;
            max-width: 320px;
            padding: 18px;
        }

        body.layout-sparse .achievements-section {
            width: 100%;
            order: 2;
            display: flex;
            flex-direction: column;
            gap: 24px;
            overflow: visible;
            padding: 0;
        }

        body.layout-sparse .achievement-card {
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid rgba(148, 163, 184, 0.2);
            border-radius: 24px;
            padding: 28px;
            box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
        }

        body.layout-sparse .achievement-header {
            text-align: center;
            margin-bottom: 20px;
        }

        body.layout-sparse .awards-list,
        body.layout-sparse .repos-list {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        body.layout-sparse .award-item,
        body.layout-sparse .repo-item {
            max-width: 480px;
        }

        .header {
            margin-bottom: 40px;
            text-align: center;
            grid-column: 1 / -1;
        }

        /* 左侧区域的头部样式 */
        .header-in-left {
            margin-bottom: 20px;
            padding-top: 10px; /* 给帽子留出空间 */
            text-align: left;
            overflow: visible;
        }

        /* Logo容器 - 仿照MoFA官网的风格 */
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            transition: all 0.3s ease;
        }

        .logo:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .logo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        /* 渐变文字 - 与MoFA官网一致 */
        .username {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 8px;
            margin-top: 2rem; /* 给帽子留出空间 */
            display: flex;
            align-items: center;
            gap: 12px;
            overflow: visible;
        }

        .user-profile-link {
            background: linear-gradient(120deg, ${COLORS["mofa-gradient-1"]}, ${COLORS["mofa-gradient-2"]}, ${COLORS["mofa-gradient-3"]}, ${COLORS["mofa-gradient-4"]});
            background-size: 300% 300%;
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            animation: gradient-flow 12s ease-in-out infinite;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: all 0.2s ease;
            position: relative;
        }

        /* 魔法星星装饰 */
        .user-profile-link::after {
            content: '⭐';
            position: absolute;
            top: -0.5rem;
            right: -1rem;
            font-size: 0.8rem;
            z-index: 12;
            pointer-events: none;
            animation: magic-sparkle 2s ease-in-out infinite alternate;
            filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));
        }

        .user-profile-link:hover {
            /* 保持简洁，无阴影效果 */
        }

        .user-avatar {
            width: 2rem;
            height: 2rem;
            border-radius: 50%;
            border: 2px solid rgba(251, 106, 88, 0.3);
            flex-shrink: 0;
            position: relative;
        }

        /* 头像容器 */
        .avatar-container {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: visible; /* 确保帽子不被裁剪 */
        }


        @keyframes magic-sparkle {
            0% {
                opacity: 0.6;
                transform: scale(1);
            }
            100% {
                opacity: 1;
                transform: scale(1.2);
            }
        }

        @keyframes gradient-flow {
            0% { background-position: 0% 50%; }
            25% { background-position: 100% 50%; }
            50% { background-position: 100% 100%; }
            75% { background-position: 0% 100%; }
            100% { background-position: 0% 50%; }
        }

        .subtitle {
            color: #64748b;
            font-size: 1rem;
            font-family: 'DotGothic16', 'Inter', 'Noto Sans SC', system-ui, sans-serif;
            font-weight: 400;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .subtitle-logo {
            width: 1rem;
            height: 1rem;
            border-radius: 4px;
        }

        .mofa-logo-link {
            text-decoration: none;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
        }

        .mofa-logo-link:hover {
            /* 保持简洁，无阴影效果 */
        }

        /* 流体网格布局系统 - Pinterest瀑布流风格 */
        .fluid-container {
            column-count: 2;
            column-gap: 24px;
            margin-bottom: 40px;
        }

        .links-section {
            grid-column: 1;
            position: sticky;
            top: 40px;
            align-self: start;
            min-height: 0;
        }

        .links-wrapper {
            display: flex;
            flex-direction: column;
            gap: 20px;
            max-height: calc(100vh - 120px);
            height: min(calc(100vh - 120px), 100%);
            min-height: 0;
        }

        .links-scroll {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding-right: 6px;
            margin-right: -6px;
            scrollbar-width: thin;
        }

        .links-scroll::-webkit-scrollbar {
            width: 6px;
        }

        .links-scroll::-webkit-scrollbar-track {
            background: rgba(148, 163, 184, 0.2);
            border-radius: 8px;
        }

        .links-scroll::-webkit-scrollbar-thumb {
            background: rgba(100, 116, 139, 0.4);
            border-radius: 8px;
        }

        /* 流体卡片基础样式 */
        .fluid-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: ${COLORS["mondrian-black"]};
            font-weight: 600;
            border-radius: 0;
            transition: all 0.2s ease;
            position: relative;
            overflow: visible;
            margin-bottom: 20px;
            break-inside: avoid;
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid ${COLORS["mondrian-black"]};
            box-shadow: 0 0px 0 ${COLORS["mondrian-black"]};
        }

        .fluid-card:hover {
            transform: translate(-3px, -3px);
            z-index: 10;
        }

        /* 悬停时的黑色阴影 */
        .fluid-card:hover {
            box-shadow: 4px 4px 0 ${COLORS["mondrian-black"]};
        }

        .fluid-card:active {
            transform: translate(-1px, -1px);
            box-shadow: 2px 2px 0 ${COLORS["mondrian-black"]};
            transition: transform 0.1s ease;
        }

        /* 流体卡片高度变化 */
        .fluid-compact {
            padding: 10px 8px;
            min-height: 50px;
        }

        .fluid-normal {
            padding: 12px 10px;
            min-height: 60px;
        }

        .fluid-tall {
            padding: 14px 12px;
            min-height: 75px;
        }

        /* 流体卡片图标 */
        .fluid-icon {
            width: 24px;
            height: 24px;
            margin-bottom: 4px;
            filter: saturate(1.2) brightness(0.85);
            opacity: 0.9;
            transition: all 0.3s ease;
        }

        /* MoFA品牌卡片样式 */
        .mofa-brand-card {
            cursor: default;
            background: linear-gradient(135deg, ${COLORS["mofa-gradient-1"]}, ${COLORS["mofa-gradient-2"]}) !important;
        }

        .mofa-logo {
            width: 50px;
            height: 50px;
            margin-bottom: 12px;
            border-radius: 0;
            filter: none !important;
            opacity: 1 !important;
        }

        .fluid-tall .fluid-icon {
            width: 28px;
            height: 28px;
            margin-bottom: 6px;
        }

        /* 流体卡片文字 */
        .fluid-name {
            font-size: 11px;
            font-weight: 600;            padding: 2px 6px;            border: 1px solid ${COLORS["mondrian-black"]};            border-radius: 0;            display: inline-block;            background: rgba(255, 255, 255, 0.9);            box-shadow: 0 0px 0 ${COLORS["mondrian-black"]};            transition: all 0.2s ease;
            text-align: center;
            line-height: 1.4;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            opacity: 0.95;
        }

        .fluid-tall .fluid-name {
            font-size: 12px;
            font-weight: 600;
        }

        /* 流体卡片颜色主题 - 淡化纹理背景 */
        .fluid-coral {
            border-color: ${COLORS["mondrian-black"]} !important;
            background-image: var(--texture-coral) !important;
            background-color: rgba(255, 255, 255, 0.95) !important;
        }

        .fluid-mint {
            border-color: ${COLORS["mondrian-black"]} !important;
            background-image: var(--texture-mint) !important;
            background-color: rgba(255, 255, 255, 0.95) !important;
        }

        .fluid-lavender {
            border-color: ${COLORS["mondrian-black"]} !important;
            background-image: var(--texture-lemon) !important;
            background-color: rgba(255, 255, 255, 0.95) !important;
        }

        .fluid-peach {
            border-color: ${COLORS["mondrian-black"]} !important;
            background-image: var(--texture-coral) !important;
            background-color: rgba(255, 255, 255, 0.95) !important;
        }

        .fluid-sky {
            border-color: ${COLORS["mondrian-black"]} !important;
            background-image: var(--texture-mint) !important;
            background-color: rgba(255, 255, 255, 0.95) !important;
        }

        .fluid-sage {
            border-color: ${COLORS["mondrian-black"]} !important;
            background-image: var(--texture-lemon) !important;
            background-color: rgba(255, 255, 255, 0.95) !important;
        }

        .fluid-rose {
            border-color: ${COLORS["mondrian-black"]} !important;
            background-image: var(--texture-rose) !important;
            background-color: rgba(255, 255, 255, 0.95) !important;
        }

        .fluid-lemon {
            border-color: ${COLORS["mondrian-black"]} !important;
            background-image: var(--texture-lemon) !important;
            background-color: rgba(255, 255, 255, 0.95) !important;
        }

        /* 流体卡片水波纹效果 */


        /* 图标悬停效果 */
        .fluid-card:hover .fluid-icon {
            transform: scale(1.1) rotate(5deg);
        }

        /* 大平板和小桌面响应式 */
        @media (max-width: 1200px) {
            .main-content {
                grid-template-columns: 1fr 2fr;
            }
        }

        /* 响应式流体布局 */
        @media (max-width: 1024px) {
            body {
                height: auto;
                overflow: auto;
            }

            .container {
                height: auto;
            }

            .main-content {
                grid-template-columns: 1fr;
                gap: 30px;
                overflow: visible;
                height: auto;
            }

            .links-section {
                position: static;
                top: auto;
            }

            .links-wrapper {
                max-height: none;
                height: auto;
            }

            .links-scroll {
                flex: unset;
                min-height: unset;
                overflow: visible;
                padding-right: 0;
                margin-right: 0;
            }

            .achievements-section {
                grid-column: 1;
                max-height: none;
                overflow-y: visible;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                height: auto;
                padding-right: 0;
            }

            .fluid-container {
                column-count: 2;
            }

            .achievements-section::before {
                top: -20px;
                right: -30px;
                width: 200px;
                height: 200px;
            }
        }

        @media (max-width: 768px) {
            .fluid-container {
                column-count: 2;
            }

            .repos-list {
                grid-template-columns: 1fr;
            }
        }

        @media (max-width: 640px) {
            body {
                height: auto;
                overflow-y: auto;
            }

            .container {
                padding: 18px 16px 32px;
                height: auto;
                gap: 20px;
            }

            .main-content {
                display: flex;
                flex-direction: column;
                gap: 24px;
                overflow: visible;
            }

            .links-section {
                order: 1;
                width: 100%;
            }

            .links-wrapper {
                background: rgba(255, 255, 255, 0.92);
                border: 1px solid rgba(148, 163, 184, 0.3);
                border-radius: 20px;
                padding: 16px 16px 0;
                gap: 16px;
                box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
                max-height: none;
                height: auto;
            }

            .header-in-left {
                padding: 0;
                text-align: center;
            }

            .username {
                justify-content: center;
                font-size: 1.85rem;
            }

            .subtitle {
                justify-content: center;
                font-size: 0.95rem;
            }

            .header-in-left .mini-divider {
                justify-content: center;
                margin: 16px auto;
                padding: 10px 0;
            }

            .links-scroll {
                overflow-x: auto;
                overflow-y: hidden;
                padding: 0 4px 8px;
                margin: 0 -4px;
                scrollbar-width: thin;
            }

            .links-scroll::-webkit-scrollbar {
                height: 5px;
            }

            .links-scroll::-webkit-scrollbar-thumb {
                background: rgba(148, 163, 184, 0.35);
                border-radius: 8px;
            }

            .fluid-container {
                column-count: unset;
                display: flex;
                flex-wrap: nowrap;
                gap: 10px;
            }

            .fluid-card {
                min-width: 150px;
                border-radius: 16px;
                padding: 16px 14px;
                margin-bottom: 0;
            }

            .fluid-card::after {
                display: none;
            }

            .fluid-icon {
                width: 24px;
                height: 24px;
                margin-bottom: 10px;
                opacity: 0.85;
            }

            .fluid-name {
                font-size: 11.5px;
                letter-spacing: 0.01em;
            }

            .achievements-section {
                order: 2;
                display: flex;
                flex-direction: column;
                gap: 18px;
                height: auto;
                overflow: visible;
                padding-right: 0;
            }

            .achievements-section::before {
                content: none;
            }

            .achievement-card {
                border-radius: 18px;
                padding: 18px;
                box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
            }

            .awards-card::before,
            .repos-card::before,
            .github-activity::before {
                inset: auto 18px 0 18px;
                width: auto;
                height: 5px;
                border-radius: 50px 50px 0 0;
            }

            .awards-list {
                gap: 12px;
            }

            .award-item {
                flex-direction: column;
                gap: 12px;
            }

            .award-content {
                width: 100%;
            }

            .repos-list {
                grid-template-columns: 1fr;
                gap: 14px;
            }

            .footer {
                margin-top: 16px;
            }
        }

        @media (max-width: 480px) {
            .container {
                padding: 18px 14px 28px;
            }

            .fluid-container {
                gap: 8px;
                scroll-snap-type: x mandatory;
            }

            .fluid-card {
                min-width: 140px;
                border-radius: 14px;
                padding: 15px 12px;
                scroll-snap-align: start;
            }

            .fluid-compact {
                min-height: 90px;
            }

            .fluid-normal {
                min-height: 110px;
            }

            .fluid-tall {
                min-height: 125px;
            }

            .achievement-card {
                border-radius: 16px;
                padding: 16px;
            }

            .award-item {
                padding: 16px 14px;
            }

            .qr-modal-content {
                padding: 24px;
                gap: 16px;
            }

            .qr-code-wrapper img {
                width: 180px;
                height: 180px;
            }
        }

        /* 成就展示区域样式 */
        .achievements-section {
            grid-column: 2;
            display: flex;
            flex-direction: column;
            gap: 24px;
            position: relative;
            z-index: 1;
            height: 100%;
            overflow-y: auto;
            padding-right: 8px;
            overflow-x: hidden;
            scrollbar-width: thin;
            min-height: 0;
        }

        .achievements-section::-webkit-scrollbar {
            width: 8px;
        }

        .achievements-section::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.35);
            border-radius: 8px;
        }

        .achievements-section::-webkit-scrollbar-track {
            background: transparent;
        }

        .achievements-section::before {
            content: '';
            position: absolute;
            top: 0;
            right: -50px;
            width: 240px;
            height: 240px;
            background: conic-gradient(from 0deg,
                rgba(251, 106, 88, 0.6),
                rgba(253, 84, 63, 0.55),
                rgba(255, 198, 62, 0.45),
                rgba(109, 202, 206, 0.5),
                rgba(251, 106, 88, 0.6));
            border-radius: 50%;
            filter: blur(40px);
            opacity: 0.3;
            animation: aurora-spin 18s linear infinite;
            pointer-events: none;
            z-index: -1;
        }

        @keyframes aurora-spin {
            0% {
                transform: rotate(0deg) scale(0.95);
            }
            50% {
                transform: rotate(180deg) scale(1.05);
            }
            100% {
                transform: rotate(360deg) scale(0.95);
            }
        }

        .achievement-card {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 0;
            padding: 20px;
            border: 1.5px solid rgba(254, 106, 91, 0.28);
            box-shadow: 0 4px 12px rgba(254, 106, 91, 0.12);
            transition: all 0.2s ease;
            flex-shrink: 0;
            color: rgba(51, 65, 85, 0.92);
        }

        /* 蒙德里安配色 - 不同类型用不同颜色的左边框 */
        .awards-card {
            background: rgba(255, 255, 255, 0.96);
            position: relative;
            overflow: visible;
            border-color: rgba(254, 106, 91, 0.3);
            padding-left: 26px;
        }

        .awards-card::before {
            content: '';
            position: absolute;
            inset: 14px auto 14px 0;
            width: 6px;
            border-radius: 0 8px 8px 0;
            background: linear-gradient(180deg, rgba(254, 106, 91, 0.9), rgba(252, 84, 62, 0.75));
        }

        .awards-card > * {
            position: relative;
            z-index: 1;
        }

        .repos-card {
            border-color: rgba(109, 202, 208, 0.3);
            padding-left: 26px;
        }

        .repos-card::before {
            content: '';
            position: absolute;
            inset: 14px auto 14px 0;
            width: 6px;
            border-radius: 0 8px 8px 0;
            background: linear-gradient(180deg, rgba(109, 202, 208, 0.9), rgba(255, 198, 62, 0.75));
        }

        .repos-card > * {
            position: relative;
            z-index: 1;
        }

        .github-activity {
            border-color: rgba(255, 198, 62, 0.3);
            padding-left: 26px;
            position: relative;
            overflow: hidden;
        }

        .github-activity::before {
            content: '';
            position: absolute;
            inset: 14px auto 14px 0;
            width: 6px;
            border-radius: 0 8px 8px 0;
            background: linear-gradient(180deg, rgba(255, 198, 62, 0.9), rgba(109, 202, 208, 0.75));
        }

        .github-activity > * {
            position: relative;
            z-index: 1;
        }

        .achievement-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 14px 28px rgba(254, 106, 91, 0.18);
        }

        .awards-card:hover {
            box-shadow:
                0 16px 30px rgba(254, 106, 91, 0.2),
                inset 0 0 20px rgba(218, 165, 32, 0.15);
        }

        .repos-card:hover {
            box-shadow:
                0 16px 30px rgba(109, 202, 208, 0.2),
                inset 0 0 20px rgba(218, 165, 32, 0.12);
        }

        .github-activity:hover {
            box-shadow: 0 16px 30px rgba(255, 198, 62, 0.2);
        }

        .achievement-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            gap: 12px;
            padding-top: 16px;
            position: relative;
        }

        .achievement-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg,
                transparent 0%,
                rgba(218, 165, 32, 0.6) 20%,
                rgba(255, 215, 0, 0.8) 50%,
                rgba(218, 165, 32, 0.6) 80%,
                transparent 100%
            );
            border-radius: 2px;
        }

        .achievement-icon {
            width: 28px;
            height: 28px;
            filter: none;
        }

        .trophy-icon {
            font-size: 12px;
            font-weight: 600;
            color: ${COLORS["mondrian-black"]};
        }

        .achievement-header h3 {
            font-size: 1.2rem;
            font-weight: 600;
            margin: 0;
            color: rgba(51, 65, 85, 0.9);
        }

        .awards-card .achievement-header h3 {
            background: linear-gradient(120deg, rgba(254, 106, 91, 0.9), rgba(252, 84, 62, 0.8));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }

        .repos-card .achievement-header h3 {
            background: linear-gradient(120deg, rgba(109, 202, 208, 0.95), rgba(255, 198, 62, 0.85));
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }

        /* GitHub动态样式 */
        .github-activity-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .activity-item {
            padding: 12px;
            background: linear-gradient(135deg, rgba(255, 198, 62, 0.14), rgba(109, 202, 208, 0.08));
            border-radius: 0;
            border-left: 3px solid rgba(255, 198, 62, 0.6);
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .activity-type {
            font-size: 0.85rem;
            font-weight: 600;
            color: rgba(255, 198, 62, 0.95);
        }

        .activity-repo {
            font-size: 0.8rem;
            color: #666;
            font-family: 'JetBrains Mono', monospace;
        }

        .activity-time {
            font-size: 0.75rem;
            color: #999;
        }

        /* 获奖信息样式 */
        .awards-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .award-item {
            display: flex;
            gap: 18px;
            padding: 18px;
            border-radius: 0;
            border: 1.5px solid rgba(254, 106, 91, 0.35);
            transition: all 0.25s ease;
            position: relative;
            background-color: rgba(255, 255, 255, 0.95);
            background-image: var(--texture-coral);
            box-shadow: 0 3px 8px rgba(45, 55, 72, 0.12);
            align-items: flex-start;
            overflow: hidden;
        }

        .award-item:nth-child(4n+2) {
            background-image: var(--texture-mint);
            border-color: rgba(109, 202, 208, 0.35);
        }

        .award-item:nth-child(4n+3) {
            background-image: var(--texture-lemon);
            border-color: rgba(255, 198, 62, 0.35);
        }

        .award-item:nth-child(4n) {
            background-image: var(--texture-rose);
            border-color: rgba(252, 84, 62, 0.35);
        }

        .award-item::before {
            content: '';
            position: absolute;
            inset: 12px auto 12px 0;
            width: 6px;
            border-radius: 0 8px 8px 0;
            background: rgba(254, 106, 91, 0.45);
            z-index: 0;
        }

        .award-item::after {
            content: '';
            position: absolute;
            right: -5px;
            bottom: -5px;
            width: 85px;
            height: 85px;
            background-image: url('https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/resources/icons/trophy.svg');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            z-index: 0;
            pointer-events: none;
        }

        .award-item:nth-child(4n+1)::before {
            background: rgba(254, 106, 91, 0.45);
        }

        .award-item:nth-child(4n+2)::before {
            background: rgba(109, 202, 208, 0.45);
        }

        .award-item:nth-child(4n+3)::before {
            background: rgba(255, 198, 62, 0.45);
        }

        .award-item:nth-child(4n)::before {
            background: rgba(252, 84, 62, 0.45);
        }

        .award-item:nth-child(4n+1)::after,
        .award-item:nth-child(4n+2)::after,
        .award-item:nth-child(4n+3)::after,
        .award-item:nth-child(4n)::after {
            opacity: 0.18;
            filter: sepia(1) saturate(3) hue-rotate(10deg) brightness(1.3) drop-shadow(0 0 8px rgba(218, 165, 32, 0.3));
        }

        .award-item:hover {
            transform: translate(-3px, -3px);
            box-shadow: 0 6px 16px rgba(254, 106, 91, 0.2);
        }

        .award-item:nth-child(4n+2):hover {
            box-shadow: 0 6px 16px rgba(109, 202, 208, 0.2);
        }

        .award-item:nth-child(4n+3):hover {
            box-shadow: 0 6px 16px rgba(255, 198, 62, 0.2);
        }

        .award-item:nth-child(4n):hover {
            box-shadow: 0 6px 16px rgba(252, 84, 62, 0.2);
        }

        .award-icon {
            flex-shrink: 0;
            width: 64px;
            height: 64px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(254, 106, 91, 0.08));
            border: 2px solid rgba(254, 106, 91, 0.5);
            border-radius: 50%;
            box-shadow:
                0 4px 12px rgba(254, 106, 91, 0.25),
                0 0 0 4px rgba(254, 106, 91, 0.1),
                inset 0 -2px 8px rgba(254, 106, 91, 0.1);
            position: relative;
            z-index: 1;
        }

        .award-item:nth-child(4n+2) .award-icon {
            border-color: rgba(109, 202, 208, 0.5);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(109, 202, 208, 0.08));
            box-shadow:
                0 4px 12px rgba(109, 202, 208, 0.25),
                0 0 0 4px rgba(109, 202, 208, 0.1),
                inset 0 -2px 8px rgba(109, 202, 208, 0.1);
        }

        .award-item:nth-child(4n+3) .award-icon {
            border-color: rgba(255, 198, 62, 0.5);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 198, 62, 0.08));
            box-shadow:
                0 4px 12px rgba(255, 198, 62, 0.25),
                0 0 0 4px rgba(255, 198, 62, 0.1),
                inset 0 -2px 8px rgba(255, 198, 62, 0.1);
        }

        .award-item:nth-child(4n) .award-icon {
            border-color: rgba(252, 84, 62, 0.5);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(252, 84, 62, 0.08));
            box-shadow:
                0 4px 12px rgba(252, 84, 62, 0.25),
                0 0 0 4px rgba(252, 84, 62, 0.1),
                inset 0 -2px 8px rgba(252, 84, 62, 0.1);
        }

        .award-mini-icon {
            width: 36px;
            height: 36px;
            filter: none;
        }

        /* MoFA 认证印章样式 */
        .award-cert-stamp {
            position: absolute;
            top: 12px;
            right: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            z-index: 2;
        }

        .cert-logo {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            border: 2px solid rgba(218, 165, 32, 0.6);
            box-shadow:
                0 2px 8px rgba(218, 165, 32, 0.3),
                0 0 0 3px rgba(255, 255, 255, 0.9),
                0 0 0 5px rgba(218, 165, 32, 0.2);
            background: rgba(255, 255, 255, 0.95);
            padding: 4px;
            transition: all 0.3s ease;
        }

        .award-item:hover .cert-logo {
            transform: rotate(8deg) scale(1.05);
            box-shadow:
                0 4px 12px rgba(218, 165, 32, 0.4),
                0 0 0 3px rgba(255, 255, 255, 0.95),
                0 0 0 5px rgba(218, 165, 32, 0.3);
        }

        .cert-number {
            font-size: 10px;
            font-weight: 600;
            color: rgba(139, 110, 32, 0.9);
            background: rgba(255, 255, 255, 0.95);
            padding: 3px 8px;
            border-radius: 10px;
            border: 1px solid rgba(218, 165, 32, 0.4);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
            letter-spacing: 0.5px;
            font-family: 'Inter', 'Noto Sans SC', sans-serif;
        }

        /* 奖项图片样式 */
        .award-image {
            flex-shrink: 0;
            width: 62px;
            height: 62px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0;
            overflow: hidden;
            border: 1.5px solid rgba(254, 106, 91, 0.4);
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 3px 10px rgba(15, 23, 42, 0.12);
            position: relative;
            z-index: 1;
        }

        .award-item:nth-child(4n+2) .award-image {
            border-color: rgba(109, 202, 208, 0.4);
        }

        .award-item:nth-child(4n+3) .award-image {
            border-color: rgba(255, 198, 62, 0.4);
        }

        .award-item:nth-child(4n) .award-image {
            border-color: rgba(252, 84, 62, 0.4);
        }

        .award-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .award-with-image {
            gap: 16px;
        }

        .award-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
            position: relative;
            z-index: 1;
        }

        .award-title {
            font-family: 'Italiana', 'Noto Serif SC', serif;
            font-weight: 400;
            color: rgba(184, 66, 58, 0.95);
            font-size: 1.2rem;
            letter-spacing: 0.02em;
        }

        .award-item:nth-child(4n+2) .award-title {
            color: rgba(34, 125, 134, 0.95);
        }

        .award-item:nth-child(4n+3) .award-title {
            color: rgba(201, 140, 36, 0.95);
        }

        .award-item:nth-child(4n) .award-title {
            color: rgba(214, 74, 58, 0.95);
        }

        .award-event {
            font-size: 0.82rem;
            color: rgba(184, 66, 58, 0.9);
            font-weight: 600;
            padding: 2px 6px;
            border: 1px solid rgba(254, 106, 91, 0.4);
            border-radius: 0;
            display: inline-block;
            background: rgba(255, 255, 255, 0.85);
            transition: all 0.2s ease;
        }

        .award-item:nth-child(4n+2) .award-event,
        .award-item:nth-child(4n+2) .award-achievement {
            border-color: rgba(109, 202, 208, 0.4);
            color: rgba(34, 125, 134, 0.92);
        }

        .award-item:nth-child(4n+3) .award-event,
        .award-item:nth-child(4n+3) .award-achievement {
            border-color: rgba(255, 198, 62, 0.4);
            color: rgba(201, 140, 36, 0.92);
        }

        .award-item:nth-child(4n) .award-event,
        .award-item:nth-child(4n) .award-achievement {
            border-color: rgba(252, 84, 62, 0.4);
            color: rgba(214, 74, 58, 0.92);
        }

        .award-project {
            font-size: 0.78rem;
            color: rgba(74, 82, 102, 0.85);
            font-style: italic;
        }

        .award-team {
            font-size: 0.78rem;
            color: rgba(74, 82, 102, 0.85);
        }

        .award-achievement {
            font-size: 0.78rem;
            color: rgba(184, 66, 58, 0.9);
            font-weight: 600;
            padding: 2px 6px;
            border: 1px solid rgba(254, 106, 91, 0.4);
            border-radius: 0;
            display: inline-block;
            background: rgba(255, 255, 255, 0.85);
            transition: all 0.2s ease;
        }

        .award-date {
            font-size: 0.72rem;
            color: rgba(100, 116, 139, 0.75);
        }

        .award-details {
            font-size: 0.82rem;
            color: rgba(48, 62, 78, 0.85);
            line-height: 1.5;
            margin-top: 6px;
        }

        /* 仓库展示样式 */
        .repos-list {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
        }

        .repo-item {
            padding: 16px;
            border-radius: 0;
            border: 1.5px solid rgba(254, 106, 91, 0.3);
            transition: all 0.25s ease;
            position: relative;
            background-color: rgba(255, 255, 255, 0.95);
            background-image: var(--texture-coral);
            box-shadow: 0 3px 8px rgba(254, 106, 91, 0.12);
            overflow: hidden;
            z-index: 0;
        }

        .repo-item:nth-child(4n+2) {
            background-image: var(--texture-mint);
            border-color: rgba(109, 202, 208, 0.3);
            box-shadow: 0 3px 8px rgba(109, 202, 208, 0.12);
        }

        .repo-item:nth-child(4n+3) {
            background-image: var(--texture-lemon);
            border-color: rgba(255, 198, 62, 0.3);
            box-shadow: 0 3px 8px rgba(255, 198, 62, 0.12);
        }

        .repo-item:nth-child(4n) {
            background-image: var(--texture-rose);
            border-color: rgba(252, 84, 62, 0.3);
            box-shadow: 0 3px 8px rgba(252, 84, 62, 0.12);
        }

        .repo-item::after {
            content: '';
            position: absolute;
            inset: 0 0 auto 0;
            height: 3px;
            background: rgba(0, 0, 0, 0.04);
            z-index: 1;
            pointer-events: none;
        }

        .repo-item:nth-child(4n+1)::after {
            background: rgba(254, 106, 91, 0.35);
        }

        .repo-item:nth-child(4n+2)::after {
            background: rgba(109, 202, 208, 0.35);
        }

        .repo-item:nth-child(4n+3)::after {
            background: rgba(255, 198, 62, 0.35);
        }

        .repo-item:nth-child(4n)::after {
            background: rgba(252, 84, 62, 0.35);
        }

        .repo-item:hover {
            transform: translate(-3px, -3px);
            box-shadow: 0 6px 16px rgba(254, 106, 91, 0.2);
        }

        .repo-item:nth-child(4n+2):hover {
            box-shadow: 0 6px 16px rgba(109, 202, 208, 0.2);
        }

        .repo-item:nth-child(4n+3):hover {
            box-shadow: 0 6px 16px rgba(255, 198, 62, 0.2);
        }

        .repo-item:nth-child(4n):hover {
            box-shadow: 0 6px 16px rgba(252, 84, 62, 0.2);
        }

        .repo-name {
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .repo-name a {
            color: rgba(22, 101, 118, 0.9);
            text-decoration: none;
            font-weight: 600;
            font-size: 0.92rem;
            padding: 4px 6px;
            border-bottom: 2px solid rgba(254, 106, 91, 0.5);
            transition: color 0.2s ease, transform 0.2s ease;
        }

        .repo-item:nth-child(4n+2) .repo-name a {
            border-bottom-color: rgba(109, 202, 208, 0.5);
        }

        .repo-item:nth-child(4n+3) .repo-name a {
            border-bottom-color: rgba(255, 198, 62, 0.5);
        }

        .repo-item:nth-child(4n) .repo-name a {
            border-bottom-color: rgba(252, 84, 62, 0.5);
        }

        .repo-item:nth-child(4n+1) .repo-name a {
            color: rgba(214, 74, 58, 0.92);
        }

        .repo-item:nth-child(4n+2) .repo-name a {
            color: rgba(22, 101, 118, 0.9);
        }

        .repo-item:nth-child(4n+3) .repo-name a {
            color: rgba(201, 140, 36, 0.92);
        }

        .repo-item:nth-child(4n) .repo-name a {
            color: rgba(214, 74, 58, 0.92);
        }

        .repo-name a:hover {
            transform: translateY(-1px);
        }

        .repo-description {
            font-size: 0.82rem;
            color: rgba(56, 72, 86, 0.85);
            line-height: 1.5;
            margin-bottom: 12px;
        }

        .repo-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            font-size: 0.75rem;
        }

        .repo-language {
            color: rgba(22, 101, 118, 0.92);
            font-weight: 600;
            padding: 2px 6px;
            border: 1px solid rgba(254, 106, 91, 0.4);
            border-radius: 0;
            display: inline-block;
            background: rgba(255, 255, 255, 0.9);
        }

        .repo-item:nth-child(4n+1) .repo-language {
            color: rgba(214, 74, 58, 0.92);
        }

        .repo-item:nth-child(4n+2) .repo-language {
            border-color: rgba(109, 202, 208, 0.4);
            color: rgba(22, 101, 118, 0.92);
        }

        .repo-item:nth-child(4n+3) .repo-language {
            border-color: rgba(255, 198, 62, 0.4);
            color: rgba(201, 140, 36, 0.92);
        }

        .repo-item:nth-child(4n) .repo-language {
            border-color: rgba(252, 84, 62, 0.4);
            color: rgba(214, 74, 58, 0.92);
        }

        .repo-stars {
            color: rgba(71, 85, 105, 0.75);
        }

        .repo-item:nth-child(4n+1) .repo-stars {
            color: rgba(214, 74, 58, 0.7);
        }

        .repo-item:nth-child(4n+2) .repo-stars {
            color: rgba(22, 101, 118, 0.72);
        }

        .repo-item:nth-child(4n+3) .repo-stars {
            color: rgba(201, 140, 36, 0.72);
        }

        .repo-item:nth-child(4n) .repo-stars {
            color: rgba(214, 74, 58, 0.7);
        }

        /* 响应式成就区域 */
        @media (max-width: 640px) {
            .achievements-section {
                grid-template-columns: 1fr;
                gap: 16px;
            }

            .achievement-card {
                padding: 18px;
            }

            .activity-item {
                padding: 10px;
            }

            .award-item {
                padding: 10px;
                gap: 10px;
            }

            .award-icon {
                width: 32px;
                height: 32px;
            }

            .repo-item {
                padding: 10px;
            }

            .repos-list {
                gap: 12px;
                grid-template-columns: 1fr;
            }

            .achievements-section::before {
                content: none;
            }
        }

        /* 流体容器优化 */
        .fluid-container::after {
            content: '';
            display: block;
            height: 0;
            clear: both;
        }

        /* 二维码卡片按钮 */
        .qr-card-button {
            cursor: pointer;
        }

        .qr-card-button:focus-visible {
            outline: 2px solid ${COLORS["mondrian-black"]};
            outline-offset: 3px;
        }

        /* 二维码模态窗口 */
        .qr-modal {
            display: none;
            position: fixed;
            z-index: 999;
            inset: 0;
            background-color: rgba(15, 23, 42, 0.55);
            backdrop-filter: blur(10px);
            align-items: center;
            justify-content: center;
            padding: 32px 16px;
        }

        .qr-modal-content {
            position: relative;
            background: rgba(255, 255, 255, 0.96);
            padding: 32px;
            border-radius: 0;
            border: 3px solid ${COLORS["mondrian-black"]};
            box-shadow: 0 12px 0 ${COLORS["mondrian-black"]};
            text-align: center;
            animation: qr-modal-appear 0.3s ease-out;
            width: min(360px, 90vw);
            display: flex;
            flex-direction: column;
            gap: 20px;
            overflow: hidden;
        }

        .qr-modal-content::before {
            content: '';
            position: absolute;
            inset: -6px;
            background: linear-gradient(135deg,
                rgba(251, 106, 88, 0.45),
                rgba(253, 84, 63, 0.4),
                rgba(255, 198, 62, 0.35),
                rgba(109, 202, 206, 0.45));
            z-index: -1;
            border-radius: 0;
            filter: blur(24px);
            opacity: 0.9;
        }

        @keyframes qr-modal-appear {
            0% {
                opacity: 0;
                transform: scale(0.85);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }

        .qr-modal-header {
            display: flex;
            flex-direction: column;
            gap: 6px;
            align-items: center;
        }

        .qr-modal-subtitle {
            font-size: 0.75rem;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #64748b;
        }

        .qr-modal-title {
            font-size: 1.5rem;
            font-weight: 700;
            background: linear-gradient(120deg, ${COLORS["mofa-gradient-3"]}, ${COLORS["mofa-gradient-4"]});
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
        }

        .qr-modal-body {
            display: flex;
            flex-direction: column;
            gap: 16px;
            align-items: center;
        }

        .qr-code-wrapper {
            border: 2px solid ${COLORS["mondrian-black"]};
            padding: 14px;
            background: rgba(255, 255, 255, 0.92);
            box-shadow: 0 0px 0 ${COLORS["mondrian-black"]};
        }

        .qr-code-wrapper img {
            display: block;
            width: 200px;
            height: 200px;
        }

        .qr-modal-meta {
            font-size: 0.85rem;
            color: #475569;
            line-height: 1.5;
        }

        .qr-modal-close {
            background: ${COLORS["mondrian-black"]};
            color: ${COLORS["mondrian-white"]};
            border: 2px solid ${COLORS["mondrian-black"]};
            border-radius: 0;
            padding: 10px 20px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 2px 0 ${COLORS["mondrian-black"]};
            transition: all 0.2s ease;
        }

        .qr-modal-close:hover {
            transform: translate(-2px, -2px);
            box-shadow: 4px 4px 0 ${COLORS["mondrian-black"]};
        }

        /* 移动端二维码模态窗口优化 */
        @media (max-width: 640px) {
            .qr-modal-content {
                padding: 28px 20px;
                width: 88vw;
            }

            .qr-modal-title {
                font-size: 1.3rem;
            }

            .qr-code-wrapper img {
                width: 190px;
                height: 190px;
            }
        }

        .footer {
            margin-top: 8px;
            padding: 6px 0;
            border-top: 1px solid rgba(148, 163, 184, 0.35);
            color: rgba(100, 116, 139, 0.7);
            font-size: 0.68rem;
            grid-column: 1 / -1;
            text-align: center;
            letter-spacing: 0.03em;
        }

        .footer a {
            color: rgba(22, 101, 118, 0.85);
            text-decoration: none;
            font-weight: 600;
            transition: color 0.2s ease;
        }

        .footer a:hover {
            color: rgba(184, 66, 58, 0.9);
            text-decoration: underline;
        }

        /* 移动端优化 */
        @media (max-width: 640px) {
            .container {
                padding: 20px 16px;
            }

            .username {
                font-size: 1.75rem;
            }

            .main-content {
                gap: 20px;
            }
        }

        /* 全屏背景装饰层 - 确保背景连续 */
        .decoration {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: -1;
            opacity: 1;
            background:
                radial-gradient( circle at 18% 24%, rgba(254, 106, 91, 0.12) 0%, rgba(254, 106, 91, 0) 55%),
                radial-gradient( circle at 82% 16%, rgba(109, 202, 208, 0.14) 0%, rgba(109, 202, 208, 0) 52%),
                radial-gradient( circle at 78% 78%, rgba(255, 198, 62, 0.12) 0%, rgba(255, 198, 62, 0) 60%),
                linear-gradient(135deg, rgba(248, 250, 252, 0.75), rgba(226, 232, 240, 0.6));
        }

        .decoration::before {
            content: '';
            position: absolute;
            top: 18%;
            left: -80px;
            width: 320px;
            height: 320px;
            background: conic-gradient(from 120deg, rgba(254, 106, 91, 0.38), rgba(252, 84, 62, 0.12) 220deg, rgba(254, 106, 91, 0));
            clip-path: polygon(18% 0%, 90% 8%, 100% 72%, 72% 100%, 0% 88%, 0% 18%);
            animation: mondrian-geometric-float-a 10s ease-in-out infinite;
        }

        .decoration::after {
            content: '';
            position: absolute;
            bottom: 18%;
            right: -60px;
            width: 280px;
            height: 280px;
            background:
                radial-gradient(circle at 40% 40%, rgba(109, 202, 208, 0.28) 0%, rgba(109, 202, 208, 0) 70%),
                radial-gradient(circle at 70% 70%, rgba(255, 198, 62, 0.24) 0%, rgba(255, 198, 62, 0) 65%);
            clip-path: polygon(24% 0%, 100% 22%, 82% 100%, 8% 88%);
            animation: mondrian-geometric-float-b 12s ease-in-out infinite 0.8s;
        }

        @keyframes mondrian-geometric-float-a {
            0%, 100% {
                transform: translateY(0px) scale(1) rotate(-16deg);
                opacity: 0.35;
            }
            25% {
                transform: translateY(-6px) scale(1.02) rotate(-13deg);
                opacity: 0.42;
            }
            50% {
                transform: translateY(-14px) scale(1.05) rotate(-11deg);
                opacity: 0.5;
            }
            75% {
                transform: translateY(-6px) scale(1.02) rotate(-13deg);
                opacity: 0.42;
            }
        }

        @keyframes mondrian-geometric-float-b {
            0%, 100% {
                transform: translateY(0px) scale(1) rotate(10deg);
                opacity: 0.35;
            }
            33% {
                transform: translateY(-8px) scale(1.03) rotate(7deg);
                opacity: 0.44;
            }
            66% {
                transform: translateY(-14px) scale(1.05) rotate(5deg);
                opacity: 0.52;
            }
        }

        /* 小型分隔线装饰 */
        .mini-divider {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            padding: 20px 0;
            margin: 20px 0;
            grid-column: 1 / -1;
        }

        /* 魔法帽子模态窗口 */
        .magic-modal {
            display: none;
            position: fixed;
            z-index: 999;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            backdrop-filter: blur(5px);
        }

        .magic-modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.9);
            padding: 60px;
            border-radius: 20px;
            border: 3px solid ${COLORS["mondrian-black"]};
            box-shadow: 0 8px 0 ${COLORS["mondrian-black"]};
            text-align: center;
            animation: magic-modal-appear 0.3s ease-out;
        }

        @keyframes magic-modal-appear {
            0% {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8);
            }
            100% {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }
        }

        .magic-emoji {
            font-size: 8rem;
            animation: magic-bounce 2s ease-in-out infinite;
            display: block;
            margin-bottom: 20px;
        }

        @keyframes magic-bounce {
            0%, 100% {
                transform: scale(1) rotate(-10deg);
            }
            50% {
                transform: scale(1.1) rotate(10deg);
            }
        }

        .magic-text {
            font-size: 1.5rem;
            font-weight: 700;
            background: linear-gradient(120deg, ${COLORS["mofa-gradient-1"]}, ${COLORS["mofa-gradient-2"]}, ${COLORS["mofa-gradient-3"]});
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            margin-bottom: 20px;
        }

        .magic-close {
            background: ${COLORS["mondrian-red"]};
            color: white;
            border: 2px solid ${COLORS["mondrian-black"]};
            border-radius: 8px;
            padding: 10px 20px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 2px 0 ${COLORS["mondrian-black"]};
            transition: all 0.2s ease;
        }

        .magic-close:hover {
            transform: translate(-2px, -2px);
            box-shadow: 4px 4px 0 ${COLORS["mondrian-black"]};
        }

        /* 魔法帽子图标 */
        .magic-trigger {
            position: absolute;
            top: -1.7rem;
            left: 48%;
            transform: translateX(-50%);
            width: 2.5rem;
            height: 2.5rem;
            background: transparent;
            border: none;
            border-radius: 50%;
            font-size: 2rem;
            cursor: default;
            z-index: 15;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: none;
            color: black;
            line-height: 1;
        }



        /* 左侧头部内的分隔线 */
        .header-in-left .mini-divider {
            justify-content: flex-start;
            padding: 15px 0;
            margin: 15px 0;
            grid-column: auto;
        }

        .mini-line {
            width: 40px;
            height: 3px;
            border-radius: 2px;
            transition: all 0.3s ease;
        }

        .red-line {
            background: linear-gradient(90deg, ${COLORS["mofa-gradient-1"]}, ${COLORS["mofa-gradient-2"]});
        }

        .blue-line {
            background: linear-gradient(90deg, ${COLORS["mofa-gradient-4"]}, ${COLORS["mondrian-blue"]});
        }

        .yellow-line {
            background: linear-gradient(90deg, ${COLORS["mofa-gradient-3"]}, ${COLORS["mondrian-yellow"]});
        }
    </style>
</head>
<body class="layout-${layoutType}">
    <div class="decoration"></div>

    <!-- 浮动蒙德里安色块装饰 -->
    <div class="floating-shapes">
        <div class="float-shape float-red"></div>
        <div class="float-shape float-blue"></div>
        <div class="float-shape float-yellow"></div>
        <div class="float-shape float-black"></div>
    </div>

    <!-- 魔法帽子模态窗口 -->
    <div id="magicModal" class="magic-modal" onclick="hideMagicHat()">
        <div class="magic-modal-content" onclick="event.stopPropagation()">
            <div class="magic-emoji">🎩</div>
            <div class="magic-text">✨ 魔法师的帽子 ✨</div>
            <button class="magic-close" onclick="hideMagicHat()">关闭</button>
        </div>
    </div>

    <!-- 二维码模态窗口 -->
    <div id="qrModal" class="qr-modal" onclick="hideQRModal()">
        <div class="qr-modal-content" onclick="event.stopPropagation()">
            <div class="qr-modal-header">
                <span class="qr-modal-subtitle">MoFA Developer Link</span>
                <div class="qr-modal-title">扫码访问此页面</div>
            </div>
            <div class="qr-modal-body">
                <div class="qr-code-wrapper">
                    <img src="${qrCodeUrl}" alt="QR Code" width="200" height="200">
                </div>
                <p class="qr-modal-meta">使用手机摄像头或微信扫一扫快速打开当前开发者主页。</p>
            </div>
            <button class="qr-modal-close" onclick="hideQRModal()">关闭</button>
        </div>
    </div>

    <div class="container">
        <div class="main-content">
            <div class="links-section">
                <div class="links-wrapper">
                    <div class="header-in-left">
                        <h1 class="username">
                            <a href="https://github.com/${username}" target="_blank" rel="noopener noreferrer" class="user-profile-link">
                                <div class="avatar-container">
                                    <div class="magic-trigger">🎩</div>
                                    <img src="https://avatars.githubusercontent.com/${username}" alt="${username}" class="user-avatar">
                                </div>
                                ${username.toUpperCase()}
                            </a>
                        </h1>
                        <p class="subtitle">
                            <a href="https://mofa.ai" target="_blank" rel="noopener noreferrer" class="mofa-logo-link">
                                <img src="https://mofa.ai/mofa-logo.png" alt="MoFA Logo" class="subtitle-logo">
                            </a>
                            魔法师 - MoFA Developer
                        </p>
                        <!-- 小装饰分隔线 -->
                        <div class="mini-divider">
                            <div class="mini-line red-line"></div>
                            <div class="mini-line blue-line"></div>
                            <div class="mini-line yellow-line"></div>
                        </div>

                        <!-- 二维码卡片按钮 -->
                        <div class="fluid-card fluid-normal fluid-mint qr-card-button" onclick="showQRModal()">
                            <img src="/icons/qr-code.svg" alt="QR Code" class="fluid-icon">
                            <span class="fluid-name">分享二维码</span>
                        </div>
                    </div>
                    <div class="links-scroll">
                        <div class="fluid-container">
                            ${fluidLinks
                              .map(
                                (link) => `
                                <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="fluid-card fluid-${link.fluidHeight} fluid-${link.fluidColor}">
                                    <img src="${link.icon}" alt="${link.name}" class="fluid-icon">
                                    <span class="fluid-name">${link.name}</span>
                                </a>
                            `,
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
            </div>

            ${achievements ? generateAchievementsSection(achievements, githubStats) : ""}
        </div>

        <div class="footer">
            <p>由 <a href="https://mofa.ai" target="_blank">MoFA</a> 强力驱动</p>
        </div>
    </div>

    <script>
        function showMagicHat() {
            const modal = document.getElementById('magicModal');
            modal.style.display = 'block';
        }

        function hideMagicHat() {
            const modal = document.getElementById('magicModal');
            modal.style.display = 'none';
        }

        function showQRModal() {
            const modal = document.getElementById('qrModal');
            modal.style.display = 'flex';
        }

        function hideQRModal() {
            const modal = document.getElementById('qrModal');
            modal.style.display = 'none';
        }

        // 流体卡片加载动画
        document.addEventListener('DOMContentLoaded', function() {
            // 成就卡片动画
            const achievementCards = document.querySelectorAll('.achievement-card');
            achievementCards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                setTimeout(() => {
                    card.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 150);
            });

            // 流体卡片动画
            const fluidCards = document.querySelectorAll('.fluid-card');
            fluidCards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.9) translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1) translateY(0)';
                }, 800 + index * 60);
            });

            // 微妙的漂浮动画（延迟启动）
            setTimeout(() => {
                fluidCards.forEach((card, index) => {
                    setInterval(() => {
                        if (!card.matches(':hover')) {
                            card.style.transform = 'scale(1) translateY(-2px)';
                            setTimeout(() => {
                                card.style.transform = 'scale(1) translateY(0)';
                            }, 1000);
                        }
                    }, 6000 + index * 800);
                });
            }, 4000);
        });
    </script>
</body>
</html>`;
}

// 生成调试页面
function generateDebugPage(username, hostname, debugInfo) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>调试页面 - ${username}</title>

    <!-- Google Fonts - 与MoFA官网一致 -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', 'Noto Sans SC', system-ui, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            background-attachment: fixed;
            background-repeat: no-repeat;
            background-size: 100% 100%;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${COLORS["mondrian-black"]};
        }

        /* 选中文本颜色 */
        ::selection {
            background-color: ${COLORS["mondrian-red"]};
            color: white;
        }

        .container {
            max-width: 600px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 0;
            border: 2px solid ${COLORS["mondrian-black"]};
            box-shadow: 0 4px 0 ${COLORS["mondrian-black"]};
        }

        .title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 16px;
            background: linear-gradient(120deg, ${COLORS["mofa-gradient-1"]}, ${COLORS["mofa-gradient-3"]});
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
        }

        .debug-info {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 0;
            margin: 20px 0;
            font-family: 'JetBrains Mono', monospace;
            white-space: pre-wrap;
            font-size: 14px;
            border: 1px solid ${COLORS["mondrian-gray"]};
            max-height: 300px;
            overflow-y: auto;
        }

        .info-line {
            margin: 12px 0;
            padding: 8px 12px;
            background: #f8fafc;
            border-radius: 6px;
            border-left: 4px solid ${COLORS["mofa-gradient-1"]};
        }

        .username {
            font-weight: 600;
            color: ${COLORS["mondrian-black"]};
        }

        .footer {
            margin-top: 8px;
            padding: 6px 0;
            border-top: 1px solid rgba(148, 163, 184, 0.35);
            color: rgba(100, 116, 139, 0.7);
            font-size: 0.68rem;
            text-align: center;
        }

        .footer a {
            color: rgba(22, 101, 118, 0.85);
            text-decoration: none;
            font-weight: 600;
            transition: color 0.2s ease;
        }

        .footer a:hover {
            color: rgba(184, 66, 58, 0.9);
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🐛 调试页面</h1>

        <div class="info-line">
            <strong>用户名:</strong> <span class="username">${username}</span>
        </div>
        <div class="info-line">
            <strong>域名:</strong> <span class="username">${hostname}</span>
        </div>

        <div class="debug-info">调试信息:
${debugInfo}</div>

        <p style="color: #64748b; line-height: 1.6;">
            如果看到这个页面，说明配置解析出现了问题。请检查配置文件格式或联系管理员。
        </p>

        <div class="footer">
            <p>由 <a href="https://mofa.ai" target="_blank">MoFA</a> 强力驱动</p>
        </div>
    </div>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
    },
    body: html
  };
}

// 主请求处理函数
async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const hostname = req.headers.host;
  const pathname = parsedUrl.pathname;
  let username = null; // 初始化 username

  console.log(`📥 Request: ${req.method} ${pathname} from ${hostname}`);

  try {
    // 处理健康检查请求
    if (pathname === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
      return;
    }

    // 处理 favicon.ico 请求
    if (pathname === "/favicon.ico") {
      res.writeHead(301, { Location: "https://mofa.ai/mofa-logo.png" });
      res.end();
      return;
    }

    // 处理图标请求
    if (pathname.startsWith("/icons/")) {
      const iconResponse = await handleIconRequest(pathname);
      res.writeHead(iconResponse.statusCode, iconResponse.headers);
      res.end(iconResponse.body);
      return;
    }

    // 检查是否是子域名请求
    if (!isSubdomainRequest(hostname)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }

    username = extractUsername(hostname);

    if (!username) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Invalid subdomain");
      return;
    }

    // 获取开发者配置
    const configUrl = await getDeveloperConfig(username);

    if (!configUrl) {
      // 调试：显示调试信息页面
      const debugResponse = generateDebugPage(username, hostname, "No config URL found");
      res.writeHead(debugResponse.statusCode, debugResponse.headers);
      res.end(debugResponse.body);
      return;
    }

    // 获取并解析配置文件
    const links = await parseConfigFile(configUrl);

    if (links.length === 0) {
      // 调试：显示调试信息页面
      const debugResponse = generateDebugPage(
        username,
        hostname,
        `Config URL found: ${configUrl}, but no links parsed`,
      );
      res.writeHead(debugResponse.statusCode, debugResponse.headers);
      res.end(debugResponse.body);
      return;
    }

    // 获取成就数据
    const achievements = await fetchUserAchievements(username);
    let githubStats = null;

    if (achievements && achievements.enableGithubStats && achievements.githubUsername) {
      githubStats = await fetchGithubStats(achievements.githubUsername);
    }

    // 生成HTML页面
    const html = await generateHTML(username, links, hostname, achievements, githubStats);

    res.writeHead(200, {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "public, max-age=300",
    });
    res.end(html);

  } catch (error) {
    console.error("Error handling request:", error);
    // 对于配置错误，显示调试页面
    const debugResponse = generateDebugPage(username || "unknown", hostname, `Error: ${error.message}`);
    res.writeHead(debugResponse.statusCode, debugResponse.headers);
    res.end(debugResponse.body);
  }
}

// 检查 SSL 证书是否存在
function hasSSLCerts() {
  try {
    return fsSync.existsSync(CONFIG.SSL_CERT) && fsSync.existsSync(CONFIG.SSL_KEY);
  } catch (err) {
    return false;
  }
}

// HTTP 重定向到 HTTPS 的处理函数
function redirectToHTTPS(req, res) {
  const host = req.headers.host;
  const redirectURL = `https://${host}${req.url}`;
  
  res.writeHead(301, {
    'Location': redirectURL,
    'Content-Type': 'text/plain'
  });
  res.end(`Redirecting to ${redirectURL}`);
}

// 创建服务器
let httpServer;
let httpsServer;

if (hasSSLCerts()) {
  console.log('🔒 SSL 证书找到，启用 HTTPS...');

  try {
    // SSL 配置
    const sslOptions = {
      cert: fsSync.readFileSync(CONFIG.SSL_CERT),
      key: fsSync.readFileSync(CONFIG.SSL_KEY)
    };

    // 创建 HTTPS 服务器
    httpsServer = https.createServer(sslOptions, handleRequest);

    // 仅启动 HTTPS 服务器
    httpsServer.listen(CONFIG.HTTPS_PORT, () => {
      console.log(`🔐 HTTPS server running on port ${CONFIG.HTTPS_PORT}`);
      console.log(`🌐 Visit: https://localhost:${CONFIG.HTTPS_PORT}`);
      console.log(`ℹ️  仅启用 HTTPS，不占用 80 端口`);
    });

  } catch (err) {
    console.error('❌ SSL 证书加载失败:', err.message);
    console.log('🔄 回退到仅 HTTP 模式...');
    httpServer = http.createServer(handleRequest);
    httpServer.listen(CONFIG.PORT, () => {
      console.log(`🌐 HTTP server running on port ${CONFIG.PORT}`);
      console.log(`⚠️  SSL 证书加载失败，仅支持 HTTP`);
    });
  }
} else {
  console.log('📝 SSL 证书未找到，仅启用 HTTP...');
  httpServer = http.createServer(handleRequest);

  httpServer.listen(CONFIG.PORT, () => {
    console.log(`🌐 HTTP server running on port ${CONFIG.PORT}`);
    console.log(`ℹ️  要启用 HTTPS，请配置 SSL 证书：`);
    console.log(`   证书文件: ${CONFIG.SSL_CERT}`);
    console.log(`   私钥文件: ${CONFIG.SSL_KEY}`);
  });
}

// 优雅关闭
function gracefulShutdown(signal) {
  console.log(`🛑 ${signal} received, shutting down gracefully`);

  const servers = [httpServer, httpsServer].filter(Boolean);
  let remaining = servers.length;

  if (remaining === 0) {
    console.log('✅ No servers to close');
    process.exit(0);
    return;
  }

  servers.forEach(server => {
    server.close(() => {
      remaining--;
      if (remaining === 0) {
        console.log('✅ All servers closed');
        process.exit(0);
      }
    });
  });

  // 强制退出保护
  setTimeout(() => {
    console.log('⚡ Force exit after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
