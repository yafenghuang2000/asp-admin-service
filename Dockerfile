# # Use the official Node.js image as the base image
# FROM node:20

# # Set the working directory inside the container
# WORKDIR /usr/src/app

# # 复制package.json和pnpm-lock.yaml
# COPY package.json pnpm-lock.yaml ./

# # 安装pnpm
# RUN npm install -g pnpm

# # 安装依赖
# RUN pnpm install

# # Copy the rest of the application files
# COPY . .

# # Build the NestJS application
# RUN npm run build

# # Expose the application port
# EXPOSE 3000

# # Command to run the application
# CMD ["node", "dist/main"]

# pm2 start dist/main.js --name my-nest-app-test --env test