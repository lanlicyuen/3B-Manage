#!/bin/bash

echo "================================"
echo "  游戏成员管理系统 - 启动脚本"
echo "================================"
echo ""

# 检查是否在正确的目录
if [ ! -d "server" ] || [ ! -d "client" ]; then
    echo "❌ 错误: 请在 game-manager 目录下运行此脚本"
    exit 1
fi

# 启动后端
echo "🚀 启动后端服务 (端口 20002)..."
cd server

if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装后端依赖..."
    npm install
fi

npm start &
SERVER_PID=$!
echo "✅ 后端已启动 (PID: $SERVER_PID)"
cd ..

# 等待后端启动
echo "⏳ 等待后端服务就绪..."
sleep 3

# 启动前端
echo "🚀 启动前端应用 (端口 20001)..."
cd client

if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装前端依赖..."
    npm install
fi

npm run dev &
CLIENT_PID=$!
echo "✅ 前端已启动 (PID: $CLIENT_PID)"
cd ..

echo ""
echo "================================"
echo "  ✅ 系统已启动！"
echo "================================"
echo "  后端: http://localhost:20002"
echo "  前端: http://localhost:20001"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo "================================"

# 等待用户中断
wait
