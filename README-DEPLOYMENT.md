# MoFA Developer Pages - Linux 服务器部署指南

本文档说明如何将 MoFA Developer Pages 从 Cloudflare Worker 迁移到 Linux 服务器上运行。

## 🔄 迁移概述

### 主要变化

1. **运行环境**: Cloudflare Worker → Node.js HTTP 服务器
2. **事件处理**: `addEventListener("fetch")` → `http.createServer()`
3. **缓存机制**: `caches.default` → 内存缓存 `SimpleCache`
4. **网络请求**: Worker 的 `fetch()` → Node.js 的 `https/http` 模块

### 新增功能

- ✅ 完整的 HTTP 服务器实现
- ✅ 内存缓存系统
- ✅ 健康检查端点 (`/health`)
- ✅ PM2 进程管理
- ✅ Docker 容器化支持
- ✅ Nginx 反向代理配置
- ✅ 自动化部署脚本

## 📋 系统要求

### 最低要求
- **操作系统**: Linux (Ubuntu 18.04+, CentOS 7+, Debian 9+)
- **Node.js**: 16.0+ (推荐 18.x LTS)
- **内存**: 512MB+
- **磁盘**: 1GB+

### 推荐配置
- **CPU**: 2 核心+
- **内存**: 2GB+
- **Node.js**: 18.x LTS
- **进程管理**: PM2
- **反向代理**: Nginx
- **容器化**: Docker + Docker Compose

## 🚀 部署方式

### 方式一：直接部署（推荐用于开发）

1. **克隆代码**
```bash
git clone https://github.com/mofa-org/mofa-developer-page.git
cd mofa-developer-page
```

2. **安装依赖**
```bash
npm install
```

3. **启动服务**
```bash
# 开发环境
./deploy.sh dev start

# 或直接运行
npm start
```

### 方式二：PM2 部署（推荐用于生产）

1. **安装 PM2**
```bash
npm install -g pm2
```

2. **使用 PM2 启动**
```bash
# 生产环境
./deploy.sh prod start

# 或直接使用 PM2
pm2 start ecosystem.config.js --env production
```

3. **设置开机自启**
```bash
pm2 startup
pm2 save
```

### 方式三：Docker 部署（推荐用于容器化环境）

1. **安装 Docker 和 Docker Compose**
```bash
# Ubuntu
sudo apt update
sudo apt install docker.io docker-compose

# CentOS
sudo yum install docker docker-compose
```

2. **启动服务**
```bash
# 仅启动应用
docker-compose up -d

# 同时启动 Nginx 反向代理
docker-compose --profile nginx up -d

# 包含 Redis 缓存
docker-compose --profile redis up -d

# 包含监控
docker-compose --profile monitor up -d
```

## ⚙️ 配置说明

### 环境变量

```bash
# 基础配置
NODE_ENV=production          # 运行环境: development | production
PORT=3000                   # 监听端口

# 域名配置（在 server.js 中修改 CONFIG 对象）
PRODUCTION_DOMAIN=mofa.ai   # 生产域名
TEST_DOMAIN=liyao.space     # 测试域名
```

### Nginx 配置

1. **复制配置文件**
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/mofa-developer-page
sudo ln -s /etc/nginx/sites-available/mofa-developer-page /etc/nginx/sites-enabled/
```

2. **配置 SSL 证书**
```bash
# 使用 Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d *.mofa.ai -d *.liyao.space
```

3. **重启 Nginx**
```bash
sudo nginx -t  # 检查配置
sudo systemctl restart nginx
```

### PM2 监控

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs mofa-developer-page

# 重启应用
pm2 restart mofa-developer-page

# 监控面板
pm2 monit
```

## 🔧 部署脚本使用

部署脚本 `deploy.sh` 提供了便捷的部署和管理功能：

