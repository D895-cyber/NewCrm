# 🚀 AWS Deployment Guide for CRM System

## Overview
This guide will help you deploy your CRM system on AWS EC2 with proper production setup.

## Prerequisites
- AWS Account
- Domain name (optional but recommended)
- MongoDB Atlas account (for database)
- Cloudinary account (for file storage)

## Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance
1. Go to AWS Console → EC2 → Launch Instance
2. Choose **Amazon Linux 2** or **Ubuntu Server 20.04 LTS**
3. Select **t3.medium** or **t3.large** (minimum 2GB RAM)
4. Configure Security Group:
   - **SSH (22)** - Your IP
   - **HTTP (80)** - 0.0.0.0/0
   - **HTTPS (443)** - 0.0.0.0/0
   - **Custom TCP (4000)** - 0.0.0.0/0 (for Node.js)

### 1.2 Connect to Instance
```bash
ssh -i your-key.pem ec2-user@your-instance-ip
```

## Step 2: Server Setup

### 2.1 Run Initial Setup
```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/your-repo/deploy-script.sh | bash
```

### 2.2 Manual Setup (if script doesn't work)
```bash
# Update system
sudo yum update -y  # For Amazon Linux
# OR
sudo apt update && sudo apt upgrade -y  # For Ubuntu

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install nginx
sudo yum install -y nginx  # Amazon Linux
# OR
sudo apt install -y nginx  # Ubuntu
```

## Step 3: Upload Your Code

### 3.1 Using SCP
```bash
# From your local machine
scp -i your-key.pem -r . ec2-user@your-instance-ip:/var/www/crm-system/
```

### 3.2 Using Git (Recommended)
```bash
# On EC2 instance
cd /var/www/crm-system
git clone https://github.com/your-username/your-repo.git .
```

## Step 4: Environment Configuration

### 4.1 Create Production Environment File
```bash
cd /var/www/crm-system
nano .env
```

Add your production environment variables:
```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=https://your-domain.com
```

### 4.2 Install Dependencies
```bash
# Install backend dependencies
cd server
npm install --production

# Install frontend dependencies and build
cd ..
npm install
npm run build
```

## Step 5: Configure Nginx

### 5.1 Copy Nginx Configuration
```bash
sudo cp nginx.conf /etc/nginx/sites-available/crm-system
sudo ln -s /etc/nginx/sites-available/crm-system /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
```

### 5.2 Update Domain Name
Edit the nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/crm-system
```
Replace `your-domain.com` with your actual domain.

### 5.3 Test and Restart Nginx
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 6: SSL Certificate (Optional but Recommended)

### 6.1 Using Let's Encrypt
```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 7: Start Application

### 7.1 Start with PM2
```bash
cd /var/www/crm-system
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 7.2 Verify Application
```bash
# Check if application is running
pm2 status
pm2 logs crm-backend

# Test API
curl http://localhost:4000/api/health
```

## Step 8: Monitoring and Maintenance

### 8.1 PM2 Monitoring
```bash
# Monitor application
pm2 monit

# View logs
pm2 logs crm-backend

# Restart application
pm2 restart crm-backend
```

### 8.2 Nginx Logs
```bash
# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Step 9: Backup Strategy

### 9.1 Database Backup
```bash
# Create backup script
nano /var/www/crm-system/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/crm-system"

mkdir -p $BACKUP_DIR

# Backup MongoDB (if using local MongoDB)
# mongodump --uri="your-mongodb-uri" --out="$BACKUP_DIR/mongodb_$DATE"

# Backup application files
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" /var/www/crm-system

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### 9.2 Automated Backups
```bash
# Add to crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /var/www/crm-system/backup.sh
```

## Troubleshooting

### Common Issues

1. **Application not starting**
   ```bash
   pm2 logs crm-backend
   # Check for missing environment variables or dependencies
   ```

2. **Nginx not serving files**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   # Check file permissions and paths
   ```

3. **Database connection issues**
   ```bash
   # Test MongoDB connection
   node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(console.error)"
   ```

4. **Memory issues**
   ```bash
   # Monitor memory usage
   free -h
   pm2 monit
   ```

## Security Considerations

1. **Firewall Configuration**
   - Only open necessary ports
   - Use AWS Security Groups effectively

2. **Regular Updates**
   ```bash
   # Update system packages
   sudo yum update -y
   
   # Update Node.js dependencies
   npm audit fix
   ```

3. **SSL/TLS**
   - Always use HTTPS in production
   - Keep SSL certificates updated

## Cost Optimization

1. **Instance Types**
   - Start with t3.medium for testing
   - Scale up based on usage

2. **Reserved Instances**
   - Consider reserved instances for long-term deployment

3. **Monitoring**
   - Use AWS CloudWatch for monitoring
   - Set up billing alerts

## Next Steps

1. Set up domain DNS pointing to your EC2 instance
2. Configure email notifications
3. Set up monitoring and alerting
4. Implement CI/CD pipeline
5. Set up staging environment

## Support

If you encounter issues:
1. Check application logs: `pm2 logs crm-backend`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Check system resources: `htop` or `top`
4. Verify network connectivity: `curl -I http://localhost:4000/api/health`





