module.exports = {
  apps: [
    {
      name: 'mofa-developer-page',
      script: 'server.js',
      instances: 'max', // 使用所有CPU核心
      exec_mode: 'cluster', // 集群模式
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 80
      },
      // 日志配置
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 监控配置
      watch: false, // 生产环境不要开启watch
      ignore_watch: ['node_modules', 'logs'],
      
      // 自动重启配置
      max_memory_restart: '1G',
      restart_delay: 4000,
      
      // 健康检查
      min_uptime: '10s',
      max_restarts: 10,
      
      // 其他配置
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/mofa-org/mofa-developer-page.git',
      path: '/var/www/mofa-developer-page',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'sudo mkdir -p /var/www && sudo chown deploy:deploy /var/www'
    }
  }
};