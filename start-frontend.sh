#!/bin/bash
# 生产环境启动脚本 - 前端服务（Preview 模式）

cd "$(dirname "$0")/client" || exit 1

echo "📦 构建前端生产版本..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo ""
echo "🚀 启动预览服务 (端口 20001, 监听 0.0.0.0)..."
echo "通过 NPM 反向代理访问: 3b.1plabs.pro"
echo "按 Ctrl+C 停止服务"
echo ""

# 检查端口是否被占用
if lsof -Pi :20001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  警告: 端口 20001 已被占用"
    echo "使用以下命令查看进程:"
    echo "  lsof -i :20001"
    echo ""
    read -p "是否强制终止占用进程? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "正在终止占用进程..."
        lsof -ti:20001 | xargs kill -9 2>/dev/null
        sleep 2
    else
        echo "已取消启动"
        exit 1
    fi
fi

# 启动预览服务
npm run preview
