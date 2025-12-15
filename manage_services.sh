#!/bin/bash
# 3B-Manage 服务管理脚本

case "$1" in
  start)
    sudo systemctl start 3b-manage-backend.service
    sudo systemctl start 3b-manage-frontend.service
    echo "✅ 服务已启动"
    ;;
  stop)
    sudo systemctl stop 3b-manage-frontend.service
    sudo systemctl stop 3b-manage-backend.service
    echo "✅ 服务已停止"
    ;;
  restart)
    sudo systemctl restart 3b-manage-backend.service
    sudo systemctl restart 3b-manage-frontend.service
    echo "✅ 服务已重启"
    ;;
  status)
    echo "=== 后端服务 ==="
    sudo systemctl status 3b-manage-backend.service --no-pager -l | head -12
    echo ""
    echo "=== 前端服务 ==="
    sudo systemctl status 3b-manage-frontend.service --no-pager -l | head -12
    ;;
  logs)
    if [ "$2" = "backend" ]; then
      sudo journalctl -u 3b-manage-backend.service -f
    elif [ "$2" = "frontend" ]; then
      sudo journalctl -u 3b-manage-frontend.service -f
    else
      echo "用法: $0 logs [backend|frontend]"
    fi
    ;;
  *)
    echo "用法: $0 {start|stop|restart|status|logs}"
    echo ""
    echo "命令说明:"
    echo "  start    - 启动服务"
    echo "  stop     - 停止服务"
    echo "  restart  - 重启服务"
    echo "  status   - 查看服务状态"
    echo "  logs     - 查看日志 (logs backend 或 logs frontend)"
    exit 1
    ;;
esac
