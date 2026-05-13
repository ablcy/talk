@echo off
chcp 65001 >nul
echo ==============================================
echo           启动本地 TURN 服务器
echo ==============================================
echo.
echo 正在检查 Docker 是否已启动...

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未启动，请先启动 Docker Desktop
    echo.
    echo 请从开始菜单启动 Docker Desktop，然后重新运行此脚本
    pause
    exit /b 1
)

echo ✅ Docker 已启动
echo.
echo 正在启动 TURN 服务器...
echo.

docker-compose -f docker-compose.local.yml up -d

if %errorlevel% equ 0 (
    echo.
    echo ✅ 本地 TURN 服务器启动成功！
    echo.
    echo 📋 服务器信息：
    echo    - TURN 端口: 3478
    echo    - TLS 端口: 5349
    echo    - 用户名: test
    echo    - 密码: test123
    echo.
    echo 🚀 使用方法：
    echo    1. 本地访问: http://localhost:3000
    echo    2. 启动应用: npm start
    echo.
    echo 📝 查看日志: docker logs coturn-local
    echo 🛑 停止服务: docker-compose -f docker-compose.local.yml down
) else (
    echo ❌ 启动失败，请检查 Docker 配置
    pause
)

echo.
pause