FROM node:18 AS frontend-builder

# 设置前端构建工作目录
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
# 确保public目录中的文件被正确复制
RUN cp -r public/* build/ || true
RUN npm run build

FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    poppler-utils \
    libreoffice \
    && rm -rf /var/lib/apt/lists/*

# 复制项目文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 从前端构建阶段复制构建文件
COPY --from=frontend-builder /build /app/build

# 创建持久化目录
RUN mkdir -p /app/persist

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=backend.settings

# 收集静态文件
RUN python manage.py collectstatic --noinput

# 暴露端口
EXPOSE 8000

RUN python manage.py migrate

# 启动命令
ENTRYPOINT ["/bin/bash", "docker-entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
