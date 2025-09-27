#!/bin/bash

# MoFA Developer Pages 部署脚本
# 使用方法: ./deploy.sh [环境] [操作]
# 环境: dev|prod
# 操作: start|stop|restart|logs|status

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
            
            if command -v docker &> /dev/null; then
                log "使用 Docker 部署..."
                docker-compose up -d
                log "等待服务启动..."
                sleep 10
                
                # 健康检查
                if curl -f http://localhost:3000/health > /dev/null 2>&1; then
                    log "服务启动成功！"
                else
                    error "服务启动失败，请检查日志"
                fi
            elif command -v pm2 &> /dev/null; then
                log "使用 PM2 部署..."
                pm2 start ecosystem.config.js --env production
            else
                warn "建议安装 Docker 或 PM2 用于生产环境部署"
                NODE_ENV=production PORT=3000 node server.js
            fi
            ;;
        "stop")
            log "停止生产环境..."
            if command -v docker &> /dev/null && [ -f docker-compose.yml ]; then
                docker-compose down
            elif command -v pm2 &> /dev/null; then
                pm2 stop mofa-developer-page
            else
                pkill -f "node server.js" || true
            fi
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
    echo "  dev   - 开发环境"
    echo "  prod  - 生产环境"
    echo
    echo "操作:"
    echo "  start   - 启动服务"
    echo "  stop    - 停止服务"
    echo "  restart - 重启服务"
    echo "  logs    - 查看日志"
    echo "  status  - 查看状态"
    echo "  update  - 更新服务（仅生产环境）"
    echo
    echo "示例:"
    echo "  $0 dev start     # 启动开发环境"
    echo "  $0 prod restart  # 重启生产环境"
    echo "  $0 prod logs     # 查看生产环境日志"
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
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            error "未知环境: $ENV。使用 '$0 help' 查看帮助。"
            ;;
    esac
}

main