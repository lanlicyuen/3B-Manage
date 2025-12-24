#!/bin/bash
# PM2 进程管理脚本
# 提供：启动、停止、重启、查看状态、查看日志等功能

PROJECT_ROOT="$(dirname "$0")"
cd "$PROJECT_ROOT" || exit 1

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 PM2 是否已安装
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        echo -e "${RED}❌ PM2 未安装${NC}"
        echo "请运行: npm install -g pm2"
        exit 1
    fi
}

# 启动服务
start() {
    echo -e "${GREEN}🚀 使用 PM2 启动前后端服务...${NC}"
    echo ""
    
    # 检查前端是否已构建
    if [ ! -d "client/dist" ]; then
        echo -e "${YELLOW}📦 检测到前端未构建，开始构建...${NC}"
        cd client
        npm run build
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ 前端构建失败${NC}"
            exit 1
        fi
        cd ..
        echo -e "${GREEN}✅ 前端构建完成${NC}"
        echo ""
    fi
    
    # 启动 PM2
    pm2 start ecosystem.config.js
    
    echo ""
    echo -e "${GREEN}✅ 服务启动完成${NC}"
    echo ""
    echo "查看状态: pm2 status"
    echo "查看日志: pm2 logs"
    echo "停止服务: ./pm2-manager.sh stop"
}

# 停止服务
stop() {
    echo -e "${YELLOW}🛑 停止所有服务...${NC}"
    pm2 stop ecosystem.config.js
    echo -e "${GREEN}✅ 服务已停止${NC}"
}

# 重启服务
restart() {
    echo -e "${YELLOW}🔄 重启所有服务...${NC}"
    pm2 restart ecosystem.config.js
    echo -e "${GREEN}✅ 服务已重启${NC}"
}

# 删除服务
delete() {
    echo -e "${YELLOW}🗑️  删除 PM2 进程...${NC}"
    pm2 delete ecosystem.config.js
    echo -e "${GREEN}✅ 进程已删除${NC}"
}

# 查看状态
status() {
    pm2 status
}

# 查看日志
logs() {
    if [ -z "$1" ]; then
        pm2 logs
    else
        pm2 logs "$1"
    fi
}

# 保存并设置开机自启
setup() {
    echo -e "${GREEN}💾 保存 PM2 进程列表...${NC}"
    pm2 save
    
    echo ""
    echo -e "${GREEN}🔧 配置开机自启动...${NC}"
    pm2 startup
    
    echo ""
    echo -e "${YELLOW}注意: 请执行上面输出的命令（通常需要 sudo）${NC}"
}

# 重新构建前端
rebuild() {
    echo -e "${YELLOW}📦 重新构建前端...${NC}"
    cd client
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 构建失败${NC}"
        exit 1
    fi
    cd ..
    echo -e "${GREEN}✅ 构建完成${NC}"
    
    echo ""
    echo -e "${YELLOW}🔄 重启前端服务...${NC}"
    pm2 restart game-frontend
    echo -e "${GREEN}✅ 前端已重启${NC}"
}

# 显示帮助
help() {
    echo "PM2 进程管理脚本"
    echo ""
    echo "用法: ./pm2-manager.sh [命令]"
    echo ""
    echo "命令:"
    echo "  start       启动前后端服务（首次启动会自动构建前端）"
    echo "  stop        停止所有服务"
    echo "  restart     重启所有服务"
    echo "  delete      删除 PM2 进程"
    echo "  status      查看服务状态"
    echo "  logs [名称] 查看日志（可选：game-backend 或 game-frontend）"
    echo "  setup       保存进程列表并配置开机自启"
    echo "  rebuild     重新构建前端并重启"
    echo "  help        显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./pm2-manager.sh start         # 启动服务"
    echo "  ./pm2-manager.sh logs          # 查看所有日志"
    echo "  ./pm2-manager.sh logs game-backend  # 只看后端日志"
    echo "  ./pm2-manager.sh rebuild       # 更新前端代码后重新构建"
}

# 主逻辑
check_pm2

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    delete)
        delete
        ;;
    status)
        status
        ;;
    logs)
        logs "$2"
        ;;
    setup)
        setup
        ;;
    rebuild)
        rebuild
        ;;
    help|--help|-h)
        help
        ;;
    *)
        echo -e "${RED}未知命令: $1${NC}"
        echo ""
        help
        exit 1
        ;;
esac
