# 使用官方 Node.js 运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装 dumb-init 用于信号处理
RUN apk add --no-cache dumb-init

# 复制 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖（由于没有外部依赖，这一步主要是为了创建 node_modules 目录）
RUN npm install --only=production

# 复制应用源代码
COPY server.js ./
COPY worker.js ./
COPY ecosystem.config.js ./

# 创建日志目录
RUN mkdir -p /app/logs

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# 改变文件所有者
RUN chown -R nodeuser:nodejs /app

# 切换到非 root 用户
USER nodeuser

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => { process.exit(1) })" || exit 1

# 使用 dumb-init 启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]