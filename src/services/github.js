// GitHub API服务
export async function fetchGithubStats(username) {
  if (!username) return null;
  
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      followers: data.followers,
      following: data.following,
      publicRepos: data.public_repos,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      location: data.location,
      company: data.company
    };
  } catch (error) {
    console.error("❌ Error fetching GitHub stats:", error);
    return null;
  }
}