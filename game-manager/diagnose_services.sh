#!/bin/bash

echo "================================="
echo "🔍 3B-Manage 服务诊断工具"
echo "================================="
echo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. 检查进程
echo -e "${BLUE}【1】检查服务进程${NC}"
echo "-----------------------------------"

FRONTEND_PID=$(pgrep -f "vite" | head -1)
BACKEND_PID=$(pgrep -f "node server.js" | head -1)

if [ -n "$FRONTEND_PID" ]; then
    echo -e "${GREEN}✓ 前端服务运行中 (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}✗ 前端服务未运行${NC}"
    echo "  启动命令: cd ~/Html-Project/3b-manage/game-manager/client && npm run dev"
fi

if [ -n "$BACKEND_PID" ]; then
    echo -e "${GREEN}✓ 后端服务运行中 (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ 后端服务未运行${NC}"
    echo "  启动命令: cd ~/Html-Project/3b-manage/game-manager/server && nohup node server.js > server.log 2>&1 &"
fi
echo

# 2. 检查端口监听
echo -e "${BLUE}【2】检查端口监听${NC}"
echo "-----------------------------------"

if netstat -tlnp 2>/dev/null | grep -q ":20001" || ss -tlnp 2>/dev/null | grep -q ":20001"; then
    echo -e "${GREEN}✓ 前端端口 20001 监听中${NC}"
else
    echo -e "${RED}✗ 前端端口 20001 未监听${NC}"
fi

if netstat -tlnp 2>/dev/null | grep -q ":20002" || ss -tlnp 2>/dev/null | grep -q ":20002"; then
    echo -e "${GREEN}✓ 后端端口 20002 监听中${NC}"
else
    echo -e "${RED}✗ 后端端口 20002 未监听${NC}"
fi
echo

# 3. 测试本地API
echo -e "${BLUE}【3】测试本地服务${NC}"
echo "-----------------------------------"

