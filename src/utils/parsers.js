import { CONFIG, ICONS, DOMAIN_TO_ICON } from './config.js';

// 获取开发者配置映射
export async function getDeveloperConfig(username) {
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

  console.log("🌐 Fetching fresh config from:", CONFIG.DEVELOPERS_MAPPING_URL);

  try {
    const response = await fetch(CONFIG.DEVELOPERS_MAPPING_URL);
    if (!response.ok) {
      console.error("❌ Failed to fetch developers mapping:", response.status);
      return null;
    }

    const content = await response.text();
    console.log("📄 Developers mapping content length:", content.length);

    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/\[([^\]]+)\]\[([^\]]+)\]/);
      if (match) {
        const [, user, configUrl] = match;
        console.log(`👤 Found mapping: ${user} -> ${configUrl}`);

        if (user === username) {
          console.log("✅ Found config for user:", username, "->", configUrl);

          // 缓存结果
          const cacheResponse = new Response(JSON.stringify({ configUrl }));
          await caches.default.put(cacheKey, cacheResponse.clone());

          return configUrl;
        }
      }
    }

    console.log("❌ User not found in mapping:", username);
    return null;
  } catch (error) {
    console.error("❌ Error fetching developers config:", error);
    return null;
  }
}

// 解析配置文件
export async function parseConfigFile(configUrl) {
  console.log("📄 parseConfigFile called with URL:", configUrl);

  try {
    const response = await fetch(configUrl);
    if (!response.ok) {
      console.error("❌ Failed to fetch config file:", response.status);
      return [];
    }

    const content = await response.text();
    console.log("📄 Config file content length:", content.length);

    return parseYAMLLinks(content);
  } catch (error) {
    console.error("❌ Error parsing config file:", error);
    return [];
  }
}

// 解析YAML格式的链接
export function parseYAMLLinks(content) {
  console.log("🔧 parseYAMLLinks called");
  const links = [];
  const lines = content.split('\n');
  let currentLink = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 匹配链接名称（顶级key）
    if (line && !line.startsWith(' ') && !line.startsWith('#') && line.includes(':')) {
      // 保存之前的链接
      if (currentLink.name && currentLink.url) {
        const icon = getIconForLink(currentLink.url, currentLink.iconHint);
        links.push({
          name: currentLink.name,
          url: currentLink.url,
          icon: icon
        });
      }

      // 开始新链接
      const linkName = line.split(':')[0].trim();
      currentLink = { name: linkName };
    }
    // 匹配URL
    else if (line.startsWith('url:')) {
      const url = line.substring(4).trim();
      currentLink.url = url;
    }
    // 匹配图标提示
    else if (line.startsWith('icon:')) {
      const iconHint = line.substring(5).trim();
      if (iconHint) {
        currentLink.iconHint = iconHint;
      }
    }
  }

  // 处理最后一个链接
  if (currentLink.name && currentLink.url) {
    const icon = getIconForLink(currentLink.url, currentLink.iconHint);
    links.push({
      name: currentLink.name,
      url: currentLink.url,
      icon: icon
    });
  }

  console.log("✅ Parsed links:", links);
  return links;
}

// 智能图标选择函数
export function getIconForLink(url, iconHint) {
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
  } catch (error) {
    console.error("❌ Error parsing URL:", error);
  }

  // 3. 特殊协议处理
  if (url.startsWith("mailto:")) {
    console.log("📧 Using mail icon for mailto");
    return `/icons/mail.svg`;
  }
  if (url.startsWith("tel:")) {
    console.log("📞 Using phone icon for tel");
    return `/icons/phone.svg`;
  }

  console.log("🏠 Using default home icon");
  return `/icons/home.svg`;
}