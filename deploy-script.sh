#!/bin/bash

# AWS EC2 Deployment Script for CRM System
# This script helps deploy the application on an EC2 instance

echo "🚀 Starting AWS EC2 Deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y

# Install Node.js and npm
echo "📦 Installing Node.js..."
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install nginx for reverse proxy
echo "📦 Installing nginx..."
sudo yum install -y nginx

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/crm-system
sudo chown -R ec2-user:ec2-user /var/www/crm-system

echo "✅ System setup complete!"
echo "📋 Next steps:"
echo "1. Upload your code to /var/www/crm-system"
echo "2. Configure environment variables"
echo "3. Install dependencies"
echo "4. Configure nginx"
echo "5. Start the application with PM2"





