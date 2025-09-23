// 模块化的Cloudflare Worker入口文件
import { handleRequest } from './handlers/request.js';
import { handleIconRequest } from './handlers/icons.js';

// 主事件监听器
addEventListener("fetch", (event) => {
  event.respondWith(handleMainRequest(event.request));
});

// 主请求路由器
async function handleMainRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 处理 favicon.ico 请求
  if (pathname === "/favicon.ico") {
    return Response.redirect("https://mofa.ai/mofa-logo.png", 301);
  }

  // 处理图标请求
  if (pathname.startsWith("/icons/")) {
    return await handleIconRequest(pathname);
  }

  // 处理主要的用户页面请求
  return await handleRequest(request);
}