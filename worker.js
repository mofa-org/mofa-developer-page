/**
 * MoFA Developer Personal Pages
 * Cloudflare Worker for generating developer profile pages
 */

// 配置常量
const CONFIG = {
  GITHUB_API_BASE: "https://api.github.com",
  GITHUB_RAW_BASE: "https://raw.githubusercontent.com",
  REPO_OWNER: "mofa-org",
  REPO_NAME: "mofa-developer-page",
  DEVELOPERS_FILE: "developers.md",
  CACHE_TTL: 300, // 5分钟缓存
  PRODUCTION_DOMAIN: "mofa.ai",
  TEST_DOMAIN: "liyao.space",
};

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

// 图标映射 - 简写名称对应的SVG内容
const ICONS = {
  // 已有图标...（保持原有的图标代码）
  github: "...", // 为节省空间，这里用...表示保持原内容
  // 新增全球热门服务
  facebook: "facebook",
  instagram: "instagram",
  tiktok: "tiktok",
  snapchat: "snapchat",
  reddit: "reddit",
  pinterest: "pinterest",
  twitch: "twitch",
  medium: "medium",
  notion: "notion",
  paypal: "paypal",
  patreon: "patreon",
  kofi: "kofi",
  mastodon: "mastodon",
  signal: "signal",
  viber: "viber",
  slack: "slack",
  zoom: "zoom",
  teams: "teams",
  applemusic: "applemusic",
  soundcloud: "soundcloud",
  netease: "netease",
  // 中文平台
  weibo: "weibo",
  zhihu: "zhihu",
  douban: "douban",
  qq: "qq",
  dingtalk: "dingtalk",
  douyin: "douyin",
  feishu: "message-square",
  lark: "message-square",
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
  // 特殊处理：这些链接不是标准域名，需要特殊检测
  "raw.githubusercontent.com": "home", // 对于GitHub raw文件，默认用home图标
};

// 图标处理函数 - 从GitHub raw获取图标文件
async function handleIconRequest(pathname) {
  const iconName = pathname.replace("/icons/", "").replace(".svg", "");

  try {
    const iconUrl = `${CONFIG.GITHUB_RAW_BASE}/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/main/resources/icons/${iconName}.svg`;
    console.log("🎨 Fetching icon from:", iconUrl);
    const response = await fetch(iconUrl);

    if (response.ok) {
      const svg = await response.text();
      console.log("✅ Icon fetched successfully:", iconName);
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } else {
      console.error("❌ Icon fetch failed:", iconName, response.status);
    }
  } catch (error) {
    console.error("❌ Error fetching icon:", iconName, error);
  }

  // 返回message-square图标作为默认
  const defaultIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  return new Response(defaultIcon, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

// 智能图标选择函数
function getIconForLink(url, iconHint) {
  console.log("🔍 getIconForLink called with url:", url, "iconHint:", iconHint);

  // 1. 如果明确指定了图标
  if (iconHint) {
    console.log("📌 Using specified icon hint:", iconHint);
    // 如果是完整URL，直接返回
    if (iconHint.startsWith("http")) {
      console.log("🌐 Using full URL icon:", iconHint);
      return iconHint;
    }
    // 如果是图标名，返回本地路径
    if (ICONS[iconHint]) {
      const iconPath = `/icons/${iconHint}.svg`;
      console.log("📦 Using built-in icon:", iconPath);
      return iconPath;
    }
  }

  // 2. 根据URL域名自动选择图标
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    const fullUrl = url.toLowerCase();
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
        console.log(
          `✅ Domain match found: ${domain} includes ${domainPattern} → ${iconPath}`,
        );
        return iconPath;
      }
    }
    console.log("❌ No domain match found for:", domain);
  } catch (e) {
    console.error("❌ URL parsing failed:", url, e);
  }

  // 3. 默认图标
  if (url.includes("mailto:")) {
    console.log("📧 Using mail icon for mailto");
    return `/icons/mail.svg`;
  }
  if (url.includes("tel:")) {
    console.log("📞 Using phone icon for tel");
    return `/icons/phone.svg`;
  }

  console.log("🏠 Using default home icon");
  return `/icons/home.svg`;
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  const pathname = url.pathname;

  // 处理 favicon.ico 请求
  if (pathname === "/favicon.ico") {
    return Response.redirect("https://mofa.ai/mofa-logo.png", 301);
  }

  // 处理图标请求
  if (pathname.startsWith("/icons/")) {
    return await handleIconRequest(pathname);
  }

  // 检查是否是子域名请求
  if (!isSubdomainRequest(hostname)) {
    return new Response("Not Found", { status: 404 });
  }

  const username = extractUsername(hostname);

  if (!username) {
    return new Response("Invalid subdomain", { status: 400 });
  }

  try {
    // 获取开发者配置
    const configUrl = await getDeveloperConfig(username);

    if (!configUrl) {
      // 调试：显示调试信息页面
      return generateDebugPage(username, hostname, "No config URL found");
    }

    // 获取并解析配置文件
    const links = await parseConfigFile(configUrl);

    if (links.length === 0) {
      // 调试：显示调试信息页面
      return generateDebugPage(
        username,
        hostname,
        `Config URL found: ${configUrl}, but no links parsed`,
      );
    }

    // 获取成就数据
    const achievements = await fetchUserAchievements(username);
    let githubStats = null;
    
    if (achievements && achievements.enableGithubStats && achievements.githubUsername) {
      githubStats = await fetchGithubStats(achievements.githubUsername);
    }

    // 生成HTML页面
    const html = await generateHTML(username, links, hostname, achievements, githubStats);

    return new Response(html, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Error handling request:", error);
    // 对于配置错误，显示调试页面
    return generateDebugPage(username, hostname, `Error: ${error.message}`);
  }
}

