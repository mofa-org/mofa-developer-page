import { COLORS } from '../utils/config.js';

// 基础样式
export const baseStyles = `
/* 全局重置 - 与MoFA官网一致 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    height: 100%;
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
    line-height: 1.6;
    position: relative;
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
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 20px;
    text-align: center;
}

.header {
    margin-bottom: 40px;
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

/* 小装饰分隔线 */
.mini-divider {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin: 32px 0;
}

.mini-line {
    width: 20px;
    height: 3px;
    border-radius: 2px;
}

.red-line {
    background: ${COLORS["mondrian-red"]};
}

.blue-line {
    background: ${COLORS["mondrian-blue"]};
}

.yellow-line {
    background: ${COLORS["mondrian-yellow"]};
}`;

// 蒙德里安几何装饰
export const decorationStyles = `
.decoration {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: -1;
    overflow: hidden;
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
    bottom: 15%;
    right: -80px;
    width: 150px;
    height: 250px;
    background: linear-gradient(135deg, ${COLORS["macaron-sky"]}44, ${COLORS["macaron-lavender"]}44);
    border-radius: 15px;
    transform: rotate(25deg);
    animation: mondrian-geometric-float 12s ease-in-out infinite reverse;
}

@keyframes mondrian-geometric-float {
    0%, 100% {
        transform: translateY(0px) rotate(-15deg);
    }
    50% {
        transform: translateY(-20px) rotate(-10deg);
    }
}

/* Mondrian网格背景 - 微妙版本 */
.mondrian-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -3;
    opacity: 0.03;
    background: linear-gradient(135deg,
        rgba(248, 250, 252, 0.5) 0%,
        rgba(226, 232, 240, 0.5) 100%);
}`;