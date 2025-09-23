import { CONFIG } from '../utils/config.js';
import { getDeveloperConfig, parseConfigFile } from '../utils/parsers.js';
import { fetchUserAchievements } from '../services/achievements.js';
import { fetchGithubStats } from '../services/github.js';
import { generateHTML, generateDefaultPage, generateErrorPage } from './pages.js';

// 主请求处理器
export async function handleRequest(request) {
  const url = new URL(request.url);
  const hostname = url.hostname;

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
      // 显示默认页面
      return generateDefaultPage(username, hostname);
    }

    // 获取并解析配置文件
    const links = await parseConfigFile(configUrl);

    if (links.length === 0) {
      // 显示默认页面
      return generateDefaultPage(username, hostname);
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
    // 显示错误页面
    return generateErrorPage(username, hostname);
  }
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