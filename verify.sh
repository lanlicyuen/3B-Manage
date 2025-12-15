#!/bin/bash

echo "🔍 验证项目结构..."
echo ""

# 验证后端文件
echo "📦 后端文件检查:"
files=(
  "server/package.json"
  "server/server.js"
  "server/db.js"
  "server/schema.sql"
  "server/routes/members.js"
  "server/routes/events.js"
  "server/routes/reports.js"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - 缺失！"
  fi
done

echo ""

# 验证前端文件
echo "🎨 前端文件检查:"
files=(
  "client/package.json"
  "client/vite.config.js"
  "client/index.html"
  "client/src/main.js"
  "client/src/App.vue"
  "client/src/router.js"
  "client/src/api.js"
  "client/src/components/MatrixCell.vue"
  "client/src/views/MatrixView.vue"
  "client/src/views/MembersView.vue"
  "client/src/views/EventCreate.vue"
  "client/src/views/EventDetail.vue"
  "client/src/views/ReportView.vue"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file - 缺失！"
  fi
done

echo ""

# 验证配置
echo "⚙️  配置检查:"

# 检查后端端口
if grep -q "20002" server/server.js; then
  echo "  ✅ 后端端口: 20002"
else
  echo "  ⚠️  后端端口配置可能不正确"
fi

# 检查前端端口
if grep -q "20001" client/vite.config.js; then
  echo "  ✅ 前端端口: 20001"
else
  echo "  ⚠️  前端端口配置可能不正确"
fi

# 检查proxy
if grep -q "20002" client/vite.config.js; then
  echo "  ✅ API代理配置正确"
else
  echo "  ⚠️  API代理配置可能不正确"
fi

# 检查API路径
if grep -q "const API_BASE = '/api'" client/src/api.js; then
  echo "  ✅ API使用相对路径"
else
  echo "  ⚠️  API路径配置可能不正确"
fi

echo ""
echo "📋 文档检查:"
docs=(
  "README.md"
  "CHANGELOG_V2.md"
  "PROJECT_STRUCTURE.md"
  "start.sh"
)

for doc in "${docs[@]}"; do
  if [ -f "$doc" ]; then
    echo "  ✅ $doc"
  else
    echo "  ❌ $doc - 缺失！"
  fi
done

echo ""
echo "================================"
echo "  验证完成！"
echo "================================"
echo ""
echo "📚 下一步操作:"
echo "  1. 启动系统: ./start.sh"
echo "  2. 或手动启动:"
echo "     终端1: cd server && npm install && npm start"
echo "     终端2: cd client && npm install && npm run dev"
echo ""
echo "  3. 浏览器访问: http://localhost:20001"
echo "================================"
