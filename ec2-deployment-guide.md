# AWS EC2 Deployment Guide - Projector Warranty CRM

## 🎯 Architecture Overview
- **Backend**: Node.js + Express on EC2 with PM2
- **Frontend**: React build served via NGINX
- **Database**: MongoDB Atlas (already configured)
- **SSL**: Let's Encrypt via Certbot
- **Reverse Proxy**: NGINX

## 📋 Prerequisites
- AWS Account (Free Tier eligible)
- Domain name (for SSL certificate)
- GitHub repository access

## 🚀 Step-by-Step Deployment

### 1. Create and Launch EC2 Instance

#### Launch EC2 Instance
```bash
# Recommended instance type for your app
Instance Type: t2.medium (2 vCPU, 4GB RAM)
OS: Ubuntu Server 22.04 LTS
Storage: 20GB GP3
Security Group: 
  - SSH (22) - Your IP
  - HTTP (80) - 0.0.0.0/0
  - HTTPS (443) - 0.0.0.0/0
  - Custom (4000) - 0.0.0.0/0 (for backend API)
```

#### Connect to EC2
```bash
# Replace with your key file and EC2 IP
ssh -i "your-key.pem" ubuntu@your-ec2-ip
```

### 2. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Verify installation
node --version
npm --version

# Install PM2 globally
sudo npm install pm2 -g

# Install NGINX
sudo apt install nginx -y

# Install Git
sudo apt install git -y
```

### 3. Clone and Setup Project

```bash
# Clone your repository
git clone https://github.com/D895-cyber/NewCrm.git
cd NewCrm

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build

# Go back to project root
cd ..
```

### 4. Configure Backend for Production

#### Create PM2 Ecosystem File
```bash
# Create ecosystem.config.js in project root
cat > ecosystem.config.js << 'EOF'
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
      JWT_SECRET: 'your-production-jwt-secret-change-this',
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
    }
  }]
}
EOF
```

#### Start Backend with PM2
```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above

# Check status
pm2 status
pm2 logs
```

### 5. Configure NGINX

#### Create NGINX Configuration
```bash
# Backup default config
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Create new configuration
sudo nano /etc/nginx/sites-available/projector-crm
```

#### NGINX Configuration Content
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React build)
    location / {
        root /home/ubuntu/NewCrm/frontend/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:4000/api/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Enable Site and Test Configuration
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/projector-crm /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test NGINX configuration
sudo nginx -t

# Restart NGINX
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 6. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo add-apt-repository ppa:certbot/certbot -y
sudo apt update
sudo apt install python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### 7. Configure Firewall

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Check status
sudo ufw status
```

### 8. Setup Monitoring and Logs

```bash
# View PM2 logs
pm2 logs

# View NGINX logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Monitor system resources
htop
```

## 🔧 Additional Configuration

### Environment Variables
Update the environment variables in `ecosystem.config.js` with your actual values:

```javascript
env: {
  NODE_ENV: 'production',
  PORT: 4000,
  MONGODB_URI: 'your-mongodb-connection-string',
  JWT_SECRET: 'your-secure-jwt-secret',
  FRONTEND_URL: 'https://yourdomain.com',
  // ... other variables
}
```

### Frontend Environment
Create `frontend/.env.production`:
```env
VITE_API_URL=https://yourdomain.com/api
VITE_APP_NAME=Projector Warranty CRM
VITE_APP_VERSION=1.0.0
```

### Database Security
1. Update MongoDB Atlas IP whitelist to include your EC2 IP
2. Use environment variables for sensitive data
3. Consider using AWS Secrets Manager for production

## 🚀 Deployment Commands

### Quick Deploy Script
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying Projector CRM to EC2..."

# Pull latest changes
git pull origin main

# Install/update dependencies
cd backend && npm install && cd ..
cd frontend && npm install && npm run build && cd ..

# Restart PM2
pm2 restart projector-crm-backend

# Reload NGINX
sudo nginx -s reload

echo "✅ Deployment complete!"
```

## 🔍 Troubleshooting

### Common Issues
1. **Port 4000 not accessible**: Check security group rules
2. **NGINX 502 error**: Check if PM2 is running (`pm2 status`)
3. **SSL certificate issues**: Ensure domain points to EC2 IP
4. **Frontend not loading**: Check if build files exist in `frontend/dist`

### Useful Commands
```bash
# Check PM2 status
pm2 status
pm2 logs projector-crm-backend

# Check NGINX status
sudo systemctl status nginx
sudo nginx -t

# Check SSL certificate
sudo certbot certificates

# Monitor resources
pm2 monit
htop
```

## 📊 Cost Estimation

### EC2 t2.medium (24/7)
- **Free Tier**: 750 hours/month for first 12 months
- **After Free Tier**: ~$30-35/month

### Additional Costs
- **Domain**: ~$10-15/year
- **MongoDB Atlas**: Free tier available
- **Total**: ~$0-35/month (depending on free tier usage)

## 🎯 Next Steps

1. **Set up monitoring**: CloudWatch, PM2 monitoring
2. **Configure backups**: Database backups, code backups
3. **Set up CI/CD**: GitHub Actions for automatic deployment
4. **Security hardening**: WAF, rate limiting, security headers
5. **Performance optimization**: CDN, caching, compression

---

**Ready to deploy? Let's start with creating your EC2 instance!** 🚀
