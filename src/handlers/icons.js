import { CONFIG } from '../utils/config.js';

// 图标处理函数 - 从GitHub raw获取图标文件
export async function handleIconRequest(pathname) {
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