/**
 * MoFA Developer Personal Pages
 * Cloudflare Worker for generating developer profile pages
 */

// 配置常量
const CONFIG = {
  GITHUB_API_BASE: 'https://api.github.com',
  GITHUB_RAW_BASE: 'https://raw.githubusercontent.com',
  REPO_OWNER: 'mofa-org',
  REPO_NAME: 'mofa-developer-page',
  DEVELOPERS_FILE: 'developers.md',
  CACHE_TTL: 300, // 5分钟缓存
  PRODUCTION_DOMAIN: 'mofa.ai',
  TEST_DOMAIN: 'liyao.space'
};

// MoFA 品牌颜色
const COLORS = {
  red: '#D32F2F',
  blue: '#1976D2', 
  yellow: '#FFB300',
  gradient1: '#FB6A58',
  gradient2: '#FD543F',
  gradient3: '#FFC63E',
  gradient4: '#6DCACE',
  black: '#2D3748',
  white: '#FFFFFF',
  gray: '#E2E8F0'
};

// 图标映射 - 简写名称对应的SVG内容
const ICONS = {
  // 已有图标...（保持原有的图标代码）
  'github': '...',  // 为节省空间，这里用...表示保持原内容
  // 新增全球热门服务
  'facebook': 'facebook',
  'instagram': 'instagram', 
  'tiktok': 'tiktok',
  'snapchat': 'snapchat',
  'reddit': 'reddit',
  'pinterest': 'pinterest',
  'twitch': 'twitch',
  'medium': 'medium',
  'notion': 'notion',
  'paypal': 'paypal',
  'patreon': 'patreon',
  'kofi': 'kofi',
  'mastodon': 'mastodon',
  'signal': 'signal',
  'viber': 'viber',
  'slack': 'slack',
  'zoom': 'zoom',
  'teams': 'teams',
  'applemusic': 'applemusic',
  'soundcloud': 'soundcloud',
  'netease': 'netease',
  // 中文平台
  'weibo': 'weibo',
  'zhihu': 'zhihu', 
  'douban': 'douban',
  'qq': 'qq',
  'dingtalk': 'dingtalk',
  'douyin': 'douyin',
  'feishu': 'message-square',
  'lark': 'message-square'
};

// URL域名到图标的智能映射
const DOMAIN_TO_ICON = {
  'github.com': 'github',
  'linkedin.com': 'linkedin',
  'twitter.com': 'x',
  'x.com': 'x',
  't.me': 'telegram',
  'telegram.org': 'telegram',
  'line.me': 'line',
  'web.whatsapp.com': 'whatsapp',
  'wa.me': 'whatsapp',
  'discord.gg': 'discord',
  'discord.com': 'discord',
  'steamcommunity.com': 'steam',
  'store.steampowered.com': 'steam',
  'youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'open.spotify.com': 'spotify',
  'spotify.com': 'spotify',
  'facebook.com': 'facebook',
  'fb.com': 'facebook',
  'instagram.com': 'instagram',
  'tiktok.com': 'tiktok',
  'snapchat.com': 'snapchat',
  'reddit.com': 'reddit',
  'pinterest.com': 'pinterest',
  'twitch.tv': 'twitch',
  'medium.com': 'medium',
  'notion.so': 'notion',
  'paypal.com': 'paypal',
  'paypal.me': 'paypal',
  'patreon.com': 'patreon',
  'ko-fi.com': 'kofi',
  'mastodon.social': 'mastodon',
  'signal.org': 'signal',
  'viber.com': 'viber',
  'slack.com': 'slack',
  'zoom.us': 'zoom',
  'teams.microsoft.com': 'teams',
  'music.apple.com': 'applemusic',
  'soundcloud.com': 'soundcloud',
  'music.163.com': 'netease',
  // 中文平台
  'weibo.com': 'weibo',
  'zhihu.com': 'zhihu',
  'douban.com': 'douban',
  'qq.com': 'qq',
  'dingtalk.com': 'dingtalk',
  'douyin.com': 'douyin',
  'xiaohongshu.com': 'xiaohongshu',
  'bilibili.com': 'bilibili',
  'space.bilibili.com': 'bilibili',
  'feishu.cn': 'message-square',
  'lark.com': 'message-square',
  // 特殊处理：这些链接不是标准域名，需要特殊检测
  'raw.githubusercontent.com': 'home'  // 对于GitHub raw文件，默认用home图标
};