# 测试前端
HTTP_CODE=$(timeout 3 curl -s -o /dev/null -w "%{http_code}" http://localhost:20001/ 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ 前端页面正常 (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}✗ 前端页面异常 (HTTP $HTTP_CODE)${NC}"
fi

# 测试后端API - 成员列表
MEMBERS=$(timeout 3 curl -s http://127.0.0.1:20002/api/members 2>/dev/null)
if echo "$MEMBERS" | grep -q "\"id\""; then
    COUNT=$(echo "$MEMBERS" | grep -o "\"id\"" | wc -l)
    echo -e "${GREEN}✓ 后端成员API正常 ($COUNT 条记录)${NC}"
else
    echo -e "${RED}✗ 后端成员API异常${NC}"
    echo "  响应: ${MEMBERS:0:100}"
fi

# 测试后端API - 事件列表
EVENTS=$(timeout 3 curl -s http://127.0.0.1:20002/api/events 2>/dev/null)
if echo "$EVENTS" | grep -q "\"id\""; then
    COUNT=$(echo "$EVENTS" | grep -o "\"id\"" | wc -l)
    echo -e "${GREEN}✓ 后端事件API正常 ($COUNT 条记录)${NC}"
else
    echo -e "${RED}✗ 后端事件API异常${NC}"
    echo "  响应: ${EVENTS:0:100}"
fi
echo

# 4. 测试生产环境
echo -e "${BLUE}【4】测试生产环境 (3b.1plabs.pro)${NC}"
echo "-----------------------------------"

# 测试前端页面
PROD_HTTP=$(timeout 5 curl -sk -o /dev/null -w "%{http_code}" https://3b.1plabs.pro/ 2>/dev/null)
if [ "$PROD_HTTP" = "200" ]; then
    echo -e "${GREEN}✓ 生产前端正常 (HTTP $PROD_HTTP)${NC}"
else
    echo -e "${YELLOW}⚠ 生产前端异常 (HTTP $PROD_HTTP)${NC}"
fi

# 测试API代理
PROD_API=$(timeout 5 curl -sk https://3b.1plabs.pro/api/members 2>/dev/null)
if echo "$PROD_API" | grep -q "\"id\""; then
    echo -e "${GREEN}✓ 生产API代理正常${NC}"
elif echo "$PROD_API" | grep -q "502 Bad Gateway"; then
    echo -e "${RED}✗ 生产API返回 502 Bad Gateway${NC}"
    echo -e "${YELLOW}  → 需要修复 Nginx 配置！${NC}"
    echo "  → 参考文档: NGINX_FIX.md"
elif echo "$PROD_API" | grep -q "504 Gateway Timeout"; then
    echo -e "${RED}✗ 生产API返回 504 Gateway Timeout${NC}"
    echo "  → 后端服务响应超时"
else
    echo -e "${RED}✗ 生产API异常${NC}"
    echo "  响应: ${PROD_API:0:100}"
fi
echo

# 5. 检查数据库
echo -e "${BLUE}【5】检查数据库${NC}"
echo "-----------------------------------"

DB_FILE="~/Html-Project/3b-manage/game-manager/server/game_manager.db"
if [ -f "$DB_FILE" ]; then
    echo -e "${GREEN}✓ 数据库文件存在${NC}"
    
    # 检查表
    MEMBERS_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM members;" 2>/dev/null)
    EVENTS_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM events;" 2>/dev/null)
    
    if [ -n "$MEMBERS_COUNT" ]; then
        echo -e "${GREEN}✓ members 表: $MEMBERS_COUNT 条记录${NC}"
    else
        echo -e "${RED}✗ members 表读取失败${NC}"
    fi
    
    if [ -n "$EVENTS_COUNT" ]; then
        echo -e "${GREEN}✓ events 表: $EVENTS_COUNT 条记录${NC}"
    else
        echo -e "${RED}✗ events 表读取失败${NC}"
    fi
    
    # 检查 sort_order 字段
    if sqlite3 "$DB_FILE" "PRAGMA table_info(event_members);" 2>/dev/null | grep -q "sort_order"; then
        echo -e "${GREEN}✓ event_members.sort_order 字段存在${NC}"
    else
        echo -e "${YELLOW}⚠ event_members.sort_order 字段缺失${NC}"
        echo "  → 运行迁移: node server/migrate_add_sort_order.js"
    fi
else
    echo -e "${RED}✗ 数据库文件不存在${NC}"
fi
echo

# 6. 检查最近日志
echo -e "${BLUE}【6】后端最近日志（最后10行）${NC}"
echo "-----------------------------------"

LOG_FILE="~/Html-Project/3b-manage/game-manager/server/server.log"
if [ -f "$LOG_FILE" ]; then
    tail -10 "$LOG_FILE" 2>/dev/null || echo "无法读取日志"
else
    echo -e "${YELLOW}⚠ 日志文件不存在${NC}"
fi
echo

# 7. 总结
echo "================================="
echo -e "${BLUE}【诊断总结】${NC}"
echo "================================="

if [ -n "$BACKEND_PID" ] && [ -n "$FRONTEND_PID" ] && echo "$PROD_API" | grep -q "\"id\""; then
    echo -e "${GREEN}✅ 所有服务运行正常！${NC}"
    echo ""
    echo "访问地址："
    echo "  - 本地: http://localhost:20001"
    echo "  - 生产: https://3b.1plabs.pro"
elif [ -n "$BACKEND_PID" ] && [ -n "$FRONTEND_PID" ]; then
    echo -e "${YELLOW}⚠️ 本地服务正常，但生产环境有问题${NC}"
    echo ""
    echo "需要修复："
    echo "  1. 检查 Nginx Proxy Manager 配置"
    echo "  2. 确保 /api 路径代理到 127.0.0.1:20002"
    echo "  3. 参考文档: NGINX_FIX.md"
else
    echo -e "${RED}❌ 服务未完全启动${NC}"
    echo ""
    echo "需要启动："
    if [ -z "$BACKEND_PID" ]; then
        echo "  - 后端: cd ~/Html-Project/3b-manage/game-manager/server && nohup node server.js > server.log 2>&1 &"
    fi
    if [ -z "$FRONTEND_PID" ]; then
        echo "  - 前端: cd ~/Html-Project/3b-manage/game-manager/client && npm run dev"
    fi
fi

echo ""
echo "================================="
