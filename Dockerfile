# 使用Node.js官方镜像作为基础镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

RUN npm install -g pm2
# 安装依赖
RUN npm install -g pnpm && pnpm install

# 复制项目文件
COPY . .

# 构建项目
RUN pnpm build

# 暴露端口
EXPOSE 9000

# 启动应用
CMD ["pm2-runtime", "start", "ecosystem.config.js"]

