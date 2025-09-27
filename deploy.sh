#!/bin/bash

# MoFA Developer Pages 部署脚本
# 使用方法: ./deploy.sh [环境] [操作]
# 环境: dev|prod|setup
# 操作: start|stop|restart|logs|status|health|ssl|pm2-setup|kill|node

set -e  # 遇到错误立即退出

# 配置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ENV=${1:-dev}
ACTION=${2:-start}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# 检查依赖
check_dependencies() {
    log "检查依赖..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js 未安装。请安装 Node.js 16+ 版本。"
    fi
    
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        error "Node.js 版本过低，需要 16+ 版本。当前版本: $(node -v)"
    fi
    
    log "Node.js 版本: $(node -v) ✓"
}

# 创建必要的目录
setup_directories() {
    log "创建必要的目录..."
    mkdir -p logs
    mkdir -p ssl
}

# 安装 PM2 并设置开机自启
setup_pm2() {
    log "设置 PM2..."
    
    if ! command -v pm2 &> /dev/null; then
        log "安装 PM2..."
        sudo npm install -g pm2
    else
        log "PM2 已安装: $(pm2 --version)"
    fi
    
    # 设置开机自启
    log "设置 PM2 开机自启..."
    pm2 startup | grep -E "sudo.*systemctl" | sh || true
    
    log "PM2 设置完成 ✓"
}


# 暴力杀掉占用端口的进程
kill_ports() {
    log "暴力清理端口占用..."
    
    # 杀掉 80 端口
    PORT_80_PID=$(sudo lsof -ti:80 2>/dev/null)
    if [ -n "$PORT_80_PID" ]; then
        log "杀掉占用 80 端口的进程: $PORT_80_PID"
        sudo kill -9 $PORT_80_PID || true
    fi
    
    # 杀掉 443 端口
    PORT_443_PID=$(sudo lsof -ti:443 2>/dev/null)
    if [ -n "$PORT_443_PID" ]; then
        log "杀掉占用 443 端口的进程: $PORT_443_PID"
        sudo kill -9 $PORT_443_PID || true
    fi
    
    # 杀掉所有 node 进程
    log "杀掉所有 node 进程..."
    sudo pkill -9 -f "node.*server.js" || true
    
    # 清理 PM2 进程
    if command -v pm2 &> /dev/null; then
        log "清理 PM2 进程..."
        sudo pm2 kill || true
    fi
    
    log "端口清理完成 ✓"
    sleep 2
}

# 设置 SSL 证书自动续期
setup_ssl_renewal() {
    log "设置 SSL 证书自动续期..."
    
    if ! command -v certbot &> /dev/null; then
        log "安装 Certbot..."
        sudo apt update
        sudo apt install -y certbot
    fi
    
    # 测试续期
    log "测试证书续期..."
    if sudo certbot renew --dry-run; then
        log "证书续期测试通过 ✓"
    else
        warn "证书续期测试失败，请检查配置"
    fi
    
    # 添加到定时任务
    log "设置定时任务..."
    (sudo crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 2 * * * /usr/bin/certbot renew --quiet && /usr/bin/systemctl reload nginx") | sudo crontab -
    
    log "SSL 自动续期设置完成 ✓"
}

# 健康检查函数
health_check() {
    log "执行健康检查..."
    
    # 检查 Node.js 应用
    if curl -f -k https://localhost:443/health > /dev/null 2>&1; then
        log "✅ Node.js HTTPS 应用健康"
    elif curl -f http://localhost:80/health > /dev/null 2>&1; then
        log "✅ Node.js HTTP 应用健康"
    else
        error "❌ Node.js 应用不健康"
    fi
    
    
    # 检查 PM2
    if command -v pm2 &> /dev/null; then
        PM2_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="mofa-developer-page") | .pm2_env.status' 2>/dev/null || echo "not_found")
        if [ "$PM2_STATUS" = "online" ]; then
            log "✅ PM2 应用运行中"
        else
            warn "⚠️  PM2 应用状态: $PM2_STATUS"
        fi
    fi
    
    # 检查 SSL 证书
    if [ -f "/etc/letsencrypt/live/mofa.ai/fullchain.pem" ]; then
        EXPIRE_DATE=$(sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/mofa.ai/fullchain.pem | cut -d= -f2)
        EXPIRE_TIMESTAMP=$(date -d "$EXPIRE_DATE" +%s)
        CURRENT_TIMESTAMP=$(date +%s)
        DAYS_LEFT=$(( ($EXPIRE_TIMESTAMP - $CURRENT_TIMESTAMP) / 86400 ))
        
        if [ $DAYS_LEFT -gt 30 ]; then
            log "✅ SSL 证书有效，剩余 $DAYS_LEFT 天"
        elif [ $DAYS_LEFT -gt 7 ]; then
            warn "⚠️  SSL 证书将在 $DAYS_LEFT 天后过期"
        else
            error "❌ SSL 证书即将过期 ($DAYS_LEFT 天)"
        fi
    else
        warn "⚠️  SSL 证书文件不存在"
    fi
    
    # 检查磁盘空间
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -lt 80 ]; then
        log "✅ 磁盘使用率: ${DISK_USAGE}%"
    elif [ $DISK_USAGE -lt 90 ]; then
        warn "⚠️  磁盘使用率较高: ${DISK_USAGE}%"
    else
        error "❌ 磁盘空间不足: ${DISK_USAGE}%"
    fi
    
    # 检查内存使用
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2 }')
    log "ℹ️  内存使用率: ${MEMORY_USAGE}%"
    
    log "健康检查完成"
}

