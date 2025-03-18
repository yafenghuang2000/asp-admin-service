#!/bin/bash

# Redis 配置文件路径
REDIS_CONF="/etc/redis/redis.conf"

# 设置 Redis 密码
REDIS_PASSWORD="123456789"

# 修改 Redis 配置文件
echo "允许远程访问 Redis..."
sudo sed -i 's/^bind 127.0.0.1/# bind 127.0.0.1/' $REDIS_CONF
sudo sed -i 's/^# bind 0.0.0.0/bind 0.0.0.0/' $REDIS_CONF

echo "设置 Redis 密码..."
sudo sed -i "s/^# requirepass .*/requirepass $REDIS_PASSWORD/" $REDIS_CONF

# 重启 Redis 服务
echo "重启 Redis 服务..."
sudo systemctl restart redis-server

# 开放防火墙端口
echo "开放 Redis 端口（6379）..."
sudo ufw allow 6379

# 创建 Redis 用户（如果支持 ACL）
echo "创建 Redis 用户..."
redis-cli -a $REDIS_PASSWORD ACL SETUSER huangyafeng ON >alice_password ~* +@all

echo "Redis 配置完成！"
echo "IP 地址: $(hostname -I | awk '{print $1}')"
echo "端口: 6379"
echo "默认密码: $REDIS_PASSWORD"
echo "用户账号: huangyafeng"
echo "用户密码: 123456789"