#!/bin/bash
echo "===== 完整权限流程测试 ====="
echo ""

# 1. 先登录获取 admin_token
echo "1. 管理员登录获取Token"
RESPONSE=$(curl -s -X POST http://127.0.0.1:20002/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"aA12345aA"}')
echo "  响应: $RESPONSE"

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"//')
echo "  Token: $TOKEN"
echo ""

# 2. 使用Token + X-Admin-Token创建事件
echo "2. 使用双Token创建事件"
CREATE_RESPONSE=$(curl -s -X POST http://127.0.0.1:20002/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Admin-Token: aA12345aA" \
  -d '{"date":"2025-12-16","title":"权限测试成功","task":"双重验证","remark":"自动化测试","memberIds":[1,2]}')
echo "  响应: $CREATE_RESPONSE"
echo ""

# 3. 测试未授权删除
echo "3. 测试无Token删除（应失败）"
curl -s -o /dev/null -w "  状态码: %{http_code}\n" -X DELETE http://127.0.0.1:20002/api/events/1

echo ""
echo "✅ 测试完成"