function isSubdomainRequest(hostname) {
  return (
    hostname.endsWith(`.${CONFIG.PRODUCTION_DOMAIN}`) ||
    hostname.endsWith(`.${CONFIG.TEST_DOMAIN}`)
  );
}

function extractUsername(hostname) {
  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

async function getDeveloperConfig(username) {
  console.log("🔍 getDeveloperConfig called with username:", username);
  const cacheKey = `https://cache/${username}/config`;

  // 尝试从缓存获取
  const cached = await caches.default.match(cacheKey);
  if (cached) {
    console.log("📦 Found cached config");
    const data = await cached.json();
    console.log("📦 Cached configUrl:", data.configUrl);
    return data.configUrl;
  }

  try {
    // 获取 developers.md 文件
    const url = `${CONFIG.GITHUB_RAW_BASE}/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/main/${CONFIG.DEVELOPERS_FILE}`;
    console.log("🌐 Fetching developers mapping from:", url);

    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        "❌ Failed to fetch developers mapping, status:",
        response.status,
      );
      throw new Error("Failed to fetch developers mapping");
    }

    const content = await response.text();
    console.log("📄 developers.md content length:", content.length);
    console.log("📄 developers.md content preview:", content.substring(0, 200));

    const configUrl = parseUsernameMapping(content, username);
    console.log("🔗 Parsed configUrl for", username, ":", configUrl);

    // 缓存结果
    const cacheResponse = new Response(JSON.stringify({ configUrl }), {
      headers: { "Cache-Control": `public, max-age=${CONFIG.CACHE_TTL}` },
    });
    await caches.default.put(cacheKey, cacheResponse);

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
    const response = await fetch(configUrl);

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
          currentLink.icon = getIconForLink(
            currentLink.url,
            currentLink.iconHint,
          );
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
        console.log(
          `🎨 Added icon hint: "${iconValue}" (processed: ${currentLink.iconHint})`,
        );
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
    const achievementUrl = `https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/achievements/${username}-achievements.md`;
    console.log("🏆 Fetching achievements from:", achievementUrl);
    
    const response = await fetch(achievementUrl);
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

// 解析成就Markdown文件
function parseAchievements(content) {
  const achievements = {
    githubUsername: null,
    enableGithubStats: false,
    contributions: [],
    hackathons: [],
    recognition: [],
    currentProjects: [],
    repositories: [],
    activities: []
  };
  
  const lines = content.split('\n');
  let currentItem = {};
  let currentSection = '';
  
  for (let line of lines) {
    const trimmed = line.trim();
    
    // 检测当前所在区域
    if (trimmed.startsWith('## ')) {
      currentSection = trimmed.replace('## ', '');
      continue;
    }
    
    // GitHub Stats section - 修复解析逻辑
    if (trimmed.startsWith('- GitHub Username:')) {
      const match = trimmed.match(/- GitHub Username:\s*(\w+)/);
      if (match) {
        achievements.githubUsername = match[1];
        console.log('✅ GitHub Username found:', match[1]);
      }
    }
    if (trimmed.startsWith('- Enable GitHub stats display:')) {
      achievements.enableGithubStats = trimmed.toLowerCase().includes('true');
      console.log('✅ Enable GitHub stats:', achievements.enableGithubStats);
    }
    
    // Repository contributions - 改进匹配规则
    if (trimmed.startsWith('- **') && trimmed.includes('mofa-org/')) {
      const repoMatch = trimmed.match(/\*\*(mofa-org\/[^*]+)\*\*/);
      if (repoMatch) {
        currentItem = { repo: repoMatch[1] };
      }
    }
    if (trimmed.includes('Role:') && currentItem.repo) {
      const roleMatch = trimmed.match(/Role:\s*(.+)/);
      if (roleMatch) {
        currentItem.role = roleMatch[1].trim();
      }
    }
    if (trimmed.includes('Contributions:') && currentItem.repo) {
      const contribMatch = trimmed.match(/Contributions:\s*(.+)/);
      if (contribMatch) {
        currentItem.contributions = contribMatch[1].trim();
        achievements.contributions.push({...currentItem});
        currentItem = {};
      }
    }
    
    // Hackathon awards - 改进解析
    if (trimmed.startsWith('### ') && !trimmed.includes('##') && currentSection.includes('Hackathon')) {
      const eventName = trimmed.replace('### ', '').trim();
      if (eventName.length > 0) {
        currentItem = { event: eventName };
      }
    }
    if (trimmed.startsWith('- **Award**:') && currentItem.event) {
      const awardMatch = trimmed.match(/- \*\*Award\*\*:\s*(.+)/);
      if (awardMatch) {
        currentItem.award = awardMatch[1].trim();
      }
    }
    if (trimmed.startsWith('- **Project**:') && currentItem.event) {
      const projectMatch = trimmed.match(/- \*\*Project\*\*:\s*(.+)/);
      if (projectMatch) {
        currentItem.project = projectMatch[1].trim();
      }
    }
    if (trimmed.startsWith('- **Date**:') && currentItem.event) {
      const dateMatch = trimmed.match(/- \*\*Date\*\*:\s*(.+)/);
      if (dateMatch) {
        currentItem.date = dateMatch[1].trim();
        // 只有当有事件、奖项和项目时才添加
        if (currentItem.event && currentItem.award && currentItem.project) {
          achievements.hackathons.push({...currentItem});
        }
        currentItem = {};
      }
    }
    
    // Repository showcase - 新增仓库展示解析
    if (currentSection.includes('Repository') && currentSection.includes('Showcase')) {
      if (trimmed.startsWith('- **') && !trimmed.includes('mofa-org/')) {
        const repoMatch = trimmed.match(/\*\*([^*]+)\*\*/);
        if (repoMatch) {
          currentItem = { name: repoMatch[1] };
        }
      }
      if (trimmed.includes('Description:') && currentItem.name) {
        const descMatch = trimmed.match(/Description:\s*(.+)/);
        if (descMatch) {
          currentItem.description = descMatch[1].trim();
        }
      }
      if (trimmed.includes('Language:') && currentItem.name) {
        const langMatch = trimmed.match(/Language:\s*(.+)/);
        if (langMatch) {
          currentItem.language = langMatch[1].trim();
        }
      }
      if (trimmed.includes('Stars:') && currentItem.name) {
        const starsMatch = trimmed.match(/Stars:\s*(\d+)/);
        if (starsMatch) {
          currentItem.stars = parseInt(starsMatch[1]);
          // 只有当有名称和描述时才添加
          if (currentItem.name && currentItem.description) {
            achievements.repositories.push({...currentItem});
          }
          currentItem = {};
        }
      }
    }
    
    // GitHub Activity - 新增动态解析
    if (currentSection.includes('GitHub') && currentSection.includes('Activity')) {
      if (trimmed.startsWith('- ')) {
        const activityMatch = trimmed.match(/- (.+?) in (.+?) \((.+?)\)/);
        if (activityMatch) {
          achievements.activities.push({
            type: activityMatch[1],
            repo: activityMatch[2],
            time: activityMatch[3]
          });
        }
      }
    }
  }
  
  console.log("🏆 Parsed achievements:", achievements);
  return achievements;
}

// 获取GitHub统计数据
async function fetchGithubStats(username) {
  if (!username) return null;
  
  try {
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    if (!userResponse.ok) return null;
    
    const userData = await userResponse.json();
    return {
      followers: userData.followers,
      following: userData.following,
      publicRepos: userData.public_repos,
      avatarUrl: userData.avatar_url,
      bio: userData.bio,
      location: userData.location,
      company: userData.company
    };
  } catch (error) {
    console.error("❌ Error fetching GitHub stats:", error);
    return null;
  }
}

// 生成GitHub动态卡片（从MD配置读取）
function generateGithubActivityCard(achievements) {
  if (!achievements.activities || achievements.activities.length === 0) return '';
  
  return `
    <div class="achievement-card github-activity">
      <div class="achievement-header">
        <img src="/icons/github.svg" alt="GitHub" class="achievement-icon">
        <h3>GitHub 动态</h3>
      </div>
      <div class="github-activity-list">
        ${achievements.activities.map(activity => `
          <div class="activity-item">
            <span class="activity-type">${activity.type}</span>
            <span class="activity-repo">${activity.repo}</span>
            <span class="activity-time">${activity.time}</span>
          </div>
        `).join('')}
      </div>
    </div>`;
}

// 生成获奖信息卡片
function generateAwardsCard(achievements) {
  if (!achievements.hackathons || achievements.hackathons.length === 0) return '';
  
  return `
    <div class="achievement-card awards-card">
      <div class="achievement-header">
        <div class="trophy-icon">AWARD</div>
        <h3>获奖信息</h3>
      </div>
      <div class="awards-list">
        ${achievements.hackathons.slice(0, 3).map(award => `
          <div class="award-item">
            <div class="award-icon">
              <div class="trophy-mini">AWARD</div>
            </div>
            <div class="award-content">
              <div class="award-title">${award.award}</div>
              <div class="award-event">${award.event}</div>
              <div class="award-project">${award.project}</div>
              <div class="award-date">${award.date}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

// 生成仓库展示卡片
function generateReposCard(achievements) {
  if (!achievements.repositories || achievements.repositories.length === 0) return '';
  
  return `
    <div class="achievement-card repos-card">
      <div class="achievement-header">
        <img src="/icons/github.svg" alt="Repos" class="achievement-icon">
        <h3>精选仓库</h3>
      </div>
      <div class="repos-list">
        ${achievements.repositories.map(repo => `
          <div class="repo-item">
            <div class="repo-name">
              <a href="https://github.com/${repo.name}" target="_blank" rel="noopener noreferrer">
                ${repo.name}
              </a>
            </div>
            <div class="repo-description">${repo.description}</div>
            <div class="repo-meta">
              ${repo.language ? `<span class="repo-language">${repo.language}</span>` : ''}
              ${repo.stars ? `<span class="repo-stars">⭐ ${repo.stars}</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

// 生成成就展示区域
function generateAchievementsSection(achievements, githubStats) {
  let content = '<div class="achievements-section">';
  
  // 1. GitHub动态
  content += generateGithubActivityCard(achievements);
  
  // 2. 获奖信息
  content += generateAwardsCard(achievements);
  
  // 3. 精选仓库
  content += generateReposCard(achievements);
  
  content += '</div>';
  return content;
}

// 流体网格布局 - Pinterest瀑布流风格
function assignFluidLayouts(links) {
  const colors = ["coral", "mint", "lavender", "peach", "sky", "sage", "rose", "lemon"];
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
      fluidColor: colors[index % colors.length]
    };
  });
}

async function generateHTML(username, links, hostname, achievements = null, githubStats = null) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://${hostname}`)}`;
  const fluidLinks = assignFluidLayouts(links);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${username} - MoFA Developer</title>
    <meta name="description" content="${username}的个人链接页面 - MoFA开发者">

    <!-- Google Fonts - 与MoFA官网一致 -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
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
            background: #f1f5f9;
            min-height: 100vh;
            margin: 0;
            padding: 0;
            position: relative;
        }

        /* 渐变背景层 - 使用伪元素确保完整覆盖 */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            z-index: -2;
            pointer-events: none;
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
        }
        
        .main-content {
            display: grid;
            grid-template-columns: 1fr 400px;
            gap: 40px;
            align-items: start;
        }

        .header {
            margin-bottom: 40px;
            text-align: center;
            grid-column: 1 / -1;
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
            background: linear-gradient(120deg, ${COLORS["mofa-gradient-1"]}, ${COLORS["mofa-gradient-2"]}, ${COLORS["mofa-gradient-3"]}, ${COLORS["mofa-gradient-4"]});
            background-size: 300% 300%;
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            animation: gradient-flow 12s ease-in-out infinite;
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
        }

        /* 流体网格布局系统 - Pinterest瀑布流风格 */
        .fluid-container {
            column-count: 3;
            column-gap: 20px;
            margin-bottom: 40px;
        }
        
        .links-section {
            grid-column: 1;
        }

        /* 流体卡片基础样式 */
        .fluid-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            color: white;
            font-weight: 500;
            border-radius: 16px;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            position: relative;
            overflow: hidden;
            margin-bottom: 20px;
            break-inside: avoid;
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255,255,255,0.15);
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        .fluid-card:hover {
            transform: translateY(-6px) scale(1.02);
            box-shadow: 0 12px 30px rgba(0,0,0,0.15);
            z-index: 10;
        }

        .fluid-card:active {
            transform: translateY(-2px) scale(1.01);
            transition: transform 0.1s ease;
        }

        /* 流体卡片高度变化 */
        .fluid-compact {
            padding: 20px 16px;
            min-height: 100px;
        }

        .fluid-normal {
            padding: 28px 20px;
            min-height: 140px;
        }

        .fluid-tall {
            padding: 36px 24px;
            min-height: 180px;
        }

        /* 流体卡片图标 */
        .fluid-icon {
            width: 40px;
            height: 40px;
            margin-bottom: 12px;
            filter: brightness(0) invert(1);
            opacity: 0.9;
            transition: all 0.3s ease;
        }

        .fluid-tall .fluid-icon {
            width: 48px;
            height: 48px;
            margin-bottom: 16px;
        }

        /* 流体卡片文字 */
        .fluid-name {
            font-size: 15px;
            font-weight: 500;
            text-align: center;
            line-height: 1.4;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            opacity: 0.95;
        }

        .fluid-tall .fluid-name {
            font-size: 17px;
            font-weight: 600;
        }

        /* 流体卡片颜色主题 - 柔和流动渐变 */
        .fluid-coral {
            background: linear-gradient(165deg, ${COLORS["macaron-coral"]}, ${COLORS["mofa-gradient-1"]});
        }

        .fluid-mint {
            background: linear-gradient(165deg, ${COLORS["macaron-mint"]}, ${COLORS["mondrian-blue"]});
        }

        .fluid-lavender {
            background: linear-gradient(165deg, ${COLORS["macaron-lavender"]}, #8B5CF6);
        }

        .fluid-peach {
            background: linear-gradient(165deg, ${COLORS["macaron-peach"]}, ${COLORS["mofa-gradient-2"]});
        }

        .fluid-sky {
            background: linear-gradient(165deg, ${COLORS["macaron-sky"]}, ${COLORS["mofa-gradient-4"]});
        }

        .fluid-sage {
            background: linear-gradient(165deg, ${COLORS["macaron-sage"]}, ${COLORS["macaron-mint"]});
        }

        .fluid-rose {
            background: linear-gradient(165deg, ${COLORS["macaron-rose"]}, ${COLORS["macaron-coral"]});
        }

        .fluid-lemon {
            background: linear-gradient(165deg, ${COLORS["macaron-lemon"]}, ${COLORS["mofa-gradient-3"]});
        }

        /* 流体卡片水波纹效果 */
        .fluid-card::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(60deg, transparent, rgba(255,255,255,0.12), transparent);
            transform: translateX(-120%);
            transition: transform 0.7s ease;
            border-radius: 16px;
        }

        .fluid-card:hover::before {
            transform: translateX(120%);
        }

        /* 图标悬停效果 */
        .fluid-card:hover .fluid-icon {
            transform: scale(1.1) rotate(5deg);
        }

        /* 大平板和小桌面响应式 */
        @media (max-width: 1200px) {
            .main-content {
                grid-template-columns: 1fr 350px;
            }
        }
        
        /* 响应式流体布局 */
        @media (max-width: 1024px) {
            .main-content {
                grid-template-columns: 1fr;
                gap: 30px;
            }
            
            .achievements-section {
                grid-column: 1;
                position: static;
                max-height: none;
                overflow-y: visible;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            }
            
            .fluid-container {
                column-count: 3;
            }
        }
        
        @media (max-width: 768px) {
            .fluid-container {
                column-count: 2;
            }
        }
        
        @media (max-width: 640px) {
            .fluid-container {
                column-count: 2;
                column-gap: 16px;
            }

            .fluid-card {
                border-radius: 14px;
                margin-bottom: 16px;
            }

            .fluid-icon {
                width: 32px;
                height: 32px;
                margin-bottom: 10px;
            }

            .fluid-tall .fluid-icon {
                width: 36px;
                height: 36px;
                margin-bottom: 12px;
            }

            .fluid-name {
                font-size: 13px;
            }

            .fluid-tall .fluid-name {
                font-size: 15px;
            }
        }

        @media (max-width: 480px) {
            .fluid-container {
                column-count: 1;
                column-gap: 0;
            }
            
            .container {
                padding: 20px 12px;
            }

            .fluid-card {
                margin-bottom: 14px;
                border-radius: 12px;
            }

            .fluid-compact {
                padding: 18px 14px;
                min-height: 90px;
            }

            .fluid-normal {
                padding: 24px 16px;
                min-height: 120px;
            }

            .fluid-tall {
                padding: 30px 18px;
                min-height: 150px;
            }
        }

        /* 成就展示区域样式 */
        .achievements-section {
            grid-column: 2;
            display: flex;
            flex-direction: column;
            gap: 24px;
            position: sticky;
            top: 20px;
            max-height: calc(100vh - 40px);
            overflow-y: auto;
        }

        .achievement-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            flex-shrink: 0;
        }

        .achievement-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .achievement-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            gap: 12px;
        }

        .achievement-icon {
            width: 28px;
            height: 28px;
            filter: none;
        }

        .trophy-icon {
            font-size: 12px;
            font-weight: 600;
            color: ${COLORS["mofa-gradient-1"]};
        }

        .achievement-header h3 {
            font-size: 1.2rem;
            font-weight: 600;
            color: ${COLORS["mondrian-black"]};
            margin: 0;
        }

        /* GitHub动态样式 */
        .github-activity-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .activity-item {
            padding: 12px;
            background: linear-gradient(135deg, ${COLORS["macaron-sky"]}22, ${COLORS["mondrian-blue"]}22);
            border-radius: 8px;
            border-left: 3px solid ${COLORS["mondrian-blue"]};
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .activity-type {
            font-size: 0.85rem;
            font-weight: 600;
            color: ${COLORS["mondrian-blue"]};
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
            gap: 12px;
            padding: 12px;
            background: linear-gradient(135deg, ${COLORS["macaron-peach"]}22, ${COLORS["mofa-gradient-1"]}22);
            border-radius: 12px;
            border: 1px solid ${COLORS["macaron-peach"]};
        }
        
        .award-icon {
            flex-shrink: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, ${COLORS["mofa-gradient-1"]}, ${COLORS["mofa-gradient-2"]});
            border-radius: 8px;
        }
        
        .trophy-mini {
            font-size: 12px;
            font-weight: 600;
            color: white;
        }
        
        .award-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        
        .award-title {
            font-weight: 600;
            color: ${COLORS["mofa-gradient-1"]};
            font-size: 0.9rem;
        }
        
        .award-event {
            font-size: 0.8rem;
            color: #666;
            font-weight: 500;
        }
        
        .award-project {
            font-size: 0.75rem;
            color: #888;
            font-style: italic;
        }
        
        .award-date {
            font-size: 0.7rem;
            color: #999;
        }

        /* 仓库展示样式 */
        .repos-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .repo-item {
            padding: 12px;
            background: linear-gradient(135deg, ${COLORS["macaron-mint"]}22, ${COLORS["macaron-sage"]}22);
            border-radius: 10px;
            border: 1px solid ${COLORS["macaron-mint"]};
            transition: all 0.3s ease;
        }
        
        .repo-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .repo-name {
            margin-bottom: 6px;
        }
        
        .repo-name a {
            color: ${COLORS["mondrian-blue"]};
            text-decoration: none;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .repo-name a:hover {
            text-decoration: underline;
        }
        
        .repo-description {
            font-size: 0.8rem;
            color: #666;
            line-height: 1.4;
            margin-bottom: 8px;
        }
        
        .repo-meta {
            display: flex;
            gap: 12px;
            font-size: 0.75rem;
        }
        
        .repo-language {
            color: ${COLORS["mofa-gradient-3"]};
            font-weight: 500;
        }
        
        .repo-stars {
            color: #666;
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
        }

        /* 流体容器优化 */
        .fluid-container::after {
            content: '';
            display: block;
            height: 0;
            clear: both;
        }

        /* 二维码区域 */
        .qr-section {
            margin: 40px 0;
            padding: 24px;
            background: white;
            border-radius: 8px;
            border: 2px solid ${COLORS["mondrian-black"]};
            box-shadow: 0 2px 0 ${COLORS["mondrian-black"]};
            grid-column: 1 / -1;
            text-align: center;
        }

        /* 按钮样式 - 仿照MoFA官网的btn-primary */
        .qr-toggle {
            display: inline-flex;
            align-items: center;
            padding: 12px 24px;
            background-color: ${COLORS["mondrian-red"]};
            color: white;
            text-decoration: none;
            border: 1px solid ${COLORS["mondrian-black"]};
            border-radius: 0;
            font-weight: 600;
            transition: all 0.2s ease;
            cursor: pointer;
            box-shadow: 0 0px 0 ${COLORS["mondrian-black"]};
        }

        .qr-toggle:hover {
            transform: translate(-2px, -2px);
            box-shadow: 3px 3px 0 ${COLORS["mondrian-black"]};
        }

        .qr-code {
            margin-top: 20px;
            display: none;
        }

        .qr-code img {
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            border: 1px solid ${COLORS["mondrian-gray"]};
        }

        .footer {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid ${COLORS["mondrian-gray"]};
            color: #64748b;
            font-size: 0.875rem;
            grid-column: 1 / -1;
            text-align: center;
        }

        .footer a {
            color: ${COLORS["mofa-gradient-1"]};
            text-decoration: none;
            font-weight: 500;
        }

        .footer a:hover {
            color: ${COLORS["mondrian-red"]};
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
            opacity: 0.4;
            background: linear-gradient(135deg,
                rgba(248, 250, 252, 0.5) 0%,
                rgba(226, 232, 240, 0.5) 100%);
        }

        .decoration::before {
            content: '';
            position: absolute;
            top: 20%;
            left: -50px;
            width: 200px;
            height: 300px;
            background: linear-gradient(45deg, ${COLORS["macaron-peach"]}44, ${COLORS["macaron-rose"]}44);
            border-radius: 20px;
            transform: rotate(-15deg);
            animation: mondrian-geometric-float 8s ease-in-out infinite;
        }

        .decoration::after {
            content: '';
            position: absolute;
            bottom: 20%;
            right: -50px;
            width: 250px;
            height: 200px;
            background: linear-gradient(135deg, ${COLORS["macaron-sky"]}44, ${COLORS["macaron-lavender"]}44);
            border-radius: 20px;
            transform: rotate(15deg);
            animation: mondrian-geometric-float 10s ease-in-out infinite 1s;
        }

        @keyframes mondrian-geometric-float {
            0%, 100% {
                transform: translateY(0px) scale(1) rotate(-15deg);
                opacity: 0.3;
            }
            25% {
                transform: translateY(-5px) scale(1.02) rotate(-14.6deg);
                opacity: 0.4;
            }
            50% {
                transform: translateY(-15px) scale(1.04) rotate(-14.2deg);
                opacity: 0.5;
            }
            75% {
                transform: translateY(-5px) scale(1.02) rotate(-14.6deg);
                opacity: 0.4;
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
<body>
    <div class="decoration"></div>

    <div class="container">
        <div class="header">
            <div class="logo">
                <img src="https://mofa.ai/mofa-logo.png" alt="MoFA Logo">
            </div>
            <h1 class="username">${username}</h1>
            <p class="subtitle">MoFA Developer</p>
        </div>

        <!-- 小装饰分隔线 -->
        <div class="mini-divider">
            <div class="mini-line red-line"></div>
            <div class="mini-line blue-line"></div>
            <div class="mini-line yellow-line"></div>
        </div>

        <div class="main-content">
            <div class="links-section">
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
            
            ${achievements ? generateAchievementsSection(achievements, githubStats) : ''}
        </div>

        <div class="qr-section">
            <button class="qr-toggle" onclick="toggleQR()">分享二维码</button>
            <div class="qr-code" id="qrCode">
                <p style="margin-bottom: 12px; color: #64748b;">扫码访问此页面</p>
                <img src="${qrCodeUrl}" alt="QR Code" width="200" height="200">
            </div>
        </div>

        <div class="footer">
            <p>由 <a href="https://mofa.ai" target="_blank">MoFA</a> 强力驱动</p>
        </div>
    </div>

    <script>
        function toggleQR() {
            const qrCode = document.getElementById('qrCode');
            const button = document.querySelector('.qr-toggle');

            if (qrCode.style.display === 'none' || qrCode.style.display === '') {
                qrCode.style.display = 'block';
                button.textContent = '隐藏二维码';
            } else {
                qrCode.style.display = 'none';
                button.textContent = '分享二维码';
            }
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

function generateDefaultPage(username, hostname) {
  const githubUrl = `https://github.com/${username}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://${hostname}`)}`;

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${username} - MoFA Developer</title>
    <meta name="description" content="${username}的个人页面 - MoFA开发者">

    <!-- Google Fonts - 与MoFA官网一致 -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">

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
            max-width: 500px;
            padding: 40px;
            text-align: center;
            background: white;
            border-radius: 8px;
            border: 2px solid ${COLORS["mondrian-black"]};
            box-shadow: 0 4px 0 ${COLORS["mondrian-black"]};
        }

        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
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

        .username {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 8px;
            background: linear-gradient(120deg, ${COLORS["mofa-gradient-1"]}, ${COLORS["mofa-gradient-2"]}, ${COLORS["mofa-gradient-3"]}, ${COLORS["mofa-gradient-4"]});
            background-size: 300% 300%;
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            animation: gradient-flow 12s ease-in-out infinite;
        }

        @keyframes gradient-flow {
            0% { background-position: 0% 50%; }
            25% { background-position: 100% 50%; }
            50% { background-position: 100% 100%; }
            75% { background-position: 0% 100%; }
            100% { background-position: 0% 50%; }
        }

        .message {
            color: #64748b;
            margin-bottom: 32px;
            line-height: 1.6;
        }

        /* 按钮样式 - 仿照MoFA官网 */
        .github-link {
            display: inline-flex;
            align-items: center;
            padding: 12px 24px;
            background-color: ${COLORS["mondrian-red"]};
            color: white;
            text-decoration: none;
            border: 1px solid ${COLORS["mondrian-black"]};
            border-radius: 0;
            font-weight: 600;
            transition: all 0.2s ease;
            cursor: pointer;
            box-shadow: 0 0px 0 ${COLORS["mondrian-black"]};
            margin-bottom: 24px;
        }

        .github-link:hover {
            transform: translate(-2px, -2px);
            box-shadow: 3px 3px 0 ${COLORS["mondrian-black"]};
        }

        .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid ${COLORS["mondrian-gray"]};
            color: #64748b;
            font-size: 0.875rem;
        }

        .footer a {
            color: ${COLORS["mofa-gradient-1"]};
            text-decoration: none;
            font-weight: 500;
        }

        .footer a:hover {
            color: ${COLORS["mondrian-red"]};
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="https://mofa.ai/mofa-logo.png" alt="MoFA Logo">
        </div>
        <h1 class="username">${username}</h1>
        <p class="message">
            该开发者尚未配置个人链接页面。<br>
            你可以访问他们的 GitHub 主页：
        </p>
        <a href="${githubUrl}" target="_blank" rel="noopener noreferrer" class="github-link">
            访问 GitHub
        </a>
        <div class="footer">
            <p>由 <a href="https://mofa.ai" target="_blank">MoFA</a> 强力驱动</p>
        </div>
    </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}

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
            background: white;
            border-radius: 8px;
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
            border-radius: 8px;
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
            color: ${COLORS["mofa-gradient-1"]};
        }

        .footer {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid ${COLORS["mondrian-gray"]};
            color: #64748b;
            font-size: 0.875rem;
            text-align: center;
        }

        .footer a {
            color: ${COLORS["mofa-gradient-1"]};
            text-decoration: none;
            font-weight: 500;
        }

        .footer a:hover {
            color: ${COLORS["mondrian-red"]};
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

  return new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
    },
  });
}

