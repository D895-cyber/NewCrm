module.exports = {
  apps: [{
    name: 'projector-crm-backend',
    script: './backend/server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      MONGODB_URI: 'mongodb+srv://dev:dev123@cluster0.es90y1z.mongodb.net/projector_warranty?retryWrites=true&w=majority&appName=Cluster0',
      JWT_SECRET: 'your-production-jwt-secret-change-this-in-production',
      FRONTEND_URL: 'https://yourdomain.com',
      CLOUDINARY_CLOUD_NAME: 'your-cloud-name',
      CLOUDINARY_API_KEY: 'your-api-key',
      CLOUDINARY_API_SECRET: 'your-api-secret',
      SMTP_USER: 'your-email@gmail.com',
      SMTP_PASS: 'your-app-password',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: '587',
      ADMIN_EMAIL: 'admin@projectorcare.com',
      MANAGER_EMAIL: 'manager@projectorcare.com'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