# 系统初始化设置
system_setup() {
    log "执行系统初始化设置..."
    
    # 更新系统
    log "更新系统包..."
    sudo apt update
    sudo apt upgrade -y
    
    # 安装基础工具
    log "安装基础工具..."
    sudo apt install -y curl wget git jq htop ufw
    
    # 设置防火墙
    log "配置防火墙..."
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # 安装 Node.js (如果未安装)
    if ! command -v node &> /dev/null; then
        log "安装 Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # 设置 PM2
    setup_pm2
    
    
    # 设置 SSL 续期
    setup_ssl_renewal
    
    log "系统初始化完成 ✓"
}

# 开发环境部署
deploy_dev() {
    case $ACTION in
        "start")
            log "启动开发环境..."
            check_dependencies
            setup_directories
            
            if command -v pm2 &> /dev/null; then
                log "使用 PM2 启动..."
                pm2 start ecosystem.config.js --env development
            else
                warn "PM2 未安装，使用直接启动..."
                NODE_ENV=development PORT=3000 node server.js
            fi
            ;;
        "stop")
            log "停止开发环境..."
            if command -v pm2 &> /dev/null; then
                pm2 stop mofa-developer-page || true
            else
                pkill -f "node server.js" || true
            fi
            ;;
        "restart")
            log "重启开发环境..."
            $0 dev stop
            sleep 2
            $0 dev start
            ;;
        "logs")
            if command -v pm2 &> /dev/null; then
                pm2 logs mofa-developer-page
            else
                tail -f logs/combined.log || echo "日志文件不存在"
            fi
            ;;
        "status")
            if command -v pm2 &> /dev/null; then
                pm2 status mofa-developer-page
            else
                pgrep -f "node server.js" && echo "服务运行中" || echo "服务未运行"
            fi
            ;;
        *)
            error "未知操作: $ACTION"
            ;;
    esac
}