```bash
# 开发环境
./deploy.sh dev start     # 启动
./deploy.sh dev stop      # 停止
./deploy.sh dev restart   # 重启
./deploy.sh dev logs      # 查看日志
./deploy.sh dev status    # 查看状态

# 生产环境
./deploy.sh prod start    # 启动
./deploy.sh prod stop     # 停止
./deploy.sh prod restart  # 重启
./deploy.sh prod logs     # 查看日志
./deploy.sh prod status   # 查看状态
./deploy.sh prod update   # 更新（包含 git pull 和重新部署）

# 帮助信息
./deploy.sh help
```

## 🌐 域名和 DNS 配置

### 通配符子域名设置

需要配置 DNS 记录以支持通配符子域名：

```
# A 记录
*.mofa.ai      A    your-server-ip
*.liyao.space  A    your-server-ip

# 或 CNAME 记录（如果使用 CDN）
*.mofa.ai      CNAME  your-server.example.com
*.liyao.space  CNAME  your-server.example.com
```

## 📊 监控和日志

### 日志文件位置

```
logs/
├── combined.log     # 应用日志
├── error.log        # 错误日志
├── out.log          # 标准输出日志
└── nginx/           # Nginx 日志（如果使用）
    ├── access.log
    └── error.log
```

### 健康检查

应用提供了健康检查端点：

```bash
# 检查服务状态
curl http://localhost:3000/health

# 响应示例
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 监控指标

可以通过以下方式监控应用：

1. **PM2 监控**: `pm2 monit`
2. **Docker 监控**: `docker stats`
3. **Nginx 状态**: 配置 nginx status 模块
4. **Portainer**: 可选的 Docker 容器管理界面

## 🔒 安全配置

### 防火墙设置

```bash
# UFW (Ubuntu)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### 应用安全

- ✅ 非 root 用户运行
- ✅ 请求方法限制
- ✅ 文件大小限制
- ✅ 安全头设置
- ✅ CSP 策略

## 🐛 故障排除

### 常见问题

1. **端口被占用**
```bash
# 查看端口占用
sudo netstat -tlnp | grep :3000
# 或
sudo ss -tlnp | grep :3000
```

2. **权限问题**
```bash
# 检查文件权限
ls -la server.js
# 确保 deploy.sh 有执行权限
chmod +x deploy.sh
```

3. **内存不足**
```bash
# 查看内存使用
free -h
# 查看应用内存使用
pm2 info mofa-developer-page
```

4. **日志查看**
```bash
# PM2 日志
pm2 logs mofa-developer-page --lines 100

# Docker 日志
docker-compose logs -f mofa-developer-page

# 系统日志
sudo journalctl -u nginx -f
```

### 性能优化

1. **启用 Nginx 缓存**
2. **配置 Redis 缓存**（可选）
3. **启用 Gzip 压缩**
4. **设置适当的 PM2 实例数**
5. **配置 CDN**（推荐）

## 📦 更新和维护

### 更新流程

```bash
# 使用部署脚本更新
./deploy.sh prod update

# 手动更新
git pull origin main
pm2 reload ecosystem.config.js --env production
```

### 备份

```bash
# 备份配置文件
tar -czf backup-$(date +%Y%m%d).tar.gz \
  server.js \
  ecosystem.config.js \
  nginx.conf.example \
  docker-compose.yml

# 备份日志
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
```

## 🆚 Worker vs Server 对比

| 特性 | Cloudflare Worker | Node.js Server |
|------|------------------|----------------|
| 部署复杂度 | 简单 | 中等 |
| 运行成本 | 低（按请求计费） | 固定服务器成本 |
| 扩展性 | 自动扩展 | 需手动配置 |
| 控制权 | 有限 | 完全控制 |
| 缓存 | 边缘缓存 | 本地缓存 |
| 监控 | Worker 分析 | 自定义监控 |
| 自定义域名 | 需付费计划 | 免费 |

## 🔗 相关链接

- [Node.js 官方文档](https://nodejs.org/docs/)
- [PM2 文档](https://pm2.keymetrics.io/docs/)
- [Docker 文档](https://docs.docker.com/)
- [Nginx 文档](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

如有问题，请查看 [GitHub Issues](https://github.com/mofa-org/mofa-developer-page/issues) 或联系开发团队。