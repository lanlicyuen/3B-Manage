#!/bin/bash
# 生产环境启动脚本 - 后端服务

cd "$(dirname "$0")/../server" || exit 1

echo "🚀 启动后端服务 (端口 20002, 仅本地监听)..."
echo "按 Ctrl+C 停止服务"
echo ""

# 检查端口是否被占用
if lsof -Pi :20002 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  警告: 端口 20002 已被占用"
    echo "使用以下命令查看进程:"
    echo "  lsof -i :20002"
    echo ""
    read -p "是否强制终止占用进程? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "正在终止占用进程..."
        lsof -ti:20002 | xargs kill -9 2>/dev/null
        sleep 2
    else
        echo "已取消启动"
        exit 1
    fi
fi

# 启动服务
npm start
