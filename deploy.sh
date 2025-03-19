#!/bin/bash

# 设置默认值
IMAGE_NAME=$1
REMOTE_HOST="175.178.50.233"  # 远程服务器地址
REMOTE_PORT=22  # 远程服务器 SSH 端口
MAX_PORT_ATTEMPTS=10  # 最大端口尝试次数

# 检查是否提供了镜像名称
if [ -z "$IMAGE_NAME" ]; then
  echo "错误：未设置镜像名称 (IMAGE_NAME)"
  exit 1
fi

# 从镜像名称中提取环境名称
ENV=$(echo "${IMAGE_NAME}" | awk -F':' '{print $2}' | awk -F'-' '{print $1}')
if [ -z "$ENV" ]; then
  echo "错误：无法从镜像名称中提取环境名称"
  exit 1
fi

# 根据环境设置端口
case $ENV in
  "development")
    PORT=8888
    ;;
  "test")
    PORT=9999
    ;;
  "staging")
    PORT=9001
    ;;
  "production")
    PORT=9000
    ;;
  *)
    echo "错误：未知的环境类型 ${ENV}"
    exit 1
    ;;
esac

# 从终端输入远程服务器的用户名和密码
read -p "请输入远程服务器用户名: " REMOTE_USER
read -p "请输入远程服务器密码: " -s REMOTE_PASSWORD
echo  # 换行，避免密码输入后紧接其他输出

CONTAINER_NAME="asp-xms-service-${ENV}"  # 容器名称根据环境名称动态设置

# 检查远程服务器上容器名称是否被占用
if sshpass -p "${REMOTE_PASSWORD}" ssh -p "${REMOTE_PORT}" "${REMOTE_USER}"@"${REMOTE_HOST}" \
  "docker ps -a --filter 'name=${CONTAINER_NAME}' --format '{{.Names}}' | grep -q '^${CONTAINER_NAME}$'"; then
  echo "容器名称 ${CONTAINER_NAME} 已被占用，删除旧容器..."
  sshpass -p "${REMOTE_PASSWORD}" ssh -p "${REMOTE_PORT}" "${REMOTE_USER}"@"${REMOTE_HOST}" \
    "docker stop ${CONTAINER_NAME} > /dev/null 2>&1 || true"
  sshpass -p "${REMOTE_PASSWORD}" ssh -p "${REMOTE_PORT}" "${REMOTE_USER}"@"${REMOTE_HOST}" \
    "docker rm -f ${CONTAINER_NAME} > /dev/null 2>&1 || {
      echo '删除旧容器失败'
      exit 1
    }"
fi

# 拉取镜像
echo "开始拉取 ${IMAGE_NAME} 镜像..."
docker pull "${IMAGE_NAME}" || {
  echo "镜像拉取失败"
  exit 1
}

# 推送镜像到远程服务器
echo "推送镜像 ${IMAGE_NAME} 到远程服务器 ${REMOTE_HOST}..."
docker save "${IMAGE_NAME}" | sshpass -p "${REMOTE_PASSWORD}" ssh -p "${REMOTE_PORT}" "${REMOTE_USER}"@"${REMOTE_HOST}" "docker load" || {
  echo "镜像推送失败"
  exit 1
}

# 检查远程服务器端口是否被占用
port_attempts=0
while [ ${port_attempts} -lt ${MAX_PORT_ATTEMPTS} ]; do
  if sshpass -p "${REMOTE_PASSWORD}" ssh -p "${REMOTE_PORT}" "${REMOTE_USER}"@"${REMOTE_HOST}" \
    "! netstat -tuln | grep -q ':${PORT} '"; then
    echo "端口 ${PORT} 可用"
    break
  fi
  echo "端口 ${PORT} 已被占用，尝试端口 $((PORT + 1))"
  PORT=$((PORT + 1))
  port_attempts=$((port_attempts + 1))
done

if [ ${port_attempts} -ge ${MAX_PORT_ATTEMPTS} ]; then
  echo "错误：未找到可用端口"
  exit 1
fi

# 在远程服务器上启动容器
echo "在远程服务器 ${REMOTE_HOST} 上启动容器..."
sshpass -p "${REMOTE_PASSWORD}" ssh -p "${REMOTE_PORT}" "${REMOTE_USER}"@"${REMOTE_HOST}" << EOF
  # 启动新容器
  docker run -d \\
    --name ${CONTAINER_NAME} \\
    --restart always \\
    -p ${PORT}:9000 \\
    -e NODE_ENV=${ENV} \\
    -e SERVICE_PORT=9000 \\
    -e NODE_MYSQL_HOST=localhost \\
    -e MYSQL_PORT=3306 \\
    -e MYSQL_USERNAME=root \\
    -e MYSQL_PASSWORD=123456789 \\
    -e MYSQL_DATABASE=my-test \\
    -e REDIS_HOST=localhost \\
    -e REDIS_PORT=6379 \\
    -e REDIS_PASSWORD= \\
    ${IMAGE_NAME} || {
    echo "容器启动失败"
    exit 1
  }

  echo "容器 ${CONTAINER_NAME} 已成功启动"
EOF

# 检查容器是否启动成功
echo "检查容器是否启动成功..."
sleep 5  # 等待容器启动
if sshpass -p "${REMOTE_PASSWORD}" ssh -p "${REMOTE_PORT}" "${REMOTE_USER}"@"${REMOTE_HOST}" \
  "docker ps --filter 'name=${CONTAINER_NAME}' --format '{{.Status}}' | grep -q 'Up'"; then
  echo "容器已成功启动，访问地址：http://${REMOTE_HOST}:${PORT}"
else
  echo "容器启动失败，请查看日志："
  sshpass -p "${REMOTE_PASSWORD}" ssh -p "${REMOTE_PORT}" "${REMOTE_USER}"@"${REMOTE_HOST}" \
    "docker logs ${CONTAINER_NAME}"
  sshpass -p "${REMOTE_PASSWORD}" ssh -p "${REMOTE_PORT}" "${REMOTE_USER}"@"${REMOTE_HOST}" \
    "docker rm -f ${CONTAINER_NAME} > /dev/null 2>&1 || true"
  exit 1
fi 