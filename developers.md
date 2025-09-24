# Developer Configuration Mapping

This file maps subdomain usernames to their configuration file URLs.

Format: `[username][config-file-url]`

## Active Developers

[example][https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/username-mofa-links/example-mofa-links.md]
[bh3gei][https://raw.githubusercontent.com/mofa-org/mofa-developer-page/main/username-mofa-links/bh3gei-mofa-links.md]

## How to Add Yourself

1. Create your config file in YAML format following the example below
2. Add a line above in the format: `[your-username][url-to-your-config-file]`
3. Submit a pull request
4. Your page will be available at `your-username.mofa.ai`

## Configuration File Format

Use YAML format with smart icon selection:

```yaml
homepage:
  url: https://your-website.com
  icon: home                    # 使用内置图标名

github:
  url: https://github.com/yourusername
  icon:                         # 留空自动识别GitHub图标

linkedin:
  url: https://www.linkedin.com/in/yourprofile/
  icon:                         # 留空自动识别LinkedIn图标

custom:
  url: https://example.com
  icon: https://example.com/icon.svg  # 使用完整URL
```

### 图标使用方式

1. **留空自动识别**：根据URL域名自动选择合适图标
2. **使用图标名**：如 `github`、`home`、`mail` 等
3. **完整URL**：使用自定义图标的完整链接

## Guidelines

- Username should match your GitHub username for consistency
- Config file can be hosted in your personal repository
- Ensure the raw file URL is publicly accessible
- Use YAML format as shown above
- Icon can be left empty for auto-detection, use built-in names, or custom URLs

## Available Built-in Icons

Popular platforms: `github`, `linkedin`, `x`, `telegram`, `discord`, `youtube`, `spotify`, `instagram`, `facebook`, `tiktok`, `reddit`, `medium`, `notion`

Chinese platforms: `wechat`, `weibo`, `bilibili`, `xiaohongshu`, `zhihu`, `qq`, `dingtalk`

Communication: `line`, `whatsapp`, `skype`, `signal`, `slack`, `zoom`, `teams`, `feishu`

Music & Media: `spotify`, `youtube`, `soundcloud`, `applemusic`, `netease`, `twitch`

General: `home`, `mail`, `music`, `message-square`

Payment: `paypal`, `patreon`, `kofi`

See `/resources/icons/` for the complete list.