// 图标处理函数 - 从GitHub raw获取图标文件
async function handleIconRequest(pathname) {
  const iconName = pathname.replace('/icons/', '').replace('.svg', '');
  
  try {
    const iconUrl = `${CONFIG.GITHUB_RAW_BASE}/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/main/resources/icons/${iconName}.svg`;
    console.log('🎨 Fetching icon from:', iconUrl);
    const response = await fetch(iconUrl);
    
    if (response.ok) {
      const svg = await response.text();
      console.log('✅ Icon fetched successfully:', iconName);
      return new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    } else {
      console.error('❌ Icon fetch failed:', iconName, response.status);
    }
  } catch (error) {
    console.error('❌ Error fetching icon:', iconName, error);
  }
  
  // 返回message-square图标作为默认
  const defaultIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  return new Response(defaultIcon, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}

// 智能图标选择函数
function getIconForLink(url, iconHint) {
  console.log('🔍 getIconForLink called with url:', url, 'iconHint:', iconHint);
  
  // 1. 如果明确指定了图标
  if (iconHint) {
    console.log('📌 Using specified icon hint:', iconHint);
    // 如果是完整URL，直接返回
    if (iconHint.startsWith('http')) {
      console.log('🌐 Using full URL icon:', iconHint);
      return iconHint;
    }
    // 如果是图标名，返回本地路径
    if (ICONS[iconHint]) {
      const iconPath = `/icons/${iconHint}.svg`;
      console.log('📦 Using built-in icon:', iconPath);
      return iconPath;
    }
  }
  
  // 2. 根据URL域名自动选择图标
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    const fullUrl = url.toLowerCase();
    console.log('🌐 Analyzing domain:', domain, 'fullUrl:', fullUrl);
    
    // 特殊处理：根据URL内容判断（不区分大小写）
    if (fullUrl.includes('wechat')) {
      console.log('✅ WeChat detected in URL');
      return `/icons/wechat.svg`;
    }
    if (fullUrl.includes('skype')) {
      console.log('✅ Skype detected in URL');
      return `/icons/skype.svg`;
    }
    if (fullUrl.includes('whatsapp')) {
      console.log('✅ WhatsApp detected in URL');
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
    console.log('❌ No domain match found for:', domain);
  } catch (e) {
    console.error('❌ URL parsing failed:', url, e);
  }
  
  // 3. 默认图标
  if (url.includes('mailto:')) {
    console.log('📧 Using mail icon for mailto');
    return `/icons/mail.svg`;
  }
  if (url.includes('tel:')) {
    console.log('📞 Using phone icon for tel');
    return `/icons/phone.svg`;
  }
  
  console.log('🏠 Using default home icon');
  return `/icons/home.svg`;
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  const pathname = url.pathname;
  
  // 处理 favicon.ico 请求
  if (pathname === '/favicon.ico') {
    return Response.redirect('https://mofa.ai/mofa-logo.png', 301);
  }
  
  // 处理图标请求
  if (pathname.startsWith('/icons/')) {
    return await handleIconRequest(pathname);
  }
  
  // 检查是否是子域名请求
  if (!isSubdomainRequest(hostname)) {
    return new Response('Not Found', { status: 404 });
  }
  
  const username = extractUsername(hostname);
  
  if (!username) {
    return new Response('Invalid subdomain', { status: 400 });
  }
  
  try {
    // 获取开发者配置
    const configUrl = await getDeveloperConfig(username);
    
    if (!configUrl) {
      // 调试：显示调试信息页面
      return generateDebugPage(username, hostname, 'No config URL found');
    }
    
    // 获取并解析配置文件
    const links = await parseConfigFile(configUrl);
    
    if (links.length === 0) {
      // 调试：显示调试信息页面
      return generateDebugPage(username, hostname, `Config URL found: ${configUrl}, but no links parsed`);
    }
    
    // 生成HTML页面
    const html = generateHTML(username, links, hostname);
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=300'
      }
    });
    
  } catch (error) {
    console.error('Error handling request:', error);
    // 对于配置错误，显示调试页面
    return generateDebugPage(username, hostname, `Error: ${error.message}`);
  }
}

function isSubdomainRequest(hostname) {
  return hostname.endsWith(`.${CONFIG.PRODUCTION_DOMAIN}`) || 
         hostname.endsWith(`.${CONFIG.TEST_DOMAIN}`);
}

function extractUsername(hostname) {
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}

