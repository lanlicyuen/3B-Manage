#!/bin/bash

# 成员顺序功能验证脚本

echo "================================"
echo "成员顺序功能验证"
echo "================================"
echo

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. 检查数据库结构${NC}"
echo "----------------------------"
sqlite3 server/game_manager.db "PRAGMA table_info(event_members);" | grep sort_order
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ sort_order 字段存在${NC}"
else
    echo -e "${YELLOW}⚠️ sort_order 字段不存在，请运行迁移脚本${NC}"
    echo "   node server/migrate_add_sort_order.js"
fi
echo

echo -e "${BLUE}2. 检查示例数据${NC}"
echo "----------------------------"
echo "事件 1 的成员排序："
sqlite3 server/game_manager.db "SELECT member_id, sort_order FROM event_members WHERE event_id = 1 ORDER BY sort_order LIMIT 5;"
echo

echo -e "${BLUE}3. 检查前端依赖${NC}"
echo "----------------------------"
if grep -q "vuedraggable" client/package.json; then
    echo -e "${GREEN}✅ vuedraggable 已安装${NC}"
    grep "vuedraggable" client/package.json
else
    echo -e "${YELLOW}⚠️ vuedraggable 未安装${NC}"
    echo "   cd client && npm install vuedraggable@next --save"
fi
echo

echo -e "${BLUE}4. 检查后端路由${NC}"
echo "----------------------------"
if grep -q "sort_order" server/routes/events.js; then
    echo -e "${GREEN}✅ 后端路由已支持 sort_order${NC}"
    echo "   查询次数: $(grep -c "sort_order" server/routes/events.js)"
else
    echo -e "${YELLOW}⚠️ 后端路由未更新${NC}"
fi
echo

echo -e "${BLUE}5. 检查前端组件${NC}"
echo "----------------------------"
if grep -q "draggable" client/src/views/EventCreate.vue; then
    echo -e "${GREEN}✅ EventCreate.vue 已更新（支持拖拽）${NC}"
else
    echo -e "${YELLOW}⚠️ EventCreate.vue 未更新${NC}"
fi

if grep -q "draggable" client/src/views/EventDetail.vue; then
    echo -e "${GREEN}✅ EventDetail.vue 已更新（支持拖拽）${NC}"
else
    echo -e "${YELLOW}⚠️ EventDetail.vue 未更新${NC}"
fi
echo

echo -e "${BLUE}6. 服务状态检查${NC}"
echo "----------------------------"
if pgrep -f "node server.js" > /dev/null; then
    echo -e "${GREEN}✅ 后端服务运行中 (端口 20002)${NC}"
else
    echo -e "${YELLOW}⚠️ 后端服务未运行${NC}"
fi

if pgrep -f "vite" > /dev/null; then
    echo -e "${GREEN}✅ 前端服务运行中 (端口 20001)${NC}"
else
    echo -e "${YELLOW}⚠️ 前端服务未运行${NC}"
fi
echo

echo -e "${BLUE}7. API 测试${NC}"
echo "----------------------------"
echo "获取事件 1 的详情（前 3 个成员）："
curl -s http://localhost:20002/api/events/1 | jq '.members[:3] | .[] | {id: .id, name: .name, sort_order: .sort_order}' 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️ 需要安装 jq: sudo apt install jq${NC}"
    echo "原始响应（前200字符）："
    curl -s http://localhost:20002/api/events/1 | head -c 200
fi
echo

echo "================================"
echo -e "${GREEN}验证完成！${NC}"
echo "================================"
echo
echo "访问应用："
echo "  - 本地: http://localhost:20001"
echo "  - 生产: http://3b.1plabs.pro"
echo
echo "测试步骤："
echo "  1. 创建新事件，按特定顺序选择成员"
echo "  2. 拖拽调整成员顺序"
echo "  3. 保存后查看详情页"
echo "  4. 编辑事件，再次拖拽调整"
echo "  5. 导出 TXT，验证顺序正确"
