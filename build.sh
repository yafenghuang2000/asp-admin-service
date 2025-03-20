#!/bin/bash

# 定义变量
USERNAME="ubuntu"
SERVER_IP="175.178.50.233"
LOCAL_DIRECTORY="./dist/"
REMOTE_DIRECTORY="/asp-xms-service/test/"

# 使用 scp 命令上传文件
scp -r "${LOCAL_DIRECTORY}"* "${USERNAME}@${SERVER_IP}:${REMOTE_DIRECTORY}"

# 输出上传结果
if [ $? -eq 0 ]; then
    echo "文件上传成功！"
else
    echo "文件上传失败！"
fi