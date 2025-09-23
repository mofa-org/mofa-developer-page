import { COLORS } from '../utils/config.js';

// 成就展示区域样式
export const achievementStyles = `
/* 成就展示区域样式 */
.achievements-section {
    margin: 40px auto;
    max-width: 800px;
    padding: 0 20px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 24px;
}

.achievement-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    padding: 24px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
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
    font-size: 28px;
}

.achievement-header h3 {
    font-size: 1.2rem;
    font-weight: 600;
    color: ${COLORS["mondrian-black"]};
    margin: 0;
}

/* GitHub统计样式 */
.github-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 16px;
}

.stat-item {
    text-align: center;
    padding: 12px;
    background: linear-gradient(135deg, ${COLORS["macaron-sky"]}, ${COLORS["mondrian-blue"]});
    border-radius: 12px;
    color: white;
}

.stat-number {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 0.8rem;
    opacity: 0.9;
}

.github-bio {
    font-style: italic;
    color: #666;
    margin: 0;
    padding: 12px;
    background: ${COLORS["mondrian-gray"]};
    border-radius: 8px;
}

/* 贡献样式 */
.contributions-list {
    space-y: 16px;
}

.contribution-item {
    padding: 16px;
    background: linear-gradient(135deg, ${COLORS["macaron-mint"]}, ${COLORS["macaron-sage"]});
    border-radius: 12px;
    margin-bottom: 12px;
    color: white;
}

.contribution-item h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 8px 0;
}

.role-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
}

.contribution-item p {
    margin: 8px 0 0 0;
    opacity: 0.9;
    font-size: 0.9rem;
}

/* 黑客松获奖样式 */
.hackathons-list {
    space-y: 16px;
}

.hackathon-item {
    padding: 16px;
    background: linear-gradient(135deg, ${COLORS["macaron-peach"]}, ${COLORS["mofa-gradient-1"]});
    border-radius: 12px;
    margin-bottom: 12px;
    color: white;
    position: relative;
}

.award-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 8px;
    display: inline-block;
}

.hackathon-item h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 8px 0;
}

.project-name {
    font-style: italic;
    opacity: 0.9;
    display: block;
    margin: 4px 0 8px 0;
}

.date {
    font-size: 0.8rem;
    opacity: 0.8;
    position: absolute;
    top: 16px;
    right: 16px;
}

/* 响应式成就区域 */
@media (max-width: 640px) {
    .achievements-section {
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 0 16px;
    }

    .achievement-card {
        padding: 20px;
    }

    .github-stats-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
    }

    .stat-number {
        font-size: 1.2rem;
    }
}`;