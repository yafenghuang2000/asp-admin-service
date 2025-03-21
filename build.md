# 打包部署

## 本地环境

### 构建镜像

NODE_ENV=development SERVICE_PORT=9998 docker-compose build

### 启动

NODE_ENV=development SERVICE_PORT=9998 docker-compose up

## 测试环境

### 构建镜像

NODE_ENV=test SERVICE_PORT=9090 docker-compose build

### 启动

NODE_ENV=test SERVICE_PORT=9090 docker-compose up

## 预发环境

### 构建镜像

NODE_ENV=staging SERVICE_PORT=9090 docker-compose build

### 启动

NODE_ENV=staging SERVICE_PORT=9090 docker-compose up

## 生产环境

### 构建镜像

NODE_ENV=production SERVICE_PORT=9000 docker-compose build

### 启动

NODE_ENV=production SERVICE_PORT=9000 docker-compose up
