#!/bin/bash

# EC2 Deployment Script for Projector Warranty CRM
# Run this script on your EC2 instance

set -e

echo "🚀 Starting EC2 deployment for Projector Warranty CRM..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root. Use a regular user with sudo access."
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 if not already installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 18..."
    curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install nodejs -y
else
    echo "✅ Node.js already installed: $(node --version)"
fi

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install pm2 -g
else
    echo "✅ PM2 already installed: $(pm2 --version)"
fi

# Install NGINX if not already installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing NGINX..."
    sudo apt install nginx -y
    sudo systemctl enable nginx
else
    echo "✅ NGINX already installed"
fi

# Install Git if not already installed
if ! command -v git &> /dev/null; then
    echo "📦 Installing Git..."
    sudo apt install git -y
else
    echo "✅ Git already installed: $(git --version)"
fi

# Clone or update repository
if [ -d "NewCrm" ]; then
    echo "📦 Updating existing repository..."
    cd NewCrm
    git pull origin main
else
    echo "📦 Cloning repository..."
    git clone https://github.com/D895-cyber/NewCrm.git
    cd NewCrm
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --production
cd ..

# Install frontend dependencies and build
echo "📦 Installing frontend dependencies and building..."
cd frontend
npm install
npm run build
cd ..

# Create logs directory
mkdir -p logs

# Stop existing PM2 process if running
echo "🔄 Managing PM2 processes..."
pm2 stop projector-crm-backend 2>/dev/null || true
pm2 delete projector-crm-backend 2>/dev/null || true

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
echo "⚙️ Setting up PM2 startup..."
pm2 startup | grep -E '^sudo' | bash || true

# Configure NGINX
echo "⚙️ Configuring NGINX..."

# Create NGINX configuration
sudo tee /etc/nginx/sites-available/projector-crm > /dev/null << 'EOF'
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
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/projector-crm /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test NGINX configuration
echo "🔍 Testing NGINX configuration..."
sudo nginx -t

# Restart NGINX
echo "🔄 Restarting NGINX..."
sudo systemctl restart nginx

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Check status
echo "📊 Checking deployment status..."
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "NGINX Status:"
sudo systemctl status nginx --no-pager
echo ""
echo "Application Logs:"
pm2 logs projector-crm-backend --lines 10

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update your domain DNS to point to this EC2 instance IP"
echo "2. Update the server_name in /etc/nginx/sites-available/projector-crm"
echo "3. Run: sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo "4. Update environment variables in ecosystem.config.js"
echo ""
echo "🔗 Your application should be accessible at:"
echo "   - Frontend: http://$(curl -s ifconfig.me)"
echo "   - Backend API: http://$(curl -s ifconfig.me)/api"
echo "   - Health Check: http://$(curl -s ifconfig.me)/health"
echo ""
echo "📖 Check ec2-deployment-guide.md for detailed instructions"
