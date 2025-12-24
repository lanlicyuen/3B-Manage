#!/bin/bash
echo "🔍 Header Logo 更新验证"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1. 文件检查"
[ -f "client/public/brand/logo.png" ] && echo "  ✅ Logo 文件存在" || echo "  ⚠️ Logo 文件缺失"
[ -f "HEADER_LOGO_UPDATE.md" ] && echo "  ✅ 更新文档存在" || echo "  ❌ 更新文档缺失"
echo ""

echo "2. 服务状态"
systemctl is-active --quiet 3b-manage-frontend.service && echo "  ✅ 前端服务运行中" || echo "  ❌ 前端服务未运行"
echo ""

echo "3. HTTP 响应"
curl -s -o /dev/null -w "  页面状态: %{http_code}\n" http://127.0.0.1:20001/
echo ""

echo "4. 代码验证"
grep -q 'header-logo' client/src/App.vue && echo "  ✅ App.vue 包含 header-logo 样式" || echo "  ❌ header-logo 样式缺失"
grep -q '<img src="/brand/logo.png"' client/src/App.vue && echo "  ✅ Logo 标签已添加" || echo "  ❌ Logo 标签缺失"
! grep -q '<h1>' client/src/views/MatrixView.vue | head -1 && echo "  ✅ MatrixView 重复标题已删除" || echo "  ⚠️ MatrixView 可能仍有标题"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 验证完成！"
echo ""
echo "📖 查看详细文档: cat HEADER_LOGO_UPDATE.md"
echo "🌐 访问地址: https://3b.1plabs.pro"
