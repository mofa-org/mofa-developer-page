import { COLORS } from '../utils/config.js';

// 流体网格组件样式
export const fluidGridStyles = `
/* 流体网格布局系统 - Pinterest瀑布流风格 */
.fluid-container {
    column-count: 3;
    column-gap: 20px;
    margin-bottom: 40px;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    padding: 0 20px;
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

/* 响应式流体布局 */
@media (max-width: 640px) {
    .fluid-container {
        column-count: 2;
        column-gap: 16px;
        padding: 0 16px;
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
        padding: 0 12px;
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

/* 流体容器优化 */
.fluid-container::after {
    content: '';
    display: block;
    height: 0;
    clear: both;
}`;

// QR码和按钮样式
export const interactiveStyles = `
/* 二维码区域 */
.qr-section {
    margin: 40px 0;
    padding: 24px;
    background: white;
    border-radius: 8px;
    border: 2px solid ${COLORS["mondrian-black"]};
    box-shadow: 0 2px 0 ${COLORS["mondrian-black"]};
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

/* Footer */
.footer {
    margin-top: 40px;
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
}`;