#!/bin/bash
# 设置默认值
ENV=${1:-production}  # 从命令行参数中获取环境变量，默认为 production
DOCKER_USERNAME=${DOCKER_USERNAME:-yafenghuang}
REPO_NAME=${REPO_NAME:-asp-admin-service}
SERVICE_PORT=${SERVICE_PORT:-9000}

# 根据环境设置 SERVICE_PORT
if [ "$ENV" == "test" ]; then
    SERVICE_PORT=9999  # 生产环境端口
elif [ "$ENV" == "staging" ]; then
    SERVICE_PORT=9090  # 预发布环境端口
elif [ "$ENV" == "development" ]; then
    SERVICE_PORT=9998  # 开发环境端口
fi

# shellcheck disable=SC2155
export CURRENT_TIME=$(date +"%Y%m%d%H%M%S")

# 设置镜像名称，拼接环境名称和当前时间
export IMAGE_NAME="${DOCKER_USERNAME}/${REPO_NAME}-${ENV}:${ENV}-${CURRENT_TIME}"

echo "镜像名称: ${IMAGE_NAME}"

# # 登陆 DockerHub 账户和密码
# read -p "请输入 DockerHub 账户: " DOCKER_USER
# read -p "请输入 DockerHub 密码: " DOCKER_PASSWORD
# echo  # 换行

# # 登录 DockerHub
# echo "登录 DockerHub..."
# echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USER" --password-stdin || {
#   echo "DockerHub 登录失败"
#   exit 1
# }

# 登录 DockerHub
echo "5820@Feng" | docker login -u yafenghuang2000@gmail.com --password-stdin || {
  echo "DockerHub 登录失败"
  exit 1
}

# 清理构建缓存
docker builder prune -f

# 构建镜像
echo "开始构建 ${IMAGE_NAME} 镜像..."

NODE_ENV="${ENV}" SERVICE_PORT="${SERVICE_PORT}" IMAGE_NAME="${IMAGE_NAME}" docker-compose build || {
  echo "镜像构建失败"
  exit 1
}

# 推送镜像
echo "开始推送 ${IMAGE_NAME} 镜像..."
docker push "${IMAGE_NAME}" || {
  echo "镜像推送失败"
  exit 1
}

# 验证镜像是否推送到 DockerHub
echo "验证镜像是否推送到 DockerHub..."
docker pull "${IMAGE_NAME}" || {
  echo "镜像未成功推送到 DockerHub"
  exit 1
}

echo "构建并推送 ${IMAGE_NAME} 镜像完成"

# 选择部署方式
echo "请选择部署方式："
echo "1) 本地部署"
echo "2) 服务器部署"
read -p "请输入数字 (1 或 2): " DEPLOY_CHOICE

# 如果用户未输入，则默认选择 1
if [[ -z $DEPLOY_CHOICE ]]; then
  DEPLOY_CHOICE=1
  echo "未选择，默认执行本地部署..."
fi

case $DEPLOY_CHOICE in
  1)
    echo "执行本地部署..."
    ./run.sh "${IMAGE_NAME}"
    ;;
  2)
    echo "执行服务器部署..."
    ./deploy.sh "${IMAGE_NAME}"
    ;;
  *)
    echo "无效的选择，退出脚本"
    exit 1
    ;;
esac