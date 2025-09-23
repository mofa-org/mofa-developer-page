// 成就数据服务
export async function fetchUserAchievements(username) {
  try {
    const achievementUrl = `https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/achievements/${username}-achievements.md`;
    console.log("🏆 Fetching achievements from:", achievementUrl);
    
    const response = await fetch(achievementUrl);
    if (!response.ok) {
      console.log("📝 No achievements file found for user:", username);
      return null;
    }
    
    const content = await response.text();
    console.log("✅ Achievements loaded successfully");
    return parseAchievements(content);
  } catch (error) {
    console.error("❌ Error fetching achievements:", error);
    return null;
  }
}

// 解析成就Markdown文件
export function parseAchievements(content) {
  const achievements = {
    githubUsername: null,
    enableGithubStats: false,
    contributions: [],
    hackathons: [],
    recognition: [],
    currentProjects: []
  };
  
  const lines = content.split('\n');
  let currentItem = {};
  
  for (let line of lines) {
    line = line.trim();
    
    // GitHub Stats section - 改进解析逻辑
    if (line.includes('GitHub Username:')) {
      const match = line.match(/GitHub Username:\s*(\w+)/);
      if (match) {
        achievements.githubUsername = match[1];
      }
    }
    if (line.includes('Enable GitHub stats display:')) {
      achievements.enableGithubStats = line.toLowerCase().includes('true');
    }
    
    // Repository contributions - 改进匹配规则
    if (line.startsWith('- **') && line.includes('mofa-org/')) {
      const repoMatch = line.match(/\*\*(mofa-org\/[^*]+)\*\*/);
      if (repoMatch) {
        currentItem = { repo: repoMatch[1] };
      }
    }
    if (line.includes('Role:') && currentItem.repo) {
      const roleMatch = line.match(/Role:\s*(.+)/);
      if (roleMatch) {
        currentItem.role = roleMatch[1].trim();
      }
    }
    if (line.includes('Contributions:') && currentItem.repo) {
      const contribMatch = line.match(/Contributions:\s*(.+)/);
      if (contribMatch) {
        currentItem.contributions = contribMatch[1].trim();
        achievements.contributions.push({...currentItem});
        currentItem = {};
      }
    }
    
    // Hackathon awards - 改进解析
    if (line.startsWith('### ') && !line.includes('##')) {
      const eventName = line.replace('### ', '').trim();
      if (eventName.length > 0) {
        currentItem = { event: eventName };
      }
    }
    if (line.includes('**Award**:') && currentItem.event) {
      const awardMatch = line.match(/\*\*Award\*\*:\s*(.+)/);
      if (awardMatch) {
        currentItem.award = awardMatch[1].trim();
      }
    }
    if (line.includes('**Project**:') && currentItem.event) {
      const projectMatch = line.match(/\*\*Project\*\*:\s*(.+)/);
      if (projectMatch) {
        currentItem.project = projectMatch[1].trim();
      }
    }
    if (line.includes('**Date**:') && currentItem.event) {
      const dateMatch = line.match(/\*\*Date\*\*:\s*(.+)/);
      if (dateMatch) {
        currentItem.date = dateMatch[1].trim();
        // 只有当有事件、奖项和项目时才添加
        if (currentItem.event && currentItem.award && currentItem.project) {
          achievements.hackathons.push({...currentItem});
        }
        currentItem = {};
      }
    }
  }
  
  console.log("🏆 Parsed achievements:", achievements);
  return achievements;
}

// 生成成就展示区域
export function generateAchievementsSection(achievements, githubStats) {
  let content = '<div class="achievements-section">';
  
  // GitHub统计卡片
  if (achievements.enableGithubStats && githubStats) {
    content += `
      <div class="achievement-card github-stats">
        <div class="achievement-header">
          <img src="/icons/github.svg" alt="GitHub" class="achievement-icon">
          <h3>GitHub Stats</h3>
        </div>
        <div class="github-stats-grid">
          <div class="stat-item">
            <span class="stat-number">${githubStats.followers}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${githubStats.publicRepos}</span>
            <span class="stat-label">Repositories</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${githubStats.following}</span>
            <span class="stat-label">Following</span>
          </div>
        </div>
        ${githubStats.bio ? `<p class="github-bio">"${githubStats.bio}"</p>` : ''}
      </div>`;
  }
  
  // MoFA贡献卡片
  if (achievements.contributions && achievements.contributions.length > 0) {
    content += `
      <div class="achievement-card contributions">
        <div class="achievement-header">
          <img src="https://mofa.ai/mofa-logo.png" alt="MoFA" class="achievement-icon">
          <h3>MoFA Contributions</h3>
        </div>
        <div class="contributions-list">
          ${achievements.contributions.map(contrib => `
            <div class="contribution-item">
              <h4>${contrib.repo}</h4>
              <span class="role-badge">${contrib.role}</span>
              <p>${contrib.contributions}</p>
            </div>
          `).join('')}
        </div>
      </div>`;
  }
  
  // 黑客松获奖卡片
  if (achievements.hackathons && achievements.hackathons.length > 0) {
    content += `
      <div class="achievement-card hackathons">
        <div class="achievement-header">
          <div class="trophy-icon">🏆</div>
          <h3>Hackathon Awards</h3>
        </div>
        <div class="hackathons-list">
          ${achievements.hackathons.slice(0, 3).map(hackathon => `
            <div class="hackathon-item">
              <div class="award-badge">${hackathon.award}</div>
              <h4>${hackathon.event}</h4>
              <p class="project-name">${hackathon.project}</p>
              <span class="date">${hackathon.date}</span>
            </div>
          `).join('')}
        </div>
      </div>`;
  }
  
  content += '</div>';
  return content;
}