# 生产环境部署
deploy_prod() {
    case $ACTION in
        "start")
            log "启动生产环境..."
            check_dependencies
            setup_directories
            
            # 启动前先清理端口
            kill_ports
            
            if command -v pm2 &> /dev/null; then
                log "使用 PM2 部署（需要 sudo 权限运行在 80 端口）..."
                sudo pm2 start ecosystem.config.js --env production
                
                # 保存 PM2 配置
                sudo pm2 save
                
                # 健康检查
                sleep 5
                if curl -f -k https://localhost:443/health > /dev/null 2>&1; then
                    log "HTTPS 服务启动成功！"
                elif curl -f http://localhost:80/health > /dev/null 2>&1; then
                    log "HTTP 服务启动成功！"
                else
                    error "服务启动失败，请检查日志"
                fi
            elif command -v docker &> /dev/null; then
                log "使用 Docker 部署..."
                docker-compose up -d
                log "等待服务启动..."
                sleep 10
                
                # 健康检查
                sleep 3
                if curl -f -k https://localhost:443/health > /dev/null 2>&1; then
                    log "HTTPS 服务启动成功！"
                elif curl -f http://localhost:80/health > /dev/null 2>&1; then
                    log "HTTP 服务启动成功！"
                else
                    error "服务启动失败，请检查日志"
                fi
            else
                warn "建议安装 Docker 或 PM2 用于生产环境部署"
                log "使用 sudo 运行在 80 端口..."
                sudo NODE_ENV=production PORT=80 node server.js
            fi
            ;;
        "stop")
            log "停止生产环境..."
            if command -v docker &> /dev/null && [ -f docker-compose.yml ]; then
                docker-compose down
            elif command -v pm2 &> /dev/null; then
                sudo pm2 stop mofa-developer-page || true
                sudo pm2 delete mofa-developer-page || true
            else
                sudo pkill -f "node server.js" || true
            fi
            # 暴力清理端口
            kill_ports
            ;;
        "restart")
            log "重启生产环境..."
            $0 prod stop
            sleep 5
            $0 prod start
            ;;
        "logs")
            if command -v docker &> /dev/null && [ -f docker-compose.yml ]; then
                docker-compose logs -f mofa-developer-page
            elif command -v pm2 &> /dev/null; then
                pm2 logs mofa-developer-page
            else
                tail -f logs/combined.log || echo "日志文件不存在"
            fi
            ;;
        "status")
            if command -v docker &> /dev/null && [ -f docker-compose.yml ]; then
                docker-compose ps
            elif command -v pm2 &> /dev/null; then
                pm2 status mofa-developer-page
            else
                pgrep -f "node server.js" && echo "服务运行中" || echo "服务未运行"
            fi
            ;;
        "update")
            log "更新生产环境..."
            git pull origin main
            if command -v docker &> /dev/null; then
                docker-compose build --no-cache
                docker-compose up -d
            elif command -v pm2 &> /dev/null; then
                pm2 reload ecosystem.config.js --env production
                pm2 save
            fi
            ;;
        "health")
            health_check
            ;;
        "ssl")
            setup_ssl_renewal
            ;;
        "pm2-setup")
            setup_pm2
            ;;
        "kill")
            kill_ports
            ;;
        "node")
            log "使用 Node.js 直接启动..."
            kill_ports
            setup_directories
            log "启动 Node.js 服务（后台运行）..."
            sudo nohup NODE_ENV=production PORT=80 node server.js > logs/server.log 2>&1 &
            sleep 3
            if curl -f -k https://localhost:443/health > /dev/null 2>&1; then
                log "HTTPS 服务启动成功！"
            elif curl -f http://localhost:80/health > /dev/null 2>&1; then
                log "HTTP 服务启动成功！"
            else
                warn "服务可能启动失败，请检查日志"
            fi
            ;;
        *)
            error "未知操作: $ACTION"
            ;;
    esac
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}MoFA Developer Pages 部署脚本${NC}"
    echo
    echo "使用方法: $0 [环境] [操作]"
    echo
    echo "环境:"
    echo "  dev    - 开发环境"
    echo "  prod   - 生产环境"
    echo "  setup  - 系统初始化"
    echo
    echo "操作:"
    echo "  start      - 启动服务"
    echo "  stop       - 停止服务"
    echo "  restart    - 重启服务"
    echo "  logs       - 查看日志"
    echo "  status     - 查看状态"
    echo "  update     - 更新服务（仅生产环境）"
    echo "  health     - 健康检查（全面检查系统状态）"
    echo "  ssl        - 设置 SSL 证书自动续期"
    echo "  pm2-setup  - 安装配置 PM2"
    echo "  kill       - 暴力杀掉占用端口的进程"
    echo "  node       - 使用 Node.js 直接启动"
    echo
    echo "示例:"
    echo "  $0 setup          # 系统初始化（首次部署时运行）"
    echo "  $0 dev start      # 启动开发环境"
    echo "  $0 prod start     # 启动生产环境"
    echo "  $0 prod restart   # 重启生产环境"
    echo "  $0 prod health    # 执行健康检查"
    echo "  $0 prod ssl       # 设置 SSL 自动续期"
    echo "  $0 prod kill      # 暴力杀掉占用端口的进程"
    echo "  $0 prod node      # 使用 Node.js 直接启动"
}

# 主逻辑
main() {
    log "MoFA Developer Pages 部署脚本"
    log "环境: $ENV, 操作: $ACTION"
    
    case $ENV in
        "dev")
            deploy_dev
            ;;
        "prod")
            deploy_prod
            ;;
        "setup")
            if [ "$ACTION" = "start" ]; then
                system_setup
            else
                error "setup 环境只支持 start 操作"
            fi
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            error "未知环境: $ENV。使用 '$0 help' 查看帮助。"
            ;;
    esac
}

main