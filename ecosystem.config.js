module.exports = {
  apps: [
    {
      name: 'tracmatrix-app',
      cwd: './apps/web',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      node_args: '--max-old-space-size=1024 --optimize-for-size',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        SMTP_HOST: 'tracmatrix.com',
        SMTP_PORT: '465',
        SMTP_SECURE: 'true',
        SMTP_USER: 'info@tracmatrix.com',
        SMTP_PASSWORD: 'TracMatrix@2026!',
      },
    },
  ],
};
