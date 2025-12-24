#!/bin/bash

echo "🔒 权限控制系统 - 完整测试脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

API_BASE="http://127.0.0.1:20002/api"
ADMIN_PASSWORD="12345aBc"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试计数
TOTAL=0
PASSED=0
FAILED=0

# 测试函数
test_api() {
  local name=$1
  local method=$2
  local url=$3
  local expected_code=$4
  local headers=$5
  local data=$6
  
  TOTAL=$((TOTAL + 1))
  
  if [ -z "$headers" ]; then
    if [ -z "$data" ]; then
      ACTUAL=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$url")
    else
      ACTUAL=$(curl -s -o /dev/null -w "%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" "$url")
    fi
  else
    if [ -z "$data" ]; then
      ACTUAL=$(curl -s -o /dev/null -w "%{http_code}" -X $method -H "$headers" "$url")
    else
      ACTUAL=$(curl -s -o /dev/null -w "%{http_code}" -X $method -H "Content-Type: application/json" -H "$headers" -d "$data" "$url")
    fi
  fi
  
  if [ "$ACTUAL" = "$expected_code" ]; then
    echo -e "  ${GREEN}✓${NC} $name: ${ACTUAL}"
    PASSED=$((PASSED + 1))
  else
    echo -e "  ${RED}✗${NC} $name: 预期 ${expected_code}, 实际 ${ACTUAL}"
    FAILED=$((FAILED + 1))
  fi
}

echo "${BLUE}1. 后端API权限测试${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1.1 公开接口（无需权限）
echo ""
echo "1.1 公开接口访问"
test_api "GET /api/events (事件列表)" "GET" "${API_BASE}/events" "200"

# 获取第一个事件ID用于后续测试
FIRST_EVENT_ID=$(curl -s "${API_BASE}/events" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
if [ -z "$FIRST_EVENT_ID" ]; then
  FIRST_EVENT_ID=1
fi

test_api "GET /api/events/${FIRST_EVENT_ID} (事件详情)" "GET" "${API_BASE}/events/${FIRST_EVENT_ID}" "200"
test_api "GET /api/members (成员列表)" "GET" "${API_BASE}/members" "200"

# 1.2 未授权写操作（应该拦截）
echo ""
echo "1.2 未授权写操作（应该 401）"
test_api "POST /api/events (未授权)" "POST" "${API_BASE}/events" "401" "" '{"date":"2025-12-16","title":"测试"}'
test_api "PUT /api/events/${FIRST_EVENT_ID} (未授权)" "PUT" "${API_BASE}/events/${FIRST_EVENT_ID}" "401" "" '{"date":"2025-12-16","title":"测试"}'
test_api "DELETE /api/events/${FIRST_EVENT_ID} (未授权)" "DELETE" "${API_BASE}/events/${FIRST_EVENT_ID}" "401"
test_api "DELETE /api/members/1 (未授权)" "DELETE" "${API_BASE}/members/1" "401"

# 1.3 管理员登录
echo ""
echo "1.3 管理员登录"
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"password\":\"${ADMIN_PASSWORD}\"}" "${API_BASE}/admin/login")
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | sed 's/"token":"\(.*\)"/\1/')

if [ -n "$TOKEN" ]; then
  echo -e "  ${GREEN}✓${NC} 登录成功，获取 Token: ${TOKEN:0:20}..."
  PASSED=$((PASSED + 1))
else
  echo -e "  ${RED}✗${NC} 登录失败"
  FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# 1.4 带Token的写操作（应该成功）
# 注意：后端 requireAdmin 中间件验证的是密码本身，不是返回的 token
echo ""
echo "1.4 授权写操作（应该成功）"

# 创建新事件
NEW_EVENT_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "X-Admin-Token: ${ADMIN_PASSWORD}" -d '{"date":"2025-12-16","title":"测试事件","memberIds":[]}' "${API_BASE}/events")
NEW_EVENT_ID=$(echo $NEW_EVENT_RESPONSE | grep -o '"id":[0-9]*' | cut -d: -f2)

if [ -n "$NEW_EVENT_ID" ]; then
  echo -e "  ${GREEN}✓${NC} POST /api/events (已授权): 201，创建事件 ID=${NEW_EVENT_ID}"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${RED}✗${NC} POST /api/events (已授权): 创建失败"
  FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# 导出刚创建的事件
test_api "POST /api/events/${NEW_EVENT_ID}/export-txt (已授权)" "POST" "${API_BASE}/events/${NEW_EVENT_ID}/export-txt" "200" "X-Admin-Token: ${ADMIN_PASSWORD}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${BLUE}测试结果统计${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "总测试数: ${TOTAL}"
echo -e "${GREEN}通过: ${PASSED}${NC}"
echo -e "${RED}失败: ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ 所有测试通过！${NC}"
  exit 0
else
  echo -e "${RED}❌ 部分测试失败${NC}"
  exit 1
fi
