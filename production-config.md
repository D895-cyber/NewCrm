# Production Configuration

## Frontend Environment Variables (.env.production)
Create this file in the `frontend` directory:

```env
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=Projector Warranty CRM
VITE_APP_VERSION=1.0.0
```

## Backend Environment Variables
Set these in your AWS App Runner service configuration:

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://dev:dev123@cluster0.es90y1z.mongodb.net/projector_warranty?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-production-jwt-secret-change-this-in-production
FRONTEND_URL=https://your-cloudfront-url.cloudfront.net
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
ADMIN_EMAIL=admin@projectorcare.com
MANAGER_EMAIL=manager@projectorcare.com
```

## AWS Services Configuration

### S3 Bucket
- Bucket Name: `your-projector-crm-frontend`
- Region: `us-east-1` (or your preferred region)
- Static Website Hosting: Enabled
- Index Document: `index.html`
- Error Document: `index.html`

### CloudFront Distribution
- Origin: S3 bucket
- Default Root Object: `index.html`
- Error Pages: 404 → `/index.html` (for React routing)
- SSL Certificate: CloudFront Default Certificate

### App Runner Service
- Runtime: Node.js 16
- Port: 4000
- Environment Variables: As listed above
- Auto Scaling: Enabled
- Health Check: `/api/health`