async function getDeveloperConfig(username) {
  console.log('🔍 getDeveloperConfig called with username:', username);
  const cacheKey = `https://cache/${username}/config`;
  
  // 尝试从缓存获取
  const cached = await caches.default.match(cacheKey);
  if (cached) {
    console.log('📦 Found cached config');
    const data = await cached.json();
    console.log('📦 Cached configUrl:', data.configUrl);
    return data.configUrl;
  }
  
  try {
    // 获取 developers.md 文件
    const url = `${CONFIG.GITHUB_RAW_BASE}/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/main/${CONFIG.DEVELOPERS_FILE}`;
    console.log('🌐 Fetching developers mapping from:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('❌ Failed to fetch developers mapping, status:', response.status);
      throw new Error('Failed to fetch developers mapping');
    }
    
    const content = await response.text();
    console.log('📄 developers.md content length:', content.length);
    console.log('📄 developers.md content preview:', content.substring(0, 200));
    
    const configUrl = parseUsernameMapping(content, username);
    console.log('🔗 Parsed configUrl for', username, ':', configUrl);
    
    // 缓存结果
    const cacheResponse = new Response(JSON.stringify({ configUrl }), {
      headers: { 'Cache-Control': `public, max-age=${CONFIG.CACHE_TTL}` }
    });
    await caches.default.put(cacheKey, cacheResponse);
    
    return configUrl;
    
  } catch (error) {
    console.error('❌ Error fetching developer config:', error);
    return null;
  }
}

function parseUsernameMapping(content, username) {
  console.log('🔍 parseUsernameMapping called for username:', username);
  // 解析格式: [username][config-url]
  const lines = content.split('\n');
  console.log('📝 Total lines in developers.md:', lines.length);
  
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
  console.log('🔗 parseConfigFile called with URL:', configUrl);
  try {
    const response = await fetch(configUrl);
    
    if (!response.ok) {
      console.error('❌ Failed to fetch config file, status:', response.status);
      throw new Error('Failed to fetch config file');
    }
    
    const content = await response.text();
    console.log('📄 Config file content length:', content.length);
    console.log('📄 Config file preview:', content.substring(0, 300));
    
    const links = parseLinks(content);
    console.log('🔗 Parsed links count:', links.length);
    console.log('🔗 Parsed links:', JSON.stringify(links, null, 2));
    
    return links;
    
  } catch (error) {
    console.error('❌ Error parsing config file:', error);
    return [];
  }
}

function parseLinks(content) {
  console.log('📋 parseLinks called');
  // 解析YAML格式配置文件
  const links = [];
  
  try {
    const lines = content.split('\n');
    console.log('📝 Total lines to process:', lines.length);
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
          name: keyMatch[1].charAt(0).toUpperCase() + keyMatch[1].slice(1)
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
        currentLink.iconHint = iconValue === '' ? null : iconValue; // 空字符串转为null
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
    console.error('❌ Error parsing YAML config:', error);
  }
  
  return links;
}

