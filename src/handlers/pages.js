import { COLORS } from '../utils/config.js';
import { assignFluidLayouts } from '../utils/layouts.js';
import { generateAchievementsSection } from '../services/achievements.js';
import { baseStyles, decorationStyles } from '../styles/base.js';
import { fluidGridStyles, interactiveStyles } from '../styles/components.js';
import { achievementStyles } from '../styles/achievements.js';

// 生成主HTML页面
export async function generateHTML(username, links, hostname, achievements = null, githubStats = null) {
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
        ${baseStyles}
        ${decorationStyles}
        ${fluidGridStyles}
        ${achievementStyles}
        ${interactiveStyles}
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

        ${achievements ? generateAchievementsSection(achievements, githubStats) : ''}

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

// 生成默认页面（当用户没有配置文件时）
export function generateDefaultPage(username, hostname) {
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
        ${baseStyles}

        .container {
            max-width: 500px;
            padding: 40px;
            text-align: center;
            background: white;
            border-radius: 8px;
            border: 2px solid ${COLORS["mondrian-black"]};
            box-shadow: 0 4px 0 ${COLORS["mondrian-black"]};
        }

        .message {
            color: #64748b;
            margin-bottom: 32px;
            line-height: 1.6;
        }

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

        .setup-info {
            background: ${COLORS["mondrian-gray"]};
            padding: 20px;
            border-radius: 8px;
            margin-top: 24px;
            text-align: left;
        }

        .setup-info h3 {
            margin-bottom: 12px;
            color: ${COLORS["mondrian-black"]};
        }

        .setup-info ol {
            padding-left: 20px;
            color: #64748b;
        }

        .setup-info li {
            margin-bottom: 8px;
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
            欢迎来到 ${username} 的个人页面！<br>
            这个页面还没有配置个人链接。
        </p>
        <a href="${githubUrl}" target="_blank" rel="noopener noreferrer" class="github-link">
            访问 GitHub 页面
        </a>

        <div class="setup-info">
            <h3>如何设置个人页面？</h3>
            <ol>
                <li>创建 YAML 配置文件</li>
                <li>在 <code>developers.md</code> 中添加配置</li>
                <li>提交 Pull Request</li>
                <li>等待审核后页面生效</li>
            </ol>
        </div>

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

// 生成错误页面
export function generateErrorPage(username, hostname) {
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
        ${baseStyles}

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