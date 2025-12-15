#!/bin/bash
echo "===== 权限控制测试 ====="
echo ""
echo "1. 测试未授权访问（应返回401/403）"
curl -s -o /dev/null -w "  创建事件: %{http_code}\n" -X POST http://127.0.0.1:20002/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake_token" \
  -d '{"date":"2025-12-15","title":"测试"}'

echo ""
echo "2. 测试公开接口（应返回200）"
curl -s -o /dev/null -w "  获取事件列表: %{http_code}\n" http://127.0.0.1:20002/api/events
curl -s -o /dev/null -w "  获取成员列表: %{http_code}\n" http://127.0.0.1:20002/api/members

echo ""
echo "3. 测试已授权访问（应返回200或执行成功）"
curl -s -o /dev/null -w "  带Token创建事件: %{http_code}\n" -X POST http://127.0.0.1:20002/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake_token" \
  -H "X-Admin-Token: aA12345aA" \
  -d '{"date":"2025-12-16","title":"权限测试事件","task":"测试","remark":"自动化测试","memberIds":[1,2]}'

echo ""
echo "✅ 测试完成"
