#!/bin/bash

# 更新包列表
sudo apt update

# 安装 curl（如果尚未安装）
sudo apt install -y curl

# 下载并安装 NodeSource 的 Node.js 20.x 版本
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证 Node.js 和 npm 是否安装成功
node -v
npm -v

echo "Node.js 20 安装完成！"