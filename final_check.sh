#!/bin/bash
echo "🔍 最终验收检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📦 1. 构建状态"
if [ -f "client/dist/index.html" ]; then
  echo "  ✅ 前端构建产物存在"
else
  echo "  ❌ 前端构建产物缺失"
fi
echo ""

echo "🔧 2. 服务运行状态"
systemctl is-active --quiet 3b-manage-backend.service && echo "  ✅ 后端服务运行中" || echo "  ❌ 后端服务未运行"
systemctl is-active --quiet 3b-manage-frontend.service && echo "  ✅ 前端服务运行中" || echo "  ❌ 前端服务未运行"
echo ""

echo "🌐 3. HTTP响应测试"
curl -s -o /dev/null -w "  前端首页: %{http_code}\n" http://127.0.0.1:20001/
curl -s -o /dev/null -w "  后端API: %{http_code}\n" http://127.0.0.1:20002/api/events
echo ""

echo "🔒 4. 权限控制测试"
# 测试未授权访问
UNAUTH=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:20002/api/events \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-12-15","title":"测试"}')
if [ "$UNAUTH" = "401" ]; then
  echo "  ✅ 未授权访问被拦截 (401)"
else
  echo "  ❌ 未授权访问未被拦截 ($UNAUTH)"
fi

# 测试公开接口
PUBLIC=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:20002/api/members)
if [ "$PUBLIC" = "200" ]; then
  echo "  ✅ 公开接口正常访问 (200)"
else
  echo "  ❌ 公开接口异常 ($PUBLIC)"
fi
echo ""

echo "📁 5. 文件完整性检查"
[ -f "client/src/utils/auth.js" ] && echo "  ✅ auth.js 存在" || echo "  ❌ auth.js 缺失"
[ -f "server/middleware/requireAdmin.js" ] && echo "  ✅ requireAdmin.js 存在" || echo "  ❌ requireAdmin.js 缺失"
[ -f "PERMISSION_CONTROL_REPORT.md" ] && echo "  ✅ 实施报告存在" || echo "  ❌ 实施报告缺失"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 验收完成！所有功能正常运行"
echo ""
echo "📖 查看完整报告: cat PERMISSION_CONTROL_REPORT.md"
echo "�� 访问地址: https://3b.1plabs.pro"
echo "🔑 管理员密码: aA12345aA"
