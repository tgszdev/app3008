module.exports = {
  apps: [
    {
      name: 'support-system',
      script: 'npm',
      args: 'run start',
      cwd: '/home/user/webapp',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: false,
      autorestart: true,
      max_memory_restart: '512M'
    }
  ]
}