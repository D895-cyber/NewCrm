# Email Configuration Guide

## 🔧 Fix Email Notifications Issue

Your server logs show: `⚠️ Email service disabled: SMTP credentials not configured`

This means your `.env` file is missing the email configuration. Here's how to fix it:

## 📝 Step 1: Update Your .env File

Add these lines to your `backend/server/.env` file:

```env
# Email Configuration (REQUIRED for email notifications)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
ADMIN_EMAIL=admin@projectorcare.com
MANAGER_EMAIL=manager@projectorcare.com
```

## 🔐 Step 2: Gmail Setup (if using Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this app password (not your regular password) in `SMTP_PASS`

## 📧 Step 3: Other Email Providers

### For Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

### For Yahoo:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

### For Custom SMTP:
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
```

## ✅ Step 4: Test Email Configuration

After updating your .env file:

1. **Restart your backend server**
2. **Check server logs** - you should see:
   ```
   ✅ Email service enabled
   ```
   instead of:
   ```
   ⚠️ Email service disabled: SMTP credentials not configured
   ```

3. **Test email sending** by assigning a service to an engineer

## 🔍 Step 5: Verify FSE Email Preferences

Make sure your FSEs have:
- Valid email addresses
- Email notifications enabled

You can check this in your database or through the admin panel.

## 📋 Complete .env File Example

Here's what your complete `.env` file should look like:

```env
# Backend Environment Variables
NODE_ENV=production
PORT=4000

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/projector_warranty

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Frontend URL
FRONTEND_URL=https://your-frontend-url.vercel.app

# Email Configuration (REQUIRED for email notifications)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
ADMIN_EMAIL=admin@projectorcare.com
MANAGER_EMAIL=manager@projectorcare.com

# Cloudinary Configuration (for photo uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional: Sentry for error tracking
SENTRY_DSN=your-sentry-dsn
```

## 🚨 Important Notes

1. **Never commit .env files** to version control
2. **Use App Passwords** for Gmail, not regular passwords
3. **Restart the server** after making changes
4. **Check server logs** for confirmation

## 🧪 Testing

After configuration, when you assign a service to an engineer, you should see in the server logs:
```
Assignment notification email sent to FSE: [Name] ([Email])
```

If you see errors, check:
- Email credentials are correct
- FSE has valid email address
- FSE has email notifications enabled

