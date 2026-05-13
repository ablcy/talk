#!/bin/bash
# TELL 视频通话 - 阿里云 TURN 服务器一键部署脚本
# 运行方式：复制此脚本到阿里云服务器上执行

set -e

echo "=============================================="
echo "     TELL 视频通话 - TURN 服务器部署"
echo "=============================================="
echo ""

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 root 用户运行此脚本"
    echo "   运行: sudo su -"
    exit 1
fi

echo "✅ 权限验证通过"
echo ""

# 获取服务器公网 IP
PUBLIC_IP=$(curl -s ifconfig.me)
echo "📍 服务器公网 IP: $PUBLIC_IP"
echo ""

# 检查 Docker 是否已安装
if command -v docker &> /dev/null; then
    echo "✅ Docker 已安装: $(docker --version)"
    echo ""
else
    echo "📦 正在安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker 安装完成: $(docker --version)"
    echo ""
fi

# 检查 Docker 是否运行
if ! docker info &> /dev/null; then
    echo "❌ Docker 未正常运行，正在启动..."
    systemctl start docker
    systemctl enable docker
    sleep 2
    echo "✅ Docker 已启动"
    echo ""
fi

# 创建 TURN 服务器配置目录
mkdir -p /opt/coturn
cd /opt/coturn

# 创建 docker-compose.yml
echo "📝 创建 TURN 服务器配置..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  coturn:
    image: coturn/coturn:latest
    container_name: coturn-tell
    network_mode: host
    restart: unless-stopped
    command: >
      -n
      --listening-port=3478
      --tls-listening-port=5349
      --external-ip=${PUBLIC_IP}
      --realm=turn.tell.chat
      --user=telluser:tellpass2024
      --min-port=49152
      --max-port=65535
      --verbose
      --log-file=/var/log/coturn.log
    volumes:
      - ./logs:/var/log
    environment:
      - TZ=Asia/Shanghai

EOF

# 替换为实际公网 IP
sed -i "s/\${PUBLIC_IP}/${PUBLIC_IP}/g" docker-compose.yml

# 创建日志目录
mkdir -p /opt/coturn/logs

# 拉取镜像并启动
echo "🚀 正在启动 TURN 服务器..."
docker-compose up -d

# 等待容器启动
sleep 3

# 检查容器状态
if docker ps | grep -q coturn-tell; then
    echo ""
    echo "✅=============================================="
    echo "     TURN 服务器部署成功！"
    echo "✅=============================================="
    echo ""
    echo "📋 服务器信息:"
    echo "   - TURN URL: turn:${PUBLIC_IP}:3478"
    echo "   - TLS URL: turns:${PUBLIC_IP}:5349"
    echo "   - 用户名: telluser"
    echo "   - 密码: tellpass2024"
    echo ""
    echo "📝 查看日志: docker logs coturn-tell"
    echo "🛑 停止服务: docker-compose -f /opt/coturn/docker-compose.yml down"
    echo ""
    echo "⚠️  请在阿里云安全组中开放以下端口:"
    echo "   - TCP/UDP 3478 (TURN 服务)"
    echo "   - TCP/UDP 5349 (TURN TLS)"
    echo "   - UDP 49152-65535 (媒体端口)"
    echo ""
else
    echo "❌ TURN 服务器启动失败，请检查日志:"
    docker logs coturn-tell
fi