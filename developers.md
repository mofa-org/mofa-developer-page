# Developer Configuration Mapping

This file maps subdomain usernames to their configuration file URLs.

Format: `[username][config-file-url]`

## Active Developers

[liyao][https://raw.githubusercontent.com/mofa-org/mofa-developer-page/refs/heads/main/username-mofa-links/liyao-mofa-links.md]

## How to Add Yourself

1. Create your config file in YAML format following the example below
2. Add a line above in the format: `[your-username][url-to-your-config-file]`
3. Submit a pull request
4. Your page will be available at `your-username.mofa.ai`

## Configuration File Format

Use YAML format with full icon URLs:

```yaml
homepage:
  url: https://your-website.com
  icon: https://cdn.jsdelivr.net/npm/lucide@latest/dist/esm/icons/home.svg

github:
  url: https://github.com/yourusername
  icon: https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/github.svg

linkedin:
  url: https://www.linkedin.com/in/yourprofile/
  icon: https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg
```

## Guidelines

- Username should match your GitHub username for consistency
- Config file can be hosted in your personal repository
- Ensure the raw file URL is publicly accessible
- Use YAML format as shown above
- Include full URLs for icons (recommend using CDN links)
