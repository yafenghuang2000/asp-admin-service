# 使用Node.js官方镜像作为基础镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 设置构建参数
ARG NODE_ENV=development

# 复制package.json和pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install

# 复制源代码
COPY . .

# 根据环境构建应用
RUN if [ "$NODE_ENV" = "development" ]; then \
        pnpm run build; \
    elif [ "$NODE_ENV" = "test" ]; then \
        pnpm run build; \
    elif [ "$NODE_ENV" = "staging" ]; then \
        pnpm run build; \
    else \
        pnpm run build; \
    fi

# 暴露端口
EXPOSE 8888 9000 9001 9999 