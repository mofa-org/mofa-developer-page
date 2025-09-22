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

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const hostname = url.hostname;
  
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
      return generateDefaultPage(username, hostname);
    }
    
    // 获取并解析配置文件
    const links = await parseConfigFile(configUrl);
    
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
    return generateErrorPage(username, hostname);
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
  const cacheKey = `config_mapping_${username}`;
  
  // 尝试从缓存获取
  const cached = await caches.default.match(cacheKey);
  if (cached) {
    const data = await cached.json();
    return data.configUrl;
  }
  
  try {
    // 获取 developers.md 文件
    const response = await fetch(
      `${CONFIG.GITHUB_RAW_BASE}/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/main/${CONFIG.DEVELOPERS_FILE}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch developers mapping');
    }
    
    const content = await response.text();
    const configUrl = parseUsernameMapping(content, username);
    
    // 缓存结果
    const cacheResponse = new Response(JSON.stringify({ configUrl }), {
      headers: { 'Cache-Control': `public, max-age=${CONFIG.CACHE_TTL}` }
    });
    await caches.default.put(cacheKey, cacheResponse);
    
    return configUrl;
    
  } catch (error) {
    console.error('Error fetching developer config:', error);
    return null;
  }
}

function parseUsernameMapping(content, username) {
  // 解析格式: [username][config-url]
  const lines = content.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^\[([^\]]+)\]\[([^\]]+)\]$/);
    if (match && match[1] === username) {
      return match[2];
    }
  }
  
  return null;
}

async function parseConfigFile(configUrl) {
  try {
    const response = await fetch(configUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch config file');
    }
    
    const content = await response.text();
    return parseLinks(content);
    
  } catch (error) {
    console.error('Error parsing config file:', error);
    return [];
  }
}

function parseLinks(content) {
  // 解析格式: [Display Name][URL] [Icon URL]
  const lines = content.split('\n');
  const links = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const match = trimmed.match(/^\[([^\]]+)\]\[([^\]]+)\]\s+\[([^\]]+)\]$/);
    if (match) {
      links.push({
        name: match[1],
        url: match[2],
        icon: match[3]
      });
    }
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