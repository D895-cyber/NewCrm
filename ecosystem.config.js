module.exports = {
  apps: [
    {
      name: 'crm-backend',
      script: 'server/index.js',
      cwd: '/var/www/crm-system',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: '/var/log/crm-backend-error.log',
      out_file: '/var/log/crm-backend-out.log',
      log_file: '/var/log/crm-backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};




