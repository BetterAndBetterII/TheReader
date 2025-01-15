FROM node:18 AS frontend-builder

# 设置前端构建工作目录
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# 使用多阶段构建，创建基础镜像层
FROM python:3.11-slim AS base

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    poppler-utils \
    libreoffice \
    && rm -rf /var/lib/apt/lists/*

# 创建新的构建阶段，继承基础镜像
FROM base

# 设置工作目录
WORKDIR /app

# 首先只复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 创建持久化目录
RUN mkdir -p /app/persist

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=backend.settings

# 最后才复制项目文件，这样源代码变化不会影响前面的层
COPY . .

# 从前端构建阶段复制构建文件
COPY --from=frontend-builder /frontend/build /app/build

# 收集静态文件
RUN python manage.py collectstatic --noinput

# 暴露端口
EXPOSE 8000

# 启动命令
ENTRYPOINT ["/bin/bash", "docker-entrypoint.sh"]