function generateErrorPage(username, hostname) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>页面暂时不可用 - MoFA Developer</title>

    <!-- Google Fonts - 与MoFA官网一致 -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">

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
            max-width: 500px;
            padding: 40px;
            text-align: center;
            background: white;
            border-radius: 8px;
            border: 2px solid ${COLORS["mondrian-black"]};
            box-shadow: 0 4px 0 ${COLORS["mondrian-black"]};
        }

        .error-icon {
            font-size: 4rem;
            margin-bottom: 24px;
            display: block;
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

        .message {
            color: #64748b;
            margin-bottom: 32px;
            line-height: 1.6;
        }

        /* 按钮样式 - 仿照MoFA官网 */
        .home-link {
            display: inline-flex;
            align-items: center;
            padding: 12px 24px;
            background-color: ${COLORS["mondrian-red"]};
            color: white;
            text-decoration: none;
            border: 1px solid ${COLORS["mondrian-black"]};
            border-radius: 0;
            font-weight: 600;
            transition: all 0.2s ease;
            cursor: pointer;
            box-shadow: 0 0px 0 ${COLORS["mondrian-black"]};
        }

        .home-link:hover {
            transform: translate(-2px, -2px);
            box-shadow: 3px 3px 0 ${COLORS["mondrian-black"]};
        }

        .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid ${COLORS["mondrian-gray"]};
            color: #64748b;
            font-size: 0.875rem;
        }

        .footer a {
            color: ${COLORS["mofa-gradient-1"]};
            text-decoration: none;
            font-weight: 500;
        }

        .footer a:hover {
            color: ${COLORS["mondrian-red"]};
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">⚠️</div>
        <h1 class="title">页面暂时不可用</h1>
        <p class="message">
            抱歉，${username} 的页面现在无法加载。<br>
            请稍后再试或联系管理员。
        </p>
        <a href="https://mofa.ai" class="home-link">返回 MoFA 主页</a>

        <div class="footer">
            <p>由 <a href="https://mofa.ai" target="_blank">MoFA</a> 强力驱动</p>
        </div>
    </div>
</body>
</html>`;

  return new Response(html, {
    status: 500,
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
    },
  });
}