function generateHTML(username, links, hostname) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://${hostname}`)}`;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${username} - MoFA Developer</title>
    <meta name="description" content="${username}的个人链接页面 - MoFA开发者">
    
    <!-- 响应式设计 -->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'Noto Sans SC', system-ui, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            color: ${COLORS.black};
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            text-align: center;
        }
        
        .header {
            margin-bottom: 40px;
        }
        
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
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
            background: linear-gradient(135deg, ${COLORS.gradient1}, ${COLORS.gradient3});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            color: #64748b;
            font-size: 1rem;
        }
        
        .links {
            display: grid;
            gap: 16px;
            margin-bottom: 40px;
        }
        
        .link-item {
            display: flex;
            align-items: center;
            padding: 16px 20px;
            background: white;
            border-radius: 12px;
            text-decoration: none;
            color: ${COLORS.black};
            border: 2px solid ${COLORS.gray};
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .link-item:hover {
            border-color: ${COLORS.gradient1};
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(251, 106, 88, 0.15);
        }
        
        .link-icon {
            width: 24px;
            height: 24px;
            margin-right: 16px;
            flex-shrink: 0;
        }
        
        .link-icon svg {
            width: 100%;
            height: 100%;
            fill: ${COLORS.gradient1};
        }
        
        .link-name {
            font-weight: 500;
            flex-grow: 1;
            text-align: left;
        }
        
        .qr-section {
            margin: 40px 0;
            padding: 24px;
            background: white;
            border-radius: 16px;
            border: 2px solid ${COLORS.gray};
        }
        
        .qr-toggle {
            background: linear-gradient(135deg, ${COLORS.gradient1}, ${COLORS.gradient3});
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .qr-toggle:hover {
            transform: scale(1.05);
        }
        
        .qr-code {
            margin-top: 20px;
            display: none;
        }
        
        .qr-code img {
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid ${COLORS.gray};
            color: #64748b;
            font-size: 0.875rem;
        }
        
        .footer a {
            color: ${COLORS.gradient1};
            text-decoration: none;
        }
        
        .footer a:hover {
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
            
            .link-item {
                padding: 14px 16px;
            }
        }
        
        /* 蒙德里安装饰 */
        .decoration {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.6;
        }
        
        .decoration::before {
            content: '';
            position: absolute;
            top: 20%;
            left: -50px;
            width: 200px;
            height: 300px;
            background: linear-gradient(45deg, ${COLORS.gradient1}22, ${COLORS.gradient3}22);
            border-radius: 20px;
            transform: rotate(-15deg);
        }
        
        .decoration::after {
            content: '';
            position: absolute;
            bottom: 20%;
            right: -50px;
            width: 250px;
            height: 200px;
            background: linear-gradient(135deg, ${COLORS.gradient3}22, ${COLORS.gradient4}22);
            border-radius: 20px;
            transform: rotate(15deg);
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
        
        <div class="links">
            ${links.map(link => `
                <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="link-item">
                    <div class="link-icon">
                        <img src="${link.icon}" alt="${link.name}" style="width: 100%; height: 100%; object-fit: contain;">
                    </div>
                    <span class="link-name">${link.name}</span>
                </a>
            `).join('')}
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
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'Noto Sans SC', system-ui, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${COLORS.black};
        }
        
        .container {
            max-width: 500px;
            padding: 40px;
            text-align: center;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            border: 2px solid ${COLORS.gray};
        }
        
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 24px;
            border-radius: 16px;
            overflow: hidden;
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
            background: linear-gradient(135deg, ${COLORS.gradient1}, ${COLORS.gradient3});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .message {
            color: #64748b;
            margin-bottom: 32px;
            line-height: 1.6;
        }
        
        .github-link {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, ${COLORS.gradient1}, ${COLORS.gradient3});
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            transition: transform 0.2s ease;
            margin-bottom: 24px;
        }
        
        .github-link:hover {
            transform: translateY(-2px);
        }
        
        .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid ${COLORS.gray};
            color: #64748b;
            font-size: 0.875rem;
        }
        
        .footer a {
            color: ${COLORS.gradient1};
            text-decoration: none;
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
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=60'
    }
  });
}

function generateDebugPage(username, hostname, debugInfo) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>调试页面 - ${username}</title>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'Noto Sans SC', system-ui, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${COLORS.black};
        }
        
        .container {
            max-width: 600px;
            padding: 40px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            border: 2px solid ${COLORS.gray};
        }
        
        .title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 16px;
            color: ${COLORS.gradient1};
        }
        
        .debug-info {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            font-family: monospace;
            white-space: pre-wrap;
            font-size: 14px;
        }
        
        .username {
            font-weight: 600;
            color: ${COLORS.gradient1};
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🐛 调试页面</h1>
        <p>用户名: <span class="username">${username}</span></p>
        <p>域名: <span class="username">${hostname}</span></p>
        
        <div class="debug-info">调试信息: ${debugInfo}</div>
        
        <p>如果看到这个页面，说明配置解析出现了问题。</p>
    </div>
</body>
</html>`;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8'
    }
  });
}

function generateErrorPage(username, hostname) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>页面暂时不可用 - MoFA Developer</title>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'Noto Sans SC', system-ui, sans-serif;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${COLORS.black};
        }
        
        .container {
            max-width: 500px;
            padding: 40px;
            text-align: center;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            border: 2px solid ${COLORS.gray};
        }
        
        .error-icon {
            font-size: 4rem;
            margin-bottom: 24px;
        }
        
        .title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 16px;
            color: ${COLORS.gradient1};
        }
        
        .message {
            color: #64748b;
            margin-bottom: 32px;
            line-height: 1.6;
        }
        
        .home-link {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, ${COLORS.gradient1}, ${COLORS.gradient3});
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
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
    </div>
</body>
</html>`;
  
  return new Response(html, {
    status: 500,
    headers: {
      'Content-Type': 'text/html;charset=UTF-8'
    }
  });
}